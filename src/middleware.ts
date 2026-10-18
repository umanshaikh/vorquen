import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const isAdminSubdomain = host.startsWith('admin.');

  // Handle Subdomain Routing: admin.yourdomain.com -> /admin/*
  if (isAdminSubdomain) {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.rewrite(url);
    }
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.rewrite(url);
    }
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/_next') && !pathname.startsWith('/api') && !pathname.startsWith('/images') && !pathname.includes('.')) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Handle /vorquen prefix if visited directly as a path
  if (pathname === '/vorquen') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.rewrite(url);
  }
  if (pathname.startsWith('/vorquen/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/vorquen/, '') || '/';
    return NextResponse.rewrite(url);
  }

  // Admin Route Protection
  const isAdminPath = pathname.startsWith('/admin');
  const isPublicAdminPath =
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname === '/admin/reset-password';

  if (isAdminPath && !isPublicAdminPath) {
    const adminSessionCookie = request.cookies.get('vorquen_admin_session')?.value;

    if (!adminSessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
