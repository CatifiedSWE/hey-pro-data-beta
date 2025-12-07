import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Check if a user exists and whether they have a password set
 * Used in onboarding flow to determine authentication path
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    const supabase = createServerClient();

    // Check if user exists in user_profiles
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('user_id, email, has_completed_onboarding')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!profileData) {
      // User doesn't exist
      return NextResponse.json({
        exists: false,
        hasPassword: false,
        needsPasswordSetup: false,
        userId: null
      });
    }

    // User exists - now check if they have any authentication method
    // Check auth.identities table to see what providers they have
    const { data: identities, error: identitiesError } = await supabase
      .from('identities')
      .select('provider')
      .eq('user_id', profileData.user_id);

    if (identitiesError) {
      console.error('[Check User] Error checking identities:', identitiesError);
    }

    // Check if user has 'email' provider (password auth)
    const hasEmailProvider = identities?.some(identity => identity.provider === 'email');
    
    // Check if user has 'google' provider (Google OAuth)
    const hasGoogleProvider = identities?.some(identity => identity.provider === 'google');
    
    // User has authentication if they have email OR google provider
    const hasAuthentication = hasEmailProvider || hasGoogleProvider;
    
    // Only need password setup if user exists but has NO authentication method at all
    const needsPasswordSetup = !hasAuthentication;

    console.log(`[Check User] ${normalizedEmail}: exists=true, hasEmail=${hasEmailProvider}, hasGoogle=${hasGoogleProvider}, hasAuth=${hasAuthentication}, needsSetup=${needsPasswordSetup}`);

    return NextResponse.json({
      exists: true,
      hasPassword: hasAuthentication, // True if they have ANY auth method (email or google)
      hasGoogleAuth: hasGoogleProvider,
      needsPasswordSetup: needsPasswordSetup,
      userId: profileData.user_id,
      hasCompletedOnboarding: profileData.has_completed_onboarding
    });

  } catch (err) {
    console.error('[Check User] Error:', err);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
