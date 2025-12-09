-- =====================================================
-- CHAT MODULE - ADD APPROVAL FIELDS TO CONVERSATIONS
-- =====================================================
-- Description: Adds approval mechanism fields to conversations table
-- Version: 1.1.0
-- Last Updated: January 2025
-- =====================================================

-- Add approval fields to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comments for new columns
COMMENT ON COLUMN conversations.is_approved IS 'Whether the conversation has been approved by the recipient';
COMMENT ON COLUMN conversations.approved_at IS 'Timestamp when the conversation was approved';
COMMENT ON COLUMN conversations.approved_by IS 'User who approved the conversation (usually user2)';

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_conversations_is_approved ON conversations(is_approved);

-- Verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
    AND column_name IN ('is_approved', 'approved_at', 'approved_by')
ORDER BY ordinal_position;
