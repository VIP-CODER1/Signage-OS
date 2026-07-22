import { configureStore } from '@reduxjs/toolkit';
import displayReducer, {
  fetchDisplays, createDisplay, updateDisplay, deleteDisplay,
  setSearchQuery, setStatusFilter, setCurrentPage,
} from '../displaySlice';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('displaySlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { displays: displayReducer },
    });
  });

  test('initial state', () => {
    const state = store.getState().displays;
    expect(state.items).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.currentPage).toBe(1);
    expect(state.loading).toBe(false);
    expect(state.selectedDisplay).toBeNull();
  });

  test('setSearchQuery resets page to 1', () => {
    store.dispatch(setCurrentPage(3));
    store.dispatch(setSearchQuery('lobby'));
    const state = store.getState().displays;
    expect(state.searchQuery).toBe('lobby');
    expect(state.currentPage).toBe(1);
  });

  test('setStatusFilter resets page to 1', () => {
    store.dispatch(setCurrentPage(2));
    store.dispatch(setStatusFilter('ACTIVE'));
    expect(store.getState().displays.statusFilter).toBe('ACTIVE');
    expect(store.getState().displays.currentPage).toBe(1);
  });

  test('fetchDisplays.fulfilled updates items and total', () => {
    const payload = {
      data: [{ id: '1', name: 'Test' }],
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    };
    store.dispatch(fetchDisplays.fulfilled(payload));
    const state = store.getState().displays;
    expect(state.items).toHaveLength(1);
    expect(state.total).toBe(1);
    expect(state.loading).toBe(false);
  });

  test('deleteDisplay.fulfilled removes item', () => {
    store.dispatch(fetchDisplays.fulfilled({
      data: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }],
      pagination: { total: 2, page: 1, limit: 10, pages: 1 },
    }));
    store.dispatch(deleteDisplay.fulfilled('1'));
    expect(store.getState().displays.items).toHaveLength(1);
    expect(store.getState().displays.total).toBe(1);
  });
});
