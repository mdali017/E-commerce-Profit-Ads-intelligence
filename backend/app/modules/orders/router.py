from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_tenant

router = APIRouter(prefix="/orders", tags=["Orders & Ingestion"])

@router.get("/")
async def list_orders(tenant_id: str = Depends(get_current_tenant)):
    """Module 3: Order Engine & Ingestion (Ready for Unit 3)."""
    return {"message": "Orders module ready", "tenant_id": tenant_id, "data": []}

