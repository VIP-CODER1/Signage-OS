import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

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

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !isRedirecting) {
      if (!originalRequest._retry) {
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('expires_at');

        const { store } = await import('../redux/store');
        store.dispatch({ type: 'auth/logoutAdmin/fulfilled' });

        setTimeout(() => {
          window.location.href = '/login';
          isRedirecting = false;
        }, 100);
      }
    }

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
