import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'fallback-secret-key-32-chars-min!!');
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback-refresh-key-32-chars-min!');

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await req.json();

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
      return NextResponse.json({ error: 'Compte suspendu. Contactez le support.' }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const accessToken = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(ACCESS_SECRET);

    const refreshToken = await new SignJWT({ sub: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(REFRESH_SECRET);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, wallet_balance: user.wallet_balance },
    });

    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('fo_access', accessToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
    response.cookies.set('fo_refresh', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/' });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
