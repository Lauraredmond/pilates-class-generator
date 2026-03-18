"""
Quick test to verify camelCase conversion for operationIds
"""

def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase for AI-agent-friendly operationIds"""
    if not snake_str or '_' not in snake_str:
        return snake_str
    components = snake_str.split('_')
    # Keep first component lowercase, capitalize rest
    return components[0].lower() + ''.join(x.capitalize() for x in components[1:])

# Test cases based on actual operationIds from the API
test_cases = [
    ("Movement_Levels_get_movement_levels", "movementLevelsGetMovementLevels"),
    ("Classes_generate_class", "classesGenerateClass"),
    ("Movements_get_all_movements", "movementsGetAllMovements"),
    ("AI_Agents_invoke_agent", "aiAgentsInvokeAgent"),
    ("Class_Sections_get_all_sections", "classSectionsGetAllSections"),
    ("get_health", "getHealth"),
    ("create_user", "createUser"),
]

print("Testing camelCase conversion:")
print("=" * 80)
all_passed = True

for original, expected in test_cases:
    result = to_camel_case(original)
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"{status} | {original:45} → {result:35} (expected: {expected})")
    if result != expected:
        all_passed = False

print("=" * 80)
if all_passed:
    print("✅ All tests passed! Ready to deploy.")
else:
    print("❌ Some tests failed. Need to fix conversion logic.")
