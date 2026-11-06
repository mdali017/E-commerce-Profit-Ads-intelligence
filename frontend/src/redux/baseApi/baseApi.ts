import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authStorage } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // 1. Try to read token from Redux state, then fallback to localStorage
      const state = getState() as any;
      const token = state?.auth?.token || authStorage.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      // 2. Multi-tenant Header (X-Tenant-ID)
      const tenantId =
        state?.auth?.activeTenantId || authStorage.getActiveTenantId();
      if (tenantId) {
        headers.set("X-Tenant-ID", tenantId);
      }

      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      return headers;
    },
  }),
  tagTypes: [
    "Auth",
    "Workspace",
    "Products",
    "Orders",
    "Couriers",
    "Finance",
    "CRM",
    "Analytics",
  ],
  endpoints: () => ({}),
});

