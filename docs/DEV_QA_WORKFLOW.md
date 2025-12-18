# Dev/QA Workflow Guide

**Last Updated:** December 18, 2025
**Status:** ✅ Fully operational and tested

---

## Quick Reference: Making Changes

### When You Need to Fix a Bug or Add a Feature

**The Golden Rule:** Never push directly to `main`. Always test in `dev` first.

```bash
# 1. Switch to dev branch
git checkout dev
git pull origin dev

# 2. Make your changes (edit code, fix bugs, etc.)

# 3. Commit and push to dev
git add .
git commit -m "fix: Your descriptive commit message"
git push origin dev

# 4. Test in dev environment (2-3 minutes for auto-deploy)
# Dev Frontend: https://bassline-dev.netlify.app
# Dev Backend: https://pilates-dev-i0jb.onrender.com

# 5. When you confirm it works, merge to main (production)
git checkout main
git pull origin main
git merge dev
git push origin main

# 6. Verify in production (2-3 minutes for auto-deploy)
# Production Frontend: https://basslinemvp.netlify.app
# Production Backend: https://pilates-class-generator-api3.onrender.com
```

---

## Environment Overview

### Dev Environment (Your Testing Playground)
- **Purpose:** Test fixes safely without affecting beta testers
- **Frontend:** https://bassline-dev.netlify.app
- **Backend:** https://pilates-dev-i0jb.onrender.com
- **Database:** Supabase dev project (hmtvlujowgcbxzmyqwnt)
- **Git Branch:** `dev`
- **Auto-Deploy:** Pushes to `dev` branch auto-deploy to dev environment
- **Data:** Reference data only (35 movements, 43 music tracks, NO user PII)

### Production/QA Environment (Beta Testers Use This)
- **Purpose:** Stable environment for beta testers
- **Frontend:** https://basslinemvp.netlify.app
- **Backend:** https://pilates-class-generator-api3.onrender.com
- **Database:** Supabase production project (lixvcebtwusmaipodcpc)
- **Git Branch:** `main`
- **Auto-Deploy:** Pushes to `main` branch auto-deploy to production
- **Data:** Real user data, classes, preferences

---

## Common Workflows

### Workflow 1: Fixing a Bug

**Scenario:** Beta tester reports voiceover not playing correctly.

```bash
# Step 1: Reproduce bug in production (confirm it exists)
# Visit https://basslinemvp.netlify.app and test

# Step 2: Switch to dev branch
git checkout dev
git pull origin dev

# Step 3: Fix the bug in your code editor
# Example: Edit frontend/src/hooks/useAudioDucking.ts

# Step 4: Commit and push to dev
git add .
git commit -m "fix: Voiceover plays on natural section transitions"
git push origin dev

# Step 5: Test in dev environment (wait 2-3 min for deploy)
# Visit https://bassline-dev.netlify.app
# Generate a class, verify voiceover works

# Step 6: If fix works, merge to production
git checkout main
git merge dev
git push origin main

# Step 7: Notify beta testers (wait 2-3 min for deploy)
# "Voiceover bug fixed - please refresh your browser"
```

---

### Workflow 2: Adding a New Feature

**Scenario:** You want to add Jazz music style.

```bash
# Step 1: Create feature on dev branch
git checkout dev
git pull origin dev

# Step 2: Add the feature
# - Update database migration (add Jazz tracks)
# - Update frontend dropdown (add Jazz option)
# - Add Jazz tracks to music_tracks table

# Step 3: Commit feature to dev
git add .
git commit -m "feat: Add Jazz music style with 12 tracks"
git push origin dev

# Step 4: Test thoroughly in dev
# - Generate classes with Jazz selected
# - Verify music plays correctly
# - Test on mobile Safari + Android Chrome

# Step 5: If everything works, deploy to production
git checkout main
git merge dev
git push origin main

# Step 6: Announce new feature to beta testers
```

---

### Workflow 3: Database Schema Changes

**Scenario:** You need to add a new table or column.

```bash
# Step 1: Create migration SQL file
# Example: database/migrations/020_add_jazz_tracks.sql

# Step 2: Apply migration to DEV database FIRST
# - Open Supabase dev project (hmtvlujowgcbxzmyqwnt)
# - SQL Editor → paste migration SQL → Run

# Step 3: Update backend models (Pydantic)
# Example: backend/models/music.py

# Step 4: Update frontend interfaces (TypeScript)
# Example: frontend/src/types/music.ts

# Step 5: Commit and push to dev
git add .
git commit -m "feat: Add Jazz music database schema"
git push origin dev

# Step 6: Test in dev environment
# - Verify API returns new fields
# - Check frontend renders correctly

# Step 7: Apply migration to PRODUCTION database
# - Open Supabase production project (lixvcebtwusmaipodcpc)
# - SQL Editor → paste same migration SQL → Run

# Step 8: Merge code to production
git checkout main
git merge dev
git push origin main
```

**⚠️ CRITICAL:** Always apply database migrations to dev FIRST, test, then apply to production.

---

## Environment Variables

### Dev Environment Variables

**Netlify Dev Site:**
```bash
VITE_API_URL=https://pilates-dev-i0jb.onrender.com
VITE_SUPABASE_URL=https://hmtvlujowgcbxzmyqwnt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (dev anon key)
```

**Render Dev Backend:**
```bash
SUPABASE_URL=https://hmtvlujowgcbxzmyqwnt.supabase.co
SUPABASE_KEY=sb_..._secret_... (dev secret key)
SUPABASE_SERVICE_ROLE_KEY=sb_..._secret_... (same as SUPABASE_KEY)
FRONTEND_URL=https://bassline-dev.netlify.app
OPENAI_API_KEY=(same as production)
```

### Production Environment Variables

**Netlify Production Site:**
```bash
VITE_API_URL=https://pilates-class-generator-api3.onrender.com
VITE_SUPABASE_URL=https://lixvcebtwusmaipodcpc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (production anon key)
```

**Render Production Backend:**
```bash
SUPABASE_URL=https://lixvcebtwusmaipodcpc.supabase.co
SUPABASE_KEY=sb_..._secret_... (production secret key)
SUPABASE_SERVICE_ROLE_KEY=sb_..._secret_... (same as SUPABASE_KEY)
FRONTEND_URL=https://basslinemvp.netlify.app
OPENAI_API_KEY=(same as dev)
```

---

## Troubleshooting

### Problem: Changes not appearing in dev after 5+ minutes

**Solution:**
1. Check Netlify deploy status: https://app.netlify.com/sites/bassline-dev/deploys
2. Check Render deploy status: https://dashboard.render.com/web/srv-ctc3qjlds78s73fhgb6g
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Clear browser cache if still not working

### Problem: Dev site shows old Content Security Policy (CSP)

**Solution:**
1. CSP is managed in `frontend/public/_headers` file (NOT netlify.toml)
2. Make sure Vite copies `_headers` to `dist/_headers` during build
3. Verify with: `curl -I https://bassline-dev.netlify.app | grep -i content-security-policy`
4. Should include: `https://pilates-dev-i0jb.onrender.com`

### Problem: Database migration fails in dev

**Solution:**
1. Check Supabase SQL Editor for syntax errors
2. Verify table/column names don't already exist
3. Check for foreign key constraint violations
4. Roll back if needed: `DROP TABLE table_name;` (only in dev!)

### Problem: Registration fails in dev with HTTP 500

**Solution:**
1. Check Render backend logs: https://dashboard.render.com/web/srv-ctc3qjlds78s73fhgb6g/logs
2. Common causes:
   - Missing environment variables (SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY)
   - Database connection issues
   - Foreign key constraint violations
3. Test backend directly: `curl -X POST https://pilates-dev-i0jb.onrender.com/api/auth/register ...`

### Problem: Email confirmation redirects to localhost

**Solution:**
1. Update Supabase URL Configuration:
   - Go to Supabase dev project → Authentication → URL Configuration
   - Site URL: `https://bassline-dev.netlify.app`
   - Redirect URLs: `https://bassline-dev.netlify.app/**`

---

## Best Practices

### ✅ DO:
- Always test in dev before merging to main
- Use descriptive commit messages
- Wait for auto-deploy to complete (2-3 minutes)
- Test on mobile Safari + Android Chrome
- Apply database migrations to dev first, then production
- Keep dev and production environment variables in sync (except URLs/keys)

### ❌ DON'T:
- Push directly to `main` without testing in dev
- Apply database migrations to production without testing in dev first
- Delete users manually (use proper cascade deletion order)
- Assume changes work everywhere if they work locally
- Skip testing on mobile devices
- Commit secrets or API keys to git

---

## Deployment Times

**Netlify (Frontend):**
- Build time: ~1-2 minutes
- Deploy time: ~30 seconds
- **Total:** 2-3 minutes from `git push` to live

**Render (Backend):**
- Build time: ~2-3 minutes (pip install dependencies)
- Deploy time: ~1 minute
- **Total:** 3-4 minutes from `git push` to live

**Tip:** Use `curl` to test backend health while waiting:
```bash
# Check if backend is responding
curl https://pilates-dev-i0jb.onrender.com/api/health
```

---

## Success Criteria Verification

### How to Verify Dev Environment is Working

```bash
# 1. Check dev frontend loads
curl -I https://bassline-dev.netlify.app
# Should return: HTTP/2 200

# 2. Check dev backend is healthy
curl https://pilates-dev-i0jb.onrender.com/api/health
# Should return: {"status":"healthy",...}

# 3. Check dev database has reference data
# Supabase dev project → SQL Editor:
SELECT COUNT(*) FROM movements;  -- Should return 35
SELECT COUNT(*) FROM music_tracks;  -- Should return 43
SELECT COUNT(*) FROM users;  -- Should return 0 (no PII in dev)

# 4. Check CSP allows dev backend
curl -I https://bassline-dev.netlify.app | grep -i content-security-policy
# Should include: https://pilates-dev-i0jb.onrender.com
```

---

## Cost Breakdown (All Free!)

| Service | Dev Environment | Production/QA | Monthly Cost |
|---------|----------------|---------------|--------------|
| **Netlify** | Free tier (100GB bandwidth) | Free tier (100GB bandwidth) | $0.00 |
| **Render** | Free tier (512MB RAM) | Free tier (512MB RAM) | $0.00 |
| **Supabase** | Free tier (500MB database) | Paid ($25/month) | $25.00 |
| **GitHub** | Free (unlimited repos) | Free (unlimited repos) | $0.00 |
| **OpenAI** | Pay-per-use (shared with prod) | Pay-per-use (~$20/month) | ~$20.00 |
| **Total** | | | **$45.00** |

**Note:** Dev environment adds **$0/month** to infrastructure costs!

---

## Quick Links

### Dev Environment
- **Frontend:** https://bassline-dev.netlify.app
- **Backend:** https://pilates-dev-i0jb.onrender.com
- **Supabase:** https://supabase.com/dashboard/project/hmtvlujowgcbxzmyqwnt
- **Netlify Dashboard:** https://app.netlify.com/sites/bassline-dev
- **Render Dashboard:** https://dashboard.render.com/web/srv-ctc3qjlds78s73fhgb6g

### Production/QA Environment
- **Frontend:** https://basslinemvp.netlify.app
- **Backend:** https://pilates-class-generator-api3.onrender.com
- **Supabase:** https://supabase.com/dashboard/project/lixvcebtwusmaipodcpc
- **Netlify Dashboard:** https://app.netlify.com/sites/basslinemvp
- **Render Dashboard:** https://dashboard.render.com/web/srv-ctaqdi5lds78s73fereg

### Development Tools
- **GitHub Repo:** https://github.com/Lauraredmond/pilates-class-generator
- **Project Board:** (if using GitHub Projects)

---

## Summary

**You now have a complete dev/QA pipeline!**

✅ **Dev environment** for safe testing
✅ **Production/QA environment** for stable beta testing
✅ **Auto-deploy on git push** (no manual steps)
✅ **$0/month additional cost** (dev uses free tiers)
✅ **Separate databases** (no risk to production data)
✅ **Tested and working** (TEST marker workflow verified December 18, 2025)

**Workflow Summary:**
1. Make changes in `dev` branch
2. Test in dev environment
3. Merge to `main` when confident
4. Auto-deploys to production for beta testers

**Questions? Issues?**
See Troubleshooting section above or refer to:
- `/docs/DEV_QA_ENVIRONMENT_SETUP.md` (detailed setup guide)
- `/docs/DEV_QA_SETUP_CHECKLIST.md` (step-by-step checklist)
