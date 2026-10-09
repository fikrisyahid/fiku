import { cookies } from "next/headers";
import { Locale, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, getDictionary, Dictionary } from "./dictionary";

/**
 * Get active locale on Server Components via cookies
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (rawLocale === "en" || rawLocale === "id") {
    return rawLocale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Get active dictionary on Server Components
 */
export async function getServerDictionary(): Promise<Dictionary> {
  const locale = await getServerLocale();
  return getDictionary(locale);
}
