import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { sendFranchiseInvitationEmail } from '@/lib/email';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { PoolClient } from 'pg';

// ─── GET /api/franchise - List franchises (admin) ─────────────────────────────
export const GET_franchises = withAuth(async (_req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const { rows } = await query(
    `SELECT f.*,
      COUNT(DISTINCT fm.id) as manager_count,
      COUNT(DISTINCT c.id) as concession_count,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_concessions
     FROM franchises f
     LEFT JOIN franchise_managers fm ON fm.franchise_id = f.id AND fm.active = true
     LEFT JOIN concessions c ON c.franchise_id = f.id
     GROUP BY f.id
     ORDER BY f.created_at DESC`,
    []
  );

  return NextResponse.json({ franchises: rows });
});

// ─── POST /api/franchise - Create franchise (admin) ──────────────────────────
const franchiseSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  siret: z.string().optional(),
  description: z.string().optional(),
  commission_rate: z.number().min(0).max(0.1).default(0.018),
  max_concessions: z.number().int().min(1).default(200),
  zone_regions: z.array(z.string()).default([]),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
});

export const POST_franchise = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = franchiseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const d = parsed.data;

  const { rows } = await query(
    `INSERT INTO franchises (name, slug, contact_email, contact_phone, siret, description,
      commission_rate, max_concessions, zone_regions, contract_start, contract_end, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active')
     RETURNING *`,
    [d.name, d.slug, d.contact_email, d.contact_phone, d.siret, d.description,
      d.commission_rate, d.max_concessions, JSON.stringify(d.zone_regions),
      d.contract_start, d.contract_end]
  );

  return NextResponse.json({ franchise: rows[0] }, { status: 201 });
});

// ─── POST /api/franchise/[id]/managers - Add manager ─────────────────────────
const managerSchema = z.object({
  user_id: z.string().uuid(),
  fo_validate: z.boolean().default(false),
});

export const POST_addManager = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const franchiseId = req.nextUrl.pathname.split('/')[3];
  const body = await req.json();
  const parsed = managerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { user_id, fo_validate } = parsed.data;

  const { rows } = await query(
    `INSERT INTO franchise_managers (franchise_id, user_id, fo_validated, fo_validated_at, fo_validated_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (franchise_id, user_id) DO UPDATE
     SET fo_validated = $3, fo_validated_at = $4, fo_validated_by = $5, active = true
     RETURNING *`,
    [franchiseId, user_id, fo_validate, fo_validate ? new Date() : null,
      fo_validate ? user.sub : null]
  );

  // Promote user role if validating
  if (fo_validate) {
    await query(
      `UPDATE users SET role = 'franchise_manager' WHERE id = $1`,
      [user_id]
    );
  }

  return NextResponse.json({ manager: rows[0] }, { status: 201 });
});

// ─── POST /api/franchise/[id]/managers/[mid]/validate - FO validate manager ──
export const POST_validateManager = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const parts = req.nextUrl.pathname.split('/');
  const managerId = parts[parts.length - 2];

  await query(
    `UPDATE franchise_managers SET fo_validated = true, fo_validated_at = NOW(), fo_validated_by = $1
     WHERE id = $2`,
    [user.sub, managerId]
  );

  // Get manager user_id and promote
  const { rows } = await query(
    'SELECT user_id FROM franchise_managers WHERE id = $1',
    [managerId]
  );

  if (rows[0]) {
    await query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['franchise_manager', rows[0].user_id]
    );
  }

  return NextResponse.json({ success: true, message: 'Manager validé par FranceOccas' });
});

// ─── POST /api/franchise/invite - Manager invites concession ─────────────────
const inviteSchema = z.object({
  franchise_id: z.string().uuid(),
  concession_name: z.string().min(2),
  email: z.string().email(),
  responsible_name: z.string().min(2),
  city: z.string().optional(),
  department: z.string().optional(),
  message: z.string().optional(),
});

export const POST_invite = withAuth(async (req: NextRequest, user) => {
  if (!['franchise_manager', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Réservé aux managers franchise' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const d = parsed.data;

  // Verify manager belongs to this franchise
  const { rows: managerRows } = await query(
    `SELECT fm.id FROM franchise_managers fm
     WHERE fm.franchise_id = $1 AND fm.user_id = $2 AND fm.fo_validated = true`,
    [d.franchise_id, user.sub]
  );

  if (!managerRows[0] && user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé pour cette franchise' }, { status: 403 });
  }

  // Get franchise info
  const { rows: franchiseRows } = await query(
    'SELECT name FROM franchises WHERE id = $1',
    [d.franchise_id]
  );

  const franchiseName = franchiseRows[0]?.name || 'Franchise';

  // Get manager name
  const { rows: userRows } = await query(
    'SELECT full_name FROM users WHERE id = $1',
    [user.sub]
  );
  const managerName = userRows[0]?.full_name || 'Le manager';

  const inviteToken = uuidv4();

  const { rows } = await query(
    `INSERT INTO concessions (franchise_id, user_id, manager_id, name, city, department,
       status, invitation_token, invitation_sent_at)
     VALUES ($1, $1, $2, $3, $4, $5, 'invited', $6, NOW())
     RETURNING id`,
    [d.franchise_id, managerRows[0]?.id || null, d.concession_name,
      d.city, d.department, inviteToken]
  );

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/franchise/join?token=${inviteToken}`;

  // Send invitation email
  await sendFranchiseInvitationEmail({
    to: d.email,
    concessionName: d.concession_name,
    franchiseName,
    managerName,
    inviteUrl,
  });

  return NextResponse.json({
    success: true,
    concession_id: rows[0].id,
    message: `Invitation envoyée à ${d.email}`,
  }, { status: 201 });
});

// ─── POST /api/franchise/concessions/[id]/fo-validate - Admin validates ───────
export const POST_foValidateConcession = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const concessionId = req.nextUrl.pathname.split('/')[4];

  await withTransaction(async (client: PoolClient) => {
    await client.query(
      `UPDATE concessions SET
         fo_validated = true, fo_validated_at = NOW(), fo_validated_by = $1,
         status = CASE WHEN manager_validated = true THEN 'active' ELSE status END
       WHERE id = $2`,
      [user.sub, concessionId]
    );

    // If both validated, update user role
    const { rows } = await client.query(
      `SELECT user_id, manager_validated FROM concessions WHERE id = $1`,
      [concessionId]
    );

    if (rows[0]?.manager_validated) {
      await client.query(
        `UPDATE users SET role = 'pro' WHERE id = $1`,
        [rows[0].user_id]
      );
    }
  });

  return NextResponse.json({ success: true, message: 'Concession validée par FranceOccas' });
});

// ─── POST /api/franchise/concessions/[id]/manager-validate ───────────────────
export const POST_managerValidateConcession = withAuth(async (req: NextRequest, user) => {
  if (!['franchise_manager', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Réservé aux managers' }, { status: 403 });
  }

  const concessionId = req.nextUrl.pathname.split('/')[4];

  // Verify manager has authority over this concession
  const { rows: concRows } = await query(
    `SELECT c.id, c.franchise_id, c.fo_validated, c.user_id
     FROM concessions c
     JOIN franchise_managers fm ON fm.franchise_id = c.franchise_id
     WHERE c.id = $1 AND fm.user_id = $2 AND fm.fo_validated = true`,
    [concessionId, user.sub]
  );

  if (!concRows[0] && user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const conc = concRows[0];

  await withTransaction(async (client: PoolClient) => {
    await client.query(
      `UPDATE concessions SET
         manager_validated = true, manager_validated_at = NOW(),
         status = CASE WHEN fo_validated = true THEN 'active' ELSE status END
       WHERE id = $1`,
      [concessionId]
    );

    // If FO already validated, fully activate the user
    if (conc?.fo_validated && conc?.user_id) {
      await client.query(
        `UPDATE users SET role = 'pro' WHERE id = $1`,
        [conc.user_id]
      );
    }
  });

  return NextResponse.json({ success: true, message: 'Affiliation validée par le manager' });
});

// ─── GET /api/franchise/concessions - List for manager ───────────────────────
export const GET_concessions = withAuth(async (req: NextRequest, user) => {
  const franchiseId = req.nextUrl.searchParams.get('franchise_id');
  const status = req.nextUrl.searchParams.get('status') || 'all';

  let sql = `
    SELECT c.*,
      u.full_name as user_name, u.email as user_email,
      COUNT(l.id) as listing_count,
      COUNT(t.id) as transaction_count,
      SUM(t.amount) FILTER (WHERE t.status = 'released') as total_revenue
    FROM concessions c
    LEFT JOIN users u ON u.id = c.user_id
    LEFT JOIN listings l ON l.concession_id = c.id
    LEFT JOIN transactions t ON t.seller_id = c.user_id
  `;

  const params: unknown[] = [];
  const where: string[] = [];
  let idx = 1;

  if (user.role === 'franchise_manager') {
    where.push(`c.franchise_id IN (
      SELECT franchise_id FROM franchise_managers WHERE user_id = $${idx} AND fo_validated = true
    )`);
    params.push(user.sub);
    idx++;
  } else if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  if (franchiseId) {
    where.push(`c.franchise_id = $${idx}`);
    params.push(franchiseId);
    idx++;
  }

  if (status !== 'all') {
    where.push(`c.status = $${idx}`);
    params.push(status);
    idx++;
  }

  if (where.length > 0) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ` GROUP BY c.id, u.full_name, u.email ORDER BY c.created_at DESC`;

  const { rows } = await query(sql, params);
  return NextResponse.json({ concessions: rows });
});

// ─── Router ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  if (path.includes('/concessions')) return GET_concessions(req);
  return GET_franchises(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  if (path.includes('/fo-validate')) return POST_foValidateConcession(req);
  if (path.includes('/manager-validate')) return POST_managerValidateConcession(req);
  if (path.includes('/validate') && path.includes('/managers')) return POST_validateManager(req);
  if (path.includes('/managers')) return POST_addManager(req);
  if (path.includes('/invite')) return POST_invite(req);
  return POST_franchise(req);
}
