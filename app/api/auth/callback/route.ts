import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * OAuth Callback Handler (Server-Side)
 * Handles OAuth redirects and exchanges code for session
 * Sets proper HTTP cookies for SSR middleware
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/profile';

  console.log('[Auth Callback API] Processing OAuth callback...');

  if (!code) {
    console.error('[Auth Callback API] No code provided');
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  const cookieStore = await cookies();

  // Create Supabase server client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Cookie setting might fail in middleware, but that's okay
            console.error('[Auth Callback API] Cookie set error:', error);
          }
        },
      },
    }
  );

  try {
    // Exchange code for session - this sets the session cookies
    console.log('[Auth Callback API] Exchanging code for session...');
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('[Auth Callback API] Session exchange error:', sessionError);
      return NextResponse.redirect(new URL('/login?error=session_error', request.url));
    }

    if (!session) {
      console.error('[Auth Callback API] No session returned');
      return NextResponse.redirect(new URL('/login?error=no_session', request.url));
    }

    console.log('[Auth Callback API] Session created successfully');

    // Check if user has a complete profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, surname')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profile || !profile.first_name || !profile.surname) {
        console.log('[Auth Callback API] No complete profile, redirecting to form');
        return NextResponse.redirect(new URL('/form', request.url));
      }

      console.log('[Auth Callback API] Profile found, redirecting to:', next);
      return NextResponse.redirect(new URL(next, request.url));
    } catch (profileError) {
      console.error('[Auth Callback API] Profile check error:', profileError);
      // If profile check fails, redirect to form to be safe
      return NextResponse.redirect(new URL('/form', request.url));
    }
  } catch (error) {
    console.error('[Auth Callback API] Unexpected error:', error);
    return NextResponse.redirect(new URL('/login?error=unexpected', request.url));
  }
}
