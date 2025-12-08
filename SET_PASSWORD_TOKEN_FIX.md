# Set-Password Link Token Fix - Complete

## Issue Summary
Users were receiving set-password links without tokens, resulting in URLs like:
```
https://heyprodata.com//set-password
```

## Root Cause Analysis

### Primary Issue: Supabase Email Template Configuration
The Supabase email template was using a hardcoded URL instead of the dynamic `{{ .ConfirmationURL }}` variable, which prevented tokens from being included in the email link.

### Secondary Issue: Double Slash in Redirect URL
Even after fixing the email template, the `NEXT_PUBLIC_APP_URL` environment variable had a trailing slash (`https://heyprodata.com/`), which when concatenated with `/set-password`, resulted in:
```
https://heyprodata.com//set-password
```

This double slash caused routing issues and prevented the token from being properly parsed.

## Solution Implemented

### 1. Supabase Email Template Fix ✅
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

### 2. Code-Level Fix ✅
**Files Modified:**

#### `/app/app/api/auth/send-password-setup-link/route.ts`
**Changes:**
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
const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
  redirectTo: `${baseUrl}/set-password`
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
**Root Cause:** 
1. Supabase email template not using `{{ .ConfirmationURL }}`
2. Double slash in redirect URL due to trailing slash in env variable

**Fix:** 
1. ✅ Updated Supabase email template
2. ✅ Added code to strip trailing slashes from base URL
3. ✅ Applied fix to both password setup and login link APIs

**Status:** ✅ FIXED - Ready for testing

---

**Date:** January 2025
**Fixed By:** Development Team
