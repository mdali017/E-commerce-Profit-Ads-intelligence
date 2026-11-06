import { apiClient } from "./api";
import {
  OperatingExpense,
  ExpenseCreatePayload,
  PnLSummary,
  PnLTimeSeriesPoint,
  BreakEvenAnalysis,
  ProductPnLItem,
  CampaignPnLItem,
} from "@/types";

export interface ExpenseCategoryItem {
  key: string;
  label: string;
}

export const financeApi = {
  async getExpenseCategories(): Promise<ExpenseCategoryItem[]> {
    return apiClient<ExpenseCategoryItem[]>("/finance/expenses/categories", {
      requiresTenant: true,
    });
  },

  async getExpenses(
    startDate?: string,
    endDate?: string,
    category?: string
  ): Promise<OperatingExpense[]> {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (category) params.set("category", category);

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<OperatingExpense[]>(`/finance/expenses${query}`, {
      requiresTenant: true,
    });
  },

  async createExpense(payload: ExpenseCreatePayload): Promise<OperatingExpense> {
    return apiClient<OperatingExpense>("/finance/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
      requiresTenant: true,
    });
  },

  async deleteExpense(expenseId: string): Promise<void> {
    return apiClient<void>(`/finance/expenses/${expenseId}`, {
      method: "DELETE",
      requiresTenant: true,
    });
  },

  async getPnLSummary(
    startDate?: string,
    endDate?: string,
    dateBasis: string = "delivery_date"
  ): Promise<PnLSummary> {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    params.set("date_basis", dateBasis);

    return apiClient<PnLSummary>(`/finance/pnl/summary?${params.toString()}`, {
      requiresTenant: true,
    });
  },

  async getPnLTimeseries(
    startDate?: string,
    endDate?: string
  ): Promise<PnLTimeSeriesPoint[]> {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    return apiClient<PnLTimeSeriesPoint[]>(
      `/finance/pnl/timeseries?${params.toString()}`,
      {
        requiresTenant: true,
      }
    );
  },

  async getBreakEvenAnalysis(
    startDate?: string,
    endDate?: string
  ): Promise<BreakEvenAnalysis> {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    return apiClient<BreakEvenAnalysis>(
      `/finance/pnl/breakeven?${params.toString()}`,
      {
        requiresTenant: true,
      }
    );
  },

  async getProductPnL(
    startDate?: string,
    endDate?: string
  ): Promise<ProductPnLItem[]> {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    return apiClient<ProductPnLItem[]>(
      `/finance/pnl/by-product?${params.toString()}`,
      {
        requiresTenant: true,
      }
    );
  },

  async getCampaignPnL(
    startDate?: string,
    endDate?: string
  ): Promise<CampaignPnLItem[]> {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    return apiClient<CampaignPnLItem[]>(
      `/finance/pnl/by-campaign?${params.toString()}`,
      {
        requiresTenant: true,
      }
    );
  },

  getExportCsvUrl(
    startDate?: string,
    endDate?: string,
    dateBasis: string = "delivery_date"
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    params.set("date_basis", dateBasis);
    return `${baseUrl}/finance/pnl/export/csv?${params.toString()}`;
  },
};

