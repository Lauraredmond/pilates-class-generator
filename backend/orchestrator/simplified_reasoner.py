"""
==============================================================================
SIMPLIFIED ReWOO REASONER
==============================================================================
JENTIC PATTERN IMPLEMENTATION (Simplified for Production)

This is a lightweight implementation of Jentic's ReWOOReasoner pattern.
Since Jentic's standard-agent has installation dependency issues, we implement
the core reasoning loop ourselves while maintaining their architecture.

EDUCATIONAL: This shows how ReWOO (Reasoning WithOut Observation) works:
1. PLAN: Break goal into steps (LLM generates plan)
2. EXECUTE: Run tools for each step (no LLM needed)
3. REFLECT: Validate results, retry if needed (LLM validates)

COMPARISON TO JENTIC:
- Same Plan→Execute→Reflect pattern
- Same tool interface (JustInTimeToolingBase)
- Simplified error handling
- Production-ready without external dependencies

==============================================================================
"""

import json
from typing import Dict, Any, List
from dataclasses import dataclass
from loguru import logger
from litellm import completion


@dataclass
class ReasoningStep:
    """Single step in the reasoning plan"""
    step_number: int
    description: str
    tool_id: str
    parameters: Dict[str, Any]
    result: Any = None
    error: str = None


@dataclass
class ReasoningResult:
    """Complete reasoning result"""
    success: bool
    final_answer: str
    steps: List[ReasoningStep]
    iterations: int
    error_message: str = None


class SimplifiedReWOOReasoner:
    """
    JENTIC PATTERN: ReWOO Reasoner (Simplified Implementation)

    Implements the Plan→Execute→Reflect reasoning loop.

    ReWOO = Reasoning WithOut Observation (no LLM during execution)
    1. PLAN: Use LLM to break goal into steps
    2. EXECUTE: Run tools without LLM (faster, cheaper)
    3. REFLECT: Use LLM to validate results

    This is a simplified version that maintains Jentic's architecture
    but doesn't require their GitHub dependencies.
    """

    def __init__(self, llm_model: str, tools, system_prompt: str, max_iterations: int = 3):
        """
        Initialize the reasoner.

        Args:
            llm_model: Model name for LiteLLM (e.g., "gpt-4-turbo")
            tools: BasslinePilatesTools instance (JustInTimeToolingBase)
            system_prompt: System instructions for Pilates expertise
            max_iterations: Maximum retry iterations if reflection fails
        """
        self.llm_model = llm_model
        self.tools = tools
        self.system_prompt = system_prompt
        self.max_iterations = max_iterations

    def run(self, goal: str) -> ReasoningResult:
        """
        Execute the ReWOO reasoning loop.

        JENTIC PATTERN: Main entry point for reasoning

        Args:
            goal: User's goal (e.g., "Create a 30-minute beginner Pilates class")

        Returns:
            ReasoningResult with success status, final answer, and execution trace
        """
        logger.info(f"🧠 ReWOO Reasoning started: {goal}")

        for iteration in range(self.max_iterations):
            logger.info(f"📝 Iteration {iteration + 1}/{self.max_iterations}")

            # STEP 1: PLAN (LLM generates steps)
            plan = self._plan(goal)
            if not plan:
                return ReasoningResult(
                    success=False,
                    final_answer="",
                    steps=[],
                    iterations=iteration + 1,
                    error_message="Failed to generate plan"
                )

            # STEP 2: EXECUTE (Run tools without LLM)
            execution_success = self._execute(plan)

            # STEP 3: REFLECT (LLM validates results)
            reflection = self._reflect(goal, plan)

            if reflection["success"]:
                logger.info("✅ ReWOO Reasoning succeeded!")
                return ReasoningResult(
                    success=True,
                    final_answer=reflection["final_answer"],
                    steps=plan,
                    iterations=iteration + 1
                )
            else:
                logger.warning(f"⚠️ Reflection failed: {reflection.get('reason', 'Unknown')}")
                if iteration < self.max_iterations - 1:
                    logger.info("🔄 Retrying with adjusted plan...")
                    goal = reflection.get("adjusted_goal", goal)

        # Max iterations reached without success
        logger.error("❌ ReWOO Reasoning failed after max iterations")
        return ReasoningResult(
            success=False,
            final_answer="Failed to complete task after multiple attempts",
            steps=plan,
            iterations=self.max_iterations,
            error_message="Max iterations exceeded"
        )

    def _plan(self, goal: str) -> List[ReasoningStep]:
        """
        STEP 1: PLAN - Use LLM to break goal into steps

        JENTIC PATTERN: Planning Phase

        The LLM generates a sequence of tool calls to achieve the goal.
        We ask it to output JSON with: step number, description, tool_id, parameters.

        Args:
            goal: User's goal

        Returns:
            List of ReasoningStep objects
        """
        logger.info("📋 Planning phase...")

        # Get available tools
        available_tools = self.tools.list_tools()
        tools_description = "\n".join([
            f"- {tool['id']}: {tool['name']} - {tool['description'][:100]}..."
            for tool in available_tools
        ])

        planning_prompt = f"""
{self.system_prompt}

AVAILABLE TOOLS:
{tools_description}

USER GOAL: {goal}

Generate a step-by-step plan to achieve this goal using the available tools.

IMPORTANT:
- Use "generate_sequence" tool for movement sequencing
- Each step should call exactly one tool
- Parameters must match the tool's schema
- Keep it simple - prefer 1-3 steps

Output JSON format:
{{
  "steps": [
    {{
      "step_number": 1,
      "description": "Brief description",
      "tool_id": "exact_tool_id",
      "parameters": {{"param1": "value1"}}
    }}
  ]
}}
"""

        try:
            response = completion(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": planning_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3  # Lower temperature for planning
            )

            plan_json = json.loads(response.choices[0].message.content)
            steps = [
                ReasoningStep(
                    step_number=s["step_number"],
                    description=s["description"],
                    tool_id=s["tool_id"],
                    parameters=s["parameters"]
                )
                for s in plan_json["steps"]
            ]

            logger.info(f"✅ Plan generated: {len(steps)} steps")
            for step in steps:
                logger.info(f"  Step {step.step_number}: {step.description} (tool: {step.tool_id})")

            return steps

        except Exception as e:
            logger.error(f"❌ Planning failed: {e}")
            return []

    def _execute(self, plan: List[ReasoningStep]) -> bool:
        """
        STEP 2: EXECUTE - Run tools without LLM

        JENTIC PATTERN: Execution Phase

        This is the "WithOut Observation" part of ReWOO.
        We execute tools directly without asking the LLM for guidance.
        This is faster and cheaper than traditional ReAct agents.

        Args:
            plan: List of steps to execute

        Returns:
            True if all steps succeeded, False otherwise
        """
        logger.info("⚙️ Execution phase...")

        all_succeeded = True

        for step in plan:
            logger.info(f"  Executing Step {step.step_number}: {step.description}")

            try:
                # Find the tool
                all_tools = self.tools.list_tools()
                tool_dict = next((t for t in all_tools if t["id"] == step.tool_id), None)

                if not tool_dict:
                    step.error = f"Tool not found: {step.tool_id}"
                    logger.error(f"    ❌ {step.error}")
                    all_succeeded = False
                    continue

                # Create tool wrapper (needed for execute method signature)
                from orchestrator.tools import BasslineTool
                tool = BasslineTool(
                    id=tool_dict["id"],
                    name=tool_dict["name"],
                    description=tool_dict["description"],
                    schema=tool_dict["schema"]
                )

                # Execute the tool
                result = self.tools.execute(tool, step.parameters)
                step.result = result

                logger.info(f"    ✅ Step {step.step_number} completed")

            except Exception as e:
                step.error = str(e)
                logger.error(f"    ❌ Step {step.step_number} failed: {e}")
                all_succeeded = False

        return all_succeeded

    def _reflect(self, goal: str, plan: List[ReasoningStep]) -> Dict[str, Any]:
        """
        STEP 3: REFLECT - Use LLM to validate results

        JENTIC PATTERN: Reflection Phase

        The LLM looks at the execution results and decides:
        - Did we achieve the goal? → Return final answer
        - Did something fail? → Suggest retry with adjusted approach

        Args:
            goal: Original user goal
            plan: Executed plan with results

        Returns:
            Dict with success, final_answer, reason, adjusted_goal
        """
        logger.info("🔍 Reflection phase...")

        # Build execution summary for LLM
        execution_summary = []
        for step in plan:
            summary = f"Step {step.step_number}: {step.description}"
            if step.error:
                summary += f"\n  ❌ ERROR: {step.error}"
            elif step.result:
                # Truncate result for readability
                result_str = str(step.result)[:200]
                summary += f"\n  ✅ RESULT: {result_str}"
            execution_summary.append(summary)

        reflection_prompt = f"""
{self.system_prompt}

USER GOAL: {goal}

EXECUTION SUMMARY:
{chr(10).join(execution_summary)}

Based on the execution results, determine:
1. Did we successfully achieve the user's goal?
2. If yes, provide a final answer for the user
3. If no, explain why and suggest how to adjust

Output JSON format:
{{
  "success": true/false,
  "final_answer": "Complete answer for the user" (if success=true),
  "reason": "Why it failed" (if success=false),
  "adjusted_goal": "Modified goal for retry" (if success=false)
}}
"""

        try:
            response = completion(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": reflection_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )

            reflection = json.loads(response.choices[0].message.content)

            if reflection.get("success"):
                logger.info(f"✅ Reflection: Success!")
            else:
                logger.warning(f"⚠️ Reflection: {reflection.get('reason', 'Unknown failure')}")

            return reflection

        except Exception as e:
            logger.error(f"❌ Reflection failed: {e}")
            return {
                "success": False,
                "reason": f"Reflection error: {e}",
                "adjusted_goal": goal
            }
