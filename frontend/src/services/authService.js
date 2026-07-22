import api from './api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data;
  },
  register: async (email, password) => {
    const { data } = await api.post('/api/auth/register', { email, password });
    return data;
  },
};
