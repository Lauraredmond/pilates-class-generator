# Deployment Guide - Bassline Orchestrator

## Task 5: Deploy Orchestration Service to Render

---

## Prerequisites

- Render.com account
- GitHub repository connected to Render
- Environment variables ready (OpenAI API key, Bassline API URL, Supabase credentials)

---

## Deployment Steps

### 1. Create New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Bassline/Projects/MVP2`
4. Configure service:

```
Name: bassline-orchestrator
Root Directory: orchestrator
Environment: Python 3.11
Region: Oregon (US West) - Same as existing backend for low latency
```

### 2. Build & Start Commands

```
Build Command:
pip install -r requirements.txt

Start Command:
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 3. Environment Variables

Add these environment variables in Render dashboard:

```bash
# OpenAI (for LLM reasoning)
OPENAI_API_KEY=sk-your-actual-key-here

# Existing Bassline Backend
BASSLINE_API_URL=https://pilates-class-generator-api3.onrender.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-actual-supabase-key-here

# Service Config
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### 4. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your GitHub repo
   - Install dependencies from `requirements.txt`
   - Start the FastAPI service with `uvicorn`
3. Monitor deployment logs for any errors
4. Once deployed, note the service URL (e.g., `https://bassline-orchestrator.onrender.com`)

### 5. Verify Deployment

Test the health endpoint:

```bash
curl https://bassline-orchestrator.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "bassline-orchestrator",
  "version": "1.0.0",
  "jentic_integration": "Phase 1"
}
```

---

## Post-Deployment

### Test the /generate-class Endpoint

```bash
curl -X POST https://bassline-orchestrator.onrender.com/generate-class \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "target_duration_minutes": 30,
    "difficulty_level": "Intermediate",
    "focus_areas": ["Core"],
    "strictness_level": "guided"
  }'
```

### View API Documentation

Visit: `https://bassline-orchestrator.onrender.com/docs`

This shows the interactive Swagger UI for all endpoints.

---

## Monitoring

### Render Dashboard Metrics

Monitor in Render dashboard:
- **CPU Usage** - Should stay under 50% for typical usage
- **Memory Usage** - Python service typically uses 150-300MB
- **Response Times** - Should be < 5 seconds for class generation
- **Error Rates** - Should be near 0%

### Logs

View real-time logs in Render dashboard or via CLI:

```bash
render logs -a bassline-orchestrator
```

---

## Scaling Considerations

### Current Setup (Free/Starter Tier)

- Single instance
- Auto-sleep after 15 minutes of inactivity (Free tier)
- Cold start: ~30 seconds (Free tier)

**Recommendation:** Upgrade to **Starter plan ($7/month)** for:
- No auto-sleep
- Instant responses
- Better for production use

### Future Scaling (if needed)

- **Horizontal Scaling:** Add more instances (Render Pro plan)
- **Caching:** Add Redis for agent memory persistence
- **Database Connection Pooling:** For high-concurrency scenarios

---

## Troubleshooting

### Deployment Fails with "ModuleNotFoundError"

**Issue:** Jentic libraries not installing from GitHub.

**Fix:** Ensure `requirements.txt` has correct GitHub URLs:
```
git+https://github.com/jentic/standard-agent.git@main
git+https://github.com/jentic/arazzo-engine.git@main
```

### Service Returns 500 Error

**Check:**
1. Environment variables set correctly in Render dashboard
2. OpenAI API key is valid
3. Bassline API URL is reachable
4. Review logs for detailed error messages

### Slow Response Times

**Causes:**
- Cold start (if on Free tier - upgrade to Starter)
- OpenAI API slow response
- Network latency to Bassline backend

**Fix:**
- Upgrade to Starter tier ($7/month - no cold starts)
- Add caching for frequently-used data

---

## Security Checklist

- [ ] All API keys stored in Render environment variables (not in code)
- [ ] CORS configured to only allow your frontend domain
- [ ] No sensitive data in logs
- [ ] HTTPS enforced (Render provides this automatically)
- [ ] Supabase RLS policies enforced

---

## Cost Estimate

**Render Starter Tier:** $7/month
**OpenAI API Usage:**
- Estimate: $0.01-0.02 per class generation
- 100 classes/month: ~$1-2
- 1,000 classes/month: ~$10-20

**Total Monthly Cost (estimated):**
- Development: $7 (Render) + $5 (OpenAI free tier) = $12
- Production (1,000 classes): $7 (Render) + $20 (OpenAI) = $27

---

## Next Steps

After successful deployment:
1. Update frontend to call new orchestrator URL
2. Test end-to-end flow (frontend → orchestrator → backend)
3. Monitor for 24 hours to ensure stability
4. Enable auto-deploy on GitHub pushes
