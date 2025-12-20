# Landing Page Email Validation Implementation

## Overview
This implementation adds email validation and webhook integration to the landing page's two email input sections: **Insider Access** and **Future Insider**.

## Implementation Date
January 2025

---

## Features Implemented

### 1. Backend API Endpoints

#### `/api/landing/check-email` (POST)
**Purpose**: Check if an email exists in the Supabase database

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "exists": true,
  "message": "Email exists in database"
}
```

**Logic**:
- Normalizes email to lowercase and trims whitespace
- Checks `auth.users` table (Supabase authentication)
- Checks `user_profiles` table as backup
- Returns `exists: true` if email found in either table

---

#### `/api/landing/submit-webhook` (POST)
**Purpose**: Trigger appropriate n8n webhook based on email existence

**Request Body**:
```json
{
  "email": "user@example.com",
  "exists": true,
  "source": "insider-access" | "future-insider"
}
```

**Response**:
```json
{
  "success": true,
  "webhookTriggered": true,
  "webhookType": "existing-user" | "new-user",
  "message": "Webhook triggered successfully"
}
```

**Webhook URLs**:
- **Existing User**: `https://n8n.srv882974.hstgr.cloud/webhook/8626cfd0-07c8-4cf5-93f8-750c42fa481b`
- **New User**: `https://n8n.srv882974.hstgr.cloud/webhook/76e7b4bb-f5ed-4c1c-b17d-69c141a49ab0`

**Payload Sent to Webhooks**:
```json
{
  "email": "user@example.com",
  "source": "insider-access",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "submission_date": "January 15, 2025, 10:30 AM",
  "exists": true
}
```

---

### 2. Frontend Implementation (`TierSections.tsx`)

#### State Management
- `insiderEmail` - Email input value for Insider Access section
- `futureEmail` - Email input value for Future Insider section
- `isLoadingInsider` - Loading state for Insider Access submission
- `isLoadingFuture` - Loading state for Future Insider submission
- `activePopup` - Controls which popup is displayed ('insider' | 'future' | 'share' | 'reserve' | null)
- `futureInsiderRef` - React ref for smooth scrolling to Future Insider section

#### Flow Logic

##### **Insider Access Section**
When user submits email:
1. Show loading spinner
2. Call `/api/landing/check-email` to verify email existence
3. Call `/api/landing/submit-webhook` to trigger appropriate webhook
4. **If email EXISTS**:
   - Show "You're on the list" popup
   - Trigger existing-user webhook
5. **If email DOES NOT EXIST**:
   - Show "Reserve your spot" popup
   - Popup has button to scroll to Future Insider section
   - Does NOT trigger webhook yet

##### **Future Insider Section**
When user submits email:
1. Show loading spinner
2. Call `/api/landing/check-email` to verify email existence
3. Call `/api/landing/submit-webhook` to trigger appropriate webhook
4. **If email EXISTS**:
   - Show "You're on the list" popup
   - Trigger existing-user webhook
5. **If email DOES NOT EXIST**:
   - Show "Spot Reserved" popup
   - Trigger new-user webhook

---

## User Experience Flow

### Scenario 1: Existing User - Insider Access
1. User enters registered email in **Insider Access** section
2. Clicks "Activate Access"
3. Loading spinner shows ("Checking...")
4. Popup appears: "You're on the list"
5. Message: "Thanks for confirming your email. We'll be in touch with your activation link as soon as Insider Access opens."
6. Webhook 1 triggered with email

### Scenario 2: New User - Insider Access
1. User enters unregistered email in **Insider Access** section
2. Clicks "Activate Access"
3. Loading spinner shows ("Checking...")
4. Popup appears: "Reserve your spot"
5. Message: "I can't find that email. Want to try another one, or jump in and reserve your spot?"
6. Button: "Reserve My Spot" (scrolls to Future Insider section)
7. NO webhook triggered at this stage

### Scenario 3: Existing User - Future Insider
1. User enters registered email in **Future Insider** section
2. Clicks "Reserve My Spot"
3. Loading spinner shows ("Checking...")
4. Popup appears: "You're on the list"
5. Message: "Thanks for confirming your email. We'll be in touch with your activation link as soon as Insider Access opens."
6. Webhook 1 triggered with email

### Scenario 4: New User - Future Insider
1. User enters unregistered email in **Future Insider** section
2. Clicks "Reserve My Spot"
3. Loading spinner shows ("Checking...")
4. Popup appears: "Spot Reserved"
5. Message: "You're in line. We'll notify you when it's time to create your profile and join HeyProData."
6. Webhook 2 triggered with email

---

## UI Components

### Loading States
- Spinner animation with text "Checking..."
- Disabled input and button during loading
- Opacity reduced on disabled button

### Popups

#### 1. "You're on the list" (Insider & Future - Existing Email)
- Gold checkmark icon (#C5A059)
- Title: "You're on the list"
- Description: Confirmation message about activation link
- Buttons: "Done", "Share HeyProData"

#### 2. "Spot Reserved" (Future - New Email)
- Gold bookmark icon (#C5A059)
- Title: "Spot Reserved"
- Description: "You're in line. We'll notify you..."
- Buttons: "Done", "Share HeyProData"

#### 3. "Reserve your spot" (Insider - New Email) **NEW**
- Orange info icon (#FF7A8B)
- Title: "Reserve your spot"
- Description: "I can't find that email. Want to try another one, or jump in and reserve your spot?"
- Buttons: "Reserve My Spot" (scrolls), "Close"

#### 4. "Share HeyProData"
- Share link popup with copy functionality
- Pre-existing component, unchanged

---

## Technical Details

### Email Normalization
All emails are normalized before processing:
```typescript
const normalizedEmail = email.toLowerCase().trim();
```

### Database Tables Checked
1. `auth.users` - Supabase authentication table (primary check)
2. `user_profiles` - User profile data (backup check)

### Pagination
The email check API uses pagination to fetch all users from `auth.users`:
- Page size: 1000 users per page
- Continues until all users fetched
- Ensures no emails are missed

### Smooth Scrolling
When "Reserve My Spot" is clicked from the reserve popup:
```typescript
futureInsiderRef.current?.scrollIntoView({ 
  behavior: 'smooth', 
  block: 'center' 
});
```

---

## Files Modified/Created

### Created:
- `/app/app/api/landing/check-email/route.ts` - Email existence check endpoint
- `/app/app/api/landing/submit-webhook/route.ts` - Webhook trigger endpoint

### Modified:
- `/app/app/components/landing/TierSections.tsx` - Added email validation logic and new popup

---

## Testing

### Manual Testing Checklist
- [ ] Insider Access - Existing email shows "You're on the list"
- [ ] Insider Access - New email shows "Reserve your spot"
- [ ] Clicking "Reserve My Spot" scrolls to Future Insider section
- [ ] Future Insider - Existing email shows "You're on the list"
- [ ] Future Insider - New email shows "Spot Reserved"
- [ ] Loading spinners appear during submission
- [ ] Webhooks triggered correctly (check n8n logs)
- [ ] Email normalization works (uppercase, spaces)
- [ ] Form validation prevents empty submissions

### API Testing
Run the test script:
```bash
./test-landing-api.sh
```

### Webhook Testing
Check n8n webhook logs:
- **Webhook 1** should receive existing user emails from both sections
- **Webhook 2** should receive new user emails from Future Insider only

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Security Considerations

1. **Service Role Key**: Used only server-side in API routes
2. **Email Validation**: Server-side validation prevents spoofing
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **CORS**: API routes are protected by Next.js built-in CORS

---

## Future Enhancements

Possible improvements:
- Add rate limiting to prevent spam submissions
- Store submission attempts in database for analytics
- Add email format validation on frontend
- Implement retry logic for webhook failures
- Add admin notification for new submissions
- Create dashboard to view submission statistics

---

## Support

### Common Issues

**Issue**: "Database error. Please try again."
- **Cause**: Supabase connection issues or missing environment variables
- **Solution**: Check `.env.local` file has correct Supabase credentials

**Issue**: Webhook not triggering
- **Cause**: Network issues or incorrect webhook URL
- **Solution**: Check n8n webhook URLs are accessible and correct

**Issue**: Email not found when it should exist
- **Cause**: Email mismatch (different capitalization or spaces)
- **Solution**: Email normalization should handle this automatically

### Debugging

Enable detailed logs:
```typescript
console.log('[Landing Email Check] Checked X auth users');
console.log('[Landing Webhook] Triggering webhook...');
```

Check browser console and server logs for detailed error messages.

---

## Summary

This implementation successfully adds email validation and webhook integration to the HeyProData landing page. Users can now:
1. Submit emails in both Insider Access and Future Insider sections
2. Receive appropriate feedback based on email existence
3. Be automatically directed to reserve a spot if email not found
4. Trigger webhooks for tracking and notifications

All functionality includes loading states, error handling, and smooth user experience transitions.

**Status**: ✅ Implementation Complete
**Testing**: Ready for QA
**Deployment**: Ready for production
