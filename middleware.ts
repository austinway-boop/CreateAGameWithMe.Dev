import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/onboarding',
  '/create',
  '/idea',
  '/ikigai',
  '/sparks',
  '/remix',
  '/finalize',
  '/gameloop',
  '/card',
  '/questions',
  '/skilltree',
  '/validation',
  '/validation',
];

export function middleware(request: NextRequest) {
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Check for session token cookie
  const sessionToken = request.cookies.get('authjs.session-token') || 
                       request.cookies.get('__Secure-authjs.session-token');

  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ],
};
