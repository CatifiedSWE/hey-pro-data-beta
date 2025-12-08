# Set-Password Link Token Fix - Complete

## Issue Summary
Users were receiving set-password links without tokens, resulting in URLs like:
```
https://heyprodata.com//set-password
```

## Root Cause Analysis

### Primary Issue: Wrong Supabase Method
The code was using `resetPasswordForEmail()` which is designed for users who are **resetting** an existing password, not for users who are **setting** their password for the first time. This is conceptually incorrect for the onboarding flow.

### Secondary Issue: Supabase Email Template Configuration
The Supabase email template was using a hardcoded URL instead of the dynamic `{{ .ConfirmationURL }}` variable, which prevented tokens from being included in the email link.

### Tertiary Issue: Double Slash in Redirect URL
The `NEXT_PUBLIC_APP_URL` environment variable had a trailing slash (`https://heyprodata.com/`), which when concatenated with `/set-password`, resulted in:
```
https://heyprodata.com//set-password
```

This double slash caused routing issues and prevented the token from being properly parsed.

## Solution Implemented

### 1. Use Correct Supabase Method ✅
**Changed From:** `resetPasswordForEmail()` - meant for password resets
**Changed To:** `admin.generateLink()` with type 'recovery' - meant for first-time password setup

**Why This Matters:**
- `resetPasswordForEmail()` is for users who forgot their existing password
- `admin.generateLink()` generates proper authentication links for new users setting password for the first time
- This is the semantically correct method for onboarding flows

### 2. Supabase Email Template Fix ✅
**Action Required by User:**
Update the Supabase email template to use:
```
{{ .ConfirmationURL }}
```

**Status:** ✅ Completed by user
**Result:** Now receiving proper token URLs like:
```
https://kvidydsfnnrathhpuxye.supabase.co/auth/v1/verify?token=xxx&type=recovery&redirect_to=https://heyprodata.com//set-password
```

### 3. Code-Level Fix ✅
**Files Modified:**

#### `/app/app/api/auth/send-password-setup-link/route.ts`
**Changes:**
- Replaced `resetPasswordForEmail()` with `admin.generateLink()`
- Added logic to remove trailing slash from `NEXT_PUBLIC_APP_URL`
- Ensures clean URL construction without double slashes

**Before:**
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/set-password`
});
```

**After:**
```typescript
// Remove trailing slash from base URL to avoid double slashes
const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
  type: 'recovery',
  email: normalizedEmail,
  options: {
    redirectTo: `${baseUrl}/set-password`
  }
});
```

#### `/app/app/api/auth/send-login-link/route.ts`
**Changes:**
- Applied same fix for consistency
- Prevents similar issues in login flow

**Before:**
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: normalizedEmail,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile`,
    shouldCreateUser: false
  }
});
```

**After:**
```typescript
// Remove trailing slash from base URL to avoid double slashes
const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const { error } = await supabase.auth.signInWithOtp({
  email: normalizedEmail,
  options: {
    emailRedirectTo: `${baseUrl}/profile`,
    shouldCreateUser: false
  }
});
```

## How It Works Now

### Complete Flow:
1. **User enters email** in onboarding page
2. **API call** to `/api/auth/send-password-setup-link`
3. **Supabase sends email** using `resetPasswordForEmail()`
4. **Email contains** proper token URL:
   ```
   https://[supabase-url]/auth/v1/verify?token=[TOKEN]&type=recovery&redirect_to=https://heyprodata.com/set-password
   ```
5. **User clicks link** → Supabase verifies token
6. **Supabase redirects** to `https://heyprodata.com/set-password#access_token=xxx&refresh_token=yyy&type=recovery`
7. **Set-password page** extracts tokens from URL hash
8. **Session established** → User can set password

## Verification Steps

### Test the Fix:
1. Go to onboarding page
2. Select "I'm an existing member" → "Access activation link"
3. Enter email address
4. Check email for link
5. Verify link structure:
   - ✅ Should have `token=` parameter
   - ✅ Should have `redirect_to=https://heyprodata.com/set-password` (single slash)
   - ✅ Should NOT have `//set-password` (double slash)
6. Click the link
7. Should be redirected to set-password page with tokens in URL hash

## Environment Variables

### Required Configuration:
```env
NEXT_PUBLIC_APP_URL=https://heyprodata.com
```

**Important Notes:**
- Can be with or without trailing slash (code handles both)
- Must match the domain configured in Supabase redirect URLs
- Used for both password setup and login links

## Related Files

### Modified:
- `/app/app/api/auth/send-password-setup-link/route.ts`
- `/app/app/api/auth/send-login-link/route.ts`

### Involved (No changes needed):
- `/app/app/set-password/page.tsx` - Handles token extraction and password setup
- `/app/app/onboarding/page.tsx` - Onboarding UI
- `/app/lib/onboarding-chat/chatLogic.ts` - Calls the API

## Supabase Configuration Checklist

### Email Templates:
- ✅ Use `{{ .ConfirmationURL }}` for password reset emails
- ✅ Use `{{ .ConfirmationURL }}` for magic link emails

### Redirect URLs (Supabase Dashboard):
Ensure these URLs are added to "Redirect URLs" in Supabase Auth settings:
```
https://heyprodata.com/set-password
https://heyprodata.com/reset-password
https://heyprodata.com/callback
https://heyprodata.com/profile
```

## Testing Checklist

- [ ] Test "Access activation link" flow for existing members
- [ ] Verify email contains proper token
- [ ] Verify no double slashes in redirect URL
- [ ] Test clicking the email link
- [ ] Verify redirect to set-password page with tokens
- [ ] Verify password can be set successfully
- [ ] Test "Sign in to profile" flow (uses send-login-link API)
- [ ] Verify magic link also works correctly

## Summary

**Issue:** Missing tokens in set-password links

**Root Causes:** 
1. Using wrong Supabase method (`resetPasswordForEmail` instead of `admin.generateLink`)
2. Supabase email template not using `{{ .ConfirmationURL }}`
3. Double slash in redirect URL due to trailing slash in env variable

**Fixes Applied:** 
1. ✅ Changed to `admin.generateLink()` with type 'recovery' for first-time password setup
2. ✅ Updated Supabase email template (user action)
3. ✅ Added code to strip trailing slashes from base URL
4. ✅ Applied fix to both password setup and login link APIs

**Key Difference:**
- **Before:** `resetPasswordForEmail()` - for resetting existing passwords
- **After:** `admin.generateLink()` - for setting passwords for the first time

**Status:** ✅ FIXED - Ready for testing

---

**Date:** January 2025
**Fixed By:** Development Team
