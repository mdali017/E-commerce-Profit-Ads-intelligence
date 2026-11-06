from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_tenant
from app.modules.crm.schemas import (
    CustomerResponse,
    CustomerDetailResponse,
    CustomerUpdate,
    CRMKPIStats,
    ConfigureSMSGatewayRequest,
    SMSGatewayResponse,
    AutomationRuleCreate,
    AutomationRuleUpdate,
    AutomationRuleResponse,
    TestSendSMSRequest,
    TestSendSMSResponse,
    SMSMessageLogResponse,
)
from app.modules.crm.service import CRMService

router = APIRouter(prefix="/crm", tags=["Customer CRM & SMS Automation"])


# ==========================================
# 1. Customer CRM Endpoints
# ==========================================

@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = Query(None, description="Search by customer name, phone or city"),
    segment: Optional[str] = Query(None, description="Filter by segment: new, repeat, vip, at_risk, lapsed"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Lists customer profiles aggregated by normalized phone number with lifetime metrics."""
    return await CRMService.get_customers(db, tenant_id, search, segment, limit, offset)


@router.get("/customers/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer_detail(
    customer_id: str,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves full customer profile including order history, communication logs, and tags."""
    detail = await CRMService.get_customer_detail(db, tenant_id, customer_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Customer not found")
    return detail


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    update_in: CustomerUpdate,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Updates customer tags, internal notes, or marketing opt-out status."""
    customer = await CRMService.update_customer(db, tenant_id, customer_id, update_in)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/stats/kpis", response_model=CRMKPIStats)
async def get_crm_kpis(
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Returns workspace CRM executive metrics: Repeat customer rate %, average LTV, and risk counts."""
    return await CRMService.get_crm_kpis(db, tenant_id)


# ==========================================
# 2. SMS Gateway Configuration Endpoints
# ==========================================

@router.post("/sms/gateway", response_model=SMSGatewayResponse)
async def configure_sms_gateway(
    request_in: ConfigureSMSGatewayRequest,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Configures local Bangladeshi SMS Gateway credentials (Elitbuzz, Greenweb, SSL Wireless, or Simulated)."""
    return await CRMService.configure_gateway(db, tenant_id, request_in)


@router.get("/sms/gateway", response_model=SMSGatewayResponse)
async def get_sms_gateway(
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Returns the active SMS gateway configuration and remaining credit balance."""
    return await CRMService.get_gateway_credential(db, tenant_id)


# ==========================================
# 3. SMS Automation Rules Endpoints
# ==========================================

@router.post("/sms/rules", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_automation_rule(
    rule_in: AutomationRuleCreate,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new automated messaging rule triggered by order events."""
    return await CRMService.create_automation_rule(db, tenant_id, rule_in)


@router.get("/sms/rules", response_model=List[AutomationRuleResponse])
async def list_automation_rules(
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Lists all automated messaging rules."""
    return await CRMService.get_automation_rules(db, tenant_id)


# ==========================================
# 4. SMS Test Send & Message Logs
# ==========================================

@router.post("/sms/test-send", response_model=TestSendSMSResponse)
async def send_test_sms(
    request_in: TestSendSMSRequest,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Dispatches an instant test SMS to any Bangladeshi mobile number."""
    return await CRMService.send_test_sms(
        db, tenant_id, request_in.recipient_phone, request_in.message
    )


@router.get("/sms/logs", response_model=List[SMSMessageLogResponse])
async def get_sms_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Returns chronological delivery logs of all outbound SMS messages."""
    return await CRMService.get_sms_logs(db, tenant_id, limit, offset)
