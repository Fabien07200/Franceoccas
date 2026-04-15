import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { PoolClient } from 'pg';

// ─── MangoPay SDK Init ────────────────────────────────────────────────────────
// In production, use: const mangopay = require('mangopay2-nodejs-sdk');
// For this implementation we use direct REST API calls for clarity

const MANGOPAY_BASE = process.env.MANGOPAY_BASE_URL!;
const CLIENT_ID = process.env.MANGOPAY_CLIENT_ID!;
const API_KEY = process.env.MANGOPAY_API_KEY!;
const ESCROW_WALLET = process.env.MANGOPAY_ESCROW_WALLET_ID!;

const mpHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${API_KEY}`).toString('base64')}`,
};

async function mpRequest<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(`${MANGOPAY_BASE}/${CLIENT_ID}${path}`, {
    method,
    headers: mpHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ Message: 'Unknown error' }));
    throw new Error(`MangoPay error ${res.status}: ${JSON.stringify(error)}`);
  }

  return res.json() as Promise<T>;
}

// ─── User & Wallet Management ─────────────────────────────────────────────────
export async function createMangopayUser(params: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  birthday: number;  // Unix timestamp
  nationality: string;
  countryOfResidence: string;
}): Promise<{ mangoId: string; walletId: string }> {
  // Create natural user
  const user = await mpRequest<{ Id: string }>('POST', '/users/natural', {
    FirstName: params.firstName,
    LastName: params.lastName,
    Email: params.email,
    Birthday: params.birthday,
    Nationality: params.nationality,
    CountryOfResidence: params.countryOfResidence,
    Tag: `fo_user:${params.userId}`,
  });

  // Create EUR wallet
  const wallet = await mpRequest<{ Id: string }>('POST', '/wallets', {
    Owners: [user.Id],
    Description: `FranceOccas wallet - ${params.email}`,
    Currency: 'EUR',
    Tag: `fo_wallet:${params.userId}`,
  });

  // Persist to DB
  await query(
    `UPDATE users SET mangopay_id = $1, wallet_id = $2 WHERE id = $3`,
    [user.Id, wallet.Id, params.userId]
  );

  return { mangoId: user.Id, walletId: wallet.Id };
}

// ─── Card Registration (tokenization) ────────────────────────────────────────
export async function createCardRegistration(params: {
  mangopayUserId: string;
  currency?: string;
}): Promise<{
  id: string;
  accessKey: string;
  preregistrationData: string;
  cardRegistrationUrl: string;
}> {
  const reg = await mpRequest<{
    Id: string;
    AccessKey: string;
    PreregistrationData: string;
    CardRegistrationURL: string;
  }>('POST', '/cardregistrations', {
    UserId: params.mangopayUserId,
    Currency: params.currency || 'EUR',
    CardType: 'CB_VISA_MASTERCARD',
  });

  return {
    id: reg.Id,
    accessKey: reg.AccessKey,
    preregistrationData: reg.PreregistrationData,
    cardRegistrationUrl: reg.CardRegistrationURL,
  };
}

export async function completeCardRegistration(
  registrationId: string,
  registrationData: string
): Promise<string> {
  const result = await mpRequest<{ CardId: string }>('PUT', `/cardregistrations/${registrationId}`, {
    RegistrationData: registrationData,
  });
  return result.CardId;
}

// ─── PayIn (Acheteur → Séquestre) ────────────────────────────────────────────
export interface PayInParams {
  transactionId: string;
  buyerMangoId: string;
  cardId: string;
  amountCents: number;     // montant produit
  deliveryCents: number;   // frais livraison
  commissionCents: number; // commission FO
  listingTitle: string;
}

export interface PayInResult {
  mangoPayInId: string;
  status: 'SUCCEEDED' | 'FAILED' | 'CREATED';
  secureModeRedirectUrl?: string;
  resultCode?: string;
}

export async function createPayIn(params: PayInParams): Promise<PayInResult> {
  const totalAmount = params.amountCents + params.deliveryCents;
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/paiement/3ds/${params.transactionId}`;

  const payin = await mpRequest<{
    Id: string;
    Status: string;
    SecureModeRedirectURL?: string;
    ResultCode?: string;
  }>('POST', '/payins/card/direct', {
    AuthorId: params.buyerMangoId,
    CreditedWalletId: ESCROW_WALLET,
    DebitedFunds: { Currency: 'EUR', Amount: totalAmount },
    Fees: { Currency: 'EUR', Amount: params.commissionCents },
    CardId: params.cardId,
    SecureMode: 'DEFAULT',
    SecureModeReturnURL: returnUrl,
    StatementDescriptor: 'FRANCEOCCAS',
    Tag: `transaction:${params.transactionId}`,
  });

  // Update transaction in DB
  await query(
    `UPDATE transactions SET
      mangopay_payin_id = $1,
      status = CASE WHEN $2 = 'SUCCEEDED' THEN 'escrow' ELSE 'pending' END,
      escrow_at = CASE WHEN $2 = 'SUCCEEDED' THEN NOW() ELSE NULL END,
      threeds_redirect_url = $3
     WHERE id = $4`,
    [payin.Id, payin.Status, payin.SecureModeRedirectURL, params.transactionId]
  );

  return {
    mangoPayInId: payin.Id,
    status: payin.Status as PayInResult['status'],
    secureModeRedirectUrl: payin.SecureModeRedirectURL,
    resultCode: payin.ResultCode,
  };
}

// ─── Transfer (Séquestre → Vendeur) ──────────────────────────────────────────
export async function releaseEscrow(transactionId: string): Promise<void> {
  await withTransaction(async (client: PoolClient) => {
    const { rows } = await client.query(
      `SELECT t.*, u.mangopay_id, u.wallet_id as seller_wallet
       FROM transactions t
       JOIN users u ON u.id = t.seller_id
       WHERE t.id = $1 AND t.status = 'escrow'`,
      [transactionId]
    );

    if (!rows[0]) throw new Error('Transaction non trouvée ou déjà libérée');
    const tx = rows[0];

    const transfer = await mpRequest<{ Id: string }>('POST', '/transfers', {
      AuthorId: CLIENT_ID,
      CreditedUserId: tx.mangopay_id,
      DebitedWalletId: ESCROW_WALLET,
      CreditedWalletId: tx.seller_wallet,
      DebitedFunds: { Currency: 'EUR', Amount: tx.amount },
      Fees: { Currency: 'EUR', Amount: 0 },
      Tag: `release:${transactionId}`,
    });

    // Update DB
    await client.query(
      `UPDATE transactions SET
        mangopay_transfer_id = $1,
        status = 'released',
        released_at = NOW()
       WHERE id = $2`,
      [transfer.Id, transactionId]
    );

    // Credit seller wallet balance
    await client.query(
      `UPDATE users SET
        wallet_balance = wallet_balance + $1,
        wallet_pending = GREATEST(0, wallet_pending - $1),
        sales_count = sales_count + 1
       WHERE id = $2`,
      [tx.amount, tx.seller_id]
    );

    // Add wallet transaction record
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance, description, reference)
       SELECT $1, 'credit', $2, wallet_balance, $3, $4
       FROM users WHERE id = $1`,
      [tx.seller_id, tx.amount, `Vente confirmée - Annonce #${tx.listing_id}`, transactionId]
    );

    // Mark listing as sold
    await client.query(
      `UPDATE listings SET status = 'sold', sold_at = NOW() WHERE id = $1`,
      [tx.listing_id]
    );
  });
}

// ─── Payout (Wallet → IBAN) ───────────────────────────────────────────────────
export async function createPayout(params: {
  userId: string;
  mangopayUserId: string;
  walletId: string;
  amountCents: number;
  bankAccountId: string;
}): Promise<string> {
  const payout = await mpRequest<{ Id: string }>('POST', '/payouts/bankwire', {
    AuthorId: params.mangopayUserId,
    DebitedWalletId: params.walletId,
    DebitedFunds: { Currency: 'EUR', Amount: params.amountCents },
    Fees: { Currency: 'EUR', Amount: 0 },
    BankAccountId: params.bankAccountId,
    Tag: `payout:${params.userId}`,
  });

  // Deduct from wallet balance
  await query(
    `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`,
    [params.amountCents, params.userId]
  );

  await query(
    `INSERT INTO wallet_transactions (user_id, type, amount, balance, description, reference)
     SELECT $1, 'debit', -$2, wallet_balance, 'Virement SEPA vers compte bancaire', $3
     FROM users WHERE id = $1`,
    [params.userId, params.amountCents, payout.Id]
  );

  return payout.Id;
}

// ─── Refund ───────────────────────────────────────────────────────────────────
export async function refundTransaction(
  transactionId: string,
  reason: string
): Promise<void> {
  const { rows } = await query(
    `SELECT * FROM transactions WHERE id = $1`,
    [transactionId]
  );
  if (!rows[0]) throw new Error('Transaction not found');
  const tx = rows[0];

  // Refund the payin
  await mpRequest('POST', `/payins/${tx.mangopay_payin_id}/refunds`, {
    AuthorId: tx.buyer_mangopay_id,
    Tag: `refund:${transactionId}:${reason}`,
  });

  await query(
    `UPDATE transactions SET status = 'refunded', updated_at = NOW() WHERE id = $1`,
    [transactionId]
  );
}

// ─── Webhook Signature Verification ──────────────────────────────────────────
export function verifyMangopayWebhook(
  body: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.MANGOPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

// ─── Wallet Recharge ──────────────────────────────────────────────────────────
export async function processWalletRecharge(params: {
  userId: string;
  mangopayUserId: string;
  walletId: string;
  cardId: string;
  amountCents: number;
}): Promise<PayInResult> {
  const bonus = params.amountCents >= 5000 ? 300 :
                params.amountCents >= 2500 ? 100 : 0;
  const totalCredit = params.amountCents + bonus;

  const payin = await mpRequest<{
    Id: string;
    Status: string;
    SecureModeRedirectURL?: string;
  }>('POST', '/payins/card/direct', {
    AuthorId: params.mangopayUserId,
    CreditedWalletId: params.walletId,
    DebitedFunds: { Currency: 'EUR', Amount: params.amountCents },
    Fees: { Currency: 'EUR', Amount: 0 },
    CardId: params.cardId,
    StatementDescriptor: 'FO RECHARGE',
  });

  if (payin.Status === 'SUCCEEDED') {
    await query(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
      [totalCredit, params.userId]
    );
    await query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance, description, reference)
       SELECT $1, 'recharge', $2, wallet_balance,
         CASE WHEN $3 > 0 THEN 'Recharge + bonus ' || ($3/100) || '€' ELSE 'Recharge porte-monnaie' END,
         $4
       FROM users WHERE id = $1`,
      [params.userId, totalCredit, bonus, payin.Id]
    );
  }

  return {
    mangoPayInId: payin.Id,
    status: payin.Status as PayInResult['status'],
    secureModeRedirectUrl: payin.SecureModeRedirectURL,
  };
}
