import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Confirmation Email API
 * Sends acknowledgment email after successful waitlist submission
 * Uses Supabase Auth email functionality
 */
export async function POST(request: NextRequest) {
  try {
    const { email, category, name } = await request.json();

    if (!email || !category) {
      return NextResponse.json(
        { success: false, error: 'Email and category are required' },
        { status: 400 }
      );
    }

    console.log(`[Confirmation Email] Sending to ${email} for category: ${category}`);

    const supabase = createServerClient();

    // Prepare email content based on category
    const categoryDisplay = {
      crew: 'Crew/Creative',
      vendor: 'Supplier/Vendor',
      agency: 'Client/Agency'
    }[category as 'crew' | 'vendor' | 'agency'] || 'Member';

    const userName = name || 'there';

    // Create email queue entry for Supabase Edge Function or direct send
    // Note: This uses the email queue table for async processing
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        to_email: email,
        subject: 'Application Received - HeyProData',
        html_content: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #ff5168; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              h1 { margin: 0; font-size: 28px; }
              .highlight { color: #ff5168; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Application Received</h1>
              </div>
              <div class="content">
                <p>Hey ${userName},</p>
                <p>Thanks for applying to join <span class="highlight">HeyProData</span> as <strong>${categoryDisplay}</strong>.</p>
                <p>We've received your details and our team will review your application. We're onboarding in batches to keep things clean and organized.</p>
                <p><strong>What happens next:</strong></p>
                <ul>
                  <li>We'll review your application within 3-5 business days</li>
                  <li>You'll receive an email when your batch opens</li>
                  <li>You'll get a secure link to set up your profile</li>
                </ul>
                <p>If you have any questions in the meantime, feel free to reach out to us at <a href="mailto:support@heyprodata.com">support@heyprodata.com</a></p>
                <p>See you soon,<br/><strong>The HeyProData Team</strong></p>
              </div>
              <div class="footer">
                <p>HeyProData - For people who make things happen in film, media and events</p>
                <p>&copy; ${new Date().getFullYear()} HeyProData. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        status: 'pending',
        metadata: {
          category,
          user_name: userName,
          sent_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[Confirmation Email] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to queue email' },
        { status: 500 }
      );
    }

    console.log(`[Confirmation Email] Email queued successfully for ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Confirmation email queued',
      email_id: data.id
    });
  } catch (error) {
    console.error('[Confirmation Email] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      },
      { status: 500 }
    );
  }
}
