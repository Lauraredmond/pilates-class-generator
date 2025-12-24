# S3 Music Migration Guide

**Date:** December 24, 2025
**Goal:** Migrate all 43 music tracks from archive.org to AWS S3 for reliable hosting

---

## Summary

✅ **Downloaded:** 42 / 43 tracks from archive.org (1 failed due to 401 error)
📁 **Location:** `music-downloads/` folder (~300 MB)
🎯 **Next Steps:** Upload to S3, update database, test playback

---

## Step 1: Upload Files to AWS S3

### 1.1 Access S3 Bucket

Go to: https://s3.console.aws.amazon.com/s3/buckets/pilates-music-tracks

### 1.2 Upload All MP3 Files

1. Click **"Upload"** button
2. Click **"Add files"**
3. Navigate to: `/Users/lauraredmond/Documents/Bassline/Projects/MVP2/music-downloads/`
4. Select **all .mp3 files** (42 files total)
5. Click **"Upload"**
6. Wait for upload to complete (~5 minutes depending on connection)

### 1.3 Verify Upload

- Check that all 42 files appear in the bucket
- Total size should be ~300 MB
- All files should have `.mp3` extension

---

## Step 2: Update Database with S3 URLs

### 2.1 Run SQL Migration

File: `database/migrations/migrate_all_to_s3.sql`

**Run this SQL in BOTH Supabase projects:**

1. **Production:** lixvcebtwusmaipodcpc.supabase.co
2. **Dev:** gntqrebxmpdjyuxztwww.supabase.co

The SQL file will be generated after you confirm upload is complete.

---

## Step 3: Test Music Playback

### 3.1 Test in Production

1. Go to: https://basslinemvp.netlify.app
2. Generate a new class
3. Select different music styles (Celtic, Baroque, Classical, etc.)
4. Verify music plays from S3 URLs

### 3.2 Test in Dev

1. Go to: https://bassline-dev.netlify.app
2. Generate a new class
3. Verify music plays correctly

---

## File Mapping Reference

| Downloaded File | Database Title | Track ID |
|----------------|----------------|----------|
| Hallelujah_Messiah.mp3 | "Hallelujah" (Messiah) | fb3e9e7c-3b2e-4641-9850-1e1bbd538ae1 |
| Air_on_the_G_String.mp3 | Air on the G String | 1a76ce4c-9203-44b6-bd95-f5566e3eaed4 |
| (... 40 more tracks ...) | | |

*Complete mapping will be in the SQL file.*

---

## Known Issues

### Missing Track

**"Dance of the Blessed Spirits"** failed to download (401 Unauthorized).

**Options:**
1. Leave it with archive.org URL (if working)
2. Find alternative source
3. Skip for now

---

## Rollback Plan

If S3 migration causes issues:

```sql
-- Revert Celtic tracks to archive.org
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/TradschoolIrishFluteTunes/andersons_slow.mp3'
WHERE id = '54b52558-b4fb-442f-aa8e-fc621fb2bac9';

UPDATE music_tracks
SET audio_url = 'https://archive.org/download/TradschoolIrishFluteTunes/humours_of_lissadell_slow.mp3'
WHERE id = '926ac3b1-d9a8-465b-bdf5-995e7e71979e';
```

---

## Success Criteria

✅ All 42 files uploaded to S3
✅ Database updated with S3 URLs
✅ Music plays correctly in production
✅ Music plays correctly in dev
✅ No CORS errors in browser console
✅ No 403/404 errors on S3 URLs

---

## Cost Impact

**AWS S3 Storage:**
- Files: 42 tracks × ~7 MB average = ~300 MB
- Cost: $0.023/GB = $0.007/month (~$0.00)

**AWS S3 Bandwidth:**
- 100 users/month × 42 tracks × 7 MB = ~30 GB
- Cost: $0.09/GB = $2.70/month

**Total:** ~$2.70/month (negligible, covered by $1,000 AWS credits)

---

## Next Session

Once S3 migration is complete and tested:

1. Download the 1 missing track (Dance of Blessed Spirits)
2. Upload to S3
3. Update that single database record
4. Complete migration to 43/43 tracks
