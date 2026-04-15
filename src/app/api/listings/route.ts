import { NextRequest, NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ listings: [], pagination: { total: 0, page: 1, limit: 24 } });
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ message: 'Listing créé' }, { status: 201 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ message: 'Listing mis à jour' });
}
