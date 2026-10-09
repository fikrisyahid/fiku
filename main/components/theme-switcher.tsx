"use client";

import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/lib/theme/context";
import { useI18n } from "@/lib/i18n/context";
import { Theme } from "@/lib/theme/types";

interface ThemeSwitcherProps {
  compact?: boolean;
  fullWidth?: boolean;
}

export function ThemeSwitcher({ compact = false, fullWidth = false }: ThemeSwitcherProps) {
  const { theme, setTheme, isPending } = useTheme();
  const { dict } = useI18n();

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: dict.nav.themeLight, icon: Sun },
    { value: "dark", label: dict.nav.themeDark, icon: Moon },
    { value: "system", label: dict.nav.themeSystem, icon: Laptop },
  ];

  if (compact) {
    return (
      <div
        role="group"
        aria-label={dict.nav.themeToggle}
        className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold select-none"
      >
        {options.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              disabled={isPending}
              aria-label={label}
              title={label}
              className={`p-1.5 rounded-lg transition-all ${
                isActive
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={dict.nav.themeToggle}
      className={`flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold select-none ${
        fullWidth ? "w-full justify-between" : ""
      }`}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            disabled={isPending}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
              fullWidth ? "flex-1 px-2" : "px-2.5"
            } ${
              isActive
                ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className={fullWidth ? "inline text-[11px]" : "hidden xl:inline"}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
