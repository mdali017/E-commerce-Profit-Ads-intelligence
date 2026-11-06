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

// ==========================================
// Order Types
// ==========================================
export type OrderSource =
  | "manual"
  | "woocommerce"
  | "shopify"
  | "facebook"
  | "messenger"
  | "whatsapp"
  | "phone_call";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "in_courier"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentMethod =
  | "cod"
  | "bkash"
  | "nagad"
  | "bank_transfer"
  | "prepaid"
  | "card";

export type PaymentStatus = "pending" | "partially_paid" | "paid" | "refunded";

export type AttributionConfidence =
  | "first_party_direct"
  | "utm_match"
  | "click_id_match"
  | "organic"
  | "fcommerce_manual";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name: string;
  variant_name?: string | null;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  unit_cost_price?: number | null;
  unit_packaging_cost: number;
  unit_handling_cost: number;
  total_price: number;
  total_cost?: number | null;
  created_at: string;
}

export interface OrderItemCreateInput {
  product_id?: string | null;
  variant_id?: string | null;
  product_name: string;
  variant_name?: string | null;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  unit_cost_price?: number | null;
  unit_packaging_cost?: number;
  unit_handling_cost?: number;
}

export interface OrderAttribution {
  id: string;
  order_id: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  campaign_id?: string | null;
  adset_id?: string | null;
  ad_id?: string | null;
  attribution_confidence: string;
}

export interface OrderAttributionCreateInput {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  campaign_id?: string | null;
  adset_id?: string | null;
  ad_id?: string | null;
  attribution_confidence?: AttributionConfidence;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status?: string | null;
  to_status: string;
  changed_by_user_id?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  shipping_city?: string | null;
  shipping_zone?: string | null;
  customer_notes?: string | null;
  internal_notes?: string | null;
  source: OrderSource;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  total_cogs: number;
  total_packaging_cost: number;
  total_handling_cost: number;
  gross_profit: number;
  external_order_id?: string | null;
  item_count?: number;
  order_date: string;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  status_history: OrderStatusHistory[];
  attribution?: OrderAttribution | null;
}

export interface OrderCreateInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  shipping_city?: string | null;
  shipping_zone?: string | null;
  customer_notes?: string | null;
  internal_notes?: string | null;
  source?: OrderSource;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  shipping_fee?: number;
  discount_amount?: number;
  external_order_id?: string | null;
  idempotency_key?: string | null;
  items: OrderItemCreateInput[];
  attribution?: OrderAttributionCreateInput | null;
}

export interface OrderUpdateInput {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string | null;
  shipping_address?: string;
  shipping_city?: string | null;
  shipping_zone?: string | null;
  shipping_fee?: number;
  discount_amount?: number;
  payment_status?: PaymentStatus;
  internal_notes?: string | null;
}

export interface OrderKPIStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  in_courier_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  returned_orders: number;
  total_revenue: number;
  total_cogs: number;
  total_gross_profit: number;
  average_order_value: number;
  delivery_rate_percent: number;
  return_rate_percent: number;
}

// ==========================================
// Courier & Shipment Types
// ==========================================
export type CourierProvider = "steadfast" | "pathao" | "redx" | "paperfly" | "custom";

export type ShipmentStatus =
  | "pending"
  | "booked"
  | "in_transit"
  | "delivered"
  | "partially_delivered"
  | "returned"
  | "cancelled"
  | "lost";

export interface CourierCredential {
  id: string;
  tenant_id: string;
  provider: CourierProvider;
  api_key: string;
  secret_key?: string | null;
  store_id?: string | null;
  webhook_secret?: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourierCredentialCreateInput {
  provider: CourierProvider;
  api_key: string;
  secret_key?: string;
  store_id?: string;
  webhook_secret?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface CourierTrackingEvent {
  id: string;
  event_status: string;
  message: string;
  location?: string | null;
  timestamp: string;
}

export interface CourierShipment {
  id: string;
  tenant_id: string;
  order_id: string;
  provider: CourierProvider;
  consignment_id: string;
  tracking_code?: string | null;
  invoice_number?: string | null;
  status: ShipmentStatus;
  raw_status?: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city?: string | null;
  cod_amount: number;
  collected_amount: number;
  delivery_fee: number;
  cod_fee: number;
  return_fee: number;
  is_settled: boolean;
  settled_at?: string | null;
  delivery_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  tracking_events?: CourierTrackingEvent[];
}

export interface BookShipmentRequestInput {
  order_id: string;
  provider?: CourierProvider;
  custom_cod_amount?: number;
  notes?: string;
}

export interface CourierKPIStats {
  total_shipments: number;
  booked_count: number;
  in_transit_count: number;
  delivered_count: number;
  returned_count: number;
  cancelled_count: number;
  delivery_success_rate: number;
  return_rate: number;
  total_cod_amount: number;
  total_collected_amount: number;
  total_delivery_fees: number;
  total_courier_charges: number;
  unsettled_balance: number;
}



