# Jentic Architecture Guide
## Understanding Standard Agent & Arazzo for Bassline Integration

**Author:** Claude Code (Educational Documentation)
**Date:** November 27, 2025
**Purpose:** Deep-dive into Jentic's open-source architecture for client relationship & future project applications

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Standard Agent Architecture](#standard-agent-architecture)
3. [Arazzo Workflow Engine](#arazzo-workflow-engine)
4. [How They Work Together](#how-they-work-together)
5. [Bassline Integration Strategy](#bassline-integration-strategy)
6. [Business Model Analysis](#business-model-analysis)
7. [Reusable Patterns](#reusable-patterns)

---

## Executive Summary

### What Problem Do They Solve?

**Standard Agent** solves the "agentic reasoning" problem:
- How do you make an LLM think step-by-step reliably?
- How do you give it tools without losing control?
- How do you debug when it goes wrong?

**Arazzo** solves the "API orchestration" problem:
- How do you describe complex multi-step API workflows?
- How do you make them repeatable and testable?
- How do you separate "what to do" from "how it's implemented"?

### Why Jentic Built This

Jentic is building a **commercial API dictionary platform**. These two open-source libraries are the foundation:
- Standard Agent = The "brain" layer (agents make decisions)
- Arazzo = The "hands" layer (workflows do work)
- **Commercial platform** = The "control panel" (manage tools, workflows, agents, monitoring)

By using their open-source, you're learning patterns that naturally lead toward their commercial offering (platform gravity).

---

## Standard Agent Architecture

### Core Concept: Modular Agent Components

Standard Agent is built on **composition over configuration**:

```
┌─────────────────────────────────────────┐
│         StandardAgent                    │
│  (Orchestrates everything)               │
├─────────────────────────────────────────┤
│  Components (all pluggable):             │
│                                          │
│  ┌─────────────┐  ┌──────────────┐     │
│  │  Reasoner   │  │     LLM      │     │
│  │ (ReWOO/     │  │  (OpenAI/    │     │
│  │  ReACT)     │  │   Anthropic) │     │
│  └─────────────┘  └──────────────┘     │
│                                          │
│  ┌─────────────┐  ┌──────────────┐     │
│  │   Tools     │  │    Memory    │     │
│  │ (Actions)   │  │ (Key-Value)  │     │
│  └─────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

### Key Classes & Responsibilities

#### 1. `StandardAgent` (Central Orchestrator)

**Location:** `agents/standard_agent.py`

**Core Method:**
```python
def solve(self, goal: str) -> ReasoningResult:
    """
    JENTIC PATTERN: Single entry point for agent tasks

    Flow:
    1. Preprocess goal (optional)
    2. Set state to BUSY
    3. Run reasoner
    4. Summarize result
    5. Record interaction
    6. Reset to READY
    """
    if self.goal_preprocessor:
        revised_goal = self.goal_preprocessor.process(goal)

    self._state = AgentState.BUSY
    result = self.reasoner.run(goal)
    result.final_answer = self.llm.prompt(summarize_prompt)

    self._record_interaction({"goal": goal, "result": result.final_answer})
    self._state = AgentState.READY

    return result
```

**Design Insight:** The agent itself is thin - it delegates all complex logic to pluggable components. This makes it easy to swap reasoning strategies, LLMs, or tool sets.

#### 2. `ReWOOReasoner` (Plan → Execute → Reflect)

**Location:** `agents/reasoner/rewoo.py`

**Why ReWOO over ReACT:**
- **ReWOO** = Explicit, structured, debuggable
- **ReACT** = More flexible, less predictable

For Bassline, ReWOO is better because Pilates class generation has clear phases.

**The Three-Phase Loop:**

```python
def run(self, goal: str) -> ReasoningResult:
    """
    JENTIC PATTERN: Explicit reasoning phases

    Phase 1: PLAN
    - Generate step-by-step plan using LLM
    - Parse into structured Step objects
    - Validate dependencies

    Phase 2: EXECUTE
    - For each step:
      - Determine if reasoning or tool-based
      - If tool: select tool, generate params, execute
      - If reasoning: use LLM to derive answer
    - Store results in memory

    Phase 3: REFLECT (on errors)
    - Analyze what went wrong
    - Generate recovery strategy:
      - Rephrase step
      - Change tool
      - Retry with different params
    """
    state = ReasonerState(goal=goal)

    # PHASE 1: PLAN
    steps = self._plan(goal)

    # PHASE 2: EXECUTE
    for step in steps:
        try:
            self._execute(step, state)
        except Exception as e:
            # PHASE 3: REFLECT
            self._reflect(e, step, state)

    return ReasoningResult(steps=steps, state=state)
```

**Design Insight:** By making phases explicit, you can:
- See exactly what the agent planned
- Debug which step failed
- Understand why it chose certain tools
- Replay/modify execution

#### 3. `JustInTimeToolingBase` (Tool Registry)

**Location:** `agents/tools/base.py`

**Purpose:** Abstract interface for "things the agent can do"

```python
class JustInTimeToolingBase(ABC):
    """
    JENTIC PATTERN: Lazy-load tools only when needed

    Key methods:
    - list_tools() → What tools are available?
    - get_tool_schema(tool_id) → How do I use this tool?
    - execute(tool_id, params) → Do the thing!
    """

    @abstractmethod
    def list_tools(self) -> List[ToolInfo]:
        """Return available tools for this context"""
        pass

    @abstractmethod
    def get_tool_schema(self, tool_id: str) -> Dict:
        """Return JSON schema for tool parameters"""
        pass

    @abstractmethod
    def execute(self, tool_id: str, params: Dict) -> Any:
        """Execute the tool and return result"""
        pass
```

**Design Insight:** This is where **platform gravity** starts. Managing tool schemas, validation, and execution manually is tedious. Jentic's commercial platform automates this.

#### 4. `BaseLLM` (Model Abstraction)

**Location:** `agents/llm/base.py`

**Purpose:** Uniform interface for any LLM provider

```python
class BaseLLM(ABC):
    """
    JENTIC PATTERN: Provider-agnostic LLM interface

    Supports:
    - OpenAI (GPT-4, GPT-3.5)
    - Anthropic (Claude)
    - Any custom provider
    """

    @abstractmethod
    def prompt(self, prompt: str, **kwargs) -> str:
        """Simple text completion"""
        pass

    @abstractmethod
    def prompt_to_json(self, prompt: str, schema: Dict) -> Dict:
        """Structured JSON completion"""
        pass
```

**Design Insight:** By abstracting the LLM, you can switch providers without changing agent logic. Critical for cost optimization and vendor flexibility.

#### 5. Memory System

**Pattern:** Uses standard Python `MutableMapping` (dict-like interface)

```python
def __init__(self, memory: MutableMapping):
    """
    JENTIC PATTERN: Simple key-value memory

    Default: In-memory dict
    Production: Redis, Postgres, Vector DB

    Memory stores:
    - Conversation history
    - Step results
    - User context
    - Intermediate data
    """
    self.memory = memory
    self.memory.setdefault("conversation_history", [])
```

**Design Insight:** Start simple (dict), scale later (Redis). The interface doesn't change.

---

## Arazzo Workflow Engine

### Core Concept: Declarative API Orchestration

Arazzo is **NOT code** - it's a **specification** (like OpenAPI for workflows).

```
┌────────────────────────────────────────┐
│  Arazzo Workflow (YAML)                │
│  - Describes WHAT to do                │
│  - References OpenAPI operations       │
│  - Defines data flow                   │
└───────────┬────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│  Arazzo Engine (Python)                │
│  - Reads workflow                      │
│  - Executes steps                      │
│  - Handles errors                      │
│  - Returns results                     │
└────────────────────────────────────────┘
```

### Workflow Structure

```yaml
# Minimal Arazzo Workflow
arazzo: "1.0.1"
info:
  title: "Workflow Name"
  version: "1.0.0"

# Reference your OpenAPI specs
sourceDescriptions:
  - name: basslineAPI
    url: https://api.basslinefitness.app/openapi.json
    type: openapi

# Define workflows
workflows:
  - workflowId: generatePilatesClass
    summary: "Generate a complete Pilates class"

    # Workflow inputs (from user/app)
    inputs:
      type: object
      properties:
        user_id:
          type: string
        duration_minutes:
          type: integer
        difficulty:
          type: string

    # Workflow steps (sequential by default)
    steps:
      - stepId: getUserProfile
        operationId: getUser  # References OpenAPI operation
        parameters:
          - name: id
            in: path
            value: $inputs.user_id  # Runtime expression
        successCriteria:
          - condition: $statusCode == 200
        outputs:
          userLevel: $response.body.difficulty_level

      - stepId: selectMovements
        operationId: generateSequence
        parameters:
          - name: user_id
            in: body
            value: $inputs.user_id
          - name: duration_minutes
            in: body
            value: $inputs.duration_minutes
          - name: difficulty_level
            in: body
            value: $steps.getUserProfile.outputs.userLevel  # Use previous step output
        successCriteria:
          - condition: $statusCode == 200
        outputs:
          movements: $response.body.data.sequence

      - stepId: selectMusic
        operationId: selectMusicPlaylist
        parameters:
          - name: duration_minutes
            in: body
            value: $inputs.duration_minutes
        successCriteria:
          - condition: $statusCode == 200
        outputs:
          playlist: $response.body.data.playlist

    # Workflow outputs (what gets returned)
    outputs:
      class:
        movements: $steps.selectMovements.outputs.movements
        music: $steps.selectMusic.outputs.playlist
        totalDuration: $inputs.duration_minutes
```

### Key Concepts

#### 1. Runtime Expressions

**Purpose:** Pass data between steps

```yaml
# Access workflow inputs
value: $inputs.user_id

# Access previous step outputs
value: $steps.getUserProfile.outputs.userLevel

# Access response data
value: $response.body.data.sequence

# Access status codes
condition: $statusCode == 200
```

#### 2. Operation References

**Two ways to reference APIs:**

```yaml
# Method 1: Direct operationId (must match OpenAPI spec)
operationId: getUser

# Method 2: Path reference (more explicit)
operationPath: '{$sourceDescriptions.basslineAPI.url}#/paths/~1users~1{id}/get'
```

#### 3. Success Criteria

**Define what "success" means:**

```yaml
successCriteria:
  - condition: $statusCode == 200
  - condition: $response.body.data != null
  - condition: $response.body.data.length > 0
```

**Failure Handling:**
- If criteria not met → step fails
- Workflow can define `onFailure` actions
- Can retry, skip, or abort

#### 4. Data Flow

```
Inputs → Step 1 → Step 2 → Step 3 → Outputs
   ↓       ↓        ↓        ↓        ↓
 Memory ← Results ← Results ← Results ← Final
```

Each step can:
- Read inputs from workflow or previous steps
- Write outputs for next steps
- Transform data using expressions

---

## How They Work Together

### The Integration Pattern

```
┌─────────────────────────────────────────────────────────┐
│                  User Request                            │
│  "Build a 30-min intermediate hip-focus Pilates class"  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              StandardAgent (Pilates Coach)               │
│  - Receives goal                                         │
│  - Plans approach (ReWOO)                                │
│  - Decides: "I need to run the class-assembly workflow" │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Tool: run_arazzo_workflow()                    │
│  - Agent calls this as a "tool"                          │
│  - Passes workflow name + parameters                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Arazzo Engine                               │
│  - Loads `assemble_pilates_class.yaml`                  │
│  - Executes steps sequentially:                          │
│    1. GET /users/{id}                                    │
│    2. POST /api/agents/generate-sequence                 │
│    3. POST /api/agents/select-music                      │
│    4. POST /api/agents/create-meditation                 │
│  - Returns assembled class structure                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              StandardAgent (continues)                   │
│  - Receives workflow result                              │
│  - Reflects: "Did this work?"                            │
│  - Summarizes for user                                   │
│  - Returns final answer                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  User Response                           │
│  "Here's your 30-min intermediate hip-focus class..."   │
└─────────────────────────────────────────────────────────┘
```

### Key Insight: Separation of Concerns

| **StandardAgent**              | **Arazzo**                    |
|--------------------------------|-------------------------------|
| Decides WHAT needs to happen   | Defines HOW it happens        |
| Fuzzy, probabilistic           | Deterministic, repeatable     |
| Adapts to context              | Follows fixed steps           |
| Handles unexpected situations  | Executes known processes      |
| LLM-driven reasoning           | API orchestration             |

**Example:**
- **StandardAgent decides:** "User wants a gentle class after injury → I should use the recovery workflow"
- **Arazzo executes:** "Step 1: Get user injuries. Step 2: Filter movements. Step 3: Select gentle music..."

---

## Bassline Integration Strategy

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                  Bassline React Frontend                      │
│  (Existing - no changes)                                      │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ POST /generate-class
                          ▼
┌──────────────────────────────────────────────────────────────┐
│         NEW: Python Orchestration Service (Render)           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  FastAPI Endpoint: /generate-class                     │  │
│  │  - Receives structured JSON from frontend              │  │
│  │  - Passes to BasslinePilatesCoachAgent                 │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  BasslinePilatesCoachAgent                             │  │
│  │  (extends StandardAgent)                               │  │
│  │  - Uses ReWOOReasoner                                  │  │
│  │  - Has Pilates-specific tools                          │  │
│  │  - Can call Arazzo workflows                           │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  Arazzo Workflow: assemble_pilates_class.yaml         │  │
│  │  - Step 1: GET /users/{id}                             │  │
│  │  - Step 2: POST /api/agents/generate-sequence          │  │
│  │  - Step 3: POST /api/agents/select-music               │  │
│  │  - Step 4: POST /api/agents/create-meditation          │  │
│  └────────────────────┬───────────────────────────────────┘  │
└────────────────────────┼───────────────────────────────────── │
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│       Existing Bassline Backend (FastAPI - Render)           │
│  - All existing API endpoints                                │
│  - Supabase integration                                      │
│  - Music selection                                           │
│  - Movement database                                         │
└──────────────────────────────────────────────────────────────┘
```

### Phase 1 Implementation Plan

**File Structure:**
```
bassline-orchestrator/                 # NEW Python service
├── main.py                            # FastAPI app
├── agent/
│   ├── bassline_agent.py             # BasslinePilatesCoachAgent
│   └── tools.py                       # Pilates-specific tools
├── workflows/
│   └── assemble_pilates_class.yaml   # Arazzo workflow
├── config/
│   └── bassline_openapi.yaml         # OpenAPI spec (generated)
├── requirements.txt                   # Dependencies
└── README.md                          # Setup docs
```

**Key Files We'll Create:**

1. **`main.py`** - FastAPI service entry point
2. **`agent/bassline_agent.py`** - Agent extending StandardAgent
3. **`agent/tools.py`** - Tool definitions for Bassline APIs
4. **`workflows/assemble_pilates_class.yaml`** - Arazzo workflow
5. **`config/bassline_openapi.yaml`** - OpenAPI spec for your existing APIs

---

## Business Model Analysis

### Platform Gravity: How Jentic Makes Money

Jentic's strategy is classic **"open-source growth → commercial platform"**:

#### Open-Source Layer (Free)
✅ **Standard Agent** - Core reasoning loop
✅ **Arazzo Engine** - Workflow execution
✅ **MIT License** - Use forever, modify freely

#### Commercial Platform Layer (Paid)
💰 **Tool Registry** - Centralized action/API dictionary
💰 **Workflow Authoring** - Visual workflow builder
💰 **Monitoring & Observability** - Debug agent decisions
💰 **Multi-Agent Orchestration** - Coordinate multiple agents
💰 **Cost Controls** - Track LLM spend
💰 **Safety & Governance** - Access policies, compliance
💰 **Testing & Validation** - Automated workflow testing

### Where You'll Feel Pain Without Platform

| Pain Point | Manual Solution | Platform Solution |
|------------|-----------------|-------------------|
| **Tool Management** | Hand-write schemas, validation, wrappers | Auto-generated from OpenAPI |
| **Workflow Authoring** | Write YAML by hand, validate manually | Visual editor, live preview |
| **Debugging** | Parse logs, add print statements | Trace viewer, step replay |
| **Monitoring** | Build custom dashboards | Built-in agent analytics |
| **Cost Tracking** | Query LLM provider APIs | Real-time cost dashboard |
| **Multi-Workflow** | Manually coordinate | Orchestration layer |

### Decision Matrix: When to Use What

**Use Open-Source Only:**
- ✅ Learning/education phase
- ✅ Simple single-agent systems
- ✅ Low tool count (<10 tools)
- ✅ Infrequent workflow changes
- ✅ Small team (1-3 devs)

**Consider Commercial Platform:**
- 💰 Complex multi-agent systems
- 💰 Many tools (>20 tools)
- 💰 Frequent workflow iteration
- 💰 Multiple developers
- 💰 Production scale (>1000 req/day)
- 💰 Compliance requirements
- 💰 Cost optimization critical

**Bassline Context:**
- **Phase 1:** Open-source only (learning)
- **Phase 2:** Evaluate platform (if pain points emerge)
- **Long-term:** Depends on scale + complexity

---

## Reusable Patterns

### Pattern 1: Tool Definition

```python
# ============================================
# JENTIC PATTERN: Tool/Action Interface
# ============================================
from standard_agent import JustInTimeToolingBase

class BasslineTools(JustInTimeToolingBase):
    """
    Pilates-specific tool implementations

    Each tool:
    1. Has a unique ID
    2. Has a JSON schema (parameters)
    3. Has an execute method
    """

    def list_tools(self) -> List[ToolInfo]:
        return [
            ToolInfo(
                id="get_user_profile",
                name="Get User Profile",
                description="Fetch user's level, injuries, preferences",
                schema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string"}
                    },
                    "required": ["user_id"]
                }
            ),
            ToolInfo(
                id="select_movements",
                name="Select Pilates Movements",
                description="Choose appropriate movements for class",
                schema={
                    "type": "object",
                    "properties": {
                        "difficulty": {"type": "string", "enum": ["Beginner", "Intermediate", "Advanced"]},
                        "focus_area": {"type": "string"},
                        "duration_minutes": {"type": "integer"}
                    },
                    "required": ["difficulty", "duration_minutes"]
                }
            )
        ]

    def execute(self, tool_id: str, params: Dict) -> Any:
        """Route to appropriate handler"""
        if tool_id == "get_user_profile":
            return self._get_user_profile(**params)
        elif tool_id == "select_movements":
            return self._select_movements(**params)
        else:
            raise ValueError(f"Unknown tool: {tool_id}")

    def _get_user_profile(self, user_id: str) -> Dict:
        """Call your existing backend"""
        response = requests.get(f"https://api.basslinefitness.app/users/{user_id}")
        return response.json()

    def _select_movements(self, difficulty: str, focus_area: str, duration_minutes: int) -> Dict:
        """Call your existing backend"""
        response = requests.post(
            "https://api.basslinefitness.app/api/agents/generate-sequence",
            json={
                "difficulty_level": difficulty,
                "focus_areas": [focus_area],
                "target_duration_minutes": duration_minutes
            }
        )
        return response.json()
```

### Pattern 2: Agent Initialization

```python
# ============================================
# JENTIC PATTERN: Agent Composition
# ============================================
from standard_agent import StandardAgent, ReWOOReasoner
from standard_agent.llm import OpenAILLM

class BasslinePilatesCoachAgent(StandardAgent):
    """
    BASSLINE CUSTOMIZATION: Pilates-specific agent

    Inherits StandardAgent's core functionality:
    - solve() method
    - State management
    - Memory handling

    Adds Pilates domain knowledge via:
    - Custom system prompt
    - Pilates-specific tools
    - Domain constraints
    """

    def __init__(self):
        # Configure LLM
        llm = OpenAILLM(
            model="gpt-4",
            api_key=os.getenv("OPENAI_API_KEY")
        )

        # Configure tools
        tools = BasslineTools()

        # Configure reasoner
        reasoner = ReWOOReasoner(
            llm=llm,
            tools=tools,
            system_prompt="""
            You are a Pilates class planning expert.

            Your goal is to create safe, effective, personalized Pilates classes.

            Key principles:
            - Safety first (no dangerous movement combinations)
            - Progressive difficulty (appropriate for user level)
            - Muscle balance (don't overwork any group)
            - Respect injuries (modify or exclude contraindicated movements)
            - Enjoyment (match user's music preferences)

            Available tools:
            - get_user_profile: Get user's level, injuries, preferences
            - select_movements: Choose appropriate Pilates movements
            - select_music: Choose music matching class energy
            - create_meditation: Generate cool-down meditation
            - run_workflow: Execute a predefined workflow
            """
        )

        # Configure memory (start simple)
        memory = {}  # Can upgrade to Redis later

        # Initialize StandardAgent with our components
        super().__init__(
            llm=llm,
            reasoner=reasoner,
            tools=tools,
            memory=memory
        )
```

### Pattern 3: Workflow as Tool

```python
# ============================================
# JENTIC PATTERN: Arazzo Workflow as Agent Tool
# ============================================
from arazzo import Runner

class BasslineTools(JustInTimeToolingBase):
    def __init__(self):
        self.arazzo_runner = Runner(
            workflow_dir="./workflows",
            openapi_spec="./config/bassline_openapi.yaml"
        )

    def list_tools(self) -> List[ToolInfo]:
        return [
            # ... other tools ...
            ToolInfo(
                id="assemble_pilates_class",
                name="Assemble Complete Pilates Class",
                description="Run the full class assembly workflow (user → movements → music → meditation)",
                schema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string"},
                        "duration_minutes": {"type": "integer"},
                        "difficulty": {"type": "string"},
                        "focus_area": {"type": "string"}
                    },
                    "required": ["user_id", "duration_minutes", "difficulty"]
                }
            )
        ]

    def execute(self, tool_id: str, params: Dict) -> Any:
        if tool_id == "assemble_pilates_class":
            # Agent calls this tool
            # Tool runs Arazzo workflow
            # Workflow calls your APIs
            result = self.arazzo_runner.run(
                workflow_id="assemble_pilates_class",
                inputs=params
            )
            return result.outputs
```

---

## Next Steps for Integration

1. ✅ **Study complete** (you're reading this!)
2. ⏭️ **Create OpenAPI spec** for existing Bassline APIs
3. ⏭️ **Write Arazzo workflow** for class generation
4. ⏭️ **Scaffold Python service** with FastAPI
5. ⏭️ **Implement BasslinePilatesCoachAgent**
6. ⏭️ **Deploy to Render**
7. ⏭️ **Wire frontend**
8. ⏭️ **Test & iterate**

---

## Questions & Resources

**Standard Agent Repo:** https://github.com/jentic/standard-agent
**Arazzo Engine Repo:** https://github.com/jentic/arazzo-engine
**Arazzo Spec:** https://spec.openapis.org/arazzo/latest.html

**For Questions:**
- Architecture decisions → Reference this doc
- Implementation details → Check Jentic repos
- Integration strategy → Consult with Claude Code

---

**Last Updated:** November 27, 2025
**Next Review:** After Phase 1 completion
