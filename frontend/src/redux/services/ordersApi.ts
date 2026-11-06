import { baseApi } from "../baseApi/baseApi";
import { Order, OrderDetail, OrderCreateInput, OrderStatus } from "@/types";

export interface OrdersFilterParams {
  status?: string;
  source?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], OrdersFilterParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.set("status", params.status);
        if (params?.source) queryParams.set("source", params.source);
        if (params?.search) queryParams.set("search", params.search);
        if (params?.start_date) queryParams.set("start_date", params.start_date);
        if (params?.end_date) queryParams.set("end_date", params.end_date);
        if (params?.skip !== undefined) queryParams.set("skip", String(params.skip));
        if (params?.limit !== undefined) queryParams.set("limit", String(params.limit));
        const qs = queryParams.toString();
        return `/orders${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Orders"],
    }),
    getOrderById: builder.query<OrderDetail, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Orders", id }],
    }),
    createOrder: builder.mutation<OrderDetail, OrderCreateInput>({
      query: (data) => ({
        url: "/orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders", "Products", "CRM", "Finance", "Analytics"],
    }),
    updateOrderStatus: builder.mutation<
      OrderDetail,
      { id: string; status: OrderStatus; reason?: string }
    >({
      query: ({ id, status, reason }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        body: { status, reason },
      }),
      invalidatesTags: [
        "Orders",
        "Products",
        "CRM",
        "Couriers",
        "Finance",
        "Analytics",
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
} = ordersApi;

