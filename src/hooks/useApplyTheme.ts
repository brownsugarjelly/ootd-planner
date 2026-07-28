'use client';

import { useEffect } from 'react';
import type { AppSettings } from '@/lib/types';

export function useApplyTheme(settings: AppSettings) {
  useEffect(() => {
    const root = document.documentElement;

    function applyDark(isDark: boolean) {
      root.classList.toggle('dark', isDark);
    }

    if (settings.theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mql.matches);
      const listener = (e: MediaQueryListEvent) => applyDark(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
    applyDark(settings.theme === 'dark');
    return undefined;
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('no-animations', !settings.animationsEnabled);
  }, [settings.animationsEnabled]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
  }, [settings.highContrast]);
}
