import { api } from './client.js';

// Typed endpoint groups over the shared axios instance. Responses are already
// unwrapped by the client interceptor (see client.js), so callers get the
// domain payload directly.
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
  availability: (id) => api.get(`/requests/${id}/availability`),
  updateSlot: (id, payload) => api.patch(`/requests/${id}/slot`, payload),
  confirm: (id, providerId) => api.post(`/requests/${id}/confirm`, { providerId }),
  updateStatus: (id, status) => api.patch(`/requests/${id}/status`, { status }),
  cancel: (id) => api.post(`/requests/${id}/cancel`),
  reschedule: (id) => api.post(`/requests/${id}/reschedule`),
  feedback: (id, rating, comment) => api.post(`/requests/${id}/feedback`, { rating, comment }),
  invoice: (id) => api.get(`/requests/${id}/invoice`)
};

export const profileApi = {
  updateProfile: (payload) => api.put('/profile/me', payload),
  updateProviderSettings: (payload) => api.put('/profile/provider/settings', payload)
};

export const notificationApi = {
  list: () => api.get('/notifications')
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  providers: () => api.get('/admin/providers'),
  requests: () => api.get('/admin/requests'),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateProvider: (id, payload) => api.patch(`/admin/providers/${id}`, payload)
};

export const providerApi = {
  dashboard: () => api.get('/providers/dashboard'),
  schedule: () => api.get('/providers/schedule'),
  updateAvailability: (availability) => api.patch('/providers/availability', { availability })
};

export const chatApi = {
  send: (messages, stream = false) => api.post('/chat', { messages, stream }),
  // Streaming variant uses raw fetch (not the axios instance) because the SSE
  // response must be read incrementally from response.body; axios would buffer
  // the whole body before resolving.
  stream: async (messages) => {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('token');
    const res = await fetch(`${baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ messages, stream: true })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || 'Request failed');
    }
    return res;
  },
  health: () => api.get('/chat/health')
};

export const apiError = (err) => err?.message || 'Something went wrong';
