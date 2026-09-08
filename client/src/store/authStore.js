import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/index.js';

// Session store. Persists { token, user, provider } under "servio-auth" so a
// refresh keeps the user signed in. The token is ALSO written to plain
// localStorage ("token") because the axios interceptor in api/client.js reads
// it there to set the Authorization header.
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
      },
      // Merge changes into the in-memory user so header/profile UI reflects
      // edits immediately (and persists across reloads via the store).
      setUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user }))
    }),
    { name: 'servio-auth' }
  )
);
