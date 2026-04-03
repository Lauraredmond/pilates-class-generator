# LLM Usage Verification Checklist

## 🚨 The Critical Question

**"Is my agent actually using LLM reasoning, or just making database calls?"**

Here's how to prove it definitively:

---

## ✅ Quick Tests (1 minute)

### Test 1: Response Time
```bash
# Time a class generation request
time curl -X POST https://your-orchestrator.onrender.com/api/agent/solve \
  -H "Content-Type: application/json" \
  -d '{"goal": "Create a 30-minute beginner class"}'
```

**Results:**
- ✅ **3-10 seconds:** Using LLM (network + AI reasoning)
- ❌ **<1 second:** NOT using LLM (just database queries)

### Test 2: OpenAI Dashboard
1. Go to https://platform.openai.com/usage
2. Generate a test class
3. Refresh the usage page

**Results:**
- ✅ **New requests appear:** Using LLM
- ❌ **No new requests:** NOT using LLM

### Test 3: Render Logs
1. Go to Render dashboard → Logs
2. Search for: `LLM call` or `GPT-4` or `reasoning`

**Results:**
- ✅ **Log entries found:** Using LLM
- ❌ **No entries:** NOT using LLM

---

## 🔍 Detailed Verification (5 minutes)

### Test 4: Environment Variable Check

**Render Dashboard:**
1. Go to your service
2. Click "Environment" tab
3. Look for: `OPENAI_API_KEY`

**Results:**
- ✅ **Variable exists with sk-proj-...:** Configured correctly
- ⚠️ **Variable exists but empty/placeholder:** NOT configured
- ❌ **Variable doesn't exist:** NOT configured

### Test 5: Initialization Logs

**In Render logs, look for startup messages:**

```
✅ GOOD (LLM configured):
✅ JENTIC LLM initialized: gpt-4
✅ LiteLLM configured with temperature: 0.7
✅ BasslinePilatesCoachAgent initialized

❌ BAD (LLM not configured):
⚠️ OpenAI API key not configured - using fallback
❌ LLM initialization failed
```

### Test 6: Run the Test Script

**Locally:**
```bash
cd orchestrator
source venv/bin/activate
python test_llm_usage.py
```

**Expected output if working:**
```
✅ OpenAI API key found: sk-proj-...
✅ Agent LLM configured: gpt-4
✅ Agent has solve() method: True
🔥 LLM CALL #1 DETECTED:
   Model: gpt-4
   Messages: 3 messages
   Temperature: 0.7
✅ LLM CALL SUCCESSFUL!
```

**Expected output if NOT working:**
```
❌ OPENAI_API_KEY not configured!
```

---

## 📊 Side-by-Side Comparison

| Indicator | With LLM Reasoning | Without LLM (Direct DB) |
|-----------|-------------------|------------------------|
| **Response Time** | 3-10 seconds | <1 second |
| **OpenAI Usage Dashboard** | Shows API calls | No API calls |
| **Logs** | "LLM call", "GPT-4", "reasoning" | No LLM mentions |
| **Environment Vars** | OPENAI_API_KEY set | Not set or placeholder |
| **Cost** | ~$0.12 per class | $0 (no API calls) |
| **Variability** | Each class slightly different | Identical patterns |

---

## 🧪 Scientific Proof Method

### The Variability Test

**Hypothesis:** If using LLM, outputs should vary between runs. If just database queries, outputs should be identical.

**Test:**
```bash
# Generate 3 identical requests
for i in {1..3}; do
  curl -X POST https://your-orchestrator.onrender.com/api/agent/solve \
    -H "Content-Type: application/json" \
    -d '{"goal": "Create a 30-minute beginner class"}' \
    > output_$i.json
done

# Compare outputs
diff output_1.json output_2.json
```

**Results:**
- ✅ **Files are different:** Using LLM (AI varies outputs)
- ❌ **Files are identical:** NOT using LLM (deterministic code)

---

## 🎯 The Definitive Test

**This is the 100% certain way to know:**

### Monitor OpenAI Token Usage in Real-Time

**Before test:**
1. Go to https://platform.openai.com/usage
2. Note current token count (e.g., 10,234 tokens)

**During test:**
1. Generate ONE test class
2. Wait 30 seconds
3. Refresh OpenAI usage page

**After test:**
1. Check new token count (e.g., 12,567 tokens)
2. Difference = tokens used by your agent

**Results:**
- ✅ **+2,000-3,000 tokens:** Using LLM! (typical agent reasoning)
- ❌ **+0 tokens:** NOT using LLM

---

## 🚀 Production Verification Workflow

**Every time you deploy:**

1. ✅ Check environment variables on Render
2. ✅ Deploy and wait for completion
3. ✅ Check startup logs for "LLM initialized"
4. ✅ Generate a test class
5. ✅ Verify OpenAI usage increased
6. ✅ Check response time (3-10 seconds)

**If any step fails → LLM is NOT configured**

---

## 🔧 Common Issues

### Issue 1: "Everything looks configured but no LLM calls"

**Possible causes:**
- OpenAI key is invalid (expired, revoked, or wrong)
- Agent code is catching LLM errors silently
- Fallback logic is triggering

**Fix:**
```bash
# Test the key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Should return list of models
# If error: Key is invalid
```

### Issue 2: "LLM calls happening but very expensive"

**Possible causes:**
- No caching (calling LLM for every request)
- Using GPT-4 instead of GPT-3.5-turbo
- Large context windows

**Fix:**
- Implement Redis caching
- Switch to GPT-3.5-turbo for cost-sensitive operations
- Reduce max_tokens in LLM config

### Issue 3: "Can't tell if it's working"

**Fix:** Enable detailed logging:

```python
# In bassline_agent.py
import logging
logging.basicConfig(level=logging.DEBUG)

logger.debug("🔥 About to call LLM with goal: {goal}")
result = self.llm.completion(...)
logger.debug(f"✅ LLM returned: {len(result)} tokens")
```

---

## 📝 Checklist Summary

Before claiming "LLM is working":

- [ ] OpenAI API key set in Render environment variables
- [ ] Startup logs show "LLM initialized: gpt-4"
- [ ] Response time is 3-10 seconds (not <1 second)
- [ ] OpenAI usage dashboard shows API calls
- [ ] Render logs contain "LLM call" or "GPT-4"
- [ ] Test script confirms LLM usage
- [ ] Variability test shows different outputs
- [ ] OpenAI token usage increases after each generation

**If all checked:** ✅ You're using LLM reasoning

**If any unchecked:** ❌ You're using direct database calls

---

**Bottom Line:** Without proper OpenAI configuration, you have a sophisticated Python function that queries databases. With proper configuration, you have an AI agent that **reasons** using LLM.
