import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeState>({ theme: 'light', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('procureai-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // SSR / restricted env
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('procureai-theme', theme);
    } catch {
      // silent
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    try {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    } catch {
      // silent
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
