# Infrastructure Roadmap: Audio/Video Scaling Strategy

**Date:** December 8, 2025
**Context:** $1,000 AWS Activate Credits + Mobile User Requirements
**Goal:** Scale voiceover audio and future video content cost-effectively

---

## 📊 Executive Summary

**Current State:**
- Voiceover prototype working (music ducking to 20%, auto-play on movement start)
- Need to record: 6 class sections + 34 movements = 40 audio files
- Future requirement: Video demonstrations for all movements

**Strategic Decision:**
- **Phase 1:** Audio on Supabase Storage (NOW)
- **Phase 2:** Video on AWS with credits (2-3 months from now)
- **Phase 3:** Migrate video to Cloudflare R2 before credits expire (~10 months)
- **Phase 4:** Long-term scaling on R2 with free bandwidth

**Why This Approach:**
- Maximizes $1,000 AWS credit value (11.7 months free video hosting)
- Avoids vendor lock-in (R2 is S3-compatible, easy migration)
- Minimizes long-term costs (R2 free bandwidth saves $9/100GB vs AWS)
- Separates concerns (audio stable on Supabase, video migrates to best platform)

---

## 🎯 Phase 1: Audio Recording & Optimization (NOW)

### Timeline
**Start:** Now
**Duration:** 2-4 weeks (manual recording labor)
**Completion:** Before Phase 2

### Audio Content to Record

**6 Class Sections:**
1. Preparation script (~3 minutes)
2. Warmup routine (~2 minutes)
3. Main movements (see below)
4. Cooldown sequence (~3 minutes)
5. Closing meditation (~4 minutes)
6. HomeCare advice (~1 minute)

**34 Pilates Movements:**
- Beginner: 14 movements (~2-3 min each)
- Intermediate: 10 movements (~3-4 min each)
- Advanced: 10 movements (~4-5 min each)

**Total Files:** 40 audio files

### Audio Optimization Strategy

**Format:** MP3 (best browser compatibility)

**Bitrate:** 64 kbps mono (recommended)
- **Why 64 kbps?** Voice narration doesn't need stereo or high bitrate
- **Size reduction:** 75% smaller than 128 kbps stereo
- **Quality:** Perfectly clear for spoken instruction

**File Size Estimates:**
```
Preparation (3 min): 3 × 60 × 64kbps / 8 = 1.44 MB
Warmup (2 min): 2 × 60 × 64kbps / 8 = 0.96 MB
Cooldown (3 min): 3 × 60 × 64kbps / 8 = 1.44 MB
Meditation (4 min): 4 × 60 × 64kbps / 8 = 1.92 MB
HomeCare (1 min): 1 × 60 × 64kbps / 8 = 0.48 MB

Average movement (3 min): 1.44 MB
34 movements × 1.44 MB = 48.96 MB

TOTAL: 6.24 MB (sections) + 48.96 MB (movements) = ~55 MB
```

### Storage: Supabase Storage

**Cost:** $0.021/GB per month
```
55 MB ÷ 1024 = 0.054 GB
0.054 GB × $0.021 = $0.001134/month (~$0.01/month)
```

**Bandwidth:** $0.09/GB
```
Assumptions:
- 100 active users/month
- Each user generates 1 class (hears ~10 audio files)
- Average file: 1.5 MB

100 users × 10 files × 1.5 MB = 1,500 MB = 1.5 GB
1.5 GB × $0.09 = $0.14/month bandwidth
```

**Phase 1 Total Cost:** ~$0.15/month

### Technical Implementation

**Database Schema Updates:**
```sql
-- Already exists (Session 13.5)
ALTER TABLE movements
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration_seconds INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

-- Add to class sections (new)
ALTER TABLE preparation_scripts ADD COLUMN audio_url TEXT;
ALTER TABLE warmup_routines ADD COLUMN audio_url TEXT;
ALTER TABLE cooldown_sequences ADD COLUMN audio_url TEXT;
ALTER TABLE closing_meditation_scripts ADD COLUMN audio_url TEXT;
ALTER TABLE closing_homecare_advice ADD COLUMN audio_url TEXT;
```

**Upload Process:**
1. Record audio files (using any recording software)
2. Compress to 64 kbps mono MP3
3. Upload to Supabase Storage bucket: `movement-voiceovers`
4. Update database with URLs
5. Test playback on mobile (iOS Safari, Android Chrome)

**Cache Configuration:**
```sql
-- Supabase Storage bucket settings
{
  "cacheControl": "public, max-age=31536000, immutable"
}
```
(Audio files never change once recorded, so cache for 1 year)

---

## 📹 Phase 2: Video Implementation with AWS Credits (2-3 Months)

### Timeline
**Start:** 2-3 months after Phase 1 (after audio recording complete)
**Duration:** ~11.7 months (credit lifespan)
**Completion:** Before AWS credits expire (~1 year from activation)

### Video Content to Create

**34 Pilates Movements:**
- Beginner: 14 movements (~1-2 min videos)
- Intermediate: 10 movements (~2-3 min videos)
- Advanced: 10 movements (~3-4 min videos)

**Total Files:** 34 videos (sections don't need video, only movements)

### Video Optimization Strategy

**Format:** H.264 (MP4 container)
- Best browser compatibility (iOS Safari, Android Chrome, desktop)
- Hardware decoding support (battery-efficient on mobile)

**Encoding:** Adaptive Bitrate Streaming (HLS)
```
Resolution | Bitrate | File Size (2 min video) | Use Case
-----------|---------|-------------------------|----------
480p       | 1 Mbps  | 15 MB                   | Mobile 3G/4G
720p       | 2.5 Mbps| 37.5 MB                 | Mobile WiFi, Desktop
1080p      | 5 Mbps  | 75 MB                   | Desktop, High-quality
```

**Storage Requirements:**
```
34 movements × (15 MB + 37.5 MB + 75 MB) = 34 × 127.5 MB = 4.34 GB
```

### AWS Services to Use

**S3 Storage:** $0.023/GB per month
```
4.34 GB × $0.023 = $0.10/month
```

**CloudFront CDN:** $0.085/GB delivery
```
Assumptions:
- 100 active users/month
- Each user watches 5 movements (mix of resolutions)
- Average: 40 MB per movement

100 users × 5 movements × 40 MB = 20 GB
20 GB × $0.085 = $1.70/month
```

**Monthly Cost:** $1.80/month
**With $1,000 Credits:** $1,000 ÷ $1.80 = **555 months free** (but credits expire in 12 months)

**Realistic Usage with Credits:**
```
Assuming growth to 500 users/month after 6 months:
500 users × 5 movements × 40 MB = 100 GB/month
100 GB × $0.085 = $8.50/month bandwidth + $0.10 storage = $8.60/month

$1,000 ÷ $8.60 = 116 months worth of credits
But credits expire after 12 months!
```

**Credit Lifespan:** ~11-12 months (regardless of usage)

### AWS Gotchas & Mitigation

**Gotcha 1: Credit Expiration**
- AWS Activate credits expire 12 months from activation
- **Mitigation:** Plan migration to Cloudflare R2 at month 10

**Gotcha 2: Auto-Billing After Credits**
- If credits run out, AWS charges your credit card automatically
- **Mitigation:** Set billing alarms at $50, $100, $200

**Gotcha 3: Data Transfer Costs**
- CloudFront bandwidth: $0.085/GB (first 10 TB)
- Scales poorly compared to Cloudflare R2 (free bandwidth)
- **Mitigation:** Migrate to R2 before credits expire

**Gotcha 4: S3 Request Costs**
- GET requests: $0.0004 per 1,000 requests
- Small but adds up at scale
- **Mitigation:** CloudFront caching + R2 migration

### Technical Implementation

**Database Schema Updates:**
```sql
ALTER TABLE movements
  ADD COLUMN video_url TEXT,
  ADD COLUMN video_thumbnail_url TEXT,
  ADD COLUMN video_duration_seconds INTEGER,
  ADD COLUMN video_resolutions JSONB; -- ["480p", "720p", "1080p"]
```

**Upload Process:**
1. Record movement videos (professional filming)
2. Encode to H.264 at 3 resolutions (ffmpeg)
3. Upload to AWS S3 bucket: `bassline-movement-videos`
4. Create CloudFront distribution
5. Update database with CloudFront URLs
6. Test adaptive bitrate streaming

**Encoding Script (ffmpeg):**
```bash
# 480p
ffmpeg -i input.mov -vf scale=-2:480 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k output-480p.mp4

# 720p
ffmpeg -i input.mov -vf scale=-2:720 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 192k output-720p.mp4

# 1080p
ffmpeg -i input.mov -vf scale=-2:1080 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 256k output-1080p.mp4
```

---

## 🔄 Phase 3: Migration to Cloudflare R2 (Month 10)

### Timeline
**Start:** Month 10 of AWS credits (2 months before expiration)
**Duration:** 2 weeks (testing + migration)
**Completion:** Before AWS credits expire

### Why Migrate to Cloudflare R2?

**Cost Comparison (100 GB/month bandwidth):**
```
AWS CloudFront: $8.50/month bandwidth + $0.10 storage = $8.60/month
Cloudflare R2:  $0.00/month bandwidth + $1.50 storage = $1.50/month
SAVINGS: $7.10/month (82% reduction)
```

**Free Bandwidth:** R2 has **zero egress fees** (vs AWS $0.085/GB)

**S3 Compatibility:** R2 supports S3 API, making migration straightforward

### Migration Process

**Step 1: Create R2 Bucket**
```bash
# Via Cloudflare dashboard
# Bucket name: bassline-movement-videos
# Region: Automatic (Cloudflare's edge network)
```

**Step 2: Install AWS CLI + Configure R2**
```bash
# Install AWS CLI
brew install awscli

# Configure for R2
aws configure
# Access Key ID: [from Cloudflare R2 dashboard]
# Secret Access Key: [from Cloudflare R2 dashboard]
# Region: auto
# Endpoint: https://<account-id>.r2.cloudflarestorage.com
```

**Step 3: Sync Files from S3 to R2**
```bash
# Dry run first
aws s3 sync s3://bassline-movement-videos/ s3://bassline-movement-videos/ --dryrun --endpoint-url=https://<account-id>.r2.cloudflarestorage.com

# Actual sync
aws s3 sync s3://bassline-movement-videos/ s3://bassline-movement-videos/ --endpoint-url=https://<account-id>.r2.cloudflarestorage.com
```

**Step 4: Update Database URLs**
```sql
-- Replace AWS CloudFront URLs with R2 public URLs
UPDATE movements
SET video_url = REPLACE(video_url, 'd1234567890abc.cloudfront.net', 'pub-<id>.r2.dev')
WHERE video_url LIKE '%cloudfront.net%';
```

**Step 5: Test Video Playback**
- Test on iOS Safari, Android Chrome, desktop browsers
- Verify adaptive bitrate streaming still works
- Check mobile data usage (should be optimized)

**Step 6: Monitor for 1 Week**
- Watch error logs for video playback failures
- Check R2 analytics for bandwidth usage
- Validate cost is as expected (~$1.50/month)

**Step 7: Delete AWS S3 Bucket**
- Export billing report (for records)
- Delete CloudFront distribution
- Delete S3 bucket
- Close AWS account (optional, keep for future credits)

---

## 🚀 Phase 4: Long-Term Scaling on R2 (Post-Migration)

### Timeline
**Start:** After R2 migration complete
**Duration:** Ongoing

### Cost Projections at Scale

**Current State (100 users/month):**
```
Storage: 4.34 GB × $0.015/GB = $0.07/month
Bandwidth: 100 GB × $0.00 = $0.00/month (R2 free bandwidth!)
TOTAL: $0.07/month
```

**Growth to 500 users/month:**
```
Storage: 4.34 GB × $0.015/GB = $0.07/month (same, videos don't grow)
Bandwidth: 500 GB × $0.00 = $0.00/month (R2 free bandwidth!)
TOTAL: $0.07/month
```

**Growth to 2,000 users/month:**
```
Storage: 4.34 GB × $0.015/GB = $0.07/month
Bandwidth: 2,000 GB × $0.00 = $0.00/month (R2 free bandwidth!)
TOTAL: $0.07/month
```

**Growth to 10,000 users/month (PMF achieved):**
```
Storage: 10 GB (more movements added) × $0.015 = $0.15/month
Bandwidth: 10,000 GB × $0.00 = $0.00/month (R2 free bandwidth!)
TOTAL: $0.15/month
```

**Key Insight:** Cloudflare R2's free bandwidth means costs stay **flat as you scale** (only storage grows, not bandwidth).

### Audio + Video Total Costs

**At 10,000 users/month:**
```
Supabase Audio Storage: $0.01/month
Supabase Audio Bandwidth: $13.50/month (150 GB)
Cloudflare R2 Video Storage: $0.15/month
Cloudflare R2 Video Bandwidth: $0.00/month (FREE!)
TOTAL: $13.66/month
```

**Compared to All-AWS Alternative:**
```
S3 Audio + Video Storage: $0.23/month
CloudFront Audio + Video Bandwidth: $935/month (11,000 GB × $0.085)
TOTAL: $935/month
```

**R2 Savings at Scale:** $921/month (98.5% reduction!)

### Monitoring & Maintenance

**Monthly Checklist:**
- [ ] Review Cloudflare R2 analytics (bandwidth usage)
- [ ] Review Supabase Storage analytics (audio bandwidth)
- [ ] Check video playback error rates (frontend logs)
- [ ] Monitor mobile data usage (user feedback)
- [ ] Verify cache hit rates (should be >90%)

**Quarterly Checklist:**
- [ ] Audit unused files (delete old test videos)
- [ ] Review video encoding settings (H.265 adoption?)
- [ ] Evaluate new compression technologies (AV1 codec?)
- [ ] Survey users on video quality satisfaction

**Annual Checklist:**
- [ ] Re-evaluate AWS vs R2 vs competitors
- [ ] Consider video hosting alternatives (Mux, Cloudflare Stream)
- [ ] Review total infrastructure costs vs revenue

---

## 📋 Implementation Checklists

### Phase 1 Checklist (Audio)

**Pre-Recording:**
- [ ] Set up recording environment (quiet room, good microphone)
- [ ] Create script templates for 6 class sections
- [ ] Create script templates for 34 movements
- [ ] Test recording quality (64 kbps mono MP3)

**Recording:**
- [ ] Record 6 class sections (~10 files total)
- [ ] Record 34 movement instructions (~34 files)
- [ ] Review recordings for clarity/pacing
- [ ] Re-record any unclear audio

**Upload:**
- [ ] Create Supabase Storage bucket: `movement-voiceovers`
- [ ] Set cache headers: `public, max-age=31536000, immutable`
- [ ] Upload all MP3 files
- [ ] Update database with URLs
- [ ] Test playback on desktop (Chrome, Safari, Firefox)
- [ ] Test playback on mobile (iOS Safari, Android Chrome)

**Verification:**
- [ ] All 40 files play correctly
- [ ] Music ducking works (drops to 20% volume)
- [ ] Auto-play triggers when movement starts
- [ ] No CORS errors in browser console
- [ ] Audio quality acceptable on mobile speakers

### Phase 2 Checklist (Video on AWS)

**Pre-Production:**
- [ ] Hire videographer or DIY setup
- [ ] Create 34 movement video scripts (visual + voiceover)
- [ ] Set up lighting, camera angles, backdrop

**Production:**
- [ ] Film 34 movements (3 angles each for editing)
- [ ] Review raw footage
- [ ] Edit videos (add overlays, captions if needed)

**Encoding:**
- [ ] Install ffmpeg
- [ ] Encode all videos to 480p/720p/1080p
- [ ] Create thumbnails (first frame or custom design)

**AWS Setup:**
- [ ] Activate AWS Activate credits ($1,000)
- [ ] Create S3 bucket: `bassline-movement-videos`
- [ ] Configure bucket CORS for video streaming
- [ ] Create CloudFront distribution
- [ ] Set up billing alarms ($50, $100, $200)

**Upload:**
- [ ] Upload all video files to S3
- [ ] Upload thumbnails to S3
- [ ] Update database with CloudFront URLs
- [ ] Test video playback on desktop
- [ ] Test video playback on mobile (iOS, Android)
- [ ] Test adaptive bitrate switching (throttle network)

**Monitoring:**
- [ ] Monitor AWS billing dashboard weekly
- [ ] Track CloudFront bandwidth usage
- [ ] Set calendar reminder for Phase 3 migration (month 10)

### Phase 3 Checklist (Migration to R2)

**Pre-Migration:**
- [ ] Create Cloudflare account
- [ ] Enable R2 on Cloudflare account
- [ ] Create R2 bucket: `bassline-movement-videos`
- [ ] Generate R2 API credentials
- [ ] Configure AWS CLI for R2 endpoint

**Migration:**
- [ ] Dry-run sync from S3 to R2
- [ ] Actual sync from S3 to R2
- [ ] Verify file count matches (34 movements × 3 resolutions + thumbnails)
- [ ] Update database URLs (S3 → R2)
- [ ] Deploy frontend with updated URLs

**Testing:**
- [ ] Test video playback on desktop (all browsers)
- [ ] Test video playback on mobile (iOS, Android)
- [ ] Test adaptive bitrate streaming
- [ ] Monitor error logs for 48 hours
- [ ] Check R2 bandwidth analytics

**Cleanup:**
- [ ] Export AWS billing report (for records)
- [ ] Delete CloudFront distribution
- [ ] Delete S3 bucket (after 7-day grace period)
- [ ] Remove AWS credentials from environment

### Phase 4 Checklist (Long-Term Scaling)

**Monthly:**
- [ ] Review R2 analytics (storage + requests)
- [ ] Review Supabase audio bandwidth
- [ ] Check video playback error rates
- [ ] Monitor user feedback on video quality

**Quarterly:**
- [ ] Audit unused files
- [ ] Review encoding settings (consider H.265/AV1)
- [ ] Evaluate new CDN features
- [ ] Survey users on satisfaction

**Annual:**
- [ ] Re-evaluate infrastructure stack
- [ ] Consider alternatives (Mux, Cloudflare Stream)
- [ ] Review costs vs revenue

---

## 🎓 Key Learnings & Best Practices

### Audio Best Practices

1. **Use 64 kbps mono MP3 for voice narration** - 75% size reduction vs stereo, no quality loss
2. **Set long cache headers** - Audio files never change, cache for 1 year
3. **Pre-generate all audio** - Don't use TTS in real-time (expensive, unreliable)
4. **Test on iOS Safari** - Most restrictive browser for audio playback

### Video Best Practices

1. **Encode at 3 resolutions** - Adaptive bitrate improves mobile experience
2. **Use H.264, not H.265 yet** - Better browser compatibility (iOS Safari issues with H.265)
3. **Generate thumbnails** - Improves perceived performance (shows image before video loads)
4. **Test on mobile data** - Video should adapt to slow connections

### Cost Optimization Best Practices

1. **Separate audio and video storage** - Different optimization strategies
2. **Migrate before credits expire** - Don't get stuck with unexpected AWS bills
3. **Monitor bandwidth usage** - Set alerts before costs spike
4. **Use free-tier CDNs** - Cloudflare R2 free bandwidth is game-changing

### AWS Credits Best Practices

1. **Activate credits only when ready to use** - 12-month clock starts on activation
2. **Set billing alarms immediately** - $50, $100, $200 thresholds
3. **Plan migration 2 months early** - Don't rush migration when credits expire
4. **Export billing reports monthly** - Track credit usage over time

---

## 📞 Support & Resources

### AWS Activate Program
- **Portal:** https://aws.amazon.com/activate/
- **Credits Dashboard:** AWS Console → Billing → Credits
- **Expiration:** Check "Valid Until" date in credits dashboard

### Cloudflare R2
- **Documentation:** https://developers.cloudflare.com/r2/
- **Pricing:** https://developers.cloudflare.com/r2/pricing/
- **Migration Guide:** https://developers.cloudflare.com/r2/examples/aws-sdk-for-javascript/

### Supabase Storage
- **Documentation:** https://supabase.com/docs/guides/storage
- **Pricing:** https://supabase.com/pricing
- **CDN:** https://supabase.com/docs/guides/storage/cdn

### Video Encoding
- **ffmpeg Documentation:** https://ffmpeg.org/documentation.html
- **H.264 Encoding Guide:** https://trac.ffmpeg.org/wiki/Encode/H.264
- **Adaptive Bitrate:** https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/Live_streaming_web_audio_and_video

---

## ✅ Success Metrics

### Phase 1 Success Criteria
- [ ] All 40 audio files recorded and uploaded
- [ ] Audio playback works on iOS Safari, Android Chrome, desktop browsers
- [ ] Music ducking to 20% volume confirmed working
- [ ] Total cost: <$0.20/month

### Phase 2 Success Criteria
- [ ] All 34 movement videos filmed and encoded
- [ ] Adaptive bitrate streaming works on mobile
- [ ] AWS billing stays under $10/month (well within credits)
- [ ] Video quality rated 4+ stars by beta testers

### Phase 3 Success Criteria
- [ ] Migration to R2 complete with zero downtime
- [ ] Video playback works identically on R2 vs AWS
- [ ] Cost reduced from $8.60/month (AWS) to $1.50/month (R2)
- [ ] No increase in error rates post-migration

### Phase 4 Success Criteria
- [ ] Infrastructure costs stay flat as user base grows
- [ ] Video playback uptime >99.9%
- [ ] Mobile users rate video quality 4+ stars
- [ ] Total infrastructure cost <2% of monthly revenue (at scale)

---

**Next Actions:**
1. Start Phase 1: Record audio files
2. Set calendar reminder for Phase 2 (2-3 months from now)
3. Set calendar reminder for Phase 3 migration (month 10 of AWS credits)
4. Bookmark this roadmap for quarterly reviews
