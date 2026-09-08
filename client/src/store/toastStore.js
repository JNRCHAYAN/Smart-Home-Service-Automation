import { create } from 'zustand';

let idSeq = 0;

export const useToast = create((set) => ({
  toasts: [],
  push: (message, type = 'success') => {
    const id = ++idSeq;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}));

export const toast = {
  success: (m) => useToast.getState().push(m, 'success'),
  error: (m) => useToast.getState().push(m, 'error'),
  info: (m) => useToast.getState().push(m, 'info')
};
