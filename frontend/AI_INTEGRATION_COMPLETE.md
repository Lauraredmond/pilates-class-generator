# AI Generation Panel - API Integration Complete

## Summary of Changes

All 4 AI generation buttons in `AIGenerationPanel.tsx` have been successfully connected to the backend APIs.

### Files Modified

**Location:** `/Users/lauraredmond/Documents/Bassline/Projects/MVP2/frontend/src/components/class-builder/AIGenerationPanel.tsx`

### Changes Made

#### 1. **Imports Added**
- `agentsApi` from `../../services/api` - provides typed API calls to backend

#### 2. **State Management Improvements**
- Changed from single `isGenerating` boolean to `generatingAgent` state that tracks which specific agent is running
- Added proper Zustand store selectors for better performance
- Type: `'sequence' | 'music' | 'meditation' | 'research' | null`

#### 3. **API Handler: Generate Sequence**
```typescript
handleGenerateSequence()
- Calls: POST /api/agents/generate-sequence
- Payload: { target_duration_minutes, difficulty_level, strictness_level, include_mcp_research }
- Success: Updates Zustand store with generated sequence
- Displays movements in ClassBuilder
- Error handling: Shows user-friendly error messages
```

#### 4. **API Handler: Select Music**
```typescript
handleSelectMusic()
- Calls: POST /api/agents/select-music
- Payload: { class_duration_minutes, target_bpm_range, exclude_explicit }
- Success: Shows playlist created confirmation
- Future: Will be stored in class metadata
```

#### 5. **API Handler: Create Meditation**
```typescript
handleCreateMeditation()
- Calls: POST /api/agents/create-meditation
- Payload: { duration_minutes, class_intensity, focus_theme, include_breathing }
- Success: Shows meditation script generated confirmation
- Future: Will be displayed in modal/panel
```

#### 6. **API Handler: Research Cues**
```typescript
handleResearchCues()
- Calls: POST /api/agents/research-cues
- Payload: { research_type, movement_name, trusted_sources_only }
- Pre-check: Validates that movements exist in current class
- Success: Shows number of sources found
- Future: Will display research results in panel
```

#### 7. **Loading States**
- Each button shows its own loading spinner
- Button text changes when active:
  - "Generate Sequence" → "Generating..."
  - "Select Music" → "Selecting..."
  - "Create Meditation" → "Creating..."
  - "Research Cues" → "Researching..."
- All buttons disabled while any agent is running (prevents concurrent requests)

#### 8. **Error Handling**
- Catches both network errors and API errors
- Displays specific error messages from backend (response.data.detail)
- Falls back to generic messages if specific ones unavailable
- All errors logged to console for debugging
- User-friendly toast notifications for all error states

---

## Testing Instructions

### Prerequisites
1. Backend must be running on port 8000
2. Database must have movement data loaded

### Start the Application

```bash
# Terminal 1 - Backend (already running)
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2/backend
# Should already be running on port 8000

# Terminal 2 - Frontend
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2/frontend
npm run dev
# Opens on http://localhost:5173
```

### Test Each Feature

#### 1. Test Generate Sequence
1. Navigate to Class Builder page
2. Click "Generate Sequence" button
3. **Expected behavior:**
   - Button shows "Generating..." with spinner
   - Other buttons disabled
   - After 2-5 seconds, sequence appears in timeline
   - Success toast appears
   - Movements populate the sequence panel
4. **Check Network tab:**
   - POST to `http://localhost:8000/api/agents/generate-sequence`
   - Status: 200 OK
   - Response contains `success: true` and sequence data

#### 2. Test Select Music
1. Click "Select Music" button
2. **Expected behavior:**
   - Button shows "Selecting..." with spinner
   - After 1-3 seconds, success toast appears
   - Toast says "Playlist created with N tracks"
3. **Check Network tab:**
   - POST to `http://localhost:8000/api/agents/select-music`
   - Status: 200 OK
   - Response contains playlist data

#### 3. Test Create Meditation
1. Click "Create Meditation" button
2. **Expected behavior:**
   - Button shows "Creating..." with spinner
   - After 1-3 seconds, success toast appears
   - Toast says "Meditation script generated successfully!"
3. **Check Network tab:**
   - POST to `http://localhost:8000/api/agents/create-meditation`
   - Status: 200 OK
   - Response contains meditation script

#### 4. Test Research Cues
1. **First, ensure you have movements** (generate sequence first or manually add)
2. Click "Research Cues" button
3. **Expected behavior:**
   - Button shows "Researching..." with spinner
   - After 2-10 seconds (MCP may be slower), success toast appears
   - Toast says "Found N sources for [Movement Name]"
4. **Check Network tab:**
   - POST to `http://localhost:8000/api/agents/research-cues`
   - Status: 200 OK
   - Response contains research findings and sources

#### 5. Test Research Cues (No Movements)
1. Clear your sequence (if there's a clear button) or start fresh
2. Click "Research Cues" button
3. **Expected behavior:**
   - Info toast: "Please add movements to your class first"
   - No API call made

#### 6. Test Error Handling
1. Stop the backend server
2. Click any generation button
3. **Expected behavior:**
   - Error toast appears
   - Message: "Network Error" or "Failed to [action]"
   - Console shows error details

#### 7. Test Strictness Levels
1. Select "Strict" mode
2. Generate a sequence
3. Note the sequence characteristics
4. Clear sequence
5. Select "Autonomous" mode
6. Generate another sequence
7. Compare - should see different creativity levels

### Browser Console Checks

Open DevTools Console and look for:
- ✅ No TypeScript errors
- ✅ API request logs
- ✅ Response data logged (for music, meditation, research)
- ✅ Zustand state updates (if you have Redux DevTools)

### Network Tab Validation

For each request, verify:
- ✅ Request URL is correct
- ✅ Request payload matches expected format
- ✅ Response status is 200
- ✅ Response has `success: true`
- ✅ Response has `data` field with expected content

---

## Known Limitations

1. **Music & Meditation data not persisted yet**
   - Currently only logged to console
   - Future: Will be stored in class metadata

2. **Research results not displayed**
   - Currently only shows count in toast
   - Future: Will show in dedicated panel with sources

3. **No retry mechanism**
   - If request fails, user must click again
   - Future: Add automatic retry for network errors

4. **No progress indication for long-running tasks**
   - MCP research can take 10+ seconds
   - Future: Add progress bar or status messages

---

## API Endpoints Reference

### Generate Sequence
**Endpoint:** `POST /api/agents/generate-sequence`

**Request:**
```json
{
  "target_duration_minutes": 60,
  "difficulty_level": "Beginner",
  "strictness_level": "guided",
  "include_mcp_research": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sequence": [...movements],
    "total_duration_minutes": 60,
    "muscle_balance": {...},
    "validation": {...}
  }
}
```

### Select Music
**Endpoint:** `POST /api/agents/select-music`

**Request:**
```json
{
  "class_duration_minutes": 60,
  "target_bpm_range": [90, 130],
  "exclude_explicit": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playlist": [...tracks],
    "total_duration_seconds": 3600,
    "average_bpm": 110
  }
}
```

### Create Meditation
**Endpoint:** `POST /api/agents/create-meditation`

**Request:**
```json
{
  "duration_minutes": 5,
  "class_intensity": "moderate",
  "focus_theme": "mindfulness",
  "include_breathing": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "script": "...",
    "duration_minutes": 5,
    "theme": "mindfulness",
    "breathing_pattern": "..."
  }
}
```

### Research Cues
**Endpoint:** `POST /api/agents/research-cues`

**Request:**
```json
{
  "research_type": "movement_cues",
  "movement_name": "The Hundred",
  "trusted_sources_only": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "research_type": "movement_cues",
    "findings": {...},
    "sources": [...],
    "quality_score": 0.85
  }
}
```

---

## Troubleshooting

### Issue: "Failed to generate sequence"
**Possible causes:**
- Backend not running
- Database not initialized
- No movement data in database

**Solution:**
1. Check backend is running: `lsof -ti:8000`
2. Check backend logs for errors
3. Verify movements exist: `curl http://localhost:8000/api/movements/stats/summary`

### Issue: "Network Error"
**Possible causes:**
- Backend not running on port 8000
- CORS issues
- Firewall blocking requests

**Solution:**
1. Verify backend URL in `.env`: `VITE_API_URL=http://localhost:8000`
2. Check browser console for CORS errors
3. Verify backend allows localhost:5173 origin

### Issue: Research takes too long
**Possible causes:**
- MCP Playwright server not running
- Slow network connection
- Rate limiting

**Solution:**
1. Check MCP server status
2. Review backend logs for MCP errors
3. Consider increasing timeout in `api.ts` (currently 30s)

### Issue: Sequence not appearing in UI
**Possible causes:**
- Zustand store not updating
- Movement data format mismatch
- Component not re-rendering

**Solution:**
1. Check browser console for errors
2. Verify response data structure matches Movement interface
3. Check React DevTools for store state

---

## Next Steps (Future Enhancements)

1. **Display music playlist in UI**
   - Add music player component
   - Show track list with play buttons
   - Save to class metadata

2. **Display meditation script**
   - Create modal to show full script
   - Add copy-to-clipboard button
   - Allow editing before saving

3. **Display research results**
   - Create research panel component
   - Show sources with quality scores
   - Link to original sources
   - Highlight key findings

4. **Save all AI outputs to database**
   - Extend class plan model with music/meditation fields
   - Save research results for later review
   - Enable re-generation of any component

5. **Add retry mechanism**
   - Automatic retry on network errors
   - Manual retry button on error toast
   - Exponential backoff for rate limits

6. **Improve loading states**
   - Show percentage progress
   - Display current step (e.g., "Validating sequence...")
   - Add estimated time remaining

7. **Add validation before API calls**
   - Check required fields
   - Validate class duration is set
   - Warn if difficulty level not specified

---

## Success Criteria - All Met ✅

- ✅ All 4 buttons call real APIs
- ✅ Errors shown to user via toast notifications
- ✅ Loading states work with specific agent tracking
- ✅ Generated data appears in UI (sequence)
- ✅ No console errors
- ✅ No TypeScript errors in component
- ✅ Code matches existing style
- ✅ Burgundy/cream design preserved
- ✅ Zustand store used correctly
- ✅ Existing functionality not broken

---

## Code Quality

- **Type Safety:** All API calls properly typed
- **Error Handling:** Comprehensive try-catch blocks
- **User Feedback:** Toast notifications for all states
- **Loading States:** Per-button loading with text changes
- **Code Style:** Matches existing codebase conventions
- **Comments:** Clear inline documentation
- **No Breaking Changes:** All existing features still work

---

*Integration completed: 2025-11-17*
*Component: `/Users/lauraredmond/Documents/Bassline/Projects/MVP2/frontend/src/components/class-builder/AIGenerationPanel.tsx`*
