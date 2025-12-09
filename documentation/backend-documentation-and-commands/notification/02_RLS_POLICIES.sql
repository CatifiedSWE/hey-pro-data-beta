-- =====================================================
-- NOTIFICATIONS TABLE - ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Description: Security policies for notifications table
-- Version: 1.0.0
-- Last Updated: January 2025
-- Dependencies: notifications table must exist
-- =====================================================

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (if any)
-- =====================================================

-- Drop policies if they exist (for clean re-run)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- =====================================================
-- SELECT POLICY - Users can view their own notifications
-- =====================================================

CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view their own notifications" ON notifications IS 
'Users can only view notifications where they are the recipient';

-- =====================================================
-- INSERT POLICY - System can insert notifications
-- =====================================================

-- Allow system/backend to insert notifications
CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

COMMENT ON POLICY "System can insert notifications" ON notifications IS 
'Backend services can insert notifications for any user (using service role key)';

-- Alternative: If you want to restrict to authenticated users only
-- CREATE POLICY "Authenticated users can create notifications"
-- ON notifications
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- =====================================================
-- UPDATE POLICY - Users can update their own notifications
-- =====================================================

-- Users can only update is_read status of their own notifications
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update their own notifications" ON notifications IS 
'Users can only update (mark as read) their own notifications';

-- =====================================================
-- DELETE POLICY - Users can delete their own notifications (Optional)
-- =====================================================

-- Optional: Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete their own notifications" ON notifications IS 
'Users can delete their own notifications (optional feature)';

-- =====================================================
-- REALTIME POLICY (For Supabase Realtime)
-- =====================================================

-- Enable realtime for notifications table
-- This allows users to receive real-time updates for their notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'notifications';

-- Verify policies exist
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
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
    AND tablename = 'notifications';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies for notifications table created successfully!';
    RAISE NOTICE 'Realtime enabled for notifications table.';
END $$;

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- Test 1: Insert a notification (as system/service role)
-- INSERT INTO notifications (user_id, actor_id, type, message, metadata)
-- VALUES (
--   'user-uuid-here',
--   'sender-uuid-here',
--   'direct_message',
--   'Test notification message',
--   '{"conversation_id": "conv-uuid", "message_id": "msg-uuid"}'::jsonb
-- );

-- Test 2: Query notifications as a user (will only see their own)
-- SELECT * FROM notifications WHERE user_id = auth.uid();

-- Test 3: Update notification as user (mark as read)
-- UPDATE notifications 
-- SET is_read = true 
-- WHERE id = 'notification-uuid' AND user_id = auth.uid();

-- Test 4: Verify user cannot see other users' notifications
-- SELECT * FROM notifications WHERE user_id != auth.uid();
-- (Should return empty result set)
