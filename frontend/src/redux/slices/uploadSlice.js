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

export const downloadFailedRows = createAsyncThunk(
  'upload/downloadFailedRows',
  async (failedRows, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/displays/bulk-upload/failed-rows', {
        rows: failedRows,
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'failed_rows.xlsx';
      link.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      return rejectWithValue('Failed to download failed rows');
    }
  }
);

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
