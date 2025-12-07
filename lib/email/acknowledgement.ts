/**
 * Email Acknowledgement Handler
 * Sends waitlist acknowledgement emails using Supabase
 */

import { createServerClient } from '@/lib/supabase/server';

interface AcknowledgementEmailData {
  email: string;
  name: string;
  userType: string;
}

/**
 * Send acknowledgement email to waitlist user
 * Uses Supabase's built-in email functionality
 */
export async function sendWaitlistAcknowledgement(
  data: AcknowledgementEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { email, name, userType } = data;

    // Create a simple email subject and body
    const subject = 'Thank you for joining the waitlist!';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Thank you for joining the waitlist!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hi ${name},
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          We've received your details and you're now on the waitlist as a <strong>${userType}</strong>.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          We're onboarding in batches to keep things organized and ensure the best experience. 
          We'll email you when your turn opens up!
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Thank you for your patience.
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 14px;">
            Best regards,<br/>
            The HeyProData Team
          </p>
        </div>
      </div>
    `;

    // Use Supabase's admin invite function to send email
    // This leverages Supabase's built-in email infrastructure
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        email_subject: subject,
        email_body: emailBody,
        type: 'waitlist_acknowledgement',
        user_type: userType,
        name: name
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding`
    });

    if (error) {
      console.error('[Acknowledgement Email] Error:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Acknowledgement Email] Successfully sent to ${email}`);
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Acknowledgement Email] Exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Alternative: Send email using direct SMTP (if configured in Supabase)
 * This can be used if the inviteUserByEmail approach doesn't fit your needs
 */
export async function sendSimpleAcknowledgement(
  email: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // This is a placeholder for custom email sending logic
    // You would implement this based on your Supabase email configuration
    
    console.log(`[Simple Acknowledgement] Would send to ${email}`);
    
    // For now, return success
    // In production, implement actual email sending here
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
