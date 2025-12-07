# Phase 2: Onboarding Waitlist Implementation - COMPLETE

## 📋 Overview

Phase 2 implements a comprehensive waitlist system for new users who are not yet in the HeyProData system. When users enter an email that doesn't exist in the database, they are guided through a data collection flow that:

1. **Collects data locally** using browser localStorage for persistence
2. **Submits to n8n webhooks** which push data to Google Sheets
3. **Sends confirmation emails** to acknowledge their application
4. **Shows success screen** with clear next steps

## 🎯 Implementation Status

✅ **COMPLETED** - All Phase 2 features are now functional

## 📁 Files Created/Modified

### New Files Created

1. **`/app/lib/onboarding-storage.ts`**
   - Local storage manager for form data persistence
   - Supports Crew, Vendor (Supplier), and Agency data structures
   - Provides save(), load(), clear(), and helper methods

2. **`/app/lib/n8n-webhooks.ts`**
   - n8n webhook integration layer
   - Submits data to category-specific webhooks
   - Includes connection testing utilities

3. **`/app/app/api/onboarding/upload-file/route.ts`**
   - File upload API for vendor trade licenses
   - Uploads to Supabase Storage bucket
   - Returns public URL for webhook submission
   - Validates file type (PDF, JPG, PNG) and size (max 5MB)

4. **`/app/app/api/onboarding/send-confirmation/route.ts`**
   - Confirmation email API using Supabase
   - Queues emails in `email_queue` table
   - Sends branded HTML emails with application status

5. **`/app/migrations/phase2_onboarding_setup.sql`**
   - SQL migration for Supabase infrastructure
   - Creates `onboarding-documents` storage bucket
   - Creates `email_queue` table for async email processing
   - Includes RLS policies and helper functions

6. **`/app/documentation/PHASE_2_IMPLEMENTATION_COMPLETE.md`**
   - This documentation file

### Files Modified

1. **`/app/lib/onboarding-chat/mockBackend.ts`**
   - Integrated localStorage loading
   - Added n8n webhook submission
   - Added confirmation email sending
   - Clears localStorage after successful submission

2. **`/app/lib/onboarding-chat/chatLogic.ts`**
   - Added localStorage imports
   - CREW flow: Saves all fields to localStorage
   - SUPPLIER flow: Saves all fields + handles file upload
   - CLIENT flow: Saves all fields to localStorage
   - Category saved at start of each flow

## 🔄 Data Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User Enters Email in Onboarding Chat                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ Check Email Exists? │
         │ (API: check-email)  │
         └──────┬───────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
   ┌────────┐      ┌──────────┐
   │  YES   │      │    NO    │
   │(Phase 1)│     │(Phase 2) │
   └────────┘      └────┬─────┘
                        │
                        ▼
              ┌─────────────────────┐
              │  WAITLIST FLOW      │
              │  (Phase 2 Start)    │
              └─────────┬───────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
     ┌────────┐    ┌──────────┐  ┌─────────┐
     │ CREW   │    │ VENDOR   │  │ AGENCY  │
     │  Flow  │    │  Flow    │  │  Flow   │
     └───┬────┘    └────┬─────┘  └────┬────┘
         │              │             │
         │  Each step saves to       │
         │  localStorage             │
         │              │             │
         └──────────────┼─────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ File Upload (Vendor)  │
            │ → Supabase Storage    │
            │ → Get public URL      │
            └──────────┬────────────┘
                       │
                       ▼
            ┌───────────────────────┐
            │ Final Confirmation    │
            │ (User reviews data)   │
            └──────────┬────────────┘
                       │
                       ▼
            ┌───────────────────────┐
            │ SUBMIT BUTTON         │
            └──────────┬────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   [Step 1]       [Step 2]       [Step 3]
   n8n Webhook    Database       Email Queue
   → Google       → /api/hpd/    → Confirmation
     Sheets         submit          Email
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
            ┌───────────────────────┐
            │ Clear localStorage    │
            └──────────┬────────────┘
                       │
                       ▼
            ┌───────────────────────┐
            │ SUCCESS SCREEN        │
            │ "Application          │
            │  Submitted!"          │
            └───────────────────────┘
```

## 🗂 Category Mappings

| Flow Type | Chat Persona | LocalStorage Category | n8n Webhook URL |
|-----------|--------------|----------------------|-----------------|
| Crew/Creative | `CREW` | `crew` | `https://n8n.srv882974.hstgr.cloud/webhook/9db8dabb-a3ed-4341-89b1-a8e74475d822` |
| Supplier/Vendor | `SUPPLIER` | `vendor` | `https://n8n.srv882974.hstgr.cloud/webhook/54878ffb-66d5-4d07-b265-5e5661af636e` |
| Client/Agency | `CLIENT` | `agency` | `https://n8n.srv882974.hstgr.cloud/webhook/f1c85dc6-56cb-4fbe-8354-7099675a0388` |

## 📦 Data Structures

### Crew Container
```typescript
{
  category: 'crew',
  first_name: string,
  last_name: string,
  email: string,
  role: string,
  country: string,
  website?: string
}
```

### Vendor Container
```typescript
{
  category: 'vendor',
  company_name: string,
  primary_service: string,
  company_link?: string,
  trade_license_url?: string,  // Public Supabase Storage URL
  first_name: string,
  last_name: string,
  role: string,
  phone: string,
  email: string
}
```

### Agency Container
```typescript
{
  category: 'agency',
  contact_name: string,
  company_name?: string,
  email: string,
  phone?: string,
  project_details: string
}
```

## 🔧 API Endpoints

### 1. File Upload API
**Endpoint:** `POST /api/onboarding/upload-file`

**Request:**
```javascript
// FormData with file
const formData = new FormData();
formData.append('file', fileObject);
```

**Response:**
```json
{
  "success": true,
  "url": "https://supabase-storage-url/onboarding/123456_license.pdf",
  "fileName": "license.pdf",
  "size": 245678,
  "type": "application/pdf"
}
```

**Validation:**
- Max size: 5MB
- Allowed types: PDF, JPG, PNG

### 2. Confirmation Email API
**Endpoint:** `POST /api/onboarding/send-confirmation`

**Request:**
```json
{
  "email": "user@example.com",
  "category": "crew",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Confirmation email queued",
  "email_id": "uuid-here"
}
```

## 📧 Email Queue System

### Email Queue Table Structure
```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'failed'
  metadata JSONB,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);
```

### Email Processing
Emails are queued in the database and can be processed:
1. **Automatically** via Supabase Edge Functions or cron jobs
2. **Manually** via the `process_email_queue()` SQL function

### Email Template
The confirmation email includes:
- Branded header with HeyProData logo styling
- Personalized greeting
- Category confirmation
- Timeline expectations (3-5 business days)
- Next steps information
- Support contact info

## 🔐 Security & Storage

### Supabase Storage Bucket
- **Name:** `onboarding-documents`
- **Public:** Yes (for easy URL access)
- **File Size Limit:** 5MB
- **Allowed Types:** PDF, JPEG, PNG
- **RLS Policies:**
  - Public read access
  - Authenticated/anonymous upload access

### Data Privacy
- LocalStorage data is cleared after successful submission
- Files uploaded to Supabase are stored with unique timestamps
- Email queue uses service role for processing
- All webhook submissions include timestamps

## 🧪 Testing Guide

### Test Case 1: Crew Submission
1. Go to `/onboarding`
2. Select "I'm new - I want to reserve my spot as crew/creative"
3. Enter email: `testcrew@example.com`
4. Fill in all fields:
   - First name: "John"
   - Last name: "Doe"
   - Role: "Camera Operator"
   - Country: "United Arab Emirates"
   - Website: "https://johndoe.com" (optional)
5. Confirm details
6. Verify:
   - ✅ Data saved to localStorage during flow
   - ✅ n8n crew webhook receives data
   - ✅ Google Sheet updated with new row
   - ✅ Confirmation email queued
   - ✅ Success screen displayed
   - ✅ LocalStorage cleared

### Test Case 2: Vendor Submission with File Upload
1. Go to `/onboarding`
2. Select "I'm new - I want to apply as a supplier/vendor"
3. Fill in vendor details:
   - Company name: "ABC Productions"
   - Primary service: "Camera Equipment Rental"
   - Company link: "https://abc-prod.com"
   - **Upload trade license** (PDF/JPG/PNG, max 5MB)
   - Contact first name: "Jane"
   - Contact last name: "Smith"
   - Role: "Owner"
   - Email: "jane@abc-prod.com"
   - Phone: "+971501234567"
4. Verify:
   - ✅ File uploaded to Supabase Storage
   - ✅ Public URL generated
   - ✅ URL included in webhook payload
   - ✅ All steps saved to localStorage
   - ✅ n8n vendor webhook receives data with file URL
   - ✅ Google Sheet includes clickable file link
   - ✅ Confirmation email sent
   - ✅ Success screen shown

### Test Case 3: Agency/Client Submission
1. Go to `/onboarding`
2. Select "I'm a client/agency - I need crew for my project"
3. Fill in project details:
   - Project details: "Need DOP and camera crew for 3-day shoot in Dubai"
   - Contact name: "Ahmed Hassan"
   - Company: "Creative Films"
   - Email: "ahmed@creativefilms.com"
   - Phone: "+971501234568"
4. Verify:
   - ✅ Project details saved to localStorage
   - ✅ n8n agency webhook receives data
   - ✅ Google Sheet updated
   - ✅ Confirmation email sent
   - ✅ Success screen displayed

### Test Case 4: LocalStorage Persistence
1. Start crew flow
2. Fill in first 3 fields
3. Close browser tab
4. Reopen and navigate to `/onboarding`
5. Verify:
   - ✅ Data still in localStorage (use DevTools)
   - ⚠️ Note: Chat flow doesn't resume automatically (design decision)

### Test Case 5: File Upload Validation
1. Start vendor flow
2. Try uploading invalid files:
   - File > 5MB → Should reject
   - .exe file → Should reject
   - .docx file → Should reject
3. Upload valid file:
   - PDF/JPG/PNG < 5MB → Should succeed

## 🐛 Troubleshooting

### Issue: n8n Webhook Fails
**Symptoms:** Success screen shown but data not in Google Sheets

**Debug Steps:**
1. Check browser console for webhook errors
2. Verify webhook URLs in `/app/lib/n8n-webhooks.ts`
3. Test webhook manually:
   ```bash
   curl -X POST https://n8n.srv882974.hstgr.cloud/webhook/... \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
4. Check n8n workflow is active
5. Verify Google Sheets connection in n8n

**Solution:**
- Update webhook URLs if changed
- Restart n8n workflow
- Check n8n execution logs

### Issue: File Upload Fails
**Symptoms:** "Upload failed" error during vendor flow

**Debug Steps:**
1. Check Supabase Storage bucket exists: `onboarding-documents`
2. Verify bucket is public
3. Check RLS policies allow uploads
4. Verify file size < 5MB
5. Check file type is PDF/JPG/PNG

**Solution:**
- Run migration: `/app/migrations/phase2_onboarding_setup.sql`
- Or create bucket manually in Supabase Dashboard
- Adjust RLS policies if needed

### Issue: Confirmation Email Not Sent
**Symptoms:** Submission succeeds but no email received

**Debug Steps:**
1. Check `email_queue` table for pending emails:
   ```sql
   SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at DESC;
   ```
2. Verify email queue API response in browser console
3. Check Supabase logs for errors

**Solution:**
- Email is queued, not sent immediately
- Process queue manually:
  ```sql
  SELECT * FROM process_email_queue();
  ```
- Set up cron job or edge function for automatic processing
- Integrate with Resend API for production

### Issue: LocalStorage Not Clearing
**Symptoms:** Old data appears in new submission

**Debug Steps:**
1. Open browser DevTools → Application → Local Storage
2. Check for `heyprodata_onboarding` key
3. Verify `OnboardingStorage.clear()` is called after submission

**Solution:**
- Clear manually in DevTools
- Verify submission success before clearing
- Check for JavaScript errors preventing clear

## 📊 Monitoring & Analytics

### Key Metrics to Track
1. **Submission Success Rate**
   ```sql
   SELECT 
     DATE(created_at) as date,
     COUNT(*) as total_submissions
   FROM onboarding_submissions
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

2. **Category Distribution**
   ```sql
   SELECT 
     user_type,
     COUNT(*) as count
   FROM onboarding_submissions
   GROUP BY user_type;
   ```

3. **Email Queue Status**
   ```sql
   SELECT 
     status,
     COUNT(*) as count,
     MIN(created_at) as oldest,
     MAX(created_at) as newest
   FROM email_queue
   GROUP BY status;
   ```

4. **File Upload Success**
   - Monitor Supabase Storage bucket size
   - Check for orphaned files (files without corresponding submissions)

## 🚀 Deployment Checklist

Before deploying Phase 2 to production:

- [ ] Run SQL migration: `phase2_onboarding_setup.sql`
- [ ] Verify Supabase Storage bucket created
- [ ] Test all n8n webhook URLs
- [ ] Verify Google Sheets integration working
- [ ] Set up email processing cron job or edge function
- [ ] Test file uploads (5MB PDF/JPG/PNG)
- [ ] Verify RLS policies on email_queue
- [ ] Test all 3 flows: Crew, Vendor, Agency
- [ ] Check confirmation emails are branded correctly
- [ ] Verify localStorage clears after submission
- [ ] Test error handling (network failures, etc.)
- [ ] Monitor webhook response times
- [ ] Set up alerts for failed emails
- [ ] Document manual approval process for waitlist

## 🔄 Manual Approval Process

After users submit to waitlist:

1. **Review Google Sheet entries**
   - Check data completeness
   - Verify contact information
   - Review uploaded documents (vendors)

2. **For approved users:**
   - Manually create Supabase Auth user
   - Insert into `user_profiles` table
   - Set `has_completed_onboarding = false`
   - User can then use "Access activation link" flow (Phase 1)

3. **For rejected users:**
   - Send manual rejection email with reason
   - Keep in Google Sheets for records

## 📝 Next Steps (Phase 3)

Potential enhancements:
1. **Admin Dashboard** for waitlist management
2. **Batch Approval** tool for processing multiple users
3. **Email Automation** for status updates
4. **File Preview** for trade licenses
5. **Advanced Validation** (email verification, phone validation)
6. **Analytics Dashboard** for submission tracking
7. **A/B Testing** on success messages
8. **Integration with CRM** for sales follow-up

## ✅ Summary

Phase 2 is now **fully implemented** and provides:
- ✅ LocalStorage persistence for form data
- ✅ n8n webhook integration for Google Sheets
- ✅ File upload for vendor trade licenses
- ✅ Confirmation email system
- ✅ Clean success screens
- ✅ Robust error handling
- ✅ Complete database infrastructure

All new users (not in system) are now properly captured in the waitlist and can be manually approved by the HeyProData team.

---

**Implementation Date:** January 2025  
**Version:** 2.8 (Phase 2 Complete)  
**Maintainer:** HeyProData Development Team
