import { apiClient } from "./api";
import {
  CourierShipment,
  CourierCredential,
  CourierCredentialCreateInput,
  BookShipmentRequestInput,
  CourierKPIStats,
} from "@/types";

export interface CourierFilterParams {
  provider?: string;
  status?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const couriersApi = {
  async getShipments(params: CourierFilterParams = {}): Promise<CourierShipment[]> {
    const query = new URLSearchParams();
    if (params.provider && params.provider !== "all") query.append("provider", params.provider);
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.search) query.append("search", params.search.trim());
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const qs = query.toString();
    return apiClient<CourierShipment[]>(`/couriers/shipments${qs ? `?${qs}` : ""}`, {
      requiresTenant: true,
    });
  },

  async getShipmentDetail(shipmentId: string): Promise<CourierShipment> {
    return apiClient<CourierShipment>(`/couriers/shipments/${shipmentId}`, {
      requiresTenant: true,
    });
  },

  async getCourierKPIs(): Promise<CourierKPIStats> {
    return apiClient<CourierKPIStats>("/couriers/stats/kpis", {
      requiresTenant: true,
    });
  },

  async dispatchOrder(input: BookShipmentRequestInput): Promise<CourierShipment> {
    return apiClient<CourierShipment>("/couriers/dispatch", {
      method: "POST",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },

  async getCredentials(): Promise<CourierCredential[]> {
    return apiClient<CourierCredential[]>("/couriers/credentials", {
      requiresTenant: true,
    });
  },

  async saveCredential(input: CourierCredentialCreateInput): Promise<CourierCredential> {
    return apiClient<CourierCredential>("/couriers/credentials", {
      method: "POST",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },
};

