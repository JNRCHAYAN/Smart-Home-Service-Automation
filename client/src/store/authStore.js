import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/index.js';

export const useAuth = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      provider: null,
      login: async (username, password) => {
        const res = await authApi.login({ phone: username, password });
        localStorage.setItem('token', res.token);
        set({ token: res.token, user: res.user, provider: res.provider });
        return res;
      },
      register: async (payload) => {
        const res = await authApi.register(payload);
        localStorage.setItem('token', res.token);
        set({ token: res.token, user: res.user, provider: res.provider });
        return res;
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, provider: null });
      }
    }),
    { name: 'servio-auth' }
  )
);
