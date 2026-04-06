"""
Pilates Class Planner v2.0 - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from fastapi.exceptions import RequestValidationError
from fastapi import status
from loguru import logger
import time
from uuid import uuid4
from datetime import datetime
from functools import lru_cache

# Import routers
from api import movements, agents, classes, analytics, auth, users, compliance, music, beta_errors, class_sections, movement_levels, feedback, debug, admin, coach, admin_extended, agent_gateway

# Import RFC 9457 error models
from models.error import RFC9457ProblemDetail, ProblemTypes

app = FastAPI(
    title="Pilates Class Planner API",
    description="AI-powered Pilates class planning with MCP integration",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    # CRITICAL for Jentic AI readiness: Define server URLs
    servers=[
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
    # Enable automatic example generation from Pydantic models for Jentic integration
    openapi_tags=[
        {"name": "Movements", "description": "Pilates movement catalog and transitions"},
        {"name": "Classes", "description": "AI-powered class generation and planning"},
        {"name": "AI Agents", "description": "Jentic StandardAgent orchestration"},
        {"name": "Analytics", "description": "Movement usage and class analytics"},
        {"name": "Compliance", "description": "GDPR Article 15 & EU AI Act compliance"},
        {"name": "Music", "description": "Music integration (Musopen/FreePD)"},
        {"name": "Auth", "description": "Authentication and user management"},
    ],
    # Generate examples for all operations from model schemas
    generate_unique_id_function=lambda route: f"{route.tags[0]}-{route.name}" if route.tags else route.name,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev
        "http://localhost:5173",  # Vite dev
        "http://localhost:5174",  # Vite dev alternate
        "https://basslinemvp.netlify.app",  # Netlify production
    ],
    allow_origin_regex=r"https://.*\.netlify\.app",  # Netlify preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information"""
    start_time = time.time()

    logger.info(f"Request: {request.method} {request.url.path}")

    response = await call_next(request)

    process_time = time.time() - start_time
    logger.info(
        f"Response: {response.status_code} | Time: {process_time:.3f}s"
    )

    return response


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "service": "pilates-class-planner-api"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Pilates Class Planner API v2.0",
        "docs": "/api/docs",
        "health": "/health"
    }


# Cached agent gateway spec generator
@lru_cache(maxsize=1)
def _get_cached_agent_spec():
    """Cache agent gateway spec generation (expensive operation)"""
    from generate_agent_gateway_spec import get_agent_gateway_spec_dict
    return get_agent_gateway_spec_dict()


# Agent Gateway OpenAPI spec endpoint
@app.get("/api/agent/openapi.json", include_in_schema=False)
async def get_agent_gateway_openapi():
    """
    Serve Agent Gateway OpenAPI spec (11 operations, optimized for AI agents)

    This endpoint provides a simplified OpenAPI specification designed for:
    - Jentic AI platform integration
    - OpenClaw agent integration
    - AI agent development and testing

    The agent gateway spec is a curated subset of the full API (11 vs 131 operations)
    with optimizations for AI agent consumption.

    Jentic Scorecard: 70/100 (vs 26/100 for full API)

    For integration, use this URL:
    - Dev: https://pilates-dev-i0jb.onrender.com/api/agent/openapi.json
    - Local: http://localhost:8000/api/agent/openapi.json
    """
    return _get_cached_agent_spec()


# Include routers
app.include_router(movements.router, prefix="/api/movements", tags=["Movements"])
app.include_router(movement_levels.router)  # Session 11: Movement progression levels (has own prefix)
app.include_router(agents.router, prefix="/api/agents", tags=["AI Agents"])
app.include_router(classes.router, prefix="/api/classes", tags=["Classes"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
# REMOVED: SoundCloud routers (redundant - now using Musopen/FreePD via /api/music)
# app.include_router(soundcloud_auth.router)  # SoundCloud OAuth
# app.include_router(soundcloud_api.router)  # SoundCloud API
app.include_router(auth.router)  # Auth routes (has its own prefix)
app.include_router(users.router)  # User routes (has its own prefix)
app.include_router(compliance.router, tags=["Compliance"])  # GDPR & AI Act compliance
app.include_router(music.router, tags=["Music"])  # Music integration (Musopen/FreePD)
app.include_router(class_sections.router, tags=["Class Sections"])  # Session 11: 6 class sections
app.include_router(beta_errors.router, prefix="/api", tags=["Beta Errors"])  # Beta error tracking (admin only)
app.include_router(feedback.router, tags=["Feedback"])  # Beta tester feedback & queries
app.include_router(admin.router, tags=["Admin"])  # Admin-only endpoints (feedback management, diagnostics)
app.include_router(coach.router, tags=["Coach"])  # Coach endpoints for sport-specific training
app.include_router(admin_extended.router, tags=["Admin"])  # Extended admin endpoints for platform management
app.include_router(debug.router, tags=["Debug"])  # TEMPORARY: Debug endpoints - REMOVE BEFORE PRODUCTION!
app.include_router(agent_gateway.router)  # Agent gateway - simplified API for AI agents (Jentic/OpenClaw)


# Custom OpenAPI schema generator that copies examples from schemas to operations
# This improves Jentic Agent Usability score by adding operation-level examples
def custom_openapi():
    """
    Generate OpenAPI schema with automatic operation-level examples.

    Jentic evaluates operation-level examples, not just schema-level examples.
    This function copies examples from Pydantic model schemas to operation
    request/response examples for better AI agent understanding.
    """
    if app.openapi_schema:
        return app.openapi_schema

    # Generate base OpenAPI schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # JENTIC FIX: Add servers array (get_openapi doesn't include it from app.servers)
    openapi_schema["servers"] = [
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
    ]

    # Get component schemas with examples
    schemas = openapi_schema.get("components", {}).get("schemas", {})

    # JENTIC FIX: Add RFC 9457 ProblemDetail schema to components
    # This ensures error responses are documented with proper schema
    if "RFC9457ProblemDetail" not in schemas:
        from models.error import RFC9457ProblemDetail
        # Generate schema from Pydantic model
        problem_schema = RFC9457ProblemDetail.model_json_schema()
        schemas["RFC9457ProblemDetail"] = problem_schema
        openapi_schema.setdefault("components", {})["schemas"] = schemas

    # Helper function to convert snake_case to camelCase for operationIds
    def to_camel_case(snake_str: str) -> str:
        """Convert snake_case to camelCase for AI-agent-friendly operationIds"""
        if not snake_str or '_' not in snake_str:
            return snake_str
        components = snake_str.split('_')
        # Keep first component lowercase, capitalize rest
        return components[0].lower() + ''.join(x.capitalize() for x in components[1:])

    # Helper function to add RFC 9457 error responses to operations
    def add_rfc9457_responses(operation: dict, method: str, path: str):
        """Add standardized RFC 9457 error responses to operation if missing"""
        responses = operation.setdefault("responses", {})

        # Define common error responses in RFC 9457 format
        rfc9457_errors = {
            "400": {
                "description": "Bad Request - Invalid request syntax or parameters",
                "content": {
                    "application/problem+json": {
                        "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"},
                        "example": {
                            "type": "urn:pilates-api:error:validation-error",
                            "title": "Bad Request",
                            "status": 400,
                            "detail": "The request contains invalid or malformed data.",
                            "instance": path
                        }
                    }
                }
            },
            "401": {
                "description": "Unauthorized - Authentication required or invalid credentials",
                "content": {
                    "application/problem+json": {
                        "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"},
                        "example": {
                            "type": "urn:pilates-api:error:authentication-required",
                            "title": "Unauthorized",
                            "status": 401,
                            "detail": "Authentication is required to access this resource.",
                            "instance": path
                        }
                    }
                }
            },
            "403": {
                "description": "Forbidden - Insufficient permissions to access this resource",
                "content": {
                    "application/problem+json": {
                        "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"},
                        "example": {
                            "type": "urn:pilates-api:error:insufficient-permissions",
                            "title": "Forbidden",
                            "status": 403,
                            "detail": "You do not have permission to access this resource.",
                            "instance": path
                        }
                    }
                }
            },
            "404": {
                "description": "Not Found - The requested resource does not exist",
                "content": {
                    "application/problem+json": {
                        "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"},
                        "example": {
                            "type": "urn:pilates-api:error:resource-not-found",
                            "title": "Not Found",
                            "status": 404,
                            "detail": "The requested resource was not found.",
                            "instance": path
                        }
                    }
                }
            },
            "422": {
                "description": "Validation Error - Request data failed validation rules",
                "content": {
                    "application/problem+json": {
                        "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"},
                        "example": {
                            "type": "urn:pilates-api:error:validation-error",
                            "title": "Validation Error",
                            "status": 422,
                            "detail": "Validation failed for field 'difficulty_level': value is not a valid enumeration member",
                            "instance": path
                        }
                    }
                }
            },
            "500": {
                "description": "Internal Server Error - An unexpected error occurred",
                "content": {
                    "application/problem+json": {
                        "schema": {"$ref": "#/components/schemas/RFC9457ProblemDetail"},
                        "example": {
                            "type": "urn:pilates-api:error:internal-server-error",
                            "title": "Internal Server Error",
                            "status": 500,
                            "detail": "An unexpected error occurred while processing your request.",
                            "instance": path
                        }
                    }
                }
            }
        }

        # Add error responses based on operation type
        # FORCE-REPLACE all error responses to use application/problem+json
        # Don't check if they exist - always replace to fix FastAPI auto-generated responses

        # All operations can have 500
        responses["500"] = rfc9457_errors["500"]

        # All operations with request bodies can have 400, 422
        if method in ["post", "put", "patch"]:
            responses["400"] = rfc9457_errors["400"]
            responses["422"] = rfc9457_errors["422"]

        # Operations with path parameters can have 404
        if "{" in path:  # Has path parameter
            responses["404"] = rfc9457_errors["404"]

        # All operations can have 401, 403 (authentication/authorization)
        # But only add if endpoint path suggests auth is required (not /health, /)
        if path not in ["/health", "/"]:
            responses["401"] = rfc9457_errors["401"]
            responses["403"] = rfc9457_errors["403"]

    # JENTIC FIXES: Sanitize paths and operationIds
    # 1. Remove trailing slashes from paths (Jentic validation error)
    # 2. Sanitize operationIds to remove URL-invalid characters
    paths_to_rename = {}
    for path in list(openapi_schema.get("paths", {}).keys()):
        if path.endswith("/") and path != "/":
            # Remove trailing slash
            new_path = path.rstrip("/")
            paths_to_rename[path] = new_path
            logger.debug(f"Removing trailing slash: {path} → {new_path}")

    # Apply path renames
    for old_path, new_path in paths_to_rename.items():
        openapi_schema["paths"][new_path] = openapi_schema["paths"].pop(old_path)

    # Sanitize operationIds and add RFC 9457 error responses
    for path, path_item in openapi_schema.get("paths", {}).items():
        for method, operation in path_item.items():
            if method not in ["get", "post", "put", "patch", "delete"]:
                continue

            # Sanitize operationId if present
            if "operationId" in operation:
                original_id = operation["operationId"]
                # JENTIC FIX: Remove all URL-invalid characters
                # Replace spaces, hyphens, slashes with underscores
                # Remove braces and other special characters
                sanitized_id = (original_id
                    .replace(" ", "_")  # CRITICAL: Remove spaces from tag names
                    .replace("-", "_")
                    .replace("/", "_")
                    .replace("{", "")
                    .replace("}", ""))
                # JENTIC FIX: Convert to camelCase for AI agent compatibility (7% → 70%+)
                camel_id = to_camel_case(sanitized_id)
                if original_id != camel_id:
                    operation["operationId"] = camel_id
                    logger.debug(f"Sanitized operationId: {original_id} → {camel_id}")

            # JENTIC FIX: Add RFC 9457 error responses (Error Standardization 21% → 90%+)
            # Pass method and path for context-aware error response generation
            add_rfc9457_responses(operation, method, path)

    # Iterate through all paths and operations again for examples
    for path, path_item in openapi_schema.get("paths", {}).items():
        for method, operation in path_item.items():
            if method not in ["get", "post", "put", "patch", "delete"]:
                continue

            # Add request body examples
            request_body = operation.get("requestBody", {})
            if request_body:
                content = request_body.get("content", {})
                for media_type, media_spec in content.items():
                    # Get schema reference
                    schema_ref = media_spec.get("schema", {}).get("$ref", "")
                    if schema_ref:
                        schema_name = schema_ref.split("/")[-1]
                        schema = schemas.get(schema_name, {})

                        # Copy example from schema to operation if not already present
                        if "example" not in media_spec and "example" in schema:
                            media_spec["example"] = schema["example"]
                        elif "examples" not in media_spec and "examples" in schema:
                            media_spec["examples"] = schema["examples"]

            # Add response examples
            for status_code, response in operation.get("responses", {}).items():
                content = response.get("content", {})
                for media_type, media_spec in content.items():
                    # Get schema reference
                    schema_ref = media_spec.get("schema", {}).get("$ref", "")
                    if not schema_ref:
                        # Handle arrays: List[Model] -> items.$ref
                        items = media_spec.get("schema", {}).get("items", {})
                        schema_ref = items.get("$ref", "")

                    if schema_ref:
                        schema_name = schema_ref.split("/")[-1]
                        schema = schemas.get(schema_name, {})

                        # Copy example from schema to operation if not already present
                        if "example" not in media_spec and "example" in schema:
                            # For list responses, wrap single example in array
                            if media_spec.get("schema", {}).get("type") == "array":
                                media_spec["example"] = [schema["example"]]
                            else:
                                media_spec["example"] = schema["example"]
                        elif "examples" not in media_spec and "examples" in schema:
                            media_spec["examples"] = schema["examples"]

    app.openapi_schema = openapi_schema
    logger.info("✅ Generated OpenAPI schema with Jentic AI readiness improvements:")
    logger.info("   - Automatic operation-level examples")
    logger.info("   - camelCase operationIds")
    logger.info("   - RFC 9457 error responses (422, 500)")
    logger.info("   - Comprehensive Field descriptions")
    return app.openapi_schema

# Override FastAPI's openapi() method with our custom version
app.openapi = custom_openapi


# ============================================
# RFC 9457 EXCEPTION HANDLERS
# ============================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors with RFC 9457 format

    JENTIC FIX: Error Standardization 0% → 90%+
    Returns structured problem details for validation failures
    """
    error_id = uuid4()

    # Extract first validation error for detail message
    first_error = exc.errors()[0] if exc.errors() else {}
    field_path = " -> ".join(str(loc) for loc in first_error.get("loc", []))
    error_msg = first_error.get("msg", "Validation failed")

    detail = f"Validation failed for field '{field_path}': {error_msg}"

    logger.warning(
        f"Validation error [ID: {error_id}]: {detail}",
        extra={"error_id": str(error_id), "path": str(request.url.path), "errors": exc.errors()}
    )

    problem = RFC9457ProblemDetail(
        type=ProblemTypes.VALIDATION_ERROR,
        title="Validation Error",
        status=422,
        detail=detail,
        instance=str(request.url.path),
        error_id=error_id,
        timestamp=datetime.utcnow()
    )

    return JSONResponse(
        status_code=422,
        content=problem.model_dump(exclude_none=True),
        headers={"Content-Type": "application/problem+json"}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Handle all uncaught exceptions with RFC 9457 format

    JENTIC FIX: Error Standardization 0% → 90%+
    Returns structured problem details for server errors
    """
    error_id = uuid4()

    logger.error(
        f"Unhandled exception [ID: {error_id}]: {exc}",
        exc_info=True,
        extra={"error_id": str(error_id), "path": str(request.url.path)}
    )

    problem = RFC9457ProblemDetail(
        type=ProblemTypes.INTERNAL_SERVER_ERROR,
        title="Internal Server Error",
        status=500,
        detail="An unexpected error occurred while processing your request. Please try again later or contact support with the error ID.",
        instance=str(request.url.path),
        error_id=error_id,
        timestamp=datetime.utcnow()
    )

    return JSONResponse(
        status_code=500,
        content=problem.model_dump(exclude_none=True),
        headers={"Content-Type": "application/problem+json"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
