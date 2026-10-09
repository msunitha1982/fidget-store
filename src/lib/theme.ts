import { useCallback, useEffect, useState } from 'react';
import { readJSON, writeJSON } from './storage';

export type Theme = 'light' | 'dark';

/** Must match the key read by the inline script in index.html (prevents a flash on load). */
const KEY = 'fs.theme';
const META_COLOR: Record<Theme, string> = { light: '#ee6969', dark: '#000000' };

const systemTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/** The visitor's explicit choice, or null when following the system setting. */
const storedTheme = (): Theme | null => {
  const t = readJSON<unknown>(KEY, null);
  return t === 'light' || t === 'dark' ? t : null;
};

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[theme]);
}

/** Current theme + a toggle. Follows the OS setting until the visitor picks one. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) || storedTheme() || systemTheme());

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystem = () => {
      if (!storedTheme()) setTheme(systemTheme());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setTheme(storedTheme() ?? systemTheme());
    };
    mq?.addEventListener('change', onSystem);
    window.addEventListener('storage', onStorage);
    return () => {
      mq?.removeEventListener('change', onSystem);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      writeJSON(KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
