# Chat One-Message Approval Implementation - Progress Checklist

**Project**: HeyProData - Chat Feature with Approval System  
**Tech Stack**: Next.js 15 + TypeScript + Supabase  
**Started**: January 2025  
**Status**: 🟢 In Progress

---

## Overview
Implementing a chat approval system where User A can send only one message to User B, and the conversation remains locked until User B approves it. After approval, both users can chat freely.

---

## Phase 1: Database Changes ✅ COMPLETED
- [x] Add `is_approved` column to `conversations` table (BOOLEAN, default true)
- [x] Add `approved_at` column to `conversations` table (TIMESTAMP)
- [x] Add `approved_by` column to `conversations` table (UUID)
- [x] Add database indexes for filtering unapproved conversations
- [x] Add constraints for data integrity
- [x] Set default values for backward compatibility
- [x] Verify migration on existing conversations

**Completion Date**: January 2025 (Pre-completed)

---

## Phase 2: Backend API Updates 🔄 IN PROGRESS
### 2.1 Modify Send Message Endpoint
- [ ] Update `/app/api/chat/conversations/[conversationId]/messages/route.ts` (POST method)
  - [ ] Fetch conversation with approval status
  - [ ] Check if conversation is approved
  - [ ] Implement one-message restriction for initiator
  - [ ] Block additional messages until approval
  - [ ] Different notification types for approved/unapproved conversations

### 2.2 Create Approval Endpoint
- [ ] Create `/app/api/chat/conversations/[conversationId]/approve/route.ts`
  - [ ] Verify user is the recipient (user2)
  - [ ] Check if conversation is already approved
  - [ ] Update conversation approval status
  - [ ] Create approval notification for initiator
  - [ ] Return updated conversation

### 2.3 Update Conversations List Endpoint
- [ ] Update `/app/api/chat/conversations/route.ts` (GET method)
  - [ ] Include `is_approved`, `approved_at`, `approved_by` in response
  - [ ] Add approval status to enriched conversations

**Target Completion**: [Pending]

---

## Phase 3: Frontend Implementation 🔄 IN PROGRESS
### 3.1 Create New Components
- [ ] Create `/app/hooks/useChat.ts` hook
  - [ ] Manage chat state
  - [ ] Handle approval actions
  - [ ] Error handling and loading states

- [ ] Create `/app/app/(app)/(chat)/components/ApprovalBanner.tsx`
  - [ ] Show "Waiting for approval" state for initiator
  - [ ] Show "Approve conversation" button for recipient
  - [ ] Handle approval action
  - [ ] Loading and error states

### 3.2 Update API Helper Library
- [ ] Update `/app/lib/api/chat.ts`
  - [ ] Add `approveConversation()` function
  - [ ] Update `Conversation` interface with approval fields
  - [ ] Export new types

### 3.3 Update Chat Page
- [ ] Update `/app/app/(app)/(chat)/inbox/c/[id]/page.tsx`
  - [ ] Import and use ApprovalBanner component
  - [ ] Check conversation approval status
  - [ ] Disable message input for unapproved conversations (initiator side)
  - [ ] Show approval banner based on user role
  - [ ] Handle approval success/failure

### 3.4 Update Conversation List
- [ ] Update `/app/app/(app)/(chat)/template.tsx`
  - [ ] Show "Pending approval" badge for unapproved conversations
  - [ ] Visual indicator for conversations awaiting approval
  - [ ] Different styling for pending conversations

### 3.5 Update Profile Page Message Button
- [ ] Update `/app/app/(app)/profile/[userId]/components/ReadOnlyShortProfile.tsx`
  - [ ] Replace toast with actual chat functionality
  - [ ] Call `startConversation()` API
  - [ ] Navigate to conversation page
  - [ ] Handle conversation creation
  - [ ] Error handling

**Target Completion**: [Pending]

---

## Phase 4: Testing & Verification 📋 PENDING
- [ ] Test conversation initiation from profile page
- [ ] Test one-message restriction (sender cannot send second message)
- [ ] Test approval flow (recipient approves conversation)
- [ ] Test post-approval messaging (both users can chat freely)
- [ ] Test error handling (network errors, invalid states)
- [ ] Test UI states (loading, error, success)
- [ ] Test edge cases:
  - [ ] Concurrent approval attempts
  - [ ] Approval of already approved conversation
  - [ ] Message sending during approval process
  - [ ] Conversation deletion before approval
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness testing

**Target Completion**: [Pending]

---

## Phase 5: Documentation Updates 📝 PENDING
- [ ] Update API documentation with new approval endpoint
- [ ] Document approval flow in README
- [ ] Add comments to complex code sections
- [ ] Update type definitions
- [ ] Create user guide for chat approval feature

**Target Completion**: [Pending]

---

## Known Issues & Blockers
*No blockers currently*

---

## Notes & Decisions
- **Database Migration**: Completed before this implementation started
- **Backward Compatibility**: All existing conversations default to `is_approved = true`
- **Group Chats**: Approval logic does NOT apply to group chats (only 1-on-1 DMs)
- **Notification Types**: 
  - `conversation_request` - New unapproved conversation
  - `conversation_approved` - Conversation approved by recipient
  - `direct_message` - Regular message in approved conversation

---

## Success Criteria
- [x] Database schema includes approval fields
- [ ] User A can initiate conversation from any profile page
- [ ] User A can send exactly one message to User B
- [ ] User A cannot send additional messages until approval
- [ ] User B sees approval UI with first message preview
- [ ] User B can approve conversation with one click
- [ ] After approval, both users can chat without restrictions
- [ ] All existing conversations continue working without issues
- [ ] No breaking changes to existing chat functionality

---

**Last Updated**: January 2025  
**Updated By**: AI Agent
