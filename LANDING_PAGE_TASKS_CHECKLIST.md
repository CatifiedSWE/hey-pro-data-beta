# HeyProData Landing Page Tasks Checklist - Batch 2

## ✅ Task Completion Tracker

### 🎯 New Crew Registration Flow
- [ ] **Task 1.1**: Combine "All set. You're in the system" message with follow-up buttons on one screen
  - Current: Multiple screens
  - Required: Single screen with message: "All set. You're in the system. We're onboarding in batches - we'll email you when your turn opens up."
  - Follow-up buttons: "Submit a project", "Done for now", "Share HeyProData"

- [ ] **Task 1.2**: Fix "Submit a project" button action
  - Should go to client flow (not crew)

- [ ] **Task 1.3**: Fix "Done for now" button action
  - Should go back to first page

- [ ] **Task 1.4**: Fix share link flow
  - Current: Opens another page with dead end (no exit button)
  - Required: Opens share UI in same page/screen

- [ ] **Task 1.5**: Remove trailing "/" from share URL
  - Current: `https://heyprodata.com/`
  - Required: `https://heyprodata.com`

- [ ] **Task 1.6**: Fix Instagram link destination
  - Need to verify where it takes users

---

### 🏢 Supplier Registration Flow

- [ ] **Task 2.1**: Make company website/link mandatory (not optional)
  - Current: Optional field
  - Required: Mandatory field

- [ ] **Task 2.2**: Upload trade license - PDF only validation
  - Current: Allows PNG uploads
  - Required: Only accept PDF files

- [ ] **Task 2.3**: Fix document upload state issue
  - Current: When clicking "click to change" but not selecting a new file, uploaded file disappears
  - Required: Keep existing file if no new selection made

- [ ] **Task 2.4**: Change contact person field labels
  - Current: "Who is the contact person"
  - Required: "First name" and "Surname" as separate fields

- [ ] **Task 2.5**: Add email validation
  - Current: Allows words instead of email
  - Required: Proper email format validation

- [ ] **Task 2.6**: Add phone number validation
  - Current: Allows letters
  - Required: Only allow numbers, add instruction to enter country code

- [ ] **Task 2.7**: Fix edit flow
  - Current: Shows "To keep things simple, please refresh the page to start over..."
  - Required: Better flow without forcing page refresh

- [ ] **Task 2.8**: Update summary screen text
  - Current: Summary shows "atest (test) Contact: atesaf afda adfasf"
  - Required: "Here's what I have for your company. All good?"
  - Show: Company name, Primary service, Company link, Contact person, Role, Phone

- [ ] **Task 2.9**: Update confirmation message
  - Combine into single message: "Got it. Thanks for your interest in HeyProData. We'll be in touch as soon as supplier access opens."
  - Add follow-up buttons: "Submit a project", "Done for now", "Share HeyProData"

---

### 💼 Client/Project Submission Flow

- [ ] **Task 3.1**: Update title text
  - Current: "Who do you need? - title" 
  - Required: "Who do you need?" as title, "Tell us about the project requirement" in the text box

- [ ] **Task 3.2**: Fix "Ready to submit?" section
  - Current: Says "Select one to continue" but only one option "send brief"
  - Required: Remove confusing text, resize box appropriately

- [ ] **Task 3.3**: Show summary before sending
  - Required: Display brief summary before final submission

- [ ] **Task 3.4**: Merge thank you screens
  - Current: Separate screens for "Thanks" and "right ppl" message
  - Required: Combine into one screen

- [ ] **Task 3.5**: Fix "Want a copy via email" flow
  - Current: Goes straight to "You can also just tell them: HeyProData..."
  - Required: Proper flow logic

- [ ] **Task 3.6**: Fix share link placement
  - Should only appear after asking if they want to share a link
  - Text: "Easy. Here's a link you can share with professionals working in production:"
  - Display main HPD URL with one-click "Copy link" button
  - Optional line: "You can also just tell them: HeyProData. For people who make things happen in film, media and events."

- [ ] **Task 3.7**: Update share link copy text
  - Current: "anyone who works in production"
  - Required: "professionals working in production"

---

### 🎨 General UI/UX Improvements

- [ ] **Task 4.1**: Reduce oversized elements on landing page
  - All elements are too large per user feedback

- [ ] **Task 4.2**: Fix arrow overlapping text
  - Specific UI element needs adjustment

- [ ] **Task 4.3**: Remove "agency" reference
  - Just say "client" instead

- [ ] **Task 4.4**: Minimize total clicks throughout all flows
  - Review and consolidate screens where possible

---

## 📊 Progress Summary
- **Total Tasks**: 30
- **Completed**: 0
- **In Progress**: 0
- **Remaining**: 30

---

## 📝 Notes
- Testing required after each major section completion
- Cross-browser testing needed
- Mobile responsiveness check required

---

**Last Updated**: [Timestamp will be added after first task completion]
