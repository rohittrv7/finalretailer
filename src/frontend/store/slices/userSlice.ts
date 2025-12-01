import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface UserProfile {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  businessCategory: string;
  role: "owner";
  isActive: boolean;
  isTrial: boolean;
  trialEndsAt: string;
  isEmailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isFirstLogin: boolean;
  plan: string;
  createdAt: string;
}

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
  isLoading: true,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearUser: (state) => {
      state.profile = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});
export const authSelector = (state: RootState) => state.user;
export const { setUser, clearUser, setLoading } = userSlice.actions;
export default userSlice.reducer;
