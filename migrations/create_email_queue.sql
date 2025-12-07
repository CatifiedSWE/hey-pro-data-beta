-- Create email queue table for acknowledgement emails
-- This table stores emails to be sent, allowing for retry logic and monitoring

CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    template_data JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage email queue
CREATE POLICY "Service role can manage email queue" ON public.email_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to insert emails
CREATE POLICY "Authenticated can insert emails" ON public.email_queue
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at);

-- Add comment
COMMENT ON TABLE public.email_queue IS 'Queue for waitlist acknowledgement and other system emails';
