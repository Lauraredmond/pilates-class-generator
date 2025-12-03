"""
==============================================================================
BASSLINE PILATES ORCHESTRATOR - MAIN APPLICATION
==============================================================================
Session 10: Jentic Integration - Phase 1
Purpose: FastAPI service that integrates StandardAgent + Arazzo for class generation

ARCHITECTURE OVERVIEW:
┌──────────────────────────────────────────────────────────────┐
│                  Bassline React Frontend                      │
│  (Existing - no changes)                                      │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ POST /generate-class
                          ▼
┌──────────────────────────────────────────────────────────────┐
│         THIS SERVICE: Python Orchestration (Render)          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  FastAPI Endpoint: /generate-class                     │  │
│  │  - Receives structured JSON from frontend              │  │
│  │  - Passes to BasslinePilatesCoachAgent                 │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  BasslinePilatesCoachAgent (StandardAgent)            │  │
│  │  - JENTIC PATTERN: Inherit from StandardAgent         │  │
│  │  - Uses ReWOOReasoner (Plan→Execute→Reflect)          │  │
│  │  - Has Pilates-specific tools                          │  │
│  │  - Can call Arazzo workflows                           │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  Arazzo Workflow: assemble_pilates_class.yaml         │  │
│  │  - JENTIC PATTERN: Workflow as Tool                    │  │
│  │  - Step 1: GET /api/users/{id}/profile                 │  │
│  │  - Step 2: POST /api/agents/generate-sequence          │  │
│  │  - Step 3: POST /api/agents/select-music               │  │
│  │  - Step 4: POST /api/agents/create-meditation          │  │
│  └────────────────────┬───────────────────────────────────┘  │
└────────────────────────┼───────────────────────────────────── │
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│       Existing Bassline Backend (FastAPI - Render)           │
│  - All existing API endpoints                                │
│  - Supabase integration                                      │
│  - Music selection                                           │
│  - Movement database                                         │
└──────────────────────────────────────────────────────────────┘
==============================================================================
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os
from dotenv import load_dotenv
from loguru import logger
from supabase import create_client, Client

# JENTIC IMPORTS - These come from the standard-agent library
# NOTE: Commented out until we actually install the Jentic libraries
# from standard_agent import StandardAgent, ReWOOReasoner
# from standard_agent.llm import OpenAILLM
# from arazzo import Runner

# Local imports
from agent.bassline_agent import BasslinePilatesCoachAgent

load_dotenv()

# Initialize Supabase client (tools need database access)
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase: Optional[Client] = None

if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
    logger.info("✅ Supabase client initialized")
else:
    logger.warning("⚠️ SUPABASE_URL or SUPABASE_KEY not set - tools will use fallback data")

# ==============================================================================
# FASTAPI APPLICATION
# ==============================================================================

app = FastAPI(
    title="Bassline Pilates Orchestrator",
    description="AI agent orchestration service using Jentic StandardAgent + Arazzo",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration (allow frontend to call this service)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "https://basslinemvp.netlify.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# REQUEST/RESPONSE MODELS
# ==============================================================================

class ClassGenerationRequest(BaseModel):
    """
    Request to generate a complete Pilates class.

    This is what the frontend sends to this orchestrator service.
    """
    user_id: str = Field(..., description="Authenticated user ID (from JWT)")
    target_duration_minutes: int = Field(..., ge=15, le=120, description="Class duration")
    difficulty_level: str = Field(..., description="Beginner, Intermediate, or Advanced")
    focus_areas: List[str] = Field(default=[], description="Muscle groups to emphasize")
    include_mcp_research: bool = Field(default=False, description="Enhance with web research")
    strictness_level: str = Field(default="guided", description="strict, guided, or autonomous")

class ClassGenerationResponse(BaseModel):
    """
    Complete class returned to frontend.

    This is what the orchestrator service sends back.
    """
    success: bool
    data: dict
    metadata: dict
    error: Optional[str] = None

class ToolExecutionRequest(BaseModel):
    """Request to execute a specific tool"""
    tool_id: str = Field(..., description="Tool identifier (generate_sequence, select_music, etc.)")
    parameters: dict = Field(..., description="Tool input parameters")
    user_id: str = Field(..., description="Authenticated user ID")

class ToolExecutionResponse(BaseModel):
    """Tool execution result"""
    success: bool
    data: dict
    error: Optional[str] = None

# ==============================================================================
# DEPENDENCY: Initialize BasslinePilatesCoachAgent
# ==============================================================================

def get_agent() -> BasslinePilatesCoachAgent:
    """
    JENTIC PATTERN: Dependency Injection for Agent

    Create and configure the agent with:
    - OpenAI LLM
    - Pilates-specific tools (with Supabase client)
    - ReWOO reasoner
    - Arazzo workflow runner
    """
    return BasslinePilatesCoachAgent(supabase_client=supabase)

# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "bassline-orchestrator",
        "version": "1.0.0",
        "jentic_integration": "Phase 1"
    }

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Bassline Pilates Orchestrator",
        "description": "AI agent orchestration using Jentic StandardAgent + Arazzo",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/tools/list")
async def list_tools(agent: BasslinePilatesCoachAgent = Depends(get_agent)):
    """
    List all available tools (for /api/agents/agent-info endpoint)
    """
    try:
        tools_list = agent.tools.list_tools()
        return {
            "tools": tools_list,
            "count": len(tools_list)
        }
    except Exception as e:
        logger.error(f"Error listing tools: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tools/execute", response_model=ToolExecutionResponse)
async def execute_tool(
    request: ToolExecutionRequest,
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    """
    Execute a specific tool with parameters

    This endpoint is called by the backend API router (backend/api/agents.py)
    to execute individual tools like:
    - generate_sequence (Pilates movement sequencing)
    - select_music (Music playlist selection)
    - generate_meditation (Meditation script generation)
    - research_cues (MCP web research)

    The tools are provided by BasslinePilatesTools and contain all the
    business logic extracted from the original backend agents.
    """
    try:
        logger.info(f"Executing tool: {request.tool_id} for user {request.user_id}")
        logger.info(f"Parameters: {request.parameters}")

        # Find the tool by ID
        from agent.tools import BasslineTool
        all_tools = agent.tools.list_tools()
        tool_dict = next((t for t in all_tools if t["id"] == request.tool_id), None)

        if not tool_dict:
            raise HTTPException(
                status_code=404,
                detail=f"Tool not found: {request.tool_id}"
            )

        # Create tool instance
        tool = BasslineTool(
            id=tool_dict["id"],
            name=tool_dict["name"],
            description=tool_dict["description"],
            schema=tool_dict["schema"]
        )

        # Execute the tool
        result = agent.tools.execute(tool, request.parameters)

        # Return standardized response
        return ToolExecutionResponse(
            success=True,
            data=result,
            error=None
        )

    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Tool execution error: {e}", exc_info=True)
        return ToolExecutionResponse(
            success=False,
            data={},
            error=str(e)
        )

@app.post("/generate-class", response_model=ClassGenerationResponse)
async def generate_class(
    request: ClassGenerationRequest,
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    """
    Generate a complete Pilates class using the BasslinePilatesCoachAgent.

    WORKFLOW SEQUENCE EXPLAINED:
    ============================

    1. **Frontend calls this endpoint** with class parameters
       └─> POST /generate-class {user_id, duration, difficulty, ...}

    2. **This FastAPI service** receives the request
       └─> Passes it to BasslinePilatesCoachAgent

    3. **BasslinePilatesCoachAgent** (inherits from StandardAgent)
       ├─> PLAN phase (ReWOO reasoner):
       │   "I need to generate a class → I should use the assemblePilatesClass workflow"
       │
       ├─> EXECUTE phase:
       │   Agent calls the "run_workflow" tool
       │   └─> Tool triggers Arazzo Engine
       │       └─> Arazzo Engine executes workflow steps:
       │           ├─> Step 1: Call EXISTING Bassline API: GET /api/users/me/profile
       │           │   (LLM is NOT involved here - direct HTTP call to existing backend)
       │           │
       │           ├─> Step 2: Call EXISTING Bassline API: POST /api/agents/generate-sequence
       │           │   (This existing endpoint has an agent that uses LLM for narrative variation)
       │           │   (LLM generates varied teaching cues, but Supabase provides the movements)
       │           │
       │           ├─> Step 3: Call EXISTING Bassline API: POST /api/agents/select-music
       │           │   (This existing endpoint queries Supabase music database)
       │           │   (LLM is NOT involved - direct database query)
       │           │
       │           └─> Step 4: Call EXISTING Bassline API: POST /api/agents/create-meditation
       │               (This existing endpoint has an agent that uses LLM to generate script)
       │               (LLM creates personalized meditation narrative)
       │
       └─> REFLECT phase (ReWOO reasoner):
           "Workflow completed successfully. All steps returned valid data. Class looks good!"

    4. **BasslinePilatesCoachAgent returns result** to this FastAPI endpoint

    5. **This FastAPI service** returns complete class to frontend

    WHO CALLS WHAT:
    ==============

    Frontend → Orchestrator → Agent → Arazzo → Existing APIs → Supabase
                                 ↓
                                LLM (for strategic decisions only)

    Existing APIs → LLM (for narrative variation, meditation scripts)
    Existing APIs → Supabase (for movement data, music data, user data)

    KEY INSIGHT:
    - LLM is the "engine" (powers both agent reasoning and content generation)
    - Agent is the "driver" (decides WHAT to do and WHEN)
    - Arazzo is the "GPS" (provides turn-by-turn directions for API calls)
    - Supabase is the "fuel tank" (provides the actual data)
    """
    try:
        logger.info(f"Generating class for user {request.user_id}")

        # Convert Pydantic model to dict for agent
        inputs = request.dict()

        # ========================================================================
        # JENTIC PATTERN: Call agent.solve() with goal
        # ========================================================================
        # The agent will use ReWOO reasoning to:
        # 1. PLAN: Decide this is a "generate class" goal → use workflow
        # 2. EXECUTE: Run the Arazzo workflow as a tool
        # 3. REFLECT: Validate the results, summarize for user
        # ========================================================================

        goal = f"""
        Generate a {request.target_duration_minutes}-minute {request.difficulty_level} Pilates class
        for user {request.user_id}.

        Requirements:
        - Duration: {request.target_duration_minutes} minutes
        - Difficulty: {request.difficulty_level}
        - Focus areas: {', '.join(request.focus_areas) if request.focus_areas else 'balanced'}
        - Strictness: {request.strictness_level}

        Use the assemblePilatesClass workflow to coordinate:
        1. Get user profile and preferences
        2. Generate safe movement sequence
        3. Select appropriate music
        4. Create personalized meditation

        Return the complete class structure.
        """

        # NOTE: This will be uncommented when agent is fully implemented
        # result = agent.solve(goal=goal, context=inputs)

        # PLACEHOLDER: Return mock response until agent is implemented
        result = {
            "success": True,
            "data": {
                "message": "Orchestrator service is ready! Agent integration in progress.",
                "workflow_will_execute": "assemblePilatesClass",
                "steps": [
                    "1. Get user profile",
                    "2. Generate sequence",
                    "3. Select music",
                    "4. Create meditation"
                ]
            },
            "metadata": {
                "agent_type": "BasslinePilatesCoachAgent",
                "workflow_version": "1.0.0",
                "jentic_phase": "Phase 1 - Scaffold Complete"
            }
        }

        return ClassGenerationResponse(
            success=True,
            data=result["data"],
            metadata=result["metadata"]
        )

    except Exception as e:
        logger.error(f"Class generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# STARTUP & SHUTDOWN
# ==============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Bassline Orchestrator starting up...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Bassline API: {os.getenv('BASSLINE_API_URL')}")
    logger.info("✅ Orchestrator ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Bassline Orchestrator shutting down...")

# ==============================================================================
# MAIN (for local development)
# ==============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,  # Different port from existing backend (8000)
        reload=True,
        log_level="info"
    )
