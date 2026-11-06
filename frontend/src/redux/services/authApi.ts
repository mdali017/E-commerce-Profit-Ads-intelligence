import { baseApi } from "../baseApi/baseApi";
import { AuthResponse, User, Workspace, Membership } from "@/types";

export interface SignupRequest {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  currency?: string;
  timezone?: string;
  date_basis?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (credentials) => ({
        url: "/auth/signup",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    getMe: builder.query<User, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),
    getMyWorkspaces: builder.query<Membership[], void>({
      query: () => "/workspaces/me",
      providesTags: ["Workspace"],
    }),
    createWorkspace: builder.mutation<Workspace, CreateWorkspaceRequest>({
      query: (data) => ({
        url: "/workspaces",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Workspace"],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetMeQuery,
  useGetMyWorkspacesQuery,
  useCreateWorkspaceMutation,
} = authApi;

