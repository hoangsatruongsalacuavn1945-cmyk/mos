import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode; // 'light' | 'dark' | 'auto'
  effectiveTheme: 'light' | 'dark'; // actual active theme
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'mos_theme_mode';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyThemeToDocument(theme: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
}

const initialSavedMode: ThemeMode = (typeof window !== 'undefined' 
  ? (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'auto' 
  : 'auto');

const initialEffective = initialSavedMode === 'auto' ? getSystemTheme() : initialSavedMode;
applyThemeToDocument(initialEffective);

export const useThemeStore = create<ThemeState>((set, get) => {
  // Listen to system preference changes when in auto mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const currentMode = get().mode;
      if (currentMode === 'auto') {
        const newEffective = e.matches ? 'dark' : 'light';
        applyThemeToDocument(newEffective);
        set({ effectiveTheme: newEffective });
      }
    });
  }

  return {
    mode: initialSavedMode,
    effectiveTheme: initialEffective,

    setMode: (newMode: ThemeMode) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newMode);
      }
      const effective = newMode === 'auto' ? getSystemTheme() : newMode;
      applyThemeToDocument(effective);
      set({ mode: newMode, effectiveTheme: effective });
    },

    toggleTheme: () => {
      const current = get().mode;
      // Cycle: light -> dark -> auto -> light
      let next: ThemeMode = 'dark';
      if (current === 'light') next = 'dark';
      else if (current === 'dark') next = 'auto';
      else next = 'light';

      get().setMode(next);
    },
  };
});
