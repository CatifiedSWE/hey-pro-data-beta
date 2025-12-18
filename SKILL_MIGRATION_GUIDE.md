# 📊 Skill Fields Migration Guide

## Problem Summary

The profile page skill editor collects the following fields on the frontend:
- `department` (skill family)
- `role` (specialty)
- `experience_level`
- `day_rate`
- `day_rate_currency`
- `is_public`
- `proficiency_level`

These fields are being stored **locally** and sent to the backend API, but the `applicant_skills` table is **missing these columns**, causing data loss.

---

## Solution

### SQL Migration File Created
**Location:** `/app/migrations/add_skill_fields_to_applicant_skills.sql`

This migration adds:
- ✅ 7 missing columns with appropriate data types
- ✅ Data validation constraints
- ✅ Performance indexes
- ✅ Documentation comments

---

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open a new query
4. Copy the contents of `/app/migrations/add_skill_fields_to_applicant_skills.sql`
5. Paste and click **Run**

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db execute -f /app/migrations/add_skill_fields_to_applicant_skills.sql
```

---

## Migration Details

### Columns Added

| Column Name | Data Type | Default | Nullable | Description |
|------------|-----------|---------|----------|-------------|
| `department` | TEXT | NULL | YES | Skill family (e.g., "Cinematography") |
| `role` | TEXT | NULL | YES | Specialty (e.g., "Director of Photography") |
| `experience_level` | TEXT | NULL | YES | Experience: "Intern", "Learning \| Assisted", "Competent \| Independent", "Expert \| Lead" |
| `day_rate` | NUMERIC(10,2) | NULL | YES | Daily rate amount (e.g., 1000.00) |
| `day_rate_currency` | VARCHAR(3) | NULL | YES | Currency code (e.g., "AED", "USD") |
| `is_public` | BOOLEAN | TRUE | NO | Whether skill/rate is publicly visible |
| `proficiency_level` | TEXT | NULL | YES | Proficiency indicator (future use) |

### Constraints Added

1. **Positive Rate Check**: Ensures `day_rate` is positive if provided
2. **Valid Currency Code**: Ensures `day_rate_currency` is 3 uppercase letters (ISO 4217)

### Indexes Added

1. `idx_applicant_skills_department` - Filter by department
2. `idx_applicant_skills_role` - Filter by role
3. `idx_applicant_skills_is_public` - Public profile queries
4. `idx_applicant_skills_user_dept_role` - Composite for common queries

---

## Verification Steps

After running the migration, verify success:

### 1. Check Columns Exist
```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'applicant_skills'
AND column_name IN ('department', 'role', 'experience_level', 'day_rate', 'day_rate_currency', 'is_public', 'proficiency_level');
```

Expected: 7 rows returned

### 2. Test Skill Update
Go to your profile page and:
1. Edit a skill
2. Fill in department, role, experience level, and rate
3. Save the skill
4. Refresh the page
5. Verify all fields are still present

### 3. Check Data in Database
```sql
SELECT user_id, skill_name, department, role, experience_level, day_rate, day_rate_currency, is_public
FROM applicant_skills
LIMIT 10;
```

---

## API Endpoints (Already Updated)

The following API endpoints are already handling these fields:

✅ `PATCH /api/skills/[id]` - Update single skill
✅ `POST /api/skills/batch` - Create multiple skills
✅ `PATCH /api/skills/batch` - Update multiple skills

**No backend code changes needed** - the API is ready!

---

## Frontend Components (Already Implemented)

The following components are already collecting these fields:

✅ `/app/(app)/profile/components/SkillEditor.tsx`
✅ `/app/(app)/profile/components/SkillFormCard.tsx`

**No frontend code changes needed** - the UI is ready!

---

## Expected Behavior After Migration

### Before Migration:
- ❌ User edits skill with department, role, rate
- ❌ Data sent to backend but not saved
- ❌ On page refresh, data is lost
- ❌ Only `skill_name` and `description` persist

### After Migration:
- ✅ User edits skill with department, role, rate
- ✅ Data sent to backend and saved to database
- ✅ On page refresh, all data persists
- ✅ All fields (department, role, experience, rate, visibility) are stored

---

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove columns
ALTER TABLE applicant_skills DROP COLUMN IF EXISTS department;
ALTER TABLE applicant_skills DROP COLUMN IF EXISTS role;
ALTER TABLE applicant_skills DROP COLUMN IF EXISTS experience_level;
ALTER TABLE applicant_skills DROP COLUMN IF EXISTS day_rate;
ALTER TABLE applicant_skills DROP COLUMN IF EXISTS day_rate_currency;
ALTER TABLE applicant_skills DROP COLUMN IF EXISTS is_public;
ALTER TABLE applicant_skills DROP COLUMN IF EXISTS proficiency_level;

-- Drop indexes
DROP INDEX IF EXISTS idx_applicant_skills_department;
DROP INDEX IF EXISTS idx_applicant_skills_role;
DROP INDEX IF EXISTS idx_applicant_skills_is_public;
DROP INDEX IF EXISTS idx_applicant_skills_user_dept_role;
```

---

## Support

If you encounter any issues:
1. Check Supabase logs for migration errors
2. Verify table permissions (RLS policies)
3. Test with a single skill update first
4. Check browser console for API errors

---

## Summary

✅ **Migration file created**: `/app/migrations/add_skill_fields_to_applicant_skills.sql`
✅ **No code changes needed**: Backend and frontend are ready
✅ **Safe to run**: Adds columns without affecting existing data
✅ **Performance optimized**: Includes indexes for fast queries

**Next Step:** Run the migration in Supabase SQL Editor! 🚀
