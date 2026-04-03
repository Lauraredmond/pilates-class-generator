"""
Generate Agent Gateway OpenAPI Spec
Creates a separate OpenAPI spec containing only /api/agent/* endpoints
Optimized for Jentic AI Readiness scoring
"""

import json
import yaml
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from api.main import app


def get_agent_gateway_spec_dict():
    """
    Get Agent Gateway OpenAPI spec as a dictionary (without saving files)

    This is the core spec generation logic used by:
    - API endpoint: /api/agent/openapi.json
    - CLI script: generate_agent_gateway_spec.py

    Returns a simplified, agent-focused spec optimized for:
    - Jentic AI Readiness scoring (target: 70-90/100)
    - OpenClaw integration
    - Lower operation count (11 vs 131)
    - Simpler schema depth (≤3)
    - Clear agent-first documentation

    Returns:
        dict: OpenAPI 3.1.0 spec with only agent gateway endpoints
    """
    # Generate full OpenAPI spec
    full_spec = app.openapi()

    # Create new spec with only agent gateway paths
    agent_spec = {
        "openapi": full_spec["openapi"],
        "info": {
            "title": "Pilates Class Planner - Agent Gateway API",
            "version": "2.0.0",
            "description": """
# Pilates Class Planner - AI Agent Gateway

Simplified API optimized for AI agents (Jentic, OpenClaw, etc.)

## 🎯 Purpose

This API provides a high-level, agent-friendly interface to the Pilates Class Planner.
Instead of navigating 131 endpoints, agents use **13 simplified workflows**.

## 🚀 Quick Start for AI Agents

### 1. Authentication
```bash
POST /api/agent/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### 2. Generate a Class
```bash
POST /api/agent/classes/generate
Authorization: Bearer <token>
{
  "duration_minutes": 60,
  "difficulty_level": "Beginner",
  "focus_areas": ["core", "back"],
  "include_music": true,
  "include_meditation": true
}
```

### 3. Get User Analytics
```bash
GET /api/agent/analytics
Authorization: Bearer <token>
```

## 📊 Key Features

- **Simple Auth**: Login → Get token → Use everywhere
- **Class Generation**: One endpoint creates complete classes
- **Analytics**: Aggregated stats in one call
- **Movements**: Search with simple filters
- **Music**: Browse playlists easily

## 🔐 Authentication

All endpoints except `/api/agent/auth/login` and `/api/agent/auth/register` require:

```
Authorization: Bearer <access_token>
```

Get your token from the login endpoint.

## 📈 Rate Limits

- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour

## 🛠️ Support

- Docs: https://docs.basslinepilates.com
- Issues: https://github.com/basslinepilates/api/issues
""",
            "contact": {
                "name": "Bassline Pilates API Support",
                "url": "https://docs.basslinepilates.com",
                "email": "support@basslinepilates.com"
            },
            "license": {
                "name": "MIT",
                "url": "https://opensource.org/licenses/MIT"
            }
        },
        "servers": [
            {
                "url": "https://pilates-class-generator-api3.onrender.com",
                "description": "Production server on Render"
            },
            {
                "url": "https://pilates-dev-i0jb.onrender.com",
                "description": "Development server on Render"
            },
            {
                "url": "http://localhost:8000",
                "description": "Local development server"
            }
        ],
        "paths": {},
        "components": {
            "schemas": {},
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                    "description": "JWT authentication. Get token from /api/agent/auth/login"
                }
            }
        },
        "tags": [
            {
                "name": "Agent Gateway",
                "description": "Simplified endpoints optimized for AI agents. These endpoints provide high-level workflows that orchestrate complex backend operations. Use these instead of navigating the full API for better AI agent compatibility."
            }
        ]
    }

    # Define public endpoints (don't require authentication)
    public_endpoints = {
        "/api/agent/health",
        "/api/agent/auth/login",
        "/api/agent/auth/register",
        "/api/agent/movements",
        "/api/agent/music/playlists"
    }

    # Filter paths to only include /api/agent/*
    agent_paths = {}
    for path, path_item in full_spec.get("paths", {}).items():
        if path.startswith("/api/agent/"):
            agent_paths[path] = path_item

            # Add x-agent-friendly metadata to each operation
            for method in ["get", "post", "put", "patch", "delete"]:
                if method in path_item:
                    operation = path_item[method]

                    # Ensure operation has clear summary and description
                    if "summary" not in operation:
                        operation["summary"] = f"{method.upper()} {path}"

                    # Ensure description is present
                    if "description" not in operation:
                        operation["description"] = operation.get("summary", "")

                    # Add complexity hint
                    operation.setdefault("x-complexity", "LOW")

                    # Ensure tags (without emoji)
                    operation["tags"] = ["Agent Gateway"]

                    # Fix operationId to proper camelCase
                    # Transform: "AgentGatewayAgentLogin" -> "agentLogin"
                    if "operationId" in operation:
                        op_id = operation["operationId"]
                        clean_id = op_id

                        # Remove any emoji
                        clean_id = clean_id.replace("🤖", "")

                        # Replace "AgentGatewayAgent" or "GatewayAgent" with "agent"
                        if "AgentGatewayAgent" in clean_id:
                            parts = clean_id.split("AgentGatewayAgent")
                            clean_id = "agent" + parts[1] if len(parts) > 1 else clean_id
                        elif "GatewayAgent" in clean_id:
                            parts = clean_id.split("GatewayAgent")
                            clean_id = "agent" + parts[1] if len(parts) > 1 else clean_id

                        operation["operationId"] = clean_id

                    # Set security: public endpoints don't require auth
                    if path in public_endpoints:
                        operation["security"] = []  # No auth required
                    else:
                        operation["security"] = [{"BearerAuth": []}]  # Auth required

                    # Add RFC 9457 error responses for ALL operations
                    responses = operation.setdefault("responses", {})

                    # Add 400 for POST/PUT/PATCH
                    if method in ["post", "put", "patch"] and "400" not in responses:
                        responses["400"] = {
                            "description": "Bad Request - Invalid input parameters",
                            "content": {
                                "application/problem+json": {
                                    "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"}
                                }
                            }
                        }

                    # Add 422 for validation errors
                    if method in ["post", "put", "patch"] and "422" not in responses:
                        responses["422"] = {
                            "description": "Validation Error - Request data failed validation",
                            "content": {
                                "application/problem+json": {
                                    "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"}
                                }
                            }
                        }

                    # Add 500 for all operations
                    if "500" not in responses:
                        responses["500"] = {
                            "description": "Internal Server Error - Unexpected error occurred",
                            "content": {
                                "application/problem+json": {
                                    "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"}
                                }
                            }
                        }

    agent_spec["paths"] = agent_paths

    # Extract only schemas used by agent paths
    used_schemas = set()

    def extract_schema_refs(obj):
        """Recursively extract $ref schema names"""
        if isinstance(obj, dict):
            if "$ref" in obj:
                ref = obj["$ref"]
                if ref.startswith("#/components/schemas/"):
                    schema_name = ref.split("/")[-1]
                    used_schemas.add(schema_name)
            for value in obj.values():
                extract_schema_refs(value)
        elif isinstance(obj, list):
            for item in obj:
                extract_schema_refs(item)

    # Extract schemas from agent paths
    extract_schema_refs(agent_paths)

    # Copy only used schemas
    all_schemas = full_spec.get("components", {}).get("schemas", {})
    for schema_name in used_schemas:
        if schema_name in all_schemas:
            agent_spec["components"]["schemas"][schema_name] = all_schemas[schema_name]

    # Always include RFC9457ProblemDetail schema for error responses
    if "RFC9457ProblemDetail" in all_schemas:
        agent_spec["components"]["schemas"]["RFC9457ProblemDetail"] = all_schemas["RFC9457ProblemDetail"]
    else:
        # Fallback: define it manually if not in full spec
        agent_spec["components"]["schemas"]["RFC9457ProblemDetail"] = {
            "type": "object",
            "required": ["type", "title", "status"],
            "properties": {
                "type": {
                    "type": "string",
                    "format": "uri",
                    "description": "A URI reference identifying the problem type"
                },
                "title": {
                    "type": "string",
                    "description": "A short, human-readable summary of the problem type"
                },
                "status": {
                    "type": "integer",
                    "description": "The HTTP status code"
                },
                "detail": {
                    "type": "string",
                    "description": "A human-readable explanation specific to this occurrence"
                },
                "instance": {
                    "type": "string",
                    "format": "uri",
                    "description": "A URI reference identifying the specific occurrence"
                }
            },
            "description": "RFC 9457 Problem Details for HTTP APIs"
        }

    # Add workflow documentation
    agent_spec["x-agent-workflows"] = {
        "user_authentication": {
            "description": "Authenticate and get access token",
            "steps": [
                {"endpoint": "POST /api/agent/auth/login", "required": True},
                {"endpoint": "GET /api/agent/auth/me", "required": False}
            ],
            "example_prompt": "User says: 'Login with my email and password'"
        },
        "generate_pilates_class": {
            "description": "Generate a complete Pilates class",
            "steps": [
                {"endpoint": "POST /api/agent/classes/generate", "required": True}
            ],
            "example_prompt": "User says: 'Create a 60-minute beginner class focused on core'"
        },
        "view_saved_classes": {
            "description": "List and view saved classes",
            "steps": [
                {"endpoint": "GET /api/agent/classes", "required": True},
                {"endpoint": "GET /api/agent/classes/{id}", "required": False}
            ],
            "example_prompt": "User says: 'Show me my saved classes'"
        },
        "check_progress": {
            "description": "Get user analytics and progress",
            "steps": [
                {"endpoint": "GET /api/agent/analytics", "required": True}
            ],
            "example_prompt": "User says: 'How many classes have I completed?'"
        },
        "search_movements": {
            "description": "Find specific exercises",
            "steps": [
                {"endpoint": "GET /api/agent/movements", "required": True}
            ],
            "example_prompt": "User says: 'Find beginner core movements'"
        }
    }

    return agent_spec


def generate_agent_gateway_spec():
    """
    Generate and save Agent Gateway OpenAPI spec files (JSON + YAML)

    This is the CLI entrypoint that:
    1. Generates the spec using get_agent_gateway_spec_dict()
    2. Prints statistics
    3. Saves files to disk

    Returns:
        dict: The generated OpenAPI spec
    """
    # Get the spec
    agent_spec = get_agent_gateway_spec_dict()

    # Calculate stats for display
    agent_paths = agent_spec.get("paths", {})
    total_operations = sum(
        len([m for m in path_item.keys() if m in ["get", "post", "put", "patch", "delete"]])
        for path_item in agent_paths.values()
    )

    print("\n" + "="*60)
    print("✅ Agent Gateway OpenAPI Spec Generated")
    print("="*60)
    print(f"Total endpoints: {len(agent_paths)}")
    print(f"Total operations: {total_operations}")
    print(f"Schemas included: {len(agent_spec['components']['schemas'])}")
    print(f"Workflows documented: {len(agent_spec.get('x-agent-workflows', {}))}")
    print("="*60)

    # Save as JSON
    json_path = "agent_gateway_openapi.json"
    with open(json_path, "w") as f:
        json.dump(agent_spec, f, indent=2)
    print(f"\n✅ Saved: {json_path}")

    # Save as YAML
    yaml_path = "agent_gateway_openapi.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(agent_spec, f, default_flow_style=False, sort_keys=False)
    print(f"✅ Saved: {yaml_path}")

    print("\n📊 Next Steps:")
    print("1. Upload agent_gateway_openapi.json to https://scorecard.jentic.com/")
    print("2. Expected score: 70-90/100 (vs current 26/100)")
    print("3. If score is good, deploy to production")
    print("4. Integrate with Jentic platform")

    return agent_spec


if __name__ == "__main__":
    try:
        spec = generate_agent_gateway_spec()
        print("\n✅ Success! Agent gateway spec is ready for Jentic testing.")
    except Exception as e:
        print(f"\n❌ Error generating spec: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
