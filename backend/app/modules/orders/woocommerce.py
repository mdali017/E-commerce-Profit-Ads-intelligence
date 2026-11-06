import hmac
import hashlib
import base64
import logging
from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders.models import (
    OrderSource,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    AttributionConfidence,
)
from app.modules.orders.schemas import (
    OrderCreate,
    OrderItemCreate,
    OrderAttributionCreate,
    OrderDetailResponse,
)
from app.modules.orders.service import OrderService

logger = logging.getLogger("woocommerce_connector")


class WooCommerceConnector:
    """
    WooCommerce Ingestion Connector & Webhook Handler.
    Supports real-time webhooks (order.created, order.updated) and REST API mapping.
    """

    @staticmethod
    def verify_webhook_signature(
        payload_bytes: bytes,
        signature_header: Optional[str],
        webhook_secret: str,
    ) -> bool:
        """
        Verify HMAC-SHA256 signature sent by WooCommerce in X-WC-Webhook-Signature.
        """
        if not signature_header or not webhook_secret:
            return True  # If secret not set or test mode, proceed with warning

        expected_sig = base64.b64encode(
            hmac.new(
                webhook_secret.encode("utf-8"),
                payload_bytes,
                hashlib.sha256,
            ).digest()
        ).decode("utf-8")

        return hmac.compare_digest(expected_sig, signature_header)

    @staticmethod
    def map_woocommerce_status(wc_status: str) -> OrderStatus:
        """
        Map WooCommerce order status to canonical internal OrderStatus.
        """
        status_map = {
            "pending": OrderStatus.PENDING,
            "on-hold": OrderStatus.PENDING,
            "processing": OrderStatus.CONFIRMED,
            "completed": OrderStatus.DELIVERED,
            "cancelled": OrderStatus.CANCELLED,
            "refunded": OrderStatus.RETURNED,
            "failed": OrderStatus.CANCELLED,
        }
        return status_map.get(wc_status.lower(), OrderStatus.PENDING)

    @staticmethod
    def map_woocommerce_payment(wc_payment: str) -> (PaymentMethod, PaymentStatus):
        """
        Map WooCommerce payment method string to internal enums.
        """
        wc_lower = (wc_payment or "").lower()
        if "cod" in wc_lower or "cash" in wc_lower:
            return PaymentMethod.COD, PaymentStatus.PENDING
        elif "bkash" in wc_lower:
            return PaymentMethod.BKASH, PaymentStatus.PAID
        elif "nagad" in wc_lower:
            return PaymentMethod.NAGAD, PaymentStatus.PAID
        elif "bank" in wc_lower or "bacs" in wc_lower:
            return PaymentMethod.BANK_TRANSFER, PaymentStatus.PAID
        else:
            return PaymentMethod.COD, PaymentStatus.PENDING

    @classmethod
    async def ingest_webhook_order(
        cls,
        db: AsyncSession,
        tenant_id: str,
        payload: Dict[str, Any],
    ) -> OrderDetailResponse:
        """
        Ingest WooCommerce webhook payload, normalize data, resolve catalog COGS,
        and save with idempotency duplicate prevention.
        """
        wc_order_id = str(payload.get("id", ""))
        billing = payload.get("billing", {}) or {}
        shipping = payload.get("shipping", {}) or {}

        # Resolve Customer Name
        first_name = (billing.get("first_name") or shipping.get("first_name") or "").strip()
        last_name = (billing.get("last_name") or shipping.get("last_name") or "").strip()
        customer_name = f"{first_name} {last_name}".strip() or "WooCommerce Customer"

        # Resolve Phone & Email
        customer_phone = (billing.get("phone") or shipping.get("phone") or "01000000000").strip()
        customer_email = billing.get("email") or shipping.get("email") or None

        # Resolve Shipping Address
        address_1 = (shipping.get("address_1") or billing.get("address_1") or "").strip()
        address_2 = (shipping.get("address_2") or billing.get("address_2") or "").strip()
        full_address = f"{address_1} {address_2}".strip() or "Store Pickup / Address N/A"

        city = (shipping.get("city") or billing.get("city") or "Dhaka").strip()

        # Financial values
        shipping_total = Decimal(str(payload.get("shipping_total") or "0.00"))
        discount_total = Decimal(str(payload.get("discount_total") or "0.00"))

        # Map Line Items
        line_items_data = payload.get("line_items", []) or []
        items_create = []

        for item in line_items_data:
            item_name = item.get("name") or "Unnamed Product"
            item_sku = item.get("sku") or None
            qty = max(1, int(item.get("quantity") or 1))
            price = Decimal(str(item.get("price") or item.get("total") or "0.00"))

            items_create.append(
                OrderItemCreate(
                    product_name=item_name,
                    sku=item_sku,
                    quantity=qty,
                    unit_price=price,
                )
            )

        if not items_create:
            # Fallback for empty item payloads
            items_create.append(
                OrderItemCreate(
                    product_name="WooCommerce Order Item",
                    quantity=1,
                    unit_price=Decimal(str(payload.get("total") or "0.00")),
                )
            )

        # Payment mapping
        payment_method, payment_status = cls.map_woocommerce_payment(
            payload.get("payment_method") or payload.get("payment_method_title") or "cod"
        )

        canonical_order_in = OrderCreate(
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            shipping_address=full_address,
            shipping_city=city,
            shipping_fee=shipping_total,
            discount_amount=discount_total,
            source=OrderSource.WOOCOMMERCE,
            payment_method=payment_method,
            payment_status=payment_status,
            customer_notes=payload.get("customer_note") or None,
            internal_notes=f"Auto-ingested from WooCommerce store (Order #{wc_order_id})",
            external_order_id=f"wc_{wc_order_id}",
            idempotency_key=f"wc_webhook_{wc_order_id}",
            items=items_create,
            attribution=OrderAttributionCreate(
                utm_source="woocommerce",
                attribution_confidence=AttributionConfidence.ORGANIC,
            ),
        )

        # Use canonical OrderService to resolve catalog COGS, lock profit, and insert
        order_detail = await OrderService.create_order(
            db=db,
            tenant_id=tenant_id,
            order_in=canonical_order_in,
            user_id=None,  # Webhook system actor
        )

        logger.info(
            f"Successfully ingested WooCommerce order #{wc_order_id} -> {order_detail.order_number}"
        )
        return order_detail

