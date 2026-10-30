import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from './cn';

export default function ThemeToggle({ className, showLabel = false }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('obs_theme', next ? 'dark' : 'light'); } catch { /* storage unavailable */ }
    setDark(next);
  };

  const Icon = dark ? Sun : Moon;
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-fg-muted cursor-pointer',
        'transition-colors hover:bg-surface-hover hover:text-fg',
        className,
      )}
    >
      <Icon className="size-4" />
      {showLabel && <span>{dark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
