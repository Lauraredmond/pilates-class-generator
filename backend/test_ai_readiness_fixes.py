"""
AI Readiness Fix Generator
Analyzes current OpenAPI spec and generates fixes for missing descriptions
"""

import requests
import json
from collections import defaultdict

# Fetch current spec
response = requests.get("https://pilates-dev-i0jb.onrender.com/openapi.json")
spec = response.json()

print("="*80)
print("AI READINESS DIAGNOSTIC REPORT")
print("="*80)
print()

# Track issues
issues = defaultdict(list)
total_params = 0
params_missing_desc = 0
total_request_bodies = 0
request_bodies_missing_desc = 0
total_responses = 0
responses_missing_meaningful_desc = 0

for path, methods in spec.get('paths', {}).items():
    for method, op in methods.items():
        if method not in ['get', 'post', 'put', 'patch', 'delete']:
            continue

        operation_id = op.get('operationId', f'{method} {path}')

        # Check parameters
        for param in op.get('parameters', []):
            total_params += 1
            if not param.get('description'):
                params_missing_desc += 1
                issues[path].append(f"  [{method.upper()}] Parameter '{param['name']}' missing description")

        # Check request body
        if 'requestBody' in op:
            total_request_bodies += 1
            if not op['requestBody'].get('description'):
                request_bodies_missing_desc += 1
                issues[path].append(f"  [{method.upper()}] Request body missing description")

        # Check responses
        for status, resp in op.get('responses', {}).items():
            total_responses += 1
            desc = resp.get('description', '')
            if not desc or desc in ['Successful Response', 'Validation Error']:
                responses_missing_meaningful_desc += 1
                issues[path].append(f"  [{method.upper()}] Response {status} has generic/missing description: '{desc}'")

print(f"PARAMETERS: {params_missing_desc}/{total_params} missing descriptions ({params_missing_desc/total_params*100:.1f}%)")
print(f"REQUEST BODIES: {request_bodies_missing_desc}/{total_request_bodies} missing descriptions ({request_bodies_missing_desc/total_request_bodies*100:.1f}%)")
print(f"RESPONSES: {responses_missing_meaningful_desc}/{total_responses} need meaningful descriptions ({responses_missing_meaningful_desc/total_responses*100:.1f}%)")
print()
print("="*80)
print("TOP 10 PATHS WITH MOST ISSUES")
print("="*80)

# Sort by number of issues
sorted_issues = sorted(issues.items(), key=lambda x: len(x[1]), reverse=True)
for path, path_issues in sorted_issues[:10]:
    print(f"\n{path} ({len(path_issues)} issues):")
    for issue in path_issues[:5]:  # Show first 5 issues
        print(issue)
    if len(path_issues) > 5:
        print(f"  ... and {len(path_issues) - 5} more")

print()
print("="*80)
print("RECOMMENDED FIXES")
print("="*80)
print("""
1. Add 'description' to all Field() annotations in Pydantic models
2. Add 'responses' dict to @router decorators with meaningful descriptions
3. Add 'description' parameter to Query(), Path() parameters
4. Consider using Body() wrapper with description for request bodies

Example fix for a model:
    user_id: str = Field(
        ...,
        example="user_123abc",
        description="Unique identifier for the user"  # ADD THIS
    )

Example fix for responses:
    @router.post(
        "/",
        response_model=ClassPlanResponse,
        responses={
            201: {"description": "Class plan created successfully with validation"},
            400: {"description": "Invalid sequence or safety rule violations"},
            500: {"description": "Internal server error during class creation"}
        }
    )
""")
