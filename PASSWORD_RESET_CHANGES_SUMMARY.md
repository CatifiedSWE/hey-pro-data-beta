# Password Reset Link Fix - Changes Summary

## Overview
Fixed invalid Supabase password-reset links that were showing "Invalid Link" errors to users. The issue was caused by improper URL construction and inadequate token handling on the frontend.

---

## Changes Made

### 1. API Route: `/app/app/api/auth/send-password-setup-link/route.ts`

**Issue:** Potential double slashes in redirect URL due to trailing slash in `NEXT_PUBLIC_APP_URL`

**Fix Applied:**
```typescript
// Line 108-110
const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const redirectUrl = `${baseUrl}/set-password`;
console.log('[Send Password Setup] Sending email with redirect URL:', redirectUrl);

// Line 114-116
const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
  redirectTo: redirectUrl
});
```

**Result:**
- ✅ Sanitizes `NEXT_PUBLIC_APP_URL` by removing trailing slashes
- ✅ Prevents double slashes: ensures `https://heyprodata.com/set-password` instead of `https://heyprodata.com//set-password`
- ✅ Added logging for debugging

---

### 2. API Route: `/app/app/api/auth/send-login-link/route.ts`

**Issue:** Same potential double slash issue for magic link logins

**Fix Applied:**
```typescript
// Line 21-25
const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const redirectUrl = `${baseUrl}/profile`;
console.log('[Send Login Link] Sending OTP with redirect URL:', redirectUrl);

// Line 28-34
const { error } = await supabase.auth.signInWithOtp({
  email: normalizedEmail,
  options: {
    emailRedirectTo: redirectUrl,
    shouldCreateUser: false
  }
});
```

**Result:**
- ✅ Consistent URL sanitization across all auth flows
- ✅ Proper redirect to `/profile` after magic link login

---

### 3. Frontend Page: `/app/app/set-password/page.tsx`

**Issues:**
- Token validation happening too late
- No check for `type === 'recovery'`
- Session not properly initialized before showing UI
- Inadequate error handling

**Major Changes:**

#### A. Added Session Initialization State
```typescript
// Line 17
const [sessionInitialized, setSessionInitialized] = useState(false);
```

#### B. Complete Token Handling Rewrite (Lines 20-94)
```typescript
useEffect(() => {
  const initializeRecoverySession = async () => {
    try {
      console.log('[Set Password] Checking for recovery tokens in URL...');
      
      // Extract tokens from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // CRITICAL: Validate recovery type
      if (type !== 'recovery') {
        setValidToken(false);
        setError('Invalid or expired link. Please request a new password setup link.');
        setSessionInitialized(true);
        return;
      }

      // CRITICAL: Both tokens required
      if (!accessToken || !refreshToken) {
        setValidToken(false);
        setError('Invalid or expired link. Please request a new password setup link.');
        setSessionInitialized(true);
        return;
      }

      // CRITICAL: Set session BEFORE showing UI
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError || !data.session) {
        setValidToken(false);
        setError('Invalid or expired link. Please request a new password setup link.');
        setSessionInitialized(true);
        return;
      }

      console.log('[Set Password] ✅ Recovery session established successfully');
      setValidToken(true);
      setSessionInitialized(true);

    } catch (err) {
      setValidToken(false);
      setError('An error occurred. Please request a new password setup link.');
      setSessionInitialized(true);
    }
  };

  initializeRecoverySession();
}, []);
```

#### C. Enhanced Password Submit Handler (Lines 108-165)
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ... validation logic ...

  try {
    // Re-verify session before updating password
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Session expired. Please request a new password setup link.');
    }

    // Update password
    const { data: userData, error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError || !userData?.user) {
      throw updateError || new Error('Failed to update password');
    }

    // Mark onboarding complete
    await supabase
      .from('user_profiles')
      .update({ has_completed_onboarding: true })
      .eq('user_id', userData.user.id);

    setSuccess(true);
    setTimeout(() => router.push('/profile'), 2000);

  } catch (err: any) {
    console.error('[Set Password] Error:', err);
    setError(err.message || 'Failed to set password. Please try again.');
  }
};
```

#### D. Improved Loading State (Lines 186-193)
```typescript
// Only show UI after session is initialized
if (!sessionInitialized || validToken === null) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-8 border-slate-200 border-t-[#ff5168] rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 font-semibold">Verifying recovery link...</p>
    </div>
  );
}
```

**Results:**
- ✅ Strict validation: `type === 'recovery'` required
- ✅ Both tokens must be present
- ✅ Session established BEFORE UI is shown
- ✅ Session re-verified before password update
- ✅ Better error messages and states
- ✅ Comprehensive logging for debugging

---

## Expected Flow After Fix

1. **User receives email** with properly formatted link:
   ```
   https://kvidydsfnnrathhpuxye.supabase.co/auth/v1/verify?token=[TOKEN]&type=recovery&redirect_to=https://heyprodata.com/set-password
   ```

2. **Supabase verifies token** and redirects to:
   ```
   https://heyprodata.com/set-password#access_token=xxx&refresh_token=yyy&type=recovery
   ```

3. **Frontend validates tokens:**
   - ✅ Checks `type === 'recovery'`
   - ✅ Verifies both tokens present
   - ✅ Establishes session via `setSession()`
   - ✅ Shows password form only after session is active

4. **User sets password:**
   - ✅ Session validated before update
   - ✅ Password updated successfully
   - ✅ Onboarding marked complete
   - ✅ Redirected to profile

---

## Configuration Required (Supabase Dashboard)

### 1. Redirect URLs (Auth → URL Configuration)
Ensure these are whitelisted:
```
https://heyprodata.com/set-password
https://heyprodata.com/reset-password
https://heyprodata.com/profile
```

### 2. Email Template (Auth → Email Templates → Password Reset)
Must use the dynamic variable:
```html
<a href="{{ .ConfirmationURL }}">Set Password</a>
```

**DO NOT** hardcode the URL in the template.

---

## Testing Checklist

- [ ] Request password setup link via onboarding
- [ ] Check email for link with token
- [ ] Verify no double slashes in redirect URL
- [ ] Click link and verify redirect to set-password page
- [ ] Check browser console for successful session logs
- [ ] Verify password form is shown (not "Invalid Link")
- [ ] Set password and verify success
- [ ] Confirm redirect to profile page
- [ ] Test invalid link scenarios (expired, wrong type, no tokens)

---

## Files Modified

1. ✅ `/app/app/api/auth/send-password-setup-link/route.ts` - URL sanitization
2. ✅ `/app/app/api/auth/send-login-link/route.ts` - URL sanitization
3. ✅ `/app/app/set-password/page.tsx` - Complete token handling rewrite

## Documentation Created

4. ✅ `/app/SUPABASE_PASSWORD_RESET_FIX_COMPLETE.md` - Comprehensive documentation
5. ✅ `/app/PASSWORD_RESET_CHANGES_SUMMARY.md` - This file

---

## Summary

**Problem:** Invalid password reset links showing "Invalid Link" error

**Root Causes:**
1. Double slashes in redirect URLs
2. Inadequate token validation on frontend
3. Session not properly initialized

**Solution:**
1. Sanitize URLs in API routes to remove trailing slashes
2. Strict token validation with `type === 'recovery'` check
3. Establish session BEFORE showing UI
4. Re-verify session before password update
5. Enhanced error handling and logging

**Status:** ✅ **COMPLETE - Ready for Testing**

---

**Date:** January 29, 2025  
**Branch:** ui  
**Project:** HeyProData - Next.js 15 + Supabase
