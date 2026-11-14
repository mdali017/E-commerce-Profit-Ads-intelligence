import logging
from datetime import datetime
from typing import Dict, Any, Optional
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
    Primarily used for eCourier (which lacks self-serve webhooks), and
    available for manual/fallback sync across all couriers.
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

    checked = 0
    updated = 0
    errors = 0

    for shipment in shipments:
        checked += 1
        try:
            cred = await CourierService.get_active_credential(
                db, shipment.tenant_id, shipment.provider
            )
            connector = CourierService.get_connector(shipment.provider)
            tracking = await connector.get_tracking_status(
                credential=cred,
                consignment_id=shipment.consignment_id,
                invoice_number=shipment.invoice_number,
                tracking_code=shipment.tracking_code,
            )
            shipment.last_polled_at = datetime.utcnow()
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
            logger.warning(f"Polling error for shipment {shipment.consignment_id}: {e}")

    return {
        "checked": checked,
        "updated": updated,
        "errors": errors,
        "provider": provider.value if provider else "all",
        "polled_at": datetime.utcnow().isoformat(),
    }

