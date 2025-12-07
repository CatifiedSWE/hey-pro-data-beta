import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { LandingHero } from './components/landing/LandingHero';

export default async function HomePage() {
  const cookieStore = await cookies();
  
  // Create Supabase server client
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Check authentication status
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // User is authenticated, check onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('has_completed_onboarding')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profile?.has_completed_onboarding) {
      // User completed onboarding → redirect to profile
      redirect('/profile');
    } else {
      // User hasn't completed onboarding → redirect to onboarding
      redirect('/onboarding');
    }
  }
  
  // Not authenticated → show landing page
  return <LandingHero />;
}