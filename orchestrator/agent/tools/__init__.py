"""
==============================================================================
BASSLINE PILATES TOOLS
==============================================================================
JENTIC PATTERN: Business logic separated into domain-specific tool modules

Tools are "things the agent can do" - concrete implementations of domain logic.
Each tool module contains the business logic extracted from legacy backend agents.

This is the proper Jentic architecture:
- StandardAgent = Reasoning layer (Plan → Execute → Reflect)
- Tools = Domain expertise (Pilates rules, music selection, etc.)

MIGRATION NOTES:
================
This tools/ directory contains business logic extracted from:
- backend/agents/sequence_agent.py → SequenceTools
- backend/agents/music_agent.py → MusicTools
- backend/agents/meditation_agent.py → MeditationTools
- backend/agents/research_agent.py → ResearchTools

All domain knowledge is preserved - nothing lost in migration.
==============================================================================
"""

from .sequence_tools import SequenceTools
from .music_tools import MusicTools
from .meditation_tools import MeditationTools
from .research_tools import ResearchTools

__all__ = [
    'SequenceTools',
    'MusicTools',
    'MeditationTools',
    'ResearchTools'
]
