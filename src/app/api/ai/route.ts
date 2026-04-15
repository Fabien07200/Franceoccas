import { NextRequest, NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ message: 'AI API OK' });
}
