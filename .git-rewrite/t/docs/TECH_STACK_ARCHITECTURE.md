# Pilates Class Generator - Tech Stack Architecture

**Last Updated:** December 15, 2025
**Purpose:** Comprehensive guide to understanding how all pieces of the tech stack communicate

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Service Breakdown](#service-breakdown)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Communication Patterns](#communication-patterns)
5. [AI Mode vs DEFAULT Mode](#ai-mode-vs-default-mode)
6. [Cost Breakdown](#cost-breakdown)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## High-Level Overview

### The 5 Core Services

Your application uses **5 external services** that work together:

| Service | Purpose | Monthly Cost | URL |
|---------|---------|--------------|-----|
| **Netlify** | Hosts frontend React app | Free (hobby tier) | basslinemvp.netlify.app |
| **Render** | Hosts backend FastAPI + orchestrator | Free (hobby tier) | pilates-class-generator-api3.onrender.com |
| **Supabase** | PostgreSQL database + auth | $25/month (paid tier) | lixvcebtwusmaipodcpc.supabase.co |
| **AWS S3** | Video file storage | ~$0.05/month | s3://bassline-pilates-videos |
| **AWS CloudFront** | Video CDN (global delivery) | ~$0.02/month | d1chkg8zq1g5j8.cloudfront.net |

**Total Monthly Cost:** ~$25.07/month

---

## Service Breakdown

### 1. Netlify (Frontend Hosting)

**What it does:**
- Hosts your React application (built with Vite)
- Serves static files (HTML, CSS, JavaScript, images)
- Provides global CDN for fast page loads
- Handles client-side routing (SPA)

**What it talks to:**
- ✅ **Render** (backend API) - HTTPS requests for data
- ✅ **Supabase** (auth only) - User authentication
- ❌ Does NOT talk to S3 or CloudFront directly

**Key Configuration:**
- `netlify.toml` - Build settings, redirects, security headers
- `frontend/public/_headers` - CSP (Content Security Policy)

---

### 2. Render (Backend API Hosting)

**What it does:**
- Hosts FastAPI backend (Python)
- Provides REST API endpoints (`/api/*`)
- Orchestrates AI agent workflows (when AI mode ON)
- Handles business logic and data validation

**What it talks to:**
- ✅ **Supabase** - Reads/writes all class data
- ✅ **OpenAI** - LLM calls for AI-generated content (when AI mode ON)
- ✅ **Internet Archive** - Streams music during class playback
- ❌ Does NOT talk to S3 or CloudFront (that's frontend → CDN)

**Key Configuration:**
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `OPENAI_API_KEY`

---

### 3. Supabase (Database + Auth)

**What it does:**
- PostgreSQL database (stores all class content)
- User authentication (JWT tokens)
- Row-Level Security (RLS) for data access
- Real-time subscriptions (not used yet)

**What it talks to:**
- ✅ **Render** - API calls for CRUD operations
- ✅ **Netlify** - Auth token validation
- ❌ Does NOT talk to S3, CloudFront, or OpenAI

**Key Tables:**
- `movements` - 34 classical Pilates movements
- `preparation_scripts` - Centering/breathing scripts
- `warmup_routines` - Warm-up sequences
- `cooldown_sequences` - Cool-down stretches
- `closing_meditation_scripts` - Meditation scripts
- `closing_homecare_advice` - Post-class care tips
- `music_tracks` - Music library (Internet Archive URLs)
- `class_plans` - Saved user classes

---

### 4. AWS S3 (Video Storage)

**What it does:**
- Stores raw video files (MP4 format)
- Private bucket (not publicly accessible)
- Origin for CloudFront CDN

**What it talks to:**
- ✅ **CloudFront** - CloudFront pulls videos from S3
- ❌ Does NOT talk to Netlify, Render, or Supabase

**Key Configuration:**
- Bucket: `bassline-pilates-videos`
- Region: `us-east-1`
- Access: Private (only CloudFront can read)

---

### 5. AWS CloudFront (Video CDN)

**What it does:**
- Global CDN for video delivery
- Caches videos at edge locations worldwide
- Provides HTTPS URLs for video streaming
- Dramatically faster than serving from S3 directly

**What it talks to:**
- ✅ **S3** - Fetches origin videos (on cache miss)
- ✅ **Netlify** - Serves videos to frontend browsers
- ❌ Does NOT talk to Render or Supabase

**Key Configuration:**
- Distribution: `d1chkg8zq1g5j8.cloudfront.net`
- Origin: `bassline-pilates-videos.s3.amazonaws.com`
- Cache behavior: 1 year TTL

---

## Data Flow Diagrams

### Scenario 1: User Loads the App

```
┌──────────┐
│  User's  │
│ Browser  │
└─────┬────┘
      │
      │ 1. HTTPS GET https://basslinemvp.netlify.app
      ↓
┌─────────────┐
│   Netlify   │  ← Serves React app (HTML/CSS/JS)
│  (Frontend) │
└─────────────┘

Result: User sees home page, no backend calls yet
```

---

### Scenario 2: User Logs In

```
┌──────────┐
│  User's  │
│ Browser  │
└─────┬────┘
      │
      │ 1. Click "Login"
      ↓
┌─────────────┐
│   Netlify   │  ← React login form
│  (Frontend) │
└─────┬───────┘
      │
      │ 2. POST /api/auth/login
      ↓
┌─────────────┐
│   Render    │
│  (Backend)  │
└─────┬───────┘
      │
      │ 3. SELECT FROM users WHERE email = ?
      ↓
┌─────────────┐
│  Supabase   │  ← Validates credentials
│ (Database)  │
└─────┬───────┘
      │
      │ 4. Return JWT token
      ↑
      │ 5. Store token in localStorage
┌─────────────┐
│  Browser    │
└─────────────┘

Result: User authenticated, token stored
```

---

### Scenario 3: User Generates Class (DEFAULT Mode - AI OFF)

```
┌──────────┐
│  User's  │
│ Browser  │
└─────┬────┘
      │
      │ 1. Click "Generate Class" (AI toggle OFF)
      ↓
┌─────────────┐
│   Netlify   │
│  (Frontend) │
└─────┬───────┘
      │
      │ 2. POST /api/agents/generate-complete-class
      │    { difficulty: "Beginner", duration: 45, use_ai_agent: false }
      ↓
┌─────────────┐
│   Render    │  ← Routes to database query functions
│  (Backend)  │
└─────┬───────┘
      │
      │ 3. SELECT * FROM preparation_scripts WHERE difficulty = 'Beginner'
      │ 4. SELECT * FROM warmup_routines WHERE difficulty = 'Beginner'
      │ 5. SELECT * FROM movements WHERE difficulty = 'Beginner' ORDER BY RANDOM() LIMIT 9
      │ 6. SELECT * FROM cooldown_sequences WHERE intensity = 'gentle'
      │ 7. SELECT * FROM closing_meditation_scripts WHERE theme = 'body_scan'
      │ 8. SELECT * FROM closing_homecare_advice WHERE focus_area = 'general'
      ↓
┌─────────────┐
│  Supabase   │  ← Returns database records
│ (Database)  │
└─────┬───────┘
      │
      │ 9. Return complete 6-section class (JSON)
      ↑
┌─────────────┐
│  Frontend   │  ← Displays results modal
└─────────────┘

Duration: <1 second
Cost: $0.00 (no LLM calls)
Result: Database-selected class
```

---

### Scenario 4: User Generates Class (AI Mode - AI ON)

```
┌──────────┐
│  User's  │
│ Browser  │
└─────┬────┘
      │
      │ 1. Click "Generate Class" (AI toggle ON)
      ↓
┌─────────────┐
│   Netlify   │
│  (Frontend) │
└─────┬───────┘
      │
      │ 2. POST /api/agents/generate-complete-class
      │    { difficulty: "Beginner", duration: 45, use_ai_agent: true }
      ↓
┌──────────────────┐
│     Render       │
│   (Backend)      │
│                  │
│  ┌────────────┐  │
│  │ Standard   │  │  ← Jentic StandardAgent
│  │   Agent    │  │
│  └─────┬──────┘  │
│        │         │
│        │ PLAN: LLM generates 6-step workflow
│        ↓         │
│  ┌────────────┐  │
│  │  OpenAI    │  │  ← LLM call #1 (planning)
│  │  GPT-4     │  │
│  └─────┬──────┘  │
│        │         │
│        │ EXECUTE: Run tools for each section
│        ↓         │
│  ┌────────────┐  │
│  │ Tool: gen  │  │  ← generate_preparation()
│  │ preparation│  │
│  └─────┬──────┘  │
│        ↓         │
│  ┌────────────┐  │
│  │  OpenAI    │  │  ← LLM call #2 (content generation)
│  │  GPT-4     │  │
│  └─────┬──────┘  │
│        │         │
│  ┌────────────┐  │
│  │ Tool: res  │  │  ← research_warmup() (MCP Playwright)
│  │ warmup     │  │
│  └─────┬──────┘  │
│        │         │
│  ┌────────────┐  │
│  │ Tool: gen  │  │  ← generate_homecare()
│  │ homecare   │  │
│  └─────┬──────┘  │
│        ↓         │
│  ┌────────────┐  │
│  │  OpenAI    │  │  ← LLM call #3 (content generation)
│  │  GPT-4     │  │
│  └─────┬──────┘  │
│        │         │
│        │ REFLECT: Validate quality
│        ↓         │
│  ┌────────────┐  │
│  │  OpenAI    │  │  ← LLM call #4 (reflection)
│  │  GPT-4     │  │
│  └─────┬──────┘  │
└────────┼─────────┘
         │
         │ 10. Database fallback for sections not AI-generated
         ↓
┌─────────────┐
│  Supabase   │  ← SELECT meditation, cooldown (not AI-generated)
│ (Database)  │
└─────┬───────┘
      │
      │ 11. Return AI-generated + database content (JSON)
      ↑
┌─────────────┐
│  Frontend   │  ← Displays results modal
└─────────────┘

Duration: ~38 seconds (LLM processing time)
Cost: ~$0.20-0.30 per class (OpenAI API calls)
Result: AI-generated preparation, warmup, homecare + database meditation, cooldown
```

---

### Scenario 5: User Plays Class with Video

```
┌──────────┐
│  User's  │
│ Browser  │
└─────┬────┘
      │
      │ 1. Click "Play Class"
      ↓
┌─────────────┐
│   Netlify   │  ← Loads ClassPlayback component
│  (Frontend) │
└─────┬───────┘
      │
      │ 2. Render video element with src="https://d1chkg8zq1g5j8.cloudfront.net/The_Hundred_Placeholder.mp4"
      ↓
┌─────────────┐
│ CloudFront  │  ← Checks cache (edge location near user)
│    (CDN)    │
└─────┬───────┘
      │
      │ 3. Cache HIT? Return video immediately
      │    Cache MISS? Fetch from S3 origin
      ↓
┌─────────────┐
│   AWS S3    │  ← Sends video to CloudFront (only on cache miss)
│  (Storage)  │
└─────┬───────┘
      │
      │ 4. Stream video chunks to browser
      ↑
┌─────────────┐
│  Browser    │  ← <video> element plays video
└─────────────┘

Duration: 50-200ms (cached), 500-1000ms (uncached)
Result: Picture-in-picture video plays during movement
```

---

### Scenario 6: Music Playback During Class

```
┌──────────┐
│  User's  │
│ Browser  │
└─────┬────┘
      │
      │ 1. Class starts, fetch music playlist
      ↓
┌─────────────┐
│   Netlify   │
│  (Frontend) │
└─────┬───────┘
      │
      │ 2. GET /api/music/playlists?stylistic_period=BAROQUE
      ↓
┌─────────────┐
│   Render    │
│  (Backend)  │
└─────┬───────┘
      │
      │ 3. SELECT * FROM music_tracks WHERE stylistic_period = 'BAROQUE'
      ↓
┌─────────────┐
│  Supabase   │  ← Returns track list with archive.org URLs
│ (Database)  │
└─────┬───────┘
      │
      │ 4. Return playlist JSON:
      │    { tracks: [{ audio_url: "https://archive.org/..." }] }
      ↑
┌─────────────┐
│  Frontend   │
└─────┬───────┘
      │
      │ 5. <audio> element loads track from archive.org
      ↓
┌─────────────┐
│  Internet   │  ← Streams MP3 audio file
│  Archive    │
└─────┬───────┘
      │
      │ 6. Stream audio to browser
      ↑
┌─────────────┐
│  Browser    │  ← Music plays in background
└─────────────┘

Note: Music URLs stored in database, but files streamed from archive.org CDN
```

---

## Communication Patterns

### Authentication Flow

**JWT Token Pattern:**

```
1. User logs in → Render creates JWT token
2. Render stores token in localStorage (frontend)
3. Every API request includes token in Authorization header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
4. Render validates token on every request
5. Token expires after 24 hours → user must re-login
```

**Security Headers (CSP):**

```
Content-Security-Policy in netlify.toml:
- script-src: Only Netlify + archive.org
- style-src: Only Netlify (+ 'unsafe-inline' for Tailwind)
- img-src: Netlify + Supabase Storage
- media-src: archive.org + Supabase + CloudFront
- connect-src: Render API + Supabase + archive.org
```

---

### Database Access Pattern

**Render is the ONLY service that writes to Supabase:**

```
Frontend → Render → Supabase ✅ (correct)
Frontend → Supabase ❌ (blocked by RLS)
```

**Why?**
- Supabase Row-Level Security (RLS) blocks direct frontend access
- All business logic in backend ensures data integrity
- Frontend only reads/writes through API endpoints

---

### Video Delivery Pattern

**Two-Tier CDN Strategy:**

```
S3 (Origin) → CloudFront (CDN) → User's Browser

Benefits:
- S3: Cheap storage ($0.023/GB/month)
- CloudFront: Fast global delivery (50-200ms latency)
- Cache: Video served from edge location near user
- HTTPS: Secure video streaming
```

**Cost Comparison:**

| Delivery Method | 1000 views | 10,000 views | 100,000 views |
|----------------|------------|--------------|---------------|
| S3 Direct | $0.90 | $9.00 | $90.00 |
| CloudFront CDN | $0.09 | $0.90 | $9.00 |
| **Savings** | **90%** | **90%** | **90%** |

---

## AI Mode vs DEFAULT Mode

### DEFAULT Mode (AI Toggle OFF)

**Data Source:** 100% Database (Supabase)

```
User Request
   ↓
Render Backend
   ↓
Supabase Query (SELECT * FROM ...)
   ↓
Return Class
```

**Characteristics:**
- ⚡ **Fast:** <1 second response time
- 💰 **Free:** No LLM costs
- 🔄 **Consistent:** Same content each time
- 📚 **Pre-written:** All content pre-loaded in database

**Use Case:** Default mode for all users

---

### AI Mode (AI Toggle ON)

**Data Source:** AI-Generated + Database Hybrid

```
User Request
   ↓
Render Backend
   ↓
StandardAgent (Jentic)
   ├─ PLAN (LLM)
   ├─ EXECUTE (Tools + LLM)
   │   ├─ generate_preparation() → OpenAI GPT-4
   │   ├─ research_warmup() → MCP Playwright + Web
   │   ├─ generate_sequence() → Database (safety rules)
   │   ├─ research_cooldown() → MCP Playwright + Web
   │   ├─ select_meditation() → Database
   │   └─ generate_homecare() → OpenAI GPT-4
   └─ REFLECT (LLM)
   ↓
Return Class
```

**Characteristics:**
- 🐌 **Slower:** ~38 seconds response time
- 💰 **Costly:** ~$0.20-0.30 per class
- ✨ **Unique:** Different content each time
- 🎯 **Personalized:** Tailored to user preferences

**Use Case:** Admin-only (hidden from public users)

---

### What's AI-Generated vs Database?

| Section | DEFAULT Mode | AI Mode |
|---------|--------------|---------|
| **1. Preparation** | Database | ✨ **AI-Generated** (OpenAI GPT-4) |
| **2. Warmup** | Database | 🔍 **Web-Researched** (MCP Playwright) |
| **3. Movements** | Database | 🗄️ Database (safety rules require deterministic logic) |
| **4. Cooldown** | Database | 🔍 **Web-Researched** (MCP Playwright) |
| **5. Meditation** | Database | 🗄️ Database (templates) |
| **6. HomeCare** | Database | ✨ **AI-Generated** (OpenAI GPT-4) |

**Key Insight:** Only 2 sections (preparation + homecare) are fully AI-generated. Movements use database because safety rules require deterministic logic, not probabilistic LLM generation.

---

## Cost Breakdown

### Monthly Fixed Costs

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| Netlify | Free (Hobby) | $0.00 | 100GB bandwidth, 300 build minutes |
| Render | Free (Hobby) | $0.00 | 750 hours/month, sleeps after 15 min inactivity |
| Supabase | Paid (Pro) | $25.00 | 8GB database, 100GB bandwidth, 50GB storage |
| AWS S3 | Pay-as-you-go | ~$0.05 | 2GB video storage @ $0.023/GB |
| AWS CloudFront | Pay-as-you-go | ~$0.02 | 100 users @ 0.02GB/user = 2GB transfer |
| **Total** | | **$25.07** | |

---

### Per-Class Generation Costs

| Mode | LLM Calls | Cost/Class | Response Time |
|------|-----------|------------|---------------|
| **DEFAULT** | 0 | $0.00 | <1 second |
| **AI Mode** | 4-5 | $0.20-0.30 | ~38 seconds |

**AI Mode Cost Breakdown:**
- PLAN phase: 1 LLM call (~$0.05)
- EXECUTE phase: 2-3 LLM calls (~$0.10-0.15)
- REFLECT phase: 1 LLM call (~$0.05)

**Monthly Cost at Scale:**

| AI Classes/Month | Monthly Cost | Notes |
|------------------|--------------|-------|
| 10 | $2.50 | Light testing |
| 100 | $25.00 | Beta testing |
| 1000 | $250.00 | Early production |

**Why AI Mode is Admin-Only:**
- Cost control: Prevent non-admin users from triggering expensive LLM calls
- Quality control: Ensure AI-generated content meets standards before public release
- Future: Will add Redis caching to reduce duplicate AI generations (70-80% cost savings)

---

## Troubleshooting Guide

### Issue: Videos Not Loading

**Symptoms:** Video element shows error, picture-in-picture doesn't appear

**Check:**
1. ✅ Is CloudFront URL in database? `SELECT video_url FROM movements WHERE name = 'The Hundred';`
2. ✅ Is CloudFront distribution enabled? Check AWS Console
3. ✅ Is CSP allowing CloudFront? Check `netlify.toml` `media-src` includes `https://*.cloudfront.net`
4. ✅ Is S3 bucket policy allowing CloudFront? Check S3 bucket policy
5. ✅ Open CloudFront URL directly in browser - does it load?

**Common Fixes:**
- Run migration 032/033 to add video_url columns
- Update CSP in `netlify.toml` to allow CloudFront domain
- Wait 15-30 minutes for CloudFront cache invalidation

---

### Issue: Music Not Playing

**Symptoms:** "Failed to load background music" error

**Check:**
1. ✅ Is archive.org reachable? Open https://archive.org in browser
2. ✅ Is CSP allowing archive.org? Check `netlify.toml` `media-src`
3. ✅ Are music track URLs correct? `SELECT audio_url FROM music_tracks LIMIT 1;`
4. ✅ Is browser blocking autoplay? Look for "Click to Enable Audio" button

**Common Fixes:**
- User must click "Enable Audio" button (browser autoplay policy)
- Check archive.org rate limits (quota resets at midnight UTC)
- Verify CSP headers allow archive.org streaming

---

### Issue: AI Mode Taking Too Long

**Symptoms:** Timeout error after 30 seconds

**Check:**
1. ✅ Is frontend timeout set to 60s? Check `frontend/src/services/api.ts` line 18
2. ✅ Is OpenAI API responding? Check Render logs for LLM call times
3. ✅ Is Render instance awake? (Free tier sleeps after 15 min inactivity)

**Common Fixes:**
- Increase frontend timeout to 60s (AI mode needs 38s)
- Wait for Render cold start (first request after sleep takes 30-60s)
- Check OpenAI status page for API outages

---

### Issue: Database Query Failing

**Symptoms:** HTTP 500 error from Render API

**Check:**
1. ✅ Is Supabase reachable? Check Supabase dashboard
2. ✅ Are environment variables set? Check Render dashboard
3. ✅ Is RLS blocking query? Check Supabase RLS policies
4. ✅ Are table columns missing? Check migration history

**Common Fixes:**
- Run latest migrations in Supabase SQL Editor
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in Render env vars
- Check Render logs for specific SQL error messages

---

### Issue: Authentication Failed

**Symptoms:** "Session expired" or 401 Unauthorized

**Check:**
1. ✅ Is JWT token in localStorage? Check browser DevTools → Application → Local Storage
2. ✅ Is token expired? JWT tokens expire after 24 hours
3. ✅ Is Supabase auth service up? Check Supabase dashboard

**Common Fixes:**
- Logout and login again to get fresh token
- Clear localStorage and login again
- Check Render logs for JWT validation errors

---

## Summary: The Complete Picture

### Request Flow (DEFAULT Mode)

```
User Browser (Netlify)
   ↓ HTTPS
Backend API (Render)
   ↓ PostgreSQL
Database (Supabase)
   ↓ JSON Response
Backend API (Render)
   ↓ HTTPS
User Browser (Netlify)
```

**Total hops:** 4
**Duration:** <1 second
**Cost:** $0.00

---

### Request Flow (AI Mode)

```
User Browser (Netlify)
   ↓ HTTPS
Backend API (Render)
   ↓ HTTP
StandardAgent (Jentic)
   ├─ LLM Call → OpenAI GPT-4 (4-5 calls)
   ├─ Web Research → MCP Playwright
   └─ Database Query → Supabase
   ↓ JSON Response
Backend API (Render)
   ↓ HTTPS
User Browser (Netlify)
```

**Total hops:** 8-10
**Duration:** ~38 seconds
**Cost:** $0.20-0.30

---

### Media Delivery Flow

```
User Browser (Netlify)
   ├─ Video Request → CloudFront CDN → S3 Storage
   └─ Music Request → Internet Archive CDN
```

**Video latency:** 50-200ms (cached)
**Music latency:** 100-500ms (streamed)

---

## Key Takeaways

1. **Netlify** = Frontend only, no backend logic
2. **Render** = Backend API + AI orchestration
3. **Supabase** = Database + Auth (single source of truth for data)
4. **S3 + CloudFront** = Video storage + global CDN
5. **Internet Archive** = Music streaming (free, public domain)

6. **DEFAULT Mode** = Fast, free, database-only
7. **AI Mode** = Slow, costly, LLM-powered personalization

8. **Videos** = CloudFront → S3 (two-tier CDN)
9. **Music** = Internet Archive (direct streaming)
10. **Data** = Render → Supabase (backend controls all writes)

---

**Questions? See also:**
- `AWS_VIDEO_SETUP_GUIDE.md` - Video infrastructure setup
- `INFRASTRUCTURE_ROADMAP.md` - Scaling strategy
- `CLAUDE.md` - Complete project documentation
