import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, AUTH_SECRET } from './lib/auth';

const authSecret = new TextEncoder().encode(AUTH_SECRET);

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token, authSecret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const isAuthenticated = await hasValidSession(request);
  const { pathname } = request.nextUrl;

  if (pathname === '/login' || pathname === '/signup') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  if (pathname.startsWith('/app')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup', '/app/:path*'],
};
