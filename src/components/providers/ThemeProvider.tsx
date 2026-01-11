'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeConfig = __APP_CONFIG__.ui.theme;
  const baseTheme = themeConfig?.base || 'system';
  const colors = themeConfig?.colors;

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // システム設定を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateResolvedTheme = () => {
      if (baseTheme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(baseTheme as 'light' | 'dark');
      }
    };

    updateResolvedTheme();
    mediaQuery.addEventListener('change', updateResolvedTheme);
    
    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [baseTheme]);

  useEffect(() => {
    const root = document.documentElement;
    
    // ベーステーマをhtml要素に適用
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // カスタムカラーをCSS変数として適用
    if (colors?.background) {
      root.style.setProperty('--custom-background', colors.background);
    } else {
      root.style.removeProperty('--custom-background');
    }

    if (colors?.user_bubble) {
      root.style.setProperty('--custom-user-bubble', colors.user_bubble);
    } else {
      root.style.removeProperty('--custom-user-bubble');
    }

    if (colors?.user_bubble_text) {
      root.style.setProperty('--custom-user-bubble-text', colors.user_bubble_text);
    } else {
      root.style.removeProperty('--custom-user-bubble-text');
    }

    if (colors?.assistant_bubble) {
      root.style.setProperty('--custom-assistant-bubble', colors.assistant_bubble);
    } else {
      root.style.removeProperty('--custom-assistant-bubble');
    }

    if (colors?.assistant_bubble_text) {
      root.style.setProperty('--custom-assistant-bubble-text', colors.assistant_bubble_text);
    } else {
      root.style.removeProperty('--custom-assistant-bubble-text');
    }
  }, [resolvedTheme, colors]);

  return (
    <ThemeContext.Provider value={{ theme: baseTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
