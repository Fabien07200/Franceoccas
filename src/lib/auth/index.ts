import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export interface JWTPayload {
  sub: string;          // user id
  email: string;
  role: string;
  jti: string;          // unique token id (for revocation)
  iat: number;
  exp: number;
}

// ─── Token Generation ─────────────────────────────────────────────────────────
export async function createAccessToken(userId: string, email: string, role: string): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ sub: userId, email, role, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .setIssuer('franceoccas.fr')
    .setAudience('franceoccas-api')
    .sign(ACCESS_SECRET);
}

export async function createRefreshToken(userId: string): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ sub: userId, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(REFRESH_SECRET);
}

// ─── Token Verification ───────────────────────────────────────────────────────
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET, {
      issuer: 'franceoccas.fr',
      audience: 'franceoccas-api',
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; jti: string } | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return { sub: payload.sub as string, jti: payload.jti as string };
  } catch {
    return null;
  }
}

// ─── Cookie Management ────────────────────────────────────────────────────────
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('fo_access', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60,          // 15 minutes
    path: '/',
  });

  response.cookies.set('fo_refresh', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/api/auth',
  });

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('fo_access');
  response.cookies.delete('fo_refresh');
  return response;
}

// ─── Auth Middleware Helper ───────────────────────────────────────────────────
export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get('fo_access')?.value
    || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) return null;
  return verifyAccessToken(token);
}

// ─── Server Component Auth ────────────────────────────────────────────────────
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('fo_access')?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

// ─── Protected Route HOF ─────────────────────────────────────────────────────
export function withAuth(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>,
  options: { roles?: string[] } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (options.roles && !options.roles.includes(user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return handler(req, user);
  };
}

// ─── Password Hashing ─────────────────────────────────────────────────────────
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Validate password strength ───────────────────────────────────────────────
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Minimum 8 caractères');
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Au moins un caractère spécial');
  return { valid: errors.length === 0, errors };
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.resetAt };
}

export function resetRateLimit(key: string): void {
  loginAttempts.delete(key);
}
