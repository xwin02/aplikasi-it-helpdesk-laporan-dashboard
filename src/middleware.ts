import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/api/auth'];
  
  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    // Not authenticated, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Verify session token
  try {
    const user = await verifySession(sessionCookie);

    if (!user) {
      // Invalid session, redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete('session');
      return response;
    }

    // Check role-based access
    // Superadmin: Full access to everything
    // Teknisi: Access to tickets, reports, knowledge-base, projects (limited actions in projects)
    // User: Only access to /tickets
    if (user.role === 'user') {
      // Regular users can only access /tickets and /profile
      const restrictedPaths = ['/reports', '/knowledge-base', '/projects'];
      
      if (restrictedPaths.some(path => pathname.startsWith(path))) {
        // Access denied, redirect to tickets
        return NextResponse.redirect(new URL('/tickets', request.url));
      }
    }
    // Superadmin and teknisi can access all pages (restrictions handled in pages)

    // Add user info to headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role);
    response.headers.set('x-user-email', user.email);

    return response;
  } catch (error) {
    // Error verifying session, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
