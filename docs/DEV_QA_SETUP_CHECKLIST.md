# Dev/QA Environment Setup - Step-by-Step Checklist

**Date:** December 18, 2025
**Status:** Phase 1 Complete ✅ (dev branch created)

---

## ✅ Phase 1: Git Branch Strategy (COMPLETED)

- [x] Created `dev` branch from `main`
- [x] Pushed `dev` branch to GitHub
- [x] Verified branch exists on GitHub

---

## 📋 Phase 2: Netlify Dev Site Setup

### Step 1: Create New Netlify Site

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → Select repository: `pilates-class-generator`
4. Configure build settings:

**Site Configuration:**
```
Site name: bassline-dev
Branch to deploy: dev
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

5. Click **"Show advanced"** → **"New variable"**
6. Add these environment variables (we'll update SUPABASE values after Phase 4):

**Environment Variables for Dev Site:**
```
VITE_API_URL=https://pilates-dev.onrender.com
VITE_ORCHESTRATOR_URL=https://orchestrator-dev.onrender.com
VITE_USE_ORCHESTRATOR=false
VITE_SUPABASE_URL=[PLACEHOLDER - will get from Supabase dev project]
VITE_SUPABASE_ANON_KEY=[PLACEHOLDER - will get from Supabase dev project]
```

7. Click **"Deploy site"**
8. Wait for initial deploy to complete (~2-3 minutes)

### Step 2: Verify Dev Site URL

- [ ] Dev site URL: `https://bassline-dev.netlify.app`
- [ ] Can access login page (may show errors until backend is set up)
- [ ] Build succeeded in Netlify deploy logs

**Note:** You can customize the site name in Site settings → General → Site details → Change site name

---

## 📋 Phase 3: Render Dev Services Setup

### Step 3A: Create Backend Dev Service

1. Go to https://dashboard.render.com
2. Click **"New"** → **"Web Service"**
3. Connect to GitHub repo: `pilates-class-generator`
4. Configure service:

**Backend Service Configuration:**
```
Name: pilates-dev
Branch: dev
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements-production.txt
Start Command: uvicorn api.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free (512 MB RAM)
```

5. Click **"Advanced"** → Add environment variables:

**Backend Environment Variables:**
```
SUPABASE_URL=[PLACEHOLDER - will get from Supabase dev project]
SUPABASE_SERVICE_ROLE_KEY=[PLACEHOLDER - will get from Supabase dev project]
OPENAI_API_KEY=[COPY FROM PRODUCTION BACKEND SERVICE]
ENVIRONMENT=development
ALLOWED_ORIGINS=https://bassline-dev.netlify.app,http://localhost:5173
JWT_SECRET_KEY=[COPY FROM PRODUCTION BACKEND SERVICE]
REDIS_URL=[COPY FROM PRODUCTION BACKEND SERVICE - if using Redis]
```

6. Click **"Create Web Service"**
7. Wait for initial deploy (~5-10 minutes for first build)

### Step 3B: Create Orchestrator Dev Service (Optional)

1. Click **"New"** → **"Web Service"**
2. Connect to same GitHub repo
3. Configure service:

**Orchestrator Service Configuration:**
```
Name: orchestrator-dev
Branch: dev
Root Directory: orchestrator
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Instance Type: Free (512 MB RAM)
```

4. Add environment variables:

**Orchestrator Environment Variables:**
```
BACKEND_URL=https://pilates-dev.onrender.com
OPENAI_API_KEY=[COPY FROM PRODUCTION]
ENVIRONMENT=development
```

5. Click **"Create Web Service"**

### Step 4: Verify Backend Services

- [ ] Backend URL: `https://pilates-dev.onrender.com`
- [ ] Test health endpoint: `curl https://pilates-dev.onrender.com/health`
- [ ] Should return: `{"status": "healthy"}`
- [ ] Orchestrator URL: `https://orchestrator-dev.onrender.com` (if created)

---

## 📋 Phase 4: Supabase Dev Project Setup

### Step 5: Create Supabase Dev Project

1. Go to https://app.supabase.com
2. Click **"New project"**
3. Configure:

**Project Configuration:**
```
Organization: [Your organization]
Name: Bassline Pilates Dev
Database Password: [GENERATE STRONG PASSWORD - SAVE IN PASSWORD MANAGER]
Region: [Same as production - US West for consistency]
Pricing plan: Free
```

4. Click **"Create new project"**
5. Wait for project creation (~2 minutes)

### Step 6: Get Supabase Dev Project Credentials

Once project is created:

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them for Netlify + Render):

**Save These Values:**
```
Project URL: https://[project-id].supabase.co
Anon/Public Key: eyJ... (starts with eyJ)
Service Role Key: eyJ... (starts with eyJ - KEEP SECRET)
```

### Step 7: Copy Database Schema from Production

**Option A: Export/Import SQL (Recommended)**

1. Go to **Production Supabase Project** → SQL Editor
2. Run this query to export schema:

```sql
-- Generate CREATE TABLE statements for all tables
SELECT 'CREATE TABLE ' || schemaname || '.' || tablename || ' (...);'
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

3. Copy all CREATE TABLE statements from production
4. Go to **Dev Supabase Project** → SQL Editor
5. Paste and execute all CREATE TABLE statements
6. Copy RLS policies, functions, triggers from production
7. Execute in dev project

**Option B: Use Supabase CLI (Advanced)**

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to production project
supabase link --project-ref [production-project-id]

# Dump production schema
supabase db dump --file production_schema.sql --data-only=false

# Link to dev project
supabase link --project-ref [dev-project-id]

# Apply schema to dev
psql "postgresql://postgres:[password]@db.[dev-project-id].supabase.co:5432/postgres" < production_schema.sql
```

### Step 8: Seed Dev Database with Test Data

1. Go to Dev Supabase Project → SQL Editor
2. Run these queries:

```sql
-- Create test admin user
INSERT INTO user_profiles (id, email, full_name, is_admin, created_at)
VALUES
  (gen_random_uuid(), 'admin@bassline.dev', 'Dev Admin', true, now());

-- Verify movements table has all 34 movements
SELECT COUNT(*) FROM movements; -- Should return 34

-- Verify music tracks
SELECT COUNT(*) FROM music_tracks; -- Should return 14

-- Verify class sections exist
SELECT COUNT(*) FROM preparation_scripts;
SELECT COUNT(*) FROM warmup_routines;
SELECT COUNT(*) FROM cooldown_sequences;
SELECT COUNT(*) FROM closing_meditation_scripts;
SELECT COUNT(*) FROM closing_homecare_advice;

-- DO NOT copy real user data or class plans (PII protection)
```

### Step 9: Configure RLS Policies

RLS policies should already be in the schema dump. Verify:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Should show all tables with RLS enabled
```

---

## 📋 Phase 5: Update Environment Variables

### Step 10: Update Netlify Dev Site with Supabase Credentials

1. Go to Netlify → **bassline-dev** site → **Site configuration** → **Environment variables**
2. Update these variables with values from Step 6:

```
VITE_SUPABASE_URL=https://[dev-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key-from-step-6]
```

3. Click **"Save"**
4. Go to **Deploys** → Click **"Trigger deploy"** → **"Clear cache and deploy site"**
5. Wait for redeploy (~2 minutes)

### Step 11: Update Render Backend with Supabase Credentials

1. Go to Render → **pilates-dev** service → **Environment**
2. Update these variables:

```
SUPABASE_URL=https://[dev-project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-from-step-6]
```

3. Save changes
4. Service will auto-redeploy (~5 minutes)

---

## 📋 Phase 6: End-to-End Testing

### Step 12: Test Dev Environment

1. **Visit Dev Frontend:**
   - URL: https://bassline-dev.netlify.app
   - Should load without errors

2. **Register Test Account:**
   - Email: `test@bassline.dev`
   - Password: `DevTest123!`
   - Should successfully create account

3. **Generate Test Class:**
   - Difficulty: Beginner
   - Duration: 15 minutes
   - Focus: Core
   - AI Mode: OFF (for speed)
   - Should generate successfully

4. **Verify in Dev Database:**
   - Go to Supabase dev project → Table Editor
   - Check `class_plans` table has new entry
   - Check `user_profiles` has test account

5. **Play Test Class:**
   - Music should play
   - Voiceovers should work
   - Timer should count down
   - All 6 sections should display

### Step 13: Test Dev → QA Merge Workflow

1. **Make trivial change on dev branch:**

```bash
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2
git checkout dev

# Add test comment to verify workflow
echo "// Dev environment test - $(date)" >> frontend/src/App.tsx

git add frontend/src/App.tsx
git commit -m "test: Verify dev→QA workflow"
git push origin dev
```

2. **Wait for Netlify dev deploy** (~2 minutes)
3. **Verify change in dev site** (view page source, look for comment)
4. **Merge to main (QA):**

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

5. **Wait for Netlify production deploy** (~2 minutes)
6. **Verify change appears in QA** (production site)
7. **Clean up test comment:**

```bash
git checkout dev
git revert HEAD
git push origin dev

git checkout main
git merge dev
git push origin main
```

---

## 📋 Phase 7: Documentation

### Step 14: Update README.md with Workflow

1. Add this section to README.md:

```markdown
## Development Workflow

### Environments

- **Dev Environment** (unstable, testing fixes)
  - Frontend: https://bassline-dev.netlify.app
  - Backend: https://pilates-dev.onrender.com
  - Database: Supabase dev project
  - Branch: `dev`

- **QA Environment** (stable, beta testers)
  - Frontend: https://basslinemvp.netlify.app
  - Backend: https://pilates-class-generator-api3.onrender.com
  - Database: Supabase production project
  - Branch: `main`

### Daily Workflow

1. **Start work on dev branch:**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Make changes, commit, push:**
   ```bash
   git add .
   git commit -m "fix: description"
   git push origin dev
   ```
   → Auto-deploys to dev environment

3. **Test in dev:**
   - Visit https://bassline-dev.netlify.app
   - Verify fix works
   - Check Render logs if needed

4. **When confident, merge to main:**
   ```bash
   git checkout main
   git pull origin main
   git merge dev
   git push origin main
   ```
   → Auto-deploys to QA for beta testers

5. **Beta testers use QA:**
   - They always use https://basslinemvp.netlify.app
   - Never see broken code from dev experiments
```

2. Commit and push to both branches:

```bash
git checkout dev
git add README.md
git commit -m "docs: Add dev/QA workflow to README"
git push origin dev

git checkout main
git merge dev
git push origin main
```

---

## ✅ Success Criteria

After completing all steps, verify:

- [ ] `dev` branch exists on GitHub
- [ ] Netlify dev site deploys from `dev` branch
- [ ] Render dev services deploy from `dev` branch
- [ ] Supabase dev project has schema + test data
- [ ] Can register/login on dev site
- [ ] Can generate class on dev site
- [ ] Dev → QA merge workflow works
- [ ] Beta testers use QA (main branch)
- [ ] You use dev for testing
- [ ] README.md documents workflow

---

## 🎉 You're Done!

Your dev/QA environment pipeline is now set up!

**From now on:**
- Work on `dev` branch → test in dev environment
- Merge to `main` only when confident → beta testers safe
- Never push broken code to QA

**Total Cost:** $0/month (all free tiers)

**Time Saved:** No more beta tester bug reports during development!

---

## 🚨 Important Reminders

1. **Always work on dev first:**
   - `git checkout dev` before making changes
   - Test thoroughly in dev environment
   - Only merge to main when verified working

2. **Never merge main → dev:**
   - Only merge `dev` → `main`
   - Keep dev as the development branch
   - Keep main as the stable branch

3. **Separate databases:**
   - Dev can have test data
   - Production has real user data
   - Never copy production PII to dev

4. **Environment variables:**
   - Dev points to dev Supabase
   - QA points to production Supabase
   - Double-check before deploying

5. **Breaking dev is OK:**
   - Dev is supposed to break sometimes
   - That's why beta testers don't use it
   - Fix it and move on

---

## 📞 Need Help?

If you encounter issues:

1. Check Netlify deploy logs
2. Check Render service logs
3. Verify environment variables
4. Test database connection
5. Ask Claude for help with specific errors

Good luck! 🚀
