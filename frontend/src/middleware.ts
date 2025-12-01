import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip maintenance check for maintenance page itself and static files
  if (
    pathname === '/maintenance' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    // Check maintenance status
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${apiUrl}/settings/public/maintenance`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const maintenanceStatus = data.data || data;

      // If maintenance mode is enabled, redirect to maintenance page
      if (maintenanceStatus.enabled === true) {
        const url = request.nextUrl.clone();
        url.pathname = '/maintenance';
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    // If we can't check maintenance status, allow access
    console.error('Failed to check maintenance status:', error);
  }

  return NextResponse.next();
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

