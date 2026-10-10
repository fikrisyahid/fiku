import { describe, expect, it } from "bun:test";
import { getPeriodDateRange } from "../../main/lib/date-summary";

describe("Date Summary Range Calculation Unit Tests", () => {
  it("should calculate correct daily date range", () => {
    const today = new Date().toISOString().split("T")[0];
    const range = getPeriodDateRange("harian", 0);
    expect(range.startDate).toBe(today);
    expect(range.endDate).toBe(today);

    // Yesterday (-1 offset)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const prevRange = getPeriodDateRange("harian", -1);
    expect(prevRange.startDate).toBe(yesterdayStr);
    expect(prevRange.endDate).toBe(yesterdayStr);
  });

  it("should calculate correct weekly date range (Monday to Sunday)", () => {
    const range = getPeriodDateRange("mingguan", 0);
    expect(range.startDate <= range.endDate).toBe(true);

    const monDate = new Date(range.startDate);
    const sunDate = new Date(range.endDate);

    // Monday getDay() === 1
    expect(monDate.getDay()).toBe(1);
    // Sunday getDay() === 0
    expect(sunDate.getDay()).toBe(0);

    // 6 days diff
    const diffDays = Math.round((sunDate.getTime() - monDate.getTime()) / (1000 * 3600 * 24));
    expect(diffDays).toBe(6);
  });

  it("should calculate correct monthly date range (Full Month)", () => {
    const now = new Date();
    const range = getPeriodDateRange("bulanan", 0);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    expect(range.startDate).toBe(`${year}-${month}-01`);
    expect(range.endDate.startsWith(`${year}-${month}-`)).toBe(true);

    const lastDay = parseInt(range.endDate.split("-")[2], 10);
    expect([28, 29, 30, 31]).toContain(lastDay);
  });

  it("should calculate correct yearly date range", () => {
    const currentYear = new Date().getFullYear();
    const range = getPeriodDateRange("tahunan", 0);

    expect(range.startDate).toBe(`${currentYear}-01-01`);
    expect(range.endDate).toBe(`${currentYear}-12-31`);

    const prevRange = getPeriodDateRange("tahunan", -1);
    expect(prevRange.startDate).toBe(`${currentYear - 1}-01-01`);
    expect(prevRange.endDate).toBe(`${currentYear - 1}-12-31`);
  });
});
