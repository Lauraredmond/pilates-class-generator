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
                "energy_curve": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Optional energy levels throughout class (0.0-1.0 at different points)",
                    "required": False
                },
                "preferred_genres": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of preferred genres (e.g., ['ambient', 'classical'])",
                    "required": False
                },
                "target_bpm_range": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "description": "Optional BPM range as [min, max] (default: [90, 130])",
                    "required": False
                }
            },
            function=self.music_tools.select_music  # Correct method name
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
                "duration_minutes": {
                    "type": "integer",
                    "description": "Meditation duration (2-15 minutes)",
                    "required": False
                },
                "class_intensity": {
                    "type": "string",
                    "enum": ["low", "moderate", "high"],
                    "description": "Intensity of preceding class",
                    "required": False
                },
                "focus_theme": {
                    "type": "string",
                    "enum": ["mindfulness", "body_scan", "gratitude"],
                    "description": "Optional meditation theme/approach",
                    "required": False
                },
                "include_breathing": {
                    "type": "boolean",
                    "description": "Whether to include breathing guidance",
                    "required": False
                }
            },
            function=self.meditation_tools.generate_meditation  # Correct method name
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
- Movement cues (research_type='movement_cues')
- Warmup sequences (research_type='warmup')
- Pregnancy modifications (research_type='pregnancy')
- Injury adaptations (research_type='injury')
- Pilates trends (research_type='trends')

Returns: Curated research results with source attribution.
            """.strip(),
            parameters={
                "research_type": {
                    "type": "string",
                    "enum": ["movement_cues", "warmup", "pregnancy", "injury", "trends"],
                    "description": "Type of research to perform (REQUIRED)",
                    "required": True
                },
                "movement_name": {
                    "type": "string",
                    "description": "Name of Pilates movement (for movement_cues, pregnancy, injury)",
                    "required": False
                },
                "target_muscles": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of target muscles (for warmup research)",
                    "required": False
                },
                "duration_minutes": {
                    "type": "integer",
                    "description": "Duration in minutes (for warmup research, default: 5)",
                    "required": False
                },
                "trimester": {
                    "type": "integer",
                    "description": "Pregnancy trimester 1-3 (for pregnancy research, default: 2)",
                    "required": False
                },
                "injury_type": {
                    "type": "string",
                    "description": "Type of injury (for injury research, default: 'strain')",
                    "required": False
                },
                "injury_location": {
                    "type": "string",
                    "description": "Location of injury (for injury research, default: 'lower_back')",
                    "required": False
                },
                "trusted_sources_only": {
                    "type": "boolean",
                    "description": "Only use trusted Pilates websites (default: true)",
                    "required": False
                }
            },
            function=self.research_tools.research  # Correct method name
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
