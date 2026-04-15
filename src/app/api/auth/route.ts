import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  checkRateLimit,
  resetRateLimit,
} from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ─── Register ─────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
  full_name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  city: z.string().optional(),
  department: z.string().length(2).optional(),
});

export async function POST_register(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, full_name, city, department } = parsed.data;

    // Password strength check
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.errors.join(', ') },
        { status: 400 }
      );
    }

    // Check existing user
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const verifyToken = uuidv4();

    // Create user
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name, city, department, email_verify_token, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, email, full_name, role, status`,
      [email.toLowerCase(), passwordHash, full_name, city, department, verifyToken]
    );

    const user = rows[0];

    // Send verification email (don't await in production for speed)
    sendWelcomeEmail({
      to: email,
      name: full_name,
      verifyToken,
    }).catch(console.error);

    // Create tokens
    const accessToken = await createAccessToken(user.id, user.email, user.role);
    const refreshToken = await createRefreshToken(user.id);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      message: 'Compte créé — vérifiez votre email',
    }, { status: 201 });

    return setAuthCookies(response, accessToken, refreshToken);

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST_login(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Rate limiting
    const rateLimitKey = `login:${ip}:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${Math.ceil((rateLimit.resetAt - Date.now()) / 60000)} minutes` },
        { status: 429 }
      );
    }

    // Find user
    const { rows } = await query(
      `SELECT id, email, password_hash, full_name, role, status, wallet_balance
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = rows[0];

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    if (user.status === 'blocked' || user.status === 'suspended') {
      return NextResponse.json({ error: 'Compte suspendu ou bloqué' }, { status: 403 });
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Reset rate limit on success
    resetRateLimit(rateLimitKey);

    // Update last login
    await query(
      `UPDATE users SET last_login_at = NOW(), last_login_ip = $1 WHERE id = $2`,
      [ip, user.id]
    );

    // Create tokens
    const accessToken = await createAccessToken(user.id, user.email, user.role);
    const refreshToken = await createRefreshToken(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        wallet_balance: user.wallet_balance,
      },
    });

    return setAuthCookies(response, accessToken, refreshToken);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function POST_logout(_req: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  return clearAuthCookies(response);
}

// ─── Email Verification ───────────────────────────────────────────────────────
export async function GET_verifyEmail(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
  }

  const { rows } = await query(
    `UPDATE users SET email_verified = true, status = 'active', email_verify_token = NULL
     WHERE email_verify_token = $1
     RETURNING id, email`,
    [token]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 });
  }

  return NextResponse.redirect(new URL('/?verified=1', req.url));
}

// ─── Route exports ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  if (pathname.includes('/register')) return POST_register(req);
  if (pathname.includes('/login')) return POST_login(req);
  if (pathname.includes('/logout')) return POST_logout(req);

  return NextResponse.json({ error: 'Route non trouvée' }, { status: 404 });
}
