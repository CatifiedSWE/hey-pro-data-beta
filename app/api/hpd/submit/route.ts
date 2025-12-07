import { NextRequest, NextResponse } from 'next/server';
import { sendWaitlistAcknowledgement } from '@/lib/email/acknowledgement';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_type, source, submitted_fields, timestamp, session_id, meta } = body;

    // 1. Validate required fields (basic)
    if (!user_type || !submitted_fields) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique ID for this submission
    const submissionId = crypto.randomUUID();
    
    // Log the submission details
    console.log(`[Waitlist Submission] ID: ${submissionId}`);
    console.log(`[Waitlist Submission] Type: ${user_type}`);
    console.log(`[Waitlist Submission] Email: ${submitted_fields.email}`);
    console.log(`[Waitlist Submission] Name: ${submitted_fields.firstName || submitted_fields.companyName || 'N/A'}`);
    console.log(`[Waitlist Submission] Data:`, JSON.stringify(submitted_fields, null, 2));

    // Send Acknowledgement Email to User (non-blocking)
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
      id: submissionId,
      isAuthenticated: false,
      onboardingComplete: false,
      emailSent: emailSent
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
