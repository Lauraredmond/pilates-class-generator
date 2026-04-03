# Voiceover Audio Implementation Guide

**Session 13.5 - Advanced Delivery Modes (Audio Narration)**

This guide walks through implementing pre-recorded voiceover audio with music ducking for the Pilates class playback experience.

---

## Overview

**Goal:** Add pre-recorded instructor voiceover audio that plays during movements while automatically reducing background music volume (music ducking).

**Technical Approach:**
- Use Supabase Storage to host audio files
- Web Audio API for precise volume control and mixing
- Custom React hook for dual audio playback management
- Graceful degradation if voiceover unavailable

**User Experience:**
- Background music plays at 100% volume normally
- When voiceover starts, music volume automatically reduces to 35%
- When voiceover ends, music returns to 100% volume
- Smooth fade transitions (0.5 seconds) for professional audio mixing

---

## Phase 1: Database & Storage Setup (30 minutes)

### Step 1: Run Database Migration

The migration file has been created at `database/migrations/018_add_voiceover_audio.sql`

**Connect to your Supabase database:**

Option A: Using Supabase SQL Editor (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New query"
5. Copy/paste contents of `database/migrations/018_add_voiceover_audio.sql`
6. Click "Run" button

Option B: Using psql command line
```bash
# Get connection string from Supabase Dashboard > Settings > Database > Connection string
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < database/migrations/018_add_voiceover_audio.sql
```

**Verify migration succeeded:**
```sql
-- In Supabase SQL Editor, run:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'movements'
AND column_name IN ('voiceover_url', 'voiceover_duration_seconds', 'voiceover_enabled');

-- Expected output: 3 rows showing the new columns
```

---

### Step 2: Create Supabase Storage Bucket

**In Supabase Dashboard:**

1. Click "Storage" in left sidebar
2. Click "Create a new bucket"
3. Enter details:
   - **Name:** `movement-voiceovers`
   - **Public bucket:** ✅ Yes (audio files need to be publicly accessible)
   - **Allowed MIME types:** `audio/mpeg, audio/wav, audio/mp4, audio/m4a`
   - **File size limit:** 50 MB (voiceover audio files are typically 1-5 MB)
4. Click "Create bucket"

**Set Bucket Policies (Public Read Access):**

1. Click on `movement-voiceovers` bucket
2. Click "Policies" tab
3. Click "New policy"
4. Select "For full customization" template
5. Enter policy:
   - **Policy name:** `Public read access for movement voiceovers`
   - **Allowed operation:** SELECT
   - **Target roles:** `public` (or `anon` if that option appears)
   - **USING expression:** `true`
   - **WITH CHECK expression:** (leave blank)
6. Click "Review" → "Save policy"

**Verify bucket is accessible:**
```bash
# Try accessing bucket info endpoint (should return 200 OK)
curl -I "https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/"
```

---

### Step 3: Upload Test Voiceover Audio

**Find your test audio file:**
- Location: `MVP2/Audio files/Hundred voiceover.m4a` (or similar)
- Expected duration: ~2 minutes (120 seconds)

**Upload to Supabase Storage:**

Option A: Using Supabase Dashboard (Easiest)
1. In Storage > `movement-voiceovers` bucket
2. Click "Upload file"
3. Select `Hundred voiceover.m4a`
4. Rename to: `hundred.m4a` (lowercase, no spaces)
5. Click "Upload"
6. Copy the public URL (will be shown after upload)
   - Format: `https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/hundred.m4a`

Option B: Using Supabase JavaScript Client
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const file = /* your File object */
const { data, error } = await supabase.storage
  .from('movement-voiceovers')
  .upload('hundred.m4a', file, {
    contentType: 'audio/mp4',
    upsert: false
  })

if (error) {
  console.error('Upload failed:', error)
} else {
  const publicURL = supabase.storage
    .from('movement-voiceovers')
    .getPublicUrl('hundred.m4a')
  console.log('Public URL:', publicURL.data.publicUrl)
}
```

**Test audio file is accessible:**
```bash
# Should download the audio file
curl -o test.m4a "https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/hundred.m4a"
```

---

### Step 4: Update Database with Voiceover URL

**Run this SQL in Supabase SQL Editor:**

```sql
-- Update "The Hundred" movement with voiceover details
UPDATE movements
SET
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/hundred.m4a',
  voiceover_duration_seconds = 120,  -- Adjust based on actual audio duration
  voiceover_enabled = true
WHERE name = 'The Hundred';

-- Verify update succeeded
SELECT
  name,
  voiceover_url,
  voiceover_duration_seconds,
  voiceover_enabled
FROM movements
WHERE voiceover_enabled = true;

-- Expected output: 1 row showing The Hundred with voiceover details
```

**Get actual audio duration:**

If you don't know the exact duration, use this JavaScript to measure:

```javascript
const audio = new Audio('https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/hundred.m4a');
audio.addEventListener('loadedmetadata', () => {
  console.log('Duration:', Math.round(audio.duration), 'seconds');
});
```

Then update the SQL above with the actual duration.

---

## Phase 2: Frontend Integration (1 hour)

The code files have been created:
- ✅ `frontend/src/hooks/useAudioDucking.ts` - Dual audio playback hook
- ✅ Backend Pydantic model updated with voiceover fields
- ✅ Frontend TypeScript interfaces updated

### Step 5: Update ClassPlayback Component

**Location:** `frontend/src/components/class-playback/ClassPlayback.tsx`

**Current state:** Component uses simple HTML5 audio for music only

**Target state:** Dual audio playback (music + voiceover) with ducking

**Implementation:**

1. Import the new hook at the top of the file:

```typescript
import { useAudioDucking } from '../../hooks/useAudioDucking';
```

2. Find the current music playback section (around line 232-372) and replace it with dual audio logic:

```typescript
// BEFORE (Simple music only):
const audioRef = useRef<HTMLAudioElement | null>(null);

// AFTER (Dual audio with ducking):
// Remove audioRef completely - useAudioDucking handles this internally

// Get current movement's voiceover URL (if it's a movement)
const currentMovementVoiceover =
  currentItem?.type === 'movement' && currentItem.voiceover_enabled
    ? currentItem.voiceover_url
    : undefined;

// Get current track URL
const currentMusicUrl = currentPlaylist?.tracks?.[currentTrackIndex]?.audio_url || '';

// Use dual audio hook
const audioState = useAudioDucking({
  musicUrl: currentMusicUrl,
  voiceoverUrl: currentMovementVoiceover,
  isPaused: isPaused,
  musicVolume: 1.0,      // 100% when no voiceover
  duckedVolume: 0.35,    // 35% during voiceover
  fadeTime: 0.5          // 0.5s smooth fade
});
```

3. Update the music status display section (around line 531-573):

```typescript
{/* Music control - Always visible */}
<div className="absolute bottom-20 left-4 space-y-2">
  {audioState.error ? (
    <p className="flex items-center gap-2 text-yellow-400 text-xs">
      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
      {audioState.error}
    </p>
  ) : (
    <>
      {/* Show enable button if audio not playing */}
      {audioState.isReady && !audioState.isPlaying && (
        <button
          onClick={() => audioState.setMusicVolume(1.0)} // Trigger audio resume
          className="px-4 py-2 bg-cream text-burgundy rounded-lg hover:bg-cream/90 transition-smooth flex items-center gap-2 shadow-lg font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H9a2 2 0 002-2V7a2 2 0 00-2-2H5.586l-3.293 3.293a1 1 0 000 1.414L5.586 15z" />
          </svg>
          Click to Enable Audio
        </button>
      )}

      {/* Audio status indicator */}
      <div className="text-xs text-cream/40 space-y-1">
        <p className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${audioState.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          {audioState.isPlaying ? 'Audio Playing' : audioState.isReady ? 'Audio Ready' : 'Audio Loading...'}
        </p>

        {/* Show current volume during ducking */}
        <p className="flex items-center gap-2">
          Music: {Math.round(audioState.currentVolume * 100)}%
          {audioState.currentVolume < 1.0 && ' (ducked for voiceover)'}
        </p>

        {/* Show if voiceover is active for this movement */}
        {currentMovementVoiceover && (
          <p className="text-green-400">
            🎙️ Voiceover enabled for this movement
          </p>
        )}

        {currentPlaylist && (
          <>
            <p>Playlist: {currentPlaylist.name}</p>
            <p>Track {currentTrackIndex + 1} of {currentPlaylist.tracks?.length || 0}</p>
            {currentPlaylist.tracks && currentPlaylist.tracks[currentTrackIndex] && (
              <p className="truncate max-w-xs">
                {currentPlaylist.tracks[currentTrackIndex].composer} - {currentPlaylist.tracks[currentTrackIndex].title}
              </p>
            )}
          </>
        )}
      </div>
    </>
  )}
</div>
```

4. Remove all old audio element management code:

**DELETE these sections:**
- `audioRef` ref declaration
- `Initialize HTML5 audio element ONCE on mount` useEffect
- `Sync music pause/resume with class timer` useEffect
- `handleEnableAudio` callback
- Any direct `audioRef.current` usage

The `useAudioDucking` hook handles all of this internally.

---

## Phase 3: Testing (30 minutes)

### Test Checklist

**Test 1: Audio Files Load**
- [ ] Open browser DevTools → Console
- [ ] Navigate to Classes page
- [ ] Generate a 2-3 movement class (must include "The Hundred")
- [ ] Click "Play Class"
- [ ] Look for console logs:
  - `🎛️ Web Audio API initialized`
  - `🎵 Music ready: [music URL]`
  - `🎙️ Voiceover ready: [voiceover URL]` (when Hundred loads)

**Test 2: Music Ducking**
- [ ] Play class with "The Hundred" movement
- [ ] When Hundred starts, listen for:
  - Music volume reduces to ~35%
  - Voiceover audio plays clearly
  - Both audio streams audible simultaneously
- [ ] When Hundred ends, listen for:
  - Music volume smoothly returns to 100%
  - Voiceover stops
- [ ] Check console logs:
  - `🎙️ Voiceover started - ducking music to 0.35`
  - `🎙️ Voiceover ended - restoring music to 1`

**Test 3: Browser Autoplay Blocking**
- [ ] Fresh browser session (clear cache)
- [ ] Navigate to class playback
- [ ] Click "Play Class" button
- [ ] If "Click to Enable Audio" button appears:
  - [ ] Click button
  - [ ] Audio should start playing
  - [ ] Button should disappear

**Test 4: Movements Without Voiceover**
- [ ] Play class with movements that don't have voiceover
- [ ] Verify:
  - [ ] Music plays normally (100% volume)
  - [ ] No errors in console
  - [ ] No voiceover indicator shown

**Test 5: CORS and Permissions**
- [ ] Check browser console for CORS errors
- [ ] If errors appear:
  - Verify Supabase Storage bucket is public
  - Check `crossOrigin = 'anonymous'` in useAudioDucking.ts
  - Ensure audio files have correct MIME type

---

## Phase 4: Expanding to All Movements (Future)

**Once The Hundred test is working:**

1. **Record/source voiceover for remaining 33 movements**
   - Maintain consistent voice, tone, and audio quality
   - Target ~2-3 minutes per movement
   - Save as .m4a or .mp3 (AAC or MP3 codec)

2. **Batch upload to Supabase Storage**
   ```bash
   # Upload script example
   for file in voiceovers/*.m4a; do
     filename=$(basename "$file" .m4a)
     curl -X POST \
       "https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/movement-voiceovers/${filename}.m4a" \
       -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
       -H "Content-Type: audio/mp4" \
       --data-binary "@$file"
   done
   ```

3. **Batch update database**
   ```sql
   -- Create helper function
   CREATE OR REPLACE FUNCTION enable_voiceover_for_movement(
     p_movement_name TEXT,
     p_filename TEXT,
     p_duration_seconds INTEGER
   )
   RETURNS void AS $$
   BEGIN
     UPDATE movements
     SET
       voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/' || p_filename || '.m4a',
       voiceover_duration_seconds = p_duration_seconds,
       voiceover_enabled = true
     WHERE name = p_movement_name;
   END;
   $$ LANGUAGE plpgsql;

   -- Use function for each movement
   SELECT enable_voiceover_for_movement('Roll Up', 'roll-up', 180);
   SELECT enable_voiceover_for_movement('Roll Over', 'roll-over', 150);
   -- ... repeat for all 34 movements
   ```

---

## Troubleshooting

### Issue: Music not ducking during voiceover

**Cause:** Web Audio API may not be initialized
**Fix:** Check browser console for errors in useAudioDucking initialization

### Issue: CORS error loading audio

**Cause:** Supabase bucket not public or missing CORS headers
**Fix:**
1. Verify bucket is public in Supabase Dashboard
2. Check RLS policies allow public SELECT
3. Ensure `crossOrigin = 'anonymous'` in useAudioDucking.ts

### Issue: Browser blocks audio autoplay

**Cause:** Modern browsers require user gesture before playing audio
**Fix:** This is expected! The "Click to Enable Audio" button handles this correctly.

### Issue: Voiceover plays but music doesn't duck

**Cause:** GainNode not connected properly
**Fix:**
1. Check console for `🎛️ Web Audio API initialized` message
2. Verify `musicGainRef.current` exists before ducking
3. Check `exponentialRampToValueAtTime()` not throwing errors

### Issue: Audio quality is poor or choppy

**Cause:** Network buffering or large file size
**Fix:**
1. Compress audio files (target: 128kbps AAC, 44.1kHz sample rate)
2. Preload audio on component mount
3. Consider CDN for faster delivery

---

## Technical Reference

### Music Ducking Algorithm

```
Normal State:
  Music: 100% volume
  Voiceover: Not playing

Ducking State (voiceover starts):
  1. AudioContext.currentTime = T
  2. musicGain.value = 1.0 (current)
  3. musicGain.cancelScheduledValues(T)
  4. musicGain.exponentialRampToValueAtTime(0.35, T + 0.5s)
  Result: Music smoothly fades to 35% over 0.5 seconds

Restoration State (voiceover ends):
  1. AudioContext.currentTime = T
  2. musicGain.value = 0.35 (current)
  3. musicGain.cancelScheduledValues(T)
  4. musicGain.exponentialRampToValueAtTime(1.0, T + 0.5s)
  Result: Music smoothly fades to 100% over 0.5 seconds
```

### Audio Graph Topology

```
[Music Audio Element] → [Music Source Node] → [Music Gain Node] → [Destination]
                                                  ↑ (ducking control)

[Voiceover Audio Element] → [Voiceover Source Node] → [Voiceover Gain Node] → [Destination]
                                                          ↑ (always 1.0)
```

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| GainNode | ✅ | ✅ | ✅ | ✅ |
| exponentialRamp | ✅ | ✅ | ✅ | ✅ |
| Dual audio playback | ✅ | ✅ | ✅ | ✅ |

---

## Cost Considerations

**Supabase Storage Pricing:**
- Free tier: 1 GB storage, 2 GB bandwidth/month
- Paid tier: $0.021/GB storage + $0.09/GB bandwidth

**Audio File Sizes (estimated):**
- 2 minutes @ 128kbps AAC = ~2 MB per file
- 34 movements × 2 MB = ~68 MB total storage
- 1000 class plays/month × 68 MB = 68 GB bandwidth

**Projected Monthly Cost:**
- Storage: $0.021 × 0.068 GB = $0.001 (negligible)
- Bandwidth: $0.09 × 68 GB = $6.12/month at 1000 plays

**Optimization:**
- Use CDN caching to reduce bandwidth costs
- Compress audio to 64kbps for voice (still clear, 50% smaller)
- Consider longer cache TTLs in production

---

## Next Steps

1. ✅ **Migration file created** - Ready to run in Supabase
2. ✅ **useAudioDucking hook created** - Ready to integrate
3. ✅ **TypeScript interfaces updated** - Backend and frontend
4. **Run Phase 1:** Database setup and audio upload (30 min)
5. **Run Phase 2:** Frontend integration (1 hour)
6. **Run Phase 3:** Testing with The Hundred movement (30 min)
7. **Future:** Expand to all 34 movements

**Success Criteria:**
- ✅ Voiceover audio plays during The Hundred movement
- ✅ Music volume automatically reduces to 35% during voiceover
- ✅ Music returns to 100% volume after voiceover completes
- ✅ Smooth fade transitions (no abrupt volume changes)
- ✅ No console errors or CORS issues
- ✅ Works across Chrome, Firefox, Safari, Edge

---

**Questions or issues?** Check the Troubleshooting section above or review browser console logs for detailed error messages.
