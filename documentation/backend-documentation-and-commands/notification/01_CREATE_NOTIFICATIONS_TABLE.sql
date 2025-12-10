-- =====================================================
-- NOTIFICATIONS TABLE - TABLE CREATION
-- =====================================================
-- Description: Creates notifications table for chat messages and system events
-- Version: 1.0.0
-- Last Updated: January 2025
-- Dependencies: auth.users table must exist
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
-- Purpose: Store all user notifications (chat messages, system events, etc.)
-- Relationships: 
--   - user_id → auth.users (recipient)
--   - actor_id → auth.users (trigger user)
-- =====================================================

-- Check if table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        CREATE TABLE notifications (
            -- Primary Key
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            
            -- User References
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            
            -- Notification Content
            type TEXT NOT NULL CHECK (type IN (
                'chat_message',           -- Generic chat message
                'direct_message',         -- Approved conversation message
                'conversation_request',   -- Unapproved conversation message
                'group_message',          -- Group chat message
                'application_received',   -- Gig application received
                'status_changed',         -- Application status changed
                'interest_expressed',     -- Interest in collab post
                'collab_invitation',      -- Invited to collaborate
                'event_rsvp',            -- Event RSVP notification
                'system_notification'    -- System-level notification
            )),
            
            title TEXT CHECK (title IS NULL OR char_length(title) <= 200),
            message TEXT NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
            
            -- Status
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            
            -- Metadata (JSONB for flexibility)
            -- Expected structure for chat notifications:
            -- {
            --   "conversation_id": "uuid",
            --   "message_id": "uuid",
            --   "sender_id": "uuid",
            --   "content": "message preview...",
            --   "chatroom_id": "uuid" (for group chats),
            --   "requires_approval": false
            -- }
            metadata JSONB DEFAULT '{}'::jsonb,
            
            -- Timestamps
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE 'Notifications table created successfully';
    ELSE
        -- Table exists, add missing columns if they don't exist
        RAISE NOTICE 'Notifications table already exists, checking for missing columns...';
        
        -- Add actor_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='actor_id') THEN
            ALTER TABLE notifications ADD COLUMN actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added actor_id column to notifications table';
        END IF;
        
        -- Add title if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='title') THEN
            ALTER TABLE notifications ADD COLUMN title TEXT CHECK (title IS NULL OR char_length(title) <= 200);
            RAISE NOTICE 'Added title column to notifications table';
        END IF;
        
        -- Add metadata if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='metadata') THEN
            ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added metadata column to notifications table';
        END IF;
        
        RAISE NOTICE 'All missing columns added successfully';
    END IF;
END $$;

-- =====================================================
-- TABLE COMMENTS
-- =====================================================
COMMENT ON TABLE notifications IS 'User notifications for chat messages and system events';
COMMENT ON COLUMN notifications.id IS 'Unique notification identifier';
COMMENT ON COLUMN notifications.user_id IS 'Recipient of the notification';
COMMENT ON COLUMN notifications.actor_id IS 'User who triggered the notification (e.g., message sender)';
COMMENT ON COLUMN notifications.type IS 'Type of notification (chat_message, direct_message, conversation_request, etc.)';
COMMENT ON COLUMN notifications.title IS 'Optional short title for the notification (max 200 chars)';
COMMENT ON COLUMN notifications.message IS 'Notification message content (1-1000 chars)';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN notifications.metadata IS 'JSON object containing contextual data (conversation_id, message_id, sender_id, content, etc.)';
COMMENT ON COLUMN notifications.created_at IS 'When the notification was created';
COMMENT ON COLUMN notifications.updated_at IS 'When the notification was last updated';

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notifications
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

COMMENT ON FUNCTION update_notifications_updated_at() IS 'Automatically updates updated_at timestamp on row modification';
COMMENT ON TRIGGER trigger_notifications_updated_at ON notifications IS 'Trigger to update updated_at on every update';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Verify table was created with correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Verify constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
ORDER BY contype, conname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Notifications table created successfully!';
END $$;
