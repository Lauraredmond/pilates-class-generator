"""
==============================================================================
BASSLINE PILATES TOOLS
==============================================================================
JENTIC PATTERN: Implement JustInTimeToolingBase

Tools are "things the agent can do":
- Call Bassline APIs (existing backend endpoints)
- Run Arazzo workflows (orchestrated API sequences)
- Access Supabase (direct database queries if needed)

Each tool has:
1. Unique ID
2. Human-readable name and description
3. JSON schema (parameters)
4. Execute method (do the thing)

COMPARISON TO JENTIC RAW CODE:
=============================

JENTIC JustInTimeToolingBase (from GitHub):
```python
class JustInTimeToolingBase(ABC):
    @abstractmethod
    def list_tools(self) -> List[ToolInfo]:
        pass  # Return all available tools

    @abstractmethod
    def get_tool_schema(self, tool_id: str) -> Dict:
        pass  # Return JSON schema for tool params

    @abstractmethod
    def execute(self, tool_id: str, params: Dict) -> Any:
        pass  # Execute the tool
```

BASSLINE CUSTOM (this file):
```python
class BasslinePilatesTools(JustInTimeToolingBase):
    def list_tools(self):
        return [tool1, tool2, tool3, ...]  # ← CONCRETE LIST

    def execute(self, tool_id, params):
        if tool_id == "get_user_profile":
            return self._get_user_profile(...)  # ← ROUTE TO HANDLER
```

==============================================================================
"""

import os
from typing import List, Dict, Any
import httpx
from loguru import logger

# ==============================================================================
# JENTIC IMPORTS (Commented out until libraries installed)
# ==============================================================================
# from standard_agent.tools import JustInTimeToolingBase, ToolInfo
# from arazzo import Runner

# ==============================================================================
# BASSLINE PILATES TOOLS
# ==============================================================================

class BasslinePilatesTools:
    """
    BASSLINE CUSTOMIZATION: Pilates-specific tool implementations

    JENTIC PATTERN: Inherit from JustInTimeToolingBase

    Each tool:
    1. Has a unique ID (e.g., "get_user_profile")
    2. Has a JSON schema (parameters it accepts)
    3. Has an execute method (what it does)

    Tools can:
    - Call existing Bassline API endpoints (HTTP requests)
    - Run Arazzo workflows (orchestrate multiple APIs)
    - Access databases directly (if needed)
    - Perform calculations or transformations
    """

    def __init__(self, bassline_api_url: str):
        """
        Initialize tools with Bassline API URL.

        Args:
            bassline_api_url: Base URL of existing Bassline backend
                             (e.g., "https://pilates-class-generator-api3.onrender.com")
        """
        self.bassline_api_url = bassline_api_url.rstrip('/')
        self.http_client = httpx.AsyncClient(timeout=60.0)

        # Initialize Arazzo workflow runner
        # NOTE: Uncomment when Arazzo library is installed
        # self.arazzo_runner = Runner(
        #     workflow_dir="../arazzo/workflows",
        #     openapi_spec="../openapi/bassline_openapi.yaml"
        # )

        self.arazzo_runner = None  # Placeholder
        logger.info(f"Tools initialized with API: {self.bassline_api_url}")

    # ==========================================================================
    # JENTIC PATTERN: List Tools
    # ==========================================================================
    def list_tools(self) -> List[Dict[str, Any]]:
        """
        Return all available tools for this agent.

        JENTIC PATTERN: Tool Discovery

        The agent asks: "What can I do?"
        Tools respond: "Here's everything you can do, with descriptions"

        COMPARISON TO JENTIC RAW CODE:
        =============================

        JENTIC (from GitHub):
        ```python
        def list_tools(self) -> List[ToolInfo]:
            return [
                ToolInfo(
                    id="weather",
                    name="Get Weather",
                    description="Fetch current weather",
                    schema={...}
                )
            ]
        ```

        BASSLINE (this file):
        Same pattern, but with Pilates-specific tools.
        """
        return [
            # ==================================================================
            # TOOL 1: Get User Profile
            # ==================================================================
            {
                "id": "get_user_profile",
                "name": "Get User Profile",
                "description": """
                Fetch user's profile and preferences from Bassline API.

                Returns:
                - User's default difficulty level
                - Preferred music stylistic period
                - AI strictness preference
                - Favorite movements
                - Contraindications (injuries, pregnancy, etc.)

                Use this FIRST before generating a class to personalize.
                """,
                "schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "format": "uuid",
                            "description": "User's unique identifier"
                        }
                    },
                    "required": ["user_id"]
                }
            },

            # ==================================================================
            # TOOL 2: Assemble Pilates Class (Arazzo Workflow)
            # ==================================================================
            {
                "id": "assemble_pilates_class",
                "name": "Assemble Complete Pilates Class",
                "description": """
                Run the full class assembly workflow using Arazzo.

                This workflow orchestrates 4 steps:
                1. Get user profile
                2. Generate movement sequence
                3. Select music playlist
                4. Create meditation script

                Returns complete class structure ready for playback.

                JENTIC PATTERN: Workflow as Tool
                ================================
                The agent can call Arazzo workflows just like any other tool.
                Workflow handles all the API orchestration internally.
                Agent just provides inputs and receives outputs.
                """,
                "schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "format": "uuid"
                        },
                        "target_duration_minutes": {
                            "type": "integer",
                            "minimum": 15,
                            "maximum": 120
                        },
                        "difficulty_level": {
                            "type": "string",
                            "enum": ["Beginner", "Intermediate", "Advanced"]
                        },
                        "focus_areas": {
                            "type": "array",
                            "items": {"type": "string"},
                            "default": []
                        },
                        "include_mcp_research": {
                            "type": "boolean",
                            "default": False
                        },
                        "strictness_level": {
                            "type": "string",
                            "enum": ["strict", "guided", "autonomous"],
                            "default": "guided"
                        }
                    },
                    "required": ["user_id", "target_duration_minutes", "difficulty_level"]
                }
            },

            # ==================================================================
            # TOOL 3: Call Bassline API (Generic)
            # ==================================================================
            {
                "id": "call_bassline_api",
                "name": "Call Bassline API Endpoint",
                "description": """
                Make a direct HTTP call to any Bassline API endpoint.

                Use this when you need specific API functionality
                not covered by other tools.

                Examples:
                - GET /api/movements (list all movements)
                - POST /api/agents/generate-sequence (generate sequence only)
                - GET /api/music/playlists (browse music)
                """,
                "schema": {
                    "type": "object",
                    "properties": {
                        "method": {
                            "type": "string",
                            "enum": ["GET", "POST", "PUT", "DELETE"]
                        },
                        "endpoint": {
                            "type": "string",
                            "description": "API path (e.g., '/api/movements')"
                        },
                        "body": {
                            "type": "object",
                            "description": "Request body for POST/PUT",
                            "default": None
                        },
                        "headers": {
                            "type": "object",
                            "description": "Additional headers",
                            "default": {}
                        }
                    },
                    "required": ["method", "endpoint"]
                }
            }
        ]

    # ==========================================================================
    # JENTIC PATTERN: Execute Tool
    # ==========================================================================
    def execute(self, tool_id: str, params: Dict[str, Any]) -> Any:
        """
        Execute a tool with given parameters.

        JENTIC PATTERN: Tool Routing

        Agent says: "Use tool X with params Y"
        Tools respond: "Routing to handler for X... here's the result"

        Args:
            tool_id: Unique tool identifier
            params: Parameters matching tool's JSON schema

        Returns:
            Tool execution result

        COMPARISON TO JENTIC RAW CODE:
        =============================

        JENTIC (from GitHub):
        ```python
        def execute(self, tool_id: str, params: Dict) -> Any:
            if tool_id == "weather":
                return self._get_weather(**params)
            else:
                raise ValueError(f"Unknown tool: {tool_id}")
        ```

        BASSLINE (this file):
        Same pattern, but routes to Pilates-specific handlers.
        """
        logger.info(f"Executing tool: {tool_id} with params: {params}")

        # Route to appropriate handler
        if tool_id == "get_user_profile":
            return self._get_user_profile(**params)

        elif tool_id == "assemble_pilates_class":
            return self._assemble_pilates_class(**params)

        elif tool_id == "call_bassline_api":
            return self._call_bassline_api(**params)

        else:
            raise ValueError(f"Unknown tool: {tool_id}")

    # ==========================================================================
    # TOOL IMPLEMENTATIONS (Private Methods)
    # ==========================================================================

    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        BASSLINE CUSTOM: Call existing Bassline API to get user profile.

        NOT from Jentic - this is our domain logic.
        """
        try:
            response = await self.http_client.get(
                f"{self.bassline_api_url}/api/users/me/profile",
                headers={"Authorization": f"Bearer {user_id}"}  # Placeholder auth
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPError as e:
            logger.error(f"Failed to get user profile: {e}")
            # Return fallback defaults
            return {
                "id": user_id,
                "preferences": {
                    "default_difficulty": "Beginner",
                    "preferred_music_period": "CLASSICAL",
                    "ai_strictness_level": "guided"
                }
            }

    async def _assemble_pilates_class(
        self,
        user_id: str,
        target_duration_minutes: int,
        difficulty_level: str,
        focus_areas: List[str] = None,
        include_mcp_research: bool = False,
        strictness_level: str = "guided"
    ) -> Dict[str, Any]:
        """
        JENTIC PATTERN: Run Arazzo workflow as a tool.

        This is where the magic happens:
        1. Agent decides: "I should use the workflow"
        2. Agent calls: execute("assemble_pilates_class", {...})
        3. This method triggers: Arazzo Engine
        4. Arazzo Engine: Executes workflow steps sequentially
        5. Workflow returns: Complete class structure
        6. Agent receives: Result to reflect on

        COMPARISON TO JENTIC RAW CODE:
        =============================

        JENTIC (from GitHub):
        ```python
        def _run_workflow(self, workflow_id, inputs):
            result = self.arazzo_runner.run(
                workflow_id=workflow_id,
                inputs=inputs
            )
            return result.outputs
        ```

        BASSLINE (this file):
        Same pattern, but with our specific workflow ID.
        """
        logger.info(f"Assembling Pilates class for user {user_id}")

        # NOTE: Uncomment when Arazzo library is installed
        # result = self.arazzo_runner.run(
        #     workflow_id="assemblePilatesClass",
        #     inputs={
        #         "user_id": user_id,
        #         "target_duration_minutes": target_duration_minutes,
        #         "difficulty_level": difficulty_level,
        #         "focus_areas": focus_areas or [],
        #         "include_mcp_research": include_mcp_research,
        #         "strictness_level": strictness_level
        #     }
        # )
        # return result.outputs

        # PLACEHOLDER: Mock workflow execution
        return {
            "completeClass": {
                "userId": user_id,
                "sequence": [],
                "musicPlaylist": None,
                "meditationScript": None,
                "message": "Workflow execution placeholder - Arazzo engine not yet installed"
            }
        }

    async def _call_bassline_api(
        self,
        method: str,
        endpoint: str,
        body: Dict = None,
        headers: Dict = None
    ) -> Dict[str, Any]:
        """
        BASSLINE CUSTOM: Generic API caller.

        NOT from Jentic - this is our infrastructure glue code.
        """
        try:
            url = f"{self.bassline_api_url}{endpoint}"
            headers = headers or {}

            if method == "GET":
                response = await self.http_client.get(url, headers=headers)
            elif method == "POST":
                response = await self.http_client.post(url, json=body, headers=headers)
            elif method == "PUT":
                response = await self.http_client.put(url, json=body, headers=headers)
            elif method == "DELETE":
                response = await self.http_client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()
            return response.json()

        except httpx.HTTPError as e:
            logger.error(f"API call failed: {method} {endpoint} - {e}")
            raise


# ==============================================================================
# EDUCATIONAL NOTES
# ==============================================================================
"""
JENTIC PATTERN vs BASSLINE CUSTOM - Tool Implementation Comparison
===================================================================

┌────────────────────────────────────────────────────────────────────┐
│ JENTIC PATTERN (from GitHub repo)                                  │
│ ================================================================== │
│ Abstract tool interface:                                           │
│ │                                                                  │
│ class JustInTimeToolingBase(ABC):                                  │
│     @abstractmethod                                                 │
│     def list_tools(self) -> List[ToolInfo]:                        │
│         """Tell agent what tools exist"""                          │
│         pass                                                        │
│                                                                    │
│     @abstractmethod                                                 │
│     def execute(self, tool_id: str, params: Dict) -> Any:          │
│         """Execute the tool"""                                     │
│         pass                                                        │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ BASSLINE CUSTOM (this file)                                        │
│ ================================================================== │
│ Concrete Pilates tools:                                            │
│ │                                                                  │
│ class BasslinePilatesTools(JustInTimeToolingBase):  # ← INHERIT    │
│     def list_tools(self):                                          │
│         return [                                                    │
│             {"id": "get_user_profile", ...},      # ← DOMAIN TOOL  │
│             {"id": "assemble_pilates_class", ...},# ← WORKFLOW     │
│             {"id": "call_bassline_api", ...}      # ← GENERIC      │
│         ]                                                           │
│                                                                    │
│     def execute(self, tool_id, params):                             │
│         if tool_id == "assemble_pilates_class":                    │
│             return self.arazzo_runner.run(...)  # ← ARAZZO ENGINE  │
└────────────────────────────────────────────────────────────────────┘

KEY TAKEAWAY:
Jentic provides the INTERFACE (what a tool should look like).
We provide the IMPLEMENTATION (actual Pilates-specific tools).
"""
