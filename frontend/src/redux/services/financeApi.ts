import { baseApi } from "../baseApi/baseApi";
import { PnLSummary, PnLTimeSeriesPoint, OperatingExpense, ExpenseCreatePayload } from "@/types";

export const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPnLSummary: builder.query<
      PnLSummary,
      { start_date?: string; end_date?: string; date_basis?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.start_date) queryParams.set("start_date", params.start_date);
        if (params?.end_date) queryParams.set("end_date", params.end_date);
        if (params?.date_basis) queryParams.set("date_basis", params.date_basis);
        const qs = queryParams.toString();
        return `/finance/pnl${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Finance"],
    }),
    getPnLTimeseries: builder.query<
      PnLTimeSeriesPoint[],
      { start_date?: string; end_date?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.start_date) queryParams.set("start_date", params.start_date);
        if (params?.end_date) queryParams.set("end_date", params.end_date);
        const qs = queryParams.toString();
        return `/finance/pnl/timeseries${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Finance"],
    }),
    getExpenses: builder.query<OperatingExpense[], void>({
      query: () => "/finance/expenses",
      providesTags: ["Finance"],
    }),
    createExpense: builder.mutation<OperatingExpense, ExpenseCreatePayload>({
      query: (body) => ({
        url: "/finance/expenses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Finance", "Analytics"],
    }),
  }),
});

export const {
  useGetPnLSummaryQuery,
  useGetPnLTimeseriesQuery,
  useGetExpensesQuery,
  useCreateExpenseMutation,
} = financeApi;
