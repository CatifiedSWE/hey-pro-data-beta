'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LandingHero } from './components/landing/LandingHero';
import { supabase } from '@/lib/supabase/client';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // If there's an OAuth code, redirect to the API callback handler
      if (code) {
        console.log('[Root Page] OAuth code detected, redirecting to callback handler...');
        
        // Check if there's a stored redirect destination
        const storedRedirect = localStorage.getItem('auth_redirect_after_login');
        const nextParam = storedRedirect ? `&next=${encodeURIComponent(storedRedirect)}` : '';
        
        // Clean up localStorage
        if (storedRedirect) {
          localStorage.removeItem('auth_redirect_after_login');
        }
        
        // Redirect to server-side callback handler
        window.location.href = `/api/auth/callback?code=${code}${nextParam}`;
        return;
      }

      // No OAuth code - check if user is already authenticated
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
          router.push('/profile');
        } else {
          // User hasn't completed onboarding → redirect to onboarding
          router.push('/onboarding');
        }
      }
    };

    handleOAuthCallback();
  }, [code, router]);

  // Show landing page (will be briefly shown before redirects)
  return <LandingHero />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<LandingHero />}>
      <HomePageContent />
    </Suspense>
  );
}