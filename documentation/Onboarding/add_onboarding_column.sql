-- =====================================================
-- ONBOARDING COMPLETION TRACKING
-- =====================================================
-- This migration adds onboarding completion tracking to user profiles
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Add has_completed_onboarding column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.has_completed_onboarding IS 'Tracks whether user has completed the onboarding flow';

-- Create index for performance when querying onboarding status
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON user_profiles(user_id, has_completed_onboarding);

-- =====================================================
-- USAGE NOTES
-- =====================================================
-- This column is used to:
-- 1. Determine if authenticated user should be redirected to onboarding
-- 2. Track completion of the chat-style onboarding wizard
-- 3. Gate access to main application features
--
-- Default value is 'false' for all existing and new users
-- Set to 'true' when user completes onboarding submission
-- =====================================================
