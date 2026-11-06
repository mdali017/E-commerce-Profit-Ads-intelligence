import { apiClient } from "./api";
import {
  Order,
  OrderDetail,
  OrderCreateInput,
  OrderUpdateInput,
  OrderKPIStats,
  OrderStatus,
} from "@/types";

export interface OrderFilterParams {
  status?: string;
  source?: string;
  payment_method?: string;
  payment_status?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const ordersApi = {
  async getOrders(params: OrderFilterParams = {}): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.source && params.source !== "all") query.append("source", params.source);
    if (params.payment_method && params.payment_method !== "all") {
      query.append("payment_method", params.payment_method);
    }
    if (params.payment_status && params.payment_status !== "all") {
      query.append("payment_status", params.payment_status);
    }
    if (params.search) query.append("search", params.search.trim());
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const qs = query.toString();
    return apiClient<Order[]>(`/orders/${qs ? `?${qs}` : ""}`, {
      requiresTenant: true,
    });
  },

  async getOrderDetail(orderId: string): Promise<OrderDetail> {
    return apiClient<OrderDetail>(`/orders/${orderId}`, {
      requiresTenant: true,
    });
  },

  async getOrderKPIs(): Promise<OrderKPIStats> {
    return apiClient<OrderKPIStats>("/orders/stats/kpis", {
      requiresTenant: true,
    });
  },

  async createOrder(input: OrderCreateInput): Promise<OrderDetail> {
    return apiClient<OrderDetail>("/orders/", {
      method: "POST",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    reason: string = "Status updated via dashboard"
  ): Promise<OrderDetail> {
    return apiClient<OrderDetail>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
      requiresTenant: true,
    });
  },

  async updateOrder(
    orderId: string,
    input: OrderUpdateInput
  ): Promise<OrderDetail> {
    return apiClient<OrderDetail>(`/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },

  async deleteOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>(`/orders/${orderId}`, {
      method: "DELETE",
      requiresTenant: true,
    });
  },
};

