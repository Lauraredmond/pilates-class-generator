# Session 8: Settings & Preferences - Deployment Guide

**Date:** November 25, 2025
**Status:** Ready for deployment
**Session:** 8 - Settings & Preferences

---

## 📋 Overview

Session 8 adds comprehensive user preferences management to the Settings page, including:
- ✅ Notification preferences (email, class reminders, weekly summary)
- ✅ Privacy settings (analytics, data sharing)
- ✅ AI class generation settings (strictness level, default duration, web research)
- ✅ Music preferences (placeholder for Session 10 - Musopen/FreePD integration)

---

## 🔧 Changes Made

### Backend Changes (`backend/api/auth.py`)
1. **New Pydantic Models:**
   - `PreferencesUpdateRequest` - Request model for updating preferences
   - `PreferencesResponse` - Response model for preference data

2. **New API Endpoints:**
   - `GET /api/auth/preferences` - Fetch user preferences
   - `PUT /api/auth/preferences` - Update user preferences

3. **Updated Registration:**
   - Creates default preferences with new notification/privacy fields

### Frontend Changes (`frontend/src/pages/Settings.tsx`)
1. **New Preferences Sections:**
   - Notification Preferences (3 toggles)
   - Privacy Settings (2 toggles)
   - AI Class Generation (3 settings)
   - Music Preferences (placeholder for Session 10)

2. **State Management:**
   - Fetches preferences on component mount
   - Real-time updates with immediate persistence
   - Success/error messaging

### Database Changes
1. **New Columns in `user_preferences` table:**
   - `email_notifications` (BOOLEAN, default: true)
   - `class_reminders` (BOOLEAN, default: true)
   - `weekly_summary` (BOOLEAN, default: false)
   - `analytics_enabled` (BOOLEAN, default: true)
   - `data_sharing_enabled` (BOOLEAN, default: false)

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration ⚠️ **REQUIRED**

The new backend code expects these columns to exist in the `user_preferences` table. You **must** run the migration before deploying the backend.

#### Using Supabase Dashboard (Recommended):
1. Log in to https://supabase.com/dashboard
2. Select your Bassline project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `database/migrations/add_preference_fields.sql` and paste into the editor
6. Click **Run** to execute the migration
7. **Verify:** Go to **Table Editor** → `user_preferences` table → Check that the new columns appear

#### Verification Query:
```sql
-- Run this in SQL Editor to verify columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences'
AND column_name IN ('email_notifications', 'class_reminders', 'weekly_summary', 'analytics_enabled', 'data_sharing_enabled');

-- Should return 5 rows
```

---

### Step 2: Deploy Backend

#### Option A: Render.com (Current Production)
1. Commit and push changes to GitHub (instructions below)
2. Render will auto-deploy from the `main` branch
3. Monitor deployment at https://dashboard.render.com
4. Wait for deployment to complete (~2-3 minutes)
5. **Verify:** Check https://pilates-class-generator-api3.onrender.com/health

#### Option B: Manual Deploy
```bash
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2

# Commit changes (see Step 4 below)

# Push to trigger Render deployment
git push origin main
```

---

### Step 3: Deploy Frontend

#### Option A: Netlify (Current Production)
1. Commit and push changes to GitHub (instructions below)
2. Netlify will auto-deploy from the `main` branch
3. Monitor deployment at https://app.netlify.com
4. Wait for deployment to complete (~1-2 minutes)
5. **Verify:** Check https://basslinemvp.netlify.app

#### Option B: Manual Deploy
```bash
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2/frontend

# Build for production
npm run build

# Deploy to Netlify (if Netlify CLI installed)
netlify deploy --prod --dir=dist
```

---

### Step 4: Commit Changes to Git

```bash
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2

# Stage all changes
git add -A

# Create commit
git commit -m "$(cat <<'EOF'
feat: Session 8 - Complete Settings & Preferences UI

**Summary:**
Completed Session 8 by adding comprehensive user preferences management
to the Settings page. Users can now customize notifications, privacy,
AI generation settings, and music preferences (placeholder).

**Backend Changes:**
- Added GET /api/auth/preferences endpoint
- Added PUT /api/auth/preferences endpoint
- Created PreferencesUpdateRequest and PreferencesResponse models
- Updated registration to create default notification/privacy preferences

**Frontend Changes:**
- Added 4 preference sections to Settings.tsx:
  - Notification Preferences (email, class reminders, weekly summary)
  - Privacy Settings (analytics, data sharing)
  - AI Class Generation (strictness, duration, web research)
  - Music Preferences (placeholder for Session 10)
- Implemented real-time preference updates with success messaging
- Added loading states and error handling

**Database Changes:**
- Created migration: database/migrations/add_preference_fields.sql
- Adds 5 new columns to user_preferences table:
  - email_notifications, class_reminders, weekly_summary
  - analytics_enabled, data_sharing_enabled

**Files Modified:**
Backend:
- backend/api/auth.py (added preferences endpoints)

Frontend:
- frontend/src/pages/Settings.tsx (added preferences UI)

Database:
- database/migrations/add_preference_fields.sql (new)
- database/migrations/README.md (new)

Documentation:
- docs/SESSION_8_DEPLOYMENT.md (deployment guide)

**Testing:**
- ✅ TypeScript compilation passes (npx tsc --noEmit)
- ✅ Frontend build succeeds (npm run build)
- ⏳ Database migration ready to apply
- ⏳ End-to-end testing pending deployment

**Session Status:**
✅ Session 8 COMPLETE - Ready for deployment

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to GitHub (triggers auto-deploy)
git push origin main
```

---

## ✅ Post-Deployment Verification

### 1. Verify Backend API Endpoints
```bash
# Get your access token by logging in to https://basslinemvp.netlify.app
# Then test the endpoints:

# Get preferences
curl -X GET "https://pilates-class-generator-api3.onrender.com/api/auth/preferences" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Update preferences
curl -X PUT "https://pilates-class-generator-api3.onrender.com/api/auth/preferences" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"email_notifications": false}'
```

### 2. Test Frontend UI
1. Navigate to https://basslinemvp.netlify.app
2. Log in with your account
3. Go to **Settings** page
4. Verify all 4 preference sections appear:
   - Notification Preferences
   - Privacy Settings
   - AI Class Generation
   - Music Preferences
5. Toggle a preference (e.g., email notifications)
6. Verify "Preference updated successfully" message appears
7. Refresh the page
8. Verify the toggle persisted correctly

### 3. Check Database
```sql
-- Run in Supabase SQL Editor
SELECT user_id, email_notifications, class_reminders, weekly_summary, analytics_enabled, data_sharing_enabled
FROM user_preferences
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue: "Failed to load preferences" error
**Cause:** Database migration not applied
**Fix:** Run `database/migrations/add_preference_fields.sql` in Supabase Dashboard

### Issue: Backend 500 error on /api/auth/preferences
**Cause:** Database columns missing
**Fix:** Verify migration was applied successfully (see Step 1)

### Issue: Preferences don't persist after page refresh
**Cause:** PUT endpoint not updating database
**Fix:** Check backend logs in Render.com dashboard for errors

### Issue: "User preferences not found" error
**Cause:** User registered before preferences were created
**Fix:** Preferences are created automatically on login if missing

---

## 📊 Session 8 Complete Status

### Completed Tasks:
- ✅ Backend GET preferences endpoint
- ✅ Backend PUT preferences endpoint
- ✅ Notification preferences UI (3 toggles)
- ✅ Privacy settings UI (2 toggles)
- ✅ AI strictness preferences UI (3 settings)
- ✅ Music style preferences UI (placeholder)
- ✅ Database migration created
- ✅ TypeScript compilation passes
- ✅ Frontend build succeeds
- ✅ Deployment documentation complete

### Ready for:
- 🚀 Production deployment
- 🧪 End-to-end user testing
- 📝 Session 9 planning

---

## 🎯 Next Session Preview

**Session 9: Dashboard & Progress Tracking**
- User activity timeline
- Class history and analytics
- Progress metrics (classes completed, total time, favorite movements)
- Weekly/monthly summaries
- Goal tracking

---

*Last Updated: November 25, 2025*
