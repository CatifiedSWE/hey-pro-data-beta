# Email Check Flow Comparison - Visual Summary

## The Split Brain Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAME EMAIL: john@example.com                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┬──────────────────────────────────┐
│   "I'm an existing member"       │   "I'm new - reserve my spot"    │
│   (Access activation link)       │   (CREW/SUPPLIER/CLIENT)         │
├──────────────────────────────────┼──────────────────────────────────┤
│                                  │                                  │
│  API: /api/auth/check-user       │  API: /api/hpd/check-email       │
│                                  │                                  │
│  Step 1: Check auth.users ✅     │  Step 1: Skip auth.users ❌      │
│    Query: List all users         │    (Never checks this table)     │
│    Match: email = john@...       │                                  │
│    Result: FOUND                 │  Step 2: Check user_profiles ✅  │
│                                  │    Query: WHERE email ILIKE ...  │
│  Step 2: Check user_profiles ✅  │    Result: NOT FOUND             │
│    Query: WHERE user_id = ...    │    (email is NULL in profile)    │
│    (Uses user_id from Step 1)    │                                  │
│    Result: FOUND                 │  Step 3: Check submissions ✅    │
│                                  │    Query: submitted_fields->email│
│  Response:                       │    Result: NOT FOUND             │
│  ✅ "User exists"                │                                  │
│  ✅ "Sending password link"      │  Response:                       │
│                                  │  ❌ "Email available"            │
│                                  │  ❌ "Proceed with signup"        │
└──────────────────────────────────┴──────────────────────────────────┘
```

---

## Database State for Migrated User

```
┌─────────────────────────────────────────────────────────────────┐
│                        auth.users (Supabase Auth)                │
├──────────────┬────────────────────┬──────────────────────────────┤
│ user_id      │ email              │ provider                     │
├──────────────┼────────────────────┼──────────────────────────────┤
│ abc-123-xyz  │ john@example.com   │ email                        │
└──────────────┴────────────────────┴──────────────────────────────┘
                         ↓ Foreign Key
┌─────────────────────────────────────────────────────────────────┐
│                       user_profiles (Public)                     │
├──────────────┬────────────────────┬──────────────────────────────┤
│ user_id (FK) │ email              │ has_completed_onboarding     │
├──────────────┼────────────────────┼──────────────────────────────┤
│ abc-123-xyz  │ NULL               │ false                        │
│              │ (or placeholder)   │                              │
└──────────────┴────────────────────┴──────────────────────────────┘
```

**Why "Existing member" works:**
- ✅ Finds user in `auth.users` by email
- ✅ Then looks up `user_profiles` using `user_id` (not email!)
- ✅ Doesn't care that profile email is NULL

**Why "New member" fails:**
- ❌ Never checks `auth.users`
- ❌ Searches `user_profiles` WHERE `email = 'john@example.com'`
- ❌ Email is NULL → query returns nothing
- ❌ Thinks email is available

---

## Code Path Comparison

### Path 1: Existing Member → /api/auth/check-user

```typescript
┌─────────────────────────────────────────────────────────────────┐
│ chatLogic.ts (Line 205)                                          │
│ ---------------------------------------------------------------- │
│ const checkResponse = await fetch('/api/auth/check-user', {     │
│     method: 'POST',                                              │
│     body: JSON.stringify({ email })                              │
│ });                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ /app/api/auth/check-user/route.ts                               │
│ ---------------------------------------------------------------- │
│ // Line 23: Get all users from auth.users                       │
│ const { data: authUsersData } =                                  │
│     await supabase.auth.admin.listUsers();                       │
│                                                                  │
│ // Line 34: Find by email                                       │
│ const authUser = authUsersData.users.find(                       │
│     u => u.email?.toLowerCase() === normalizedEmail              │
│ );                                                               │
│                                                                  │
│ if (!authUser) {                                                 │
│     return { exists: false };  ← User not in auth system        │
│ }                                                                │
│                                                                  │
│ // Line 50: Check profile using USER_ID                         │
│ const { data: profileData } = await supabase                     │
│     .from('user_profiles')                                       │
│     .select('user_id, email, has_completed_onboarding')          │
│     .eq('user_id', authUser.id)  ← Key difference!              │
│     .maybeSingle();                                              │
│                                                                  │
│ return {                                                         │
│     exists: true,                                                │
│     hasCompletedOnboarding: profileData?.has_completed_onboarding│
│ };                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Path 2: New Member → /api/hpd/check-email

```typescript
┌─────────────────────────────────────────────────────────────────┐
│ chatLogic.ts (Line 620, 800, 932)                               │
│ ---------------------------------------------------------------- │
│ const emailCheckResult = await checkEmail(nextFormData.email);   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ mockBackend.ts (Line 111)                                        │
│ ---------------------------------------------------------------- │
│ const response = await fetch('/api/hpd/check-email', {          │
│     method: 'POST',                                              │
│     body: JSON.stringify({ email })                              │
│ });                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ /app/api/hpd/check-email/route.ts                               │
│ ---------------------------------------------------------------- │
│ // ❌ DOES NOT CHECK auth.users AT ALL                          │
│                                                                  │
│ // Line 22: Check onboarding_submissions                        │
│ const { data: submissionData } = await supabase                  │
│     .from('onboarding_submissions')                              │
│     .select('id')                                                │
│     .eq('submitted_fields->>email', normalizedEmail)             │
│     .maybeSingle();                                              │
│                                                                  │
│ // Line 39: Check user_profiles BY EMAIL COLUMN                 │
│ const { data: profileData } = await supabase                     │
│     .from('user_profiles')                                       │
│     .select('user_id, has_completed_onboarding')                 │
│     .ilike('email', normalizedEmail)  ← Only checks email column!│
│     .maybeSingle();                                              │
│                                                                  │
│ // Line 54: Determine result                                    │
│ const exists = !!(submissionData || profileData);                │
│ const isRegistered = !!profileData;                              │
│                                                                  │
│ return {                                                         │
│     exists,           ← FALSE if email is NULL in user_profiles  │
│     isRegistered,     ← FALSE                                    │
│     hasCompletedOnboarding: false                                │
│ };                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Fix: Make Both Flows Check auth.users

```diff
/app/app/api/hpd/check-email/route.ts

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createServerClient();
    
+   // NEW: Check auth.users FIRST (same as check-user API)
+   const { data: authUsersData } = await supabase.auth.admin.listUsers();
+   const authUser = authUsersData.users.find(
+       u => u.email?.toLowerCase() === normalizedEmail
+   );
+   
+   if (authUser) {
+       // User exists in auth system - they are registered
+       return NextResponse.json({
+           exists: true,
+           isRegistered: true,
+           hasCompletedOnboarding: true,
+           message: 'This email is registered. Please login to continue.'
+       });
+   }
    
    // Check onboarding_submissions...
    // Check user_profiles...
    // (existing logic)
  }
}
```

**Result:**
- ✅ Both flows check `auth.users` first
- ✅ Consistent behavior across all onboarding paths
- ✅ `auth.users` becomes single source of truth
- ✅ No more "email available" for migrated users

---

## Summary Table

| Aspect | Existing Member Flow | New Member Flow | Issue |
|--------|---------------------|-----------------|-------|
| **API Endpoint** | `/api/auth/check-user` | `/api/hpd/check-email` | Different endpoints |
| **Checks auth.users?** | ✅ Yes (primary) | ❌ No | Critical gap |
| **Checks user_profiles?** | ✅ Yes (by user_id) | ✅ Yes (by email) | Different lookup |
| **Checks submissions?** | ❌ No | ✅ Yes | Not an issue |
| **Finds migrated user?** | ✅ Yes | ❌ No | **PROBLEM** |
| **Normalization** | ✅ toLowerCase + trim | ✅ toLowerCase + trim | Consistent |
| **Supabase client** | ✅ createServerClient() | ✅ createServerClient() | Same |

**Root Cause:** Different table priority + unreliable user_profiles.email

---

**Quick Reference:**
- 📁 Full analysis: `/app/ONBOARDING_EMAIL_INCONSISTENCY_ANALYSIS.md`
- 🔧 Recommended fix: Update `/api/hpd/check-email` to check `auth.users` first
- 🎯 Impact: High - blocks legitimate users from both flows
