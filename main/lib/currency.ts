export const SUPPORTED_CURRENCIES = [
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

/**
 * Format currency dynamically based on currency code (e.g. IDR, USD, SGD, EUR)
 */
export function formatCurrencyValue(
  amount: number | string,
  currencyCode: string = "IDR",
  locale: string = "id"
): string {
  const numeric = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  const config = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];

  const targetLocale = locale === "en" ? "en-US" : config.locale || "id-ID";

  return new Intl.NumberFormat(targetLocale, {
    style: "currency",
    currency: config.code,
    maximumFractionDigits: config.code === "IDR" || config.code === "JPY" ? 0 : 2,
  }).format(numeric);
}
