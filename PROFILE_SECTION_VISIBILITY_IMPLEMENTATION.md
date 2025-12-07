# Profile Section Visibility Feature Implementation

## Overview
Implemented a comprehensive privacy control system for profile sections, allowing users to control which sections are visible to the public while keeping them editable.

## Features Implemented

### 1. **New Display Sections**
Added three new visible sections to user profiles:
- **Languages Section**: Displays languages with proficiency levels
- **Contact Details Section**: Shows email and phone number
- **Available to Travel Section**: Lists countries user is willing to travel to

### 2. **Privacy Controls (Eye Icon Toggle)**
- Added eye icon (👁️/🚫) to ALL profile sections:
  - About
  - Skills
  - Credits
  - Languages
  - Contact Details
  - Available to Travel
- **Eye Open** (👁️) = Section visible to everyone
- **Eye Closed** (🚫) = Section hidden from public (only owner sees it's hidden)
- Default visibility: **Public (visible)**

### 3. **Visibility Behavior**
- Hidden sections **do not appear at all** for visitors
- Profile owners always see all their sections with visibility status
- Toggle is instant with optimistic UI updates

## Files Created

### API Routes
- `/app/app/api/profile/section-visibility/route.ts` - API for managing section visibility

### Database Migration
- `/app/migrations/add_profile_section_visibility.sql` - Creates `profile_section_visibility` table

### React Hooks
- `/app/hooks/useSectionVisibility.ts` - Custom hook for managing section visibility

### Own Profile Components (with Eye Icons)
- `/app/app/(app)/profile/components/LanguagesSection.tsx`
- `/app/app/(app)/profile/components/ContactDetailsSection.tsx`
- `/app/app/(app)/profile/components/AvailableToTravelSection.tsx`

### Read-Only Profile Components (for visitors)
- `/app/app/(app)/profile/[userId]/components/ReadOnlyLanguagesSection.tsx`
- `/app/app/(app)/profile/[userId]/components/ReadOnlyContactDetailsSection.tsx`
- `/app/app/(app)/profile/[userId]/components/ReadOnlyAvailableToTravelSection.tsx`

## Files Modified

### Profile Pages
- `/app/app/(app)/profile/page.tsx` - Own profile page with all sections and visibility controls
- `/app/app/(app)/profile/[userId]/page.tsx` - Readonly profile page with conditional section rendering

## Database Schema

### Table: `profile_section_visibility`
```sql
CREATE TABLE profile_section_visibility (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL CHECK (section_name IN (
    'about', 
    'skills', 
    'credits', 
    'languages', 
    'contact_details', 
    'available_to_travel'
  )),
  is_visible BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, section_name)
);
```

## Setup Instructions

### 1. **Run Database Migration**

You need to run the SQL migration in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `/app/migrations/add_profile_section_visibility.sql`
4. Execute the SQL

Alternatively, if you have Supabase CLI installed:
```bash
supabase db push --file /app/migrations/add_profile_section_visibility.sql
```

### 2. **Verify Installation**

The development server should already be running. If not:
```bash
cd /app
npm install  # Dependencies already installed
npm run dev  # Server should be running on port 3000
```

### 3. **Test the Feature**

**As Profile Owner:**
1. Navigate to your profile page (`/profile`)
2. You'll see all sections (About, Skills, Credits, Languages, Contact Details, Available to Travel)
3. Each section has an eye icon in the top-right corner
4. Click the eye icon to toggle visibility
5. Eye Open (👁️ blue) = Public | Eye Closed (🚫 gray) = Hidden

**As Visitor:**
1. Navigate to another user's profile (`/explore/[userId]` or `/profile/[userId]`)
2. Only visible sections will appear
3. Hidden sections won't show at all
4. No eye icons are visible (those are only for the profile owner)

## API Endpoints

### GET `/api/profile/section-visibility`
Get visibility settings for authenticated user or specific user

**Query Parameters:**
- `userId` (optional): Get visibility for another user

**Response:**
```json
{
  "success": true,
  "data": {
    "about": true,
    "skills": true,
    "credits": false,
    "languages": true,
    "contact_details": false,
    "available_to_travel": true
  }
}
```

### PATCH `/api/profile/section-visibility`
Update visibility for a specific section (authenticated users only)

**Request Body:**
```json
{
  "section_name": "contact_details",
  "is_visible": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "user_id": "...",
    "section_name": "contact_details",
    "is_visible": false,
    "updated_at": "2025-01-XX..."
  }
}
```

## Technical Details

### Hook: `useSectionVisibility`
- Fetches visibility settings on mount
- Provides `toggleVisibility` function for updates
- Implements optimistic UI updates
- Handles errors gracefully with toast notifications

### Section Reordering
- All 6 sections can be reordered using the "Reorder sections" button
- Drag and drop functionality works with the new sections

### Data Sources
The new sections pull data from existing APIs:
- **Languages**: `/api/profile/languages` (from `user_languages` table)
- **Contact Details**: User profile data (`email`, `phone`, `country_code`)
- **Available to Travel**: `/api/profile/travel-countries` (from `user_travel_countries` table)

## Benefits

1. **Privacy Control**: Users can selectively share information
2. **Professional Profiles**: Hide personal contact until ready to share
3. **Flexibility**: Toggle visibility anytime without deleting data
4. **User Experience**: Clean interface with intuitive eye icons
5. **Data Integrity**: Hidden data is preserved, just not displayed

## Future Enhancements (Optional)

- Bulk visibility toggle (show/hide all)
- Visibility presets (e.g., "Public Profile", "Private Profile")
- Analytics on which sections are most viewed
- Section-level access control (e.g., "Visible to connections only")

## Troubleshooting

### Eye icons not appearing
- Check if `useSectionVisibility` hook is imported
- Verify database migration ran successfully
- Check browser console for errors

### Sections not hiding for visitors
- Verify visibility API is returning correct data
- Check if `visibility` object is being used in conditional rendering
- Inspect network requests for `/api/profile/section-visibility`

### Database errors
- Ensure migration was run in Supabase
- Check Row Level Security (RLS) policies are enabled
- Verify user authentication is working

## Notes

- Default visibility for all sections is **true** (public)
- If no visibility record exists, sections default to visible
- Database uses upsert to handle create/update in single operation
- RLS policies ensure users can only modify their own visibility settings
- Public read access is enabled so visitors can check what to display

---

**Implementation Date**: January 2025
**Next.js Version**: 15.5.4
**Database**: Supabase (PostgreSQL)
