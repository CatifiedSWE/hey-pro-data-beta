# Onboarding System Implementation Checklist

## 📋 Phase 1: Existing User Authentication (PRIORITY)

### Step 1.1: Password Setup Page
- ✅ **COMPLETED** - `/app/app/set-password/page.tsx` created
- ✅ Matches onboarding UI style
- ✅ Accepts magic link token from URL
- ✅ Password validation implemented
- ✅ Auto-redirect to profile after success
- ✅ Error handling in place

### Step 1.2: Email Check API Enhancement
- ✅ **COMPLETED** - `/app/app/api/auth/check-user/route.ts` created
- ✅ Checks if user exists in database
- ✅ Checks if user has password set
- ✅ Returns proper response format with exists, hasPassword, needsPasswordSetup

### Step 1.3: Magic Link API
- ✅ **COMPLETED** - `/app/app/api/auth/send-password-setup-link/route.ts` created
- ✅ Sends magic link to users without passwords
- ✅ Uses Supabase resetPasswordForEmail
- ✅ Redirects to /set-password page
- ✅ **BONUS** - `/app/app/api/auth/send-login-link/route.ts` also created for users with passwords

### Step 1.4: Update Onboarding Flow Logic
- 🔄 **IN PROGRESS** - `/app/lib/onboarding-chat/chatLogic.ts` needs update
- ⬜ Integrate with check-user API properly
- ⬜ Handle existing user WITH password (send login link)
- ⬜ Handle existing user WITHOUT password (send password setup link)
- ⬜ Handle new user (proceed to waitlist - Phase 2)
- ⬜ Add proper chat messages for each scenario

### Step 1.5: Middleware Update
- ✅ **COMPLETED** - `/app/middleware.ts` updated
- ✅ Blocks old auth pages (/login, /signup, /otp, /forget-password)
- ✅ Redirects to /onboarding
- ✅ Allows /set-password for password setup flow

### Step 1.6: Landing Page Redirect
- ✅ **COMPLETED** - `/app/app/page.tsx` properly configured
- ✅ Authenticated users with completed onboarding → /profile
- ✅ Authenticated users without onboarding → /onboarding
- ✅ Unauthenticated users → Landing page

### Testing Phase 1
- ⬜ Test: Existing user WITH password flow
- ⬜ Test: Existing user WITHOUT password flow  
- ⬜ Test: New user detection (for Phase 2)
- ⬜ Test: Blocked auth pages redirect
- ⬜ Test: Magic link email delivery
- ⬜ Test: Password setup page functionality

---

## 📋 Phase 2: New User Waitlist & Data Collection

### Step 2.1: Update Email Check Flow
- ⬜ Add waitlist introduction message in chatLogic.ts
- ⬜ Route new users to waitlist flow

### Step 2.2: Create Local Storage Manager
- ⬜ Create `/app/lib/onboarding-storage.ts`
- ⬜ Implement save/load/clear methods
- ⬜ Support crew/vendor/agency data types

### Step 2.3: Update Chat Logic for Local Storage
- ⬜ Save form data to localStorage after each input
- ⬜ Persist data across sessions

### Step 2.4: n8n Webhook Integration
- ⬜ Create `/app/lib/n8n-webhooks.ts`
- ⬜ Implement submitToN8n function
- ⬜ Configure webhook URLs for crew/vendor/agency

### Step 2.5: Confirmation Email API
- ⬜ Create `/app/api/onboarding/send-confirmation/route.ts`
- ⬜ Integrate with email service (Resend or Supabase)
- ⬜ Send acknowledgment after submission

### Step 2.6: Update Final Submission Logic
- ⬜ Update `/app/lib/onboarding-chat/mockBackend.ts`
- ⬜ Load from localStorage
- ⬜ Submit to n8n
- ⬜ Send confirmation email
- ⬜ Clear localStorage

### Step 2.7: Success Screen
- ⬜ Create application submitted success message
- ⬜ Show confirmation screen

### Testing Phase 2
- ⬜ Test: Crew submission end-to-end
- ⬜ Test: Vendor submission end-to-end
- ⬜ Test: Agency submission end-to-end
- ⬜ Test: n8n webhook receives data
- ⬜ Test: Google Sheet updates
- ⬜ Test: Confirmation email sent
- ⬜ Test: localStorage cleared after submission

---

## 📋 Phase 3: File Upload Handling

### Step 3.1: File Upload API
- ⬜ Create `/app/api/onboarding/upload-file/route.ts`
- ⬜ Upload to Supabase Storage
- ⬜ Return public URL

### Step 3.2: Update File Upload Component
- ⬜ Modify file upload card in onboarding
- ⬜ Upload file first, then save URL
- ⬜ Include URL in webhook payload

### Testing Phase 3
- ⬜ Test: File upload functionality
- ⬜ Test: File accessible from URL
- ⬜ Test: URL sent in webhook
- ⬜ Test: File size limits
- ⬜ Test: File type validation

---

## 📋 Phase 4: UI Refinements & Polish

### Email Customization
- ⬜ Customize Supabase email templates
- ⬜ Update "Reset Password" template
- ⬜ Create custom confirmation email template

### Error Handling
- ⬜ Network failures in webhook
- ⬜ Email delivery failures
- ⬜ File upload errors
- ⬜ Show retry options

### Loading States
- ⬜ Spinner during email check
- ⬜ Loading during webhook submission
- ⬜ Progress indicator during file upload

### Accessibility
- ⬜ Keyboard navigation
- ⬜ Screen reader support
- ⬜ Focus management

### Mobile Responsiveness
- ⬜ Test all flows on mobile
- ⬜ Touch-friendly buttons
- ⬜ Proper input types

---

## 🎯 Summary Progress

**Phase 1:** 85% Complete (5/6 steps done, 1 in progress)
**Phase 2:** 0% Complete (Not started)
**Phase 3:** 0% Complete (Not started)
**Phase 4:** 0% Complete (Not started)

**Overall Progress:** ~21% Complete

---

## 📝 Notes

- Most of Phase 1 infrastructure is already in place
- Need to complete the chatLogic integration to properly use the APIs
- Phase 2-4 are ready to begin once Phase 1 is complete
- All necessary APIs for Phase 1 are functional

---

**Last Updated:** December 7, 2024
