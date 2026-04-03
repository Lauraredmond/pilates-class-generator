# Architecture Decision: Backend Agents vs Orchestrator

**Decision Date:** December 1, 2025
**Status:** Accepted
**Context:** Session 11.5 - Jentic Integration Completion

---

## Question

Should we refactor backend agents (sequence_agent.py, music_agent.py, etc.) to extend StandardAgent from Jentic?

## Decision

**NO** - Backend agents should remain as-is. StandardAgent integration is complete at the orchestrator layer.

---

## Rationale

### Current Architecture (Correct Jentic Pattern)

```
┌────────────────────────────────────────────────────────────┐
│  Frontend (React)                                           │
│  - User interactions                                        │
│  - API calls to orchestrator                                │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│  Orchestrator Service (Python + Jentic)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BasslinePilatesCoachAgent                           │  │
│  │  ✅ EXTENDS StandardAgent                            │  │
│  │  ✅ Uses ReWOOReasoner (Plan→Execute→Reflect)        │  │
│  │  ✅ Has Pilates-specific tools                        │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │  Arazzo Workflow: assemble_pilates_class.yaml       │  │
│  │  ✅ Declarative 8-step orchestration                 │  │
│  │  ✅ Calls backend APIs via OpenAPI spec              │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Backend Services (FastAPI)                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /api/agents/generate-sequence                  │  │
│  │  → sequence_agent.process()                          │  │
│  │  → Returns movement sequence                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /api/agents/select-music                       │  │
│  │  → music_agent.process()                             │  │
│  │  → Returns music playlist                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /api/agents/create-meditation                  │  │
│  │  → meditation_agent.process()                        │  │
│  │  → Returns meditation script                         │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
                     Supabase Database
```

---

## Why Backend Agents Don't Need StandardAgent

### 1. Separation of Concerns

**Orchestrator (Uses StandardAgent):**
- High-level reasoning ("I need to generate a complete class")
- Workflow orchestration ("Call these 8 APIs in this order")
- Strategic decision-making ("User prefers classical music")
- Cross-service coordination

**Backend Services (Don't Need StandardAgent):**
- Single-responsibility APIs ("Generate a sequence given parameters")
- Domain logic ("Validate spinal progression rules")
- Data access ("Query Supabase for movements")
- Return structured responses

**Analogy:**
- Orchestrator = **Project Manager** (uses StandardAgent for strategic thinking)
- Backend Services = **Specialists** (just do their specific job well)

You don't need a project manager at the specialist level - you need one at the coordination level.

---

### 2. Jentic Pattern Compliance

**From Jentic's Architecture:**

> "StandardAgent is designed for orchestration and high-level reasoning.
> Services that it calls can be any API - REST, GraphQL, gRPC, etc.
> The agent doesn't care how services are implemented, only that they
> provide reliable responses according to the OpenAPI contract."

**Our Implementation Follows This:**
- ✅ Orchestrator uses StandardAgent (high-level reasoning)
- ✅ Arazzo workflows call backend APIs (orchestration)
- ✅ Backend APIs are well-defined OpenAPI endpoints
- ✅ Backend can be FastAPI, Django, Node.js - doesn't matter

---

### 3. Avoiding Unnecessary Complexity

**If we refactored backend agents to use StandardAgent:**

**Problems:**
1. **Circular Dependency Risk**
   - Orchestrator calls Backend
   - Backend agents would also use StandardAgent
   - Two layers of agents reasoning about the same problem
   - Unclear who makes decisions

2. **Performance Overhead**
   - Every API call would trigger Plan→Execute→Reflect
   - Sequence generation would be: Orchestrator Plan → API call → Backend Plan → Database
   - Double the LLM calls, double the latency

3. **Deployment Complexity**
   - Install Jentic libraries in both orchestrator AND backend
   - Maintain two sets of StandardAgent configurations
   - Sync LLM versions across services

4. **Testing Complexity**
   - Mock StandardAgent in backend tests
   - Mock Arazzo workflows in backend tests
   - Test interactions between two agent layers

**Current Approach Avoids All This:**
- Backend agents are simple API handlers
- Orchestrator handles all reasoning
- Clear separation of responsibilities
- Easier to test, deploy, and maintain

---

### 4. Scalability Comparison

**Backend with StandardAgent (Not Recommended):**
```python
# backend/agents/sequence_agent.py
from agents.standard_agent import StandardAgent  # ← Jentic dependency

class SequenceAgent(StandardAgent):
    async def solve(self, goal):
        # Plan phase: "I need to generate a sequence..."
        # Execute phase: "Call database, validate rules..."
        # Reflect phase: "Is the sequence safe?..."
        return result
```

**Backend without StandardAgent (Recommended - Current):**
```python
# backend/agents/sequence_agent.py
class SequenceAgent(BaseAgent):  # ← Simple custom base
    async def process(self, inputs):
        # Just do the task:
        movements = await self._get_available_movements()
        sequence = self._build_safe_sequence(movements)
        validation = self._validate_sequence(sequence)
        return {"sequence": sequence, "validation": validation}
```

**Benefit:** Backend is simpler, faster, easier to maintain.

---

### 5. Real-World Analogy

**Amazon's Architecture:**
- **Alexa (Orchestrator)** uses high-level AI reasoning
  - Understands user intent
  - Decides which services to call
  - Coordinates multi-step workflows

- **Backend Services** are simple APIs
  - Weather service: "Return weather for location X"
  - Music service: "Return playlist for genre Y"
  - Shopping service: "Add item Z to cart"

Alexa uses AI reasoning to orchestrate. Services just execute their function.

Our architecture is the same:
- **Orchestrator** = Alexa (uses StandardAgent)
- **Backend APIs** = Amazon services (just execute tasks)

---

## Implementation Status

### ✅ What We Have (Correct)

**Orchestrator:**
```python
# orchestrator/agent/bassline_agent.py
class BasslinePilatesCoachAgent(StandardAgent):
    # ✅ Uses StandardAgent from Jentic
    # ✅ Composes LLM + Tools + Reasoner + Memory
    # ✅ Has solve() method from StandardAgent
    # ✅ Provides high-level reasoning
```

**Tools:**
```python
# orchestrator/agent/tools.py
class BasslinePilatesTools(JustInTimeToolingBase):
    # ✅ Implements Jentic tool interface
    # ✅ Can execute Arazzo workflows as tools
    # ✅ Calls backend APIs via HTTP
```

**Workflows:**
```yaml
# orchestrator/arazzo/workflows/assemble_pilates_class_v1.arazzo.yaml
workflows:
  - workflowId: assemblePilatesClass
    steps:
      # ✅ 8 declarative steps
      # ✅ Calls backend APIs via operationId
      # ✅ Runtime expressions for data flow
```

**Backend APIs:**
```python
# backend/api/agents.py
@router.post("/generate-sequence")
async def generate_sequence(request):
    # ✅ Simple API handler
    # ✅ Calls sequence_agent.process()
    # ✅ Returns structured response
```

### ❌ What We Don't Need

- ❌ Jentic libraries installed in backend
- ❌ Backend agents extending StandardAgent
- ❌ Backend agents with Plan→Execute→Reflect loops
- ❌ Two layers of agentic reasoning

---

## Benefits of Current Approach

| Benefit | Explanation |
|---------|-------------|
| **Clear Separation** | Orchestrator thinks, backend executes |
| **Single Source of Intelligence** | Only orchestrator uses StandardAgent |
| **Performance** | Backend APIs are fast (no extra LLM calls) |
| **Maintainability** | Backend is simpler, easier to debug |
| **Scalability** | Can scale orchestrator and backend independently |
| **Testing** | Backend APIs testable without mocking StandardAgent |
| **Flexibility** | Can swap backend implementation without changing orchestrator |

---

## Alternative Considered: Full StandardAgent in Backend

**When Would This Make Sense?**

Only if backend services needed autonomous decision-making, like:
- "Decide which database to query based on load"
- "Choose between multiple LLM providers based on cost"
- "Automatically retry failed requests with different parameters"

**But our backend doesn't need this:**
- It just executes well-defined tasks
- Parameters come from orchestrator
- Decisions are already made

---

## Conclusion

**Decision: Keep backend agents as simple API services**

**Justification:**
- ✅ Follows Jentic architectural pattern
- ✅ Avoids unnecessary complexity
- ✅ Better performance (no double LLM calls)
- ✅ Easier to maintain and test
- ✅ Clear separation of concerns

**StandardAgent is already integrated - at the right layer (orchestrator).**

---

## Future Considerations

If we ever need backend services to make autonomous decisions:
1. Evaluate if orchestrator can handle it (preferred)
2. If not, consider StandardAgent at service level
3. Ensure clear decision boundaries (avoid conflicts)

For now, current architecture is optimal.

---

**Status:** ✅ Architecture Decision Finalized
**Next Steps:** Wire frontend to orchestrator, test end-to-end integration
