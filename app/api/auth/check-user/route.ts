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

    // STEP 1: Check auth.users table first (this is where OAuth users are created)
    // List all users and find by email since admin.listUsers doesn't have email filter
    const { data: authUsersData, error: authListError } = await supabase.auth.admin.listUsers();
    
    if (authListError) {
      console.error('[Check User] Error listing auth users:', authListError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // Find user by email in auth.users
    const authUser = authUsersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (!authUser) {
      // User doesn't exist in auth.users at all
      console.log('[Check User] User not found in auth.users:', normalizedEmail);
      return NextResponse.json({
        exists: false,
        hasPassword: false,
        needsPasswordSetup: false,
        userId: null
      });
    }

    console.log('[Check User] User found in auth.users:', authUser.id, authUser.email);

    // STEP 2: Check if user has a profile in user_profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, has_completed_onboarding')
      .eq('user_id', authUser.id)
      .maybeSingle();

    // Check for database errors
    if (profileError) {
      console.error('[Check User] Database query error on user_profiles:', profileError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // STEP 3: Get authentication provider information
    const { data: authUserDetails, error: authError } = await supabase.auth.admin.getUserById(authUser.id);

    if (authError) {
      console.error('[Check User] Error fetching auth user details:', authError);
    }

    // Check identities from auth user data
    const identities = authUserDetails?.user?.identities || authUser.identities || [];
    
    // Check if user has 'email' provider (password auth)
    const hasEmailProvider = identities.some((identity: any) => identity.provider === 'email');
    
    // Check if user has 'google' provider (Google OAuth)
    const hasGoogleProvider = identities.some((identity: any) => identity.provider === 'google');
    
    // User has authentication if they have email OR google provider
    const hasAuthentication = hasEmailProvider || hasGoogleProvider;
    
    // Only need password setup if user exists but has NO authentication method at all
    const needsPasswordSetup = !hasAuthentication;

    // Check onboarding status
    const hasCompletedOnboarding = profileData?.has_completed_onboarding || false;

    console.log(`[Check User] ${normalizedEmail}: exists=true, hasEmail=${hasEmailProvider}, hasGoogle=${hasGoogleProvider}, hasAuth=${hasAuthentication}, needsSetup=${needsPasswordSetup}, hasProfile=${!!profileData}, onboardingComplete=${hasCompletedOnboarding}`);

    return NextResponse.json({
      exists: true,
      hasPassword: hasAuthentication, // True if they have ANY auth method (email or google)
      hasGoogleAuth: hasGoogleProvider,
      needsPasswordSetup: needsPasswordSetup,
      userId: authUser.id,
      hasCompletedOnboarding: hasCompletedOnboarding
    });

  } catch (err) {
    console.error('[Check User] Error:', err);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
