-- Migration: Add profile section visibility table
-- Purpose: Allow users to control visibility of profile sections (About, Skills, Credits, Languages, Contact Details, Available to Travel)

-- Create profile_section_visibility table
CREATE TABLE IF NOT EXISTS profile_section_visibility (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL CHECK (section_name IN ('about', 'skills', 'credits', 'languages', 'contact_details', 'available_to_travel')),
  is_visible BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, section_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_section_visibility_user_id ON profile_section_visibility(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE profile_section_visibility ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own visibility settings
CREATE POLICY "Users can view own visibility settings"
  ON profile_section_visibility
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Anyone can view visibility settings (needed for public profile viewing)
CREATE POLICY "Public can view visibility settings"
  ON profile_section_visibility
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own visibility settings
CREATE POLICY "Users can insert own visibility settings"
  ON profile_section_visibility
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own visibility settings
CREATE POLICY "Users can update own visibility settings"
  ON profile_section_visibility
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own visibility settings
CREATE POLICY "Users can delete own visibility settings"
  ON profile_section_visibility
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE profile_section_visibility IS 'Stores visibility settings for profile sections, allowing users to show/hide different parts of their profile';
