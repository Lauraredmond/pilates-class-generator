#!/usr/bin/env python3
"""
Comprehensive Integration Test Suite
Session 8: AI Agent Integration
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5174"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name: str):
    print(f"\n{Colors.BLUE}🧪 TEST: {name}{Colors.END}")

def print_success(message: str):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message: str):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message: str):
    print(f"{Colors.YELLOW}ℹ️  {message}{Colors.END}")

# Test Results Storage
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def record_test(test_name: str, passed: bool, details: str = ""):
    test_results["tests"].append({
        "name": test_name,
        "passed": passed,
        "details": details
    })
    if passed:
        test_results["passed"] += 1
        print_success(f"PASSED: {test_name}")
    else:
        test_results["failed"] += 1
        print_error(f"FAILED: {test_name}")
    if details:
        print_info(details)

# ============================================
# TEST 1: System Health Checks
# ============================================

def test_system_health():
    print_test("System Health Checks")

    # Test 1.1: Backend Health
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            record_test("Backend Health Check", True, f"Version: {data.get('version')}")
        else:
            record_test("Backend Health Check", False, f"Status: {response.status_code}")
    except Exception as e:
        record_test("Backend Health Check", False, str(e))

    # Test 1.2: Frontend Accessibility
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        record_test("Frontend Accessibility", response.status_code == 200)
    except Exception as e:
        record_test("Frontend Accessibility", False, str(e))

    # Test 1.3: Database Connectivity
    try:
        response = requests.get(f"{BASE_URL}/api/movements/stats/summary", timeout=5)
        if response.status_code == 200:
            data = response.json()
            record_test("Database Connectivity",
                       data.get('database_connected') == True,
                       f"Movements in DB: {data.get('total_movements')}")
        else:
            record_test("Database Connectivity", False)
    except Exception as e:
        record_test("Database Connectivity", False, str(e))

# ============================================
# TEST 2: Movement Data Consistency
# ============================================

def test_movement_data():
    print_test("Movement Data Consistency")

    # Test 2.1: Get All Movements
    try:
        response = requests.get(f"{BASE_URL}/api/movements", timeout=5)
        if response.status_code == 200:
            movements = response.json()
            record_test("Get All Movements",
                       len(movements) == 34,
                       f"Found {len(movements)} movements (expected 34)")
        else:
            record_test("Get All Movements", False)
    except Exception as e:
        record_test("Get All Movements", False, str(e))

    # Test 2.2: Filter by Difficulty
    try:
        response = requests.get(f"{BASE_URL}/api/movements/difficulty/Beginner", timeout=5)
        if response.status_code == 200:
            movements = response.json()
            record_test("Filter Beginner Movements",
                       len(movements) > 0,
                       f"Found {len(movements)} beginner movements")
        else:
            record_test("Filter Beginner Movements", False)
    except Exception as e:
        record_test("Filter Beginner Movements", False, str(e))

    # Test 2.3: Movement Data Structure
    try:
        response = requests.get(f"{BASE_URL}/api/movements", timeout=5)
        if response.status_code == 200:
            movements = response.json()
            if movements:
                first_movement = movements[0]
                required_fields = ['id', 'name', 'difficulty_level', 'category']
                has_all_fields = all(field in first_movement for field in required_fields)
                record_test("Movement Data Structure",
                           has_all_fields,
                           f"Fields: {', '.join(first_movement.keys())}")
            else:
                record_test("Movement Data Structure", False, "No movements found")
        else:
            record_test("Movement Data Structure", False)
    except Exception as e:
        record_test("Movement Data Structure", False, str(e))

# ============================================
# TEST 3: AI Agent Integration
# ============================================

def test_ai_agents():
    print_test("AI Agent Integration")

    # Test 3.1: Agent Info Endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/agents/agent-info", timeout=5)
        if response.status_code == 200:
            data = response.json()
            agents = data.get('agents', {})
            expected_agents = ['sequence', 'music', 'meditation', 'research']
            all_present = all(agent in agents for agent in expected_agents)
            record_test("Agent Info Endpoint",
                       all_present,
                       f"Agents: {', '.join(agents.keys())}")
        else:
            record_test("Agent Info Endpoint", False)
    except Exception as e:
        record_test("Agent Info Endpoint", False, str(e))

    # Test 3.2: Sequence Generation (Beginner)
    try:
        payload = {
            "target_duration_minutes": 30,
            "difficulty_level": "Beginner",
            "focus_areas": ["core"],
            "strictness_level": "guided",
            "include_mcp_research": False
        }
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/agents/generate-sequence",
            json=payload,
            timeout=60
        )
        elapsed_time = (time.time() - start_time) * 1000

        if response.status_code == 200:
            data = response.json()
            sequence_data = data.get('data', {})
            sequence = sequence_data.get('sequence', [])
            record_test("Sequence Generation (Beginner)",
                       data.get('success') == True and len(sequence) > 0,
                       f"Generated {len(sequence)} movements in {elapsed_time:.0f}ms")
        else:
            record_test("Sequence Generation (Beginner)", False,
                       f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        record_test("Sequence Generation (Beginner)", False, str(e))

    # Test 3.3: Sequence Generation (Intermediate)
    try:
        payload = {
            "target_duration_minutes": 45,
            "difficulty_level": "Intermediate",
            "strictness_level": "guided",
            "include_mcp_research": False
        }
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/agents/generate-sequence",
            json=payload,
            timeout=60
        )
        elapsed_time = (time.time() - start_time) * 1000

        if response.status_code == 200:
            data = response.json()
            sequence_data = data.get('data', {})
            sequence = sequence_data.get('sequence', [])
            record_test("Sequence Generation (Intermediate)",
                       data.get('success') == True and len(sequence) > 0,
                       f"Generated {len(sequence)} movements in {elapsed_time:.0f}ms")
        else:
            record_test("Sequence Generation (Intermediate)", False)
    except Exception as e:
        record_test("Sequence Generation (Intermediate)", False, str(e))

# ============================================
# TEST 4: Safety Validation
# ============================================

def test_safety_validation():
    print_test("Safety Validation")

    # Test 4.1: Invalid Duration (too short)
    try:
        payload = {
            "target_duration_minutes": 10,  # Below minimum of 15
            "difficulty_level": "Beginner",
            "strictness_level": "guided",
            "include_mcp_research": False
        }
        response = requests.post(
            f"{BASE_URL}/api/agents/generate-sequence",
            json=payload,
            timeout=10
        )
        # Should return 400 or 422 for validation error
        record_test("Reject Invalid Duration (too short)",
                   response.status_code in [400, 422],
                   f"Status: {response.status_code}")
    except Exception as e:
        record_test("Reject Invalid Duration (too short)", False, str(e))

    # Test 4.2: Invalid Difficulty Level
    try:
        payload = {
            "target_duration_minutes": 30,
            "difficulty_level": "Expert",  # Invalid level
            "strictness_level": "guided",
            "include_mcp_research": False
        }
        response = requests.post(
            f"{BASE_URL}/api/agents/generate-sequence",
            json=payload,
            timeout=10
        )
        # Should reject or handle gracefully
        passed = response.status_code in [400, 422, 500]
        record_test("Reject Invalid Difficulty",
                   passed,
                   f"Status: {response.status_code}")
    except Exception as e:
        record_test("Reject Invalid Difficulty", False, str(e))

# ============================================
# TEST 5: Performance Metrics
# ============================================

def test_performance():
    print_test("Performance Metrics")

    # Test 5.1: Sequence Generation Speed
    try:
        payload = {
            "target_duration_minutes": 30,
            "difficulty_level": "Beginner",
            "strictness_level": "guided",
            "include_mcp_research": False
        }

        times = []
        for i in range(3):
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/api/agents/generate-sequence",
                json=payload,
                timeout=60
            )
            elapsed = (time.time() - start_time) * 1000
            times.append(elapsed)

        avg_time = sum(times) / len(times)
        record_test("Sequence Generation Performance",
                   avg_time < 5000,  # Should be under 5 seconds
                   f"Avg time: {avg_time:.0f}ms (min: {min(times):.0f}ms, max: {max(times):.0f}ms)")
    except Exception as e:
        record_test("Sequence Generation Performance", False, str(e))

    # Test 5.2: Movement Data Retrieval Speed
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/api/movements", timeout=5)
        elapsed = (time.time() - start_time) * 1000

        record_test("Movement Data Retrieval Speed",
                   elapsed < 1000,  # Should be under 1 second
                   f"Time: {elapsed:.0f}ms")
    except Exception as e:
        record_test("Movement Data Retrieval Speed", False, str(e))

# ============================================
# TEST 6: CORS and Frontend Integration
# ============================================

def test_cors():
    print_test("CORS and Frontend Integration")

    # Test 6.1: CORS Headers
    try:
        response = requests.options(
            f"{BASE_URL}/api/movements",
            headers={'Origin': FRONTEND_URL}
        )
        has_cors = 'access-control-allow-origin' in response.headers
        record_test("CORS Headers Present",
                   has_cors,
                   f"Headers: {', '.join(response.headers.keys())}")
    except Exception as e:
        record_test("CORS Headers Present", False, str(e))

# ============================================
# RUN ALL TESTS
# ============================================

def run_all_tests():
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}🚀 INTEGRATION TEST SUITE - SESSION 8{Colors.END}")
    print(f"{'='*60}")

    test_system_health()
    test_movement_data()
    test_ai_agents()
    test_safety_validation()
    test_performance()
    test_cors()

    # Print Summary
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}📊 TEST SUMMARY{Colors.END}")
    print(f"{'='*60}")
    print(f"Total Tests: {test_results['passed'] + test_results['failed']}")
    print(f"{Colors.GREEN}✅ Passed: {test_results['passed']}{Colors.END}")
    print(f"{Colors.RED}❌ Failed: {test_results['failed']}{Colors.END}")

    if test_results['failed'] > 0:
        print(f"\n{Colors.RED}Failed Tests:{Colors.END}")
        for test in test_results['tests']:
            if not test['passed']:
                print(f"  - {test['name']}: {test['details']}")

    # Save detailed results to file
    with open('integration_test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    print(f"\n{Colors.BLUE}📁 Detailed results saved to: integration_test_results.json{Colors.END}")

    success_rate = (test_results['passed'] / (test_results['passed'] + test_results['failed'])) * 100
    print(f"\n{Colors.BLUE}Success Rate: {success_rate:.1f}%{Colors.END}")
    print(f"{'='*60}\n")

    return test_results['failed'] == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
