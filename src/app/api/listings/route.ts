import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { withAuth, getAuthUser } from '@/lib/auth';
import { analyzeProductImages, moderateListing } from '@/lib/ai';
import { z } from 'zod';
import { PoolClient } from 'pg';

// ─── Schema validation ────────────────────────────────────────────────────────
const createListingSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20).max(3000),
  category_id: z.string().uuid(),
  condition: z.enum(['new', 'like_new', 'very_good', 'good', 'fair', 'for_parts']),
  price: z.number().int().min(100).max(10000000), // centimes, 1€ - 100000€
  price_negotiable: z.boolean().default(true),
  city: z.string().min(2).max(100),
  department: z.string().max(3),
  postal_code: z.string().max(10).optional(),
  photos: z.array(z.string().url()).min(1).max(8),
  specs: z.record(z.unknown()).default({}),
  is_vehicle: z.boolean().default(false),
  // Vehicle fields
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_version: z.string().optional(),
  vehicle_year: z.number().int().min(1950).max(2030).optional(),
  vehicle_fuel: z.string().optional(),
  vehicle_gearbox: z.string().optional(),
  vehicle_mileage: z.number().int().min(0).optional(),
  vehicle_color: z.string().optional(),
  vehicle_doors: z.number().int().min(2).max(7).optional(),
  vehicle_plate: z.string().optional(),
  argus_price_min: z.number().optional(),
  argus_price_max: z.number().optional(),
  argus_suggested: z.number().optional(),
  ct_status: z.string().optional(),
  ct_next_date: z.string().optional(),
  // AI data
  ai_generated: z.boolean().default(false),
  ai_score: z.number().optional(),
});

// ─── GET /api/listings - Search & list ───────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const s = req.nextUrl.searchParams;
  const q = s.get('q') || '';
  const category = s.get('category') || '';
  const department = s.get('department') || '';
  const condition = s.get('condition') || '';
  const minPrice = parseInt(s.get('min_price') || '0');
  const maxPrice = parseInt(s.get('max_price') || '999999999');
  const sortBy = s.get('sort') || 'relevance';
  const page = Math.max(1, parseInt(s.get('page') || '1'));
  const limit = Math.min(48, parseInt(s.get('limit') || '24'));
  const offset = (page - 1) * limit;
  const onlyWithDelivery = s.get('with_delivery') === '1';
  const isVehicle = s.get('is_vehicle') === '1';
  const vehicleMake = s.get('make') || '';
  const vehicleModel = s.get('model') || '';

  let whereClause = `WHERE l.status = 'active'`;
  const params: unknown[] = [];
  let paramIdx = 1;

  if (q) {
    whereClause += ` AND to_tsvector('french', l.title || ' ' || l.description) @@ plainto_tsquery('french', $${paramIdx})`;
    params.push(q);
    paramIdx++;
  }

  if (category) {
    whereClause += ` AND (c.slug = $${paramIdx} OR c.parent_id = (SELECT id FROM categories WHERE slug = $${paramIdx}))`;
    params.push(category);
    paramIdx++;
  }

  if (department) {
    whereClause += ` AND l.department = $${paramIdx}`;
    params.push(department);
    paramIdx++;
  }

  if (condition) {
    whereClause += ` AND l.condition = $${paramIdx}`;
    params.push(condition);
    paramIdx++;
  }

  if (minPrice > 0) {
    whereClause += ` AND l.price >= $${paramIdx}`;
    params.push(minPrice);
    paramIdx++;
  }

  if (maxPrice < 999999999) {
    whereClause += ` AND l.price <= $${paramIdx}`;
    params.push(maxPrice);
    paramIdx++;
  }

  if (isVehicle) {
    whereClause += ` AND l.is_vehicle = true`;
  }

  if (vehicleMake) {
    whereClause += ` AND l.vehicle_make ILIKE $${paramIdx}`;
    params.push(`%${vehicleMake}%`);
    paramIdx++;
  }

  if (vehicleModel) {
    whereClause += ` AND l.vehicle_model ILIKE $${paramIdx}`;
    params.push(`%${vehicleModel}%`);
    paramIdx++;
  }

  const orderClause = sortBy === 'price_asc' ? 'ORDER BY l.price ASC'
    : sortBy === 'price_desc' ? 'ORDER BY l.price DESC'
    : sortBy === 'recent' ? 'ORDER BY l.published_at DESC'
    : 'ORDER BY l.boost_level DESC, l.boost_expires_at DESC NULLS LAST, l.published_at DESC';

  const sql = `
    SELECT
      l.id, l.title, l.description, l.condition, l.price, l.price_negotiable,
      l.city, l.department, l.photos, l.status, l.boost_level,
      l.views_count, l.favorites_count, l.is_vehicle,
      l.vehicle_make, l.vehicle_model, l.vehicle_year, l.vehicle_mileage,
      l.argus_suggested, l.ct_status,
      l.created_at, l.published_at,
      c.name as category_name, c.slug as category_slug,
      u.full_name as seller_name, u.avatar_url as seller_avatar,
      u.rating as seller_rating, u.rating_count as seller_rating_count,
      u.id as seller_id,
      COUNT(*) OVER() as total_count
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    JOIN users u ON u.id = l.seller_id
    ${whereClause}
    ${orderClause}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  params.push(limit, offset);

  const { rows } = await query(sql, params);

  const totalCount = rows[0]?.total_count || 0;
  const listings = rows.map(r => ({
    ...r,
    photos: r.photos || [],
    price_display: (r.price / 100).toFixed(2),
    total_count: undefined,
  }));

  return NextResponse.json({
    listings,
    pagination: {
      total: parseInt(totalCount),
      page,
      limit,
      pages: Math.ceil(parseInt(totalCount) / limit),
    },
  });
}

// ─── POST /api/listings - Create listing ─────────────────────────────────────
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Auto-moderate with AI
    let aiScore = data.ai_score;
    let aiFlags: string[] = [];

    if (!aiScore) {
      const modResult = await moderateListing({
        title: data.title,
        description: data.description,
        price: data.price / 100,
        category: '',
        photos: data.photos,
      });
      aiScore = modResult.score;
      aiFlags = modResult.flags;
    }

    const status = aiScore >= 85 ? 'active' : 'pending';

    const { rows } = await query(
      `INSERT INTO listings (
        seller_id, category_id, title, description, condition, price, price_negotiable,
        city, department, postal_code, photos, specs, status, ai_generated, ai_score, ai_flags,
        is_vehicle, vehicle_make, vehicle_model, vehicle_version, vehicle_year,
        vehicle_fuel, vehicle_gearbox, vehicle_mileage, vehicle_color, vehicle_doors,
        vehicle_plate, argus_price_min, argus_price_max, argus_suggested, ct_status, ct_next_date,
        pro_seller, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
        CASE WHEN $13 = 'active' THEN NOW() ELSE NULL END
      )
      RETURNING id, title, status, ai_score`,
      [
        user.sub, data.category_id, data.title, data.description, data.condition,
        data.price, data.price_negotiable, data.city, data.department, data.postal_code || null,
        data.photos, JSON.stringify(data.specs), status, data.ai_generated, aiScore,
        JSON.stringify(aiFlags),
        data.is_vehicle, data.vehicle_make || null, data.vehicle_model || null,
        data.vehicle_version || null, data.vehicle_year || null, data.vehicle_fuel || null,
        data.vehicle_gearbox || null, data.vehicle_mileage || null, data.vehicle_color || null,
        data.vehicle_doors || null, data.vehicle_plate || null,
        data.argus_price_min || null, data.argus_price_max || null, data.argus_suggested || null,
        data.ct_status || null, data.ct_next_date || null,
        user.role === 'pro' || user.role === 'franchise_manager',
      ]
    );

    const listing = rows[0];

    // Add to moderation queue if not auto-approved
    if (status === 'pending') {
      await query(
        `INSERT INTO moderation_queue (listing_id, ai_score, ai_flags, priority)
         VALUES ($1, $2, $3, $4)`,
        [listing.id, aiScore, JSON.stringify(aiFlags), aiScore < 60 ? 2 : 5]
      );
    }

    return NextResponse.json({
      listing,
      message: status === 'active'
        ? 'Annonce publiée avec succès !'
        : 'Annonce soumise — en cours de vérification (sous 24h)',
    }, { status: 201 });

  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
});

// ─── PUT /api/listings/[id] - Update listing ──────────────────────────────────
export const PUT = withAuth(async (req: NextRequest, user) => {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

  // Verify ownership
  const { rows } = await query(
    'SELECT id, seller_id FROM listings WHERE id = $1',
    [id]
  );

  if (!rows[0]) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  if (rows[0].seller_id !== user.sub && user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await req.json();
  const allowedFields = ['title', 'description', 'price', 'price_negotiable', 'condition', 'photos', 'specs'];
  const updates: Record<string, unknown> = {};

  allowedFields.forEach(f => {
    if (body[f] !== undefined) updates[f] = body[f];
  });

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = Object.values(updates);

  await query(
    `UPDATE listings SET ${setClauses}, updated_at = NOW() WHERE id = $1`,
    [id, ...values]
  );

  return NextResponse.json({ success: true, message: 'Annonce mise à jour' });
});

// ─── POST /api/listings/[id]/boost ────────────────────────────────────────────
export async function boostListing(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const id = req.nextUrl.pathname.split('/').slice(-2)[0];
  const { level } = await req.json();

  const boostPrices: Record<number, number> = { 1: 290, 2: 490, 3: 890 };
  const boostDays: Record<number, number> = { 1: 3, 2: 7, 3: 15 };

  if (!boostPrices[level]) {
    return NextResponse.json({ error: 'Niveau de boost invalide' }, { status: 400 });
  }

  const price = boostPrices[level];
  const days = boostDays[level];

  await withTransaction(async (client: PoolClient) => {
    // Check wallet balance
    const { rows: userRows } = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
      [user.sub]
    );

    if (!userRows[0] || userRows[0].wallet_balance < price) {
      throw new Error('Solde insuffisant');
    }

    // Verify listing ownership
    const { rows: listingRows } = await client.query(
      'SELECT id FROM listings WHERE id = $1 AND seller_id = $2',
      [id, user.sub]
    );

    if (!listingRows[0]) throw new Error('Annonce introuvable');

    // Debit wallet
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [price, user.sub]
    );

    // Apply boost
    await client.query(
      `UPDATE listings SET
        boost_level = $1,
        boost_expires_at = NOW() + INTERVAL '${days} days'
       WHERE id = $2`,
      [level, id]
    );

    // Record boost
    await client.query(
      `INSERT INTO boosts (listing_id, user_id, level, duration_days, amount, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${days} days')`,
      [id, user.sub, level, days, price]
    );

    // Wallet transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance, description, reference)
       SELECT $1, 'boost', -$2, wallet_balance, $3, $4
       FROM users WHERE id = $1`,
      [user.sub, price, `Boost annonce ${days} jours`, id]
    );
  });

  return NextResponse.json({ success: true, message: `Annonce boostée pour ${days} jours !` });
}
