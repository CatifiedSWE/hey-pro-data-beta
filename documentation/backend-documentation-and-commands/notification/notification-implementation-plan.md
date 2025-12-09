# Notification System Implementation Plan

**Project:** HeyProData - Chat Notification System  
**Version:** 1.0  
**Date:** January 2025  
**Tech Stack:** Next.js 15 + TypeScript + Supabase + PostgreSQL

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Requirements](#requirements)
4. [Database Schema](#database-schema)
5. [API Implementation](#api-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Real-time Updates (Optional)](#real-time-updates-optional)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Steps](#implementation-steps)
10. [Acceptance Criteria](#acceptance-criteria)

---

## 🎯 Overview

### Goal
Replace the hardcoded notification system (bell icon) with a real backend-driven notification system that triggers whenever a user receives a chat message. Notifications should update in the navbar in real-time or near-real-time.

### Scope
- Create/verify notifications database table
- Ensure chat message API creates notifications
- Update notification API routes (GET, mark-read)
- Replace hardcoded frontend notifications with real data
- Optional: Implement Supabase Realtime for live updates

---

## 🔍 Current State Analysis

### Existing Implementation

#### ✅ Already Implemented
1. **Database Table:** `notifications` table exists (inferred from API usage)
2. **API Routes:**
   - ✅ `GET /api/notifications` - Fetch notifications with pagination
   - ✅ `PATCH /api/notifications/[id]/read` - Mark single notification as read
   - ✅ `PATCH /api/notifications/mark-all-read` - Mark all notifications as read

3. **Backend Notification Creation:**
   - Location: `/app/app/api/chat/conversations/[conversationId]/messages/route.ts` (lines 255-267)
   - Already creates notifications when messages are sent
   - Current fields: `user_id`, `actor_id`, `type`, `message`, `metadata`

#### ❌ Not Yet Implemented
1. **Database Schema File:** No SQL file documenting the notifications table structure
2. **Frontend Integration:** Navbar uses hardcoded dummy notifications
3. **Real-time Updates:** No Supabase Realtime implementation
4. **Complete Metadata:** Notification metadata needs to include all required fields

### Current Frontend Issues
- **File:** `/app/components/header/index.tsx`
- **Line 33-69:** Hardcoded dummy notifications array
- **Line 100:** Hardcoded unread count calculation
- **Line 206-210:** Shows hardcoded unread count badge
- **Line 233-247:** Displays hardcoded notifications

---

## 📝 Requirements

### Notification Data Model
Each notification should contain:
- `id` (UUID, primary key)
- `user_id` (UUID, recipient)
- `actor_id` (UUID, sender)
- `type` (TEXT, notification type)
- `title` (TEXT, optional short title)
- `message` (TEXT, notification content)
- `is_read` (BOOLEAN, read status)
- `metadata` (JSONB, contains):
  - `conversation_id` (UUID)
  - `message_id` (UUID)
  - `chatroom_id` (UUID, for group chats)
  - `sender_id` (UUID, duplicate of actor_id for clarity)
  - `content` (TEXT, message preview)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Notification Types
- `chat_message` - Direct message notification
- `direct_message` - Approved conversation message
- `conversation_request` - Unapproved conversation message
- `group_message` - Group chat message (future)

### API Endpoints (Already Exist)
1. **GET /api/notifications**
   - Query params: `page`, `limit`, `unread_only`
   - Returns: notifications array, pagination, unreadCount

2. **PATCH /api/notifications/[id]/read**
   - Marks single notification as read

3. **PATCH /api/notifications/mark-all-read**
   - Marks all user's notifications as read

### Frontend Requirements
1. Navbar bell icon shows real unread count
2. Notification dropdown shows real notification data
3. Notifications sorted by created_at (descending)
4. Mark as read on click
5. Auto-refresh or real-time updates

---

## 🗄️ Database Schema

### Table: notifications

```sql
-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User References
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Notification Content
    type TEXT NOT NULL CHECK (type IN (
        'chat_message',
        'direct_message',
        'conversation_request',
        'group_message',
        'application_received',
        'status_changed',
        'interest_expressed',
        'collab_invitation',
        'event_rsvp',
        'system_notification'
    )),
    title TEXT,
    message TEXT NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
    
    -- Status
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata (JSONB for flexibility)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for chat messages and system events';
COMMENT ON COLUMN notifications.user_id IS 'Recipient of the notification';
COMMENT ON COLUMN notifications.actor_id IS 'User who triggered the notification (e.g., message sender)';
COMMENT ON COLUMN notifications.type IS 'Type of notification (chat_message, direct_message, etc.)';
COMMENT ON COLUMN notifications.message IS 'Notification message content (max 1000 chars)';
COMMENT ON COLUMN notifications.metadata IS 'JSON object containing contextual data (conversation_id, message_id, etc.)';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();
```

### Metadata Structure Examples

#### Chat Message Notification
```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",
  "sender_id": "uuid",
  "content": "Message preview text...",
  "requires_approval": false
}
```

#### Group Message Notification
```json
{
  "group_id": "uuid",
  "chatroom_id": "uuid",
  "message_id": "uuid",
  "sender_id": "uuid",
  "content": "Message preview text...",
  "group_name": "Group Name"
}
```

---

## 🔌 API Implementation

### 1. GET /api/notifications
**File:** `/app/app/api/notifications/route.ts`

**Status:** ✅ Already Implemented

**Response Example:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "direct_message",
        "title": null,
        "message": "John Doe: Hey, how are you?",
        "isRead": false,
        "metadata": {
          "conversation_id": "uuid",
          "message_id": "uuid",
          "sender_id": "uuid",
          "content": "Hey, how are you?"
        },
        "actor": {
          "id": "uuid",
          "name": "John Doe",
          "avatar": "https://..."
        },
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalNotifications": 45,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "unreadCount": 12
  },
  "message": "Notifications retrieved successfully"
}
```

### 2. PATCH /api/notifications/[id]/read
**File:** `/app/app/api/notifications/[id]/read/route.ts`

**Status:** ✅ Already Implemented

### 3. PATCH /api/notifications/mark-all-read
**File:** `/app/app/api/notifications/mark-all-read/route.ts`

**Status:** ✅ Already Implemented

### 4. Update Send Message API
**File:** `/app/app/api/chat/conversations/[conversationId]/messages/route.ts`

**Current Implementation (lines 255-267):**
```typescript
await supabase
  .from('notifications')
  .insert({
    user_id: recipientId,
    actor_id: user.id,
    type: notificationType,
    message: notificationMessage,
    metadata: {
      conversation_id: conversationId,
      message_id: message.id,
      requires_approval: !conversation.is_approved,
    },
  });
```

**Required Updates:**
- ✅ Already includes conversation_id
- ✅ Already includes message_id
- ✅ Already includes sender information (actor_id)
- ✅ Already includes type
- ✅ Already includes message preview
- ⚠️ Need to add message content to metadata for better UX

**Updated Metadata:**
```typescript
metadata: {
  conversation_id: conversationId,
  message_id: message.id,
  sender_id: user.id,  // ✅ Add this
  content: content.substring(0, 100),  // ✅ Add this
  requires_approval: !conversation.is_approved,
}
```

---

## 🎨 Frontend Implementation

### 1. Update Header Component
**File:** `/app/components/header/index.tsx`

#### Changes Required:

##### A. Remove Hardcoded Data (lines 33-69)
```typescript
// ❌ DELETE THIS
const notifications = [
  {
    id: 1,
    title: "New job match",
    description: "Senior Frontend Developer at TechCorp matches your profile",
    time: "2 hours ago",
    read: false,
  },
  // ... rest of dummy data
]
```

##### B. Add State and API Integration
```typescript
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// Add state
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [loading, setLoading] = useState(false);

// Fetch notifications function
const fetchNotifications = useCallback(async () => {
  if (!user) return;
  
  try {
    setLoading(true);
    const token = await user.getIdToken();
    const response = await axios.get('/api/notifications', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        limit: 10,  // Show latest 10 in dropdown
      },
    });
    
    if (response.data.success) {
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  } finally {
    setLoading(false);
  }
}, [user]);

// Fetch on mount and when dropdown opens
useEffect(() => {
  fetchNotifications();
}, [fetchNotifications]);

// Refresh when notification dropdown opens
useEffect(() => {
  if (notificationOpen) {
    fetchNotifications();
  }
}, [notificationOpen, fetchNotifications]);
```

##### C. Mark Notification as Read
```typescript
const markAsRead = async (notificationId: string) => {
  if (!user) return;
  
  try {
    const token = await user.getIdToken();
    await axios.patch(
      `/api/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};
```

##### D. Update Notification Rendering
```typescript
{notifications.length === 0 ? (
  <p className="text-sm text-muted-foreground">No notifications</p>
) : (
  notifications.map((notification) => (
    <Link
      key={notification.id}
      href={
        notification.metadata?.conversation_id
          ? `/inbox/c/${notification.metadata.conversation_id}`
          : '#'
      }
      onClick={() => {
        if (!notification.isRead) {
          markAsRead(notification.id);
        }
        setNotificationOpen(false);
      }}
      className={`block p-3 rounded-lg mb-2 cursor-pointer hover:bg-secondary/50 ${
        !notification.isRead ? "bg-accent/10" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {notification.actor?.avatar && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={notification.actor.avatar} alt={notification.actor.name} />
            <AvatarFallback>{notification.actor.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{notification.title || notification.type}</h4>
          <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        {!notification.isRead && (
          <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
        )}
      </div>
    </Link>
  ))
)}
```

##### E. Update Badge Display
```typescript
{unreadCount > 0 && (
  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#FA596E] text-white">
    {unreadCount > 99 ? '99+' : unreadCount}
  </Badge>
)}
```

### 2. Create Notification Utility Hook (Optional)
**File:** `/app/hooks/useNotifications.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  isRead: boolean;
  metadata: any;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get auth token from Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await axios.get('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 20,
        },
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      await axios.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      await axios.patch(
        '/api/notifications/mark-all-read',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
```

---

## ⚡ Real-time Updates (Optional)

### Supabase Realtime Implementation

#### 1. Subscribe to Notifications Table
**File:** `/app/components/header/index.tsx`

```typescript
import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef } from 'react';

// Inside Header component
const supabase = createClient();
const channelRef = useRef<any>(null);

useEffect(() => {
  if (!user) return;

  // Subscribe to notifications for current user
  channelRef.current = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('New notification received:', payload);
        
        // Add new notification to list
        setNotifications(prev => [payload.new, ...prev].slice(0, 10));
        setUnreadCount(prev => prev + 1);
        
        // Optional: Show toast notification
        toast.info(payload.new.message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('Notification updated:', payload);
        
        // Update notification in list
        setNotifications(prev =>
          prev.map(n =>
            n.id === payload.new.id ? payload.new : n
          )
        );
        
        // Update unread count if read status changed
        if (payload.old.is_read !== payload.new.is_read) {
          setUnreadCount(prev => 
            payload.new.is_read ? Math.max(0, prev - 1) : prev + 1
          );
        }
      }
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };
}, [user]);
```

#### 2. Enable Realtime in Supabase
Run in Supabase SQL Editor:

```sql
-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

#### 3. Row Level Security (RLS)
Ensure RLS policies allow realtime subscriptions:

```sql
-- RLS policy for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id);
```

---

## 🧪 Testing Strategy

### 1. Database Testing
```sql
-- Test notification creation
INSERT INTO notifications (user_id, actor_id, type, message, metadata)
VALUES (
  'user-uuid',
  'sender-uuid',
  'direct_message',
  'Test notification message',
  '{"conversation_id": "conv-uuid", "message_id": "msg-uuid"}'::jsonb
);

-- Verify notification
SELECT * FROM notifications WHERE user_id = 'user-uuid';

-- Test mark as read
UPDATE notifications SET is_read = true WHERE id = 'notification-uuid';

-- Test unread count
SELECT COUNT(*) FROM notifications WHERE user_id = 'user-uuid' AND is_read = false;
```

### 2. API Testing with cURL

#### Get Notifications
```bash
curl -X GET "http://localhost:3000/api/notifications?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Mark as Read
```bash
curl -X PATCH "http://localhost:3000/api/notifications/NOTIFICATION_ID/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Mark All as Read
```bash
curl -X PATCH "http://localhost:3000/api/notifications/mark-all-read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Frontend Testing Checklist
- [ ] Bell icon shows correct unread count
- [ ] Notification dropdown displays real notifications
- [ ] Clicking notification marks it as read
- [ ] Clicking notification navigates to conversation
- [ ] Unread count updates after marking as read
- [ ] New notifications appear without refresh (if realtime enabled)
- [ ] Notifications sorted by newest first
- [ ] Mark all as read works correctly
- [ ] Empty state shows when no notifications
- [ ] Loading states work properly

### 4. Integration Testing
1. **Send Message → Notification Created:**
   - User A sends message to User B
   - User B receives notification
   - Notification appears in User B's dropdown

2. **Mark as Read:**
   - Click notification
   - Badge count decreases
   - Notification styling changes

3. **Real-time Updates:**
   - Send message from another device
   - Notification appears without page refresh
   - Unread count updates automatically

---

## 📋 Implementation Steps

### Phase 1: Database Setup ✅
**Estimated Time:** 15 minutes

1. ✅ Create notifications table SQL file
2. ✅ Add indexes for performance
3. ✅ Set up RLS policies
4. ✅ Enable realtime (optional)
5. ✅ Run migrations

**Files Created:**
- `/app/documentation/backend-documentation-and-commands/notification/01_CREATE_NOTIFICATIONS_TABLE.sql`
- `/app/documentation/backend-documentation-and-commands/notification/02_RLS_POLICIES.sql`
- `/app/documentation/backend-documentation-and-commands/notification/03_INDEXES.sql`

### Phase 2: Backend Updates ✅
**Estimated Time:** 30 minutes

1. ✅ Verify notifications table exists in database
2. ✅ Update send message API to include complete metadata
3. ✅ Test notification creation with cURL
4. ✅ Verify GET /api/notifications works
5. ✅ Verify mark-read endpoints work

**Files Modified:**
- `/app/app/api/chat/conversations/[conversationId]/messages/route.ts`

### Phase 3: Frontend Integration 🔄
**Estimated Time:** 1-2 hours

1. 🔄 Create useNotifications hook
2. 🔄 Update Header component:
   - Remove hardcoded data
   - Add state management
   - Implement fetchNotifications
   - Implement markAsRead
   - Update UI rendering
3. 🔄 Add time formatting utility (date-fns)
4. 🔄 Add navigation to conversation on click
5. 🔄 Test in browser

**Files Modified:**
- `/app/components/header/index.tsx`

**Files Created:**
- `/app/hooks/useNotifications.ts` (optional)

### Phase 4: Real-time Updates (Optional) ⏳
**Estimated Time:** 30-45 minutes

1. ⏳ Enable Supabase Realtime for notifications table
2. ⏳ Implement Realtime subscription in Header
3. ⏳ Add toast notifications for new messages
4. ⏳ Test real-time functionality

**Files Modified:**
- `/app/components/header/index.tsx`

### Phase 5: Testing & Verification 🧪
**Estimated Time:** 30 minutes

1. 🧪 Test notification creation
2. 🧪 Test notification display
3. 🧪 Test mark as read
4. 🧪 Test navigation
5. 🧪 Test real-time updates (if implemented)
6. 🧪 Test edge cases (no notifications, many notifications, etc.)

---

## ✅ Acceptance Criteria

### Must Have ✅
- [x] Sending a chat message creates a notification in the database
- [ ] GET /api/notifications returns real notification data
- [ ] Navbar bell icon displays correct unread count from API
- [ ] Notification dropdown shows real notifications from API
- [ ] Clicking a notification marks it as read
- [ ] Clicking a notification navigates to the conversation
- [ ] Unread count updates when notifications are marked as read
- [ ] Notifications are sorted by created_at (newest first)

### Should Have 🎯
- [ ] Notification includes message preview
- [ ] Notification shows sender name and avatar
- [ ] Notification shows relative time (e.g., "2 hours ago")
- [ ] Mark all as read functionality works
- [ ] Empty state when no notifications
- [ ] Loading states while fetching

### Nice to Have 🌟
- [ ] Real-time notification updates via Supabase Realtime
- [ ] Toast notification for new messages
- [ ] Notification sound/vibration
- [ ] Notification settings (mute, preferences)
- [ ] Pagination for notification history

---

## 🚀 Deployment Notes

### Environment Variables
No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database Migrations
Run SQL files in order:
1. `01_CREATE_NOTIFICATIONS_TABLE.sql`
2. `02_RLS_POLICIES.sql`
3. `03_INDEXES.sql`

### Rollback Plan
If issues occur:
1. Revert frontend changes (restore hardcoded notifications)
2. Keep database table (no harm in having it)
3. Backend notification creation is safe (won't break if table exists)

---

## 📚 Additional Resources

### Related Files
- API Routes: `/app/app/api/notifications/`
- Chat API: `/app/app/api/chat/conversations/[conversationId]/messages/route.ts`
- Header Component: `/app/components/header/index.tsx`
- Auth Context: `/app/contexts/AuthContext.tsx`

### Documentation
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

## 🎉 Success Metrics

After implementation:
- ✅ No hardcoded notification data in frontend
- ✅ Real-time or near-real-time notification updates
- ✅ Accurate unread count at all times
- ✅ Seamless user experience
- ✅ Scalable notification system for future features

---

**End of Implementation Plan**
