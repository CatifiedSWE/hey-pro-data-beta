-- Migration: Add nationality and passport_expiry_date columns to user_visa_info table
-- Created: 2025-01-XX
-- Description: Adds missing nationality and passport expiry date fields to visa information

-- Add nationality column
ALTER TABLE user_visa_info 
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);

-- Add passport_expiry_date column
ALTER TABLE user_visa_info 
ADD COLUMN IF NOT EXISTS passport_expiry_date DATE;

-- Add comment to the table for documentation
COMMENT ON COLUMN user_visa_info.nationality IS 'User nationality/citizenship';
COMMENT ON COLUMN user_visa_info.passport_expiry_date IS 'Passport expiry date';
