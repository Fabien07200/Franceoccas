import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
export const GET_dashboard = withAuth(async (_req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const [
    usersStats,
    listingsStats,
    revenueStats,
    transactionStats,
    moderationStats,
    recentUsers,
    recentTransactions,
    alerts,
  ] = await Promise.all([
    query(`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE role = 'pro') as pro_count,
      COUNT(*) FILTER (WHERE status = 'blocked') as blocked
     FROM users`),

    query(`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE boost_level > 0 AND boost_expires_at > NOW()) as boosted,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
     FROM listings`),

    query(`SELECT
      COALESCE(SUM(commission), 0) as commission_total,
      COALESCE(SUM(commission) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) as commission_month,
      COALESCE(SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) as gmv_month
     FROM transactions WHERE status IN ('released', 'escrow')`),

    query(`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'escrow') as in_escrow,
      COUNT(*) FILTER (WHERE status = 'released') as released,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as this_month
     FROM transactions`),

    query(`SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE ai_score < 60 AND status = 'pending') as urgent,
      COUNT(*) FILTER (WHERE created_at > NOW()) as auto_approved_today
     FROM moderation_queue`),

    query(`SELECT id, email, full_name, role, status, created_at, city
     FROM users ORDER BY created_at DESC LIMIT 5`),

    query(`SELECT t.id, t.amount, t.status, t.created_at,
      l.title as listing_title,
      u_b.full_name as buyer_name, u_s.full_name as seller_name
     FROM transactions t
     JOIN listings l ON l.id = t.listing_id
     JOIN users u_b ON u_b.id = t.buyer_id
     JOIN users u_s ON u_s.id = t.seller_id
     ORDER BY t.created_at DESC LIMIT 5`),

    query(`SELECT 'litige' as type, d.id, 'Litige ouvert' as title,
      t.amount, d.created_at
     FROM disputes d JOIN transactions t ON t.id = d.transaction_id
     WHERE d.status = 'open'
     UNION ALL
     SELECT 'moderation' as type, mq.id, 'Annonce à modérer' as title,
      0 as amount, mq.created_at
     FROM moderation_queue mq WHERE mq.status = 'pending' AND mq.ai_score < 70
     ORDER BY created_at DESC LIMIT 10`),
  ]);

  return NextResponse.json({
    stats: {
      users: usersStats.rows[0],
      listings: listingsStats.rows[0],
      revenue: revenueStats.rows[0],
      transactions: transactionStats.rows[0],
      moderation: moderationStats.rows[0],
    },
    recent_users: recentUsers.rows,
    recent_transactions: recentTransactions.rows,
    alerts: alerts.rows,
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export const GET_users = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const s = req.nextUrl.searchParams;
  const search = s.get('q') || '';
  const status = s.get('status') || 'all';
  const role = s.get('role') || 'all';
  const page = Math.max(1, parseInt(s.get('page') || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params: unknown[] = [];
  let idx = 1;

  if (search) {
    where += ` AND (u.email ILIKE $${idx} OR u.full_name ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  if (status !== 'all') { where += ` AND u.status = $${idx}`; params.push(status); idx++; }
  if (role !== 'all') { where += ` AND u.role = $${idx}`; params.push(role); idx++; }

  const { rows } = await query(
    `SELECT u.id, u.email, u.full_name, u.role, u.status, u.kyc_status,
      u.city, u.department, u.created_at, u.last_login_at,
      u.wallet_balance, u.rating, u.rating_count, u.sales_count,
      COUNT(DISTINCT l.id) as listing_count
     FROM users u
     LEFT JOIN listings l ON l.seller_id = u.id
     ${where}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*) as total FROM users u ${where}`,
    params
  );

  return NextResponse.json({
    users: rows,
    pagination: { total: parseInt(countRows[0].total), page, limit },
  });
});

// ─── PUT /api/admin/users/[id] - Block/unblock/modify ────────────────────────
export const PUT_user = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const userId = req.nextUrl.pathname.split('/').pop();
  const body = await req.json();

  const allowed = ['status', 'role', 'kyc_status', 'blocked_reason'];
  const updates: Record<string, unknown> = {};
  allowed.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = Object.values(updates);

  await query(
    `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $1`,
    [userId, ...values]
  );

  return NextResponse.json({ success: true });
});

// ─── GET /api/admin/moderation ────────────────────────────────────────────────
export const GET_moderation = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status') || 'pending';

  const { rows } = await query(
    `SELECT mq.*, l.title, l.description, l.photos, l.price, l.city,
      l.category_id, c.name as category_name,
      u.full_name as seller_name, u.email as seller_email, u.rating as seller_rating
     FROM moderation_queue mq
     JOIN listings l ON l.id = mq.listing_id
     JOIN users u ON u.id = l.seller_id
     LEFT JOIN categories c ON c.id = l.category_id
     WHERE mq.status = $1
     ORDER BY mq.priority ASC, mq.created_at ASC
     LIMIT 50`,
    [status]
  );

  return NextResponse.json({ queue: rows });
});

// ─── POST /api/admin/moderation/[id]/action ───────────────────────────────────
export const POST_moderationAction = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const mqId = req.nextUrl.pathname.split('/')[4];
  const { action, notes } = await req.json();

  if (!['approve', 'reject', 'request_info'].includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }

  const { rows: mqRows } = await query(
    'SELECT listing_id FROM moderation_queue WHERE id = $1',
    [mqId]
  );

  if (!mqRows[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const newStatus = action === 'approve' ? 'active' : action === 'reject' ? 'rejected' : 'pending';

  await query(
    `UPDATE listings SET status = $1 WHERE id = $2`,
    [newStatus, mqRows[0].listing_id]
  );

  await query(
    `UPDATE moderation_queue SET
       status = CASE WHEN $1 = 'approve' THEN 'resolved' WHEN $1 = 'reject' THEN 'rejected' ELSE 'pending' END,
       action = $1, notes = $2, resolved_by = $3, resolved_at = NOW()
     WHERE id = $4`,
    [action, notes, user.sub, mqId]
  );

  if (newStatus === 'active') {
    await query(
      'UPDATE listings SET published_at = NOW() WHERE id = $1 AND published_at IS NULL',
      [mqRows[0].listing_id]
    );
  }

  return NextResponse.json({ success: true, new_status: newStatus });
});

// ─── GET /api/admin/disputes ──────────────────────────────────────────────────
export const GET_disputes = withAuth(async (_req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const { rows } = await query(
    `SELECT d.*, t.amount, t.status as tx_status,
      l.title as listing_title, l.photos[1] as listing_photo,
      u_b.full_name as buyer_name, u_b.email as buyer_email,
      u_s.full_name as seller_name, u_s.email as seller_email
     FROM disputes d
     JOIN transactions t ON t.id = d.transaction_id
     JOIN listings l ON l.id = t.listing_id
     JOIN users u_b ON u_b.id = t.buyer_id
     JOIN users u_s ON u_s.id = t.seller_id
     WHERE d.status = 'open'
     ORDER BY d.created_at ASC`,
    []
  );

  return NextResponse.json({ disputes: rows });
});

// ─── POST /api/admin/disputes/[id]/resolve ────────────────────────────────────
export const POST_resolveDispute = withAuth(async (req: NextRequest, user) => {
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  }

  const disputeId = req.nextUrl.pathname.split('/')[4];
  const { resolution, action } = await req.json(); // action: 'refund_buyer' | 'release_seller'

  const { rows: disputeRows } = await query(
    `SELECT d.*, t.id as tx_id FROM disputes d JOIN transactions t ON t.id = d.transaction_id
     WHERE d.id = $1 AND d.status = 'open'`,
    [disputeId]
  );

  if (!disputeRows[0]) return NextResponse.json({ error: 'Litige introuvable' }, { status: 404 });

  const dispute = disputeRows[0];

  await query(
    `UPDATE disputes SET status = 'resolved', resolution = $1, resolved_by = $2, resolved_at = NOW()
     WHERE id = $3`,
    [resolution, user.sub, disputeId]
  );

  if (action === 'release_seller') {
    const { releaseEscrow } = await import('@/lib/payment');
    await releaseEscrow(dispute.tx_id);
  } else if (action === 'refund_buyer') {
    const { refundTransaction } = await import('@/lib/payment');
    await refundTransaction(dispute.tx_id, resolution);
  }

  return NextResponse.json({ success: true, action });
});

// ─── Router ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  if (path.includes('/moderation')) return GET_moderation(req);
  if (path.includes('/disputes')) return GET_disputes(req);
  if (path.includes('/users')) return GET_users(req);
  return GET_dashboard(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  if (path.includes('/moderation') && path.includes('/action')) return POST_moderationAction(req);
  if (path.includes('/disputes') && path.includes('/resolve')) return POST_resolveDispute(req);
  return NextResponse.json({ error: 'Route inconnue' }, { status: 404 });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  return PUT_user(req);
}
