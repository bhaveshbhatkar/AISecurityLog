import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to public pages (login and register)
    const publicRoutes = ['/login', '/register'];
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Check for authentication cookie/session
    // Note: This is a basic implementation. In production, you should verify the session token
    const authCookie = request.cookies.get('session') || request.cookies.get('auth_token');

    // If no auth cookie and trying to access protected route, redirect to login
    if (!authCookie) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// Configure which routes to protect
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
