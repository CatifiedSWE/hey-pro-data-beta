-- Migration: Add 'about' field to user_profiles table
-- This separates the 'about' section from the 'bio' section
-- Created: 2025

-- Add about column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS about TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN user_profiles.about IS 'About section - separate from bio, typically contains general information about the user';
COMMENT ON COLUMN user_profiles.bio IS 'Bio section - separate from about, typically contains professional biography';

-- Optional: Migrate existing bio content to about if about is null
-- This ensures backward compatibility
-- UPDATE user_profiles 
-- SET about = bio 
-- WHERE about IS NULL AND bio IS NOT NULL;
