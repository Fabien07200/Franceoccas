import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import {
  createPayIn,
  releaseEscrow,
  createPayout,
  processWalletRecharge,
  verifyMangopayWebhook,
} from '@/lib/payment';
import { sendSaleConfirmedEmail } from '@/lib/email';
import { z } from 'zod';
import { PoolClient } from 'pg';

// ─── GET /api/payments/wallet - Get wallet info ───────────────────────────────
export const GET_wallet = withAuth(async (_req: NextRequest, user) => {
  const { rows } = await query(
    `SELECT wallet_balance, wallet_pending FROM users WHERE id = $1`,
    [user.sub]
  );

  const { rows: txRows } = await query(
    `SELECT id, type, amount, balance, description, reference, created_at
     FROM wallet_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [user.sub]
  );

  return NextResponse.json({
    balance: rows[0]?.wallet_balance || 0,
    pending: rows[0]?.wallet_pending || 0,
    transactions: txRows,
  });
});

// ─── POST /api/payments/pay - Pay for a listing ───────────────────────────────
const paySchema = z.object({
  listing_id: z.string().uuid(),
  card_id: z.string(),
  delivery_method: z.enum(['colissimo', 'mondial_relay', 'palette_fo', 'hand_to_hand']),
  offer_id: z.string().uuid().optional(),
});

export const POST_pay = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = paySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { listing_id, card_id, delivery_method, offer_id } = parsed.data;

  // Get listing details
  const { rows: listingRows } = await query(
    `SELECT l.*, u.mangopay_id as seller_mangopay, u.wallet_id as seller_wallet
     FROM listings l
     JOIN users u ON u.id = l.seller_id
     WHERE l.id = $1 AND l.status = 'active'`,
    [listing_id]
  );

  if (!listingRows[0]) {
    return NextResponse.json({ error: 'Annonce introuvable ou déjà vendue' }, { status: 404 });
  }

  const listing = listingRows[0];

  if (listing.seller_id === user.sub) {
    return NextResponse.json({ error: 'Vous ne pouvez pas acheter votre propre annonce' }, { status: 400 });
  }

  // Get buyer's MangoPay info
  const { rows: buyerRows } = await query(
    'SELECT mangopay_id, wallet_id FROM users WHERE id = $1',
    [user.sub]
  );

  if (!buyerRows[0]?.mangopay_id) {
    return NextResponse.json({ error: 'Compte de paiement non configuré' }, { status: 400 });
  }

  // Determine amount (offer or listing price)
  let amount = listing.price;
  if (offer_id) {
    const { rows: offerRows } = await query(
      `SELECT amount FROM offers WHERE id = $1 AND status = 'accepted' AND buyer_id = $2`,
      [offer_id, user.sub]
    );
    if (offerRows[0]) amount = offerRows[0].amount;
  }

  const deliveryPrices: Record<string, number> = {
    colissimo: 890, mondial_relay: 490, palette_fo: 3900, hand_to_hand: 0
  };
  const deliveryPrice = deliveryPrices[delivery_method] || 0;
  const commissionRate = 0.03;
  const commission = Math.round(amount * commissionRate);
  const totalBuyer = amount + deliveryPrice + commission;

  // Create transaction record
  const { rows: txRows } = await query(
    `INSERT INTO transactions (listing_id, buyer_id, seller_id, offer_id, amount, commission,
       delivery_price, total_buyer, status, delivery_method)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
     RETURNING id`,
    [listing_id, user.sub, listing.seller_id, offer_id || null,
      amount, commission, deliveryPrice, totalBuyer, delivery_method]
  );

  const transactionId = txRows[0].id;

  // Generate delivery code for hand-to-hand
  if (delivery_method === 'hand_to_hand') {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await query('UPDATE transactions SET delivery_code = $1 WHERE id = $2', [code, transactionId]);
  }

  // Process payment with MangoPay
  const payIn = await createPayIn({
    transactionId,
    buyerMangoId: buyerRows[0].mangopay_id,
    cardId: card_id,
    amountCents: amount,
    deliveryCents: deliveryPrice,
    commissionCents: commission,
    listingTitle: listing.title,
  });

  if (payIn.status === 'SUCCEEDED') {
    // Update seller pending balance
    await query(
      'UPDATE users SET wallet_pending = wallet_pending + $1 WHERE id = $2',
      [amount, listing.seller_id]
    );

    // Send confirmation emails
    const { rows: sellerRows } = await query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [listing.seller_id]
    );
    const { rows: buyerInfoRows } = await query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [user.sub]
    );

    sendSaleConfirmedEmail({
      to: sellerRows[0].email,
      name: sellerRows[0].full_name,
      listingTitle: listing.title,
      amount: totalBuyer,
      isVendor: true,
      deliveryMethod: delivery_method,
      transactionId,
    }).catch(console.error);

    sendSaleConfirmedEmail({
      to: buyerInfoRows[0].email,
      name: buyerInfoRows[0].full_name,
      listingTitle: listing.title,
      amount: totalBuyer,
      isVendor: false,
      deliveryMethod: delivery_method,
      transactionId,
    }).catch(console.error);
  }

  return NextResponse.json({
    transaction_id: transactionId,
    status: payIn.status,
    redirect_url: payIn.secureModeRedirectUrl,
    amount: { product: amount, delivery: deliveryPrice, commission, total: totalBuyer },
  });
});

// ─── POST /api/payments/recharge - Recharge wallet ───────────────────────────
export const POST_recharge = withAuth(async (req: NextRequest, user) => {
  const { amount_cents, card_id } = await req.json();

  if (!amount_cents || amount_cents < 500) {
    return NextResponse.json({ error: 'Montant minimum 5 €' }, { status: 400 });
  }

  const { rows } = await query(
    'SELECT mangopay_id, wallet_id FROM users WHERE id = $1',
    [user.sub]
  );

  if (!rows[0]?.mangopay_id) {
    return NextResponse.json({ error: 'Compte de paiement non configuré' }, { status: 400 });
  }

  const result = await processWalletRecharge({
    userId: user.sub,
    mangopayUserId: rows[0].mangopay_id,
    walletId: rows[0].wallet_id,
    cardId: card_id,
    amountCents: amount_cents,
  });

  return NextResponse.json({ result });
});

// ─── POST /api/payments/payout - Withdraw to bank ────────────────────────────
export const POST_payout = withAuth(async (req: NextRequest, user) => {
  const { amount_cents, bank_account_id } = await req.json();

  if (!amount_cents || amount_cents < 1000) {
    return NextResponse.json({ error: 'Montant minimum 10 €' }, { status: 400 });
  }

  const { rows } = await query(
    'SELECT wallet_balance, mangopay_id, wallet_id FROM users WHERE id = $1',
    [user.sub]
  );

  if (!rows[0]) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  if (rows[0].wallet_balance < amount_cents) {
    return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 });
  }

  const payoutId = await createPayout({
    userId: user.sub,
    mangopayUserId: rows[0].mangopay_id,
    walletId: rows[0].wallet_id,
    amountCents: amount_cents,
    bankAccountId: bank_account_id,
  });

  return NextResponse.json({
    payout_id: payoutId,
    message: 'Virement SEPA initié — crédit sous 24 heures',
  });
});

// ─── POST /api/payments/delivery-confirm - Confirm delivery ──────────────────
export const POST_confirmDelivery = withAuth(async (req: NextRequest, user) => {
  const { transaction_id, delivery_code } = await req.json();

  const { rows } = await query(
    `SELECT * FROM transactions WHERE id = $1 AND buyer_id = $2 AND status = 'escrow'`,
    [transaction_id, user.sub]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
  }

  const tx = rows[0];

  // For hand-to-hand, verify code
  if (tx.delivery_method === 'hand_to_hand' && delivery_code !== tx.delivery_code) {
    return NextResponse.json({ error: 'Code de sécurité incorrect' }, { status: 400 });
  }

  // Release escrow
  await releaseEscrow(transaction_id);

  return NextResponse.json({
    success: true,
    message: 'Livraison confirmée ! Le paiement a été libéré au vendeur.',
  });
});

// ─── POST /api/payments/kit - Order packaging kit ────────────────────────────
export const POST_kit = withAuth(async (req: NextRequest, user) => {
  const { listing_id, address, city, postal_code } = await req.json();

  const KIT_PRICE = 2400; // 24.00€

  await withTransaction(async (client: PoolClient) => {
    const { rows } = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
      [user.sub]
    );

    if (!rows[0] || rows[0].wallet_balance < KIT_PRICE) {
      throw new Error('Solde insuffisant');
    }

    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [KIT_PRICE, user.sub]
    );

    await client.query(
      `INSERT INTO delivery_kits (user_id, listing_id, address, city, postal_code, amount)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.sub, listing_id || null, address, city, postal_code, KIT_PRICE]
    );

    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance, description)
       SELECT $1, 'kit', -$2, wallet_balance, 'Kit d''emballage palette — livraison J+1'
       FROM users WHERE id = $1`,
      [user.sub, KIT_PRICE]
    );
  });

  return NextResponse.json({
    success: true,
    message: 'Kit d\'emballage commandé ! Livraison demain avant 18h.',
  });
});

// ─── POST /webhooks/mangopay ──────────────────────────────────────────────────
export async function POST_webhook(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get('x-mangopay-signature') || '';

  if (!verifyMangopayWebhook(rawBody, signature)) {
    console.error('Invalid MangoPay webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  switch (event.EventType) {
    case 'PAYIN_NORMAL_SUCCEEDED': {
      await query(
        `UPDATE transactions SET status = 'escrow', escrow_at = NOW()
         WHERE mangopay_payin_id = $1`,
        [event.RessourceId]
      );
      break;
    }

    case 'PAYIN_NORMAL_FAILED': {
      await query(
        `UPDATE transactions SET status = 'cancelled'
         WHERE mangopay_payin_id = $1`,
        [event.RessourceId]
      );
      break;
    }

    case 'TRANSFER_NORMAL_SUCCEEDED': {
      await query(
        `UPDATE transactions SET status = 'released', released_at = NOW()
         WHERE mangopay_transfer_id = $1`,
        [event.RessourceId]
      );
      break;
    }

    case 'PAYOUT_NORMAL_SUCCEEDED': {
      console.log('Payout succeeded:', event.RessourceId);
      break;
    }

    case 'KYC_SUCCEEDED': {
      await query(
        `UPDATE users SET kyc_status = 'verified'
         WHERE mangopay_id = $1`,
        [event.UserId]
      );
      break;
    }

    default:
      console.log('Unhandled MangoPay event:', event.EventType);
  }

  // Always return 200 to prevent MangoPay retries
  return NextResponse.json({ received: true });
}

// ─── Router ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  return GET_wallet(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  if (path.includes('/webhook')) return POST_webhook(req);
  if (path.includes('/pay') && !path.includes('/payout')) return POST_pay(req);
  if (path.includes('/payout')) return POST_payout(req);
  if (path.includes('/recharge')) return POST_recharge(req);
  if (path.includes('/delivery-confirm')) return POST_confirmDelivery(req);
  if (path.includes('/kit')) return POST_kit(req);
  return NextResponse.json({ error: 'Route inconnue' }, { status: 404 });
}
