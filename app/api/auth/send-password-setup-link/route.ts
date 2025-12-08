import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Send a password setup link to users who need to set their password for the first time
 * Used for:
 * - Migrated users who exist in auth but haven't set a password
 * - Users who started onboarding but haven't completed it
 * Uses Supabase's resetPasswordForEmail() which handles both password reset AND first-time password setup
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

    // STEP 1: Check if user exists in auth.users (same approach as check-user API)
    // This is more reliable than email string matching
    const { data: authUsersData, error: authListError } = await supabase.auth.admin.listUsers();
    
    if (authListError) {
      console.error('[Send Password Setup] Error listing auth users:', authListError);
      return NextResponse.json(
        { success: false, error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // Find user by email in auth.users
    const authUser = authUsersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (!authUser) {
      // User doesn't exist in auth system at all
      console.log('[Send Password Setup] User not found in auth.users:', normalizedEmail);
      return NextResponse.json(
        { success: false, error: 'User not found. Please sign up first.' },
        { status: 404 }
      );
    }

    console.log('[Send Password Setup] User found in auth.users:', authUser.id, authUser.email);

    // STEP 2: Check if user has a profile using USER_ID (not email)
    // This is more reliable than email string matching
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, has_completed_onboarding')
      .eq('user_id', authUser.id)
      .maybeSingle();

    // Check for database errors (not "not found" errors)
    if (profileError) {
      console.error('[Send Password Setup] Database error on user_profiles:', profileError);
      return NextResponse.json(
        { success: false, error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // STEP 3: Determine if we should send password setup link
    let shouldSendLink = false;
    let reason = '';

    if (!profileData) {
      // Case A: Migrated user - exists in auth but no profile yet
      shouldSendLink = true;
      reason = 'migrated_user_no_profile';
      console.log(`[Send Password Setup] Migrated user detected: ${normalizedEmail}`);
    } else if (profileData.has_completed_onboarding === false || profileData.has_completed_onboarding === null) {
      // Case B: User has profile but hasn't completed onboarding
      shouldSendLink = true;
      reason = 'incomplete_onboarding';
      console.log(`[Send Password Setup] Incomplete onboarding: ${normalizedEmail}`);
    } else if (profileData.has_completed_onboarding === true) {
      // Case C: Already completed onboarding - should use sign-in instead
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

    if (!shouldSendLink) {
      // Fallback - shouldn't reach here but kept for safety
      console.error('[Send Password Setup] Unexpected state for:', normalizedEmail);
      return NextResponse.json(
        { success: false, error: 'Unable to process request. Please contact support.' },
        { status: 400 }
      );
    }

    // STEP 4: Send password setup link via email
    // Use resetPasswordForEmail() - despite the name, it works for both:
    // - Users resetting an existing password
    // - Users setting a password for the first time (recovery flow)
    // Remove trailing slash from base URL to avoid double slashes
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${baseUrl}/set-password`
    });

    if (error) {
      console.error('[Send Password Setup] Error sending email:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log(`[Send Password Setup] ✅ Link sent to ${normalizedEmail} (reason: ${reason})`);

    return NextResponse.json({
      success: true,
      message: 'Password setup link sent to your email',
      reason: reason
    });

  } catch (err) {
    console.error('[Send Password Setup] Error:', err);
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 });
  }
}
