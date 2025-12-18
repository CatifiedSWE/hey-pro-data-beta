-- =====================================================
-- Add Missing Skill Fields to applicant_skills Table
-- =====================================================
-- This migration adds columns for experience level, rates, 
-- department, role, proficiency level, and visibility settings
-- that are currently being sent from the frontend but not 
-- persisted in the database.
-- =====================================================

-- Step 1: Add new columns to applicant_skills table
-- =====================================================

-- Department (skill family like "Cinematography", "Editing", etc.)
ALTER TABLE applicant_skills 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Role (specialty like "Director of Photography", "Editor", etc.)
ALTER TABLE applicant_skills 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Experience level (e.g., "Intern", "Learning | Assisted", "Competent | Independent", "Expert | Lead")
ALTER TABLE applicant_skills 
ADD COLUMN IF NOT EXISTS experience_level TEXT;

-- Day rate (numeric value for daily rate)
ALTER TABLE applicant_skills 
ADD COLUMN IF NOT EXISTS day_rate NUMERIC(10, 2);

-- Day rate currency (3-letter currency code like "AED", "USD", "EUR")
ALTER TABLE applicant_skills 
ADD COLUMN IF NOT EXISTS day_rate_currency VARCHAR(3);

-- Is public (whether the rate card is publicly visible)
ALTER TABLE applicant_skills 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Proficiency level (for future use, already in API)
ALTER TABLE applicant_skills 
ADD COLUMN IF NOT EXISTS proficiency_level TEXT;

-- =====================================================
-- Step 2: Add check constraints for data validation
-- =====================================================

-- Ensure day_rate is positive if provided
ALTER TABLE applicant_skills
DROP CONSTRAINT IF EXISTS check_positive_day_rate;

ALTER TABLE applicant_skills
ADD CONSTRAINT check_positive_day_rate 
CHECK (day_rate IS NULL OR day_rate > 0);

-- Ensure currency code is uppercase and 3 characters if provided
ALTER TABLE applicant_skills
DROP CONSTRAINT IF EXISTS check_valid_currency_code;

ALTER TABLE applicant_skills
ADD CONSTRAINT check_valid_currency_code 
CHECK (day_rate_currency IS NULL OR (day_rate_currency ~ '^[A-Z]{3}$'));

-- =====================================================
-- Step 3: Add indexes for performance optimization
-- =====================================================

-- Index on department for filtering by skill family
CREATE INDEX IF NOT EXISTS idx_applicant_skills_department 
ON applicant_skills(department) WHERE department IS NOT NULL;

-- Index on role for filtering by specialty
CREATE INDEX IF NOT EXISTS idx_applicant_skills_role 
ON applicant_skills(role) WHERE role IS NOT NULL;

-- Index on is_public for public profile queries
CREATE INDEX IF NOT EXISTS idx_applicant_skills_is_public 
ON applicant_skills(user_id, is_public) WHERE is_public = TRUE;

-- Composite index for common queries (user + department + role)
CREATE INDEX IF NOT EXISTS idx_applicant_skills_user_dept_role 
ON applicant_skills(user_id, department, role);

-- =====================================================
-- Step 4: Add column comments for documentation
-- =====================================================

COMMENT ON COLUMN applicant_skills.department IS 'Skill family/department (e.g., Cinematography, Editing, Sound)';
COMMENT ON COLUMN applicant_skills.role IS 'Specialty/role within the department (e.g., Director of Photography, Editor)';
COMMENT ON COLUMN applicant_skills.experience_level IS 'Experience level: Intern, Learning | Assisted, Competent | Independent, Expert | Lead';
COMMENT ON COLUMN applicant_skills.day_rate IS 'Daily rate for this skill (numeric value)';
COMMENT ON COLUMN applicant_skills.day_rate_currency IS 'Currency code for day_rate (ISO 4217 format: AED, USD, EUR, etc.)';
COMMENT ON COLUMN applicant_skills.is_public IS 'Whether this skill and rate card are publicly visible on profile';
COMMENT ON COLUMN applicant_skills.proficiency_level IS 'Proficiency level indicator (for future use)';

-- =====================================================
-- Step 5: Verification Queries (commented out)
-- =====================================================

-- Verify columns were added successfully
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'applicant_skills'
-- AND column_name IN ('department', 'role', 'experience_level', 'day_rate', 'day_rate_currency', 'is_public', 'proficiency_level');

-- Check existing data in applicant_skills table
-- SELECT user_id, skill_name, department, role, experience_level, day_rate, day_rate_currency, is_public
-- FROM applicant_skills
-- LIMIT 10;

-- Count skills by department
-- SELECT department, COUNT(*) as count
-- FROM applicant_skills
-- WHERE department IS NOT NULL
-- GROUP BY department
-- ORDER BY count DESC;

-- =====================================================
-- End of Migration
-- =====================================================
