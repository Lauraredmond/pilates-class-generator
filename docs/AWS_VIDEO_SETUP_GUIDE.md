# AWS Video Integration Setup Guide
**Phase 1: "The Hundred" Movement Demonstration**

**Status:** Infrastructure complete (December 15, 2025)
**Next Steps:** AWS setup and video recording (user tasks)

---

## ✅ COMPLETED (Automated Implementation)

**Database:**
- ✅ Migration 032 created: `video_url` column added to `movements` table
- ✅ Index created for video availability checks
- ✅ Database ready for CloudFront URLs

**Frontend:**
- ✅ Picture-in-picture video player implemented in MovementDisplay.tsx
- ✅ Video styling: 375px wide, top-right, rounded corners, shadow
- ✅ TypeScript interface updated with `video_url` field
- ✅ Graceful error handling (hide if video fails to load)

**Backend:**
- ✅ Pydantic model updated with `video_url` field
- ✅ API ready to serve video URLs to frontend

**Git:**
- ✅ Committed to GitHub (commit 1ebcf13)
- ✅ Deployed to production (Render auto-deploy)

---

## 🔴 PENDING (User Must Complete)

### Step 1: AWS Billing Alarms Setup (5-10 minutes)
**CRITICAL: Complete BEFORE activating AWS credits or uploading videos**

1. **Log into AWS Console:** https://console.aws.amazon.com
2. **Navigate to CloudWatch:**
   - Search "CloudWatch" in top search bar
   - Click "CloudWatch" in results

3. **Create 3 Billing Alarms:**

**Alarm 1: $50 Threshold**
- Click "Alarms" → "Create Alarm"
- Click "Select Metric"
- Click "Billing" → "Total Estimated Charge"
- Select "USD" currency
- Click "Select Metric"
- Set threshold type: "Static"
- Set condition: "Greater than"
- Set threshold value: **50**
- Click "Next"
- Click "Create new topic"
- Topic name: "Pilates-Video-Billing-Alerts"
- Email endpoint: **your-email@domain.com** (replace with your actual email)
- Click "Create topic"
- Click "Next"
- Alarm name: "Pilates-Video-$50-Alert"
- Alarm description: "Alert when AWS charges exceed $50"
- Click "Next"
- Click "Create alarm"

**Alarm 2: $100 Threshold**
- Repeat above steps
- Set threshold value: **100**
- Alarm name: "Pilates-Video-$100-Alert"
- Use same SNS topic created above

**Alarm 3: $200 Threshold (CRITICAL)**
- Repeat above steps
- Set threshold value: **200**
- Alarm name: "Pilates-Video-$200-CRITICAL"
- Use same SNS topic created above

4. **Confirm Email Subscription:**
- Check your inbox for AWS SNS subscription confirmation emails (3 total)
- Click "Confirm subscription" in each email
- Verify all 3 alarms show "OK" status in CloudWatch console

---

### Step 2: Create S3 Bucket (10 minutes)

1. **Navigate to S3:**
   - AWS Console → Search "S3" → Click "S3"

2. **Create Bucket:**
   - Click "Create bucket"
   - Bucket name: **pilates-movement-videos** (must be globally unique, add suffix if needed)
   - Region: Choose closest to your users (e.g., us-east-1, eu-west-1)
   - **Block Public Access settings:** UNCHECK "Block all public access"
     - Check the acknowledgement box
     - (CloudFront will serve videos, but bucket needs public read access)
   - Versioning: Disabled (not needed for static videos)
   - Default encryption: Enable (SSE-S3)
   - Click "Create bucket"

3. **Configure Bucket Policy (Public Read Access):**
   - Click on your new bucket name
   - Go to "Permissions" tab
   - Scroll to "Bucket policy"
   - Click "Edit"
   - Paste this policy (replace `YOUR-BUCKET-NAME` with actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

   - Click "Save changes"

4. **Set Lifecycle Policy (Optional but Recommended):**
   - Go to "Management" tab
   - Click "Create lifecycle rule"
   - Rule name: "Transition to Intelligent-Tiering"
   - Choose "Apply to all objects in the bucket"
   - Add transition: Move to Intelligent-Tiering after 30 days
   - Click "Create rule"
   - **Purpose:** Reduces storage costs if videos are accessed infrequently

---

### Step 3: Create CloudFront Distribution (15 minutes)

1. **Navigate to CloudFront:**
   - AWS Console → Search "CloudFront" → Click "CloudFront"

2. **Create Distribution:**
   - Click "Create Distribution"

3. **Origin Settings:**
   - Origin domain: Select your S3 bucket from dropdown (pilates-movement-videos)
   - Origin path: Leave blank
   - Name: Auto-filled (keep default)
   - Origin access: **Origin access control settings (recommended)**
   - Click "Create control setting"
     - Name: pilates-videos-OAC
     - Signing behavior: Sign requests
     - Click "Create"
   - Enable Origin Shield: No (unnecessary for Phase 1, saves costs)

4. **Default Cache Behavior:**
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP methods: **GET, HEAD** (videos are read-only)
   - Cache policy: **CachingOptimized** (from dropdown)
   - **Custom cache headers:**
     - Click "Add custom header"
     - Header name: `Cache-Control`
     - Header value: `public, max-age=31536000, immutable`
     - **Purpose:** 1-year browser caching = fewer origin requests = lower costs

5. **Distribution Settings:**
   - Price class: **Use only North America and Europe** (reduce costs unless you have global users)
   - Alternate domain names (CNAME): Leave blank (use CloudFront URL)
   - SSL certificate: **Default CloudFront certificate**
   - Standard logging: **Off** (saves costs)
   - IPv6: **On** (better performance, no extra cost)

6. **Click "Create Distribution"**
   - Status will be "Deploying" for 5-10 minutes
   - Note the **Distribution domain name** (e.g., `d1234abcd.cloudfront.net`): Actual: d1chkg8zq1g5j8.cloudfront.net
   - **SAVE THIS URL** - you'll need it in Step 5

7. **Update S3 Bucket Policy (Allow CloudFront Access):**
   - After distribution is created, copy the suggested bucket policy from CloudFront console
   - Go back to S3 bucket → Permissions tab → Bucket policy
   - **REPLACE** existing policy with CloudFront's suggested policy
   - Click "Save changes"

---

### Step 4: Record & Encode "The Hundred" Video (30 minutes)

**Video Specifications:**
- Movement: "The Hundred" (most iconic Pilates movement)
- Duration: 2 minutes (full movement demonstration)
- Resolution: 720p (1280x720)
- Frame rate: 30 fps
- Format: H.264 codec, MP4 container
- Target size: ~37.5 MB

**Recording Setup:**
- Camera: iPhone/Android in landscape mode OR webcam
- Lighting: Natural light from front/side (avoid backlighting)
- Background: Plain wall (neutral color)
- Position: Full body visible throughout movement
- Audio: Optional (video will be muted in playback)

**Recording Tips:**
1. Introduce the movement: "This is The Hundred"
2. Demonstrate setup position (supine)
3. Show full movement execution
4. Emphasize breathing pattern (5 pumps inhale, 5 pumps exhale)
5. Show modifications if time allows

**Encoding (if needed):**

If your video is larger than 50 MB, compress it with ffmpeg:

```bash
# Install ffmpeg (macOS):
brew install ffmpeg

# Compress video to 720p H.264:
ffmpeg -i input-video.mov \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black" \
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  the-hundred-720p.mp4
```

**Expected Output:**
- Filename: `the-hundred-720p.mp4`
- Size: ~30-40 MB
- Quality: High (CRF 23)
- Optimized for web streaming (faststart flag)

---

### Step 5: Upload Video to S3 (5 minutes)

1. **Navigate to S3 Bucket:**
   - AWS Console → S3 → Click your bucket name

2. **Upload Video:**
   - Click "Upload"
   - Click "Add files"
   - Select `the-hundred-720p.mp4`
   - Expand "Properties"
   - Storage class: **Standard** (fastest access)
   - Click "Upload"

3. **Verify Upload:**
   - After upload completes, click on the video filename
   - Note the **Object URL** (this is the S3 URL, NOT the CloudFront URL)

---

### Step 6: Update Database with CloudFront URL (2 minutes)

**IMPORTANT:** Use CloudFront URL, NOT S3 URL (for global CDN performance)

1. **Construct CloudFront URL:**
   - CloudFront domain: `d1234abcd.cloudfront.net` (from Step 3)
   - Video filename: `the-hundred-720p.mp4`
   - **Full URL:** `https://d1chkg8zq1g5j8.cloudfront.net/The_Hundred_Placeholder.mp4

2. **Run SQL Migration:**

Open Supabase SQL Editor:

```sql
-- First, run migration 032 to add video_url column (if not already run)
-- See: database/migrations/032_add_video_url_to_movements.sql

-- Then update "The Hundred" movement with video URL
UPDATE movements
SET video_url = 'https://YOUR-CLOUDFRONT-ID.cloudfront.net/the-hundred-720p.mp4'
WHERE name = 'The Hundred';

-- Verify update
SELECT name, video_url
FROM movements
WHERE video_url IS NOT NULL;

-- Expected result: 1 row showing "The Hundred" with CloudFront URL
```

**Replace `YOUR-CLOUDFRONT-ID` with your actual CloudFront distribution ID**

---

### Step 7: Test Video Playback (5 minutes)

1. **Generate Test Class:**
   - Log into https://basslinemvp.netlify.app
   - Generate a Beginner class (AI mode OFF to save costs)
   - Ensure "The Hundred" is included in the movements

2. **Start Class Playback:**
   - Click "Start Class" button
   - Accept Health & Safety disclaimer
   - Enable music playback

3. **Verify Video Playback:**
   - When "The Hundred" movement starts, video should appear:
     - **Location:** Top-right corner
     - **Size:** 375px wide
     - **Behavior:** Auto-plays, muted, loops
     - **Style:** Rounded corners, shadow, cream border
   - Video should play smoothly without buffering
   - If video fails to load, check browser console for errors

4. **Test on Mobile:**
   - Open class on iOS Safari and Android Chrome
   - Verify video plays with `playsInline` attribute (no fullscreen)
   - Check responsive sizing on different screen sizes

---

### Step 8: Set Up Calendar Reminders (5 minutes)

**CRITICAL: Set reminders BEFORE forgetting about credit expiration**

1. **Find AWS Credit Expiration Date:**
   - AWS Console → Billing Dashboard → Credits
   - Note expiration date (likely 12 months from activation)

2. **Create Calendar Events:**

**Event 1: R2 Migration Planning (Month 10)**
- Date: 2 months BEFORE credit expiration
- Title: "AWS Video Migration - Begin R2 Planning"
- Description: "Start planning Cloudflare R2 migration to avoid surprise AWS bills"
- Reminder: 1 week before

**Event 2: R2 Migration Execution (Month 11)**
- Date: 1 month BEFORE credit expiration
- Title: "AWS Video Migration - Execute R2 Migration"
- Description: "Migrate all videos from S3 to Cloudflare R2, update database URLs"
- Reminder: 1 week before

**Event 3: AWS Credit Expiration (Month 12)**
- Date: Day of credit expiration
- Title: "AWS Credits Expired - Verify Zero Charges"
- Description: "Check AWS billing dashboard, confirm $0.00 owed, verify all resources deleted"
- Reminder: 1 day before

---

## Cost Monitoring

**Weekly Check (Every Monday):**

1. **AWS Billing Dashboard:**
   - AWS Console → Billing Dashboard → Bills
   - Verify "Total charges" is <$1.00/month
   - Check "Credits" section shows credits being applied
   - Review "Free tier usage" if applicable

2. **Expected Costs (Phase 1: Single Video):**
   - Storage (37.5 MB): $0.002/month
   - Bandwidth (100 users, 2 views each): ~$0.17/month
   - **Total: ~$0.17/month** (covered by credits)

3. **Warning Signs:**
   - Monthly charge >$0.50 → Investigate immediately
   - Bandwidth charge >$0.20 → More users than expected
   - Storage charge >$0.01 → Extra files uploaded?

---

## Success Metrics

**Phase 1 Goals:**

- [ ] Video loads in <3 seconds globally (CloudFront CDN)
- [ ] >70% users say "video was helpful" in post-class survey
- [ ] AWS charges stay <$0.50/month (well within credits)
- [ ] Video plays on iOS Safari + Android Chrome without issues
- [ ] Zero billing alarms triggered

**User Feedback Survey:**

After class completion, ask:
- "Did the video demonstration for 'The Hundred' help you perform the movement correctly?"
  - [ ] Yes, very helpful (proceed to Phase 2: add more videos)
  - [ ] Somewhat helpful (refine video quality/content)
  - [ ] No, not helpful (pause video expansion)

---

## Troubleshooting

### Video Doesn't Load

**1. Check Browser Console:**
```javascript
// Look for errors like:
// "Failed to load resource: the server responded with a status of 403"
```

**Possible Fixes:**
- Verify S3 bucket policy allows public read access
- Verify CloudFront distribution status is "Deployed" (not "In Progress")
- Check CloudFront OAC (Origin Access Control) is configured
- Test S3 URL directly in browser (should return video)

**2. CORS Issue:**

If video fails with CORS error, update S3 bucket CORS policy:

AWS Console → S3 → Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "https://basslinemvp.netlify.app",
      "http://localhost:5173"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Video Buffers/Lags

**1. Check Video File Size:**
- Should be ~37.5 MB for 2-minute 720p video
- If >50 MB, re-encode with ffmpeg (see Step 4)

**2. Check CloudFront Cache Hit Rate:**
- AWS Console → CloudFront → Your distribution → Monitoring
- "Cache hit rate" should be >80% after a few views
- If <50%, check cache headers (Step 3)

### Billing Alarm Triggered

**If you receive a $50 alarm email:**

1. **Check AWS Billing Dashboard immediately**
2. **Identify charge source:**
   - S3 storage? (should be $0.002/month)
   - CloudFront bandwidth? (should be $0.17/month for 100 users)
   - Unexpected service? (stop it immediately)
3. **Review CloudFront usage:**
   - AWS Console → CloudFront → Reports & Analytics → Usage
   - Check data transfer (should be <10 GB/month for Phase 1)
4. **If legitimate high usage:**
   - Calculate projected monthly cost
   - If >$100/month, begin R2 migration early (don't wait until Month 10)
5. **If illegitimate/unexpected:**
   - Delete CloudFront distribution
   - Delete S3 bucket
   - Contact AWS support to dispute charges

---

## Next Steps After Phase 1 Success

**If >70% users find video helpful:**

**Phase 2: Expand to 5 Core Movements** (Month 2-3)
- The Hundred (already done)
- Roll Up
- Roll Over
- Single Leg Circle
- Rolling Like a Ball
- Storage: 0.21 GB = $0.005/month
- Bandwidth (500 users): ~$0.85/month
- Total: ~$0.86/month (still well within credits)

**Phase 3: Full Beginner Library** (Month 4-6)
- All 14 beginner movements
- Storage: 0.58 GB = $0.013/month
- Bandwidth (500 users): ~$2.38/month
- Total: ~$2.39/month

**Phase 4: All 34 Movements** (Month 7-9)
- Complete classical Pilates library
- Storage: 4.34 GB = $0.10/month
- Bandwidth (500 users): ~$8.50/month
- Total: ~$8.60/month

**Month 10-11: Migrate to Cloudflare R2**
- Cost reduction: $8.60/month → $1.50/month (82% savings)
- Free bandwidth (no matter how many users!)
- See: `/docs/INFRASTRUCTURE_ROADMAP.md` for full migration guide

---

## Support Resources

**AWS Documentation:**
- S3: https://docs.aws.amazon.com/s3/
- CloudFront: https://docs.aws.amazon.com/cloudfront/
- Billing Alarms: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html

**Project Documentation:**
- Infrastructure Roadmap: `/docs/INFRASTRUCTURE_ROADMAP.md`
- AWS Integration Plan: See commit 1ebcf13 message
- Session History: `/CLAUDE.md` (Session 13+)

**Questions?**
- Check troubleshooting section above first
- Review AWS billing dashboard for unexpected charges
- Test video URL directly in browser to isolate issue

---

**Last Updated:** December 15, 2025
**Next Review:** After Phase 1 video upload (Step 6)
