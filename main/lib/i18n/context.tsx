"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Locale, Dictionary, DEFAULT_LOCALE, getDictionary } from "./dictionary";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
  isChangingLocale: boolean;
  setIsChangingLocale: (loading: boolean) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  dict: getDictionary(DEFAULT_LOCALE),
  isChangingLocale: false,
  setIsChangingLocale: () => {},
});

export function I18nProvider({
  children,
  locale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const [isChangingLocale, setIsChangingLocale] = useState(false);
  const dict = getDictionary(locale);

  return (
    <I18nContext.Provider
      value={{
        locale,
        dict,
        isChangingLocale,
        setIsChangingLocale,
      }}
    >
      {/* Top Progress Bar & Blur Overlay when switching language */}
      {isChangingLocale && (
        <div className="fixed inset-0 z-[99999] pointer-events-none select-none">
          {/* Top Green Progress Bar */}
          <div className="fixed top-0 left-0 right-0 h-1 bg-emerald-500/20 z-[100000] overflow-hidden">
            <div className="h-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse w-full origin-left" />
          </div>
          {/* Subtle backdrop overlay with spinner badge */}
          <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-[2px] transition-all flex items-center justify-center pointer-events-auto">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <span>{locale === "id" ? "Mengganti bahasa..." : "Switching language..."}</span>
            </div>
          </div>
        </div>
      )}
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
