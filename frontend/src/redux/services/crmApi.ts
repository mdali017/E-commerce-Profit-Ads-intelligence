import { baseApi } from "../baseApi/baseApi";
import {
  Customer,
  CustomerDetail,
  CRMKPIStats,
  SMSMessageLog,
  TestSendSMSPayload,
} from "@/types";

export const crmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCRMKPIs: builder.query<CRMKPIStats, void>({
      query: () => "/crm/kpis",
      providesTags: ["CRM"],
    }),
    getCustomers: builder.query<
      Customer[],
      { search?: string; segment?: string; skip?: number; limit?: number } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.set("search", params.search);
        if (params?.segment) queryParams.set("segment", params.segment);
        if (params?.skip !== undefined) queryParams.set("skip", String(params.skip));
        if (params?.limit !== undefined) queryParams.set("limit", String(params.limit));
        const qs = queryParams.toString();
        return `/crm/customers${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["CRM"],
    }),
    getCustomerById: builder.query<CustomerDetail, string>({
      query: (id) => `/crm/customers/${id}`,
      providesTags: (_res, _err, id) => [{ type: "CRM", id }],
    }),
    sendTestSMS: builder.mutation<SMSMessageLog, TestSendSMSPayload>({
      query: (body) => ({
        url: "/crm/sms/test-send",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CRM"],
    }),
  }),
});

export const {
  useGetCRMKPIsQuery,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useSendTestSMSMutation,
} = crmApi;
