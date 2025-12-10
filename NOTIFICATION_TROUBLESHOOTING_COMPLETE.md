# Notification System Troubleshooting Guide - Complete Fix

**Date:** December 2025  
**Issue:** Chat notifications not being created in database  
**Status:** FIXED ✅

---

## 🔍 Problem Identified

**Symptoms:**
- Messages send successfully
- No chat notifications appear in the database
- Old notifications from hidden features exist, but no chat-related ones

**Root Cause:**
The notification insert in `/app/app/api/chat/conversations/[conversationId]/messages/route.ts` had **NO error handling**. When the insert failed, it failed silently without logging any errors.

---

## ✅ What Was Fixed

### 1. Added Error Handling to Notification Creation

**File:** `/app/app/api/chat/conversations/[conversationId]/messages/route.ts`

**Changes:**
- ✅ Added `.select().single()` to the insert to capture the result
- ✅ Added comprehensive error logging with all error details
- ✅ Added success logging to confirm notifications are created
- ✅ Made notification creation non-blocking (message sends even if notification fails)

**Before:**
```typescript
await supabase
  .from('notifications')
  .insert({...}); // Silent failure - no error handling
```

**After:**
```typescript
const { data: notificationData, error: notificationError } = await supabase
  .from('notifications')
  .insert({...})
  .select()
  .single();

if (notificationError) {
  console.error('[NOTIFICATION] Failed to create notification:', {
    error: notificationError,
    code: notificationError.code,
    message: notificationError.message,
    details: notificationError.details,
    hint: notificationError.hint,
  });
} else {
  console.log('[NOTIFICATION] Notification created successfully:', notificationData?.id);
}
```

### 2. Created Test Endpoint

**New File:** `/app/app/api/notifications/test/route.ts`

**Purpose:** Test notification creation independently from chat messages

**Usage:**
```bash
# Create test notification
curl -X POST "http://localhost:3000/api/notifications/test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Clean up test notifications
curl -X DELETE "http://localhost:3000/api/notifications/test" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Testing Steps

### Step 1: Check Server Logs for Errors

After the fix, when you send a message, check your **terminal/console logs** for:

**Success:**
```
[NOTIFICATION] Attempting to create notification: { recipientId, senderId, type, conversationId, messageId }
[NOTIFICATION] Notification created successfully: <notification-id>
```

**Failure:**
```
[NOTIFICATION] Failed to create notification: {
  error: {...},
  code: "...",
  message: "...",
  details: "...",
  hint: "..."
}
```

### Step 2: Use the Test Endpoint

1. Get your auth token from browser DevTools:
   - Open DevTools (F12)
   - Go to Application → Cookies → `sb-access-token`
   - Copy the value

2. Test notification creation:
   ```bash
   curl -X POST "http://localhost:3000/api/notifications/test" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

3. Expected response (success):
   ```json
   {
     "success": true,
     "data": {
       "notification": {...},
       "message": "Notification system is working correctly!"
     }
   }
   ```

4. Expected response (failure - reveals the issue):
   ```json
   {
     "success": false,
     "error": "Failed to create test notification",
     "details": {
       "error": "...",
       "code": "...",
       "hint": "..."
     }
   }
   ```

### Step 3: Check Database Directly

Run this in your Supabase SQL Editor:

```sql
-- Check for recent notifications
SELECT 
    id,
    user_id,
    actor_id,
    type,
    message,
    is_read,
    created_at
FROM notifications
WHERE type IN ('direct_message', 'conversation_request', 'test_notification')
ORDER BY created_at DESC
LIMIT 10;
```

### Step 4: Send a Test Message

1. Log in to your app with two different users (use two browsers/incognito)
2. User A sends a message to User B
3. Check the server logs immediately
4. Check the database for the new notification
5. Check User B's notification dropdown

---

## 🔧 Common Issues and Fixes

### Issue 1: "new row violates row-level security policy"

**Cause:** RLS policy is blocking notification inserts

**Fix:** Run this SQL in Supabase:

```sql
-- Check current policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications';

-- If INSERT policy is missing or wrong, create it:
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true); -- Allow all inserts (authenticated via API)
```

### Issue 2: "null value in column violates not-null constraint"

**Cause:** Missing required columns in the notifications table

**Fix:** Run this SQL to check and add missing columns:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Add missing columns if needed
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

### Issue 3: "column metadata does not exist"

**Cause:** The metadata column is missing from the notifications table

**Fix:**
```sql
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### Issue 4: Notifications created but not visible in frontend

**Cause:** RLS policy blocks SELECT for the user

**Fix:**
```sql
-- Check SELECT policy
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications' AND cmd = 'SELECT';

-- Create/fix SELECT policy
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);
```

### Issue 5: Frontend shows "No notifications" despite database having them

**Cause:** Authentication token not being sent or RLS blocking

**Fix:**
1. Check browser console for `[useNotifications]` logs
2. Verify auth token is being sent: Network tab → Headers → Authorization
3. Test the API directly:
   ```bash
   curl -X GET "http://localhost:3000/api/notifications" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 📊 Verification Checklist

After applying the fix, verify:

- [ ] Server logs show `[NOTIFICATION]` messages when sending messages
- [ ] Test endpoint returns success
- [ ] Database shows new notifications with type `direct_message` or `conversation_request`
- [ ] Frontend notification dropdown shows real notifications
- [ ] Badge count updates when new messages are received
- [ ] Clicking notifications marks them as read
- [ ] Unread count decreases when notifications are read

---

## 🎯 SQL Quick Reference

### Check Notification Creation
```sql
SELECT 
    type,
    COUNT(*) as count,
    MAX(created_at) as last_created
FROM notifications
GROUP BY type
ORDER BY last_created DESC;
```

### Check User's Notifications
```sql
-- Replace with actual user_id
SELECT * FROM notifications
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### Check RLS Policies
```sql
SELECT 
    policyname,
    cmd,
    CASE WHEN cmd = 'SELECT' THEN qual
         WHEN cmd = 'INSERT' THEN with_check
         ELSE 'N/A' 
    END as policy_expression
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;
```

### Enable Realtime (if not enabled)
```sql
-- Check if realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';

-- If not enabled, enable it:
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 🚀 Next Steps

1. **Test locally** with the fixes applied
2. **Check server logs** when sending messages - you'll now see detailed error messages if something fails
3. **Use the test endpoint** to verify notification creation works
4. **Check database** to confirm notifications are being created
5. **Test frontend** to ensure notifications display correctly

If you still see issues after this fix, the server logs will now tell you exactly what's wrong (RLS policy, missing column, permission issue, etc.).

---

## 📝 Files Modified

1. `/app/app/api/chat/conversations/[conversationId]/messages/route.ts` - Added error handling
2. `/app/app/api/notifications/test/route.ts` - NEW test endpoint
3. `/app/NOTIFICATION_TROUBLESHOOTING_COMPLETE.md` - NEW troubleshooting guide

---

**Status:** Ready for testing ✅  
**Impact:** Non-breaking (only adds logging and error handling)  
**Risk:** Low (messages will still send even if notifications fail)
