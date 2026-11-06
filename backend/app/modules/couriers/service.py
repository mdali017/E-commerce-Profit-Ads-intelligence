import logging
from decimal import Decimal
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.couriers.models import (
    CourierCredential,
    CourierShipment,
    CourierTrackingEvent,
    CourierSettlement,
    CourierProvider,
    ShipmentStatus,
)
from app.modules.couriers.schemas import (
    CourierCredentialCreate,
    CourierCredentialUpdate,
    BookShipmentRequest,
    CourierKPIStats,
)
from app.modules.couriers.connectors.steadfast import SteadfastConnector
from app.modules.couriers.connectors.pathao import PathaoConnector
from app.modules.orders.models import Order, OrderStatus, PaymentStatus, OrderStatusHistory

logger = logging.getLogger("courier_service")


class CourierService:
    """
    Central business logic orchestrator for multi-courier dispatch,
    automated webhook delivery tracking, and COD settlement reconciliation.
    """

    @classmethod
    def get_connector(cls, provider: CourierProvider):
        if provider == CourierProvider.STEADFAST:
            return SteadfastConnector()
        elif provider == CourierProvider.PATHAO:
            return PathaoConnector()
        else:
            return SteadfastConnector()

    @classmethod
    async def save_credential(
        cls,
        db: AsyncSession,
        tenant_id: str,
        cred_in: CourierCredentialCreate,
    ) -> CourierCredential:
        """Saves or updates courier API credentials for a tenant."""
        stmt = select(CourierCredential).where(
            and_(
                CourierCredential.tenant_id == tenant_id,
                CourierCredential.provider == cred_in.provider,
            )
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if cred_in.is_default:
            # Unset any other default credentials for this tenant
            all_defs = await db.execute(
                select(CourierCredential).where(
                    and_(
                        CourierCredential.tenant_id == tenant_id,
                        CourierCredential.is_default == True,
                    )
                )
            )
            for c in all_defs.scalars().all():
                c.is_default = False

        if existing:
            existing.api_key = cred_in.api_key
            existing.secret_key = cred_in.secret_key
            existing.store_id = cred_in.store_id
            existing.webhook_secret = cred_in.webhook_secret
            existing.is_active = cred_in.is_active
            existing.is_default = cred_in.is_default
            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            new_cred = CourierCredential(
                tenant_id=tenant_id,
                provider=cred_in.provider,
                api_key=cred_in.api_key,
                secret_key=cred_in.secret_key,
                store_id=cred_in.store_id,
                webhook_secret=cred_in.webhook_secret,
                is_active=cred_in.is_active,
                is_default=cred_in.is_default,
            )
            db.add(new_cred)
            await db.commit()
            await db.refresh(new_cred)
            return new_cred

    @classmethod
    async def get_credentials(
        cls, db: AsyncSession, tenant_id: str
    ) -> List[CourierCredential]:
        stmt = select(CourierCredential).where(CourierCredential.tenant_id == tenant_id)
        res = await db.execute(stmt)
        return res.scalars().all()

    @classmethod
    async def get_active_credential(
        cls, db: AsyncSession, tenant_id: str, provider: Optional[CourierProvider] = None
    ) -> CourierCredential:
        """Finds active credential or creates a mock development credential if none configured."""
        if provider:
            stmt = select(CourierCredential).where(
                and_(
                    CourierCredential.tenant_id == tenant_id,
                    CourierCredential.provider == provider,
                    CourierCredential.is_active == True,
                )
            )
        else:
            stmt = select(CourierCredential).where(
                and_(
                    CourierCredential.tenant_id == tenant_id,
                    CourierCredential.is_active == True,
                )
            ).order_by(CourierCredential.is_default.desc())

        res = await db.execute(stmt)
        cred = res.scalars().first()

        if not cred:
            # Fallback simulated sandbox credential for effortless testing
            target_provider = provider or CourierProvider.STEADFAST
            cred = CourierCredential(
                tenant_id=tenant_id,
                provider=target_provider,
                api_key=f"mock_key_{target_provider.value}",
                secret_key="mock_secret_key",
                is_active=True,
                is_default=True,
            )
            db.add(cred)
            await db.commit()
            await db.refresh(cred)

        return cred

    @classmethod
    async def dispatch_order(
        cls,
        db: AsyncSession,
        tenant_id: str,
        request_in: BookShipmentRequest,
        user_id: Optional[str] = None,
    ) -> CourierShipment:
        """
        Dispatches an order to the selected courier (Steadfast or Pathao).
        Updates Order status to IN_COURIER and creates tracking records.
        """
        # 1. Fetch Order
        order_res = await db.execute(
            select(Order).where(
                and_(Order.id == request_in.order_id, Order.tenant_id == tenant_id)
            )
        )
        order = order_res.scalar_one_or_none()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{request_in.order_id}' not found.",
            )

        # 2. Check for active shipment
        existing_res = await db.execute(
            select(CourierShipment).where(
                and_(
                    CourierShipment.order_id == order.id,
                    CourierShipment.status.notin_([ShipmentStatus.CANCELLED, ShipmentStatus.RETURNED]),
                )
            )
        )
        if existing_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order #{order.order_number} already has an active courier shipment.",
            )

        # 3. Resolve Credential & Connector
        cred = await cls.get_active_credential(db, tenant_id, request_in.provider)
        connector = cls.get_connector(request_in.provider)

        cod_amount = request_in.custom_cod_amount if request_in.custom_cod_amount is not None else order.total_amount

        # 4. Call Courier API to book parcel
        booking_result = await connector.create_parcel(
            credential=cred,
            invoice_number=order.order_number,
            recipient_name=order.customer_name,
            recipient_phone=order.customer_phone,
            recipient_address=order.shipping_address,
            cod_amount=cod_amount,
            notes=request_in.notes or order.internal_notes,
            recipient_city=order.shipping_city,
        )

        delivery_fee = booking_result.get("delivery_fee", Decimal("60.00"))
        # Standard COD fee in BD couriers is 1%
        cod_fee = (cod_amount * Decimal("0.01")).quantize(Decimal("0.01"))

        # 5. Create CourierShipment Record
        shipment = CourierShipment(
            tenant_id=tenant_id,
            order_id=order.id,
            provider=request_in.provider,
            consignment_id=booking_result["consignment_id"],
            tracking_code=booking_result.get("tracking_code"),
            invoice_number=order.order_number,
            status=booking_result["status"],
            raw_status=booking_result.get("raw_status"),
            recipient_name=order.customer_name,
            recipient_phone=order.customer_phone,
            recipient_address=order.shipping_address,
            recipient_city=order.shipping_city,
            cod_amount=cod_amount,
            delivery_fee=delivery_fee,
            cod_fee=cod_fee,
            notes=request_in.notes,
        )
        db.add(shipment)
        await db.flush()

        # 6. Create Initial Tracking Event
        event = CourierTrackingEvent(
            shipment_id=shipment.id,
            event_status="BOOKED",
            message=f"Consignment booked with {request_in.provider.value.title()} (CID: {shipment.consignment_id})",
            timestamp=datetime.utcnow(),
        )
        db.add(event)

        # 7. Update Order Status to IN_COURIER & Log Audit History
        old_status = order.status
        order.status = OrderStatus.IN_COURIER

        audit = OrderStatusHistory(
            order_id=order.id,
            tenant_id=order.tenant_id,
            from_status=old_status.value if hasattr(old_status, 'value') else str(old_status),
            to_status=OrderStatus.IN_COURIER.value,
            changed_by_user_id=user_id,
            reason=f"Dispatched via {request_in.provider.value.title()} (Consignment #{shipment.consignment_id})",
        )
        db.add(audit)


        await db.commit()
        await db.refresh(shipment)

        # Reload with tracking events
        stmt = (
            select(CourierShipment)
            .where(CourierShipment.id == shipment.id)
            .options(selectinload(CourierShipment.tracking_events))
        )
        loaded = (await db.execute(stmt)).scalar_one()

        logger.info(
            f"Order #{order.order_number} successfully dispatched to {request_in.provider.value}: CID={shipment.consignment_id}"
        )
        return loaded

    @classmethod
    async def list_shipments(
        cls,
        db: AsyncSession,
        tenant_id: str,
        provider: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[CourierShipment]:
        stmt = (
            select(CourierShipment)
            .where(CourierShipment.tenant_id == tenant_id)
            .options(selectinload(CourierShipment.tracking_events))
            .order_by(CourierShipment.created_at.desc())
        )

        if provider and provider != "all":
            stmt = stmt.where(CourierShipment.provider == provider)
        if status and status != "all":
            stmt = stmt.where(CourierShipment.status == status)
        if search:
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    CourierShipment.consignment_id.ilike(term),
                    CourierShipment.tracking_code.ilike(term),
                    CourierShipment.invoice_number.ilike(term),
                    CourierShipment.recipient_phone.ilike(term),
                    CourierShipment.recipient_name.ilike(term),
                )
            )

        stmt = stmt.offset(skip).limit(limit)
        res = await db.execute(stmt)
        return res.scalars().all()

    @classmethod
    async def get_shipment_detail(
        cls, db: AsyncSession, tenant_id: str, shipment_id: str
    ) -> CourierShipment:
        stmt = (
            select(CourierShipment)
            .where(
                and_(
                    CourierShipment.id == shipment_id,
                    CourierShipment.tenant_id == tenant_id,
                )
            )
            .options(selectinload(CourierShipment.tracking_events))
        )
        res = await db.execute(stmt)
        shipment = res.scalar_one_or_none()
        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Courier shipment not found.",
            )
        return shipment

    @classmethod
    async def process_courier_webhook(
        cls,
        db: AsyncSession,
        provider: CourierProvider,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Universal webhook processor for incoming delivery status updates from couriers.
        Automatically syncs Order status when parcel is DELIVERED or RETURNED.
        """
        # Extract identifier
        consignment_id = (
            str(payload.get("consignment_id") or payload.get("cid") or payload.get("consignment") or "")
        )
        invoice = str(payload.get("invoice") or payload.get("invoice_number") or "")
        raw_status = str(payload.get("status") or payload.get("delivery_status") or "")

        # Find shipment
        stmt = select(CourierShipment).options(selectinload(CourierShipment.tracking_events))
        if consignment_id:
            stmt = stmt.where(CourierShipment.consignment_id == consignment_id)
        elif invoice:
            stmt = stmt.where(CourierShipment.invoice_number == invoice)
        else:
            return {"status": "ignored", "reason": "No identifier in webhook payload"}

        res = await db.execute(stmt)
        shipment = res.scalar_one_or_none()
        if not shipment:
            return {"status": "ignored", "reason": f"No shipment matched for CID: {consignment_id}"}

        # Map status
        connector = cls.get_connector(provider)
        if provider == CourierProvider.STEADFAST:
            new_canonical = SteadfastConnector.map_steadfast_status(raw_status)
        else:
            new_canonical = PathaoConnector.map_pathao_status(raw_status)

        old_status = shipment.status
        shipment.status = new_canonical
        shipment.raw_status = raw_status

        # If Delivered: Record payment and update Order
        if new_canonical == ShipmentStatus.DELIVERED:
            shipment.collected_amount = shipment.cod_amount
            shipment.delivery_date = datetime.utcnow()

            # Update Order
            order_res = await db.execute(
                select(Order).where(Order.id == shipment.order_id)
            )
            order = order_res.scalar_one_or_none()
            if order:
                order.status = OrderStatus.DELIVERED
                order.payment_status = PaymentStatus.PAID
                audit = OrderStatusHistory(
                    order_id=order.id,
                    tenant_id=order.tenant_id,
                    from_status=OrderStatus.IN_COURIER.value,
                    to_status=OrderStatus.DELIVERED.value,
                    reason=f"Delivered by {provider.value.title()} (CID: {shipment.consignment_id})",
                )
                db.add(audit)

        # If Returned: Update Order
        elif new_canonical == ShipmentStatus.RETURNED:
            order_res = await db.execute(
                select(Order).where(Order.id == shipment.order_id)
            )
            order = order_res.scalar_one_or_none()
            if order:
                order.status = OrderStatus.RETURNED
                audit = OrderStatusHistory(
                    order_id=order.id,
                    tenant_id=order.tenant_id,
                    from_status=OrderStatus.IN_COURIER.value,
                    to_status=OrderStatus.RETURNED.value,
                    reason=f"Returned by customer via {provider.value.title()}",
                )
                db.add(audit)


        # Add tracking event
        event = CourierTrackingEvent(
            shipment_id=shipment.id,
            event_status=new_canonical.value.upper(),
            message=payload.get("message") or f"Status changed to {raw_status} via webhook",
            location=payload.get("location"),
            timestamp=datetime.utcnow(),
        )
        db.add(event)

        await db.commit()
        return {
            "status": "success",
            "consignment_id": shipment.consignment_id,
            "old_status": old_status.value,
            "new_status": new_canonical.value,
        }

    @classmethod
    async def get_courier_kpis(
        cls, db: AsyncSession, tenant_id: str
    ) -> CourierKPIStats:
        """Calculates executive courier delivery performance metrics."""
        stmt = select(CourierShipment).where(CourierShipment.tenant_id == tenant_id)
        res = await db.execute(stmt)
        shipments = res.scalars().all()

        total = len(shipments)
        booked = sum(1 for s in shipments if s.status == ShipmentStatus.BOOKED)
        transit = sum(1 for s in shipments if s.status == ShipmentStatus.IN_TRANSIT)
        delivered = sum(1 for s in shipments if s.status in (ShipmentStatus.DELIVERED, ShipmentStatus.PARTIALLY_DELIVERED))
        returned = sum(1 for s in shipments if s.status == ShipmentStatus.RETURNED)
        cancelled = sum(1 for s in shipments if s.status == ShipmentStatus.CANCELLED)

        delivery_rate = round((delivered / total * 100), 2) if total > 0 else 0.0
        return_rate = round((returned / total * 100), 2) if total > 0 else 0.0

        total_cod = sum(s.cod_amount for s in shipments)
        total_collected = sum(s.collected_amount for s in shipments)
        total_del_fees = sum(s.delivery_fee for s in shipments)
        total_cod_fees = sum(s.cod_fee for s in shipments)
        total_charges = total_del_fees + total_cod_fees
        unsettled = sum(s.collected_amount for s in shipments if not s.is_settled)

        return CourierKPIStats(
            total_shipments=total,
            booked_count=booked,
            in_transit_count=transit,
            delivered_count=delivered,
            returned_count=returned,
            cancelled_count=cancelled,
            delivery_success_rate=delivery_rate,
            return_rate=return_rate,
            total_cod_amount=total_cod,
            total_collected_amount=total_collected,
            total_delivery_fees=total_del_fees,
            total_courier_charges=total_charges,
            unsettled_balance=unsettled,
        )
