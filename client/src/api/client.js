import axios from 'axios';

// Shared axios instance for the REST API. The base URL is the Vite env var or,
// in dev/prod, the same origin under /api (Vite proxies it in dev).

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL });

// Attach the JWT to every request. The token is written to localStorage by the
// auth store on login/register, so this stays in sync with the session.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  // Unwrap the server envelope: most endpoints return { data: ... }, so resolve
  // with res.data.data when present and otherwise the raw body.
  (res) => res.data?.data ?? res.data,
  (err) => {
    const status = err.response?.status;
    if (status === 401 && !/\/login/.test(window.location.pathname)) {
      // Stale / invalid token: clear and send user to login.
      localStorage.removeItem('token');
      localStorage.removeItem('servio-auth');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    const message = err.response?.data?.message || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);
