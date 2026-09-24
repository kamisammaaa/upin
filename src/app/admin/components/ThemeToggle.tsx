'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ initialTheme }: { initialTheme?: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const htmlTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    const localTheme = localStorage.getItem('theme') as 'dark' | 'light';
    const currentTheme = htmlTheme || localTheme || initialTheme || 'dark';
    setTheme(currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [initialTheme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
      document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-crypto-border bg-crypto-card/30" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 text-gray-400 hover:text-white hover:bg-crypto-card rounded-xl transition border border-transparent hover:border-crypto-border flex items-center justify-center cursor-pointer group"
      title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
      aria-label="Ganti Tema UI"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-500 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
