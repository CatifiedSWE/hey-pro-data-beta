-- =====================================================
-- ADD APPROVAL FIELDS TO CONVERSATIONS TABLE
-- =====================================================

-- Add approval fields
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add foreign key for approved_by
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_approved_by_fkey'
    ) THEN
        ALTER TABLE conversations
        ADD CONSTRAINT conversations_approved_by_fkey 
        FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_is_approved ON conversations(is_approved);
