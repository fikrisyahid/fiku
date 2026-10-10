import { describe, expect, it } from "bun:test";
import {
  parseNominal,
  normalizeText,
  matchesAccount,
  extractWalletAndDescription,
  findMatchingCategory,
  parseTransferParams,
} from "../../main/lib/smart-input-parser";

describe("Smart Input Integration & Parser Tests", () => {
  const dummyAccounts = [
    { id: "acc-1", name: "Dompet Tunai", type: "cash", isDefault: true },
    { id: "acc-2", name: "BCA Utama", type: "bank", isDefault: false },
    { id: "acc-3", name: "Mandiri", type: "bank", isDefault: false },
    { id: "acc-4", name: "GoPay", type: "ewallet", isDefault: false },
    { id: "acc-5", name: "OVO", type: "ewallet", isDefault: false },
  ];

  const dummyCategories = [
    { id: "cat-1", name: "Makan & Minum", type: "expense", icon: "🍔" },
    { id: "cat-2", name: "Transport", type: "expense", icon: "🚗" },
    { id: "cat-3", name: "Belanja", type: "expense", icon: "🛒" },
    { id: "cat-4", name: "Tagihan & Utilitas", type: "expense", icon: "⚡" },
    { id: "cat-5", name: "Hiburan", type: "expense", icon: "🎮" },
    { id: "cat-6", name: "Lainnya", type: "expense", icon: "📦" },
    { id: "cat-7", name: "Gaji", type: "income", icon: "💰" },
    { id: "cat-8", name: "Bonus", type: "income", icon: "🎁" },
    { id: "cat-9", name: "Pemasukan Lainnya", type: "income", icon: "💵" },
  ];

  describe("1. Nominal Parsing (parseNominal)", () => {
    it("should parse standard numeric strings", () => {
      expect(parseNominal("50000")).toBe(50000);
      expect(parseNominal("25.000")).toBe(25000);
      expect(parseNominal("1.500.000")).toBe(1500000);
    });

    it("should parse suffix units: k, rb, ribu", () => {
      expect(parseNominal("25k")).toBe(25000);
      expect(parseNominal("50rb")).toBe(50000);
      expect(parseNominal("100ribu")).toBe(100000);
      expect(parseNominal("12.5k")).toBe(12500);
      expect(parseNominal("12,5k")).toBe(12500);
    });

    it("should parse million units: jt, m, juta", () => {
      expect(parseNominal("5jt")).toBe(5000000);
      expect(parseNominal("2.5m")).toBe(2500000);
      expect(parseNominal("10juta")).toBe(10000000);
    });

    it("should handle invalid inputs gracefully", () => {
      expect(parseNominal("abc")).toBe(0);
      expect(parseNominal("")).toBe(0);
    });
  });

  describe("2. Wallet Account Matching (matchesAccount)", () => {
    it("should match by exact name or alias", () => {
      expect(matchesAccount("bca", dummyAccounts[1])).toBe(true);
      expect(matchesAccount("tunai", dummyAccounts[0])).toBe(true);
      expect(matchesAccount("cash", dummyAccounts[0])).toBe(true);
      expect(matchesAccount("mandiri", dummyAccounts[2])).toBe(true);
      expect(matchesAccount("gopay", dummyAccounts[3])).toBe(true);
      expect(matchesAccount("ovo", dummyAccounts[4])).toBe(true);
    });

    it("should return false for unmatched accounts", () => {
      expect(matchesAccount("bni", dummyAccounts[1])).toBe(false);
      expect(matchesAccount("crypto", dummyAccounts[0])).toBe(false);
    });
  });

  describe("3. Wallet & Description Extraction (extractWalletAndDescription)", () => {
    it("should extract trailing wallet and strip preposition", () => {
      const res1 = extractWalletAndDescription("nasi padang dari bca", dummyAccounts);
      expect(res1.wallet.id).toBe("acc-2");
      expect(res1.description).toBe("nasi padang");

      const res2 = extractWalletAndDescription("kopi kenangan pake gopay", dummyAccounts);
      expect(res2.wallet.id).toBe("acc-4");
      expect(res2.description).toBe("kopi kenangan");

      const res3 = extractWalletAndDescription("bensin motor via mandiri", dummyAccounts);
      expect(res3.wallet.id).toBe("acc-3");
      expect(res3.description).toBe("bensin motor");
    });

    it("should fallback to default wallet if no wallet specified", () => {
      const res = extractWalletAndDescription("beli martabak manis", dummyAccounts);
      expect(res.wallet.id).toBe("acc-1"); // Default Dompet Tunai
      expect(res.description).toBe("beli martabak manis");
    });
  });

  describe("4. Category Heuristic Matching (findMatchingCategory)", () => {
    it("should match Makan & Minum category from keywords", () => {
      const catKopi = findMatchingCategory("kopi americano", "expense", dummyCategories);
      expect(catKopi.name).toBe("Makan & Minum");

      const catBakso = findMatchingCategory("makan bakso solo", "expense", dummyCategories);
      expect(catBakso.name).toBe("Makan & Minum");
    });

    it("should match Transport category from keywords", () => {
      const catBensin = findMatchingCategory("bensin pertamax", "expense", dummyCategories);
      expect(catBensin.name).toBe("Transport");

      const catGrab = findMatchingCategory("ongkos grab car", "expense", dummyCategories);
      expect(catGrab.name).toBe("Transport");
    });

    it("should match Belanja category from keywords", () => {
      const catBelanja = findMatchingCategory("belanja alfamart", "expense", dummyCategories);
      expect(catBelanja.name).toBe("Belanja");
    });

    it("should match Gaji category for income", () => {
      const catGaji = findMatchingCategory("gaji bulanan pt sukses", "income", dummyCategories);
      expect(catGaji.name).toBe("Gaji");
    });

    it("should fallback to Lainnya when no keyword matches", () => {
      const catUnknown = findMatchingCategory("sesuatu yang random", "expense", dummyCategories);
      expect(catUnknown.name).toBe("Lainnya");
    });
  });

  describe("5. Transfer Intent Parsing (parseTransferParams)", () => {
    it("should parse standard transfer syntax: 'tf 500k mandiri ke bca'", () => {
      const parsed = parseTransferParams("500k mandiri ke bca untuk tabungan", dummyAccounts);
      expect(parsed).not.toBeNull();
      if (parsed && !("error" in parsed)) {
        expect(parsed.amount).toBe(500000);
        expect(parsed.fromAccount.id).toBe("acc-3"); // Mandiri
        expect(parsed.toAccount.id).toBe("acc-2"); // BCA
        expect(parsed.note).toBe("untuk tabungan");
      }
    });

    it("should parse transfer with 'to' and arrow '->' syntax", () => {
      const parsed = parseTransferParams("100k bca to gopay topup", dummyAccounts);
      expect(parsed).not.toBeNull();
      if (parsed && !("error" in parsed)) {
        expect(parsed.amount).toBe(100000);
        expect(parsed.fromAccount.id).toBe("acc-2");
        expect(parsed.toAccount.id).toBe("acc-4");
        expect(parsed.note).toBe("topup");
      }
    });

    it("should return error if source wallet and destination wallet are identical", () => {
      const parsed = parseTransferParams("50k bca ke bca", dummyAccounts);
      expect(parsed).not.toBeNull();
      if (parsed && "error" in parsed) {
        expect(parsed.error).toContain("tidak boleh sama");
      }
    });

    it("should return error if wallet is not found", () => {
      const parsed = parseTransferParams("50k bank_gaib ke bca", dummyAccounts);
      expect(parsed).not.toBeNull();
      if (parsed && "error" in parsed) {
        expect(parsed.error).toContain("tidak ditemukan");
      }
    });
  });
});
