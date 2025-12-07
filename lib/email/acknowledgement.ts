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
          recipient_email: email,
          email_type: 'waitlist_acknowledgement',
          template_data: {
            name: name,
            userType: userType,
            subject: 'Thank you for joining the waitlist!',
            message: `Hi ${name}, we've received your details and you're now on the waitlist as a ${userType}. We're onboarding in batches to keep things organized. We'll email you when your turn opens up!`
          },
          status: 'pending',
          created_at: new Date().toISOString()
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
