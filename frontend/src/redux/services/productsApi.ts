import { baseApi } from "../baseApi/baseApi";
import {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  CostCoverageStats,
} from "@/types";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], { search?: string; category?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.set("search", params.search);
        if (params?.category) queryParams.set("category", params.category);
        const qs = queryParams.toString();
        return `/products${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Products"],
    }),
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Products", id }],
    }),
    createProduct: builder.mutation<Product, ProductCreateInput>({
      query: (data) => ({
        url: "/products",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Products"],
    }),
    updateProduct: builder.mutation<
      Product,
      { id: string; data: ProductUpdateInput }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Products"],
    }),
    deleteProduct: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),
    getCostCoverage: builder.query<CostCoverageStats, void>({
      query: () => "/products/stats/cost-coverage",
      providesTags: ["Products"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCostCoverageQuery,
} = productsApi;

