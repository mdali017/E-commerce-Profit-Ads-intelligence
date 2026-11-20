import json
import logging
import time
from typing import Optional, Any, Tuple, Dict
from app.core.config import settings

logger = logging.getLogger("redis_manager")

_redis_client = None
# In-memory L1 cache with TTL: key -> (expire_at_timestamp, serialized_str)
_in_memory_cache: Dict[str, Tuple[float, str]] = {}


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
    """
    Stores a serialized JSON value in high-speed L1 in-memory cache and L2 Upstash Redis.
    """
    serialized = json.dumps(value, default=str)
    now = time.time()
    
    # 1. Update high-speed L1 in-memory cache immediately (0ms latency)
    _in_memory_cache[key] = (now + ttl_seconds, serialized)

    # 2. Update L2 Upstash Cloud Redis asynchronously
    client = get_redis_client()
    if client:
        try:
            await client.set(key, serialized, ex=ttl_seconds)
            return True
        except Exception as e:
            logger.warning(f"Redis set failed for {key}: {e}")

    return True


async def get_cache(key: str) -> Optional[Any]:
    """
    Retrieves and deserializes JSON value.
    Checks high-speed L1 RAM cache first (<0.1ms). On miss, queries L2 Upstash Redis.
    """
    now = time.time()

    # 1. Check L1 In-Memory RAM Cache first (instant <0.1ms)
    entry = _in_memory_cache.get(key)
    if entry:
        expire_at, val_str = entry
        if now < expire_at:
            try:
                return json.loads(val_str)
            except Exception:
                return val_str
        else:
            _in_memory_cache.pop(key, None)

    # 2. Check L2 Upstash Cloud Redis on L1 miss
    client = get_redis_client()
    raw_val = None
    if client:
        try:
            raw_val = await client.get(key)
        except Exception as e:
            logger.warning(f"Redis get failed for {key}: {e}")

    if raw_val:
        # Populate L1 cache for subsequent fast reads (up to 60s or until TTL)
        _in_memory_cache[key] = (now + 60, raw_val if isinstance(raw_val, str) else json.dumps(raw_val))
        try:
            return json.loads(raw_val) if isinstance(raw_val, str) else raw_val
        except Exception:
            return raw_val

    return None


async def delete_cache(key: str) -> bool:
    """Removes a key from both L1 RAM and L2 Redis."""
    _in_memory_cache.pop(key, None)
    client = get_redis_client()
    if client:
        try:
            await client.delete(key)
        except Exception as e:
            logger.warning(f"Redis delete failed for {key}: {e}")

    return True
