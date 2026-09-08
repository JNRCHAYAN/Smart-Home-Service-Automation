import { api } from './client.js';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me')
};

export const servicesApi = {
  list: () => api.get('/services'),
  providers: () => api.get('/providers')
};

export const requestApi = {
  create: (payload) => api.post('/requests', payload),
  list: () => api.get('/requests'),
  get: (id) => api.get(`/requests/${id}`),
  matches: (id) => api.get(`/requests/${id}/matches`),
  confirm: (id, providerId) => api.post(`/requests/${id}/confirm`, { providerId }),
  updateStatus: (id, status) => api.patch(`/requests/${id}/status`, { status }),
  cancel: (id) => api.post(`/requests/${id}/cancel`),
  feedback: (id, rating, comment) => api.post(`/requests/${id}/feedback`, { rating, comment })
};

export const providerApi = {
  dashboard: () => api.get('/providers/dashboard'),
  schedule: () => api.get('/providers/schedule'),
  updateAvailability: (availability) => api.patch('/providers/availability', { availability })
};

export const apiError = (err) => err?.message || 'Something went wrong';
