export type Role = "owner" | "admin" | "marketer" | "operator" | "accountant";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  date_basis: string;
  created_at: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: Role;
  tenant: Workspace;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DashboardMetrics {
  today_net_profit: number;
  today_revenue: number;
  today_ad_spend: number;
  actual_roas: number;
  meta_claimed_roas: number;
  orders_count: number;
  delivery_rate_percent: number;
}

// ==========================================
// Product & COGS Types
// ==========================================
export interface ProductCostHistory {
  id: string;
  product_id: string;
  variant_id?: string | null;
  old_cost_price?: number | null;
  new_cost_price: number;
  effective_from: string;
  reason?: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string | null;
  price?: number | null;
  cost_price?: number | null;
  stock_quantity: number;
  attributes?: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  description?: string | null;
  image_url?: string | null;
  regular_price: number;
  cost_price?: number | null;
  packaging_cost: number;
  handling_cost: number;
  is_active: boolean;
  has_cost: boolean;
  unit_gross_profit?: number | null;
  margin_percentage?: number | null;
  variants?: ProductVariant[];
  cost_history?: ProductCostHistory[];
  created_at: string;
  updated_at: string;
}

export interface ProductCreateInput {
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  regular_price: number;
  cost_price?: number | null;
  packaging_cost?: number;
  handling_cost?: number;
  is_active?: boolean;
}

export interface ProductUpdateInput {
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  regular_price?: number;
  cost_price?: number | null;
  packaging_cost?: number;
  handling_cost?: number;
  is_active?: boolean;
}

export interface CostCoverageStats {
  total_products: number;
  products_with_cost: number;
  products_missing_cost: number;
  cost_coverage_percentage: number;
  total_variants: number;
  variants_with_cost: number;
}

export interface BulkCostItem {
  sku: string;
  cost_price: number;
  packaging_cost?: number;
  handling_cost?: number;
  reason?: string;
}

export interface BulkCostUploadResult {
  updated_count: number;
  failed_count: number;
  errors: { sku: string; error: string }[];
}

