import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { z } from 'zod';

const reviewSchema = z.object({
  transaction_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  rating_desc: z.number().int().min(1).max(5).optional(),
  rating_response: z.number().int().min(1).max(5).optional(),
  rating_packaging: z.number().int().min(1).max(5).optional(),
  rating_value: z.number().int().min(1).max(5).optional(),
  content: z.string().min(20).max(1000),
  tags_positive: z.array(z.string()).default([]),
  tags_negative: z.array(z.string()).default([]),
});

// ─── GET reviews for a user ───────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.nextUrl.searchParams.get('user_id');
  const type = req.nextUrl.searchParams.get('type') || 'all';
  const minRating = parseInt(req.nextUrl.searchParams.get('min_rating') || '1');
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const limit = 10;
  const offset = (page - 1) * limit;

  if (!userId) {
    return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
  }

  let whereClause = `WHERE r.reviewed_id = $1 AND r.published = true`;
  const params: unknown[] = [userId];
  let paramIdx = 2;

  if (type === 'seller') {
    whereClause += ` AND r.type = 'buyer_to_seller'`;
  } else if (type === 'buyer') {
    whereClause += ` AND r.type = 'seller_to_buyer'`;
  }

  if (minRating > 1) {
    whereClause += ` AND r.rating >= $${paramIdx}`;
    params.push(minRating);
    paramIdx++;
  }

  const { rows } = await query(
    `SELECT
      r.id, r.rating, r.rating_desc, r.rating_response, r.rating_packaging, r.rating_value,
      r.content, r.tags_positive, r.tags_negative, r.helpful_count,
      r.reply, r.reply_at, r.type, r.created_at,
      u.id as reviewer_id, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar,
      u.city as reviewer_city, u.department as reviewer_department,
      l.id as listing_id, l.title as listing_title, l.price as listing_price,
      l.photos[1] as listing_photo, l.is_vehicle,
      COUNT(*) OVER() as total_count
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    LEFT JOIN listings l ON l.id = r.listing_id
    ${whereClause}
    ORDER BY r.helpful_count DESC, r.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset]
  );

  // Get aggregate stats
  const { rows: statsRows } = await query(
    `SELECT
      COUNT(*) as total,
      ROUND(AVG(rating)::numeric, 2) as avg_rating,
      ROUND(AVG(rating_desc)::numeric, 2) as avg_desc,
      ROUND(AVG(rating_response)::numeric, 2) as avg_response,
      ROUND(AVG(rating_packaging)::numeric, 2) as avg_packaging,
      ROUND(AVG(rating_value)::numeric, 2) as avg_value,
      COUNT(*) FILTER (WHERE rating = 5) as count_5,
      COUNT(*) FILTER (WHERE rating = 4) as count_4,
      COUNT(*) FILTER (WHERE rating = 3) as count_3,
      COUNT(*) FILTER (WHERE rating = 2) as count_2,
      COUNT(*) FILTER (WHERE rating = 1) as count_1
    FROM reviews
    WHERE reviewed_id = $1 AND published = true`,
    [userId]
  );

  const totalCount = rows[0]?.total_count || 0;

  return NextResponse.json({
    reviews: rows.map(r => ({ ...r, total_count: undefined })),
    stats: statsRows[0],
    pagination: {
      total: parseInt(totalCount),
      page,
      limit,
      pages: Math.ceil(parseInt(totalCount) / limit),
    },
  });
}

// ─── POST review ──────────────────────────────────────────────────────────────
export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify transaction exists and user is party to it
  const { rows: txRows } = await query(
    `SELECT t.id, t.buyer_id, t.seller_id, t.listing_id, t.status
     FROM transactions t
     WHERE t.id = $1 AND (t.buyer_id = $2 OR t.seller_id = $2)
       AND t.status IN ('released', 'delivered')`,
    [data.transaction_id, user.sub]
  );

  if (!txRows[0]) {
    return NextResponse.json(
      { error: 'Transaction introuvable ou non eligible pour un avis' },
      { status: 404 }
    );
  }

  const tx = txRows[0];
  const isBuyer = tx.buyer_id === user.sub;
  const reviewedId = isBuyer ? tx.seller_id : tx.buyer_id;
  const reviewType = isBuyer ? 'buyer_to_seller' : 'seller_to_buyer';

  // Check for duplicate review
  const { rows: existingRows } = await query(
    'SELECT id FROM reviews WHERE transaction_id = $1 AND reviewer_id = $2',
    [data.transaction_id, user.sub]
  );

  if (existingRows[0]) {
    return NextResponse.json(
      { error: 'Vous avez déjà laissé un avis pour cette transaction' },
      { status: 409 }
    );
  }

  // Auto-approve reviews (published after moderation in production)
  const autoPublish = data.rating >= 4 || data.content.length > 50;

  const { rows } = await query(
    `INSERT INTO reviews (
      transaction_id, reviewer_id, reviewed_id, listing_id, type,
      rating, rating_desc, rating_response, rating_packaging, rating_value,
      content, tags_positive, tags_negative, published
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id, rating, created_at`,
    [
      data.transaction_id, user.sub, reviewedId, tx.listing_id, reviewType,
      data.rating, data.rating_desc || null, data.rating_response || null,
      data.rating_packaging || null, data.rating_value || null,
      data.content, JSON.stringify(data.tags_positive), JSON.stringify(data.tags_negative),
      autoPublish,
    ]
  );

  return NextResponse.json({
    review: rows[0],
    message: autoPublish
      ? 'Votre avis a été publié !'
      : 'Votre avis a été soumis et sera publié après vérification.',
  }, { status: 201 });
});

// ─── POST reply to review ─────────────────────────────────────────────────────
export const POST_reply = withAuth(async (req: NextRequest, user) => {
  const reviewId = req.nextUrl.pathname.split('/').pop();
  const { reply } = await req.json();

  if (!reply || reply.length < 10) {
    return NextResponse.json({ error: 'Réponse trop courte' }, { status: 400 });
  }

  // Verify the reviewer is the one being reviewed
  const { rows } = await query(
    `SELECT r.id FROM reviews r
     JOIN transactions t ON t.id = r.transaction_id
     WHERE r.id = $1 AND r.reviewed_id = $2 AND r.reply IS NULL`,
    [reviewId, user.sub]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: 'Avis introuvable ou déjà répondu' }, { status: 404 });
  }

  await query(
    `UPDATE reviews SET reply = $1, reply_at = NOW() WHERE id = $2`,
    [reply, reviewId]
  );

  return NextResponse.json({ success: true, message: 'Réponse publiée' });
});

// ─── POST vote helpful ────────────────────────────────────────────────────────
export const POST_helpful = withAuth(async (req: NextRequest, user) => {
  const reviewId = req.nextUrl.pathname.split('/').slice(-2)[0];

  // Prevent self-voting
  const { rows: reviewRows } = await query(
    'SELECT reviewer_id FROM reviews WHERE id = $1',
    [reviewId]
  );

  if (reviewRows[0]?.reviewer_id === user.sub) {
    return NextResponse.json({ error: 'Vous ne pouvez pas voter pour votre propre avis' }, { status: 400 });
  }

  try {
    await query(
      'INSERT INTO review_votes (user_id, review_id) VALUES ($1, $2)',
      [user.sub, reviewId]
    );

    await query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [reviewId]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Déjà voté' }, { status: 409 });
  }
});
