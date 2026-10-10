/**
 * Category Icon Helper & Preset Icons
 * Provides icon presets for income and expense categories,
 * as well as a fallback resolver for categories with missing or null icons.
 */

export const DEFAULT_INCOME_ICON = "💰";
export const DEFAULT_EXPENSE_ICON = "💸";
export const DEFAULT_CATEGORY_FALLBACK_ICON = "🏷️";

// Standard preset icons grouped by category type
export const PRESET_CATEGORY_ICONS = {
  expense: [
    "🍜", "🍔", "☕", "🛒", "🛍️", "🚗", "🛵", "⛽", "🏠", "💡",
    "⚡", "📱", "💊", "🏥", "🍿", "🎬", "🎮", "✈️", "📚", "👕",
    "🎁", "🐾", "✂️", "🏋️", "👶", "💸", "🏷️"
  ],
  income: [
    "💰", "💼", "💵", "✨", "📈", "🪙", "🏦", "💳", "🎁", "🎉",
    "🤝", "🏆", "📦", "💻", "🏷️"
  ],
};

// Known category name keywords to infer a default icon if missing
const CATEGORY_KEYWORD_ICONS: Record<string, string> = {
  // Expense
  gaji: "💼",
  salary: "💼",
  bonus: "✨",
  freelance: "✨",
  investasi: "📈",
  investment: "📈",
  bunga: "📈",
  makan: "🍜",
  minum: "🍜",
  food: "🍜",
  dining: "🍜",
  transport: "🛵",
  bensin: "⛽",
  belanja: "🛒",
  shopping: "🛒",
  groceries: "🛒",
  kebutuhan: "🛒",
  rumah: "🏠",
  home: "🏠",
  tagihan: "⚡",
  utilitas: "⚡",
  langganan: "⚡",
  bills: "⚡",
  kesehatan: "💊",
  health: "💊",
  obat: "💊",
  hiburan: "🍿",
  rekreasi: "🍿",
  entertainment: "🍿",
  pendidikan: "📚",
  education: "📚",
  cicilan: "💳",
  debt: "💳",
  hadiah: "🎁",
  gift: "🎁",
};

/**
 * Returns a robust icon for any category object or name,
 * ensuring seamless fallback compatibility for existing or older data.
 */
export function getCategoryIcon(
  category?: { icon?: string | null; name?: string | null; type?: string | null } | null
): string {
  if (!category) return DEFAULT_CATEGORY_FALLBACK_ICON;

  // 1. If category has a valid icon string, use it
  if (category.icon && typeof category.icon === "string" && category.icon.trim()) {
    return category.icon.trim();
  }

  // 2. Try inferring from category name keywords
  if (category.name) {
    const lower = category.name.toLowerCase();
    for (const [kw, icon] of Object.entries(CATEGORY_KEYWORD_ICONS)) {
      if (lower.includes(kw)) {
        return icon;
      }
    }
  }

  // 3. Fallback based on type
  if (category.type === "income") {
    return DEFAULT_INCOME_ICON;
  }
  if (category.type === "expense") {
    return DEFAULT_EXPENSE_ICON;
  }

  return DEFAULT_CATEGORY_FALLBACK_ICON;
}
