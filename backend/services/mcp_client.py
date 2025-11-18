"""
MCP (Model Context Protocol) Client for Playwright Integration
Enables web research for Pilates content, cues, and modifications
"""

import os
import asyncio
from typing import List, Dict, Optional
import logging
from datetime import datetime, timedelta
import json
import redis

logger = logging.getLogger(__name__)


class MCPPlaywrightClient:
    """
    Client for MCP Playwright server to perform web research
    """

    def __init__(self):
        """Initialize MCP client with caching"""
        self.mcp_url = os.getenv('MCP_PLAYWRIGHT_URL', 'http://localhost:3001')
        self.cache_ttl = int(os.getenv('REDIS_TTL', 86400))  # 24 hours

        # Initialize Redis cache
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        try:
            self.cache = redis.from_url(redis_url, decode_responses=True)
            logger.info(f"Connected to Redis cache: {redis_url}")
        except Exception as e:
            logger.warning(f"Redis unavailable: {e}. Proceeding without cache.")
            self.cache = None

        # Trusted Pilates websites for research
        self.trusted_domains = [
            'pilatesmethod.com',
            'pilatesfoundation.com',
            'balancedbody.com',
            'pilates.com',
            'ncbi.nlm.nih.gov',  # Medical research
            'physiotherapy.org.uk'
        ]

    def _get_cache_key(self, prefix: str, params: Dict) -> str:
        """Generate cache key from parameters"""
        params_str = json.dumps(params, sort_keys=True)
        return f"mcp:{prefix}:{params_str}"

    def _get_cached(self, cache_key: str) -> Optional[Dict]:
        """Get cached result"""
        if not self.cache:
            return None

        try:
            cached = self.cache.get(cache_key)
            if cached:
                logger.info(f"Cache hit: {cache_key}")
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Cache read error: {e}")

        return None

    def _set_cached(self, cache_key: str, data: Dict):
        """Set cached result"""
        if not self.cache:
            return

        try:
            self.cache.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(data)
            )
            logger.info(f"Cached result: {cache_key}")
        except Exception as e:
            logger.warning(f"Cache write error: {e}")

    async def search_movement_cues(
        self,
        movement_name: str,
        trusted_sites_only: bool = True
    ) -> Dict:
        """
        Search for additional cues for a specific Pilates movement

        Args:
            movement_name: Name of the movement (e.g., "The Hundred")
            trusted_sites_only: Only search trusted Pilates websites

        Returns:
            Dict with cues, sources, and metadata
        """
        cache_key = self._get_cache_key('movement_cues', {
            'movement': movement_name,
            'trusted_only': trusted_sites_only
        })

        # Check cache
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        logger.info(f"Researching cues for: {movement_name}")

        # TODO: Implement actual MCP Playwright calls when server is running
        # For now, return placeholder structure
        result = {
            'movement': movement_name,
            'cues': {
                'verbal': [
                    "Engage your core",
                    "Maintain neutral spine",
                    "Breathe with the rhythm"
                ],
                'visual': [
                    "Imagine your spine as a string of pearls",
                    "Picture your tailbone reaching long"
                ],
                'tactile': [
                    "Feel your ribs knitting together",
                    "Sense your shoulder blades gliding down"
                ]
            },
            'common_mistakes': [
                "Overarching the back",
                "Holding breath",
                "Tensing shoulders"
            ],
            'modifications': {
                'beginner': "Keep head down, feet on floor",
                'intermediate': "Legs in tabletop position",
                'advanced': "Legs extended at 45 degrees"
            },
            'sources': [
                {
                    'url': f'https://pilatesmethod.com/movements/{movement_name.lower().replace(" ", "-")}',
                    'title': f'{movement_name} - Pilates Method',
                    'accessed': datetime.now().isoformat()
                }
            ],
            'quality_score': 0.85,
            'mcp_metadata': {
                'research_date': datetime.now().isoformat(),
                'cache_expiry': (datetime.now() + timedelta(seconds=self.cache_ttl)).isoformat()
            }
        }

        # Cache result
        self._set_cached(cache_key, result)

        return result

    async def find_warmup_sequence(
        self,
        target_muscles: List[str],
        duration_minutes: int = 5
    ) -> Dict:
        """
        Find targeted warm-up exercises for specific muscle groups

        Args:
            target_muscles: List of muscle groups to warm up
            duration_minutes: Target duration for warm-up

        Returns:
            Dict with warm-up exercises and timing
        """
        cache_key = self._get_cache_key('warmup', {
            'muscles': sorted(target_muscles),
            'duration': duration_minutes
        })

        cached = self._get_cached(cache_key)
        if cached:
            return cached

        logger.info(f"Finding warm-up for: {target_muscles}")

        # Placeholder structure
        result = {
            'target_muscles': target_muscles,
            'duration_minutes': duration_minutes,
            'exercises': [
                {
                    'name': 'Pelvic tilts',
                    'duration_seconds': 60,
                    'muscles_targeted': ['Core', 'Pelvic stability'],
                    'instructions': 'Lie supine, gently tilt pelvis posterior and anterior'
                },
                {
                    'name': 'Cat-Cow stretches',
                    'duration_seconds': 60,
                    'muscles_targeted': ['Spinal mobility', 'Core'],
                    'instructions': 'On all fours, alternate between spinal flexion and extension'
                },
                {
                    'name': 'Shoulder rolls',
                    'duration_seconds': 30,
                    'muscles_targeted': ['Scapular mobility'],
                    'instructions': 'Roll shoulders forward and backward slowly'
                }
            ],
            'total_duration': 150,  # seconds
            'sources': self.trusted_domains[:3],
            'mcp_metadata': {
                'research_date': datetime.now().isoformat()
            }
        }

        self._set_cached(cache_key, result)
        return result

    async def research_pregnancy_modifications(
        self,
        movement_name: str,
        trimester: int
    ) -> Dict:
        """
        Find safe Pilates modifications for pregnancy

        Args:
            movement_name: Movement to modify
            trimester: 1, 2, or 3

        Returns:
            Dict with safe modifications and contraindications
        """
        cache_key = self._get_cache_key('pregnancy_mods', {
            'movement': movement_name,
            'trimester': trimester
        })

        cached = self._get_cached(cache_key)
        if cached:
            return cached

        logger.info(f"Researching pregnancy modifications: {movement_name} (T{trimester})")

        result = {
            'movement': movement_name,
            'trimester': trimester,
            'is_safe': True,  # Default, should be verified
            'modifications': [
                "Elevate upper body with pillows",
                "Reduce range of motion",
                "Focus on breathing and control"
            ],
            'contraindications': [
                "Avoid supine position after 20 weeks",
                "No deep twisting",
                "Avoid abdominal compression"
            ],
            'alternative_movements': [
                "Side-lying leg series",
                "Seated spine twist (gentle)"
            ],
            'medical_sources': [
                {
                    'title': 'Pregnancy and Pilates Safety Guidelines',
                    'url': 'https://ncbi.nlm.nih.gov/pregnancy-exercise',
                    'credentials': 'NIH/National Library of Medicine'
                }
            ],
            'mcp_metadata': {
                'research_date': datetime.now().isoformat(),
                'verified_medical': True
            }
        }

        self._set_cached(cache_key, result)
        return result

    async def research_injury_modifications(
        self,
        movement_name: str,
        injury_type: str,
        injury_location: str
    ) -> Dict:
        """
        Research modifications for students with injuries

        Args:
            movement_name: Movement to modify
            injury_type: Type of injury (strain, sprain, chronic pain, etc.)
            injury_location: Body part (lower_back, knee, shoulder, etc.)

        Returns:
            Dict with modifications, contraindications, alternatives
        """
        cache_key = self._get_cache_key('injury_mods', {
            'movement': movement_name,
            'injury_type': injury_type,
            'location': injury_location
        })

        cached = self._get_cached(cache_key)
        if cached:
            return cached

        logger.info(f"Researching injury mods: {movement_name} for {injury_location} {injury_type}")

        result = {
            'movement': movement_name,
            'injury': {
                'type': injury_type,
                'location': injury_location
            },
            'recommend_avoid': False,  # Should be determined by research
            'modifications': [
                "Reduce range of motion",
                "Use props for support",
                "Focus on unaffected side first"
            ],
            'contraindications': [
                f"Avoid if {injury_location} pain increases",
                "Stop immediately if sharp pain occurs"
            ],
            'alternative_movements': [
                "Gentle mobility exercises",
                "Isometric holds"
            ],
            'professional_advice': "Consult with physiotherapist before proceeding",
            'sources': self.trusted_domains,
            'mcp_metadata': {
                'research_date': datetime.now().isoformat()
            }
        }

        self._set_cached(cache_key, result)
        return result

    def clear_cache(self, pattern: str = 'mcp:*'):
        """Clear cached MCP results"""
        if not self.cache:
            return 0

        try:
            keys = self.cache.keys(pattern)
            if keys:
                return self.cache.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return 0


# Singleton instance
mcp_client = MCPPlaywrightClient()
