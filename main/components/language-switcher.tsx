"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Locale } from "@/lib/i18n/dictionary";
import { setLocaleCookie } from "@/app/actions/locale";

import { useI18n } from "@/lib/i18n/context";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  compact?: boolean;
}

export function LanguageSwitcher({ currentLocale, compact = false }: LanguageSwitcherProps) {
  const router = useRouter();
  const { isChangingLocale, setIsChangingLocale } = useI18n();
  const [isPending, startTransition] = useTransition();

  const loading = isPending || isChangingLocale;

  function handleToggle(newLocale: Locale) {
    if (newLocale === currentLocale || loading) return;

    setIsChangingLocale(true);
    startTransition(async () => {
      try {
        await setLocaleCookie(newLocale);
        router.refresh();
      } finally {
        // Small delay so refresh completes before hiding overlay
        setTimeout(() => {
          setIsChangingLocale(false);
        }, 300);
      }
    });
  }

  if (compact) {
    return (
      <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold select-none">
        <button
          type="button"
          onClick={() => handleToggle("id")}
          disabled={loading}
          className={`px-2 py-1 rounded-lg transition-all ${
            currentLocale === "id"
              ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          ID
        </button>
        <button
          type="button"
          onClick={() => handleToggle("en")}
          disabled={loading}
          className={`px-2 py-1 rounded-lg transition-all ${
            currentLocale === "en"
              ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold select-none">
      <Globe className="w-3.5 h-3.5 text-zinc-400 ml-1.5 shrink-0" />
      <button
        type="button"
        onClick={() => handleToggle("id")}
        disabled={loading}
        className={`px-2.5 py-1 rounded-lg transition-all ${
          currentLocale === "id"
            ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        ID
      </button>
      <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">|</span>
      <button
        type="button"
        onClick={() => handleToggle("en")}
        disabled={loading}
        className={`px-2.5 py-1 rounded-lg transition-all ${
          currentLocale === "en"
            ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        EN
      </button>
    </div>
  );
}
