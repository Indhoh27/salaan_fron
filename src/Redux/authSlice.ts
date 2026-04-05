import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AuthState, LoginRequest } from "../Interface";
import { loginRequest } from "../services/api";
import { apiFetch, getApiBaseUrl } from "../services/apiClient";

const initialState: AuthState = {
  loading: false,
  restorePending: true,
  error: null,
  user: null,
};

export const restoreSession = createAsyncThunk("auth/restore", async (_, { rejectWithValue }) => {
  const res = await apiFetch("/auth/me", { method: "GET" });
  if (!res.ok) {
    return rejectWithValue("no session");
  }
  const data = (await res.json()) as { user: NonNullable<AuthState["user"]> };
  return data.user;
});

export const logoutUser = createAsyncThunk("auth/logoutApi", async (_, { dispatch }) => {
  await fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
  dispatch(logout());
});

export const loginUser = createAsyncThunk("auth/login", async (payload: LoginRequest, { rejectWithValue }) => {
  try {
    const response = await loginRequest(payload);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      state.restorePending = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.restorePending = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.restorePending = false;
        state.user = action.payload;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.restorePending = false;
        state.user = null;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.restorePending = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
