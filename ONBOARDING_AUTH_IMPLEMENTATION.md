# Authentication-Based Onboarding Implementation

## Overview
Complete implementation of authentication-based onboarding logic with server-side redirects, email checking, and global middleware enforcement.

## ✅ Completed Implementation

### 1. Database Schema
**File:** `/app/migrations/add_onboarding_tracking.sql`

Added `has_completed_onboarding` column to `user_profiles` table:
```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;
```

**To Execute:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the migration file contents
3. Run the SQL
4. Verify with the included verification queries

---

### 2. Landing Page Server-Side Redirects
**File:** `/app/app/page.tsx`

**Logic:**
- ✅ No user logged in → Show landing page
- ✅ Logged in + `has_completed_onboarding = false` → Redirect to `/onboarding`
- ✅ Logged in + `has_completed_onboarding = true` → Redirect to `/profile`

**Implementation:**
```typescript
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('has_completed_onboarding')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (profile?.has_completed_onboarding) {
    redirect('/profile');
  } else {
    redirect('/onboarding');
  }
}
```

---

### 3. Onboarding Page Protection
**File:** `/app/app/onboarding/layout.tsx` (NEW)

**Logic:**
- ✅ Non-authenticated users → Allow access (for waitlist signups)
- ✅ Authenticated users with incomplete onboarding → Allow access
- ✅ Authenticated users with completed onboarding → Redirect to `/profile`
 
**Purpose:**
Prevents authenticated users who already completed onboarding from manually navigating to `/onboarding` and redoing it.

---

### 4. Onboarding Submission Logic
**File:** `/app/app/api/hpd/submit/route.ts`

**Logic:**
- ✅ Accepts onboarding submissions from both authenticated and non-authenticated users
- ✅ If user is authenticated, updates `has_completed_onboarding = true`
- ✅ Returns `{ success: true, isAuthenticated: boolean, onboardingComplete: boolean }`

**Implementation:**
```typescript
if (user) {
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ has_completed_onboarding: true })
    .eq('user_id', user.id);

  if (!updateError) {
    onboardingMarkedComplete = true;
  }
}
```

---

### 5. Existing Member Detection
**Files:** 
- `/app/app/api/hpd/check-email/route.ts`
- `/app/lib/onboarding-chat/chatLogic.ts`
- `/app/lib/onboarding-chat/mockBackend.ts`

**Logic:**
When a user enters their email during onboarding:
- ✅ Check if email exists in `user_profiles` table
- ✅ If registered → Show "Go to Login" option
- ✅ If user clicks "Go to Login" → Redirect to `/login`
- ✅ If user clicks "Try different email" → Go back to email input

**Implemented for all flows:**
- ✅ CREW flow (step 5)
- ✅ CLIENT flow (step 3)
- ✅ SUPPLIER flow (step 7) **[NEWLY ADDED]**

**Implementation:**
```typescript
const emailCheckResult = await checkEmail(nextFormData.email);

if (emailCheckResult.exists && emailCheckResult.isRegistered) {
  nextMessages.push({
    id: generateId(),
    type: 'bot',
    text: `This email is already registered! Please login to access your profile.`,
    options: [
      { label: 'Go to Login', value: 'GO_TO_LOGIN', icon: 'LogIn' },
      { label: 'Try different email', value: 'RETRY_EMAIL', icon: 'Mail' }
    ],
    inputType: 'options_only'
  });
}
```

---

### 6. Global Middleware (Proxy)
**File:** `/app/middleware.ts` (renamed from proxy.ts)

**Comprehensive Auth Logic:**

#### Landing Page (`/`)
- Non-authenticated → Show landing page
- Authenticated + incomplete onboarding → Redirect to `/onboarding`
- Authenticated + completed onboarding → Redirect to `/profile`

#### Onboarding Page (`/onboarding`)
- Non-authenticated → Allow access
- Authenticated + incomplete onboarding → Allow access
- Authenticated + completed onboarding → Redirect to `/profile`

#### Auth Pages (`/login`, `/signup`)
- Non-authenticated → Show auth pages
- Authenticated + incomplete onboarding → Redirect to `/onboarding`
- Authenticated + completed onboarding → Redirect to `/profile`

#### Protected Routes (`/profile`, `/home`, etc.)
- Non-authenticated → Redirect to `/login?redirect={current_path}`
- Authenticated → Allow access (onboarding check happens at page level)

**Implementation:**
```typescript
export async function middleware(request: NextRequest) {
  // Landing page handling
  if (pathname === '/' && isAuthenticated && userId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('has_completed_onboarding')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profile?.has_completed_onboarding) {
      return NextResponse.redirect(new URL('/profile', request.url));
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Onboarding protection
  if (pathname.startsWith('/onboarding') && isAuthenticated && userId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('has_completed_onboarding')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profile?.has_completed_onboarding) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }
  // ... more logic
}
```

---

### 7. Frontend Auto-Redirect After Submission
**File:** `/app/lib/onboarding-chat/mockBackend.ts`

**Logic:**
After successful onboarding submission, if user is authenticated:
- ✅ Wait 2 seconds (to show success message)
- ✅ Redirect to `/profile`

**Implementation:**
```typescript
if (data.isAuthenticated && data.onboardingComplete) {
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/profile';
    }
  }, 2000);
}
```

---

## File Structure

```
/app/
├── middleware.ts                              # Global auth & onboarding enforcement (RENAMED from proxy.ts)
├── migrations/
│   └── add_onboarding_tracking.sql           # Database migration (NEW)
├── app/
│   ├── page.tsx                              # Landing page with server-side redirects (UPDATED)
│   ├── onboarding/
│   │   ├── layout.tsx                        # Onboarding protection (NEW)
│   │   └── page.tsx                          # Onboarding chatbot (EXISTING)
│   └── api/
│       └── hpd/
│           ├── submit/route.ts               # Updates onboarding status (UPDATED)
│           └── check-email/route.ts          # Checks existing members (EXISTING)
└── lib/
    └── onboarding-chat/
        ├── chatLogic.ts                      # Email check & redirect logic (UPDATED - SUPPLIER flow)
        └── mockBackend.ts                    # Auto-redirect after submission (EXISTING)
```

---

## Testing Checklist

### 1. Database Migration
- [ ] Execute migration SQL in Supabase
- [ ] Verify column exists: `SELECT * FROM user_profiles LIMIT 1;`
- [ ] Verify index exists: `\di idx_user_profiles_onboarding`

### 2. Landing Page Redirects
- [ ] Visit `/` as non-authenticated user → Should see landing page
- [ ] Login as user with incomplete onboarding → Should redirect to `/onboarding`
- [ ] Login as user with completed onboarding → Should redirect to `/profile`

### 3. Onboarding Flow - CREW
- [ ] Start onboarding as non-authenticated user
- [ ] Complete all steps until email input
- [ ] Enter email of existing user → Should show "Go to Login" option
- [ ] Click "Go to Login" → Should redirect to `/login`
- [ ] Restart and enter new email → Should proceed to confirmation
- [ ] Submit as non-authenticated → Should save to `onboarding_submissions` table
- [ ] Submit as authenticated user → Should update `has_completed_onboarding = true`
- [ ] After submission as authenticated → Should redirect to `/profile` after 2 seconds

### 4. Onboarding Flow - CLIENT
- [ ] Select "I'm a client" option
- [ ] Complete project details, name, company
- [ ] Enter email of existing user → Should show "Go to Login" option
- [ ] Click "Go to Login" → Should redirect to `/login`
- [ ] Restart and enter new email → Should proceed to phone
- [ ] Submit and verify behavior

### 5. Onboarding Flow - SUPPLIER
- [ ] Select "I'm a supplier" option
- [ ] Complete company name, service, link, license upload
- [ ] Complete contact person details
- [ ] Enter email of existing user → Should show "Go to Login" option
- [ ] Click "Go to Login" → Should redirect to `/login`
- [ ] Restart and enter new email → Should proceed to phone
- [ ] Submit and verify behavior

### 6. Onboarding Page Protection
- [ ] As authenticated user with completed onboarding, manually navigate to `/onboarding`
- [ ] Should be redirected to `/profile`
- [ ] As authenticated user with incomplete onboarding, navigate to `/onboarding`
- [ ] Should be allowed to access onboarding

### 7. Middleware Enforcement
- [ ] Visit `/login` as authenticated user with completed onboarding → Redirect to `/profile`
- [ ] Visit `/login` as authenticated user with incomplete onboarding → Redirect to `/onboarding`
- [ ] Visit `/profile` as non-authenticated user → Redirect to `/login`
- [ ] Visit `/` as authenticated user → Redirect based on onboarding status

---

## Known Behaviors

### For Non-Authenticated Users
- Can access landing page
- Can complete onboarding (data saved to `onboarding_submissions`)
- NOT marked as completed (no user profile exists yet)
- When they create account later, they'll need to complete profile onboarding

### For Authenticated Users
- Cannot redo onboarding once completed
- Redirected appropriately based on onboarding status
- Email check prevents duplicate accounts
- Onboarding completion triggers redirect to profile

---

## Verification Queries

```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'has_completed_onboarding';

-- Check onboarding status distribution
SELECT 
  has_completed_onboarding, 
  COUNT(*) as user_count 
FROM user_profiles 
GROUP BY has_completed_onboarding;

-- Find users who haven't completed onboarding
SELECT user_id, email, first_name, surname, has_completed_onboarding
FROM user_profiles
WHERE has_completed_onboarding = false OR has_completed_onboarding IS NULL;

-- Check recent onboarding submissions
SELECT user_type, submitted_fields->>'email' as email, created_at
FROM onboarding_submissions
ORDER BY created_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue: Redirect loop on landing page
**Cause:** Database column doesn't exist or user profile missing
**Fix:** Run migration and ensure user has profile entry

### Issue: Users can access onboarding after completion
**Cause:** Middleware not enforcing or column not updated
**Fix:** Check middleware.ts is named correctly and column value is true

### Issue: Email check not working
**Cause:** API endpoint returning wrong format or database query failing
**Fix:** Check `/api/hpd/check-email` logs and verify table structure

### Issue: Onboarding not marked complete after submission
**Cause:** User not authenticated or database update failing
**Fix:** Check authentication status and database logs in `/api/hpd/submit`

---

## Security Considerations

1. **Row Level Security (RLS):** Ensure RLS policies allow:
   - Authenticated users to read their own profile
   - Service role to update onboarding status
   - Anyone to check email existence (for existing member detection)

2. **Server-Side Enforcement:** All critical redirects happen server-side to prevent bypass

3. **Middleware Execution:** Runs on every request before page loads (except API routes)

---

## Next Steps After Implementation

1. **Test all flows thoroughly** using the testing checklist
2. **Monitor Supabase logs** for any database errors
3. **Check browser console** for any client-side errors
4. **Verify redirect behavior** in both development and production
5. **Consider analytics tracking** for onboarding completion rates

---

## Summary

✅ All onboarding authentication requirements are now implemented:
- Database column added with migration
- Landing page redirects based on auth status
- Onboarding page protected from re-access
- Existing member detection in all flows (CREW, CLIENT, SUPPLIER)
- Global middleware enforcement
- Auto-redirect after completion

The system now provides a complete, secure, server-side enforced authentication flow for onboarding.
