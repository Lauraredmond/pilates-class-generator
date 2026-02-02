# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Pilates Class Planner v2.0** - An intelligent Pilates class planning application that combines domain expertise, AI agents, and web research capabilities to create safe, effective, and personalized Pilates classes.

---

## 🚨 CRITICAL: KNOWN WORKING COMMIT 🚨

**Last Verified Working Version:** `416a8a6` (December 3, 2025)

**Commit Message:** `feat: Enable StandardAgent orchestration for class generation`

**What This Commit Has:**
- ✅ Jentic StandardAgent integrated (modern architecture)
- ✅ Direct tool calling via `call_agent_tool()` (NO ReWOO reasoning overhead)
- ✅ NO Arazzo execution attempts (avoids self-deadlock issues)
- ✅ No LLM costs for basic class generation
- ✅ Proven working - class generator modal displays correctly

**Why This Matters:**
This commit is confirmed working after multiple debugging sessions. Use this as a fallback if future changes break the application.

**To revert to this working state:**
```bash
git reset --hard 416a8a6
git push origin main --force
```

**See:** `NEXT_SESSION_NOTES.md` for details on future work (validation reasoning, questionnaires, ReWOO revisited).

---

## 🎯 DUAL PROJECT GOALS (CRITICAL - READ FIRST)

**This project serves TWO equally important strategic objectives:**

### Goal 1: Build Production-Ready Pilates Platform
- **Objective**: Launch functional MVP to community for customer traction
- **Approach**: Working production code that users can actually use
- **Timeline**: Production-ready now, deploy immediately
- **Quality Standard**: Real features, real integration, real value

### Goal 2: Learn Jentic Architecture Through Implementation
- **Objective**: Deep understanding of Jentic's StandardAgent + Arazzo Engine
- **Context**: Jentic is a CLIENT of Bassline (requires intimate codebase knowledge)
- **Approach**: Learn by doing - integrate real Jentic code, not stubs
- **Timeline**: Parallel with production - learning while building

**CRITICAL DECISION POINT:**
- ❌ **NOT** "learn first, then build later"
- ❌ **NOT** "build first, refactor later"
- ✅ **YES** "build AND learn simultaneously using real Jentic code"

**WHY BOTH MATTER:**
1. **Customer Traction** requires working production code
2. **Client Relationship** requires deep understanding of Jentic's architecture
3. **Future Projects** require scalable AI infrastructure patterns
4. **Best Learning** happens through real implementation, not theory

**IMPLEMENTATION STRATEGY:**
- Use real Jentic libraries from GitHub (not stubs, not placeholders)
- Heavy educational annotations throughout code ("JENTIC PATTERN" vs "BASSLINE CUSTOM")
- Production quality while learning architecture patterns
- Deploy fully functional integration
- **🎯 CRITICAL: Standardize code using Jentic patterns for maximum scalability**
  - Leverage StandardAgent and Arazzo Engine to their fullest potential
  - Standardized code = easily scalable code
  - Replace custom implementations with Jentic patterns wherever possible
  - Document all deviations from Jentic standards with clear justification

**When making architectural decisions, ALWAYS consider both goals equally.**

---

**Core Architecture:**
- FastAPI backend with AI agents (hosted on Render.com - $9/month paid tier)
- React frontend (pixel-perfect copy of existing MVP) (hosted on Netlify - $9/month Personal plan)
- Supabase PostgreSQL database (free tier)
- MCP Playwright server for web research
- **Jentic StandardAgent + Arazzo Engine** (integrated from GitHub)
- Four specialized AI agents (sequence, music, meditation, research)

**Design Philosophy:**
- Copy the existing MVP exactly (no improvements, no modernization)
- Safety-first approach with strict sequencing rules
- Database-driven business logic
- EU AI Act and GDPR compliant from day 1
- PII tokenization for all user data
- **Production-ready code with educational annotations** (dual goals)

**Design Plan Source of Truth:**
- **`/Pilates_App_Daily_Sessions_FINAL.md`** is the central source of truth for the development plan
- This file in the MVP2 folder defines all sessions, features, and implementation approach
- Consult it for session-by-session guidance, features roadmap, and architectural decisions
- When planning future work or understanding project scope, refer to this document first

---

## ✅ COMPLETED: Netlify Build Minutes - Upgrade Decision (December 28, 2025) ✅

**Status:** COMPLETED - User upgraded to Personal Plan ($9/month)

**Context:** Netlify account hit 100% of Free plan build minutes (300 min/month) in December 2025.

**Action Taken:** Upgraded to Personal Plan ($9/month = 1,000 build minutes/month)

**Monitoring Strategy:**
- **Month 1 (January):** Monitor build minutes weekly in Netlify dashboard
- **If hit 800 minutes by day 20:** Upgrade to Pro immediately
- **Month 2-3:** If usage consistently <700 min → Stay on Personal; if >900 min → Upgrade to Pro

---

## ✅ COMPLETED: Render Backend - Paid Tier (February 2, 2026) ✅

**Status:** COMPLETED - User on Render.com Paid Tier ($9/month)

**Context:** Backend services hosted on Render.com paid tier for production reliability

**Benefits of Paid Tier:**
- No sleep/spin-down delays (always-on service)
- Better performance and reliability for beta testers
- Priority support
- More generous resource limits

**Total Monthly Infrastructure Costs:**
- Frontend (Netlify Personal): $9/month
- Backend (Render Paid): $9/month
- Database (Supabase): $0 (free tier)
- **Total: $18/month**

---

## 🚀 WHERE WE LEFT OFF (December 31, 2025) 🚀

**CRITICAL: Read from here for current session priorities**

**Completed This Session:**

### ✅ COMPLETED: Fix pass_status Logic Mismatch (December 31, 2025)

**Problem:** QA Report and Sequencing Report showing different pass/fail results

**Resolution:** User confirmed issue is now resolved - reports match correctly

**What Was Fixed:**
- ✅ Fixed formula inconsistency (commit a3bb3308)
- ✅ Added Movement Family Balance section to sequencing reports (commit ece7d8b7)
- ✅ Fixed 12-minute class report generation (commits 07d5b349, 7b13b9f1)
- ✅ Fixed inconsistent movement_family defaults (commit 31f5aea5)
- ✅ Updated pass_status to check BOTH Rule 1 AND Rule 2 (commit 77696c8e)
- ✅ Final verification passed - QA and Sequencing reports now match

**Status:** ✅ RESOLVED - App accuracy stats now credible

---

### ✅ COMPLETED: Recording Mode & AI Classes Use Database Durations (December 31, 2025)

**Problem:** RecordingModeManager.tsx and AIGenerationPanel.tsx had hardcoded duration fallbacks that overrode database values

**Example Hardcoded Fallbacks:**
- Preparation: `|| 240` seconds
- Warmup: `|| 180` seconds
- Cooldown: `|| 180` seconds
- Meditation: `|| 300` seconds
- HomeCare: `|| 60` seconds

**Root Cause:** Data transformation layer in both files used hardcoded fallbacks instead of trusting database

**Fix Applied (Commit 08629e9e):**
1. ✅ Created `validateDuration()` helper in both files
   - Returns database duration if valid
   - Logs warning if NULL/missing
   - Returns 60-second minimal default as safe fallback
2. ✅ Added optional chaining (`?.`) to prevent undefined crashes
3. ✅ Made RecordingMode info box duration text dynamic
4. ✅ Added total duration calculation with console logging
5. ✅ Fixed AIGenerationPanel playback transformation layer

**Files Modified:**
- `frontend/src/components/recording-mode/RecordingModeManager.tsx`
- `frontend/src/components/class-builder/AIGenerationPanel.tsx`

**Benefits:**
- ✅ Database is single source of truth for all durations
- ✅ Warnings logged when database values missing (aids debugging)
- ✅ Safe 60-second fallback prevents playback crashes
- ✅ Both code paths now consistent

**Status:** ✅ RESOLVED - All class sections use database durations

**Production Verification (December 31, 2025):**
- ✅ User confirmed Recording Mode now reflects database duration_seconds correctly
- ✅ Deployed to dev branch and tested successfully
- ✅ Ready to merge to production when needed

---

**Active Tasks for Next Session:**

---

## 📋 DOCUMENTATION & TASK MANAGEMENT RULES

**CRITICAL: Single Source of Truth for Tasks**

**Rule:** ONLY use CLAUDE.md for documenting future tasks and to-do items.

**DO NOT create:**
- ❌ `NEXT_SESSION_NOTES.md` files
- ❌ `TODO.md` files
- ❌ `BACKLOG.md` files
- ❌ Any other markdown files for task tracking

**WHY:** Multiple task files cause confusion when stopping/starting across sessions. CLAUDE.md is the single source of truth.

**How to document tasks:**
1. Add high-priority items to "NEXT SESSION PRIORITY" section (top of file)
2. Add medium-priority items to "Future Plans / Enhancement Roadmap" section
3. Mark tasks as ✅ COMPLETED when done
4. Remove completed tasks from priority lists

---

## 🔍 PROACTIVE TROUBLESHOOTING & TESTING PROTOCOL

**CRITICAL: Do These Tasks BEFORE Asking User**

As Claude Code working on MVP2, you MUST proactively perform these checks before requesting user assistance:

### Standard Troubleshooting Checks:

1. **Run Database Queries**
   - Use `node scripts/db_readonly_query.mjs` to inspect database state
   - Check relevant tables for data integrity
   - Verify expected records exist

2. **Check Render Backend Logs**
   - Fetch recent logs from Render API or ask user to check dashboard
   - Look for errors, warnings, or exceptions
   - Identify root cause before proposing fixes

3. **Test Class Generation (Regression Check)**
   - Generate a complete class via API
   - Verify all 6 sections return correctly:
     1. Preparation script
     2. Warmup routine
     3. Main movements (9 movements + 8 transitions)
     4. Cooldown sequence
     5. Closing meditation
     6. HomeCare advice
   - Verify music recommendation included
   - Check response time (<60 seconds for AI mode)

4. **Test Class Playback**
   - Verify narrative audio plays (voiceover for all 6 sections)
   - Verify background music plays and advances tracks correctly
   - Check audio ducking (music at 20% during voiceover, 100% after)
   - Verify screen wake lock prevents phone sleep on mobile

5. **Verify Database Logging**
   - Check `class_history` table for new record after class generation
   - Verify `music_genre` and `cooldown_music_genre` fields populated
   - Verify `movements_snapshot` JSONB contains expected data

6. **Review Developer Tools Reports**
   - Check browser console for JavaScript errors
   - Check Network tab for failed API requests (401, 403, 500 errors)
   - Verify no CORS issues
   - Check for CSP violations

### When to Apply This Protocol:

**ALWAYS before:**
- Diagnosing bugs reported by user
- Proposing fixes for regressions
- Claiming "this should work now"
- Asking user to test manually

**Example Good Workflow:**
```
User: "Class generation isn't working"

Claude:
1. ✅ Checks Render logs → finds 500 error
2. ✅ Runs database query → finds missing preparation script
3. ✅ Tests class generation API → reproduces error
4. ✅ Identifies root cause: preparation table empty
5. Proposes fix with evidence

Result: User confident in fix, less back-and-forth
```

**Example Bad Workflow:**
```
User: "Class generation isn't working"

Claude:
❌ "Can you check Render logs?"
❌ "Can you run this SQL query?"
❌ "Can you test class generation?"

Result: User frustrated, doing Claude's job
```

### Tools Available for Proactive Testing:

- **Database:** `node scripts/db_readonly_query.mjs "SQL_QUERY"`
- **API Testing:** `curl` commands to Render backend
- **Code Search:** `Grep`, `Glob` for finding relevant code
- **Log Analysis:** Read Render logs (ask user for recent logs if needed)

**Remember:** Your role is to be proactive, not reactive. Do the investigation work before involving the user.

---

## 🚨 CRITICAL SECURITY RULES 🚨

### NEVER Expose Secrets in Code or Documentation

**ABSOLUTE PROHIBITIONS:**

1. **NEVER commit files containing secrets to git**
   - API keys, tokens, passwords, database credentials
   - Supabase keys, JWT secrets, service role keys
   - Any authentication credentials or private keys

2. **NEVER include secrets in documentation files**
   - README.md, deployment docs, or any markdown files
   - Comments in code (even if commented out)
   - Example configurations with real credentials

3. **NEVER put secrets in frontend code**
   - Frontend code is publicly accessible in browser
   - Use environment variables with VITE_ prefix ONLY for public data
   - Backend URLs are OK, but NOT API keys

4. **Files that commonly contain secrets (CHECK BEFORE COMMITTING):**
   - `.env` files (should ALWAYS be in .gitignore)
   - `credentials.json`, `secrets.json`, `config.json`
   - Any file named with "key", "token", "secret", "password"
   - Database connection files, API configuration files
   - Documentation files in `/docs`, `/database`, `/config`

5. **If secrets are exposed:**
   - Immediately rotate/revoke the exposed credentials
   - Remove from git history (git filter-branch or BFG Repo-Cleaner)
   - Add file pattern to .gitignore
   - Verify the secret is not in any other files

6. **Where secrets SHOULD be stored:**
   - Environment variables (`.env` files in .gitignore)
   - Deployment platform environment variables (Render, Netlify)
   - Secret management services (never in code)
   - Local files explicitly listed in .gitignore

7. **Before committing, ALWAYS check:**
   ```bash
   git diff
   git status
   grep -r "eyJ" .  # Check for JWT tokens
   grep -r "sk_" .  # Check for secret keys
   grep -r "password" .  # Check for passwords
   ```

**This is a zero-tolerance policy. A single exposed secret can compromise the entire application.**

---

## 🔄 GIT WORKFLOW POLICY

### Dev-First Workflow (CRITICAL - Updated December 2025)

**🚨 CRITICAL RULE: NEVER push to GitHub without explicit user permission 🚨**

**WHY:** Every push triggers Netlify builds, consuming build minutes/credits. User is on Personal plan (1,000 min/month).

**RULE:** After making any code changes, commit locally ONLY. DO NOT push to GitHub unless user explicitly approves.

**Modified Workflow:**
1. **Ensure you're on `dev` branch**: `git checkout dev`
2. Make code changes as requested
3. Stage all modified files: `git add .`
4. Create descriptive commit message with:
   - Summary of changes
   - Files modified
   - Purpose/reason for changes
   - Co-authored-by Claude tag
5. **Commit locally**: `git commit -m "message"`
6. **ASK USER**: "Ready to push to GitHub? This will trigger Netlify build."
7. **ONLY IF USER APPROVES**: `git push origin dev`
8. Auto-deploys to dev environment for testing:
   - Frontend: https://bassline-dev.netlify.app
   - Backend: https://pilates-dev-i0jb.onrender.com
9. After user confirms testing successful, merge to main:
   ```bash
   git checkout main
   git merge dev
   git push origin main  # (ONLY with user permission!)
   ```
10. Auto-deploys to production for beta testers:
    - Frontend: https://basslinemvp.netlify.app
    - Backend: https://pilates-class-generator-api3.onrender.com

**When NOT to commit:**
- User explicitly says "don't commit" or "wait to commit"
- Files contain secrets or credentials (check first!)
- Changes are experimental/incomplete
- User says they want to review changes first

**When NOT to push:**
- ❌ **NEVER push without asking user first** (conserves Netlify build minutes)
- User explicitly says "don't push yet"
- Multiple commits pending - batch them into one push
- Changes need local testing first

**NEVER push directly to `main` unless explicitly instructed by user.**

**Commit Message Format:**
```
<Type>: <Brief summary>

<Detailed description of changes>
<Files modified>
<Purpose/impact>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Always verify before committing:**
- No secrets exposed (API keys, tokens, passwords)
- No `.env` files being committed
- Changes align with user's request
- All files staged are intentional

---

## 🔍 DATABASE ACCESS RULES (Read-Only Schema Inspection)

### Operating Rule for Supabase Database Access

**Purpose:** Enable Claude Code to inspect database schema and query data during troubleshooting, eliminating the need for manual query execution back-and-forth.

**Setup:**
- Read-only PostgreSQL role: `claude_readonly` (SELECT-only permissions on 31 approved tables)
- Local query runner script: `scripts/db_readonly_query.mjs`
- Connection string stored securely in `.env.local` (gitignored)
- Built-in security: Blocks all write operations, maximum 1000 rows per query

**Operating Protocol:**

When Claude Code needs to inspect database schema or query data:

1. **Write the SQL query** (SELECT only, validated for safety)
2. **Execute directly using Bash tool**:
   ```bash
   node scripts/db_readonly_query.mjs "YOUR_SQL_HERE"
   ```
3. **Reason only on returned output** (never assume database state)
4. **NEVER suggest or execute write operations** (INSERT/UPDATE/DELETE/ALTER/etc.)

**Security Guarantees:**
- ✅ Only SELECT queries allowed (write operations blocked by script validation)
- ✅ Only SELECT queries possible (PostgreSQL role has no write permissions)
- ✅ Maximum 1000 rows returned (prevents massive data dumps)
- ✅ Connection string never logged or exposed
- ✅ No access to `user_profiles` table (PII protection - excluded from role permissions)

**Approved Tables (31 total):**
- `ai_decision_log`, `beta_feedback`, `bias_monitoring`, `class_history`, `class_movements`, `class_plans`
- `closing_homecare_advice`, `closing_meditation_scripts`, `common_mistakes`, `cooldown_sequences`
- `llm_invocation_log`, `medical_exclusions_log`, `model_drift_log`, `movement_levels`, `movement_muscles`
- `movement_usage`, `movements`, `muscle_groups`, `music_playlist_tracks_backup`, `music_playlists_backup`
- `music_tracks`, `pii_field_registry`, `pii_tokens`, `preparation_scripts`, `ropa_audit_log`
- `sequence_rules`, `student_profiles`, `teaching_cues`, `transitions`, `user_preferences`, `warmup_routines`

**When to Use:**
- ✅ Debugging schema mismatches between backend models and Supabase
- ✅ Verifying data migrations or updates
- ✅ Troubleshooting query errors
- ✅ Understanding table relationships and column definitions
- ✅ Inspecting data to diagnose bugs

**When NOT to Use:**
- ❌ Never for write operations (INSERT/UPDATE/DELETE/CREATE/ALTER/DROP)
- ❌ Never without clear troubleshooting purpose
- ❌ Never to access `user_profiles` (PII table - excluded from permissions)
- ❌ Never to query data for purposes unrelated to debugging

**Example Usage:**
```bash
# Inspect table schema
node scripts/db_readonly_query.mjs "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'movements' ORDER BY ordinal_position;"

# Query data for debugging
node scripts/db_readonly_query.mjs "SELECT id, name, difficulty_level FROM movements LIMIT 10;"

# Check table relationships
node scripts/db_readonly_query.mjs "SELECT COUNT(*) FROM class_movements WHERE class_id = 'uuid-here';"
```

**Blocked Operations (Security):**
```bash
# ❌ This will be BLOCKED by validation
node scripts/db_readonly_query.mjs "DELETE FROM movements WHERE id = 1;"
# Output: ❌ BLOCKED: Query contains write operation: DELETE
```

**Setup Files:**
- Query runner: `/Users/lauraredmond/Documents/Bassline/Projects/MVP2/scripts/db_readonly_query.mjs`
- Dependencies: `pg`, `dotenv` (installed via root `package.json`)
- Environment variable: `DB_READONLY_URL` in `.env.local`

---

## Multi-Agent Development Workflow

**IMPORTANT: Use parallel test agents proactively for complex debugging, testing, and validation tasks.**

### When to Use Multi-Agent Workflows

Always launch multiple agents in parallel when:

1. **Debugging Complex Issues**
   - Test API endpoint + Check browser console + Verify database state
   - Inspect frontend state + Check backend logs + Validate data flow

2. **Testing After Changes**
   - Test API response + Verify frontend rendering + Check database integrity
   - Run unit tests + Integration tests + E2E tests

3. **Validating Implementations**
   - Check code structure + Test functionality + Verify compliance
   - Review security + Test performance + Validate UX

4. **Research and Analysis**
   - Search codebase + Read documentation + Test implementation
   - Compare versions + Analyze patterns + Verify consistency

### How to Launch Parallel Agents

**Single message with multiple Task tool calls:**

```typescript
// Launch 3 agents in parallel to debug movement loading issue
Task(subagent_type: "general-purpose", description: "Test movements API endpoint")
Task(subagent_type: "general-purpose", description: "Check browser console logs")
Task(subagent_type: "general-purpose", description: "Verify Zustand store structure")
```

**Example from Session 5 (Movement Loading Bug):**

When movements weren't loading, I launched 3 parallel agents:
1. **API Test Agent** - Verified `/api/movements` returned data correctly
2. **Console Log Agent** - Checked browser console for JavaScript errors
3. **Store Verification Agent** - Compared API response vs Zustand interface

This revealed:
- API was working ✓
- CORS was blocking requests ✗ (root cause found!)
- API Pydantic model missing fields ✗ (secondary issue)

### Best Practices

1. **Launch agents early** - Don't wait until stuck; use proactively
2. **Run in parallel** - Single message with multiple Task calls
3. **Clear descriptions** - Each agent needs specific, focused task
4. **Trust agent outputs** - Agents have deep context and expertise
5. **Combine findings** - Synthesize multi-agent results for solution

### Example Scenarios

**Scenario 1: New Feature Not Working**
```
Agent 1: Test the API endpoint for the new feature
Agent 2: Verify frontend component receives and renders data
Agent 3: Check database for expected records
Agent 4: Validate user permissions and auth flow
```

**Scenario 2: Performance Issue**
```
Agent 1: Profile backend API response times
Agent 2: Analyze frontend bundle size and load times
Agent 3: Check database query performance
Agent 4: Review caching strategy effectiveness
```

**Scenario 3: CORS/Network Issue**
```
Agent 1: Test API directly with curl
Agent 2: Check browser Network tab for failed requests
Agent 3: Verify CORS configuration in backend
Agent 4: Validate axios configuration in frontend
```

### User Request: "Thoroughly test using parallel test agents"

When the user requests thorough testing with parallel agents:
1. Identify all components that need testing
2. Launch 3-5 agents in a single message
3. Each agent tests one specific aspect
4. Combine results to provide comprehensive diagnosis
5. Present findings and recommended fixes

**Never test serially when parallel is possible** - it saves time and provides faster, more comprehensive results.

---

## Development Commands

### Backend (FastAPI)

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run development server
uvicorn api.main:app --reload --port 8000

# Run tests
pytest tests/ -v

# Run single test
pytest tests/test_sequences.py::test_validate_sequence -v

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Start MCP Playwright server (in separate terminal)
npx @modelcontextprotocol/server-playwright
```

### Frontend (React)

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run single test file
npm test -- ClassBuilder.test.tsx

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Database (Supabase)

```bash
# Apply migrations
cd database
supabase db push

# Reset database (development only)
supabase db reset

# Generate types
supabase gen types typescript --local > ../frontend/src/types/supabase.ts

# Run SQL function tests
supabase test db
```

### Docker (Full Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after dependencies change
docker-compose up -d --build
```

### Redis (AI Response Caching - Phase 1 Optimization)

**Local Development:**

```bash
# Install Redis (macOS)
brew install redis

# Start Redis server
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG

# Monitor cache activity (optional)
redis-cli monitor
```

**Production Deployment (Render):**

1. **Option A: Upstash Redis (Recommended - Free tier available)**
   ```bash
   # Sign up at https://upstash.com/
   # Create new Redis database
   # Copy connection URL
   # Add to Render environment variables:
   # REDIS_URL=redis://default:PASSWORD@HOST:PORT
   ```

2. **Option B: Render Redis Addon (Paid)**
   ```bash
   # In Render dashboard:
   # 1. Go to orchestrator service
   # 2. Click "Add-ons" tab
   # 3. Add "Redis" addon
   # 4. REDIS_URL will be auto-configured
   ```

**Environment Variables:**

```bash
# Add to orchestrator service on Render:
REDIS_URL=redis://default:PASSWORD@HOST:PORT  # From Upstash or Render addon
```

**Cache Monitoring:**

```bash
# Check cache stats (local development)
redis-cli INFO stats

# Check cache keys
redis-cli KEYS "*"

# View cached content
redis-cli GET "prep:Beginner"

# Clear cache (force fresh AI generation)
redis-cli FLUSHDB
```

**Graceful Degradation:**

If Redis is unavailable:
- System automatically falls back to direct LLM calls
- No errors or crashes
- Logs warning: "Redis caching DISABLED - falling back to direct LLM calls"
- Performance impact: slower response times + higher costs

---

## Architecture Overview

### Backend Structure (`/backend`)

```
backend/
├── api/                    # FastAPI routes and endpoints
│   ├── main.py            # Application entry point
│   ├── auth.py            # Authentication endpoints
│   ├── classes.py         # Class planning endpoints
│   ├── movements.py       # Movement CRUD endpoints
│   └── users.py           # User management endpoints
├── agents/                 # AI agent implementations
│   ├── base_agent.py      # Base agent class with EU AI Act compliance
│   ├── sequence_agent.py  # Movement sequencing logic
│   ├── music_agent.py     # Music recommendation logic
│   ├── meditation_agent.py # Meditation script generation
│   └── research_agent.py  # MCP Playwright integration
├── models/                 # Pydantic models and schemas
│   ├── movement.py        # Movement data models
│   ├── class_plan.py      # Class plan schemas
│   ├── user.py            # User models with PII tokenization
│   └── sequence_rule.py   # Sequencing validation models
├── services/               # Business logic layer
│   ├── sequencing.py      # Sequence validation and generation
│   ├── muscle_balance.py  # Muscle group balance tracking
│   ├── mcp_client.py      # MCP Playwright client wrapper
│   ├── excel_sync.py      # Excel database synchronization
│   └── safety_validator.py # Safety rule enforcement
└── utils/                  # Shared utilities
    ├── supabase_client.py # Database connection
    ├── pii_tokenizer.py   # PII encryption/tokenization
    ├── compliance.py      # EU AI Act logging and monitoring
    └── cache.py           # Redis caching layer
```

### Frontend Structure (`/frontend`)

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── ClassBuilder/  # Main drag-and-drop interface
│   │   ├── MovementCard/  # Individual movement display
│   │   ├── SequenceViewer/ # Timeline view of class
│   │   └── ResearchPanel/ # MCP research results display
│   ├── pages/             # Page-level components
│   │   ├── Dashboard.tsx  # User dashboard
│   │   ├── ClassPlanner.tsx # Main class planning interface
│   │   ├── Login.tsx      # Authentication
│   │   └── Analytics.tsx  # Progress tracking
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts     # Authentication state
│   │   ├── useClassBuilder.ts # Class planning state
│   │   └── useMovements.ts # Movement data fetching
│   ├── services/          # API clients
│   │   ├── api.ts         # Axios instance configuration
│   │   ├── classService.ts # Class planning API calls
│   │   └── authService.ts # Authentication API calls
│   └── utils/             # Frontend utilities
│       ├── sequenceValidation.ts # Client-side validation
│       └── formatters.ts  # Data formatting helpers
```

### Database Structure (`/database`)

The database is Supabase PostgreSQL with the following key tables:

**Core Tables:**
- `movement_details` - All Pilates movements (migrated from Excel)
- `movement_muscles` - Many-to-many muscle group mappings
- `sequence_rules` - Safety and quality sequencing rules
- `class_plans` - Saved class plans
- `user_preferences` - User settings and preferences

**Compliance Tables:**
- `users` - User accounts (PII tokenized)
- `pii_tokens` - Secure PII storage
- `ai_decision_log` - EU AI Act compliance logging
- `bias_monitoring` - Model drift detection

**Functions:**
- `validate_sequence()` - Server-side sequence validation
- `calculate_muscle_balance()` - Track muscle group load
- `get_recommended_movements()` - AI-powered recommendations
- `tokenize_pii()` / `detokenize_pii()` - PII handling

---

## Key Domain Knowledge

### The 34 Classical Pilates Movements

The application is built around Joseph Pilates' 34 classical mat movements, organized by difficulty:

**Beginner (14 movements):** The Hundred, Roll Up, Roll Over, Single Leg Circle, Rolling Like a Ball, Single Leg Stretch, Double Leg Stretch, Spine Stretch Forward, Open Leg Rocker, Corkscrew, The Saw, Swan Dive, Single Leg Kick, Double Leg Kick

**Intermediate (10 movements):** Neck Pull, Scissors, Bicycle, Shoulder Bridge, Spine Twist, Jack Knife, Side Kick Series (Front/Back, Up/Down, Circles), Teaser

**Advanced (10 movements):** Hip Twist, Swimming, Leg Pull Front, Leg Pull Back, Side Bend, Boomerang, Seal, Control Balance, Push Up, Rocking

### Critical Sequencing Rules (Never Violate)

These rules prevent injury and ensure class effectiveness:

1. **Warm-up first** - Always start with breathing and gentle movements
2. **Spinal progression** - Flexion before extension (anatomical safety)
3. **Balance muscle groups** - Don't overwork one area
4. **Complexity progression** - Simple to complex within session
5. **Cool-down required** - End with stretching and breathing

The backend enforces these rules via `services/safety_validator.py` and database function `validate_sequence()`. Any sequence violating these rules will be rejected with a specific error message.

### Movement Attributes (from Excel Database)

Each movement has:
- **Name** - Official classical name
- **Difficulty** - Beginner/Intermediate/Advanced
- **Primary Muscles** - Core, Legs, Arms, Back, etc.
- **Movement Pattern** - Flexion, Extension, Rotation, Lateral, Balance
- **Duration** - Typical time in seconds
- **Breathing Pattern** - Inhale/Exhale counts
- **Prerequisites** - What movements should come before
- **Contraindications** - When to avoid (pregnancy, injuries, etc.)
- **Setup Instructions** - Positioning details
- **Execution Notes** - Step-by-step guidance
- **Modifications** - Easier/harder variations

This data is migrated from `Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm` into the PostgreSQL database.

---


## AI Agent Architecture

**For complete Jentic integration details, see:** `/docs/JENTIC_MASTER.md`

### Current Architecture (Jentic StandardAgent)

```
Backend API (FastAPI)
  ↓
Orchestrator Service (Render)
  ↓
BasslinePilatesCoachAgent (StandardAgent)
  ↓ Plan → Execute → Reflect
Tool Modules:
  - SequenceTools (sequencing, muscle balance, safety)
  - MusicTools (playlist generation, BPM matching)
  - MeditationTools (meditation scripts, breathing)
  - ResearchTools (MCP Playwright web research)
```

**Key Benefits:**
- ✅ Single agent with StandardAgent reasoning patterns
- ✅ All business logic preserved in tool modules
- ✅ Jentic patterns ensure maximum scalability
- ✅ Plan→Execute→Reflect loop (ReWOO reasoning)

### 6-Section Class Generation

Every class has 6 sections with specific LLM usage:

1. **Preparation:** GPT-4-turbo (quality-critical, $0.05-0.08)
2. **Warmup:** GPT-3.5-turbo OR database (cost optimization)
3. **Main Movements:** Database only ($0.00, deterministic safety rules)
4. **Cooldown:** GPT-3.5-turbo OR database
5. **Meditation:** Database templates ($0.00)
6. **HomeCare:** GPT-4-turbo (medical knowledge, $0.05-0.08)

**Total AI Cost:** ~$0.20-0.28 per AI-generated class

**Prompt Locations:** All in `backend/orchestrator/tools/class_section_tools.py`

---

## MCP Playwright Integration

### Setup

The MCP Playwright server runs as a separate process:

```bash
npx @modelcontextprotocol/server-playwright
```

Configuration is in `config/mcp_config.yaml`:

```yaml
mcp_servers:
  playwright:
    command: "npx"
    args: ["@modelcontextprotocol/server-playwright"]
    capabilities:
      - web_navigation
      - screenshot_capture
      - content_extraction
      - form_interaction
    rate_limits:
      requests_per_minute: 30
      concurrent_sessions: 3
```

### Usage in Code

```python
from services.mcp_client import MCPClient

mcp = MCPClient()

# Search for movement cues
cues = await mcp.research_movement_cues(
    movement_name="The Hundred",
    trusted_sites=["pilatesmethod.com", "balancedbody.com"]
)

# Find warm-up exercises
warmups = await mcp.find_warmup_sequence(
    target_muscles=["core", "hip_flexors"],
    duration=5
)

# Research condition-specific modifications
mods = await mcp.research_modifications(
    condition="pregnancy",
    trimester=2
)
```

All MCP results are cached in Redis with source attribution for EU AI Act compliance.

---


## Music Integration

**For complete music integration details, see:** `CLAUDE_ARCHIVE.md`

**Current Setup:**
- **Source:** Internet Archive (14 public domain classical tracks)
- **Playlists:** 8 curated playlists covering all stylistic periods
- **Delivery:** Streamed from third-party CDN (no self-hosting)
- **Cost:** $0.00 (free public domain music)

**Stylistic Periods Available:**
- Baroque, Classical, Romantic, Impressionist, Modern, Contemporary, Celtic Traditional

**API Endpoints:**
- `GET /api/music/playlists` - All curated playlists
- `GET /api/music/tracks` - Individual tracks
- `GET /api/music/health` - Music service health check

**Frontend:** HTML5 `<audio>` element with autoplay handling

**Known Limitation:** Internet Archive rate limits (see Infrastructure Roadmap for migration plan)

---

## Excel Database Synchronization

### Migration from Excel

The comprehensive domain knowledge in `Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm` is migrated to PostgreSQL using:

```bash
cd backend
python scripts/migrate_excel.py --excel-path "/path/to/spreadsheet.xlsm" --validate
```

This script:
1. Parses all worksheets (Movements, Muscle Mappings, Sequencing Rules, etc.)
2. Validates data integrity
3. Transforms to normalized database schema
4. Imports with conflict resolution
5. Preserves Excel formulas as database functions

### Bi-directional Sync

For ongoing updates:

```python
from services.excel_sync import ExcelSyncService

sync = ExcelSyncService()

# Import changes from Excel
await sync.sync_from_excel("/path/to/updated_spreadsheet.xlsm")

# Export database to Excel
await sync.export_to_excel("/path/to/output_spreadsheet.xlsm")
```

Changes are detected intelligently with conflict resolution UI.

---

## Security and Compliance

### PII Tokenization

All personally identifiable information is tokenized using `utils/pii_tokenizer.py`:

```python
from utils.pii_tokenizer import tokenize_pii, detokenize_pii

# Store user data
tokenized_email = tokenize_pii(user_email)
await db.users.insert({"email_token": tokenized_email})

# Retrieve user data
email = detokenize_pii(db_record["email_token"])
```

Tokens are stored in `pii_tokens` table with AES-256 encryption.

### EU AI Act Compliance

All AI agent decisions are logged to `ai_decision_log` table with:
- Input parameters
- Model output
- Reasoning/explanation
- Confidence scores
- Timestamp and user context

Bias monitoring runs daily via cron job:

```bash
python scripts/check_model_drift.py --alert-threshold 0.15
```

### GDPR Compliance

User data export and deletion:

```python
# Export all user data
await export_user_data(user_id, format="json")

# Delete user (cascades to all related data)
await delete_user_account(user_id, reason="user_request")
```

---

## Testing Strategy

### Backend Tests

```bash
# Run all tests with coverage
pytest tests/ -v --cov=backend --cov-report=html

# Test sequencing rules
pytest tests/test_sequences.py -v

# Test AI agents
pytest tests/test_agents.py -v

# Test MCP integration
pytest tests/test_mcp.py -v

# Test compliance logging
pytest tests/test_compliance.py -v
```

### Frontend Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm test -- --watch

# Component tests
npm test -- ClassBuilder.test.tsx

# Integration tests
npm test -- --testPathPattern=integration
```

### Database Tests

```bash
# Test database functions
supabase test db

# Test migrations
supabase db reset && supabase db push
```

---

## Important Implementation Notes

### When Working on Sequencing Logic

- **Always validate against safety rules** - Use `services/safety_validator.py`
- **Test with real data** - Import sample movements from Excel
- **Check muscle balance** - Use `calculate_muscle_balance()` function
- **Preserve spinal progression** - Flexion must precede extension
- **Document rule violations** - Log why a sequence was rejected

### When Working on AI Agents

- **Inherit from base_agent.py** - Ensures compliance logging
- **Use small models** - GPT-3.5-turbo or equivalent for cost efficiency
- **Implement graceful degradation** - Provide fallback when model fails
- **Log all decisions** - Required for EU AI Act transparency
- **Test bias monitoring** - Verify drift detection works

### When Working on Frontend

- **Match MVP exactly** - No design improvements or modernization
- **Copy existing styles** - Use same colors, fonts, layout
- **Preserve UX patterns** - Same drag-and-drop behavior
- **Test on same browsers** - Ensure compatibility matches MVP
- **Avoid adding features** - Only replicate existing functionality

### 🚨 CRITICAL: When Working on Class Builder Modal 🚨

**ALWAYS reference `/docs/Visual_regression_baseline.md` when making ANY changes that impact the class builder modal.**

This document (commit `a53672e`) defines the approved visual appearance and behavior:

**Required Specifications:**
- Movement count: ~9 movements (AI-selected, NOT all 34 from database)
- Transition count: ~8 transitions (generated between movements)
- Transitions styled with:
  - Light background (`bg-burgundy/50`)
  - Italic text (`italic text-cream/70`)
  - Left accent border (`border-l-4 border-l-cream/40`)
  - Arrow icon (→)
- Muscle balance from database (NOT generic core/legs/arms)
- Balance Score calculated (NOT NaN)
- Primary Focus shows actual muscle group name from database

**Before Committing Changes:**
1. Read `/docs/Visual_regression_baseline.md`
2. Verify modal matches ALL specifications
3. Test that movement count is ~9 (not 34)
4. Verify transitions appear with correct styling
5. Check muscle balance shows database values
6. Confirm no visual regressions

**If Visual Regression Occurs:**
```bash
# Revert to baseline commit
git checkout a53672e -- frontend/src/components/class-builder/AIGenerationPanel.tsx
git checkout a53672e -- frontend/src/components/class-builder/ai-generation/SequenceResultsTab.tsx
git checkout a53672e -- frontend/src/components/class-builder/ai-generation/GeneratedResults.tsx
```

**Testing Checklist:**
- [ ] Movement count shows movements only (not total items)
- [ ] Transition count shows below movement count
- [ ] Transitions have lighter background than movements
- [ ] Transitions have left accent border (visual key)
- [ ] Transition text is italic
- [ ] Transition has arrow icon (→)
- [ ] Balance Score is not NaN
- [ ] Primary Focus shows actual muscle group name from database
- [ ] Muscle Balance chart shows database muscle groups

**This is a zero-tolerance policy. Always verify against Visual_regression_baseline.md before committing.**

### When Working with MCP

- **Cache aggressively** - 24-hour TTL for research results
- **Rate limit carefully** - Max 30 requests/minute
- **Attribute sources** - Always include source URLs
- **Validate quality** - Use quality scoring for MCP results
- **Handle failures gracefully** - Fallback to database knowledge

### When Working with Excel Data

- **Preserve business logic** - Excel formulas become database functions
- **Document macros** - VBA logic must be recreated in Python
- **Test sync carefully** - Bi-directional sync can cause conflicts
- **Validate integrity** - Check all required columns exist
- **Backup before migration** - Excel file is source of truth

---

## Common Development Workflows

### Adding a New Movement

1. Add to Excel spreadsheet (source of truth)
2. Run sync: `python scripts/sync_excel.py`
3. Verify in database: Check `movement_details` table
4. Update frontend cache: Refresh movement list in UI
5. Test sequencing: Ensure new movement respects safety rules

### Modifying Sequencing Rules

1. Update rule in `database/functions/validate_sequence.sql`
2. Write test case in `tests/test_sequences.py`
3. Apply migration: `alembic upgrade head`
4. Update documentation: Add rule to this CLAUDE.md file
5. Test with agent: Verify sequence agent respects new rule

### Adding MCP Research Capability

1. Identify research need (e.g., finding warm-up exercises)
2. Add method to `services/mcp_client.py`
3. Implement caching in Redis
4. Add quality scoring
5. Test with real queries
6. Integrate into research agent

### Deploying Changes

1. Run full test suite: `pytest && npm test`
2. Check compliance: `python scripts/check_compliance.py`
3. Build frontend: `npm run build`
4. Apply migrations: `alembic upgrade head`
5. Deploy backend: Update Docker container
6. Deploy frontend: Upload to hosting
7. Monitor logs: Check for errors in first hour

---

## External Resources

### Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **Supabase**: https://supabase.com/docs
- **MCP Protocol**: https://modelcontextprotocol.io/
- **EU AI Act**: https://artificialintelligenceact.eu/

### Domain Knowledge
- **Pilates Method Alliance**: https://www.pilatesmethod.com/
- **Balanced Body University**: https://www.pilates.com/
- **Classical Pilates**: Reference the 34 movements in Excel database

### Project Files
- **Excel Database**: `/Users/lauraredmond/Documents/Bassline/Admin/7. Product/Design Documentation/Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm`
- **MCP Integration Plan**: `/Users/lauraredmond/Documents/Bassline/Admin/7. Product/Design Documentation/MCP_Excel_Integration_Plan.md`

---

## Troubleshooting

### Sequence Validation Failing

**Problem:** Valid sequence rejected by safety validator
**Solution:** Check `ai_decision_log` table for rejection reason. Most common: spinal progression rule (flexion must precede extension).

### MCP Playwright Not Responding

**Problem:** Research agent timeouts
**Solution:**
1. Check MCP server is running: `ps aux | grep playwright`
2. Restart server: `npx @modelcontextprotocol/server-playwright`
3. Check rate limits in `config/mcp_config.yaml`
4. Clear Redis cache: `redis-cli FLUSHDB`

### Excel Sync Conflicts

**Problem:** Bi-directional sync shows conflicts
**Solution:** Excel is source of truth. Use `sync_from_excel()` to override database with Excel data. Review conflicts in sync UI before applying.

### Frontend Not Matching MVP

**Problem:** UI looks different from original MVP
**Solution:**
1. Compare screenshots side-by-side
2. Check CSS matches exactly (colors, fonts, spacing)
3. Test drag-and-drop behavior matches
4. Verify same browser/device as MVP testing

### AI Agent Bias Detected

**Problem:** Model drift monitoring alerts
**Solution:**
1. Review `bias_monitoring` table for specific metrics
2. Check if training data has changed
3. Consider retraining or model version update
4. Document in compliance logs

---

## Known Issues & Fixes

### Archive.org Music Rate Limiting

**Issue:** Beta testers report "Failed to load background music" error during class playback

**Root Cause:** Internet Archive enforces daily rate limits on streaming requests
- Limit appears to reset at midnight (likely UTC)
- Heavy testing during day → quota exhausted by evening
- Different devices/IPs have separate quotas (why work iPhone still works)

**Symptoms:**
- Music works initially, then fails after heavy usage
- Error message: "Failed to load background music"
- Works again after midnight (quota reset)
- Works on different devices/networks (separate quotas)

**Temporary Workarounds:**
1. Wait until midnight for quota reset
2. Switch networks (WiFi ↔ Cellular for new IP)
3. Clear Safari cache: Settings → Safari → Clear History and Website Data
4. Test on different device (separate quota)

**Permanent Fix: Self-Host Music on Supabase Storage**

**Timeline:** 30-minute implementation (before beta testing expands)

**Steps:**
1. **Download 14 tracks from Internet Archive** (one-time, legal - public domain)
   - All tracks documented in `database/seed_data/001_initial_music_tracks_VERIFIED.sql`
   - Use `wget` or `curl` to download from archive.org URLs
   - Preserve public domain licensing information

2. **Upload to Supabase Storage**
   ```sql
   -- Create bucket (one-time)
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('music-tracks', 'music-tracks', true);

   -- Upload all 14 MP3 files via Supabase dashboard
   -- Set cache headers: public, max-age=31536000, immutable
   ```

3. **Update database with new URLs**
   ```sql
   -- Replace archive.org URLs with Supabase Storage URLs
   UPDATE music_tracks
   SET audio_url = 'https://[project].supabase.co/storage/v1/object/public/music-tracks/[filename].mp3'
   WHERE audio_url LIKE '%archive.org%';
   ```

4. **Update backend ALLOWED_STREAMING_DOMAINS**
   ```python
   # backend/config.py or wherever whitelist is defined
   ALLOWED_STREAMING_DOMAINS = [
       'supabase.co',  # Add Supabase Storage
       'archive.org'   # Keep as fallback
   ]
   ```

**Cost Analysis:**
- Storage: 40 MB ÷ 1024 = 0.039 GB × $0.021 = $0.0008/month (~$0.00)
- Bandwidth (100 users/month): 100 × 14 tracks × 2.86 MB avg = 4 GB × $0.09 = $0.36/month
- **Total:** ~$0.36/month (negligible, no rate limits)

**Benefits:**
- ✅ No rate limits ever
- ✅ Faster loading (Supabase CDN closer to users)
- ✅ Complete control over content
- ✅ More reliable for beta testers and production

**Priority:** HIGH - Should complete before expanding beta testing to avoid user frustration

---

## Performance Considerations

### Database Queries
- Use indexes on `movement_details.difficulty` and `movement_details.primary_muscles`
- Cache frequently accessed movements in Redis (TTL: 1 hour)
- Use database functions for complex sequencing logic (faster than Python)

### Frontend Rendering
- Virtualize long movement lists (react-window)
- Debounce drag-and-drop events
- Lazy load movement details
- Cache API responses in React Query

### MCP Research
- Cache all research results (TTL: 24 hours)
- Batch requests when possible
- Use quality scoring to filter results early
- Implement request pooling (max 3 concurrent)

---


## Session Progress & Development History

**For complete session histories (Sessions 7-13.5), see:** `CLAUDE_ARCHIVE.md`

### Recent Completed Sessions (Brief Summary)

- **Session 7:** User Authentication & Profile ✅
- **Session 8:** Settings & Preferences + GDPR/EU AI Act Compliance ✅
- **Session 9:** Music Integration (Internet Archive, 14 tracks, 8 playlists) ✅
- **Session 10:** Jentic Integration - Real StandardAgent + Arazzo Engine ✅
- **Session 11:** 6-Section Class Structure (preparation, warmup, movements, cooldown, meditation, homecare) ✅
- **Session 11.5:** Jentic Formalization (OpenAPI specs, Arazzo workflows) ✅
- **Session 11.75:** Movement Data Population (watch points, visual cues, level flags) ✅
- **Session 12:** Jentic Documentation Consolidation (8 files → 1 master) ✅
- **Session 13:** AI Mode End-to-End Integration (SimplifiedReWOOReasoner, 7-fix debugging journey) ✅
- **Session 13.5:** Advanced Delivery Modes (deferred) ⏸️

**Current Status:** Production-ready AI-powered class generation with full mobile support

---

## 📚 FUTURE PLANS

### Prioritized Enhancement Roadmap (December 8, 2025)

**Priority Order (User-Specified):**

#### **0. CRITICAL SECURITY: Git History Cleanup for Exposed Secrets** (DEFERRED - User Request December 10, 2025)

**Context:** Cryptography & Secrets Management security audit (December 10, 2025) found 3 files with old JWT-format Supabase service role keys committed to git history:
- `apply_migration_012.py` (line 12)
- `debug_cooldown.py` (line 9)
- `verify_migration_012.py` (line 9)

**User Confirmed:** Keys are old "eyJ" format (likely rotated when Supabase migrated to "sb_" format). Current production uses newer "sb_" format keys via environment variables (verified secure ✅).

**Risk Assessment:** 🟡 MEDIUM (downgraded from CRITICAL based on key rotation)
- Old keys likely invalid
- Current production is secure
- Git cleanup is best practice, not urgent

**Required Actions:**

1. **Verify Old Keys Invalid** (5 minutes) - Test connection with old key to confirm 401 Unauthorized
2. **Create Full Backup** (5 minutes) - `cp -r MVP2 MVP2-BACKUP-$(date +%Y%m%d)`
3. **Test on Clone First** (10 minutes) - Run BFG on test clone, verify commits/files preserved
4. **Clean Git History** (30 minutes) - Use BFG Repo-Cleaner to remove 3 files from all commits
5. **Update Migration Scripts** (20 minutes) - Change to use environment variables
6. **Add Pre-Commit Hook** (15 minutes) - Install git-secrets to prevent future leaks

**Important User Concern:** "Commit history is too valuable to lose"
- ✅ **What You Keep:** All commit messages, dates, authors, branches, tags, timeline, ALL OTHER FILES
- ❌ **What Removes:** ONLY the 3 secret files from ALL commits (they're temp utility scripts, not production code)
- ✅ **Safety:** Full backup created first, test on clone before applying to real repo

**Complete Documentation:**
- `/Users/lauraredmond/Documents/Bassline/Admin/10. Testing/1. Security/Cryptography & Secrets Management/CRYPTOGRAPHY_SECRETS_AUDIT_2025-12-10.md`
- `/Users/lauraredmond/Documents/Bassline/Admin/10. Testing/1. Security/Cryptography & Secrets Management/KEY_ROTATION_VERIFICATION.md`

**Total Time:** ~1 hour (verification + optional cleanup)

**User Decision:** Deferred to future session when ready to proceed with git cleanup.

---

#### **0. NEXT SESSION START: Voiceover Implementation & Mobile Fixes** (CRITICAL - December 9, 2025)

**START NEXT SESSION BY REVIEWING:**
- 📋 **`docs/VOICEOVER_IMPLEMENTATION_CHECKLIST.md`** - Complete implementation guide for remaining voiceover sections

**Session Tasks:**

1. **Complete Voiceover Implementation for Remaining 4 Sections:**
   - Warmup routines (migration 019 ready to run)
   - Cooldown sequences
   - Closing meditation scripts
   - Closing homecare advice
   - **Transitions** (database + frontend update needed)
   - Follow checklist for each section to avoid data transformation bugs
   - All backend/frontend code already updated - just need audio uploads

2. **Fix Mobile Device Issues:** ✅ COMPLETED
   - DPIA and ROPA compliance reports now viewable on mobile devices
   - Responsive CSS implemented

3. **Continue with Existing Roadmap:** ✅ IN PROGRESS
   - Then proceed with tasks #1-12 below

**Estimated Time:** 3-4 hours

---

#### **⚠️ PRIORITY TASKS FOR NEXT SESSION (Complete before 2025)**

**CRITICAL: These tasks MUST be completed before December 31, 2025:**

**✅ COMPLETED DECEMBER 18, 2025:**

0. **Music Track Advancement Fix** ✅ **COMPLETED** (December 18, 2025)
   - **Issue:** Background music played first track correctly but didn't advance to next track
   - **Root Cause:** Audio source node not being properly disconnected when switching tracks
   - **Fix Applied:** Added proper cleanup in `useAudioDucking.ts` lines 222-237
     - Clear source URL before switching tracks
     - Disconnect old source node
     - Allow new source node creation
   - **Testing:** Verified on mobile (iOS Safari + Android Chrome)
     - Started 30-minute class
     - Let first track finish completely
     - Second track started automatically
     - Console logs confirmed "Music track ended - calling onMusicEnded callback"
   - **Status:** Production verified working

1. **Complete Voiceover Implementation (All 6 Sections)** ✅ **COMPLETED** (December 18, 2025)
   - **Goal:** Enable voiceover playback for all 6 class section types
   - **Sections Completed:**
     1. ✅ Preparation Scripts (completed December 8, 2025)
     2. ✅ Warmup Routines (completed December 18, 2025)
     3. ✅ Cooldown Sequences (completed December 18, 2025)
     4. ✅ Closing Meditation Scripts (completed December 18, 2025)
     5. ✅ Closing HomeCare Advice (completed December 18, 2025)
     6. ✅ Transitions (completed December 18, 2025)
   - **What Was Completed:**
     - All voiceover audio recorded (MP3, 22050 Hz, 145 kbps, Mono)
     - All audio uploaded to Supabase Storage `voiceovers/` bucket
     - All database records updated with URLs + durations
     - All sections tested: music ducks to 20%, returns to 100% after voiceover
     - Migration 019 executed (warmup narrative update)
   - **Status:** All 6 sections fully functional in production

---

**🎯 REMAINING PRIORITY TASKS:**

2. **Chromecast Integration** (High Priority - Next Session)
   - **Goal:** Add Google Cast support to enable casting classes to TV/Chromecast
   - **User Request:** "I'd like to plan how I can test if you can cast my app to chromecast" (January 4, 2026)
   - **Why Needed:** Les Mills app has cast icon - users expect this feature for TV playback
   - **Implementation Plan:**
     1. Add Google Cast SDK to `frontend/index.html` (~5 min)
     2. Create CastButton React component (~15 min)
     3. Modify ClassPlayback for remote playback support (~30 min)
        - Detect when casting is active
        - Load media to remote player (voiceovers + background music)
        - Sync playback controls (play/pause/skip) between phone and TV
        - Handle local vs remote playback modes
     4. Configure media metadata for TV display (~15 min)
        - Set class name, movement name, duration on TV
        - Add thumbnail images (Bassline logo)
        - Configure media tracks for audio
     5. Create testing documentation (~20 min)
        - Requirements: Chromecast device or Google TV
        - Test steps for mobile browser → TV casting
        - Verify audio ducking works during voiceovers on TV
   - **Testing Requirements:**
     - Chromecast device or Google TV
     - iPhone/Android on same WiFi as Chromecast
     - Physical access to both devices for verification
   - **Technical Notes:**
     - No native app needed - works in mobile browser (Safari/Chrome)
     - Audio + Video support (video ready for Phase 2)
     - Free to implement (Google Cast SDK is free)
     - Battery-friendly (phone becomes remote control)
   - **Estimated Time:** ~2 hours (1.5 hours dev + 30 min testing)
   - **Status:** Plan approved, ready for implementation next session

3. **~~Set Up Dev/QA Environment Pipeline~~** ✅ **COMPLETED** (December 18, 2025)
   - **Status:** Fully operational and tested with successful TEST marker workflow verification
   - **What Was Completed:**
     - ✅ Created `dev` branch with auto-deploy to Netlify dev site
     - ✅ Set up separate Render backend service (`pilates-dev.onrender.com`)
     - ✅ Created separate Supabase dev project with reference data
     - ✅ Fixed CSP to allow dev backend connections
     - ✅ Configured all environment variables correctly
     - ✅ Tested complete dev→QA workflow (TEST marker propagated successfully)
     - ✅ Documented workflow in `/docs/DEV_QA_WORKFLOW.md`
   - **Environments:**
     - **Dev:** `dev` branch → https://bassline-dev.netlify.app + https://pilates-dev-i0jb.onrender.com
     - **Production/QA:** `main` branch → https://basslinemvp.netlify.app + https://pilates-class-generator-api3.onrender.com
   - **Cost:**
     - Dev environment: $0/month (uses Render free tier)
     - Production environment: $9/month (uses Render paid tier for better performance)
   - **Workflow Verified:**
     1. Make changes in `dev` branch → auto-deploys to dev
     2. Test fixes safely in dev environment
     3. Merge `dev` → `main` → auto-deploys to production for beta testers
   - **Documentation:**
     - `/docs/DEV_QA_ENVIRONMENT_SETUP.md` - Detailed setup guide
     - `/docs/DEV_QA_SETUP_CHECKLIST.md` - Step-by-step checklist
     - `/docs/DEV_QA_WORKFLOW.md` - Quick reference for daily workflow

4. **🤖 Test Automation Implementation Plan** (4-6 hours setup, ongoing benefits)
   - **User Need:** "Can you always check render logs and Supabase content before asking me to do so?"
   - **Goal:** Reduce manual QA time by 50-70% through proactive automated testing
   - **Implementation:** Multi-phase automation strategy

   **Phase 1: Proactive Remote Diagnostics (Immediate - This Session)**
   - ✅ Claude proactively requests Render logs before asking for manual tests
   - ✅ Claude provides specific SQL queries for Supabase data verification
   - ✅ Claude provides curl commands for API endpoint testing
   - ✅ User shares results, Claude analyzes and suggests fixes
   - **Expected Impact:** 50% reduction in manual QA requests

   **Phase 2: MCP + Multi-Model Testing (After Dev-QA Pipeline)**
   - **MCP Playwright Integration:**
     - Automated E2E browser testing (navigation, form filling, assertions)
     - Screenshot capture on failures
     - Parallel test execution across browsers
   - **Multi-Model Test Ensemble:**
     - **Claude:** Logic and data integrity testing
     - **ChatGPT:** Accessibility testing (screen reader simulation)
     - **Gemini:** Mobile responsiveness (Android perspective)
   - **Architecture:**
     ```
     Dev Environment → MCP Playwright → Automated Tests
                    ↓
     Test Results → Aggregated Report → Claude Reviews
                    ↓
     Claude Suggests Fixes → Commits to Dev Branch
                    ↓
     Merge to Main (QA) → Human Beta Testers (Final Validation)
     ```
   - **Test Coverage:**
     - AI class generation end-to-end flow
     - Music playback and track advancement
     - Voiceover playback on all transitions
     - Mobile screen wake lock functionality
     - Sequence validation and muscle balance
     - Authentication and authorization flows

   - **Performance & Load Testing (Pre-Beta Launch):**
     - **Goal:** Verify infrastructure can handle 25-50 beta testers before launch
     - **Tool:** k6 (modern, easy, beautiful reports)
     - **Test Strategy:**
       - Phase 1: Smoke test (5 users, 10 min) - identify obvious breaking points
       - Phase 2: Stress test (25 users, 10 min) - target beta tester count
       - Phase 3: Breaking point (50-100 users, 20 min) - find infrastructure limits
       - Phase 4: Endurance test (10 users, 1 hour) - check for memory leaks
     - **Critical Bottlenecks to Test:**
       - AI generation load: 50 users × $0.25/class, OpenAI rate limits (60 req/min)
       - Music streaming: 50 users × 30 min × 2.86 MB/track = ~4 GB bandwidth
       - Database connections: Supabase free tier connection pool limits
       - Render backend: 512MB RAM capacity under concurrent load
     - **k6 Script Example:**
       ```javascript
       import http from 'k6/http';
       import { check, sleep } from 'k6';

       export let options = {
         stages: [
           { duration: '2m', target: 10 },  // Ramp up to 10 users
           { duration: '5m', target: 25 },  // Ramp up to 25 users
           { duration: '5m', target: 50 },  // Ramp up to 50 users
           { duration: '2m', target: 0 },   // Ramp down
         ],
       };

       export default function () {
         let res = http.post('https://pilates-class-generator-api3.onrender.com/api/agents/generate-complete-class',
           JSON.stringify({
             difficulty: 'Beginner',
             duration: 30,
             focus_areas: ['core', 'flexibility']
           }),
           { headers: { 'Content-Type': 'application/json' }}
         );

         check(res, {
           'status is 200': (r) => r.status === 200,
           'response time < 60s': (r) => r.timings.duration < 60000,
         });

         sleep(30); // User waits 30s between actions
       }
       ```
     - **What Load Testing Reveals:**
       - Will Render's 512MB RAM handle 50 concurrent AI requests?
       - Does Supabase connection pool have enough capacity?
       - Will music streaming bandwidth exceed limits?
       - OpenAI rate limits hit? (60 requests/minute on free tier)
       - Where does it break? (20 users? 40 users? 100 users?)
     - **Estimated Time:** 2-3 hours (write scripts + run tests + analyze + fix)
     - **Run Before Beta Launch:** Prevents backend crashes, music failures, slow response times

   **Phase 3: CI/CD Integration (Post-MVP)**
   - Automated regression test suite
   - Pre-commit hooks for code quality
   - Automated performance testing
   - AI-powered bug triage system

   **Tools to Implement:**
   - MCP Playwright Server (automated E2E testing)
   - MCP Fetch (API endpoint testing)
   - Custom MCP Server (Supabase query automation)
   - Monitoring dashboard (Sentry or LogRocket)

   **Expected Benefits:**
   - ✅ Catch bugs before human testing
   - ✅ 50-70% reduction in manual QA time
   - ✅ Faster iteration cycles (test in minutes, not hours)
   - ✅ Diverse testing perspectives (3 AI models + human)
   - ✅ Automated regression testing prevents old bugs from returning
   - ✅ Continuous monitoring of production issues

   **Success Metrics:**
   - Phase 1: <5 manual test requests per bug fix (down from 10+)
   - Phase 2: 80%+ of bugs caught by automated tests before human QA
   - Phase 3: <1% production bugs escape to users

   **Status:** Phase 1 protocol active immediately, Phase 2 planned post-dev-QA pipeline

5. **~~Fix Playback Crash Bug~~** ✅ **RESOLVED** (December 8, 2025)
   - **⚠️ NOTE:** User has flagged this as RESOLVED multiple times. Stop suggesting it as a priority task.
   - **Status:** Fixed with null-safe optional chaining in MovementDisplay.tsx
   - **Verification:** All 6 section types render correctly in playback
   - **See:** Session 13 "✅ FIXED: Playback Crash" for complete resolution details

6. **~~Single Movement Video Demo~~** ❌ NOT APPLICABLE ANYMORE
   - **Status:** Removed from roadmap (December 28, 2025)
   - **Reason:** User decided not to pursue this feature

7. **~~Archive.org Music Migration~~** ❌ NOT APPLICABLE ANYMORE
   - **Status:** Removed from roadmap (December 28, 2025)
   - **Reason:** Much of this work has been completed or determined unnecessary

---

#### **1. Voiceover Support for Class Sections** (✅ COMPLETED - December 8, 2025)
- **Goal:** Enable voiceover playback for all 6 class section types (preparation, warmup, cooldown, meditation, homecare)
- **Status:** Infrastructure complete, preparation voiceover tested and working
- **What Was Completed:**
  - ✅ Database schema: Added voiceover columns to 5 tables (migration 016)
  - ✅ Backend models: Updated all 5 Pydantic models with voiceover fields
  - ✅ Frontend interfaces: Updated all 5 TypeScript interfaces in ClassPlayback.tsx
  - ✅ Generic detection: Voiceover detection works for all section types
  - ✅ Data transformation: Fixed AIGenerationPanel.tsx to map voiceover fields (commit 0e2b76f)
  - ✅ Preparation tested: Voiceover plays, music ducks to 20%, returns to 100% after
  - ✅ Documentation: Created VOICEOVER_IMPLEMENTATION_CHECKLIST.md for remaining sections
  - ✅ Audio settings: MP3, 22050 Hz, 145 kbps, Mono
- **Bug Fixed:**
  - Root cause: AIGenerationPanel.tsx wasn't mapping voiceover fields from backend to playback items
  - Same issue as movements had earlier - data transformation layer missing
  - Fix: Added voiceover field mapping for all 5 sections (lines 248-335)
- **Commits:**
  - 62581da: Database migration + models + interfaces
  - 39897aa: Fixed difficulty_level filter bug
  - 0e2b76f: Fixed voiceover field mapping (critical bug)
  - 8162789: Added implementation checklist
- **Remaining Work:**
  - Record 4 more voiceovers (warmup, cooldown, meditation, homecare)
  - Upload to Supabase Storage
  - Update database with URLs/durations
  - Migration 019 ready for warmup narrative update

#### **~~2. Single Movement Video Demonstration~~** ❌ NOT APPLICABLE ANYMORE
- **Status:** Removed from roadmap (December 28, 2025)
- **Reason:** User decided not to pursue this feature

#### **~~3. Add Jazz Music Style~~** ❌ NOT APPLICABLE ANYMORE
- **Status:** Removed from roadmap (December 28, 2025)
- **Reason:** User decided not to pursue this feature

#### **4. Restrict AI Mode Toggle to Admins + Cost Reduction** (High Priority)
- **Admin-Only AI Toggle:**
  - Move AI toggle from public UI to admin-only settings
  - Prevent non-admin users from triggering expensive AI operations
  - Database: Add `is_admin` field to `user_profiles` table
  - Frontend: Hide AI toggle if `user.is_admin !== true`

- **Cost Reduction Strategies:**
  - Implement Redis caching for AI responses (24-hour TTL)
  - Cache preparation scripts by difficulty level
  - Cache homecare advice by focus area
  - Cache web research results (MCP Playwright)
  - Estimated savings: 70-80% reduction in duplicate AI calls

- Estimated Time: 4-5 hours

#### **5. Update Class Builder Page Appearance** (Medium Priority)
- Remove "Manual Build" option from UI
- Add Cian's logos to class builder header
- Update branding/styling per design specs
- Estimated Time: 2-3 hours

#### **~~6. AWS Migration Assessment~~** ❌ NOT APPLICABLE ANYMORE
- **Status:** Removed from roadmap (December 28, 2025)
- **Reason:** Much of this work has been completed or determined unnecessary

#### **7. Add Nutrition Tracker** (High Priority)
- **Data Source:** `/Users/lauraredmond/Documents/Bassline/Admin/7. Product/Nutrition/Nutrition Information-Table-LRAdjusted.xlsx`
- **Implementation Steps:**
  1. **Create Food Database Table:**
     - Import Excel data (food items with macros, calories, etc.)
     - Ask CC to create normalized database schema for food/metrics
     - Store in Supabase `nutrition_foods` table
  2. **Rest Day Plan:**
     - Formula stored in Numbers sheet (nutrition folder/training-1 folder)
     - Screenshot Numbers sheet formulae for CC reference
     - Implement calculation logic in backend
  3. **Training Day Plan:**
     - Formula stored in Numbers sheet (nutrition folder/training-1 folder)
     - Screenshot Numbers sheet formulae for CC reference
     - Different macro targets for training vs rest days
  4. **User-Friendly Interface:**
     - Simple meal logging (breakfast, lunch, dinner, snacks)
     - Auto-calculate macros from food database
     - Show rest day vs training day targets
     - Visual progress bars for protein/carbs/fats
     - Calendar view of nutrition compliance
- **Design Considerations:**
  - Mobile-first design (quick logging on phone)
  - Barcode scanner integration (future)
  - Meal template saving (frequent meals)
  - Integration with Pilates class schedule (training day detection)
- **Note:** Numbers file has disaggregated data in training-1 folder
- **Next Step:** Screenshot Numbers formulae for CC, review data structure
- Estimated Time: 15-20 hours

#### **8. Add "Create My Baseline Wellness Routine" Button** (Medium Priority)
- Add button to home page/dashboard
- Button leads to placeholder page initially
- **Placeholder Content:**
  - "Coming Soon: Personalized Wellness Routine Builder"
  - Brief description of planned feature
  - Email signup for early access notifications
- **Future Implementation:** Full wellness routine builder with:
  - Pilates class frequency recommendations
  - Nutrition planning (see #4)
  - Sleep tracking integration
  - Stress management guidance
- Estimated Time: 1-2 hours (placeholder), 40+ hours (full implementation)

#### **9. Replace "Generate" Nav Icon with "Founder Story"** (Low Priority - UX Change)
- Current: "Generate" icon in main navigation
- New: "Founder Story" icon (move to extreme right of nav bar)
- Add founder story page with:
  - Laura's Pilates journey
  - Mission and vision for Bassline
  - Philosophy behind the platform
  - Photos/testimonials
- Estimated Time: 2-3 hours

#### **10. Replace "Classes" Nav Icon with "Wellness Space"** (Low Priority - UX Change)
- Current: "Classes" icon in main navigation
- New: "Wellness Space" icon
- Reframe "Classes" as holistic "Wellness Space" including:
  - Pilates classes (current)
  - Nutrition tracker (future - see #4)
  - Wellness routines (future - see #5)
  - Progress analytics
  - Meditation library
- Estimated Time: 2 hours (icon/name change), ongoing (feature additions)

#### **11. Retry Supabase User Confirmation** (Medium Priority)
- **Context:** Previous issues with Supabase email confirmation may have been temporary
- **Action:** Test current email confirmation flow
- **If Still Broken:**
  - Check Supabase email template settings
  - Verify SMTP configuration
  - Test with multiple email providers (Gmail, Outlook, custom domain)
  - Review Supabase logs for email delivery failures
- **If Working:** Mark as resolved and document
- **Note:** May be resolved by AWS migration (Task 2.5) using Amazon Cognito
- Estimated Time: 1 hour (testing), 2-3 hours (fixes if needed)

#### **12. Advanced Delivery Modes - Audio & Visual** (Medium Priority)
- **9.1 Audio Narration (Priority):**
  - TTS integration (ElevenLabs, OpenAI TTS, or Google Cloud TTS)
  - Pre-generate and cache common narratives (Redis 24-hour TTL)
  - HTML5 audio playback synchronization with class timer
  - Generate audio for all 6 class sections:
    1. Preparation script narration
    2. Warmup cue narration
    3. Movement instruction narration
    4. Cooldown cue narration
    5. Meditation script narration
    6. HomeCare advice narration
  - Voice selection: Calm female instructor voice
  - Speed: 0.9x (slightly slower for instruction clarity)
  - Cost: ~$15/1M characters (OpenAI TTS pricing)

- **9.2 Visual Demonstrations (Maybe - Lower Priority):**
  - Video clips for each movement
  - Still images for key positions
  - Animations for movement loops
  - Adaptive bitrate streaming (HLS/DASH)
  - Cost: ~$0.01/GB delivery (Cloudflare Stream)

- **User Preference Toggle:**
  - Text only (current - default)
  - Text + Audio
  - Text + Visual
  - All three (full multi-modal)

- Estimated Time: 20-30 hours (audio), 60+ hours (video if pursued)

#### **13. Rigorous Review of Supabase Pilates Content** (Medium Priority)
- **Goal:** Cross-compare database content with source Excel files
- **Tasks:**
  1. Export all movements from Supabase `movements` table
  2. Compare with `/Users/lauraredmond/Documents/Bassline/Admin/7. Product/Design Documentation/Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm`
  3. Verify all 34 classical movements present and accurate:
     - Names match exactly
     - Difficulty levels correct
     - Duration estimates accurate
     - Primary muscles correctly mapped
     - Movement patterns accurate
  4. Check `movement_muscles` junction table:
     - All movements have muscle group mappings
     - Verify `is_primary` flag usage (currently all False - is this correct?)
     - Cross-reference with Excel muscle group columns
  5. Review class section content:
     - Preparation scripts (4 types)
     - Warmup routines (full_body, spine, hips, shoulders)
     - Cooldown sequences (gentle, moderate, deep)
     - Meditation scripts (mindfulness, body_scan, gratitude)
     - HomeCare advice (spine_care, injury_prevention, recovery)
  6. Identify gaps or inconsistencies
  7. Create migration script to fix discrepancies
- **Deliverable:** Content audit report + SQL fix scripts
- Estimated Time: 6-8 hours

#### **14. Infrastructure Roadmap: Audio/Video Scaling Strategy** (High Priority - Strategic Planning)
- **Context:** $1,000 AWS Activate credits + mobile users need audio/video
- **User Question:** "Will my web app work for mobile end users or will they struggle?"
- **4-Phase Implementation Plan:**
  - **Phase 1:** Audio on Supabase (NOW) - 40 files × 2MB = $0.15/month
    - Record 6 class sections + 34 movements
    - Use 64 kbps mono MP3 (75% size reduction vs stereo)
    - Set 1-year cache headers for instant playback
  - **Phase 2:** Video on AWS with credits (2-3 months) - ~11.7 months free
    - H.264 encoding at 480p/720p/1080p (adaptive bitrate)
    - CloudFront CDN for global delivery
    - Set billing alarms ($50, $100, $200)
  - **Phase 3:** Migrate to Cloudflare R2 before credits expire (~10 months)
    - Free egress bandwidth (vs AWS $0.085/GB)
    - S3-compatible API (easy migration)
    - Cost reduction: $8.60/month → $1.50/month (82% savings)
  - **Phase 4:** Scale on R2 with free bandwidth (long-term)
    - Cost stays flat as user base grows
    - Video at 10K users/month: $0.15/month (vs $935/month on AWS)
- **CDN Optimization Strategy:**
  - Netlify CDN (frontend) - already optimized ✓
  - Supabase Storage CDN (audio) - update cache headers (1 year TTL)
  - Internet Archive CDN (music) - already optimized ✓
  - Cloudflare R2 (future video) - free bandwidth at scale
  - **Quick Win:** Update Supabase audio cache headers (1-hour → 1-year) for instant playback
- **Mobile Web App Viability:**
  - ✅ **Verdict: Web app will work well for mobile users** (native apps not needed until post-PMF)
  - ✅ Responsive design implemented (Tailwind breakpoints, mobile navigation)
  - ✅ Audio playback works on iOS Safari + Android Chrome
  - ✅ Fullscreen class mode optimized for mobile
  - ✅ Touch-optimized controls (56px buttons exceed WCAG guidelines)
  - ⚠️ Minor improvements recommended: swipe gestures, landscape mode, PWA features
  - ⏸️ Native apps wait until post-PMF (when offline classes, Apple Watch, push notifications needed)
- **Documentation Created:**
  - `INFRASTRUCTURE_ROADMAP.md` - Complete 4-phase plan with cost projections, timelines, checklists
  - `CDN_OPTIMIZATION_GUIDE.md` - Performance optimization strategies, cache configurations, monitoring
  - `MOBILE_WEB_APP_ASSESSMENT.md` - Mobile viability analysis, responsive design audit, UX recommendations
- **Key Financial Insights:**
  - AWS credits cover ~11.7 months of video hosting (555 months worth of $1.80/month usage)
  - Cloudflare R2 free bandwidth saves $921/month at 10K users vs AWS CloudFront
  - Hybrid strategy (audio on Supabase, video on R2) = $13.66/month at scale vs $935/month all-AWS
- **Success Metrics:**
  - Phase 1: All 40 audio files recorded, <$0.20/month cost
  - Phase 2: 34 videos encoded, AWS billing <$10/month (well within credits)
  - Phase 3: R2 migration complete, cost reduced to $1.50/month
  - Phase 4: Infrastructure cost <2% of monthly revenue at scale
- Estimated Time: Documentation complete (now), implementation 40+ hours over 12 months

#### **15. EU AI Act Compliance Dashboard & Testing** (Low Priority - Future Session)
- **Decision Transparency View:** Display all AI agent decisions for user
- **Bias Monitoring Dashboard:** Track model drift, fairness metrics, alerts
- **Audit Trail Interface:** Complete decision history with export (CSV, JSON)
- **Research Source Tracking:** MCP research source attribution
- **AI Compliance System Testing:** End-to-end testing with real AI operations
- **GDPR Data Export Fix:** Resolve HTTP 500 error on `/api/compliance/my-data`
- Estimated Time: 12-15 hours

#### **16. Security Testing** (Medium Priority - Pre-Production)
- **Penetration Testing:**
  - API endpoint security testing
  - Authentication/authorization bypass attempts
  - SQL injection, XSS, CSRF testing
  - Rate limiting validation
  - Session management security

- **Dependency Audits:**
  - `npm audit` for frontend dependencies
  - `pip-audit` for backend dependencies
  - Review Supabase RLS policies
  - Check for known CVEs in all packages

- **PII Tokenization Audit:**
  - Verify all PII is tokenized before storage
  - Test detokenization access controls
  - Review encryption key management
  - Ensure no PII in logs or error messages

- **Compliance Verification:**
  - EU AI Act transparency requirements
  - GDPR data export/deletion
  - User consent tracking
  - Cookie policy compliance
  - Data retention policies

- **API Security:**
  - JWT token validation
  - CORS policy review
  - API key rotation procedures
  - Webhook signature verification

- Estimated Time: 8-10 hours initial audit, ongoing monitoring

#### **17. Privacy Policy & Legal Documentation** (Medium Priority - Pre-Production)
- **Privacy Policy Page:**
  - GDPR-compliant privacy policy
  - Clear data collection disclosure
  - User rights explanation (access, deletion, portability)
  - Cookie usage policy
  - Third-party service disclosure (OpenAI, Supabase, etc.)
  - Data retention periods
  - Contact information for data protection officer

- **Terms of Service:**
  - User agreement for platform usage
  - AI-generated content disclaimer
  - Liability limitations
  - Intellectual property rights
  - Dispute resolution process

- **Cookie Consent Banner:**
  - EU Cookie Law compliance
  - Granular consent options (necessary, analytics, marketing)
  - Easy opt-out mechanism
  - Cookie policy link

- **Age Verification:**
  - Ensure age requirement compliance (16+ requirement)
  - Age gate on signup

- **AI Transparency Statement:**
  - Disclose use of AI for class generation
  - Explain limitations and potential biases
  - Human oversight disclosure
  - EU AI Act compliance notice

- **Deliverables:**
  - Privacy policy page (frontend)
  - Terms of service page (frontend)
  - Cookie consent implementation
  - Legal review checklist

- **Legal Review:** Consider consulting with legal counsel for final review
- Estimated Time: 12-15 hours (drafting), additional for legal review

---

### Additional Considerations (Previously Documented)

**Note:** Session 12 (Jentic Documentation Consolidation) has been **completed** (December 2, 2025).

Future enhancements (lower priority):
- Additional music tracks from Internet Archive collections (beyond Jazz)
- Playlist editing/customization for users
- Music volume controls in playback UI
- Music fade in/out between movements
- MCP Playwright caching and quality scoring (partially covered in #2)
- Comprehensive E2E testing suite
- Mobile responsiveness and PWA features
- 3.# Just add the playback crash as number 1 priority for our next session, ahead of Jazz music style addition in your list above. I need to finish now
