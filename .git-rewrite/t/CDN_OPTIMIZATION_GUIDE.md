# CDN Optimization Guide: Maximizing App Performance

**Date:** December 8, 2025
**Goal:** Leverage Content Delivery Networks (CDN) to make Bassline MVP2 faster globally
**Audience:** Technical team, future developers, infrastructure reviewers

---

## 📚 Table of Contents

1. [What is a CDN?](#what-is-a-cdn)
2. [Why CDNs Matter for Bassline](#why-cdns-matter-for-bassline)
3. [Current CDN Implementation](#current-cdn-implementation)
4. [Cache Strategies by Content Type](#cache-strategies-by-content-type)
5. [Performance Optimizations](#performance-optimizations)
6. [Implementation Steps](#implementation-steps)
7. [Monitoring & Debugging](#monitoring--debugging)
8. [Future Enhancements](#future-enhancements)

---

## 🌐 What is a CDN?

### Simple Explanation

A **Content Delivery Network (CDN)** is a network of servers distributed globally that cache copies of your website's assets (images, videos, audio, CSS, JavaScript) close to your users.

**Without CDN:**
```
User in Sydney, Australia
  ↓ (request travels 12,000 km)
Server in Virginia, USA
  ↓ (response travels 12,000 km back)
User waits 500ms+ for response
```

**With CDN:**
```
User in Sydney, Australia
  ↓ (request travels 50 km)
CDN Edge Server in Sydney (cached copy)
  ↓ (response travels 50 km back)
User waits 20ms for response
```

**Speed Improvement:** 25× faster (500ms → 20ms)

### How CDNs Work

1. **User Requests Asset:** User in Tokyo requests `https://basslinemvp.netlify.app/hundred-voiceover.mp3`
2. **CDN Checks Cache:** CDN edge server in Tokyo checks if it has a cached copy
3. **Cache HIT:** If cached, return immediately (fast!)
4. **Cache MISS:** If not cached, fetch from origin server, cache it, then return (slower first time, fast thereafter)
5. **Subsequent Requests:** All future requests from Tokyo users get the cached copy (fast!)

### Key CDN Benefits

1. **Reduced Latency:** Assets delivered from nearby servers (20ms vs 500ms)
2. **Lower Server Load:** Origin server handles fewer requests (CDN serves most traffic)
3. **Better User Experience:** Pages load faster, videos buffer less, audio starts immediately
4. **Cost Savings:** Less bandwidth usage on origin server (CDN handles delivery)
5. **Global Scalability:** Handle traffic spikes without upgrading origin server

---

## 🎯 Why CDNs Matter for Bassline

### User Pain Points Solved by CDN

**Problem 1: Slow Class Playback Start**
- User clicks "Play Class" → waits 3-5 seconds for audio to load
- **CDN Solution:** Audio cached on edge server → loads in 0.5 seconds

**Problem 2: Video Buffering on Mobile**
- User on mobile data watches movement video → constant buffering
- **CDN Solution:** CDN serves closest edge server + caches video → smooth playback

**Problem 3: International Users**
- User in UK accessing app hosted in US → 150ms latency per request
- **CDN Solution:** CDN edge server in London → 10ms latency

**Problem 4: Bandwidth Costs**
- 1,000 users stream 100 MB of audio/video each → 100 GB bandwidth from origin
- **CDN Solution:** CDN serves 90% from cache → only 10 GB from origin (90% savings)

### Bassline-Specific Use Cases

**Use Case 1: Class Playback**
- 6 class sections + 34 movements = 40 audio files
- Average user listens to ~10 files per session
- **CDN Impact:** 10 files × 1.5 MB = 15 MB served from nearby edge server

**Use Case 2: Music Streaming**
- Internet Archive hosts classical music
- Music served from Archive.org CDN (already optimized)
- **CDN Impact:** No additional work needed, already fast

**Use Case 3: Movement Videos (Future)**
- 34 movements × 3 resolutions = 102 video files
- Average user watches ~5 movements per session
- **CDN Impact:** 5 videos × 40 MB = 200 MB served from nearby edge server

**Use Case 4: Frontend Assets**
- React app: JS bundles, CSS, images, fonts
- Served from Netlify CDN (already optimized)
- **CDN Impact:** Sub-second page loads globally

---

## ✅ Current CDN Implementation

### What's Already Optimized (No Action Needed)

#### 1. Frontend: Netlify CDN

**Status:** ✅ **Fully Optimized**

**Details:**
- Netlify automatically serves all frontend assets via global CDN
- 100+ edge locations worldwide
- Automatic HTTPS, HTTP/2, Brotli compression
- Instant cache purging on new deployments

**Cache Headers:**
```
Static Assets (JS, CSS, images):
Cache-Control: public, max-age=31536000, immutable

HTML files:
Cache-Control: public, max-age=0, must-revalidate
```

**Performance:**
- React bundle: ~500 KB (gzipped) → loads in <1 second globally
- Images: Lazy-loaded via CDN → fast rendering
- Fonts: Cached for 1 year → no re-downloads

**No Action Required:** Netlify handles all optimizations automatically.

#### 2. Audio: Supabase Storage CDN

**Status:** ✅ **Partially Optimized** (can improve cache headers)

**Details:**
- Supabase Storage uses global CDN (powered by Cloudflare)
- Audio files served from nearest edge location
- HTTPS, HTTP/2 enabled by default

**Current Cache Headers:**
```
Default (not ideal):
Cache-Control: max-age=3600 (1 hour)
```

**Recommended Cache Headers (see Implementation Steps):**
```
Optimal:
Cache-Control: public, max-age=31536000, immutable
```

**Why Improve:**
- Audio files never change once recorded
- 1-hour cache = users re-download same file multiple times per day
- 1-year cache = users download once, cached forever

**Action Required:** Update Supabase bucket settings (see Implementation Steps below).

#### 3. Music: Internet Archive CDN

**Status:** ✅ **Fully Optimized** (external service)

**Details:**
- Internet Archive uses global CDN
- Classical music MP3s served from `https://archive.org/download/...`
- No control over cache settings (managed by Archive.org)

**Performance:**
- Music typically loads in 1-2 seconds
- Archive.org has excellent global distribution

**No Action Required:** Managed by Internet Archive.

#### 4. Backend API: Render (No CDN)

**Status:** ⚠️ **Not Cached** (intentional - dynamic data)

**Details:**
- Backend API hosted on Render.com
- No CDN (API responses are dynamic, not cacheable)
- Responses: Class generation, user data, AI results

**Why No CDN:**
- API responses are unique per request (AI-generated classes, user-specific data)
- Caching would serve stale/incorrect data

**Alternative Optimizations:**
- Redis caching for AI responses (already implemented - 24-hour TTL)
- Database query optimization (indexed queries)
- Fast response times even without CDN (<200ms for most endpoints)

**No CDN Needed:** Dynamic APIs should not be cached at edge.

---

## 📦 Cache Strategies by Content Type

### Immutable Assets (Long Cache)

**What:** Files that never change once created
**Examples:** Audio files, video files, versioned JS/CSS bundles
**Cache Duration:** 1 year (31,536,000 seconds)
**Cache-Control Header:** `public, max-age=31536000, immutable`

**Rationale:**
- Audio recordings never change (re-record = new file URL)
- Videos never change (re-encode = new file URL)
- Versioned assets (e.g., `bundle-abc123.js`) never change

**User Benefit:**
- Download once, cached forever
- Instant playback on repeat visits
- Zero bandwidth waste

**Example:**
```http
GET https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/hundred-test-audio.mp4

Response Headers:
Cache-Control: public, max-age=31536000, immutable
```

### HTML Files (Short Cache)

**What:** HTML pages that may update frequently
**Examples:** `index.html`, `class-builder.html`
**Cache Duration:** 0 seconds (always revalidate)
**Cache-Control Header:** `public, max-age=0, must-revalidate`

**Rationale:**
- HTML contains references to versioned assets
- New deployments update HTML to point to new JS/CSS versions
- Must always fetch latest HTML to get latest app version

**User Benefit:**
- Always get latest app features
- No "hard refresh" needed after deployments

**Example:**
```http
GET https://basslinemvp.netlify.app/

Response Headers:
Cache-Control: public, max-age=0, must-revalidate
```

### API Responses (No Cache or Short Cache)

**What:** Dynamic data from backend
**Examples:** Class generation, user profile, movement list
**Cache Duration:** 0 seconds (default) or 5 minutes (for semi-static data)
**Cache-Control Header:** `no-cache` or `public, max-age=300` (5 min)

**Rationale:**
- User data changes frequently (profile updates, class generation)
- AI responses are unique per request
- Can't cache at CDN edge (would serve stale data)

**Backend Caching Strategy:**
- Redis cache for AI responses (24-hour TTL) - server-side cache, not CDN
- Database query results (5-minute TTL for movement list)
- No CDN caching (intentional)

**Example:**
```http
GET https://pilates-class-generator-api3.onrender.com/api/movements/

Response Headers:
Cache-Control: no-cache
```

### Images (Medium Cache)

**What:** Static images (logos, icons, photos)
**Cache Duration:** 1 week (604,800 seconds)
**Cache-Control Header:** `public, max-age=604800`

**Rationale:**
- Images change infrequently (maybe once per week)
- Long enough to reduce bandwidth
- Short enough to allow updates without manual cache purging

**User Benefit:**
- Fast image loading on repeat visits
- Reasonable freshness (updates appear within 1 week)

**Example:**
```http
GET https://basslinemvp.netlify.app/logo.png

Response Headers:
Cache-Control: public, max-age=604800
```

---

## ⚡ Performance Optimizations

### 1. HTTP/2 Server Push (Netlify - Already Enabled)

**What:** Server proactively sends assets before browser requests them
**Example:** When user requests `index.html`, server pushes `bundle.js` and `styles.css` simultaneously

**Status:** ✅ Netlify enables HTTP/2 automatically

**Benefit:** Eliminates round-trip time for critical assets (30-50ms savings)

### 2. Brotli Compression (Netlify - Already Enabled)

**What:** Modern compression algorithm (better than gzip)
**Compression Ratio:** 20-25% better than gzip

**Status:** ✅ Netlify enables Brotli automatically for text assets (JS, CSS, HTML)

**Example:**
```
bundle.js: 2 MB (uncompressed)
  ↓
Gzipped: 500 KB (75% reduction)
  ↓
Brotli: 400 KB (80% reduction, 100 KB savings over gzip)
```

**Benefit:** Faster page loads (less data to download)

### 3. Lazy Loading (Frontend - Already Implemented)

**What:** Delay loading non-critical assets until needed
**Example:** Movement videos load only when user clicks "Play", not on page load

**Status:** ✅ React lazy loading implemented in ClassPlayback component

**Benefit:** Faster initial page load (only load what's needed)

### 4. Preload Next Movement Audio (Future Enhancement)

**What:** Pre-fetch audio file for next movement while current movement plays
**Example:** While user does "The Hundred" (movement 1), preload "Roll Up" (movement 2)

**Status:** ⏸️ **Not Implemented** (future enhancement)

**Implementation:**
```typescript
// In ClassPlayback.tsx
useEffect(() => {
  if (currentIndex < items.length - 1) {
    const nextMovement = items[currentIndex + 1];
    if (nextMovement.voiceover_url) {
      // Preload next movement's audio
      const preloadAudio = new Audio(nextMovement.voiceover_url);
      preloadAudio.load();
    }
  }
}, [currentIndex]);
```

**Benefit:** Instant playback when user advances to next movement (zero buffering)

### 5. Video Adaptive Bitrate Streaming (Future - Phase 2)

**What:** Automatically adjust video quality based on network speed
**Example:** User on slow 3G gets 480p, user on WiFi gets 1080p

**Status:** ⏸️ **Planned for Phase 2** (when video implementation starts)

**Technology:** HLS (HTTP Live Streaming)

**Benefit:** Smooth video playback on any network (no buffering)

### 6. Service Worker Caching (Future Enhancement)

**What:** Cache assets in browser even when offline
**Example:** User can play previously-loaded classes without internet

**Status:** ⏸️ **Not Implemented** (future PWA feature)

**Benefit:** Offline class playback (great for users in gyms with poor WiFi)

---

## 🛠️ Implementation Steps

### Step 1: Optimize Supabase Audio Cache Headers

**Goal:** Set 1-year cache for audio files (currently 1-hour cache)

**Why:** Audio files never change once recorded → safe to cache forever

**How:**

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `Bassline MVP2`
3. Navigate to: **Storage** → **movement-voiceovers** bucket
4. Click **Settings** (gear icon)
5. Update **Cache Control** field:
   ```
   public, max-age=31536000, immutable
   ```
6. Click **Save**

#### Option B: Via SQL (Alternative)

```sql
-- Update bucket configuration
UPDATE storage.buckets
SET public = true,
    file_size_limit = 10485760, -- 10 MB max
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/mp4']
WHERE name = 'movement-voiceovers';

-- Note: Cache-Control headers are set at upload time or via dashboard
```

#### Option C: Via Upload (Per-File Basis)

```typescript
// When uploading new audio files
const { data, error } = await supabase.storage
  .from('movement-voiceovers')
  .upload('hundred-voiceover.mp3', audioFile, {
    cacheControl: '31536000', // 1 year
    upsert: false
  });
```

**Verification:**

```bash
# Check cache headers
curl -I https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/hundred-test-audio.mp4

# Expected response:
HTTP/2 200
cache-control: public, max-age=31536000, immutable
```

**Impact:**
- Users download audio once, cached for 1 year
- 99% bandwidth savings (Supabase side)
- Instant audio playback on repeat visits

---

### Step 2: Configure AWS CloudFront (Phase 2 - When Adding Video)

**Goal:** Optimize video delivery via CloudFront CDN

**Timeline:** Phase 2 (2-3 months from now, when implementing video)

**Steps:**

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://bassline-movement-videos --region us-east-1
   ```

2. **Upload Videos:**
   ```bash
   aws s3 cp ./videos/ s3://bassline-movement-videos/ --recursive --cache-control "public, max-age=31536000, immutable"
   ```

3. **Create CloudFront Distribution:**
   - Go to AWS Console → CloudFront
   - Click **Create Distribution**
   - **Origin Domain:** bassline-movement-videos.s3.amazonaws.com
   - **Origin Path:** (leave blank)
   - **Viewer Protocol Policy:** Redirect HTTP to HTTPS
   - **Allowed HTTP Methods:** GET, HEAD, OPTIONS
   - **Cache Policy:** CachingOptimized (recommended)
   - **Custom Cache Policy (optional):**
     ```
     TTL Settings:
     - Minimum TTL: 1 second
     - Maximum TTL: 31536000 seconds (1 year)
     - Default TTL: 86400 seconds (1 day)
     ```

4. **Configure CORS (S3 Bucket):**
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["https://basslinemvp.netlify.app"],
         "AllowedMethods": ["GET", "HEAD"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

5. **Test CloudFront Distribution:**
   ```bash
   # Get CloudFront URL
   CLOUDFRONT_URL=d1234567890abc.cloudfront.net

   # Test video delivery
   curl -I https://$CLOUDFRONT_URL/hundred-480p.mp4

   # Expected response:
   HTTP/2 200
   x-cache: Hit from cloudfront
   cache-control: public, max-age=31536000, immutable
   ```

**Success Criteria:**
- [ ] `x-cache: Hit from cloudfront` header present (CDN cache hit)
- [ ] Video plays smoothly on desktop
- [ ] Video plays smoothly on mobile (iOS Safari, Android Chrome)
- [ ] Adaptive bitrate switching works (throttle network to test)

---

### Step 3: Migrate to Cloudflare R2 (Phase 3 - Month 10)

**Goal:** Migrate videos from AWS CloudFront to Cloudflare R2 for free bandwidth

**Timeline:** Month 10 of AWS credits (before expiration)

**Steps:**

1. **Create R2 Bucket:**
   - Cloudflare Dashboard → R2 → Create Bucket
   - Bucket name: `bassline-movement-videos`
   - Region: Automatic (Cloudflare edge network)

2. **Generate R2 API Credentials:**
   - R2 Dashboard → API Tokens → Create API Token
   - Permissions: Read & Write
   - Copy: Access Key ID, Secret Access Key

3. **Sync from S3 to R2:**
   ```bash
   # Install AWS CLI (if not already installed)
   brew install awscli

   # Configure for R2
   aws configure --profile r2
   # Access Key ID: [from R2 dashboard]
   # Secret Access Key: [from R2 dashboard]
   # Region: auto
   # Endpoint: https://<account-id>.r2.cloudflarestorage.com

   # Sync files
   aws s3 sync s3://bassline-movement-videos/ s3://bassline-movement-videos/ --endpoint-url=https://<account-id>.r2.cloudflarestorage.com --profile r2
   ```

4. **Update Database URLs:**
   ```sql
   -- Replace CloudFront URLs with R2 public URLs
   UPDATE movements
   SET video_url = REPLACE(
     video_url,
     'd1234567890abc.cloudfront.net',
     'pub-<id>.r2.dev'
   )
   WHERE video_url LIKE '%cloudfront.net%';
   ```

5. **Configure R2 Public Access:**
   - R2 Dashboard → Bucket Settings → Public Access
   - Enable: Allow public access
   - Custom domain (optional): video.basslineapp.com

6. **Test R2 Delivery:**
   ```bash
   curl -I https://pub-<id>.r2.dev/hundred-480p.mp4

   # Expected response:
   HTTP/2 200
   cache-control: public, max-age=31536000, immutable
   ```

7. **Monitor for 1 Week:**
   - Check error logs (Sentry, browser console)
   - Verify R2 bandwidth usage (should be $0.00)
   - Confirm playback works on iOS Safari, Android Chrome

8. **Delete AWS Resources:**
   ```bash
   # Delete CloudFront distribution
   aws cloudfront delete-distribution --id E1234567890ABC

   # Delete S3 bucket
   aws s3 rb s3://bassline-movement-videos --force
   ```

**Success Criteria:**
- [ ] All videos accessible via R2 public URLs
- [ ] Zero bandwidth charges on R2 (free egress)
- [ ] Video playback identical to AWS CloudFront
- [ ] AWS resources deleted (no lingering charges)

---

## 📊 Monitoring & Debugging

### Cache Hit Rate Monitoring

**Goal:** Ensure >90% cache hit rate (most requests served from CDN cache)

**How to Check:**

#### Netlify (Frontend Assets)

1. Netlify Dashboard → Site → Analytics
2. Check: **Bandwidth Usage** → **Edge vs Origin**
3. Ideal: >95% edge (CDN cache), <5% origin (cache miss)

#### Supabase (Audio Files)

1. Supabase Dashboard → Storage → Analytics
2. Check: **Bandwidth** chart
3. Look for: Declining bandwidth usage over time (more cache hits)

**Note:** Supabase doesn't show cache hit rate directly, but you can infer from bandwidth trends.

#### Cloudflare R2 (Future Video)

1. Cloudflare Dashboard → R2 → Analytics
2. Check: **Requests** vs **Bandwidth**
3. Look for: High requests, low bandwidth = cache working well

### Debugging Cache Issues

**Problem 1: Assets Not Caching**

**Symptoms:**
- Every request downloads file again (no cache hit)
- Network tab shows: `cache-control: no-cache`

**Diagnosis:**
```bash
# Check response headers
curl -I https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/hundred-test-audio.mp4

# Look for:
cache-control: ???
```

**Fix:**
- Update Supabase bucket settings (Step 1 above)
- Verify: Cache-Control header = `public, max-age=31536000, immutable`

**Problem 2: Stale Content Served**

**Symptoms:**
- Old audio file plays even after uploading new version
- Video shows old content

**Diagnosis:**
- Check if file URL changed (should change for new uploads)
- Check browser cache (F12 → Network → Disable Cache)

**Fix:**
- **Option A:** Upload with new filename (e.g., `hundred-voiceover-v2.mp3`)
- **Option B:** Purge CDN cache (Cloudflare/Netlify dashboard)
- **Option C:** Add cache-busting query param (e.g., `?v=2`)

**Problem 3: Slow Playback on Mobile**

**Symptoms:**
- Audio/video buffers on mobile, fine on desktop

**Diagnosis:**
- Test on mobile data (not WiFi)
- Check Network tab: Large file size? Slow download speed?

**Fix:**
- Reduce bitrate (64 kbps mono for audio)
- Use adaptive bitrate for video (HLS)
- Preload next movement (see Step 4 in Performance Optimizations)

---

## 🚀 Future Enhancements

### 1. Preconnect to External Origins (Quick Win)

**What:** Tell browser to establish connection to external domains before assets requested
**Benefit:** 100-200ms faster load for Internet Archive music

**Implementation:**
```html
<!-- In index.html <head> -->
<link rel="preconnect" href="https://archive.org">
<link rel="dns-prefetch" href="https://archive.org">
```

**Impact:** Music playback starts 100-200ms faster

---

### 2. Resource Hints (Quick Win)

**What:** Tell browser which assets are critical and should load first
**Benefit:** Faster perceived page load

**Implementation:**
```html
<!-- Preload critical CSS -->
<link rel="preload" href="/styles.css" as="style">

<!-- Prefetch next page assets -->
<link rel="prefetch" href="/class-builder.js">
```

**Impact:** Critical assets load first, faster time-to-interactive

---

### 3. Service Worker for Offline Playback (PWA Feature)

**What:** Cache classes for offline playback
**Benefit:** Users can do classes without internet (gym, travel)

**Implementation:**
```typescript
// service-worker.ts
const CACHE_NAME = 'bassline-v1';
const CACHE_URLS = [
  '/',
  '/class-playback',
  '/styles.css',
  '/bundle.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**Impact:** Offline class playback (huge UX win for mobile users)

---

### 4. Image Optimization (Future - When Adding Photos)

**What:** Use next-gen image formats (WebP, AVIF) + lazy loading
**Benefit:** 50-70% smaller image sizes

**Implementation:**
```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" loading="lazy" alt="Movement demo">
</picture>
```

**Impact:** Faster page loads (smaller images)

---

### 5. Cloudflare Workers (Future - Edge Computing)

**What:** Run backend logic at CDN edge (closer to users)
**Example:** Personalized class assembly at edge (no round-trip to origin server)

**Benefit:** 10× faster response times for certain operations

**Use Case:** Pre-assemble popular class templates at edge

**Impact:** Class generation <100ms (vs current 1-2 seconds)

---

## 📋 CDN Optimization Checklist

### Immediate Actions (This Week)

- [ ] Update Supabase audio bucket cache headers (1 year TTL)
- [ ] Verify cache headers with curl
- [ ] Test audio playback on mobile (should be instant on repeat visit)
- [ ] Add preconnect to Internet Archive in index.html
- [ ] Document current cache hit rates (baseline for future)

### Phase 2 Actions (When Adding Video)

- [ ] Create CloudFront distribution
- [ ] Configure cache policies (1 year TTL)
- [ ] Set up CORS for video streaming
- [ ] Test adaptive bitrate streaming on mobile
- [ ] Monitor AWS bandwidth usage (should stay within credits)

### Phase 3 Actions (Month 10 - R2 Migration)

- [ ] Create Cloudflare R2 bucket
- [ ] Sync videos from S3 to R2
- [ ] Update database URLs (S3 → R2)
- [ ] Test video playback (verify identical to AWS)
- [ ] Delete AWS resources (CloudFront + S3)

### Ongoing Monitoring (Monthly)

- [ ] Check Netlify cache hit rate (target: >95%)
- [ ] Check Supabase bandwidth trends (should decline over time)
- [ ] Check R2 bandwidth (should be $0.00)
- [ ] Review page load times (Lighthouse audit)
- [ ] Survey users on playback performance

---

## 🎓 Key Takeaways

1. **CDNs are already working:** Netlify (frontend), Supabase (audio), Internet Archive (music) all use CDNs
2. **Quick win:** Update Supabase cache headers (1-hour → 1-year) for instant audio playback
3. **Free bandwidth:** Cloudflare R2's zero egress fees make it ideal for video at scale
4. **Cache forever:** Audio/video never change → safe to cache for 1 year (instant playback)
5. **Measure success:** >90% cache hit rate = users getting fast experience

---

**Next Actions:**
1. ✅ Update Supabase audio cache headers (this week)
2. ⏸️ Set up CloudFront for video (Phase 2 - 2-3 months)
3. ⏸️ Migrate to Cloudflare R2 (Phase 3 - month 10)
4. 📊 Monitor cache hit rates monthly
