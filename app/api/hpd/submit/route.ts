import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { sendWaitlistAcknowledgement } from '@/lib/email/acknowledgement';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_type, source, submitted_fields, timestamp, session_id, meta } = body;

    // 1. Validate required fields (basic)
    if (!user_type || !submitted_fields) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();

    // 2. Check if user is authenticated
    const cookieStore = await cookies();
    const supabaseSSR = createSSRClient(
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
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    const { data: { user } } = await supabaseSSR.auth.getUser();

    // 3. Insert into onboarding_submissions table
    const { data, error } = await supabase
      .from('onboarding_submissions')
      .insert([
        {
          user_type,
          source: source || 'Landing Guide',
          submitted_fields,
          session_id,
          meta: meta || {},
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      // Handle duplicates
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Duplicate submission' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 4. If user is authenticated, mark onboarding as complete
    let onboardingMarkedComplete = false;
    if (user) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ has_completed_onboarding: true })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating onboarding status:', updateError);
      } else {
        onboardingMarkedComplete = true;
        console.log(`[Onboarding] Marked complete for user: ${user.id}`);
      }
    }

    // 5. Send Acknowledgement Email to User (non-blocking)
    let emailSent = false;
    const userEmail = submitted_fields.email;
    
    if (userEmail) {
      try {
        const userName = submitted_fields.firstName || submitted_fields.companyName || 'there';
        const userTypeDisplay = user_type.charAt(0).toUpperCase() + user_type.slice(1);
        
        const emailResult = await sendWaitlistAcknowledgement({
          email: userEmail,
          name: userName,
          userType: userTypeDisplay
        });
        
        emailSent = emailResult.success;
        
        if (emailResult.success) {
          console.log(`[Email Sent] Acknowledgement email sent to: ${userEmail}`);
        } else {
          console.error('[Email Error] Failed to send acknowledgement:', emailResult.error);
        }
      } catch (emailError) {
        // Email sending should never break the submission
        console.error('[Email Error] Exception during email send:', emailError);
        emailSent = false;
      }
    }
    
    // Log admin notification
    console.log(`[Notification] New ${user_type} submission from ${userEmail}`);

    return NextResponse.json({ 
      success: true,
      status: 'accepted', 
      id: data.id,
      isAuthenticated: !!user,
      onboardingComplete: onboardingMarkedComplete,
      emailSent: emailSent
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
