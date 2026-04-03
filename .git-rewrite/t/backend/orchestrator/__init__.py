"""
Agent package for Bassline Pilates Orchestrator

JENTIC PATTERN IMPLEMENTATION (Simplified for Production)
- SimplifiedStandardAgent: Core agent with solve() method
- SimplifiedReWOOReasoner: Plan→Execute→Reflect loop
- BasslinePilatesCoachAgent: Pilates-specific specialization

Uses LiteLLM for OpenAI integration (no Jentic GitHub dependencies needed)
"""

from .simplified_agent import BasslinePilatesCoachAgent, SimplifiedStandardAgent
from .simplified_reasoner import SimplifiedReWOOReasoner

__all__ = [
    "BasslinePilatesCoachAgent",
    "SimplifiedStandardAgent",
    "SimplifiedReWOOReasoner"
]
