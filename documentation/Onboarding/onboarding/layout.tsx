import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  
  // If user is authenticated, check if they already completed onboarding
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('has_completed_onboarding')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // If user completed onboarding, redirect to profile
    if (profile?.has_completed_onboarding) {
      redirect('/profile');
    }
  }
  
  // Allow access to onboarding for:
  // 1. Non-authenticated users
  // 2. Authenticated users who haven't completed onboarding
  return <>{children}</>;
}
