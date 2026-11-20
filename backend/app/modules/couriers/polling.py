import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.couriers.models import CourierShipment, CourierProvider, ShipmentStatus
from app.modules.couriers.service import CourierService

logger = logging.getLogger("courier_polling")

ACTIVE_POLL_STATUSES = [
    ShipmentStatus.PENDING,
    ShipmentStatus.BOOKED,
    ShipmentStatus.IN_TRANSIT,
]


async def poll_active_shipments(
    db: AsyncSession,
    tenant_id: Optional[str] = None,
    provider: Optional[CourierProvider] = CourierProvider.ECOURIER,
    limit: int = 100,
) -> Dict[str, Any]:
    """
    Polls active (non-terminal) courier shipments from external APIs.
    Optimized with credential batch caching and asyncio.Semaphore concurrent API fetching.
    """
    conditions = [CourierShipment.status.in_(ACTIVE_POLL_STATUSES)]
    if tenant_id:
        conditions.append(CourierShipment.tenant_id == tenant_id)
    if provider:
        conditions.append(CourierShipment.provider == provider)

    stmt = (
        select(CourierShipment)
        .where(and_(*conditions))
        .order_by(CourierShipment.last_polled_at.asc().nullsfirst(), CourierShipment.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    shipments = res.scalars().all()

    if not shipments:
        return {
            "checked": 0,
            "updated": 0,
            "errors": 0,
            "provider": provider.value if provider else "all",
            "polled_at": datetime.utcnow().isoformat(),
        }

    # 1. Batch-cache tenant credentials to avoid redundant DB queries per shipment
    creds_cache: Dict[Tuple[str, CourierProvider], Any] = {}
    connectors_cache: Dict[CourierProvider, Any] = {}

    for s in shipments:
        key = (s.tenant_id, s.provider)
        if key not in creds_cache:
            creds_cache[key] = await CourierService.get_active_credential(db, s.tenant_id, s.provider)
        if s.provider not in connectors_cache:
            connectors_cache[s.provider] = CourierService.get_connector(s.provider)

    # 2. Concurrently fetch tracking status from external courier APIs (throttled to 10 concurrent requests)
    sem = asyncio.Semaphore(10)

    async def fetch_tracking(shipment):
        cred = creds_cache.get((shipment.tenant_id, shipment.provider))
        connector = connectors_cache.get(shipment.provider)
        if not connector:
            return shipment, None, Exception(f"No connector for provider {shipment.provider}")
        async with sem:
            try:
                tracking = await connector.get_tracking_status(
                    credential=cred,
                    consignment_id=shipment.consignment_id,
                    invoice_number=shipment.invoice_number,
                    tracking_code=shipment.tracking_code,
                )
                return shipment, tracking, None
            except Exception as e:
                return shipment, None, e

    tracking_results = await asyncio.gather(*(fetch_tracking(s) for s in shipments))

    # 3. Apply state transitions sequentially to ensure DB consistency
    checked = 0
    updated = 0
    errors = 0

    for shipment, tracking, error in tracking_results:
        checked += 1
        shipment.last_polled_at = datetime.utcnow()
        if error or not tracking:
            errors += 1
            logger.warning(f"Polling error for shipment {shipment.consignment_id}: {error}")
            continue

        try:
            changed = await CourierService._apply_status_transition(
                db=db,
                shipment=shipment,
                new_canonical=tracking["status"],
                raw_status=str(tracking.get("raw_status") or tracking["status"].value),
                message=tracking.get("message") or f"Auto-polled from {shipment.provider.value.title()}",
                location=tracking.get("location"),
                source="polling",
                collected_amount=tracking.get("collected_amount"),
                delivery_fee=tracking.get("delivery_fee"),
            )
            if changed:
                updated += 1
        except Exception as e:
            errors += 1
            logger.warning(f"Error applying polled status for shipment {shipment.consignment_id}: {e}")

    return {
        "checked": checked,
        "updated": updated,
        "errors": errors,
        "provider": provider.value if provider else "all",
        "polled_at": datetime.utcnow().isoformat(),
    }

