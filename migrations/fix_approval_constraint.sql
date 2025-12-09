-- =====================================================
-- FIX APPROVAL CONSTRAINT FOR CONVERSATIONS
-- =====================================================
-- Description: Removes the overly restrictive check_approved_by_recipient constraint
-- Issue: The constraint was blocking legitimate approvals
-- Solution: Drop the constraint to allow dynamic recipient approval
-- Date: January 2025
-- =====================================================

-- Drop the problematic constraint if it exists
ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS check_approved_by_recipient;

-- Optional: Add a more flexible constraint that just ensures approved_by is one of the participants
ALTER TABLE conversations
ADD CONSTRAINT check_approved_by_is_participant 
CHECK (
    approved_by IS NULL 
    OR approved_by = user1_id 
    OR approved_by = user2_id
);

-- Add comments
COMMENT ON CONSTRAINT check_approved_by_is_participant ON conversations 
IS 'Ensures that only participants can approve conversations';

-- Verification query
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'conversations'::regclass
    AND contype = 'c'  -- CHECK constraints
ORDER BY conname;
