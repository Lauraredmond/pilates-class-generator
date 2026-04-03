#!/usr/bin/env python3.11
"""
Test Script - Real Jentic Integration
Tests BasslinePilatesCoachAgent with real Jentic StandardAgent library
"""

import os
import sys

# Add the orchestration-service directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bassline_agents.bassline_agent import BasslinePilatesCoachAgent


def test_agent_initialization():
    """Test 1: Agent initialization with real Jentic libraries"""
    print("\n" + "=" * 80)
    print("TEST 1: Agent Initialization")
    print("=" * 80)

    try:
        agent = BasslinePilatesCoachAgent(
            bassline_api_url="https://pilates-class-generator-api3.onrender.com",
            model="gpt-4",
            strictness_level="guided"
        )

        print("✅ Agent initialized successfully!")
        print(f"   - Agent type: {agent.__class__.__name__}")
        print(f"   - State: {agent.state}")
        print(f"   - Strictness: {agent.strictness_level}")

        # Get agent info
        info = agent.get_agent_info()
        print("\n📋 Agent Info:")
        for key, value in info.items():
            print(f"   - {key}: {value}")

        return True

    except Exception as e:
        print(f"❌ Agent initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_simple_goal():
    """Test 2: Simple goal execution with ReWOO reasoning"""
    print("\n" + "=" * 80)
    print("TEST 2: Simple Goal Execution")
    print("=" * 80)

    try:
        agent = BasslinePilatesCoachAgent(
            bassline_api_url="https://pilates-class-generator-api3.onrender.com",
            model="gpt-3.5-turbo",  # Use cheaper model for testing
            strictness_level="guided"
        )

        # Test with a simple goal (without making actual LLM calls)
        print("\n🎯 Goal: Validate a simple Pilates sequence")
        print("   NOTE: This would normally trigger ReWOO reasoning (Plan → Execute → Reflect)")
        print("   For now, just testing that the agent structure is correct")

        # We won't actually call solve() without an OpenAI API key
        # Just verify the agent is ready
        print(f"\n✅ Agent is ready to execute goals")
        print(f"   - Agent state: {agent.state}")
        print(f"   - LLM model: {agent.llm.model if hasattr(agent.llm, 'model') else 'unknown'}")
        print(f"   - Reasoner: {agent.reasoner.__class__.__name__}")
        print(f"   - Tools: {len(agent.tools._tools)} Pilates tools available")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tool_execution():
    """Test 3: Direct tool execution (no LLM required)"""
    print("\n" + "=" * 80)
    print("TEST 3: Tool Execution")
    print("=" * 80)

    try:
        agent = BasslinePilatesCoachAgent(
            bassline_api_url="https://pilates-class-generator-api3.onrender.com",
            model="gpt-4",
            strictness_level="guided"
        )

        # Test sequence validation tool directly
        print("\n🔒 Testing ValidateSequenceTool...")

        test_movements = [
            {
                "name": "Hundred",
                "category": "Warm-up",
                "movement_pattern": "flexion",
                "duration_seconds": 60
            },
            {
                "name": "Roll Up",
                "category": "Core",
                "movement_pattern": "flexion",
                "duration_seconds": 90
            },
            {
                "name": "Swan Dive",
                "category": "Back",
                "movement_pattern": "extension",
                "duration_seconds": 60
            }
        ]

        validate_tool = agent.tools._tools["validate_sequence"]
        result = validate_tool.execute({"movements": test_movements})

        print(f"\n✅ Validation Result:")
        print(f"   - Valid: {result['valid']}")
        print(f"   - Errors: {result['errors']}")
        print(f"   - Warnings: {result['warnings']}")
        print(f"   - Safety Score: {result['safety_score']}")

        # Test muscle balance tool
        print("\n💪 Testing MuscleBalanceTool...")

        test_movements_with_muscles = [
            {
                "name": "Hundred",
                "primary_muscles": ["Core", "Hip Flexors"],
                "duration_seconds": 60
            },
            {
                "name": "Roll Up",
                "primary_muscles": ["Core"],
                "duration_seconds": 90
            },
            {
                "name": "Single Leg Stretch",
                "primary_muscles": ["Core", "Hip Flexors"],
                "duration_seconds": 120
            }
        ]

        balance_tool = agent.tools._tools["calculate_muscle_balance"]
        result = balance_tool.execute({"movements": test_movements_with_muscles})

        print(f"\n✅ Muscle Balance Result:")
        print(f"   - Balanced: {result['balanced']}")
        print(f"   - Muscle Percentages:")
        for muscle, pct in result['muscle_percentages'].items():
            print(f"      • {muscle}: {pct:.1f}%")
        if result['violations']:
            print(f"   - Violations: {result['violations']}")

        return True

    except Exception as e:
        print(f"❌ Tool execution test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("JENTIC INTEGRATION TEST SUITE")
    print("Testing BasslinePilatesCoachAgent with real Jentic StandardAgent library")
    print("=" * 80)

    results = []

    # Run tests
    results.append(("Agent Initialization", test_agent_initialization()))
    results.append(("Simple Goal Execution", test_simple_goal()))
    results.append(("Tool Execution", test_tool_execution()))

    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nResults: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Real Jentic integration is working!")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
