import { NextRequest, NextResponse } from 'next/server';

// Webhook URLs as specified
const WEBHOOK_URLS = {
  existingUser: 'https://n8n.srv882974.hstgr.cloud/webhook/8626cfd0-07c8-4cf5-93f8-750c42fa481b',
  newUser: 'https://n8n.srv882974.hstgr.cloud/webhook/76e7b4bb-f5ed-4c1c-b17d-69c141a49ab0'
};

export async function POST(req: NextRequest) {
  try {
    const { email, exists, source } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (typeof exists !== 'boolean') {
      return NextResponse.json({ error: 'exists parameter required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Determine which webhook to call based on email existence
    const webhookUrl = exists ? WEBHOOK_URLS.existingUser : WEBHOOK_URLS.newUser;
    const webhookType = exists ? 'existing-user' : 'new-user';

    console.log(`[Landing Webhook] Triggering ${webhookType} webhook for: ${normalizedEmail}`);
    console.log(`[Landing Webhook] Source: ${source || 'unknown'}`);
    console.log(`[Landing Webhook] Webhook URL: ${webhookUrl}`);

    // Prepare payload
    const payload = {
      email: normalizedEmail,
      source: source || 'landing-page',
      timestamp: new Date().toISOString(),
      submission_date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      exists
    };

    // Trigger webhook
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Landing Webhook] Failed with status ${response.status}:`, errorText);
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      console.log(`[Landing Webhook] Successfully triggered ${webhookType} webhook`);
      
      return NextResponse.json({ 
        success: true,
        webhookTriggered: true,
        webhookType,
        message: 'Webhook triggered successfully'
      });

    } catch (webhookError) {
      console.error('[Landing Webhook] Error triggering webhook:', webhookError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to trigger webhook',
          details: webhookError instanceof Error ? webhookError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (err) {
    console.error('[Landing Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
