import { configureStore } from '@reduxjs/toolkit';
import uploadReducer, {
  validateExcelFile, commitBulkUpload, clearUploadState,
} from '../uploadSlice';

vi.mock('../../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('uploadSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { upload: uploadReducer },
    });
  });

  test('initial state', () => {
    const state = store.getState().upload;
    expect(state.previewData).toEqual([]);
    expect(state.isValidating).toBe(false);
    expect(state.isCommitting).toBe(false);
  });

  test('validateExcelFile.pending sets isValidating', () => {
    store.dispatch(validateExcelFile.pending());
    expect(store.getState().upload.isValidating).toBe(true);
  });

  test('validateExcelFile.fulfilled sets preview and summary', () => {
    const payload = {
      is_valid: true,
      summary: { total_rows: 5, valid_rows: 5, failed_rows: 0 },
      preview: [{ row_number: 2, is_valid: true }],
    };
    store.dispatch(validateExcelFile.fulfilled(payload));
    const state = store.getState().upload;
    expect(state.isValidating).toBe(false);
    expect(state.previewData).toEqual(payload.preview);
    expect(state.validationSummary).toEqual(payload.summary);
  });

  test('commitBulkUpload.fulfilled sets commitResult', () => {
    const payload = { inserted: 5, failed: 0, total: 5, errors: [] };
    store.dispatch(commitBulkUpload.fulfilled(payload));
    expect(store.getState().upload.commitResult).toEqual(payload);
    expect(store.getState().upload.isCommitting).toBe(false);
  });

  test('clearUploadState resets all upload state', () => {
    store.dispatch(validateExcelFile.fulfilled({
      preview: [{}], summary: { total_rows: 1, valid_rows: 1, failed_rows: 0 },
    }));
    store.dispatch(clearUploadState());
    const state = store.getState().upload;
    expect(state.previewData).toEqual([]);
    expect(state.validationSummary).toBeNull();
  });
});
