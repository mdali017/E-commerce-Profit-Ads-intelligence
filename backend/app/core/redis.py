import json
import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger("redis_manager")

_redis_client = None
_in_memory_cache: dict = {}


def get_redis_client():
    """
    Returns an async Redis client.
    Supports Upstash serverless Redis via REST SDK with automatic fallback.
    """
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    if settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN:
        try:
            from upstash_redis.asyncio import Redis

            _redis_client = Redis(
                url=settings.UPSTASH_REDIS_REST_URL,
                token=settings.UPSTASH_REDIS_REST_TOKEN,
            )
            logger.info("Upstash Serverless Redis client initialized.")
            return _redis_client
        except Exception as e:
            logger.warning(f"Failed to initialize Upstash Redis client: {e}")
            return None

    return None


async def ping_redis() -> bool:
    """Verifies Redis connectivity."""
    client = get_redis_client()
    if client:
        try:
            res = await client.ping()
            return res == "PONG" or res is True
        except Exception as e:
            logger.warning(f"Redis ping failed: {e}")
            return False
    return False


async def set_cache(key: str, value: Any, ttl_seconds: int = 300) -> bool:
    """Stores a serialized JSON value in Redis (or in-memory fallback)."""
    serialized = json.dumps(value, default=str)
    client = get_redis_client()
    if client:
        try:
            await client.set(key, serialized, ex=ttl_seconds)
            return True
        except Exception as e:
            logger.warning(f"Redis set failed for {key}: {e}")

    # Fallback
    _in_memory_cache[key] = serialized
    return True


async def get_cache(key: str) -> Optional[Any]:
    """Retrieves and deserializes JSON value from Redis (or in-memory fallback)."""
    client = get_redis_client()
    raw_val = None
    if client:
        try:
            raw_val = await client.get(key)
        except Exception as e:
            logger.warning(f"Redis get failed for {key}: {e}")

    if raw_val is None:
        raw_val = _in_memory_cache.get(key)

    if raw_val:
        try:
            return json.loads(raw_val)
        except Exception:
            return raw_val

    return None


async def delete_cache(key: str) -> bool:
    """Removes a key from cache."""
    client = get_redis_client()
    if client:
        try:
            await client.delete(key)
        except Exception as e:
            logger.warning(f"Redis delete failed for {key}: {e}")

    _in_memory_cache.pop(key, None)
    return True
