import { create } from 'zustand';

// Theme store. `mode` is the user's choice (light/dark/system, persisted under
// "servio-theme") and `theme` is the mode resolved to an actual light/dark.
// Applying the class is side-effected here on document.documentElement so the
// <html class="dark"> toggle and Tailwind's dark: variants stay in sync.

const KEY = 'servio-theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function readStored() {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
}

// "system" mode resolves against the OS colour-scheme media query; light/dark
// are returned verbatim.
function resolve(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return media().matches ? 'dark' : 'light';
}

// Toggle the .dark class and native color-scheme on <html> for this theme.
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
    // Only one document-level listener is ever registered; re-registering
    // replaces the previous one.
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
// Re-applying here reconciles the DOM with the resolved theme on store init
// (e.g. first module load / hot reload) before the app renders.
apply(useTheme.getState().theme);
