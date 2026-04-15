import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'fallback-secret-key-32-chars-min!!');

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get('fo_access')?.value;
  if (!token) return NextResponse.json({ user: null });

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    const { rows } = await query(
      'SELECT id, email, full_name, role, wallet_balance, rating FROM users WHERE id = $1',
      [payload.sub]
    );
    return NextResponse.json({ user: rows[0] || null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
