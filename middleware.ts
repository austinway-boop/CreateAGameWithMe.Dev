import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/create',
  '/idea',
  '/ikigai',
  '/sparks',
  '/remix',
  '/finalize',
  '/gameloop',
  '/card',
];

export default auth((req) => {
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !req.auth) {
    const loginUrl = new URL('/', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ],
};
