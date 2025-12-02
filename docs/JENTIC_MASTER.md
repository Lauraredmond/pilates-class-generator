# Jentic Integration Guide (Master Documentation)

**Version:** 1.0
**Last Updated:** December 2, 2025
**Status:** 🎯 Consolidated Reference - Single Source of Truth

---

## Table of Contents

### [1. Introduction & Overview](#1-introduction--overview)
- [1.1 What is Jentic?](#11-what-is-jentic)
- [1.2 Why We Use Jentic](#12-why-we-use-jentic)
- [1.3 How Jentic Fits Into Our Architecture](#13-how-jentic-fits-into-our-architecture)
- [1.4 Dual Project Goals](#14-dual-project-goals)

### [2. Architecture](#2-architecture)
- [2.1 StandardAgent Structure](#21-standardagent-structure)
- [2.2 Arazzo Engine](#22-arazzo-engine)
- [2.3 Workflow Orchestration](#23-workflow-orchestration)
- [2.4 Component Diagram](#24-component-diagram)

### [3. Core Concepts](#3-core-concepts)
- [3.1 Reasoning Patterns (ReWOO)](#31-reasoning-patterns-rewoo)
- [3.2 LLM Integration (LiteLLM)](#32-llm-integration-litellm)
- [3.3 Tool Management (JustInTimeToolingBase)](#33-tool-management-justintimetoolingbase)
- [3.4 Agent Lifecycle (Plan→Execute→Reflect)](#34-agent-lifecycle-planexecutereflect)

### [4. Integration with Bassline](#4-integration-with-bassline)
- [4.1 BasslinePilatesCoachAgent Implementation](#41-basslinepilatescoachagentt-implementation)
- [4.2 Composition Pattern](#42-composition-pattern)
- [4.3 Educational Annotations](#43-educational-annotations)
- [4.4 Real Code vs Stubs](#44-real-code-vs-stubs)

### [5. Arazzo Workflows](#5-arazzo-workflows)
- [5.1 Workflow DSL Syntax](#51-workflow-dsl-syntax)
- [5.2 Creating Workflows](#52-creating-workflows)
- [5.3 Testing & Debugging](#53-testing--debugging)
- [5.4 OpenAPI Specification Integration](#54-openapi-specification-integration)

### [6. Practical Examples](#6-practical-examples)
- [6.1 Complete Class Generation Workflow](#61-complete-class-generation-workflow)
- [6.2 Music Selection Integration](#62-music-selection-integration)
- [6.3 Error Handling Patterns](#63-error-handling-patterns)
- [6.4 Before/After Code Comparisons](#64-beforeafter-code-comparisons)

### [7. Best Practices](#7-best-practices)
- [7.1 When to Use Arazzo vs. Custom Code](#71-when-to-use-arazzo-vs-custom-code)
- [7.2 Scalability Patterns](#72-scalability-patterns)
- [7.3 Testing Strategies](#73-testing-strategies)
- [7.4 Code Quality Standards](#74-code-quality-standards)

### [8. Advanced Topics](#8-advanced-topics)
- [8.1 Multi-Agent Orchestration](#81-multi-agent-orchestration)
- [8.2 Performance Optimization](#82-performance-optimization)
- [8.3 Observability & Logging](#83-observability--logging)
- [8.4 Hybrid Approaches (Arazzo + StandardAgent)](#84-hybrid-approaches-arazzo--standardagent)

### [9. Troubleshooting](#9-troubleshooting)
- [9.1 Common Issues](#91-common-issues)
- [9.2 Debugging Workflows](#92-debugging-workflows)
- [9.3 Testing Failed Workflows](#93-testing-failed-workflows)

### [10. Reference](#10-reference)
- [10.1 API Documentation](#101-api-documentation)
- [10.2 Configuration Options](#102-configuration-options)
- [10.3 External Resources](#103-external-resources)

---

## 1. Introduction & Overview

### 1.1 What is Jentic?

**Jentic** is an enterprise AI orchestration platform that provides two key technologies:

1. **StandardAgent** - A production-ready AI agent framework with Plan→Execute→Reflect reasoning loop
2. **Arazzo Engine** - A declarative workflow DSL for orchestrating multi-step API operations

Both components are open-source, published to PyPI, and used by Fortune 500 companies.

**Key Resources:**
- StandardAgent GitHub: https://github.com/jentic/standard-agent
- Arazzo Engine GitHub: https://github.com/jentic/arazzo-engine
- PyPI Packages:
  - `standard-agent` (v0.1.11+)
  - `arazzo-runner` (v0.9.2+)
  - `jentic` (v0.9.5+)

### 1.2 Why We Use Jentic

Jentic serves **two equally important strategic objectives** in our project:

**Goal 1: Build Production-Ready Pilates Platform**
- Proven, battle-tested code used by Fortune 500 companies
- Reduces development time (no need to build agent framework from scratch)
- Professional-grade architecture with built-in observability
- Cost-effective hybrid approach (workflows are free, AI only when needed)

**Goal 2: Learn Jentic Architecture Through Implementation**
- Jentic is a CLIENT of Bassline (requires intimate codebase knowledge)
- Deep understanding through real implementation (not theory or stubs)
- Reusable patterns for future AI projects
- Strengthens client relationship with demonstrated expertise

**Why Both Goals Matter:**
- **Customer Traction** requires working production code ✅
- **Client Relationship** requires deep understanding of Jentic's architecture ✅
- **Future Projects** require scalable AI infrastructure patterns ✅
- **Best Learning** happens through real implementation, not theory ✅

### 1.3 How Jentic Fits Into Our Architecture

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React on Netlify)                 │
│         "Create 60-min intermediate class"               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│      PYTHON ORCHESTRATION SERVICE (Render)              │
│                                                          │
│  IF (standard request):                                 │
│      → Use Arazzo Workflow (2s, free)                   │
│                                                          │
│  ELSE IF (complex request):                             │
│      → Use StandardAgent (15s, $0.20)                   │
│                                                          │
│  Agent uses:                                             │
│    - LiteLLM (GPT-4 or Claude)                          │
│    - HybridToolProvider                                  │
│        ├─ PilatesTools (our APIs)                       │
│        └─ JenticTools (1500+ APIs)                      │
│    - ReWOOReasoner (plan-execute-reflect)               │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌────────────┐ ┌────────────┐
│  SUPABASE    │ │ BASSLINE   │ │  JENTIC    │
│  (Database)  │ │   APIs     │ │   APIs     │
└──────────────┘ └────────────┘ └────────────┘
```

**Key Integration Points:**
1. **Frontend** calls orchestration service (not backend APIs directly)
2. **Orchestrator** decides: Arazzo workflow (deterministic) or StandardAgent (AI reasoning)
3. **StandardAgent** uses our custom tools (PilatesTools) + Jentic's tool marketplace
4. **Arazzo workflows** orchestrate our backend APIs via OpenAPI specs

### 1.4 Dual Project Goals

**CRITICAL DECISION POINT:**
- ❌ **NOT** "learn first, then build later"
- ❌ **NOT** "build first, refactor later"
- ✅ **YES** "build AND learn simultaneously using real Jentic code"

**Implementation Strategy:**
- Use real Jentic libraries from GitHub (not stubs, not placeholders)
- Heavy educational annotations throughout code ("JENTIC PATTERN" vs "BASSLINE CUSTOM")
- Production quality while learning architecture patterns
- Deploy fully functional integration
- **🎯 CRITICAL: Standardize code using Jentic patterns for maximum scalability**
  - Leverage StandardAgent and Arazzo Engine to their fullest potential
  - Standardized code = easily scalable code
  - Replace custom implementations with Jentic patterns wherever possible
  - Document all deviations from Jentic standards with clear justification

---

## 2. Architecture

### 2.1 StandardAgent Structure

StandardAgent provides a modular framework for building AI agents through **composition**, not configuration.

**Core Components:**

```
┌─────────────────────────────────────────────────────────────┐
│ StandardAgent (Jentic - The Brain)                          │
│ - Plan → Execute → Reflect reasoning loop                   │
│ - Decides which tools to use                                 │
│ - Validates results                                          │
│                                                              │
│  Composed from 4 pluggable parts:                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │     LLM     │  │    Tools    │  │   Reasoner  │        │
│  │  (Thinking) │  │   (Hands)   │  │  (Strategy) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌─────────────┐                                            │
│  │   Memory    │  (Conversation history & context)         │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

**What StandardAgent Provides (Inherited):**
- `solve(goal)` method - Main entry point for agentic reasoning
- State management - READY, BUSY, ERROR states
- Memory handling - Conversation history and context
- Decision logging - For compliance and monitoring
- Observability - Built-in logging and tracing
- Error recovery - Automatic retry and fallback logic

**What You Provide (Customization):**
- LLM configuration - Model choice, temperature, system prompt
- Tool implementations - Domain-specific capabilities
- Memory backend - Simple dict, Redis, or custom
- Reasoner strategy - ReWOO (default) or custom

**Example Implementation:**

```python
from agents.standard_agent import StandardAgent
from agents.llm.litellm import LiteLLM
from agents.reasoner.rewoo import ReWOOReasoner

class BasslinePilatesCoachAgent(StandardAgent):
    """
    JENTIC PATTERN: Inherit from StandardAgent for free Plan→Execute→Reflect

    BASSLINE CUSTOM: Add Pilates-specific configuration
    """

    def __init__(self):
        # Configure LLM
        llm = LiteLLM(model="gpt-4-turbo", temperature=0.7)

        # Configure tools (our domain logic)
        tools = BasslinePilatesTools(bassline_api_url=...)

        # Configure memory
        memory = {"conversation_history": [], "context": {}}

        # Configure reasoner
        reasoner = ReWOOReasoner(llm=llm, tools=tools, memory=memory)

        # Initialize parent (composition)
        super().__init__(llm=llm, tools=tools, memory=memory, reasoner=reasoner)
```

**Key Insight:** You compose an agent from parts, rather than configure a monolith. This makes each part swappable and testable independently.

---

### 2.2 Arazzo Engine

Arazzo is a declarative workflow DSL (Domain-Specific Language) for orchestrating multi-step API operations.

**What Arazzo Provides:**
- Declarative workflow definitions (YAML, not code)
- Automatic API calling based on OpenAPI specs
- Runtime expressions for data flow between steps
- Sequential and parallel step execution
- Error handling and retry logic
- Workflow outputs aggregation

**How It Works:**

```
1. You define workflow in YAML:
   ┌──────────────────────────────────┐
   │  assemble_class.arazzo.yaml      │
   │                                  │
   │  steps:                          │
   │    - getUserProfile              │
   │    - generateSequence            │
   │    - selectMusic                 │
   │  outputs: completeClass          │
   └──────────────────────────────────┘
             ↓
2. Arazzo Engine reads OpenAPI spec:
   ┌──────────────────────────────────┐
   │  bassline_api_v1.yaml            │
   │                                  │
   │  /api/users/{id}/profile:        │
   │    get:                          │
   │      operationId: getUserProfile │
   └──────────────────────────────────┘
             ↓
3. Arazzo executes workflow:
   ┌──────────────────────────────────┐
   │  ArazzoRunner.execute_workflow() │
   │                                  │
   │  Step 1: GET /api/users/123      │
   │  Step 2: POST /api/sequences     │
   │  Step 3: POST /api/music         │
   │  Returns: completeClass object   │
   └──────────────────────────────────┘
```

**Runtime Expressions:**

Arazzo uses a special expression language to pass data between steps:

```yaml
- stepId: getUserProfile
  outputs:
    difficulty: $response.body.preferences.default_difficulty

- stepId: generateSequence
  parameters:
    - name: difficulty_level
      value: $steps.getUserProfile.outputs.difficulty  # ← References previous step
```

**Expression Types:**
- `$inputs.X` - Access workflow input parameters
- `$steps.stepId.outputs.X` - Access previous step outputs
- `$response.body.X` - Access HTTP response body
- `$response.statusCode` - Access HTTP status code
- `$response.headers.X` - Access HTTP headers

**Why Arazzo Over Code:**

| **Arazzo (Declarative)** | **Python Code (Imperative)** |
|---------------------------|-------------------------------|
| 150 lines YAML | 200+ lines Python |
| 15 min to modify | 3 hours to modify |
| Non-developers can read | Only developers understand |
| Visual diagrams possible | Hard to visualize |
| No testing required (validate YAML) | Requires unit/integration tests |

---

### 2.3 Workflow Orchestration

**Orchestrator Service Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React)                                             │
│ - User interactions                                          │
│ - Calls orchestrator service                                 │
│ Files: frontend/src/services/orchestrator.ts                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP POST /generate-class
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Orchestrator Service (Python FastAPI)                       │
│ - Receives user request                                      │
│ - Creates natural language goal                              │
│ - Calls StandardAgent.solve(goal)                           │
│ Files: orchestrator/main.py                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ agent.solve()
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ StandardAgent (Jentic - The Brain)                          │
│ - Plan → Execute → Reflect reasoning loop                   │
│ - Decides which tools to use                                 │
│ - Validates results                                          │
│ Files: orchestrator/agent/bassline_agent.py                │
│ ✅ Inherits from Jentic's StandardAgent                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ tool.execute()
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Tools (Jentic Interface Implementation)                     │
│ - Implements JustInTimeToolingBase                          │
│ - One tool: "Run Arazzo Workflow"                           │
│ - Other tools: Direct API calls                             │
│ Files: orchestrator/agent/tools.py                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ arazzo_runner.execute_workflow()
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Arazzo Engine (Jentic - The Workflow Executor)              │
│ - Reads .arazzo.yaml workflow files                         │
│ - Executes steps sequentially                                │
│ - Passes data using runtime expressions                      │
│ Files: orchestrator/arazzo/workflows/*.arazzo.yaml          │
│ Reads: backend/openapi/bassline_api_v1.yaml                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP calls to backend
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend APIs (FastAPI - The Workers)                        │
│ - Simple, focused API endpoints                             │
│ - Domain logic (Pilates rules, safety validation)           │
│ - Database access (Supabase)                                 │
│ - Specialized AI agents (sequence, music, meditation)       │
│ Files: backend/api/*.py, backend/agents/*.py                │
│ ❌ Does NOT use StandardAgent (separation of concerns)      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ SQL queries
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase Database (PostgreSQL)                              │
│ - User profiles, preferences                                 │
│ - Movements, sequences, sections                             │
│ - Music tracks, playlists                                    │
│ - Compliance logs (EU AI Act, GDPR)                         │
└─────────────────────────────────────────────────────────────┘
```

**Hybrid Decision Flow:**

```python
@app.post("/api/generate-class")
async def generate_class(request: dict):
    # Simple standard request? Use workflow (fast path)
    if is_standard_request(request):
        result = arazzo_runner.execute_workflow(
            workflow_id="assemblePilatesClass",
            inputs=request
        )
        return {"method": "workflow", "time": "2s", "cost": "$0", "result": result.outputs}

    # Complex request with special needs? Use AI agent (flexible path)
    else:
        goal = f"Create a {request['difficulty']} class. User notes: {request['notes']}"
        result = agent.solve(goal)
        return {"method": "agent", "time": "15s", "cost": "$0.20", "result": result.final_answer}
```

**Separation of Concerns:**
- **Orchestrator**: High-level reasoning (StandardAgent + Arazzo)
- **Backend**: Domain execution (simple API endpoints)
- **Database**: Data persistence (Supabase)

This separation prevents circular dependencies and keeps backend APIs simple and focused.

---

### 2.4 Component Diagram

**Jentic Integration - Complete System:**

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Netlify)                   │
│                                                               │
│  - User Interface                                            │
│  - Form validation                                           │
│  - Class playback                                            │
│  - Settings management                                       │
│                                                               │
│  Calls: ORCHESTRATOR_URL/api/workflows/generate_class       │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ HTTP POST {user_id, difficulty, duration}
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR SERVICE (Python/Render)             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ StandardAgent (BasslinePilatesCoachAgent)              │ │
│  │  - LiteLLM (GPT-4)                                     │ │
│  │  - BasslinePilatesTools                                │ │
│  │  - ReWOOReasoner (Plan→Execute→Reflect)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                    │
│                          │ tool.execute("assemble_class")    │
│                          ▼                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ArazzoRunner                                           │ │
│  │  - Reads: assemble_pilates_class_v1.arazzo.yaml       │ │
│  │  - Reads: bassline_api_v1.yaml (OpenAPI spec)         │ │
│  │  - Executes: 8-step workflow                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Calls: BASSLINE_API_URL/api/*                               │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ Multiple HTTP calls (workflow steps)
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                BACKEND APIs (FastAPI/Render)                  │
│                                                               │
│  API Endpoints:                                              │
│  - POST /api/agents/generate-sequence                        │
│  - POST /api/agents/select-music                             │
│  - POST /api/agents/create-meditation                        │
│  - GET  /api/users/{id}/profile                             │
│  - GET  /api/movements                                       │
│  - GET  /api/music/playlists                                 │
│  - GET  /api/class-sections/*                                │
│                                                               │
│  Backend Agents (NOT StandardAgent):                         │
│  - SequenceAgent (movement selection logic)                  │
│  - MusicAgent (music recommendation)                         │
│  - MeditationAgent (script generation)                       │
│                                                               │
│  Calls: SUPABASE_URL (PostgreSQL)                            │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ SQL queries
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                      │
│                                                               │
│  Tables:                                                     │
│  - movements (34 classical Pilates movements)                │
│  - movement_muscles (muscle group mappings)                  │
│  - preparation_scripts, warmup_routines                      │
│  - cooldown_sequences, closing_meditation_scripts            │
│  - closing_homecare_advice                                   │
│  - music_tracks, music_playlists                             │
│  - user_profiles, user_preferences                           │
│  - ai_decision_log, bias_monitoring (compliance)             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Data Flow Example (Complete Class Generation):**

1. **Frontend** → `POST /api/workflows/generate_class` → **Orchestrator**
2. **Orchestrator** → `StandardAgent.solve("Create 60-min intermediate class")` → **Agent**
3. **Agent** → `ReWOOReasoner.plan()` → Generate 3-step plan:
   - Step 1: Get user profile
   - Step 2: Run Arazzo workflow "assemble_pilates_class"
   - Step 3: Format result
4. **Agent** → `tools.execute("assemble_pilates_class", params)` → **Arazzo**
5. **Arazzo** → Reads `assemble_pilates_class_v1.arazzo.yaml` → 8 workflow steps
6. **Arazzo** → Step 1: `GET /api/users/123/profile` → **Backend API**
7. **Backend** → Query Supabase → Return user preferences
8. **Arazzo** → Step 2: `POST /api/agents/generate-sequence` → **Backend API**
9. **Backend** → SequenceAgent selects movements → Return sequence
10. **Arazzo** → Steps 3-8: Get warmup, music, cooldown, meditation, homecare
11. **Arazzo** → Assembles complete class with all 6 sections → Return to agent
12. **Agent** → Validates result → Return to orchestrator
13. **Orchestrator** → Return to frontend
14. **Frontend** → Display class to user

---

## 3. Core Concepts

### 3.1 Reasoning Patterns (ReWOO)

ReWOO stands for **Re**asoning **W**ith**O**ut **O**bservation - a reasoning strategy that plans all steps upfront before executing them.

**The Problem ReWOO Solves:**

Traditional AI agents (like basic ChatGPT interactions) work like this:
```
1. Do step 1
2. Wait... what was I doing?
3. Oh right, do step 2
4. Hmm, what's next?
5. Do step 3
```

This "amnesia loop" wastes tokens and time because the agent forgets context between steps.

**How ReWOO Works:**

```
┌─────────────────────────────────────────────┐
│ PLAN Phase                                  │
│ - Read entire goal                          │
│ - Generate complete step-by-step plan      │
│ - Identify input/output dependencies       │
│ - Validate plan before execution           │
└─────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────┐
│ EXECUTE Phase                               │
│ - Run steps in sequence                     │
│ - Store outputs in memory                   │
│ - Pass data between steps automatically     │
│ - Skip reflection if step succeeds          │
└─────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────┐
│ REFLECT Phase (only if error)              │
│ - Analyze what went wrong                   │
│ - Decide on recovery strategy:              │
│   • retry_params (different parameters)     │
│   • change_tool (try different tool)        │
│   • rephrase_step (clarify step)            │
│   • give_up (unrecoverable error)           │
└─────────────────────────────────────────────┘
```

**Analogy: Recipe Cooking**

**Traditional Agent (Bad):**
- Start cooking
- "Wait, what ingredients do I need?"
- Go get flour
- "Wait, what do I do with flour?"
- Mix flour
- "Wait, what's next?"

**ReWOO Agent (Good):**
- Read entire recipe first (PLAN)
- Gather all ingredients
- Execute steps 1→2→3→4 in order (EXECUTE)
- Only stop if something fails (REFLECT)

**Configuration:**

```python
from agents.reasoner.rewoo import ReWOOReasoner

reasoner = ReWOOReasoner(
    llm=llm,                    # LLM for planning/reflecting
    tools=tools,                # Available tools
    memory=memory,              # Shared memory
    max_iterations=20,          # Max steps before giving up
    max_retries=2,              # Max retries per failed step
    top_k=25                    # Number of tools to consider
)
```

**Why ReWOO Is Better:**
- ✅ More efficient (fewer LLM calls)
- ✅ More reliable (validates plan upfront)
- ✅ Easier to debug (see full plan in transcript)
- ✅ Self-healing (automatic error recovery)
- ✅ Prevents infinite loops (max_iterations safety)

**Real Example:**

```
Goal: "Create a 60-minute intermediate Pilates class"

PLAN Phase:
  Step 1: Get user preferences (output: user_prefs)
  Step 2: Search for movements (input: user_prefs.difficulty) (output: movements)
  Step 3: Validate sequence safety (input: movements) (output: is_valid)
  Step 4: Add transitions (input: movements) (output: complete_class)

EXECUTE Phase:
  [Executing Step 1] Tool: getUserProfile → Success
  [Executing Step 2] Tool: searchMovements(difficulty="intermediate") → Success
  [Executing Step 3] Tool: validateSequence(movements=[...]) → Success
  [Executing Step 4] Tool: addTransitions(movements=[...]) → Success

Result: Complete class generated ✓
```

---

### 3.2 LLM Integration (LiteLLM)

LiteLLM provides a **unified interface** for 100+ LLM providers - write code once, switch models without code changes.

**The Vendor Lock-In Problem:**

Different AI providers have different APIs:

```python
# OpenAI
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}]
)

# Anthropic (different API!)
response = anthropic.messages.create(
    model="claude-sonnet-4",
    messages=[{"role": "user", "content": "Hello"}]
)

# Google (different API again!)
response = genai.GenerativeModel("gemini-2.0-flash-exp").generate_content("Hello")
```

If you want to switch providers, you have to refactor all your code!

**LiteLLM Solution:**

```python
from agents.llm.litellm import LiteLLM

# OpenAI
llm = LiteLLM(model="gpt-4", temperature=0.2)

# Switch to Anthropic (no code changes!)
llm = LiteLLM(model="claude-sonnet-4", temperature=0.2)

# Switch to Google (still no code changes!)
llm = LiteLLM(model="gemini-2.0-flash-exp", temperature=0.2)

# Switch to local model (via Ollama)
llm = LiteLLM(model="ollama/llama2", temperature=0.2)

# ALL use the same interface:
response = llm.prompt("What is 2+2?")
```

**Analogy: Universal Power Adapter**

- Different countries have different power outlets
- But with a universal adapter, your phone works anywhere
- LiteLLM is the universal adapter for AI models

**Common Methods:**

```python
# Single-turn prompt
response = llm.prompt("What is the capital of France?")

# Multi-turn conversation
response = llm.completion([
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "4"},
    {"role": "user", "content": "What about 3+3?"}
])

# Structured JSON output
response = llm.prompt_to_json("Return JSON: {\"sum\": <2+2>}")
# Returns: {"sum": 4}
```

**Supported Providers:**

| Provider | Models | Example |
|----------|--------|---------|
| OpenAI | GPT-3.5, GPT-4, GPT-4 Turbo | `LiteLLM(model="gpt-4")` |
| Anthropic | Claude 3.5 Sonnet, Claude 4 | `LiteLLM(model="claude-sonnet-4")` |
| Google | Gemini 1.5, Gemini 2.0 | `LiteLLM(model="gemini-2.0-flash-exp")` |
| Azure OpenAI | Same as OpenAI | `LiteLLM(model="azure/gpt-4")` |
| Local (Ollama) | Llama 2, Mistral, etc. | `LiteLLM(model="ollama/llama2")` |

**Why This Matters for Bassline:**

1. **Not Locked In** - Can switch from OpenAI to Anthropic if better/cheaper
2. **Cost Optimization** - Use GPT-4 for complex tasks, GPT-3.5 for simple tasks
3. **Future-Proof** - New providers work immediately (just change model name)
4. **Local Development** - Use free Ollama models for testing, paid models for production

---

### 3.3 Tool Management (JustInTimeToolingBase)

Just-In-Time Tooling loads tools dynamically based on what's needed, not loading everything upfront.

**The "Tool Explosion" Problem:**

Imagine giving an agent access to ALL 1500 tools in Jentic's marketplace:

```
Agent context:
  Tool 1: Send email
  Tool 2: Create calendar event
  Tool 3: Search Google
  Tool 4: Query database
  ...
  Tool 1498: Generate invoice
  Tool 1499: Book flight
  Tool 1500: Order pizza

Agent: "Uh... I need to search for Pilates movements... which tool do I use?"
```

**Problems:**
- ❌ Context window fills up (8K tokens just for tool descriptions!)
- ❌ Agent gets confused by irrelevant tools
- ❌ Slower reasoning (must consider 1500 options)
- ❌ Higher costs (more tokens = more money)

**Just-In-Time Solution:**

```
Agent: "I need to search for movements"
         ↓
JIT System: "Here are 3 relevant tools:"
  1. searchMovements (Pilates database)
  2. searchExercises (general fitness database)
  3. searchWorkouts (workout library)
         ↓
Agent: "searchMovements looks perfect!"
         ↓
JIT System: *loads full tool details*
         ↓
Agent: *executes tool*
```

**Implementation Pattern:**

```python
from agents.tools.base import JustInTimeToolingBase, ToolBase

class PilatesToolProvider(JustInTimeToolingBase):
    """
    JENTIC PATTERN: Implement Just-In-Time Tooling interface
    """

    def search(self, query: str, *, top_k: int = 10) -> List[ToolBase]:
        """
        Search tools by query - returns lightweight summaries only
        """
        results = []
        for tool in self.TOOLS:
            if query.lower() in tool.name.lower() or query.lower() in tool.description.lower():
                results.append(tool)
        return results[:top_k]  # Return top 10 matches

    def load(self, tool: ToolBase) -> ToolBase:
        """
        Load full tool details when agent selects it
        """
        # In this case, tools are already fully loaded
        # But could fetch from database or API here
        return tool

    def execute(self, tool: ToolBase, parameters: Dict[str, Any]) -> Any:
        """
        Execute the tool with given parameters
        """
        url = f"{self.BACKEND_URL}{tool.endpoint}"
        response = requests.get(url, params=parameters)
        return response.json()
```

**Analogy: Toolbox Organization**

**Bad (Load All Tools):**
- Dump 1500 tools on the floor
- Agent tries to find right wrench
- Half the tools aren't even relevant
- Takes 10 minutes to find the right one

**Good (Just-In-Time):**
- Agent says "I need to tighten a bolt"
- You hand them 3 wrenches that fit
- Agent picks the right size
- Job done in 30 seconds

**Benefits:**
- ✅ Smaller context (only relevant tools)
- ✅ Faster reasoning (fewer options to consider)
- ✅ Lower costs (fewer tokens)
- ✅ Unlimited tool catalog (can have 10,000+ tools without performance hit)

**How Jentic's Marketplace Works:**

Jentic provides 1500+ pre-built tools (Gmail, Slack, Salesforce, etc.):

```python
from agents.tools.jentic import JenticToolProvider

# Access Jentic's tool marketplace
jentic_tools = JenticToolProvider(api_key=JENTIC_API_KEY)

# Agent searches: "send email"
tools = jentic_tools.search("send email", top_k=5)
# Returns: [GmailSendTool, OutlookSendTool, SendGridTool, ...]

# Agent selects: GmailSendTool
tool = jentic_tools.load(tools[0])

# Agent executes
result = jentic_tools.execute(tool, {"to": "user@example.com", "subject": "..."})
```

**For Bassline:** We implement our own tools (Pilates-specific), but could also integrate Jentic's marketplace if we need email/Slack/etc.

---

### 3.4 Agent Lifecycle (Plan→Execute→Reflect)

StandardAgent operates in a continuous 3-phase loop that enables self-healing and adaptive behavior.

**The Three Phases:**

```
┌──────────────────────────────────────────────────────────────┐
│ PHASE 1: PLAN                                                │
│                                                              │
│ "Given this goal and available tools, what steps do I need  │
│  to take to accomplish it?"                                  │
│                                                              │
│ LLM generates:                                               │
│   Step 1: Get user preferences → outputs: user_prefs        │
│   Step 2: Search movements (needs: user_prefs) → movements  │
│   Step 3: Validate sequence (needs: movements) → is_valid   │
│                                                              │
│ Agent validates plan:                                        │
│   ✓ All required inputs available                          │
│   ✓ Tool dependencies correct                              │
│   ✓ Output names match input needs                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 2: EXECUTE                                             │
│                                                              │
│ For each step in plan:                                       │
│   1. Search for relevant tools (JIT tooling)                │
│   2. Select best tool based on step description             │
│   3. Generate parameters from memory/context                │
│   4. Execute tool                                            │
│   5. Store output in memory with step name                  │
│   6. If success → continue to next step                     │
│   7. If error → go to REFLECT phase                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 3: REFLECT (only if error occurred)                   │
│                                                              │
│ "This step failed. Why? How can I fix it?"                  │
│                                                              │
│ LLM analyzes error and decides recovery strategy:           │
│                                                              │
│   Option 1: retry_params                                    │
│   "Wrong parameters - try different values"                 │
│   Example: Retry search with different difficulty level    │
│                                                              │
│   Option 2: change_tool                                     │
│   "Wrong tool - try a different one"                        │
│   Example: Use searchMovementsAdvanced instead             │
│                                                              │
│   Option 3: rephrase_step                                   │
│   "Step description unclear - rephrase it"                  │
│   Example: "Search 10 intermediate movements" → more clear │
│                                                              │
│   Option 4: give_up                                         │
│   "Unrecoverable error - report to user"                    │
│   Example: Backend API is down (can't fix)                 │
│                                                              │
│ If not give_up → retry step with fix                        │
│ If max_retries exceeded → give_up                           │
└──────────────────────────────────────────────────────────────┘
```

**Concrete Example:**

```
User Request: "Create a 60-minute intermediate Pilates class"

┌──────────────────────────────────────────────────────────┐
│ PLAN PHASE                                               │
└──────────────────────────────────────────────────────────┘

Agent generates plan:
  Step 1: Get user profile (output: user_id, preferences)
  Step 2: Search movements (input: preferences.difficulty)
  Step 3: Validate sequence (input: movements)
  Step 4: Format class (input: movements, user_id)

┌──────────────────────────────────────────────────────────┐
│ EXECUTE PHASE                                            │
└──────────────────────────────────────────────────────────┘

[Step 1] Get user profile
  Tool search: "user profile" → Found getUserProfile
  Execute: getUserProfile(user_id="123")
  Result: {preferences: {difficulty: "intermediate"}}
  Store: memory["user_prefs"] = result
  ✓ Success → Continue

[Step 2] Search movements
  Tool search: "search movements" → Found searchMovements
  Parameters: difficulty = memory["user_prefs"]["preferences"]["difficulty"]
  Execute: searchMovements(difficulty="intermediate", limit=15)
  Result: ERROR - API returned 500
  ✗ Error → Go to REFLECT

┌──────────────────────────────────────────────────────────┐
│ REFLECT PHASE                                            │
└──────────────────────────────────────────────────────────┘

Error: "API returned 500 Internal Server Error"

LLM analyzes:
  "The API endpoint is experiencing issues. This is likely temporary.
   Decision: retry_params with timeout parameter"

Retry Step 2 with modified params:
  Execute: searchMovements(difficulty="intermediate", limit=15, timeout=10)
  Result: [...] (20 movements returned)
  ✓ Success → Continue

[Step 3] Validate sequence
  ...continues normally

[Step 4] Format class
  ...continues normally

Final Result: Complete 60-minute class returned to user ✓
```

**Agent State Machine:**

```
READY ──────────→ BUSY ──────────→ READY
  ↑               (solving)           │
  │                  │                │
  │                  ↓                │
  │            NEEDS_ATTENTION ←──────┘
  │          (unrecoverable error)
  │                  │
  └──────────────────┘
      (user intervenes)
```

**States:**
- `READY` - Agent idle, waiting for goals
- `BUSY` - Agent actively solving a goal
- `NEEDS_ATTENTION` - Agent encountered unrecoverable error, needs human help
- Return to `READY` after completing goal or user resolves error

**Why This Is Powerful:**

1. **Self-Healing** - Automatically recovers from errors (retry_params, change_tool)
2. **Adaptive** - Can try different approaches when one fails
3. **Transparent** - Full reasoning transcript shows exactly what happened
4. **Safe** - max_iterations and max_retries prevent infinite loops
5. **Observable** - Built-in logging for debugging and compliance

---

## 4. Integration with Bassline

### 4.1 BasslinePilatesCoachAgent Implementation

[Content to be consolidated from audit]

### 4.2 Composition Pattern

[Content to be consolidated from audit]

### 4.3 Educational Annotations

[Content to be consolidated from audit]

### 4.4 Real Code vs Stubs

[Content to be consolidated from audit]

---

## 5. Arazzo Workflows

### 5.1 Workflow DSL Syntax

[Content to be consolidated from audit]

### 5.2 Creating Workflows

[Content to be consolidated from audit]

### 5.3 Testing & Debugging

[Content to be consolidated from audit]

### 5.4 OpenAPI Specification Integration

[Content to be consolidated from audit]

---

## 6. Practical Examples

### 6.1 Complete Class Generation Workflow

[Content to be consolidated from audit]

### 6.2 Music Selection Integration

[Content to be consolidated from audit]

### 6.3 Error Handling Patterns

[Content to be consolidated from audit]

### 6.4 Before/After Code Comparisons

[Content to be consolidated from audit]

---

## 7. Best Practices

### 7.1 When to Use Arazzo vs. Custom Code

[Content to be consolidated from audit]

### 7.2 Scalability Patterns

[Content to be consolidated from audit]

### 7.3 Testing Strategies

[Content to be consolidated from audit]

### 7.4 Code Quality Standards

[Content to be consolidated from audit]

---

## 8. Advanced Topics

### 8.1 Multi-Agent Orchestration

[Content to be consolidated from audit]

### 8.2 Performance Optimization

[Content to be consolidated from audit]

### 8.3 Observability & Logging

[Content to be consolidated from audit]

### 8.4 Hybrid Approaches (Arazzo + StandardAgent)

[Content to be consolidated from audit]

---

## 9. Troubleshooting

### 9.1 Common Issues

[Content to be consolidated from audit]

### 9.2 Debugging Workflows

[Content to be consolidated from audit]

### 9.3 Testing Failed Workflows

[Content to be consolidated from audit]

---

## 10. Reference

### 10.1 API Documentation

[Content to be consolidated from audit]

### 10.2 Configuration Options

[Content to be consolidated from audit]

### 10.3 External Resources

**Jentic GitHub Repositories:**
- Standard Agent: https://github.com/jentic/standard-agent
- Arazzo Engine: https://github.com/jentic/arazzo-engine

**PyPI Packages:**
- standard-agent: https://pypi.org/project/standard-agent/
- arazzo-runner: https://pypi.org/project/arazzo-runner/
- jentic: https://pypi.org/project/jentic/

**Documentation:**
- Arazzo Specification: https://spec.openapis.org/arazzo/latest.html
- OpenAPI 3.0 Specification: https://spec.openapis.org/oas/latest.html
- LiteLLM Documentation: https://docs.litellm.ai/

---

**Document Status:** 📝 Template Created - Content Consolidation In Progress

**Next Steps:**
1. ✅ Audit completed (8 Jentic docs reviewed)
2. ✅ Master index structure created
3. ⏳ Consolidate content by topic (convert Q&A to topic format)
4. ⏳ Archive old documentation
5. ⏳ Update CLAUDE.md references
6. ⏳ Verify completeness
