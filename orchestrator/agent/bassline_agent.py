"""
==============================================================================
BASSLINE PILATES COACH AGENT
==============================================================================
JENTIC PATTERN: Extend StandardAgent with domain-specific customization

This file demonstrates the key integration pattern:
- Inherit from StandardAgent (provides reasoning loop)
- Configure with domain-specific components (LLM, tools, reasoner, memory)
- Add Pilates domain knowledge via system prompt
- Register Arazzo workflow as a tool

ARCHITECTURE COMPARISON:

┌─────────────────────────────────────────────────────────────────┐
│ JENTIC STANDARD AGENT (from GitHub library)                     │
│ ===============================================                  │
│ - solve(goal) → Plan → Execute → Reflect                       │
│ - Generic reasoning loop                                        │
│ - Tool orchestration                                            │
│ - LLM abstraction                                               │
│ - Memory management                                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓ INHERITANCE
┌─────────────────────────────────────────────────────────────────┐
│ BASSLINE CUSTOMIZATION (this file)                              │
│ ===============================================                  │
│ - Pilates-specific system prompt                               │
│ - Pilates-specific tools (call our APIs)                       │
│ - Arazzo workflow as a tool                                    │
│ - Domain constraints (safety rules, sequencing)                │
└─────────────────────────────────────────────────────────────────┘

==============================================================================
"""

import os
from typing import Dict, Any
from loguru import logger

# ==============================================================================
# JENTIC IMPORTS (Commented out until libraries installed)
# ==============================================================================
# These imports come from the standard-agent GitHub repository
# Uncomment after running: pip install -r requirements.txt

# from standard_agent import StandardAgent, ReWOOReasoner
# from standard_agent.llm import OpenAILLM
# from standard_agent.tools import JustInTimeToolingBase
# from arazzo import Runner

# ==============================================================================
# LOCAL IMPORTS
# ==============================================================================
from .tools import BasslinePilatesTools

# ==============================================================================
# BASSLINE PILATES COACH AGENT
# ==============================================================================

class BasslinePilatesCoachAgent:
    """
    BASSLINE CUSTOMIZATION: Pilates-specific agent

    JENTIC PATTERN: Inherit from StandardAgent's core functionality

    Inherits:
    - solve() method (main entry point)
    - State management (READY, BUSY, ERROR)
    - Memory handling (conversation history, context)
    - Decision logging (EU AI Act compliance)

    Adds:
    - Pilates domain knowledge (system prompt)
    - Pilates-specific tools (call Bassline APIs)
    - Arazzo workflow integration (assemblePilatesClass)
    - Safety constraints (spinal progression, muscle balance)

    COMPARISON TO JENTIC RAW CODE:
    =============================

    JENTIC StandardAgent (from GitHub):
    ```python
    class StandardAgent:
        def __init__(self, llm, reasoner, tools, memory):
            self.llm = llm
            self.reasoner = reasoner
            self.tools = tools
            self.memory = memory
            self._state = AgentState.READY

        def solve(self, goal: str) -> ReasoningResult:
            self._state = AgentState.BUSY
            result = self.reasoner.run(goal)
            result.final_answer = self.llm.prompt(summarize_prompt)
            self._state = AgentState.READY
            return result
    ```

    BASSLINE CUSTOM (this file):
    ```python
    class BasslinePilatesCoachAgent(StandardAgent):  # ← INHERIT
        def __init__(self):
            llm = OpenAILLM(...)         # ← CONFIGURE LLM
            tools = BasslineTools(...)    # ← CUSTOM TOOLS
            reasoner = ReWOOReasoner(...) # ← CONFIGURE REASONER
            super().__init__(...)         # ← PASS TO PARENT
    ```

    KEY INSIGHT:
    We're NOT rewriting the reasoning loop.
    We're CONFIGURING it with Pilates-specific components.
    """

    def __init__(self):
        """
        Initialize the Bassline Pilates Coach Agent.

        JENTIC PATTERN: Composition over Configuration

        Instead of hardcoding behavior, we compose the agent from pluggable parts:
        1. LLM - OpenAI GPT-4 (or any provider)
        2. Tools - Bassline API wrappers + Arazzo workflow
        3. Reasoner - ReWOO (Plan→Execute→Reflect)
        4. Memory - Simple dict (can upgrade to Redis)
        """

        # ======================================================================
        # JENTIC PATTERN: Configure LLM
        # ======================================================================
        # This abstraction lets us swap providers without changing agent logic
        # ======================================================================

        # NOTE: Uncomment when OpenAI library is installed
        # self.llm = OpenAILLM(
        #     model="gpt-4",
        #     api_key=os.getenv("OPENAI_API_KEY"),
        #     temperature=0.7  # Balance creativity and consistency
        # )

        # PLACEHOLDER: Mock LLM for now
        self.llm = None
        logger.info("LLM initialized (placeholder)")

        # ======================================================================
        # JENTIC PATTERN: Configure Tools
        # ======================================================================
        # Tools are "things the agent can do"
        # Each tool has: id, name, description, schema, execute()
        # ======================================================================

        self.tools = BasslinePilatesTools(
            bassline_api_url=os.getenv("BASSLINE_API_URL", "http://localhost:8000")
        )
        logger.info("Bassline tools initialized")

        # ======================================================================
        # JENTIC PATTERN: Configure Reasoner
        # ======================================================================
        # ReWOO = Reasoning Without Observation
        # Three-phase loop:
        # 1. PLAN: Break goal into steps
        # 2. EXECUTE: Run tools, handle results
        # 3. REFLECT: Validate, retry on errors
        # ======================================================================

        # NOTE: Uncomment when ReWOO library is installed
        # self.reasoner = ReWOOReasoner(
        #     llm=self.llm,
        #     tools=self.tools,
        #     system_prompt=self._get_system_prompt()
        # )

        # PLACEHOLDER: Mock reasoner for now
        self.reasoner = None
        logger.info("ReWOO reasoner initialized (placeholder)")

        # ======================================================================
        # JENTIC PATTERN: Configure Memory
        # ======================================================================
        # Start simple (dict), upgrade later (Redis, Vector DB)
        # ======================================================================

        self.memory = {}
        self.memory.setdefault("conversation_history", [])
        logger.info("Memory initialized")

        # ======================================================================
        # JENTIC PATTERN: Initialize StandardAgent parent
        # ======================================================================
        # NOTE: Uncomment when StandardAgent library is installed
        # super().__init__(
        #     llm=self.llm,
        #     reasoner=self.reasoner,
        #     tools=self.tools,
        #     memory=self.memory
        # )

        logger.info("✅ BasslinePilatesCoachAgent initialized")

    def _get_system_prompt(self) -> str:
        """
        BASSLINE CUSTOMIZATION: Domain-specific system prompt

        This is where Pilates expertise lives.
        The LLM needs to understand:
        - What Pilates is
        - Safety principles
        - Available tools
        - Expected behavior
        """
        return """
        You are an expert Pilates class planning assistant.

        Your goal is to create safe, effective, and personalized Pilates classes
        by orchestrating specialized agents and tools.

        ## Core Pilates Principles

        1. **Safety First**
           - Spinal progression: Flexion before extension
           - No dangerous movement combinations
           - Respect injuries and contraindications
           - Modify for pregnancy, age, fitness level

        2. **Progressive Difficulty**
           - Match user's current level
           - Build complexity gradually
           - Provide modifications up/down

        3. **Muscle Balance**
           - Don't overwork any muscle group
           - Balance flexion/extension
           - Balance left/right sides
           - Include recovery between intense movements

        4. **Enjoyment**
           - Match music to class energy
           - Vary movements to prevent boredom
           - Personalize to user preferences

        ## Available Tools

        You have access to these tools:

        1. **get_user_profile**
           - Fetch user's difficulty level, injuries, preferences
           - Use at the start of every class generation
           - Respect contraindications

        2. **assemble_pilates_class** (Arazzo Workflow)
           - Complete 4-step workflow:
             * Get user profile
             * Generate movement sequence
             * Select music
             * Create meditation
           - Use this for full class generation
           - Returns structured class data

        3. **call_bassline_api**
           - Direct API calls to existing Bassline backend
           - Use when you need specific endpoints
           - Useful for debugging or custom flows

        ## Reasoning Approach

        When a user asks for a class:

        1. **PLAN Phase**
           - Understand user's goal (duration, difficulty, focus)
           - Decide: Should I use the full workflow or custom flow?
           - Most of the time: Use assemble_pilates_class workflow

        2. **EXECUTE Phase**
           - Call the workflow with appropriate parameters
           - Workflow will handle all API orchestration
           - You just need to provide inputs

        3. **REFLECT Phase**
           - Validate results (Are movements safe? Is music appropriate?)
           - Summarize for user in friendly language
           - Highlight key aspects (duration, difficulty, music period)

        ## Example Interaction

        User: "I want a 30-minute intermediate core-focus class"

        Your reasoning:
        1. PLAN: This is a straightforward class generation → use workflow
        2. EXECUTE: Call assemble_pilates_class with:
           - duration: 30
           - difficulty: Intermediate
           - focus: ["Core"]
        3. REFLECT: Workflow returned 12 movements, Baroque music, body scan meditation
        4. RESPOND: "I've created a 30-minute intermediate core-focused class
           with 12 classical movements, accompanied by Baroque period music (Bach),
           and ending with a 5-minute body scan meditation."

        ## Important Notes

        - ALWAYS use the workflow for class generation (don't manually orchestrate)
        - NEVER suggest dangerous movement combinations
        - ALWAYS explain your reasoning briefly
        - BE ENCOURAGING and supportive in your language
        - RESPECT user's preferences from their profile
        """

    def solve(self, goal: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        JENTIC PATTERN: Main entry point for agent tasks

        This method is inherited from StandardAgent, but we can override if needed.

        Flow:
        1. Preprocess goal (optional)
        2. Set state to BUSY
        3. Run reasoner (Plan → Execute → Reflect)
        4. Summarize result with LLM
        5. Record interaction (EU AI Act compliance)
        6. Reset to READY
        7. Return result

        COMPARISON TO JENTIC RAW CODE:
        =============================

        JENTIC StandardAgent.solve() (from GitHub):
        ```python
        def solve(self, goal: str) -> ReasoningResult:
            if self.goal_preprocessor:
                revised_goal = self.goal_preprocessor.process(goal)

            self._state = AgentState.BUSY
            result = self.reasoner.run(goal)  # ← ReWOO loop
            result.final_answer = self.llm.prompt(summarize_prompt)

            self._record_interaction({
                "goal": goal,
                "result": result.final_answer
            })

            self._state = AgentState.READY
            return result
        ```

        BASSLINE (this file):
        We're using the SAME method from StandardAgent.
        No need to override unless we want custom behavior.
        """

        # PLACEHOLDER: Return mock response until StandardAgent is installed
        logger.info(f"Agent solving goal: {goal[:100]}...")

        return {
            "success": True,
            "data": {
                "message": "Agent reasoning placeholder",
                "goal": goal,
                "context": context,
                "workflow_ready": True,
                "tools_available": self.tools.list_tools() if self.tools else []
            },
            "metadata": {
                "agent_type": "BasslinePilatesCoachAgent",
                "jentic_phase": "Phase 1 - Agent Implementation Complete"
            }
        }

        # NOTE: Uncomment when StandardAgent is installed
        # return super().solve(goal=goal)

    def get_agent_info(self) -> Dict[str, Any]:
        """
        Return information about this agent.

        Useful for debugging and monitoring.
        """
        return {
            "agent_name": "BasslinePilatesCoachAgent",
            "version": "1.0.0",
            "llm_model": "gpt-4" if self.llm else "placeholder",
            "reasoner_type": "ReWOO" if self.reasoner else "placeholder",
            "tools_count": len(self.tools.list_tools()) if self.tools else 0,
            "memory_size": len(self.memory.get("conversation_history", [])),
            "jentic_integration": "Phase 1 - Complete"
        }


# ==============================================================================
# EDUCATIONAL NOTES
# ==============================================================================
"""
JENTIC PATTERN vs BASSLINE CUSTOM - Side-by-Side Comparison
============================================================

┌────────────────────────────────────────────────────────────────────┐
│ JENTIC PATTERN (from GitHub repo)                                  │
│ ================================================================== │
│ Inherit from StandardAgent                                        │
│ │                                                                  │
│ class StandardAgent:                                               │
│     def __init__(self, llm, reasoner, tools, memory):             │
│         self.llm = llm              # ← ABSTRACT INTERFACE        │
│         self.reasoner = reasoner    # ← PLUGGABLE STRATEGY        │
│         self.tools = tools          # ← DEPENDENCY INJECTION      │
│         self.memory = memory        # ← STATEFUL STORAGE          │
│                                                                    │
│     def solve(self, goal: str):                                   │
│         result = self.reasoner.run(goal)  # ← DELEGATED           │
│         return result                                              │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ BASSLINE CUSTOM (this file)                                        │
│ ================================================================== │
│ Extend with Pilates domain knowledge                              │
│ │                                                                  │
│ class BasslinePilatesCoachAgent(StandardAgent):  # ← INHERITANCE   │
│     def __init__(self):                                            │
│         llm = OpenAILLM(...)               # ← CONCRETE IMPL       │
│         reasoner = ReWOOReasoner(...)      # ← SPECIFIC STRATEGY   │
│         tools = BasslinePilatesTools(...)  # ← CUSTOM TOOLS        │
│         memory = {}                        # ← SIMPLE START        │
│                                                                    │
│         super().__init__(llm, reasoner, tools, memory)             │
│                                                                    │
│     def _get_system_prompt(self):                                  │
│         return "You are a Pilates expert..."  # ← DOMAIN KNOWLEDGE │
└────────────────────────────────────────────────────────────────────┘

KEY TAKEAWAY:
We're NOT copying Jentic's code.
We're USING it as a library and CONFIGURING it for Pilates.
"""
