# Jazz Music Setup Guide

**Migration:** `016_add_jazz_music_style.sql`
**Date:** December 4, 2025
**Status:** Ready to run

---

## What This Adds

**New Music Style:** Jazz (Relaxing Coffee Shop)

Users can now select Jazz from the music dropdown in the class builder, which will play a 1-hour relaxing jazz track from Internet Archive during their Pilates class.

---

## What You Need to Do

### 1. Run the SQL Migration in Supabase

1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor**
3. Copy the contents of `016_add_jazz_music_style.sql`
4. Paste into SQL Editor
5. Click **Run** button

**OR** if you have SQL file access:
```sql
\i database/migrations/016_add_jazz_music_style.sql
```

### 2. Verify Jazz Was Added Successfully

Run these verification queries in Supabase SQL Editor:

```sql
-- Check that JAZZ was added to enum
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'stylistic_period'::regtype
ORDER BY enumsortorder;

-- Should see: BAROQUE, CLASSICAL, ROMANTIC, IMPRESSIONIST, MODERN, CONTEMPORARY, JAZZ, CELTIC_TRADITIONAL
```

```sql
-- Check Jazz track was inserted
SELECT id, title, stylistic_period, duration_seconds, audio_url
FROM music_tracks
WHERE stylistic_period = 'JAZZ';

-- Should return 1 row: "1 Hour Relaxing Jazz Coffee Shop Music..."
```

```sql
-- Check Jazz playlists were created
SELECT id, name, intended_intensity, intended_use, stylistic_period
FROM music_playlists
WHERE stylistic_period = 'JAZZ';

-- Should return 3 rows:
-- 1. "Relaxing Jazz for Pilates" (LOW, PILATES_SLOW_FLOW)
-- 2. "Jazz for Core Strengthening" (MEDIUM, PILATES_CORE)
-- 3. "Jazz for Stretching & Cool-Down" (LOW, PILATES_STRETCH)
```

```sql
-- Check playlist-track linkage
SELECT
    mp.name AS playlist_name,
    mt.title AS track_title,
    mpt.start_offset_seconds,
    mpt.end_offset_seconds,
    (mpt.end_offset_seconds - mpt.start_offset_seconds) / 60 AS duration_minutes
FROM music_playlist_tracks mpt
JOIN music_playlists mp ON mpt.playlist_id = mp.id
JOIN music_tracks mt ON mpt.track_id = mt.id
WHERE mp.stylistic_period = 'JAZZ';

-- Should return 3 rows:
-- 1. "Relaxing Jazz for Pilates" → 60 minutes (full track)
-- 2. "Jazz for Core Strengthening" → 60 minutes (full track)
-- 3. "Jazz for Stretching & Cool-Down" → 15 minutes (first quarter of track)
```

### 3. Test in Frontend

1. Go to: https://basslinemvp.netlify.app/class-builder
2. Open the **Movement Music** dropdown
3. You should see: **Jazz (Relaxing Coffee Shop)** as an option
4. Select Jazz and generate a class
5. Click "Play Class" and verify music plays

---

## What Gets Added

### 1. Enum Value
- Added `JAZZ` to the `stylistic_period` PostgreSQL enum

### 2. Music Track
- **Title:** 1 Hour Relaxing Jazz Coffee Shop Music - The Best Melodies That Will Warm Your Heart
- **Source:** Internet Archive (jaguar101)
- **Duration:** 3600 seconds (1 hour)
- **BPM:** 90 (relaxing tempo)
- **Mood Tags:** relaxing, coffee shop, smooth, warm, gentle, instrumental
- **License:** Public Domain
- **Audio URL:** `https://archive.org/download/1-hour-relaxing-jazz-coffee-shop-music-.../...mp3`

### 3. Three Jazz Playlists

#### Playlist 1: Relaxing Jazz for Pilates (Featured ⭐)
- **Intensity:** Low
- **Use Case:** PILATES_SLOW_FLOW
- **Duration:** 60 minutes
- **Description:** Smooth, gentle jazz perfect for slow-flow Pilates classes

#### Playlist 2: Jazz for Core Strengthening
- **Intensity:** Medium
- **Use Case:** PILATES_CORE
- **Duration:** 60 minutes
- **Description:** Upbeat jazz melodies for core-intensive work

#### Playlist 3: Jazz for Stretching & Cool-Down
- **Intensity:** Low
- **Use Case:** PILATES_STRETCH
- **Duration:** 15 minutes
- **Description:** Gentle jazz for deep stretching and relaxation

---

## Code Changes (Already Deployed)

### Frontend
**File:** `frontend/src/components/class-builder/ai-generation/GenerationForm.tsx`

Added Jazz to music styles array:
```typescript
const ALL_MUSIC_STYLES = [
  { value: 'BAROQUE', label: 'Baroque (Bach, Handel, Vivaldi)' },
  { value: 'CLASSICAL', label: 'Classical (Mozart, Haydn)' },
  { value: 'ROMANTIC', label: 'Romantic (Chopin, Beethoven, Brahms)' },
  { value: 'IMPRESSIONIST', label: 'Impressionist (Debussy, Ravel)' },
  { value: 'MODERN', label: 'Modern (Satie, Copland)' },
  { value: 'CONTEMPORARY', label: 'Contemporary (Ambient, Meditation)' },
  { value: 'JAZZ', label: 'Jazz (Relaxing Coffee Shop)' },  // NEW!
  { value: 'CELTIC_TRADITIONAL', label: 'Celtic Traditional (Irish Flute)' },
];
```

### Backend
**File:** `backend/api/music.py`

Added Jazz period info:
```python
"JAZZ": StylisticPeriodInfo(
    value="JAZZ",
    name="Jazz",
    description="Smooth, relaxing jazz for a warm, sophisticated atmosphere",
    era="20th century–present",
    composers=["Miles Davis", "John Coltrane", "Bill Evans", "Various Modern Jazz Artists"],
    traits=["Smooth melodies", "Coffee shop ambiance", "Gentle improvisation", "Warm tones"]
),
```

---

## Troubleshooting

### Issue: Migration fails with "value already exists"
**Solution:** Jazz was already added. Check if it's in the enum:
```sql
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'stylistic_period'::regtype AND enumlabel = 'JAZZ';
```

If it returns a row, Jazz is already added. You can skip the `ALTER TYPE` command and just run the INSERT statements.

### Issue: Jazz doesn't appear in frontend dropdown
**Solution:**
1. Hard refresh the frontend: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. Check that Netlify deployed the latest code (commit 7034e63)
3. Open browser console and check for errors

### Issue: Jazz music doesn't play
**Solution:**
1. Check browser console for CORS errors
2. Verify audio URL is accessible: Open the URL in a new tab
   ```
   https://archive.org/download/1-hour-relaxing-jazz-coffee-shop-music-the-best-melodies-that-will-warm-your-heart/1%20Hour%20Relaxing%20Jazz%20Coffee%20Shop%20Music%20%20The%20Best%20Melodies%20That%20Will%20Warm%20Your%20Heart.mp3
   ```
3. Check that `archive.org` is in the backend's `ALLOWED_STREAMING_DOMAINS` whitelist

---

## Rollback (If Needed)

If you need to remove Jazz:

```sql
-- Remove playlist tracks
DELETE FROM music_playlist_tracks
WHERE playlist_id IN (
    SELECT id FROM music_playlists WHERE stylistic_period = 'JAZZ'
);

-- Remove playlists
DELETE FROM music_playlists WHERE stylistic_period = 'JAZZ';

-- Remove tracks
DELETE FROM music_tracks WHERE stylistic_period = 'JAZZ';

-- Note: Cannot remove enum value easily in PostgreSQL
-- If you need to remove JAZZ from enum, you must:
-- 1. Drop all tables using the enum
-- 2. Drop and recreate the enum without JAZZ
-- 3. Recreate all tables
-- This is destructive - only do if absolutely necessary
```

---

## Next Steps

After running this migration, you can add more Jazz tracks by:

1. Finding public domain Jazz tracks on Internet Archive
2. Inserting them into `music_tracks` table with `stylistic_period = 'JAZZ'`
3. Linking them to existing Jazz playlists via `music_playlist_tracks`

**Example Internet Archive Jazz sources:**
- https://archive.org/details/audio?query=jazz+instrumental+public+domain
- https://archive.org/details/78rpm (historic jazz recordings)
- https://archive.org/details/MusopenDVD (includes some jazz)
