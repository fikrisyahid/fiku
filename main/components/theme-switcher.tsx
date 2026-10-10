"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/context";
import { useI18n } from "@/lib/i18n/context";

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = "" }: ThemeSwitcherProps) {
  const { resolvedTheme, setTheme, isPending } = useTheme();
  const { dict } = useI18n();

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={isPending}
      aria-label={dict.nav.themeToggle}
      title={isDark ? dict.nav.themeLight : dict.nav.themeDark}
      className={`relative p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-700 hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
}
