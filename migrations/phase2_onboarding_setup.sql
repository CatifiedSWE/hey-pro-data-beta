-- =====================================================
-- Phase 2: Onboarding Waitlist Infrastructure
-- =====================================================
-- This migration creates necessary tables and storage buckets
-- for the Phase 2 waitlist implementation with n8n webhooks
-- =====================================================

-- 1. Create Supabase Storage Bucket for Onboarding Documents
-- This bucket stores vendor trade license uploads
-- =====================================================

-- Note: Storage buckets are typically created via Supabase Dashboard or CLI
-- For reference, here's the configuration:

/*
Bucket Name: onboarding-documents
Public: Yes (for easy access via public URLs)
File Size Limit: 5MB
Allowed MIME Types: 
  - application/pdf
  - image/jpeg
  - image/png
  - image/jpg

To create via Supabase Dashboard:
1. Go to Storage > Create new bucket
2. Name: onboarding-documents
3. Enable "Public bucket"
4. Set file size limit to 5MB
5. Configure allowed file types

OR via Supabase SQL:
*/

-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-documents',
  'onboarding-documents',
  true,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Set bucket policies for public read access
CREATE POLICY "Public Access for Onboarding Documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'onboarding-documents');

-- Allow authenticated and anonymous users to upload
CREATE POLICY "Allow uploads to onboarding-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'onboarding-documents');

-- =====================================================
-- 2. Create Email Queue Table for Confirmation Emails
-- =====================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_queue_updated_at
BEFORE UPDATE ON email_queue
FOR EACH ROW
EXECUTE FUNCTION update_email_queue_updated_at();

-- =====================================================
-- 3. Add RLS (Row Level Security) Policies
-- =====================================================

-- Enable RLS on email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all emails (for processing)
CREATE POLICY "Service role can access all emails"
ON email_queue FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to insert emails
CREATE POLICY "Authenticated users can insert emails"
ON email_queue FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- 4. Add Comments for Documentation
-- =====================================================

COMMENT ON TABLE email_queue IS 'Queue for storing confirmation emails to be sent to waitlist applicants';
COMMENT ON COLUMN email_queue.to_email IS 'Recipient email address';
COMMENT ON COLUMN email_queue.subject IS 'Email subject line';
COMMENT ON COLUMN email_queue.html_content IS 'HTML content of the email';
COMMENT ON COLUMN email_queue.status IS 'Status: pending, sent, or failed';
COMMENT ON COLUMN email_queue.metadata IS 'Additional metadata (category, user_name, etc.)';
COMMENT ON COLUMN email_queue.attempts IS 'Number of send attempts';

-- =====================================================
-- 5. Create Function to Process Email Queue (Optional)
-- =====================================================

-- This function can be called by a cron job or edge function
-- to process pending emails from the queue

CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS TABLE (
  processed_count INTEGER,
  failed_count INTEGER
) AS $$
DECLARE
  v_processed INTEGER := 0;
  v_failed INTEGER := 0;
  v_email RECORD;
BEGIN
  -- Get all pending emails
  FOR v_email IN 
    SELECT * FROM email_queue 
    WHERE status = 'pending' 
    AND attempts < 3
    ORDER BY created_at ASC
    LIMIT 100
  LOOP
    -- Here you would integrate with your email service
    -- For now, we'll just mark as sent
    -- In production, this would call Supabase Auth email or Resend API
    
    UPDATE email_queue
    SET 
      status = 'sent',
      sent_at = NOW(),
      attempts = attempts + 1
    WHERE id = v_email.id;
    
    v_processed := v_processed + 1;
  END LOOP;

  -- Mark failed emails (more than 3 attempts)
  UPDATE email_queue
  SET status = 'failed'
  WHERE status = 'pending' AND attempts >= 3;

  GET DIAGNOSTICS v_failed = ROW_COUNT;

  RETURN QUERY SELECT v_processed, v_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Verification Queries
-- =====================================================

-- Verify storage bucket was created
-- SELECT * FROM storage.buckets WHERE id = 'onboarding-documents';

-- Verify email_queue table exists
-- SELECT * FROM email_queue LIMIT 1;

-- Check email queue status
-- SELECT status, COUNT(*) FROM email_queue GROUP BY status;

-- =====================================================
-- End of Phase 2 Migration
-- =====================================================
