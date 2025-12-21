# Landing Page Email Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LANDING PAGE EMAIL FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           INSIDER ACCESS SECTION                              │
└──────────────────────────────────────────────────────────────────────────────┘

User enters email → Clicks "Activate Access"
                           ↓
                  [Show Loading Spinner]
                           ↓
              Call /api/landing/check-email
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
   EMAIL EXISTS                          EMAIL NOT EXISTS
        ↓                                      ↓
Call /api/landing/submit-webhook     Call /api/landing/submit-webhook
  (exists: true)                        (exists: false) ← NOT CALLED YET
        ↓                                      ↓
Trigger Webhook 1                       Show "Reserve your spot" popup
(8626cfd0...)                                  ↓
        ↓                               "I can't find that email..."
Show "You're on the list" popup                ↓
        ↓                               Button: "Reserve My Spot"
"Thanks for confirming..."                     ↓
        ↓                               [Scroll to Future Insider ↓]
    [DONE]                                     ↓
                                            [See Future Insider Flow]


┌──────────────────────────────────────────────────────────────────────────────┐
│                          FUTURE INSIDER SECTION                               │
└──────────────────────────────────────────────────────────────────────────────┘

User enters email → Clicks "Reserve My Spot"
                           ↓
                  [Show Loading Spinner]
                           ↓
              Call /api/landing/check-email
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
   EMAIL EXISTS                          EMAIL NOT EXISTS
        ↓                                      ↓
Call /api/landing/submit-webhook     Call /api/landing/submit-webhook
  (exists: true)                        (exists: false)
        ↓                                      ↓
Trigger Webhook 1                        Trigger Webhook 2
(8626cfd0...)                           (76e7b4bb...)
        ↓                                      ↓
Show "You're on the list" popup       Show "Spot Reserved" popup
        ↓                                      ↓
"Thanks for confirming..."            "You're in line. We'll notify you..."
        ↓                                      ↓
    [DONE]                                  [DONE]


┌──────────────────────────────────────────────────────────────────────────────┐
│                             WEBHOOK TRIGGERS                                  │
└──────────────────────────────────────────────────────────────────────────────┘

WEBHOOK 1 (Existing Users)
━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: https://n8n.srv882974.hstgr.cloud/webhook/8626cfd0-07c8-4cf5-93f8-750c42fa481b
Triggered When:
  ✓ Insider Access + Email EXISTS
  ✓ Future Insider + Email EXISTS
Payload:
  {
    "email": "user@example.com",
    "source": "insider-access" | "future-insider",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "submission_date": "January 15, 2025, 10:30 AM",
    "exists": true
  }


WEBHOOK 2 (New Users)
━━━━━━━━━━━━━━━━━━━━
URL: https://n8n.srv882974.hstgr.cloud/webhook/76e7b4bb-f5ed-4c1c-b17d-69c141a49ab0
Triggered When:
  ✓ Future Insider + Email NOT EXISTS
  ✗ Insider Access + Email NOT EXISTS (NOT triggered here)
Payload:
  {
    "email": "newuser@example.com",
    "source": "future-insider",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "submission_date": "January 15, 2025, 10:30 AM",
    "exists": false
  }


┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE CHECKS                                  │
└──────────────────────────────────────────────────────────────────────────────┘

/api/landing/check-email Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Normalize email (lowercase + trim)
              ↓
2. Check auth.users table
   - Fetch ALL users (paginated)
   - Page size: 1000
   - Continue until no more users
              ↓
3. Search for normalized email in auth.users
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
  FOUND             NOT FOUND
    ↓                   ↓
Return              Check user_profiles table
{exists:true}       (case-insensitive ILIKE)
                          ↓
                   ┌──────┴──────┐
                   ↓             ↓
                 FOUND       NOT FOUND
                   ↓             ↓
              Return        Return
              {exists:      {exists:
               true}         false}


┌──────────────────────────────────────────────────────────────────────────────┐
│                               POPUP STATES                                    │
└──────────────────────────────────────────────────────────────────────────────┘

POPUP: "You're on the list"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Icon: Gold Checkmark (#C5A059)
Title: "You're on the list"
Message: "Thanks for confirming your email. We'll be in touch with your 
          activation link as soon as Insider Access opens."
Buttons:
  - [Done] → Close popup
  - [Share HeyProData] → Open share popup


POPUP: "Spot Reserved"
━━━━━━━━━━━━━━━━━━━━━━
Icon: Gold Bookmark (#C5A059)
Title: "Spot Reserved"
Message: "You're in line. We'll notify you when it's time to create your 
          profile and join HeyProData."
Buttons:
  - [Done] → Close popup
  - [Share HeyProData] → Open share popup


POPUP: "Reserve your spot" ★ NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Icon: Orange Info (#FF7A8B)
Title: "Reserve your spot"
Message: "I can't find that email. Want to try another one, or jump in 
          and reserve your spot?"
Buttons:
  - [Reserve My Spot] → Scroll to Future Insider section
  - [Close] → Close popup


POPUP: "Share HeyProData"
━━━━━━━━━━━━━━━━━━━━━━━━━
Icon: N/A
Title: "SHARE HEYPRODATA"
Message: "Share this link with professionals working in production"
Content:
  - URL: https://heyprodata.com
  - [Copy Link] / [Copied!] button


┌──────────────────────────────────────────────────────────────────────────────┐
│                             LOADING STATES                                    │
└──────────────────────────────────────────────────────────────────────────────┘

Insider Access:
  isLoadingInsider = true
    ↓
  - Input field disabled
  - Button disabled + opacity 50%
  - Button text: "Checking..."
  - Spinning loader icon (white border animation)

Future Insider:
  isLoadingFuture = true
    ↓
  - Input field disabled
  - Button disabled + opacity 50%
  - Button text: "Checking..."
  - Spinning loader icon (white border animation)


┌──────────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT STRUCTURE                                  │
└──────────────────────────────────────────────────────────────────────────────┘

TierSections Component
  │
  ├─ State Variables
  │  ├─ activePopup: 'insider' | 'future' | 'share' | 'reserve' | null
  │  ├─ insiderEmail: string
  │  ├─ futureEmail: string
  │  ├─ isLoadingInsider: boolean
  │  ├─ isLoadingFuture: boolean
  │  ├─ copied: boolean
  │  └─ futureInsiderRef: RefObject
  │
  ├─ Event Handlers
  │  ├─ handleInsiderSubmit(e) → async
  │  ├─ handleFutureSubmit(e) → async
  │  ├─ handleScrollToFuture()
  │  ├─ handleShareClick()
  │  └─ handleCopyLink()
  │
  ├─ Sections
  │  ├─ Insider Access Section (dark theme)
  │  ├─ Future Insider Section (light theme) ← ref attached
  │  └─ Decision Makers Section (dark theme)
  │
  └─ Popups (conditional render based on activePopup)
     ├─ Share Popup
     ├─ Reserve Your Spot Popup ★ NEW
     └─ Success Popups (Insider/Future)


┌──────────────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINT DETAILS                                  │
└──────────────────────────────────────────────────────────────────────────────┘

POST /api/landing/check-email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
  {
    "email": "user@example.com"
  }

Response (Success):
  {
    "exists": true,
    "message": "Email exists in database"
  }

Response (Error):
  {
    "error": "Check failed"
  }


POST /api/landing/submit-webhook
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
  {
    "email": "user@example.com",
    "exists": true,
    "source": "insider-access"
  }

Response (Success):
  {
    "success": true,
    "webhookTriggered": true,
    "webhookType": "existing-user",
    "message": "Webhook triggered successfully"
  }

Response (Error):
  {
    "success": false,
    "error": "Failed to trigger webhook",
    "details": "Error message"
  }


┌──────────────────────────────────────────────────────────────────────────────┐
│                            ERROR HANDLING                                     │
└──────────────────────────────────────────────────────────────────────────────┘

Frontend Error Handling:
  try {
    // API calls
  } catch (error) {
    console.error('Error submitting email:', error);
    // Continue gracefully - don't show error to user
  } finally {
    setIsLoading(false); // Always reset loading state
  }

Backend Error Handling:
  - Invalid request → 400 Bad Request
  - Database error → 500 Internal Server Error
  - Webhook failure → 500 (logged but submission still succeeds)
  - All errors logged to console with details


┌──────────────────────────────────────────────────────────────────────────────┐
│                          SMOOTH SCROLL BEHAVIOR                               │
└──────────────────────────────────────────────────────────────────────────────┘

When "Reserve My Spot" clicked in Reserve popup:
  1. Close popup (setActivePopup(null))
  2. Wait 100ms (allow popup to close)
  3. Scroll to Future Insider section
     - behavior: 'smooth'
     - block: 'center' (centers in viewport)
  4. User can now enter email in Future Insider section


Legend:
━━━━━━
  ✓   = Action performed
  ✗   = Action NOT performed
  →   = Flow direction
  ↓   = Next step
  ★   = New feature
```
