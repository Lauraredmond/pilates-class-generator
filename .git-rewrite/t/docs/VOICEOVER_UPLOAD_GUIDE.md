# Voiceover Upload & Configuration Guide

**Date:** December 8, 2025
**Version:** 1.0
**Session:** Voiceover Implementation for Class Sections

---

## 📋 Overview

This guide explains how to record, upload, and configure voiceovers for all 6 Pilates class sections:

1. **Preparation Scripts** (4 items)
2. **Warmup Routines** (4 items)
3. **Cooldown Sequences** (3 items)
4. **Closing Meditation Scripts** (3 items)
5. **Closing HomeCare Advice** (3 items)

Total: **17 voiceover files** (one per database row)

**Initial Implementation:** Record just 1 voiceover per table (5 total files)
**Future Enhancement:** Add more variety by recording additional voiceovers

---

## 🎙️ Recording Settings (Audacity)

### Recommended Export Settings

**File Format:** MP3
**Channels:** Mono (voice doesn't need stereo)
**Sample Rate:** 22050 Hz (half of 44100 - clear for speech)
**Quality (Bitrate):** 145 kbps (medium quality)

### Why These Settings?

| Setting | Value | Reason |
|---------|-------|--------|
| Format | MP3 | Universal compatibility (M4A can have browser issues) |
| Sample Rate | 22050 Hz | 50% smaller file size, speech still crystal clear |
| Bitrate | 145 kbps | Optimized for voice (256 kbps is overkill) |
| Channels | Mono | Voice doesn't need stereo, saves 50% space |

### File Size Estimates

| Duration | File Size @ 145 kbps | Monthly Bandwidth (100 users) |
|----------|----------------------|-------------------------------|
| 3 minutes | ~3.3 MB | ~330 MB |
| 4 minutes | ~4.4 MB | ~440 MB |
| 5 minutes | ~5.5 MB | ~550 MB |

**Supabase Free Tier:** 1 GB storage ✅
**Total for 17 files (~4 min each):** ~75 MB (7.5% of free tier)

---

## 📂 File Naming Convention

Use descriptive names that match the database content:

### Preparation Scripts
```
preparation-centering-principles.mp3
preparation-breath-awareness.mp3
preparation-body-alignment.mp3
preparation-mind-body-connection.mp3
```

### Warmup Routines
```
warmup-full-body-beginner.mp3
warmup-spine-mobility.mp3
warmup-hip-opening.mp3
warmup-shoulder-activation.mp3
```

### Cooldown Sequences
```
cooldown-gentle-stretch.mp3
cooldown-moderate-recovery.mp3
cooldown-deep-release.mp3
```

### Meditation Scripts
```
meditation-body-scan.mp3
meditation-gratitude.mp3
meditation-breath-awareness.mp3
```

### HomeCare Advice
```
homecare-spine-care.mp3
homecare-injury-prevention.mp3
homecare-recovery-tips.mp3
```

---

## ☁️ Upload to Supabase Storage

### Step 1: Access Supabase Storage

1. Go to https://supabase.com/dashboard
2. Select your project: **Pilates Class Generator**
3. Click **Storage** in left sidebar
4. Find the bucket where audio files are stored

### Step 2: Upload Voiceover Files

1. Click **Upload File** button
2. Select your MP3 file
3. Confirm upload
4. **Copy the public URL** (you'll need this for the database)

**Example URL:**
```
https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/audio/preparation-centering-principles.mp3
```

### Step 3: Get File Duration

**Option A: Manual Timing**
```
1. Play the file in Audacity
2. Note the duration in seconds (e.g., 247 seconds)
```

**Option B: Use Audacity**
```
1. Open MP3 in Audacity
2. Look at bottom-right: shows total duration
3. Convert to seconds (4:07 = 247 seconds)
```

---

## 🗄️ Update Database

### Step 1: Run Migration (One-Time)

Execute migration 016 in Supabase SQL Editor:

```sql
-- Located at: database/migrations/016_add_voiceover_columns_to_class_sections.sql
-- Adds voiceover_url, voiceover_duration, voiceover_enabled columns to all 5 tables
```

### Step 2: Update Row with Voiceover

**Example: Add voiceover to "Centering and Principles" preparation script**

```sql
-- 1. Find the row ID
SELECT id, script_name
FROM preparation_scripts
WHERE script_name = 'Centering and Principles';

-- 2. Update with voiceover info
UPDATE preparation_scripts
SET
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/audio/preparation-centering-principles.mp3',
  voiceover_duration = 247,  -- Duration in seconds
  voiceover_enabled = true   -- Enable playback
WHERE script_name = 'Centering and Principles';
```

### Step 3: Verify Update

```sql
SELECT script_name, voiceover_url, voiceover_duration, voiceover_enabled
FROM preparation_scripts
WHERE voiceover_enabled = true;
```

---

## 📋 Complete Update Templates

### Preparation Scripts Table

```sql
UPDATE preparation_scripts
SET
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/audio/[filename].mp3',
  voiceover_duration = [duration_in_seconds],
  voiceover_enabled = true
WHERE script_name = '[script_name]';
```

### Warmup Routines Table

```sql
UPDATE warmup_routines
SET
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/audio/[filename].mp3',
  voiceover_duration = [duration_in_seconds],
  voiceover_enabled = true
WHERE routine_name = '[routine_name]';
```

### Cooldown Sequences Table

```sql
UPDATE cooldown_sequences
SET
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/audio/[filename].mp3',
  voiceover_duration = [duration_in_seconds],
  voiceover_enabled = true
WHERE sequence_name = '[sequence_name]';
```

### Meditation Scripts Table

```sql
UPDATE closing_meditation_scripts
SET
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/audio/[filename].mp3',
  voiceover_duration = [duration_in_seconds],
  voiceover_enabled = true
WHERE script_name = '[script_name]';
```

### HomeCare Advice Table

```sql
UPDATE closing_homecare_advice
SET
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/audio/[filename].mp3',
  voiceover_duration = [duration_in_seconds],
  voiceover_enabled = true
WHERE advice_name = '[advice_name]';
```

---

## 🧪 Testing Voiceovers

### Step 1: Generate AI Class

1. Log in to https://basslinemvp.netlify.app
2. Go to **Class Builder**
3. Click **Generate with AI**
4. Fill in class parameters
5. Generate class

### Step 2: Play Class

1. Click **Accept & Add to Library**
2. Navigate to saved class
3. Click **Play** button
4. Watch for preparation section

### Step 3: Verify Voiceover

**Console Logs (Check Browser DevTools):**
```
🔍 VOICEOVER DEBUG: {
  currentItemType: "preparation",
  currentItemName: "Centering and Principles",
  voiceoverEnabled: true,
  voiceoverUrl: "https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/audio/preparation-centering-principles.mp3",
  voiceoverDuration: 247,
  detectedVoiceover: "https://..."
}
```

**On-Screen Indicators:**
- ✅ "🎙️ Voiceover enabled for this section"
- ✅ Music volume: 20% (ducked for voiceover)
- ✅ Voiceover audio plays
- ✅ Music returns to 100% after voiceover ends

---

## 🎬 Expected Behavior

### When Voiceover is Enabled

1. **Section starts** → Music plays at 100% volume
2. **Voiceover loads** → Music ducks to 20% volume (smooth 0.5s fade)
3. **Voiceover plays** → Music stays at 20%
4. **Voiceover ends** → Music returns to 100% (smooth 0.5s fade)
5. **Next section** → Music continues uninterrupted

### When Voiceover is NOT Enabled

1. **Section starts** → Music plays at 100% volume
2. **Text narrative displays** → Music stays at 100%
3. **No voiceover** → No ducking occurs

---

## 🔧 Troubleshooting

### Voiceover Doesn't Play

**Check:**
1. `voiceover_enabled = true` in database?
2. `voiceover_url` is a valid Supabase Storage URL?
3. File exists in Supabase Storage bucket?
4. Browser console shows CSP errors? (check for blocked domains)

**Fix CSP if needed:**
```toml
# netlify.toml line 28
# Add Supabase Storage domain to media-src
media-src 'self' https://*.archive.org https://lixvcebtwusmaipodcpc.supabase.co blob:
```

### Music Doesn't Duck

**Check:**
1. Voiceover URL is detected? (check console logs)
2. `useAudioDucking` hook receiving `voiceoverUrl`?
3. Web Audio API initialized? (console: "🎛️ Web Audio API initialized")

**Debug:**
```
Console → Network tab → Filter: Media → Check if voiceover file loaded
Console → Logs → Search "VOICEOVER DEBUG"
```

### Wrong Duration

**Fix:**
```sql
-- Update duration (in seconds)
UPDATE preparation_scripts
SET voiceover_duration = [correct_duration_in_seconds]
WHERE script_name = '[script_name]';
```

---

## 📊 Database Schema Reference

### Added Columns (All 5 Tables)

```sql
voiceover_url          TEXT         -- Supabase Storage URL
voiceover_duration     INTEGER      -- Duration in seconds
voiceover_enabled      BOOLEAN      -- Default: false
```

### Tables Modified

1. `preparation_scripts` (4 rows)
2. `warmup_routines` (4 rows)
3. `cooldown_sequences` (3 rows)
4. `closing_meditation_scripts` (3 rows)
5. `closing_homecare_advice` (3 rows)

---

## 🚀 Future Enhancements

### Phase 1: User Toggle (Deferred)

Allow users to globally disable voiceovers via Settings page:

```sql
ALTER TABLE user_preferences
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT true;
```

**UI Toggle:**
```tsx
<Switch
  label="Enable Voiceovers"
  checked={preferences.voiceover_enabled}
  onChange={handleToggleVoiceover}
/>
```

### Phase 2: Multiple Voiceovers per Section

Record multiple voiceovers for variety:
- 3-4 preparation scripts per difficulty level
- 3-4 warmup routines per focus area
- System randomly selects from available options

### Phase 3: AI-Generated Voiceovers

Integrate TTS (Text-to-Speech):
- ElevenLabs API
- OpenAI TTS
- Google Cloud TTS

**Auto-generate voiceovers from narrative text**

---

## ✅ Completion Checklist

**Before deploying to production:**

- [ ] Record 5 initial voiceover files (1 per table)
- [ ] Export with correct settings (MP3, 22050 Hz, 145 kbps, Mono)
- [ ] Upload all 5 files to Supabase Storage
- [ ] Copy public URLs for each file
- [ ] Run migration 016 in Supabase
- [ ] Update database with voiceover_url, voiceover_duration, voiceover_enabled
- [ ] Test 1 AI-generated class with voiceover
- [ ] Verify music ducking works
- [ ] Check browser console for errors
- [ ] Verify CSP allows Supabase Storage audio
- [ ] Deploy backend + frontend changes
- [ ] Test in production

**Estimated Time:**
- Recording: 1-2 hours (5 voiceovers @ 3-4 minutes each)
- Editing/Export: 30 minutes
- Upload + Database Update: 30 minutes
- Testing: 30 minutes
- **Total:** 3-3.5 hours

---

## 📞 Support

**Issues?** Check:
- Browser console for errors
- Supabase Storage for file accessibility
- Database for correct voiceover_enabled flag
- CSP headers in production

**Docs Location:** `/docs/VOICEOVER_UPLOAD_GUIDE.md`

**Related Files:**
- Database migration: `/database/migrations/016_add_voiceover_columns_to_class_sections.sql`
- Backend models: `/backend/api/class_sections.py`
- Frontend interfaces: `/frontend/src/components/class-playback/ClassPlayback.tsx`
- Audio hook: `/frontend/src/hooks/useAudioDucking.ts`
