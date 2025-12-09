# Troubleshooting Guide - UX Auth Flow

This guide helps diagnose and fix common issues during testing.

---

## 🔍 Diagnostic Checklist

Before diving into specific issues, check these basics:

### 1. Environment Check
```bash
# Verify the app is running
curl http://localhost:3000

# Check if API endpoint is accessible
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 2. Browser DevTools
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Look for API calls to `/api/auth/check-user`

### 3. Supabase Connection
```sql
-- Verify you can connect to Supabase
SELECT count(*) FROM auth.users;
```

---

## 🚨 Common Issues & Solutions

---

### Issue 1: All Three Options Showing (Not Filtered)

**Symptom:** User sees "Access activation link", "Sign in to profile", AND "Sign in with Google" all at once.

**Possible Causes:**
1. API not returning correct flags
2. Frontend not using API response
3. Logic error in option filtering

**Debugging Steps:**

1. **Check API Response:**
   ```bash
   # Test the API directly
   curl -X POST http://localhost:3000/api/auth/check-user \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@example.com"}'
   ```
   
   Verify the response has correct flags:
   - `hasAuthenticationMethod`
   - `hasPassword`
   - `hasGoogleAuth`
   - `needsPasswordSetup`

2. **Check Browser Network Tab:**
   - Open DevTools → Network tab
   - Enter email and submit
   - Find the `check-user` request
   - Click on it and check the Response tab
   - Verify the response matches expected values

3. **Check Frontend Logic:**
   - Look at `/app/lib/onboarding-chat/chatLogic.ts`
   - Lines 200-213 should filter options based on API response
   - Add console.log to debug:
   ```typescript
   console.log('Check Result:', checkResult);
   console.log('Filtered Options:', filteredOptions);
   ```

**Solution:**
- If API returns wrong flags → Fix backend (`/app/app/api/auth/check-user/route.ts`)
- If API is correct but options wrong → Fix frontend filtering logic
- If API not called → Check network issues or API endpoint

---

### Issue 2: Wrong Authentication Option Displayed

**Symptom:** Email/password user sees "Sign in with Google" or vice versa.

**Debugging Steps:**

1. **Verify User Data in Supabase:**
   ```sql
   -- Check user's authentication providers
   SELECT 
     u.id,
     u.email,
     i.provider,
     i.created_at
   FROM auth.users u
   LEFT JOIN auth.identities i ON u.id = i.user_id
   WHERE u.email = 'test-user@example.com';
   ```

2. **Check API Response:**
   The response should match the user's actual auth method:
   - Email/password user: `hasPassword: true, hasGoogleAuth: false`
   - Google user: `hasPassword: false, hasGoogleAuth: true`

3. **Check Frontend Filtering Logic:**
   ```typescript
   // Lines 204-213 in chatLogic.ts
   if (checkResult.needsPasswordSetup) {
       // Should show ONLY activation link
   } else if (checkResult.hasGoogleAuth) {
       // Should show ONLY Google sign in
   } else if (checkResult.hasPassword) {
       // Should show ONLY password sign in
   }
   ```

**Solution:**
- If Supabase data is wrong → Fix data in database
- If API logic is wrong → Fix identity checking in backend
- If frontend logic is wrong → Fix condition order in chatLogic.ts

---

### Issue 3: No Options Displayed After Email Entry

**Symptom:** After entering email, no authentication options appear.

**Debugging Steps:**

1. **Check Console for Errors:**
   - Open DevTools → Console tab
   - Look for JavaScript errors
   - Look for failed API calls

2. **Check Network Tab:**
   - Open DevTools → Network tab
   - Look for `/api/auth/check-user` request
   - Check if it's failing (red) or successful (green)
   - Click on it to see status code and response

3. **Check if API is Called:**
   - Add console.log in chatLogic.ts line 172:
   ```typescript
   console.log('Calling check-user API with:', email);
   const checkResponse = await fetch('/api/auth/check-user', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email })
   });
   console.log('API Response:', checkResponse);
   ```

**Solution:**
- If API not called → Check frontend code, ensure fetch is executed
- If API fails → Check backend logs, verify endpoint exists
- If response empty → Check API implementation

---

### Issue 4: Email Not Being Sent (Activation Link)

**Symptom:** User requests activation link but email never arrives.

**Debugging Steps:**

1. **Check Backend Logs:**
   ```bash
   # If using PM2
   pm2 logs heyprodata
   
   # Or check console logs if running in dev
   ```

2. **Test Email API Directly:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/send-password-setup-link \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

3. **Check Email Service Configuration:**
   - Verify email service (Resend, SendGrid, etc.) is configured
   - Check API keys are set in environment variables
   - Verify email service is not rate-limited

4. **Check Spam Folder:**
   - Sometimes emails land in spam
   - Check spam/junk folder in test email account

**Solution:**
- If email service not configured → Set up email service
- If API key missing → Add to environment variables
- If rate limited → Wait or upgrade plan
- If emails in spam → Configure SPF/DKIM records

---

### Issue 5: Password Sign In Not Working

**Symptom:** User enters correct password but cannot sign in.

**Debugging Steps:**

1. **Verify Password is Correct:**
   - Ensure you're using the actual password
   - Check if caps lock is on
   - Try resetting password first

2. **Check API Call:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/verify-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"yourpassword"}'
   ```

3. **Check Supabase Auth:**
   - Try signing in directly through Supabase
   - Verify user account is not locked
   - Check if email is verified (if required)

**Solution:**
- If password wrong → Reset password or use correct one
- If API failing → Check backend implementation
- If Supabase error → Check Supabase logs and configuration

---

### Issue 6: Google OAuth Not Working

**Symptom:** Google sign-in button doesn't work or redirects to error.

**Debugging Steps:**

1. **Check Google OAuth Configuration:**
   - Verify Google OAuth is enabled in Supabase
   - Check OAuth client ID and secret are configured
   - Verify redirect URLs are whitelisted

2. **Check Console Errors:**
   - Look for OAuth-related errors
   - Check for popup blocker issues

3. **Test OAuth Flow:**
   - Click Google button
   - Check if popup opens
   - Check redirect URL in address bar
   - Look for error messages

**Solution:**
- If not configured → Set up Google OAuth in Supabase
- If popup blocked → Allow popups for your domain
- If redirect fails → Update allowed redirect URLs
- If OAuth error → Check Google Console logs

---

### Issue 7: Console Errors During Flow

**Symptom:** Red errors appear in browser console.

**Common Errors:**

#### "TypeError: Cannot read property 'X' of undefined"
**Cause:** Trying to access property on null/undefined object  
**Solution:** Add null checks, verify API response structure

#### "Failed to fetch"
**Cause:** Network error or API endpoint not accessible  
**Solution:** Check if server is running, verify API route exists

#### "Unexpected token < in JSON"
**Cause:** API returning HTML instead of JSON (usually 404 page)  
**Solution:** Verify API route path is correct

#### "CORS error"
**Cause:** Cross-origin request blocked  
**Solution:** Usually not an issue in Next.js API routes, but check if using external API

**Debugging:**
- Read the full error message carefully
- Check the line number mentioned
- Look at Network tab for failed requests
- Add try-catch blocks with console.log

---

### Issue 8: User Redirected to Wrong Page

**Symptom:** After authentication, user ends up on wrong page.

**Debugging Steps:**

1. **Check Redirect Logic:**
   - Look for `window.location.href` in chatLogic.ts
   - Verify redirect paths are correct
   - Check if there's conditional logic for redirects

2. **Check Middleware:**
   - See if `/app/middleware.ts` is intercepting
   - Verify authentication checks

**Solution:**
- Update redirect paths if wrong
- Check middleware logic
- Verify session/cookies are set correctly

---

### Issue 9: API Returns 500 Error

**Symptom:** API call fails with 500 Internal Server Error.

**Debugging Steps:**

1. **Check Server Logs:**
   ```bash
   pm2 logs heyprodata --lines 50
   ```

2. **Check Database Connection:**
   - Verify Supabase URL and key are correct
   - Test database connection manually

3. **Check API Code:**
   - Look for try-catch blocks
   - Check error messages in console
   - Verify all required fields are present

**Solution:**
- Fix database connection if broken
- Add better error handling in API
- Log errors for debugging
- Check environment variables

---

### Issue 10: Flow Gets Stuck at Certain Step

**Symptom:** User can't progress past a certain point in the flow.

**Debugging Steps:**

1. **Check Step Logic:**
   - Review chatLogic.ts step progression
   - Verify step numbers are correct
   - Check if conditions are met

2. **Add Debug Logging:**
   ```typescript
   console.log('Current Flow:', currentFlow);
   console.log('Current Step:', step);
   console.log('Form Data:', formData);
   ```

3. **Check State Management:**
   - Verify state is updating correctly
   - Check if messages are being added

**Solution:**
- Fix step increment logic
- Correct condition checks
- Ensure state updates properly

---

## 🔧 Quick Fixes

### Reset Test Environment

```bash
# Clear browser cache and cookies
# In DevTools: Application → Clear storage → Clear site data

# Restart the app
pm2 restart heyprodata

# Or if in dev mode
# Ctrl+C and restart with npm run dev
```

### View Backend Logs

```bash
# If using PM2
pm2 logs heyprodata --lines 100

# Filter for errors
pm2 logs heyprodata --err --lines 50
```

### Test API Directly

```bash
# Test check-user endpoint
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | jq

# Test password verification
curl -X POST http://localhost:3000/api/auth/verify-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' | jq
```

### Check Supabase Data

```sql
-- Get user authentication details
SELECT 
    u.id,
    u.email,
    u.created_at,
    json_agg(
        json_build_object(
            'provider', i.provider,
            'created_at', i.created_at
        )
    ) as identities
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email = 'your-test-email@example.com'
GROUP BY u.id, u.email, u.created_at;
```

---

## 📊 Debugging Checklist

When encountering any issue:

- [ ] Check browser console for errors
- [ ] Check network tab for failed requests
- [ ] Verify API is returning correct data
- [ ] Check Supabase data is correct
- [ ] Verify environment variables are set
- [ ] Check server logs for errors
- [ ] Try in incognito mode (rule out cache issues)
- [ ] Test API directly with curl
- [ ] Add console.log statements for debugging
- [ ] Check if issue is reproducible

---

## 🆘 Still Stuck?

If you've tried everything and still can't resolve the issue:

1. **Gather Information:**
   - Screenshot of the issue
   - Console error messages
   - Network tab showing API calls
   - Steps to reproduce
   - Expected vs actual behavior

2. **Check Files:**
   - `/app/app/api/auth/check-user/route.ts` - Backend API
   - `/app/lib/onboarding-chat/chatLogic.ts` - Frontend logic (lines 164-605)
   - Browser DevTools Console & Network tabs

3. **Common Root Causes:**
   - Incorrect test data in Supabase
   - Missing environment variables
   - Code not saved/reloaded
   - Cache issues
   - Typos in email addresses

4. **Document the Issue:**
   Use this template:
   ```
   **Issue:** [Brief description]
   **Steps to Reproduce:** 
   1. 
   2.
   3.
   **Expected Behavior:** 
   **Actual Behavior:** 
   **Console Errors:** [Paste errors]
   **API Response:** [Paste response]
   **Screenshots:** [Attach]
   ```

---

**Good luck troubleshooting! 🔧**
