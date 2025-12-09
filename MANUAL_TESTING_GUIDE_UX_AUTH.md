# Manual Testing Guide - UX Authentication Flow

## 📋 Overview
This guide provides step-by-step instructions for manually testing the email-first authentication flow for existing members.

---

## 🎯 Testing Objectives

1. Verify backend returns correct authentication flags
2. Verify frontend shows only relevant options based on user type
3. Verify all user types can complete their flows successfully
4. Verify error handling and edge cases
5. Verify UI/UX is clean and intuitive

---

## 🔧 Pre-Testing Setup

### Required Test Accounts

You need three types of test users in your Supabase database:

1. **Migrated User** (No auth method)
   - User exists in `auth.users` table
   - No identities in `auth.identities` (no provider)
   - Has NOT completed onboarding
   - Example: `migrated-user@example.com`

2. **Email/Password User**
   - User exists in `auth.users` table
   - Has 'email' provider in identities
   - Has completed onboarding
   - Example: `password-user@example.com`

3. **Google OAuth User**
   - User exists in `auth.users` table
   - Has 'google' provider in identities
   - Has completed onboarding
   - Example: `google-user@example.com`

### Verification Queries

Run these queries in your Supabase SQL editor to verify your test users:

```sql
-- Check auth users
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN (
  'migrated-user@example.com', 
  'password-user@example.com', 
  'google-user@example.com'
);

-- Check identities (authentication methods)
SELECT 
  u.email,
  i.provider,
  i.created_at
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN (
  'migrated-user@example.com', 
  'password-user@example.com', 
  'google-user@example.com'
)
ORDER BY u.email, i.provider;

-- Check onboarding status
SELECT 
  up.user_id,
  u.email,
  up.has_completed_onboarding
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
WHERE u.email IN (
  'migrated-user@example.com', 
  'password-user@example.com', 
  'google-user@example.com'
);
```

---

## 🧪 Test Scenarios

---

### Test 1: Migrated User (No Auth Method)

**User Type:** User who exists but has no authentication method set (migrated from old system)

**Expected Backend Response:**
```json
{
  "exists": true,
  "hasAuthenticationMethod": false,
  "hasPassword": false,
  "hasGoogleAuth": false,
  "needsPasswordSetup": true,
  "userId": "user-uuid",
  "hasCompletedOnboarding": false
}
```

#### Test Steps:

1. **Open the onboarding page**
   - Navigate to: `/onboarding` (or wherever your onboarding chat is)
   - URL: `http://localhost:3000/onboarding` (or your app URL)

2. **Select "I'm an existing member"**
   - Click on the "I'm an existing member" option
   - ✅ **Expected:** Bot asks "What's your email address?"

3. **Enter migrated user email**
   - Type: `migrated-user@example.com` (or your test email)
   - Press Enter or click submit
   - ✅ **Expected:** Bot responds with "Got it. What do you want to do?"

4. **Verify filtered options**
   - ✅ **Expected to SEE:**
     - "Access activation link" option ONLY
     - "Check placement in next batch" option (optional)
   - ❌ **Should NOT see:**
     - "Sign in to profile"
     - "Sign in with Google"

5. **Select "Access activation link"**
   - Click on "Access activation link"
   - ✅ **Expected:** Bot sends password setup link to email
   - ✅ **Expected message:** "Great! We've sent a password setup link to your email."

6. **Verify email delivery**
   - Check the email inbox for the test account
   - ✅ **Expected:** Email received with password setup link

7. **Test link functionality** (Optional)
   - Click the link in the email
   - ✅ **Expected:** Redirects to password setup page
   - Set a password and complete setup

#### What to Check:
- [ ] Only "Access activation link" option is shown (no other auth options)
- [ ] Email is sent successfully
- [ ] Success message is clear and helpful
- [ ] No console errors in browser DevTools
- [ ] Flow feels smooth and intuitive

#### Common Issues to Look For:
- Multiple options showing when only one should appear
- API errors in browser console
- Email not being sent
- Incorrect error messages

---

### Test 2: Email/Password User

**User Type:** User who has email/password authentication and completed onboarding

**Expected Backend Response:**
```json
{
  "exists": true,
  "hasAuthenticationMethod": true,
  "hasPassword": true,
  "hasGoogleAuth": false,
  "needsPasswordSetup": false,
  "userId": "user-uuid",
  "hasCompletedOnboarding": true
}
```

#### Test Steps:

1. **Open the onboarding page**
   - Navigate to: `/onboarding`

2. **Select "I'm an existing member"**
   - Click on the "I'm an existing member" option
   - ✅ **Expected:** Bot asks "What's your email address?"

3. **Enter email/password user email**
   - Type: `password-user@example.com` (or your test email)
   - Press Enter

4. **Verify filtered options**
   - ✅ **Expected to SEE:**
     - "Sign in to profile" option ONLY
     - "Check placement in next batch" option (optional)
   - ❌ **Should NOT see:**
     - "Access activation link"
     - "Sign in with Google"

5. **Select "Sign in to profile"**
   - Click on "Sign in to profile"
   - ✅ **Expected:** Bot asks "Please enter your password to continue."
   - ✅ **Expected:** Password input field appears

6. **Enter correct password**
   - Type the correct password for the test account
   - Press Enter
   - ✅ **Expected:** "Perfect! Signing you in..."
   - ✅ **Expected:** Redirects to `/profile` page after 1.5 seconds

7. **Test wrong password** (Go back and retry)
   - Repeat steps 1-5
   - Enter incorrect password
   - ✅ **Expected:** Error message "Incorrect password. Please try again."
   - ✅ **Expected:** Options to retry, try different email, or done

#### What to Check:
- [ ] Only "Sign in to profile" option is shown
- [ ] Password input field works correctly
- [ ] Successful login redirects to profile
- [ ] Wrong password shows clear error message
- [ ] Retry options work correctly
- [ ] No console errors

#### Common Issues to Look For:
- Password field not appearing
- Incorrect redirect after login
- Google sign-in option showing when it shouldn't
- Password validation not working

---

### Test 3: Google OAuth User

**User Type:** User who signed up with Google OAuth and completed onboarding

**Expected Backend Response:**
```json
{
  "exists": true,
  "hasAuthenticationMethod": true,
  "hasPassword": false,
  "hasGoogleAuth": true,
  "needsPasswordSetup": false,
  "userId": "user-uuid",
  "hasCompletedOnboarding": true
}
```

#### Test Steps:

1. **Open the onboarding page**
   - Navigate to: `/onboarding`

2. **Select "I'm an existing member"**
   - Click on the "I'm an existing member" option
   - ✅ **Expected:** Bot asks "What's your email address?"

3. **Enter Google user email**
   - Type: `google-user@example.com` (or your test email)
   - Press Enter

4. **Verify filtered options**
   - ✅ **Expected to SEE:**
     - "Sign in with Google" option ONLY
     - "Check placement in next batch" option (optional)
   - ❌ **Should NOT see:**
     - "Access activation link"
     - "Sign in to profile"

5. **Select "Sign in with Google"**
   - Click on "Sign in with Google"
   - ✅ **Expected:** Bot shows "Welcome back! Click below to continue with Google:"
   - ✅ **Expected:** Google authentication button appears

6. **Click Google sign-in button**
   - Click the Google authentication button
   - ✅ **Expected:** Redirects to Google OAuth flow
   - ✅ **Expected:** After successful auth, redirects back to app
   - ✅ **Expected:** User is signed in and redirected to profile

#### What to Check:
- [ ] Only "Sign in with Google" option is shown
- [ ] Google authentication button appears
- [ ] OAuth flow works correctly
- [ ] Successful authentication redirects properly
- [ ] No console errors

#### Common Issues to Look For:
- Email/password sign-in showing when it shouldn't
- Google button not appearing
- OAuth redirect not working
- User not properly authenticated after OAuth

---

### Test 4: Non-Existent User

**User Type:** Email that doesn't exist in the system

**Expected Backend Response:**
```json
{
  "exists": false,
  "hasPassword": false,
  "needsPasswordSetup": false,
  "userId": null
}
```

#### Test Steps:

1. **Open the onboarding page**
   - Navigate to: `/onboarding`

2. **Select "I'm an existing member"**
   - Click on the "I'm an existing member" option

3. **Enter non-existent email**
   - Type: `nonexistent@example.com`
   - Press Enter

4. **Verify error handling**
   - ✅ **Expected:** "I can't find that email. Want to try another one, or jump in and reserve your spot?"
   - ✅ **Expected options:**
     - "Try another email"
     - "Reserve my spot"

5. **Test "Try another email" option**
   - Click "Try another email"
   - ✅ **Expected:** Asks for email again

6. **Test "Reserve my spot" option**
   - Click "Reserve my spot"
   - ✅ **Expected:** Switches to CREW onboarding flow
   - ✅ **Expected:** Asks for first name

#### What to Check:
- [ ] Clear error message for non-existent email
- [ ] Options to retry or join are presented
- [ ] Retry option allows entering new email
- [ ] Reserve spot switches to signup flow correctly

---

### Test 5: Edge Cases & Error Handling

#### Test 5a: Invalid Email Format

1. Enter an invalid email (e.g., "notanemail")
2. ✅ **Expected:** Email validation error or proper handling

#### Test 5b: Empty Email

1. Try to submit without entering email
2. ✅ **Expected:** Cannot submit or shows validation error

#### Test 5c: Email with Extra Spaces

1. Enter email with spaces: " user@example.com "
2. ✅ **Expected:** Email is trimmed and works correctly

#### Test 5d: Email Case Sensitivity

1. Enter email in mixed case: "User@Example.com"
2. ✅ **Expected:** Email is normalized to lowercase and works

#### Test 5e: Network Error Simulation

1. Open browser DevTools → Network tab
2. Throttle network to "Offline"
3. Try to submit email
4. ✅ **Expected:** Proper error message about network issue

#### Test 5f: API Error Simulation

1. Temporarily break the API endpoint (if possible)
2. Try the flow
3. ✅ **Expected:** User-friendly error message

---

## 🔍 Detailed Verification Checklist

### Backend API Verification

Test the API directly using curl or Postman:

```bash
# Test migrated user
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email":"migrated-user@example.com"}'

# Test email/password user
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email":"password-user@example.com"}'

# Test Google user
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email":"google-user@example.com"}'

# Test non-existent user
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}'
```

**Verify each response has:**
- [ ] Correct `exists` value
- [ ] Correct `hasAuthenticationMethod` value
- [ ] Correct `hasPassword` value
- [ ] Correct `hasGoogleAuth` value
- [ ] Correct `needsPasswordSetup` value
- [ ] Correct `hasCompletedOnboarding` value

### Frontend Display Verification

For each user type, verify:
- [ ] Only the correct authentication option is displayed
- [ ] No extra or incorrect options appear
- [ ] UI is clean and uncluttered
- [ ] Messages are clear and helpful
- [ ] Transitions are smooth
- [ ] No visual glitches

### Browser Console Verification

Keep DevTools open during testing:
- [ ] No JavaScript errors
- [ ] No failed API calls (except intentional tests)
- [ ] No warning messages
- [ ] Proper logging (if enabled)

---

## 📊 Testing Results Template

Use this template to record your testing results:

```markdown
## Test Results - [Date]

### Test 1: Migrated User
- Status: ✅ PASS / ❌ FAIL
- Notes: 
- Issues found:

### Test 2: Email/Password User
- Status: ✅ PASS / ❌ FAIL
- Notes:
- Issues found:

### Test 3: Google OAuth User
- Status: ✅ PASS / ❌ FAIL
- Notes:
- Issues found:

### Test 4: Non-Existent User
- Status: ✅ PASS / ❌ FAIL
- Notes:
- Issues found:

### Test 5: Edge Cases
- Status: ✅ PASS / ❌ FAIL
- Notes:
- Issues found:

### Overall Assessment
- [ ] All core scenarios work correctly
- [ ] Edge cases handled properly
- [ ] UI/UX is intuitive
- [ ] No critical bugs found
- [ ] Ready for production: YES / NO

### Issues Summary
1. 
2.
3.
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Multiple Options Showing
**Symptom:** All three auth options appear instead of filtered one  
**Possible Cause:** API not returning correct flags  
**Solution:** Check backend logs, verify Supabase data

### Issue 2: API Not Called
**Symptom:** No filtered options appear after entering email  
**Possible Cause:** Frontend not making API call  
**Solution:** Check browser network tab, verify API endpoint

### Issue 3: Wrong Option Displayed
**Symptom:** Google sign-in shows for password user  
**Possible Cause:** Logic error in frontend filtering  
**Solution:** Check chatLogic.ts lines 200-213

### Issue 4: Password Setup Link Not Sent
**Symptom:** Email not received after requesting activation link  
**Possible Cause:** Email service not configured  
**Solution:** Check backend email configuration

---

## 📝 Next Steps After Testing

1. **Document all issues found**
   - Create detailed bug reports
   - Include screenshots/videos
   - Note reproduction steps

2. **Prioritize issues**
   - Critical: Blocking user flows
   - High: Incorrect behavior
   - Medium: UX improvements
   - Low: Minor polish

3. **Fix critical issues first**
   - Address blocking bugs
   - Re-test after fixes

4. **Update checklist**
   - Mark Phase 4 as complete
   - Move to Phase 5 (Verification)

5. **Plan production rollout**
   - Prepare deployment plan
   - Plan rollback strategy
   - Monitor metrics after launch

---

## 🎯 Success Criteria

Testing is considered complete when:

- ✅ All three user types see only their relevant option
- ✅ Non-existent users get proper error handling
- ✅ All authentication flows complete successfully
- ✅ No console errors during any flow
- ✅ Edge cases are handled gracefully
- ✅ UI/UX feels smooth and intuitive
- ✅ Backend API returns correct flags for all user types

---

**Good luck with testing! 🚀**

If you encounter any issues during testing, document them and I can help you fix them.
