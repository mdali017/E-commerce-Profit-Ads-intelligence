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

