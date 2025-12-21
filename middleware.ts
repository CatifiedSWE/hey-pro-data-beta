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
  '/callback',
  '/form',
  '/help',
  '/onboarding',    // Main onboarding flow - ONLY ENTRY POINT
  '/set-password',  // Password setup for existing users (Phase 1)
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

// Routes under development - redirect to profile page
const underDevelopmentRoutes = [
  '/gigs',
  '/collab',
  '/slate',
  '/whats-on',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🚫 BLOCK EMERGENT MONITORING IP - Remove this block when monitoring is disabled
  // This prevents excessive Supabase API calls from monitoring service (86,400+ requests/day)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || request.ip;
  
  const blockedIPs = [
    '54.89.111.208',  // AWS Emergent monitoring IP
  ];

  if (clientIp && blockedIPs.includes(clientIp)) {
    console.log(`[Middleware] Blocked monitoring IP: ${clientIp} - Path: ${pathname}`);
    return new NextResponse('Monitoring blocked', { status: 503 });
  }
  // 🚫 END IP BLOCKING

  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 🚧 TEMPORARY GATEKEEPING: Redirect all non-landing pages to landing page
  // Comment: Website under development - only landing page accessible
  if (pathname !== '/') {
    console.log(`[Middleware] Gatekeeping active: Redirecting ${pathname} to landing page`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ⏸️ COMMENTED OUT: Block access to under-development routes
  // const isUnderDevelopmentRoute = underDevelopmentRoutes.some(route => pathname.startsWith(route));
  // if (isUnderDevelopmentRoute) {
  //   console.log(`[Middleware] Blocking under-development page: ${pathname}, redirecting to /profile`);
  //   return NextResponse.redirect(new URL('/profile', request.url));
  // }

  // ⏸️ COMMENTED OUT: Allow public routes without authentication check
  // const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  // if (isPublicRoute) {
  //   return NextResponse.next();
  // }

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

  // ⏸️ COMMENTED OUT: Session check functionality (temporarily disabled during gatekeeping)
  // Special handling for landing page (/)
  // if (pathname === '/' && isAuthenticated && userId) {
  //   // Check onboarding status
  //   const { data: profile } = await supabase
  //     .from('user_profiles')
  //     .select('has_completed_onboarding')
  //     .eq('user_id', userId)
  //     .maybeSingle();
  //   
  //   if (profile?.has_completed_onboarding) {
  //     // Completed onboarding → redirect to profile
  //     return NextResponse.redirect(new URL('/profile', request.url));
  //   } else {
  //     // Not completed onboarding → redirect to onboarding
  //     return NextResponse.redirect(new URL('/onboarding', request.url));
  //   }
  // }

  // ⏸️ COMMENTED OUT: Special handling for onboarding page
  // if (pathname.startsWith('/onboarding') && isAuthenticated && userId) {
  //   // Check if user already completed onboarding
  //   const { data: profile } = await supabase
  //     .from('user_profiles')
  //     .select('has_completed_onboarding')
  //     .eq('user_id', userId)
  //     .maybeSingle();
  //   
  //   if (profile?.has_completed_onboarding) {
  //     // Already completed → redirect to profile
  //     return NextResponse.redirect(new URL('/profile', request.url));
  //   }
  //   // Otherwise, allow access to complete onboarding
  // }

  // ⏸️ COMMENTED OUT: Redirect authenticated users away from auth pages (login/signup)
  // if (isAuthenticated && isAuthRoute) {
  //   // Check onboarding status before redirecting
  //   if (userId) {
  //     const { data: profile } = await supabase
  //       .from('user_profiles')
  //       .select('has_completed_onboarding')
  //       .eq('user_id', userId)
  //       .maybeSingle();
  //     
  //     if (profile?.has_completed_onboarding) {
  //       return NextResponse.redirect(new URL('/profile', request.url));
  //     } else {
  //       return NextResponse.redirect(new URL('/onboarding', request.url));
  //     }
  //   }
  //   return NextResponse.redirect(new URL('/slate', request.url));
  // }

  // ⏸️ COMMENTED OUT: Redirect unauthenticated users to login for protected routes
  // if (!isAuthenticated && isProtectedRoute) {
  //   const redirectUrl = new URL('/login', request.url);
  //   redirectUrl.searchParams.set('redirect', pathname);
  //   return NextResponse.redirect(redirectUrl);
  // }

  return response;
}
