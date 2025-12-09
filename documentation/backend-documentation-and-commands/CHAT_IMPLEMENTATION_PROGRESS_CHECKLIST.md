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

## Phase 2: Backend API Updates ✅ COMPLETED
### 2.1 Modify Send Message Endpoint
- [x] Update `/app/api/chat/conversations/[conversationId]/messages/route.ts` (POST method)
  - [x] Fetch conversation with approval status
  - [x] Check if conversation is approved
  - [x] Implement one-message restriction for initiator
  - [x] Block additional messages until approval
  - [x] Different notification types for approved/unapproved conversations

### 2.2 Create Approval Endpoint
- [x] Create `/app/api/chat/conversations/[conversationId]/approve/route.ts`
  - [x] Verify user is the recipient (user2)
  - [x] Check if conversation is already approved
  - [x] Update conversation approval status
  - [x] Create approval notification for initiator
  - [x] Return updated conversation

### 2.3 Update Conversations List Endpoint
- [x] Update `/app/api/chat/conversations/route.ts` (GET method)
  - [x] Include `is_approved`, `approved_at`, `approved_by` in response
  - [x] Add approval status to enriched conversations

**Completion Date**: January 2025 (Pre-completed)

---

## Phase 3: Frontend Implementation ✅ COMPLETED
### 3.1 Create New Components
- [x] Chat API helpers at `/app/lib/api/chat.ts`
  - [x] Manage chat state
  - [x] Handle approval actions
  - [x] Error handling and loading states

- [x] Create `/app/app/(app)/(chat)/components/ApprovalBanner.tsx`
  - [x] Show when conversation is not approved
  - [x] Different UI for initiator vs recipient
  - [x] Initiator: "Waiting for approval" message
  - [x] Recipient: "Approve" button
  - [x] Loading states during approval
  - [x] Success/error handling

### 3.2 Update Conversation Page
- [x] Update `/app/app/(app)/(chat)/inbox/c/[id]/page.tsx`
  - [x] Fetch conversation details (approval status)
  - [x] Determine if current user is initiator
  - [x] Show ApprovalBanner component when needed
  - [x] Disable message input until approved
  - [x] Handle approval success event
  - [x] Re-fetch conversation after approval

### 3.3 Update Profile Page
- [x] Update "Message" button in `/app/app/(app)/profile/[userId]/components/ReadOnlyShortProfile.tsx`
  - [x] Import `startConversation` from chat API
  - [x] Import `useRouter` from Next.js
  - [x] Handle button click event
  - [x] Call API to create/get conversation
  - [x] Navigate to conversation page
  - [x] Loading state with spinner
  - [x] Error handling with toast
  - [x] Updated desktop button (top right)
  - [x] Updated mobile button (bottom action bar)

**Completion Date**: January 2025

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
