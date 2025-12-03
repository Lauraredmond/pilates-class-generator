#!/usr/bin/env python3
"""
Comprehensive agent initialization test - catches errors BEFORE deployment

This script attempts to:
1. Import all Jentic dependencies
2. Instantiate BasslinePilatesCoachAgent
3. Verify all tools are registered correctly
4. Test tool parameter validation
5. Check for any remaining integration issues

Run this locally to catch errors before pushing to Render.
"""

import sys
import os

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test 1: Can we import everything?"""
    print("=" * 70)
    print("TEST 1: IMPORTS")
    print("=" * 70)

    try:
        print("✓ Importing Jentic StandardAgent...")
        from agents.standard_agent import StandardAgent
        print("✓ Importing Jentic ReWOOReasoner...")
        from agents.reasoner.rewoo import ReWOOReasoner
        print("✓ Importing Jentic LiteLLM...")
        from agents.llm.litellm import LiteLLM
        print("✓ Importing Jentic JustInTimeToolingBase...")
        from agents.tools.base import JustInTimeToolingBase
        print("✓ Importing BasslinePilatesCoachAgent...")
        from orchestrator.bassline_agent import BasslinePilatesCoachAgent
        print("✓ Importing BasslinePilatesTools...")
        from orchestrator.tools.bassline_tools import BasslinePilatesTools

        print("\n✅ ALL IMPORTS SUCCESSFUL\n")
        return True
    except Exception as e:
        print(f"\n❌ IMPORT FAILED: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_tool_initialization():
    """Test 2: Can we initialize tools without database?"""
    print("=" * 70)
    print("TEST 2: TOOL INITIALIZATION")
    print("=" * 70)

    try:
        from orchestrator.tools.bassline_tools import BasslinePilatesTools

        print("✓ Initializing BasslinePilatesTools (no database)...")
        tools = BasslinePilatesTools(
            bassline_api_url="http://localhost:8000",
            supabase_client=None  # No database in test
        )

        print(f"✓ Tools initialized with {len(tools.list_tools())} registered tools")

        print("\n✅ TOOL INITIALIZATION SUCCESSFUL\n")
        return tools
    except Exception as e:
        print(f"\n❌ TOOL INITIALIZATION FAILED: {e}\n")
        import traceback
        traceback.print_exc()
        return None


def test_tool_registry(tools):
    """Test 3: Are all tools registered with correct parameters?"""
    print("=" * 70)
    print("TEST 3: TOOL REGISTRY VALIDATION")
    print("=" * 70)

    if not tools:
        print("❌ Skipping (tools not initialized)")
        return False

    try:
        all_tools = tools.list_tools()

        print(f"Found {len(all_tools)} registered tools:\n")

        for tool in all_tools:
            print(f"  Tool ID: {tool['id']}")
            print(f"  Name: {tool['name']}")
            print(f"  Parameters: {list(tool['parameters'].keys())}")
            print(f"  Function: {tool['function'].__name__}")
            print()

        # Verify expected tools
        expected_tool_ids = ['generate_sequence', 'select_music', 'generate_meditation', 'research_movement_modifications']
        actual_tool_ids = [t['id'] for t in all_tools]

        for expected_id in expected_tool_ids:
            if expected_id in actual_tool_ids:
                print(f"✓ {expected_id} registered")
            else:
                print(f"❌ {expected_id} MISSING!")
                return False

        print("\n✅ ALL TOOLS REGISTERED CORRECTLY\n")
        return True
    except Exception as e:
        print(f"\n❌ TOOL REGISTRY VALIDATION FAILED: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_agent_initialization():
    """Test 4: Can we initialize the full agent?"""
    print("=" * 70)
    print("TEST 4: AGENT INITIALIZATION")
    print("=" * 70)

    try:
        from orchestrator.bassline_agent import BasslinePilatesCoachAgent

        print("✓ Initializing BasslinePilatesCoachAgent (no database)...")
        agent = BasslinePilatesCoachAgent(supabase_client=None)

        print(f"✓ Agent initialized successfully")
        print(f"✓ Agent state: {getattr(agent, '_state', 'unknown')}")
        print(f"✓ Agent LLM: {agent.llm.model}")
        print(f"✓ Agent has {len(agent.tools.list_tools())} tools")

        print("\n✅ AGENT INITIALIZATION SUCCESSFUL\n")
        return agent
    except Exception as e:
        print(f"\n❌ AGENT INITIALIZATION FAILED: {e}\n")
        import traceback
        traceback.print_exc()
        return None


def test_parameter_matching():
    """Test 5: Do registered parameters match actual method signatures?"""
    print("=" * 70)
    print("TEST 5: PARAMETER SIGNATURE MATCHING")
    print("=" * 70)

    try:
        import inspect
        from orchestrator.tools.sequence_tools import SequenceTools
        from orchestrator.tools.music_tools import MusicTools
        from orchestrator.tools.meditation_tools import MeditationTools
        from orchestrator.tools.research_tools import ResearchTools
        from orchestrator.tools.bassline_tools import BasslinePilatesTools

        # Get registered parameters
        tools_instance = BasslinePilatesTools(bassline_api_url=None, supabase_client=None)
        registered_tools = {t['id']: t for t in tools_instance.list_tools()}

        # Check each tool
        checks = []

        # 1. SequenceTools.generate_sequence
        tool_id = 'generate_sequence'
        actual_sig = inspect.signature(SequenceTools.generate_sequence)
        registered_params = set(registered_tools[tool_id]['parameters'].keys())
        actual_params = set(actual_sig.parameters.keys()) - {'self'}

        print(f"\n{tool_id}:")
        print(f"  Registered: {registered_params}")
        print(f"  Actual: {actual_params}")

        missing = actual_params - registered_params
        extra = registered_params - actual_params

        if missing:
            print(f"  ⚠️  Missing from registration: {missing}")
        if extra:
            print(f"  ⚠️  Extra in registration: {extra}")
        if not missing and not extra:
            print(f"  ✓ Parameters match!")

        checks.append((tool_id, not missing))

        # 2. MusicTools.select_music
        tool_id = 'select_music'
        actual_sig = inspect.signature(MusicTools.select_music)
        registered_params = set(registered_tools[tool_id]['parameters'].keys())
        actual_params = set(actual_sig.parameters.keys()) - {'self'}

        print(f"\n{tool_id}:")
        print(f"  Registered: {registered_params}")
        print(f"  Actual: {actual_params}")

        missing = actual_params - registered_params
        extra = registered_params - actual_params

        if missing:
            print(f"  ⚠️  Missing from registration: {missing}")
        if extra:
            print(f"  ℹ️  Extra in registration (optional extensions): {extra}")
        if not missing:
            print(f"  ✓ All required parameters registered!")

        checks.append((tool_id, not missing))

        # 3. MeditationTools.generate_meditation
        tool_id = 'generate_meditation'
        actual_sig = inspect.signature(MeditationTools.generate_meditation)
        registered_params = set(registered_tools[tool_id]['parameters'].keys())
        actual_params = set(actual_sig.parameters.keys()) - {'self'}

        print(f"\n{tool_id}:")
        print(f"  Registered: {registered_params}")
        print(f"  Actual: {actual_params}")

        missing = actual_params - registered_params
        extra = registered_params - actual_params

        if missing:
            print(f"  ⚠️  Missing from registration: {missing}")
        if extra:
            print(f"  ℹ️  Extra in registration: {extra}")
        if not missing and not extra:
            print(f"  ✓ Parameters match!")

        checks.append((tool_id, not missing))

        # 4. ResearchTools.research
        tool_id = 'research_movement_modifications'
        actual_sig = inspect.signature(ResearchTools.research)
        registered_params = set(registered_tools[tool_id]['parameters'].keys())
        actual_params = set(actual_sig.parameters.keys()) - {'self'}

        print(f"\n{tool_id} (maps to ResearchTools.research):")
        print(f"  Registered: {registered_params}")
        print(f"  Actual: {actual_params}")

        missing = actual_params - registered_params
        extra = registered_params - actual_params

        if missing:
            print(f"  ⚠️  Missing from registration: {missing}")
        if extra:
            print(f"  ℹ️  Extra in registration: {extra}")
        if not missing and not extra:
            print(f"  ✓ Parameters match!")

        checks.append((tool_id, not missing))

        # Summary
        all_pass = all(passed for _, passed in checks)
        if all_pass:
            print("\n✅ ALL PARAMETER SIGNATURES MATCH\n")
        else:
            failed = [name for name, passed in checks if not passed]
            print(f"\n❌ PARAMETER MISMATCHES IN: {failed}\n")

        return all_pass

    except Exception as e:
        print(f"\n❌ PARAMETER MATCHING TEST FAILED: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("COMPREHENSIVE AGENT INTEGRATION TEST")
    print("=" * 70 + "\n")

    results = []

    # Test 1: Imports
    results.append(("Imports", test_imports()))

    if not results[-1][1]:
        print("❌ Cannot proceed - imports failed")
        return False

    # Test 2: Tool initialization
    tools = test_tool_initialization()
    results.append(("Tool Initialization", tools is not None))

    if not results[-1][1]:
        print("❌ Cannot proceed - tool initialization failed")
        return False

    # Test 3: Tool registry
    results.append(("Tool Registry", test_tool_registry(tools)))

    # Test 4: Agent initialization
    agent = test_agent_initialization()
    results.append(("Agent Initialization", agent is not None))

    # Test 5: Parameter matching
    results.append(("Parameter Matching", test_parameter_matching()))

    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)

    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")

    all_pass = all(passed for _, passed in results)

    if all_pass:
        print("\n" + "🎉" * 10)
        print("ALL TESTS PASSED - SAFE TO DEPLOY!")
        print("🎉" * 10 + "\n")
    else:
        print("\n" + "⚠️ " * 10)
        print("SOME TESTS FAILED - FIX BEFORE DEPLOYING!")
        print("⚠️ " * 10 + "\n")

    return all_pass


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
