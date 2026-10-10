import { describe, expect, it } from "bun:test";
import { formatCurrencyValue, getCurrencySymbol, SUPPORTED_CURRENCIES } from "../../main/lib/currency";

describe("Currency Module Unit Tests", () => {
  it("should format IDR correctly without fractions by default", () => {
    const formatted = formatCurrencyValue(50000, "IDR", "id");
    // Normalize non-breaking space if any
    const normalized = formatted.replace(/\s/g, " ");
    expect(normalized).toContain("Rp");
    expect(normalized).toContain("50.000");
  });

  it("should format USD correctly with decimals", () => {
    const formatted = formatCurrencyValue(123.45, "USD", "en");
    expect(formatted).toBe("$123.45");
  });

  it("should format EUR correctly with European locale", () => {
    const formatted = formatCurrencyValue(99.99, "EUR", "id");
    expect(formatted).toContain("€");
    expect(formatted).toContain("99,99");
  });

  it("should return valid currency symbols", () => {
    expect(getCurrencySymbol("IDR")).toBe("Rp");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("SGD")).toBe("S$");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("JPY")).toBe("¥");
    expect(getCurrencySymbol("MYR")).toBe("RM");
  });

  it("should fallback to IDR for unknown currency codes", () => {
    const symbol = getCurrencySymbol("UNKNOWN" as any);
    expect(symbol).toBe("Rp");

    const formatted = formatCurrencyValue(1000, "UNKNOWN" as any, "id");
    expect(formatted.replace(/\s/g, " ")).toContain("Rp");
  });
});
