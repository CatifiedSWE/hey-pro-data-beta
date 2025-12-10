# Chat Notification Fixes - Implementation Summary

## Date: January 2025

## Issues Fixed

### 1. Dynamic Red Notification Dot on Chat Icon (Navbar)
**Problem**: The chat icon in the navbar always showed a red notification dot, regardless of whether there were unread messages.

**Solution**: 
- Created a new hook `useChatUnreadCount` that tracks total unread messages across conversations and groups
- Modified the header component to conditionally render the red dot only when `chatUnreadCount > 0`
- The hook polls for updates every 5 seconds to keep the count current

### 2. Unread Message Count Not Disappearing After Reading
**Problem**: The unread message count badges next to user profiles in the chat list remained visible even after reading the messages.

**Solution**:
- Updated conversation page (`/app/app/(app)/(chat)/inbox/c/[id]/page.tsx`) to automatically mark messages as read when:
  - User opens a conversation
  - Messages are viewed on screen
- Updated group chat page (`/app/app/(app)/(chat)/inbox/g/[id]/page.tsx`) with the same functionality
- Messages are marked as read via the existing API endpoint `/api/chat/messages/[messageId]/read`

## Files Modified

### 1. `/app/hooks/useChatUnreadCount.ts` (NEW)
- Custom React hook to track total unread messages
- Fetches data from conversations and groups APIs
- Polls every 5 seconds for real-time updates
- Returns `unreadCount`, `loading`, and `refetch` function

### 2. `/app/components/header/index.tsx`
- Added import for `useChatUnreadCount` hook
- Added `chatUnreadCount` state from the hook
- Modified chat icon badge to conditionally render only when `chatUnreadCount > 0`

```tsx
// Before:
<Badge className="absolute top-6 right-1 h-3 w-3 rounded-full p-0 flex items-center justify-center text-xs bg-[#FA596E] text-white">
</Badge>

// After:
{chatUnreadCount > 0 && (
  <Badge className="absolute top-6 right-1 h-3 w-3 rounded-full p-0 flex items-center justify-center text-xs bg-[#FA596E] text-white">
  </Badge>
)}
```

### 3. `/app/app/(app)/(chat)/inbox/c/[id]/page.tsx`
- Added import for `markMessageAsRead` function
- Added new `useEffect` hook to automatically mark unread messages as read when viewing conversation
- Marks messages where:
  - Sender is not the current user
  - Status is not already 'read'
- Refreshes conversation details after marking messages as read

### 4. `/app/app/(app)/(chat)/inbox/g/[id]/page.tsx`
- Added import for `markMessageAsRead` function
- Added new `useEffect` hook to automatically mark unread messages as read when viewing group chat
- Same logic as conversation page for consistency

## Technical Implementation Details

### Message Read Logic
When a user opens a conversation or group chat:
1. The page fetches all messages via the API
2. A `useEffect` hook filters messages that are:
   - From other users (not sent by current user)
   - Not yet marked as read (`status !== 'read'`)
3. For each unread message, calls `markMessageAsRead(messageId)` API
4. This updates the message status in the database to 'read'
5. The unread count in the API response automatically decreases

### Unread Count Tracking
The `useChatUnreadCount` hook:
1. Fetches conversations using `getConversations()` API
2. Fetches groups using `getGroups()` API
3. Sums up the `unreadCount` property from each conversation and group
4. Returns the total count to the navbar
5. Polls every 5 seconds to keep it updated

### Data Flow
```
User opens conversation
    ↓
Messages loaded
    ↓
useEffect detects unread messages
    ↓
Calls markMessageAsRead() for each
    ↓
Database updates message status
    ↓
Next API poll returns updated unread count
    ↓
Navbar badge disappears (if count = 0)
    ↓
Chat list badges update
```

## API Endpoints Used

1. **GET `/api/chat/conversations`**
   - Returns list of conversations with `unreadCount` for each
   
2. **GET `/api/chat/groups`**
   - Returns list of groups with `unreadCount` for each
   
3. **PATCH `/api/chat/messages/[messageId]/read`**
   - Marks a specific message as read
   - Updates message status to 'read' in database

## Benefits

1. **Real-time Updates**: Unread counts update automatically every 5 seconds
2. **Accurate Indicators**: Red dot and badges only show when there are truly unread messages
3. **Better UX**: Users can clearly see which conversations have new messages
4. **Automatic**: Messages are marked as read automatically when viewed, no manual action needed
5. **Consistent**: Same behavior across 1-on-1 conversations and group chats

## Testing Recommendations

1. **Test Scenario 1**: New conversation
   - Send a message from User A to User B
   - Verify User B sees red dot on chat icon
   - Verify User B sees unread count badge on User A's profile in chat list
   - User B opens conversation
   - Verify red dot disappears (if no other unread messages)
   - Verify unread badge disappears from User A's profile

2. **Test Scenario 2**: Multiple conversations
   - Have unread messages in multiple conversations
   - Verify count on navbar shows total unread across all conversations
   - Open one conversation
   - Verify count decreases by the number of unread messages in that conversation

3. **Test Scenario 3**: Group chat
   - Send messages in a group from User A
   - Verify User B sees increased unread count
   - User B opens group chat
   - Verify messages are marked as read
   - Verify unread count decreases

4. **Test Scenario 4**: Real-time updates
   - Have conversation open on two devices
   - Send message from Device A
   - Verify Device B receives message and navbar updates within 5 seconds

## Notes

- The polling interval is set to 5 seconds to balance between real-time updates and server load
- Messages are marked as read client-side, so if the API call fails, it will retry on next render
- The hook automatically handles authentication state changes
- Empty states are handled gracefully (shows 0 when no unread messages)

## Future Enhancements

1. Consider using WebSocket for real-time updates instead of polling
2. Add notification sound when new unread messages arrive
3. Show unread count badge with number (e.g., "5" instead of just a dot)
4. Add "mark all as read" functionality
5. Add read receipts to show when messages were read
