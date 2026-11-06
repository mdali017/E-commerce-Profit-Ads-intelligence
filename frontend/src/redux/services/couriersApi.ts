import { baseApi } from "../baseApi/baseApi";
import {
  CourierShipment,
  CourierKPIStats,
  BookShipmentRequestInput,
  CourierCredential,
} from "@/types";

export const couriersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourierKPIs: builder.query<CourierKPIStats, void>({
      query: () => "/couriers/kpis",
      providesTags: ["Couriers"],
    }),
    getShipments: builder.query<
      CourierShipment[],
      { status?: string; provider?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.set("status", params.status);
        if (params?.provider) queryParams.set("provider", params.provider);
        const qs = queryParams.toString();
        return `/couriers/shipments${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Couriers"],
    }),
    getShipmentByOrderId: builder.query<CourierShipment, string>({
      query: (orderId) => `/couriers/shipments/order/${orderId}`,
      providesTags: (_res, _err, id) => [{ type: "Couriers", id }],
    }),
    bookShipment: builder.mutation<CourierShipment, BookShipmentRequestInput>({
      query: (body) => ({
        url: "/couriers/shipments/book",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Couriers", "Orders", "Analytics"],
    }),
    getCredentials: builder.query<CourierCredential[], void>({
      query: () => "/couriers/credentials",
      providesTags: ["Couriers"],
    }),
    saveCredential: builder.mutation<
      CourierCredential,
      Partial<CourierCredential>
    >({
      query: (body) => ({
        url: "/couriers/credentials",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Couriers"],
    }),
  }),
});

export const {
  useGetCourierKPIsQuery,
  useGetShipmentsQuery,
  useGetShipmentByOrderIdQuery,
  useBookShipmentMutation,
  useGetCredentialsQuery,
  useSaveCredentialMutation,
} = couriersApi;

