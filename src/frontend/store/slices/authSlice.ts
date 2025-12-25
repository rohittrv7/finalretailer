import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile } from "@/electron/types/user";
import { Entitlements } from "@/frontend/types/license";

export interface AuthState {
  user: UserProfile | null;
  entitlements: Entitlements | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  entitlements: null,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (
      state,
      action: PayloadAction<{ user: UserProfile; entitlements: Entitlements }>
    ) => {
      state.user = action.payload.user;
      state.entitlements = action.payload.entitlements;
      state.loading = false;
      state.error = null;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.user = null;
      state.entitlements = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.entitlements = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setAuthData, setAuthLoading, setAuthError, clearAuth } =
  authSlice.actions;
export default authSlice.reducer;
