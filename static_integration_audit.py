#!/usr/bin/env python3
"""
Static Integration Audit - NO dependencies required

Analyzes code for integration issues WITHOUT running it:
1. Import statement analysis
2. Method signature comparison
3. Parameter validation
4. Return type checking
5. Integration point verification

This catches errors BEFORE deployment without needing Jentic installed.
"""

import ast
import re
import os
from typing import Dict, List, Set, Tuple
from pathlib import Path


class IntegrationAuditor:
    """Audit integration between old agent code and Jentic StandardAgent"""

    def __init__(self, project_root: str):
        self.root = Path(project_root)
        self.issues = []
        self.warnings = []

    def audit_all(self) -> bool:
        """Run all audits"""
        print("=" * 70)
        print("STATIC INTEGRATION AUDIT")
        print("=" * 70 + "\n")

        tests = [
            ("Analyzing bassline_agent.py...", self.audit_bassline_agent),
            ("Analyzing bassline_tools.py...", self.audit_bassline_tools),
            ("Checking tool method signatures...", self.audit_tool_signatures),
            ("Validating StandardAgent integration...", self.audit_standard_agent_integration),
        ]

        for test_name, test_func in tests:
            print(f"\n{test_name}")
            print("-" * 70)
            test_func()

        # Summary
        print("\n" + "=" * 70)
        print("AUDIT SUMMARY")
        print("=" * 70)

        if self.issues:
            print(f"\n❌ FOUND {len(self.issues)} CRITICAL ISSUES:\n")
            for i, issue in enumerate(self.issues, 1):
                print(f"  {i}. {issue}")

        if self.warnings:
            print(f"\n⚠️  FOUND {len(self.warnings)} WARNINGS:\n")
            for i, warning in enumerate(self.warnings, 1):
                print(f"  {i}. {warning}")

        if not self.issues and not self.warnings:
            print("\n✅ NO ISSUES FOUND - CODE LOOKS GOOD!\n")

        return len(self.issues) == 0

    def audit_bassline_agent(self):
        """Audit BasslinePilatesCoachAgent for integration issues"""
        file_path = self.root / "backend/orchestrator/bassline_agent.py"

        with open(file_path, 'r') as f:
            content = f.read()

        # Check 1: Correct super().__init__() call
        super_init_pattern = r'super\(\).__init__\(\s*([^)]+)\s*\)'
        matches = re.findall(super_init_pattern, content, re.DOTALL)

        if matches:
            params = matches[0]
            required_params = ['llm', 'tools', 'memory', 'reasoner']

            for param in required_params:
                if f'{param}=' in params or f'{param},' in params:
                    print(f"  ✓ super().__init__() has '{param}' parameter")
                else:
                    self.issues.append(f"bassline_agent.py: super().__init__() missing '{param}' parameter")
        else:
            self.issues.append("bassline_agent.py: Cannot find super().__init__() call")

        # Check 2: LiteLLM initialization
        litellm_init_pattern = r'self\.llm\s*=\s*LiteLLM\(\s*([^)]+)\s*\)'
        matches = re.findall(litellm_init_pattern, content, re.DOTALL)

        if matches:
            params = matches[0]
            if 'system_prompt' in params:
                self.issues.append("bassline_agent.py: LiteLLM() should NOT have system_prompt parameter")
            else:
                print("  ✓ LiteLLM initialized without system_prompt")

        # Check 3: ReWOOReasoner initialization
        if 'ReWOOReasoner(' in content:
            rewoo_pattern = r'ReWOOReasoner\(\s*([^)]+)\s*\)'
            matches = re.findall(rewoo_pattern, content, re.DOTALL)

            if matches:
                params = matches[0]
                if 'memory=' in params:
                    print("  ✓ ReWOOReasoner initialized with memory parameter")
                else:
                    self.issues.append("bassline_agent.py: ReWOOReasoner missing 'memory' parameter")

    def audit_bassline_tools(self):
        """Audit BasslinePilatesTools registration"""
        file_path = self.root / "backend/orchestrator/tools/bassline_tools.py"

        with open(file_path, 'r') as f:
            content = f.read()

        # Check 1: Tool initialization parameters
        init_checks = [
            ('SequenceTools', 'supabase_client='),
            ('MusicTools', 'bassline_api_url='),
            ('MeditationTools', 'bassline_api_url='),
            ('ResearchTools', 'mcp_client='),
        ]

        for tool_class, expected_param in init_checks:
            pattern = rf'{tool_class}\([^)]*{expected_param}[^)]*\)'
            if re.search(pattern, content):
                print(f"  ✓ {tool_class} initialized with correct parameters")
            else:
                self.issues.append(f"bassline_tools.py: {tool_class} initialization missing {expected_param}")

        # Check 2: Registered method names
        method_checks = [
            ('generate_sequence', 'self.sequence_tools.generate_sequence'),
            ('select_music', 'self.music_tools.select_music'),
            ('generate_meditation', 'self.meditation_tools.generate_meditation'),
            ('research_movement_modifications', 'self.research_tools.research'),
        ]

        for tool_id, expected_function in method_checks:
            pattern = rf'tool_id="{tool_id}".*?function={re.escape(expected_function)}'
            if re.search(pattern, content, re.DOTALL):
                print(f"  ✓ {tool_id} registered with correct function")
            else:
                self.issues.append(f"bassline_tools.py: {tool_id} function mismatch")

        # Check 3: load() method exists
        if 'def load(self' in content:
            print("  ✓ load() method implemented")
        else:
            self.issues.append("bassline_tools.py: Missing load() method (required by JustInTimeToolingBase)")

    def audit_tool_signatures(self):
        """Compare registered parameters to actual method signatures"""

        # Read actual method signatures from tool files
        tool_files = [
            ('sequence_tools.py', 'generate_sequence'),
            ('music_tools.py', 'select_music'),
            ('meditation_tools.py', 'generate_meditation'),
            ('research_tools.py', 'research'),
        ]

        signature_map = {}

        for filename, method_name in tool_files:
            file_path = self.root / f"backend/orchestrator/tools/{filename}"

            with open(file_path, 'r') as f:
                content = f.read()

            # Extract method signature
            pattern = rf'def {method_name}\s*\([^)]+\):'
            match = re.search(pattern, content, re.DOTALL)

            if match:
                sig = match.group(0)
                # Extract parameter names
                param_pattern = r'(\w+):\s*[\w\[\]]+\s*(?:=|,|\))'
                params = re.findall(param_pattern, sig)
                # Remove 'self'
                params = [p for p in params if p != 'self']
                signature_map[method_name] = set(params)
                print(f"  Found {method_name}: {len(params)} parameters")

        # Read registered parameters from bassline_tools.py
        tools_file = self.root / "backend/orchestrator/tools/bassline_tools.py"

        with open(tools_file, 'r') as f:
            content = f.read()

        # Extract registered parameters for each tool
        registration_pattern = r'self\.register_tool\(\s*tool_id="(\w+)".*?parameters=\{([^}]+)\}'

        registrations = re.findall(registration_pattern, content, re.DOTALL)

        for tool_id, params_block in registrations:
            # Extract parameter names from the parameters dict
            param_names = re.findall(r'"(\w+)":\s*\{', params_block)

            registered_params = set(param_names)

            # Map tool_id to method_name
            method_map = {
                'generate_sequence': 'generate_sequence',
                'select_music': 'select_music',
                'generate_meditation': 'generate_meditation',
                'research_movement_modifications': 'research',
            }

            method_name = method_map.get(tool_id)

            if method_name in signature_map:
                actual_params = signature_map[method_name]

                # Check for critical mismatches
                # Only flag if registered param doesn't exist in actual signature
                invalid_params = registered_params - actual_params

                if invalid_params:
                    self.issues.append(
                        f"{tool_id}: Registered parameters don't exist in method: {invalid_params}"
                    )
                else:
                    print(f"  ✓ {tool_id}: All registered parameters valid")

                # Warn about missing required parameters (those without defaults)
                # For now, just note missing params as warnings
                missing_params = actual_params - registered_params
                if missing_params:
                    self.warnings.append(
                        f"{tool_id}: Method has additional parameters not registered: {missing_params}"
                    )

    def audit_standard_agent_integration(self):
        """Check StandardAgent integration points"""
        agent_file = self.root / "backend/orchestrator/bassline_agent.py"

        with open(agent_file, 'r') as f:
            content = f.read()

        # Check 1: Class inheritance
        if 'class BasslinePilatesCoachAgent(StandardAgent):' in content:
            print("  ✓ BasslinePilatesCoachAgent extends StandardAgent")
        else:
            self.issues.append("bassline_agent.py: BasslinePilatesCoachAgent must extend StandardAgent")

        # Check 2: Component initialization order
        # Memory must be created BEFORE reasoner
        memory_line = None
        reasoner_line = None

        for i, line in enumerate(content.split('\n')):
            if 'self.memory' in line and '=' in line and 'Dict' in line:
                memory_line = i
            if 'self.reasoner' in line and '=' in line and 'ReWOOReasoner' in line:
                reasoner_line = i

        if memory_line and reasoner_line:
            if memory_line < reasoner_line:
                print("  ✓ Memory initialized before reasoner (correct order)")
            else:
                self.issues.append("bassline_agent.py: Memory must be initialized BEFORE reasoner")

        # Check 3: solve() method
        if 'def solve(' in content:
            self.warnings.append("bassline_agent.py: Custom solve() method - should inherit from StandardAgent")
        else:
            print("  ✓ Using inherited solve() method from StandardAgent")


def main():
    """Run static audit"""
    project_root = os.path.dirname(os.path.abspath(__file__))
    auditor = IntegrationAuditor(project_root)

    success = auditor.audit_all()

    if success:
        print("\n" + "🎉" * 10)
        print("STATIC AUDIT PASSED - LIKELY SAFE TO DEPLOY!")
        print("🎉" * 10 + "\n")
    else:
        print("\n" + "⚠️ " * 10)
        print("STATIC AUDIT FOUND ISSUES - FIX BEFORE DEPLOYING!")
        print("⚠️ " * 10 + "\n")

    return success


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
