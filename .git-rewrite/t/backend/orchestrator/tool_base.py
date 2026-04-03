"""
==============================================================================
SIMPLIFIED TOOL BASE CLASSES
==============================================================================
JENTIC PATTERN IMPLEMENTATION (Simplified)

These are simplified versions of Jentic's tool base classes.
We maintain the same interface but without external dependencies.

JENTIC PATTERN:
- ToolBase: Base class for individual tools
- JustInTimeToolingBase: Container for all tools with search/execute

==============================================================================
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any


class ToolBase(ABC):
    """
    JENTIC PATTERN: Base class for tools

    Each tool has:
    - Unique ID
    - Summary (for LLM selection)
    - Details (for LLM reflection)
    - Parameter schema (JSON schema)
    """

    def __init__(self, id: str):
        self.id = id

    @abstractmethod
    def get_summary(self) -> str:
        """Return brief summary for LLM tool selection"""
        pass

    @abstractmethod
    def get_details(self) -> str:
        """Return detailed information for LLM reflection"""
        pass

    @abstractmethod
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Return JSON schema for parameters"""
        pass


class JustInTimeToolingBase(ABC):
    """
    JENTIC PATTERN: Container for all available tools

    Provides:
    - list_tools(): Return all available tools
    - search(query): Find tools matching query
    - load(tool): Load full tool specification
    - execute(tool, params): Execute a tool
    """

    @abstractmethod
    def list_tools(self) -> List[Dict[str, Any]]:
        """Return list of all available tools"""
        pass

    @abstractmethod
    def search(self, query: str, top_k: int = 5) -> List[ToolBase]:
        """
        Find tools matching the given query.

        Args:
            query: Natural language query
            top_k: Maximum number of tools to return

        Returns:
            List of matching tools
        """
        pass

    @abstractmethod
    def load(self, tool: ToolBase) -> ToolBase:
        """
        Load the full specification for a tool.

        Args:
            tool: The tool to load

        Returns:
            The fully loaded tool
        """
        pass

    @abstractmethod
    def execute(self, tool: ToolBase, parameters: Dict[str, Any]) -> Any:
        """
        Execute a tool with given parameters.

        Args:
            tool: The tool to execute
            parameters: Parameters matching tool's schema

        Returns:
            Tool execution result
        """
        pass
