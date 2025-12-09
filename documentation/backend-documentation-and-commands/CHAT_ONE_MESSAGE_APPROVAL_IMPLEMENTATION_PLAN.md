# Chat One-Message Restriction & Approval Logic Implementation Plan

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Tech Stack:** Next.js 15 + TypeScript + Supabase + React  
**Status:** 🟡 Planning Phase

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [Feature Requirements](#feature-requirements)
4. [Database Schema Changes](#database-schema-changes)
5. [API Implementation Plan](#api-implementation-plan)
6. [Frontend Components Plan](#frontend-components-plan)
7. [Implementation Phases](#implementation-phases)
8. [File Structure](#file-structure)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Rollout Plan](#rollout-plan)

---

## 1. Executive Summary

### Objective
Implement a secure, one-message restriction system where User A can send only one initial message to User B, and the conversation remains locked until User B approves it. After approval, both users can chat freely without restrictions.

### Key Features
- ✅ One-message limit for conversation initiator
- ✅ Approval mechanism for conversation recipient
- ✅ Real-time UI updates for approval status
- ✅ Backward compatible with existing chat system
- ✅ Group chat exclusion (no approval needed for groups)
- ✅ Notification system integration

### Success Criteria
- User A can send exactly one message to a new conversation
- User A cannot send additional messages until approval
- User B sees clear approval UI with conversation preview
- After approval, both users chat without restrictions
- Zero breaking changes to existing conversations
- Performance: < 200ms approval action response time

---

## 2. Current System Analysis

### Existing Database Schema

#### `conversations` Table (EXISTING)
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user1_id UUID NOT NULL,
    user2_id UUID NOT NULL,
    last_message_id UUID,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT ordered_users CHECK (user1_id < user2_id),
    CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id)
);
```

#### `messages` Table (EXISTING)
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    group_id UUID,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type VARCHAR(20),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Current API Endpoints (EXISTING)

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/chat/conversations` | GET | List user conversations | ✅ Implemented |
| `/api/chat/conversations` | POST | Start new conversation | ✅ Implemented |
| `/api/chat/conversations/[id]/messages` | GET | Get conversation messages | ✅ Implemented |
| `/api/chat/conversations/[id]/messages` | POST | Send message | ✅ Implemented |

### Current Frontend Components (EXISTING)

- `/app/(app)/(chat)/inbox/page.tsx` - Conversation list (skeleton loader)
- `/app/(app)/(chat)/inbox/c/[id]/page.tsx` - Chat interface with messaging
- `/app/(app)/(chat)/template.tsx` - Chat layout with Chats/Groups tabs
- `/lib/api/chat.ts` - API helper functions
- `/hooks/useChat.ts` - (NOT YET CREATED)

### Key Insights from Current System

✅ **Strengths:**
- Clean separation of 1-on-1 and group chats
- Ordered user IDs prevent duplicate conversations
- Real-time polling already implemented (3s interval)
- Optimistic UI updates for messages
- Status tracking (sent, delivered, read)

⚠️ **Gaps for New Feature:**
- No approval status tracking in conversations table
- No message count restriction logic
- No UI for approval workflow
- No API endpoint for approving conversations
- No notification integration for approval requests

---

## 3. Feature Requirements

### 3.1 Functional Requirements

#### FR-1: Conversation Initiation
- **FR-1.1:** User A can send exactly one message to User B in a new conversation
- **FR-1.2:** After sending first message, User A cannot send more messages until approval
- **FR-1.3:** System creates conversation with `is_approved = false` on first message
- **FR-1.4:** User A sees "Waiting for approval" state in UI

#### FR-2: Approval Process
- **FR-2.1:** User B receives notification of new conversation request
- **FR-2.2:** User B can view the first message before approving
- **FR-2.3:** User B can approve or ignore the conversation
- **FR-2.4:** Approval action is instant (no page refresh needed)
- **FR-2.5:** Only the recipient (User B) can approve

#### FR-3: Post-Approval Behavior
- **FR-3.1:** After approval, both users can send unlimited messages
- **FR-3.2:** Conversation status permanently changes to `is_approved = true`
- **FR-3.3:** User A receives notification of approval
- **FR-3.4:** Message input becomes enabled for User A

#### FR-4: Group Chat Exclusion
- **FR-4.1:** Group chats bypass approval logic entirely
- **FR-4.2:** All group members can message freely from the start
- **FR-4.3:** No approval UI shown in group chats

#### FR-5: Edge Cases
- **FR-5.1:** If User A blocks User B, conversation is auto-ignored
- **FR-5.2:** Existing approved conversations remain unaffected
- **FR-5.3:** If conversation is deleted before approval, clean up properly
- **FR-5.4:** Handle concurrent approval attempts gracefully

### 3.2 Non-Functional Requirements

#### NFR-1: Performance
- Approval action response time: < 200ms
- Message send with approval check: < 300ms
- No additional database queries for already-approved conversations

#### NFR-2: Security
- Prevent sender_id spoofing using Supabase Auth
- Only conversation recipient can approve
- Validate user permissions on all endpoints
- Prevent SQL injection with parameterized queries

#### NFR-3: Scalability
- Database schema supports millions of conversations
- Indexes on `is_approved` and `user1_id`/`user2_id`
- Efficient query plans for filtering unapproved conversations

#### NFR-4: Reliability
- Transaction-safe approval process
- Rollback on error during approval
- Idempotent approval endpoint (multiple calls = same result)

#### NFR-5: Maintainability
- Clear separation of approval logic from existing code
- Backward compatible with existing conversations
- Comprehensive inline documentation
- TypeScript interfaces for type safety

---

## 4. Database Schema Changes

### 4.1 Add `is_approved` Column to `conversations`

```sql
-- Migration: Add approval status to conversations
-- File: /migrations/add_conversation_approval.sql

-- Step 1: Add the column with default true for backward compatibility
ALTER TABLE conversations
ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Add approval-related metadata
ALTER TABLE conversations
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES auth.users(id);

-- Step 3: Add index for filtering unapproved conversations
CREATE INDEX idx_conversations_not_approved 
ON conversations(is_approved) 
WHERE is_approved = false;

-- Step 4: Add composite index for user filtering + approval status
CREATE INDEX idx_conversations_user_approval 
ON conversations(user1_id, user2_id, is_approved);

-- Step 5: Add comments
COMMENT ON COLUMN conversations.is_approved IS 
  'Whether the conversation has been approved by the recipient (User B). Default true for backward compatibility.';
COMMENT ON COLUMN conversations.approved_at IS 
  'Timestamp when the conversation was approved';
COMMENT ON COLUMN conversations.approved_by IS 
  'User who approved the conversation (typically user2_id)';
```

### 4.2 Database Constraints & Validation

```sql
-- Add constraint to ensure approved_at is set when is_approved is true
ALTER TABLE conversations
ADD CONSTRAINT check_approved_timestamp 
CHECK (
  (is_approved = false AND approved_at IS NULL) OR
  (is_approved = true AND approved_at IS NOT NULL)
);

-- Add constraint to ensure only user2 can approve
ALTER TABLE conversations
ADD CONSTRAINT check_approved_by_recipient 
CHECK (
  approved_by IS NULL OR 
  approved_by = user2_id
);
```

### 4.3 Data Migration Script

```sql
-- Set all existing conversations as approved
-- This ensures backward compatibility

UPDATE conversations
SET 
  is_approved = true,
  approved_at = created_at,
  approved_by = user2_id
WHERE is_approved = true 
  AND approved_at IS NULL;

-- Verify migration
SELECT 
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE is_approved = true) as approved,
  COUNT(*) FILTER (WHERE is_approved = false) as pending_approval
FROM conversations;
```

### 4.4 Updated Schema Diagram

```
conversations
├── id (UUID, PK)
├── user1_id (UUID, FK) [Lower UUID value]
├── user2_id (UUID, FK) [Higher UUID value]
├── is_approved (BOOLEAN) ⭐ NEW - Default true
├── approved_at (TIMESTAMP) ⭐ NEW
├── approved_by (UUID, FK) ⭐ NEW
├── last_message_id (UUID, FK)
├── last_message_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

messages
├── id (UUID, PK)
├── conversation_id (UUID, FK)
├── group_id (UUID, FK)
├── sender_id (UUID, FK)
├── content (TEXT)
├── status (VARCHAR)
├── created_at (TIMESTAMP)
└── ...
```

### 4.5 Rollback Plan

```sql
-- Rollback script if needed
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS check_approved_timestamp,
DROP CONSTRAINT IF EXISTS check_approved_by_recipient,
DROP COLUMN IF EXISTS is_approved,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS approved_by;

DROP INDEX IF EXISTS idx_conversations_not_approved;
DROP INDEX IF EXISTS idx_conversations_user_approval;
```

---

## 5. API Implementation Plan

### 5.1 Modify Existing Send Message Endpoint

**File:** `/app/api/chat/conversations/[conversationId]/messages/route.ts`

#### Current Implementation Issues
- No check for conversation approval status
- No restriction on message count
- No detection of first message in conversation

#### Required Changes

```typescript
// POST /api/chat/conversations/[conversationId]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const body = await request.json();
    const { content, attachmentUrl, attachmentType } = body;

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        errorResponse('Message content is required'),
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch conversation with approval status
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        errorResponse('Conversation not found'),
        { status: 404 }
      );
    }

    // Verify user is part of conversation
    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json(
        errorResponse('Access denied'),
        { status: 403 }
      );
    }

    // ⭐ NEW: Approval Logic Check
    if (!conversation.is_approved) {
      // Determine who initiated the conversation
      const initiatorId = conversation.user1_id < conversation.user2_id 
        ? conversation.user1_id 
        : conversation.user2_id;
      
      // Check if current user is the initiator
      const isInitiator = user.id === initiatorId;

      if (isInitiator) {
        // Check if initiator has already sent a message
        const { count: messageCount, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('sender_id', user.id)
          .is('deleted_at', null);

        if (countError) {
          return NextResponse.json(
            errorResponse('Failed to check message count', countError.message),
            { status: 500 }
          );
        }

        // Block if initiator already sent a message
        if (messageCount && messageCount >= 1) {
          return NextResponse.json(
            errorResponse(
              'Conversation pending approval. You can send more messages after the recipient approves.',
              'APPROVAL_REQUIRED'
            ),
            { status: 403 }
          );
        }
      }
    }

    // Insert message (existing logic)
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null,
        status: 'sent',
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json(
        errorResponse('Failed to send message', messageError.message),
        { status: 500 }
      );
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({
        last_message_id: message.id,
        last_message_at: message.created_at,
      })
      .eq('id', conversationId);

    // Create notification for the other user
    const recipientId = conversation.user1_id === user.id 
      ? conversation.user2_id 
      : conversation.user1_id;
    
    // ⭐ NEW: Different notification for unapproved conversations
    const notificationType = conversation.is_approved 
      ? 'direct_message' 
      : 'conversation_request';
    
    const notificationMessage = conversation.is_approved
      ? `New message: ${content.substring(0, 100)}`
      : `New conversation request from ${user.user_metadata?.full_name || 'Someone'}`;

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

    return NextResponse.json(
      successResponse('Message sent successfully', message),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
```

### 5.2 New Endpoint: Approve Conversation

**File:** `/app/api/chat/conversations/[conversationId]/approve/route.ts` ⭐ NEW FILE

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/chat/conversations/[conversationId]/approve
 * 
 * Approves a conversation request, allowing both users to chat freely.
 * Only the recipient (user2_id) can approve the conversation.
 * 
 * @requires Authentication
 * @returns Updated conversation object with is_approved = true
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const { conversationId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        errorResponse('Conversation not found'),
        { status: 404 }
      );
    }

    // ⭐ Check if user is the recipient (user2_id - the higher UUID)
    // The recipient is always user2_id due to ordered_users constraint
    if (conversation.user2_id !== user.id) {
      return NextResponse.json(
        errorResponse('Only the conversation recipient can approve'),
        { status: 403 }
      );
    }

    // ⭐ Check if already approved (idempotent)
    if (conversation.is_approved) {
      return NextResponse.json(
        successResponse('Conversation already approved', {
          conversation,
          alreadyApproved: true,
        })
      );
    }

    // ⭐ Approve the conversation
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        errorResponse('Failed to approve conversation', updateError.message),
        { status: 500 }
      );
    }

    // ⭐ Create notification for the initiator (user1_id)
    const initiatorId = conversation.user1_id;
    
    await supabase
      .from('notifications')
      .insert({
        user_id: initiatorId,
        actor_id: user.id,
        type: 'conversation_approved',
        message: `${user.user_metadata?.full_name || 'Someone'} accepted your conversation request`,
        metadata: {
          conversation_id: conversationId,
        },
      });

    return NextResponse.json(
      successResponse('Conversation approved successfully', {
        conversation: updatedConversation,
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error approving conversation:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
```

### 5.3 Modify Existing Create Conversation Endpoint

**File:** `/app/api/chat/conversations/route.ts`

#### Required Changes

```typescript
// POST /api/chat/conversations - Start a new conversation
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { participantId } = body;

    // Validation
    if (!participantId) {
      return NextResponse.json(
        errorResponse('participantId is required'),
        { status: 400 }
      );
    }

    if (participantId === user.id) {
      return NextResponse.json(
        errorResponse('Cannot create conversation with yourself'),
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ensure user1_id < user2_id for consistency
    const [user1Id, user2Id] = [user.id, participantId].sort();

    // Check if conversation already exists
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        errorResponse('Failed to check existing conversation', fetchError.message),
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        successResponse('Conversation already exists', existing)
      );
    }

    // Verify participant exists
    const { data: participant, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', participantId)
      .single();

    if (userError || !participant) {
      return NextResponse.json(
        errorResponse('Participant not found'),
        { status: 404 }
      );
    }

    // ⭐ NEW: Create conversation with is_approved = false
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        is_approved: false, // ⭐ NEW: Start as unapproved
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        errorResponse('Failed to create conversation', createError.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse('Conversation created successfully', {
        ...newConversation,
        requiresApproval: true, // ⭐ Inform frontend
      }),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
```

### 5.4 Update Get Conversations Endpoint

**File:** `/app/api/chat/conversations/route.ts`

#### Required Changes to GET Method

```typescript
// Add is_approved field to SELECT query
const { data: conversations, error } = await supabase
  .from('conversations')
  .select(`
    id,
    user1_id,
    user2_id,
    is_approved,          // ⭐ NEW
    approved_at,          // ⭐ NEW
    last_message_at,
    created_at
  `)
  .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
  .order('last_message_at', { ascending: false, nullsFirst: false });

// Include approval status in enriched response
return {
  id: conv.id,
  user: {...},
  lastMessage: {...},
  unreadCount: unreadCount || 0,
  createdAt: conv.created_at,
  isApproved: conv.is_approved,           // ⭐ NEW
  approvedAt: conv.approved_at,           // ⭐ NEW
  requiresApproval: !conv.is_approved,    // ⭐ NEW - Helper boolean
};
```

### 5.5 API Helper Functions Update

**File:** `/lib/api/chat.ts`

```typescript
// Update Conversation interface
export interface Conversation {
  id: string;
  user: User;
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  isApproved: boolean;           // ⭐ NEW
  approvedAt: string | null;     // ⭐ NEW
  requiresApproval: boolean;     // ⭐ NEW
}

// Add new function: Approve Conversation
/**
 * Approve a conversation request
 */
export async function approveConversation(conversationId: string): Promise<any> {
  try {
    const response = await axios.post(
      `/chat/conversations/${conversationId}/approve`
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error approving conversation:', error);
    throw error;
  }
}
```

---

## 6. Frontend Components Plan

### 6.1 New Custom Hook: `useChat`

**File:** `/hooks/useChat.ts` ⭐ NEW FILE

```typescript
import { useState, useCallback, useEffect } from 'react';
import {
  getConversations,
  getConversationMessages,
  sendConversationMessage,
  approveConversation,
  type Conversation,
  type Message,
} from '@/lib/api/chat';

interface UseChatOptions {
  conversationId?: string;
  autoPolling?: boolean;
  pollingInterval?: number; // in milliseconds
}

interface UseChatReturn {
  // State
  conversations: Conversation[];
  messages: Message[];
  currentConversation: Conversation | null;
  loading: boolean;
  sending: boolean;
  error: string | null;

  // Actions
  sendMessage: (content: string, attachmentUrl?: string, attachmentType?: string) => Promise<void>;
  approveChat: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { conversationId, autoPolling = false, pollingInterval = 3000 } = options;

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations
  const refreshConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversations();
      setConversations(data);

      // Update current conversation if ID matches
      if (conversationId) {
        const current = data.find((c) => c.id === conversationId);
        setCurrentConversation(current || null);
      }
    } catch (err: any) {
      setError('Failed to load conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Fetch messages for a conversation
  const refreshMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getConversationMessages(conversationId, 1, 50);
      setMessages(data.messages);
    } catch (err: any) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, attachmentUrl?: string, attachmentType?: string) => {
      if (!conversationId) {
        throw new Error('No conversation selected');
      }

      try {
        setSending(true);
        setError(null);
        const newMessage = await sendConversationMessage(
          conversationId,
          content,
          attachmentUrl,
          attachmentType
        );
        setMessages((prev) => [...prev, newMessage]);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to send message');
        console.error('Error sending message:', err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  // Approve a conversation
  const approveChat = useCallback(async (convId: string) => {
    try {
      setError(null);
      await approveConversation(convId);
      
      // Update conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId
            ? { ...conv, isApproved: true, requiresApproval: false }
            : conv
        )
      );

      // Update current conversation
      if (currentConversation?.id === convId) {
        setCurrentConversation((prev) =>
          prev ? { ...prev, isApproved: true, requiresApproval: false } : null
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve conversation');
      console.error('Error approving conversation:', err);
      throw err;
    }
  }, [currentConversation]);

  // Initial load
  useEffect(() => {
    refreshConversations();
    if (conversationId) {
      refreshMessages();
    }
  }, [refreshConversations, refreshMessages, conversationId]);

  // Auto-polling for new messages
  useEffect(() => {
    if (!autoPolling || !conversationId) return;

    const interval = setInterval(() => {
      refreshMessages();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [autoPolling, conversationId, pollingInterval, refreshMessages]);

  return {
    conversations,
    messages,
    currentConversation,
    loading,
    sending,
    error,
    sendMessage,
    approveChat,
    refreshConversations,
    refreshMessages,
  };
}
```

### 6.2 New Component: Approval Banner

**File:** `/app/(app)/(chat)/components/ApprovalBanner.tsx` ⭐ NEW FILE

```typescript
"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface ApprovalBannerProps {
  conversationId: string;
  isApproved: boolean;
  isInitiator: boolean;
  onApprove?: () => Promise<void>;
  otherUserName?: string;
  loading?: boolean;
}

export function ApprovalBanner({
  conversationId,
  isApproved,
  isInitiator,
  onApprove,
  otherUserName = "this user",
  loading = false,
}: ApprovalBannerProps) {
  // Don't show banner if already approved
  if (isApproved) return null;

  // Initiator view (waiting for approval)
  if (isInitiator) {
    return (
      <div
        className="w-full bg-amber-50 border-t border-b border-amber-200 px-4 py-3"
        data-testid="approval-banner-waiting"
      >
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Waiting for approval
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {otherUserName} needs to approve this conversation before you can send more messages.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Recipient view (can approve)
  return (
    <div
      className="w-full bg-blue-50 border-t border-b border-blue-200 px-4 py-3"
      data-testid="approval-banner-action"
    >
      <div className="flex items-center gap-3 max-w-3xl mx-auto">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            New conversation request
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Accept to continue chatting with {otherUserName}
          </p>
        </div>
        <Button
          onClick={onApprove}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-9 text-sm font-medium"
          data-testid="approve-conversation-button"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Approving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Accept</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
```

### 6.3 Update Chat Page

**File:** `/app/(app)/(chat)/inbox/c/[id]/page.tsx`

#### Required Changes

```typescript
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, EllipsisVertical, Paperclip, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { 
  getConversationMessages, 
  sendConversationMessage, 
  approveConversation, // ⭐ NEW
  type Message 
} from "@/lib/api/chat";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ApprovalBanner } from "../components/ApprovalBanner"; // ⭐ NEW

type paramsType = { id: string };

export default function MessageInbox({ params }: { params: paramsType }) {
  const { id } = params;
  const { user } = useAuth();
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const lastMessageCount = useRef(0);

  // State
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [approvingConversation, setApprovingConversation] = useState(false); // ⭐ NEW
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [conversationDetails, setConversationDetails] = useState<any>(null); // ⭐ NEW

  // ⭐ NEW: Fetch conversation details including approval status
  const fetchConversationDetails = useCallback(async () => {
    try {
      // This would need a new API endpoint or modification to existing one
      // For now, we can infer from the conversation list or add it to messages response
      // Placeholder - needs actual implementation
      const response = await fetch(`/api/chat/conversations/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setConversationDetails(data.data);
    } catch (err) {
      console.error('Error fetching conversation details:', err);
    }
  }, [id]);

  // ⭐ NEW: Determine if current user is the initiator
  const isInitiator = useCallback(() => {
    if (!user || !conversationDetails) return false;
    // Initiator is user1_id (lower UUID)
    return conversationDetails.user1_id === user.id;
  }, [user, conversationDetails]);

  // ⭐ NEW: Handle approval
  const handleApproveConversation = async () => {
    try {
      setApprovingConversation(true);
      await approveConversation(id);
      
      // Update conversation details
      setConversationDetails((prev: any) => ({
        ...prev,
        is_approved: true,
        approved_at: new Date().toISOString(),
      }));

      toast.success('Conversation approved! You can now chat freely.');
    } catch (err: any) {
      console.error('Error approving conversation:', err);
      toast.error('Failed to approve conversation. Please try again.');
    } finally {
      setApprovingConversation(false);
    }
  };

  // Fetch messages (existing logic)
  const fetchMessages = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const data = await getConversationMessages(id, pageNum, 50);
      
      if (append) {
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id]);

  // ⭐ MODIFIED: Handle send with approval check
  const handleSend = async () => {
    if (message.trim().length === 0 || sending) return;
    
    // ⭐ Check if conversation is not approved and user is initiator
    if (conversationDetails && !conversationDetails.is_approved && isInitiator()) {
      const initiatorMessageCount = messages.filter(
        (msg) => msg.sender_id === user?.id
      ).length;

      if (initiatorMessageCount >= 1) {
        toast.error('Waiting for the other person to approve your message.');
        return;
      }
    }
    
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: id,
      sender_id: user?.id || '',
      content: message.trim(),
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessage("");
    setSending(true);

    try {
      const sentMessage = await sendConversationMessage(id, message.trim());
      setMessages(prev => 
        prev.map(msg => msg.id === optimisticMessage.id ? sentMessage : msg)
      );
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // ⭐ Check for approval error
      if (err.response?.data?.details === 'APPROVAL_REQUIRED') {
        toast.error('Waiting for approval before sending more messages.');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages(1, false);
    fetchConversationDetails(); // ⭐ NEW
  }, [fetchMessages, fetchConversationDetails]);

  // ⭐ Determine if input should be disabled
  const isInputDisabled = () => {
    if (!conversationDetails) return false;
    if (conversationDetails.is_approved) return false;
    
    // Disable for initiator if they've already sent a message
    if (isInitiator()) {
      const initiatorMessageCount = messages.filter(
        (msg) => msg.sender_id === user?.id
      ).length;
      return initiatorMessageCount >= 1;
    }
    
    return false;
  };

  // ... rest of existing code (loading states, error handling, etc.)

  return (
    <div className="w-full flex flex-col bg-white overflow-hidden relative sm:h-[calc(100vh-80px)] h-[calc(100vh-80px)]">

      {/* Header - Fixed Height */}
      <div className="shrink-0 w-full flex flex-row justify-between items-center px-4 sm:px-6 bg-[#F8F8F8] border-b border-gray-100 h-[80px] z-10 relative">
        {/* ... existing header code ... */}
      </div>

      {/* ⭐ NEW: Approval Banner */}
      {conversationDetails && (
        <ApprovalBanner
          conversationId={id}
          isApproved={conversationDetails.is_approved}
          isInitiator={isInitiator()}
          onApprove={handleApproveConversation}
          otherUserName={otherUser?.name}
          loading={approvingConversation}
        />
      )}

      {/* Messages Area - Grow to fill space */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 w-full overflow-y-auto px-2 sm:px-4 py-6 bg-white no-scrollbar"
      >
        {/* ... existing messages rendering code ... */}
      </div>

      {/* Input Bar - Fixed at Bottom */}
      <div className="shrink-0 w-full bg-white px-4 pb-4 pt-2 z-10 relative">
        <div className="mx-auto w-full max-w-3xl bg-[#F0F0F0] border border-[#FA596E] rounded-full flex items-center gap-2 p-1 pl-4 h-[56px] shadow-sm">
          <Input
            placeholder={
              isInputDisabled() 
                ? "Waiting for approval..." 
                : "Message ..."
            }
            className="border-none shadow-none text-[15px] font-normal flex-1 focus-visible:ring-0 px-0 bg-transparent placeholder:text-gray-500"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => { 
              if (e.key === "Enter" && !e.shiftKey) { 
                e.preventDefault(); 
                handleSend(); 
              }
            }}
            disabled={sending || isInputDisabled()} // ⭐ MODIFIED
          />
          <div className="flex items-center gap-1 pr-1 shrink-0">
            <Button
              className="h-10 w-10 rounded-full flex items-center justify-center bg-[#FA596E] hover:bg-[#fa4059] transition-colors p-0"
              type="button"
              disabled
            >
              <Paperclip className="text-white h-5 w-5" />
            </Button>
            <Button
              className="h-10 w-10 rounded-full flex items-center justify-center bg-[#FA596E] hover:bg-[#fa4059] transition-colors p-0 disabled:opacity-50"
              type="button"
              onClick={handleSend}
              disabled={sending || message.trim().length === 0 || isInputDisabled()} // ⭐ MODIFIED
            >
              <Send className="text-white h-5 w-5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
```

### 6.4 Update Conversation List Template

**File:** `/app/(app)/(chat)/template.tsx`

#### Required Changes

```typescript
// Add visual indicator for unapproved conversations in the list

{conversations.map((conv, index) => (
  <React.Fragment key={conv.id}>
    <Link 
      href={`/inbox/c/${conv.id}`} 
      className="flex flex-row items-center p-[10px] gap-[19px] w-full h-[70px] rounded-[10px] hover:bg-gray-50 transition-colors cursor-pointer relative"
    >
      {/* ⭐ NEW: Approval indicator badge */}
      {!conv.isApproved && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-medium rounded-full border border-amber-200">
          Pending
        </div>
      )}
      
      <Image
        src={conv.user.avatar || '/default-profile.png'}
        alt={conv.user.name}
        className="w-[48px] h-[48px] rounded-full object-cover bg-[#D9D9D9] shrink-0"
        width={48}
        height={48}
      />
      
      <div className="flex flex-row items-center gap-[7px] flex-1 min-w-0">
        <div className="flex flex-col justify-center items-start gap-[1px] flex-1 min-w-0">
          <span className="w-full font-medium text-[16px] leading-[24px] text-black truncate">
            {conv.user.name}
          </span>
          <span className={`w-full font-medium text-[12px] leading-[15px] truncate ${
            !conv.isApproved ? 'text-amber-600' : 'text-[#444444]'
          }`}>
            {!conv.isApproved 
              ? 'Conversation pending approval' 
              : conv.lastMessage?.content || 'No messages yet'
            }
          </span>
        </div>
        {conv.unreadCount > 0 && (
          <div className="w-[20px] h-[20px] bg-[#31A7AC] border-2 border-white rounded-full flex items-center justify-center shrink-0">
            <span className="font-medium text-[10px] leading-[15px] text-white">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </span>
          </div>
        )}
      </div>
    </Link>
    {index < conversations.length - 1 && (
      <div className="w-full h-[1px] border-t border-[#CDCDCD]" />
    )}
  </React.Fragment>
))}
```

---

## 7. Implementation Phases

### Phase 1: Database & Backend (Week 1)

**Duration:** 3-4 days

**Tasks:**
1. ✅ Create database migration script
2. ✅ Run migration on development database
3. ✅ Verify schema changes and indexes
4. ✅ Update API types in `/lib/api/chat.ts`
5. ✅ Modify send message endpoint with approval check
6. ✅ Create new approve conversation endpoint
7. ✅ Update create conversation endpoint
8. ✅ Update get conversations endpoint
9. ✅ Write unit tests for approval logic
10. ✅ Test API endpoints with Postman/Insomnia

**Deliverables:**
- ✅ Migration script executed
- ✅ All API endpoints updated and tested
- ✅ Swagger/API documentation updated

**Success Criteria:**
- All tests pass
- API responds within 200ms for approval
- No breaking changes to existing conversations

---

### Phase 2: Frontend Components (Week 1-2)

**Duration:** 4-5 days

**Tasks:**
1. ✅ Create `useChat` hook
2. ✅ Create `ApprovalBanner` component
3. ✅ Update chat page with approval logic
4. ✅ Update conversation list with approval indicators
5. ✅ Add loading states and error handling
6. ✅ Implement optimistic UI updates
7. ✅ Add toast notifications for approval actions
8. ✅ Style components according to design system
9. ✅ Test on different screen sizes (mobile/desktop)

**Deliverables:**
- ✅ All frontend components created
- ✅ UI matches design specifications
- ✅ Responsive design verified

**Success Criteria:**
- Approval banner shows correctly
- Input is disabled appropriately
- Real-time updates work smoothly
- Mobile experience is seamless

---

### Phase 3: Integration & Testing (Week 2)

**Duration:** 3 days

**Tasks:**
1. ✅ Integration testing (frontend + backend)
2. ✅ Test conversation initiation flow
3. ✅ Test approval flow (recipient side)
4. ✅ Test post-approval messaging
5. ✅ Test edge cases (concurrent requests, etc.)
6. ✅ Performance testing (load time, approval speed)
7. ✅ Cross-browser testing (Chrome, Firefox, Safari)
8. ✅ Accessibility testing (keyboard navigation, screen readers)
9. ✅ User acceptance testing (UAT)

**Deliverables:**
- ✅ Test report with all cases covered
- ✅ Bug fixes for identified issues
- ✅ Performance benchmarks met

**Success Criteria:**
- All test cases pass
- No critical bugs found
- Performance targets met

---

### Phase 4: Documentation & Rollout (Week 2)

**Duration:** 2 days

**Tasks:**
1. ✅ Update API documentation
2. ✅ Write user-facing documentation
3. ✅ Create migration guide for existing users
4. ✅ Prepare rollback plan
5. ✅ Deploy to staging environment
6. ✅ Conduct final QA on staging
7. ✅ Deploy to production
8. ✅ Monitor for issues (first 24 hours)

**Deliverables:**
- ✅ Complete documentation
- ✅ Successful production deployment
- ✅ Monitoring dashboard set up

**Success Criteria:**
- Deployment successful with no downtime
- No critical issues in first 24 hours
- Documentation complete and accessible

---

## 8. File Structure

### New Files to Create

```
/app
├── /api/chat/conversations/[conversationId]/approve/
│   └── route.ts                                    ⭐ NEW
├── /hooks/
│   └── useChat.ts                                  ⭐ NEW
├── /app/(app)/(chat)/components/
│   └── ApprovalBanner.tsx                          ⭐ NEW
└── /migrations/
    └── add_conversation_approval.sql               ⭐ NEW
```

### Files to Modify

```
/app
├── /api/chat/conversations/route.ts                ✏️ MODIFY (GET & POST)
├── /api/chat/conversations/[conversationId]/messages/route.ts  ✏️ MODIFY (POST)
├── /lib/api/chat.ts                                ✏️ MODIFY (Add approveConversation)
├── /app/(app)/(chat)/inbox/c/[id]/page.tsx        ✏️ MODIFY (Add approval logic)
├── /app/(app)/(chat)/template.tsx                  ✏️ MODIFY (Show approval indicator)
└── /types/index.ts                                 ✏️ MODIFY (Add approval types)
```

### Files Unchanged

- All group chat logic remains unchanged
- Existing message rendering components unchanged
- Authentication logic unchanged
- Notification system (only add new types)

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

**Threats:**
- Spoofing sender_id to bypass restrictions
- Unauthorized approval of conversations
- Accessing conversations without permission

**Mitigations:**
- ✅ Always validate user ID from Supabase Auth token
- ✅ Never trust client-provided sender_id
- ✅ Check conversation membership before any action
- ✅ Only allow user2_id to approve conversations
- ✅ Use Row Level Security (RLS) policies in Supabase

### 9.2 Input Validation

**Threats:**
- XSS attacks via message content
- SQL injection in approval logic
- Buffer overflow from long messages

**Mitigations:**
- ✅ Sanitize all user inputs on backend
- ✅ Use parameterized queries (Supabase client does this)
- ✅ Limit message length (max 10,000 characters)
- ✅ Escape HTML entities in frontend rendering

### 9.3 Rate Limiting

**Threats:**
- Spam messages to unapproved conversations
- Denial of service via approval requests

**Mitigations:**
- ✅ Rate limit message sending (max 1 per second)
- ✅ Rate limit approval actions (max 5 per minute)
- ✅ Implement exponential backoff on failures

### 9.4 Data Privacy

**Threats:**
- Leaking message content in error responses
- Exposing user IDs in public endpoints

**Mitigations:**
- ✅ Never include message content in error logs
- ✅ Use UUIDs instead of sequential IDs
- ✅ Implement GDPR-compliant data deletion

### 9.5 RLS Policies

```sql
-- Ensure users can only read their own conversations
CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (
  auth.uid() = user1_id OR 
  auth.uid() = user2_id
);

-- Ensure only recipients can approve
CREATE POLICY "Only recipient can approve conversation"
ON conversations FOR UPDATE
USING (
  auth.uid() = user2_id AND
  is_approved = false
);

-- Ensure users can only send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Backend Tests (`/tests/api/chat/`):**

```typescript
describe('Conversation Approval Logic', () => {
  test('User A can send first message to unapproved conversation', async () => {
    // Test implementation
  });

  test('User A cannot send second message before approval', async () => {
    // Test implementation
  });

  test('User B can approve conversation', async () => {
    // Test implementation
  });

  test('User A cannot approve own conversation', async () => {
    // Test implementation
  });

  test('After approval, both users can send unlimited messages', async () => {
    // Test implementation
  });

  test('Approval is idempotent (multiple calls same result)', async () => {
    // Test implementation
  });
});
```

**Frontend Tests (`/tests/components/`):**

```typescript
describe('ApprovalBanner Component', () => {
  test('Shows waiting state for initiator', () => {
    // Test implementation
  });

  test('Shows approve button for recipient', () => {
    // Test implementation
  });

  test('Hides banner after approval', () => {
    // Test implementation
  });

  test('Handles approval loading state', () => {
    // Test implementation
  });
});
```

### 10.2 Integration Tests

**Scenarios:**

1. **Happy Path - Full Flow**
   - User A starts conversation with User B
   - User A sends first message
   - User B receives notification
   - User B views message and approves
   - User A receives approval notification
   - Both users can now chat freely

2. **Edge Case - Concurrent Approval**
   - User B clicks approve twice quickly
   - System handles idempotently (no error)

3. **Edge Case - Message While Approving**
   - User A sends message
   - User B starts approval process
   - User A tries to send second message (should fail)
   - Approval completes
   - User A can now send messages

4. **Error Handling**
   - Network failure during approval
   - Database transaction rollback
   - UI shows appropriate error message

### 10.3 Performance Tests

**Load Testing:**
- Simulate 1000 concurrent approval requests
- Measure response time (target: < 200ms p95)
- Check database connection pooling

**Stress Testing:**
- Send 10,000 messages to unapproved conversations
- Verify all are rejected with proper error
- No database performance degradation

### 10.4 User Acceptance Testing

**Test Scenarios:**

| ID | Scenario | Expected Result |
|----|----------|----------------|
| UAT-1 | User A sends first message | Message appears, input disabled |
| UAT-2 | User A tries to send second message | Error toast appears |
| UAT-3 | User B sees conversation list | "Pending" badge visible |
| UAT-4 | User B opens conversation | Approval banner shown |
| UAT-5 | User B clicks approve | Success toast, banner disappears |
| UAT-6 | User A refreshes after approval | Can now send messages |
| UAT-7 | Both users chat normally | No restrictions, works as before |

---

## 11. Rollout Plan

### 11.1 Pre-Deployment Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Staging environment tested
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

### 11.2 Deployment Strategy

**Blue-Green Deployment:**

1. **Deploy to Staging** (Day 1)
   - Deploy database migration
   - Deploy backend code
   - Deploy frontend code
   - Run smoke tests

2. **Staged Rollout** (Day 2-3)
   - Deploy to 10% of users
   - Monitor error rates and performance
   - Gradually increase to 50%
   - Monitor for 24 hours

3. **Full Rollout** (Day 4)
   - Deploy to 100% of users
   - Monitor closely for first 48 hours

### 11.3 Rollback Plan

**If Critical Issues Found:**

1. **Immediate Rollback**
   - Revert frontend code
   - Revert backend code
   - Keep database changes (backward compatible)

2. **Database Rollback (if needed)**
   ```sql
   -- Only if absolutely necessary
   ALTER TABLE conversations
   DROP COLUMN IF EXISTS is_approved,
   DROP COLUMN IF EXISTS approved_at,
   DROP COLUMN IF EXISTS approved_by;
   ```

3. **Communication**
   - Notify users of temporary issue
   - Provide ETA for fix
   - Post-mortem analysis

### 11.4 Monitoring & Alerts

**Key Metrics to Monitor:**

- Approval success rate (target: > 99%)
- Approval response time (target: < 200ms)
- Error rate for approval endpoint (target: < 0.1%)
- Message send failure rate (target: < 0.5%)
- User complaints (target: < 5 per day)

**Alert Triggers:**

- Error rate > 1% for 5 minutes → Page on-call engineer
- Response time > 500ms for 5 minutes → Investigate
- Database connection pool > 80% → Scale up

---

## 12. Future Enhancements

### 12.1 Potential Features (Post-MVP)

1. **Conversation Request Expiration**
   - Auto-expire unapproved conversations after 30 days
   - Send reminder notification to recipient

2. **Custom Approval Messages**
   - Allow recipient to send custom reply with approval
   - "Thanks for reaching out! What's this about?"

3. **Bulk Approval/Rejection**
   - Allow users to approve/reject multiple conversations at once
   - Useful for power users with many pending requests

4. **Conversation Request Filtering**
   - Let users set preferences for who can message them
   - E.g., "Only users in same industry"

5. **Analytics Dashboard**
   - Show users their approval rate
   - Track conversation initiation success rate

### 12.2 Technical Debt to Address

- Replace polling with WebSocket for real-time updates
- Implement message read receipts
- Add full-text search for conversations
- Optimize database queries with materialized views

---

## 13. Appendix

### A. TypeScript Interfaces

```typescript
// Updated Conversation interface
interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  last_message_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// Updated Message interface
interface Message {
  id: string;
  conversation_id: string | null;
  group_id: string | null;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: 'image' | 'video' | 'file' | 'audio' | null;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Notification interface for approval
interface ConversationNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'conversation_request' | 'conversation_approved' | 'direct_message';
  message: string;
  metadata: {
    conversation_id: string;
    message_id?: string;
    requires_approval?: boolean;
  };
  is_read: boolean;
  created_at: string;
}
```

### B. API Error Codes

| Code | Description | HTTP Status |
|------|-------------|------------|
| `APPROVAL_REQUIRED` | Message blocked pending approval | 403 |
| `UNAUTHORIZED_APPROVAL` | User cannot approve this conversation | 403 |
| `CONVERSATION_NOT_FOUND` | Conversation ID invalid | 404 |
| `ALREADY_APPROVED` | Conversation already approved | 200 |
| `INVALID_CONVERSATION_ID` | Malformed UUID | 400 |

### C. Database Indexes Summary

| Index Name | Table | Columns | Purpose |
|------------|-------|---------|---------|
| `idx_conversations_not_approved` | conversations | is_approved | Filter unapproved conversations |
| `idx_conversations_user_approval` | conversations | user1_id, user2_id, is_approved | User filtering + approval |
| `idx_messages_conversation_id` | messages | conversation_id, created_at | Fetch messages efficiently |

---

## 14. Sign-Off

### Stakeholder Approval

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Manager | - | Pending | - |
| Tech Lead | - | Pending | - |
| Frontend Lead | - | Pending | - |
| Backend Lead | - | Pending | - |
| QA Lead | - | Pending | - |

### Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Dec 2025 | AI Agent | Initial implementation plan |

---

**End of Document**

---

## Next Steps

1. **Review this plan** with the development team
2. **Validate database schema changes** with DBA
3. **Confirm UI/UX** with design team
4. **Get stakeholder approval** before proceeding
5. **Create GitHub issues** for each phase
6. **Start Phase 1** - Database & Backend implementation

---

**Questions or Concerns?**

Please reach out to the project lead or comment on this document for clarification.
