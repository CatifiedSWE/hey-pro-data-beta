# Google Auth Provider Check - Complete Flow Diagram

## 🔄 User Journey Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER LANDS ON ONBOARDING                          │
│                              /onboarding                                  │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Select User Type       │
                │ "I'm an existing       │
                │ member"                │
                └────────┬───────────────┘
                         │
                         ▼
                ┌────────────────────────┐
                │ Choose Action          │
                │ 1. Access activation   │
                │ 2. Sign in to profile  │
                │ 3. Check batch         │
                └────────┬───────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
   ┌──────────────┐          ┌──────────────┐
   │ ACTIVATION   │          │  SIGN IN     │
   │   LINK       │          │  TO PROFILE  │
   └──────┬───────┘          └──────┬───────┘
          │                          │
          │ Enter Email              │ Enter Email
          │                          │
          ▼                          ▼
   ┌─────────────────────────────────────────┐
   │     API: /api/auth/check-user           │
   │     POST { email: "user@example.com" }  │
   └─────────────┬───────────────────────────┘
                 │
                 ▼
   ┌─────────────────────────────────────────┐
   │  Check Supabase Database:               │
   │  1. user_profiles (exists?)             │
   │  2. auth.identities (provider?)         │
   │  3. has_completed_onboarding?           │
   └─────────────┬───────────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
     ▼                       ▼
 User DOESN'T Exist      User EXISTS
     │                       │
     │                       ▼
     │              ┌────────────────────┐
     │              │ Check Provider     │
     │              │ from identities    │
     │              └────────┬───────────┘
     │                       │
     │           ┌───────────┴───────────┐
     │           │                       │
     │           ▼                       ▼
     │    ┌──────────────┐      ┌─────────────┐
     │    │ provider =   │      │ provider =  │
     │    │  'google'    │      │   'email'   │
     │    └──────┬───────┘      └──────┬──────┘
     │           │                     │
     │           ▼                     ▼
     │   ┌──────────────────┐  ┌──────────────────┐
     │   │ hasGoogleAuth:   │  │ hasGoogleAuth:   │
     │   │     true         │  │     false        │
     │   └──────┬───────────┘  └──────┬───────────┘
     │          │                     │
     │          │                     │
     ▼          ▼                     ▼
┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Route to            │  │ Show Google      │  │ Show Password    │
│ WAITLIST FLOW       │  │ Auth Button      │  │ Input Field      │
│                     │  │                  │  │                  │
│ "You're not in      │  │ "Welcome back!   │  │ "Welcome back!   │
│ system yet..."      │  │ You signed up    │  │ Please enter     │
│                     │  │ with Google."    │  │ your password."  │
└─────────────────────┘  └────────┬─────────┘  └────────┬─────────┘
                                  │                      │
                                  │                      │
                                  ▼                      ▼
                         ┌────────────────┐    ┌────────────────┐
                         │ User clicks    │    │ User enters    │
                         │ Google button  │    │ password       │
                         └────────┬───────┘    └────────┬───────┘
                                  │                      │
                                  │                      │
                                  ▼                      ▼
                    ┌─────────────────────────┐ ┌──────────────────┐
                    │ GoogleAuthButton        │ │ API: verify      │
                    │ Component               │ │ password         │
                    │                         │ │                  │
                    │ supabase.auth           │ │ Supabase         │
                    │ .signInWithOAuth({      │ │ .signInWith      │
                    │   provider: 'google',   │ │ Password()       │
                    │   redirectTo: '/...'    │ │                  │
                    │ })                      │ │                  │
                    └─────────┬───────────────┘ └────────┬─────────┘
                              │                          │
                              │                          │
                              ▼                          ▼
                    ┌─────────────────────────┐         │
                    │ Redirect to Google      │         │
                    │ OAuth Consent Screen    │         │
                    └─────────┬───────────────┘         │
                              │                          │
                              │ User authorizes          │
                              │                          │
                              ▼                          │
                    ┌─────────────────────────┐         │
                    │ Google redirects back   │         │
                    │ /callback?code=xyz      │         │
                    │         &next=/profile  │         │
                    └─────────┬───────────────┘         │
                              │                          │
                              ▼                          │
                    ┌─────────────────────────┐         │
                    │ Client: /callback page  │         │
                    │ → Redirects to API      │         │
                    └─────────┬───────────────┘         │
                              │                          │
                              ▼                          │
                    ┌─────────────────────────┐         │
                    │ Server:                 │         │
                    │ /api/auth/callback      │         │
                    │                         │         │
                    │ exchangeCodeForSession()│         │
                    │ Set HTTP-only cookies   │         │
                    └─────────┬───────────────┘         │
                              │                          │
                              └──────────┬───────────────┘
                                         │
                                         ▼
                              ┌─────────────────────────┐
                              │ Check Profile Complete  │
                              │ has_completed_          │
                              │ onboarding = true?      │
                              └─────────┬───────────────┘
                                        │
                                        ▼
                              ┌─────────────────────────┐
                              │ Redirect to             │
                              │ /profile                │
                              │                         │
                              │ ✅ USER LOGGED IN       │
                              └─────────────────────────┘
```

---

## 🎯 Key Decision Points

### 1️⃣ Provider Detection Logic

```javascript
// In /api/auth/check-user/route.ts
const { data: identities } = await supabase
  .from('identities')
  .select('provider')
  .eq('user_id', profileData.user_id);

const hasGoogleProvider = identities?.some(
  identity => identity.provider === 'google'
);
```

**Result:**
- `hasGoogleProvider = true` → Show Google button
- `hasGoogleProvider = false` → Show password input

---

### 2️⃣ UI Branching in Chat Logic

```javascript
// In chatLogic.ts - SIGN IN flow
if (checkResult.hasGoogleAuth) {
  // Show Google button
  nextMessages.push({
    text: 'Welcome back! You signed up with Google.',
    inputType: 'google_auth'  // ← KEY
  });
} else {
  // Show password input
  nextMessages.push({
    text: 'Welcome back! Please enter your password.',
    inputType: 'password'
  });
}
```

---

### 3️⃣ Google Button Component

```typescript
// GoogleAuthButton.tsx
const handleGoogleAuth = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/callback?next=/profile`
    }
  });
};
```

**Flow:**
1. Click button → Loading state
2. Supabase SDK → Google OAuth page
3. User authorizes → Callback
4. Session created → Redirect to profile

---

## 📊 Data Flow Sequence

```
┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Client  │      │   API    │      │ Supabase │      │  Google  │
│ (React) │      │ Route    │      │ Database │      │  OAuth   │
└────┬────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                │                  │                  │
     │ 1. Email input │                  │                  │
     ├───────────────>│                  │                  │
     │                │ 2. Query user    │                  │
     │                ├─────────────────>│                  │
     │                │ 3. Return data   │                  │
     │                │ (has_completed_  │                  │
     │                │  onboarding,     │                  │
     │                │  provider)       │                  │
     │                │<─────────────────┤                  │
     │ 4. Response    │                  │                  │
     │ {hasGoogleAuth}│                  │                  │
     │<───────────────┤                  │                  │
     │                │                  │                  │
     │ 5. Render      │                  │                  │
     │    Google      │                  │                  │
     │    button      │                  │                  │
     │                │                  │                  │
     │ 6. Click       │                  │                  │
     │    Google btn  │                  │                  │
     │                │                  │                  │
     │ 7. OAuth init  │                  │                  │
     ├───────────────────────────────────┼─────────────────>│
     │                │                  │ 8. Consent       │
     │<───────────────────────────────────┼─────────────────┤
     │                │                  │                  │
     │ 9. Authorize   │                  │                  │
     ├───────────────────────────────────┼─────────────────>│
     │                │                  │ 10. Code         │
     │<───────────────────────────────────┼─────────────────┤
     │                │                  │                  │
     │ 11. /callback  │                  │                  │
     │    ?code=xyz   │                  │                  │
     ├───────────────>│ 12. Exchange     │                  │
     │                ├─────────────────>│                  │
     │                │ 13. Session      │                  │
     │                │<─────────────────┤                  │
     │ 14. Set cookies│                  │                  │
     │    + redirect  │                  │                  │
     │<───────────────┤                  │                  │
     │                │                  │                  │
     │ 15. /profile   │                  │                  │
     │    (logged in) │                  │                  │
     │                │                  │                  │
```

---

## 🔐 Authentication State Machine

```
                    ┌─────────────────┐
                    │   UNAUTHENTICATED│
                    │   (No Session)   │
                    └────────┬─────────┘
                             │
                  User enters email
                             │
                             ▼
                    ┌─────────────────┐
                    │   CHECKING       │
                    │   (API call)     │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    Google Provider                   Email Provider
              │                             │
              ▼                             ▼
    ┌──────────────────┐         ┌──────────────────┐
    │ AWAITING_GOOGLE  │         │ AWAITING_PASSWORD│
    │ (Show button)    │         │ (Show input)     │
    └────────┬─────────┘         └────────┬─────────┘
             │                            │
    Click Google button           Enter password
             │                            │
             ▼                            ▼
    ┌──────────────────┐         ┌──────────────────┐
    │ OAUTH_REDIRECT   │         │ VERIFYING        │
    │ (Loading...)     │         │ (API call)       │
    └────────┬─────────┘         └────────┬─────────┘
             │                            │
    Google authorizes                Valid password
             │                            │
             ▼                            ▼
    ┌──────────────────┐         ┌──────────────────┐
    │ CALLBACK         │         │ AUTHENTICATED    │
    │ (Processing)     │         │ (Has session)    │
    └────────┬─────────┘         └────────┬─────────┘
             │                            │
    Session created                       │
             │                            │
             └──────────┬─────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  AUTHENTICATED    │
              │  (Redirect)       │
              └────────┬──────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   PROFILE PAGE    │
              └───────────────────┘
```

---

## 🎨 Component Interaction

```
OnboardingPage.tsx
    │
    ├── Messages Array
    │   └── message.inputType === 'google_auth'
    │
    ├── Conditional Rendering
    │   │
    │   ├── {isGoogleAuth && <GoogleAuthButton />}
    │   │
    │   ├── {needsInput && <input />}
    │   │
    │   └── {isOptions && <OptionCard />}
    │
    └── GoogleAuthButton Component
        │
        ├── State: loading, disabled
        │
        ├── Handler: handleGoogleAuth()
        │   │
        │   └── supabase.auth.signInWithOAuth()
        │       │
        │       └── Redirect to Google
        │
        └── UI: Button + Icon + Text
```

---

## 📱 Responsive Flow (Mobile vs Desktop)

### Desktop Flow
```
┌────────────────────────────────────┐
│                                    │
│  ┌──────┐  Welcome back! You       │
│  │Robot │  signed up with Google.  │
│  │Icon  │                          │
│  └──────┘                          │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [G]  Continue with Google   │ │
│  └──────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘
       Full width, centered
```

### Mobile Flow
```
┌─────────────────────┐
│                     │
│   ┌──────┐          │
│   │Robot │          │
│   │Icon  │          │
│   └──────┘          │
│                     │
│ Welcome back!       │
│ You signed up       │
│ with Google.        │
│                     │
│ ┌─────────────────┐ │
│ │[G] Continue     │ │
│ │    with Google  │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
  Stacked vertically
```

---

## 🧩 File Dependencies

```
onboarding/page.tsx
    │
    ├── import GoogleAuthButton from './components/...'
    ├── import { processNextStep } from '@/lib/onboarding-chat/chatLogic'
    └── import types from '@/lib/onboarding-chat/types'

lib/onboarding-chat/chatLogic.ts
    │
    ├── import types from './types'
    ├── import { checkEmail } from './mockBackend'
    └── Uses: fetch('/api/auth/check-user')

app/api/auth/check-user/route.ts
    │
    ├── import { createServerClient } from '@/lib/supabase/server'
    └── Queries: auth.identities, user_profiles

components/onboarding-chat/GoogleAuthButton.tsx
    │
    ├── import { supabase } from '@/lib/supabase/client'
    └── Uses: supabase.auth.signInWithOAuth()

app/api/auth/callback/route.ts
    │
    ├── import { createServerClient } from '@supabase/ssr'
    └── Uses: exchangeCodeForSession()
```

---

**Last Updated:** January 2025  
**Status:** ✅ Implementation Complete
