import asyncio
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.dependencies import get_tenant_context, require_roles, TenantContext
from app.modules.workspaces.models import UserRole
from app.core.queue import job_manager, TaskStatus
from app.modules.couriers.polling import poll_active_shipments
from app.modules.couriers.tasks import refresh_expiring_pathao_tokens
from app.modules.ads.service import AdsService
from app.modules.orders.sync import OrderSyncQueueService

router = APIRouter(prefix="/jobs", tags=["Background Async Job Engine"])


async def run_courier_polling_job(job_id: str, tenant_id: str):
    await job_manager.update_job(job_id, status=TaskStatus.RUNNING, progress=10)
    try:
        async with AsyncSessionLocal() as db:
            summary = await poll_active_shipments(db, tenant_id=tenant_id)
            await job_manager.update_job(job_id, progress=70)
            refreshed = await refresh_expiring_pathao_tokens()
            await job_manager.update_job(
                job_id,
                status=TaskStatus.COMPLETED,
                progress=100,
                result={"courier_summary": summary, "pathao_tokens_refreshed": refreshed},
            )
    except Exception as e:
        await job_manager.update_job(job_id, status=TaskStatus.FAILED, error=str(e))


async def run_meta_insights_job(job_id: str, tenant_id: str):
    await job_manager.update_job(job_id, status=TaskStatus.RUNNING, progress=10)
    try:
        async with AsyncSessionLocal() as db:
            synced = await AdsService.sync_daily_insights(db, tenant_id=tenant_id)
            await job_manager.update_job(
                job_id,
                status=TaskStatus.COMPLETED,
                progress=100,
                result={"synced_records": len(synced), "status": "success"},
            )
    except Exception as e:
        await job_manager.update_job(job_id, status=TaskStatus.FAILED, error=str(e))


async def run_cogs_backfill_job(job_id: str, tenant_id: str):
    await job_manager.update_job(job_id, status=TaskStatus.RUNNING, progress=10)
    try:
        async with AsyncSessionLocal() as db:
            result = await OrderSyncQueueService.retroactive_cogs_backfill(db, tenant_id=tenant_id)
            await job_manager.update_job(
                job_id,
                status=TaskStatus.COMPLETED,
                progress=100,
                result=result,
            )
    except Exception as e:
        await job_manager.update_job(job_id, status=TaskStatus.FAILED, error=str(e))


@router.get("/{job_id}", summary="Get Job Execution Status")
async def get_job_status(
    job_id: str,
    context: TenantContext = Depends(get_tenant_context),
):
    """Checks progress, execution state, and output payload of a background job."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found.",
        )
    return job


@router.post(
    "/trigger/courier-sync",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue Courier Polling Job",
)
async def trigger_courier_sync(
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
):
    """Enqueues async courier tracking polling; returns immediately with 202 Accepted."""
    job_id = await job_manager.create_job(
        job_type="courier_polling",
        metadata={"tenant_id": context.tenant_id, "triggered_by": context.user_id},
    )
    asyncio.create_task(run_courier_polling_job(job_id, context.tenant_id))
    return {
        "status": "accepted",
        "job_id": job_id,
        "message": "Courier status polling job has been queued in background.",
    }


@router.post(
    "/trigger/ads-insights",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue Meta Ads Insights Sync",
)
async def trigger_ads_insights(
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.MARKETER])
    ),
):
    """Enqueues async Meta Marketing API sync; returns immediately with 202 Accepted."""
    job_id = await job_manager.create_job(
        job_type="meta_insights_sync",
        metadata={"tenant_id": context.tenant_id, "triggered_by": context.user_id},
    )
    asyncio.create_task(run_meta_insights_job(job_id, context.tenant_id))
    return {
        "status": "accepted",
        "job_id": job_id,
        "message": "Meta Ads sync job queued in background.",
    }


@router.post(
    "/trigger/cogs-backfill",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue COGS Retroactive Backfill",
)
async def trigger_cogs_backfill(
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT])
    ),
):
    """Enqueues async COGS backfill matching; returns immediately with 202 Accepted."""
    job_id = await job_manager.create_job(
        job_type="cogs_retroactive_backfill",
        metadata={"tenant_id": context.tenant_id, "triggered_by": context.user_id},
    )
    asyncio.create_task(run_cogs_backfill_job(job_id, context.tenant_id))
    return {
        "status": "accepted",
        "job_id": job_id,
        "message": "COGS backfill job queued in background.",
    }
