import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('fo_access');
  response.cookies.delete('fo_refresh');
  return response;
}
