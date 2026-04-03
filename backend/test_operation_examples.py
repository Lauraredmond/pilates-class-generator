#!/usr/bin/env python3
"""Test that operation-level examples are being generated"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

# Set minimal env vars to allow import
os.environ['SUPABASE_URL'] = 'https://dummy.supabase.co'
os.environ['SUPABASE_KEY'] = 'dummy-key'
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'dummy-service-key'
os.environ['JENTIC_API_KEY'] = 'dummy-key'
os.environ['OPENAI_API_KEY'] = 'dummy-key'
os.environ['DB_ENV'] = 'dev'

try:
    from api.main import app

    # Generate OpenAPI schema
    openapi_schema = app.openapi()

    # Count operations with examples
    operations_with_examples = 0
    total_operations = 0
    example_details = []

    for path, methods in openapi_schema.get('paths', {}).items():
        for method, operation in methods.items():
            if method not in ['get', 'post', 'put', 'delete', 'patch']:
                continue

            total_operations += 1
            has_example = False

            # Check request body examples
            req_body = operation.get('requestBody', {})
            content = req_body.get('content', {})
            for media_type, media_spec in content.items():
                if 'example' in media_spec or 'examples' in media_spec:
                    has_example = True
                    example_details.append(f"  Request: {method.upper()} {path}")
                    break

            # Check response examples
            for status, response in operation.get('responses', {}).items():
                resp_content = response.get('content', {})
                for media_type, media_spec in resp_content.items():
                    if 'example' in media_spec or 'examples' in media_spec:
                        has_example = True
                        example_details.append(f"  Response: {method.upper()} {path} [{status}]")
                        break

            if has_example:
                operations_with_examples += 1

    print(f"\n✅ OpenAPI Operation Examples:")
    print(f"   Operations with examples: {operations_with_examples}/{total_operations}")
    print(f"   Coverage: {operations_with_examples/total_operations*100:.1f}%")

    if operations_with_examples > 0:
        print(f"\n📋 Sample operations with examples (first 10):")
        for detail in example_details[:10]:
            print(detail)

    # Show comparison
    print(f"\n📊 Before custom generator: 2/136 operations (1.5%)")
    print(f"📊 After custom generator: {operations_with_examples}/{total_operations} operations ({operations_with_examples/total_operations*100:.1f}%)")

except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
