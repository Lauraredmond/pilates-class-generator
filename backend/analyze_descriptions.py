"""
Analyze OpenAPI spec for missing descriptions
Identifies which operations/parameters need descriptions for Jentic compliance
"""

import requests
import json
from collections import defaultdict

# Fetch current spec from deployed API
print("Fetching OpenAPI spec from deployed API...")
response = requests.get("https://pilates-dev-i0jb.onrender.com/openapi.json")
spec = response.json()

print("=" * 80)
print("DESCRIPTION COVERAGE ANALYSIS")
print("=" * 80)
print()

# Track missing descriptions
missing = defaultdict(list)

# Check operations
for path, methods in spec.get('paths', {}).items():
    for method, operation in methods.items():
        if method not in ['get', 'post', 'put', 'patch', 'delete']:
            continue

        op_id = operation.get('operationId', f'{method} {path}')

        # Check operation description
        if not operation.get('description') and not operation.get('summary'):
            missing['operations'].append(f"{method.upper()} {path}")

        # Check parameters
        for param in operation.get('parameters', []):
            if not param.get('description'):
                param_name = param.get('name', 'unknown')
                missing['parameters'].append(f"{method.upper()} {path} -> {param_name}")

print(f"Operations missing description: {len(missing['operations'])}")
print(f"Parameters missing description: {len(missing['parameters'])}")
print()

# Show sample of each category
print("SAMPLE OPERATIONS MISSING DESCRIPTIONS (first 10):")
for op in missing['operations'][:10]:
    print(f"  - {op}")
if len(missing['operations']) > 10:
    print(f"  ... and {len(missing['operations']) - 10} more")
print()

print("SAMPLE PARAMETERS MISSING DESCRIPTIONS (first 10):")
for param in missing['parameters'][:10]:
    print(f"  - {param}")
if len(missing['parameters']) > 10:
    print(f"  ... and {len(missing['parameters']) - 10} more")
print()

# Group operations by router/prefix for systematic fixing
print("=" * 80)
print("OPERATIONS BY ROUTER (for systematic fixing):")
print("=" * 80)

routers = defaultdict(list)
for op in missing['operations']:
    if '/api/movements' in op:
        routers['movements'].append(op)
    elif '/api/agents' in op:
        routers['agents'].append(op)
    elif '/api/classes' in op:
        routers['classes'].append(op)
    elif '/api/analytics' in op:
        routers['analytics'].append(op)
    elif '/api/auth' in op:
        routers['auth'].append(op)
    elif '/api/users' in op:
        routers['users'].append(op)
    elif '/api/compliance' in op:
        routers['compliance'].append(op)
    elif '/api/music' in op:
        routers['music'].append(op)
    elif '/api/class-sections' in op:
        routers['class_sections'].append(op)
    elif '/api/beta-errors' in op:
        routers['beta_errors'].append(op)
    elif '/api/feedback' in op:
        routers['feedback'].append(op)
    elif '/api/admin' in op:
        routers['admin'].append(op)
    elif '/api/coach' in op:
        routers['coach'].append(op)
    elif '/api/debug' in op:
        routers['debug'].append(op)
    else:
        routers['other'].append(op)

for router, ops in sorted(routers.items()):
    print(f"\n{router}.py: {len(ops)} operations need descriptions")
    for op in ops[:3]:
        print(f"  - {op}")
    if len(ops) > 3:
        print(f"  ... and {len(ops) - 3} more")

print()
print("=" * 80)
print("RECOMMENDATION:")
print("=" * 80)
print("Add description/summary to docstrings in these router files:")
for router, ops in sorted(routers.items(), key=lambda x: -len(x[1])):
    if len(ops) > 0:
        print(f"  - api/{router}.py ({len(ops)} operations)")
