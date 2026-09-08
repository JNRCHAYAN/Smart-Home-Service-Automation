import { create } from 'zustand';

const KEY = 'servio-theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function readStored() {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
}

function resolve(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return media().matches ? 'dark' : 'light';
}

function apply(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function persist(mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}

let mediaListener = null;

export const useTheme = create((set, get) => ({
  mode: readStored(),
  theme: resolve(readStored()),
  setMode: (mode) => {
    persist(mode);
    const theme = resolve(mode);
    apply(theme);
    set({ mode, theme });

    // Keep the resolved theme in sync when the OS preference changes
    // while the user is in "system" mode.
    if (mediaListener) media().removeEventListener('change', mediaListener);
    mediaListener = () => {
      if (get().mode === 'system') {
        const t = resolve('system');
        apply(t);
        set({ theme: t });
      }
    };
    if (mode === 'system') media().addEventListener('change', mediaListener);
  },
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  }
}));

// Initial sync (the <html> class was already set in index.html to avoid FOUC).
apply(useTheme.getState().theme);
