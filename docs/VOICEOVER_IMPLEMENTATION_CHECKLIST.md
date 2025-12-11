# Voiceover Implementation Checklist

**Purpose:** Step-by-step guide for adding voiceover support to ANY class section table

**Date Created:** December 8, 2025
**Session:** Voiceover Implementation for Class Sections

---

## 🎯 When You Add Voiceovers to a New Section

Use this checklist to ensure voiceover data flows correctly from database → backend → frontend → playback.

### ✅ Step 1: Database Schema (Supabase)

Add 3 columns to the target table:

```sql
ALTER TABLE <table_name>
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN <table_name>.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';
COMMENT ON COLUMN <table_name>.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';
COMMENT ON COLUMN <table_name>.voiceover_enabled IS 'Whether to play voiceover during class playback';
```

**Example tables:**
- ✅ `preparation_scripts`
- ✅ `warmup_routines`
- ✅ `transitions` (for transition narratives between movements)
- ✅ `cooldown_sequences`
- ✅ `closing_meditation_scripts`
- ✅ `closing_homecare_advice`

---

### ✅ Step 2: Backend Pydantic Model (class_sections.py)

Add voiceover fields to the Pydantic model:

```python
class <ModelName>(BaseModel):
    id: str
    # ... existing fields ...

    # Voiceover fields - ADD THESE
    voiceover_url: Optional[str] = None
    voiceover_duration: Optional[int] = None
    voiceover_enabled: Optional[bool] = False

    created_at: datetime
    updated_at: datetime
```

**Files:**
- `backend/api/class_sections.py` (lines 30-107)

**Models to update:**
- ✅ `PreparationScript`
- ✅ `WarmupRoutine`
- ✅ `CooldownSequence`
- ✅ `ClosingMeditationScript`
- ✅ `ClosingHomecareAdvice`

---

### ✅ Step 3: Frontend TypeScript Interface (ClassPlayback.tsx)

Add voiceover fields to the TypeScript interface:

```typescript
export interface Playback<SectionType> {
  type: '<section_type>';
  // ... existing fields ...

  // Voiceover audio - ADD THESE
  voiceover_url?: string;
  voiceover_duration?: number;
  voiceover_enabled?: boolean;
}
```

**File:**
- `frontend/src/components/class-playback/ClassPlayback.tsx` (lines 42-152)

**Interfaces to update:**
- ✅ `PlaybackPreparation`
- ✅ `PlaybackWarmup`
- ✅ `PlaybackTransition` (for transition narratives)
- ✅ `PlaybackCooldown`
- ✅ `PlaybackMeditation`
- ✅ `PlaybackHomeCare`

---

### ✅ Step 4: Voiceover Detection Logic (ClassPlayback.tsx)

**THIS IS ALREADY GENERIC!** ✅

The detection logic in `ClassPlayback.tsx` lines 189-208 uses type guards to detect voiceovers for ALL section types:

```typescript
const currentVoiceover =
  currentItem && 'voiceover_enabled' in currentItem && currentItem.voiceover_enabled
    ? currentItem.voiceover_url
    : undefined;
```

**No changes needed** - it automatically works for any PlaybackItem with voiceover fields.

---

### ✅ Step 5: Playback Item Mapping (AIGenerationPanel.tsx) ⚠️ CRITICAL!

**🚨 THIS IS THE STEP THAT WAS MISSING AND CAUSED THE BUG!**

When constructing `playbackItems` array, you MUST map the voiceover fields from backend data:

```typescript
// Section X: <Section Name>
{
  type: '<section_type>' as const,
  // ... existing field mappings ...

  // Voiceover audio fields - ADD THESE 3 LINES
  voiceover_url: (results as any).completeClass.<section>.voiceover_url,
  voiceover_duration: (results as any).completeClass.<section>.voiceover_duration,
  voiceover_enabled: (results as any).completeClass.<section>.voiceover_enabled || false,
},
```

**File:**
- `frontend/src/components/class-builder/AIGenerationPanel.tsx` (lines 237-338)

**Sections to update:**
- ✅ Preparation (lines 237-240)
- ✅ Warmup (lines 250-253)
- ✅ Transitions (lines 267-269) ⚠️ CRITICAL - map voiceover fields in transition conditional
- ✅ Movements (lines 281-283) ⚠️ Already updated
- ✅ Cooldown (lines 296-298)
- ✅ Meditation (lines 309-311)
- ✅ HomeCare (lines 332-335)

**Why This Step is Critical:**
- Backend returns voiceover data ✅
- TypeScript interface expects voiceover fields ✅
- But if you don't MAP the fields here, they'll be `undefined` in playback ❌

**Symptom if you forget this step:**
```
🔍 VOICEOVER DEBUG: {
  voiceoverEnabled: undefined,  // ❌ Should be true
  voiceoverUrl: undefined,      // ❌ Should be URL
  voiceoverDuration: undefined  // ❌ Should be seconds
}
```

---

## 📋 Complete Example: Adding Voiceover to Warmup

### 1. Database (Supabase SQL Editor)
```sql
ALTER TABLE warmup_routines
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;
```

### 2. Backend (class_sections.py)
```python
class WarmupRoutine(BaseModel):
    id: str
    routine_name: str
    # ... existing fields ...
    voiceover_url: Optional[str] = None          # NEW
    voiceover_duration: Optional[int] = None     # NEW
    voiceover_enabled: Optional[bool] = False    # NEW
    created_at: datetime
    updated_at: datetime
```

### 3. Frontend Interface (ClassPlayback.tsx)
```typescript
export interface PlaybackWarmup {
  type: 'warmup';
  routine_name: string;
  // ... existing fields ...
  voiceover_url?: string;        // NEW
  voiceover_duration?: number;   // NEW
  voiceover_enabled?: boolean;   // NEW
}
```

### 4. Playback Mapping (AIGenerationPanel.tsx) ⚠️ DON'T FORGET!
```typescript
// Section 2: Warm-up
{
  type: 'warmup' as const,
  routine_name: (results as any).completeClass.warmup.routine_name,
  narrative: (results as any).completeClass.warmup.narrative,
  // ... existing field mappings ...

  // Voiceover audio fields - MUST ADD THESE
  voiceover_url: (results as any).completeClass.warmup.voiceover_url,
  voiceover_duration: (results as any).completeClass.warmup.voiceover_duration,
  voiceover_enabled: (results as any).completeClass.warmup.voiceover_enabled || false,
},
```

### 5. Upload Voiceover & Update Database
```sql
UPDATE warmup_routines
SET
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/warmup-full-body.mp3',
  voiceover_duration = 180,  -- 3 minutes
  voiceover_enabled = true
WHERE routine_name = 'Full Body Activation';
```

### 6. Deploy & Test
1. Commit changes to GitHub
2. Wait for Render (backend) + Netlify (frontend) to deploy
3. Generate NEW class
4. Play class and check console for voiceover detection
5. Verify music ducks to 20% during voiceover

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: Only updating database + backend
**Problem:** Frontend won't receive the fields
**Fix:** Always update TypeScript interface too

### ❌ Mistake 2: Only updating interface, not playback mapping
**Problem:** Fields exist but are always `undefined`
**Fix:** Add mapping in AIGenerationPanel.tsx (Step 5)

### ❌ Mistake 3: Testing old saved classes
**Problem:** Old classes saved before voiceover columns existed
**Fix:** Always generate a NEW class after database changes

### ❌ Mistake 4: Forgetting to deploy backend
**Problem:** Pydantic model changes not live
**Fix:** Check Render dashboard for latest commit deployment

### ❌ Mistake 5: Wrong field name in mapping
**Problem:** Typo like `voiceover_url` vs `voiceover_duration_seconds`
**Fix:** Check backend Pydantic model for exact field names

---

## 🎯 Current Status (December 8, 2025)

### ✅ Fully Implemented (Database + Frontend)
- **Preparation Scripts**: All 5 steps complete + tested ✅
- **Warmup Routines**: Schema + interface ready, awaiting voiceover upload
- **Transitions**: Schema + interface ready, awaiting voiceover upload ✅ (December 11, 2025)
- **Cooldown Sequences**: Schema + interface ready, awaiting voiceover upload
- **Meditation Scripts**: Schema + interface ready, awaiting voiceover upload
- **HomeCare Advice**: Schema + interface ready, awaiting voiceover upload

### 📝 Next Steps
1. Run database migration 027 in Supabase (add voiceover columns to transitions)
2. Record 5 remaining voiceovers:
   - Warmup routines
   - Transitions (optional - can enhance position cueing)
   - Cooldown sequences
   - Meditation scripts
   - HomeCare advice
3. Upload to Supabase Storage
4. Update database with URLs/durations
5. Test each section during class playback

---

## 📞 Reference Files

**Database Migrations:**
- `database/migrations/016_add_voiceover_columns_to_class_sections.sql`
- `database/migrations/017_update_preparation_scripts.sql`
- `database/migrations/018_remove_unused_preparation_columns.sql`
- `database/migrations/027_add_voiceover_columns_to_transitions.sql` ✅ NEW (December 11, 2025)

**Backend Models:**
- `backend/api/class_sections.py` (Pydantic models lines 30-107)

**Frontend Interfaces:**
- `frontend/src/components/class-playback/ClassPlayback.tsx` (interfaces lines 42-152)
- `frontend/src/components/class-builder/AIGenerationPanel.tsx` (playback mapping lines 237-338)

**Documentation:**
- `docs/VOICEOVER_UPLOAD_GUIDE.md` (recording + upload instructions)
- `docs/VOICEOVER_IMPLEMENTATION_CHECKLIST.md` (this file)

---

## ✅ Verification Checklist

Before marking voiceover implementation complete, verify:

- [ ] Database columns added (voiceover_url, voiceover_duration, voiceover_enabled)
- [ ] Backend Pydantic model includes voiceover fields
- [ ] Frontend TypeScript interface includes voiceover fields
- [ ] AIGenerationPanel.tsx maps voiceover fields in playback items ⚠️ CRITICAL
- [ ] Voiceover file uploaded to Supabase Storage
- [ ] Database row updated with URL, duration, enabled=true
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Netlify
- [ ] NEW class generated (not old saved class)
- [ ] Console shows voiceover fields with values (not undefined)
- [ ] Voiceover plays during section
- [ ] Music ducks to 20% during voiceover
- [ ] Music returns to 100% after voiceover ends

---

**Remember:** The data transformation in AIGenerationPanel.tsx (Step 5) is the most commonly forgotten step. Always double-check it!
