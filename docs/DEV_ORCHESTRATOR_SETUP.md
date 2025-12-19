# Dev Orchestrator Setup Guide

**Purpose:** Set up a separate orchestrator service for the dev environment to test AI agent changes safely before production.

**Created:** December 19, 2025
**Status:** Ready to deploy

---

## Why We Need This

**Problem:** The production orchestrator (`bassline-orchestrator`) deploys from `main` branch only. When we push fixes to the `dev` branch, the dev frontend calls the **production orchestrator** which has old code.

**Solution:** Create `bassline-orchestrator-dev` that:
- Deploys from the `dev` branch
- Calls the dev backend API
- Uses the dev Supabase database
- Allows safe testing before merging to `main`

---

## Step 1: Create New Render Service

1. **Go to Render Dashboard:** https://dashboard.render.com/
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub Repository:**
   - Repository: `Lauraredmond/pilates-class-generator`
   - Branch: `dev` (will be configured in YAML)

4. **Service Configuration:**
   - **Name:** `bassline-orchestrator-dev`
   - **Region:** Oregon (same as backend)
   - **Branch:** `dev`
   - **Root Directory:** `orchestrator`
   - **Environment:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **Use Blueprint:**
   - Select **"Use a blueprint file"**
   - Blueprint file path: `orchestrator/render-dev.yaml`

---

## Step 2: Set Environment Variables

In the Render dashboard for `bassline-orchestrator-dev`, set these variables:

### Required Variables (Set Manually)

```bash
# Supabase Dev Service Role Key
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (YOUR DEV SERVICE ROLE KEY)

# OpenAI API Key (same as production)
OPENAI_API_KEY=sk-... (YOUR OPENAI API KEY)
```

### Auto-Set Variables (from render-dev.yaml)

These are automatically set from the YAML file:
- `PYTHON_VERSION=3.11.0`
- `BASSLINE_API_URL=https://pilates-dev-i0jb.onrender.com`
- `SUPABASE_URL=https://hmtvlujowgcbxzmyqwnt.supabase.co`
- `ENVIRONMENT=development`
- `LOG_LEVEL=DEBUG`

---

## Step 3: Find Your Dev Service Role Key

**Supabase Dev Project:**
1. Go to: https://supabase.com/dashboard/project/hmtvlujowgcbxzmyqwnt
2. Click **"Settings"** (gear icon in sidebar)
3. Click **"API"**
4. Find **"service_role" secret**
5. Copy the key (starts with `eyJ...`)
6. **⚠️ DO NOT commit this to git!**

---

## Step 4: Deploy the Service

1. **Click "Create Web Service"** in Render
2. Wait for initial deploy (~3-4 minutes)
3. **Check deployment logs** for errors
4. **Verify health endpoint:** `curl https://bassline-orchestrator-dev.onrender.com/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## Step 5: Update Dev Frontend Environment Variables

**Netlify Dev Site:**
1. Go to: https://app.netlify.com/sites/bassline-dev/configuration/env
2. Add new variable:
   ```
   VITE_ORCHESTRATOR_URL=https://bassline-orchestrator-dev.onrender.com
   ```
3. **Redeploy site** to pick up new environment variable

---

## Step 6: Test the Dev Orchestrator

### Test 1: Health Check
```bash
curl https://bassline-orchestrator-dev.onrender.com/health
```

**Expected:**
```json
{
  "status": "healthy",
  "environment": "development",
  "tools_available": [
    "SequenceTools",
    "MusicTools",
    "MeditationTools",
    "ResearchTools",
    "ClassSectionTools"
  ]
}
```

### Test 2: Generate a Class
1. Go to: https://bassline-dev.netlify.app
2. Generate a class (any difficulty, 30 minutes)
3. **Check browser console** for logs:
   ```
   [AIGenerationPanel] Calculated actual duration from Supabase
   ```
4. **Verify modal shows correct duration** (should be ~29m, not 32m)

### Test 3: Verify Database Duration Used
1. Look at movement durations in the modal
2. Each movement should show **4:00 duration** (240 seconds from database)
3. NOT 5:00 (300 seconds hardcoded for Intermediate)

---

## Troubleshooting

### Problem: Service won't start - "ModuleNotFoundError"

**Solution:** Check that `requirements.txt` has all dependencies:
```bash
# Should include:
fastapi
uvicorn
pydantic
loguru
supabase
openai
# ... etc
```

### Problem: Health check fails - HTTP 404

**Solution:** Verify the service is running:
1. Check Render logs for startup errors
2. Verify `rootDir: orchestrator` is set correctly
3. Check that `main.py` exists in orchestrator directory

### Problem: Can't connect to Supabase

**Solution:** Verify environment variables:
1. Check `SUPABASE_URL` is correct dev URL
2. Verify `SUPABASE_KEY` is the dev service role key (not anon key!)
3. Test connection from Render logs

### Problem: Frontend still shows 32m duration

**Solution:**
1. Verify `VITE_ORCHESTRATOR_URL` is set in Netlify
2. Hard refresh browser: Cmd+Shift+R
3. Check browser Network tab - is it calling dev orchestrator or production?
4. Clear browser cache completely

---

## Architecture After Setup

```
Dev Environment Flow:

User → https://bassline-dev.netlify.app (Netlify)
           ↓
       Frontend calls VITE_ORCHESTRATOR_URL
           ↓
       https://bassline-orchestrator-dev.onrender.com (Render)
           ↓
       Calls BASSLINE_API_URL
           ↓
       https://pilates-dev-i0jb.onrender.com (Render)
           ↓
       Queries SUPABASE_URL
           ↓
       https://hmtvlujowgcbxzmyqwnt.supabase.co (Supabase Dev)
```

```
Production Environment Flow:

User → https://basslinemvp.netlify.app (Netlify)
           ↓
       Frontend calls VITE_ORCHESTRATOR_URL
           ↓
       https://bassline-orchestrator.onrender.com (Render)
           ↓
       Calls BASSLINE_API_URL
           ↓
       https://pilates-class-generator-api3.onrender.com (Render)
           ↓
       Queries SUPABASE_URL
           ↓
       https://lixvcebtwusmaipodcpc.supabase.co (Supabase Production)
```

---

## Cost Impact

**Free Tier Limits:**
- Render free tier: 750 hours/month (enough for 1 service always on)
- With 2 orchestrators (dev + prod), you'll use ~1,500 hours/month
- **Recommendation:** Keep dev orchestrator, it's within free limits

**Monthly Cost:** Still $0.00 (both services fit in free tier)

---

## Next Steps After Setup

1. ✅ Test movement duration fix in dev (should show 240s, not 300s)
2. ✅ Test ROPA report fix in dev (should render, not 500 error)
3. ✅ If both work, merge `dev → main`
4. ✅ Production auto-deploys with fixes

---

## Quick Reference: Service URLs

| Environment | Frontend | Backend | Orchestrator | Database |
|-------------|----------|---------|--------------|----------|
| **Dev** | https://bassline-dev.netlify.app | https://pilates-dev-i0jb.onrender.com | **https://bassline-orchestrator-dev.onrender.com** | https://hmtvlujowgcbxzmyqwnt.supabase.co |
| **Production** | https://basslinemvp.netlify.app | https://pilates-class-generator-api3.onrender.com | https://bassline-orchestrator.onrender.com | https://lixvcebtwusmaipodcpc.supabase.co |

---

## Summary

After completing this setup:

✅ **Dev orchestrator** deploys from `dev` branch
✅ **Production orchestrator** stays on `main` branch
✅ **Safe testing** of orchestrator changes before production
✅ **$0/month cost** (both within Render free tier)
✅ **Complete dev/QA pipeline** for all stack layers

**Your dev→QA→production workflow is now complete!**
