/**
 * n8n Webhook Integration
 * Sends onboarding data to respective n8n webhooks for Google Sheets storage
 */

import { OnboardingContainer } from './onboarding-storage';

// n8n Webhook URLs for each category
const WEBHOOK_URLS = {
  crew: 'https://n8n.srv882974.hstgr.cloud/webhook/9db8dabb-a3ed-4341-89b1-a8e74475d822',
  vendor: 'https://n8n.srv882974.hstgr.cloud/webhook/54878ffb-66d5-4d07-b265-5e5661af636e',
  agency: 'https://n8n.srv882974.hstgr.cloud/webhook/f1c85dc6-56cb-4fbe-8354-7099675a0388'
};

export interface N8nSubmissionResult {
  success: boolean;
  error?: string;
  webhookUrl?: string;
}

/**
 * Submit data to n8n webhook based on category
 * @param category - The user category (crew, vendor, or agency)
 * @param data - The form data to submit
 * @returns Promise with success status
 */
export async function submitToN8n(
  category: 'crew' | 'vendor' | 'agency',
  data: Record<string, any>
): Promise<N8nSubmissionResult> {
  const webhookUrl = WEBHOOK_URLS[category];

  if (!webhookUrl) {
    console.error(`[n8n] No webhook URL configured for category: ${category}`);
    return { success: false, error: 'Invalid category' };
  }

  // Prepare payload with timestamp and metadata
  const payload = {
    category,
    timestamp: new Date().toISOString(),
    submission_date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    ...data
  };

  console.log(`[n8n] Submitting to ${category} webhook:`, payload);

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
      console.error(`[n8n] Webhook failed with status ${response.status}:`, errorText);
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    console.log(`[n8n] Successfully submitted to ${category} webhook`);
    return { success: true, webhookUrl };
  } catch (error) {
    console.error('[n8n] Webhook submission error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      webhookUrl 
    };
  }
}

/**
 * Test webhook connection
 * Sends a test payload to verify the webhook is accessible
 */
export async function testWebhookConnection(
  category: 'crew' | 'vendor' | 'agency'
): Promise<N8nSubmissionResult> {
  const webhookUrl = WEBHOOK_URLS[category];
  
  console.log(`[n8n] Testing ${category} webhook connection...`);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        category,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      console.log(`[n8n] ${category} webhook is accessible`);
      return { success: true, webhookUrl };
    } else {
      console.error(`[n8n] ${category} webhook returned status: ${response.status}`);
      return { success: false, error: `Status: ${response.status}`, webhookUrl };
    }
  } catch (error) {
    console.error(`[n8n] ${category} webhook connection failed:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed',
      webhookUrl 
    };
  }
}
