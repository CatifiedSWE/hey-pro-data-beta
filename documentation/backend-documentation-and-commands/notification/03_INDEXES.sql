-- =====================================================
-- NOTIFICATIONS TABLE - INDEXES FOR PERFORMANCE
-- =====================================================
-- Description: Performance indexes for notifications table
-- Version: 1.0.0
-- Last Updated: January 2025
-- Dependencies: notifications table must exist
-- =====================================================

-- =====================================================
-- DROP EXISTING INDEXES (if any)
-- =====================================================

-- Drop indexes if they exist (for clean re-run)
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_user_id_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id_is_read;
DROP INDEX IF EXISTS idx_notifications_actor_id;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_metadata_conversation_id;
DROP INDEX IF EXISTS idx_notifications_metadata_message_id;

-- =====================================================
-- PRIMARY INDEXES
-- =====================================================

-- Index 1: user_id (most common query)
-- Purpose: Fast lookup of all notifications for a specific user
-- Used by: GET /api/notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

COMMENT ON INDEX idx_notifications_user_id IS 
'Index on user_id for fast notification retrieval by user';

-- =====================================================
-- COMPOSITE INDEXES
-- =====================================================

-- Index 2: user_id + created_at (for sorting)
-- Purpose: Fast lookup + sorting by creation time
-- Used by: GET /api/notifications (with ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

COMMENT ON INDEX idx_notifications_user_id_created_at IS 
'Composite index on user_id and created_at for sorted notification retrieval';

-- Index 3: user_id + is_read (for unread count)
-- Purpose: Fast count of unread notifications per user
-- Used by: Unread count queries, ?unread_only=true filter
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
ON notifications(user_id, is_read);

COMMENT ON INDEX idx_notifications_user_id_is_read IS 
'Composite index on user_id and is_read for unread notification filtering';

-- =====================================================
-- FOREIGN KEY INDEXES
-- =====================================================

-- Index 4: actor_id
-- Purpose: Lookup notifications triggered by a specific user
-- Used by: Analytics, user activity tracking
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id 
ON notifications(actor_id);

COMMENT ON INDEX idx_notifications_actor_id IS 
'Index on actor_id for tracking notifications by trigger user';

-- =====================================================
-- FILTER INDEXES
-- =====================================================

-- Index 5: type
-- Purpose: Filter notifications by type
-- Used by: Type-specific queries (e.g., only chat messages)
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

COMMENT ON INDEX idx_notifications_type IS 
'Index on notification type for type-based filtering';

-- Index 6: created_at (for time-based queries)
-- Purpose: Date range queries, cleanup old notifications
-- Used by: Cleanup jobs, date range filters
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

COMMENT ON INDEX idx_notifications_created_at IS 
'Index on created_at for time-based queries and cleanup operations';

-- =====================================================
-- JSONB INDEXES (for metadata queries)
-- =====================================================

-- Index 7: metadata -> conversation_id (GIN index for JSONB)
-- Purpose: Fast lookup by conversation_id in metadata
-- Used by: Finding notifications for specific conversations
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_conversation_id 
ON notifications USING GIN ((metadata -> 'conversation_id'));

COMMENT ON INDEX idx_notifications_metadata_conversation_id IS 
'GIN index on metadata.conversation_id for fast conversation-based lookups';

-- Index 8: metadata -> message_id (GIN index for JSONB)
-- Purpose: Fast lookup by message_id in metadata
-- Used by: Finding notifications for specific messages
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_message_id 
ON notifications USING GIN ((metadata -> 'message_id'));

COMMENT ON INDEX idx_notifications_metadata_message_id IS 
'GIN index on metadata.message_id for fast message-based lookups';

-- =====================================================
-- PARTIAL INDEXES (for optimization)
-- =====================================================

-- Partial Index: Only unread notifications
-- Purpose: Optimize queries that only fetch unread notifications
-- Used by: GET /api/notifications?unread_only=true
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, created_at DESC) 
WHERE is_read = FALSE;

COMMENT ON INDEX idx_notifications_unread IS 
'Partial index on unread notifications for optimized unread-only queries';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
ORDER BY indexname;

-- Check index sizes
SELECT
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
    AND relname = 'notifications'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'All indexes for notifications table created successfully!';
END $$;

-- =====================================================
-- INDEX USAGE STATISTICS (Run after some usage)
-- =====================================================

-- Query to check index usage after the app has been running
-- Run this after a few days to see which indexes are being used
/*
SELECT
    schemaname,
    tablename,
    indexrelname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename = 'notifications'
ORDER BY idx_scan DESC;
*/

-- =====================================================
-- PERFORMANCE TESTING QUERIES
-- =====================================================

-- Test Query 1: Get user notifications (should use idx_notifications_user_id_created_at)
-- EXPLAIN ANALYZE
-- SELECT * FROM notifications 
-- WHERE user_id = 'test-user-uuid' 
-- ORDER BY created_at DESC 
-- LIMIT 20;

-- Test Query 2: Count unread notifications (should use idx_notifications_user_id_is_read)
-- EXPLAIN ANALYZE
-- SELECT COUNT(*) FROM notifications 
-- WHERE user_id = 'test-user-uuid' 
--   AND is_read = FALSE;

-- Test Query 3: Get notifications by conversation (should use idx_notifications_metadata_conversation_id)
-- EXPLAIN ANALYZE
-- SELECT * FROM notifications 
-- WHERE metadata->>'conversation_id' = 'test-conversation-uuid';

-- Test Query 4: Unread only with sorting (should use idx_notifications_unread)
-- EXPLAIN ANALYZE
-- SELECT * FROM notifications 
-- WHERE user_id = 'test-user-uuid' 
--   AND is_read = FALSE 
-- ORDER BY created_at DESC 
-- LIMIT 20;
