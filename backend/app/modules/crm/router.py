from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_tenant

router = APIRouter(prefix="/crm", tags=["Customer CRM & Automation"])

@router.get("/customers")
async def list_customers(tenant_id: str = Depends(get_current_tenant)):
    """Module 8 & 9: Customer CRM and Post-delivery Automation (Ready for Unit 7)."""
    return {"message": "CRM module ready", "tenant_id": tenant_id, "data": []}

