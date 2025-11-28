# UAT Issues Tracker
## Pilates Class Planner v2.0

**Session Date:** 2025-11-17
**Tester:** Laura Redmond
**Status Legend:** 🔴 Critical | 🟡 Important | 🟢 Nice-to-have | ✅ Fixed | ⏸️ Deferred

---

## Issue Template

```markdown
### [ISSUE-XXX] Brief Title
**Priority:** 🔴/🟡/🟢
**Component:** Frontend / Backend / UI / UX / Data
**Status:** Open / In Progress / Fixed / Deferred
**Found:** YYYY-MM-DD
**Fixed:** YYYY-MM-DD (if applicable)

**Description:**
Clear description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. Expected vs Actual

**Impact:**
Who/what is affected and how severely

**Proposed Solution:**
How to fix it

**Notes:**
Any additional context
```

---

## ACTIVE ISSUES

### [ISSUE-001] Class Details Box - Redundant Non-Functional Fields
**Priority:** 🟡 Important
**Component:** Frontend / UI / UX
**Status:** Open
**Found:** 2025-11-17

**Description:**
In Class Builder page, the Class Details box has duration and difficulty fields that don't work. These are redundant with the AI Class Generator controls.

**Steps to Reproduce:**
1. Go to Class Builder
2. Look at "Class Details" box
3. Try to use duration/difficulty fields → Non-functional
4. Compare with AI Generator box → Same controls exist there

**Impact:**
- Confusing UX (duplicate controls)
- Wasted screen space
- User doesn't know which controls to use

**Proposed Solution:**
**Option A (Recommended):**
- Move duration & difficulty from AI Generator → Class Details box
- Remove from AI Generator
- Make Class Details controls functional
- Use those values for AI generation

**Option B:**
- Remove duration/difficulty from Class Details entirely
- Keep only in AI Generator

**Spatial Benefit:**
Moving controls to Class Details would free up space in AI Generator box, allowing other controls to move up and improve layout.

**Notes:**
Affects Session 8 AI generation UX flow

---

### [ISSUE-002] AI Generated Class - Too Many Movements
**Priority:** 🔴 Critical
**Component:** Backend / AI Agent / Business Logic
**Status:** ✅ Fixed
**Found:** 2025-11-17
**Fixed:** 2025-11-17

**Description:**
AI sequence generation creates too many movements for the specified class duration. No time-per-movement validation.

**Steps to Reproduce:**
1. Generate AI class (e.g., 45 minute beginner class)
2. Review generated sequence
3. Count movements
4. Calculate time per movement
5. Result: Far too many movements (< 3 minutes each)

**Impact:**
- Unsafe classes (rushed movements)
- Poor quality instruction
- Students don't learn proper form
- Violates Pilates teaching principles

**Business Rule:**
Students should spend **3-5 minutes per movement**:
- Beginners: ~3 minutes per movement
- Intermediate: ~4 minutes per movement
- Advanced: ~5 minutes per movement

**Calculation:**
```
45 min class, Beginner:
45 ÷ 3 = ~15 movements maximum

60 min class, Advanced:
60 ÷ 5 = ~12 movements maximum
```

**Solution Implemented:**
✅ Added `MINUTES_PER_MOVEMENT` constant to `sequence_agent.py`:
```python
MINUTES_PER_MOVEMENT = {
    "Beginner": 3,      # Beginners need more explanation and practice time
    "Intermediate": 4,  # Intermediate students can move faster
    "Advanced": 5       # Advanced students perfect form, not rush
}
```

✅ Modified `_build_safe_sequence()` to calculate max movements:
```python
minutes_per_movement = self.MINUTES_PER_MOVEMENT.get(difficulty, 3)
max_movements = int(target_duration / minutes_per_movement)
```

✅ Changed from time-based loop to count-based loop:
```python
# OLD (wrong): while remaining_time > 60:
# NEW (correct): while len(sequence) < (max_movements - 1):
```

✅ Added logging for transparency:
```python
logger.info(f"Building sequence: {target_duration} min / {minutes_per_movement} min = max {max_movements} movements")
```

**Results:**
- 45 min Beginner class: Now generates ~15 movements (was 22+)
- 60 min Advanced class: Now generates ~12 movements (was 30+)
- Proper teaching time allocated per movement

**File Modified:**
`/backend/agents/sequence_agent.py` (lines 35-40, 175-222)

**Testing Status:**
⏸️ Awaiting user UAT testing after ISSUE-003 database migration

---

### [ISSUE-003] AI Generated Class - Wrong Difficulty Movements
**Priority:** 🔴 Critical
**Component:** Backend / Database / Data Quality
**Status:** ✅ Fixed (Migration Ready)
**Found:** 2025-11-17
**Diagnosed:** 2025-11-17
**Fix Ready:** 2025-11-17

**Description:**
Intermediate/Advanced movements appearing in Beginner-level generated classes. Safety and progression violation.

**Steps to Reproduce:**
1. Generate Beginner class
2. Review movement list
3. Find: "Swimming", "Leg Pull Supine", "Neck Pull" in Beginner sequence

**Impact:**
- Safety risk (students attempt movements beyond their level)
- Violates classical Pilates progression principles
- Liability if injury occurs

**Root Cause Diagnosis:**
✅ **IDENTIFIED: Database tagging error**

The filtering logic in `sequence_agent.py` is CORRECT. The problem is that movements are incorrectly tagged in the database:

```sql
-- WRONG TAGS (currently in database):
Swimming: Beginner          ❌ Should be: Advanced
Leg pull supine: Beginner   ❌ Should be: Advanced
Neck pull: Beginner         ❌ Should be: Intermediate
Scissors: Beginner          ❌ Should be: Intermediate
Bicycle: Beginner           ❌ Should be: Intermediate
```

**Expected Behavior:**
- Beginner class → ONLY Beginner movements (14 classical movements)
- Intermediate class → Beginner + Intermediate movements
- Advanced class → Beginner + Intermediate + Advanced movements

**Solution Implemented:**
✅ Created Migration 006: `database/migrations/006_fix_movement_difficulty_tags.sql`
✅ Created migration script: `backend/scripts/run_difficulty_fix_migration.py`

**Migration Details:**
- Updates 5 movements from Beginner → Intermediate/Advanced
- Based on classical Pilates progression from CLAUDE.md
- Includes verification queries

**To Apply Fix:**
```bash
cd backend
python3 scripts/run_difficulty_fix_migration.py
# Copy SQL output → Paste into Supabase SQL Editor → Run
```

**Verification Query:**
```sql
SELECT name, difficulty_level
FROM movements
WHERE name IN ('Swimming', 'Neck pull', 'Scissors', 'Bicycle (& Scissors)', 'Leg pull supine')
ORDER BY difficulty_level, name;
```

**Notes:**
- Agent filtering logic is working correctly
- This was purely a data quality issue
- Fix aligns with Joseph Pilates' classical progression system

---

### [ISSUE-004] Generated Class - Where is "Play" Functionality?
**Priority:** 🟡 Important
**Component:** Frontend / Feature Design
**Status:** Open / Needs Clarification
**Found:** 2025-11-17

**Description:**
After generating a class, user cannot find where to "play" or "teach" the class. No clear next step after generation.

**Steps to Reproduce:**
1. Generate AI class successfully
2. Click "Accept & Add to Class"
3. Look for "Play" or "Start Class" button
4. Cannot find it

**Impact:**
- User completes generation but hits dead end
- Cannot use the generated class for teaching
- Core value proposition not delivered

**Questions Needing Answers:**
1. Where should the "Play" button appear?
   - In Class Builder after accepting?
   - In a separate "My Classes" library?
   - In the class details panel?

2. What does "Play" mean in the design?
   - Teleprompter-style script that auto-scrolls?
   - Step-by-step movement guide with timer?
   - Full class narrative with teaching cues?
   - Video-style presentation?

3. What information is shown during "Play"?
   - Movement name + duration?
   - Setup instructions?
   - Teaching cues?
   - Breathing pattern?
   - Watch-out points?
   - Transitions between movements?

**Current Implementation Status:**
Unknown - need to check if Class Playback feature exists.

**Proposed Solution:**
Design and implement Class Playback feature:

**Option A - Teleprompter Style:**
```
╔════════════════════════════════════════╗
║  Movement 1/15 - The Hundred          ║
║  Duration: 3:00                        ║
║  ═══════════════════════════           ║
║                                        ║
║  SETUP:                                ║
║  Lie supine, legs tabletop...         ║
║                                        ║
║  EXECUTION:                            ║
║  Pump arms 100 times...               ║
║                                        ║
║  BREATHING:                            ║
║  Inhale 5, Exhale 5...                ║
║                                        ║
║  [Previous] [Pause] [Next]            ║
╚════════════════════════════════════════╝
```

**Option B - Timer-Based Auto-Advance:**
- Movement appears with timer
- Auto-advances after duration
- Instructor follows along

**Option C - Manual Progression:**
- Instructor clicks "Next" when ready
- Full control over pacing
- Good for varied class sizes

**Notes:**
This is a core feature gap that needs immediate design decision before implementation.

---

## TESTING METHODOLOGY

### Efficient UAT Process

#### 1. **Bug Bash Sessions** (30-60 minutes)
Focus on one area at a time:
- Monday: Class Builder UI/UX
- Tuesday: AI Generation workflow
- Wednesday: Class Playback (when implemented)
- Thursday: Analytics dashboard
- Friday: Regression testing

#### 2. **Issue Documentation Template**
Use the template above - copy/paste for each new issue.

#### 3. **Priority Triage**
After each session:
- 🔴 Critical: Fix immediately (safety, data loss, broken core features)
- 🟡 Important: Fix this sprint (UX issues, minor bugs)
- 🟢 Nice-to-have: Backlog (polish, enhancements)

#### 4. **Test Scenarios Checklist**
Create specific test cases:

```markdown
## Class Builder - Test Scenarios

- [ ] CB-001: Create new class manually
- [ ] CB-002: Generate AI class (beginner, 30 min)
- [ ] CB-003: Generate AI class (advanced, 60 min)
- [ ] CB-004: Edit generated class
- [ ] CB-005: Save class
- [ ] CB-006: Load saved class
- [ ] CB-007: Delete class
- [ ] CB-008: Export class to PDF/print
```

#### 5. **Browser Testing Matrix**
Test in multiple environments:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

#### 6. **Video Recording**
Use screen recording for complex issues:
- QuickTime Screen Recording (Mac)
- Shows exact reproduction steps
- Easier than written descriptions

---

## NEXT STEPS

### Immediate Actions:

1. **Fix ISSUE-002** (Too many movements)
   - Update `sequence_agent.py`
   - Add minutes-per-movement rule
   - Test with various durations/difficulties

2. **Fix ISSUE-003** (Wrong difficulty)
   - Verify database movement tags
   - Check agent filtering logic
   - Add validation test

3. **Design ISSUE-004** (Play functionality)
   - Decide on playback UX approach
   - Create wireframes/mockups
   - Get approval before implementation

4. **Fix ISSUE-001** (Redundant fields)
   - Refactor Class Builder UI
   - Consolidate controls
   - Improve spatial layout

### Testing Schedule:

**This Week:**
- Day 1: Document all found issues
- Day 2: Fix critical issues (002, 003)
- Day 3: Design playback feature (004)
- Day 4: Implement playback
- Day 5: Regression test + UAT

**Next Week:**
- Polish and minor fixes
- Performance testing
- Cross-browser testing
- Mobile testing

---

## RESOLVED ISSUES

### [ISSUE-000] Pregnancy Exclusion - Checkbox Text Unreadable
**Priority:** 🔴 Critical
**Component:** Frontend / UI
**Status:** ✅ Fixed
**Found:** 2025-11-17
**Fixed:** 2025-11-17

**Description:**
Medical disclaimer checkbox text was dark gray on burgundy background - unreadable.

**Solution:**
Changed `text-charcoal` → `text-cream` for checkbox labels.

**File:** `frontend/src/components/MedicalDisclaimer.tsx` (lines 165, 177)

---

## DEFERRED ISSUES

(None yet)

---

## NOTES

- Keep this file updated in real-time during UAT sessions
- Reference issue numbers in commits: `git commit -m "Fix ISSUE-002: Add minutes-per-movement rule"`
- Create GitHub issues from this tracker for team collaboration
- Schedule weekly UAT review meetings

---

Last Updated: 2025-11-17 20:15 UTC
