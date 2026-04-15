import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'fallback-secret-key-32-chars-min!!');
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback-refresh-key-32-chars-min!');

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, password, full_name, city, department } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum)' }, { status: 400 });
    }

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
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    }, { status: 201 });

    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('fo_access', accessToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
    response.cookies.set('fo_refresh', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/' });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
