from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_tenant

router = APIRouter(prefix="/products", tags=["Products & COGS"])

@router.get("/")
async def list_products(tenant_id: str = Depends(get_current_tenant)):
    """Module 6: Product Catalog & Cost Engine (Ready for Unit 2)."""
    return {"message": "Products module ready", "tenant_id": tenant_id, "data": []}

