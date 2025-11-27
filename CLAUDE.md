# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Pilates Class Planner v2.0** - An intelligent Pilates class planning application that combines domain expertise, AI agents, and web research capabilities to create safe, effective, and personalized Pilates classes.

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

**When making architectural decisions, ALWAYS consider both goals equally.**

---

**Core Architecture:**
- FastAPI backend with AI agents
- React frontend (pixel-perfect copy of existing MVP)
- Supabase PostgreSQL database
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

### Automatic Commits After Code Changes

**RULE:** After making any code changes, automatically commit and push to GitHub unless the user explicitly says not to.

**Process:**
1. Make code changes as requested
2. Stage all modified files: `git add .`
3. Create descriptive commit message with:
   - Summary of changes
   - Files modified
   - Purpose/reason for changes
   - Co-authored-by Claude tag
4. Push to GitHub: `git push origin main`
5. Confirm with user that changes are live

**When NOT to commit:**
- User explicitly says "don't commit" or "wait to commit"
- Files contain secrets or credentials (check first!)
- Changes are experimental/incomplete
- User says they want to review changes first

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

### Base Agent Compliance

All agents inherit from `agents/base_agent.py` which implements:
- EU AI Act transparency logging
- Bias monitoring and drift detection
- Input/output validation
- Rate limiting and resource management
- Error handling with graceful degradation

### Agent Responsibilities

**Sequence Agent** (`agents/sequence_agent.py`)
- Validates movement sequences against safety rules
- Generates variations on existing sequences
- Balances muscle groups across class duration
- Ensures appropriate progression of difficulty
- Uses small language model (e.g., GPT-3.5-turbo)

**Music Agent** (`agents/music_agent.py`)
- Recommends music based on class energy curve
- Matches BPM to movement rhythm
- Integrates with SoundCloud API
- Considers user preferences and history
- Provides fallback playlists when API unavailable

**Meditation Agent** (`agents/meditation_agent.py`)
- Generates cool-down meditation scripts
- Adapts to class intensity and duration
- Personalizes to user preferences
- Includes breathing guidance
- Provides theme variety (mindfulness, body scan, etc.)

**Research Agent** (`agents/research_agent.py`)
- Uses MCP Playwright to search web for Pilates content
- Enhances movement cues from reputable sources
- Finds condition-specific modifications
- Discovers warm-up/cool-down variations
- Caches results with 24-hour TTL in Redis
- Attributes sources for transparency

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

## Music Integration (Musopen/FreePD)

### Architecture Decision (Session 10)

**Status:** Planning phase - Implementation scheduled for Session 10

**Strategy:** Royalty-free classical music from Musopen and FreePD
- No per-user OAuth required
- No arbitrary user caps (unlike SoundCloud's 25-user dev limit)
- Royalty-free/public domain music suitable for Pilates
- Streamed from third-party CDN (not self-hosted)
- No ads during playback
- Scalable to unlimited users

### Musical Stylistic Periods

Users select from classical music periods appropriate for Pilates:
- **Baroque Period (c. 1600–1750)** - Bach, Handel, Vivaldi
- **Classical Period (c. 1750–1820)** - Mozart, Haydn, early Beethoven
- **Romantic Period (c. 1820–1910)** - Chopin, Tchaikovsky, Brahms
- **Impressionist Period (c. 1890–1920)** - Debussy, Ravel
- **Modern Period (c. 1900–1975)** - Stravinsky, Bartók, Copland
- **Contemporary/Postmodern (1975–present)** - Minimalist, ambient, neo-classical
- **Celtic Traditional**

### Additional Internet Archive Music Sources

**Many more royalty-free classical music tracks available from Internet Archive:**

1. **Musopen DVD Collection** (extensive classical music archive)
   - https://ia802809.us.archive.org/view_archive.php?archive=/20/items/musopen-dvd/Musopen-DVD.zip
   - Comprehensive collection of public domain performances
   - High-quality recordings suitable for Pilates classes

2. **Classical Music Mix by Various Artists**
   - https://archive.org/details/classical-music-mix-by-various-artists/
   - Curated collection spanning multiple periods
   - Easy to browse and download individual tracks

3. **Génies du Classique (Vivaldi, Bach, Mozart, Beethoven)**
   - https://archive.org/details/geniesduclassique_vol1no03/01+Vivaldi_+La+Primavera%2C+Concerto+No.1+In+Mi+Maggiore+-+Allegro.wav
   - High-quality WAV files
   - Well-known classical pieces ideal for Pilates

**Usage Notes:**
- All tracks are public domain or Creative Commons licensed
- Can be added to database using same SQL pattern as current tracks
- Remember to add `archive.org` to ALLOWED_STREAMING_DOMAINS whitelist in backend
- Verify audio quality and BPM suitability before adding to playlists

### Database Schema (Planned)

**Core Tables:**
- `music_tracks` - Individual tracks from Musopen/FreePD
  - source (MUSOPEN, FREEPD)
  - title, composer, performer
  - duration_seconds, bpm, stylistic_period
  - audio_url (streaming URL)
  - license_info (CC0, PD, etc.)

- `music_playlists` - Curated playlists by period/intensity
  - name, description
  - intended_intensity (LOW, MEDIUM, HIGH)
  - intended_use (PILATES_SLOW_FLOW, PILATES_CORE, etc.)
  - stylistic_period

- `music_playlist_tracks` - Many-to-many relationship
  - playlist_id, track_id
  - sequence_order

### Vendor-Agnostic Music Source Layer

**Abstract Interface:**
```python
class MusicSource:
    def get_playlists(self, period: str, intensity: str) -> List[Playlist]
    def get_tracks(self, playlist_id: str) -> List[Track]
    def get_streaming_url(self, track_id: str) -> str
```

**Implementations:**
- `MusopenSource` - Primary source (public domain classical)
- `FreePDSource` - Secondary source (CC0 library)
- Future: `JamendoSource`, `EpidemicSource` (when budget allows)

### Security Considerations

- Never expose provider API keys to client
- Validate and whitelist audio streaming domains
- No "open proxy" endpoints
- Server-side RLS for music data
- Rate limiting on API endpoints

### Audio Playback

Frontend uses HTML5 `<audio>` element:
```typescript
// ClassPlayback component
const audioPlayer = new Audio(track.audio_url);
audioPlayer.play();

// Sync with class timer
useEffect(() => {
  if (isPaused) audioPlayer.pause();
  else audioPlayer.play();
}, [isPaused]);
```

### Future Enhancement

- Add Jamendo API (commercial use requires paid license)
- Add Epidemic Sound Partner API (royalty-free catalog)
- Keep Musopen/FreePD as free base catalog
- Gradual migration path without breaking changes

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

## Session Progress & Next Steps

### Session 7: User Authentication & Profile ✅ COMPLETED

**Date:** November 22-24, 2025
**Status:** ✅ Complete

**Completed:**
- ✅ Created authentication system (JWT tokens, password hashing)
- ✅ Built backend auth endpoints (`/api/auth/register`, `/api/auth/login`, etc.)
- ✅ Created frontend auth pages (Login, Register, ResetPassword)
- ✅ Implemented AuthContext for global auth state
- ✅ Added ProtectedRoute wrapper for authenticated routes
- ✅ Created Supabase database tables (`user_profiles`, `user_preferences`)
- ✅ Fixed Render deployment (added missing dependencies to `requirements-production.txt`)
- ✅ Fixed Netlify deployment (removed unused TypeScript parameters)
- ✅ **CONFIRMED: Successfully writing user data to Supabase** (commit 9a1f8b5)
- ✅ Email confirmation page and production redirect URL fixed
- ✅ Enhanced user profile fields added to registration
- ✅ Content Security Policy implemented
- ✅ Password reset flow completed with confirmation page
- ✅ Console security warnings resolved
- ✅ Account deletion feature added (GDPR right to be forgotten)

### Session 8: Settings & Preferences ✅ COMPLETED

**Date:** November 24-25, 2025
**Status:** ✅ Complete (with known issues)

**Completed:**
- ✅ Profile editing functionality (commit 54d36cb)
- ✅ Password change functionality (commit 54d36cb)
- ✅ Account deletion with GDPR compliance (commit 93ed31c)
- ✅ Notification preferences UI and API
- ✅ Privacy settings (analytics, data sharing toggles)
- ✅ AI strictness level preferences
- ✅ Default class duration settings
- ✅ Music preference placeholders (for Session 10)
- ✅ GDPR & EU AI Act compliance system:
  - ✅ Created 4 compliance database tables (ropa_audit_log, ai_decision_log, bias_monitoring, model_drift_log)
  - ✅ Built PII logging middleware (tracks all PII transactions)
  - ✅ Built AI decision logger (tracks AI decisions with reasoning)
  - ✅ Created 5 compliance API endpoints (/api/compliance/*)
  - ✅ Updated auth endpoints to log PII transactions
  - ✅ Added compliance dashboard UI to Settings page (commits cc1bd99, 7104fbf, 60f7654)

**Production URLs:**
- Frontend: https://basslinemvp.netlify.app
- Backend API: https://pilates-class-generator-api3.onrender.com
- Settings page: https://basslinemvp.netlify.app/settings

**Known Issues:**
- ⚠️ **GDPR Article 15 Data Download - HTTP 500 Error**
  - **Issue**: `/api/compliance/my-data` endpoint fails when user clicks "Download My Data" button
  - **Symptoms**: Returns HTTP 500 error in production
  - **Attempted Fixes**:
    - ✗ JWT token refresh (logout/login) - did not resolve
    - ✗ localStorage.clear() - did not resolve
  - **Database Status**: All 4 compliance tables exist and are accessible ✓
  - **Backend Status**: API is healthy and deployed ✓
  - **Next Steps**:
    - Check Render backend logs for actual 500 error details
    - Verify Row-Level Security (RLS) policies on compliance tables
    - Test endpoint with valid JWT token directly
    - Verify PIILogger.log_data_export() middleware call

**Deferred Testing:**
- ⏸️ **AI Compliance System Testing** - Deferred to future session
  - **Reason**: AI behavior not yet incorporated into application
  - **What to Test**: AI decision logging, bias monitoring, model drift detection with real AI operations
  - **When to Test**: After Session 11 (OpenAI GPT Integration) when AI agents are actively making decisions
  - **Action Item**: Add to appropriate future session in "Pilates App Daily Sessions Final" document

### Session 9: Music Integration ✅ COMPLETED

**Date:** November 26, 2025
**Status:** ✅ Complete

**Completed:**
- ✅ Database schema for music tracks and playlists (migration 003_music_integration.sql)
- ✅ Internet Archive as music source (14 verified public domain classical tracks)
- ✅ 8 curated playlists covering all stylistic periods
- ✅ Backend music API endpoints (`/api/music/playlists`, `/api/music/tracks`, `/api/music/health`)
- ✅ Frontend music playback integration (HTML5 audio in ClassPlayback component)
- ✅ Fixed CORS issues and streaming URL whitelist
- ✅ Fixed browser autoplay blocking with manual enable button
- ✅ Fixed audio element lifecycle (src being lost on re-render)
- ✅ Replaced temporary user ID system with authenticated user ID

**Tracks Added (14 total):**
- **Impressionist:** Clair de Lune, Arabesque No. 1 (Debussy)
- **Romantic:** Minute Waltz, Nocturne Op. 9 No. 2 (Chopin)
- **Classical:** Eine Kleine Nachtmusik, Symphony No. 40 (Mozart)
- **Baroque:** Brandenburg Concerto No. 3, Air on G String, Minuet in G (Bach)
- **Modern:** Gymnopédie No. 1 (Satie), Appalachian Spring (Copland)
- **Contemporary:** Ambient meditation track
- **Celtic Traditional:** Anderson's Reel, Humours of Lissadell

**Production URLs:**
- Frontend: https://basslinemvp.netlify.app
- Backend API: https://pilates-class-generator-api3.onrender.com
- Music health check: https://pilates-class-generator-api3.onrender.com/api/music/health

**Key Technical Fixes:**
1. Added `archive.org` to ALLOWED_STREAMING_DOMAINS whitelist
2. Fixed audio element being recreated and losing src URL (changed useEffect deps)
3. Used 'playing' event instead of 'play' event for accurate playback detection
4. Added manual "Click to Enable Music" button for browser autoplay blocking
5. Replaced getTempUserId() with real authenticated user from AuthContext

**Next Steps (Future Sessions):**
- Add more tracks from Internet Archive collections (URLs documented in CLAUDE.md)
- Implement playlist editing/customization for users
- Add music volume controls in playback UI
- Consider adding music fade in/out between movements

### Session 10: Jentic Integration - Phase 1 (Core Architecture) 🔄 IN PROGRESS

**Date:** November 27, 2025
**Status:** 🔄 In Progress (Deep Research Complete)

**Goal:** Integrate Jentic's Standard Agent + Arazzo Engine with educational documentation for client relationship and future project patterns.

**Strategic Context:**
- Jentic is a client of Bassline
- Deep understanding of their codebase needed for business relationship
- Learning industry-standard agentic patterns for future projects
- Educational focus: annotate all Jentic code vs Bassline customizations

**Completed:**
- ✅ Deep study of standard-agent repository (github.com/jentic/standard-agent)
- ✅ Deep study of arazzo-engine repository (github.com/jentic/arazzo-engine)
- ✅ Created comprehensive Jentic Architecture Guide (`docs/JENTIC_ARCHITECTURE.md`)
  - StandardAgent's Plan→Execute→Reflect reasoning loop explained
  - Arazzo workflow DSL and execution model documented
  - Integration patterns with code examples
  - Business model analysis (platform gravity, vendor dependencies)
  - Reusable patterns library

**In Progress:**
- ⏳ Document existing Bassline APIs in OpenAPI 3.0 spec
- ⏳ Design Arazzo workflow V1 (4-step class generation)
- ⏳ Create Python orchestration service scaffold
- ⏳ Implement BasslinePilatesCoachAgent (extends StandardAgent)
- ⏳ Deploy to Render
- ⏳ Wire frontend to new service

**Phase 1 Deliverables:**
- Python orchestration service with Jentic integration
- Heavily commented code showing Jentic patterns vs Bassline customizations
- Working class generation using StandardAgent + Arazzo
- Integration journal documenting patterns learned
- Maintained existing functionality (movements + transitions only)

**Technical Stack:**
```
Frontend (React) → Python Orchestration Service (Render) → Existing Backend (Render)
                     ↓
              StandardAgent + Arazzo
                     ↓
              Supabase + APIs
```

**Architecture Documentation:**
- See `/docs/JENTIC_ARCHITECTURE.md` for complete patterns and integration strategy

---

### Session 11: Data Model Expansion - Phase 2 (Planned) 📋 DOCUMENTED

**Goal:** Add movement levels + all 6 Pilates class sections

**Status:** 📋 Plans committed to documentation, build later

**Context:**
Based on Excel analysis, Pilates classes have:
- 34 movements with progressive levels (L1 → L2 → L3 → Full)
- 6 class sections (not just movements):
  1. Preparation (Pilates principles, breathing)
  2. Warm-up (safety-focused routines)
  3. Main movements (existing)
  4. Transitions (existing)
  5. Cool-down (stretches, recovery)
  6a. Closing - Meditation
  6b. Closing - Home Care Advice

**Database Changes (Planned):**

#### 1. Movement Levels Table (Normalized)
```sql
CREATE TABLE movement_levels (
    id UUID PRIMARY KEY,
    movement_id UUID REFERENCES movements(id),
    level_number INTEGER,  -- 1, 2, 3, 4 (full)
    level_name VARCHAR(50),  -- "Level 1", "Level 2", etc.

    -- Level-specific content
    narrative TEXT,
    setup_position VARCHAR(255),
    watch_out_points TEXT[],
    teaching_cues JSONB,
    visual_cues TEXT[],
    muscle_groups JSONB,
    duration_seconds INTEGER,

    UNIQUE(movement_id, level_number)
);
```

**Note:** Not all movements have all 4 levels - store only what exists per movement.

#### 2. Class Section Tables (6 new tables)

**Priority 1: Preparation Scripts**
```sql
CREATE TABLE preparation_scripts (
    script_name VARCHAR(255),
    script_type VARCHAR(50),  -- 'centering', 'breathing', 'principles'
    narrative TEXT,
    key_principles TEXT[],  -- Pilates principles covered
    duration_seconds INTEGER,
    breathing_pattern VARCHAR(100),
    breathing_focus VARCHAR(255),
    difficulty_level VARCHAR(50)
);
```

**Priority 2: Warm-up Routines**
```sql
CREATE TABLE warmup_routines (
    routine_name VARCHAR(255),
    focus_area VARCHAR(100),  -- 'spine', 'hips', 'shoulders', 'full_body'
    narrative TEXT,
    movements JSONB,  -- Simple movements: neck rolls, shoulder circles
    duration_seconds INTEGER,
    contraindications TEXT[],
    modifications JSONB,
    difficulty_level VARCHAR(50)
);
```

**Priority 3:** Movements + Transitions (already exist)

**Priority 4: Cool-down Sequences**
```sql
CREATE TABLE cooldown_sequences (
    sequence_name VARCHAR(255),
    intensity_level VARCHAR(50),  -- 'gentle', 'moderate', 'deep'
    narrative TEXT,
    stretches JSONB,
    duration_seconds INTEGER,
    target_muscles TEXT[],
    recovery_focus VARCHAR(255)
);
```

**Priority 5: Closing-Meditation Scripts**
```sql
CREATE TABLE closing_meditation_scripts (
    script_name VARCHAR(255),
    meditation_theme VARCHAR(100),  -- 'body_scan', 'gratitude', 'breath'
    script_text TEXT,
    breathing_guidance TEXT,
    duration_seconds INTEGER,
    post_intensity VARCHAR(50)  -- What came before: 'high', 'moderate', 'low'
);
```

**Priority 6: Closing-Home Care Advice** (NEW)
```sql
CREATE TABLE closing_homecare_advice (
    advice_name VARCHAR(255),
    focus_area VARCHAR(100),  -- 'spine_care', 'injury_prevention', 'recovery'
    advice_text TEXT,
    actionable_tips TEXT[],
    duration_seconds INTEGER DEFAULT 60,
    related_to_class_focus BOOLEAN DEFAULT false
);
```

#### 3. New API Endpoints (Phase 2)

**Movement Levels:**
```
GET  /api/movements/{id}/levels              # Get all levels
GET  /api/movements/{id}/levels/{level_num}  # Get specific level
POST /api/movements/{id}/levels              # Admin: Add level
```

**Class Sections:**
```
GET  /api/class-sections/preparation
GET  /api/class-sections/warmup
GET  /api/class-sections/cooldown
GET  /api/class-sections/closing-meditation
GET  /api/class-sections/closing-homecare
```

**User Preferences (extend):**
```
PUT  /api/users/{id}/preferences
# Add fields:
# - delivery_format: "text" | "audio" | "visual" (Phase 3)
# - preferred_movement_level: "beginner" | "intermediate" | "advanced"
# - show_full_progression: boolean (show L1→L2→L3→Full in class)
```

#### 4. Updated Arazzo Workflow (Phase 2)

Expands from 4 steps to 10 steps:

```yaml
workflowId: assemble_complete_pilates_class_v2

steps:
  1. get_user_profile
  2. select_preparation_script     # NEW
  3. select_warmup_routine         # NEW
  4. select_movements_with_levels  # ENHANCED
  5. generate_transitions          # Existing
  6. select_cooldown_sequence      # NEW
  7. select_closing_meditation     # NEW
  8. select_homecare_advice        # NEW
  9. select_music_for_all_sections # ENHANCED
  10. assemble_and_save_class      # ENHANCED
```

**Data Flow Example:**
```yaml
# Step 4: Select movements with user's level preferences
- stepId: select_movements_with_levels
  parameters:
    - name: difficulty
      value: $inputs.difficulty
    - name: show_full_progression
      value: $steps.get_user_profile.outputs.body.show_full_progression
    # If true: returns L1→L2→L3→Full progression in narrative
    # If false: returns only appropriate single level
```

---

### Session 12: Advanced Delivery Modes - Phase 3 (Planned) 📋 DOCUMENTED

**Goal:** Multi-modal delivery (audio narration + visual demonstrations)

**Status:** 📋 Plans committed to documentation, build in future

**Context:**
Users may want:
- **Text narrative** (current, Phase 1)
- **Audio narration** (TTS, Phase 3)
- **Visual demonstration** (video/images, Phase 3)

Phase 3 deferred to focus on core architecture first.

#### 1. Audio Narrative Generation

**Integration Options:**
- **ElevenLabs** - High-quality, natural voices
- **OpenAI TTS** - Cost-effective, good quality
- **Google Cloud TTS** - Enterprise option

**Implementation:**
```python
# Generate audio for each class section
async def generate_audio_narrative(section_text: str) -> str:
    """
    Returns audio_url for the narrated text
    Caches generated audio for reuse
    """
    audio_url = await tts_service.synthesize(
        text=section_text,
        voice="calm_female",  # Pilates instructor voice
        speed=0.9  # Slightly slower for instruction
    )
    return audio_url
```

**Database Changes:**
```sql
-- Add audio URLs to all content tables
ALTER TABLE movements ADD COLUMN audio_url TEXT;
ALTER TABLE preparation_scripts ADD COLUMN audio_url TEXT;
ALTER TABLE warmup_routines ADD COLUMN audio_url TEXT;
-- etc.
```

#### 2. Visual Demonstrations

**Content Types:**
- **Still images** - Key positions for each movement
- **Video clips** - Full movement demonstrations
- **Animations** - Loop-able movement cycles

**Database Changes:**
```sql
ALTER TABLE movement_levels ADD COLUMN video_url TEXT;
ALTER TABLE movement_levels ADD COLUMN thumbnail_url TEXT;
ALTER TABLE movement_levels ADD COLUMN key_position_images JSONB;
-- JSONB format: [{"position": "start", "url": "..."}, {"position": "mid", "url": "..."}, ...]
```

**Frontend Changes:**
```typescript
// ClassPlayback component enhancement
interface DeliveryMode {
  text: boolean;
  audio: boolean;
  visual: boolean;
}

// User can toggle:
// - Text only (current)
// - Text + Audio
// - Text + Visual
// - All three (full multi-modal)
```

#### 3. User Preferences for Delivery

```sql
-- Extend user_preferences table
ALTER TABLE user_preferences
  ADD COLUMN delivery_format_text BOOLEAN DEFAULT true,
  ADD COLUMN delivery_format_audio BOOLEAN DEFAULT false,
  ADD COLUMN delivery_format_visual BOOLEAN DEFAULT false;
```

**Progressive Enhancement Strategy:**
- Default: Text (works for everyone)
- Opt-in: Audio (requires TTS service)
- Opt-in: Visual (requires video content)
- All devices support text; audio/visual enhance experience

#### 4. Performance Considerations

**Audio:**
- Pre-generate and cache common narratives
- Use CDN for audio file delivery
- Stream audio with HTML5 `<audio>` element

**Video:**
- Use adaptive bitrate streaming (HLS/DASH)
- Provide quality options (480p, 720p, 1080p)
- Cache video thumbnails aggressively
- Consider YouTube/Vimeo hosting vs self-hosted

**Cost Management:**
- TTS: ~$15/1M characters (OpenAI pricing)
- Video hosting: ~$0.01/GB delivery (Cloudflare Stream)
- Budget based on user base and usage patterns

---

**Next Sessions Preview:**

- **Session 10:** Jentic Integration - Phase 1 (IN PROGRESS) ← Current Focus
- **Session 11:** Data Model Expansion - Phase 2 (DOCUMENTED, build later)
- **Session 12:** Advanced Delivery Modes - Phase 3 (DOCUMENTED, build later)
- **Session 13:** Testing Suite & Polish

---

*This CLAUDE.md provides comprehensive guidance for working in the Pilates Class Planner v2.0 codebase. Update this file as the architecture evolves.*
- I'd like option 1 but can you explain what continuing with stubs means and also that Jentic libs aren't published to PyPI (what is PyPI). But first, I have just paid 25 dollars to avoid seeing the Supabase restriction on creating new users and still see that "Registration temp unavailable due to Supabase free tier" message. Could you please troubleshoot? I'm currently re-deploying on netlify and render.com in case this is what was causing the issue. See latest screenshot on desktop for user reg error