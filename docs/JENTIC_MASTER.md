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

Our Pilates agent extends Jentic's StandardAgent to add domain-specific logic while inheriting proven reasoning patterns.

**File:** `orchestrator/agent/bassline_agent.py`

**Complete Implementation:**

```python
from agents.standard_agent import StandardAgent
from agents.llm.litellm import LiteLLM
from agents.reasoner.rewoo import ReWOOReasoner
from .tools import BasslinePilatesTools
import os

class BasslinePilatesCoachAgent(StandardAgent):
    """
    JENTIC PATTERN: Inherit from StandardAgent for Plan→Execute→Reflect

    BASSLINE CUSTOM: Pilates-specific domain knowledge and tools

    What we get from Jentic (inherited):
    - ✅ solve() method - Main entry point for agentic reasoning
    - ✅ State management - READY, BUSY, ERROR states
    - ✅ Memory handling - Conversation history and context
    - ✅ Decision logging - For compliance and monitoring
    - ✅ Observability - Built-in logging and tracing

    What we add (Bassline-specific):
    - ✅ Pilates system prompt (instructor expertise)
    - ✅ Pilates tools (movement search, validation, workflows)
    - ✅ Safety constraints (spinal progression, muscle balance)
    - ✅ OpenAI GPT-4 configuration
    """

    def __init__(self):
        # JENTIC PATTERN: Configure LLM using LiteLLM abstraction
        self.llm = LiteLLM(
            model="gpt-4-turbo",
            temperature=0.7,
            max_tokens=4000,
            # BASSLINE CUSTOM: Pilates instructor system prompt
            system_prompt="""
            You are a certified Pilates instructor with 20 years of experience
            specializing in Joseph Pilates' classical mat method.

            Your expertise includes:
            - All 34 classical Pilates mat movements
            - Safe movement sequencing (spinal progression rules)
            - Muscle balance optimization
            - Injury modifications and contraindications
            - Breath work and mindfulness integration

            When generating classes, you MUST:
            1. Prioritize student safety (flexion before extension)
            2. Balance muscle groups (no more than 40% load per group)
            3. Adapt to student's experience level
            4. Include proper warm-up and cool-down
            5. Provide clear, encouraging cues

            Your teaching style:
            - Clear and precise
            - Encouraging and supportive
            - Safety-conscious
            - Anatomically informed

            CRITICAL RULES (NEVER VIOLATE):
            - NEVER violate spinal progression (flexion before extension)
            - ALWAYS check contraindications
            - NEVER exceed student's declared difficulty level
            - ALWAYS include breathing cues
            """
        )

        # BASSLINE CUSTOM: Configure Pilates-specific tools
        bassline_api_url = os.getenv("BASSLINE_API_URL", "http://localhost:8000")
        self.tools = BasslinePilatesTools(bassline_api_url=bassline_api_url)

        # JENTIC PATTERN: Configure memory backend
        # Simple dict for now; could use Redis for persistence
        self.memory = {
            "conversation_history": [],
            "context": {},
            "user_preferences": {}
        }

        # JENTIC PATTERN: Configure ReWOO reasoner
        self.reasoner = ReWOOReasoner(
            llm=self.llm,
            tools=self.tools,
            memory=self.memory,
            max_iterations=20,  # Safety limit
            max_retries=2       # Retry failed steps twice
        )

        # JENTIC PATTERN: Initialize parent StandardAgent
        # This activates all inherited functionality
        super().__init__(
            llm=self.llm,
            tools=self.tools,
            memory=self.memory,
            reasoner=self.reasoner
        )

    # solve() method inherited from StandardAgent ✓
    # No need to implement reasoning loop - we inherit it!
```

**Key Architectural Decisions:**

1. **Inheritance Over Implementation**
   - We extend StandardAgent, not reimplement it
   - Get 300+ lines of reasoning logic for free
   - Only write domain-specific code (~50 lines)

2. **Composition Pattern**
   - Agent composed from: LLM + Tools + Memory + Reasoner
   - Each component is swappable independently
   - Example: Switch LLM from GPT-4 to Claude without changing agent code

3. **System Prompt as Configuration**
   - Pilates expertise defined in natural language
   - Easy to modify without changing code
   - Can be loaded from file for version control

4. **Environment-Based Configuration**
   - Backend URL from environment variable
   - Works in development (localhost) and production (Render)
   - No hardcoded URLs in code

---

### 4.2 Composition Pattern

Jentic's composition pattern allows mixing and matching components without tight coupling.

**Composition vs Configuration:**

**Bad (Configuration Monolith):**
```python
# Everything hardcoded in one class
class PilatesAgent:
    def __init__(self):
        self.model = "gpt-4"  # Hardcoded
        self.temperature = 0.7  # Hardcoded
        self.tools = self._init_tools()  # Hardcoded
        self.reasoning_strategy = "rewoo"  # Hardcoded

    def solve(self, goal):
        # Custom reasoning loop (200+ lines)
        # Reinvents StandardAgent
        ...
```

**Good (Composition Pattern):**
```python
# Each component is independent
llm = LiteLLM(model="gpt-4", temperature=0.7)  # Swappable
tools = BasslinePilatesTools()  # Swappable
memory = {}  # Swappable
reasoner = ReWOOReasoner(llm, tools, memory)  # Swappable

agent = StandardAgent(llm, tools, memory, reasoner)  # Composed!
```

**Benefits of Composition:**

1. **Swap Components Easily**

   ```python
   # Try different LLM
   llm_gpt4 = LiteLLM(model="gpt-4")
   llm_claude = LiteLLM(model="claude-sonnet-4")

   # Compare performance
   agent_gpt4 = StandardAgent(llm_gpt4, tools, memory, reasoner)
   agent_claude = StandardAgent(llm_claude, tools, memory, reasoner)
   ```

2. **Test Components Independently**

   ```python
   # Test tools without LLM
   tool = tools.search("search movements")[0]
   result = tools.execute(tool, {"difficulty": "intermediate"})

   # Test reasoner with mock LLM
   mock_llm = MockLLM()
   reasoner = ReWOOReasoner(mock_llm, tools, memory)
   ```

3. **Reuse Components Across Projects**

   ```python
   # Same LLM config for all agents
   llm_config = LiteLLM(model="gpt-4", temperature=0.7)

   pilates_agent = PilatesAgent(llm=llm_config, ...)
   yoga_agent = YogaAgent(llm=llm_config, ...)
   nutrition_agent = NutritionAgent(llm=llm_config, ...)
   ```

4. **Add Features Without Breaking Existing Code**

   ```python
   # Add Redis memory without changing agent
   redis_memory = RedisMemory(redis_url=REDIS_URL)
   agent = StandardAgent(llm, tools, redis_memory, reasoner)
   # Agent automatically uses Redis instead of dict
   ```

**Composition in BasslinePilatesCoachAgent:**

```python
class BasslinePilatesCoachAgent(StandardAgent):
    def __init__(self):
        # STEP 1: Create independent components
        llm = LiteLLM(...)           # Component 1
        tools = BasslinePilatesTools(...)  # Component 2
        memory = {}                   # Component 3
        reasoner = ReWOOReasoner(...) # Component 4

        # STEP 2: Compose agent from components
        super().__init__(llm, tools, memory, reasoner)

        # Agent now has all StandardAgent capabilities
        # Plus our Pilates-specific components
```

**Why This Matters:**

- ✅ **Testability**: Test each component in isolation
- ✅ **Flexibility**: Swap components without refactoring
- ✅ **Reusability**: Same components work in different agents
- ✅ **Maintainability**: Update one component, all agents benefit

---

### 4.3 Educational Annotations

All Jentic integration code includes educational annotations to distinguish Jentic patterns from Bassline customizations.

**Annotation Standard:**

```python
# ✅ JENTIC PATTERN: <explanation>
# Describes what comes from Jentic's architecture

# ✅ BASSLINE CUSTOM: <explanation>
# Describes what we added for Pilates domain

# ❌ ANTI-PATTERN: <explanation>
# Shows what NOT to do (with justification)
```

**Example from `bassline_agent.py`:**

```python
class BasslinePilatesCoachAgent(StandardAgent):
    """
    ✅ JENTIC PATTERN: Inherit from StandardAgent

    EXPLANATION: By extending StandardAgent, we get:
    - Plan→Execute→Reflect reasoning loop (proven pattern)
    - State management (READY, BUSY, ERROR)
    - Memory handling (conversation history)
    - Decision logging (EU AI Act compliance)
    - Observability (logging and tracing)

    We don't reinvent these - we inherit them!
    """

    def __init__(self):
        # ✅ JENTIC PATTERN: Use LiteLLM for vendor independence
        self.llm = LiteLLM(model="gpt-4-turbo", temperature=0.7)

        # ✅ BASSLINE CUSTOM: Pilates-specific tools
        # These wrap our backend APIs (movements, sequences, etc.)
        self.tools = BasslinePilatesTools(bassline_api_url=...)

        # ✅ JENTIC PATTERN: Use ReWOO reasoner
        # ReWOO = Reasoning WithOut Observation
        # Proven reasoning strategy from research
        self.reasoner = ReWOOReasoner(llm=self.llm, tools=self.tools, ...)

        # ✅ JENTIC PATTERN: Composition via super().__init__()
        # Activates all StandardAgent functionality
        super().__init__(llm=self.llm, tools=self.tools, ...)
```

**Example from `tools.py`:**

```python
class BasslinePilatesTools(JustInTimeToolingBase):
    """
    ✅ JENTIC PATTERN: Inherit from JustInTimeToolingBase

    EXPLANATION: Just-In-Time tooling means:
    - Don't load all 1500 tools upfront
    - Search for relevant tools when needed
    - Only load full details when selected
    - Keeps context small and focused
    """

    def __init__(self, bassline_api_url: str):
        # ✅ BASSLINE CUSTOM: Store backend URL
        self.bassline_api_url = bassline_api_url

        # ✅ JENTIC PATTERN: Initialize Arazzo runner
        # Arazzo = declarative workflow engine
        # Workflows are tools in our system!
        workflow_path = "../arazzo/workflows/assemble_pilates_class_v1.yaml"
        self.arazzo_runner = ArazzoRunner.from_arazzo_path(workflow_path)

    def list_tools(self) -> List[Dict]:
        """
        ✅ JENTIC PATTERN: Required method from JustInTimeToolingBase

        Returns lightweight tool descriptions for LLM to browse.
        """
        return [
            {
                "id": "assemble_pilates_class",
                # ⚠️ IMPORTANT: This description is a PROMPT to the LLM
                # Write it to help LLM decide when to use this tool
                "description": """
                Run the complete Pilates class assembly workflow.

                Use this when user asks for:
                - "Generate a complete class"
                - "Create a full session"
                - "Plan my Pilates workout"

                This orchestrates 8 steps automatically:
                1. Get user profile
                2. Get preparation script
                3. Get warmup routine
                4. Generate AI movement sequence
                5. Select music playlist
                6. Get cooldown sequence
                7. Get closing meditation
                8. Get homecare advice

                Returns complete 6-section class ready for playback.
                """
            }
        ]
```

**Purpose of Annotations:**

1. **Educational Goal**: Help you learn Jentic patterns for client relationship
2. **Maintainability**: Future developers understand why code is structured this way
3. **Knowledge Transfer**: Can explain to Jentic team what we learned
4. **Pattern Library**: Reusable examples for future projects

**Annotation Checklist:**

Every Jentic integration file should have:
- [ ] File-level docstring explaining JENTIC vs BASSLINE
- [ ] Class-level docstring explaining inheritance/interface
- [ ] Method-level comments for key Jentic patterns
- [ ] Inline comments for non-obvious design decisions

---

### 4.4 Real Code vs Stubs

**Critical Decision:** Use real Jentic libraries, not placeholder stubs.

**What Are Stubs?**

Stubs = Fake code written for learning purposes only

**Example Stub (Bad):**

```python
# ❌ STUB: Pretend StandardAgent (doesn't actually work)
class FakeStandardAgent:
    def solve(self, goal):
        return "I'm just pretending to be an agent"
        # This doesn't actually do Plan→Execute→Reflect
        # It's a learning placeholder, not production code
```

**Example Real Code (Good):**

```python
# ✅ REAL: Actual StandardAgent from Jentic's GitHub
from agents.standard_agent import StandardAgent

class BasslinePilatesCoachAgent(StandardAgent):
    # Inherits real Plan→Execute→Reflect reasoning
    # Used by Fortune 500 companies in production
    # Proven, battle-tested code
    pass
```

**Why Stubs Are Bad:**

1. **Waste of Time**
   - Spend weeks building fake code
   - Then throw it away and rebuild with real code
   - Two development cycles instead of one

2. **No Production Value**
   - Stubs don't work for users
   - Can't serve customers while learning
   - Theory only, no practical benefit

3. **Shallow Learning**
   - Don't encounter real integration challenges
   - Don't learn edge cases and gotchas
   - Miss deep understanding from production experience

4. **Delayed Feedback**
   - Don't know if integration works until you try real code
   - Assumptions about how Jentic works might be wrong
   - Discover issues late in development

**Why Real Code Is Better:**

1. **Dual Value**
   - Serve customers immediately ✓
   - Learn Jentic architecture simultaneously ✓
   - One development cycle serves both goals

2. **Deep Learning**
   - Encounter real integration challenges
   - Learn by solving actual problems
   - Understand edge cases and limitations

3. **Fast Feedback**
   - Know immediately if integration works
   - Can ask Jentic team informed questions
   - Iterate based on real experience

4. **Production Quality**
   - Code written today works in production
   - No "throw away and rebuild" phase
   - Professional-grade from day one

**Our Approach (Real Code):**

```python
# orchestrator/requirements.txt
# ✅ REAL: Install from Jentic's GitHub repos
git+https://github.com/jentic/standard-agent.git@main
git+https://github.com/jentic/arazzo-engine.git@main#subdirectory=runner

# ❌ NOT STUBS: We don't copy-paste Jentic code
# ❌ NOT PLACEHOLDERS: We don't write fake versions
# ✅ REAL LIBRARIES: We use Jentic as a dependency
```

**Installation:**

```bash
# Install real Jentic libraries
cd orchestrator
pip install -r requirements.txt

# This installs:
# - StandardAgent (151 lines of proven reasoning code)
# - ReWOOReasoner (326 lines of Plan→Execute→Reflect)
# - ArazzoRunner (809 lines of workflow execution)
# - All dependencies and interfaces

# We get ~1300 lines of production code for free!
```

**How We Use Real Code:**

```python
# ✅ IMPORT from Jentic library (not our code)
from agents.standard_agent import StandardAgent
from agents.reasoner.rewoo import ReWOOReasoner
from agents.llm.litellm import LiteLLM
from agents.tools.base import JustInTimeToolingBase

# ✅ EXTEND Jentic classes (don't copy them)
class BasslinePilatesCoachAgent(StandardAgent):
    pass

# ✅ IMPLEMENT Jentic interfaces (don't reinvent them)
class BasslinePilatesTools(JustInTimeToolingBase):
    pass

# ✅ USE Jentic components (don't rewrite them)
reasoner = ReWOOReasoner(llm, tools, memory)
```

**Verification:**

You can verify we're using real code by checking:

```bash
# Check installed packages
pip list | grep -E "standard-agent|arazzo-runner"

# Check import sources
python -c "import agents.standard_agent; print(agents.standard_agent.__file__)"
# Output: .../site-packages/agents/standard_agent.py (from Jentic)

# Check it's not our code
ls orchestrator/agent/
# Should NOT contain standard_agent.py (we don't have a copy)
```

**Analogy: Toy Car vs Real Car**

- **Toy Car (Stub)**: Learn how cars work, but can't drive to work
- **Real Car (Jentic)**: Learn by actually driving to work

We chose the real car approach.

**Impact on Dual Goals:**

| Goal | With Stubs | With Real Code |
|------|-----------|----------------|
| **Customer Traction** | ❌ Delayed (rebuild later) | ✅ Immediate (works now) |
| **Learning Jentic** | ⚠️ Shallow (theory only) | ✅ Deep (real integration) |
| **Client Relationship** | ⚠️ Weak (no experience) | ✅ Strong (production knowledge) |
| **Future Projects** | ❌ Can't reuse stubs | ✅ Can reuse patterns |

**Conclusion:** Using real Jentic code serves both project goals simultaneously and provides production value from day one.

---

## 5. Arazzo Workflows

### 5.1 Workflow DSL Syntax

Arazzo uses YAML to define declarative workflows with a specific syntax for steps, parameters, and data flow.

**Basic Workflow Structure:**

```yaml
arazzo: 1.0.0  # Arazzo specification version

info:
  title: Workflow Name
  version: 1.0.0
  description: What this workflow does

sourceDescriptions:
  # Link to OpenAPI specs that define available operations
  - name: api-name
    url: ./path/to/openapi.yaml
    type: openapi

workflows:
  - workflowId: unique_workflow_id
    description: What this workflow accomplishes

    inputs:
      # Schema for workflow input parameters
      type: object
      properties:
        param_name:
          type: string
        param_number:
          type: integer

    steps:
      # Sequential steps that execute operations
      - stepId: step_1
        operationId: operationFromOpenAPI
        parameters:
          - name: param_name
            in: query
            value: $inputs.param_name
        outputs:
          result_name: $response.body.field

      - stepId: step_2
        operationId: anotherOperation
        parameters:
          - name: input_data
            in: body
            value: $steps.step_1.outputs.result_name

    outputs:
      # Final workflow outputs
      final_result:
        value: $steps.step_2.outputs.data
```

**Key Components:**

1. **sourceDescriptions**: Link to OpenAPI specs
   - Arazzo reads these to know what operations are available
   - `operationId` in steps references operations from OpenAPI

2. **inputs**: Workflow parameters
   - Defines what data workflow needs
   - Uses JSON Schema for validation

3. **steps**: Sequential operations
   - Each step calls an API operation
   - Steps execute in order (unless using dependsOn)

4. **parameters**: Step-level inputs
   - Map workflow inputs to API parameters
   - Use runtime expressions (`$inputs`, `$steps`, etc.)

5. **outputs**: Step-level results
   - Extract data from API responses
   - Store for use in later steps

6. **workflows.outputs**: Final results
   - Aggregates data from multiple steps
   - Returns to caller

**Runtime Expression Syntax:**

| Expression | Description | Example |
|------------|-------------|---------|
| `$inputs.X` | Access workflow input | `$inputs.user_id` |
| `$steps.stepId.outputs.X` | Access previous step output | `$steps.getUserProfile.outputs.email` |
| `$response.body.X` | Access HTTP response body | `$response.body.data.movements` |
| `$response.statusCode` | Access HTTP status | `$response.statusCode` |
| `$response.headers.X` | Access response header | `$response.headers.Content-Type` |
| `$workflows.workflowId.outputs.X` | Access dependency workflow output | `$workflows.prepare.outputs.config` |

**Data Types:**

```yaml
# String
value: "hello"
value: $inputs.name

# Integer
value: 42
value: $inputs.count

# Boolean
value: true
value: $inputs.is_active

# Array
value: ["a", "b", "c"]
value: $steps.search.outputs.items

# Object
value: {key: "value"}
value: $steps.fetch.outputs.user
```

**Conditional Logic:**

```yaml
# Simple success criteria
successCriteria:
  - condition: $statusCode == 200
    type: simple

# Multiple conditions (AND)
successCriteria:
  - condition: $statusCode == 200
    type: simple
  - condition: $response.body.success == true
    type: simple

# Failure handling
onFailure:
  - name: skip_step
    type: end
  - name: retry_with_fallback
    type: goto
    stepId: fallback_step
```

---

### 5.2 Creating Workflows

Step-by-step guide to creating a production Arazzo workflow.

**Step 1: Define Workflow Inputs**

Identify what data the workflow needs from the caller:

```yaml
workflows:
  - workflowId: assemble_pilates_class
    inputs:
      type: object
      required:
        - user_id
        - difficulty_level
        - target_duration_minutes
      properties:
        user_id:
          type: string
          format: uuid
          description: Authenticated user ID
        difficulty_level:
          type: string
          enum: [Beginner, Intermediate, Advanced]
          description: Class difficulty level
        target_duration_minutes:
          type: integer
          minimum: 15
          maximum: 120
          description: Desired class length
        focus_areas:
          type: array
          items:
            type: string
          description: Optional muscle groups to emphasize
```

**Step 2: Map Input to First API Call**

Create first step that uses workflow inputs:

```yaml
steps:
  - stepId: getUserProfile
    description: Fetch user preferences for personalization
    operationId: getUserProfile  # From OpenAPI spec
    parameters:
      - name: user_id
        in: path
        value: $inputs.user_id  # Runtime expression
    outputs:
      # Extract fields we'll need later
      preferred_music: $response.body.preferences.preferred_music_style
      ai_strictness: $response.body.preferences.ai_strictness
      default_difficulty: $response.body.preferences.default_difficulty
```

**Step 3: Chain Steps with Data Flow**

Each step uses outputs from previous steps:

```yaml
  - stepId: generateSequence
    description: Generate AI-selected movement sequence
    operationId: generateSequence
    parameters:
      - name: user_id
        in: body
        value: $inputs.user_id
      - name: target_duration_minutes
        in: body
        value: $inputs.target_duration_minutes
      - name: difficulty_level
        in: body
        value: $inputs.difficulty_level
      - name: strictness_level
        in: body
        value: $steps.getUserProfile.outputs.ai_strictness  # From step 1!
    outputs:
      movements: $response.body.data.sequence
      muscle_balance: $response.body.data.muscle_balance
      total_duration: $response.body.data.total_duration_minutes
```

**Step 4: Add Parallel Steps (Optional)**

Steps without dependencies can run in parallel:

```yaml
  # Step 3a: Get warmup (independent)
  - stepId: getWarmup
    operationId: getWarmupRoutines
    parameters:
      - name: difficulty
        in: query
        value: $inputs.difficulty_level

  # Step 3b: Get cooldown (independent)
  - stepId: getCooldown
    operationId: getCooldownSequences
    parameters:
      - name: intensity
        in: query
        value: moderate

# Both steps 3a and 3b can run simultaneously
# because neither depends on the other
```

**Step 5: Aggregate Final Outputs**

Collect results from all steps:

```yaml
outputs:
  completeClass:
    value:
      class_id: $steps.saveClass.outputs.class_id
      user_id: $inputs.user_id
      duration_minutes: $steps.generateSequence.outputs.total_duration
      sections:
        preparation: $steps.getPreparation.outputs.script
        warmup: $steps.getWarmup.outputs.routine
        movements: $steps.generateSequence.outputs.movements
        music: $steps.selectMusic.outputs.playlist
        cooldown: $steps.getCooldown.outputs.sequence
        meditation: $steps.getMeditation.outputs.script
        homecare: $steps.getHomecare.outputs.advice
      muscle_balance: $steps.generateSequence.outputs.muscle_balance
```

**Step 6: Add Error Handling**

Handle failures gracefully:

```yaml
  - stepId: selectMusic
    operationId: selectMusic
    parameters:
      - name: duration
        value: $steps.generateSequence.outputs.total_duration
    successCriteria:
      - condition: $statusCode == 200
        type: simple
    onFailure:
      # If music selection fails, continue without music
      - name: use_default_silence
        type: end
        x-note: "Music is optional - class can work without it"
```

**Complete Example: Pilates Class Assembly Workflow**

```yaml
arazzo: 1.0.0
info:
  title: Complete Pilates Class Generation Workflow
  version: 1.0.0
  description: Assembles a complete 6-section Pilates class

sourceDescriptions:
  - name: bassline-api
    url: ../../backend/openapi/bassline_api_v1.yaml
    type: openapi

workflows:
  - workflowId: assemblePilatesClass
    description: Generate complete class with all 6 sections

    inputs:
      type: object
      required: [user_id, difficulty_level, target_duration_minutes]
      properties:
        user_id: {type: string, format: uuid}
        difficulty_level: {type: string, enum: [Beginner, Intermediate, Advanced]}
        target_duration_minutes: {type: integer, minimum: 15, maximum: 120}

    steps:
      # Step 1: Get user preferences
      - stepId: getUserProfile
        operationId: getUserProfile
        parameters:
          - {name: user_id, in: path, value: $inputs.user_id}
        outputs:
          preferredMusic: $response.body.preferences.preferred_music_style

      # Step 2: Get preparation script (Section 1)
      - stepId: getPreparation
        operationId: getPreparationScripts
        parameters:
          - {name: difficulty, in: query, value: $inputs.difficulty_level}
        outputs:
          script: $response.body[0]

      # Step 3: Get warmup routine (Section 2)
      - stepId: getWarmup
        operationId: getWarmupRoutines
        parameters:
          - {name: difficulty, in: query, value: $inputs.difficulty_level}
        outputs:
          routine: $response.body[0]

      # Step 4: Generate AI sequence (Section 3)
      - stepId: generateSequence
        operationId: generateSequence
        parameters:
          - {name: user_id, in: body, value: $inputs.user_id}
          - {name: target_duration_minutes, in: body, value: $inputs.target_duration_minutes}
          - {name: difficulty_level, in: body, value: $inputs.difficulty_level}
        outputs:
          movements: $response.body.data.sequence
          totalDuration: $response.body.data.total_duration_minutes

      # Step 5: Select music
      - stepId: selectMusic
        operationId: selectMusic
        parameters:
          - {name: duration, in: body, value: $steps.generateSequence.outputs.totalDuration}
          - {name: period, in: body, value: $steps.getUserProfile.outputs.preferredMusic}
        outputs:
          playlist: $response.body.data.playlist

      # Step 6: Get cooldown (Section 4)
      - stepId: getCooldown
        operationId: getCooldownSequences
        parameters:
          - {name: intensity, in: query, value: moderate}
        outputs:
          sequence: $response.body[0]

      # Step 7: Get meditation (Section 5)
      - stepId: getMeditation
        operationId: getClosingMeditations
        parameters:
          - {name: theme, in: query, value: body_scan}
        outputs:
          meditation: $response.body[0]

      # Step 8: Get homecare (Section 6)
      - stepId: getHomecare
        operationId: getHomecareAdvice
        parameters:
          - {name: focus_area, in: query, value: spine_care}
        outputs:
          advice: $response.body[0]

    outputs:
      completeClass:
        value:
          sections:
            preparation: $steps.getPreparation.outputs.script
            warmup: $steps.getWarmup.outputs.routine
            movements: $steps.generateSequence.outputs.movements
            music: $steps.selectMusic.outputs.playlist
            cooldown: $steps.getCooldown.outputs.sequence
            meditation: $steps.getMeditation.outputs.meditation
            homecare: $steps.getHomecare.outputs.advice
```

---

### 5.3 Testing & Debugging

**CLI Testing (Fastest):**

```bash
# Install arazzo-runner CLI
pip install arazzo-runner

# Execute workflow with test inputs
arazzo-runner execute-workflow ./assemble_class.arazzo.yaml \
  --workflow-id assemblePilatesClass \
  --inputs '{"user_id": "test-123", "difficulty_level": "Intermediate", "target_duration_minutes": 60}' \
  --log-level DEBUG
```

**Python Testing:**

```python
from arazzo_runner import ArazzoRunner

# Load workflow
runner = ArazzoRunner.from_arazzo_path("./assemble_class.arazzo.yaml")

# Execute with test inputs
result = runner.execute_workflow(
    workflow_id="assemblePilatesClass",
    inputs={
        "user_id": "test-123",
        "difficulty_level": "Intermediate",
        "target_duration_minutes": 60
    }
)

# Check results
if result.status == "workflow_complete":
    print("✓ Workflow succeeded")
    print(f"Outputs: {result.outputs}")
else:
    print(f"✗ Workflow failed: {result.error}")
    print(f"Failed at step: {result.step_outputs}")
```

**Common Debugging Techniques:**

1. **Check Step Outputs:**

   ```python
   # See output from each step
   for step_id, output in result.step_outputs.items():
       print(f"Step {step_id}: {output}")
   ```

2. **Verify Runtime Expressions:**

   ```yaml
   # Add temporary output to see what expression evaluates to
   outputs:
     debug_user_profile: $steps.getUserProfile.outputs
     debug_music_param: $steps.getUserProfile.outputs.preferredMusic
   ```

3. **Validate Against OpenAPI:**

   ```bash
   # Ensure OpenAPI spec is valid
   openapi-spec-validator ./bassline_api_v1.yaml
   ```

4. **Test Individual Operations:**

   ```python
   # Test single operation without full workflow
   result = runner.execute_operation(
       operation_id="getUserProfile",
       inputs={"user_id": "test-123"}
   )
   print(result)
   ```

5. **Enable Debug Logging:**

   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)

   # Now runner logs all HTTP requests/responses
   result = runner.execute_workflow(...)
   ```

**Common Errors & Fixes:**

| Error | Cause | Solution |
|-------|-------|----------|
| "operationId not found" | OpenAPI spec not loaded | Check sourceDescriptions URL |
| "Required memory key 'X' not found" | Step output not defined | Add explicit outputs: declaration |
| "Parameter 'X' required but not provided" | Missing parameter in step | Check OpenAPI spec for required params |
| "Invalid runtime expression" | Syntax error in $expression | Use debugger to print expression value |
| "Workflow timeout" | Step taking too long | Add timeout parameter to step |

---

### 5.4 OpenAPI Specification Integration

Arazzo workflows depend on OpenAPI specs to know what operations are available and how to call them.

**Why OpenAPI is Required:**

Arazzo workflows reference operations by `operationId`, which comes from OpenAPI:

```yaml
# assemble_class.arazzo.yaml
steps:
  - stepId: getUserProfile
    operationId: getUserProfile  # ← Must exist in OpenAPI spec
```

**Creating OpenAPI Spec for Backend:**

**File:** `backend/openapi/bassline_api_v1.yaml`

```yaml
openapi: 3.0.0
info:
  title: Bassline Pilates API
  version: 1.0.0
  description: Backend API for Pilates class generation

servers:
  - url: https://pilates-class-generator-api3.onrender.com
    description: Production
  - url: http://localhost:8000
    description: Local development

paths:
  /api/users/{user_id}/profile:
    get:
      operationId: getUserProfile  # ← Referenced by Arazzo
      summary: Get user profile and preferences
      tags: [Users]
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: User profile retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  user_id: {type: string}
                  email: {type: string}
                  preferences:
                    type: object
                    properties:
                      preferred_music_style: {type: string}
                      ai_strictness: {type: string}
                      default_difficulty: {type: string}

  /api/agents/generate-sequence:
    post:
      operationId: generateSequence
      summary: Generate AI movement sequence
      tags: [AI Agents]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [user_id, target_duration_minutes, difficulty_level]
              properties:
                user_id: {type: string, format: uuid}
                target_duration_minutes: {type: integer, minimum: 15}
                difficulty_level: {type: string, enum: [Beginner, Intermediate, Advanced]}
                strictness_level: {type: string, enum: [Low, Medium, High]}
      responses:
        '200':
          description: Sequence generated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success: {type: boolean}
                  data:
                    type: object
                    properties:
                      sequence: {type: array}
                      muscle_balance: {type: object}
                      total_duration_minutes: {type: integer}

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

**Linking OpenAPI to Arazzo:**

```yaml
# assemble_class.arazzo.yaml
sourceDescriptions:
  - name: bassline-api
    url: ../../backend/openapi/bassline_api_v1.yaml  # Relative path
    type: openapi

# Now workflow can reference operations:
steps:
  - stepId: getUser
    operationId: getUserProfile  # Found in OpenAPI spec
```

**How Arazzo Uses OpenAPI:**

1. **Operation Discovery**: Finds endpoint by `operationId`
   - `getUserProfile` → `GET /api/users/{user_id}/profile`

2. **URL Construction**: Builds complete URL
   - Server: `https://pilates-class-generator-api3.onrender.com`
   - Path: `/api/users/123/profile`
   - Result: `https://pilates-class-generator-api3.onrender.com/api/users/123/profile`

3. **Parameter Validation**: Checks required parameters
   - OpenAPI says `user_id` is required in path
   - Arazzo ensures `value: $inputs.user_id` is provided

4. **Request Building**: Constructs HTTP request
   - Method: `GET` (from OpenAPI)
   - Headers: `Authorization: Bearer <token>` (from security)
   - Body: N/A for GET

5. **Response Parsing**: Validates and extracts data
   - OpenAPI defines response schema
   - Arazzo validates `$response.body` matches schema
   - Extracts fields using JSON paths

**OpenAPI Best Practices:**

1. **Clear operationIds:**
   ```yaml
   # Good
   operationId: getUserProfile

   # Bad
   operationId: get_api_users_user_id_profile
   ```

2. **Detailed Descriptions:**
   ```yaml
   summary: Get user profile and preferences
   description: |
     Retrieves complete user profile including:
     - Personal information
     - Pilates preferences
     - AI strictness settings
     - Music style preferences
   ```

3. **Required vs Optional:**
   ```yaml
   required: [user_id, difficulty_level]  # Must provide
   properties:
     focus_areas: {type: array}  # Optional
   ```

4. **Response Examples:**
   ```yaml
   responses:
     '200':
       content:
         application/json:
           example:
             user_id: "123e4567-e89b-12d3-a456-426614174000"
             preferences:
               preferred_music_style: "Classical"
   ```

**Validation Tools:**

```bash
# Validate OpenAPI spec
openapi-spec-validator ./bassline_api_v1.yaml

# Validate Arazzo workflow
arazzo-runner validate ./assemble_class.arazzo.yaml

# Generate API documentation from OpenAPI
redoc-cli bundle ./bassline_api_v1.yaml -o api-docs.html
```

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
