#!/usr/bin/env python3
"""Test OpenAPI generation locally to diagnose the 500 error"""

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

    # Try to generate OpenAPI schema
    print("Attempting to generate OpenAPI schema...")
    openapi_schema = app.openapi()
    print(f"✅ OpenAPI schema generated successfully!")
    print(f"   Title: {openapi_schema.get('info', {}).get('title')}")
    print(f"   Version: {openapi_schema.get('info', {}).get('version')}")
    print(f"   Paths: {len(openapi_schema.get('paths', {}))}")
    print(f"   Schemas: {len(openapi_schema.get('components', {}).get('schemas', {}))}")

except Exception as e:
    print(f"❌ Error generating OpenAPI schema:")
    print(f"   Type: {type(e).__name__}")
    print(f"   Message: {str(e)}")
    import traceback
    print("\nFull traceback:")
    traceback.print_exc()