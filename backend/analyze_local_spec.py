"""
Analyze local OpenAPI spec for description coverage
Run this BEFORE deploying to verify Jentic compliance
"""
import json
from collections import defaultdict

def analyze_openapi_file(filepath="local_openapi.json"):
    """Analyze OpenAPI spec from file"""
    try:
        with open(filepath, 'r') as f:
            spec = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: {filepath} not found")
        print("\nRun this first:")
        print("  curl http://localhost:8000/openapi.json > local_openapi.json")
        return

    print("=" * 80)
    print("JENTIC READINESS ANALYSIS (LOCAL)")
    print("=" * 80)

    # 1. Description Coverage
    print("\n1. DESCRIPTION COVERAGE")
    print("-" * 80)

    total_elements = 0
    described_elements = 0
    missing_by_category = defaultdict(list)

    # Schema properties (the BIG one for Jentic)
    schemas = spec.get('components', {}).get('schemas', {})
    schema_props_total = 0
    schema_props_with_desc = 0

    for schema_name, schema in schemas.items():
        props = schema.get('properties', {})
        for prop_name, prop in props.items():
            schema_props_total += 1
            total_elements += 1
            if prop.get('description'):
                schema_props_with_desc += 1
                described_elements += 1
            else:
                missing_by_category['schema_properties'].append(f'{schema_name}.{prop_name}')

    # Operations
    ops_total = 0
    ops_with_desc = 0
    for path, methods in spec.get('paths', {}).items():
        for method, operation in methods.items():
            if method not in ['get', 'post', 'put', 'patch', 'delete']:
                continue
            ops_total += 1
            total_elements += 1
            if operation.get('description') or operation.get('summary'):
                ops_with_desc += 1
                described_elements += 1
            else:
                missing_by_category['operations'].append(f'{method.upper()} {path}')

    # Parameters
    params_total = 0
    params_with_desc = 0
    for path, methods in spec.get('paths', {}).items():
        for method, operation in methods.items():
            if method not in ['get', 'post', 'put', 'patch', 'delete']:
                continue
            for param in operation.get('parameters', []):
                params_total += 1
                total_elements += 1
                if param.get('description'):
                    params_with_desc += 1
                    described_elements += 1
                else:
                    missing_by_category['parameters'].append(f"{method.upper()} {path} -> {param.get('name')}")

    # Responses
    responses_total = 0
    responses_with_desc = 0
    for path, methods in spec.get('paths', {}).items():
        for method, operation in methods.items():
            if method not in ['get', 'post', 'put', 'patch', 'delete']:
                continue
            for status_code, response in operation.get('responses', {}).items():
                responses_total += 1
                total_elements += 1
                if response.get('description'):
                    responses_with_desc += 1
                    described_elements += 1

    coverage_pct = (described_elements / total_elements * 100) if total_elements > 0 else 0

    print(f"Total elements: {described_elements}/{total_elements} ({coverage_pct:.1f}%)")
    print(f"\nBreakdown:")
    print(f"  Schema properties: {schema_props_with_desc}/{schema_props_total} ({schema_props_with_desc/schema_props_total*100:.1f}%)")
    print(f"  Operations: {ops_with_desc}/{ops_total} ({ops_with_desc/ops_total*100:.1f}%)")
    print(f"  Parameters: {params_with_desc}/{params_total} ({params_with_desc/params_total*100:.1f}%)")
    print(f"  Responses: {responses_with_desc}/{responses_total} ({responses_with_desc/responses_total*100:.1f}%)")

    # 2. Error Standardization
    print("\n\n2. ERROR STANDARDIZATION (RFC 9457)")
    print("-" * 80)

    compliant_ops = 0
    total_ops = 0

    for path, methods in spec.get('paths', {}).items():
        for method, operation in methods.items():
            if method not in ['get', 'post', 'put', 'patch', 'delete']:
                continue
            total_ops += 1

            # Check for application/problem+json in error responses
            has_rfc9457 = False
            for error_code in ['400', '401', '403', '404', '422', '500']:
                if error_code in operation.get('responses', {}):
                    response = operation['responses'][error_code]
                    if 'application/problem+json' in response.get('content', {}):
                        has_rfc9457 = True
                        break

            if has_rfc9457:
                compliant_ops += 1

    error_pct = (compliant_ops / total_ops * 100) if total_ops > 0 else 0
    print(f"RFC 9457 compliant: {compliant_ops}/{total_ops} ({error_pct:.1f}%)")

    # 3. Summary
    print("\n" + "=" * 80)
    print("JENTIC SCORE ESTIMATE")
    print("=" * 80)

    # Estimate based on Jentic's weighting
    desc_score = min(coverage_pct / 80 * 100, 100)  # Target: 80%
    error_score = min(error_pct / 90 * 100, 100)    # Target: 90%

    print(f"Description Coverage: {coverage_pct:.1f}% (target: 80%+) → {desc_score:.0f}/100")
    print(f"Error Standardization: {error_pct:.1f}% (target: 90%+) → {error_score:.0f}/100")

    overall_estimate = (desc_score * 0.4 + error_score * 0.3 + 99 * 0.3)  # 99 for OperationId
    print(f"\nEstimated Overall Score: {overall_estimate:.0f}/100")

    # 4. What needs fixing
    print("\n" + "=" * 80)
    print("ACTION ITEMS")
    print("=" * 80)

    if coverage_pct < 75:
        print(f"❌ Need {schema_props_total - schema_props_with_desc} more schema property descriptions")
        print(f"   Top schemas missing descriptions:")
        schema_missing = defaultdict(int)
        for item in missing_by_category['schema_properties'][:50]:
            schema_name = item.split('.')[0]
            schema_missing[schema_name] += 1
        for schema, count in sorted(schema_missing.items(), key=lambda x: -x[1])[:10]:
            print(f"     - {schema}: {count} properties")
    else:
        print("✅ Description coverage is good!")

    if error_pct < 85:
        print(f"\n❌ Need {total_ops - compliant_ops} more operations with RFC 9457 errors")
    else:
        print("\n✅ Error standardization is good!")

    print("\n" + "=" * 80)

    return {
        'coverage_pct': coverage_pct,
        'error_pct': error_pct,
        'estimated_score': overall_estimate
    }

if __name__ == "__main__":
    analyze_openapi_file()
