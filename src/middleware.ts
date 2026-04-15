import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

// ─── Routes requiring authentication ─────────────────────────────────────────
const PROTECTED_ROUTES = [
  '/vendre',
  '/compte',
  '/messages',
  '/admin',
  '/franchise',
];

// ─── Admin-only routes ────────────────────────────────────────────────────────
const ADMIN_ROUTES = ['/admin'];

// ─── Rate limiting store (in production, use Redis) ──────────────────────────
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string, maxReq = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || entry.resetAt < now) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxReq) return false;
  entry.count++;
  return true;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // ─── Global rate limiting ─────────────────────────────────────────────────
  const apiPath = pathname.startsWith('/api/');
  const maxReq = apiPath ? 60 : 200;

  if (!rateLimit(ip, maxReq, 60000)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': String(maxReq),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // ─── Auth check for protected routes ────────────────────────────────────────
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some(r => pathname.startsWith(r));

  if (isProtected) {
    const token = req.cookies.get('fo_access')?.value
      || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      if (apiPath) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
      const loginUrl = new URL('/auth/connexion', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
      if (apiPath) {
        return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
      }
      const loginUrl = new URL('/auth/connexion', req.url);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminRoute && payload.role !== 'admin') {
      if (apiPath) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.sub);
    response.headers.set('x-user-role', payload.role);
    response.headers.set('x-user-email', payload.email);
    return response;
  }

  // ─── Security headers (already set in next.config.js, reinforce here) ────
  const response = NextResponse.next();

  // Prevent clickjacking on all pages
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
