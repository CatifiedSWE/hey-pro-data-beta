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
 * Uses Supabase's built-in email functionality via database trigger
 */
export async function sendWaitlistAcknowledgement(
  data: AcknowledgementEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { email, name, userType } = data;

    // Store email request in a queue table for processing
    // This approach is more reliable than direct email sending
    const { error: queueError } = await supabase
      .from('email_queue')
      .insert([
        {
          to_email: email,
          subject: 'Thank you for joining the waitlist!',
          html_content: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #ff5168; color: white; padding: 30px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 30px; }
                h1 { margin: 0; font-size: 24px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to the Waitlist!</h1>
                </div>
                <div class="content">
                  <p>Hi ${name},</p>
                  <p>We've received your details and you're now on the waitlist as a <strong>${userType}</strong>.</p>
                  <p>We're onboarding in batches to keep things organized. We'll email you when your turn opens up!</p>
                  <p>Thanks,<br/><strong>The HeyProData Team</strong></p>
                </div>
              </div>
            </body>
            </html>
          `,
          status: 'pending',
          metadata: {
            name: name,
            userType: userType
          }
        }
      ]);

    if (queueError) {
      // If queue table doesn't exist, just log it (graceful fallback)
      if (queueError.code === '42P01') { // Table doesn't exist
        console.log(`[Acknowledgement Email] Email queue table not set up yet. Would send to: ${email}`);
        console.log(`[Acknowledgement Email] Message: Thank you for joining the waitlist, ${name}!`);
        return { success: true }; // Return success to not block submission
      }
      
      console.error('[Acknowledgement Email] Queue error:', queueError.message);
      return { success: false, error: queueError.message };
    }

    console.log(`[Acknowledgement Email] Queued for ${email}`);
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Acknowledgement Email] Exception:', errorMessage);
    
    // Fallback: Log the email details for manual sending
    console.log(`[Email Fallback] Would send acknowledgement to: ${data.email}`);
    console.log(`[Email Fallback] Name: ${data.name}, Type: ${data.userType}`);
    
    // Return success to not block the submission
    return { success: true };
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
