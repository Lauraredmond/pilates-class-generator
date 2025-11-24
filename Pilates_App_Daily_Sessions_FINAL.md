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

## 🏗️ COMPLETE PILATES CLASS STRUCTURE (6 PHASES)

### User-Specified Class Architecture

**CRITICAL:** A complete Pilates class follows this 6-phase structure. Current implementation only covers Phase 3 (Main Phase). Future sessions must implement all phases.

---

### **Phase 1: Setup Section**
**Purpose:** Establish Pilates core principles before movement begins

**Components:**
1. **Posture Check** - Alignment assessment and corrections
2. **Breathing** - Establish proper Pilates breathing pattern (lateral thoracic breathing)
3. **Core Activation** - Engage deep core muscles (transverse abdominis, pelvic floor)
4. **Balance Check** - Assess stability and body awareness

**Implementation Approach:**
- **MVP (Phase 1):** Hardcoded narratives provided by user
  - User will provide specific scripts for each component
  - Static text displayed before class begins
  - Essential for teaching proper form

- **Future Versions:** AI variation using LLMs, agents, RAG
  - Generate varied phrasing while maintaining core principles
  - Adapt setup instructions based on user level
  - Personalize based on previous sessions

**Notes:**
- This section is instructional, not movement-based
- Critical for injury prevention and proper technique
- Should be calm, focused, and educational

---

### **Phase 2: Warm-Up Section**
**Purpose:** Prepare body for main Pilates movements

**Components:**
- General warm-up movements (not necessarily Pilates movements, but can be)
- Examples from screenshot: gentle mobilization, breathing exercises, pelvic tilts
- Pilates movements from the 34 classical movements may be used if appropriate for warm-up
- Progressive activation of major muscle groups
- Increase heart rate gradually

**Implementation Approach:**
- **MVP (Phase 1):** Finite list of warm-up movements
  - User will provide curated warm-up movement library
  - Can include both Pilates and general warm-up exercises
  - Hardcoded selection initially

- **Future Versions:** AI agentic variation
  - Intelligent selection based on main phase focus
  - Adapt to user's warm-up preferences
  - Vary warm-ups to prevent boredom
  - Use RAG to source new warm-up variations

**Notes:**
- More general than classical Pilates movements
- Focus on mobility and activation, not strength
- Duration: 5-10 minutes typically

---

### **Phase 3: Main Phase** ✅ **CURRENTLY IMPLEMENTED**
**Purpose:** Core Pilates movement sequence

**Components:**
- Pilates movements from the 34 classical movements
- Transitions between movements (with narrative instructions)
- Proper sequencing following safety rules
- Muscle balance tracking
- Difficulty-appropriate selection

**Implementation Status:**
- ✅ Sequence agent generates movements
- ✅ Transitions with narratives
- ✅ Safety rule validation
- ✅ Muscle balance calculation
- ✅ Intelligent variety tracking (Phase 2)
- ✅ Consecutive muscle overlap prevention

**Notes:**
- This is the current focus of the application
- Working well according to user testing
- Continue to refine and improve

---

### **Phase 4: Cool-Down Section**
**Purpose:** Gradually reduce intensity and stretch muscles used during main phase

**Components:**
- Common cool-down stretches (not necessarily Pilates movements)
- Examples:
  - **Child's Pose** - Resting position, stretches back
  - **Hamstring Stretch** - Targets legs
  - **Back Stretch** - Spinal decompression
  - **Hip Flexor Stretch** - Counter hip flexor work
  - Any stretch relevant to muscles used in main phase

**Implementation Approach:**
- **MVP (Phase 1):** Finite list of cool-down stretches
  - User will provide curated cool-down library
  - Hardcoded selection based on main phase muscle usage

- **Future Versions:** Intelligent cool-down selection
  - Analyze muscle groups used in main phase
  - Select stretches targeting those specific areas
  - Vary cool-down to prevent boredom
  - Use MCP/RAG to source new stretches

**Notes:**
- Focus on flexibility and recovery
- Should be calming and restorative
- Duration: 5-10 minutes typically

---

### **Phase 5: Relaxation Section**
**Purpose:** Meditative phase for mental calm and body integration

**Components:**
- **Body Stillness** - Lie still in resting position (typically supine)
- **Short Narrative** - Brief guided relaxation script (user will provide)
- **Silence and Music** - Majority of this phase is quiet reflection
- **Music Integration** - Background music to support relaxation
- **Breathing Focus** - Return to natural breathing, body awareness

**Implementation Approach:**
- **MVP (Phase 1):** Hardcoded relaxation narrative
  - User provides short relaxation script
  - Static music from SoundCloud playlists
  - Timer-based silence periods

- **Future Versions:** Varied relaxation scripts
  - LLM-generated guided relaxations
  - Adapt to class intensity (harder class = longer relaxation)
  - Personalize based on user preferences

**Notes:**
- This is NOT active movement
- Focus is on mental integration and rest
- Music should be calming, ambient
- Duration: 2-5 minutes typically

---

### **Phase 6: Homecare Advice Section**
**Purpose:** Provide self-care guidance for post-class wellness

**Components:**
- Self-care recommendations
- Post-class hydration reminders
- Stretching guidance for later in the day
- Injury prevention tips
- Recovery best practices

**Implementation Approach:**
- **MVP (Phase 1):** Hardcoded homecare advice
  - User will add finite list to Supabase table
  - Sourced from reputable medical sources (e.g., American School of Medicine)
  - Heavily disclaimed and neutral tone

- **Future Versions:** AI-sourced homecare advice
  - Use MCP to research latest medical guidance
  - Must source ONLY from trusted medical institutions
  - Every piece of advice must be properly attributed
  - Multiple layers of disclaimers

**CRITICAL LIABILITY NOTES:**
- **Must be neutral and tapered advice** - No extreme recommendations
- **Full medical disclaimers required** - User assumes all risk
- **Source attribution mandatory** - Always cite medical source
- **Conservative approach only** - When in doubt, don't include
- **No diagnosis or treatment** - General wellness only
- **Legal review recommended** - Consult attorney before implementation

**Sources to Consider:**
- American College of Sports Medicine
- National Institutes of Health (NIH)
- Mayo Clinic
- American Physical Therapy Association
- Peer-reviewed medical journals

---

## 🔄 SEQUENCING RULES

### Safety-Critical Rules (Never Violate)
1. **Warm-up first** - Always start with breathing and gentle movements (Phase 2)
2. **Spinal progression** - Flexion before extension (Phase 3)
3. **Balance muscle groups** - Don't overwork one area (Phase 3)
4. **Complexity progression** - Simple to complex within session (Phase 3)
5. **Cool-down required** - End with stretching and breathing (Phase 4)
6. **Relaxation essential** - Mental integration and body awareness (Phase 5)

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
- Music integration, see detail below
- Music recommendation agent
- Playlist creation
- BPM matching
- **NEW: Web-sourced music discovery via MCP**

Music integration ChatGPT instructions (they should override any legacy music integration plans with SoundCloud)
am building a Pilates fitness platform called Bassline. I need a streamed music integration that:
Does not depend on Spotify or SoundCloud.
Has no per-user OAuth step and no “25 user dev cap” style limits.
Uses royalty-free / public-domain classical or Pilates-style music, suitable for calm and flowing Pilates sessions.
Does not require me to self-host audio files (storage is too expensive); audio must be streamed from a third-party CDN.
Has no ads during playback (YouTube is not acceptable due to ads and big-co constraints).
Can scale to a high number of users without hitting arbitrary vendor caps, as long as I respect reasonable API and bandwidth limits.
Must not introduce security risks: no exposed secrets, no open proxy endpoints, strong auth around all APIs, and safe handling of any external URLs or user input.
I want you to design the integration architecture, backend+frontend flow, and data model, but do not write any actual code yet. Just specify the design in clear technical detail so that we can implement it step by step later.
1. Music source strategy
Design a vendor-agnostic “Music Source Layer” for Bassline with these rules:
Primary sources must be:
Musopen (royalty-free/public-domain classical recordings, streaming and downloads allowed for free, no copyright restrictions).
FreePD (CC0 public-domain music library).
Only use these two as the first implementation targets.
You may optionally include a placeholder design for:
Jamendo API (recognizing that commercial use requires a paid license, but they explicitly support API-based music integration for apps).
Epidemic Sound Partner API (royalty-free catalog with partner integration; I might apply later).
However, for now, focus concretely on Musopen + FreePD as the first working integration.
Legal/technical constraints:
Do not assume I own the recordings.
Only stream audio via remote URLs provided by Musopen/FreePD (or their CDN).
Do not design anything that downloads and redistributes the files from my own servers. My app will be a client that streams from their URLs.
Document clearly how the Music Source Layer is structured so that we can swap in Jamendo or Epidemic later without changing the rest of the app.
For example, I should end up with an abstract interface like:
MusicSource (get playlists, get tracks, get streaming URL, optional tempo/mood/period metadata)
Implementations: MusopenSource, FreePDSource, later JamendoSource, EpidemicSource.
Also, describe any security considerations specific to this layer: e.g. never exposing provider API keys to the client, validating and whitelisting any external domains used for audio streaming, and avoiding any generic “open proxy” pattern.
2. User experience requirements
Design the UX flow like this:
Users do not connect external accounts (no “Login with Spotify/SoundCloud”).
Instead, Bassline offers musical stylistic periods that are appropriate for Pilates. The user chooses one of these as the “musical style” for the class.
Use the following musical stylistic periods (and feel free to reference their traits in the design, but keep the labels exactly as written):
Baroque Period (c. 1600–1750)
Sound: Ornamentation, contrast, dramatic expression
Composers: Bach, Handel, Vivaldi
Traits: Harpsichord, counterpoint, terraced dynamics
Classical Period (c. 1750–1820)
Sound: Clean structure, symmetry, clarity
Composers: Mozart, Haydn, early Beethoven
Traits: Birth of the modern symphony, string quartet, sonata form
Romantic Period (c. 1820–1910)
Sound: Emotional intensity, bigger orchestras, richer harmony
Composers: Chopin, Tchaikovsky, late Beethoven, Brahms
Traits: Virtuoso performers, nationalism, program music
Impressionist Period (c. 1890–1920)
Sound: Colour, atmosphere, blurred edges
Composers: Debussy, Ravel
Traits: New scales (whole-tone, modal), delicate textures, emphasis on timbre
Modern Period / 20th Century (c. 1900–1975)
Sound: Everything from atonality to minimalism to jazz influence
Composers: Stravinsky, Schoenberg, Bartók, Copland
Traits: Break from tradition; experimentation
Contemporary / Postmodern (1975–present)
Use this as a flexible bucket for more recent classical-style, minimalist, ambient or neo-classical works suitable for Pilates (e.g. piano minimalism, gentle ambient textures).
Celtic Traditional 
The user flow should be:
The user picks:
A class type (e.g. 30-min Pilates core, 45-min slow flow), and
A musical stylistic period from the list above.
The system then:
Selects a playlist or sequence of tracks from the internal Bassline library (built from Musopen/FreePD) that match the chosen stylistic period and class type.
Streams that in the background while the narrated Pilates class runs.
Design the UX and API contracts needed between frontend and backend to support:
Loading available musical stylistic periods.
Listing or previewing playlists associated with each period (optionally allowing a brief audio preview).
Starting a class session with a specific stylistic period.
Keeping the music and the narrative in sync (timing model).
Throughout, consider security and privacy: avoid exposing any internal IDs that shouldn’t be public, and ensure no sensitive information is leaked in responses.
3. Data model (Supabase/Postgres)
Design a relational schema (tables and key fields; no SQL yet) for storing our internal Bassline music library based on Musopen/FreePD:
Core tables should include at least:
music_tracks
id (UUID)
source (enum: MUSOPEN, FREEPD, etc.)
provider_track_id or URL slug
title
composer
artist_performer
duration_seconds
bpm (nullable, but we will try to compute/populate it)
stylistic_period (enum matching the periods above)
mood_tags (array, e.g. ["gentle", "piano", "low_intensity"])
audio_url (direct streaming URL from Musopen/FreePD)
waveform_url or peak_data (optional, for advanced sync)
licence_info (text/json; store licence type e.g. CC0, PD, etc.)
created_at, updated_at
music_playlists
id (UUID)
name (e.g. “Romantic Slow Flow – 30 min”)
description
intended_intensity (enum: LOW, MEDIUM, HIGH)
intended_use (enum: PILATES_SLOW_FLOW, PILATES_CORE, STRETCHING, etc.)
duration_minutes_target
stylistic_period (enum matching the list above)
is_active, created_at, updated_at
music_playlist_tracks
playlist_id
track_id
sequence_order
start_offset_seconds (if we want to start mid-track)
end_offset_seconds (if we want to cut before end)
(Optional) music_themes or music_period_profiles
id
stylistic_period (enum)
description
default_intensity
default_class_types (array)
Explain how this schema supports:
Curating playlists from Musopen/FreePD.
Mapping playlists to workout phases (warm-up, main flow, cooldown) while respecting stylistic periods.
Allowing easy replacement or addition of new sources.
Also, describe how to apply database-level security (e.g. Supabase Row-Level Security) so that:
Only server-side code can modify music_tracks and music_playlists.
Clients can only read the minimum data they need for playback (no secrets, no unnecessary internal metadata).
4. Playback + sync design
Design the playback / sync model like this:
Audio is streamed via <audio> or a JS audio player from the audio_url stored in music_tracks.
The Pilates class narrative is either:
A pre-rendered audio track (voice-over), or
A sequence of text prompts read by TTS.
Design how to:
Start a class:
Frontend calls backend to create a class_session with selected music_playlist_id and class definition.
Backend returns an ordered list of tracks with timing metadata.
Keep music and narrative roughly aligned:
You don’t need sample-accurate sync; just design for phase-level sync (e.g. warm-up ≈ first 5 minutes of playlist, more flowing pieces in middle, slower tracks at end).
Explain how we could map workout phases to clusters of tracks or sections of tracks while honoring the chosen stylistic period.
Handle failure scenarios:
If a track fails to load, how does the player skip to the next track gracefully?
If a provider goes down temporarily, how does the system fail softly (e.g., “Music unavailable, class still runs”)?
Include any relevant security considerations here too, for example:
Not allowing arbitrary user-supplied URLs as audio sources.
Ensuring CORS and Content Security Policy are configured so the app only plays audio from trusted domains.
5. API design (between frontend and backend) – with security constraints
Define the REST (or GraphQL) API endpoints you recommend, including:
GET /api/music/stylistic-periods – list available musical stylistic periods.
GET /api/music/playlists?stylistic_period=...&intensity=... – list curated playlists for a period.
POST /api/classes/start – start a class session with a chosen playlist/stylistic period, returning playlist details + track list.
GET /api/classes/:id/music – fetch the music plan for a running class session.
For each endpoint include:
Request parameters.
Response fields (include track IDs, titles, durations, audio URLs, stylistic period, etc.).
Expected status codes and error conditions.
Security requirements for all endpoints:
All state-changing endpoints (e.g. starting a class) must require authenticated users (e.g. via Supabase auth or another token-based system).
Do not expose provider API keys or any secrets in responses.
Do not create any “open proxy” endpoint that fetches arbitrary external URLs based on user input. Any external fetch should be restricted to known, whitelisted domains (e.g. Musopen, FreePD).
Validate and sanitize all request parameters; avoid anything that could lead to injection or path traversal.
Consider rate limiting on relevant endpoints to protect both my infrastructure and upstream providers.
6. Guardrails for you (Claude Code) – no spoofing, no unsafe shortcuts
This is critical:
Do not invent fake music tracks, composers, or URLs.
Any track you show in UI or use in a playlist must:
Come from our Supabase music_tracks table, or
Be fetched from Musopen/FreePD in a backend ingestion/curation step and then stored.
That is: Claude should not fabricate track data; every track row must correspond to a real track with a real audio URL from Musopen/FreePD.
When implementing later:
Do not hard-code “mock data” into the frontend as if it were real.
If data doesn’t exist yet, you must:
Either show an empty state, or
Use a clearly marked “development fixtures” mode that is only used in local dev and never presented as production behavior.
Explicitly state in your design how you will enforce this rule in the code structure (e.g., by having a single data-access layer that reads from Supabase / real APIs only, and by separating any sample/fixture data into a clearly labeled development-only module).
Also, never bypass security for convenience:
Don’t disable auth or RLS “just to make it work”.
Don’t put credentials, tokens, or secrets in the frontend.
Don’t create generic “fetch any URL” endpoints.
7. Future-proofing and vendor fallback
Finally, explain:
How this architecture allows me to later plug in Jamendo or Epidemic Sound as additional sources without changing the Pilates workout engine or the stylistic-period UX.
How we could gradually:
Keep Musopen/FreePD as a free classical “base catalog”, and
Add a richer licensed catalog via Jamendo/Epidemic if/when I have budget and a partnership.
Make sure the design makes it straightforward to:
Add new MusicSource implementations.
Map new catalogs into the same music_tracks / music_playlists schema.
Preserve all existing security guarantees and guardrails when new sources are added.
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

## **SESSION 11 (labeled 13): Music Integration (ESSENTIAL FEATURE)** - ⚠️ IN PROGRESS

### Status: PARTIALLY COMPLETE - Troubleshooting Required

**Session Date:** 2025-11-21
**Git Commits:** e7449f5, ff55d54, e2c7e90, 32631ab, 68348b2
**Current State:** Integration code complete, but playback not working

### Role
You are an audio integration specialist and compliance expert.

### Context
Day 11. Core app functional. Music integration is ESSENTIAL to the offering - not optional. SoundCloud Widget API integration implemented but experiencing playback issues.

### What Was Completed ✅

1. **SoundCloud Widget API Integration**
   - Added Widget API script to `frontend/index.html`
   - Created `frontend/src/utils/musicPlaylists.ts` with 9 playlist configurations
   - Integrated hidden iframe into ClassPlayback component
   - Added TypeScript type definitions for Widget API
   - Implemented pause/resume sync with class timer
   - Added visual status indicator ("Music Loading" → "Music Playing")

2. **Documentation**
   - Created MUSIC_INTEGRATION_SETUP.md with setup instructions
   - Created MUSIC_DEBUG_STEPS.md for troubleshooting

3. **Files Modified**
   - ✅ `frontend/src/utils/musicPlaylists.ts` (NEW)
   - ✅ `frontend/src/components/class-playback/ClassPlayback.tsx` (MODIFIED)
   - ✅ `frontend/index.html` (MODIFIED)
   - ✅ `frontend/src/pages/ClassBuilder.tsx` (MODIFIED - added version indicator for testing)

### Current Issue ❌

**Problem:** Music integration shows "Music Playing" but no audio playback occurs

**Symptoms:**
- Widget loads: "SoundCloud widget ready" ✅
- Play triggered: "Music play triggered" ✅
- Console errors: InvalidStateError from SoundCloud widget canvas drawing ❌
- No actual audio playback ❌

**Debugging Completed:**
- ✅ Tested with user's playlist (8 tracks, public, Enya/classical music)
- ✅ Tested with known-working public playlists (Lofi Girl)
- ✅ Tested with SoundCloud API track format (track ID 293)
- ❌ All tests result in same InvalidStateError

**Root Cause Hypothesis:**
- Tracks may have embedding disabled by copyright holders (Enya, André Rieu, etc.)
- Browser autoplay restrictions (attempted fix with user interaction trigger)
- SoundCloud Widget API canvas rendering issues
- URL format incompatibility

**User Decision:** Pause work on music integration, resume next session with ChatGPT consultation

### 🔄 NEXT SESSION PICKUP (Session 11 Continuation)

**Priority:** Debug and resolve SoundCloud music playback issue

**Context for Next Session:**
- Integration code is complete and deployed (commit 68348b2)
- Widget loads successfully but InvalidStateError prevents playback
- User has created 1 test playlist (Ambient Pilates - 8 tracks)
- Console.txt logs show consistent error pattern across all test attempts

**Troubleshooting Options for Next Session:**

1. **Option A: Fix SoundCloud Widget API**
   - Consult ChatGPT for InvalidStateError solution
   - Try alternative Widget API initialization patterns
   - Test with royalty-free music tracks (no embedding restrictions)
   - Investigate canvas rendering polyfill

2. **Option B: Pivot to YouTube Music API**
   - More reliable embedding permissions
   - YouTube IFrame Player API well-documented
   - User creates YouTube playlists instead

3. **Option C: Use HTML5 Audio with Hosted Files**
   - Upload MP3s to Netlify/S3
   - Full control over playback
   - No API dependencies or restrictions
   - Most reliable option

4. **Option D: Simplify to Text Recommendations**
   - Display "Suggested Music: Ambient Piano" text
   - Users play their own music separately
   - No technical complexity

**Recommended Approach:**
- Start with Option A (fix SoundCloud) with ChatGPT help
- If not resolved in 30 minutes, pivot to Option B (YouTube)
- Option C is most reliable if time allows
- Option D is fallback if all else fails

**Files to Review:**
- `Console.txt` - Current error logs
- `frontend/src/components/class-playback/ClassPlayback.tsx` - Widget integration code
- `frontend/src/utils/musicPlaylists.ts` - Playlist configuration
- `MUSIC_DEBUG_STEPS.md` - Troubleshooting guide

**Success Criteria:**
- [ ] Music plays audibly when class starts
- [ ] Music pauses/resumes with class timer
- [ ] No console errors
- [ ] User can hear background music during movements

---

### Priority 1: SoundCloud Music Integration - ORIGINAL PLAN (FOR REFERENCE)

**User Requirement:** "Music integration is essential to my offering, not optional."

#### Your Task (Original)
Integrate SoundCloud music playback into class experience with pre-curated playlists.

#### What You Should Do (Original Plan)

**Step 1: Pre-curated Playlist Setup**
- Create SoundCloud account with 9 curated playlists:
  - **Movement Music:** Ambient Pilates, Meditation Instrumentals, Chillout Beats, Lo-Fi Focus, Acoustic Calm, Piano Minimal
  - **Cool-Down Music:** Baroque Classical, Classical Piano, Romantic Era
- Each playlist: 60+ minutes of appropriate music
- Get shareable URLs for each playlist

**Step 2: SoundCloud Widget API Integration**
```typescript
// frontend/src/utils/musicPlaylists.ts (NEW FILE)
export const MUSIC_PLAYLISTS = {
  'Ambient': 'https://soundcloud.com/your-account/ambient-pilates',
  'Meditation': 'https://soundcloud.com/your-account/meditation-instrumentals',
  'Chillout': 'https://soundcloud.com/your-account/chillout-beats',
  // ... 6 more playlists
};
```

**Step 3: Update ClassPlayback Component**
```typescript
// frontend/src/components/class-playback/ClassPlayback.tsx
// Add hidden SoundCloud iframe
<iframe
  id="sc-widget"
  src={`https://w.soundcloud.com/player/?url=${playlistUrl}`}
  width="0"
  height="0"
  style={{ display: 'none' }}
/>

// Control playback with Widget API
const widget = SC.Widget('sc-widget');
useEffect(() => {
  widget.load(selectedPlaylistUrl);
  widget.play();
  widget.setVolume(50); // 50% volume
}, []);

// Sync music with class pause/resume
useEffect(() => {
  if (isPaused) {
    widget.pause();
  } else {
    widget.play();
  }
}, [isPaused]);
```

**Step 4: Add SoundCloud Script**
```html
<!-- frontend/public/index.html -->
<script src="https://w.soundcloud.com/player/api.js"></script>
```

**Step 5: Testing Checklist**
- [ ] Music starts when "Play Class" clicked
- [ ] Music pauses/resumes with class timer
- [ ] Music switches from movement playlist to cool-down playlist
- [ ] Music volume appropriate (not too loud)
- [ ] Music continues seamlessly across transitions
- [ ] No audio conflicts with future narration

#### Expected Outputs
- `frontend/src/utils/musicPlaylists.ts` (NEW) - Playlist mappings
- `frontend/src/components/class-playback/ClassPlayback.tsx` (MODIFIED) - Widget integration
- `frontend/public/index.html` (MODIFIED) - SoundCloud API script
- Comprehensive testing of music playback during full class

#### Success Criteria
- [ ] Music plays throughout entire class
- [ ] Pause/resume works correctly
- [ ] Playlist switching works (movement → cool-down)
- [ ] No performance impact
- [ ] Music enhances class experience
- [ ] User can control volume (bonus feature)

---

### Priority 2: Compliance Dashboard (After Music Complete)

**User Requirement:** EU AI Act compliance for AI decision transparency.

#### Your Task
Build compliance dashboard for EU AI Act requirements.

#### What You Should Do
- Decision transparency view
- Bias monitoring dashboard
- Model performance metrics
- Audit trail interface
- **NEW: Research source tracking**
- Export compliance reports

#### Expected Outputs
- Compliance dashboard page
- Agent decision log viewer
- Bias monitoring charts
- Export functionality

---

### Time Allocation
- **Music Integration:** 2-3 hours (PRIORITY)
- **Compliance Dashboard:** 1-2 hours (if time permits)

### Notes
- Music is ESSENTIAL - complete before moving to compliance features
- Pre-curated playlists approach is fastest and most reliable
- Widget API is simpler than full SoundCloud SDK integration
- Volume ducking for narration comes in Session 14-15 (audio prototype)

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

## **SESSION 16: Performance Optimization & OpenAI/MCP Enhancements**

### Role
You are a performance engineer and integration specialist.

### Context
Day 16. Features complete. Optimize performance and address Session 11.5 backlog items.

### Your Task
Optimize frontend and backend performance, add MCP Playwright integration, and implement OpenAI Redis caching.

### What You Should Do

**Performance Optimization:**
- Code splitting
- Lazy loading
- Database query optimization
- Caching strategies (Redis setup)
- CDN setup
- Bundle size reduction

**Session 11.5 Backlog - OpenAI Redis Caching (MEDIUM PRIORITY):**
- Set up Redis server (local or cloud)
- Implement LLM caching layer for narrative variations
- 24-hour TTL for cached results
- Cost monitoring dashboard for OpenAI API usage
- Expected: 70% cost reduction through caching

**Session 11.5 Backlog - MCP Playwright Integration (MEDIUM PRIORITY):**
- Set up MCP Playwright server
- Replace placeholder data in `mcp_client.py` (line 108 TODO)
- Implement actual web scraping from trusted Pilates sources
- Test research agent with real MCP calls
- Quality scoring and source attribution

### Expected Outputs
- Performance optimizations complete
- Redis caching working for OpenAI
- Cost monitoring dashboard
- MCP Playwright functional (replaces placeholders)
- Research agent tested and working

---

## **SESSION 17-18: Documentation, Polish & Analytics Export**

### Role
You are a technical writer and UX specialist.

### Context
Days 17-18. App complete. Documentation, polish, and finish Session 11.5 backlog items.

### Your Task
Complete documentation, final polish, and add export functionality to Analytics.

### What You Should Do

**Documentation:**
- User documentation
- API documentation
- Deployment guides
- Video tutorials

**Polish & Bug Fixes:**
- Bug fixes
- UI polish
- Performance tuning

**Session 11.5 Backlog - Analytics Export (MEDIUM PRIORITY):**
- Export analytics as CSV (class history, movement stats)
- Export charts as PNG images
- Print report functionality
- User can share progress with instructors/trainers

**Session 11.5 Backlog - Agent Testing (MEDIUM PRIORITY):**
- Test Music Agent with real class generations
- Test Meditation Agent with real cool-down scripts
- Verify agent outputs quality and consistency

### Expected Outputs
- Complete documentation
- Polished UI
- Analytics export functionality
- Music and Meditation agents tested

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

## **SESSION 20 (FUTURE): User Registration & Multi-User Support**

### Role
You are a full-stack developer specializing in authentication and GDPR compliance.

### Context
Day 20. App functional for single user. Now implement proper end-user registration, multi-user support, and compliance features.

### Your Task
Implement complete multi-user system with PII tokenization, email verification, password reset, and GDPR compliance.

### What You Should Do

**Session 11.5 Backlog - Authentication Flows (HIGH PRIORITY - Deferred):**

**Step 1: Email Verification Flow**
- Registration sends verification email
- Email contains secure token (24-hour expiry)
- User clicks link to verify account
- Account activated upon verification
- Resend verification email option

**Step 2: Password Reset Flow**
- "Forgot Password" on login page
- User enters email, receives reset link
- Secure token (1-hour expiry)
- Reset password form
- Confirmation email sent after reset

**Step 3: PII Tokenization (GDPR Compliance)**
```python
# backend/utils/pii_tokenizer.py (NEW FILE)
class PIITokenizer:
    """Tokenize personally identifiable information for GDPR compliance"""

    def __init__(self, encryption_key: str):
        self.key = encryption_key
        self.cipher = Fernet(self.key)

    def tokenize(self, pii_data: str) -> str:
        """Encrypt PII and return token"""
        encrypted = self.cipher.encrypt(pii_data.encode())
        token = base64.urlsafe_b64encode(encrypted).decode()
        return token

    def detokenize(self, token: str) -> str:
        """Decrypt token and return original PII"""
        encrypted = base64.urlsafe_b64decode(token.encode())
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode()
```

**Step 4: Database Schema Updates**
```sql
-- Create pii_tokens table
CREATE TABLE pii_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    field_name VARCHAR(50),  -- 'email', 'full_name', etc.
    encrypted_value TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update users table to store tokens instead of PII
ALTER TABLE users
    ADD COLUMN email_token VARCHAR(255),
    ADD COLUMN full_name_token VARCHAR(255);
```

**Step 5: GDPR Data Export**
```python
# backend/api/routers/gdpr.py (NEW FILE)
@router.get("/gdpr/export")
async def export_user_data(user_id: str):
    """Export all user data for GDPR compliance"""
    # Collect all user data from all tables
    user_data = {
        "profile": await get_user_profile(user_id),
        "classes": await get_user_classes(user_id),
        "analytics": await get_user_analytics(user_id),
        "agent_decisions": await get_agent_decisions(user_id)
    }

    # Return as downloadable JSON
    return JSONResponse(content=user_data)

@router.delete("/gdpr/delete")
async def delete_user_data(user_id: str):
    """Delete all user data (right to be forgotten)"""
    # Cascade delete from all tables
    await delete_all_user_data(user_id)
    return {"message": "User data deleted successfully"}
```

**Step 6: Multi-User Differentiation**
- User roles: Admin, Instructor, Student
- Permission system for features
- User-specific class history
- Shared vs. private classes
- User settings and preferences

### Expected Outputs
- Email verification system working
- Password reset flow functional
- PII tokenization implemented
- `pii_tokens` table created
- `utils/pii_tokenizer.py` created
- GDPR export/delete endpoints
- Multi-user support with roles
- Updated authentication UI

### Success Criteria
- [ ] Email verification emails sent and working
- [ ] Password reset flow tested end-to-end
- [ ] All PII tokenized (no plaintext PII in database)
- [ ] GDPR export returns complete user data
- [ ] GDPR delete removes all user traces
- [ ] Multiple users can use app simultaneously
- [ ] User roles and permissions enforced

### Notes
- **Deferred from Session 11.5** - User decision: Not needed until proper end-user registration
- This session should be prioritized when transitioning from single-user to multi-user app
- PII tokenization is CRITICAL for GDPR compliance (legal requirement)
- Email verification improves security and reduces spam accounts

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

## 🔄 SESSION PROGRESS UPDATE (As of 2025-11-18)

### Sessions Completed (Actual Progress)

**Session 1-9:** ✅ **COMPLETED**
- Project structure established
- Backend deployed to Render.com (Starter tier - $9/month)
- Frontend deployed to Netlify
- Supabase database configured
- AI agents implemented (sequence, music, meditation)
- Frontend playback UI with timer-based teleprompter
- Movement library and class generation working
- Transitions displaying correctly inline
- Medical disclaimer with pregnancy exclusion

**Session 10:** ✅ **COMPLETED** (2025-11-18)
- **Deployment & Infrastructure**
  - Backend: Render.com with Starter tier (no spin-down)
  - Frontend: Netlify with auto-deploy from GitHub
  - CORS configured for production communication
  - TypeScript build errors resolved
  - Security: Removed exposed Supabase credentials
  - Database: Created `ai_decision_log` table for EU AI Act compliance

- **Performance Improvements**
  - Backend response: ~3-4 seconds (down from ~5-6s)
  - No more failed database inserts
  - Always-on backend (eliminated 30s spin-down delays)

- **UI Updates**
  - Home page: Updated Bassline narrative
  - Medical disclaimer: Mobile-responsive

- **Key Learning**
  - Backend troubleshooting: Distinguish spin-down from crashes
  - Solution: Upgraded to paid tier to eliminate spin-down

### Sessions In Progress / Upcoming

**Session 11:** 🎵 **NEXT PRIORITY - SoundCloud Music Integration** (ESSENTIAL FEATURE)
- **User Requirement:** "Music integration is essential to my offering, not optional"
- **Approach:** Pre-curated SoundCloud playlists (Option 3)
- **Pre-work Required:** Create 9 curated playlists on SoundCloud
- **Implementation:** 1-2 hours using Widget API
- **Deliverables:**
  - SoundCloud Widget API integrated into ClassPlayback component
  - Music playlist mapping configuration
  - Background music during movements and cool-down
  - Volume ducking for narration (future)
  - Pause/resume sync with class timer

**Session 12-13:** Testing, Refinement & Backend Enhancements
- User testing of playback functionality
- Add teaching cues to sequence agent (optional)
- Regression testing against visual baseline
- Bug fixes and polish
- Performance optimization

**Session 14-15:** 🎙️ **Audio Narration Prototype** (TEST BEFORE AI TTS)
- **User Requirement:** "I'd like to try a static audio prototype first, say using a recording from me"
- **Pre-work Required:** Record narration for 2-3 test movements
- **Implementation:** 2-3 hours
- **Deliverables:**
  - Audio playback integrated into ClassPlayback
  - Volume ducking (lower music during narration)
  - Pause/resume sync
  - Test UX: Do users prefer audio vs text?
  - Validate technical implementation
- **Success Metric:** If prototype succeeds → proceed to OpenAI TTS in Session 16+

**Session 16+:** OpenAI TTS Integration (if prototype succeeds)
- Replace manual recordings with AI-generated narration
- Multiple voice options (nova, alloy, shimmer)
- Automatic generation when class is created
- Cost: ~$0.18 per class, $18/month for 100 classes
- Quality scoring and caching

### Modified Session Plan

**Original Plan:**
- Session 10: Music Integration (basic)
- Session 11: OpenAI GPT Integration
- Session 12: Testing Suite

**Actual Progress (Adjusted):**
- ✅ Session 10: Deployment & Infrastructure (completed)
- 🎵 Session 11: SoundCloud Integration (essential feature, next)
- Session 12-13: Testing & Backend Enhancements
- 🎙️ Session 14-15: Audio Narration Prototype (user voice)
- Session 16+: OpenAI TTS Integration (if prototype succeeds)
- Session 17+: Continue with original plan (Compliance, Mobile, Performance, Documentation, Deployment polish)

### Key Architecture Decisions Made

1. **Music is Essential:** SoundCloud integration moved from "nice-to-have" to core Session 11 priority
2. **Audio Narration Phased Approach:**
   - Phase 1: Test with user's voice recordings (validate UX)
   - Phase 2: Upgrade to OpenAI TTS if successful (automate)
3. **Render Hosting:** Upgraded to Starter tier ($9/month) to eliminate spin-down issues
4. **EU AI Act Compliance:** `ai_decision_log` table implemented early

### Current Status Summary

**Production URLs:**
- Frontend: https://basslinemvp.netlify.app
- Backend: https://pilates-class-generator-api3.onrender.com
- Database: Supabase (production instance)

**Working Features:**
- ✅ Class generation with AI agents
- ✅ Movement library (34 classical movements + database-driven)
- ✅ Timer-based playback with auto-advance
- ✅ Transitions displayed inline with distinct styling
- ✅ Muscle balance calculation
- ✅ Medical disclaimer with pregnancy exclusion
- ✅ Mobile-responsive UI

**In Development:**
- 🎵 SoundCloud music playback (Session 11)
- 🎙️ Audio narration (Sessions 14-15)

**Not Yet Started:**
- Teaching cues from backend (optional enhancement)
- MCP research integration (future)
- Excel sync tools (future)
- Compliance dashboard (future)
- Mobile PWA features (future)

### Reference Documents

For current session work, refer to:
- `/NEXT_SESSION_PICKUP.md` - Current session details and priorities
- `/VISUAL_REGRESSION_BASELINE.md` - Visual regression baseline (commit `a53672e`)
- `/CLAUDE.md` - Project architecture and coding guidelines

---

*This comprehensive document provides the original 19-session plan. Actual progress is tracked in NEXT_SESSION_PICKUP.md. The plan has evolved based on real-world priorities (music as essential, audio narration phased approach, deployment optimization). Both documents should be consulted together for complete context.*
