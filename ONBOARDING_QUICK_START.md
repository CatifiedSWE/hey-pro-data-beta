# Onboarding Authentication - Quick Start Guide

## 🚀 What Was Implemented

Complete authentication-based onboarding system with:
- ✅ Database column for tracking onboarding completion
- ✅ Server-side redirects on landing page
- ✅ Protected onboarding page (prevents re-access)
- ✅ Existing member detection in all onboarding flows
- ✅ Global middleware enforcement
- ✅ Auto-redirect after submission

---

## 📋 Immediate Next Steps

### Step 1: Run Database Migration
**CRITICAL - Must be done first!**

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy contents from `/app/migrations/add_onboarding_tracking.sql`
4. Paste and execute
5. Verify with: `SELECT * FROM user_profiles LIMIT 1;`
   - Should see `has_completed_onboarding` column

### Step 2: Restart Services
```bash
cd /app
sudo supervisorctl restart all
```

### Step 3: Test the Flow

#### Test 1: Non-Authenticated User
1. Visit `/` → Should see landing page
2. Click "Get Started" → Go to `/onboarding`
3. Complete onboarding → Success

#### Test 2: Authenticated User (Incomplete Onboarding)
1. Login to your app
2. Visit `/` → Auto-redirect to `/onboarding`
3. Complete onboarding → Auto-redirect to `/profile`

#### Test 3: Authenticated User (Completed Onboarding)
1. Login with completed user
2. Visit `/` → Auto-redirect to `/profile`
3. Try visiting `/onboarding` → Auto-redirect to `/profile`

#### Test 4: Existing Member Detection
1. Start onboarding as new user
2. Enter email of existing user
3. Should show "Go to Login" button
4. Click → Redirect to `/login`

---

## 🔑 Key Files Changed

### New Files:
- `/app/middleware.ts` (renamed from proxy.ts)
- `/app/app/onboarding/layout.tsx`
- `/app/migrations/add_onboarding_tracking.sql`
- `/app/ONBOARDING_AUTH_IMPLEMENTATION.md`

### Updated Files:
- `/app/lib/onboarding-chat/chatLogic.ts` (added email check to SUPPLIER flow)
- `/app/app/page.tsx` (already had server-side redirects)
- `/app/app/api/hpd/submit/route.ts` (already updates onboarding status)

---

## 🎯 Expected Behavior

### Landing Page (`/`)
| User State | Action |
|------------|--------|
| Not logged in | Show landing page |
| Logged in + incomplete onboarding | → `/onboarding` |
| Logged in + completed onboarding | → `/profile` |

### Onboarding Page (`/onboarding`)
| User State | Action |
|------------|--------|
| Not logged in | Allow access |
| Logged in + incomplete onboarding | Allow access |
| Logged in + completed onboarding | → `/profile` |

### Auth Pages (`/login`, `/signup`)
| User State | Action |
|------------|--------|
| Not logged in | Show auth page |
| Logged in + incomplete onboarding | → `/onboarding` |
| Logged in + completed onboarding | → `/profile` |

---

## 🔍 How to Verify It's Working

### Check 1: Database Column
```sql
-- In Supabase SQL Editor
SELECT user_id, email, has_completed_onboarding 
FROM user_profiles 
LIMIT 5;
```

### Check 2: Middleware Logs
```bash
# Check if middleware is running
cd /app
tail -f /var/log/supervisor/frontend.*.log | grep "middleware"
```

### Check 3: Onboarding Submission
```bash
# After submitting onboarding, check database
# In Supabase SQL Editor:
SELECT * FROM onboarding_submissions 
ORDER BY created_at DESC 
LIMIT 3;
```

---

## 🐛 Common Issues & Fixes

### Issue: "Column doesn't exist" error
**Fix:** Run the database migration in Supabase SQL Editor

### Issue: Redirect loop on landing page
**Fix:** Ensure user profile has `has_completed_onboarding` column set

### Issue: Can still access `/onboarding` after completion
**Fix:** 
1. Check middleware.ts is in root directory
2. Restart services: `sudo supervisorctl restart all`
3. Verify user's `has_completed_onboarding = true` in database

### Issue: Email check not detecting existing users
**Fix:** 
1. Check `/api/hpd/check-email` endpoint
2. Verify `user_profiles` table has email field
3. Check browser console for API errors

---

## 📊 Monitoring Onboarding

### Check completion rate:
```sql
SELECT 
  has_completed_onboarding,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_profiles
GROUP BY has_completed_onboarding;
```

### See recent onboardings:
```sql
SELECT 
  user_type,
  submitted_fields->>'email' as email,
  submitted_fields->>'firstName' as first_name,
  created_at
FROM onboarding_submissions
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎓 Understanding the Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      USER VISITS /                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Authenticated? │
              └───────┬───────┘
                      │
         ┌────────────┴────────────┐
         │                         │
        NO                        YES
         │                         │
         ▼                         ▼
   ┌──────────┐          ┌─────────────────────┐
   │  Show    │          │ Check onboarding    │
   │ Landing  │          │ status in DB        │
   │  Page    │          └──────────┬──────────┘
   └──────────┘                     │
                           ┌────────┴────────┐
                           │                 │
                      COMPLETED         INCOMPLETE
                           │                 │
                           ▼                 ▼
                    ┌──────────┐      ┌──────────┐
                    │ Redirect │      │ Redirect │
                    │    to    │      │    to    │
                    │ /profile │      │/onboarding│
                    └──────────┘      └──────────┘
```

---

## 📞 Need Help?

1. **Check logs:**
   ```bash
   tail -f /var/log/supervisor/frontend.*.log
   tail -f /var/log/supervisor/backend.*.log
   ```

2. **Check Supabase logs** in Dashboard → Logs

3. **Review full documentation:** `/app/ONBOARDING_AUTH_IMPLEMENTATION.md`

---

## ✅ Implementation Complete!

All authentication-based onboarding logic is now in place. Just run the database migration and test! 🎉
