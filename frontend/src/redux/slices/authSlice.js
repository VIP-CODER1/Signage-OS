import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

const initialState = {
  isAuthenticated: !!localStorage.getItem('token'),
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null,
};

export const loginAdmin = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('expires_at', response.expires_at);
      return response;
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed';
      return rejectWithValue(detail);
    }
  }
);

export const registerAdmin = createAsyncThunk(
  'auth/register',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.register(email, password);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('expires_at', response.expires_at);
      return response;
    } catch (err) {
      const detail = err.response?.data?.detail || 'Registration failed';
      return rejectWithValue(detail);
    }
  }
);

export const logoutAdmin = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('expires_at');
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    checkTokenExpiry(state) {
      const expiresAt = localStorage.getItem('expires_at');
      if (expiresAt && new Date(expiresAt) < new Date()) {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.user = action.payload.username || action.payload.email || null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(registerAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.user = action.payload.username || action.payload.email || null;
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = null;
      });
  },
});

export const { clearAuthError, checkTokenExpiry } = authSlice.actions;
export default authSlice.reducer;
