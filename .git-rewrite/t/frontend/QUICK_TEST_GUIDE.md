# Quick Test Guide - AI Generation Panel

## 🚀 Quick Start (30 seconds)

```bash
# 1. Start backend (if not running)
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2/backend
uvicorn api.main:app --reload --port 8000

# 2. Start frontend (new terminal)
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2/frontend
npm run dev

# 3. Open browser
# http://localhost:5173
```

## ✅ Quick Test Checklist

### Test 1: Generate Complete Class (2 minutes)
1. Navigate to Class Builder
2. In AI panel, click "Generate Complete Class"
3. Wait 3-5 seconds
4. ✅ Modal appears with 3 tabs
5. ✅ Sequence tab shows movements
6. ✅ Music tab shows playlist
7. ✅ Meditation tab shows script
8. Click "Accept"
9. ✅ Movements appear in timeline

### Test 2: Verify API Calls (1 minute)
1. Open DevTools → Network tab
2. Click "Generate Complete Class"
3. ✅ See 3 POST requests:
   - `/api/agents/generate-sequence`
   - `/api/agents/select-music`
   - `/api/agents/create-meditation`
4. ✅ All return 200 OK
5. ✅ All have `success: true`

### Test 3: Error Handling (1 minute)
1. Stop backend server
2. Click "Generate Complete Class"
3. ✅ Error toast appears
4. ✅ No crash
5. Restart backend
6. Click again
7. ✅ Works normally

### Test 4: Form Options (2 minutes)
1. Change duration to 45 minutes
2. Select "Advanced" difficulty
3. Check "Core" and "Legs" focus areas
4. Set BPM to 100-140
5. Move energy slider to 70%
6. Select "Body Scan" meditation
7. Enable MCP Research
8. Click generate
9. ✅ Results reflect your choices
10. Check Network → Request payload
11. ✅ All form values sent correctly

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Network Error" | Start backend: `uvicorn api.main:app --reload --port 8000` |
| No movements in result | Check database has data: `curl http://localhost:8000/api/movements/stats/summary` |
| Timeout error | Increase timeout in `src/services/api.ts` or disable MCP research |
| TypeScript errors | These are in other files, ignore for now |
| Modal doesn't appear | Check browser console for errors |

## 📊 What to Check

### Browser Console
✅ No errors (except unrelated ones)
✅ API responses logged
✅ Success/error messages

### Network Tab
✅ 3 concurrent requests
✅ All return within 5 seconds
✅ Response data populated

### UI Behavior
✅ Loading spinner shows
✅ Button disabled during generation
✅ Modal appears on success
✅ Toast notifications work
✅ Accept adds to timeline
✅ Cancel closes modal
✅ Regenerate creates new results

## 🎯 Success Criteria

After testing, you should see:

- [x] Generate button works
- [x] All 3 API endpoints called
- [x] Results modal displays
- [x] Sequence data shown
- [x] Music playlist shown
- [x] Meditation script shown
- [x] Accept adds to class
- [x] Error handling works
- [x] Loading states work
- [x] Toast notifications work

## 🔧 Debug Commands

```bash
# Check backend is running
lsof -ti:8000

# Check frontend is running
lsof -ti:5173

# Test backend directly
curl http://localhost:8000/api/agents/agent-info

# Test sequence generation
curl -X POST http://localhost:8000/api/agents/generate-sequence \
  -H "Content-Type: application/json" \
  -d '{"target_duration_minutes":60,"difficulty_level":"Beginner","strictness_level":"guided"}'

# Check backend logs
tail -f logs/app.log
```

## 📞 Need Help?

1. Check browser console
2. Check network tab
3. Check backend logs
4. Review `API_INTEGRATION_SUMMARY.md`
5. Review `AI_INTEGRATION_COMPLETE.md`

---

**Happy Testing!** 🎉
