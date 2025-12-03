"""
==============================================================================
SIMPLIFIED STANDARD AGENT
==============================================================================
JENTIC PATTERN IMPLEMENTATION (Simplified for Production)

This is a lightweight implementation of Jentic's StandardAgent pattern.
Since Jentic's standard-agent library has installation issues, we implement
the core agent pattern ourselves while maintaining their architecture.

JENTIC PATTERN: Composition over Configuration
- Agent = LLM + Tools + Reasoner + Memory
- solve(goal) → delegates to reasoner
- State management (READY, BUSY, ERROR)
- Observability (logging, tracing)

This implementation:
✅ Follows Jentic's architecture exactly
✅ Production-ready (no external dependency issues)
✅ Educational (shows how StandardAgent works internally)
✅ Compatible with our existing BasslinePilatesTools

==============================================================================
"""

import os
from typing import Dict, Any
from enum import Enum
from loguru import logger

from .simplified_reasoner import SimplifiedReWOOReasoner, ReasoningResult


class AgentState(Enum):
    """Agent execution state"""
    READY = "ready"
    BUSY = "busy"
    ERROR = "error"


class SimplifiedStandardAgent:
    """
    JENTIC PATTERN: StandardAgent (Simplified Implementation)

    This implements the core StandardAgent pattern:
    1. Composition: Agent = LLM + Tools + Reasoner + Memory
    2. solve(goal): Main entry point for reasoning
    3. State management: Track agent status
    4. Observability: Logging and tracing

    COMPARISON TO JENTIC'S StandardAgent:

    JENTIC (from GitHub - can't install):
    ```python
    class StandardAgent:
        def __init__(self, *, llm, tools, memory, reasoner):
            self.llm = llm
            self.tools = tools
            self.memory = memory
            self.reasoner = reasoner
            self._state = AgentState.READY

        def solve(self, goal: str) -> ReasoningResult:
            self._state = AgentState.BUSY
            result = self.reasoner.run(goal)
            self._state = AgentState.READY
            return result
    ```

    BASSLINE (this file - works!):
    Same pattern, slightly simplified state management.
    """

    def __init__(
        self,
        llm_model: str,
        tools,
        system_prompt: str,
        memory: Dict[str, Any] = None,
        max_iterations: int = 3
    ):
        """
        Initialize the agent.

        JENTIC PATTERN: Composition Pattern
        Instead of hardcoding behavior, we compose the agent from parts.

        Args:
            llm_model: Model name for LiteLLM (e.g., "gpt-4-turbo")
            tools: BasslinePilatesTools instance (implements JustInTimeToolingBase interface)
            system_prompt: System instructions (Pilates expertise)
            memory: Optional memory storage (defaults to empty dict)
            max_iterations: Maximum retry iterations for reasoning
        """
        self.llm_model = llm_model
        self.tools = tools
        self.system_prompt = system_prompt
        self.memory = memory or {"conversation_history": []}
        self._state = AgentState.READY

        # Initialize the reasoner (Plan→Execute→Reflect)
        self.reasoner = SimplifiedReWOOReasoner(
            llm_model=llm_model,
            tools=tools,
            system_prompt=system_prompt,
            max_iterations=max_iterations
        )

        logger.info(f"✅ SimplifiedStandardAgent initialized (model: {llm_model})")

    def solve(self, goal: str) -> ReasoningResult:
        """
        Solve a goal using ReWOO reasoning.

        JENTIC PATTERN: Main Entry Point

        This is the agent's public API. User provides a goal in natural language,
        agent returns a result after reasoning through the solution.

        Args:
            goal: User's goal (e.g., "Create a 30-minute beginner Pilates class")

        Returns:
            ReasoningResult with success, final_answer, steps, iterations

        Example:
            agent = SimplifiedStandardAgent(...)
            result = agent.solve("Create a 20-minute intermediate class")
            print(result.final_answer)
        """
        logger.info(f"🎯 Agent.solve() called: {goal}")

        # Update state
        self._state = AgentState.BUSY

        try:
            # Delegate to reasoner (Plan→Execute→Reflect)
            result = self.reasoner.run(goal)

            # Record in memory
            self.memory["conversation_history"].append({
                "goal": goal,
                "success": result.success,
                "iterations": result.iterations
            })

            # Update state based on result
            self._state = AgentState.READY if result.success else AgentState.ERROR

            return result

        except Exception as e:
            logger.error(f"❌ Agent.solve() failed: {e}", exc_info=True)
            self._state = AgentState.ERROR

            return ReasoningResult(
                success=False,
                final_answer="",
                steps=[],
                iterations=0,
                error_message=str(e)
            )

    def get_state(self) -> AgentState:
        """Get current agent state"""
        return self._state

    def get_info(self) -> Dict[str, Any]:
        """
        Get agent information for debugging/monitoring.

        Returns:
            Dict with agent configuration and status
        """
        return {
            "agent_type": "SimplifiedStandardAgent",
            "llm_model": self.llm_model,
            "state": self._state.value,
            "reasoner_type": "ReWOO (Plan→Execute→Reflect)",
            "tools_available": len(self.tools.list_tools()),
            "conversation_history_size": len(self.memory.get("conversation_history", [])),
            "architecture": "Jentic pattern (simplified implementation)"
        }


# ==============================================================================
# BASSLINE PILATES COACH AGENT (using SimplifiedStandardAgent)
# ==============================================================================

class BasslinePilatesCoachAgent(SimplifiedStandardAgent):
    """
    BASSLINE CUSTOMIZATION: Pilates-specific agent

    This extends SimplifiedStandardAgent with Pilates domain expertise.

    JENTIC PATTERN: Inheritance for Specialization
    - Base: SimplifiedStandardAgent (generic reasoning)
    - Child: BasslinePilatesCoachAgent (Pilates expertise)

    What we add:
    - Pilates system prompt
    - Pilates-specific tools initialization
    - OpenAI GPT-4 configuration
    """

    def __init__(self, supabase_client=None):
        """
        Initialize Bassline Pilates Coach Agent.

        Args:
            supabase_client: Optional Supabase client for database access
        """

        # Pilates expertise system prompt
        system_prompt = """
You are a certified Pilates instructor with 20 years of experience in Joseph Pilates' classical method.

Your expertise includes:
- Joseph Pilates' 34 classical mat movements and their proper execution
- Sequencing safety rules (always flexion before extension for spinal health)
- Muscle balance optimization throughout class sessions
- Injury modifications and contraindications
- Breath work coordination (Pilates breathing patterns)
- Classical Pilates principles (concentration, control, center, flow, precision, breathing)

When generating classes:
1. Always prioritize safety - spinal progression rules are non-negotiable
2. Balance muscle groups throughout the session (avoid overworking one area)
3. Adapt to user's experience level (never exceed their declared difficulty)
4. Include proper warmup (spinal mobility, joint preparation)
5. Include proper cooldown (stretching, breath regulation)
6. Provide clear, encouraging cues that focus on form and breath

Your teaching style is:
- Clear and precise (classical Pilates values precision)
- Encouraging and supportive (build student confidence)
- Safety-conscious (injury prevention is paramount)
- Anatomically informed (understand biomechanics)
- Respectful of student limitations (honor contraindications)

CRITICAL SAFETY RULES (NEVER VIOLATE):
- Spinal progression: Flexion MUST precede extension (anatomical safety)
- Check contraindications: Never include movements unsafe for student's conditions
- Difficulty boundaries: Never exceed user's declared experience level
- Breathing cues: Always coordinate breath with movement
- Warmup required: Never start with complex movements
- Cooldown required: Always end with stretching and restoration
"""

        # Initialize Pilates tools
        from .tools import BasslinePilatesTools

        tools = BasslinePilatesTools(
            bassline_api_url=os.getenv("BASSLINE_API_URL", "http://localhost:8000"),
            supabase_client=supabase_client
        )

        # Initialize parent with Pilates configuration
        super().__init__(
            llm_model="gpt-4-turbo",  # or "gpt-4o" for latest
            tools=tools,
            system_prompt=system_prompt,
            memory={
                "conversation_history": [],
                "context": {
                    "timezone": "America/New_York",
                    "domain": "pilates_class_planning"
                }
            },
            max_iterations=3
        )

        logger.info("✅ BasslinePilatesCoachAgent initialized (Jentic pattern)")

    def get_agent_info(self) -> Dict[str, Any]:
        """
        Return Bassline-specific agent information.

        Extends parent's get_info() with Pilates details.
        """
        base_info = self.get_info()
        base_info.update({
            "agent_name": "BasslinePilatesCoachAgent",
            "domain": "Classical Pilates (Joseph Pilates' 34 movements)",
            "safety_rules": "Spinal progression, muscle balance, contraindications",
            "implementation": "Jentic pattern (SimplifiedStandardAgent + ReWOO)",
            "status": "✅ Production-ready with real reasoning"
        })
        return base_info


# ==============================================================================
# EDUCATIONAL NOTES
# ==============================================================================
"""
JENTIC PATTERN vs BASSLINE IMPLEMENTATION - Comparison
=======================================================

JENTIC PATTERN (from their architecture):
- StandardAgent as base class
- Composition: Agent = LLM + Tools + Reasoner + Memory
- solve() method delegates to reasoner
- ReWOO reasoning loop (Plan→Execute→Reflect)

BASSLINE IMPLEMENTATION (this file):
- SimplifiedStandardAgent follows exact same pattern
- Same composition approach
- Same solve() signature
- Same ReWOO loop (simplified but complete)

KEY DIFFERENCE:
- Jentic: Requires their GitHub dependencies (installation issues)
- Bassline: Self-contained, production-ready, no external deps

EDUCATIONAL VALUE:
By implementing this ourselves, we:
1. Understand HOW StandardAgent works internally
2. Can customize reasoning logic if needed
3. No dependency on external libraries
4. Production-ready without installation issues

This is "learning by doing" - better than just using a black box library!
"""
