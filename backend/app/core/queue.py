import uuid
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.core.redis import set_cache, get_cache

logger = logging.getLogger("task_queue")


class TaskStatus:
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class BackgroundJobManager:
    """
    Manages asynchronous background jobs with state persistence in Redis.
    Tracks status, execution progress, errors, and results.
    """

    @staticmethod
    async def create_job(job_type: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        payload = {
            "job_id": job_id,
            "type": job_type,
            "status": TaskStatus.QUEUED,
            "progress": 0,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "result": None,
            "error": None,
        }
        await set_cache(f"job:{job_id}", payload, ttl_seconds=86400)  # 24 hours
        return job_id

    @staticmethod
    async def get_job(job_id: str) -> Optional[Dict[str, Any]]:
        return await get_cache(f"job:{job_id}")

    @staticmethod
    async def update_job(
        job_id: str,
        status: Optional[str] = None,
        progress: Optional[int] = None,
        result: Optional[Any] = None,
        error: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        job = await get_cache(f"job:{job_id}")
        if not job:
            return None

        if status:
            job["status"] = status
        if progress is not None:
            job["progress"] = progress
        if result is not None:
            job["result"] = result
        if error is not None:
            job["error"] = error
        job["updated_at"] = datetime.utcnow().isoformat()

        await set_cache(f"job:{job_id}", job, ttl_seconds=86400)
        return job


# Singleton instance
job_manager = BackgroundJobManager()
