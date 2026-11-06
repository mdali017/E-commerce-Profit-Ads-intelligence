import logging
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders.models import Order, OrderItem, OrderStatusHistory
from app.modules.products.models import Product, ProductVariant

logger = logging.getLogger("order_sync_queue")


class OrderSyncQueueService:
    """
    Background Order Sync Queue & Retroactive Data Matching Service.
    Handles retroactive COGS resolution for uncosted orders and webhook retries.
    """

    @staticmethod
    async def retroactive_cogs_backfill(
        db: AsyncSession,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """
        Scans all orders in the tenant where line items are missing COGS (unit_cost_price IS NULL).
        Attempts to match them against current Product catalog records by SKU or name,
        updates line item costs, updates Order total_cogs and gross_profit, and records audit trail.
        """
        # Find uncosted items
        stmt = (
            select(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                and_(
                    Order.tenant_id == tenant_id,
                    OrderItem.unit_cost_price.is_(None),
                )
            )
        )
        res = await db.execute(stmt)
        uncosted_items = res.scalars().all()

        if not uncosted_items:
            return {
                "items_processed": 0,
                "items_updated": 0,
                "orders_recalculated": 0,
                "message": "All orders already have 100% cost coverage.",
            }

        # Load active tenant products for fast in-memory matching
        prod_stmt = select(Product).where(Product.tenant_id == tenant_id)
        prod_res = await db.execute(prod_stmt)
        products = prod_res.scalars().all()

        sku_to_product = {}
        name_to_product = {}
        for p in products:
            if p.sku:
                sku_to_product[p.sku.strip().lower()] = p
            name_to_product[p.name.strip().lower()] = p

        updated_items_count = 0
        affected_order_ids = set()

        for item in uncosted_items:
            matched_prod = None
            if item.sku and item.sku.strip().lower() in sku_to_product:
                matched_prod = sku_to_product[item.sku.strip().lower()]
            elif item.product_name.strip().lower() in name_to_product:
                matched_prod = name_to_product[item.product_name.strip().lower()]

            if matched_prod and matched_prod.cost_price is not None:
                item.product_id = matched_prod.id
                item.unit_cost_price = matched_prod.cost_price
                item.unit_packaging_cost = matched_prod.packaging_cost or Decimal("0.00")
                item.unit_handling_cost = matched_prod.handling_cost or Decimal("0.00")
                item.total_cost = (
                    (item.unit_cost_price + item.unit_packaging_cost + item.unit_handling_cost)
                    * item.quantity
                )
                updated_items_count += 1
                affected_order_ids.add(item.order_id)

        # Recalculate financial totals for affected orders
        for order_id in affected_order_ids:
            order_res = await db.execute(
                select(Order).where(Order.id == order_id)
            )
            order = order_res.scalar_one_or_none()
            if not order:
                continue

            # Load all items for this order
            items_res = await db.execute(
                select(OrderItem).where(OrderItem.order_id == order_id)
            )
            all_items = items_res.scalars().all()

            new_cogs = Decimal("0.00")
            new_pkg = Decimal("0.00")
            new_hnd = Decimal("0.00")

            for it in all_items:
                cogs_val = it.unit_cost_price or Decimal("0.00")
                new_cogs += cogs_val * it.quantity
                new_pkg += (it.unit_packaging_cost or Decimal("0.00")) * it.quantity
                new_hnd += (it.unit_handling_cost or Decimal("0.00")) * it.quantity

            order.total_cogs = new_cogs
            order.total_packaging_cost = new_pkg
            order.total_handling_cost = new_hnd
            order.gross_profit = order.total_amount - (new_cogs + new_pkg + new_hnd)

            # Audit history log
            audit = OrderStatusHistory(
                order_id=order.id,
                from_status=order.status,
                to_status=order.status,
                reason="Retroactive COGS backfill completed by background sync engine",
            )
            db.add(audit)

        await db.commit()

        logger.info(
            f"COGS backfill for tenant {tenant_id}: {updated_items_count} items updated across {len(affected_order_ids)} orders."
        )

        return {
            "items_processed": len(uncosted_items),
            "items_updated": updated_items_count,
            "orders_recalculated": len(affected_order_ids),
            "message": f"Successfully updated {updated_items_count} items and recalculated {len(affected_order_ids)} orders.",
        }

