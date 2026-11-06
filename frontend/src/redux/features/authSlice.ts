import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Workspace } from "@/types";
import { authStorage, UserProfile } from "@/lib/auth";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  activeTenantId: string | null;
  activeTenant: Workspace | null;
  isAuthenticated: boolean;
}

// Client-safe initial state loading from localStorage
const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      activeTenantId: null,
      activeTenant: null,
      isAuthenticated: false,
    };
  }

  const token = authStorage.getToken();
  const user = authStorage.getUser();
  const activeTenantId = authStorage.getActiveTenantId();

  return {
    user: user || null,
    token: token || null,
    activeTenantId: activeTenantId || null,
    activeTenant: null,
    isAuthenticated: !!token,
  };
};

const initialState: AuthState = getInitialState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: UserProfile;
        token: string;
        tenantId?: string;
      }>
    ) => {
      const { user, token, tenantId } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      authStorage.setToken(token);
      authStorage.setUser(user);

      if (tenantId) {
        state.activeTenantId = tenantId;
        authStorage.setActiveTenantId(tenantId);
      }
    },
    setActiveTenant: (
      state,
      action: PayloadAction<{ tenantId: string; tenant?: Workspace }>
    ) => {
      state.activeTenantId = action.payload.tenantId;
      if (action.payload.tenant) {
        state.activeTenant = action.payload.tenant;
      }
      authStorage.setActiveTenantId(action.payload.tenantId);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.activeTenantId = null;
      state.activeTenant = null;
      state.isAuthenticated = false;
      authStorage.clearAuth();
    },
  },
});

export const { setCredentials, setActiveTenant, logout } = authSlice.actions;
export default authSlice.reducer;
