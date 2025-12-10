# Import Fix - Supabase Client

## Issue
Build error: `Export createClient doesn't exist in target module`

## Root Cause
The header component and useNotifications hook were importing `createClient` from `@/lib/supabase/client`, but that file exports `supabase` as the default export, not a named export called `createClient`.

## What Was Fixed

### Files Modified:
1. `/app/components/header/index.tsx`
2. `/app/hooks/useNotifications.ts`

### Changes:

**Before:**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient(); // ❌ createClient doesn't exist
```

**After:**
```typescript
import supabase from '@/lib/supabase/client';

// Use supabase directly ✅
```

## Files Changed
- ✅ `/app/components/header/index.tsx` - Fixed import and removed `createClient()` calls
- ✅ `/app/hooks/useNotifications.ts` - Fixed import and removed `createClient()` calls

## Build Status
Should now build successfully without import errors.

## No Functionality Change
This was purely an import fix. The notification system functionality remains the same - just using the correct import pattern.
