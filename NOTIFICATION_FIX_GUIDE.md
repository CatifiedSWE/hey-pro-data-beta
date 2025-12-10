# Notification System Fix Guide

## Problem Identified
The user is seeing hardcoded notification data instead of real notifications from the database. The notification count is static (always "2") and doesn't update when new messages are sent.

## Root Cause Analysis
The notification system is actually properly implemented in the code, but there are likely issues with:
1. **Old test/seed data in the database** - Notifications like "New job match", "Event reminder" are likely real database entries from testing
2. **Frontend not fetching data** - Possible authentication or API connection issue
3. **Notifications not being created** - Chat messages might not be triggering notification creation

## Solution Steps

### Step 1: Check Database for Test Data

Run this SQL query in your Supabase SQL Editor:

```sql
-- Check current notifications
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    is_read,
    created_at,
    actor_id
FROM notifications
ORDER BY created_at DESC
LIMIT 50;
```

If you see notifications with titles like "New job match", "Event reminder", etc., these are test data.

### Step 2: Clean Up Test Notifications (OPTIONAL)

**WARNING: This will delete notifications. Only run if you want to start fresh.**

```sql
-- Delete all notifications (or specific types)
DELETE FROM notifications;

-- OR delete only non-chat notifications
DELETE FROM notifications 
WHERE type NOT IN ('chat_message', 'direct_message', 'conversation_request', 'group_message');
```

### Step 3: Verify Notification Creation

Check if notifications are being created when messages are sent:

1. Send a test message between two users in your chat
2. Run this query to check if a notification was created:

```sql
SELECT 
    n.*,
    up.first_name,
    up.surname
FROM notifications n
LEFT JOIN user_profiles up ON up.user_id = n.actor_id
WHERE n.type IN ('chat_message', 'direct_message', 'conversation_request')
ORDER BY n.created_at DESC
LIMIT 10;
```

If no notification appears, there's an issue with the message sending API.

### Step 4: Test the Notifications API

Test the API directly with curl (replace YOUR_JWT_TOKEN with your actual token):

```bash
# Get your JWT token from browser DevTools -> Application -> Cookies -> sb-access-token
# Or from localStorage

curl -X GET "http://localhost:3000/api/notifications?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {...},
    "unreadCount": 0
  }
}
```

### Step 5: Check Frontend Console Logs

1. Open your browser DevTools (F12)
2. Go to the Console tab
3. Look for messages starting with `[useNotifications]`
4. Check for any errors or authentication issues

### Step 6: Verify Real-time Subscriptions

Check if Supabase Realtime is enabled for the notifications table:

```sql
-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify it's enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';
```

### Step 7: Check RLS Policies

Verify Row Level Security policies are correct:

```sql
-- View current RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'notifications';
```

Expected policies:
- Users can SELECT their own notifications
- System can INSERT notifications
- Users can UPDATE their own notifications

If policies are missing, run:

```sql
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for viewing own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for inserting notifications (system)
CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Policy for updating own notifications
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id);
```

## Testing Checklist

After applying fixes:

- [ ] Send a chat message between two users
- [ ] Check if a notification appears in the recipient's dropdown
- [ ] Verify the badge count increases
- [ ] Click on the notification - it should mark as read
- [ ] Verify the badge count decreases
- [ ] Send another message - new notification should appear
- [ ] Check browser console for no errors
- [ ] Verify notifications show sender's name and avatar
- [ ] Test mark all as read functionality

## Common Issues and Solutions

### Issue 1: "No auth token available"
**Solution:** Ensure user is logged in and Supabase session is active.

### Issue 2: API returns 401 Unauthorized
**Solution:** Check that the JWT token is being sent correctly in the Authorization header.

### Issue 3: Notifications appear but don't update
**Solution:** Check that Supabase Realtime is enabled and the frontend subscription is working.

### Issue 4: Badge count always shows "2"
**Solution:** This is hardcoded data. Clear test notifications from database and test again.

### Issue 5: New messages don't create notifications
**Solution:** Check the chat message API (POST /api/chat/conversations/[conversationId]/messages) - the notification insert code should be around line 255-269.

## Files Modified for Debugging

The following file has been updated with enhanced logging:
- `/app/hooks/useNotifications.ts` - Added console.log statements to track API calls and responses

Check the browser console for detailed information about what's happening with notifications.

## Next Steps

1. Run the SQL queries above to check your database
2. Clear any test notifications
3. Send a test message and verify notification creation
4. Check browser console for any errors
5. If issues persist, check the troubleshooting section

## Support

If you continue to see issues after following this guide:
1. Check the browser console for `[useNotifications]` logs
2. Check the terminal/server logs for API errors
3. Verify your Supabase connection is working
4. Test the notifications API endpoint directly with curl
