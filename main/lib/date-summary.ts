export type PeriodMode = "harian" | "mingguan" | "bulanan" | "tahunan";

export interface DateRangeResult {
  startDate: string;
  endDate: string;
}

/**
 * Computes the YYYY-MM-DD date range for a given period and offset relative to now.
 * Offset: 0 = current period, -1 = previous period, etc.
 */
export function getPeriodDateRange(period: PeriodMode, offset: number = 0): DateRangeResult {
  const now = new Date();

  if (period === "harian") {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + offset);
    const dateStr = targetDate.toISOString().split("T")[0];
    return { startDate: dateStr, endDate: dateStr };
  }

  if (period === "mingguan") {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + offset * 7);
    const day = targetDate.getDay();
    // Monday is start of week
    const diffToMonday = targetDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(targetDate.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const monStr = monday.toISOString().split("T")[0];
    const sunStr = sunday.toISOString().split("T")[0];
    return { startDate: monStr, endDate: sunStr };
  }

  if (period === "bulanan") {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const startDate = `${year}-${month}-01`;

    // Last day of this month
    const endOfMonth = new Date(year, targetDate.getMonth() + 1, 0);
    const lastDay = String(endOfMonth.getDate()).padStart(2, "0");
    const endDate = `${year}-${month}-${lastDay}`;
    return { startDate, endDate };
  }

  // tahunan
  const targetYear = now.getFullYear() + offset;
  return {
    startDate: `${targetYear}-01-01`,
    endDate: `${targetYear}-12-31`,
  };
}
