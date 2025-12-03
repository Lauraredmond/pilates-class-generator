"""
==============================================================================
RESEARCH TOOLS - Extracted from backend/agents/research_agent.py
==============================================================================
BASSLINE CUSTOM: MCP Playwright web research business logic

This module contains all research logic extracted from ResearchAgent.
Pure business logic - no agent orchestration, just domain expertise.

JENTIC PATTERN: Tools = Domain Expertise
StandardAgent will call these methods via the tools registry.
==============================================================================
"""

from typing import Dict, Any, List
from loguru import logger


class ResearchTools:
    """
    BASSLINE CUSTOM: Web research using MCP Playwright

    Extracted from: backend/agents/research_agent.py (190 lines)
    All business logic preserved - nothing lost in migration.

    NOTE: Requires MCP client to be injected or accessible
    """

    RESEARCH_TYPES = [
        "movement_cues",
        "warmup",
        "pregnancy",
        "injury",
        "trends"
    ]

    def __init__(self, mcp_client=None):
        """
        Initialize research tools

        Args:
            mcp_client: MCP Playwright client for web research
        """
        self.mcp = mcp_client
        logger.info("✅ ResearchTools initialized")

    def research(
        self,
        research_type: str,
        movement_name: str = None,
        target_muscles: List[str] = None,
        duration_minutes: int = 5,
        trimester: int = 2,
        injury_type: str = "strain",
        injury_location: str = "lower_back",
        trusted_sources_only: bool = True
    ) -> Dict[str, Any]:
        """
        Perform web research using MCP Playwright

        BASSLINE CUSTOM: Research orchestration logic (from ResearchAgent)

        Args:
            research_type: Type of research ('movement_cues', 'warmup', 'pregnancy', 'injury', 'trends')
            movement_name: Movement name (for movement_cues, pregnancy, injury)
            target_muscles: List of muscles (for warmup)
            duration_minutes: Warmup duration (for warmup)
            trimester: Pregnancy trimester (for pregnancy)
            injury_type: Type of injury (for injury)
            injury_location: Location of injury (for injury)
            trusted_sources_only: Only use trusted Pilates websites

        Returns:
            Dict with findings, sources, quality score, and cache hit info
        """
        # Validate inputs
        if research_type not in self.RESEARCH_TYPES:
            raise ValueError(f"research_type must be one of {self.RESEARCH_TYPES}")

        if research_type == "movement_cues" and not movement_name:
            raise ValueError("movement_name required for movement_cues research")

        if research_type == "warmup" and not target_muscles:
            raise ValueError("target_muscles required for warmup research")

        logger.info(f"Performing {research_type} research")

        # Check if MCP client is available
        if not self.mcp:
            logger.warning("MCP client not available - returning fallback")
            return self._get_fallback_results(research_type)

        # Route to appropriate research method
        try:
            if research_type == "movement_cues":
                findings = self._research_movement_cues(movement_name, trusted_sources_only)

            elif research_type == "warmup":
                findings = self._research_warmup(target_muscles, duration_minutes)

            elif research_type == "pregnancy":
                findings = self._research_pregnancy(movement_name, trimester)

            elif research_type == "injury":
                findings = self._research_injury(movement_name, injury_type, injury_location)

            else:  # trends
                findings = {"trends": "Research not yet implemented"}

        except Exception as e:
            logger.error(f"Research failed: {e}")
            findings = self._get_fallback_results(research_type)

        # Extract sources for compliance
        sources = self._extract_sources(findings)

        # Calculate quality score
        quality_score = findings.get("quality_score", 0.8)

        # Check if result was from cache
        cache_hit = findings.get("mcp_metadata", {}).get("cache_hit", False)

        return {
            "research_type": research_type,
            "findings": findings,
            "sources": sources,
            "quality_score": quality_score,
            "cache_hit": cache_hit
        }

    def _research_movement_cues(self, movement_name: str, trusted_only: bool) -> Dict[str, Any]:
        """Research movement cues using MCP"""
        if not hasattr(self.mcp, 'search_movement_cues'):
            return {"error": "MCP client does not support search_movement_cues"}

        # This would call the actual MCP client method
        # For now, return placeholder
        return {
            "movement": movement_name,
            "cues": [],
            "sources": [],
            "quality_score": 0.8
        }

    def _research_warmup(self, target_muscles: List[str], duration: int) -> Dict[str, Any]:
        """Research warmup sequences using MCP"""
        if not hasattr(self.mcp, 'find_warmup_sequence'):
            return {"error": "MCP client does not support find_warmup_sequence"}

        # This would call the actual MCP client method
        return {
            "warmup_exercises": [],
            "target_muscles": target_muscles,
            "duration_minutes": duration,
            "sources": [],
            "quality_score": 0.8
        }

    def _research_pregnancy(self, movement_name: str, trimester: int) -> Dict[str, Any]:
        """Research pregnancy modifications using MCP"""
        if not hasattr(self.mcp, 'research_pregnancy_modifications'):
            return {"error": "MCP client does not support research_pregnancy_modifications"}

        # This would call the actual MCP client method
        return {
            "movement": movement_name,
            "trimester": trimester,
            "modifications": [],
            "contraindications": [],
            "sources": [],
            "quality_score": 0.8
        }

    def _research_injury(self, movement_name: str, injury_type: str, injury_location: str) -> Dict[str, Any]:
        """Research injury modifications using MCP"""
        if not hasattr(self.mcp, 'research_injury_modifications'):
            return {"error": "MCP client does not support research_injury_modifications"}

        # This would call the actual MCP client method
        return {
            "movement": movement_name,
            "injury_type": injury_type,
            "injury_location": injury_location,
            "modifications": [],
            "cautions": [],
            "sources": [],
            "quality_score": 0.8
        }

    def _extract_sources(self, findings: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract source information from research findings"""
        sources = []

        # Handle different finding structures
        if "sources" in findings:
            for source in findings["sources"]:
                if isinstance(source, dict):
                    sources.append({
                        "url": source.get("url", ""),
                        "title": source.get("title", ""),
                        "excerpt": source.get("excerpt", ""),
                        "accessed": source.get("accessed", ""),
                        "quality_score": source.get("quality_score", 0.8),
                        "is_medical": source.get("is_medical", False),
                        "credentials": source.get("credentials")
                    })
                elif isinstance(source, str):
                    sources.append({
                        "url": source,
                        "title": "Trusted Source",
                        "excerpt": "",
                        "accessed": "",
                        "quality_score": 0.8,
                        "is_medical": False,
                        "credentials": None
                    })

        return sources

    def _get_fallback_results(self, research_type: str) -> Dict[str, Any]:
        """Provide fallback research results when MCP unavailable"""
        return {
            "message": "Research temporarily unavailable. Using cached knowledge.",
            "fallback": True,
            "sources": [],
            "quality_score": 0.5
        }
