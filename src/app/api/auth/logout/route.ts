import { NextResponse } from 'next/server';
import { CUSTOMER_COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(CUSTOMER_COOKIE_NAME);
  response.cookies.delete('fashionhub_session');
  return response;
}
