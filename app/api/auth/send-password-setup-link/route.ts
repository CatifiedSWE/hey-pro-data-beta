import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Send a password setup link (magic link) to users who exist but don't have passwords
 * Uses Supabase's password recovery flow
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

    // Check if user exists and their onboarding status - using case-insensitive comparison
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, has_completed_onboarding')
      .ilike('email', normalizedEmail)
      .single();

    // Distinguish between "user not found" (PGRST116) and actual database errors
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // User not found - this is legitimate
        console.log('[Send Password Setup] User not found:', normalizedEmail);
        return NextResponse.json(
          { success: false, error: 'User not found. Please complete onboarding first.' },
          { status: 404 }
        );
      } else {
        // Real database error
        console.error('[Send Password Setup] Database error:', profileError);
        return NextResponse.json(
          { success: false, error: 'Database error. Please try again.' },
          { status: 500 }
        );
      }
    }

    // If user doesn't exist in profiles (redundant check but kept for safety)
    if (!profileData) {
      console.log('[Send Password Setup] User not found (null data):', normalizedEmail);
      return NextResponse.json(
        { success: false, error: 'User not found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    // If user has already completed onboarding, they should use regular password reset
    if (profileData.has_completed_onboarding) {
      console.log('[Send Password Setup] User already completed onboarding:', normalizedEmail);
      return NextResponse.json(
        { 
          success: false, 
          error: 'You have already completed onboarding. Please use the sign-in page to access your account.',
          alreadyOnboarded: true
        },
        { status: 400 }
      );
    }

    // User exists but hasn't completed onboarding - send password setup link
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/set-password`
    });

    if (error) {
      console.error('[Send Password Setup] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log(`[Send Password Setup] Link sent to ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Password setup link sent to your email'
    });

  } catch (err) {
    console.error('[Send Password Setup] Error:', err);
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 });
  }
}
