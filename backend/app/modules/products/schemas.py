from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime


# ==========================================
# Variant Schemas
# ==========================================
class ProductVariantBase(BaseModel):
    name: str
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    stock_quantity: int = 0
    attributes: Optional[Dict[str, Any]] = None
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ProductVariantResponse(ProductVariantBase):
    id: str
    product_id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Cost History Schemas
# ==========================================
class ProductCostUpdate(BaseModel):
    new_cost_price: Decimal = Field(..., ge=0, description="New cost price (COGS)")
    variant_id: Optional[str] = None
    reason: Optional[str] = "Manual update"


class ProductCostHistoryResponse(BaseModel):
    id: str
    product_id: str
    variant_id: Optional[str] = None
    old_cost_price: Optional[Decimal] = None
    new_cost_price: Decimal
    effective_from: datetime
    reason: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# Product Schemas
# ==========================================
class ProductBase(BaseModel):
    name: str
    sku: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    regular_price: Decimal = Decimal("0.00")
    cost_price: Optional[Decimal] = None
    packaging_cost: Decimal = Decimal("0.00")
    handling_cost: Decimal = Decimal("0.00")
    is_active: bool = True


class ProductCreate(ProductBase):
    variants: Optional[List[ProductVariantCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    regular_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    packaging_cost: Optional[Decimal] = None
    handling_cost: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str
    tenant_id: str
    has_cost: bool
    unit_gross_profit: Optional[Decimal] = None
    margin_percentage: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductDetailResponse(ProductResponse):
    variants: List[ProductVariantResponse] = []
    cost_history: List[ProductCostHistoryResponse] = []

    class Config:
        from_attributes = True


class CostCoverageStats(BaseModel):
    total_products: int
    products_with_cost: int
    products_missing_cost: int
    cost_coverage_percentage: float
    total_variants: int
    variants_with_cost: int
