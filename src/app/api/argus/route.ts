import { NextRequest, NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ message: 'Argus API OK' });
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ message: 'Argus API OK' });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ message: 'Argus API OK' });
}
