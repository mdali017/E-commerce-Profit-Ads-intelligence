import { apiClient } from "./api";
import {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  CostCoverageStats,
  BulkCostItem,
  BulkCostUploadResult,
  ProductVariant,
} from "@/types";

export interface ProductFilterParams {
  search?: string;
  category?: string;
  has_cost?: boolean;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

export const productsApi = {
  async getProducts(params: ProductFilterParams = {}): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category) query.append("category", params.category);
    if (params.has_cost !== undefined) query.append("has_cost", String(params.has_cost));
    if (params.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const qs = query.toString();
    return apiClient<Product[]>(`/products/${qs ? `?${qs}` : ""}`, {
      requiresTenant: true,
    });
  },

  async getProductDetail(productId: string): Promise<Product> {
    return apiClient<Product>(`/products/${productId}`, {
      requiresTenant: true,
    });
  },

  async createProduct(input: ProductCreateInput): Promise<Product> {
    return apiClient<Product>("/products/", {
      method: "POST",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },

  async updateProduct(productId: string, input: ProductUpdateInput): Promise<Product> {
    return apiClient<Product>(`/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },

  async updateCostPrice(
    productId: string,
    payload: { new_cost_price: number; variant_id?: string; reason?: string }
  ): Promise<Product> {
    return apiClient<Product>(`/products/${productId}/cost`, {
      method: "POST",
      body: JSON.stringify(payload),
      requiresTenant: true,
    });
  },

  async deleteProduct(productId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/products/${productId}`, {
      method: "DELETE",
      requiresTenant: true,
    });
  },

  async getCostCoverageStats(): Promise<CostCoverageStats> {
    return apiClient<CostCoverageStats>("/products/stats/cost-coverage", {
      requiresTenant: true,
    });
  },

  async bulkUploadCosts(items: BulkCostItem[]): Promise<BulkCostUploadResult> {
    return apiClient<BulkCostUploadResult>("/products/bulk/costs", {
      method: "POST",
      body: JSON.stringify({ items }),
      requiresTenant: true,
    });
  },

  async addVariant(productId: string, variant: Partial<ProductVariant>): Promise<ProductVariant> {
    return apiClient<ProductVariant>(`/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(variant),
      requiresTenant: true,
    });
  },

  async deleteVariant(productId: string, variantId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
      requiresTenant: true,
    });
  },
};

