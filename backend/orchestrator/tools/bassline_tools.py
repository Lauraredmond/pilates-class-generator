"""
==============================================================================
BASSLINE PILATES TOOLS - Unified Interface
==============================================================================
JENTIC PATTERN: Implements JustInTimeToolingBase for StandardAgent integration

This module provides a unified tools interface that combines all domain-specific
tool modules (sequence, music, meditation, research) into a single registry that
Jentic's StandardAgent can interact with.

ARCHITECTURE:
- BasslinePilatesTools extends Jentic's JustInTimeToolingBase
- Registers all available tools with metadata (name, description, parameters)
- Routes tool execution to appropriate domain module
- Provides tool search and discovery functionality

This allows StandardAgent's ReWOOReasoner to:
1. Discover available tools (list_tools())
2. Execute tools by name (execute())
3. Get tool schemas for LLM reasoning
==============================================================================
"""

from typing import Dict, Any, List
from loguru import logger

# JENTIC import
from agents.tools.base import JustInTimeToolingBase

# BASSLINE custom tools
from .sequence_tools import SequenceTools
from .music_tools import MusicTools
from .meditation_tools import MeditationTools
from .research_tools import ResearchTools


class BasslinePilatesTools(JustInTimeToolingBase):
    """
    BASSLINE CUSTOM: Unified Pilates tools interface for Jentic StandardAgent

    ✅ EXTENDS JENTIC'S JustInTimeToolingBase

    This class wraps our domain-specific tool modules into the interface that
    Jentic's StandardAgent expects. It acts as a registry and dispatcher.

    What we inherit from Jentic:
    - Tool registration patterns
    - Execution interface
    - Search/discovery methods

    What we add:
    - Pilates-specific tool implementations
    - Database access configuration
    - Domain-specific tool metadata
    """

    def __init__(self, bassline_api_url: str = None, supabase_client=None):
        """
        Initialize all Pilates tool modules

        Args:
            bassline_api_url: Base URL for Bassline API calls
            supabase_client: Supabase client for database access
        """
        super().__init__()

        # Initialize domain-specific tool modules with correct parameters
        # Each tool class has different __init__ signatures:
        self.sequence_tools = SequenceTools(supabase_client=supabase_client)
        self.music_tools = MusicTools(bassline_api_url=bassline_api_url)
        self.meditation_tools = MeditationTools(bassline_api_url=bassline_api_url)
        self.research_tools = ResearchTools(mcp_client=None)  # MCP client not yet configured

        # Register all tools
        self._register_tools()

        logger.info("✅ BasslinePilatesTools initialized with 4 tool modules")

    def _register_tools(self):
        """
        Register all available tools with metadata

        JENTIC PATTERN: Tool registration for agent discovery
        Tools are registered with:
        - Unique ID
        - Human-readable name
        - Description for LLM reasoning
        - Parameter schema
        - Execution function
        """

        # ======================================================================
        # SEQUENCE TOOLS
        # ======================================================================

        self.register_tool(
            tool_id="generate_sequence",
            name="Generate Pilates Sequence",
            description="""
Generate a complete Pilates movement sequence following classical safety rules.

CRITICAL SAFETY RULES ENFORCED:
- Spinal progression (flexion before extension)
- Muscle balance (no group exceeds 40% load)
- Teaching time allocation (4-6 min per movement)
- Appropriate difficulty progression
- Required warmup and cooldown

Returns: Complete sequence with movements, transitions, muscle balance, and validation.
            """.strip(),
            parameters={
                "target_duration_minutes": {
                    "type": "integer",
                    "description": "Total class duration (15-120 minutes)",
                    "required": True
                },
                "difficulty_level": {
                    "type": "string",
                    "enum": ["Beginner", "Intermediate", "Advanced"],
                    "description": "Student experience level",
                    "required": True
                },
                "focus_areas": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional muscle groups to emphasize (e.g., ['core', 'legs'])",
                    "required": False
                },
                "user_id": {
                    "type": "string",
                    "description": "User ID for movement variety tracking",
                    "required": False
                }
            },
            function=self.sequence_tools.generate_sequence
        )

        # ======================================================================
        # MUSIC TOOLS
        # ======================================================================

        self.register_tool(
            tool_id="select_music",
            name="Select Music Playlist",
            description="""
Select appropriate classical music for Pilates class based on duration and energy.

Curates playlist from public domain classical music (Musopen, Internet Archive).
Matches music to class intensity curve and stylistic preferences.

Returns: Complete playlist with track details, URLs, and timing.
            """.strip(),
            parameters={
                "class_duration_minutes": {
                    "type": "integer",
                    "description": "Total class duration for music timing",
                    "required": True
                },
                "energy_level": {
                    "type": "number",
                    "description": "Energy level 0.0-1.0 (0.3=gentle, 0.6=moderate, 0.9=energetic)",
                    "required": True
                },
                "stylistic_period": {
                    "type": "string",
                    "enum": [
                        "Baroque",
                        "Classical",
                        "Romantic",
                        "Impressionist",
                        "Modern",
                        "Contemporary",
                        "Celtic Traditional"
                    ],
                    "description": "Preferred musical period",
                    "required": False
                }
            },
            function=self.music_tools.select_music_playlist
        )

        # ======================================================================
        # MEDITATION TOOLS
        # ======================================================================

        self.register_tool(
            tool_id="generate_meditation",
            name="Generate Closing Meditation",
            description="""
Generate personalized closing meditation script for Pilates class cooldown.

Adapts to class intensity and student needs. Includes breath work guidance,
body scan, and restoration focus.

Returns: Complete meditation script with timing and cues.
            """.strip(),
            parameters={
                "class_intensity": {
                    "type": "string",
                    "enum": ["gentle", "moderate", "intense"],
                    "description": "Intensity of preceding class",
                    "required": True
                },
                "duration_minutes": {
                    "type": "integer",
                    "description": "Meditation duration (3-10 minutes)",
                    "required": True
                },
                "theme": {
                    "type": "string",
                    "enum": ["body_scan", "breath_focus", "gratitude", "restoration"],
                    "description": "Meditation theme/approach",
                    "required": False
                }
            },
            function=self.meditation_tools.generate_meditation_script
        )

        # ======================================================================
        # RESEARCH TOOLS
        # ======================================================================

        self.register_tool(
            tool_id="research_movement_modifications",
            name="Research Movement Modifications",
            description="""
Research condition-specific movement modifications from trusted Pilates sources.

Searches reputable Pilates websites for:
- Pregnancy modifications
- Injury adaptations
- Equipment alternatives
- Teaching cues enhancements

Returns: Curated research results with source attribution.
            """.strip(),
            parameters={
                "movement_name": {
                    "type": "string",
                    "description": "Name of Pilates movement to research",
                    "required": True
                },
                "condition": {
                    "type": "string",
                    "description": "Specific condition (e.g., 'pregnancy', 'lower back pain')",
                    "required": False
                },
                "query_type": {
                    "type": "string",
                    "enum": ["modifications", "cues", "contraindications", "progressions"],
                    "description": "Type of information to research",
                    "required": False
                }
            },
            function=self.research_tools.research_movement_info
        )

        logger.info("✅ Registered 4 Pilates tools (sequence, music, meditation, research)")

    def list_tools(self) -> List[Dict[str, Any]]:
        """
        List all available tools with metadata

        JENTIC PATTERN: Tool discovery for agent planning

        Returns:
            List of tool dictionaries with id, name, description, parameters
        """
        return self._tools_registry

    def search(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for tools matching query

        JENTIC PATTERN: Tool search for agent decision-making

        Args:
            query: Search term (matches tool name/description)

        Returns:
            List of matching tools
        """
        if not query:
            return self.list_tools()

        query_lower = query.lower()
        matching_tools = [
            tool for tool in self._tools_registry
            if query_lower in tool["name"].lower() or query_lower in tool["description"].lower()
        ]

        return matching_tools

    def load(self, tool: Any) -> Any:
        """
        Load the full specification for a single tool

        JENTIC PATTERN: Tool loading interface (required abstract method)

        In our implementation, tools are already fully loaded during registration
        (see _register_tools() above), so this is a pass-through operation.

        Args:
            tool: Tool to load (can be dict with tool metadata or ToolBase object)

        Returns:
            The same tool object (already fully specified)
        """
        # Tools are already fully specified in our registry, so just return as-is
        return tool

    def execute(self, tool_id: str, parameters: Dict[str, Any]) -> Any:
        """
        Execute a tool by ID with given parameters

        JENTIC PATTERN: Tool execution interface for StandardAgent

        Args:
            tool_id: Registered tool ID
            parameters: Tool parameters dict

        Returns:
            Tool execution result

        Raises:
            ValueError: If tool not found or parameters invalid
        """
        tool = self._get_tool_by_id(tool_id)

        if not tool:
            raise ValueError(f"Tool '{tool_id}' not found")

        try:
            logger.info(f"Executing tool: {tool_id} with parameters: {list(parameters.keys())}")
            result = tool["function"](**parameters)
            logger.info(f"Tool execution completed: {tool_id}")
            return result

        except Exception as e:
            logger.error(f"Tool execution failed: {tool_id} - {e}")
            raise

    # ==========================================================================
    # INTERNAL HELPERS
    # ==========================================================================

    @property
    def _tools_registry(self) -> List[Dict[str, Any]]:
        """Get all registered tools"""
        if not hasattr(self, '_registered_tools'):
            self._registered_tools = []
        return self._registered_tools

    def register_tool(
        self,
        tool_id: str,
        name: str,
        description: str,
        parameters: Dict[str, Any],
        function: callable
    ):
        """Register a tool with metadata"""
        tool = {
            "id": tool_id,
            "name": name,
            "description": description,
            "parameters": parameters,
            "function": function
        }

        if not hasattr(self, '_registered_tools'):
            self._registered_tools = []

        self._registered_tools.append(tool)

    def _get_tool_by_id(self, tool_id: str) -> Dict[str, Any]:
        """Get tool by ID"""
        for tool in self._tools_registry:
            if tool["id"] == tool_id:
                return tool
        return None


# ==============================================================================
# EDUCATIONAL NOTES: JENTIC TOOLING PATTERN
# ==============================================================================
"""
JENTIC'S JustInTimeToolingBase provides the interface that StandardAgent expects:

File: /tmp/standard-agent/agents/tools/base.py

class JustInTimeToolingBase:
    def list_tools(self) -> List[Dict]: ...
    def search(self, query: str) -> List[Dict]: ...
    def execute(self, tool_id: str, params: Dict) -> Any: ...

Our BasslinePilatesTools implements this interface and:
1. Registers domain-specific tools (Pilates sequencing, music, meditation, research)
2. Provides tool metadata for LLM reasoning
3. Routes execution to appropriate domain module

This separation allows:
- StandardAgent to remain domain-agnostic (works for any domain)
- BasslinePilatesTools to encapsulate Pilates expertise
- Easy addition of new tools without changing agent code

To add new tools:
1. Create tool module in tools/ directory
2. Add tool class instantiation to __init__
3. Register tool in _register_tools() with metadata
4. Tool is immediately available to agent!
"""
