import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy import select, and_

from app.core.database import AsyncSessionLocal
from app.modules.couriers.models import CourierCredential, CourierProvider
from app.modules.couriers.connectors.pathao import PathaoConnector
from app.modules.couriers.polling import poll_active_shipments

logger = logging.getLogger("courier_tasks")

POLL_INTERVAL_SECONDS = 30 * 60  # 30 minutes


async def refresh_expiring_pathao_tokens() -> int:
    """Proactively refreshes live Pathao OAuth tokens expiring within 2 hours."""
    refreshed = 0
    threshold = datetime.utcnow() + timedelta(hours=2)
    async with AsyncSessionLocal() as db:
        stmt = select(CourierCredential).where(
            and_(
                CourierCredential.provider == CourierProvider.PATHAO,
                CourierCredential.is_active == True,
                CourierCredential.token_expires_at != None,
                CourierCredential.token_expires_at <= threshold,
            )
        )
        creds = (await db.execute(stmt)).scalars().all()
        connector = PathaoConnector()
        for cred in creds:
            if connector.is_mock_credential(cred):
                continue
            try:
                await connector.issue_token(cred, db=db)
                refreshed += 1
            except Exception as e:
                logger.warning(f"Pathao token background refresh failed for tenant {cred.tenant_id}: {e}")
    return refreshed


async def courier_background_sync_loop() -> None:
    """
    Periodic background task:
    - Polls active eCourier shipments every 30 minutes (since eCourier lacks self-serve webhooks).
    - Refreshes expiring Pathao OAuth tokens proactively.
    """
    logger.info("Courier background sync loop started (30-min interval).")
    # Delay initial run slightly so startup stays instantaneous
    await asyncio.sleep(30)
    while True:
        try:
            async with AsyncSessionLocal() as db:
                summary = await poll_active_shipments(db, provider=CourierProvider.ECOURIER)
                if summary["checked"] > 0:
                    logger.info(f"eCourier polling complete: {summary}")
            await refresh_expiring_pathao_tokens()
        except asyncio.CancelledError:
            logger.info("Courier background sync loop shutting down.")
            raise
        except Exception as e:
            logger.warning(f"Courier background sync iteration error: {e}")

        await asyncio.sleep(POLL_INTERVAL_SECONDS)

