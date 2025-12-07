import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

// Routes that don't require authentication
const publicRoutes = [
  '/',              // Landing page
  '/login',
  '/signup',
  '/otp',
  '/callback',
  '/forget-password',
  '/reset-password',
  '/form',
  '/help',
  '/onboarding',    // Allow onboarding for both auth and non-auth users
];

// Routes that authenticated users should be redirected away from
const authRoutes = ['/login', '/signup'];

// Routes that require authentication
const protectedRoutes = [
  '/home',
  '/profile',
  '/dashboard',
  '/crew',
  '/gigs',
  '/collab',
  '/whatson',
  '/notifications',
  '/settings',
  '/slate',
  '/jobs',
  '/create',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Allow public routes without authentication check
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check if Supabase env variables are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // If no Supabase configured, redirect protected routes to login
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    if (isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get the session from cookies - OAuth callback API route sets these properly
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;
  const userId = session?.user?.id;
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Special handling for landing page (/)
  if (pathname === '/' && isAuthenticated && userId) {
    // Check onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('has_completed_onboarding')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profile?.has_completed_onboarding) {
      // Completed onboarding → redirect to profile
      return NextResponse.redirect(new URL('/profile', request.url));
    } else {
      // Not completed onboarding → redirect to onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Special handling for onboarding page
  if (pathname.startsWith('/onboarding') && isAuthenticated && userId) {
    // Check if user already completed onboarding
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('has_completed_onboarding')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profile?.has_completed_onboarding) {
      // Already completed → redirect to profile
      return NextResponse.redirect(new URL('/profile', request.url));
    }
    // Otherwise, allow access to complete onboarding
  }

  // Redirect authenticated users away from auth pages (login/signup)
  if (isAuthenticated && isAuthRoute) {
    // Check onboarding status before redirecting
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profile?.has_completed_onboarding) {
        return NextResponse.redirect(new URL('/profile', request.url));
      } else {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }
    return NextResponse.redirect(new URL('/slate', request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
