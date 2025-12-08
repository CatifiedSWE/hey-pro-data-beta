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
    
    // STEP 1: Check auth.users table first (single source of truth)
    // This ensures consistency with /api/auth/check-user flow
    // Fetch ALL users with pagination to ensure we don't miss any
    let allUsers: any[] = [];
    let page = 1;
    const perPage = 1000; // Maximum allowed by Supabase
    
    while (true) {
      const { data: authUsersData, error: authListError } = await supabase.auth.admin.listUsers({
        page,
        perPage
      });
      
      if (authListError) {
        console.error('[HPD Email Check] Error listing auth users:', authListError);
        return NextResponse.json(
          { error: 'Database error. Please try again.' },
          { status: 500 }
        );
      }
      
      if (!authUsersData.users || authUsersData.users.length === 0) {
        break; // No more users to fetch
      }
      
      allUsers = allUsers.concat(authUsersData.users);
      
      // If we got less than perPage users, we've reached the end
      if (authUsersData.users.length < perPage) {
        break;
      }
      
      page++;
    }
    
    console.log(`[HPD Email Check] Fetched ${allUsers.length} total auth users`);

    // Find user by email in auth.users
    const authUser = allUsers.find(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (authUser) {
      // User exists in auth.users - they are registered
      console.log(`[HPD Email Check] ${normalizedEmail}: Found in auth.users - registered user`);
      return NextResponse.json({
        exists: true,
        isRegistered: true,
        hasCompletedOnboarding: true,
        message: 'This email is registered. Please login to continue.'
      });
    }

    // STEP 2: If not in auth.users, continue with existing logic
    // Check onboarding_submissions to see if they're in waitlist
    // Using eq for exact match on JSONB field (email is already normalized)
    const { data: submissionData, error: submissionError } = await supabase
      .from('onboarding_submissions')
      .select('id')
      .eq('submitted_fields->>email', normalizedEmail)
      .maybeSingle();
    
    // Check for database errors
    if (submissionError) {
      console.error('[Email Check] Submission query error:', submissionError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }
    
    // Also check user_profiles for registered users
    // Using case-insensitive match for email
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, has_completed_onboarding')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    // Check for database errors
    if (profileError) {
      console.error('[Email Check] Profile query error:', profileError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

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
