import uuid
import logging
from decimal import Decimal
from typing import Dict, Any, Optional, List
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
from app.modules.orders.woocommerce import WooCommerceConnector

logger = logging.getLogger("store_connectors")


class UniversalCustomStoreConnector:
    """
    Universal Ingestion Connector for Custom Websites (PHP, Next.js, React, HTML, Wix, Node.js).
    Supports flexible schemas, camelCase/snake_case mapping, and automatic profit resolution.
    """

    @staticmethod
    def map_payment_method(method_raw: Optional[str]) -> (PaymentMethod, PaymentStatus):
        m = (method_raw or "").lower().strip()
        if "bkash" in m:
            return PaymentMethod.BKASH, PaymentStatus.PAID
        elif "nagad" in m:
            return PaymentMethod.NAGAD, PaymentStatus.PAID
        elif "card" in m or "visa" in m or "master" in m or "ssl" in m or "stripe" in m:
            return PaymentMethod.CARD, PaymentStatus.PAID
        elif "bank" in m:
            return PaymentMethod.BANK_TRANSFER, PaymentStatus.PAID
        else:
            return PaymentMethod.COD, PaymentStatus.PENDING

    @classmethod
    async def ingest_custom_order(
        cls,
        db: AsyncSession,
        tenant_id: str,
        payload: Dict[str, Any],
        source_override: Optional[OrderSource] = None,
    ) -> OrderDetailResponse:
        """
        Ingest orders from custom sites, APIs, Wix, or landing pages.
        """
        # Resolve Order ID / External ID
        order_id = str(
            payload.get("order_id")
            or payload.get("order_number")
            or payload.get("id")
            or f"EXT-{uuid.uuid4().hex[:8].upper()}"
        )

        # Resolve Customer Information (supports flat or nested 'customer' / 'billing' objects)
        customer_obj = payload.get("customer") or payload.get("billing") or {}
        customer_name = (
            payload.get("customer_name")
            or payload.get("name")
            or customer_obj.get("name")
            or f"{customer_obj.get('first_name', '')} {customer_obj.get('last_name', '')}".strip()
            or "Direct Web Customer"
        )

        customer_phone = str(
            payload.get("customer_phone")
            or payload.get("phone")
            or customer_obj.get("phone")
            or "01000000000"
        ).strip()

        customer_email = (
            payload.get("customer_email")
            or payload.get("email")
            or customer_obj.get("email")
            or None
        )

        # Resolve Address
        shipping_obj = payload.get("shipping") or payload.get("shipping_address") or {}
        shipping_address = (
            payload.get("shipping_address")
            or payload.get("address")
            or shipping_obj.get("address")
            or shipping_obj.get("address_1")
            or "Standard Delivery Address"
        )

        shipping_city = (
            payload.get("shipping_city")
            or payload.get("city")
            or shipping_obj.get("city")
            or "Dhaka"
        )

        shipping_zone = payload.get("shipping_zone") or payload.get("zone") or None

        # Financials
        shipping_fee = Decimal(str(payload.get("shipping_fee") or payload.get("delivery_fee") or "0.00"))
        discount_amount = Decimal(str(payload.get("discount_amount") or payload.get("discount") or "0.00"))

        # Payment mapping
        raw_payment = payload.get("payment_method") or payload.get("payment") or "cod"
        payment_method, payment_status = cls.map_payment_method(str(raw_payment))

        # Check explicit payment status override if provided
        if "payment_status" in payload:
            ps_raw = str(payload["payment_status"]).lower()
            if "paid" in ps_raw:
                payment_status = PaymentStatus.PAID
            elif "pending" in ps_raw:
                payment_status = PaymentStatus.PENDING

        # Resolve Line Items
        raw_items = payload.get("items") or payload.get("line_items") or []
        items_create: List[OrderItemCreate] = []

        if isinstance(raw_items, list) and len(raw_items) > 0:
            for item in raw_items:
                if not isinstance(item, dict):
                    continue
                item_name = item.get("product_name") or item.get("name") or item.get("title") or "Website Item"
                item_sku = item.get("sku") or None
                item_qty = max(1, int(item.get("quantity") or item.get("qty") or 1))
                item_price = Decimal(str(item.get("unit_price") or item.get("price") or item.get("total") or "0.00"))
                item_cost = Decimal(str(item["cost_price"])) if "cost_price" in item and item["cost_price"] is not None else None

                items_create.append(
                    OrderItemCreate(
                        product_name=item_name,
                        sku=item_sku,
                        quantity=item_qty,
                        unit_price=item_price,
                        unit_cost_price=item_cost,
                    )
                )

        if not items_create:
            # Fallback if items array wasn't provided, but total_amount was
            fallback_total = Decimal(str(payload.get("total_amount") or payload.get("total") or payload.get("amount") or "0.00"))
            items_create.append(
                OrderItemCreate(
                    product_name="Custom Web Store Item",
                    quantity=1,
                    unit_price=fallback_total,
                )
            )

        # Attribution / UTM tracking
        utm_source = payload.get("utm_source") or payload.get("source") or "custom_website"
        fbclid = payload.get("fbclid") or None
        campaign_name = payload.get("utm_campaign") or None

        attribution = OrderAttributionCreate(
            utm_source=str(utm_source),
            utm_medium=payload.get("utm_medium"),
            utm_campaign=campaign_name,
            utm_content=payload.get("utm_content"),
            utm_term=payload.get("utm_term"),
            fbclid=fbclid,
            attribution_confidence=AttributionConfidence.HIGH if fbclid else (
                AttributionConfidence.MEDIUM if campaign_name else AttributionConfidence.ORGANIC
            ),
        )

        determined_source = source_override or (
            OrderSource.WIX if "wix" in str(utm_source).lower() else OrderSource.CUSTOM_WEBHOOK
        )

        canonical_order = OrderCreate(
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            shipping_address=shipping_address,
            shipping_city=shipping_city,
            shipping_zone=shipping_zone,
            shipping_fee=shipping_fee,
            discount_amount=discount_amount,
            source=determined_source,
            payment_method=payment_method,
            payment_status=payment_status,
            customer_notes=payload.get("customer_notes") or payload.get("notes") or None,
            internal_notes=f"Auto-ingested from Custom API/Webhook ({order_id})",
            external_order_id=f"ext_{order_id}",
            idempotency_key=f"custom_webhook_{order_id}",
            items=items_create,
            attribution=attribution,
        )

        return await OrderService.create_order(
            db=db,
            tenant_id=tenant_id,
            order_in=canonical_order,
            user_id=None,
        )


class ShopifyConnector:
    """
    Shopify Ingestion Connector for orders/create and orders/updated webhooks.
    """

    @classmethod
    async def ingest_webhook_order(
        cls,
        db: AsyncSession,
        tenant_id: str,
        payload: Dict[str, Any],
    ) -> OrderDetailResponse:
        shopify_id = str(payload.get("id", ""))
        order_name = payload.get("name") or f"#{payload.get('order_number', shopify_id)}"

        customer = payload.get("customer", {}) or {}
        shipping = payload.get("shipping_address", {}) or payload.get("billing_address", {}) or {}

        first_name = (shipping.get("first_name") or customer.get("first_name") or "").strip()
        last_name = (shipping.get("last_name") or customer.get("last_name") or "").strip()
        customer_name = f"{first_name} {last_name}".strip() or "Shopify Customer"

        customer_phone = (
            shipping.get("phone")
            or customer.get("phone")
            or "01000000000"
        ).strip()
        customer_email = customer.get("email") or payload.get("email") or None

        address_1 = shipping.get("address1") or ""
        address_2 = shipping.get("address2") or ""
        shipping_address = f"{address_1} {address_2}".strip() or "Shopify Shipping Address"
        shipping_city = shipping.get("city") or "Dhaka"

        # Financial values
        shipping_fee = Decimal(str(payload.get("total_shipping_price_set", {}).get("shop_money", {}).get("amount") or "0.00"))
        discount_amount = Decimal(str(payload.get("total_discounts") or "0.00"))

        # Payment mapping
        financial_status = str(payload.get("financial_status") or "pending").lower()
        gateway = str(payload.get("gateway") or payload.get("payment_gateway_names", [""])[0] if payload.get("payment_gateway_names") else "").lower()

        if "cod" in gateway or "cash" in gateway:
            payment_method = PaymentMethod.COD
            payment_status = PaymentStatus.PENDING
        elif "bkash" in gateway:
            payment_method = PaymentMethod.BKASH
            payment_status = PaymentStatus.PAID if financial_status == "paid" else PaymentStatus.PENDING
        elif "nagad" in gateway:
            payment_method = PaymentMethod.NAGAD
            payment_status = PaymentStatus.PAID if financial_status == "paid" else PaymentStatus.PENDING
        else:
            payment_method = PaymentMethod.CARD if financial_status == "paid" else PaymentMethod.COD
            payment_status = PaymentStatus.PAID if financial_status == "paid" else PaymentStatus.PENDING

        # Map Line Items
        line_items = payload.get("line_items", []) or []
        items_create: List[OrderItemCreate] = []

        for item in line_items:
            item_name = item.get("title") or item.get("name") or "Shopify Product"
            item_sku = item.get("sku") or None
            qty = max(1, int(item.get("quantity") or 1))
            price = Decimal(str(item.get("price") or "0.00"))

            items_create.append(
                OrderItemCreate(
                    product_name=item_name,
                    sku=item_sku,
                    quantity=qty,
                    unit_price=price,
                )
            )

        if not items_create:
            items_create.append(
                OrderItemCreate(
                    product_name="Shopify Order Item",
                    quantity=1,
                    unit_price=Decimal(str(payload.get("total_price") or "0.00")),
                )
            )

        canonical_order = OrderCreate(
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            shipping_address=shipping_address,
            shipping_city=shipping_city,
            shipping_fee=shipping_fee,
            discount_amount=discount_amount,
            source=OrderSource.SHOPIFY,
            payment_method=payment_method,
            payment_status=payment_status,
            customer_notes=payload.get("note") or None,
            internal_notes=f"Auto-ingested from Shopify ({order_name})",
            external_order_id=f"shopify_{shopify_id}",
            idempotency_key=f"shopify_webhook_{shopify_id}",
            items=items_create,
            attribution=OrderAttributionCreate(
                utm_source="shopify",
                attribution_confidence=AttributionConfidence.ORGANIC,
            ),
        )

        return await OrderService.create_order(
            db=db,
            tenant_id=tenant_id,
            order_in=canonical_order,
            user_id=None,
        )


class SampleStoreOrderGenerator:
    """
    Generates realistic test orders for any platform (WooCommerce, Shopify, Custom, Wix)
    allowing users to verify integrations in 1 click even without a live website.
    """

    @classmethod
    async def simulate_test_order(
        cls,
        db: AsyncSession,
        tenant_id: str,
        platform: str = "woocommerce",
    ) -> OrderDetailResponse:
        platform_lower = (platform or "woocommerce").lower().strip()
        test_id = uuid.uuid4().hex[:6]

        if platform_lower == "shopify":
            sample_payload = {
                "id": f"shp_{test_id}",
                "name": f"#SHP-{test_id.upper()}",
                "total_price": "3150.00",
                "total_shipping_price_set": {"shop_money": {"amount": "100.00"}},
                "total_discounts": "0.00",
                "financial_status": "pending",
                "gateway": "Cash on Delivery",
                "customer": {
                    "first_name": "Tanvir",
                    "last_name": "Ahmed",
                    "email": "tanvir.test@shopify.com",
                    "phone": f"01712{uuid.uuid4().int % 900000 + 100000}",
                },
                "shipping_address": {
                    "first_name": "Tanvir",
                    "last_name": "Ahmed",
                    "address1": "House 45, Sector 7, Uttara",
                    "city": "Dhaka",
                    "phone": f"01712{uuid.uuid4().int % 900000 + 100000}",
                },
                "line_items": [
                    {
                        "id": 1,
                        "title": "Shopify Premium Linen Shirt",
                        "sku": f"LINEN-{test_id.upper()}",
                        "quantity": 1,
                        "price": "3050.00",
                    }
                ],
            }
            return await ShopifyConnector.ingest_webhook_order(db, tenant_id, sample_payload)

        elif platform_lower in ("custom", "nextjs", "react", "php", "wix", "html"):
            source = OrderSource.WIX if platform_lower == "wix" else OrderSource.CUSTOM_WEBHOOK
            sample_payload = {
                "order_id": f"CUST-{test_id.upper()}",
                "customer_name": "Shakib Al Hasan",
                "customer_phone": f"01819{uuid.uuid4().int % 900000 + 100000}",
                "customer_email": "shakib.custom@example.com",
                "shipping_address": "Flat 4B, Road 11, Banani",
                "shipping_city": "Dhaka",
                "shipping_fee": "80.00",
                "discount_amount": "0.00",
                "payment_method": "cod",
                "payment_status": "pending",
                "utm_source": "custom_store_test",
                "utm_campaign": "live_integration_check",
                "notes": f"Sample test order from {platform.upper()} integration",
                "items": [
                    {
                        "product_name": f"{platform.capitalize()} Designer Panjabi",
                        "sku": f"PANJABI-{test_id.upper()}",
                        "quantity": 1,
                        "unit_price": "2650.00",
                    }
                ],
            }
            return await UniversalCustomStoreConnector.ingest_custom_order(
                db, tenant_id, sample_payload, source_override=source
            )

        else:
            # Default: WooCommerce
            sample_payload = {
                "id": f"wc_{test_id}",
                "status": "processing",
                "currency": "BDT",
                "total": "2850.00",
                "shipping_total": "80.00",
                "discount_total": "0.00",
                "payment_method": "cod",
                "payment_method_title": "Cash on Delivery",
                "billing": {
                    "first_name": "Rahim",
                    "last_name": "Uddin",
                    "phone": f"01712{uuid.uuid4().int % 900000 + 100000}",
                    "email": "rahim.customer@gmail.com",
                    "address_1": "House 24, Road 7, Dhanmondi",
                    "city": "Dhaka",
                },
                "shipping": {
                    "first_name": "Rahim",
                    "last_name": "Uddin",
                    "phone": f"01712{uuid.uuid4().int % 900000 + 100000}",
                    "address_1": "House 24, Road 7, Dhanmondi",
                    "city": "Dhaka",
                },
                "line_items": [
                    {
                        "id": 1,
                        "name": "WooCommerce Premium Cotton Panjabi",
                        "product_id": 101,
                        "quantity": 1,
                        "price": "2770.00",
                        "total": "2770.00",
                        "sku": f"WC-PANJABI-{test_id.upper()}",
                    }
                ],
            }
            return await WooCommerceConnector.ingest_webhook_order(db, tenant_id, sample_payload)

