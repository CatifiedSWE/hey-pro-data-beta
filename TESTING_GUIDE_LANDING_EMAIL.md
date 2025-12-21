# Landing Page Email Validation - Testing Guide

## Quick Start

### 1. Start the Development Server
```bash
cd /app
npm run dev
```

Server should start at: `http://localhost:3000`

---

## Testing Scenarios

### ✅ Test 1: Insider Access - Existing Email
**Steps:**
1. Navigate to landing page
2. Scroll to "Insider Access" section (black background)
3. Enter an existing email from your database (e.g., a user who already registered)
4. Click "Activate Access"

**Expected Result:**
- Loading spinner appears with text "Checking..."
- Popup shows: "You're on the list"
- Message: "Thanks for confirming your email. We'll be in touch with your activation link as soon as Insider Access opens."
- Check n8n webhook logs for entry in: `8626cfd0-07c8-4cf5-93f8-750c42fa481b`

---

### ✅ Test 2: Insider Access - Non-Existing Email
**Steps:**
1. Navigate to landing page
2. Scroll to "Insider Access" section (black background)
3. Enter a new email that doesn't exist in database (e.g., `testuser123@example.com`)
4. Click "Activate Access"

**Expected Result:**
- Loading spinner appears with text "Checking..."
- Popup shows: "Reserve your spot"
- Message: "I can't find that email. Want to try another one, or jump in and reserve your spot?"
- Button: "Reserve My Spot"
- Click button → Page smoothly scrolls to Future Insider section (white background)
- NO webhook triggered at this point

---

### ✅ Test 3: Future Insider - Existing Email
**Steps:**
1. Navigate to landing page
2. Scroll to "Future Insider" section (white background)
3. Enter an existing email from your database
4. Click "Reserve My Spot"

**Expected Result:**
- Loading spinner appears with text "Checking..."
- Popup shows: "You're on the list"
- Message: "Thanks for confirming your email. We'll be in touch with your activation link as soon as Insider Access opens."
- Check n8n webhook logs for entry in: `8626cfd0-07c8-4cf5-93f8-750c42fa481b`

---

### ✅ Test 4: Future Insider - Non-Existing Email
**Steps:**
1. Navigate to landing page
2. Scroll to "Future Insider" section (white background)
3. Enter a new email that doesn't exist in database (e.g., `newuser456@example.com`)
4. Click "Reserve My Spot"

**Expected Result:**
- Loading spinner appears with text "Checking..."
- Popup shows: "Spot Reserved"
- Message: "You're in line. We'll notify you when it's time to create your profile and join HeyProData."
- Check n8n webhook logs for entry in: `76e7b4bb-f5ed-4c1c-b17d-69c141a49ab0`

---

## API Testing (Using cURL)

### Test Email Check API
```bash
# Test with existing email
curl -X POST http://localhost:3000/api/landing/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com"}'

# Expected: {"exists":true,"message":"Email exists in database"}

# Test with non-existing email
curl -X POST http://localhost:3000/api/landing/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com"}'

# Expected: {"exists":false,"message":"Email not found"}
```

### Test Webhook Submission API
```bash
# Test webhook for existing user
curl -X POST http://localhost:3000/api/landing/submit-webhook \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","exists":true,"source":"insider-access"}'

# Expected: {"success":true,"webhookTriggered":true,"webhookType":"existing-user","message":"Webhook triggered successfully"}

# Test webhook for new user
curl -X POST http://localhost:3000/api/landing/submit-webhook \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","exists":false,"source":"future-insider"}'

# Expected: {"success":true,"webhookTriggered":true,"webhookType":"new-user","message":"Webhook triggered successfully"}
```

---

## Run Automated Test Script
```bash
cd /app
./test-landing-api.sh
```

This will run all 4 API test scenarios and display results.

---

## Checking Webhook Logs

### n8n Webhook 1 (Existing Users)
URL: `https://n8n.srv882974.hstgr.cloud/webhook/8626cfd0-07c8-4cf5-93f8-750c42fa481b`

**Should receive:**
- Existing emails from Insider Access
- Existing emails from Future Insider

**Payload format:**
```json
{
  "email": "user@example.com",
  "source": "insider-access",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "submission_date": "January 15, 2025, 10:30 AM",
  "exists": true
}
```

### n8n Webhook 2 (New Users)
URL: `https://n8n.srv882974.hstgr.cloud/webhook/76e7b4bb-f5ed-4c1c-b17d-69c141a49ab0`

**Should receive:**
- Non-existing emails from Future Insider ONLY

**Payload format:**
```json
{
  "email": "newuser@example.com",
  "source": "future-insider",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "submission_date": "January 15, 2025, 10:30 AM",
  "exists": false
}
```

---

## Visual Verification Checklist

### Loading States
- [ ] Spinner animation appears
- [ ] Button text changes to "Checking..."
- [ ] Input field is disabled
- [ ] Button is disabled with reduced opacity

### Insider Access - Existing Email
- [ ] Gold checkmark icon appears
- [ ] Title: "You're on the list"
- [ ] Correct message displayed
- [ ] "Done" button works
- [ ] "Share HeyProData" button works

### Insider Access - Non-Existing Email
- [ ] Orange info icon appears
- [ ] Title: "Reserve your spot"
- [ ] Message: "I can't find that email..."
- [ ] "Reserve My Spot" button scrolls to Future Insider
- [ ] "Close" button closes popup

### Future Insider - Existing Email
- [ ] Gold checkmark icon appears
- [ ] Title: "You're on the list"
- [ ] Correct message displayed
- [ ] "Done" button works
- [ ] "Share HeyProData" button works

### Future Insider - Non-Existing Email
- [ ] Gold bookmark icon appears
- [ ] Title: "Spot Reserved"
- [ ] Correct message displayed
- [ ] "Done" button works
- [ ] "Share HeyProData" button works

### Smooth Scrolling
- [ ] Clicking "Reserve My Spot" from popup scrolls smoothly
- [ ] Target section (Future Insider) is centered in viewport
- [ ] No jarring jumps or layout shifts

---

## Browser Console Checks

Open browser DevTools Console and check for:

### Success Logs (Green)
```
[Landing Email Check] Checked X auth users
[Landing Email Check] user@example.com: exists=true
[Landing Webhook] Triggering existing-user webhook for: user@example.com
[Landing Webhook] Successfully triggered existing-user webhook
```

### Error Logs (Red)
If you see any errors:
- `Email check failed:` - Check Supabase connection
- `Webhook trigger failed` - Check webhook URLs are accessible
- `Database error` - Check environment variables

---

## Edge Case Testing

### Email Format Variations
Test with different email formats to ensure normalization works:
- `Test@Example.com` (mixed case)
- ` test@example.com ` (with spaces)
- `TEST@EXAMPLE.COM` (all caps)

All should be treated as the same email: `test@example.com`

### Rapid Clicking
- Try clicking submit button multiple times rapidly
- Button should be disabled during loading
- Should not send multiple requests

### Empty Email
- Try submitting without entering email
- HTML5 validation should prevent submission
- Form should show "Please fill out this field"

### Invalid Email Format
- Try submitting: `notanemail`
- HTML5 validation should prevent submission
- Form should show "Please include an '@' in the email address"

---

## Performance Testing

### Response Times
Check that:
- Email check completes within 2-3 seconds
- Webhook triggers don't block UI
- Loading states appear immediately on submit

### Database Query Performance
- With 100+ users, pagination should handle all records
- No timeout errors
- Console should log total users checked

---

## Troubleshooting

### Issue: "Database error. Please try again."
**Solution:**
1. Check `.env.local` file exists
2. Verify Supabase credentials are correct:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Test Supabase connection directly

### Issue: Webhooks not receiving data
**Solution:**
1. Check webhook URLs are accessible
2. Verify n8n webhooks are active
3. Check network tab in DevTools for webhook POST requests
4. Look for CORS errors in console

### Issue: Email always shows as "not found"
**Solution:**
1. Verify the test email actually exists in database
2. Check auth.users table in Supabase dashboard
3. Verify email normalization is working (lowercase, trimmed)

### Issue: Page doesn't scroll to Future Insider
**Solution:**
1. Check `futureInsiderRef` is attached to div
2. Verify `scrollIntoView` is supported by browser
3. Check console for JavaScript errors

---

## Success Criteria

✅ **All tests passing if:**
1. Existing emails show "You're on the list" in both sections
2. Non-existing email in Insider Access shows "Reserve your spot"
3. Non-existing email in Future Insider shows "Spot Reserved"
4. Loading spinners appear and disappear correctly
5. Webhooks receive correct payloads
6. Smooth scrolling works from reserve popup
7. No console errors
8. All popups display correctly
9. Buttons work as expected
10. Email normalization handles edge cases

---

## Production Deployment Checklist

Before deploying to production:
- [ ] All tests pass in development
- [ ] Webhook URLs are production URLs (not test)
- [ ] Environment variables set in production
- [ ] Supabase production database has user data
- [ ] Rate limiting configured (optional)
- [ ] Error monitoring set up (optional)
- [ ] Test with real emails from database
- [ ] Verify n8n webhooks are receiving data
- [ ] Check mobile responsiveness
- [ ] Test in different browsers (Chrome, Firefox, Safari)

---

## Support

For issues or questions:
1. Check server logs: `tail -f /var/log/[app-name]/error.log`
2. Check browser console for client-side errors
3. Verify API endpoints are accessible
4. Check n8n webhook execution logs
5. Review implementation documentation: `LANDING_PAGE_EMAIL_VALIDATION_IMPLEMENTATION.md`

---

**Last Updated:** January 2025
**Status:** ✅ Ready for Testing
