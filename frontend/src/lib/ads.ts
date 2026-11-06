import { apiClient } from "./api";
import {
  MetaAdAccount,
  ConnectAdAccountInput,
  MetaCampaign,
  CampaignPerformanceItem,
  AdsKPIStats,
} from "@/types";

export const adsApi = {
  async getAdAccounts(): Promise<MetaAdAccount[]> {
    return apiClient<MetaAdAccount[]>("/ads/accounts", {
      requiresTenant: true,
    });
  },

  async connectAdAccount(input: ConnectAdAccountInput): Promise<MetaAdAccount> {
    return apiClient<MetaAdAccount>("/ads/accounts/connect", {
      method: "POST",
      body: JSON.stringify(input),
      requiresTenant: true,
    });
  },

  async syncDailyInsights(): Promise<{ status: string; synced_records: number; message: string }> {
    return apiClient<{ status: string; synced_records: number; message: string }>(
      "/ads/sync/daily-insights",
      {
        method: "POST",
        requiresTenant: true,
      }
    );
  },

  async getCampaigns(): Promise<MetaCampaign[]> {
    return apiClient<MetaCampaign[]>("/ads/campaigns", {
      requiresTenant: true,
    });
  },

  async getCampaignPerformance(): Promise<CampaignPerformanceItem[]> {
    return apiClient<CampaignPerformanceItem[]>("/ads/performance", {
      requiresTenant: true,
    });
  },

  async getAdsKPIs(): Promise<AdsKPIStats> {
    return apiClient<AdsKPIStats>("/ads/stats/kpis", {
      requiresTenant: true,
    });
  },
};

