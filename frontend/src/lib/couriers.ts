import { apiClient } from "./api";
import {
  CourierShipment,
  CourierCredential,
  CourierCredentialCreateInput,
  CourierTestConnectionInput,
  CourierTestConnectionResult,
  BookShipmentRequestInput,
  BulkDispatchRequestInput,
  BulkDispatchResponse,
  CourierKPIStats,
  FraudCheckResult,
  SteadfastBalance,
  PathaoStore,
  PathaoCity,
  PathaoZone,
  PathaoArea,
  PathaoPriceEstimate,
  ECourierLocationItem,
  ECourierPackage,
  DeliveryPerformanceAnalytics,
  CostAnalysisResponse,
  CityPerformanceItem,
  CourierSettlement,
  CourierSettlementCreateInput,
} from "@/types";

export interface CourierFilterParams {
  provider?: string;
  status?: string;
  is_settled?: boolean;
  days?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export const couriersApi = {
  async getShipments(params: CourierFilterParams = {}): Promise<CourierShipment[]> {
    const query = new URLSearchParams();
    if (params.provider && params.provider !== "all") query.append("provider", params.provider);
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.is_settled !== undefined) query.append("is_settled", String(params.is_settled));
    if (params.days !== undefined) query.append("days", String(params.days));
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

  async getShipmentByOrder(orderId: string): Promise<CourierShipment | null> {
    return apiClient<CourierShipment | null>(`/couriers/shipments/order/${orderId}`, {
      requiresTenant: true,
    });
  },

  async syncShipmentStatus(shipmentId: string): Promise<CourierShipment> {
    return apiClient<CourierShipment>(`/couriers/shipments/${shipmentId}/sync`, {
      method: "POST",
      requiresTenant: true,
    });
  },

  async cancelShipment(shipmentId: string, reason?: string): Promise<CourierShipment> {
    return apiClient<CourierShipment>(`/couriers/shipments/${shipmentId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      requiresTenant: true,
    });
  },

  async pollActiveShipments(provider: string = "ecourier"): Promise<{
    checked: number;
    updated: number;
    errors: number;
    provider: string;
    polled_at: string;
  }> {
    return apiClient(`/couriers/sync/poll?provider=${encodeURIComponent(provider)}`, {
      method: "POST",
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

  async bulkDispatchOrders(input: BulkDispatchRequestInput): Promise<BulkDispatchResponse> {
    return apiClient<BulkDispatchResponse>("/couriers/dispatch/bulk", {
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

  async deleteCredential(credentialId: string): Promise<{ success: boolean; message: string }> {
    return apiClient(`/couriers/credentials/${credentialId}`, {
      method: "DELETE",
      requiresTenant: true,
    });
  },

  async testConnection(input: CourierTestConnectionInput): Promise<CourierTestConnectionResult> {
    return apiClient<CourierTestConnectionResult>("/couriers/credentials/test", {
      method: "POST",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },

  async checkFraud(phone: string): Promise<FraudCheckResult> {
    return apiClient<FraudCheckResult>(`/couriers/fraud-check/${encodeURIComponent(phone)}`, {
      requiresTenant: true,
    });
  },

  async getSteadfastBalance(): Promise<SteadfastBalance> {
    return apiClient<SteadfastBalance>("/couriers/balance/steadfast", {
      requiresTenant: true,
    });
  },

  // Pathao Locations & Pricing
  async getPathaoStores(): Promise<PathaoStore[]> {
    return apiClient<PathaoStore[]>("/couriers/locations/pathao/stores", { requiresTenant: true });
  },

  async getPathaoCities(): Promise<PathaoCity[]> {
    return apiClient<PathaoCity[]>("/couriers/locations/pathao/cities", { requiresTenant: true });
  },

  async getPathaoZones(cityId: number): Promise<PathaoZone[]> {
    return apiClient<PathaoZone[]>(`/couriers/locations/pathao/cities/${cityId}/zones`, {
      requiresTenant: true,
    });
  },

  async getPathaoAreas(zoneId: number): Promise<PathaoArea[]> {
    return apiClient<PathaoArea[]>(`/couriers/locations/pathao/zones/${zoneId}/areas`, {
      requiresTenant: true,
    });
  },

  async calculatePathaoPrice(payload: {
    store_id?: string;
    item_type?: number;
    delivery_type?: number;
    item_weight?: number;
    recipient_city: number;
    recipient_zone: number;
  }): Promise<PathaoPriceEstimate> {
    return apiClient<PathaoPriceEstimate>("/couriers/pricing/pathao", {
      method: "POST",
      body: JSON.stringify(payload),
      requiresTenant: true,
    });
  },

  // eCourier Locations & Packages
  async getECourierCities(): Promise<ECourierLocationItem[]> {
    return apiClient<ECourierLocationItem[]>("/couriers/locations/ecourier/cities", {
      requiresTenant: true,
    });
  },

  async getECourierThanas(city: string): Promise<ECourierLocationItem[]> {
    return apiClient<ECourierLocationItem[]>(
      `/couriers/locations/ecourier/thanas?city=${encodeURIComponent(city)}`,
      { requiresTenant: true }
    );
  },

  async getECourierPostcodes(city: string, thana: string): Promise<ECourierLocationItem[]> {
    return apiClient<ECourierLocationItem[]>(
      `/couriers/locations/ecourier/postcodes?city=${encodeURIComponent(city)}&thana=${encodeURIComponent(thana)}`,
      { requiresTenant: true }
    );
  },

  async getECourierAreas(postcode: string, city?: string, thana?: string): Promise<ECourierLocationItem[]> {
    const q = new URLSearchParams({ postcode });
    if (city) q.append("city", city);
    if (thana) q.append("thana", thana);
    return apiClient<ECourierLocationItem[]>(`/couriers/locations/ecourier/areas?${q.toString()}`, {
      requiresTenant: true,
    });
  },

  async getECourierPackages(): Promise<ECourierPackage[]> {
    return apiClient<ECourierPackage[]>("/couriers/locations/ecourier/packages", {
      requiresTenant: true,
    });
  },

  // Analytics
  async getDeliveryPerformance(days: number = 30, provider?: string): Promise<DeliveryPerformanceAnalytics> {
    const q = new URLSearchParams({ days: String(days) });
    if (provider && provider !== "all") q.append("provider", provider);
    return apiClient<DeliveryPerformanceAnalytics>(`/couriers/analytics/delivery-performance?${q.toString()}`, {
      requiresTenant: true,
    });
  },

  async getCostAnalysis(days: number = 30): Promise<CostAnalysisResponse> {
    return apiClient<CostAnalysisResponse>(`/couriers/analytics/cost-analysis?days=${days}`, {
      requiresTenant: true,
    });
  },

  async getCityPerformance(days: number = 30): Promise<CityPerformanceItem[]> {
    return apiClient<CityPerformanceItem[]>(`/couriers/analytics/city-performance?days=${days}`, {
      requiresTenant: true,
    });
  },

  async getStaleShipments(hours: number = 48): Promise<CourierShipment[]> {
    return apiClient<CourierShipment[]>(`/couriers/analytics/stale-shipments?hours=${hours}`, {
      requiresTenant: true,
    });
  },

  // Settlements
  async getSettlements(provider?: string): Promise<CourierSettlement[]> {
    const q = provider && provider !== "all" ? `?provider=${encodeURIComponent(provider)}` : "";
    return apiClient<CourierSettlement[]>(`/couriers/settlements${q}`, { requiresTenant: true });
  },

  async getUnsettledShipments(provider?: string): Promise<CourierShipment[]> {
    const q = provider && provider !== "all" ? `?provider=${encodeURIComponent(provider)}` : "";
    return apiClient<CourierShipment[]>(`/couriers/settlements/unsettled${q}`, {
      requiresTenant: true,
    });
  },

  async createSettlement(input: CourierSettlementCreateInput): Promise<CourierSettlement> {
    return apiClient<CourierSettlement>("/couriers/settlements", {
      method: "POST",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },

  async getSettlementDetail(settlementId: string): Promise<CourierSettlement> {
    return apiClient<CourierSettlement>(`/couriers/settlements/${settlementId}`, {
      requiresTenant: true,
    });
  },

  async updateSettlement(
    settlementId: string,
    payload: { status?: string; reference_number?: string; bank_account?: string; notes?: string }
  ): Promise<CourierSettlement> {
    return apiClient<CourierSettlement>(`/couriers/settlements/${settlementId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      requiresTenant: true,
    });
  },
};
