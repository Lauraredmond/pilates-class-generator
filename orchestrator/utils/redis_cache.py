"""
==============================================================================
REDIS CACHING UTILITY - Performance Optimization Phase 1
==============================================================================
Session 13: December 4, 2025
Purpose: Cache AI-generated content to reduce LLM costs and improve response times

PERFORMANCE IMPACT:
- Cache HIT: <1 second response time (database-speed)
- Cache HIT: $0.00 cost (no LLM call)
- Expected hit rate: 70-80% after warm-up period
- Cost savings: 70-80% reduction on repeat requests

CACHE STRATEGY:
- 24-hour TTL (fresh content daily, but reusable throughout day)
- Key-based caching (difficulty, focus, theme, etc.)
- Graceful degradation (if Redis unavailable, fall back to LLM)
==============================================================================
"""

import os
import json
import hashlib
from typing import Any, Optional, Callable
from loguru import logger

try:
    from redis import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("⚠️ Redis not installed - caching disabled (run: pip install redis)")


class AIResponseCache:
    """
    Redis-based cache for AI-generated content.

    Usage:
        cache = AIResponseCache()

        # Try cache first, generate if miss
        result = cache.get_or_generate(
            cache_key="prep:beginner",
            generator=lambda: generate_with_llm(...),
            ttl_seconds=86400  # 24 hours
        )
    """

    def __init__(self):
        """Initialize Redis connection with graceful degradation"""
        self.redis_client: Optional[Redis] = None
        self.enabled = False

        if not REDIS_AVAILABLE:
            logger.warning("⚠️ Redis caching DISABLED (library not available)")
            return

        try:
            # Try to connect to Redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

            self.redis_client = Redis.from_url(
                redis_url,
                decode_responses=True,  # Return strings instead of bytes
                socket_timeout=2,
                socket_connect_timeout=2
            )

            # Test connection
            self.redis_client.ping()
            self.enabled = True
            logger.info(f"✅ Redis caching ENABLED: {redis_url}")

        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            logger.warning("⚠️ Redis caching DISABLED - falling back to direct LLM calls")
            self.redis_client = None
            self.enabled = False

    def get_or_generate(
        self,
        cache_key: str,
        generator: Callable[[], Any],
        ttl_seconds: int = 86400
    ) -> Any:
        """
        Get value from cache OR generate with LLM if cache miss.

        Args:
            cache_key: Redis key (e.g., "prep:beginner", "warmup:core+hips")
            generator: Function to call on cache MISS (LLM generation)
            ttl_seconds: Time-to-live in seconds (default: 24 hours)

        Returns:
            Cached value (dict) or freshly generated value

        Example:
            result = cache.get_or_generate(
                cache_key="meditation:body_scan",
                generator=lambda: generate_meditation_with_llm("body_scan"),
                ttl_seconds=86400
            )
        """

        # If Redis disabled, skip cache and go straight to LLM
        if not self.enabled:
            return generator()

        try:
            # Try to get from cache
            cached_json = self.redis_client.get(cache_key)

            if cached_json:
                logger.info(f"✅ Cache HIT: {cache_key} (saved $0.20-0.30 + 10-15 seconds)")
                return json.loads(cached_json)

            # Cache MISS - generate with LLM
            logger.info(f"🤖 Cache MISS: {cache_key} (generating with LLM)")
            result = generator()

            # Store in cache for future requests
            self.redis_client.setex(
                name=cache_key,
                time=ttl_seconds,
                value=json.dumps(result)
            )
            logger.info(f"💾 Cached: {cache_key} (TTL: {ttl_seconds // 3600}h)")

            return result

        except Exception as e:
            # Redis error - fall back to LLM without caching
            logger.error(f"❌ Redis error: {e} - falling back to LLM")
            return generator()

    def invalidate(self, cache_key: str) -> bool:
        """
        Invalidate a specific cache entry.

        Useful for forcing fresh content generation.

        Args:
            cache_key: Redis key to delete

        Returns:
            True if deleted, False if key didn't exist or Redis unavailable
        """
        if not self.enabled:
            return False

        try:
            deleted = self.redis_client.delete(cache_key)
            if deleted:
                logger.info(f"🗑️ Invalidated cache: {cache_key}")
            return bool(deleted)
        except Exception as e:
            logger.error(f"❌ Cache invalidation failed: {e}")
            return False

    def clear_all(self, pattern: str = "*") -> int:
        """
        Clear all cache entries matching pattern.

        Args:
            pattern: Redis key pattern (e.g., "prep:*", "warmup:*", "*")

        Returns:
            Number of keys deleted
        """
        if not self.enabled:
            return 0

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"🗑️ Cleared {deleted} cache entries matching '{pattern}'")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"❌ Cache clear failed: {e}")
            return 0

    def get_stats(self) -> dict:
        """
        Get Redis cache statistics.

        Returns:
            Dictionary with cache stats (size, memory, hit rate, etc.)
        """
        if not self.enabled:
            return {"enabled": False}

        try:
            info = self.redis_client.info("stats")
            return {
                "enabled": True,
                "total_keys": self.redis_client.dbsize(),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "hit_rate": info.get("keyspace_hits", 0) /
                           max(info.get("keyspace_hits", 0) + info.get("keyspace_misses", 1), 1),
                "memory_used": info.get("used_memory_human", "unknown")
            }
        except Exception as e:
            logger.error(f"❌ Failed to get cache stats: {e}")
            return {"enabled": True, "error": str(e)}


def make_cache_key(*parts: str) -> str:
    """
    Helper to create consistent cache keys.

    Args:
        *parts: Components of the cache key (e.g., "prep", "beginner")

    Returns:
        Colon-separated cache key (e.g., "prep:beginner")

    Example:
        key = make_cache_key("warmup", "core", "hips")  # → "warmup:core:hips"
    """
    return ":".join(str(p).lower() for p in parts if p)


# Singleton instance for use across all tools
_cache_instance: Optional[AIResponseCache] = None


def get_cache() -> AIResponseCache:
    """
    Get the global cache instance (singleton pattern).

    Returns:
        AIResponseCache instance (reuses same Redis connection)

    Example:
        from utils.redis_cache import get_cache

        cache = get_cache()
        result = cache.get_or_generate(...)
    """
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = AIResponseCache()
    return _cache_instance
