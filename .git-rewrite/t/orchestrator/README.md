# Bassline Pilates Orchestrator

**AI Agent Orchestration Service using Jentic StandardAgent + Arazzo**

Session 10: Jentic Integration - Phase 1

---

## Overview

This service integrates Jentic's open-source StandardAgent and Arazzo Engine to provide intelligent Pilates class orchestration.

### Architecture

```
Frontend → Orchestrator → Agent → Arazzo → Existing Backend → Supabase
            (This Service)
```

The orchestrator:
- Receives class generation requests from React frontend
- Uses BasslinePilatesCoachAgent (extends StandardAgent) for intelligent decision-making
- Orchestrates API calls via Arazzo workflows
- Returns complete class structures

---

## Setup

### 1. Install Dependencies

```bash
cd orchestrator
pip install -r requirements.txt
```

This will install:
- **Jentic StandardAgent** (from GitHub - not on PyPI yet)
- **Jentic Arazzo Engine** (from GitHub - not on PyPI yet)
- FastAPI, OpenAI, and other dependencies

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
OPENAI_API_KEY=sk-your-key-here
BASSLINE_API_URL=https://pilates-class-generator-api3.onrender.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-key-here
```

### 3. Run Locally

```bash
uvicorn main:app --reload --port 8001
```

The service will be available at `http://localhost:8001`

API Documentation: `http://localhost:8001/docs`

---

## API Endpoints

### POST /generate-class

Generate a complete Pilates class using the BasslinePilatesCoachAgent.

**Request:**
```json
{
  "user_id": "uuid-here",
  "target_duration_minutes": 30,
  "difficulty_level": "Intermediate",
  "focus_areas": ["Core", "Legs"],
  "include_mcp_research": false,
  "strictness_level": "guided"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sequence": [...],
    "musicPlaylist": {...},
    "meditationScript": "...",
    "totalDuration": 1800
  },
  "metadata": {
    "agent_type": "BasslinePilatesCoachAgent",
    "workflow_version": "1.0.0"
  }
}
```

### GET /health

Health check endpoint for monitoring.

---

## How It Works

### 1. Request Flow

```
User clicks "Generate Class" in frontend
    ↓
Frontend calls: POST /generate-class
    ↓
FastAPI receives request
    ↓
Passes to BasslinePilatesCoachAgent
```

### 2. Agent Reasoning (StandardAgent)

```
BasslinePilatesCoachAgent.solve(goal)
    ↓
PLAN Phase (ReWOO):
    "User wants a 30-min intermediate class
     → I should use the assemblePilatesClass workflow"
    ↓
EXECUTE Phase:
    Agent calls tool: "assemble_pilates_class"
    Tool triggers: Arazzo Engine
    Arazzo runs: assemble_pilates_class_v1.yaml workflow
    ↓
REFLECT Phase:
    "Workflow completed successfully
     → Class has 12 movements, Baroque music, body scan meditation
     → Results look good!"
```

### 3. Workflow Execution (Arazzo)

```
Arazzo Engine loads: assemble_pilates_class_v1.yaml
    ↓
Step 1: GET /api/users/me/profile
    (Call existing Bassline backend)
    Returns: User preferences, difficulty level
    ↓
Step 2: POST /api/agents/generate-sequence
    (Call existing Bassline backend)
    Returns: Safe movement sequence
    ↓
Step 3: POST /api/agents/select-music
    (Call existing Bassline backend)
    Returns: Appropriate music playlist
    ↓
Step 4: POST /api/agents/create-meditation
    (Call existing Bassline backend)
    Returns: Personalized meditation script
    ↓
Arazzo returns: Complete class structure
```

### 4. Return to Frontend

```
Agent returns result to FastAPI
    ↓
FastAPI returns JSON to frontend
    ↓
Frontend displays class in playback UI
```

---

## Jentic Integration Patterns

### Pattern 1: Inherit from StandardAgent

**Jentic Raw Code (from GitHub):**
```python
class StandardAgent:
    def solve(self, goal: str) -> ReasoningResult:
        result = self.reasoner.run(goal)
        return result
```

**Bassline Custom (this service):**
```python
class BasslinePilatesCoachAgent(StandardAgent):
    def __init__(self):
        llm = OpenAILLM(...)  # Configure LLM
        tools = BasslinePilatesTools(...)  # Custom tools
        super().__init__(llm, tools, ...)  # Pass to parent
```

### Pattern 2: Implement Tools Interface

**Jentic Raw Code (from GitHub):**
```python
class JustInTimeToolingBase(ABC):
    @abstractmethod
    def list_tools(self) -> List[ToolInfo]:
        pass

    @abstractmethod
    def execute(self, tool_id: str, params: Dict) -> Any:
        pass
```

**Bassline Custom (this service):**
```python
class BasslinePilatesTools(JustInTimeToolingBase):
    def list_tools(self):
        return [
            {"id": "get_user_profile", ...},
            {"id": "assemble_pilates_class", ...},
            {"id": "call_bassline_api", ...}
        ]

    def execute(self, tool_id, params):
        if tool_id == "assemble_pilates_class":
            return self.arazzo_runner.run(...)
```

### Pattern 3: Workflow as Tool

**Jentic Pattern:**
Agents can call Arazzo workflows as tools.

**Bassline Implementation:**
```python
# In tools.py
def execute(self, tool_id, params):
    if tool_id == "assemble_pilates_class":
        # Trigger Arazzo Engine
        result = self.arazzo_runner.run(
            workflow_id="assemblePilatesClass",
            inputs=params
        )
        return result.outputs
```

---

## File Structure

```
orchestrator/
├── main.py                        # FastAPI application
├── agent/
│   ├── __init__.py
│   ├── bassline_agent.py         # BasslinePilatesCoachAgent
│   └── tools.py                   # Pilates-specific tools
├── requirements.txt               # Python dependencies
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

---

## Deployment

### Render.com Deployment

1. **Create New Web Service:**
   - Name: `bassline-orchestrator`
   - Environment: Python 3.11
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Set Environment Variables:**
   - `OPENAI_API_KEY`
   - `BASSLINE_API_URL`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `ENVIRONMENT=production`

3. **Deploy:**
   - Connect GitHub repository
   - Auto-deploy on push to main branch

---

## Educational Notes

### Who Calls What?

```
Frontend
  ↓ calls
Orchestrator Service (FastAPI)
  ↓ passes request to
Agent (BasslinePilatesCoachAgent)
  ↓ uses
LLM (OpenAI GPT-4) for reasoning
  ↓ decides to use
Tool ("assemble_pilates_class")
  ↓ triggers
Arazzo Engine
  ↓ executes workflow steps
  ↓ each step calls
Existing Bassline API (FastAPI)
  ↓ queries
Supabase (PostgreSQL)
```

### LLM vs Agent vs Workflow

- **LLM (OpenAI GPT-4)** = The Engine
  - Provides reasoning capabilities
  - Generates natural language
  - Powers both agent decisions AND content generation

- **Agent (StandardAgent)** = The Driver
  - Decides WHAT to do and WHEN
  - Strategic decisions
  - Fuzzy, adaptive, intelligent

- **Arazzo Workflow** = The GPS
  - Defines HOW to do something
  - Turn-by-turn API orchestration
  - Deterministic, repeatable, testable

- **Supabase** = The Fuel Tank
  - Provides the actual data
  - Movements, music, user preferences
  - No intelligence, just storage

---

## Testing

### Test Agent Locally

```python
from agent.bassline_agent import BasslinePilatesCoachAgent

agent = BasslinePilatesCoachAgent()
result = agent.solve(
    goal="Generate a 30-minute intermediate core-focus class",
    context={"user_id": "test-user"}
)
print(result)
```

### Test Workflow Locally

```yaml
# Arazzo workflows are declarative YAML files
# Test by running the Arazzo Engine directly

arazzo run assemble_pilates_class_v1.yaml \
  --input user_id=test-user \
  --input duration=30 \
  --input difficulty=Intermediate
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'standard_agent'"

**Issue:** Jentic libraries not installed.

**Fix:**
```bash
pip install git+https://github.com/jentic/standard-agent.git@main
```

### "OpenAI API key not found"

**Issue:** OPENAI_API_KEY not set in environment.

**Fix:**
```bash
export OPENAI_API_KEY=sk-your-key-here
```

Or add to `.env` file.

### "Arazzo workflow not found"

**Issue:** Workflow file path incorrect.

**Fix:** Check that `../arazzo/workflows/assemble_pilates_class_v1.yaml` exists relative to `main.py`.

---

## Next Steps (Phase 2)

- [ ] Install actual Jentic libraries (once published to PyPI or stable GitHub release)
- [ ] Test end-to-end workflow execution
- [ ] Add Redis caching for agent memory
- [ ] Add monitoring and observability
- [ ] Add cost tracking for OpenAI API usage
- [ ] Add retry logic and error handling
- [ ] Add multiple workflows for different use cases

---

## Resources

- **Jentic StandardAgent Repo:** https://github.com/jentic/standard-agent
- **Jentic Arazzo Engine Repo:** https://github.com/jentic/arazzo-engine
- **Arazzo Specification:** https://spec.openapis.org/arazzo/latest.html
- **OpenAPI 3.0 Spec:** https://spec.openapis.org/oas/latest.html
- **Bassline Architecture Guide:** `../docs/JENTIC_ARCHITECTURE.md`

---

## License

Proprietary - Bassline Fitness

Jentic StandardAgent and Arazzo Engine are MIT licensed open-source projects.
