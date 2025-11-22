# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Pilates Class Planner v2.0** - An intelligent Pilates class planning application that combines domain expertise, AI agents, and web research capabilities to create safe, effective, and personalized Pilates classes.

**Core Architecture:**
- FastAPI backend with AI agents
- React frontend (pixel-perfect copy of existing MVP)
- Supabase PostgreSQL database
- MCP Playwright server for web research
- Four specialized AI agents (sequence, music, meditation, research)

**Design Philosophy:**
- Copy the existing MVP exactly (no improvements, no modernization)
- Safety-first approach with strict sequencing rules
- Database-driven business logic
- EU AI Act and GDPR compliant from day 1
- PII tokenization for all user data

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

## SoundCloud Music Integration

### OAuth Setup (Session 11)

**Current Status:** Waiting for SoundCloud Developer Support to approve app registration (Ticket #4004208)

**Architecture Decision:** Use instructor's SoundCloud account for all Bassline users
- Instructor curates 9 playlists (Ambient, Meditation, Chillout, etc.)
- All users hear instructor's curated music during classes
- Music is part of the complete class experience (like Peloton)
- Scales to unlimited users (SoundCloud serves audio from their CDN)
- No performance impact on backend

**When SoundCloud Support Responds:**

1. **Get App Credentials** from SoundCloud Developer Dashboard
   - Navigate to https://soundcloud.com/you/apps
   - Create new app: "Bassline Pilates"
   - Copy `Client ID` and `Client Secret`

2. **Configure Redirect URIs** in SoundCloud Dashboard
   - Production: `https://basslinemvp.netlify.app/auth/soundcloud/callback`
   - Local Dev: `http://localhost:5173/auth/soundcloud/callback`
   - **Must match exactly** (including protocol and trailing path)

3. **Add to Environment Variables**
   ```bash
   # backend/.env
   SOUNDCLOUD_CLIENT_ID=your_client_id_here
   SOUNDCLOUD_CLIENT_SECRET=your_client_secret_here
   SOUNDCLOUD_REDIRECT_URI=https://basslinemvp.netlify.app/auth/soundcloud/callback
   ```

4. **One-Time OAuth Connection** (Instructor Only)
   - Navigate to `/admin/soundcloud` in deployed app
   - Click "Connect My SoundCloud Account"
   - Authorize once (OAuth 2.1 + PKCE flow)
   - Access token and refresh token stored on backend
   - **Done!** All users can now play music from instructor's playlists

### API Endpoints

**Backend Routes** (`/api/soundcloud_auth.py`)
- `GET /auth/soundcloud/connect` - Initiates OAuth flow (admin only)
- `GET /auth/soundcloud/callback` - Exchanges code for tokens
- `GET /api/soundcloud/playlists` - Returns instructor's playlists
- `GET /api/soundcloud/tracks?playlistId=...` - Returns tracks from playlist
- `POST /api/soundcloud/refresh` - Refreshes expired access token

### Token Management

Tokens are stored securely in backend `.env` or database:
```python
# After successful OAuth
{
  "access_token": "...",  # Used for API requests
  "refresh_token": "...", # Used to get new access token
  "expires_in": 3600,     # Token lifetime (1 hour)
  "scope": "non-expiring" # SoundCloud permission scope
}
```

Auto-refresh logic runs when `access_token` expires.

### Audio Playback

Frontend uses SoundCloud's HLS (HTTP Live Streaming) URLs:
```typescript
// ClassPlayback component
const audioPlayer = new Audio(track.hls_aac_160_url); // HLS stream
audioPlayer.play();

// Sync with class timer
useEffect(() => {
  if (isPaused) audioPlayer.pause();
  else audioPlayer.play();
}, [isPaused]);
```

### Rate Limits & Scaling

**SoundCloud API Limits:**
- API requests: 15,000/day (fetching playlists/tracks)
- Audio streams: Unlimited (served from SoundCloud CDN)
- Concurrent plays: No published limit

**Bassline Usage:**
- ~10 API calls/day (fetching playlists when needed)
- Unlimited users streaming music (no backend load)
- No performance bottleneck

### Future Enhancement: Per-User OAuth

**Phase 2 Implementation** (when needed):
- Add user-level SoundCloud connections
- Store tokens in `user_soundcloud_tokens` table
- Users can choose: instructor's playlists OR their own
- Requires full OAuth flow per user

```python
# Future table schema
CREATE TABLE user_soundcloud_tokens (
    user_id UUID REFERENCES users(id),
    access_token TEXT ENCRYPTED,
    refresh_token TEXT ENCRYPTED,
    expires_at TIMESTAMP
);
```

### Troubleshooting

**Problem:** 401 Unauthorized on API calls
**Solution:** Access token expired - trigger refresh with `refresh_token`

**Problem:** CORS errors
**Solution:** Ensure redirect URI matches exactly in SoundCloud dashboard

**Problem:** Invalid redirect URI
**Solution:** Check for trailing slashes, protocol (https vs http), exact path match

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

*This CLAUDE.md provides comprehensive guidance for working in the Pilates Class Planner v2.0 codebase. Update this file as the architecture evolves.*
