# Render.com Production Setup

## Critical: OpenAI API Key Configuration

**Without this, your agent will NOT use LLM reasoning!**

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)
4. **Save it immediately** - you can't view it again

### Step 2: Add to Render.com Environment Variables

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your orchestrator service
3. Click "Environment" in the left sidebar
4. Click "Add Environment Variable"
5. Add:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (your actual key)
6. Click "Save Changes"
7. **Render will auto-redeploy** with the new environment variable

### Step 3: Verify It's Working

After deployment completes, check the logs:

```bash
# In Render.com dashboard, go to "Logs" tab
# Look for these messages:

✅ JENTIC LLM initialized: gpt-4
✅ JENTIC ReWOO reasoner initialized
✅ BasslinePilatesCoachAgent initialized
```

**If you see:**
```
⚠️ OpenAI API key not configured - using template fallback
```

**Then:** The environment variable wasn't set correctly. Go back to Step 2.

### Step 4: Test LLM Usage in Production

Make a test API call to your orchestrator service:

```bash
curl -X POST https://your-orchestrator.onrender.com/api/agent/solve \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Create a 30-minute beginner Pilates class"
  }'
```

**Check the response logs for:**
- `🔥 LLM CALL DETECTED` - Proves LLM is being called
- `✅ LLM reasoning completed` - Proves agent used AI
- Token usage and cost metrics

**If you don't see LLM calls:**
- The OpenAI key isn't configured
- The agent is falling back to non-LLM behavior

## Environment Variables Checklist

Required for production:

```bash
# OpenAI (CRITICAL - Required for LLM reasoning)
OPENAI_API_KEY=sk-proj-...

# Bassline API
BASSLINE_API_URL=https://pilates-class-generator-api3.onrender.com

# Supabase (if using direct database access)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# Environment
ENV=production
```

## Cost Monitoring

With OpenAI API key configured, you'll incur costs:

### GPT-4 Pricing (as of Nov 2025)
- Input: $0.03 / 1K tokens
- Output: $0.06 / 1K tokens

### Typical Class Generation Cost
- Agent reasoning: ~2,000 input tokens + ~1,000 output tokens
- Cost per class: **~$0.12 - $0.15**
- 100 classes: **~$12-15**
- 1,000 classes: **~$120-150**

### Set OpenAI Budget Limits

1. Go to https://platform.openai.com/settings/organization/billing/limits
2. Set monthly budget limit (e.g., $50)
3. Enable email alerts at 50%, 75%, 100% usage

## Logging LLM Usage

Add this to your agent initialization to log every LLM call:

```python
from loguru import logger

class BasslinePilatesCoachAgent(StandardAgent):
    def __init__(self):
        # ... existing code ...

        # Log LLM configuration
        logger.info(f"LLM configured: {self.llm.model}")
        logger.info(f"LLM temperature: {self.llm.temperature}")
        logger.info(f"LLM max tokens: {self.llm.max_tokens}")

        # Enable token usage tracking
        self.llm.track_usage = True  # If supported
```

Then monitor Render logs for:
```
✅ LLM configured: gpt-4
🔥 LLM call: input=1,234 tokens, output=567 tokens, cost=$0.12
```

## Troubleshooting

### "OpenAI API key not found"

**Symptom:** Agent starts but doesn't make LLM calls

**Solution:**
1. Check Render environment variables
2. Verify key starts with `sk-proj-` or `sk-`
3. Restart the service
4. Check logs for initialization messages

### "OpenAI API rate limit exceeded"

**Symptom:** 429 errors in logs

**Solution:**
1. Upgrade OpenAI plan (Tier 1+)
2. Add rate limiting in your app
3. Implement caching to reduce LLM calls

### "This is just database queries, no LLM"

**Symptom:** Classes generated instantly (<1 second)

**Solution:**
- LLM calls take 2-5 seconds minimum
- If instant: Not using LLM
- Check OpenAI key configuration
- Verify agent.solve() is being called

## How to Verify Production LLM Usage

### Method 1: Response Time
- **With LLM:** 3-10 seconds (network + LLM reasoning)
- **Without LLM:** <1 second (just database queries)

### Method 2: OpenAI Dashboard
1. Go to https://platform.openai.com/usage
2. Check API usage graphs
3. Should see requests when classes are generated

### Method 3: Render Logs
Search logs for:
```
LLM call
reasoning
GPT-4
token usage
```

If you see these: ✅ Using LLM
If you don't: ❌ Not using LLM

## Security

**Never commit OpenAI keys to git!**

✅ Use Render environment variables
✅ Use `.env` file locally (in `.gitignore`)
❌ Never hardcode keys in code
❌ Never commit `.env` to GitHub

## Next Steps After Setup

1. Deploy to Render with OpenAI key
2. Test with `test_llm_usage.py`
3. Monitor OpenAI usage dashboard
4. Set budget limits
5. Add cost monitoring to your app

---

**Bottom Line:** Without `OPENAI_API_KEY` configured on Render, your agent is just Python code making database calls. With it configured, you get real LLM reasoning.
