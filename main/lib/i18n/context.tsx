"use client";

import { createContext, useContext, ReactNode } from "react";
import { Locale, Dictionary, DEFAULT_LOCALE, getDictionary } from "./dictionary";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  dict: getDictionary(DEFAULT_LOCALE),
});

export function I18nProvider({
  children,
  locale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const dict = getDictionary(locale);

  return (
    <I18nContext.Provider value={{ locale, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
