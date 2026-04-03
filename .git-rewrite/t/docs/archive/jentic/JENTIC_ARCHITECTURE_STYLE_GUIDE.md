# Jentic Architecture Style Guide

**Purpose:** Maintain consistency with Jentic patterns for maximum scalability

**Last Updated:** December 1, 2025
**Status:** ✅ Active Standard for All Development

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Architecture Overview](#architecture-overview)
3. [Where Prompts Live](#where-prompts-live)
4. [Adding New Features](#adding-new-features)
5. [File Organization](#file-organization)
6. [Pattern Library](#pattern-library)
7. [Code Quality Standards](#code-quality-standards)

---

## Core Principles

### 1. **Declarative Over Imperative**
- ✅ Use Arazzo YAML workflows (declarative)
- ❌ Avoid Python orchestration code (imperative)

### 2. **Composition Over Configuration**
- ✅ Compose agents from LLM + Tools + Reasoner
- ❌ Avoid custom reasoning loops

### 3. **Separation of Concerns**
- ✅ Orchestrator reasons, backend executes
- ❌ Avoid mixing high-level logic in backend APIs

### 4. **OpenAPI-First Design**
- ✅ Document APIs in OpenAPI 3.0 spec FIRST
- ❌ Don't build APIs without OpenAPI documentation
- **Why:** Arazzo needs machine-readable API contracts

### 5. **Real Jentic Code, Not Stubs**
- ✅ Use github.com/jentic/standard-agent
- ✅ Use github.com/jentic/arazzo-engine
- ❌ Never copy-paste Jentic code (use as library)

---

## Architecture Overview

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

---

## Where Prompts Live

### Prompt Locations (3 Places)

#### 1. System Prompt (Agent-Level) ⭐ PRIMARY

**File:** `orchestrator/agent/bassline_agent.py`

**Where to add:**

```python
class BasslinePilatesCoachAgent(StandardAgent):
    def __init__(self):
        # Configure LLM with system prompt
        self.llm = LiteLLM(
            model="gpt-4-turbo",
            temperature=0.7,
            max_tokens=4000,
            system_prompt="""
You are a certified Pilates instructor with 20 years of experience.

Your expertise includes:
- Joseph Pilates' 34 classical mat movements
- Sequencing safety rules (flexion before extension)
- Muscle balance optimization
- Injury modifications
- Breath work and mindfulness integration

When generating classes:
1. Always prioritize safety (spinal progression rules)
2. Balance muscle groups throughout the session
3. Adapt to user's experience level
4. Include proper warmup and cooldown
5. Provide clear, encouraging cues

Your teaching style is:
- Clear and precise
- Encouraging and supportive
- Safety-conscious
- Anatomically informed

CRITICAL RULES:
- NEVER violate spinal progression (flexion before extension)
- ALWAYS check contraindications
- NEVER exceed user's declared difficulty level
- ALWAYS include breathing cues
"""
        )

        # ... rest of initialization
```

**Purpose:**
- Sets agent's "personality" and domain expertise
- Guides high-level decision-making
- **Most important prompt to customize per domain**

---

#### 2. Tool Descriptions (Tool-Level) ⭐ FREQUENT CUSTOMIZATION

**File:** `orchestrator/agent/tools.py`

**Where to add:**

```python
def list_tools(self) -> List[Dict[str, Any]]:
    return [
        {
            "id": "assemble_pilates_class",
            "name": "Assemble Complete Pilates Class",
            "description": """
            Run the full class assembly workflow using Arazzo.

            ⚠️ THIS DESCRIPTION IS A PROMPT TO THE LLM ⚠️

            The LLM reads this to decide when to use this tool.
            Be specific about:
            - What the tool does
            - When to use it
            - What inputs it needs
            - What outputs it returns

            This workflow orchestrates 8 steps:
            1. Get user profile → personalization data
            2. Get preparation script → Section 1
            3. Get warmup routine → Section 2
            4. Generate AI sequence → Section 3
            5. Select music playlist → Background music
            6. Get cooldown sequence → Section 4
            7. Get closing meditation → Section 5
            8. Get homecare advice → Section 6

            Returns complete class structure ready for playback.

            Use this when the user asks for:
            - "Generate a complete class"
            - "Create a full session"
            - "Plan my Pilates workout"
            """,
            "schema": {...}
        }
    ]
```

**Purpose:**
- Helps LLM decide which tool to use (Plan phase)
- Provides context for tool parameters
- **Most frequently modified prompt location**

---

#### 3. Reasoner Prompts (Framework-Level) ⚠️ RARELY MODIFIED

**File:** Jentic library (in site-packages, not your code)

**Location:** `site-packages/agents/reasoner/rewoo.py`

**Example (from Jentic's code):**

```python
# Inside ReWOOReasoner class (Jentic code, not yours)
PLAN_PROMPT = """
You are a planning assistant. Break down the following goal into steps.

Goal: {goal}

Available tools:
{tool_descriptions}

Create a plan with numbered steps. Each step should:
1. Describe what to do
2. Specify which tool to use
3. Note what information is needed

Plan:
"""

EXECUTE_PROMPT = """
Execute step {step_number}: {step_description}

Tool: {tool_name}
Parameters: {parameters}

Result:
"""

REFLECT_PROMPT = """
Review the execution results. Did we achieve the goal?

Goal: {goal}
Results: {results}

Assessment:
"""
```

**Purpose:**
- Controls Plan→Execute→Reflect loop behavior
- Standardized across all Jentic projects
- **Only modify if you need custom reasoning patterns**

---

### Prompt Customization Guide

| **Level** | **File** | **Frequency** | **Purpose** |
|-----------|----------|---------------|-------------|
| **System Prompt** | `bassline_agent.py` | Once per domain | Agent personality & expertise |
| **Tool Descriptions** | `tools.py` | Often | Help LLM choose right tool |
| **Reasoner Prompts** | Jentic library | Rarely | Change reasoning behavior |

---

## Adding New Features

### Pattern: Always Start with OpenAPI + Arazzo

#### Example: Add "Injury Modifications" Feature

**Step 1: Backend API Endpoint**

```python
# backend/api/modifications.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/modifications", tags=["modifications"])

@router.get("/injury")
async def get_injury_modifications(injury_type: str):
    """
    Get movement modifications for specific injuries.

    OpenAPI will document this automatically.
    Arazzo will call this via operationId.
    """
    modifications = await db.query(
        "SELECT * FROM injury_modifications WHERE type = ?",
        injury_type
    )
    return {"modifications": modifications}
```

**Step 2: OpenAPI Documentation**

```yaml
# backend/openapi/bassline_api_v1.yaml
paths:
  /api/modifications/injury:
    get:
      operationId: getInjuryModifications  # ← Arazzo finds this
      summary: Get injury-specific modifications
      tags:
        - modifications
      parameters:
        - name: injury_type
          in: query
          required: true
          schema:
            type: string
            enum: [knee, back, shoulder, neck, hip]
      responses:
        '200':
          description: List of modifications
          content:
            application/json:
              schema:
                type: object
                properties:
                  modifications:
                    type: array
                    items:
                      type: object
                      properties:
                        movement_id:
                          type: string
                        original_movement:
                          type: string
                        modified_movement:
                          type: string
                        modification_notes:
                          type: string
```

**Step 3: Arazzo Workflow Step**

```yaml
# orchestrator/arazzo/workflows/assemble_pilates_class_v1.arazzo.yaml
steps:
  # ... existing steps 1-8 ...

  # NEW STEP 9
  - stepId: getInjuryModifications
    description: |
      Get modifications for user's declared injuries.

      Only runs if user has contraindications.

    operationId: getInjuryModifications  # ← References OpenAPI
    parameters:
      - name: injury_type
        in: query
        value: $steps.getUserProfile.outputs.contraindications[0]
    successCriteria:
      - condition: $statusCode == 200
        type: simple
    outputs:
      modifications: $response.body.modifications
    onFailure:
      - name: skipModifications
        type: end
        x-note: "Modifications are optional - continue without them"

# Update workflow outputs
outputs:
  completeClass:
    value:
      # ... existing sections ...

      injuryModifications:
        section: 8
        name: "Injury-Specific Modifications"
        modifications: $steps.getInjuryModifications.outputs.modifications
```

**Step 4: Frontend TypeScript Interface**

```typescript
// frontend/src/services/orchestrator.ts
export interface CompleteClass {
  // ... existing fields ...

  injuryModifications?: {  // NEW
    section: number;
    name: string;
    modifications: Array<{
      movement_id: string;
      original_movement: string;
      modified_movement: string;
      modification_notes: string;
    }>;
  };
}
```

**Done!** No orchestrator code changes needed.

---

### Checklist for New Features

- [ ] **Step 1:** Create backend API endpoint
- [ ] **Step 2:** Document in OpenAPI spec (`bassline_api_v1.yaml`)
- [ ] **Step 3:** Add step to Arazzo workflow (`.arazzo.yaml`)
- [ ] **Step 4:** Update workflow outputs
- [ ] **Step 5:** Update frontend TypeScript interface
- [ ] **Step 6:** Test with orchestrator

**Key:** OpenAPI + Arazzo = No orchestrator code changes

---

## File Organization

### Orchestrator Service

```
orchestrator/
├── agent/
│   ├── bassline_agent.py       # ← Extends StandardAgent (JENTIC PATTERN)
│   │                             # ← Add system prompt here
│   └── tools.py                 # ← Implements JustInTimeToolingBase
│                                  # ← Add tool descriptions here
├── arazzo/
│   └── workflows/
│       └── assemble_pilates_class_v1.arazzo.yaml  # ← Declarative workflows
│                                                     # ← Add workflow steps here
├── main.py                      # FastAPI app
├── requirements.txt             # Jentic libraries from GitHub
└── .env                         # BASSLINE_API_URL, OPENAI_API_KEY
```

### Backend Service

```
backend/
├── api/
│   ├── agents.py                # AI agent endpoints
│   ├── movements.py             # Movement CRUD
│   └── sections.py              # Class section endpoints
├── agents/
│   ├── base_agent.py            # Simple custom base (NOT StandardAgent)
│   ├── sequence_agent.py        # Movement selection logic
│   ├── music_agent.py           # Music recommendation
│   └── meditation_agent.py      # Meditation generation
├── openapi/
│   └── bassline_api_v1.yaml     # ← Complete API specification
│                                  # ← Add new endpoints here
├── models/                      # Pydantic schemas
└── services/                    # Business logic
```

### Frontend

```
frontend/
├── src/
│   ├── services/
│   │   ├── orchestrator.ts      # ← Jentic orchestrator client
│   │   │                          # ← Update TypeScript interfaces here
│   │   └── api.ts               # Direct backend client (fallback)
│   └── components/              # React components
└── .env                         # VITE_ORCHESTRATOR_URL, VITE_USE_ORCHESTRATOR
```

### Documentation

```
docs/
├── JENTIC_ARCHITECTURE_STYLE_GUIDE.md  # ← This file
├── JENTIC_INTEGRATION_COMPLETE_GUIDE.md  # Teaching guide
├── ARCHITECTURE_DECISION_BACKEND_AGENTS.md  # Why backend stays simple
└── SESSION_11_5_COMPLETE_SUMMARY.md  # Integration summary
```

---

## Pattern Library

### Reusable Patterns for New Projects

#### Pattern 1: Agent Composition

**File to Copy:** `orchestrator/agent/bassline_agent.py`

**How to Adapt:**

```python
# 1. Copy file: bassline_agent.py → yoga_agent.py
# 2. Rename class:
class YogaCoachAgent(StandardAgent):  # Was: BasslinePilatesCoachAgent

    def __init__(self):
        # 3. Update system prompt (domain knowledge):
        self.llm = LiteLLM(
            model="gpt-4-turbo",
            system_prompt="""
You are a certified yoga instructor...  # Changed from Pilates

Your expertise includes:
- Hatha, Vinyasa, and Yin yoga styles  # Changed from Pilates movements
- Pranayama (breath work)
- Mindfulness and meditation
- Injury modifications

When creating sequences:
1. Balance effort and ease (sthira and sukha)
2. Follow natural energy flow
3. Include breath synchronization
4. Adapt to student's level

CRITICAL RULES:
- NEVER force students into poses  # Changed from Pilates rules
- ALWAYS cue breathing
- RESPECT student's range of motion
"""
        )

        # 4. Update tools:
        self.tools = YogaTools()  # Changed from BasslinePilatesTools

        # Reasoner and memory stay the same (Jentic pattern)
        self.reasoner = ReWOOReasoner(llm=self.llm, tools=self.tools, memory=self.memory)
        super().__init__(llm=self.llm, tools=self.tools, memory=self.memory, reasoner=self.reasoner)
```

**Time savings:** 3 days instead of 3 weeks

---

#### Pattern 2: Arazzo Workflow Template

**File to Copy:** `orchestrator/arazzo/workflows/assemble_pilates_class_v1.arazzo.yaml`

**How to Adapt:**

```yaml
# 1. Copy file: assemble_pilates_class_v1.arazzo.yaml → assemble_yoga_class_v1.arazzo.yaml

# 2. Update metadata:
info:
  title: Complete Yoga Class Generation Workflow  # Changed from Pilates

# 3. Update sourceDescriptions:
sourceDescriptions:
  - name: yoga-api  # Changed from bassline-api
    url: ../../backend/openapi/yoga_api_v1.yaml

# 4. Update workflow steps (keep same structure):
steps:
  - stepId: getUserProfile
    operationId: getUserProfile  # Same pattern

  - stepId: getOpeningMeditation  # Changed from getPreparationScript
    operationId: getOpeningMeditation  # NEW endpoint

  - stepId: generateYogaSequence  # Changed from generateSequence
    operationId: generateYogaSequence  # NEW endpoint

  # ... continue adapting steps

# 5. Runtime expressions stay the same (data flow pattern reused):
outputs:
  completeClass:
    value:
      userId: $steps.getUserProfile.outputs.userId  # Same pattern
      openingMeditation: $steps.getOpeningMeditation.outputs.meditation
```

**Time savings:** 15 minutes to modify workflow vs 3 hours to write Python orchestration

---

#### Pattern 3: OpenAPI-First API Design

**File to Copy:** `backend/openapi/bassline_api_v1.yaml`

**How to Adapt:**

```yaml
# 1. Copy structure (keep same format)
openapi: 3.0.0
info:
  title: Yoga API  # Changed
  version: 1.0.0

# 2. Update paths (keep same patterns):
paths:
  /api/yoga/sequences:  # Changed from /api/agents/generate-sequence
    post:
      operationId: generateYogaSequence  # Must match Arazzo workflow
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                style:
                  type: string
                  enum: [hatha, vinyasa, yin]  # Domain-specific
                duration_minutes:
                  type: integer  # Same pattern as Pilates

  # 3. Keep similar endpoint patterns:
  /api/yoga/pranayama:  # Similar to /api/music
    get:
      operationId: getPranayamaExercises
      # Same response structure pattern
```

**Time savings:** Copy structure instead of learning OpenAPI from scratch

---

### Pattern Catalog Summary

| **Pattern** | **Source File** | **Copy To** | **What to Change** | **What Stays Same** |
|-------------|----------------|-------------|-------------------|---------------------|
| **Agent Composition** | `bassline_agent.py` | `{domain}_agent.py` | System prompt, tool references | LLM config, reasoner, super().__init__() |
| **Arazzo Workflow** | `*.arazzo.yaml` | `{domain}_*.arazzo.yaml` | operationIds, domain terms | Runtime expressions, step structure |
| **OpenAPI Spec** | `bassline_api_v1.yaml` | `{domain}_api_v1.yaml` | Paths, schemas | OpenAPI structure, patterns |
| **Tool Implementation** | `tools.py` | `{domain}_tools.py` | Tool descriptions, API URLs | JustInTimeToolingBase interface |

---

## Code Quality Standards

### Jentic Integration Quality Checklist

- [ ] **Real Jentic Code:** Using libraries from GitHub (not copied code)
- [ ] **StandardAgent:** All orchestrator agents extend StandardAgent
- [ ] **OpenAPI First:** APIs documented before Arazzo workflows created
- [ ] **Arazzo Declarative:** Workflows use runtime expressions, not custom Python
- [ ] **Tool Descriptions:** Clear descriptions help LLM choose correct tool
- [ ] **Backend Simplicity:** Backend agents are simple API handlers (no StandardAgent)
- [ ] **Separation of Concerns:** Orchestrator reasons, backend executes
- [ ] **Educational Annotations:** Code comments explain Jentic vs Bassline
- [ ] **Pattern Reusability:** Code follows templates in this guide

---

### Educational Annotation Standard

**All custom code must distinguish Jentic patterns from Bassline customizations.**

#### Example (Good):

```python
# ✅ JENTIC PATTERN: Inherit from StandardAgent
class BasslinePilatesCoachAgent(StandardAgent):

    def __init__(self):
        # ✅ JENTIC: Configure LLM using LiteLLM wrapper
        self.llm = LiteLLM(model="gpt-4-turbo")

        # ✅ BASSLINE CUSTOM: Our Pilates-specific tools
        self.tools = BasslinePilatesTools()

        # ✅ JENTIC PATTERN: Use composition to activate StandardAgent
        super().__init__(llm=self.llm, tools=self.tools, reasoner=self.reasoner)
```

#### Example (Bad):

```python
# ❌ No annotations - unclear what comes from Jentic
class BasslinePilatesCoachAgent(StandardAgent):
    def __init__(self):
        self.llm = LiteLLM(model="gpt-4-turbo")
        self.tools = BasslinePilatesTools()
        super().__init__(llm=self.llm, tools=self.tools, reasoner=self.reasoner)
```

---

## Architecture Decision Records

### Decision: Backend Agents Don't Use StandardAgent

**Date:** 2025-12-01
**Status:** Accepted
**Reference:** `docs/ARCHITECTURE_DECISION_BACKEND_AGENTS.md`

**Decision:**
- ✅ Orchestrator uses StandardAgent (high-level reasoning)
- ❌ Backend does NOT use StandardAgent (simple API services)

**Rationale:**
- Orchestrator handles all reasoning (Plan→Execute→Reflect)
- Backend executes specific tasks (database queries, business logic)
- Prevents circular dependencies and performance overhead
- Follows Jentic pattern: orchestrator reasons, services execute

---

### Decision: OpenAPI + Arazzo > Custom Python Orchestration

**Date:** 2025-12-01
**Status:** Accepted

**Decision:**
- ✅ Define workflows in Arazzo YAML (declarative)
- ❌ Avoid Python orchestration code (imperative)

**Rationale:**
- Declarative workflows easier to read and modify
- Non-developers (domain experts) can update workflows
- Visual workflow diagrams possible
- 8x faster to modify (15 min vs 3 hours)
- 74% code reduction (220 lines vs 850 lines)

---

## Future Enhancements

### Planned Pattern Additions

1. **Multi-LLM Orchestration Pattern**
   - Use different LLMs for different tools
   - Example: GPT-4 for reasoning, Claude for creative content

2. **Workflow Versioning Pattern**
   - Maintain multiple workflow versions (v1, v2, v3)
   - A/B test different orchestration strategies

3. **Conditional Workflow Steps Pattern**
   - Skip steps based on user preferences
   - Example: Skip music if user prefers silence

4. **Parallel Workflow Execution Pattern**
   - Run independent steps concurrently
   - Example: Generate sequence + select music in parallel

---

## Quick Reference

### Most Common Tasks

| **Task** | **File** | **What to Edit** |
|----------|----------|------------------|
| Change agent personality | `bassline_agent.py` | `system_prompt` parameter |
| Add new tool | `tools.py` | Add to `list_tools()` |
| Add workflow step | `*.arazzo.yaml` | Add step to `steps` array |
| Add API endpoint | `bassline_api_v1.yaml` | Add path to `paths` |
| Update frontend interface | `orchestrator.ts` | Add field to `CompleteClass` |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-01 | Initial style guide created after Session 11.5 |

---

**This document is the source of truth for Jentic integration patterns.
All future development should follow these standards for maximum scalability.**
