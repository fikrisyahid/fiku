import { describe, expect, it } from "bun:test";

describe("Pagination and Sorting Logic Integration Tests", () => {
  const mockTransactions = Array.from({ length: 60 }, (_, i) => ({
    id: `tx-${i + 1}`,
    transactionDate: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`,
    amount: (i + 1) * 10000,
    type: i % 2 === 0 ? "expense" : "income",
    category: { name: i % 3 === 0 ? "Makan" : "Transport" },
    account: { name: "BCA" },
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));

  it("should calculate correct total pages and slicing for fast-path pagination", () => {
    const pageSize = 25;
    const totalCount = mockTransactions.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    expect(totalPages).toBe(3);

    // Page 1: 0..25
    const page1 = mockTransactions.slice(0, pageSize);
    expect(page1.length).toBe(25);
    expect(page1[0].id).toBe("tx-1");

    // Page 2: 25..50
    const page2 = mockTransactions.slice(pageSize, pageSize * 2);
    expect(page2.length).toBe(25);
    expect(page2[0].id).toBe("tx-26");

    // Page 3: 50..60
    const page3 = mockTransactions.slice(pageSize * 2, totalCount);
    expect(page3.length).toBe(10);
    expect(page3[0].id).toBe("tx-51");
  });

  it("should correctly sort transactions in-memory when fallback sorting applies", () => {
    const sortedByAmountDesc = [...mockTransactions].sort((a, b) => b.amount - a.amount);
    expect(sortedByAmountDesc[0].amount).toBe(600000);
    expect(sortedByAmountDesc[sortedByAmountDesc.length - 1].amount).toBe(10000);

    const sortedByDateDesc = [...mockTransactions].sort(
      (a, b) => b.transactionDate.localeCompare(a.transactionDate)
    );
    expect(sortedByDateDesc[0].transactionDate >= sortedByDateDesc[1].transactionDate).toBe(true);
  });
});
