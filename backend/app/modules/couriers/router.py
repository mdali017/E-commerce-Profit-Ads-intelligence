from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_tenant

router = APIRouter(prefix="/couriers", tags=["Courier Integration"])

@router.get("/")
async def get_courier_status(tenant_id: str = Depends(get_current_tenant)):
    """Module 4: Courier Integration (Steadfast, Pathao, RedX) (Ready for Unit 4)."""
    return {"message": "Courier module ready", "tenant_id": tenant_id, "data": []}

