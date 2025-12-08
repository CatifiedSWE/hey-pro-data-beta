# Onboarding Email Inconsistency - Root Cause Analysis

## Executive Summary

**Critical Issue:** The two onboarding flows use **different data sources** to check email existence, causing contradictory results.

- **"I'm an existing member" flow** → Checks `auth.users` table
- **"I'm new - reserve my spot" flow** → Checks `user_profiles` table + `onboarding_submissions` table

This creates a **split brain problem** where the same email can be found in one flow but not the other.

---

## Flow Mapping

### Flow 1: "I'm an existing member"

**File:** `/app/lib/onboarding-chat/chatLogic.ts` (Lines 169-582)

**API Called:** `/api/auth/check-user` (Line 205)

**What it checks:**
1. ✅ `auth.users` table (primary source)
2. ✅ `user_profiles` table (secondary, to check onboarding status)
3. ✅ Uses `user_id` to link between tables (reliable)

**Code path:**
```typescript
// Line 205-211 in chatLogic.ts
const checkResponse = await fetch('/api/auth/check-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
});

const checkResult = await checkResponse.json();
```

**API Implementation:** `/app/app/api/auth/check-user/route.ts`

```typescript
// Lines 23-45: Check auth.users FIRST
const { data: authUsersData } = await supabase.auth.admin.listUsers();
const authUser = authUsersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);

if (!authUser) {
    // User doesn't exist in auth.users at all
    return NextResponse.json({
        exists: false,
        hasPassword: false,
        needsPasswordSetup: false,
        userId: null
    });
}

// Lines 50-54: THEN check user_profiles using user_id
const { data: profileData } = await supabase
    .from('user_profiles')
    .select('user_id, email, has_completed_onboarding')
    .eq('user_id', authUser.id)  // ← Uses user_id for lookup, not email!
    .maybeSingle();
```

---

### Flow 2: "I'm new - reserve my spot" (CREW/SUPPLIER/CLIENT)

**Files:** 
- `/app/lib/onboarding-chat/chatLogic.ts` (Lines 584-1032)
- `/app/lib/onboarding-chat/mockBackend.ts` (Lines 104-131)

**API Called:** `/api/hpd/check-email` (Line 111 in mockBackend.ts)

**What it checks:**
1. ✅ `onboarding_submissions` table (waitlist)
2. ✅ `user_profiles` table (registered users)
3. ❌ **DOES NOT check `auth.users` table**
4. ❌ Uses `ILIKE` on `email` column (unreliable if emails are NULL/incorrect)

**Code path:**
```typescript
// Lines 620, 800, 932 in chatLogic.ts (same call in all 3 flows)
const emailCheckResult = await checkEmail(nextFormData.email);

// mockBackend.ts lines 104-131
export const checkEmail = async (email: string) => {
    const response = await fetch('/api/hpd/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    
    return {
        exists: data.exists || false,
        isRegistered: data.isRegistered || false,
        hasCompletedOnboarding: data.hasCompletedOnboarding || false
    };
};
```

**API Implementation:** `/app/app/api/hpd/check-email/route.ts`

```typescript
// Lines 22-26: Check onboarding_submissions table
const { data: submissionData } = await supabase
    .from('onboarding_submissions')
    .select('id')
    .eq('submitted_fields->>email', normalizedEmail)
    .maybeSingle();

// Lines 39-43: Check user_profiles using EMAIL COLUMN (not user_id!)
const { data: profileData } = await supabase
    .from('user_profiles')
    .select('user_id, has_completed_onboarding')
    .ilike('email', normalizedEmail)  // ← ONLY checks email column, not auth.users!
    .maybeSingle();

// Lines 54-56: Determine existence
const exists = !!(submissionData || profileData);
const isRegistered = !!profileData;
```

---

## The Root Cause: Data Inconsistency

### Problem 1: Different Tables as Source of Truth

| Flow | Primary Table | Secondary Table | Lookup Method |
|------|---------------|-----------------|---------------|
| **Existing Member** | `auth.users` (✅ always accurate) | `user_profiles` | By `user_id` |
| **New Member** | `user_profiles` (❌ often inaccurate) | `onboarding_submissions` | By `email` column |

### Problem 2: user_profiles.email Column is Unreliable

Based on the clue provided:

> "user_profiles has many NULL emails, incorrect emails, or placeholder emails inserted during migration"

This means:
- **Migrated users** exist in `auth.users` with correct emails
- But `user_profiles.email` may be NULL or incorrect
- **"Existing member" flow** finds them ✅ (checks `auth.users`)
- **"New member" flow** MISSES them ❌ (only checks `user_profiles.email`)

### Problem 3: The Reverse Scenario

Some users may:
- Exist in `user_profiles` with an email
- NOT exist in `auth.users` (incomplete migration or waitlist users)
- **"New member" flow** finds them ✅
- **"Existing member" flow** MISSES them ❌

---

## Detailed Behavior Breakdown

### Scenario A: Migrated User with NULL/Incorrect Email in user_profiles

**User State:**
```
auth.users:
  - user_id: abc-123
  - email: "john@example.com"  ← CORRECT

user_profiles:
  - user_id: abc-123
  - email: NULL or "placeholder@example.com"  ← WRONG
  - has_completed_onboarding: false
```

**"I'm an existing member" → "Access activation link":**
1. Enters: `john@example.com`
2. API checks `auth.users` → ✅ FOUND
3. API checks `user_profiles` using `user_id = abc-123` → ✅ FOUND
4. Result: **"We've sent a password setup link"** ✅ CORRECT

**"I'm new - reserve my spot" → Enters email:**
1. Enters: `john@example.com`
2. API checks `user_profiles` WHERE `email ILIKE 'john@example.com'` → ❌ NOT FOUND (email is NULL)
3. API checks `onboarding_submissions` → ❌ NOT FOUND
4. Result: **"Email available, proceed with signup"** ❌ WRONG
5. User can complete entire signup flow
6. Tries to create duplicate account → Database constraint error

---

### Scenario B: Waitlist User (Only in user_profiles, Not in auth.users)

**User State:**
```
auth.users:
  - (user does NOT exist)

user_profiles:
  - user_id: xyz-789
  - email: "jane@example.com"  ← EXISTS
  - has_completed_onboarding: false
```

**"I'm an existing member" → "Access activation link":**
1. Enters: `jane@example.com`
2. API checks `auth.users` → ❌ NOT FOUND
3. Result: **"You're not in the system yet"** ❌ WRONG (they ARE in user_profiles)

**"I'm new - reserve my spot" → Enters email:**
1. Enters: `jane@example.com`
2. API checks `user_profiles` WHERE `email ILIKE 'jane@example.com'` → ✅ FOUND
3. Result: **"This email is already registered"** ✅ CORRECT

---

### Scenario C: Complete User (Exists in Both Tables with Matching Emails)

**User State:**
```
auth.users:
  - user_id: def-456
  - email: "alice@example.com"

user_profiles:
  - user_id: def-456
  - email: "alice@example.com"  ← MATCHES
  - has_completed_onboarding: true
```

**"I'm an existing member" → "Sign in to profile":**
1. Enters: `alice@example.com`
2. API checks `auth.users` → ✅ FOUND
3. API checks `user_profiles` using `user_id = def-456` → ✅ FOUND
4. Checks `has_completed_onboarding = true` → ✅ TRUE
5. Result: **"Welcome back! Please enter your password"** ✅ CORRECT

**"I'm new - reserve my spot" → Enters email:**
1. Enters: `alice@example.com`
2. API checks `user_profiles` WHERE `email ILIKE 'alice@example.com'` → ✅ FOUND
3. Result: **"This email is already registered"** ✅ CORRECT

---

## Environment Variables Check

### Supabase Client Initialization

**Both APIs use the same Supabase client:**

```typescript
// /app/lib/supabase/server.ts (Lines 1-13)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_service_key';

export const createServerClient = (): SupabaseClient => {
  return createClient(supabaseUrl, supabaseServiceKey);
};
```

**Used in both:**
- `/app/app/api/auth/check-user/route.ts` (Line 19)
- `/app/app/api/hpd/check-email/route.ts` (Line 15)

**Conclusion:** ✅ Both use the same Supabase project and credentials

---

## Case Normalization Analysis

### /app/app/api/auth/check-user/route.ts

```typescript
// Line 17: Normalizes email
const normalizedEmail = email.toLowerCase().trim();

// Line 34: Case-insensitive comparison
const authUser = authUsersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
```

✅ **Consistent:** Lowercase + trim

### /app/app/api/hpd/check-email/route.ts

```typescript
// Line 13: Normalizes email
const normalizedEmail = email.toLowerCase().trim();

// Line 25: Exact match on JSONB
.eq('submitted_fields->>email', normalizedEmail)

// Line 42: Case-insensitive match
.ilike('email', normalizedEmail)
```

✅ **Consistent:** Lowercase + trim + case-insensitive query

**Conclusion:** Case normalization is handled correctly in both APIs

---

## Summary of Inconsistencies

### What's Working ✅

1. Both APIs normalize email (lowercase + trim)
2. Both use the same Supabase client and credentials
3. Both check user_profiles table
4. "Existing member" flow correctly prioritizes `auth.users`

### What's Broken ❌

1. **Different primary data sources:**
   - Existing member: `auth.users` (correct)
   - New member: `user_profiles.email` (unreliable)

2. **user_profiles.email column inconsistencies:**
   - NULL values for migrated users
   - Incorrect/placeholder emails
   - Not synchronized with `auth.users.email`

3. **"New member" flow never checks auth.users:**
   - Misses users who exist in `auth.users` but have NULL email in `user_profiles`
   - Allows duplicate signup attempts

4. **"Existing member" flow misses waitlist-only users:**
   - Users in `user_profiles` but not in `auth.users` are told "not in system"

---

## Why This Happens

### The Migration Gap

During user migration:
1. Users were added to `auth.users` with correct emails
2. Profile records created in `user_profiles` with `user_id` foreign key
3. **BUT:** `user_profiles.email` column was NOT always populated
4. Some received NULL, some received placeholder values

### The Design Gap

The two flows were designed for different purposes:
- **Existing member:** Authentication flow → checks `auth.users` (correct approach)
- **New member:** Waitlist/registration flow → checks `user_profiles` (incorrect for auth users)

No one realized that `user_profiles.email` was unreliable as the source of truth.

---

## Recommended Fix Strategy

### Option 1: Make /api/hpd/check-email Check auth.users (RECOMMENDED)

**Change:** `/app/app/api/hpd/check-email/route.ts`

**Add auth.users check:**
```typescript
// After line 15
const supabase = createServerClient();

// NEW: Check auth.users first (same logic as check-user)
const { data: authUsersData } = await supabase.auth.admin.listUsers();
const authUser = authUsersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);

if (authUser) {
    // User exists in auth - they are registered
    return NextResponse.json({
        exists: true,
        isRegistered: true,
        hasCompletedOnboarding: true,
        message: 'This email is registered. Please login to continue.'
    });
}

// THEN check user_profiles and onboarding_submissions
// (existing logic continues...)
```

**Pros:**
- ✅ Fixes the inconsistency immediately
- ✅ Makes `auth.users` the single source of truth for ALL flows
- ✅ Minimal code changes
- ✅ Aligns with "existing member" flow logic

**Cons:**
- ❌ Doesn't fix the underlying data issue (user_profiles.email still inconsistent)

---

### Option 2: Sync user_profiles.email with auth.users.email

**Change:** Data migration script

**Create migration to update user_profiles.email:**
```sql
-- Sync emails from auth.users to user_profiles
UPDATE user_profiles
SET email = auth.users.email
FROM auth.users
WHERE user_profiles.user_id = auth.users.id
  AND (user_profiles.email IS NULL 
       OR user_profiles.email != auth.users.email
       OR user_profiles.email LIKE '%placeholder%');
```

**Pros:**
- ✅ Fixes the underlying data inconsistency
- ✅ Makes user_profiles.email reliable for future queries
- ✅ Both flows will work correctly after sync

**Cons:**
- ❌ Requires database migration
- ❌ Doesn't prevent future desync
- ❌ Need to ensure ongoing sync mechanism

---

### Option 3: Consolidate to Single Check API (BEST LONG-TERM)

**Change:** Deprecate `/api/hpd/check-email`, use `/api/auth/check-user` everywhere

**Update mockBackend.ts:**
```typescript
export const checkEmail = async (email: string) => {
    // Use the auth/check-user API instead
    const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    return {
        exists: data.exists,
        isRegistered: data.exists && data.hasCompletedOnboarding,
        hasCompletedOnboarding: data.hasCompletedOnboarding || false
    };
};
```

**Pros:**
- ✅ Single source of truth
- ✅ No duplicate logic
- ✅ Easier to maintain
- ✅ Consistent behavior across all flows

**Cons:**
- ❌ Changes API contract for "new member" flow
- ❌ May need adjustments to flow logic

---

## Affected Code Files

### Primary Files:
1. **`/app/lib/onboarding-chat/chatLogic.ts`** (Lines 169-1032)
   - Orchestrates both flows
   - Calls check-user API (line 205)
   - Calls checkEmail function (lines 620, 800, 932)

2. **`/app/lib/onboarding-chat/mockBackend.ts`** (Lines 104-131)
   - Implements checkEmail wrapper
   - Calls `/api/hpd/check-email`

3. **`/app/app/api/auth/check-user/route.ts`** (Lines 1-106)
   - Checks `auth.users` → user_profiles (by user_id)
   - Used by "existing member" flow

4. **`/app/app/api/hpd/check-email/route.ts`** (Lines 1-77)
   - Checks user_profiles (by email) → onboarding_submissions
   - Used by "new member" flows (CREW, SUPPLIER, CLIENT)
   - ⚠️ **DOES NOT check auth.users**

### Database Tables:
1. **`auth.users`** (Supabase Auth table)
   - Always has correct email
   - Source of truth for authentication

2. **`user_profiles`** (Public table)
   - Has `user_id` (FK to auth.users)
   - Has `email` column (❌ often NULL/incorrect)
   - Has `has_completed_onboarding` flag

3. **`onboarding_submissions`** (Public table)
   - Waitlist submissions
   - Stores email in JSONB field

---

## Testing Scenarios

### To Confirm the Issue:

1. **Find a migrated user:**
   - Check `auth.users` for email: `user1@example.com`
   - Check `user_profiles` WHERE `user_id = [that user's ID]`
   - Confirm `user_profiles.email IS NULL` or different

2. **Test "Existing member" flow:**
   - Enter `user1@example.com`
   - Expected: "We've sent a password setup link" ✅

3. **Test "New member" flow:**
   - Enter `user1@example.com`
   - Expected: "Email available" (WRONG) ❌

4. **Apply fix Option 1**

5. **Re-test "New member" flow:**
   - Enter `user1@example.com`
   - Expected: "This email is already registered" ✅

---

## Conclusion

The inconsistency is **NOT caused by:**
- ❌ Different Supabase projects
- ❌ Different environment variables
- ❌ Case-sensitivity issues
- ❌ Supabase client initialization problems

The inconsistency **IS caused by:**
- ✅ Different table priority in the two flows
- ✅ Unreliable `user_profiles.email` column
- ✅ "New member" flow not checking `auth.users` table
- ✅ Data migration leaving NULL/incorrect emails in user_profiles

**Immediate Fix:** Update `/api/hpd/check-email` to check `auth.users` first (Option 1)

**Long-term Fix:** Consolidate to single check API + sync user_profiles.email (Option 3 + Option 2)

---

**Analysis Date:** January 29, 2025  
**Status:** ⏳ Analysis Complete - Awaiting Fix Decision  
**Priority:** 🔴 CRITICAL - Blocking user onboarding
