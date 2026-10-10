"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Locale } from "@/lib/i18n/dictionary";
import { setLocaleCookie } from "@/app/actions/locale";
import { useI18n } from "@/lib/i18n/context";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export function LanguageSwitcher({ currentLocale, className = "" }: LanguageSwitcherProps) {
  const router = useRouter();
  const { isChangingLocale, setIsChangingLocale } = useI18n();
  const [isPending, startTransition] = useTransition();

  const loading = isPending || isChangingLocale;
  const nextLocale: Locale = currentLocale === "id" ? "en" : "id";

  function handleToggle() {
    if (loading) return;

    setIsChangingLocale(true);
    startTransition(async () => {
      try {
        await setLocaleCookie(nextLocale);
        router.refresh();
      } finally {
        setTimeout(() => {
          setIsChangingLocale(false);
        }, 300);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={`Switch language to ${nextLocale.toUpperCase()}`}
      title={currentLocale === "id" ? "Ganti ke Bahasa Inggris (EN)" : "Switch to Indonesian (ID)"}
      className={`px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${className}`}
    >
      <span className={currentLocale === "id" ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-zinc-400"}>
        ID
      </span>
      <span className="text-zinc-300 dark:text-zinc-600 text-[10px]">/</span>
      <span className={currentLocale === "en" ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-zinc-400"}>
        EN
      </span>
    </button>
  );
}
