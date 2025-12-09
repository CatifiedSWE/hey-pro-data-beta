# Quick Test Reference - UX Auth Flow

## 🎯 Quick Start

1. Navigate to `/onboarding` page
2. Click "I'm an existing member"
3. Enter test email
4. Verify ONLY correct option appears

---

## 📋 Expected Results By User Type

### Migrated User (No Auth)
**Email:** `migrated-user@example.com`  
**Should See:** ✅ "Access activation link" ONLY  
**Should NOT See:** ❌ "Sign in to profile" or "Sign in with Google"

---

### Email/Password User
**Email:** `password-user@example.com`  
**Should See:** ✅ "Sign in to profile" ONLY  
**Should NOT See:** ❌ "Access activation link" or "Sign in with Google"

---

### Google OAuth User
**Email:** `google-user@example.com`  
**Should See:** ✅ "Sign in with Google" ONLY  
**Should NOT See:** ❌ "Access activation link" or "Sign in to profile"

---

### Non-Existent User
**Email:** `nonexistent@example.com`  
**Should See:** Error message with retry options

---

## ✅ Quick Verification Checklist

- [ ] Each user type sees ONLY their authentication option
- [ ] No extra options appear
- [ ] Error handling works for non-existent emails
- [ ] No console errors in browser DevTools
- [ ] Smooth transitions and clear messages
- [ ] All authentication flows complete successfully

---

## 🔍 Quick API Test

```bash
# Replace with your actual test emails and app URL
curl -X POST http://localhost:3000/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

Expected fields in response:
- `exists`: true/false
- `hasAuthenticationMethod`: true/false (NEW)
- `hasPassword`: true/false (UPDATED)
- `hasGoogleAuth`: true/false
- `needsPasswordSetup`: true/false
- `hasCompletedOnboarding`: true/false

---

## 🚨 Red Flags to Watch For

❌ Multiple authentication options showing at once  
❌ Wrong option displayed for user type  
❌ Console errors in browser DevTools  
❌ API calls failing (check Network tab)  
❌ Confusing or unclear error messages  

---

## 📊 Quick Results Template

```
✅ Migrated User: PASS / FAIL
✅ Password User: PASS / FAIL  
✅ Google User: PASS / FAIL
✅ Non-Existent: PASS / FAIL
✅ No Console Errors: YES / NO
```

---

**For detailed testing instructions, see:** `/app/MANUAL_TESTING_GUIDE_UX_AUTH.md`
