import { apiClient } from "./api";
import {
  ExecutiveOverviewResponse,
  BleedingCampaignSummary,
  AIBriefing,
} from "@/types";

export const analyticsApi = {
  async getOverview(
    dateRange: string = "last_7_days",
    startDate?: string,
    endDate?: string
  ): Promise<ExecutiveOverviewResponse> {
    const params = new URLSearchParams();
    params.set("date_range", dateRange);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    return apiClient<ExecutiveOverviewResponse>(
      `/analytics/overview?${params.toString()}`,
      { requiresTenant: true }
    );
  },

  async getBleedingCampaigns(
    dateRange: string = "last_7_days"
  ): Promise<BleedingCampaignSummary[]> {
    return apiClient<BleedingCampaignSummary[]>(
      `/analytics/bleeding-campaigns?date_range=${dateRange}`,
      { requiresTenant: true }
    );
  },

  async dismissAlert(alertId: string): Promise<void> {
    await apiClient(`/analytics/alerts/${alertId}/dismiss`, {
      method: "PATCH",
      requiresTenant: true,
    });
  },

  async generateAIBriefing(
    dateRange: string = "last_7_days",
    focusTopic?: string
  ): Promise<AIBriefing> {
    return apiClient<AIBriefing>("/analytics/ai-briefing", {
      method: "POST",
      body: JSON.stringify({
        date_range: dateRange,
        focus_topic: focusTopic,
      }),
      requiresTenant: true,
    });
  },

  async getLatestAIBriefing(): Promise<AIBriefing | null> {
    try {
      return await apiClient<AIBriefing>("/analytics/ai-briefing/latest", {
        requiresTenant: true,
      });
    } catch {
      return null;
    }
  },
};

