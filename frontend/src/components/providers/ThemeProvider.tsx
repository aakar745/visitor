'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always use light theme - locked to light mode
  const [theme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear any stored theme preference
    localStorage.removeItem('theme');
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    // Always apply light theme
    root.classList.remove('dark');
    root.classList.add('light');
  }, [mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  // setTheme is a no-op since theme is locked
  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

