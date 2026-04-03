# Voiceover Debug - Quick Start for Next Session

**Last Updated:** December 8, 2025 (Evening)
**Status:** Data transformation issue identified - need to find where TRUE→FALSE happens

---

## 🎯 **THE PROBLEM**

Movements show `voiceoverEnabled: false` in frontend, but database has `voiceover_enabled: true`.

**Evidence:**
```
Database (verified via curl):  voiceover_enabled: true  ✅
Frontend Console.txt:          voiceoverEnabled: false  ❌
```

**This means:** Data is being transformed from TRUE to FALSE somewhere in the backend→frontend pipeline.

---

## 🔍 **WHERE WE LEFT OFF**

### **What We Know:**
1. ✅ Database is 100% correct (`voiceover_enabled: true` for all 34 movements)
2. ✅ API endpoint `/api/movements/` returns correct data
3. ❌ Frontend receives `voiceoverEnabled: false`
4. ❌ Frontend missing `voiceoverUrl` and `voiceoverDuration` entirely

### **Debug Logging Deployed:**

**Frontend (Commit 629c092):** ✅ Already deployed to Netlify
- File: `frontend/src/components/class-playback/ClassPlayback.tsx` lines 175-184
- Logs every movement's voiceover data during playback

**Backend (Commit a846f17):** 🕐 Render deployment in progress
- File: `backend/orchestrator/tools/sequence_tools.py`
- Logs movements RIGHT after database query (lines 184-192)
- Logs movements AFTER building sequence (lines 305-314)
- Will show where data transformation happens

---

## ⚡ **QUICK START STEPS**

### **Step 1: Verify Render Deployment**
Check that commit `a846f17` has deployed:
- Go to Render dashboard
- Check orchestrator service deployment status
- Should show commit `a846f17` deployed successfully

### **Step 2: Generate BRAND NEW Class**
**CRITICAL:** Do NOT play an old saved class!

1. Go to https://basslinemvp.netlify.app
2. Login
3. Click "Generate Class"
4. Any difficulty/duration is fine
5. Click "Accept & Add to Library"
6. Click "Play Class"

### **Step 3: Collect BOTH Log Sources**

**Frontend Logs:**
1. Open DevTools (F12) → Console tab
2. Look for `🔍 VOICEOVER DEBUG:` logs
3. Save Console.txt to MVP2 folder

**Backend Logs:**
1. Go to Render dashboard → orchestrator service → Logs
2. Look for new debug sections:
   - `🔍 DEBUG: Movements from database (first 3):`
   - `🔍 DEBUG: Final sequence (first 3 movements):`
3. Copy/paste backend logs or save screenshot

### **Step 4: Share Logs with Claude**

Provide BOTH:
- Console.txt (frontend logs)
- Render backend logs (from class generation)

Claude will analyze to identify where TRUE becomes FALSE.

---

## 🔬 **WHAT TO LOOK FOR IN BACKEND LOGS**

Backend logs will show voiceover fields at TWO critical points:

**Point A: Right After Database Query**
```
🔍 DEBUG: Movements from database (first 3):
  Movement 1: The Hundred
    voiceover_enabled: ???  ← Should be True (from Supabase)
    voiceover_url: ???      ← Should have URL
```

**Point B: After Building Sequence**
```
🔍 DEBUG: Final sequence (first 3 movements):
  Movement 1: The Hundred
    voiceover_enabled: ???  ← Did .copy() preserve it?
    voiceover_url: ???      ← Is URL still there?
```

**Three Possible Scenarios:**

1. **Scenario A:** Database returns `false` (Supabase query issue)
2. **Scenario B:** Database returns `true` but sequence has `false` (sequence_tools.py issue)
3. **Scenario C:** Sequence has `true` but frontend gets `false` (serialization/mapping issue)

---

## 🎯 **EXPECTED OUTCOME**

Once we see the backend logs, we'll know EXACTLY where to fix:

- If **Scenario A:** Issue with Supabase query (unlikely - we verified API works)
- If **Scenario B:** Issue with `.copy()` or sequence building (MOST LIKELY)
- If **Scenario C:** Issue with JSON serialization or frontend mapping

Then we fix it, deploy, test, and voiceover will work!

---

## 📁 **KEY FILES**

**Documentation:**
- Full details: `VOICEOVER_DEBUG_SESSION.md`
- This quick start: `VOICEOVER_NEXT_SESSION_QUICK_START.md`

**Backend:**
- Debug logging: `backend/orchestrator/tools/sequence_tools.py` lines 184-192, 305-314

**Frontend:**
- Debug logging: `frontend/src/components/class-playback/ClassPlayback.tsx` lines 175-184
- Console output: `Console.txt`

---

## 🚀 **THE FIX (Once We Identify Location)**

Based on where TRUE→FALSE happens, we'll likely need to:

1. **Ensure `.copy()` preserves all fields** in sequence_tools.py
2. **OR explicitly copy voiceover fields** when building sequence
3. **OR fix JSON serialization** to include voiceover fields

Example fix (if in sequence_tools.py):
```python
# Current code:
selected_copy = selected.copy()
selected_copy["duration_seconds"] = teaching_time_seconds
selected_copy["type"] = "movement"

# Potential fix (if .copy() drops fields):
selected_copy = {
    **selected,  # Spread all fields from original
    "duration_seconds": teaching_time_seconds,
    "type": "movement"
}
```

But we won't know exact fix until we see the logs!

---

**Bottom Line:** Backend logs will pinpoint the exact line where TRUE becomes FALSE. Then it's a simple fix!
