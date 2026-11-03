from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_tenant

router = APIRouter(prefix="/finance", tags=["Profit & Loss (P&L) Engine"])

@router.get("/pnl")
async def get_pnl_summary(tenant_id: str = Depends(get_current_tenant)):
    """Module 7: P&L Financial Calculation Engine (Ready for Unit 6)."""
    return {"message": "Finance/P&L module ready", "tenant_id": tenant_id}

