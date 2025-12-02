'use client';

import { ReactNode } from 'react';

/**
 * Theme Provider - Light Mode Only
 * 
 * This application uses light mode exclusively.
 * This provider exists to maintain compatibility with any components
 * that might expect a theme context, but it always returns 'light'.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  // Always return light theme
  return { 
    theme: 'light' as const,
    setTheme: () => {} // No-op since theme is locked
  };
}
