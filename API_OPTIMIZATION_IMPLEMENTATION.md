# API Optimization Implementation Summary

## Date: December 20, 2025
## Issue: Excessive API calls (~30 calls/min, ~600 auth requests/hour)

---

## ✅ FIXES IMPLEMENTED

### 1. Fixed Interval Stacking in `useChatUnreadCount` Hook
**File:** `/app/hooks/useChatUnreadCount.ts`

**Problem:**
- `fetchUnreadCount` was in the dependency array of the polling useEffect
- Every re-render created a NEW interval without properly clearing the old one
- Result: Multiple intervals running simultaneously, causing duplicate requests at the same timestamp

**Fix Applied:**
```typescript
// Before:
useEffect(() => {
  // ... interval code
}, [user, fetchUnreadCount, isInboxRoute]); // ❌ fetchUnreadCount causes re-creation

// After:
useEffect(() => {
  // ... interval code
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, isInboxRoute]); // ✅ Removed fetchUnreadCount
```

**Impact:** Prevents interval stacking, eliminates duplicate simultaneous requests

---

### 2. Reduced Message Polling Frequency
**File:** `/app/app/(app)/(chat)/inbox/c/[id]/page.tsx`

**Problem:**
- Messages polled every 3 seconds = 20 requests per minute per open chat
- No visibility check = polling continues even when tab is inactive

**Fix Applied:**
```typescript
// Before:
setInterval(() => {
  // poll messages
}, 3000); // ❌ Every 3 seconds

// After:
setInterval(() => {
  if (!document.hidden) { // ✅ Only when tab is active
    // poll messages
  }
}, 15000); // ✅ Every 15 seconds (80% reduction)
```

**Impact:** 80% reduction in message polling requests

---

### 3. Debounced `fetchConversationDetails`
**File:** `/app/app/(app)/(chat)/inbox/c/[id]/page.tsx`

**Problem:**
- `fetchConversationDetails` called on every message count change
- Function reference in dependencies caused unnecessary re-fetches

**Fix Applied:**
```typescript
// Before:
useEffect(() => {
  fetchConversationDetails();
}, [messages.length, user, fetchConversationDetails]); // ❌ Triggers on every message

// After:
useEffect(() => {
  const timer = setTimeout(() => {
    fetchConversationDetails();
  }, 300); // ✅ Debounced
  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]); // ✅ Only on user change
```

**Impact:** Reduces excessive conversation detail fetches

---

### 4. Implemented Session Caching
**File:** `/app/lib/supabase/client.ts`

**Problem:**
- Every API call fetched a new session via `supabase.auth.getSession()`
- 771 auth requests in 60 minutes (~13 req/min)
- No caching mechanism

**Fix Applied:**
```typescript
// New session cache with 5-minute expiry
interface SessionCache {
  session: any;
  expiresAt: number;
}

let sessionCache: SessionCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedSession = async () => {
  const now = Date.now();
  
  // Return cached session if still valid
  if (sessionCache && now < sessionCache.expiresAt) {
    return sessionCache.session;
  }
  
  // Fetch and cache new session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    sessionCache = { session, expiresAt: now + CACHE_DURATION };
  }
  return session;
};
```

**Impact:** 80% reduction in auth requests (from ~13/min to ~2-3/min)

---

### 5. Updated `useNotifications` to Use Cached Session
**File:** `/app/hooks/useNotifications.ts`

**Problem:**
- Called `supabase.auth.getSession()` on every notification fetch
- Called on every mark-as-read action

**Fix Applied:**
```typescript
// Before:
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// After:
import { getAccessToken } from '@/lib/supabase/client';
const token = await getAccessToken(); // Uses cached session
```

**Impact:** Reduces auth checks in notification operations

---

### 6. Added Page Visibility API Checks
**Files:** 
- `/app/hooks/useChatUnreadCount.ts`
- `/app/app/(app)/(chat)/inbox/c/[id]/page.tsx`

**Problem:**
- Polling continued even when user switched tabs
- Wasted resources on background polling

**Fix Applied:**
```typescript
const isPageVisible = () => !document.hidden;

setInterval(() => {
  if (isPageVisible()) { // ✅ Only poll when tab is active
    // ... polling logic
  }
}, interval);
```

**Impact:** Reduces unnecessary background API calls

---

## 📊 EXPECTED RESULTS

### Before Optimization:
- **REST Requests:** ~1,693 in 60 min (~28 req/min)
- **Auth Requests:** ~771 in 60 min (~13 req/min)
- **Total:** ~2,464 requests/hour

### After Optimization:
- **REST Requests:** ~500-700 in 60 min (~8-12 req/min) - **60-70% reduction**
- **Auth Requests:** ~150-200 in 60 min (~2-3 req/min) - **75-80% reduction**
- **Total:** ~650-900 requests/hour - **~65% reduction overall**

---

## 📝 FILES MODIFIED

1. `/app/hooks/useChatUnreadCount.ts`
   - Fixed interval stacking bug
   - Added Page Visibility API

2. `/app/app/(app)/(chat)/inbox/c/[id]/page.tsx`
   - Reduced polling from 3s to 15s
   - Added Page Visibility API
   - Debounced fetchConversationDetails

3. `/app/lib/supabase/client.ts`
   - Added session caching (5-minute expiry)
   - Updated getAccessToken to use cache
   - Added clearSessionCache function

4. `/app/hooks/useNotifications.ts`
   - Updated to use cached session via getAccessToken
   - Reduced auth requests in mark-as-read operations

---

## 🧪 TESTING CHECKLIST

- [ ] Monitor Supabase dashboard for 10-15 minutes
- [ ] Verify REST requests dropped to ~8-12 per minute
- [ ] Verify Auth requests dropped to ~2-3 per minute
- [ ] Check browser console for no duplicate interval warnings
- [ ] Test chat functionality:
  - [ ] Messages send correctly
  - [ ] Messages receive correctly (within 15 seconds)
  - [ ] Unread count updates properly
- [ ] Test notifications:
  - [ ] Notifications load
  - [ ] Mark as read works
  - [ ] Mark all as read works
- [ ] Test tab switching:
  - [ ] Polling pauses when tab inactive
  - [ ] Polling resumes when tab active
- [ ] Test authentication:
  - [ ] Login works
  - [ ] Logout works (cache cleared)
  - [ ] Session persists correctly

---

## ⚠️ KNOWN LIMITATIONS

### Still TODO (For Future Optimization):

1. **Implement Supabase Realtime for Messages**
   - Replace polling with WebSocket subscriptions
   - Would eliminate message polling entirely
   - Estimated additional 50-70% reduction in REST calls

2. **Fix N+1 User Fetching Problem**
   - Create batch user fetch endpoint
   - Currently fetching users one-by-one in loops
   - Evidence: Multiple `/auth/v1/admin/users/{uuid}` calls at same timestamp

3. **Implement React Query or SWR**
   - Intelligent request deduplication
   - Automatic background refetching
   - Better cache invalidation

4. **Add Request Deduplication Library**
   - Prevent duplicate simultaneous requests
   - Coalesce multiple identical requests into one

---

## 🔍 MONITORING

After deployment, monitor these metrics:

1. **Supabase Dashboard > API Stats**
   - REST requests per minute (target: <12)
   - Auth requests per minute (target: <3)
   - No spike patterns

2. **Browser DevTools > Network Tab**
   - No duplicate requests at same timestamp
   - Requests spaced appropriately (15s for messages, 60s for unread count)

3. **Console Logs**
   - Look for "Using cached session" messages
   - No error messages
   - No interval stacking warnings

4. **User Experience**
   - No delays in message delivery
   - Unread counts update correctly
   - Notifications work properly

---

## 📞 ROLLBACK PLAN

If issues arise, rollback by reverting these changes:

```bash
git diff HEAD~1 -- app/hooks/useChatUnreadCount.ts
git diff HEAD~1 -- app/app/(app)/(chat)/inbox/c/[id]/page.tsx
git diff HEAD~1 -- app/lib/supabase/client.ts
git diff HEAD~1 -- app/hooks/useNotifications.ts
```

Or:
```bash
git revert <commit-hash>
```

---

## ✅ CONCLUSION

All critical fixes have been implemented to address the excessive API calls issue. The optimizations focus on:

1. **Preventing interval stacking** (most critical bug)
2. **Reducing polling frequency** (80% reduction in message polls)
3. **Caching auth sessions** (80% reduction in auth requests)
4. **Adding page visibility checks** (stop polling when tab inactive)
5. **Debouncing frequent calls** (prevent cascading re-fetches)

Expected overall reduction: **~65% fewer API calls**

Next deployment should show significant improvement in Supabase API usage statistics.
