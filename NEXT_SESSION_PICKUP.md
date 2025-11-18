# Next Session Pickup - SoundCloud Music Integration + Playback Testing

**Date Created:** 2025-11-17 21:50 UTC
**Last Updated:** 2025-11-18 21:50 UTC
**Session:** Session 10 → Session 11
**Status:** Deployment Complete - Ready for SoundCloud Integration & Testing

---

## Quick Start

**Primary Task:** Integrate SoundCloud music playback into class playback feature (ESSENTIAL ENHANCEMENT).

**User Requirement:** "Music integration is essential to my offering, not optional."

**Recommended Approach:** Option 3 - Pre-curated SoundCloud playlists
- Fast implementation (1-2 hours)
- No authentication complexity
- Professional, controlled music experience
- You curate playlists for each music style ahead of time

**Implementation Steps:**
1. Create SoundCloud account and 9 playlists (one per music style)
2. Integrate SoundCloud Widget API into ClassPlayback component
3. Map music styles to playlist URLs
4. Test playback during movements and cool-down
5. Add volume controls (optional)

---

## Session 10 Accomplishments (2025-11-18)

### ✅ Deployment & Infrastructure
- **Backend:** Deployed to Render.com (https://pilates-class-generator-api3.onrender.com)
- **Frontend:** Deployed to Netlify (https://basslinemvp.netlify.app)
- **Render Upgrade:** Switched to Starter tier ($9/month) - **No more spin-down issues**
- **CORS Fixed:** Netlify can now communicate with Render backend
- **TypeScript Errors:** All frontend build errors resolved
- **Security:** Removed exposed Supabase credentials from git
- **Database:** Created `ai_decision_log` table for EU AI Act compliance

### ✅ Performance Improvements
- **Backend response time:** ~3-4 seconds (down from ~5-6s)
- **No more failed database inserts:** `ai_decision_log` table now exists
- **Always-on backend:** Render Starter tier eliminates 30-second spin-down delays

### ✅ UI Updates
- **Home Page:** Updated narrative to emphasize "progress quickly" and "competence"
- **Medical Disclaimer:** Mobile-responsive (iPhone tested)

### 🎓 Learning: Backend Troubleshooting
- **Lesson:** When backend is unresponsive, check logs first to distinguish:
  - Spin-down wake-up (30-60s delay, expected on free tier)
  - Actual crash (persistent timeout, requires code fix)
- **Solution:** Upgraded to paid tier ($9/month) to eliminate spin-down entirely

---

## Current State (What's Complete)

### ✅ Class Generator UI (Simplified)
- **Title:** "Class Generator" (removed "AI")
- **Fields:**
  - Class Duration (dropdown)
  - Difficulty Level (dropdown)
  - Enable MCP Research (checkbox)
- **Music Selection:**
  - Movement Music dropdown (9 options: Ambient, Meditation, Chillout, etc.)
  - Cool Down Music dropdown (9 options: Baroque, Classical, Romantic, etc.)
- **Generate Complete Class** button with play icon (▶)
- **Start Class** placeholder section (disabled, waiting for implementation)

### ✅ AI-Generated Class Display (APPROVED BASELINE)
- **Git Baseline:** Commit `a53672e`
- **Visual Regression Doc:** `/VISUAL_REGRESSION_BASELINE.md`
- **Features:**
  - Movement count: Shows "9 Movements" with "8 transitions" below
  - Transitions displayed inline with distinct styling (light background, italic, left border accent)
  - Muscle balance from database (actual muscle group names)
  - Duration showing teaching time (4:00 for Beginner movements)
  - Balance score calculated correctly (no NaN)

### ✅ Backend Fixes Complete
- Movement durations: 4/5/6 min (Beginner/Intermediate/Advanced)
- Transition time: 1 min between movements
- Movement count calculation: `(duration + 1) / (time_per_movement + 1)`
- Muscle usage: Database-driven (movement_muscles table)
- API returns: `movement_count`, `transition_count`, `total_items`

### ✅ Documentation
- `/VISUAL_REGRESSION_BASELINE.md` - Visual specs for regression testing
- `/UAT_FIXES_ROUND2_2025-11-17.md` - Complete fix documentation
- `/UAT_ISSUES_TRACKER.md` - Issue tracking
- `/FIXES_COMPLETED_2025-11-17.md` - Round 1 fixes

---

## ✅ Frontend Components Completed Early (2025-11-17 22:00 UTC)

**Note:** These components were created ahead of schedule to avoid duplication. They are ready for testing.

### Created Files:
1. **`/frontend/src/components/class-playback/ClassPlayback.tsx`** ✅ CREATED
   - Main playback component with timer logic
   - Auto-advance functionality
   - State management for currentIndex, isPaused, timeRemaining
   - Exit confirmation modal
   - Progress bar visualization
   - Handles onComplete and onExit callbacks

2. **`/frontend/src/components/class-playback/TimerDisplay.tsx`** ✅ CREATED
   - Digital countdown timer (MM:SS format)
   - Linear progress bar
   - Shows "X of Y" progress indicator
   - Time remaining visualization

3. **`/frontend/src/components/class-playback/MovementDisplay.tsx`** ✅ CREATED
   - Movement card with name, difficulty, primary muscles
   - Transition card with narrative and position flow
   - Setup instructions section (ready for backend data)
   - Teaching cues section (ready for backend data)
   - Breathing pattern section (ready for backend data)
   - Distinct styling for movements vs transitions

4. **`/frontend/src/components/class-playback/PlaybackControls.tsx`** ✅ CREATED
   - Previous button (disabled when at first item)
   - Pause/Resume button (toggles icon)
   - Next button (disabled when at last item)
   - Clean button styling matching app design

### Modified Files:
1. **`/frontend/src/components/class-builder/ai-generation/GenerationForm.tsx`** ✅ MODIFIED
   - Added `onPlayClass` prop
   - Added `hasGeneratedClass` prop
   - Play Class button now enabled after generation
   - Button styling changes based on state

2. **`/frontend/src/components/class-builder/AIGenerationPanel.tsx`** ✅ MODIFIED
   - Added `isPlayingClass` state
   - Added `handlePlayClass()`, `handleExitPlayback()`, `handleCompletePlayback()`
   - Transform results to `PlaybackItem[]` format
   - Conditionally render ClassPlayback component
   - Hide GeneratedResults modal when playback is active

### TypeScript Interfaces Created:
```typescript
export interface PlaybackMovement {
  type: 'movement';
  id?: string;
  name: string;
  duration_seconds: number;
  setup_instructions?: string;  // TODO: Backend to provide
  teaching_cues?: string[];      // TODO: Backend to provide
  breathing_pattern?: string;    // TODO: Backend to provide
  difficulty_level?: string;
  primary_muscles?: string[];
}

export interface PlaybackTransition {
  type: 'transition';
  narrative: string;
  duration_seconds: number;
  from_position?: string;
  to_position?: string;
}

export type PlaybackItem = PlaybackMovement | PlaybackTransition;
```

### What Works Now:
- ✅ Play Class button appears after generating a class
- ✅ Click Play Class to launch full-screen playback
- ✅ Timer counts down from movement duration (e.g., 4:00)
- ✅ Auto-advances to next item when timer reaches 0
- ✅ Pause/Resume toggle works
- ✅ Previous/Next navigation works (with proper disabled states)
- ✅ Exit confirmation modal (if in progress)
- ✅ Progress bar shows overall class progress
- ✅ Transitions display with distinct styling
- ✅ Music style info shown (placeholder for SoundCloud)

### What Still Needs Work:
- ⚠️ **Teaching cues not showing** - Backend doesn't return `setup_instructions`, `teaching_cues`, or `breathing_pattern` yet
- ⚠️ **Backend API endpoints** - No playback-specific endpoints created yet (not required for MVP)
- ⚠️ **Class completion tracking** - No database logging of completed classes yet
- ⚠️ **Resume functionality** - No save/resume progress feature yet (nice-to-have)

---

## Next Task: Timer-Based Teleprompter "Play Class" Feature

### User Requirements (From Session 9)

**Goal:** Create a timed, narrated class playback experience with music integration.

**User's Choice:** "Option B - Timer-based auto-advance" from options discussed.

**Key Features:**
1. **Movement Display:**
   - Current movement shown prominently
   - Countdown timer (e.g., 4:00 for Beginner movement)
   - Auto-advance to next movement/transition when timer reaches 0
   - Teaching cues visible
   - Setup instructions
   - Breathing patterns

2. **Transitions:**
   - Display transition narrative
   - Show duration (1:00)
   - Auto-advance to next movement

3. **Controls:**
   - Previous button
   - Pause/Resume button
   - Next button (skip ahead)

4. **Music Integration (Placeholder):**
   - Movement music selection (from dropdown choice)
   - Cool down music selection (from dropdown choice)
   - Music should play in background (SoundCloud integration - future)

5. **Session Completion:**
   - Track completion
   - End-of-class summary

### Design Sketch Reference

See screenshot: `/Users/lauraredmond/Desktop/Screenshot 2025-11-17 at 21.30.50.png`
- User sketched "SELECT MUSIC" with "1. Movements" and "2. Cool down"
- User sketched "START CLASS" / "PLAY" section

---

## Implementation Plan (Multi-Agent Approach)

### ✅ Phase 1: Design (COMPLETED)
**Frontend Developer + UX Designer:**
- ✅ Design full-screen playback UI
- ✅ Movement display card layout
- ✅ Timer visualization
- ✅ Control buttons placement
- ✅ Transition display style
- ✅ Progress indicator

**Design Decisions Made:**
- ✅ Full-screen mode with fixed positioning (z-50)
- ✅ Digital countdown timer with linear progress bar
- ✅ Teaching cues in scrollable sections below movement name
- ✅ Exit confirmation modal if playback in progress

### ✅ Phase 2: Frontend Implementation (COMPLETED)
**Frontend Developer:**
- ✅ Create `ClassPlayback.tsx` component
- ✅ Timer logic with auto-advance
- ✅ Movement sequence iteration
- ✅ Pause/Resume functionality
- ✅ Previous/Next navigation
- ✅ Progress tracking
- ⚠️ Keyboard shortcuts (space to pause, arrows to navigate) - NOT IMPLEMENTED YET

**TypeScript Interfaces:**
```typescript
interface PlaybackState {
  currentIndex: number;
  isPaused: boolean;
  timeRemaining: number;
  movements: MovementItem[];
  transitions: TransitionItem[];
  movementMusicStyle: string;
  coolDownMusicStyle: string;
}

interface MovementItem {
  type: 'movement';
  name: string;
  duration_seconds: number;
  setup_instructions?: string;
  teaching_cues?: string[];
  breathing_pattern?: string;
  // ... other fields
}

interface TransitionItem {
  type: 'transition';
  narrative: string;
  duration_seconds: number;
  from_position: string;
  to_position: string;
}
```

### ⚠️ Phase 3: Backend Support (TODO - OPTIONAL FOR MVP)
**Backend Developer:**
- ⚠️ Enhance sequence generation API to return teaching cues
- ⚠️ Endpoint to log class completion (optional)
- ⚠️ Endpoint to track playback progress (optional, for resume later)

**API Enhancements Needed:**
```python
# Current: /api/agents/sequence
# Add these fields to response:
- setup_instructions: str
- teaching_cues: List[str]
- breathing_pattern: str

# Optional new endpoints:
POST /api/classes/{class_id}/complete
POST /api/classes/{class_id}/progress
```

**Note:** Frontend is ready to display teaching cues, but backend doesn't return them yet. This is the main gap.

### ✅ Phase 4: Integration (COMPLETED)
**Integration Tester:**
- ✅ Connect playback UI to generated class data
- ✅ Wire up "Play Class" button activation (enable after generation)
- ✅ Test data flow from generation → playback
- ⚠️ Test timer accuracy (NEEDS REAL USER TESTING)
- ⚠️ Test auto-advance transitions (NEEDS REAL USER TESTING)

### ⚠️ Phase 5: Testing (TODO - NEXT SESSION)
**QA Tester:**
- Test all playback controls
- Test timer countdown accuracy
- Test auto-advance functionality
- Test pause/resume behavior
- Test previous/next navigation
- Test edge cases (last movement, first movement)

**UAT Tester:**
- Test full class playback experience
- Verify teaching cues are clear and visible
- Check timer visibility
- Verify transitions display correctly
- Check overall usability

**Regression Tester:**
- Verify AI-generated class display still matches baseline commit `a53672e`
- Run visual regression checklist from `/VISUAL_REGRESSION_BASELINE.md`
- Ensure no regressions in existing features

**Security Auditor:**
- Review any new API endpoints
- Check for timer manipulation vulnerabilities
- Verify class data access permissions

---

## Music Integration (Future Enhancement)

**Phase 6: SoundCloud Integration (Future)**
- SoundCloud API authentication
- Search tracks by style/genre
- Play background music during playback
- Volume control
- Fade in/out between sections

**Note:** For initial implementation, focus on playback mechanics. Music can be added later.

---

## File Locations

### Frontend Files (ALREADY CREATED ✅):
- ✅ `frontend/src/components/class-playback/ClassPlayback.tsx` - Main playback component
- ✅ `frontend/src/components/class-playback/PlaybackControls.tsx` - Pause/Previous/Next buttons
- ✅ `frontend/src/components/class-playback/MovementDisplay.tsx` - Movement/transition display
- ✅ `frontend/src/components/class-playback/TimerDisplay.tsx` - Timer countdown and progress
- ✅ `frontend/src/components/class-builder/ai-generation/GenerationForm.tsx` - Play button enabled
- ✅ `frontend/src/components/class-builder/AIGenerationPanel.tsx` - Playback state management

### Backend Files (TODO - OPTIONAL):
- ⚠️ `backend/agents/sequence_agent.py` - ADD teaching cues to response
- ⚠️ `backend/api/classes.py` - ADD playback endpoints (optional)
- ⚠️ `backend/services/playback_service.py` - NEW playback logic (optional)

---

## Multi-Agent Workflow

### Session Start Prompt:
```
"I need to implement timer-based class playback functionality.
Please use multi-agent approach with the following specialized agents:
- Frontend Developer (design and implement UI)
- Backend Developer (API endpoints and logic)
- QA Tester (functional testing)
- UAT Tester (user experience validation)
- Integration Tester (data flow verification)
- Security Auditor (security review)
- Regression Tester (verify no regressions against baseline commit a53672e)

Start with design phase, then proceed through implementation, integration, and testing.
Refer to /NEXT_SESSION_PICKUP.md for full context."
```

---

## Important Constraints

1. **Visual Regression:** Any changes must NOT regress the approved "Your AI-Generated Class" display (baseline: commit `a53672e`)
2. **Database-Driven:** All muscle groups, transitions, and movements must come from Supabase tables
3. **Teaching Time:** Movement durations are teaching time (4/5/6 min), not exercise time
4. **Transition Display:** Transitions must remain visually distinct (light background, italic, left accent border)
5. **No Music Implementation Yet:** Focus on playback mechanics first, music integration is future enhancement

---

## Success Criteria

**Minimum Viable Playback (MVP):**
- [x] User can click "Play Class" after generating a class ✅ DONE
- [x] Playback shows current movement/transition ✅ DONE
- [x] Timer counts down automatically ✅ DONE
- [x] Auto-advances to next item when timer reaches 0 ✅ DONE (needs testing)
- [x] Pause/Resume works correctly ✅ DONE (needs testing)
- [x] Previous/Next navigation works ✅ DONE (needs testing)
- [x] User can exit playback and return to class builder ✅ DONE
- [ ] Visual regression tests pass (baseline `a53672e` intact) ⚠️ TODO
- [ ] Teaching cues display correctly ⚠️ BLOCKED (backend needs to return data)

**Nice-to-Have (Future):**
- [ ] Music playback from SoundCloud
- [ ] Save playback progress (resume later)
- [ ] Keyboard shortcuts
- [ ] Full-screen mode toggle
- [ ] Class completion certificate/summary

---

## Git Workflow

### Before Starting:
```bash
# Verify you're on clean state
git status

# Create feature branch
git checkout -b feature/timer-based-playback
```

### After Completion:
```bash
# Add changes
git add .

# Commit with descriptive message
git commit -m "feat: Timer-based class playback with auto-advance

- Add ClassPlayback component with timer and auto-advance
- Add playback controls (pause, previous, next)
- Add movement/transition display
- Add playback API endpoints
- Music selection integrated (placeholder for SoundCloud)
- Regression tested against baseline a53672e

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Resources

**Documentation:**
- `/VISUAL_REGRESSION_BASELINE.md` - Visual specs and regression checklist
- `/UAT_FIXES_ROUND2_2025-11-17.md` - Recent fixes reference
- `/CLAUDE.md` - Project architecture and guidelines

**Screenshots:**
- `/Users/lauraredmond/Desktop/Screenshot 2025-11-17 at 21.09.42.png` - Approved class display
- `/Users/lauraredmond/Desktop/Screenshot 2025-11-17 at 21.30.50.png` - Design sketch

**Git Baseline:**
- Commit `a53672e` - Visual regression baseline

**Servers:**
- Backend: http://localhost:8000
- Frontend: http://localhost:5174

---

## Questions to Address in Design Phase

1. **UI Layout:** Full-screen overlay or modal window?
2. **Timer Style:** Circular progress ring, linear bar, or digital countdown?
3. **Teaching Cues:** How to display teaching cues without overwhelming the user?
4. **Breathing Patterns:** Show continuously or on-demand?
5. **Progress Indicator:** Show overall class progress (e.g., "Movement 3 of 9")?
6. **Exit Behavior:** Confirm before exiting? Save progress?
7. **Mobile Responsive:** Should playback work on mobile or desktop only?

---

## Priority Tasks for Session 11

### **1. SoundCloud Music Integration (CRITICAL - ESSENTIAL FEATURE)** 🎵

**User Requirement:** "Music integration is essential to my offering, not optional."

**Approach: Option 3 - Pre-curated Playlists (Recommended)**

#### Step 1: Create SoundCloud Playlists (Pre-work - Do Before Session)
Create a SoundCloud account and build 9 playlists matching the music styles in the app:

**Movement Music Playlists:**
1. Ambient Pilates
2. Meditation Instrumentals
3. Chillout Beats
4. Lo-Fi Focus
5. Acoustic Calm
6. Piano Minimal

**Cool-Down Music Playlists:**
7. Baroque Classical
8. Classical Piano
9. Romantic Era

Each playlist should be 60+ minutes of curated, appropriate music.

#### Step 2: Implement SoundCloud Widget API (Session Work - 1-2 hours)

**Frontend Changes:**
```typescript
// 1. Add SoundCloud Widget script to index.html
<script src="https://w.soundcloud.com/player/api.js"></script>

// 2. Create music playlist mapping (frontend/src/utils/musicPlaylists.ts)
export const MUSIC_PLAYLISTS = {
  'Ambient': 'https://soundcloud.com/your-account/ambient-pilates',
  'Meditation': 'https://soundcloud.com/your-account/meditation-instrumentals',
  // ... 7 more playlists
};

// 3. Update ClassPlayback.tsx to include hidden iframe
<iframe
  id="sc-widget"
  src={`https://w.soundcloud.com/player/?url=${playlistUrl}`}
  width="0"
  height="0"
  style={{ display: 'none' }}
/>

// 4. Control playback with Widget API
const widget = SC.Widget('sc-widget');
useEffect(() => {
  widget.load(selectedPlaylistUrl);
  widget.play();
  widget.setVolume(50); // 50% volume
}, []);

// 5. Pause music when class is paused
useEffect(() => {
  if (isPaused) {
    widget.pause();
  } else {
    widget.play();
  }
}, [isPaused]);

// 6. Switch playlist for cool-down section
if (currentMovement.name === 'Final Meditation') {
  widget.load(coolDownPlaylistUrl);
}
```

**Files to Create/Modify:**
- ✅ `frontend/src/utils/musicPlaylists.ts` (NEW) - Playlist URL mappings
- ✅ `frontend/src/components/class-playback/ClassPlayback.tsx` (MODIFY) - Add iframe and widget control
- ✅ `frontend/public/index.html` (MODIFY) - Add SoundCloud Widget API script

**Testing Checklist:**
- [ ] Music starts playing when "Play Class" is clicked
- [ ] Music pauses when user pauses class
- [ ] Music resumes when user resumes
- [ ] Music switches from movement playlist to cool-down playlist
- [ ] Music volume is appropriate (not too loud)
- [ ] Music continues across movement transitions

**Time Estimate:** 1-2 hours (assuming playlists are pre-created)

---

### **2. User Testing (HIGH PRIORITY)**
- Generate a complete class in the UI
- Click "Play Class" button
- **Test music playback throughout class** 🎵
- Test timer countdown accuracy
- Test pause/resume functionality (including music pause)
- Test previous/next navigation
- Test auto-advance behavior
- Test exit confirmation modal
- Verify transitions display correctly

---

### **3. Backend Enhancement (MEDIUM PRIORITY)**
- Add teaching cues to sequence agent response
- Add setup instructions to movements
- Add breathing patterns to movements
- This will make the MovementDisplay component fully functional

---

### **4. Regression Testing (HIGH PRIORITY)**
- Verify "Your AI-Generated Class" modal still looks correct (baseline `a53672e`)
- Ensure no visual regressions in existing features
- Run through complete generation → review → playback flow
- **Test music doesn't break any existing functionality**

---

### **5. Optional Enhancements (LOW PRIORITY)**
- Volume slider control for music
- Mute button
- Keyboard shortcuts (space for pause, arrows for navigation)
- Class completion tracking in database
- Save/resume progress functionality

---

## Future Sessions Roadmap

### **Session 14-15: Audio Narration Prototype** 🎙️

**Approach:** Test with user's own voice recordings first (before committing to OpenAI TTS)

**User Requirement:** "I'd like to try a static audio prototype first, say using a recording from me - see how that works first"

**Why This Approach:**
- ✅ Validate UX (do users prefer audio vs text?)
- ✅ Test technical implementation (playback, volume ducking, timing)
- ✅ Try your own voice before AI TTS costs
- ✅ Faster iteration (no API integration needed)

**Implementation Plan:**
1. **Pre-work:** Record narration for 2-3 movements
   - Setup instructions
   - Teaching cues
   - Breathing patterns
   - Save as MP3 files

2. **Backend:** Upload audio files to Supabase Storage
   - Manual upload via dashboard
   - Associate audio URLs with movements in database

3. **Frontend:** Integrate audio playback into ClassPlayback
   - Play narration when movement starts
   - Pause/resume with timer
   - **Volume ducking:** Lower music to 30% during narration
   - Fade music back to 50% when narration ends

4. **Testing:**
   - Test audio quality and clarity
   - Test volume balance (music vs narration)
   - Test timing (does narration finish before movement ends?)
   - Get user feedback on experience

**If prototype succeeds → Session 16+: OpenAI TTS Integration**
- Replace manual recordings with AI-generated narration
- ~$0.18 per class, $18/month for 100 classes
- Multiple voice options (nova, alloy, shimmer)
- Automatic generation when class is created

**Time Estimate:** 2-3 hours (assuming audio files pre-recorded)

---

**Status:**
- ✅ Deployment complete (Render Starter + Netlify)
- ✅ Frontend playback UI ready for testing
- 🎵 **SoundCloud integration is next priority (ESSENTIAL FEATURE - Session 11)**
- 🎙️ **Audio narration prototype planned for Sessions 14-15**
- ⚠️ Backend teaching cues enhancement optional but recommended

**Pre-work Required:**
- **Session 11:** Create SoundCloud account and 9 curated playlists
- **Session 14-15:** Record narration audio for 2-3 test movements

---

Last Updated: 2025-11-18 22:00 UTC
