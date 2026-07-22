import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './redux/store';
import { checkTokenExpiry } from './redux/slices/authSlice';
import { ThemeModeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { NotificationProvider } from './components/common/NotificationProvider';
import './index.css';

store.dispatch(checkTokenExpiry());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeModeProvider>
        <CssBaseline />
        <ErrorBoundary>
          <NotificationProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </NotificationProvider>
        </ErrorBoundary>
      </ThemeModeProvider>
    </Provider>
  </React.StrictMode>
);
