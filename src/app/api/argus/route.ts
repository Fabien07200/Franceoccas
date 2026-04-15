import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getVehicleByPlate, batchImportCatalogue, getArgusQuotaStatus, checkVehiclePrice } from '@/lib/argus';
import { query } from '@/lib/db';
import { z } from 'zod';

// ─── GET /api/argus/plate/[plate] ─────────────────────────────────────────────
export const GET_plate = withAuth(async (req: NextRequest) => {
  const plate = req.nextUrl.pathname.split('/').pop();
  if (!plate) return NextResponse.json({ error: 'Plaque manquante' }, { status: 400 });

  try {
    const data = await getVehicleByPlate(plate);

    // Log API usage
    await query(
      `INSERT INTO argus_cache (cache_key, plate, data, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
       ON CONFLICT (cache_key) DO UPDATE SET hit_count = argus_cache.hit_count + 1`,
      [`plate:${plate}`, plate, JSON.stringify(data)]
    ).catch(() => {});

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Argus plate error:', err);
    return NextResponse.json({ error: 'Impossible de récupérer les données du véhicule' }, { status: 502 });
  }
});

// ─── POST /api/argus/batch ────────────────────────────────────────────────────
const batchSchema = z.object({
  vehicles: z.array(z.object({
    plate: z.string().min(5).max(12),
    dealer_price: z.number().optional(),
    mileage: z.number().optional(),
    internal_ref: z.string().optional(),
  })).min(1).max(500),
  concession_id: z.string().uuid(),
});

export const POST_batch = withAuth(async (req: NextRequest, user) => {
  if (!['pro', 'franchise_manager', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Réservé aux professionnels' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { vehicles, concession_id } = parsed.data;

  // Verify concession belongs to user
  const { rows } = await query(
    `SELECT id FROM concessions WHERE id = $1 AND user_id = $2 AND status = 'active'`,
    [concession_id, user.sub]
  );

  if (!rows[0] && user.role !== 'admin') {
    return NextResponse.json({ error: 'Concession introuvable' }, { status: 404 });
  }

  const results = await batchImportCatalogue(vehicles, concession_id);

  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  });
});

// ─── GET /api/argus/quota ─────────────────────────────────────────────────────
export const GET_quota = withAuth(async (_req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const quota = await getArgusQuotaStatus();
  return NextResponse.json({ quota });
});

// ─── POST /api/argus/price-check ─────────────────────────────────────────────
export const POST_priceCheck = withAuth(async (req: NextRequest) => {
  const { plate, seller_price } = await req.json();

  if (!plate || !seller_price) {
    return NextResponse.json({ error: 'plate et seller_price requis' }, { status: 400 });
  }

  const { rows: configRows } = await query(
    `SELECT config FROM api_configs WHERE service = 'argus'`,
    []
  );

  const config = configRows[0]?.config || {};
  const data = await getVehicleByPlate(plate);
  const check = checkVehiclePrice(seller_price, data.valuation, {
    lowThreshold: config.price_alert_low_pct,
    highThreshold: config.price_alert_high_pct,
  });

  return NextResponse.json({ check, valuation: data.valuation });
});

// ─── GET /api/argus/config (admin) ───────────────────────────────────────────
export const GET_config = withAuth(async (_req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const { rows } = await query(
    `SELECT config, enabled, updated_at FROM api_configs WHERE service = 'argus'`,
    []
  );

  return NextResponse.json({ config: rows[0] });
});

// ─── PUT /api/argus/config (admin) ───────────────────────────────────────────
export const PUT_config = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const body = await req.json();

  await query(
    `UPDATE api_configs SET config = $1, updated_by = $2, updated_at = NOW() WHERE service = 'argus'`,
    [JSON.stringify(body), user.sub]
  );

  return NextResponse.json({ success: true, message: 'Configuration Argus mise à jour' });
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  if (path.includes('/quota')) return GET_quota(req);
  if (path.includes('/config')) return GET_config(req);
  if (path.includes('/plate')) return GET_plate(req);
  return NextResponse.json({ error: 'Route inconnue' }, { status: 404 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  if (path.includes('/batch')) return POST_batch(req);
  if (path.includes('/price-check')) return POST_priceCheck(req);
  return NextResponse.json({ error: 'Route inconnue' }, { status: 404 });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  return PUT_config(req);
}
