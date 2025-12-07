import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    const supabase = createServerClient();
    
    // Check if email exists in auth.users (using service role key if available)
    // We'll check both auth.users and user_profiles table
    
    // First check onboarding_submissions to see if they're in waitlist
    const { data: submissionData } = await supabase
      .from('onboarding_submissions')
      .select('id')
      .eq('submitted_fields->>email', normalizedEmail)
      .maybeSingle();
    
    // Also check user_profiles for registered users
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('user_id, has_completed_onboarding')
      .eq('email', normalizedEmail)
      .maybeSingle();

    const exists = !!(submissionData || profileData);
    const isRegistered = !!profileData; // They have an account
    const hasCompletedOnboarding = profileData?.has_completed_onboarding || false;

    // Log the check
    console.log(`[Email Check] ${normalizedEmail}: exists=${exists}, registered=${isRegistered}, onboarding_complete=${hasCompletedOnboarding}`);

    return NextResponse.json({ 
      exists,
      isRegistered,
      hasCompletedOnboarding,
      message: isRegistered 
        ? 'This email is registered. Please login to continue.' 
        : exists 
          ? 'This email is in our waitlist.'
          : 'Email available'
    });

  } catch (err) {
    console.error('[Email Check] Error:', err);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
