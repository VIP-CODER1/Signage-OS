import api from './api';

export const displayService = {
  getDisplays: async (page = 1, limit = 10, search = '', status = '') => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const { data } = await api.get(`/api/displays?${params.toString()}`);
    return data;
  },

  getDisplayById: async (id) => {
    const { data } = await api.get(`/api/displays/${id}`);
    return data;
  },

  createDisplay: async (displayData) => {
    const { data } = await api.post('/api/displays', displayData);
    return data;
  },

  updateDisplay: async (id, displayData) => {
    const { data } = await api.put(`/api/displays/${id}`, displayData);
    return data;
  },

  deleteDisplay: async (id) => {
    await api.delete(`/api/displays/${id}`);
  },
};
