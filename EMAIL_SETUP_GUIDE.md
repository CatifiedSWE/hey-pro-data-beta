# Email Acknowledgement Setup Guide

## Issue Encountered
The original implementation using `inviteUserByEmail` was causing submission failures because it's designed for actual user invitations, not general email notifications.

## Solution Implemented
**Queue-Based Email System** - More reliable and scalable approach

### How It Works:
1. When user submits waitlist form → Entry saved to database ✅
2. Email request added to `email_queue` table
3. Separate process (Edge Function or cron) sends emails from queue
4. Submission never fails due to email issues

## Setup Instructions

### Step 1: Create Email Queue Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of /app/migrations/create_email_queue.sql
```

Or run directly:

```bash
psql $DATABASE_URL < /app/migrations/create_email_queue.sql
```

### Step 2: Configure Supabase Email Settings

1. Go to Supabase Dashboard → **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable custom SMTP or use Supabase's default
4. Test email delivery

### Step 3: Deploy Email Processing Function (Option A - Recommended)

Deploy the Supabase Edge Function:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-waitlist-email

# Set up a cron job to run it every minute
```

Then create a Database Webhook or Cron job:
- Go to Database → Webhooks
- Create webhook that triggers `send-waitlist-email` function every 1-2 minutes

### Step 4: Alternative - Database Trigger (Option B)

If you prefer real-time sending without Edge Functions:

```sql
-- Create a function to send email immediately
CREATE OR REPLACE FUNCTION send_acknowledgement_email()
RETURNS TRIGGER AS $$
BEGIN
  -- This would integrate with your email service
  -- For now, it logs the email details
  RAISE NOTICE 'Send email to % for % waitlist', NEW.recipient_email, NEW.template_data->>'userType';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_email_queue_insert
AFTER INSERT ON email_queue
FOR EACH ROW
EXECUTE FUNCTION send_acknowledgement_email();
```

### Step 5: Manual Email Sending (Option C - Temporary)

If you want to manually send emails while setting up automation:

1. Query pending emails:
```sql
SELECT * FROM email_queue WHERE status = 'pending';
```

2. For each email, send manually and update:
```sql
UPDATE email_queue 
SET status = 'sent', sent_at = NOW() 
WHERE id = 'email-id-here';
```

## Email Template

The system uses this template format:

**Subject:** Thank you for joining the waitlist!

**Body:**
```
Hi [Name],

We've received your details and you're now on the waitlist as a [User Type].

We're onboarding in batches to keep things organized and ensure the best experience. 
We'll email you when your turn opens up!

Thank you for your patience.

Best regards,
The HeyProData Team
```

## Customizing Email Templates

### In Supabase Dashboard:
1. Go to **Authentication** → **Email Templates**
2. Find **"Invite user"** template
3. Customize with your branding:

```html
<h2>Thank you for joining the waitlist!</h2>
<p>Hi {{ .Data.name }},</p>
<p>We've received your details and you're now on the waitlist as a <strong>{{ .Data.userType }}</strong>.</p>
<p>We're onboarding in batches to keep things organized. We'll email you when your turn opens up!</p>
```

## Testing the System

### 1. Test Form Submission:
```bash
curl -X POST http://localhost:3000/api/hpd/submit \
  -H "Content-Type: application/json" \
  -d '{
    "user_type": "crew",
    "submitted_fields": {
      "firstName": "John",
      "email": "test@example.com"
    }
  }'
```

### 2. Check Email Queue:
```sql
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;
```

### 3. Test Email Sending Function:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-waitlist-email \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring

### Check Email Status:
```sql
-- Pending emails
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';

-- Failed emails
SELECT * FROM email_queue WHERE status = 'failed';

-- Success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM email_queue
GROUP BY status;
```

## Troubleshooting

### Issue: Submissions failing
✅ **Fixed** - Email sending is now non-blocking and won't cause submission failures

### Issue: Emails not in queue
- Check if `email_queue` table exists
- Check RLS policies allow inserts
- Check server logs for errors

### Issue: Emails queued but not sent
- Ensure Edge Function is deployed
- Check cron job/webhook is running
- Verify SMTP settings in Supabase
- Check Edge Function logs

### Issue: Email queue table doesn't exist
The system will gracefully fallback and just log emails without causing errors:
```
[Acknowledgement Email] Email queue table not set up yet. Would send to: user@example.com
```

## Production Checklist

- [ ] Create `email_queue` table
- [ ] Configure Supabase SMTP settings
- [ ] Deploy `send-waitlist-email` Edge Function
- [ ] Set up cron job/webhook to process queue
- [ ] Customize email templates in Supabase Dashboard
- [ ] Test full flow end-to-end
- [ ] Set up monitoring/alerts for failed emails
- [ ] Configure email retry logic (already in place)

## Current Status

✅ Form submissions work independently of email sending
✅ Emails are queued for sending
✅ System gracefully handles missing email infrastructure
✅ No submission failures due to email issues

## Next Steps

1. Run the SQL migration to create `email_queue` table
2. Choose email sending approach (Edge Function recommended)
3. Configure Supabase SMTP settings
4. Test the complete flow
5. Monitor the email queue

## Need Help?

- Check Supabase logs: Dashboard → Logs → Edge Functions
- Check database logs for trigger issues
- Review email queue table for failed attempts
- Contact support@heyprodata.com
