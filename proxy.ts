import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';



export default async function proxy(request: NextRequest) {
  // Update session and get user info
  const { user, response } = await updateSession(request);

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboardRoute) {
    if (!user) {
      // Redirect to login if no session is active
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
    if (user.email !== ownerEmail) {
      // Redirect to home if logged-in user is not the owner
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // Redirect Hamid to dashboard if trying to access login page while already logged in
  if (request.nextUrl.pathname === '/login' && user) {
    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
    if (user.email === ownerEmail) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/assets (svg, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
