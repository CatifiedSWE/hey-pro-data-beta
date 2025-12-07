// Supabase Edge Function to send waitlist acknowledgement emails
// Deploy this function to Supabase to process the email queue

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get pending emails from queue
    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(10)

    if (fetchError) {
      throw new Error(`Failed to fetch emails: ${fetchError.message}`)
    }

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Process each email
    const results = []
    for (const emailRecord of emails) {
      try {
        const { recipient_email, template_data } = emailRecord

        // Send email using Supabase Auth
        const { error: sendError } = await supabase.auth.admin.inviteUserByEmail(
          recipient_email,
          {
            data: {
              type: 'waitlist_acknowledgement',
              name: template_data.name,
              userType: template_data.userType
            }
          }
        )

        if (sendError) {
          // Update email status to failed
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: sendError.message,
              attempts: emailRecord.attempts + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', emailRecord.id)

          results.push({ id: emailRecord.id, status: 'failed', error: sendError.message })
        } else {
          // Update email status to sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              attempts: emailRecord.attempts + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', emailRecord.id)

          results.push({ id: emailRecord.id, status: 'sent' })
        }
      } catch (error) {
        results.push({
          id: emailRecord.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ message: 'Emails processed', results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
