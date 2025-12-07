# HeyProData Onboarding & Landing Implementation Summary

## Overview
This document summarizes the implementation of the new full-screen, card-based onboarding experience for HeyProData. The system is designed to match Duolingo's visual quality and user flow, as per the project requirements.

## Core Architecture

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS Variables (Design Tokens)
- **Animation:** Framer Motion
- **State Management:** React `useReducer` + Custom State Machine

### Design System (Globals)
Design tokens have been established in `globals.css` to ensure consistency:
- **Colors:** `--hp-primary` (#ff5168), `--hp-accent` (#25c9d0), `--hp-base` (#000000)
- **Typography:** Poppins font family (configured in `layout.tsx`)
- **Radius:** `--card-radius` (24px), `--btn-radius` (16px)
- **Shadows:** Soft drop shadows (`--hp-shadow`)
- **Motion:** Standardized durations (180ms, 360ms, 560ms) and easing curves.

## Components Implemented

Located in `/app/components/onboarding/`:

1.  **`CardFullScreen`**: The main container for all steps. Handles entrance/exit animations (scale, fade, slide).
2.  **`StepProgress`**: A segmented progress bar that animates fill width based on the current step.
3.  **`Button`**: `PrimaryButton` and `SecondaryButton` with press animations (scale 0.96) and variants.
4.  **`Chip`**: Selectable options used for multiple-choice questions.
5.  **`Inputs`**:
    - `TextInput`: Standard styled input with validation states.
    - `TextArea`: For longer text (project details).
    - `FileUploadCard`: Drag-and-drop interface for trade licenses.
6.  **`SummaryCard`**: Displays collected data before final submission.
7.  **`ShareLinkCard`**: UI for sharing the platform URL.

## State Machine & Flows

The logic is driven by a configuration object in `/app/lib/onboarding-state.ts`. This acts as a state machine defining:
- **Steps**: Each screen is a unique step ID.
- **Types**: `hero`, `form`, `question`, `upload`, etc.
- **Transitions**: `nextStep` or dynamic branching based on user choice.

### Implemented Flows:
1.  **Landing (Step 0)**: Hero card asking "How do you identify?".
2.  **Persona Selection**: Intermediary step to confirm user type.
3.  **Crew Flow**: Name -> Role -> Country -> Link -> Summary -> Success.
4.  **Supplier Flow**: Company -> Service -> Link -> Trade License -> Contact -> Summary -> Success.
5.  **Client/Project Flow**: Project Details -> Contact Info -> Summary -> Success.
6.  **Existing Member**: Options to sign in or check activation status.
7.  **Exploring**: Informational steps explaining the platform value.

## Backend Integration

### API Routes
- **`POST /app/api/hpd/submit`**:
    - Receives payload: `{ user_type, submitted_fields, session_id, ... }`.
    - Saves data to Supabase table `onboarding_submissions`.
    - Returns `200 OK` or error codes.
- **`POST /app/api/hpd/check-email`**:
    - Checks if an email exists in the system (mocked logic connected to `profiles` table).

### Database
- **Migration File**: `/app/database_migration_onboarding.sql`
- **Table**: `onboarding_submissions` (Stores JSONB data for flexibility).

## Deliverables
- **Live Route**: `/onboarding`
- **State JSON**: Exported as `/app/onboarding-state.json`
- **Components**: Fully modular and reusable.

## Next Steps
- Connect the `check-email` endpoint to the actual Auth/User service if different from `profiles`.
- Implement actual email triggering (currently mocked in logs).
- Finalize the "Summary" view to perfectly map dynamic form data keys to readable labels.
