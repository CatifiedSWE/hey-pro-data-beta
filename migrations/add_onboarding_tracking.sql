-- =====================================================
-- ONBOARDING COMPLETION TRACKING MIGRATION
-- =====================================================
-- This migration adds onboarding completion tracking to user profiles
-- Execute this in Supabase SQL Editor
-- Date: 2025-01-XX
-- =====================================================

-- Step 1: Add has_completed_onboarding column to user_profiles table
-- Uses IF NOT EXISTS to prevent errors if column already exists
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN user_profiles.has_completed_onboarding IS 
'Tracks whether user has completed the chat-style onboarding flow. Used for routing logic.';

-- Step 3: Create index for performance when querying onboarding status
-- This index optimizes queries that check both user_id and onboarding status
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON user_profiles(user_id, has_completed_onboarding);

-- Step 4: Set existing users to completed (optional - adjust based on your needs)
-- Uncomment the line below if you want all existing users to bypass onboarding
-- UPDATE user_profiles SET has_completed_onboarding = true WHERE has_completed_onboarding IS NULL OR has_completed_onboarding = false;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the migration was successful:

-- 1. Check if column was added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND column_name = 'has_completed_onboarding';

-- 2. Check if index was created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'user_profiles' AND indexname = 'idx_user_profiles_onboarding';

-- 3. Check current onboarding status distribution
-- SELECT has_completed_onboarding, COUNT(*) as user_count 
-- FROM user_profiles 
-- GROUP BY has_completed_onboarding;

-- =====================================================
-- USAGE NOTES
-- =====================================================
-- This column is used to:
-- 1. Determine if authenticated user should be redirected to /onboarding
-- 2. Track completion of the chat-style onboarding wizard
-- 3. Gate access to main application features
-- 4. Prevent users from redoing onboarding after completion
--
-- Onboarding Flow Logic:
-- - New users (has_completed_onboarding = false) → /onboarding
-- - Completed users (has_completed_onboarding = true) → /profile
-- - Non-authenticated users on landing page → Stay on /
--
-- Default value is 'false' for all new users
-- Set to 'true' when user completes onboarding submission via /api/hpd/submit
-- =====================================================

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- If you need to rollback this migration, run:
-- DROP INDEX IF EXISTS idx_user_profiles_onboarding;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS has_completed_onboarding;
-- =====================================================
