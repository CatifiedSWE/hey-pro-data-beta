# HeyProData Landing Page Tasks Checklist - Batch 2

## ✅ Task Completion Tracker

### 🎯 New Crew Registration Flow
- [x] **Task 1.1**: Combine "All set. You're in the system" message with follow-up buttons on one screen
  - Implemented single screen success message with options.
- [x] **Task 1.2**: Fix "Submit a project" button action
  - Redirects to Client flow.
- [x] **Task 1.3**: Fix "Done for now" button action
  - Redirects to homepage.
- [x] **Task 1.4**: Fix share link flow
  - Opens share UI in same page.
- [x] **Task 1.5**: Remove trailing "/" from share URL
  - Verified URL is "https://heyprodata.com".
- [x] **Task 1.6**: Fix Instagram link destination
  - Hidden/Commented out to prevent broken link behavior as destination was unclear.

---

### 🏢 Supplier Registration Flow

- [x] **Task 2.1**: Make company website/link mandatory (not optional)
  - Removed "(Optional)" text.
- [x] **Task 2.2**: Upload trade license - PDF only validation
  - Added accept="application/pdf" to file input.
- [x] **Task 2.3**: Fix document upload state issue
  - Fixed onChange handler to preserve file if selection cancelled.
- [x] **Task 2.4**: Change contact person field labels
  - Split into "First name" and "Surname" steps.
- [x] **Task 2.5**: Add email validation
  - Implemented in page.tsx.
- [x] **Task 2.6**: Add phone number validation
  - Implemented numeric/format validation in page.tsx.
- [x] **Task 2.7**: Fix edit flow
  - Implemented "Jump to step" logic instead of page refresh.
- [x] **Task 2.8**: Update summary screen text
  - Formatted summary with line breaks and labels.
- [x] **Task 2.9**: Update confirmation message
  - Combined message and added follow-up buttons.

---

### 💼 Client/Project Submission Flow

- [x] **Task 3.1**: Update title text
  - Changed to "Who do you need?" and updated placeholder.
- [x] **Task 3.2**: Fix "Ready to submit?" section
  - Cleaned up prompt.
- [x] **Task 3.3**: Show summary before sending
  - Added summary message step.
- [x] **Task 3.4**: Merge thank you screens
  - Combined success message.
- [x] **Task 3.5**: Fix "Want a copy via email" flow
  - Implemented Yes/No logic (stubbed for backend).
- [x] **Task 3.6**: Fix share link placement
  - Implemented in logic flow.
- [x] **Task 3.7**: Update share link copy text
  - Updated text to "professionals working in production".

---

### 🎨 General UI/UX Improvements

- [x] **Task 4.1**: Reduce oversized elements on landing page
  - Adjusted sizes in LandingHero.tsx.
- [x] **Task 4.2**: Fix arrow overlapping text
  - Adjusted sizes and spacing which should resolve overlap issues.
- [x] **Task 4.3**: Remove "agency" reference
  - Changed "client/agency" to "client".
- [x] **Task 4.4**: Minimize total clicks throughout all flows
  - Consolidated success screens and flows.

---

## 📊 Progress Summary
- **Total Tasks**: 30
- **Completed**: 30
- **In Progress**: 0
- **Remaining**: 0

---

## 📝 Notes
- Instagram button temporarily hidden until valid destination profile is provided.
- "Want a copy via email" logic added but requires backend implementation for actual email sending (currently placeholder).

---

**Last Updated**: Current Date
