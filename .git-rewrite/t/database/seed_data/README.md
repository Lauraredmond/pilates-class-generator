# Music Seed Data - Quick Start Guide

## ✅ What You Have

**File:** `001_initial_music_tracks_VERIFIED.sql`

**Contents:**
- 9 verified music tracks from Internet Archive
- 5 curated playlists for Pilates
- All URLs tested and working
- 100% secure (HTTPS, no ads, trusted source)

**Musical Selection:**
- **Debussy**: Clair de Lune, Arabesque *(Impressionist - like Einaudi/Tiersen from your playlist)*
- **Chopin**: Minute Waltz, Nocturne *(Romantic - like Schubert from your playlist)*
- **Bach**: Air on G String, Jesu Joy, Minuet *(Baroque - timeless classics)*
- **Mozart**: Eine kleine Nachtmusik, Symphony 40 *(Classical)*

---

## 🚀 How to Run (2 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your **Bassline MVP2** project
3. Click **SQL Editor** in the left sidebar

### Step 2: Copy & Run the SQL
1. Open `001_initial_music_tracks_VERIFIED.sql` in this folder
2. Copy **entire contents** (Cmd+A, Cmd+C)
3. Paste into Supabase SQL Editor
4. Click **Run** button (or press Cmd+Enter)

### Step 3: Verify Success
You should see output like:
```
✓ 9 tracks inserted
✓ 5 playlists created
✓ All URLs verified as HTTPS
✓ All domains verified as trusted
```

---

## 🎵 What Gets Created

### Tracks by Period:
- **BAROQUE** (3 tracks): Bach classics
- **CLASSICAL** (2 tracks): Mozart pieces
- **IMPRESSIONIST** (2 tracks): Debussy favorites
- **ROMANTIC** (2 tracks): Chopin masterpieces

### Playlists:
1. **Impressionist Meditation** (30 min) - LOW intensity, PILATES_STRETCH
2. **Romantic Slow Flow** (30 min) - LOW intensity, PILATES_SLOW_FLOW
3. **Baroque Flow** (30 min) - MEDIUM intensity, PILATES_CORE
4. **Classical Elegance** (30 min) - MEDIUM intensity, PILATES_CORE
5. **Mixed Classical Calm** (45 min) - LOW intensity, MEDITATION

---

## 🔐 Security Verification

The SQL includes verification queries that confirm:
- ✅ All URLs use HTTPS
- ✅ All URLs from Internet Archive (archive.org)
- ✅ No insecure or untrusted domains

Example output:
```
Title                    | Domain        | Status
-------------------------|---------------|-------------
Clair de Lune           | archive.org   | ✓ Trusted
Air on G String         | archive.org   | ✓ Trusted
```

---

## 🧪 Testing After Ingestion

### Test API Endpoints:

```bash
# 1. Get stylistic periods
curl https://pilates-class-generator-api3.onrender.com/api/music/stylistic-periods

# 2. Get playlists
curl https://pilates-class-generator-api3.onrender.com/api/music/playlists

# 3. Get specific playlist with tracks
curl https://pilates-class-generator-api3.onrender.com/api/music/playlists/{PLAYLIST_ID}

# 4. Health check
curl https://pilates-class-generator-api3.onrender.com/api/music/health
```

### Expected Response:
```json
{
  "status": "healthy",
  "tracks_available": 9,
  "playlists_available": 5,
  "sources": ["INTERNET_ARCHIVE"]
}
```

---

## 🎯 Next Steps After Ingestion

1. **Test Frontend Components:**
   - `MusicPeriodSelector` component should list periods
   - `MusicPlayer` component should stream tracks

2. **Integrate with Class Generation:**
   - Add music period selection to class builder
   - Pass playlist_id to MusicPlayer during playback

3. **Test End-to-End:**
   - Generate a class
   - Select a music period
   - Start playback
   - Verify music plays alongside class instructions

---

## 📝 Troubleshooting

### "No tracks found"
- Verify migration `003_music_integration.sql` was run first
- Check tables exist: `SELECT * FROM music_tracks LIMIT 1;`

### "Invalid enum value"
- Enum types created by migration must exist
- Run: `SELECT * FROM pg_type WHERE typname LIKE 'music%';`

### "RLS policy violation"
- Using anon key? Normal - clients can only read
- Using service role key? Check key is correct in .env

### "URL validation fails"
- All URLs in this file are pre-validated
- Check `ALLOWED_STREAMING_DOMAINS` in `music_source.py`
- Internet Archive (archive.org) is already whitelisted

---

## 🌟 Why These Tracks?

Selected to match your Spotify Pilates playlist:
- **Debussy** - Atmospheric like Ludovico Einaudi
- **Chopin** - Romantic like Schubert Serenade
- **Bach** - Timeless flow
- **All instrumental** - No vocals, perfect for Pilates

All from **Internet Archive** because:
- ✅ Non-profit, trusted since 1996
- ✅ Permanent URLs (won't disappear)
- ✅ No ads, ever
- ✅ Public domain (legally free)
- ✅ High quality recordings

---

**Ready to run? Just copy-paste the SQL and hit Run!** 🎵
