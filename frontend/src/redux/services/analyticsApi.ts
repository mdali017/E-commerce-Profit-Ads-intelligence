import { baseApi } from "../baseApi/baseApi";
import {
  ExecutiveOverviewResponse,
  BleedingCampaignSummary,
  AIBriefing,
} from "@/types";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExecutiveOverview: builder.query<
      ExecutiveOverviewResponse,
      string | void
    >({
      query: (dateRange = "last_7_days") =>
        `/analytics/overview?date_range=${dateRange || "last_7_days"}`,
      providesTags: ["Analytics"],
    }),
    getBleedingCampaigns: builder.query<
      BleedingCampaignSummary[],
      string | void
    >({
      query: (dateRange = "last_7_days") =>
        `/analytics/bleeding-campaigns?date_range=${dateRange || "last_7_days"}`,
      providesTags: ["Analytics"],
    }),
    dismissAlert: builder.mutation<{ success: boolean; message: string }, string>({
      query: (alertId) => ({
        url: `/analytics/alerts/${alertId}/dismiss`,
        method: "PATCH",
      }),
      invalidatesTags: ["Analytics"],
    }),
    generateAIBriefing: builder.mutation<
      AIBriefing,
      { date_range?: string; focus_topic?: string } | void
    >({
      query: (body) => ({
        url: "/analytics/ai-briefing",
        method: "POST",
        body: body || { date_range: "last_7_days" },
      }),
      invalidatesTags: ["Analytics"],
    }),
    getLatestAIBriefing: builder.query<AIBriefing | null, void>({
      query: () => "/analytics/ai-briefing/latest",
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useGetExecutiveOverviewQuery,
  useGetBleedingCampaignsQuery,
  useDismissAlertMutation,
  useGenerateAIBriefingMutation,
  useGetLatestAIBriefingQuery,
} = analyticsApi;

