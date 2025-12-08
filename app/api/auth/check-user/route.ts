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

    // Check if user exists in user_profiles - using case-insensitive comparison
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, has_completed_onboarding')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    // Check for database errors FIRST before treating as "user not found"
    if (profileError) {
      console.error('[Check User] Database query error:', profileError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    if (!profileData) {
      // User doesn't exist (legitimate not found, not a database error)
      console.log('[Check User] User not found:', normalizedEmail);
      return NextResponse.json({
        exists: false,
        hasPassword: false,
        needsPasswordSetup: false,
        userId: null
      });
    }

    // User exists - now check if they have any authentication method
    // Check auth.users table to get provider information
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileData.user_id);

    if (authError) {
      console.error('[Check User] Error fetching auth user:', authError);
    }

    // Check identities from auth user data
    const identities = authUser?.user?.identities || [];
    
    // Check if user has 'email' provider (password auth)
    const hasEmailProvider = identities.some((identity: any) => identity.provider === 'email');
    
    // Check if user has 'google' provider (Google OAuth)
    const hasGoogleProvider = identities.some((identity: any) => identity.provider === 'google');
    
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
