# API Call Optimization Fix - Summary

## Issue Description
The application was making excessive API calls, even when users were not on specific pages. The main issues were:

1. **Polling Interval Too Aggressive**: Chat unread count was polling every 5 seconds
2. **Duplicate Fetches**: Multiple simultaneous API calls due to React re-renders
3. **Unnecessary Dependencies**: useEffect hooks triggering on function reference changes
4. **No Debouncing**: API calls happening without any delay protection

## Root Cause Analysis

### 1. useChatUnreadCount Hook
**File**: `/app/hooks/useChatUnreadCount.ts`

**Issues**:
- Polling interval of 5 seconds was calling `/api/chat/groups` and `/api/chat/conversations` continuously
- No protection against duplicate simultaneous fetches
- useEffect dependency on `fetchUnreadCount` causing unnecessary re-renders

**Impact**: 
- ~12 API calls per minute for chat data alone
- ~720 API calls per hour just for unread count

### 2. useNotifications Hook
**File**: `/app/hooks/useNotifications.ts`

**Issues**:
- useEffect dependency on `fetchNotifications` function causing unnecessary refetches
- No debouncing mechanism
- Header component triggering additional fetches
- Supabase realtime subscriptions re-subscribing on every `fetchNotifications` change

**Impact**:
- Multiple redundant calls to `/api/notifications`
- Unnecessary re-subscriptions to Supabase channels

### 3. useProfile Hook
**File**: `/app/hooks/useProfile.ts`

**Issues**:
- Profile completion recalculation running on EVERY state change
- useEffect dependencies including all profile data arrays
- No session-based caching to prevent redundant calculations

**Impact**:
- `/api/profile/complete` being called excessively
- Background recalculation API calls on every profile data change

### 4. useSectionVisibility Hook
**File**: `/app/hooks/useSectionVisibility.ts`

**Issues**:
- useEffect dependency on `fetchVisibility` function reference

**Impact**:
- Unnecessary calls to `/api/profile/section-visibility`

### 5. Header Component
**File**: `/app/components/header/index.tsx`

**Issues**:
- All hooks initialized in header which is always mounted
- Supabase realtime subscriptions re-creating on function changes
- Notification fetch triggered on dropdown open without debouncing

## Fixes Applied

### 1. Chat Unread Count Polling Optimization
**Changes**:
- Increased polling interval from 5 seconds to 30 seconds (83% reduction)
- Added `isFetchingRef` to prevent duplicate simultaneous fetches
- Fixed useEffect dependencies to only trigger on user change

**Result**:
- Reduced from ~720 to ~120 API calls per hour (83% reduction)
- Eliminated duplicate concurrent requests

### 2. Notifications Fetch Optimization
**Changes**:
- Added `isFetchingRef` to prevent duplicate fetches
- Added `lastFetchTimeRef` with 2-second debouncing
- Fixed useEffect to only trigger on user change, not on function reference change
- Fixed Header component to not depend on `fetchNotifications` reference

**Result**:
- Eliminated duplicate notification fetches
- 2-second minimum interval between fetches
- Reduced Supabase realtime re-subscriptions

### 3. Profile Hook Optimization
**Changes**:
- Added session storage flag to prevent multiple recalculation calls
- Changed useEffect dependency to only trigger once per session
- Fixed useEffect to use `profile?.user_id` instead of all profile data

**Result**:
- Profile completion recalculation now runs once per session
- Eliminated continuous profile refetches

### 4. Section Visibility Optimization
**Changes**:
- Fixed useEffect to only depend on `userId`, not `fetchVisibility` function

**Result**:
- Eliminated unnecessary visibility API calls

### 5. Header Component Optimization
**Changes**:
- Added debouncing to notification dropdown fetch
- Fixed Supabase realtime subscription to only depend on `user?.id`
- Removed function reference dependencies from useEffect hooks

**Result**:
- Reduced notification dropdown spam
- Single Supabase subscription per user session

## Impact Summary

### Before Optimization:
- **Chat API calls**: ~720 calls/hour (every 5 seconds)
- **Notification API calls**: Multiple redundant calls per page navigation
- **Profile API calls**: Continuous calls on every state change
- **Total estimated**: 1000+ API calls per hour per active user

### After Optimization:
- **Chat API calls**: ~120 calls/hour (every 30 seconds) - **83% reduction**
- **Notification API calls**: Debounced with 2-second minimum interval
- **Profile API calls**: Once per session + on-demand updates
- **Total estimated**: ~200 API calls per hour per active user - **80% reduction**

## Additional Recommendations

### 1. Implement SWR or React Query
Consider using a data fetching library like SWR or React Query for:
- Automatic request deduplication
- Better caching strategies
- Built-in retry logic
- Optimistic updates

### 2. WebSocket for Real-Time Updates
Instead of polling every 30 seconds, consider:
- Using Supabase Realtime for unread counts
- Implementing WebSocket for instant updates
- Reduces to 0 polling requests

### 3. Service Worker for Background Sync
Implement service workers to:
- Handle background data synchronization
- Reduce main thread API calls
- Better offline support

### 4. Request Batching
Consider batching multiple API calls into single requests:
- Combine chat conversations and groups into one endpoint
- Aggregate user data fetches
- Reduce HTTP overhead

## Testing Recommendations

1. **Monitor API Logs**: Use the backend logs to verify the reduction in API calls
2. **User Experience**: Ensure 30-second polling doesn't impact UX negatively
3. **Real-time Updates**: Verify Supabase realtime subscriptions work correctly
4. **Performance**: Monitor browser performance with React DevTools Profiler

## Files Modified

1. `/app/hooks/useChatUnreadCount.ts` - Polling interval and deduplication
2. `/app/hooks/useNotifications.ts` - Debouncing and deduplication
3. `/app/hooks/useProfile.ts` - Session-based caching
4. `/app/hooks/useSectionVisibility.ts` - Dependency optimization
5. `/app/components/header/index.tsx` - Component-level optimizations

## Rollback Instructions

If issues arise, the polling interval can be adjusted:
- Change `30000` back to `5000` in `/app/hooks/useChatUnreadCount.ts` line 60
- Remove debouncing logic by removing `isFetchingRef` and `lastFetchTimeRef` checks
- Revert useEffect dependencies to include function references

---

**Date**: 2025
**Tested**: Development environment
**Status**: Ready for production deployment
