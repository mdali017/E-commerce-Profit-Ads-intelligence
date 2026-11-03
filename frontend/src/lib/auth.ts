export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  role: string;
}

const TOKEN_KEY = "profitpulse_token";
const USER_KEY = "profitpulse_user";
const ACTIVE_TENANT_KEY = "profitpulse_tenant_id";

export const authStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearAuth() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACTIVE_TENANT_KEY);
  },

  getUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setUser(user: UserProfile) {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getActiveTenantId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_TENANT_KEY);
  },

  setActiveTenantId(tenantId: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
  },
};

