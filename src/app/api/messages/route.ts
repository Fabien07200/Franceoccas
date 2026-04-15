import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { detectPersonalInfo } from '@/lib/ai';
import { sendOfferNotification } from '@/lib/email';
import { z } from 'zod';
import { PoolClient } from 'pg';

// ─── GET conversations ────────────────────────────────────────────────────────
export const GET_conversations = withAuth(async (req: NextRequest, user) => {
  const { rows } = await query(
    `SELECT
      c.id, c.last_message, c.last_msg_at, c.status,
      c.buyer_unread, c.seller_unread,
      l.id as listing_id, l.title as listing_title,
      l.photos[1] as listing_photo, l.price as listing_price,
      l.status as listing_status,
      CASE WHEN c.buyer_id = $1 THEN u_s.full_name ELSE u_b.full_name END as other_user_name,
      CASE WHEN c.buyer_id = $1 THEN u_s.avatar_url ELSE u_b.avatar_url END as other_user_avatar,
      CASE WHEN c.buyer_id = $1 THEN u_s.id ELSE u_b.id END as other_user_id,
      CASE WHEN c.buyer_id = $1 THEN 'buyer' ELSE 'seller' END as my_role,
      CASE WHEN c.buyer_id = $1 THEN c.buyer_unread ELSE c.seller_unread END as my_unread,
      -- Latest offer if any
      o.amount as latest_offer_amount, o.status as latest_offer_status
    FROM conversations c
    JOIN listings l ON l.id = c.listing_id
    JOIN users u_b ON u_b.id = c.buyer_id
    JOIN users u_s ON u_s.id = c.seller_id
    LEFT JOIN LATERAL (
      SELECT amount, status FROM offers
      WHERE conversation_id = c.id
      ORDER BY created_at DESC LIMIT 1
    ) o ON true
    WHERE c.buyer_id = $1 OR c.seller_id = $1
    ORDER BY c.last_msg_at DESC NULLS LAST`,
    [user.sub]
  );

  return NextResponse.json({ conversations: rows });
});

// ─── GET messages in conversation ────────────────────────────────────────────
export const GET_messages = withAuth(async (req: NextRequest, user) => {
  const convId = req.nextUrl.pathname.split('/')[4];
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const before = req.nextUrl.searchParams.get('before');

  // Verify access
  const { rows: convRows } = await query(
    `SELECT id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
    [convId, user.sub]
  );

  if (!convRows[0]) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }

  let sql = `
    SELECT m.id, m.content, m.type, m.offer_amount, m.offer_status, m.read_at, m.created_at,
           m.sender_id, u.full_name as sender_name, u.avatar_url as sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = $1
  `;
  const params: unknown[] = [convId];

  if (before) {
    sql += ` AND m.created_at < $2`;
    params.push(before);
  }

  sql += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const { rows } = await query(sql, params);

  // Mark messages as read
  await query(
    `UPDATE messages SET read_at = NOW()
     WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
    [convId, user.sub]
  );

  // Reset unread counter
  await query(
    `UPDATE conversations SET
       buyer_unread = CASE WHEN buyer_id = $2 THEN 0 ELSE buyer_unread END,
       seller_unread = CASE WHEN seller_id = $2 THEN 0 ELSE seller_unread END
     WHERE id = $1`,
    [convId, user.sub]
  );

  return NextResponse.json({ messages: rows.reverse() });
});

// ─── POST message ─────────────────────────────────────────────────────────────
const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  type: z.enum(['text', 'offer']).default('text'),
  offer_amount: z.number().int().min(100).optional(),
});

export const POST_message = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const { conversation_id, type, offer_amount } = parsed.data;
  let { content } = parsed.data;

  // Detect and sanitize personal info
  const { hasPersonalInfo, sanitized } = await detectPersonalInfo(content);
  if (hasPersonalInfo) {
    content = sanitized;
  }

  // Verify conversation membership
  const { rows: convRows } = await query(
    `SELECT c.*, l.price as listing_price, u_b.email as buyer_email, u_s.email as seller_email,
            u_b.full_name as buyer_name, u_s.full_name as seller_name
     FROM conversations c
     JOIN listings l ON l.id = c.listing_id
     JOIN users u_b ON u_b.id = c.buyer_id
     JOIN users u_s ON u_s.id = c.seller_id
     WHERE c.id = $1 AND (c.buyer_id = $2 OR c.seller_id = $2)`,
    [conversation_id, user.sub]
  );

  if (!convRows[0]) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }

  const conv = convRows[0];
  const isBuyer = conv.buyer_id === user.sub;
  const recipientEmail = isBuyer ? conv.seller_email : conv.buyer_email;
  const recipientName = isBuyer ? conv.seller_name : conv.buyer_name;
  const senderName = isBuyer ? conv.buyer_name : conv.seller_name;

  let offerId: string | null = null;
  let offerStatus: string | null = null;

  if (type === 'offer' && offer_amount) {
    // Only buyers can make offers
    if (!isBuyer) {
      return NextResponse.json({ error: 'Seul l\'acheteur peut faire une offre' }, { status: 403 });
    }

    // Create offer
    const { rows: offerRows } = await query(
      `INSERT INTO offers (conversation_id, listing_id, buyer_id, seller_id, amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, status`,
      [conversation_id, conv.listing_id, conv.buyer_id, conv.seller_id, offer_amount]
    );

    offerId = offerRows[0].id;
    offerStatus = 'pending';

    // Send email notification
    sendOfferNotification({
      to: recipientEmail,
      sellerName: conv.seller_name,
      buyerName: conv.buyer_name,
      listingTitle: conv.listing_title || 'Votre annonce',
      offerAmount: offer_amount,
      listingPrice: conv.listing_price,
      conversationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/messages/${conversation_id}`,
    }).catch(console.error);
  }

  // Insert message
  const { rows } = await query(
    `INSERT INTO messages (conversation_id, sender_id, content, type, offer_amount, offer_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, content, type, offer_amount, offer_status, created_at, sender_id`,
    [conversation_id, user.sub, content, type, offer_amount || null, offerStatus]
  );

  // Update conversation
  await query(
    `UPDATE conversations SET
       last_message = $1,
       last_msg_at = NOW(),
       buyer_unread = CASE WHEN buyer_id = $3 THEN buyer_unread ELSE buyer_unread + 1 END,
       seller_unread = CASE WHEN seller_id = $3 THEN seller_unread ELSE seller_unread + 1 END
     WHERE id = $2`,
    [content.slice(0, 100), conversation_id, user.sub]
  );

  const message = rows[0];
  if (hasPersonalInfo) {
    message._sanitized = true;
  }

  return NextResponse.json({ message }, { status: 201 });
});

// ─── POST offer response (accept/decline/counter) ────────────────────────────
const offerResponseSchema = z.object({
  offer_id: z.string().uuid(),
  action: z.enum(['accept', 'decline', 'counter']),
  counter_amount: z.number().int().min(100).optional(),
});

export const POST_offerResponse = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = offerResponseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const { offer_id, action, counter_amount } = parsed.data;

  const { rows: offerRows } = await query(
    `SELECT o.*, l.title as listing_title
     FROM offers o JOIN listings l ON l.id = o.listing_id
     WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2) AND o.status = 'pending'`,
    [offer_id, user.sub]
  );

  if (!offerRows[0]) {
    return NextResponse.json({ error: 'Offre introuvable ou déjà traitée' }, { status: 404 });
  }

  const offer = offerRows[0];

  if (action === 'accept') {
    // Only seller can accept
    if (offer.seller_id !== user.sub) {
      return NextResponse.json({ error: 'Seul le vendeur peut accepter l\'offre' }, { status: 403 });
    }

    await withTransaction(async (client: PoolClient) => {
      // Accept offer
      await client.query(
        'UPDATE offers SET status = $1, updated_at = NOW() WHERE id = $2',
        ['accepted', offer_id]
      );

      // Create transaction
      const commissionRate = 0.03; // 3%
      const commission = Math.round(offer.amount * commissionRate);

      await client.query(
        `INSERT INTO transactions (listing_id, buyer_id, seller_id, offer_id, amount, commission, total_buyer, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
        [offer.listing_id, offer.buyer_id, offer.seller_id, offer_id,
          offer.amount, commission, offer.amount + commission]
      );

      // Update message in conversation
      await client.query(
        `UPDATE messages SET offer_status = 'accepted'
         WHERE conversation_id = $1 AND offer_amount = $2 AND type = 'offer'
         ORDER BY created_at DESC LIMIT 1`,
        [offer.conversation_id, offer.amount]
      );
    });

    return NextResponse.json({
      success: true,
      action: 'accepted',
      message: 'Offre acceptée ! L\'acheteur peut maintenant procéder au paiement.',
    });
  }

  if (action === 'decline') {
    await query('UPDATE offers SET status = $1 WHERE id = $2', ['declined', offer_id]);
    return NextResponse.json({ success: true, action: 'declined' });
  }

  if (action === 'counter' && counter_amount) {
    // Create counter-offer
    const { rows } = await query(
      `INSERT INTO offers (conversation_id, listing_id, buyer_id, seller_id, amount, parent_offer_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [offer.conversation_id, offer.listing_id, offer.buyer_id, offer.seller_id,
        counter_amount, offer_id]
    );

    // Mark original as countered
    await query('UPDATE offers SET status = $1 WHERE id = $2', ['countered', offer_id]);

    // Add message
    await query(
      `INSERT INTO messages (conversation_id, sender_id, content, type, offer_amount, offer_status)
       VALUES ($1, $2, $3, 'offer', $4, 'pending')`,
      [offer.conversation_id, user.sub,
        `Contre-offre de ${(counter_amount / 100).toFixed(2)} €`,
        counter_amount]
    );

    return NextResponse.json({
      success: true,
      action: 'countered',
      new_offer_id: rows[0].id,
    });
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
});

// ─── POST /api/messages/start - Start conversation ───────────────────────────
export const POST_startConversation = withAuth(async (req: NextRequest, user) => {
  const { listing_id, message } = await req.json();

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id requis' }, { status: 400 });
  }

  // Get listing & seller info
  const { rows: listingRows } = await query(
    'SELECT id, seller_id, title FROM listings WHERE id = $1 AND status = $2',
    [listing_id, 'active']
  );

  if (!listingRows[0]) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  }

  const listing = listingRows[0];

  if (listing.seller_id === user.sub) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous contacter vous-même' }, { status: 400 });
  }

  // Check existing conversation
  const { rows: existingRows } = await query(
    `SELECT id FROM conversations
     WHERE listing_id = $1 AND buyer_id = $2 AND seller_id = $3`,
    [listing_id, user.sub, listing.seller_id]
  );

  let convId: string;

  if (existingRows[0]) {
    convId = existingRows[0].id;
  } else {
    const { rows } = await query(
      `INSERT INTO conversations (listing_id, buyer_id, seller_id, last_message, last_msg_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [listing_id, user.sub, listing.seller_id, message?.slice(0, 100) || '']
    );
    convId = rows[0].id;
  }

  // Add initial message if provided
  if (message) {
    const { sanitized } = await detectPersonalInfo(message);
    await query(
      `INSERT INTO messages (conversation_id, sender_id, content, type)
       VALUES ($1, $2, $3, 'text')`,
      [convId, user.sub, sanitized]
    );
  }

  return NextResponse.json({ conversation_id: convId }, { status: 201 });
});
