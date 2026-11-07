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

// ==========================================
// Meta Ads & Attribution Types
// ==========================================
export interface MetaAdAccount {
  id: string;
  tenant_id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
  is_active: boolean;
  is_primary: boolean;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectAdAccountInput {
  account_id: string;
  name: string;
  access_token: string;
  currency?: string;
  timezone_name?: string;
  is_primary?: boolean;
}

export interface MetaCampaign {
  id: string;
  tenant_id: string;
  ad_account_id: string;
  campaign_id: string;
  name: string;
  objective?: string | null;
  status: string;
  daily_budget?: number | null;
  lifetime_budget?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignPerformanceItem {
  campaign_id: string;
  campaign_name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;

  meta_reported_purchases: number;
  meta_reported_conversion_value: number;
  meta_claimed_roas: number;

  attributed_orders_count: number;
  delivered_orders_count: number;
  returned_orders_count: number;
  actual_delivered_revenue: number;
  actual_gross_profit: number;
  actual_delivered_roas: number;
  blended_poas: number;
  roas_inflation_percent: number;
}

export interface AdsKPIStats {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  average_cpc: number;
  average_ctr: number;

  meta_claimed_revenue: number;
  meta_claimed_roas: number;

  actual_delivered_revenue: number;
  actual_delivered_roas: number;
  blended_poas: number;

  total_attributed_orders: number;
  delivered_orders: number;
  returned_orders: number;
  delivery_rate_percent: number;
}

// ==========================================
// Finance & P&L Engine Types
// ==========================================

export interface OperatingExpense {
  id: string;
  tenant_id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
  recurrence_period: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreatePayload {
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
  recurrence_period: string;
  notes?: string;
}

export interface PnLWaterfallItem {
  line_name: string;
  amount: number;
  percentage_of_revenue: number;
  type: "addition" | "deduction" | "subtotal" | "metric";
}

export interface PnLSummary {
  currency: string;
  date_basis: string;
  start_date: string;
  end_date: string;

  total_orders_placed: number;
  delivered_orders_count: number;
  cancelled_orders_count: number;
  returned_orders_count: number;
  delivery_rate_percent: number;

  gross_sales: number;
  cancelled_returned_amount: number;
  delivered_revenue: number;

  total_cogs: number;
  gross_profit: number;
  gross_margin_percent: number;

  courier_charges: number;
  packaging_handling_fees: number;
  payment_gateway_fees: number;
  ad_spend: number;

  contribution_profit: number;
  contribution_margin_percent: number;

  operating_expenses: number;
  net_profit: number;
  net_margin_percent: number;

  breakeven_roas: number;
  actual_delivered_roas: number;

  waterfall: PnLWaterfallItem[];
}

export interface PnLTimeSeriesPoint {
  report_date: string;
  delivered_orders: number;
  delivered_revenue: number;
  cogs: number;
  courier_cost: number;
  packaging_handling: number;
  ad_spend: number;
  operating_expense: number;
  gross_profit: number;
  net_profit: number;
  is_profitable: boolean;
}

export interface BreakEvenAnalysis {
  delivered_revenue: number;
  variable_costs: number;
  variable_cost_ratio: number;
  gross_margin_ratio: number;
  breakeven_roas: number;
  actual_delivered_roas: number;
  safety_margin_percent: number;
  status: "profitable" | "break_even" | "loss_making";
  recommended_action: string;
}

export interface ProductPnLItem {
  product_id: string;
  product_name: string;
  sku?: string | null;
  units_sold: number;
  delivered_revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin_percent: number;
}

export interface CampaignPnLItem {
  campaign_id: string;
  campaign_name: string;
  ad_spend: number;
  delivered_revenue: number;
  cogs: number;
  courier_packaging_cost: number;
  gross_profit: number;
  net_contribution: number;
  delivered_roas: number;
  poas: number;
}

// ==========================================
// Customer CRM & SMS Automation Types
// ==========================================

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  address?: string | null;

  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  cancelled_orders: number;

  total_spent: number;
  average_order_value: number;
  return_risk_score: number;
  is_repeat_customer: boolean;
  segment: "new" | "repeat" | "vip" | "at_risk" | "lapsed";
  tags: string[];

  opted_out_marketing: boolean;
  first_order_date?: string | null;
  last_order_date?: string | null;
  notes?: string | null;

  created_at: string;
  updated_at: string;
}

export type SMSProvider = "simulated" | "elitbuzz" | "greenweb" | "ssl_wireless";
export type SMSMessageStatus = "pending" | "sent" | "delivered" | "failed";

export interface CustomerRecentOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  order_date: string;
  items_count?: number;
  payment_method?: string;
  created_at?: string;
}

export interface SMSMessageLog {
  id: string;
  tenant_id: string;
  recipient_phone: string;
  trigger_event?: string;
  message_body: string;
  message?: string;
  status: string;
  provider: string;
  sms_count: number;
  cost: number;
  cost_bdt?: number;
  error_message?: string | null;
  sent_at: string;
  created_at?: string;
}

export interface CustomerDetail extends Customer {
  recent_orders: CustomerRecentOrder[];
  message_history: SMSMessageLog[];
}

export interface CRMKPIStats {
  total_customers: number;
  repeat_customers_count: number;
  repeat_rate_percent: number;
  average_ltv: number;
  high_risk_customers_count: number;
  total_sms_sent: number;
}

export interface SMSGateway {
  id: string;
  tenant_id: string;
  provider: SMSProvider | string;
  sender_id: string;
  api_key?: string;
  base_url?: string;
  api_url?: string | null;
  is_active: boolean;
  remaining_balance: number;
  updated_at: string;
}

export interface ConfigureSMSGatewayPayload {
  provider: SMSProvider | string;
  api_key: string;
  sender_id?: string;
  api_url?: string;
  base_url?: string;
  is_active: boolean;
}

export interface SMSAutomationRule {
  id: string;
  tenant_id: string;
  name: string;
  trigger_event: string;
  delay_minutes: number;
  template_text: string;
  is_active: boolean;
  min_order_value?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationRuleCreatePayload {
  name: string;
  trigger_event: string;
  delay_minutes: number;
  template_text: string;
  is_active: boolean;
  min_order_value?: number;
}

export interface TestSendSMSPayload {
  recipient_phone: string;
  message: string;
}

// ==========================================
// Executive Dashboard & AI Insights Types
// ==========================================
export interface ExecutiveKPIs {
  gross_revenue: number;
  delivered_revenue: number;
  net_profit: number;
  net_margin_percent: number;

  total_ad_spend: number;
  meta_claimed_roas: number;
  real_delivered_roas: number;
  true_poas: number;
  break_even_roas: number;

  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  cancelled_orders: number;
  delivery_success_rate: number;
  return_rate: number;
  unsettled_courier_balance: number;
  total_opex: number;

  total_customers: number;
  repeat_rate_percent: number;
  high_risk_customers_count: number;
}

export interface ExecutiveAlert {
  id: string;
  tenant_id: string;
  alert_type: string;
  severity: "critical" | "warning" | "info" | "opportunity";
  title: string;
  message: string;
  action_cta?: string | null;
  action_url?: string | null;
  metrics_snapshot?: Record<string, any> | null;
  is_dismissed: boolean;
  created_at: string;
}

export interface BleedingCampaignSummary {
  campaign_id: string;
  campaign_name: string;
  ad_spend: number;
  meta_claimed_roas: number;
  delivered_orders: number;
  delivered_revenue: number;
  delivered_profit: number;
  actual_delivered_roas: number;
  return_rate: number;
  severity: string;
  diagnostic_issue: string;
  recommendation: string;
}

export interface SourceRevenueItem {
  source: string;
  order_count: number;
  total_revenue: number;
  percentage: number;
}

export interface DailyProfitTrendPoint {
  date: string;
  revenue: number;
  ad_spend: number;
  cogs: number;
  net_profit: number;
  delivered_orders: number;
}

export interface IntegrationStatus {
  meta_ads_connected: boolean;
  store_connected: boolean;
  courier_connected: boolean;
  products_configured: boolean;
  total_connected: number;
  all_connected: boolean;
  is_fresh_workspace: boolean;
}

export interface ExecutiveOverviewResponse {
  date_range: string;
  start_date: string;
  end_date: string;
  kpis: ExecutiveKPIs;
  alerts: ExecutiveAlert[];
  bleeding_campaigns: BleedingCampaignSummary[];
  revenue_by_source: SourceRevenueItem[];
  daily_trends: DailyProfitTrendPoint[];
  integrations?: IntegrationStatus;
}

export interface AIBriefing {
  id: string;
  date_range: string;
  health_score: number;
  executive_summary: string;
  key_findings: string[];
  action_items: string[];
  generated_at: string;
}







