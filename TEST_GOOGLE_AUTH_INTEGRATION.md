# Google Auth Integration - Testing Guide

## 🧪 Testing Checklist

### Pre-requisites
- [ ] Supabase project is configured
- [ ] Google OAuth is enabled in Supabase Dashboard
- [ ] Test users exist in the database
- [ ] Application is running (npm run dev)

---

## Test Scenarios

### ✅ Test 1: Google OAuth User - Sign In Flow

**Setup:**
1. Create a test user with Google OAuth (sign up via Google)
2. Ensure user has `has_completed_onboarding = true` in `user_profiles`

**Steps:**
1. Navigate to `/` or `/onboarding`
2. Select: "I'm an existing member"
3. Select: "Sign in to profile"
4. Enter the Google user's email (e.g., `testuser@gmail.com`)
5. **Expected**: System shows message "Welcome back! You signed up with Google."
6. **Expected**: Google button appears with text "Continue with Google"
7. Click the Google button
8. **Expected**: Redirects to Google OAuth consent screen
9. Authorize the application
10. **Expected**: Redirects back to `/profile` page
11. **Expected**: User is logged in and profile loads

**Success Criteria:**
- ✅ Google button displays correctly
- ✅ Button matches onboarding UI style
- ✅ OAuth flow completes successfully
- ✅ User lands on profile page
- ✅ No authentication errors

---

### ✅ Test 2: Email/Password User - Sign In Flow

**Setup:**
1. Create a test user with email/password authentication
2. Ensure user has `has_completed_onboarding = true`

**Steps:**
1. Navigate to `/onboarding`
2. Select: "I'm an existing member"
3. Select: "Sign in to profile"
4. Enter email (e.g., `testuser@example.com`)
5. **Expected**: System shows "Welcome back! Please enter your password."
6. **Expected**: Password input field appears (NOT Google button)
7. Enter the correct password
8. **Expected**: Redirects to `/profile` page

**Success Criteria:**
- ✅ Password input displays (NOT Google button)
- ✅ Password verification works
- ✅ User lands on profile page

---

### ✅ Test 3: Google User - Activation Link Flow

**Setup:**
1. Use the same Google OAuth test user

**Steps:**
1. Navigate to `/onboarding`
2. Select: "I'm an existing member"
3. Select: "Access activation link"
4. Enter the Google user's email
5. **Expected**: System shows "You already have an account with Google."
6. **Expected**: Google button appears
7. Click Google button
8. **Expected**: OAuth flow → Profile page

**Success Criteria:**
- ✅ System detects Google auth and shows button
- ✅ No attempt to send password setup email
- ✅ OAuth completes successfully

---

### ✅ Test 4: New User - Waitlist Flow

**Setup:**
1. Use an email that doesn't exist in the database

**Steps:**
1. Navigate to `/onboarding`
2. Select: "I'm an existing member"
3. Select: "Sign in to profile"
4. Enter a new email (e.g., `newuser@example.com`)
5. **Expected**: System shows "You're not in the system yet."
6. **Expected**: Options to join as Crew/Supplier appear
7. Select "I'm crew/creative"
8. **Expected**: Routes to crew waitlist flow

**Success Criteria:**
- ✅ Non-existent email detected correctly
- ✅ Routes to waitlist instead of showing auth UI
- ✅ No errors in console

---

### ✅ Test 5: UI/UX Visual Checks

**What to verify:**
1. **Google Button Styling:**
   - [ ] Matches onboarding chat style
   - [ ] Has 3D shadow effect (border-[3px] + shadow)
   - [ ] Google icon is visible and properly sized
   - [ ] Text is bold and large (2xl-3xl)
   - [ ] Hover animation works (lifts up slightly)
   - [ ] Active/pressed animation works (pushes down)

2. **Loading State:**
   - [ ] Button shows "Opening Google..." text
   - [ ] Loading spinner appears
   - [ ] Button is disabled during loading
   - [ ] No double-click issues

3. **Responsive Design:**
   - [ ] Works on desktop (1920x1080)
   - [ ] Works on tablet (768px)
   - [ ] Works on mobile (375px)
   - [ ] Button is not too wide/narrow on any screen

---

## API Testing

### Test the Check User API Directly

```bash
# Test 1: Check Google OAuth user
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email": "googleuser@gmail.com"}'

# Expected Response:
{
  "exists": true,
  "hasPassword": true,
  "hasGoogleAuth": true,
  "needsPasswordSetup": false,
  "userId": "uuid-here",
  "hasCompletedOnboarding": true
}

# Test 2: Check email/password user
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email": "emailuser@example.com"}'

# Expected Response:
{
  "exists": true,
  "hasPassword": true,
  "hasGoogleAuth": false,
  "needsPasswordSetup": false,
  "userId": "uuid-here",
  "hasCompletedOnboarding": true
}

# Test 3: Check non-existent user
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'

# Expected Response:
{
  "exists": false,
  "hasPassword": false,
  "needsPasswordSetup": false,
  "userId": null
}
```

---

## Database Verification

### Check User Providers in Supabase

```sql
-- View all authentication providers for users
SELECT 
  u.email,
  u.id as user_id,
  i.provider,
  i.created_at
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
ORDER BY u.email;

-- Expected output examples:
-- email@example.com | uuid | email  | timestamp
-- google@gmail.com  | uuid | google | timestamp
```

### Check Profile Onboarding Status

```sql
SELECT 
  email,
  user_id,
  has_completed_onboarding,
  first_name,
  surname
FROM user_profiles
ORDER BY email;
```

---

## Common Issues & Solutions

### Issue 1: Google button doesn't appear
**Symptoms:** Password input shows instead of Google button

**Debug Steps:**
1. Check browser console for errors
2. Verify API response:
   ```javascript
   // In browser console
   fetch('/api/auth/check-user', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({email: 'test@gmail.com'})
   }).then(r => r.json()).then(console.log)
   ```
3. Verify `hasGoogleAuth: true` in response
4. Check `auth.identities` table for provider='google'

**Solutions:**
- Ensure user actually signed up with Google
- Check Supabase identities table
- Verify no caching issues (clear browser cache)

---

### Issue 2: OAuth fails with redirect error
**Symptoms:** Google redirects back with error

**Debug Steps:**
1. Check Supabase Dashboard → Authentication → Providers
2. Verify callback URLs are correct
3. Check browser console for error messages

**Solutions:**
- Add `http://localhost:3000/callback` to allowed callback URLs (dev)
- Add production domain callback URL
- Verify Google OAuth credentials in Supabase

---

### Issue 3: Infinite redirect loop after auth
**Symptoms:** Keeps redirecting between pages

**Debug Steps:**
1. Check browser cookies (should have Supabase session)
2. Verify middleware allows `/callback` route
3. Check callback API sets cookies properly

**Solutions:**
- Clear all cookies and try again
- Check middleware.ts has `/callback` in public routes
- Verify session is being set in callback API

---

### Issue 4: User not redirected to profile
**Symptoms:** Stuck on callback page or redirects elsewhere

**Debug Steps:**
1. Check callback API logs
2. Verify `next` parameter in URL
3. Check profile exists in database

**Solutions:**
- Ensure callback uses `?next=/profile` parameter
- Verify user has profile in `user_profiles` table
- Check `has_completed_onboarding` is true

---

## Performance Testing

### Load Time Checks
- [ ] Google button renders instantly (< 100ms)
- [ ] OAuth redirect happens quickly (< 500ms)
- [ ] Callback processes in < 2 seconds
- [ ] Profile page loads in < 3 seconds

### Error Recovery
- [ ] Network error during OAuth shows proper message
- [ ] User can retry after error
- [ ] No stuck loading states

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Security Checks

- [ ] OAuth flow uses HTTPS in production
- [ ] Session cookies are HTTP-only
- [ ] CSRF protection enabled
- [ ] No sensitive data in URL parameters
- [ ] Proper redirect URI validation

---

## Accessibility Testing

- [ ] Google button is keyboard accessible (Tab + Enter)
- [ ] Focus visible on button
- [ ] Screen reader announces button correctly
- [ ] Loading state is announced
- [ ] Error messages are announced

---

## Final Checklist Before Deployment

- [ ] All 5 test scenarios pass
- [ ] API tests return correct responses
- [ ] Database queries show correct provider data
- [ ] UI matches design requirements
- [ ] No console errors
- [ ] OAuth flow completes end-to-end
- [ ] Profile page loads after auth
- [ ] Mobile responsive
- [ ] Browser compatibility verified
- [ ] Performance is acceptable
- [ ] Security requirements met

---

## 📊 Test Results Template

```
Date: ________________
Tester: ______________
Environment: [Development / Staging / Production]

Test 1 (Google User - Sign In):     [✅ PASS / ❌ FAIL]
Test 2 (Email User - Sign In):      [✅ PASS / ❌ FAIL]
Test 3 (Google User - Activation):  [✅ PASS / ❌ FAIL]
Test 4 (New User - Waitlist):       [✅ PASS / ❌ FAIL]
Test 5 (UI/UX):                     [✅ PASS / ❌ FAIL]

API Tests:                           [✅ PASS / ❌ FAIL]
Database Verification:               [✅ PASS / ❌ FAIL]
Browser Compatibility:               [✅ PASS / ❌ FAIL]
Performance:                         [✅ PASS / ❌ FAIL]
Security:                            [✅ PASS / ❌ FAIL]
Accessibility:                       [✅ PASS / ❌ FAIL]

Issues Found:
_____________________________________________
_____________________________________________

Notes:
_____________________________________________
_____________________________________________
```

---

**Ready to Deploy:** When all tests pass ✅

**Last Updated:** January 2025
