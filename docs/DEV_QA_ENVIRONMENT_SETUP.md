# Dev/QA Environment Setup Plan

**Created:** December 18, 2025
**Goal:** Create separate Dev and QA environments to protect beta testers from broken code
**Estimated Time:** 2-3 hours
**Cost:** $0/month (using free tiers)

---

## 🎯 Problem Statement

**Current State:**
- Single production environment (`main` branch)
- Beta testers see broken code when bugs are pushed
- No safe testing environment for fixes

**User Need:**
> "I need a safe environment which my beta testers can use while I apply fixes"

---

## ✅ Recommended Solution: 2-Environment Setup

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT FLOW                          │
└─────────────────────────────────────────────────────────────┘

    LOCAL DEV (your machine)
         ↓
    git push origin dev
         ↓
    ┌────────────────────────────────────┐
    │    DEV ENVIRONMENT (unstable)      │
    │  - dev branch auto-deploys         │
    │  - bassline-dev.netlify.app        │
    │  - pilates-dev.onrender.com        │
    │  - Supabase dev project            │
    │  - For testing fixes safely        │
    └────────────────────────────────────┘
         ↓
    Test fixes, verify working
         ↓
    git checkout main && git merge dev
         ↓
    git push origin main
         ↓
    ┌────────────────────────────────────┐
    │  QA ENVIRONMENT (stable/beta)      │
    │  - main branch auto-deploys        │
    │  - basslinemvp.netlify.app         │
    │  - pilates-api3.onrender.com       │
    │  - Supabase production project     │
    │  - Beta testers use this           │
    └────────────────────────────────────┘
```

---

## 📊 Decision Points (User Input Required)

Before we proceed, please decide on these options:

### Decision 1: Separate Database or Shared?

**Option A: Separate Supabase Dev Project** (Recommended)
- ✅ Complete isolation - can't accidentally break production data
- ✅ Test migrations safely before applying to QA
- ✅ Seed with test data without affecting real users
- ❌ Need to manage two databases
- ❌ Data not in sync (but that's usually a good thing for testing)
- **Cost:** $0/month (free tier)

**Option B: Shared Supabase Project**
- ✅ Simpler - only one database
- ✅ Always in sync
- ❌ Risk of breaking production data
- ❌ Can't test migrations safely
- ❌ Can't seed test data without affecting real users
- **Cost:** $0/month (already have it)

**Recommendation:** Option A (Separate Dev Project)

**Your Choice:** [ ] Option A [ ] Option B

---

### Decision 2: Stable URLs vs Temporary?

**Option A: Stable Dev URLs** (Recommended)
- ✅ Easy to remember and bookmark
- ✅ Can share with collaborators
- ✅ Professional appearance
- **URLs:**
  - Frontend: `bassline-dev.netlify.app`
  - Backend: `pilates-dev.onrender.com`

**Option B: Let Netlify/Render Auto-Generate URLs**
- ❌ Ugly URLs like `bassline-abc123.netlify.app`
- ❌ Harder to remember
- ✅ Slightly faster setup (no naming)

**Recommendation:** Option A (Stable URLs)

**Your Choice:** [ ] Option A [ ] Option B

---

### Decision 3: Time Investment Now vs Later?

**Option A: Full Setup Now (2-3 hours)** (Recommended)
- ✅ Complete peace of mind immediately
- ✅ Beta testers protected starting today
- ✅ Can test fixes safely from now on
- ❌ 2-3 hours upfront time investment

**Option B: Minimal Setup Now (30 minutes)**
- ✅ Quick start
- ✅ Just create dev branch + Netlify site
- ❌ Still shares database and backend
- ❌ Partial isolation only
- ❌ Need to finish setup later anyway

**Recommendation:** Option A (Full Setup Now)

**Your Choice:** [ ] Option A [ ] Option B

---

## 🛠️ Implementation Steps

### Phase 1: Git Branch Strategy (10 minutes)

**1.1 Create and Push Dev Branch**

```bash
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2

# Create dev branch from current main
git checkout main
git pull origin main
git checkout -b dev

# Push to GitHub
git push -u origin dev

# Verify branch exists
git branch -a
```

**1.2 Set Branch Protection Rules (Optional but Recommended)**

On GitHub:
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass (later when we add CI/CD)
3. Add rule for `dev` branch:
   - No protection needed (your playground)

---

### Phase 2: Frontend Dev Environment (Netlify) (15 minutes)

**2.1 Create New Netlify Site**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub → Select your MVP2 repository
4. Configure build settings:
   - **Site name:** `bassline-dev` (or custom name you want)
   - **Branch to deploy:** `dev`
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
   - **Environment variables:** (copy from production site)
     ```
     VITE_BACKEND_URL=https://pilates-dev.onrender.com
     VITE_ORCHESTRATOR_URL=https://orchestrator-dev.onrender.com
     VITE_SUPABASE_URL=https://[dev-project-id].supabase.co
     VITE_SUPABASE_ANON_KEY=[dev-anon-key]
     ```
5. Click "Deploy site"

**2.2 Verify Dev Frontend**

- URL: https://bassline-dev.netlify.app
- Should see login page (may have errors until backend is set up)

---

### Phase 3: Backend Dev Environment (Render) (20 minutes)

**3.1 Create New Render Web Service**

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect to GitHub repo `MVP2`
4. Configure service:
   - **Name:** `pilates-dev`
   - **Branch:** `dev`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3.11`
   - **Build Command:** `pip install -r requirements-production.txt`
   - **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free` (512MB RAM)
   - **Environment variables:** (copy from production, update SUPABASE_URL)
     ```
     SUPABASE_URL=https://[dev-project-id].supabase.co
     SUPABASE_SERVICE_ROLE_KEY=[dev-service-role-key]
     OPENAI_API_KEY=[same as production]
     ENVIRONMENT=development
     ALLOWED_ORIGINS=https://bassline-dev.netlify.app
     ```
5. Click "Create Web Service"

**3.2 Create Orchestrator Dev Service (Optional)**

Same process for orchestrator:
- **Name:** `orchestrator-dev`
- **Branch:** `dev`
- **Root Directory:** `orchestrator`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

**3.3 Verify Dev Backend**

```bash
# Test health endpoint
curl https://pilates-dev.onrender.com/health

# Should return: {"status": "healthy"}
```

---

### Phase 4: Database Dev Environment (Supabase) (30 minutes)

**4.1 Create New Supabase Project**

1. Go to https://app.supabase.com
2. Click "New project"
3. Configure:
   - **Name:** `Bassline Pilates Dev`
   - **Database Password:** (generate strong password, save in password manager)
   - **Region:** Same as production (for consistency)
   - **Pricing plan:** Free
4. Wait for project creation (~2 minutes)

**4.2 Copy Database Schema from Production**

Option A: Export/Import SQL (Recommended)

```bash
# 1. Export production schema (from Supabase SQL Editor)
# Copy all table creation statements from production project

# 2. Paste into dev project SQL Editor
# Execute all CREATE TABLE statements

# 3. Copy seed data (optional - or use subset)
# Copy INSERT statements for essential data only
```

Option B: Use Supabase CLI (Advanced)

```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase

# Link to production project
supabase link --project-ref [production-project-id]

# Dump production schema
supabase db dump -f production_schema.sql

# Link to dev project
supabase link --project-ref [dev-project-id]

# Apply schema to dev
supabase db push --file production_schema.sql
```

**4.3 Seed Dev Database with Test Data**

```sql
-- Create test user (not in production)
INSERT INTO user_profiles (id, email, full_name, is_admin)
VALUES
  (gen_random_uuid(), 'test@bassline.dev', 'Test User', true);

-- Copy essential data from production:
-- - Movements (all 34)
-- - Music tracks (all 14)
-- - Class sections (preparation, warmup, etc.)
-- - Sequence rules

-- DO NOT copy:
-- - Real user data (PII)
-- - Real class plans
-- - Compliance logs
```

**4.4 Configure RLS Policies (Same as Production)**

```sql
-- Copy all RLS policies from production
-- (Should already be in schema dump)
```

**4.5 Update Backend Environment Variables**

Go back to Render → pilates-dev service → Environment:
- `SUPABASE_URL`: https://[dev-project-id].supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: [from dev project Settings → API]

Trigger redeploy on Render.

---

### Phase 5: Testing & Verification (20 minutes)

**5.1 Test Dev Environment End-to-End**

```bash
# 1. Visit dev frontend
open https://bassline-dev.netlify.app

# 2. Register new test account
# Email: test@bassline.dev
# Password: TestPassword123!

# 3. Generate a test class (AI mode OFF for speed)
# Difficulty: Beginner
# Duration: 15 minutes

# 4. Verify class generation works
# Check movements, music, sections

# 5. Play class
# Verify music plays, voiceovers work

# 6. Check dev database
# Go to Supabase dev project → Table Editor
# Verify class_plans table has new entry
```

**5.2 Test Dev → QA Merge Workflow**

```bash
# Make a trivial change on dev branch
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2
git checkout dev

# Edit a comment in frontend code
echo "// Dev environment test comment" >> frontend/src/App.tsx

git add frontend/src/App.tsx
git commit -m "test: Verify dev environment workflow"
git push origin dev

# Wait for Netlify dev deploy (~2 minutes)
# Check https://bassline-dev.netlify.app for comment in source

# Merge to main (QA)
git checkout main
git merge dev
git push origin main

# Wait for Netlify production deploy (~2 minutes)
# Verify change appears in production

# Clean up test comment
git checkout dev
git revert HEAD
git push origin dev
git checkout main
git merge dev
git push origin main
```

---

### Phase 6: Documentation (10 minutes)

**6.1 Update README.md**

Add section:

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
  - Backend: https://pilates-api3.onrender.com
  - Database: Supabase production project
  - Branch: `main`

### Workflow

1. **Develop fixes on `dev` branch:**
   ```bash
   git checkout dev
   # Make changes
   git add .
   git commit -m "fix: description"
   git push origin dev
   ```
   → Auto-deploys to dev environment

2. **Test in dev environment:**
   - Visit https://bassline-dev.netlify.app
   - Verify fix works
   - Check Render logs for errors

3. **Merge to `main` when confident:**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```
   → Auto-deploys to QA (beta testers)

4. **Beta testers validate in QA:**
   - They always use https://basslinemvp.netlify.app
   - Never see broken code from dev
```

**6.2 Create Quick Reference Card**

Save this in `docs/DEV_QA_CHEATSHEET.md`:

```markdown
# Dev/QA Environment Cheatsheet

## URLs

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| Dev | bassline-dev.netlify.app | pilates-dev.onrender.com | Supabase dev |
| QA | basslinemvp.netlify.app | pilates-api3.onrender.com | Supabase prod |

## Common Commands

```bash
# Switch to dev
git checkout dev

# Switch to QA
git checkout main

# Deploy to dev
git push origin dev

# Deploy to QA
git checkout main && git merge dev && git push origin main
```

## When to Use Each Environment

- **Dev:** Testing bug fixes, new features, experiments
- **QA:** Beta testers, stable releases, customer demos
```

---

## 💰 Cost Breakdown

| Service | Dev Environment | QA Environment | Total |
|---------|----------------|----------------|-------|
| Netlify (Frontend) | Free tier | Free tier | $0/month |
| Render (Backend) | Free tier (512MB) | Free tier (512MB) | $0/month |
| Render (Orchestrator) | Free tier (512MB) | Free tier (512MB) | $0/month |
| Supabase (Database) | Free tier | Free tier | $0/month |
| **Total** | **$0/month** | **$0/month** | **$0/month** |

**Note:** All services support 2+ projects on free tier. Zero additional cost.

---

## 🎯 Success Criteria

After setup, you should be able to:

- [ ] Push to `dev` branch → auto-deploys to https://bassline-dev.netlify.app
- [ ] Test fixes in dev without affecting beta testers
- [ ] Merge `dev` → `main` → auto-deploys to production
- [ ] Beta testers always see stable code
- [ ] Dev database has test data, production has real data
- [ ] Can break dev environment without consequences
- [ ] Clear workflow documented for future reference

---

## 🚨 Common Pitfalls to Avoid

1. **Forgetting to switch branches**
   - Always check: `git branch` before pushing
   - Set up Git prompt to show current branch

2. **Environment variables in wrong environment**
   - Dev should point to dev Supabase
   - QA should point to production Supabase
   - Double-check URLs before deploying

3. **Accidentally merging main → dev**
   - Always merge `dev` → `main`, NEVER the reverse
   - `main` should always be ahead or equal to `dev`

4. **Testing in production**
   - Use dev environment first
   - Only merge to main when confident

5. **Breaking dev and thinking it's critical**
   - Dev is supposed to break sometimes
   - That's the whole point - isolate failures

---

## 📝 Next Steps After Setup

1. **Add status badges to README.md**
   - Netlify deploy status
   - Render service health
   - Build passing/failing

2. **Set up monitoring** (Future enhancement)
   - Sentry for error tracking
   - LogRocket for session replay
   - Separate Sentry projects for dev/QA

3. **Add automated testing** (Future enhancement)
   - MCP Playwright for E2E tests
   - Run on dev before merging to main
   - See Priority Task #2 in CLAUDE.md

---

## 🤔 Questions?

If you encounter issues during setup:

1. Check Netlify deploy logs
2. Check Render service logs
3. Verify environment variables are correct
4. Test database connection with SQL query
5. Ask Claude for help with specific error messages

---

**Ready to proceed?** Let me know your decisions on:
1. Separate database or shared? (Recommendation: Separate)
2. Stable URLs or auto-generated? (Recommendation: Stable)
3. Full setup now or minimal setup? (Recommendation: Full)

Then we'll execute the plan step-by-step!
