# Phase 5: Frontend Architecture & Redux State Design

> **Effort:** 6–8 hours (max) | **Depends on:** Phase 0 | **Agent:** reviewer

---

## Objective

Set up the React SPA architecture: Redux store with 3 slices (auth, display, upload), Axios interceptors for JWT, React Router routes, MUI v5 theme, and protected route guard. No page implementations yet — wiring only.

> **Spec reference:** §5, §5.1
> **UI plan:** See [Phase 6 §UI Plan](07-phase-frontend-pages.md#ui-plan-ui-planner-methodology) for full component breakdown, interaction flows, a11y, responsive behavior, and edge cases.

---

## 5.1 Redux Store — `frontend/src/redux/store.js`

```js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import displayReducer from './slices/displaySlice';
import uploadReducer from './slices/uploadSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    displays: displayReducer,
    upload: uploadReducer,
  },
  devTools: import.meta.env.DEV,
});
```

---

## 5.2 Auth Slice — `frontend/src/redux/slices/authSlice.js`

> **Spec §5.1.1** — State: `{ isAuthenticated, token, user, loading, error }`

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

// ── Initial State (match spec §5.1) ──
const initialState = {
  isAuthenticated: !!localStorage.getItem('token'),
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null,
};

// ── Thunks ──
export const loginAdmin = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(username, password);
      // { access_token, token_type, expires_at }
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('expires_at', response.expires_at);
      return response;
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed';
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

// ── Slice ──
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
        state.user = action.payload.username || null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
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
```

---

## 5.3 Display Slice — `frontend/src/redux/slices/displaySlice.js`

> **Spec §5.1.2** — State: `{ items, total, currentPage, limit, searchQuery, selectedDisplay, loading, error }`

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Initial State ──
const initialState = {
  items: [],
  total: 0,
  currentPage: 1,
  limit: 10,
  searchQuery: '',
  statusFilter: '',
  selectedDisplay: null,
  loading: false,
  error: null,
};

// ── Thunks ──
export const fetchDisplays = createAsyncThunk(
  'displays/fetchList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/displays', { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load displays');
    }
  }
);

export const fetchDisplayById = createAsyncThunk(
  'displays/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/displays/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load display');
    }
  }
);

export const createDisplay = createAsyncThunk(
  'displays/create',
  async (displayData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/displays', displayData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create display');
    }
  }
);

export const updateDisplay = createAsyncThunk(
  'displays/update',
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/displays/${id}`, updateData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update display');
    }
  }
);

export const deleteDisplay = createAsyncThunk(
  'displays/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/displays/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete display');
    }
  }
);

// ── Slice ──
const displaySlice = createSlice({
  name: 'displays',
  initialState,
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage(state, action) { state.currentPage = action.payload; },
    setLimit(state, action) { state.limit = action.payload; },
    clearSelectedDisplay(state) { state.selectedDisplay = null; },
    clearDisplayError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchDisplays
      .addCase(fetchDisplays.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDisplays.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchDisplays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchDisplayById
      .addCase(fetchDisplayById.pending, (state) => { state.loading = true; })
      .addCase(fetchDisplayById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDisplay = action.payload;
      })
      .addCase(fetchDisplayById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createDisplay
      .addCase(createDisplay.fulfilled, (state) => {
        // Trigger re-fetch — handled by DisplaysPage effect
      })
      .addCase(createDisplay.rejected, (state, action) => {
        state.error = action.payload;
      })
      // updateDisplay
      .addCase(updateDisplay.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selectedDisplay?.id === action.payload.id) {
          state.selectedDisplay = action.payload;
        }
      })
      .addCase(updateDisplay.rejected, (state, action) => {
        state.error = action.payload;
      })
      // deleteDisplay
      .addCase(deleteDisplay.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.total -= 1;
        if (state.selectedDisplay?.id === action.payload) {
          state.selectedDisplay = null;
        }
      })
      .addCase(deleteDisplay.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setSearchQuery, setStatusFilter, setCurrentPage,
  setLimit, clearSelectedDisplay, clearDisplayError,
} = displaySlice.actions;
export default displaySlice.reducer;
```

---

## 5.4 Upload Slice — `frontend/src/redux/slices/uploadSlice.js`

> **Spec §5.1.3** — State: `{ previewData, validationSummary, isValidating, isCommitting, uploadError, failedRowsFile }`

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  previewData: [],
  validationSummary: null,
  isValidating: false,
  isCommitting: false,
  uploadError: null,
  failedRowsFile: null,
  commitResult: null,
};

// ── Thunks ──
export const validateExcelFile = createAsyncThunk(
  'upload/validate',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/api/displays/bulk-upload/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Validation failed');
    }
  }
);

export const commitBulkUpload = createAsyncThunk(
  'upload/commit',
  async (validRows, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/displays/bulk-upload/commit', {
        rows: validRows,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Commit failed');
    }
  }
);

export const downloadTemplate = createAsyncThunk(
  'upload/downloadTemplate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/displays/bulk-upload/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'display_template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      return rejectWithValue('Failed to download template');
    }
  }
);

// ── Slice ──
const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    clearUploadState(state) {
      state.previewData = [];
      state.validationSummary = null;
      state.failedRowsFile = null;
      state.uploadError = null;
      state.commitResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateExcelFile.pending, (state) => {
        state.isValidating = true;
        state.uploadError = null;
      })
      .addCase(validateExcelFile.fulfilled, (state, action) => {
        state.isValidating = false;
        state.previewData = action.payload.preview;
        state.validationSummary = action.payload.summary;
      })
      .addCase(validateExcelFile.rejected, (state, action) => {
        state.isValidating = false;
        state.uploadError = action.payload;
      })
      .addCase(commitBulkUpload.pending, (state) => { state.isCommitting = true; })
      .addCase(commitBulkUpload.fulfilled, (state, action) => {
        state.isCommitting = false;
        state.commitResult = action.payload;
      })
      .addCase(commitBulkUpload.rejected, (state, action) => {
        state.isCommitting = false;
        state.uploadError = action.payload;
      });
  },
});

export const { clearUploadState } = uploadSlice.actions;
export default uploadSlice.reducer;
```

---

## 5.5 Axios Instance & Interceptors — `frontend/src/services/api.js`

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: Attach JWT ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 (token expired) ──
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !isRedirecting) {
      // Token expired or invalid
      if (!originalRequest._retry) {
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('expires_at');

        // Dispatch logout and redirect to login
        const { store } = await import('../redux/store'); // lazy import
        store.dispatch({ type: 'auth/logoutAdmin/fulfilled' });

        // Small delay to prevent flash redirect loops
        setTimeout(() => {
          window.location.href = '/login';
          isRedirecting = false;
        }, 100);
      }
    }

    // ── Retry logic for 503 (DB outage) ── Spec §7
    if (error.response?.status === 503) {
      error.config._retryCount = error.config._retryCount || 0;
      if (error.config._retryCount < 3) {
        error.config._retryCount++;
        return new Promise((resolve) => {
          setTimeout(() => resolve(api(error.config)), 1000 * error.config._retryCount);
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 5.6 Auth Service — `frontend/src/services/authService.js`

```js
import api from './api';

export const authService = {
  login: async (username, password) => {
    const { data } = await api.post('/api/auth/login', {
      username,
      password,
    });
    return data;
  },
};
```

---

## 5.7 MUI Theme — `frontend/src/theme.js`

```js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#2F5496' },
    secondary: { main: '#FF6B35' },
    error: { main: '#D32F2F' },
    background: { default: '#F5F5F5' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
      },
    },
  },
});
```

---

## 5.8 App Entry — `frontend/src/main.jsx`

```jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './redux/store';
import { checkTokenExpiry } from './redux/slices/authSlice';
import { theme } from './theme';
import './index.css';

// Check for expired token on app startup
store.dispatch(checkTokenExpiry());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
```

---

## 5.9 App Router — `root/src/App.jsx`

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import DisplaysPage from './pages/DisplaysPage';
import DisplayDetailPage from './pages/DisplayDetailPage';
import BulkUploadPage from './pages/BulkUploadPage';
import ProtectedRoute from './components/common/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/displays"
        element={
          <ProtectedRoute>
            <DisplaysPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/displays/:id"
        element={
          <ProtectedRoute>
            <DisplayDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/displays/upload"
        element={
          <ProtectedRoute>
            <BulkUploadPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/displays" replace />} />
      <Route path="*" element={<Navigate to="/displays" replace />} />
    </Routes>
  );
}

// On app mount, check if stored token is already expired:
// useEffect(() => {
//   store.dispatch(checkTokenExpiry());
// }, []);
// Wire this in main.jsx or App.jsx mount effect
```

---

## 5.10 Redux State Tree (from spec §5.1)

```
store
├── auth: {
│   isAuthenticated: false,
│   token: null,
│   user: null,
│   loading: false,
│   error: null
│ }
├── displays: {
│   items: [],
│   total: 0,
│   currentPage: 1,
│   limit: 10,
│   searchQuery: "",
│   statusFilter: "",
│   selectedDisplay: null,
│   loading: false,
│   error: null
│ }
└── upload: {
    previewData: [],
    validationSummary: null,
    isUploading: false,
    isCommitting: false,
    uploadError: null,
    failedRowsFile: null
  }
```

---

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] Redux DevTools shows `auth`, `displays`, `upload` slices initialized
- [ ] Login → token stored in localStorage → Axios attaches it to requests
- [ ] Invalid/expired token → 401 interceptor clears auth → redirects to /login
- [ ] MUI theme applies to components
- [ ] Protected routes redirect to /login when unauthenticated
- [ ] Direct URL access `/displays` works (after login)
- [ ] `/` redirects to `/displays`

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `reviewer` | Verify Redux slice shapes match spec §5.1 exactly — field names, types, default values — every mismatch gets flagged |
| `researcher` | Check latest Redux Toolkit patterns for `createAsyncThunk` + error handling best practices |