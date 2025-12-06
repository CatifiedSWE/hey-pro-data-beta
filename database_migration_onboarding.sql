
CREATE TABLE IF NOT EXISTS public.onboarding_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_type TEXT NOT NULL,
    source TEXT DEFAULT 'Landing Guide',
    submitted_fields JSONB NOT NULL,
    session_id UUID,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.onboarding_submissions ENABLE ROW LEVEL SECURITY;

-- Allow insert from public (anon) for onboarding
CREATE POLICY "Enable insert for all users" ON public.onboarding_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow read only for admins (service role) - implicitly denied for anon
