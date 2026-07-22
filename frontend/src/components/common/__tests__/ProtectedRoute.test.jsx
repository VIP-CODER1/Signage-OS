import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../redux/slices/authSlice';
import ProtectedRoute from '../ProtectedRoute';

const renderWithAuth = (isAuthenticated, initialRoute = '/') => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { isAuthenticated, token: isAuthenticated ? 'token' : null } },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    </Provider>
  );
};

test('renders children when authenticated', () => {
  renderWithAuth(true);
  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});

test('redirects to /login when not authenticated', () => {
  renderWithAuth(false, '/displays');
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
});
