import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('careconnect_theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('careconnect_theme', isDark ? 'dark' : 'light'); } catch { /* */ }
  }, [isDark]);

  // Apply on mount from storage
  useEffect(() => {
    const saved = (() => { try { return localStorage.getItem('careconnect_theme'); } catch { return null; } })();
    if (saved === 'dark') { document.documentElement.classList.add('dark'); setIsDark(true); }
  }, []);

  return { isDark, toggleTheme: () => setIsDark((d) => !d) };
}
