import hmac
import asyncio
import logging
from decimal import Decimal
from datetime import datetime, timedelta
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
    CourierCredentialResponse,
    CourierTestConnectionRequest,
    CourierTestConnectionResponse,
    BookShipmentRequest,
    BulkDispatchRequest,
    BulkDispatchResponse,
    BulkDispatchItemResult,
    CourierKPIStats,
    FraudCheckResponse,
    ProviderPerformanceItem,
    DailyCourierTrendPoint,
    DeliveryPerformanceAnalyticsResponse,
    ProviderCostBreakdown,
    CostAnalysisResponse,
    CityPerformanceItem,
    CourierSettlementCreate,
    CourierSettlementUpdate,
)
from app.modules.couriers.crypto import encrypt_secret, decrypt_secret, mask_secret
from app.modules.couriers.connectors.steadfast import SteadfastConnector
from app.modules.couriers.connectors.pathao import PathaoConnector
from app.modules.couriers.connectors.ecourier import ECourierConnector
from app.modules.orders.models import Order, OrderStatus, PaymentStatus, OrderStatusHistory
from app.modules.crm.service import CRMService

logger = logging.getLogger("courier_service")


def _is_masked_or_empty(val: Optional[str]) -> bool:
    return not val or val.strip() == "" or val.strip().startswith("••••")


class CourierService:
    """
    Central business logic orchestrator for multi-courier dispatch (Steadfast, Pathao, eCourier),
    OAuth & API credential lifecycle, automated webhook & polling delivery tracking,
    fraud intelligence, analytics, and COD settlement reconciliation.
    """

    @classmethod
    def get_connector(cls, provider: CourierProvider):
        if provider == CourierProvider.STEADFAST:
            return SteadfastConnector()
        elif provider == CourierProvider.PATHAO:
            return PathaoConnector()
        elif provider == CourierProvider.ECOURIER:
            return ECourierConnector()
        else:
            return SteadfastConnector()

    @classmethod
    def map_status(cls, provider: CourierProvider, raw_status: str) -> ShipmentStatus:
        if provider == CourierProvider.STEADFAST:
            return SteadfastConnector.map_steadfast_status(raw_status)
        elif provider == CourierProvider.PATHAO:
            return PathaoConnector.map_pathao_status(raw_status)
        elif provider == CourierProvider.ECOURIER:
            return ECourierConnector.map_ecourier_status(raw_status)
        return SteadfastConnector.map_steadfast_status(raw_status)

    @classmethod
    def serialize_credential(cls, cred: CourierCredential) -> CourierCredentialResponse:
        now = datetime.utcnow()
        has_valid_token = bool(
            cred.access_token and cred.token_expires_at and cred.token_expires_at > now
        )
        return CourierCredentialResponse(
            id=cred.id,
            tenant_id=cred.tenant_id,
            provider=cred.provider,
            api_key=cred.api_key or cred.client_id or "",
            secret_key=mask_secret(cred.secret_key or cred.client_secret_key),
            store_id=cred.store_id,
            webhook_secret=mask_secret(cred.webhook_secret) if cred.webhook_secret else None,
            user_id=cred.user_id,
            client_id=cred.client_id,
            username=cred.username,
            is_sandbox=bool(cred.is_sandbox),
            has_secret=bool(cred.secret_key or cred.client_secret_key),
            has_password=bool(cred.password_encrypted),
            has_valid_token=has_valid_token,
            token_expires_at=cred.token_expires_at,
            is_active=cred.is_active,
            is_default=cred.is_default,
            created_at=cred.created_at,
            updated_at=cred.updated_at,
        )

    # ==========================================
    # Credentials & Connection Validation
    # ==========================================
    @classmethod
    async def save_credential(
        cls,
        db: AsyncSession,
        tenant_id: str,
        cred_in: CourierCredentialCreate,
    ) -> CourierCredentialResponse:
        """Saves or updates courier API/OAuth credentials for a tenant with at-rest encryption."""
        stmt = select(CourierCredential).where(
            and_(
                CourierCredential.tenant_id == tenant_id,
                CourierCredential.provider == cred_in.provider,
            )
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if cred_in.is_default:
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

        api_key_val = (cred_in.api_key or cred_in.client_id or "").strip()
        if not api_key_val and existing:
            api_key_val = existing.api_key

        client_id_val = (cred_in.client_id or api_key_val or "").strip() or None
        raw_secret = cred_in.secret_key or cred_in.client_secret

        if existing:
            existing.api_key = api_key_val
            if not _is_masked_or_empty(raw_secret):
                enc_sec = encrypt_secret(raw_secret.strip())
                existing.secret_key = enc_sec
                existing.client_secret_key = enc_sec
            if cred_in.store_id is not None:
                existing.store_id = cred_in.store_id.strip() or None
            if not _is_masked_or_empty(cred_in.webhook_secret):
                existing.webhook_secret = encrypt_secret(cred_in.webhook_secret.strip())
            if cred_in.user_id is not None:
                existing.user_id = cred_in.user_id.strip() or None
            if client_id_val:
                existing.client_id = client_id_val
            if cred_in.username is not None:
                existing.username = cred_in.username.strip() or None
            if not _is_masked_or_empty(cred_in.password):
                existing.password_encrypted = encrypt_secret(cred_in.password.strip())
            existing.is_sandbox = bool(cred_in.is_sandbox)
            existing.is_active = cred_in.is_active
            existing.is_default = cred_in.is_default
            # Reset cached OAuth token on credential update
            existing.access_token = None
            existing.token_expires_at = None

            await db.commit()
            await db.refresh(existing)
            return cls.serialize_credential(existing)
        else:
            enc_sec = encrypt_secret(raw_secret.strip()) if not _is_masked_or_empty(raw_secret) else None
            enc_wh = encrypt_secret(cred_in.webhook_secret.strip()) if not _is_masked_or_empty(cred_in.webhook_secret) else None
            enc_pw = encrypt_secret(cred_in.password.strip()) if not _is_masked_or_empty(cred_in.password) else None

            new_cred = CourierCredential(
                tenant_id=tenant_id,
                provider=cred_in.provider,
                api_key=api_key_val or f"mock_key_{cred_in.provider.value}",
                secret_key=enc_sec,
                client_secret_key=enc_sec,
                store_id=cred_in.store_id.strip() if cred_in.store_id else None,
                webhook_secret=enc_wh,
                user_id=cred_in.user_id.strip() if cred_in.user_id else None,
                client_id=client_id_val,
                username=cred_in.username.strip() if cred_in.username else None,
                password_encrypted=enc_pw,
                is_sandbox=bool(cred_in.is_sandbox),
                is_active=cred_in.is_active,
                is_default=cred_in.is_default,
            )
            db.add(new_cred)
            await db.commit()
            await db.refresh(new_cred)
            return cls.serialize_credential(new_cred)

    @classmethod
    async def get_credentials(
        cls, db: AsyncSession, tenant_id: str
    ) -> List[CourierCredentialResponse]:
        stmt = select(CourierCredential).where(CourierCredential.tenant_id == tenant_id)
        res = await db.execute(stmt)
        return [cls.serialize_credential(c) for c in res.scalars().all()]

    @classmethod
    async def delete_credential(
        cls, db: AsyncSession, tenant_id: str, credential_id: str
    ) -> Dict[str, Any]:
        res = await db.execute(
            select(CourierCredential).where(
                and_(
                    CourierCredential.id == credential_id,
                    CourierCredential.tenant_id == tenant_id,
                )
            )
        )
        cred = res.scalar_one_or_none()
        if not cred:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found.")
        await db.delete(cred)
        await db.commit()
        return {"success": True, "message": f"{cred.provider.value} credential removed."}

    @classmethod
    async def get_active_credential(
        cls, db: AsyncSession, tenant_id: str, provider: Optional[CourierProvider] = None
    ) -> CourierCredential:
        """Finds active credential or provisions a mock sandbox credential if none configured."""
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
            target_provider = provider or CourierProvider.STEADFAST
            cred = CourierCredential(
                tenant_id=tenant_id,
                provider=target_provider,
                api_key=f"mock_key_{target_provider.value}",
                secret_key=encrypt_secret("mock_secret_key"),
                user_id="mock_user_id" if target_provider == CourierProvider.ECOURIER else None,
                client_id=f"mock_client_{target_provider.value}" if target_provider == CourierProvider.PATHAO else None,
                is_sandbox=True,
                is_active=True,
                is_default=(provider is None),
            )
            db.add(cred)
            await db.commit()
            await db.refresh(cred)

        return cred

    @classmethod
    async def get_optional_credential(
        cls, db: AsyncSession, tenant_id: str, provider: CourierProvider
    ) -> Optional[CourierCredential]:
        res = await db.execute(
            select(CourierCredential).where(
                and_(
                    CourierCredential.tenant_id == tenant_id,
                    CourierCredential.provider == provider,
                    CourierCredential.is_active == True,
                )
            )
        )
        return res.scalars().first()

    @classmethod
    async def test_connection(
        cls,
        db: AsyncSession,
        tenant_id: str,
        req: CourierTestConnectionRequest,
    ) -> CourierTestConnectionResponse:
        existing = await cls.get_optional_credential(db, tenant_id, req.provider)

        if existing and _is_masked_or_empty(req.api_key) and _is_masked_or_empty(req.client_id):
            cred = existing
            persist_db = db
        else:
            # Construct transient credential (falling back to existing encrypted fields if masked)
            raw_sec = req.secret_key or req.client_secret
            if _is_masked_or_empty(raw_sec) and existing:
                sec_val = existing.secret_key or existing.client_secret_key
            else:
                sec_val = encrypt_secret(raw_sec.strip()) if not _is_masked_or_empty(raw_sec) else None

            if _is_masked_or_empty(req.password) and existing:
                pw_val = existing.password_encrypted
            else:
                pw_val = encrypt_secret(req.password.strip()) if not _is_masked_or_empty(req.password) else None

            cred = CourierCredential(
                tenant_id=tenant_id,
                provider=req.provider,
                api_key=(req.api_key or req.client_id or (existing.api_key if existing else "")).strip(),
                secret_key=sec_val,
                client_secret_key=sec_val,
                store_id=(req.store_id if req.store_id is not None else (existing.store_id if existing else None)),
                user_id=(req.user_id if req.user_id is not None else (existing.user_id if existing else None)),
                client_id=(req.client_id or req.api_key or (existing.client_id if existing else None)),
                username=(req.username if req.username is not None else (existing.username if existing else None)),
                password_encrypted=pw_val,
                is_sandbox=req.is_sandbox if req.is_sandbox is not None else (existing.is_sandbox if existing else False),
            )
            persist_db = None

        connector = cls.get_connector(req.provider)
        result = await connector.test_connection(cred, db=persist_db)
        return CourierTestConnectionResponse(
            success=bool(result.get("success")),
            provider=req.provider,
            mode=str(result.get("mode", "mock")),
            message=str(result.get("message", "")),
            details=result.get("details") or {},
        )

    # ==========================================
    # Dispatch (Single & Bulk)
    # ==========================================
    @classmethod
    async def dispatch_order(
        cls,
        db: AsyncSession,
        tenant_id: str,
        request_in: BookShipmentRequest,
        user_id: Optional[str] = None,
    ) -> CourierShipment:
        """
        Dispatches an order to the selected courier (Steadfast, Pathao, or eCourier).
        Updates Order status to IN_COURIER and logs tracking timeline + audit history.
        """
        order_res = await db.execute(
            select(Order)
            .where(and_(Order.id == request_in.order_id, Order.tenant_id == tenant_id))
            .options(selectinload(Order.items))
        )
        order = order_res.scalar_one_or_none()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{request_in.order_id}' not found.",
            )

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

        cred = await cls.get_active_credential(db, tenant_id, request_in.provider)
        connector = cls.get_connector(request_in.provider)

        cod_amount = (
            request_in.custom_cod_amount
            if request_in.custom_cod_amount is not None
            else order.total_amount
        )
        item_desc = ", ".join(i.product_name for i in (order.items or [])) or f"Order {order.order_number}"
        item_qty = sum(i.quantity for i in (order.items or [])) or 1
        city_val = request_in.recipient_city or order.shipping_city

        try:
            booking_result = await connector.create_parcel(
                credential=cred,
                invoice_number=order.order_number,
                recipient_name=order.customer_name,
                recipient_phone=order.customer_phone,
                recipient_address=order.shipping_address,
                cod_amount=cod_amount,
                notes=request_in.notes or order.internal_notes,
                recipient_city=city_val,
                recipient_zone=request_in.recipient_zone,
                recipient_area=request_in.recipient_area,
                recipient_postcode=request_in.recipient_postcode,
                city_id=request_in.city_id,
                zone_id=request_in.zone_id,
                area_id=request_in.area_id,
                item_weight=request_in.item_weight,
                delivery_type=request_in.delivery_type,
                package_code=request_in.package_code,
                payment_method=request_in.payment_method,
                store_id=request_in.store_id,
                item_description=item_desc[:250],
                item_quantity=item_qty,
                db=db,
            )
        except RuntimeError as e:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

        delivery_fee = booking_result.get("delivery_fee", Decimal("60.00"))
        cod_fee = (cod_amount * Decimal("0.01")).quantize(Decimal("0.01"))

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
            recipient_city=city_val,
            recipient_zone=request_in.recipient_zone,
            recipient_area=request_in.recipient_area,
            recipient_postcode=request_in.recipient_postcode,
            city_id=request_in.city_id,
            zone_id=request_in.zone_id,
            area_id=request_in.area_id,
            item_weight=request_in.item_weight,
            delivery_type=request_in.delivery_type,
            cod_amount=cod_amount,
            delivery_fee=delivery_fee,
            cod_fee=cod_fee,
            estimated_delivery_date=datetime.utcnow() + timedelta(days=2),
            notes=request_in.notes,
        )
        db.add(shipment)
        await db.flush()

        event = CourierTrackingEvent(
            shipment_id=shipment.id,
            event_status="BOOKED",
            raw_status=booking_result.get("raw_status"),
            message=f"Consignment booked with {request_in.provider.value.title()} (CID: {shipment.consignment_id})",
            location=city_val or "Merchant Warehouse",
            source="dispatch",
            timestamp=datetime.utcnow(),
        )
        db.add(event)

        old_status = order.status
        order.status = OrderStatus.IN_COURIER.value

        audit = OrderStatusHistory(
            order_id=order.id,
            tenant_id=order.tenant_id,
            from_status=old_status.value if hasattr(old_status, "value") else str(old_status),
            to_status=OrderStatus.IN_COURIER.value,
            changed_by_user_id=user_id,
            reason=f"Dispatched via {request_in.provider.value.title()} (Consignment #{shipment.consignment_id})",
        )
        db.add(audit)

        await db.commit()
        stmt = (
            select(CourierShipment)
            .where(CourierShipment.id == shipment.id)
            .options(selectinload(CourierShipment.tracking_events))
        )
        return (await db.execute(stmt)).scalar_one()

    @classmethod
    async def bulk_dispatch_orders(
        cls,
        db: AsyncSession,
        tenant_id: str,
        req: BulkDispatchRequest,
        user_id: Optional[str] = None,
    ) -> BulkDispatchResponse:
        """
        Dispatches multiple orders at once.
        Uses Steadfast native /create_order/bulk-order (batches of <= 500) when provider is Steadfast,
        or orchestrates individual parcel creation for Pathao/eCourier.
        """
        results: List[BulkDispatchItemResult] = []
        cred = await cls.get_active_credential(db, tenant_id, req.provider)

        # Fetch all requested orders + active shipment check
        orders_res = await db.execute(
            select(Order).where(
                and_(Order.tenant_id == tenant_id, Order.id.in_(req.order_ids))
            )
        )
        orders_by_id = {o.id: o for o in orders_res.scalars().all()}

        active_res = await db.execute(
            select(CourierShipment.order_id).where(
                and_(
                    CourierShipment.order_id.in_(req.order_ids),
                    CourierShipment.status.notin_([ShipmentStatus.CANCELLED, ShipmentStatus.RETURNED]),
                )
            )
        )
        already_dispatched = {row[0] for row in active_res.all()}

        eligible_orders: List[Order] = []
        for oid in req.order_ids:
            order = orders_by_id.get(oid)
            if not order:
                results.append(BulkDispatchItemResult(order_id=oid, success=False, error="Order not found"))
            elif oid in already_dispatched:
                results.append(
                    BulkDispatchItemResult(
                        order_id=oid,
                        order_number=order.order_number,
                        success=False,
                        error="Already has an active courier shipment",
                    )
                )
            else:
                eligible_orders.append(order)

        if req.provider == CourierProvider.STEADFAST and eligible_orders:
            connector = SteadfastConnector()
            bulk_payload = [
                {
                    "invoice": o.order_number,
                    "recipient_name": o.customer_name,
                    "recipient_phone": o.customer_phone,
                    "recipient_address": o.shipping_address,
                    "recipient_city": o.shipping_city,
                    "cod_amount": o.total_amount,
                    "note": req.notes or o.internal_notes,
                }
                for o in eligible_orders
            ]
            api_results = await connector.create_bulk_parcels(cred, bulk_payload)
            orders_by_inv = {o.order_number: o for o in eligible_orders}

            for item in api_results:
                order = orders_by_inv.get(item["invoice"])
                if not order:
                    continue
                if item.get("status") == "success":
                    cod_amount = order.total_amount
                    delivery_fee = item.get("delivery_fee", Decimal("60.00"))
                    cod_fee = (cod_amount * Decimal("0.01")).quantize(Decimal("0.01"))
                    shipment = CourierShipment(
                        tenant_id=tenant_id,
                        order_id=order.id,
                        provider=CourierProvider.STEADFAST,
                        consignment_id=item["consignment_id"],
                        tracking_code=item.get("tracking_code"),
                        invoice_number=order.order_number,
                        status=item.get("shipment_status", ShipmentStatus.BOOKED),
                        raw_status=item.get("raw_status", "in_review"),
                        recipient_name=order.customer_name,
                        recipient_phone=order.customer_phone,
                        recipient_address=order.shipping_address,
                        recipient_city=order.shipping_city,
                        item_weight=req.item_weight,
                        delivery_type=req.delivery_type,
                        cod_amount=cod_amount,
                        delivery_fee=delivery_fee,
                        cod_fee=cod_fee,
                        estimated_delivery_date=datetime.utcnow() + timedelta(days=2),
                        notes=req.notes,
                    )
                    db.add(shipment)
                    await db.flush()

                    db.add(
                        CourierTrackingEvent(
                            shipment_id=shipment.id,
                            event_status="BOOKED",
                            raw_status="in_review",
                            message=f"Bulk dispatched via Steadfast (CID: {shipment.consignment_id})",
                            location=order.shipping_city or "Merchant Warehouse",
                            source="dispatch",
                            timestamp=datetime.utcnow(),
                        )
                    )
                    old_st = order.status
                    order.status = OrderStatus.IN_COURIER.value
                    db.add(
                        OrderStatusHistory(
                            order_id=order.id,
                            tenant_id=tenant_id,
                            from_status=old_st.value if hasattr(old_st, "value") else str(old_st),
                            to_status=OrderStatus.IN_COURIER.value,
                            changed_by_user_id=user_id,
                            reason=f"Bulk dispatched via Steadfast (Consignment #{shipment.consignment_id})",
                        )
                    )
                    results.append(
                        BulkDispatchItemResult(
                            order_id=order.id,
                            order_number=order.order_number,
                            success=True,
                            consignment_id=shipment.consignment_id,
                            tracking_code=shipment.tracking_code,
                            shipment_id=shipment.id,
                        )
                    )
                else:
                    results.append(
                        BulkDispatchItemResult(
                            order_id=order.id,
                            order_number=order.order_number,
                            success=False,
                            error=item.get("error") or "Dispatch failed",
                        )
                    )
            await db.commit()
        else:
            connector = cls.get_connector(req.provider)
            sem = asyncio.Semaphore(5)

            async def create_single_parcel(order: Order):
                cod_amount = order.total_amount
                city_val = order.shipping_city
                async with sem:
                    try:
                        booking_result = await connector.create_parcel(
                            credential=cred,
                            invoice_number=order.order_number,
                            recipient_name=order.customer_name,
                            recipient_phone=order.customer_phone,
                            recipient_address=order.shipping_address,
                            cod_amount=cod_amount,
                            notes=req.notes or order.internal_notes,
                            recipient_city=city_val,
                            item_weight=req.item_weight,
                            delivery_type=req.delivery_type,
                            item_description=f"Order {order.order_number}",
                            item_quantity=1,
                            db=db,
                        )
                        return (order, booking_result, None)
                    except Exception as e:
                        return (order, None, e)

            api_tasks = await asyncio.gather(*(create_single_parcel(o) for o in eligible_orders))

            for order, booking_result, err in api_tasks:
                if err or not booking_result:
                    results.append(
                        BulkDispatchItemResult(
                            order_id=order.id,
                            order_number=order.order_number,
                            success=False,
                            error=str(getattr(err, "detail", str(err))),
                        )
                    )
                else:
                    cod_amount = order.total_amount
                    delivery_fee = booking_result.get("delivery_fee", Decimal("60.00"))
                    cod_fee = (cod_amount * Decimal("0.01")).quantize(Decimal("0.01"))
                    shipment = CourierShipment(
                        tenant_id=tenant_id,
                        order_id=order.id,
                        provider=req.provider,
                        consignment_id=booking_result["consignment_id"],
                        tracking_code=booking_result.get("tracking_code"),
                        invoice_number=order.order_number,
                        status=booking_result.get("status", ShipmentStatus.BOOKED),
                        raw_status=booking_result.get("raw_status"),
                        recipient_name=order.customer_name,
                        recipient_phone=order.customer_phone,
                        recipient_address=order.shipping_address,
                        recipient_city=order.shipping_city,
                        item_weight=req.item_weight,
                        delivery_type=req.delivery_type,
                        cod_amount=cod_amount,
                        delivery_fee=delivery_fee,
                        cod_fee=cod_fee,
                        estimated_delivery_date=datetime.utcnow() + timedelta(days=2),
                        notes=req.notes,
                    )
                    db.add(shipment)
                    await db.flush()

                    db.add(
                        CourierTrackingEvent(
                            shipment_id=shipment.id,
                            event_status="BOOKED",
                            raw_status=str(booking_result.get("raw_status") or "booked"),
                            message=f"Bulk dispatched via {req.provider.value.title()} (CID: {shipment.consignment_id})",
                            location=order.shipping_city or "Merchant Warehouse",
                            source="dispatch",
                            timestamp=datetime.utcnow(),
                        )
                    )
                    old_st = order.status
                    order.status = OrderStatus.IN_COURIER.value
                    db.add(
                        OrderStatusHistory(
                            order_id=order.id,
                            tenant_id=tenant_id,
                            from_status=old_st.value if hasattr(old_st, "value") else str(old_st),
                            to_status=OrderStatus.IN_COURIER.value,
                            changed_by_user_id=user_id,
                            reason=f"Bulk dispatched via {req.provider.value.title()} (Consignment #{shipment.consignment_id})",
                        )
                    )
                    results.append(
                        BulkDispatchItemResult(
                            order_id=order.id,
                            order_number=order.order_number,
                            success=True,
                            consignment_id=shipment.consignment_id,
                            tracking_code=shipment.tracking_code,
                            shipment_id=shipment.id,
                        )
                    )
            await db.commit()

        succeeded = sum(1 for r in results if r.success)
        return BulkDispatchResponse(
            provider=req.provider,
            total_requested=len(req.order_ids),
            succeeded_count=succeeded,
            failed_count=len(results) - succeeded,
            results=results,
        )

    # ==========================================
    # Shipments Query, Sync, Cancel & Webhooks
    # ==========================================
    @classmethod
    async def list_shipments(
        cls,
        db: AsyncSession,
        tenant_id: str,
        provider: Optional[str] = None,
        status: Optional[str] = None,
        is_settled: Optional[bool] = None,
        days: Optional[int] = None,
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
        if is_settled is not None:
            stmt = stmt.where(CourierShipment.is_settled == is_settled)
        if days and days > 0:
            cutoff = datetime.utcnow() - timedelta(days=days)
            stmt = stmt.where(CourierShipment.created_at >= cutoff)
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
    async def get_shipment_by_order(
        cls, db: AsyncSession, tenant_id: str, order_id: str
    ) -> Optional[CourierShipment]:
        stmt = (
            select(CourierShipment)
            .where(
                and_(
                    CourierShipment.order_id == order_id,
                    CourierShipment.tenant_id == tenant_id,
                )
            )
            .options(selectinload(CourierShipment.tracking_events))
            .order_by(CourierShipment.created_at.desc())
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    @classmethod
    async def _apply_status_transition(
        cls,
        db: AsyncSession,
        shipment: CourierShipment,
        new_canonical: ShipmentStatus,
        raw_status: str,
        message: str,
        location: Optional[str] = None,
        source: str = "webhook",
        collected_amount: Optional[Decimal] = None,
        delivery_fee: Optional[Decimal] = None,
    ) -> bool:
        """Applies shipment status change, updates linked Order + CRM, and logs event if changed."""
        old_status = shipment.status
        old_raw = shipment.raw_status
        shipment.status = new_canonical
        shipment.raw_status = raw_status

        if delivery_fee is not None and delivery_fee > Decimal("0.00"):
            shipment.delivery_fee = delivery_fee

        order: Optional[Order] = None
        if new_canonical in (ShipmentStatus.DELIVERED, ShipmentStatus.PARTIALLY_DELIVERED):
            shipment.collected_amount = (
                collected_amount
                if collected_amount is not None and collected_amount > Decimal("0.00")
                else shipment.cod_amount
            )
            if not shipment.delivery_date:
                shipment.delivery_date = datetime.utcnow()

            order_res = await db.execute(select(Order).where(Order.id == shipment.order_id))
            order = order_res.scalar_one_or_none()
            if order and order.status != OrderStatus.DELIVERED.value:
                prev = order.status
                order.status = OrderStatus.DELIVERED.value
                order.payment_status = PaymentStatus.PAID.value
                db.add(
                    OrderStatusHistory(
                        order_id=order.id,
                        tenant_id=order.tenant_id,
                        from_status=prev,
                        to_status=OrderStatus.DELIVERED.value,
                        reason=f"Delivered by {shipment.provider.value.title()} (CID: {shipment.consignment_id})",
                    )
                )

        elif new_canonical == ShipmentStatus.RETURNED:
            order_res = await db.execute(select(Order).where(Order.id == shipment.order_id))
            order = order_res.scalar_one_or_none()
            if order and order.status != OrderStatus.RETURNED.value:
                prev = order.status
                order.status = OrderStatus.RETURNED.value
                db.add(
                    OrderStatusHistory(
                        order_id=order.id,
                        tenant_id=order.tenant_id,
                        from_status=prev,
                        to_status=OrderStatus.RETURNED.value,
                        reason=f"Returned by customer via {shipment.provider.value.title()}",
                    )
                )

        elif new_canonical == ShipmentStatus.CANCELLED:
            order_res = await db.execute(select(Order).where(Order.id == shipment.order_id))
            order = order_res.scalar_one_or_none()
            if order and order.status == OrderStatus.IN_COURIER.value:
                order.status = OrderStatus.CANCELLED.value
                db.add(
                    OrderStatusHistory(
                        order_id=order.id,
                        tenant_id=order.tenant_id,
                        from_status=OrderStatus.IN_COURIER.value,
                        to_status=OrderStatus.CANCELLED.value,
                        reason=f"Shipment cancelled via {shipment.provider.value.title()}",
                    )
                )

        changed = (old_status != new_canonical) or (old_raw != raw_status)
        if changed or source == "webhook":
            db.add(
                CourierTrackingEvent(
                    shipment_id=shipment.id,
                    event_status=new_canonical.value.upper(),
                    raw_status=raw_status,
                    message=message,
                    location=location,
                    source=source,
                    timestamp=datetime.utcnow(),
                )
            )

        await db.commit()

        # Sync CRM profile metrics when order transitions to terminal state
        if order and new_canonical in (
            ShipmentStatus.DELIVERED,
            ShipmentStatus.PARTIALLY_DELIVERED,
            ShipmentStatus.RETURNED,
        ):
            try:
                await CRMService.sync_customer_from_order(db, order.tenant_id, order)
            except Exception as e:
                logger.warning(f"CRM post-delivery sync warning: {e}")

        return changed

    @classmethod
    async def sync_shipment_status(
        cls, db: AsyncSession, tenant_id: str, shipment_id: str
    ) -> CourierShipment:
        """Polls live status from the courier API and updates local shipment & order state."""
        shipment = await cls.get_shipment_detail(db, tenant_id, shipment_id)
        cred = await cls.get_active_credential(db, tenant_id, shipment.provider)
        connector = cls.get_connector(shipment.provider)

        tracking = await connector.get_tracking_status(
            credential=cred,
            consignment_id=shipment.consignment_id,
            invoice_number=shipment.invoice_number,
            tracking_code=shipment.tracking_code,
        )
        shipment.last_polled_at = datetime.utcnow()

        await cls._apply_status_transition(
            db=db,
            shipment=shipment,
            new_canonical=tracking["status"],
            raw_status=str(tracking.get("raw_status") or tracking["status"].value),
            message=tracking.get("message") or f"Synced status from {shipment.provider.value.title()}",
            location=tracking.get("location"),
            source="polling",
            collected_amount=tracking.get("collected_amount"),
            delivery_fee=tracking.get("delivery_fee"),
        )
        return await cls.get_shipment_detail(db, tenant_id, shipment_id)

    @classmethod
    async def cancel_shipment(
        cls, db: AsyncSession, tenant_id: str, shipment_id: str, reason: Optional[str] = None
    ) -> CourierShipment:
        shipment = await cls.get_shipment_detail(db, tenant_id, shipment_id)
        if shipment.status in (ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED, ShipmentStatus.CANCELLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel shipment in '{shipment.status.value}' state.",
            )
        cred = await cls.get_active_credential(db, tenant_id, shipment.provider)
        connector = cls.get_connector(shipment.provider)
        res = await connector.cancel_parcel(cred, shipment.consignment_id, reason=reason)
        if not res.get("success") and shipment.provider == CourierProvider.ECOURIER:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))

        await cls._apply_status_transition(
            db=db,
            shipment=shipment,
            new_canonical=ShipmentStatus.CANCELLED,
            raw_status="cancelled",
            message=res.get("message") or reason or "Cancelled by merchant",
            source="manual",
        )
        return await cls.get_shipment_detail(db, tenant_id, shipment_id)

    @classmethod
    async def process_courier_webhook(
        cls,
        db: AsyncSession,
        provider: CourierProvider,
        payload: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
        raw_body: Optional[bytes] = None,
    ) -> Dict[str, Any]:
        """
        Universal webhook processor for Steadfast, Pathao, and eCourier.
        Verifies webhook signature if configured and auto-syncs Order & CRM status.
        """
        consignment_id = str(
            payload.get("consignment_id")
            or payload.get("cid")
            or payload.get("consignment")
            or payload.get("tracking_no")
            or payload.get("tracking")
            or ""
        ).strip()
        invoice = str(
            payload.get("invoice")
            or payload.get("invoice_number")
            or payload.get("merchant_order_id")
            or payload.get("ep_id")
            or ""
        ).strip()
        raw_status = str(
            payload.get("order_status_slug")
            or payload.get("status")
            or payload.get("delivery_status")
            or payload.get("order_status")
            or payload.get("event")
            or ""
        ).strip()

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

        # Verify webhook signature / secret if tenant configured webhook_secret
        cred = await cls.get_optional_credential(db, shipment.tenant_id, provider)
        if cred and cred.webhook_secret and headers is not None:
            secret = decrypt_secret(cred.webhook_secret)
            lower_headers = {k.lower(): v for k, v in headers.items()}
            if provider == CourierProvider.PATHAO:
                sig = lower_headers.get("x-pathao-signature")
                if not PathaoConnector.verify_webhook_signature(secret, sig, raw_body or b""):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Pathao webhook signature.",
                    )
            else:
                auth_hdr = lower_headers.get("authorization", "").replace("Bearer ", "").strip()
                custom_hdr = lower_headers.get("x-webhook-secret", "").strip()
                provided = auth_hdr or custom_hdr
                if secret and provided and not hmac.compare_digest(provided, secret):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid courier webhook secret.",
                    )

        new_canonical = cls.map_status(provider, raw_status)
        old_status = shipment.status

        collected_amt = None
        if payload.get("collected_amount") is not None:
            collected_amt = Decimal(str(payload["collected_amount"]))
        elif payload.get("cod_collected") is not None:
            collected_amt = Decimal(str(payload["cod_collected"]))

        delivery_fee = None
        if payload.get("delivery_fee") is not None:
            delivery_fee = Decimal(str(payload["delivery_fee"]))

        msg = payload.get("message") or f"Status changed to {raw_status} via {provider.value.title()} webhook"
        await cls._apply_status_transition(
            db=db,
            shipment=shipment,
            new_canonical=new_canonical,
            raw_status=raw_status,
            message=msg,
            location=payload.get("location") or payload.get("hub_name"),
            source="webhook",
            collected_amount=collected_amt,
            delivery_fee=delivery_fee,
        )

        return {
            "status": "success",
            "consignment_id": shipment.consignment_id,
            "old_status": old_status.value,
            "new_status": new_canonical.value,
        }

    # ==========================================
    # Fraud Check & Merchant Balance
    # ==========================================
    @classmethod
    async def fraud_check(
        cls, db: AsyncSession, tenant_id: str, phone: str
    ) -> FraudCheckResponse:
        clean_phone = CRMService.normalize_phone(phone)
        cred = await cls.get_optional_credential(db, tenant_id, CourierProvider.STEADFAST)
        connector = SteadfastConnector()
        ext = await connector.fraud_check(cred, clean_phone)

        # Also query workspace internal orders for this phone
        orders_res = await db.execute(
            select(Order.status).where(
                and_(
                    Order.tenant_id == tenant_id,
                    Order.customer_phone.ilike(f"%{clean_phone[-10:]}%"),
                )
            )
        )
        statuses = [r[0] for r in orders_res.all()]
        internal_total = len(statuses)
        internal_delivered = sum(1 for s in statuses if s == OrderStatus.DELIVERED.value)
        internal_returned = sum(1 for s in statuses if s in (OrderStatus.RETURNED.value, OrderStatus.CANCELLED.value))

        total_p = ext["total_parcels"]
        deliv_p = ext["total_delivered"]
        canc_p = ext["total_cancelled"]
        reports = ext["fraud_reports"]
        rate = ext["success_rate"]

        if total_p == 0 and internal_total == 0:
            risk = "no_history"
            summary = "New customer — no prior Steadfast or store delivery history."
        elif reports > 0 or (total_p >= 3 and rate < 55.0) or (internal_returned >= 2 and internal_delivered == 0):
            risk = "high"
            summary = f"High return/cancellation risk! {rate}% Steadfast success ({deliv_p}/{total_p}), {reports} fraud report(s)."
        elif (total_p >= 2 and rate < 80.0) or internal_returned > 0:
            risk = "medium"
            summary = f"Moderate risk — {rate}% Steadfast delivery rate across {total_p} parcel(s)."
        else:
            risk = "low"
            summary = f"Reliable buyer — {rate}% delivery success ({deliv_p}/{total_p} parcels)."

        return FraudCheckResponse(
            phone=clean_phone,
            total_parcels=total_p,
            total_delivered=deliv_p,
            total_cancelled=canc_p,
            fraud_reports=reports,
            success_rate=rate,
            risk_level=risk,
            internal_total_orders=internal_total,
            internal_delivered_orders=internal_delivered,
            internal_returned_orders=internal_returned,
            source=ext["source"],
            summary=summary,
        )

    @classmethod
    async def get_steadfast_balance(cls, db: AsyncSession, tenant_id: str) -> Dict[str, Any]:
        cred = await cls.get_active_credential(db, tenant_id, CourierProvider.STEADFAST)
        return await SteadfastConnector().get_balance(cred)

    # ==========================================
    # KPIs & Analytics
    # ==========================================
    @classmethod
    async def get_courier_kpis(
        cls, db: AsyncSession, tenant_id: str
    ) -> CourierKPIStats:
        """Calculates executive courier delivery performance metrics."""
        stmt = select(CourierShipment).where(CourierShipment.tenant_id == tenant_id)
        res = await db.execute(stmt)
        shipments = res.scalars().all()

        total = len(shipments)
        booked = sum(1 for s in shipments if s.status in (ShipmentStatus.BOOKED, ShipmentStatus.PENDING))
        transit = sum(1 for s in shipments if s.status == ShipmentStatus.IN_TRANSIT)
        delivered = sum(1 for s in shipments if s.status in (ShipmentStatus.DELIVERED, ShipmentStatus.PARTIALLY_DELIVERED))
        returned = sum(1 for s in shipments if s.status == ShipmentStatus.RETURNED)
        cancelled = sum(1 for s in shipments if s.status == ShipmentStatus.CANCELLED)

        delivery_rate = round((delivered / total * 100), 2) if total > 0 else 0.0
        return_rate = round((returned / total * 100), 2) if total > 0 else 0.0

        total_cod = sum((s.cod_amount for s in shipments), Decimal("0.00"))
        total_collected = sum((s.collected_amount for s in shipments), Decimal("0.00"))
        total_del_fees = sum((s.delivery_fee for s in shipments), Decimal("0.00"))
        total_cod_fees = sum((s.cod_fee for s in shipments), Decimal("0.00"))
        total_charges = total_del_fees + total_cod_fees
        unsettled = sum(
            (s.collected_amount for s in shipments if not s.is_settled and s.collected_amount > Decimal("0.00")),
            Decimal("0.00"),
        )

        hours_list = [
            (s.delivery_date - s.created_at).total_seconds() / 3600.0
            for s in shipments
            if s.delivery_date and s.created_at and s.delivery_date >= s.created_at
        ]
        avg_hours = round(sum(hours_list) / len(hours_list), 1) if hours_list else None

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
            avg_delivery_hours=avg_hours,
        )

    @classmethod
    async def get_delivery_performance(
        cls, db: AsyncSession, tenant_id: str, days: int = 30, provider: Optional[str] = None
    ) -> DeliveryPerformanceAnalyticsResponse:
        cutoff = datetime.utcnow() - timedelta(days=days)
        stmt = select(CourierShipment).where(
            and_(
                CourierShipment.tenant_id == tenant_id,
                CourierShipment.created_at >= cutoff,
            )
        )
        if provider and provider != "all":
            stmt = stmt.where(CourierShipment.provider == provider)

        shipments = (await db.execute(stmt)).scalars().all()

        # Group by provider
        by_provider: Dict[CourierProvider, List[CourierShipment]] = {}
        for s in shipments:
            by_provider.setdefault(s.provider, []).append(s)

        provider_items: List[ProviderPerformanceItem] = []
        for prov, plist in by_provider.items():
            tot = len(plist)
            bkd = sum(1 for x in plist if x.status in (ShipmentStatus.BOOKED, ShipmentStatus.PENDING))
            trns = sum(1 for x in plist if x.status == ShipmentStatus.IN_TRANSIT)
            delv = sum(1 for x in plist if x.status in (ShipmentStatus.DELIVERED, ShipmentStatus.PARTIALLY_DELIVERED))
            ret = sum(1 for x in plist if x.status == ShipmentStatus.RETURNED)
            canc = sum(1 for x in plist if x.status == ShipmentStatus.CANCELLED)
            completed = delv + ret
            d_rate = round((delv / completed * 100), 1) if completed > 0 else (100.0 if delv > 0 else 0.0)
            r_rate = round((ret / completed * 100), 1) if completed > 0 else 0.0
            tot_fee = sum((x.delivery_fee for x in plist), Decimal("0.00"))
            hrs = [
                (x.delivery_date - x.created_at).total_seconds() / 3600.0
                for x in plist
                if x.delivery_date and x.created_at and x.delivery_date >= x.created_at
            ]
            provider_items.append(
                ProviderPerformanceItem(
                    provider=prov,
                    total_shipments=tot,
                    booked_count=bkd,
                    in_transit_count=trns,
                    delivered_count=delv,
                    returned_count=ret,
                    cancelled_count=canc,
                    delivery_rate=d_rate,
                    return_rate=r_rate,
                    total_cod=sum((x.cod_amount for x in plist), Decimal("0.00")),
                    total_collected=sum((x.collected_amount for x in plist), Decimal("0.00")),
                    total_fees=tot_fee,
                    avg_delivery_fee=(tot_fee / Decimal(str(tot))).quantize(Decimal("0.01")) if tot > 0 else Decimal("0.00"),
                    avg_delivery_hours=round(sum(hrs) / len(hrs), 1) if hrs else None,
                )
            )

        # Daily trend
        daily_map: Dict[str, Dict[str, Any]] = {}
        for s in shipments:
            day_str = s.created_at.strftime("%Y-%m-%d")
            bucket = daily_map.setdefault(
                day_str, {"booked": 0, "delivered": 0, "returned": 0, "cod_collected": Decimal("0.00")}
            )
            bucket["booked"] += 1
            if s.status in (ShipmentStatus.DELIVERED, ShipmentStatus.PARTIALLY_DELIVERED):
                bucket["delivered"] += 1
                bucket["cod_collected"] += s.collected_amount
            elif s.status == ShipmentStatus.RETURNED:
                bucket["returned"] += 1

        trend = [
            DailyCourierTrendPoint(date=d, **vals)
            for d, vals in sorted(daily_map.items())
        ]

        total_del = sum(p.delivered_count for p in provider_items)
        total_ret = sum(p.returned_count for p in provider_items)
        comp = total_del + total_ret
        all_hrs = [
            (s.delivery_date - s.created_at).total_seconds() / 3600.0
            for s in shipments
            if s.delivery_date and s.created_at and s.delivery_date >= s.created_at
        ]

        return DeliveryPerformanceAnalyticsResponse(
            days=days,
            overall_delivery_rate=round((total_del / comp * 100), 1) if comp > 0 else 0.0,
            overall_return_rate=round((total_ret / comp * 100), 1) if comp > 0 else 0.0,
            avg_delivery_hours=round(sum(all_hrs) / len(all_hrs), 1) if all_hrs else None,
            providers=provider_items,
            daily_trend=trend,
        )

    @classmethod
    async def get_cost_analysis(
        cls, db: AsyncSession, tenant_id: str, days: int = 30
    ) -> CostAnalysisResponse:
        cutoff = datetime.utcnow() - timedelta(days=days)
        shipments = (
            await db.execute(
                select(CourierShipment).where(
                    and_(
                        CourierShipment.tenant_id == tenant_id,
                        CourierShipment.created_at >= cutoff,
                    )
                )
            )
        ).scalars().all()

        by_provider: Dict[CourierProvider, List[CourierShipment]] = {}
        for s in shipments:
            by_provider.setdefault(s.provider, []).append(s)

        breakdown: List[ProviderCostBreakdown] = []
        tot_del = Decimal("0.00")
        tot_cod = Decimal("0.00")
        tot_ret = Decimal("0.00")

        for prov, plist in by_provider.items():
            d_fee = sum((x.delivery_fee for x in plist), Decimal("0.00"))
            c_fee = sum((x.cod_fee for x in plist), Decimal("0.00"))
            r_fee = sum((x.return_fee for x in plist), Decimal("0.00"))
            total_c = d_fee + c_fee + r_fee
            collected = sum((x.collected_amount for x in plist), Decimal("0.00"))
            cnt = len(plist)
            tot_del += d_fee
            tot_cod += c_fee
            tot_ret += r_fee
            breakdown.append(
                ProviderCostBreakdown(
                    provider=prov,
                    shipment_count=cnt,
                    delivery_fees=d_fee,
                    cod_fees=c_fee,
                    return_fees=r_fee,
                    total_cost=total_c,
                    avg_cost_per_shipment=(total_c / Decimal(str(cnt))).quantize(Decimal("0.01")) if cnt > 0 else Decimal("0.00"),
                    cost_to_collected_ratio=round(float(total_c / collected * 100), 2) if collected > Decimal("0.00") else 0.0,
                )
            )

        return CostAnalysisResponse(
            days=days,
            total_delivery_fees=tot_del,
            total_cod_fees=tot_cod,
            total_return_fees=tot_ret,
            total_courier_cost=tot_del + tot_cod + tot_ret,
            by_provider=breakdown,
        )

    @classmethod
    async def get_city_performance(
        cls, db: AsyncSession, tenant_id: str, days: int = 30
    ) -> List[CityPerformanceItem]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        shipments = (
            await db.execute(
                select(CourierShipment).where(
                    and_(
                        CourierShipment.tenant_id == tenant_id,
                        CourierShipment.created_at >= cutoff,
                    )
                )
            )
        ).scalars().all()

        by_city: Dict[str, List[CourierShipment]] = {}
        for s in shipments:
            city = (s.recipient_city or "Unspecified").strip() or "Unspecified"
            by_city.setdefault(city, []).append(s)

        out: List[CityPerformanceItem] = []
        for city, plist in sorted(by_city.items(), key=lambda kv: len(kv[1]), reverse=True):
            tot = len(plist)
            delv = sum(1 for x in plist if x.status in (ShipmentStatus.DELIVERED, ShipmentStatus.PARTIALLY_DELIVERED))
            ret = sum(1 for x in plist if x.status == ShipmentStatus.RETURNED)
            comp = delv + ret
            tot_fee = sum((x.delivery_fee for x in plist), Decimal("0.00"))
            out.append(
                CityPerformanceItem(
                    city=city,
                    total_shipments=tot,
                    delivered_count=delv,
                    returned_count=ret,
                    delivery_rate=round((delv / comp * 100), 1) if comp > 0 else 0.0,
                    return_rate=round((ret / comp * 100), 1) if comp > 0 else 0.0,
                    avg_delivery_fee=(tot_fee / Decimal(str(tot))).quantize(Decimal("0.01")) if tot > 0 else Decimal("0.00"),
                )
            )
        return out

    @classmethod
    async def get_stale_shipments(
        cls, db: AsyncSession, tenant_id: str, hours: int = 48
    ) -> List[CourierShipment]:
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        stmt = (
            select(CourierShipment)
            .where(
                and_(
                    CourierShipment.tenant_id == tenant_id,
                    CourierShipment.status.in_([ShipmentStatus.BOOKED, ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT]),
                    CourierShipment.updated_at <= cutoff,
                )
            )
            .options(selectinload(CourierShipment.tracking_events))
            .order_by(CourierShipment.updated_at.asc())
        )
        return (await db.execute(stmt)).scalars().all()

    # ==========================================
    # COD Settlement Management
    # ==========================================
    @classmethod
    async def list_settlements(
        cls, db: AsyncSession, tenant_id: str, provider: Optional[str] = None
    ) -> List[CourierSettlement]:
        stmt = (
            select(CourierSettlement)
            .where(CourierSettlement.tenant_id == tenant_id)
            .order_by(CourierSettlement.payout_date.desc())
        )
        if provider and provider != "all":
            stmt = stmt.where(CourierSettlement.provider == provider)
        return (await db.execute(stmt)).scalars().all()

    @classmethod
    async def get_unsettled_shipments(
        cls, db: AsyncSession, tenant_id: str, provider: Optional[str] = None
    ) -> List[CourierShipment]:
        stmt = (
            select(CourierShipment)
            .where(
                and_(
                    CourierShipment.tenant_id == tenant_id,
                    CourierShipment.is_settled == False,
                    CourierShipment.status.in_([ShipmentStatus.DELIVERED, ShipmentStatus.PARTIALLY_DELIVERED]),
                )
            )
            .options(selectinload(CourierShipment.tracking_events))
            .order_by(CourierShipment.delivery_date.desc())
        )
        if provider and provider != "all":
            stmt = stmt.where(CourierShipment.provider == provider)
        return (await db.execute(stmt)).scalars().all()

    @classmethod
    async def create_settlement(
        cls, db: AsyncSession, tenant_id: str, req: CourierSettlementCreate
    ) -> CourierSettlement:
        res = await db.execute(
            select(CourierShipment).where(
                and_(
                    CourierShipment.tenant_id == tenant_id,
                    CourierShipment.id.in_(req.shipment_ids),
                    CourierShipment.is_settled == False,
                )
            )
        )
        shipments = res.scalars().all()
        if not shipments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No eligible unsettled shipments found for the provided IDs.",
            )

        total_collected = sum((s.collected_amount for s in shipments), Decimal("0.00"))
        total_del_fees = sum((s.delivery_fee for s in shipments), Decimal("0.00"))
        total_cod_fees = sum((s.cod_fee for s in shipments), Decimal("0.00"))
        net_payout = total_collected - total_del_fees - total_cod_fees

        payout_dt = req.payout_date or datetime.utcnow()
        settlement = CourierSettlement(
            tenant_id=tenant_id,
            provider=req.provider,
            settlement_number=req.settlement_number.strip(),
            total_collected_amount=total_collected,
            total_delivery_fees=total_del_fees,
            total_cod_fees=total_cod_fees,
            net_payout_amount=net_payout,
            shipment_count=len(shipments),
            payout_date=payout_dt,
            status=req.status.upper(),
            reference_number=req.reference_number,
            bank_account=req.bank_account,
            notes=req.notes,
        )
        db.add(settlement)
        await db.flush()

        for s in shipments:
            s.is_settled = True
            s.settled_at = payout_dt
            s.settlement_id = settlement.id

        await db.commit()
        await db.refresh(settlement)
        return settlement

    @classmethod
    async def get_settlement_detail(
        cls, db: AsyncSession, tenant_id: str, settlement_id: str
    ) -> CourierSettlement:
        res = await db.execute(
            select(CourierSettlement)
            .where(
                and_(
                    CourierSettlement.id == settlement_id,
                    CourierSettlement.tenant_id == tenant_id,
                )
            )
            .options(
                selectinload(CourierSettlement.shipments).selectinload(CourierShipment.tracking_events)
            )
        )
        s = res.scalar_one_or_none()
        if not s:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settlement record not found.")
        return s

    @classmethod
    async def update_settlement(
        cls, db: AsyncSession, tenant_id: str, settlement_id: str, req: CourierSettlementUpdate
    ) -> CourierSettlement:
        res = await db.execute(
            select(CourierSettlement).where(
                and_(
                    CourierSettlement.id == settlement_id,
                    CourierSettlement.tenant_id == tenant_id,
                )
            )
        )
        s = res.scalar_one_or_none()
        if not s:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settlement record not found.")
        if req.status is not None:
            s.status = req.status.upper()
        if req.reference_number is not None:
            s.reference_number = req.reference_number
        if req.bank_account is not None:
            s.bank_account = req.bank_account
        if req.notes is not None:
            s.notes = req.notes
        await db.commit()
        await db.refresh(s)
        return s
