import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models import (
    Customer,
    CustomerSegment,
    SMSGatewayCredential,
    SMSProvider,
    SMSAutomationRule,
    SMSTriggerEvent,
    SMSMessageLog,
    SMSMessageStatus,
)
from app.modules.crm.schemas import (
    CustomerUpdate,
    CustomerRecentOrder,
    SMSMessageLogResponse,
    CustomerDetailResponse,
    CRMKPIStats,
    ConfigureSMSGatewayRequest,
    AutomationRuleCreate,
    AutomationRuleUpdate,
    TestSendSMSResponse,
)
from app.modules.crm.sms_connector import get_sms_connector, BaseSMSConnector
from app.modules.orders.models import Order, OrderStatus
from app.modules.workspaces.models import Tenant


class CRMService:
    """
    Module 8 & 9: Customer CRM & SMS Automation Engine.
    Handles customer lifetime profile synchronization, LTV & return risk tagging,
    and automated event-driven SMS dispatch via local Bangladeshi gateways.
    """

    # ==========================================
    # 1. Customer Profile Auto-Sync & Lifecycle
    # ==========================================

    @classmethod
    def normalize_phone(cls, phone: str) -> str:
        """Cleans and normalizes BD phone number to 11 digits (e.g. 01711223344)."""
        clean = "".join(ch for ch in str(phone) if ch.isdigit())
        if clean.startswith("880") and len(clean) >= 13:
            clean = clean[2:]
        elif clean.startswith("88") and len(clean) >= 13:
            clean = clean[2:]
        if len(clean) == 10 and not clean.startswith("0"):
            clean = "0" + clean
        return clean

    @classmethod
    async def sync_customer_from_order(
        cls, db: AsyncSession, tenant_id: str, order: Order
    ) -> Customer:
        """
        Called when an order is created or status transitions.
        Aggregates order history by customer phone, calculates LTV and Return Risk Score.
        """
        phone = cls.normalize_phone(order.customer_phone)

        # 1. Find existing customer or initialize
        stmt = select(Customer).where(
            and_(
                Customer.tenant_id == tenant_id,
                Customer.phone == phone,
            )
        )
        res = await db.execute(stmt)
        customer = res.scalar_one_or_none()

        if not customer:
            customer = Customer(
                tenant_id=tenant_id,
                name=order.customer_name,
                phone=phone,
                email=order.customer_email,
                city=order.shipping_city,
                address=order.shipping_address,
                first_order_date=order.created_at,
                last_order_date=order.created_at,
            )
            db.add(customer)
            await db.flush()

        # 2. Query all orders placed by this customer in this workspace
        orders_stmt = select(Order).where(
            and_(
                Order.tenant_id == tenant_id,
                Order.customer_phone.ilike(f"%{phone[-10:]}%"),
            )
        )
        o_res = await db.execute(orders_stmt)
        orders = o_res.scalars().all()

        total_orders = len(orders)
        delivered_orders = [o for o in orders if o.status == OrderStatus.DELIVERED]
        returned_orders = [o for o in orders if o.status == OrderStatus.RETURNED]
        cancelled_orders = [o for o in orders if o.status == OrderStatus.CANCELLED]

        delivered_count = len(delivered_orders)
        returned_count = len(returned_orders)
        cancelled_count = len(cancelled_orders)

        total_spent = sum((Decimal(str(o.total_amount or 0)) for o in delivered_orders), Decimal("0.00"))
        aov = (total_spent / Decimal(str(delivered_count))).quantize(Decimal("0.01")) if delivered_count > 0 else Decimal("0.00")
        return_risk = round((returned_count / total_orders) * 100, 2) if total_orders > 0 else 0.0
        is_repeat = delivered_count >= 2

        # 3. Dynamic Tagging & Segmentation
        tags = list(customer.tags or [])
        if return_risk >= 30.0 and "High Return Risk" not in tags:
            tags.append("High Return Risk")
        elif return_risk < 30.0 and "High Return Risk" in tags:
            tags.remove("High Return Risk")

        if is_repeat and "Repeat Customer" not in tags:
            tags.append("Repeat Customer")

        if total_spent >= Decimal("10000.00") and "VIP Buyer" not in tags:
            tags.append("VIP Buyer")

        if total_spent >= Decimal("10000.00"):
            segment = CustomerSegment.VIP.value
        elif is_repeat:
            segment = CustomerSegment.REPEAT.value
        elif return_risk >= 40.0:
            segment = CustomerSegment.AT_RISK.value
        else:
            segment = CustomerSegment.NEW.value

        # Update customer fields
        customer.name = order.customer_name or customer.name
        customer.city = order.shipping_city or customer.city
        customer.address = order.shipping_address or customer.address
        customer.total_orders = total_orders
        customer.delivered_orders = delivered_count
        customer.returned_orders = returned_count
        customer.cancelled_orders = cancelled_count
        customer.total_spent = total_spent
        customer.average_order_value = aov
        customer.return_risk_score = return_risk
        customer.is_repeat_customer = is_repeat
        customer.segment = segment
        customer.tags = tags
        customer.last_order_date = order.created_at

        await db.commit()
        await db.refresh(customer)
        return customer

    @classmethod
    async def get_customers(
        cls,
        db: AsyncSession,
        tenant_id: str,
        search: Optional[str] = None,
        segment: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Customer]:
        conditions = [Customer.tenant_id == tenant_id]
        if search:
            search_clean = cls.normalize_phone(search)
            conditions.append(
                or_(
                    Customer.name.ilike(f"%{search}%"),
                    Customer.phone.ilike(f"%{search_clean}%"),
                    Customer.city.ilike(f"%{search}%"),
                )
            )
        if segment and segment != "all":
            conditions.append(Customer.segment == segment)

        stmt = (
            select(Customer)
            .where(and_(*conditions))
            .order_by(Customer.total_spent.desc(), Customer.total_orders.desc())
            .limit(limit)
            .offset(offset)
        )
        res = await db.execute(stmt)
        return res.scalars().all()

    @classmethod
    async def get_customer_detail(
        cls, db: AsyncSession, tenant_id: str, customer_id: str
    ) -> Optional[CustomerDetailResponse]:
        stmt = select(Customer).where(
            and_(Customer.tenant_id == tenant_id, Customer.id == customer_id)
        )
        res = await db.execute(stmt)
        customer = res.scalar_one_or_none()
        if not customer:
            return None

        # Fetch recent orders
        orders_stmt = (
            select(Order)
            .where(
                and_(
                    Order.tenant_id == tenant_id,
                    Order.customer_phone.ilike(f"%{customer.phone[-10:]}%"),
                )
            )
            .order_by(Order.created_at.desc())
            .limit(10)
        )
        o_res = await db.execute(orders_stmt)
        recent_orders = [
            CustomerRecentOrder(
                id=o.id,
                order_number=o.order_number,
                status=o.status.value if hasattr(o.status, "value") else str(o.status),
                total_amount=o.total_amount,
                order_date=o.order_date or o.created_at,
            )
            for o in o_res.scalars().all()
        ]

        # Fetch communication log
        logs_stmt = (
            select(SMSMessageLog)
            .where(
                and_(
                    SMSMessageLog.tenant_id == tenant_id,
                    SMSMessageLog.recipient_phone == customer.phone,
                )
            )
            .order_by(SMSMessageLog.sent_at.desc())
            .limit(10)
        )
        l_res = await db.execute(logs_stmt)
        message_history = [
            SMSMessageLogResponse.model_validate(log)
            for log in l_res.scalars().all()
        ]

        resp = CustomerDetailResponse.model_validate(customer)
        resp.recent_orders = recent_orders
        resp.message_history = message_history
        return resp

    @classmethod
    async def update_customer(
        cls, db: AsyncSession, tenant_id: str, customer_id: str, update_in: CustomerUpdate
    ) -> Optional[Customer]:
        stmt = select(Customer).where(
            and_(Customer.tenant_id == tenant_id, Customer.id == customer_id)
        )
        res = await db.execute(stmt)
        customer = res.scalar_one_or_none()
        if not customer:
            return None

        update_data = update_in.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(customer, key, val)

        await db.commit()
        await db.refresh(customer)
        return customer

    @classmethod
    async def get_crm_kpis(cls, db: AsyncSession, tenant_id: str) -> CRMKPIStats:
        """Returns executive CRM metrics: Repeat rate, average LTV, and risk counts."""
        stmt = select(Customer).where(Customer.tenant_id == tenant_id)
        res = await db.execute(stmt)
        customers = res.scalars().all()

        total = len(customers)
        repeats = len([c for c in customers if c.is_repeat_customer])
        high_risk = len([c for c in customers if c.return_risk_score >= 30.0])
        repeat_rate = round((repeats / total) * 100, 2) if total > 0 else 0.0

        total_ltv = sum((Decimal(str(c.total_spent or 0)) for c in customers), Decimal("0.00"))
        avg_ltv = (total_ltv / Decimal(str(total))).quantize(Decimal("0.01")) if total > 0 else Decimal("0.00")

        # Total SMS sent
        sms_stmt = select(func.count(SMSMessageLog.id)).where(SMSMessageLog.tenant_id == tenant_id)
        s_res = await db.execute(sms_stmt)
        total_sms = s_res.scalar_one()

        return CRMKPIStats(
            total_customers=total,
            repeat_customers_count=repeats,
            repeat_rate_percent=repeat_rate,
            average_ltv=avg_ltv,
            high_risk_customers_count=high_risk,
            total_sms_sent=total_sms,
        )

    # ==========================================
    # 2. SMS Gateway Configuration & Credential
    # ==========================================

    @classmethod
    async def configure_gateway(
        cls, db: AsyncSession, tenant_id: str, request_in: ConfigureSMSGatewayRequest
    ) -> SMSGatewayCredential:
        stmt = select(SMSGatewayCredential).where(SMSGatewayCredential.tenant_id == tenant_id)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if existing:
            existing.provider = request_in.provider
            existing.api_key = request_in.api_key
            existing.sender_id = request_in.sender_id
            existing.api_url = request_in.api_url
            existing.is_active = request_in.is_active
            target = existing
        else:
            target = SMSGatewayCredential(
                tenant_id=tenant_id,
                provider=request_in.provider,
                api_key=request_in.api_key,
                sender_id=request_in.sender_id,
                api_url=request_in.api_url,
                is_active=request_in.is_active,
                remaining_balance=Decimal("500.00"),
            )
            db.add(target)

        await db.commit()
        await db.refresh(target)
        return target

    @classmethod
    async def get_gateway_credential(
        cls, db: AsyncSession, tenant_id: str
    ) -> SMSGatewayCredential:
        """Returns configured gateway or creates default simulated client."""
        stmt = select(SMSGatewayCredential).where(
            and_(
                SMSGatewayCredential.tenant_id == tenant_id,
                SMSGatewayCredential.is_active == True,
            )
        )
        res = await db.execute(stmt)
        cred = res.scalar_one_or_none()

        if not cred:
            cred = SMSGatewayCredential(
                tenant_id=tenant_id,
                provider=SMSProvider.SIMULATED.value,
                api_key="simulated_bd_sms_key_dev",
                sender_id="ProfitPulse",
                is_active=True,
                remaining_balance=Decimal("500.00"),
            )
            db.add(cred)
            await db.commit()
            await db.refresh(cred)

        return cred

    # ==========================================
    # 3. SMS Automation Rules & Event Triggers
    # ==========================================

    @classmethod
    async def create_automation_rule(
        cls, db: AsyncSession, tenant_id: str, rule_in: AutomationRuleCreate
    ) -> SMSAutomationRule:
        rule = SMSAutomationRule(
            tenant_id=tenant_id,
            name=rule_in.name,
            trigger_event=rule_in.trigger_event,
            delay_minutes=rule_in.delay_minutes,
            template_text=rule_in.template_text,
            is_active=rule_in.is_active,
            min_order_value=rule_in.min_order_value,
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule

    @classmethod
    async def get_automation_rules(
        cls, db: AsyncSession, tenant_id: str
    ) -> List[SMSAutomationRule]:
        stmt = select(SMSAutomationRule).where(SMSAutomationRule.tenant_id == tenant_id)
        res = await db.execute(stmt)
        rules = res.scalars().all()

        if not rules:
            # Initialize default P0 Post-Delivery Thank You automation rule
            default_rule = SMSAutomationRule(
                tenant_id=tenant_id,
                name="Delivered Order Thank You & Review Request",
                trigger_event=SMSTriggerEvent.ORDER_DELIVERED.value,
                delay_minutes=0,
                template_text="Dear {{customer_name}}, your order #{{order_id}} has been delivered. Thank you for shopping with {{shop_name}}! Review us for 10% off your next order.",
                is_active=True,
            )
            db.add(default_rule)
            await db.commit()
            await db.refresh(default_rule)
            return [default_rule]

        return rules

    @classmethod
    async def trigger_event_automations(
        cls, db: AsyncSession, tenant_id: str, trigger_event: str, order_id: str
    ) -> List[SMSMessageLog]:
        """
        Executes active SMS automation rules for this trigger event (e.g. order_delivered).
        Replaces template variables: {{customer_name}}, {{order_id}}, {{shop_name}}, {{total_amount}}.
        """
        # Fetch Order & Tenant
        order_stmt = select(Order).where(and_(Order.tenant_id == tenant_id, Order.id == order_id))
        o_res = await db.execute(order_stmt)
        order = o_res.scalar_one_or_none()
        if not order:
            return []

        tenant_stmt = select(Tenant).where(Tenant.id == tenant_id)
        t_res = await db.execute(tenant_stmt)
        tenant = t_res.scalar_one_or_none()
        shop_name = tenant.name if tenant else "Our Store"

        # Find customer profile
        clean_phone = cls.normalize_phone(order.customer_phone)
        cust_stmt = select(Customer).where(and_(Customer.tenant_id == tenant_id, Customer.phone == clean_phone))
        c_res = await db.execute(cust_stmt)
        customer = c_res.scalar_one_or_none()

        if customer and customer.opted_out_marketing:
            return []  # Respect customer opt-out

        # Find active automation rules matching trigger_event
        rules_stmt = select(SMSAutomationRule).where(
            and_(
                SMSAutomationRule.tenant_id == tenant_id,
                SMSAutomationRule.trigger_event == trigger_event,
                SMSAutomationRule.is_active == True,
            )
        )
        r_res = await db.execute(rules_stmt)
        rules = r_res.scalars().all()

        gateway = await cls.get_gateway_credential(db, tenant_id)
        connector = get_sms_connector(gateway.provider)
        logs_created = []

        for rule in rules:
            # Substitute template variables
            body = (
                rule.template_text
                .replace("{{customer_name}}", order.customer_name or "Customer")
                .replace("{{order_id}}", order.order_number)
                .replace("{{shop_name}}", shop_name)
                .replace("{{total_amount}}", str(order.total_amount))
            )

            # Send SMS via connector
            result = await connector.send_sms(
                recipient_phone=clean_phone,
                message=body,
                sender_id=gateway.sender_id,
                api_key=gateway.api_key,
                api_url=gateway.api_url,
            )

            unit_cost = Decimal(str(result["sms_count"] * 0.35))
            log = SMSMessageLog(
                tenant_id=tenant_id,
                customer_id=customer.id if customer else None,
                order_id=order.id,
                recipient_phone=clean_phone,
                message_body=body,
                status=result["status"],
                provider=gateway.provider,
                sms_count=result["sms_count"],
                cost=unit_cost,
                error_message=result.get("error"),
                sent_at=datetime.utcnow(),
            )
            db.add(log)
            logs_created.append(log)

            # Deduct balance
            gateway.remaining_balance = max(gateway.remaining_balance - unit_cost, Decimal("0.00"))

        await db.commit()
        return logs_created

    @classmethod
    async def send_test_sms(
        cls, db: AsyncSession, tenant_id: str, recipient_phone: str, message: str
    ) -> TestSendSMSResponse:
        """Sends an immediate test SMS to verify gateway connectivity and preview text formatting."""
        gateway = await cls.get_gateway_credential(db, tenant_id)
        connector = get_sms_connector(gateway.provider)
        clean_phone = cls.normalize_phone(recipient_phone)

        result = await connector.send_sms(
            recipient_phone=clean_phone,
            message=message,
            sender_id=gateway.sender_id,
            api_key=gateway.api_key,
            api_url=gateway.api_url,
        )

        log = SMSMessageLog(
            tenant_id=tenant_id,
            recipient_phone=clean_phone,
            message_body=message,
            status=result["status"],
            provider=gateway.provider,
            sms_count=result["sms_count"],
            cost=Decimal(str(result["sms_count"] * 0.35)),
            error_message=result.get("error"),
            sent_at=datetime.utcnow(),
        )
        db.add(log)
        await db.commit()

        return TestSendSMSResponse(
            success=result["success"],
            status=result["status"],
            provider_ref=result.get("provider_ref"),
            sms_count=result["sms_count"],
            recipient_phone=clean_phone,
            message_preview=message,
            error=result.get("error"),
        )

    @classmethod
    async def get_sms_logs(
        cls, db: AsyncSession, tenant_id: str, limit: int = 50, offset: int = 0
    ) -> List[SMSMessageLog]:
        stmt = (
            select(SMSMessageLog)
            .where(SMSMessageLog.tenant_id == tenant_id)
            .order_by(SMSMessageLog.sent_at.desc())
            .limit(limit)
            .offset(offset)
        )
        res = await db.execute(stmt)
        return res.scalars().all()

