import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginAdmin, logoutAdmin,
  clearAuthError,
} from '../authSlice';

vi.mock('../../../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('authSlice', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  test('initial state', () => {
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('loginAdmin.pending sets loading', () => {
    store.dispatch(loginAdmin.pending());
    const state = store.getState().auth;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  test('loginAdmin.fulfilled sets token and auth', () => {
    const fakeToken = 'fake-jwt-token';
    store.dispatch(loginAdmin.fulfilled({
      access_token: fakeToken,
      token_type: 'bearer',
      expires_at: '2026-07-22T14:23:14Z',
    }));
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(fakeToken);
    expect(state.loading).toBe(false);
  });

  test('loginAdmin.rejected sets error', () => {
    store.dispatch({ type: 'auth/login/rejected', payload: 'Invalid credentials' });
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  test('logoutAdmin clears auth state', () => {
    store.dispatch(loginAdmin.fulfilled({
      access_token: 'token', token_type: 'bearer', expires_at: '2026-07-22T14:23:14Z',
    }));
    store.dispatch(logoutAdmin.fulfilled());
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  test('clearAuthError clears error', () => {
    store.dispatch(loginAdmin.rejected({ payload: 'Error' }));
    store.dispatch(clearAuthError());
    expect(store.getState().auth.error).toBeNull();
  });
});
