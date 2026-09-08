import { create } from 'zustand';

// Toast queue + imperative helpers. push() appends a toast and auto-dismisses
// it after 3.2s; ToastHost renders the queue. The module-level `toast` object
// lets non-component code fire a toast via useToast.getState().
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
