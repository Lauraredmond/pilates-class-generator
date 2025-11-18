"""
Research Agent - Uses MCP Playwright for web research
Finds Pilates content, cues, and modifications from trusted sources
"""

from typing import Dict, Any, List
from loguru import logger

from agents.base_agent import BaseAgent
from services.mcp_client import mcp_client


class ResearchAgent(BaseAgent):
    """
    Agent for web research using MCP Playwright
    """

    RESEARCH_TYPES = [
        "movement_cues",
        "warmup",
        "pregnancy",
        "injury",
        "trends"
    ]

    def __init__(
        self,
        model_name: str = "gpt-3.5-turbo",
        strictness_level: str = "guided"
    ):
        super().__init__(
            agent_type="research",
            model_name=model_name,
            strictness_level=strictness_level
        )

        # MCP client for web research
        self.mcp = mcp_client

    def _validate_inputs(self, inputs: Dict[str, Any]) -> None:
        """Validate research inputs"""
        research_type = inputs.get("research_type")
        if not research_type:
            raise ValueError("research_type is required")

        if research_type not in self.RESEARCH_TYPES:
            raise ValueError(f"research_type must be one of {self.RESEARCH_TYPES}")

        # Validate type-specific requirements
        if research_type == "movement_cues" and not inputs.get("movement_name"):
            raise ValueError("movement_name required for movement_cues research")

        if research_type == "warmup" and not inputs.get("target_muscles"):
            raise ValueError("target_muscles required for warmup research")

    async def _process_internal(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Perform web research"""
        research_type = inputs["research_type"]
        trusted_only = inputs.get("trusted_sources_only", True)

        logger.info(f"Performing {research_type} research")

        # Route to appropriate research method
        if research_type == "movement_cues":
            findings = await self.mcp.search_movement_cues(
                movement_name=inputs["movement_name"],
                trusted_sites_only=trusted_only
            )

        elif research_type == "warmup":
            findings = await self.mcp.find_warmup_sequence(
                target_muscles=inputs["target_muscles"],
                duration_minutes=inputs.get("duration_minutes", 5)
            )

        elif research_type == "pregnancy":
            findings = await self.mcp.research_pregnancy_modifications(
                movement_name=inputs["movement_name"],
                trimester=inputs.get("trimester", 2)
            )

        elif research_type == "injury":
            findings = await self.mcp.research_injury_modifications(
                movement_name=inputs["movement_name"],
                injury_type=inputs.get("injury_type", "strain"),
                injury_location=inputs.get("injury_location", "lower_back")
            )

        else:  # trends
            findings = {"trends": "Research not yet implemented"}

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

    def _calculate_confidence(self, output_data: Dict[str, Any]) -> float:
        """Calculate confidence in research results"""
        quality_score = output_data.get("quality_score", 0.5)
        sources = output_data.get("sources", [])

        # Confidence based on:
        # - Quality score from MCP (0.6 weight)
        # - Number of sources (0.4 weight)

        source_score = min(1.0, len(sources) / 3)  # 3+ sources is ideal
        confidence = (quality_score * 0.6) + (source_score * 0.4)

        return round(confidence, 2)

    def _generate_reasoning(
        self,
        inputs: Dict[str, Any],
        output_data: Dict[str, Any]
    ) -> str:
        """Generate explanation of research results"""
        research_type = inputs["research_type"]
        sources = output_data.get("sources", [])
        quality = output_data.get("quality_score", 0)
        cache_hit = output_data.get("cache_hit", False)

        reasoning = f"Performed {research_type} research. "
        reasoning += f"Found {len(sources)} sources with average quality {quality:.1%}. "

        if cache_hit:
            reasoning += "Results retrieved from cache. "
        else:
            reasoning += "Fresh research performed. "

        if inputs.get("trusted_sources_only"):
            reasoning += "Only trusted Pilates sources included."

        return reasoning

    async def _get_fallback(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Provide fallback research results"""
        return {
            "research_type": inputs.get("research_type", "unknown"),
            "findings": {
                "message": "Research temporarily unavailable. Using cached knowledge.",
                "fallback": True
            },
            "sources": [],
            "quality_score": 0.5,
            "cache_hit": False,
            "fallback": True
        }
