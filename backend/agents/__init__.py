"""
AI Agents for Pilates Class Planner
All agents inherit from BaseAgent with EU AI Act compliance
"""

from .base_agent import BaseAgent
from .sequence_agent import SequenceAgent
from .music_agent import MusicAgent
from .meditation_agent import MeditationAgent
from .research_agent import ResearchAgent

__all__ = [
    "BaseAgent",
    "SequenceAgent",
    "MusicAgent",
    "MeditationAgent",
    "ResearchAgent"
]
