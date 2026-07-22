import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

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
      .addCase(fetchDisplayById.pending, (state) => { state.loading = true; })
      .addCase(fetchDisplayById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDisplay = action.payload;
      })
      .addCase(fetchDisplayById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDisplay.fulfilled, (state) => {})
      .addCase(createDisplay.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateDisplay.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selectedDisplay?.id === action.payload.id) {
          state.selectedDisplay = action.payload;
        }
      })
      .addCase(updateDisplay.rejected, (state, action) => {
        state.error = action.payload;
      })
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
