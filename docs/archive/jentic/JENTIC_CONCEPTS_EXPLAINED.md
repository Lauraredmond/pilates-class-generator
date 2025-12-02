# Jentic Concepts Explained - For Non-Technical Understanding

**Audience:** Laura (project owner, learning Jentic architecture)
**Date:** November 28, 2025

---

## Quick Answers to Your Questions

### Q1: What does "continuing with stubs" mean?

**Stubs** = Fake/placeholder code used for learning

Think of stubs like toy cars:
- Kids play with toy cars to *learn* how cars work
- But you can't drive a toy car to work
- You eventually need a *real* car

In coding:
- **Stub code** = Fake functions that pretend to work (for learning concepts)
- **Real code** = Actual libraries that do real work (for production)

**Example:**

```python
# STUB (fake code for learning)
class FakeStandardAgent:
    def solve(self, goal):
        return "I'm just pretending to be an AI agent"

# REAL CODE (actual working library)
from agents.standard_agent import StandardAgent
agent = StandardAgent(...)
result = agent.solve("Create a Pilates class")  # Actually works!
```

**Why "continuing with stubs" is bad:**
- You spend time building toy code
- Then you have to throw it away and rebuild with real code
- You learn theory but don't get production value
- Like learning to drive with a toy steering wheel

**Why using real libraries is better:**
- You learn by doing actual work
- Code you write today works in production
- Serves both goals: learning + building product

---

### Q2: What is PyPI?

**PyPI** = Python Package Index

Think of it like the App Store for Python code:
- **App Store:** You click "Install" to get Instagram on your phone
- **PyPI:** You type `pip install standard-agent` to get Jentic's library

**How it works:**

1. Jentic writes code and tests it
2. Jentic publishes it to PyPI.org
3. Anyone can install it with one command: `pip install standard-agent`
4. You get the exact same code Jentic uses internally

**Why this matters:**
- Jentic's libraries are **real, published, production-ready**
- NOT just concepts or stubs
- You can install and use them right now
- They're maintained by Jentic (bug fixes, updates)

**Analogy:**
- **PyPI** is like a global warehouse of Python tools
- **pip install** is like ordering from that warehouse
- **standard-agent** is the product you ordered
- It gets shipped to your project and works immediately

---

## Core Jentic Concepts

### 1. StandardAgent (The Brain)

**What it is:**
A framework for building AI agents that can use tools to accomplish goals

**Think of it like a human assistant:**
- You give them a goal: "Plan my Pilates class"
- They break it into steps (plan)
- They use tools (computer, phone, databases) to execute each step
- They check their work and fix mistakes (reflect)
- They deliver the final result

**The 3-Step Loop:**

```
PLAN → EXECUTE → REFLECT

1. PLAN: "To create a class, I need to:
   - Get user preferences
   - Search for movements
   - Validate sequence
   - Add transitions"

2. EXECUTE: Actually does each step
   - Calls API to get user data
   - Searches movement database
   - Validates with safety rules

3. REFLECT: "Did that work? If not, try again differently"
   - If error: "Wrong API, let me try another"
   - If success: "Great, move to next step"
```

**Why this is powerful:**
- Agent can fix its own mistakes
- Can try different approaches
- Doesn't need perfect instructions
- Learns from failures

---

### 2. ReWOO Reasoner (The Strategy)

**What it is:**
A specific reasoning strategy that StandardAgent uses

**ReWOO** = Reasoning WithOut Observation
- Plan all steps upfront
- Execute them in order
- Only reflect when something fails

**Think of it like a recipe:**

Traditional agent (like ChatGPT):
1. Do step 1
2. Wait, what was I doing?
3. Oh right, do step 2
4. Hmm, what's next?
5. Do step 3

ReWOO agent:
1. Read entire recipe first (plan)
2. Gather all ingredients
3. Execute steps 1→2→3→4→5 in order
4. If something fails, check the recipe and fix

**Why ReWOO is better:**
- More efficient (less back-and-forth)
- More reliable (validates plan upfront)
- Easier to debug (you can see the full plan)

---

### 3. Just-In-Time Tooling (The Toolkit)

**What it is:**
Loading tools dynamically based on what's needed, not loading everything upfront

**Traditional approach (bad):**
- Give agent access to ALL 1500 tools at once
- Agent gets confused by too many options
- Context window fills up with irrelevant tool descriptions

**Just-In-Time approach (good):**
- Agent says "I need to search for movements"
- System searches tool catalog: "Here are 3 relevant tools"
- Agent picks the best one
- Only then load the full tool details

**Think of it like a toolbox:**

Bad way:
- Dump 1500 tools on the floor
- Agent tries to figure out which wrench to use
- Half the tools aren't even relevant

Good way:
- Agent says "I need to tighten a bolt"
- You hand them 3 wrenches that fit
- Agent picks the right size
- Job done efficiently

---

### 4. Arazzo Engine (The Workflow Runner)

**What it is:**
A workflow execution engine that runs predefined sequences of API calls

**Think of it like a factory assembly line:**
- Each station (step) does a specific job
- Parts (data) move from station to station
- Output from one step becomes input to the next
- Final product emerges at the end

**Example Arazzo Workflow:**

```yaml
Steps:
1. Get user profile → outputs: user_data
2. Search movements (uses: user_data) → outputs: movements
3. Validate sequence (uses: movements) → outputs: validated_class
4. Format plan (uses: validated_class) → outputs: final_plan
```

**StandardAgent vs Arazzo:**

| StandardAgent | Arazzo |
|--------------|--------|
| AI decides steps | Steps are predefined |
| Flexible, creative | Deterministic, reliable |
| Slower (thinks) | Faster (just executes) |
| Can improvise | Follows script |
| **Use when:** Task is complex/unknown | **Use when:** Task is known/repeatable |

**Analogy:**
- **StandardAgent** = Jazz musician (improvises)
- **Arazzo** = Classical orchestra (follows sheet music)

Both are valuable for different situations!

---

### 5. LLM Abstraction Layer (Vendor Independence)

**What it is:**
A common interface that works with any AI model (OpenAI, Anthropic, Google, etc.)

**Why this matters:**
- You can switch AI providers without changing code
- Not locked into one vendor
- Can use the best/cheapest model for each task

**Example:**

```python
# JENTIC PATTERN: Vendor-agnostic LLM interface
llm = LiteLLM(model="gpt-4")  # OpenAI

# Later, switch to Anthropic (no code changes):
llm = LiteLLM(model="claude-sonnet-4")

# Or Google:
llm = LiteLLM(model="gemini-2.0-flash-exp")
```

**All three work identically because of abstraction layer**

**Think of it like power outlets:**
- Different countries have different plugs
- But if you have a universal adapter, your phone works anywhere
- LiteLLM is the universal adapter for AI models

---

## How It All Fits Together (Bassline Integration)

### The Big Picture

```
USER SAYS: "Create a 60-minute intermediate Pilates class"
    ↓
FRONTEND (React): Sends request to orchestration service
    ↓
ORCHESTRATION SERVICE (StandardAgent):
    1. PLAN: Break goal into steps
       - Get user preferences
       - Search for 15 movements
       - Select best 10
       - Validate sequence safety
       - Generate transitions
       - Add music

    2. EXECUTE: Run each step
       - Calls Bassline API: /api/users/123
       - Calls Bassline API: /api/movements?difficulty=intermediate
       - Calls Arazzo Workflow: validate_sequence
       - Calls Bassline API: /api/transitions
       - Calls Bassline API: /api/music/playlists

    3. REFLECT: Check for errors
       - If sequence fails safety check: Try different movements
       - If API times out: Retry with different endpoint

    ↓
RESULT: Complete class plan returned to user
```

---

## Why This Architecture for Bassline?

### Goal 1: Customer Traction (Production Value)

**Jentic's real libraries give us:**
- Professional-grade reasoning (used by Fortune 500 companies)
- Proven error handling and retry logic
- Access to 1500+ APIs if we need them (Gmail, Slack, etc.)
- Battle-tested code (not homemade)

### Goal 2: Learning Jentic (Client Relationship)

**Using real code means:**
- Deep understanding of how Jentic architecture works
- Can speak intelligently about their patterns
- Can recommend Jentic to other clients with confidence
- Can contribute improvements back to Jentic

### Dual Goal Strategy

**NOT:**
- Build toy version first → Then rebuild with real version later
- Learn theory → Then apply to production later

**YES:**
- Build production version using real Jentic code
- Learn architecture while building real features
- Annotate code heavily to capture insights
- Serve customers AND understand Jentic simultaneously

---

## Three Ways to Use Jentic in Bassline

### Option 1: Arazzo Workflows (Deterministic)

**Best for:** Known, repeatable tasks

```yaml
# generate_class_v1.arazzo.yaml
steps:
  1. Get user profile
  2. Search movements
  3. Validate sequence
  4. Generate transitions
```

**Pros:**
- Fast (no AI thinking time)
- Predictable (same input = same output)
- Easy to debug

**Cons:**
- Can't handle unexpected situations
- Requires predefined workflow

---

### Option 2: StandardAgent (Flexible)

**Best for:** Complex, varied tasks

```python
agent.solve("Create a class but avoid knee-intensive movements due to user's injury")
```

**Pros:**
- Handles edge cases
- Adapts to user needs
- Creative solutions

**Cons:**
- Slower (AI reasoning time)
- Uses LLM tokens (costs money)
- Less predictable

---

### Option 3: Hybrid (Best of Both)

**Best for:** Real-world applications

```python
if task_is_standard:
    use_arazzo_workflow()  # Fast path
else:
    use_standard_agent()   # Flexible path
```

**Example:**
- **Standard class creation:** Arazzo workflow (fast)
- **User says "I have a shoulder injury":** StandardAgent (adaptive)

---

## Cost Considerations

### Arazzo Workflows
- **Cost:** Free (just HTTP requests to your APIs)
- **Speed:** ~2-3 seconds for full workflow
- **Use when:** Task is repetitive and well-defined

### StandardAgent with GPT-4
- **Cost:** ~$0.10-0.30 per class generation (LLM tokens)
- **Speed:** ~10-20 seconds (AI thinking time)
- **Use when:** Task requires reasoning or adaptation

### Hybrid Approach
- **Cost:** $0.02 average (most use fast path, some use AI)
- **Speed:** 2-10 seconds depending on path
- **Use when:** Production application (best balance)

---

## Next Steps (Session 10 Continuation)

### Phase 1: Core Architecture (Current Session)

**What we're building:**
1. Python orchestration service on Render
2. BasslinePilatesCoachAgent (extends StandardAgent)
3. Arazzo workflow V1 (4-step class generation)
4. Hybrid tool provider (Bassline + Jentic tools)

**What we're learning:**
- How StandardAgent's reasoning loop works
- How to integrate external tools
- How to write Arazzo workflows
- How to annotate for educational value

**Deliverable:**
- Working class generation using real Jentic code
- Heavily documented codebase showing patterns
- Integration journal capturing insights

---

### Future Phases

**Phase 2:** Add more movement levels and class sections
**Phase 3:** Add audio/visual delivery modes
**Phase 4:** Scale and optimize

---

## Glossary

**Agent:** Software that can reason and use tools to accomplish goals
**LLM:** Large Language Model (GPT-4, Claude, etc.)
**Reasoner:** The strategy an agent uses to solve problems (e.g., ReWOO)
**Tool:** A capability the agent can use (API call, database query, etc.)
**Workflow:** Predefined sequence of steps to accomplish a task
**Arazzo:** Specification language for defining API workflows
**OpenAPI:** Specification language for defining APIs
**PyPI:** Python Package Index (like npm or App Store for Python)
**Stub:** Fake code used for learning (not production)

---

## Key Insights

1. **Jentic's libraries are real, not theoretical**
   - Published to PyPI
   - Production-ready
   - Used by paying customers

2. **StandardAgent is a framework, not a complete solution**
   - You provide: LLM, tools, memory
   - It provides: Reasoning loop, error handling, reflection
   - Modular design allows customization

3. **Arazzo complements StandardAgent**
   - Not either/or, but both
   - Use Arazzo for speed, StandardAgent for flexibility
   - Hybrid approach is optimal for production

4. **Just-in-time tooling is the secret sauce**
   - Enables unlimited tool catalog
   - Keeps context clean
   - Agent focuses on relevant tools only

5. **Education happens through integration**
   - Reading code teaches concepts
   - Writing integration code builds understanding
   - Annotating code captures insights
   - Real implementation beats theoretical study

---

**Document Version:** 1.0
**Last Updated:** November 28, 2025
**Author:** Claude Code (explaining Jentic architecture in plain English)
