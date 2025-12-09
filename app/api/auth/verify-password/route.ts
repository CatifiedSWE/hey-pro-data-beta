import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Verify user password and sign them in
 * Used in onboarding chat for existing users with completed onboarding
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    const supabase = createServerClient();

    // FIXED: Attempt authentication FIRST before checking profile
    // This ensures we get proper error messages for incorrect passwords
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (authError) {
      console.error('[Verify Password] Sign in error:', authError);
      
      // Provide user-friendly error messages based on the auth error
      if (authError.message.includes('Invalid login credentials') || 
          authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { success: false, error: 'Incorrect email or password. Please try again.' },
          { status: 401 }
        );
      }
      
      // User doesn't exist in auth system
      if (authError.message.includes('User not found')) {
        return NextResponse.json(
          { success: false, error: 'User not found. Please check your email address.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // AFTER successful authentication, check profile and onboarding status
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, has_completed_onboarding')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    // Check for database errors
    if (profileError) {
      console.error('[Verify Password] Database error:', profileError);
      return NextResponse.json(
        { success: false, error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // Check if user has a profile
    if (!profileData) {
      console.log('[Verify Password] User authenticated but no profile found:', normalizedEmail);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Your account exists but profile is missing. Please contact support.',
          needsProfile: true
        },
        { status: 400 }
      );
    }

    // Check if user has completed onboarding
    if (!profileData.has_completed_onboarding) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please complete your onboarding first by using the activation link option.',
          needsOnboarding: true
        },
        { status: 400 }
      );
    }

    console.log(`[Verify Password] User ${normalizedEmail} signed in successfully`);

    return NextResponse.json({
      success: true,
      message: 'Sign in successful',
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    });

  } catch (err) {
    console.error('[Verify Password] Error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
