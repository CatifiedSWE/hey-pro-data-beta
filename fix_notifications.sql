-- =====================================================
-- FIX NOTIFICATIONS - Remove hardcoded/test data
-- =====================================================
-- This script will clean up any test/mock notifications
-- and verify the notification system is working correctly
-- =====================================================

-- Step 1: Check current notifications in the database
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    is_read,
    created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 20;

-- Step 2: Delete all existing notifications (OPTIONAL - uncomment if you want to start fresh)
-- WARNING: This will delete ALL notifications. Only run this if you want to clear test data.
-- DELETE FROM notifications WHERE type NOT IN ('chat_message', 'direct_message', 'conversation_request');

-- Step 3: Verify the notifications table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Step 4: Check if RLS policies are properly configured
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notifications';

-- Step 5: Verify indexes exist for performance
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
ORDER BY indexname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Notification system verification complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review the notifications in the output above';
    RAISE NOTICE '2. If you see test data, uncomment the DELETE statement and run again';
    RAISE NOTICE '3. Send a test message to verify notifications are created';
    RAISE NOTICE '4. Check the frontend to confirm real-time updates';
END $$;
