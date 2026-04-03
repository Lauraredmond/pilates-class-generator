#!/usr/bin/env python3
"""
Test script for SimplifiedStandardAgent + ReWOO reasoner

This tests the Plan→Execute→Reflect reasoning loop with a simple goal.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add orchestrator to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'orchestrator'))

from loguru import logger
from orchestrator.simplified_agent import BasslinePilatesCoachAgent

# Configure logger
logger.remove()
logger.add(sys.stdout, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>")


def test_simple_goal():
    """Test with a simple Pilates class generation goal"""

    logger.info("="*80)
    logger.info("TESTING: SimplifiedStandardAgent + ReWOO Reasoner")
    logger.info("="*80)

    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("❌ OPENAI_API_KEY not set in environment")
        logger.info("Please set OPENAI_API_KEY in your .env file")
        return

    logger.info(f"✅ OpenAI API key found: {os.getenv('OPENAI_API_KEY')[:10]}...")

    # Initialize agent
    logger.info("\n📦 Initializing BasslinePilatesCoachAgent...")
    agent = BasslinePilatesCoachAgent()

    # Display agent info
    info = agent.get_agent_info()
    logger.info("\n🤖 Agent Information:")
    for key, value in info.items():
        logger.info(f"  {key}: {value}")

    # Test goal
    goal = "Create a 20-minute beginner Pilates class"

    logger.info("\n" + "="*80)
    logger.info(f"🎯 GOAL: {goal}")
    logger.info("="*80 + "\n")

    # Solve
    try:
        result = agent.solve(goal)

        logger.info("\n" + "="*80)
        logger.info("📊 REASONING RESULT")
        logger.info("="*80)
        logger.info(f"Success: {result.success}")
        logger.info(f"Iterations: {result.iterations}")
        logger.info(f"Steps executed: {len(result.steps)}")

        if result.success:
            logger.info("\n✅ FINAL ANSWER:")
            logger.info(result.final_answer)

            logger.info("\n📋 EXECUTION TRACE:")
            for step in result.steps:
                status = "✅" if not step.error else "❌"
                logger.info(f"{status} Step {step.step_number}: {step.description}")
                logger.info(f"   Tool: {step.tool_id}")
                if step.error:
                    logger.error(f"   Error: {step.error}")
                elif step.result:
                    result_preview = str(step.result)[:100]
                    logger.info(f"   Result: {result_preview}...")
        else:
            logger.error(f"\n❌ FAILED: {result.error_message}")

    except Exception as e:
        logger.error(f"\n❌ Exception during reasoning: {e}", exc_info=True)

    logger.info("\n" + "="*80)
    logger.info("TEST COMPLETE")
    logger.info("="*80)


if __name__ == "__main__":
    test_simple_goal()
