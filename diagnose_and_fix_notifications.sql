-- =====================================================
-- NOTIFICATION SYSTEM DIAGNOSIS AND FIX
-- =====================================================
-- Run this script in your Supabase SQL Editor to:
-- 1. Check current notification data
-- 2. Identify test/hardcoded data
-- 3. Clean up if needed
-- 4. Verify system configuration
-- =====================================================

-- =====================================================
-- STEP 1: CHECK CURRENT NOTIFICATIONS
-- =====================================================
DO $$
DECLARE
    notification_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notification_count FROM notifications;
    RAISE NOTICE '';
    RAISE NOTICE '========== STEP 1: CURRENT NOTIFICATIONS ==========';
    RAISE NOTICE 'Total notifications in database: %', notification_count;
    RAISE NOTICE '';
END $$;

-- Show recent notifications
SELECT 
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY created_at DESC) = 1 THEN '========== RECENT NOTIFICATIONS =========='
        ELSE ''
    END as separator,
    id,
    user_id,
    type,
    SUBSTRING(message, 1, 50) as message_preview,
    is_read,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 2: IDENTIFY TEST/HARDCODED DATA
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== STEP 2: IDENTIFYING TEST DATA ==========';
END $$;

-- Check for common test notification patterns
SELECT 
    '>>> POSSIBLE TEST NOTIFICATIONS <<<' as alert,
    id,
    type,
    message,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
FROM notifications
WHERE 
    message LIKE '%job match%' OR
    message LIKE '%Event reminder%' OR
    message LIKE '%Application update%' OR
    message LIKE '%State Post%' OR
    message LIKE '%TechCorp%' OR
    message LIKE '%Product Manager%' OR
    message LIKE '%Tech Networking%' OR
    type NOT IN ('chat_message', 'direct_message', 'conversation_request', 'group_message')
ORDER BY created_at DESC;

-- =====================================================
-- STEP 3: NOTIFICATION STATISTICS
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== STEP 3: NOTIFICATION STATISTICS ==========';
END $$;

-- Count by type
SELECT 
    type,
    COUNT(*) as count,
    SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- Count by user (top 10)
SELECT 
    user_id,
    COUNT(*) as notification_count,
    SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count
FROM notifications
GROUP BY user_id
ORDER BY notification_count DESC
LIMIT 10;

-- =====================================================
-- STEP 4: CHECK TABLE STRUCTURE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== STEP 4: TABLE STRUCTURE ==========';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'notifications'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 5: CHECK RLS POLICIES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== STEP 5: ROW LEVEL SECURITY ==========';
END $$;

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'notifications';

-- Show policies
SELECT
    policyname,
    permissive,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- =====================================================
-- STEP 6: CHECK INDEXES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== STEP 6: INDEXES ==========';
END $$;

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
ORDER BY indexname;

-- =====================================================
-- STEP 7: CHECK REALTIME CONFIGURATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== STEP 7: REALTIME CONFIGURATION ==========';
END $$;

SELECT 
    schemaname,
    tablename,
    'Realtime ENABLED' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
    AND tablename = 'notifications'
UNION ALL
SELECT 
    'public' as schemaname,
    'notifications' as tablename,
    'Realtime NOT ENABLED' as status
WHERE NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
);

-- =====================================================
-- STEP 8: RECOMMENDATIONS
-- =====================================================
DO $$
DECLARE
    test_notification_count INTEGER;
    rls_enabled BOOLEAN;
    realtime_enabled BOOLEAN;
BEGIN
    -- Count test notifications
    SELECT COUNT(*) INTO test_notification_count
    FROM notifications
    WHERE 
        message LIKE '%job match%' OR
        message LIKE '%Event reminder%' OR
        message LIKE '%Application update%' OR
        type NOT IN ('chat_message', 'direct_message', 'conversation_request', 'group_message');
    
    -- Check RLS
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'notifications';
    
    -- Check Realtime
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) INTO realtime_enabled;
    
    RAISE NOTICE '';
    RAISE NOTICE '========== STEP 8: RECOMMENDATIONS ==========';
    RAISE NOTICE '';
    
    IF test_notification_count > 0 THEN
        RAISE NOTICE '⚠️  FOUND % TEST/MOCK NOTIFICATIONS', test_notification_count;
        RAISE NOTICE '    Action: Run cleanup script below to remove them';
    ELSE
        RAISE NOTICE '✅ No test notifications found';
    END IF;
    
    IF NOT rls_enabled THEN
        RAISE NOTICE '⚠️  ROW LEVEL SECURITY IS DISABLED';
        RAISE NOTICE '    Action: Enable RLS with the commands below';
    ELSE
        RAISE NOTICE '✅ Row Level Security is enabled';
    END IF;
    
    IF NOT realtime_enabled THEN
        RAISE NOTICE '⚠️  REALTIME IS NOT ENABLED';
        RAISE NOTICE '    Action: Enable realtime with the command below';
    ELSE
        RAISE NOTICE '✅ Realtime is enabled';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- =====================================================
-- CLEANUP COMMANDS (RUN THESE IF NEEDED)
-- =====================================================

-- ⚠️  UNCOMMENT BELOW TO DELETE TEST NOTIFICATIONS ⚠️
-- WARNING: This will permanently delete notifications

/*
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== CLEANING UP TEST NOTIFICATIONS ==========';
END $$;

-- Delete test notifications
DELETE FROM notifications
WHERE 
    message LIKE '%job match%' OR
    message LIKE '%Event reminder%' OR
    message LIKE '%Application update%' OR
    message LIKE '%State Post%' OR
    message LIKE '%TechCorp%' OR
    message LIKE '%Product Manager%' OR
    message LIKE '%Tech Networking%' OR
    type NOT IN ('chat_message', 'direct_message', 'conversation_request', 'group_message');

-- OR delete ALL notifications to start fresh
-- DELETE FROM notifications;

DO $$
BEGIN
    RAISE NOTICE 'Test notifications deleted successfully';
END $$;
*/

-- =====================================================
-- FIX COMMANDS (RUN THESE IF ISSUES FOUND)
-- =====================================================

-- Enable RLS if disabled
/*
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
*/

-- Create RLS policies if missing
/*
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create new policies
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid() = user_id);
*/

-- Enable Realtime if not enabled
/*
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
*/

-- =====================================================
-- FINAL SUMMARY
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'NOTIFICATION SYSTEM DIAGNOSIS COMPLETE';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review the output above for any issues';
    RAISE NOTICE '2. If test notifications found, uncomment cleanup section and run';
    RAISE NOTICE '3. If RLS or Realtime issues found, uncomment fix commands and run';
    RAISE NOTICE '4. Test by sending a chat message';
    RAISE NOTICE '5. Check frontend console for [useNotifications] logs';
    RAISE NOTICE '';
END $$;
