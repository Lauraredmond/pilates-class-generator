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
# ✅ JENTIC IMPORTS - REAL CODE FROM GITHUB
# ==============================================================================
# Installed via: git+https://github.com/jentic/standard-agent.git@main
#                git+https://github.com/jentic/arazzo-engine.git@main#subdirectory=runner

from agents.tools.base import JustInTimeToolingBase, ToolBase  # ← JENTIC
from arazzo_runner.runner import ArazzoRunner  # ← JENTIC Arazzo Engine

# ==============================================================================
# BASSLINE TOOL IMPLEMENTATION (extends Jentic's ToolBase)
# ==============================================================================

class BasslineTool(ToolBase):
    """
    BASSLINE CUSTOM: Concrete tool implementation.

    ✅ JENTIC PATTERN: Extends ToolBase abstract class

    Each tool provides:
    - Summary: Short description for LLM tool selection
    - Details: Full description for LLM reflection
    - Parameter schema: JSON schema for LLM parameter generation
    """

    def __init__(self, id: str, name: str, description: str, schema: Dict[str, Any]):
        super().__init__(id)
        self.name = name
        self.description = description
        self.schema = schema

    def get_summary(self) -> str:
        """Return summary information for LLM tool selection."""
        return f"{self.name}: {self.description[:100]}..."

    def get_details(self) -> str:
        """Return detailed information for LLM reflection."""
        return f"""
Tool: {self.name}
ID: {self.id}
Description: {self.description}
Parameters: {self.schema}
"""

    def get_parameter_schema(self) -> Dict[str, Any]:
        """Return detailed parameter schema for LLM parameter generation."""
        return self.schema

# ==============================================================================
# BASSLINE PILATES TOOLS
# ==============================================================================

class BasslinePilatesTools(JustInTimeToolingBase):
    """
    BASSLINE CUSTOMIZATION: Pilates-specific tool implementations

    ✅ JENTIC PATTERN: Inherits from JustInTimeToolingBase

    Each tool:
    1. Has a unique ID (e.g., "get_user_profile")
    2. Has a JSON schema (parameters it accepts)
    3. Has an execute method (what it does)

    Required methods (from JustInTimeToolingBase interface):
    - search(query: str, top_k: int) -> List[Tool]  ← Find tools matching query
    - list_tools() -> List[Dict]                    ← Return all tools
    - execute(tool_id: str, params: Dict) -> Any    ← Run the tool

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

        # ======================================================================
        # ✅ JENTIC: Initialize Arazzo Runner (REAL CODE)
        # ======================================================================
        # Using Jentic's ArazzoRunner from:
        # /tmp/arazzo-engine/runner/arazzo_runner/runner.py
        #
        # This provides:
        # - Workflow execution from .arazzo.yaml files
        # - OpenAPI operation execution
        # - Expression evaluation ($inputs, $steps, etc.)
        # - Authentication handling
        # ======================================================================

        workflow_path = "../arazzo/workflows/assemble_pilates_class_v1.yaml"
        openapi_path = "../openapi/bassline_openapi.yaml"

        try:
            self.arazzo_runner = ArazzoRunner.from_arazzo_path(
                arazzo_path=workflow_path
            )
            logger.info(f"✅ JENTIC Arazzo Runner initialized from {workflow_path}")
        except Exception as e:
            logger.warning(f"⚠️ Arazzo Runner initialization failed: {e}. Will use direct API calls.")
            self.arazzo_runner = None

        logger.info(f"✅ Tools initialized with API: {self.bassline_api_url}")

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

                Can be called with no parameters - uses sensible defaults:
                - user_id: "test-user"
                - target_duration_minutes: 30
                - difficulty_level: "Beginner"

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
                            "format": "uuid",
                            "default": "test-user",
                            "description": "User ID (defaults to test-user)"
                        },
                        "target_duration_minutes": {
                            "type": "integer",
                            "minimum": 15,
                            "maximum": 120,
                            "default": 30,
                            "description": "Class duration in minutes (defaults to 30)"
                        },
                        "difficulty_level": {
                            "type": "string",
                            "enum": ["Beginner", "Intermediate", "Advanced"],
                            "default": "Beginner",
                            "description": "Difficulty level (defaults to Beginner)"
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
                    "required": []
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
    # JENTIC PATTERN: Search Tools
    # ==========================================================================
    def search(self, query: str, top_k: int = 5) -> List[BasslineTool]:
        """
        Find tools matching the given query.

        JENTIC PATTERN: Tool Discovery with Search

        The ReWOOReasoner generates a plan with steps like:
        - "Identify beginner Pilates exercises"
        - "Estimate duration for each exercise"
        - "Create a class schedule"

        For each step, it calls search(step.text) to find relevant tools.

        COMPARISON TO JENTIC RAW CODE:
        =============================

        JENTIC (from GitHub):
        ```python
        def search(self, query: str, top_k: int = 5) -> List[Tool]:
            # Use semantic similarity or keyword matching
            # to find tools matching the query
            matches = []
            for tool in self.all_tools:
                if self._matches(query, tool.description):
                    matches.append(tool)
            return matches[:top_k]
        ```

        BASSLINE (this file):
        We use simple keyword matching on tool names and descriptions.
        Could upgrade to semantic embeddings later for better matching.

        Args:
            query: Natural language query (e.g., "get user information")
            top_k: Maximum number of tools to return (default 5)

        Returns:
            List of tools matching the query, sorted by relevance
        """
        all_tools = self.list_tools()
        matches = []

        query_lower = query.lower()

        for tool_dict in all_tools:
            # Calculate simple relevance score based on keyword matches
            score = 0

            # Check if query keywords appear in tool name
            if any(word in tool_dict["name"].lower() for word in query_lower.split()):
                score += 10

            # Check if query keywords appear in tool description
            if any(word in tool_dict["description"].lower() for word in query_lower.split()):
                score += 5

            # Check if query keywords appear in tool ID
            if any(word in tool_dict["id"].lower() for word in query_lower.split()):
                score += 3

            if score > 0:
                # Convert dict to BasslineTool instance
                tool = BasslineTool(
                    id=tool_dict["id"],
                    name=tool_dict["name"],
                    description=tool_dict["description"],
                    schema=tool_dict["schema"]
                )
                matches.append((score, tool))

        # Sort by score (descending) and return top_k
        matches.sort(key=lambda x: x[0], reverse=True)
        return [tool for score, tool in matches[:top_k]]

    # ==========================================================================
    # JENTIC PATTERN: Load Tool
    # ==========================================================================
    def load(self, tool: ToolBase) -> ToolBase:
        """
        Load the full specification for a single tool.

        JENTIC PATTERN: Tool Loading

        Since we already return full tool specifications in search(),
        we can just return the tool as-is. In more complex implementations,
        this could fetch additional details, validate permissions, etc.

        Args:
            tool: The tool to load

        Returns:
            The fully loaded tool (same object in our case)
        """
        # Already have full specification
        return tool

    # ==========================================================================
    # JENTIC PATTERN: Execute Tool
    # ==========================================================================
    def execute(self, tool: ToolBase, parameters: Dict[str, Any]) -> Any:
        """
        Execute a tool with given parameters.

        JENTIC PATTERN: Tool Routing

        Agent says: "Use tool X with params Y"
        Tools respond: "Routing to handler for X... here's the result"

        Args:
            tool: The tool to execute (ToolBase instance)
            parameters: Parameters matching tool's JSON schema

        Returns:
            Tool execution result

        COMPARISON TO JENTIC RAW CODE:
        =============================

        JENTIC (from GitHub):
        ```python
        def execute(self, tool: ToolBase, parameters: Dict) -> Any:
            if tool.id == "weather":
                return self._get_weather(**parameters)
            else:
                raise ValueError(f"Unknown tool: {tool.id}")
        ```

        BASSLINE (this file):
        Same pattern, but routes to Pilates-specific handlers.
        Also handles tool name → ID mapping for LLM flexibility.
        """
        logger.info(f"Executing tool: {tool.id} with params: {parameters}")

        # Map tool names to IDs (LLM sometimes uses names instead of IDs)
        tool_id = self._normalize_tool_id(tool.id)

        # Route to appropriate handler
        if tool_id == "get_user_profile":
            return self._get_user_profile(**parameters)

        elif tool_id == "assemble_pilates_class":
            return self._assemble_pilates_class(**parameters)

        elif tool_id == "call_bassline_api":
            return self._call_bassline_api(**parameters)

        else:
            raise ValueError(f"Unknown tool: {tool.id} (normalized: {tool_id})")

    # ==========================================================================
    # HELPER METHODS
    # ==========================================================================

    def _normalize_tool_id(self, tool_id: str) -> str:
        """
        Normalize tool ID by mapping tool names to their actual IDs.

        BASSLINE CUSTOM: LLM Flexibility

        The LLM sometimes uses tool names instead of IDs when suggesting tools.
        This helper maps common variations back to the canonical ID.

        Args:
            tool_id: Tool ID or name

        Returns:
            Canonical tool ID
        """
        # Create name → ID mapping
        name_to_id = {
            "Get User Profile": "get_user_profile",
            "Assemble Complete Pilates Class": "assemble_pilates_class",
            "Call Bassline API Endpoint": "call_bassline_api",
            # Agent sometimes suggests "Arazzo" based on tool descriptions
            "Arazzo": "assemble_pilates_class",
            "arazzo": "assemble_pilates_class",
        }

        # Return mapped ID if it's a name, otherwise return as-is
        return name_to_id.get(tool_id, tool_id)

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
        user_id: str = "test-user",
        target_duration_minutes: int = 30,
        difficulty_level: str = "Beginner",
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

        # ======================================================================
        # ✅ JENTIC: Execute Arazzo Workflow (REAL CODE)
        # ======================================================================
        # This triggers Jentic's workflow execution engine
        # The engine will:
        # 1. Load the .arazzo.yaml workflow file
        # 2. Execute steps sequentially
        # 3. Pass data between steps using runtime expressions
        # 4. Return workflow outputs
        # ======================================================================

        if self.arazzo_runner:
            try:
                result = self.arazzo_runner.execute_workflow(
                    workflow_id="assemblePilatesClass",
                    inputs={
                        "user_id": user_id,
                        "target_duration_minutes": target_duration_minutes,
                        "difficulty_level": difficulty_level,
                        "focus_areas": focus_areas or [],
                        "include_mcp_research": include_mcp_research,
                        "strictness_level": strictness_level
                    }
                )
                logger.info(f"✅ JENTIC Arazzo workflow completed: {result.status}")
                return result.outputs if hasattr(result, 'outputs') else result
            except Exception as e:
                logger.error(f"❌ Arazzo workflow execution failed: {e}")
                return {"error": str(e), "status": "failed"}
        else:
            logger.warning("⚠️ Arazzo Runner not available, using fallback")
            return {
                "completeClass": {
                    "userId": user_id,
                    "message": "Arazzo Runner not initialized - install dependencies"
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

JENTIC PATTERN (from GitHub repo):
- Abstract tool interface (JustInTimeToolingBase)
- Defines what methods tools must implement
- Generic, domain-agnostic design

BASSLINE CUSTOM (this file):
- Concrete Pilates tools implementation
- Inherits from JustInTimeToolingBase
- Domain-specific logic for Pilates

KEY TAKEAWAY:
Jentic provides the INTERFACE (what a tool should look like).
We provide the IMPLEMENTATION (actual Pilates-specific tools).

For detailed comparison, see docs/JENTIC_REAL_CODE_ANALYSIS.md
"""
