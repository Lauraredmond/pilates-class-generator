# Pilates Class Planner v2.0 - Daily Development Sessions (COMPREHENSIVE)

**Project Type:** MVP Rebuild with AI Agents + MCP Integration
**Total Duration:** 19-23 sessions (4-5 weeks)
**Session Length:** 2-3 hours focused work
**Approach:** Incremental development with working code after each session

---

## 🎯 CORE PRINCIPLES

### Design Philosophy
- **Copy the existing MVP exactly** - No improvements, no modernization
- **Match pixel-perfect** - Layout, colors, fonts must be identical
- **Preserve user experience** - If it works in MVP, replicate it exactly

### Development Philosophy
- **Safety first** - Pilates sequencing rules prevent injury
- **Database-driven** - All business logic in Supabase functions
- **Agent-based** - Use small language models for intelligent variation
- **MCP-enhanced** - Leverage Playwright for web research capabilities
- **Domain-knowledge powered** - Integrate comprehensive Excel database
- **Compliance by design** - EU AI Act, GDPR, PII tokenization from day 1

### Few-Shot Learning Approach
Each session prompt includes:
1. **Role definition** - Who Claude Code should act as
2. **Context** - What has been built so far
3. **Expected inputs** - What files/data are available
4. **Expected outputs** - Specific deliverables with examples
5. **Success criteria** - How to verify the work is complete

---

## 📋 PROJECT CONTEXT

### What Exists (Old MVP)
- React frontend with drag-and-drop class builder
- Hard-coded list of ~50 Pilates movements
- Simple balance algorithm (tracks muscle groups)
- Basic SoundCloud integration
- Limited backend functionality
- Basic data persistence (local storage or simple database)

### What We're Building (v2.0)
- **Enhanced** FastAPI backend with intelligent agents
- Supabase PostgreSQL database with comprehensive movement library
- **NEW: MCP Playwright server for web research**
- **NEW: Domain knowledge database from Excel tracker**
- Four AI agents (sequence, music, meditation, **research**)
- **Robust** user accounts with PII tokenization
- **Full** authentication system (registration, login, password reset)
- EU AI Act compliance (transparency, bias monitoring, drift detection)
- Identical frontend UX with enhanced reliability
- User progress tracking and analytics
- Personalized recommendations based on history

### The 34 Classical Pilates Movements

Based on Joseph Pilates' original work, these movements form the foundation:

**Mat Work Foundation (14 movements):**
1. The Hundred
2. Roll Up
3. Roll Over
4. Single Leg Circle
5. Rolling Like a Ball
6. Single Leg Stretch
7. Double Leg Stretch
8. Spine Stretch Forward
9. Open Leg Rocker
10. Corkscrew
11. The Saw
12. Swan Dive
13. Single Leg Kick
14. Double Leg Kick

**Intermediate Movements (10 movements):**
15. Neck Pull
16. Scissors
17. Bicycle
18. Shoulder Bridge
19. Spine Twist
20. Jack Knife
21. Side Kick Series (Front/Back)
22. Side Kick Series (Up/Down)
23. Side Kick Series (Circles)
24. Teaser

**Advanced Movements (10 movements):**
25. Hip Twist
26. Swimming
27. Leg Pull Front
28. Leg Pull Back
29. Side Bend
30. Boomerang
31. Seal
32. Control Balance
33. Push Up
34. Rocking

Each movement targets specific muscle groups and must follow strict sequencing rules for safety and effectiveness.

---

## 🌐 MCP PLAYWRIGHT INTEGRATION

### Integration Benefits

The Microsoft Playwright MCP server will enable:

1. **Dynamic Cueing Research**
   - Search for exercise-specific visual cues
   - Find anatomical diagrams for proper form
   - Retrieve latest research on movement modifications
   - Collect warm-up/cool-down variations for specific muscle groups

2. **Content Enrichment**
   - Gather contemporary Pilates trends
   - Find music recommendations from fitness blogs
   - Research meditation scripts and mindfulness techniques
   - Collect injury prevention tips from reputable sources

3. **Professional Development**
   - Search for continuing education resources
   - Find workshop and certification opportunities
   - Gather community best practices
   - Research equipment recommendations

4. **Client Customization**
   - Search for condition-specific modifications (pregnancy, injuries)
   - Find age-appropriate adaptations
   - Research sport-specific cross-training benefits
   - Gather nutritional guidance for Pilates practitioners

### MCP Architecture

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

---

## 🗄️ DOMAIN KNOWLEDGE DATABASE

### Excel Integration Strategy

Your `Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm` will serve as the authoritative source of domain knowledge:

**Migration Path:**
1. **Session 2A (NEW)**: Extract and parse Excel data
2. **Session 2B (NEW)**: Transform to normalized database schema
3. **Session 3**: Validate data integrity and relationships
4. **Ongoing**: Use as source of truth for all movements

### Movement Data Structure

**Expected Excel Columns:**
- **Movement Name** - Official name (e.g., "The Hundred")
- **Difficulty Level** - Beginner, Intermediate, Advanced
- **Primary Muscle Groups** - Core, Legs, Arms, Back, etc.
- **Movement Pattern** - Flexion, Extension, Rotation, Lateral, Balance
- **Duration** - Typical time in seconds
- **Breathing Pattern** - Inhale/Exhale counts
- **Prerequisites** - What movements should come before
- **Contraindications** - When to avoid
- **Setup Instructions** - How to position
- **Execution Notes** - Step-by-step guidance
- **Modifications** - Easier/harder variations

### Example Movement Entry

**Movement:** The Hundred
- **Difficulty:** Beginner
- **Primary Muscles:** Core (Abdominals, Hip Flexors)
- **Secondary Muscles:** Shoulders, Breathing muscles
- **Pattern:** Flexion, Stability
- **Duration:** 60-100 seconds
- **Breathing:** 5 short inhales, 5 short exhales (10 cycles)
- **Prerequisites:** None (warm-up movement)
- **Setup:** Supine position, legs tabletop, head lifted
- **Execution:** Pump arms up and down while maintaining position
- **Modifications:** 
  - Easier: Feet on floor, lower head
  - Harder: Legs extended to 45 degrees

---

## 🔄 SEQUENCING RULES

### Safety-Critical Rules (Never Violate)
1. **Warm-up first** - Always start with breathing and gentle movements
2. **Spinal progression** - Flexion before extension
3. **Balance muscle groups** - Don't overwork one area
4. **Complexity progression** - Simple to complex within session
5. **Cool-down required** - End with stretching and breathing

### Quality Rules (Enforce in Strict Mode)
1. **Movement variety** - At least 3 different patterns per class
2. **Appropriate duration** - Total class time 45-60 minutes
3. **Rest periods** - Include transitions between intense movements
4. **Muscle group balance** - Track cumulative load across groups
5. **Energy curve** - Build intensity, maintain, then taper

### Preference Rules (Allow in Autonomous Mode)
1. **Style variation** - Classical vs. contemporary
2. **Focus areas** - Allow emphasis on specific goals
3. **Creative transitions** - Permit intelligent linking
4. **Music matching** - Sync rhythm to movement type
5. **Personal preferences** - User history influences selection

---

## 📅 DAILY SESSIONS

---

## **SESSION 1: Project Setup & Design Extraction**

### Role
You are a senior full-stack developer who specializes in faithful recreations of existing applications.

### Context
This is day 1 of rebuilding a Pilates class planner. An MVP exists on the user's Mac that we need to replicate exactly. We're starting completely fresh with a new tech stack.

### Your Task
Set up the project foundation and extract the design system from the existing MVP.

### Inputs You'll Receive
- Path to existing MVP on Mac (user will run you from parent directory)
- Access to the MVP's source code and assets

### What You Should Do

**Step 1: Examine the Existing MVP**
- Navigate to the MVP directory
- Take screenshots of every page and component
- Document the color palette (hex codes)
- List all fonts used (family, weights, sizes)
- Note spacing patterns (margins, padding)
- Map out the component hierarchy
- Extract any SVG icons or custom graphics

**Step 2: Create New Project Structure**
```
pilates-v2/
├── frontend/          # React + TypeScript + Vite
├── backend/           # FastAPI + Python
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── tests/             # Test files
```

**Step 3: Initialize Frontend**
- Set up Vite with React and TypeScript
- Install dependencies: @dnd-kit/core, @dnd-kit/sortable, axios, tailwind, chart.js, react-chartjs-2
- Create design-tokens file with extracted colors, fonts, and spacing
- Set up Tailwind config to match the MVP's design system

**Step 4: Initialize Backend**
- Set up FastAPI project with Poetry or pip
- Create basic structure: routers/, models/, services/, database/
- Install: fastapi, uvicorn, sqlalchemy, pydantic, python-dotenv, pytest
- Create .env.example file with placeholder values

**Step 5: Documentation**
Create these files in docs/:
- DESIGN_SYSTEM.md (document extracted design with screenshots)
- TECH_STACK.md (list all dependencies and why chosen)
- SETUP.md (how to run locally)

### Expected Outputs
- Complete project structure
- Design system documentation with screenshots
- Working dev environment (both frontend and backend should start)
- README.md with setup instructions

### Success Criteria
- [ ] Both frontend and backend start without errors
- [ ] Design tokens match MVP exactly (verified with screenshots)
- [ ] All dependencies installed and documented
- [ ] Git repository initialized with .gitignore

---

## **SESSION 2A (NEW): Excel Database Extraction**

### Role
You are a data engineer specializing in Excel parsing and database migration.

### Context
Day 2A. Project structure is set up. Now we extract the comprehensive Pilates knowledge from the Excel tracker.

### Your Task
Parse the Excel workbook and prepare data for database migration.

### Inputs You'll Receive
- Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm
- Database schema requirements

### What You Should Do

**Step 1: Parse Excel Structure**
- Use openpyxl or pandas to read the .xlsm file
- Identify all sheets and their purposes
- Map data relationships between sheets
- Document any macros or formulas for logic extraction

**Step 2: Data Extraction**
Create extraction scripts for:
- Movement catalog
- Muscle group mappings
- Sequencing rules
- Safety guidelines
- Teaching cues
- Progress tracking templates

**Step 3: Data Validation**
- Check for missing values
- Identify inconsistencies
- Validate relationships
- Create data quality report

**Step 4: Transform to JSON**
- Convert to intermediate JSON format
- Maintain all relationships
- Include metadata
- Version for migration tracking

### Expected Outputs
- data_extraction.py script
- extracted_data.json (complete dataset)
- data_quality_report.md
- excel_schema_documentation.md

### Success Criteria
- [ ] All sheets successfully parsed
- [ ] Zero data loss in extraction
- [ ] Relationships preserved
- [ ] JSON validates against schema

---

## **SESSION 2B (NEW): Database Migration & MCP Setup**

### Role
You are a full-stack developer with expertise in database design and MCP integration.

### Context
Day 2B. Excel data extracted. Now we migrate to PostgreSQL and set up MCP.

### Your Task
Create database schema, migrate Excel data, and configure MCP servers.

### What You Should Do

**Step 1: Database Schema Creation**
```sql
-- Core tables
CREATE TABLE movements (
    id UUID PRIMARY KEY,
    excel_id VARCHAR(50), -- Original Excel reference
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    difficulty_level INTEGER,
    equipment_required JSONB,
    primary_muscles JSONB,
    secondary_muscles JSONB,
    duration_seconds INTEGER,
    breathing_pattern JSONB,
    created_from_excel BOOLEAN DEFAULT true
);

CREATE TABLE movement_sequences (
    id UUID PRIMARY KEY,
    movement_id UUID REFERENCES movements(id),
    prerequisites JSONB,
    progressions JSONB,
    complementary_movements JSONB
);

CREATE TABLE teaching_cues (
    id UUID PRIMARY KEY,
    movement_id UUID REFERENCES movements(id),
    cue_type VARCHAR(50), -- verbal, visual, tactile
    cue_text TEXT,
    common_mistakes JSONB,
    corrections JSONB
);

CREATE TABLE safety_guidelines (
    id UUID PRIMARY KEY,
    movement_id UUID REFERENCES movements(id),
    contraindications JSONB,
    modifications JSONB,
    injury_considerations JSONB
);
```

**Step 2: Data Migration**
- Import JSON data to PostgreSQL
- Maintain Excel ID references for traceability
- Create indexes for performance
- Set up triggers for audit trail

**Step 3: MCP Playwright Setup**
```javascript
// mcp-config.js
const playwright_config = {
  server: {
    command: "npx",
    args: ["@modelcontextprotocol/server-playwright"],
    env: {
      PLAYWRIGHT_BROWSERS_PATH: "/browsers",
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "false"
    }
  },
  tools: [
    {
      name: "search_cues",
      description: "Search for Pilates cueing and form guidance",
      parameters: {
        movement_name: "string",
        modification_type: "string",
        target_audience: "string"
      }
    },
    {
      name: "find_warmups",
      description: "Find warm-up exercises for specific muscle groups",
      parameters: {
        muscle_groups: "array",
        duration_minutes: "number",
        equipment_available: "array"
      }
    },
    {
      name: "research_cooldowns",
      description: "Research cool-down and stretching sequences",
      parameters: {
        workout_intensity: "string",
        focus_areas: "array",
        time_available: "number"
      }
    }
  ]
};
```

**Step 4: Integration Testing**
- Test database queries
- Verify MCP server connection
- Run sample research queries
- Validate data integrity

### Expected Outputs
- Database migration scripts
- MCP configuration files
- Integration test suite
- Migration report

---

## **SESSION 3: Backend API & Agent Foundation**

### Role
You are a senior backend developer specializing in FastAPI, with expertise in AI agent orchestration and Supabase integration.

### Context
Day 3. Database is ready with movements and schema. Now we need a FastAPI backend that serves the React frontend and orchestrates the AI agents.

### Your Task
Create a production-quality FastAPI backend with endpoints for class management, AI agent orchestration, and proper authentication.

### What You Should Do

**Step 1: Backend Structure**
```
backend/
├── app/
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Environment config
│   ├── database.py             # Supabase client
│   ├── models/                 # Pydantic models
│   │   ├── user.py
│   │   ├── movement.py
│   │   ├── class_plan.py
│   │   └── agent.py
│   ├── routers/                # API routes
│   │   ├── auth.py
│   │   ├── movements.py
│   │   ├── classes.py
│   │   └── agents.py
│   ├── services/               # Business logic
│   │   ├── auth_service.py
│   │   ├── class_service.py
│   │   └── agent_orchestrator.py
│   ├── agents/                 # AI agent implementations
│   │   ├── base_agent.py
│   │   ├── sequence_agent.py
│   │   ├── music_agent.py
│   │   ├── meditation_agent.py
│   │   └── research_agent.py    # NEW: MCP research
│   └── utils/
│       ├── validators.py
│       └── security.py
├── tests/
├── requirements.txt
└── .env.example
```

**Step 2: Core API Endpoints**

**Authentication (`/auth`)**
- POST /auth/register - Create new user
- POST /auth/login - Authenticate user
- POST /auth/refresh - Refresh JWT token
- POST /auth/logout - Invalidate session

**Movements (`/movements`)**
- GET /movements - List all movements (with filters)
- GET /movements/{id} - Get single movement
- GET /movements/by-difficulty/{level} - Filter by difficulty
- POST /movements/{id}/research - Trigger MCP research for movement

**Class Plans (`/classes`)**
- GET /classes - List user's classes
- POST /classes - Create new class plan
- GET /classes/{id} - Get class details
- PUT /classes/{id} - Update class plan
- DELETE /classes/{id} - Delete class plan
- GET /classes/{id}/movements - Get movements in sequence

**AI Agents (`/agents`)**
- POST /agents/generate-sequence - Generate movement sequence
- POST /agents/select-music - Select music for class
- POST /agents/create-meditation - Generate meditation guide
- POST /agents/research-cues - Research movement cues via MCP
- GET /agents/decisions - Get user's agent decision history

**Step 3: Agent Base Class**

Create a base agent class that all agents inherit from:

```python
class BaseAgent:
    def __init__(self, model_name: str, strictness_level: str):
        self.model = self.load_model(model_name)
        self.strictness = strictness_level
        self.mcp_client = MCPClient()  # NEW: MCP integration
        
    async def process(self, inputs: Dict) -> AgentResponse:
        # Validate inputs
        # Process with model
        # Log decision
        # Return structured output
        pass
```

**Step 4: Enhanced Sequence Agent with MCP**

```python
class EnhancedSequenceAgent(BaseAgent):
    async def generate_sequence(self, params: SequenceParams):
        # 1. Get base movements from database
        base_movements = await self.db.get_movements(params)
        
        # 2. Check if we need fresh research
        if params.include_latest_trends:
            trending = await self.mcp_client.search_trending_pilates()
            base_movements = self.merge_trending(base_movements, trending)
        
        # 3. Generate sequence with LLM
        sequence = await self.llm.create_sequence(base_movements)
        
        # 4. Enrich with web-sourced cues
        if params.enhanced_cues:
            for movement in sequence:
                cues = await self.mcp_client.search_cues(movement.name)
                movement.cues.extend(self.filter_quality_cues(cues))
        
        # 5. Validate safety
        return await self.validate_and_return(sequence)
```

### Expected Outputs
- Complete backend/ directory structure
- All API endpoints implemented
- Four agents working (including research agent)
- Comprehensive test suite
- API documentation

### Success Criteria
- [ ] Backend starts on http://localhost:8000
- [ ] All endpoints return proper responses
- [ ] Authentication works (JWT tokens)
- [ ] Agents generate valid outputs
- [ ] MCP research functions work
- [ ] All decisions logged to database

---

## **SESSION 4: Frontend - Home Page & Navigation**

### Role
You are a senior React developer specializing in TypeScript and modern UI/UX patterns.

### Context
Day 4. Backend is complete with working API. Database has movement data. Now we rebuild the frontend to match the existing MVP exactly.

### Your Task
Create the React frontend foundation: routing, navigation, home page, and global state management.

### What You Should Do

**Step 1: Set Up Routing**
- Create routes for: Home, Classes, Generate, Analytics, Profile, Settings
- Set up protected routes (require authentication)
- Handle 404 pages
- Implement route transitions

**Step 2: Global State Management**
- User authentication state
- Current class being edited
- Movement library
- UI state (modals, toasts, loading)
- MCP research results cache

**Step 3: Create Layout Components**
- Header/Navigation (match MVP pixel-perfect)
- Footer
- Sidebar (if applicable)

**Step 4: Home Page**
- Hero section with CTA
- Quick stats dashboard
- Recent classes list
- Get started guide

**Step 5: Shared Components**
- Button (primary, secondary, danger)
- Card (for classes, movements, stats)
- Loading spinner
- Toast notification
- Modal dialog
- Input fields

### Expected Outputs
- Complete src/ directory with components
- Routing configured
- Home page matching MVP
- Shared component library
- API integration layer

### Success Criteria
- [ ] Frontend starts on http://localhost:5173
- [ ] Navigation works between routes
- [ ] Home page matches MVP screenshots
- [ ] API calls reach backend
- [ ] Responsive design works

---

## **SESSION 5: Frontend - Class Builder (Drag & Drop)**

### Role
You are a senior frontend developer with expertise in React drag-and-drop interactions.

### Context
Day 5. Foundation is set. Now we implement the core feature: the drag-and-drop class builder.

### Your Task
Recreate the drag-and-drop class builder interface exactly as it appears in the MVP.

### What You Should Do

**Step 1: Install Drag-and-Drop Library**
Use @dnd-kit or react-beautiful-dnd:
- DndContext wrapper
- Sortable container
- Droppable zones
- Touch support

**Step 2: Create Movement Card Component**
- Movement name
- Duration (editable)
- Muscle groups (badges)
- Difficulty indicator
- Drag handle
- Remove button
- Expand for details
- **NEW: Research button** (triggers MCP search)

**Step 3: Class Builder Layout**

**Left Panel: Movement Library**
- Search/filter movements
- Grid or list view toggle
- Drag movements to sequence
- **NEW: "Research Variations" button**

**Center Panel: Class Sequence**
- Drop zone for movements
- Shows movements in order
- Draggable to reorder
- Total duration display
- Muscle balance chart

**Right Panel: Class Details**
- Class name (editable)
- Total duration
- Difficulty level
- Save/Clear/Generate buttons
- **NEW: Research panel** (shows MCP results)

**Step 4: Research Integration Panel**
- Display web-sourced cues
- Show source attribution
- Allow saving to personal library
- Quality score indicator

### Expected Outputs
- Working drag-and-drop interface
- Movement library with filters
- Class sequence builder
- Real-time muscle balance
- Research integration UI

### Success Criteria
- [ ] Drag and drop works smoothly
- [ ] Movements can be reordered
- [ ] Duration updates automatically
- [ ] Muscle balance calculates correctly
- [ ] Research results display properly
- [ ] Interface matches MVP exactly

---

## **SESSION 6: Frontend - Analytics Dashboard**

### Role
You are a data visualization specialist and React developer.

### Context
Day 6. Class builder works. Now we create an analytics dashboard.

### Your Task
Build an analytics page that displays user progress and insights.

### What You Should Do

**Step 1: Key Metrics Cards**
- Total classes completed
- Total practice time
- Current streak
- Favorite movements
- **NEW: Research insights used**

**Step 2: Charts**
- Practice frequency (line chart)
- Muscle group distribution (stacked bar)
- Difficulty progression (area chart)
- Top movements (horizontal bar)

**Step 3: Insights Section**
- Auto-generated insights
- Encouraging tone
- Progress tracking
- **NEW: Trending exercises from MCP**

**Step 4: Export Functionality**
- Export as CSV
- Export charts as PNG
- Print report

### Expected Outputs
- Analytics page with charts
- Metric cards
- Insights panel
- Export functionality

### Success Criteria
- [ ] All charts render correctly
- [ ] Data updates with filters
- [ ] Insights are relevant
- [ ] Export works
- [ ] Responsive design

---

## **SESSION 7: User Authentication & Profile**

### Role
You are a full-stack developer specializing in authentication and user management.

### Context
Day 7. Core features work. Now we add user authentication and profiles.

### Your Task
Implement complete authentication flow and user profile management.

### What You Should Do
- Registration with email verification
- Login with JWT tokens
- Password reset flow
- User profile page
- Settings management
- PII tokenization

### Expected Outputs
- Auth pages (login, register, reset)
- Profile page
- Settings page
- Protected route wrapper

---

## **SESSION 8: Settings & Preferences**

### Role
You are a UX developer focused on user preferences and customization.

### Context
Day 8. Authentication works. Now add user settings and preferences.

### Your Task
Create comprehensive settings page for user preferences.

### What You Should Do
- Account settings
- Notification preferences
- Privacy settings
- AI strictness preferences
- Music preferences
- **NEW: Research source preferences**

---

## **SESSION 9: MCP Advanced Features**

### Role
You are an MCP integration specialist.

### Context
Day 9. Basic MCP integration working. Now add advanced research capabilities.

### Your Task
Implement advanced MCP features for comprehensive web research.

### What You Should Do

**Step 1: Implement Caching Layer**
```python
class MCPCache:
    def __init__(self, redis_client, ttl_hours=24):
        self.redis = redis_client
        self.ttl = ttl_hours * 3600
        
    async def get_or_fetch(self, query: str, fetcher):
        cache_key = f"mcp:{hashlib.md5(query).hexdigest()}"
        cached = await self.redis.get(cache_key)
        
        if cached:
            return json.loads(cached)
            
        result = await fetcher(query)
        await self.redis.setex(cache_key, self.ttl, json.dumps(result))
        return result
```

**Step 2: Quality Scoring System**
```python
class ResearchQualityScorer:
    TRUSTED_DOMAINS = [
        'pilatesmethod.com',
        'pilatesfoundation.com',
        'balancedbody.com',
        'ncbi.nlm.nih.gov'
    ]
    
    def score_source(self, url: str, content: str) -> float:
        # Score based on domain authority
        # Check for citations
        # Verify author credentials
        # Check recency
        return score
```

**Step 3: Batch Research Operations**
- Research multiple movements in parallel
- Organize batch results
- Progress tracking

**Step 4: Research Scheduling**
- Weekly automatic updates
- Popular movement research
- Stale data detection

### Expected Outputs
- MCP caching implementation
- Quality scoring system
- Batch research API
- Automated scheduler
- Research analytics

---

## **SESSION 10: Music Integration**

### Role
You are an API integration specialist with audio streaming experience.

### Context
Day 10. Core app works. Add music integration.

### Your Task
Integrate music selection and playback features.

### What You Should Do
- SoundCloud API integration
- Music recommendation agent
- Playlist creation
- BPM matching
- **NEW: Web-sourced music discovery via MCP**

---

## **SESSION 11: OpenAI GPT Integration & Agentic Behavior**

### Role
You are an AI integration specialist with expertise in LLM APIs and cost optimization.

### Context
Day 11. Core agents are using template-based variation. Now we upgrade to real GPT-3.5 for genuine agentic behavior and natural language variation.

### Your Task
Enable OpenAI API integration for narrative variation, implement cost-optimized caching, and test the full AI agentic platform.

### What You Should Do

**Step 1: OpenAI API Setup**
- Sign up for OpenAI API account at https://platform.openai.com
- Add payment method to OpenAI billing
- Generate API key from https://platform.openai.com/api-keys
- Add key to `backend/.env`: `OPENAI_API_KEY=sk-proj-...`
- Verify $5 free tier credits (3-month validity, ~1,250-2,500 class generations)

**Step 2: Enable LLM Integration**
```python
# Already implemented in BaseAgent.py - verify configuration
class BaseAgent:
    def __init__(self, model_name="gpt-3.5-turbo", strictness_level="guided"):
        # OpenAI client initialization
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if openai_api_key and openai_api_key != 'sk-YOUR_OPENAI_API_KEY_HERE':
            self.openai_client = OpenAI(api_key=openai_api_key)
        else:
            # Falls back to template-based variation
            self.openai_client = None
```

**Step 3: Test Narrative Variation**
```python
# Test the agent's narrative variation capabilities
async def test_llm_variation():
    agent = SequenceAgent()

    # Generate a class with LLM variation enabled
    result = await agent.process(
        user_id="test-user",
        inputs={
            "target_duration_minutes": 30,
            "difficulty_level": "Beginner",
            "focus_areas": ["Core"],
            "include_mcp_research": False
        }
    )

    # Verify varied phrasing
    for movement in result['data']['sequence']:
        if movement.get('type') == 'movement':
            # Check teaching_cues have varied phrasing
            assert len(movement.get('teaching_cues', [])) > 0
            # Check setup_instruction uses natural language
            assert movement.get('setup_instruction') != None
            # Check muscle_description is conversational
            assert movement.get('muscle_description') != None
```

**Step 4: Implement Redis Caching for Cost Optimization**
```python
class LLMCache:
    """
    Cache LLM results to reduce API costs
    - 24 hour TTL for narrative variations
    - Hash input text for cache key
    - Store in Redis for fast retrieval
    """
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 24 * 3600  # 24 hours

    async def get_or_generate(self, texts: List[str], variation_type: str, generator):
        # Create cache key from input
        cache_key = f"llm_variation:{variation_type}:{hashlib.md5('|'.join(texts).encode()).hexdigest()}"

        # Check cache
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Generate with LLM
        result = await generator(texts, variation_type)

        # Store in cache
        await self.redis.setex(cache_key, self.ttl, json.dumps(result))

        return result
```

**Step 5: Cost Monitoring Dashboard**
```python
class CostMonitor:
    """Track OpenAI API costs and usage"""

    async def log_api_call(self, model: str, input_tokens: int, output_tokens: int):
        cost = self.calculate_cost(model, input_tokens, output_tokens)

        await self.supabase.table('api_usage_log').insert({
            'timestamp': datetime.now().isoformat(),
            'model': model,
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'cost_usd': cost
        }).execute()

    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        if model == "gpt-3.5-turbo":
            input_cost = (input_tokens / 1000) * 0.0015
            output_cost = (output_tokens / 1000) * 0.002
            return input_cost + output_cost
        return 0.0
```

**Step 6: Template Fallback Configuration**
```python
# In sequence_agent.py
class SequenceAgent(BaseAgent):
    async def _enhance_narrative_variations(self, sequence):
        """Use LLM if available, else fall back to templates"""
        if self.openai_client:
            # Use GPT-3.5 for natural variation
            logger.info("Using OpenAI GPT-3.5 for narrative variation")
            return await self._llm_based_variation(sequence)
        else:
            # Use template-based variation (already in MovementDisplay.tsx)
            logger.info("OpenAI not configured - using template-based variation")
            return sequence  # Frontend handles template variation
```

**Step 7: Testing & Verification**
- Generate 5 test classes with API key configured
- Generate 5 test classes without API key (verify fallback)
- Compare variation quality (LLM should be more natural)
- Verify cache hit rate after repeated generations
- Check cost per class generation (~$0.002-0.004)
- Monitor API response times (~1-3 seconds for variation)

**Step 8: Documentation**
Create `docs/LLM_INTEGRATION.md`:
- OpenAI API setup instructions
- Cost estimates and budgeting
- Caching strategy explanation
- Template fallback behavior
- Monitoring and optimization tips
- Free tier vs paid usage guidance

### Expected Outputs
- OpenAI API integrated and working
- LLM-based narrative variation active
- Redis caching implemented
- Cost monitoring dashboard
- Template fallback verified
- Integration documentation
- Test suite for LLM features

### Success Criteria
- [ ] API key configured correctly
- [ ] LLM variation generates natural phrasing
- [ ] Cache reduces duplicate API calls by >70%
- [ ] Cost per class <$0.005
- [ ] Fallback works when API disabled
- [ ] No API errors in normal usage
- [ ] Monitoring tracks costs accurately
- [ ] Documentation complete

### Cost Considerations
**Free Tier:**
- $5 in credits (3 months validity)
- ~1,250-2,500 class generations
- Perfect for development and testing

**Paid Usage Estimates:**
- GPT-3.5-turbo: $0.002-0.004 per class
- 100 classes/month: ~$0.20-$0.40
- 1,000 classes/month: ~$2-$4
- Caching reduces by 70%: ~$0.60-$1.20/month for 1,000 classes

**Optimization Tips:**
- Use caching aggressively (24-hour TTL)
- Batch similar requests together
- Cache by movement ID + variation type
- Monitor usage with dashboard
- Set budget alerts in OpenAI console

---

## **SESSION 12: Testing Suite**

### Role
You are a QA engineer specializing in React and FastAPI testing.

### Context
Day 12. Features complete including LLM integration. Now comprehensive testing.

### Your Task
Create complete test suite for frontend and backend.

### What You Should Do
- Unit tests (Jest/Pytest)
- Integration tests
- E2E tests (Playwright)
- MCP mock server
- Performance tests

### Expected Coverage
- Backend: >80%
- Frontend: >70%
- Critical paths: 100%

---

## **SESSION 13: Compliance Dashboard**

### Role
You are a compliance specialist with EU AI Act expertise.

### Context
Day 13. App functional with LLM integration. Add compliance features.

### Your Task
Build compliance dashboard for EU AI Act requirements.

### What You Should Do
- Decision transparency view
- Bias monitoring dashboard
- Model performance metrics
- Audit trail interface
- **NEW: Research source tracking**
- Export compliance reports

---

## **SESSION 14: Excel Sync Tools**

### Role
You are a data integration specialist.

### Context
Day 14. Database populated. Add Excel synchronization.

### Your Task
Build bi-directional Excel sync capabilities.

### What You Should Do

**Import from Excel:**
- Upload .xlsm file
- Parse and validate
- Compare with database
- Merge changes
- Conflict resolution

**Export to Excel:**
- Generate formatted .xlsx
- Include formulas
- Preserve structure
- Add metadata

### Expected Outputs
- Import/export utilities
- Version comparison
- Conflict resolution UI
- Backup/restore features

---

## **SESSION 15: Mobile Responsiveness**

### Role
You are a mobile-first UI developer.

### Context
Day 15. Desktop complete. Optimize for mobile.

### Your Task
Ensure complete mobile responsiveness.

### What You Should Do
- Touch-optimized drag-and-drop
- Mobile navigation
- Responsive charts
- Mobile-specific layouts
- PWA features

---

## **SESSION 16: Performance Optimization**

### Role
You are a performance engineer.

### Context
Day 16. Features complete. Optimize performance.

### Your Task
Optimize frontend and backend performance.

### What You Should Do
- Code splitting
- Lazy loading
- Database query optimization
- Caching strategies
- CDN setup
- Bundle size reduction

---

## **SESSION 17-18: Documentation & Polish**

### Role
You are a technical writer and UX specialist.

### Context
Days 17-18. App complete. Documentation and polish.

### Your Task
Complete documentation and final polish.

### What You Should Do
- User documentation
- API documentation
- Deployment guides
- Video tutorials
- Bug fixes
- UI polish

---

## **SESSION 19: Deployment**

### Role
You are a DevOps engineer.

### Context
Day 19. Ready for production deployment.

### Your Task
Deploy to production environments.

### What You Should Do
- Frontend: Vercel deployment
- Backend: Railway/Render
- Database: Supabase production
- MCP: Server configuration
- Monitoring: Sentry setup
- Analytics: Posthog/Mixpanel

---

## 📚 REFERENCE DOCUMENTS

Create these documents in the docs/ folder:

### Core Architecture
- **ARCHITECTURE_OVERVIEW.md** - System diagram and explanation
- **TECH_STACK.md** - All technologies and rationale
- **API_REFERENCE.md** - Complete API documentation
- **DATABASE_SCHEMA.md** - Schema with ER diagram
- **MCP_INTEGRATION.md** - MCP setup and usage

### Compliance & Security
- **EU_AI_ACT_COMPLIANCE.md** - How we meet requirements
- **PII_TOKENIZATION.md** - PII handling architecture
- **SECURITY_PRACTICES.md** - Security measures implemented

### Agent Documentation
- **AGENT_ARCHITECTURE.md** - How agents work
- **SEQUENCING_RULES.md** - Complete rules for safe sequences
- **STRICTNESS_LEVELS.md** - Explain strict/guided/autonomous
- **RESEARCH_AGENT.md** - MCP research capabilities

### Development
- **SETUP.md** - How to run locally
- **TESTING.md** - How to run tests
- **DEPLOYMENT.md** - How to deploy
- **CONTRIBUTING.md** - Code standards and workflow
- **EXCEL_SYNC.md** - Excel integration guide

---

## ✅ SUCCESS METRICS

### Technical Metrics
- Frontend load time: <3 seconds
- API response time: <200ms
- Agent decision time: <3 seconds
- MCP research time: <5 seconds
- Cache hit rate: >70%
- Test coverage: >80%
- Lighthouse score: >90

### Data Quality Metrics
- Excel data integrity: 100%
- Research source quality: >0.7 average
- Cue enrichment rate: >50% of movements
- Modification coverage: >80% of movements

### Compliance Metrics
- 100% of agent decisions logged
- 100% of safety rule validations passed
- 100% research attribution tracked
- 0 PII leaks (tokenization working)
- Bias monitoring operational
- Model drift detection active

### User Experience Metrics
- Generated sequences feel natural
- Cues are comprehensive and helpful
- Research enhances teaching quality
- Music selections are appropriate
- Interface matches MVP exactly
- No crashes in normal use

---

## 🚨 COMMON PITFALLS TO AVOID

1. **Don't improve the MVP design** - Replicate it exactly
2. **Don't skip safety validations** - They prevent injury
3. **Don't store PII without tokenization** - Legal requirement
4. **Don't skip agent decision logging** - Compliance requirement
5. **Don't ignore mobile responsiveness** - Must work on phones
6. **Don't deploy without tests** - 80% coverage minimum
7. **Don't hard-code values** - Use environment variables
8. **Don't skip documentation** - Future you will thank current you
9. **Don't bypass MCP caching** - Performance will suffer
10. **Don't ignore Excel sync conflicts** - Data integrity matters

---

## 🎓 KEY RESOURCES

### Core Technologies
- FastAPI: https://fastapi.tiangolo.com
- Supabase: https://supabase.com/docs
- React: https://react.dev
- @dnd-kit: https://dndkit.com
- Chart.js: https://www.chartjs.org
- Ollama: https://ollama.ai/docs

### MCP & Integration
- MCP Playwright: https://github.com/microsoft/mcp-servers/tree/main/playwright
- Model Context Protocol: https://modelcontextprotocol.io/
- Playwright: https://playwright.dev/
- OpenPyXL: https://openpyxl.readthedocs.io/

### Compliance
- EU AI Act: https://artificialintelligenceact.eu
- GDPR Guidelines: https://gdpr-info.eu

### Pilates Resources
- Pilates Method Alliance: https://pilatesmethodalliance.org/
- Classical Pilates: https://classicalpilates.net/
- BASI Pilates: https://basipilates.com/

---

## 📞 GETTING HELP

If you encounter issues during any session:
1. Check the docs/ folder for reference
2. Review previous session outputs
3. Verify environment variables are set
4. Check Supabase logs for database errors
5. Test API endpoints individually
6. Check MCP server logs
7. Verify Excel data integrity
8. Simplify and isolate the problem
9. Ask Claude Code for specific help with error messages

---

## 🎯 FINAL NOTES

**Remember:**
- This is a 19-23 session journey
- Each session builds on the previous
- Working code after every session
- Document as you go
- Test frequently
- Safety first, always
- Excel data is the source of truth
- MCP enhances but doesn't replace core knowledge
- LLM integration (Session 11) is optional but recommended for natural variation

**The goal:**
Create a production-ready Pilates class planner that:
- Matches the MVP design exactly
- Leverages your comprehensive Excel knowledge base
- Uses MCP for intelligent web enhancement
- Adds AI-powered intelligence
- Ensures user safety
- Complies with EU AI Act
- Protects user privacy
- Delights instructors with rich, researched content

Good luck! Follow each session sequentially, and you'll have a complete, professional application at the end.

---

*This comprehensive document merges all content from both versions, providing complete daily session instructions for Claude Code. Each session is designed to be completable in 2-3 hours with clear inputs, processes, outputs, and success criteria. The integration of MCP Playwright and Excel database migration adds significant value to the original MVP.*
