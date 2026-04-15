import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'fallback-secret-key-32-chars-min!!');
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback-refresh-key-32-chars-min!');

async function createAccessToken(userId: string, email: string, role: string): Promise<string> {
  return new SignJWT({ sub: userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(ACCESS_SECRET);
}

async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(REFRESH_SECRET);
}

function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set('fo_access', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  response.cookies.set('fo_refresh', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  return response;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;

  try {
    if (path.includes('/logout')) {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('fo_access');
      response.cookies.delete('fo_refresh');
      return response;
    }

    const body = await req.json();

    if (path.includes('/register')) {
      const { email, password, full_name, city, department } = body;

      if (!email || !password || !full_name) {
        return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum)' }, { status: 400 });
      }

      // Check existing user
      const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Cette adresse email est déjà utilisée' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const { rows } = await query(
        `INSERT INTO users (email, password_hash, full_name, city, department, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, 'active', true)
         RETURNING id, email, full_name, role`,
        [email.toLowerCase().trim(), passwordHash, full_name, city || null, department || null]
      );

      const user = rows[0];
      const accessToken = await createAccessToken(user.id, user.email, user.role);
      const refreshToken = await createRefreshToken(user.id);

      const response = NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      }, { status: 201 });

      return setAuthCookies(response, accessToken, refreshToken);
    }

    if (path.includes('/login')) {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
      }

      const { rows } = await query(
        'SELECT id, email, password_hash, full_name, role, status, wallet_balance FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      );

      if (!rows[0]) {
        return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
      }

      const user = rows[0];

      if (user.status === 'blocked' || user.status === 'suspended') {
        return NextResponse.json({ error: 'Compte suspendu ou bloqué. Contactez le support.' }, { status: 403 });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
      }

      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      const accessToken = await createAccessToken(user.id, user.email, user.role);
      const refreshToken = await createRefreshToken(user.id);

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          wallet_balance: user.wallet_balance,
        },
      });

      return setAuthCookies(response, accessToken, refreshToken);
    }

    return NextResponse.json({ error: 'Route inconnue' }, { status: 404 });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Erreur serveur. Réessayez.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get('fo_access')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    const { rows } = await query(
      'SELECT id, email, full_name, role, wallet_balance, rating FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!rows[0]) return NextResponse.json({ user: null });
    return NextResponse.json({ user: rows[0] });
  } catch {
    return NextResponse.json({ user: null });
  }
}
