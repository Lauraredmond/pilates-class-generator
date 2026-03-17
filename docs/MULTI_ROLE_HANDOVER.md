# Multi-Role Registration System - Handover Document

## Current Status (March 13, 2026)

### ✅ What's Been Completed

#### Frontend Implementation
1. **Registration Page** (`frontend/src/pages/Register.tsx`)
   - ✅ Multi-role checkboxes allowing users to select multiple roles
   - ✅ Proper help text: "Select all roles that apply to you"
   - ✅ Sends `roles` array to backend
   - ✅ No misleading text about creating multiple accounts

2. **Profile Page** (`frontend/src/pages/Profile.tsx`)
   - ✅ Role management UI showing current roles
   - ✅ "Add Role" functionality (currently changes primary role)
   - ✅ Visual display of role capabilities

3. **TypeScript Types** (`frontend/src/types/auth.types.ts`)
   - ✅ Updated User interface with optional `profiles` array
   - ✅ Helper functions for role checking (backward compatible)
   - ✅ Support for both multi-profile and legacy single-profile users

4. **Playwright Tests** (`frontend/e2e/multi-role-registration.spec.ts`)
   - ✅ Comprehensive test for multi-role registration
   - ✅ Handles medical disclaimers and permission screens
   - ✅ Tests role selection and verification

#### Backend Implementation
1. **API Endpoints** (`backend/api/auth.py`)
   - ✅ Registration accepts `roles` array
   - ✅ Currently creates single profile with first selected role
   - ✅ `/api/auth/add-role` endpoint (changes primary role for now)
   - ✅ Backward compatible with legacy single role

2. **Documentation**
   - ✅ Updated OpenAPI specification (`backend/openapi/bassline_api_v1.yaml`)
   - ✅ Updated Arazzo workflows to handle profiles array

### ⚠️ Current Limitations

#### Database Schema Issues
The full multi-role implementation requires database schema changes:

1. **Missing `user_id` column**: The `user_profiles` table needs a `user_id` column to link multiple profiles to one auth.users account
2. **Single profile per user**: Currently can only store one profile per user
3. **Parent-child linking**: Need `parent_user_id` for Youth Hub parent-child relationships

### 🚨 Immediate Issues to Fix

1. **Deployment Status**
   - Frontend builds successfully locally but check Netlify deployment
   - Backend changes need to be deployed to Render
   - Database still expects old schema

2. **Test Credentials Needed**
   - Playwright tests need real test account credentials
   - Update `EXISTING_USER` in test file with valid credentials

### 📝 Required Database Migrations

```sql
-- 1. Add user_id column for multi-profile support
ALTER TABLE user_profiles
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update existing records to set user_id = id
UPDATE user_profiles SET user_id = id WHERE user_id IS NULL;

-- Add index for efficient queries
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- 2. Add parent_user_id for Youth Hub parent-child relationships
ALTER TABLE user_profiles
ADD COLUMN parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_user_profiles_parent_user_id ON user_profiles(parent_user_id);

-- 3. Allow multiple profiles per user (remove unique constraint if exists)
-- Check current constraints first:
-- SELECT * FROM information_schema.table_constraints
-- WHERE table_name = 'user_profiles';
```

### 🔄 How Multi-Role Should Work (When Database is Updated)

1. **Registration Flow**:
   - User selects multiple roles (checkboxes)
   - Backend creates one auth.users account
   - Backend creates multiple user_profiles records (one per role)
   - All profiles share same `user_id` and `email`

2. **Profile Management**:
   - User can view all their roles in Profile page
   - "Add Role" creates new profile record
   - All capabilities are active (no role switching needed)

3. **Access Control**:
   - Helper functions check across all profiles
   - If user has ANY profile with coach role, they can access coach features
   - Capabilities are cumulative

### 📋 Testing Instructions

1. **Setup Test Credentials** (First Time Only):
```bash
cd frontend
# Copy the example file
cp .env.test.example .env.test

# Edit .env.test and add your real credentials
# PLAYWRIGHT_TEST_USER_EMAIL=your-actual-test@example.com
# PLAYWRIGHT_TEST_USER_PASSWORD=YourActualPassword123!
```

**Note**: `.env.test` is gitignored and will never be committed to the repository.

2. **Local Backend Testing**:
```bash
cd backend
uvicorn api.main:app --reload --port 8000
```

3. **Local Frontend Testing**:
```bash
cd frontend
npm run dev
```

4. **Run Playwright Tests**:
```bash
cd frontend
# Test local environment
npx playwright test e2e/multi-role-registration.spec.ts --project=local-chromium --headed

# Test dev environment
TEST_ENV=dev npx playwright test e2e/multi-role-registration.spec.ts --project=dev-chromium

# Test production environment
TEST_ENV=production npx playwright test e2e/multi-role-registration.spec.ts --project=prod-chromium
```

### 🚀 Deployment Steps

1. **Database Migration** (Do this FIRST):
   - Run the SQL migrations above in Supabase
   - Verify schema changes

2. **Backend Deployment**:
   - Deploy to Render
   - Verify `/api/auth/register` accepts roles array
   - Test multi-role registration

3. **Frontend Deployment**:
   - Push to GitHub (triggers Netlify)
   - Verify build succeeds
   - Test registration page shows checkboxes

### 📌 Key Files Modified

- `frontend/src/pages/Register.tsx` - Multi-role checkbox UI
- `frontend/src/pages/Profile.tsx` - Role management UI
- `frontend/src/types/auth.types.ts` - User and UserProfile interfaces
- `frontend/src/context/AuthContext.tsx` - Registration with roles array
- `backend/api/auth.py` - Multi-role registration logic
- `backend/models/user.py` - Added roles field
- `backend/openapi/bassline_api_v1.yaml` - API documentation

### ⚡ Quick Fixes if Things Break

1. **If registration fails with "user_id column not found"**:
   - The database migration hasn't been run
   - Backend is trying to use new schema with old database

2. **If you see old dropdown instead of checkboxes**:
   - Clear browser cache
   - Check if latest frontend is deployed

3. **If TypeScript build fails**:
   - Run `npm run type-check` to see all errors
   - Most likely User type mismatches

### 🎯 Next Steps

1. Run database migrations
2. Deploy backend to Render
3. Deploy frontend to Netlify
4. Test full flow with real user
5. Update Playwright tests with valid credentials

### 💡 Important Notes

- The frontend is ready for multi-role
- Backend is temporarily limited to single profile until database migration
- All code maintains backward compatibility
- Parent-child linking is separate from multi-role feature

---
Generated: March 13, 2026
By: Claude + Laura