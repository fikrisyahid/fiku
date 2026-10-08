"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialChartProps {
  period: "harian" | "mingguan" | "bulanan" | "tahunan";
  periodLabel: string;
  transactions: any[];
}

export function FinancialChart({
  period,
  periodLabel,
  transactions,
}: FinancialChartProps) {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatShortNumber = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return String(val);
  };

  // Group transactions into buckets depending on current period
  const chartData = useMemo(() => {
    if (period === "harian") {
      // 4 Time intervals: Pagi (00-11), Siang (12-14), Sore (15-18), Malam (19-23)
      const slots = [
        { key: "pagi", label: "Pagi", income: 0, expense: 0 },
        { key: "siang", label: "Siang", income: 0, expense: 0 },
        { key: "sore", label: "Sore", income: 0, expense: 0 },
        { key: "malam", label: "Malam", income: 0, expense: 0 },
      ];

      for (const t of transactions) {
        const amt = parseFloat(t.amount || "0");
        const hour = t.createdAt ? new Date(t.createdAt).getHours() : 12;
        let slotIndex = 0;
        if (hour >= 12 && hour < 15) slotIndex = 1;
        else if (hour >= 15 && hour < 19) slotIndex = 2;
        else if (hour >= 19 || hour < 5) slotIndex = 3;

        if (t.type === "income") slots[slotIndex].income += amt;
        if (t.type === "expense") slots[slotIndex].expense += amt;
      }
      return slots;
    }

    if (period === "mingguan") {
      // 7 Days: Sen, Sel, Rab, Kam, Jum, Sab, Min
      const days = [
        { key: "1", label: "Sen", income: 0, expense: 0 },
        { key: "2", label: "Sel", income: 0, expense: 0 },
        { key: "3", label: "Rab", income: 0, expense: 0 },
        { key: "4", label: "Kam", income: 0, expense: 0 },
        { key: "5", label: "Jum", income: 0, expense: 0 },
        { key: "6", label: "Sab", income: 0, expense: 0 },
        { key: "0", label: "Min", income: 0, expense: 0 },
      ];

      for (const t of transactions) {
        const amt = parseFloat(t.amount || "0");
        const d = new Date(t.transactionDate);
        const dayIdx = d.getDay(); // 0 is Sun, 1 is Mon
        const target = days.find((item) => item.key === String(dayIdx));
        if (target) {
          if (t.type === "income") target.income += amt;
          if (t.type === "expense") target.expense += amt;
        }
      }
      return days;
    }

    if (period === "bulanan") {
      // 4 Weeks buckets: Mgg 1 (1-7), Mgg 2 (8-14), Mgg 3 (15-21), Mgg 4+ (22+)
      const weeks = [
        { key: "w1", label: "Mgg 1", income: 0, expense: 0 },
        { key: "w2", label: "Mgg 2", income: 0, expense: 0 },
        { key: "w3", label: "Mgg 3", income: 0, expense: 0 },
        { key: "w4", label: "Mgg 4+", income: 0, expense: 0 },
      ];

      for (const t of transactions) {
        const amt = parseFloat(t.amount || "0");
        const dateNum = parseInt((t.transactionDate || "").split("-")[2] || "1", 10);
        let weekIdx = 0;
        if (dateNum >= 8 && dateNum <= 14) weekIdx = 1;
        else if (dateNum >= 15 && dateNum <= 21) weekIdx = 2;
        else if (dateNum >= 22) weekIdx = 3;

        if (t.type === "income") weeks[weekIdx].income += amt;
        if (t.type === "expense") weeks[weekIdx].expense += amt;
      }
      return weeks;
    }

    // tahunan: 12 Bulan (Jan - Des)
    const months = [
      { key: "01", label: "Jan", income: 0, expense: 0 },
      { key: "02", label: "Feb", income: 0, expense: 0 },
      { key: "03", label: "Mar", income: 0, expense: 0 },
      { key: "04", label: "Apr", income: 0, expense: 0 },
      { key: "05", label: "Mei", income: 0, expense: 0 },
      { key: "06", label: "Jun", income: 0, expense: 0 },
      { key: "07", label: "Jul", income: 0, expense: 0 },
      { key: "08", label: "Agu", income: 0, expense: 0 },
      { key: "09", label: "Sep", income: 0, expense: 0 },
      { key: "10", label: "Okt", income: 0, expense: 0 },
      { key: "11", label: "Nov", income: 0, expense: 0 },
      { key: "12", label: "Des", income: 0, expense: 0 },
    ];

    for (const t of transactions) {
      const amt = parseFloat(t.amount || "0");
      const monthPart = (t.transactionDate || "").split("-")[1];
      const target = months.find((m) => m.key === monthPart);
      if (target) {
        if (t.type === "income") target.income += amt;
        if (t.type === "expense") target.expense += amt;
      }
    }
    return months;
  }, [period, transactions]);

  // Max value calculation for bar heights
  const maxVal = useMemo(() => {
    let m = 0;
    for (const item of chartData) {
      if (item.income > m) m = item.income;
      if (item.expense > m) m = item.expense;
    }
    return m > 0 ? m : 1000;
  }, [chartData]);

  const hasData = chartData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Grafik Arus Kas ({periodLabel})
          </CardTitle>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-zinc-600 dark:text-zinc-300">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
              <span className="text-zinc-600 dark:text-zinc-300">Pengeluaran</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {!hasData ? (
          <div className="h-56 flex items-center justify-center text-xs text-zinc-400">
            Belum ada data transaksi untuk ditampilkan pada grafik {periodLabel}.
          </div>
        ) : (
          <div className="w-full">
            {/* Chart Area */}
            <div className="h-56 flex items-end gap-2 sm:gap-4 pt-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              {chartData.map((d) => {
                const incomePercent = Math.max(
                  d.income > 0 ? 4 : 0,
                  Math.round((d.income / maxVal) * 100)
                );
                const expensePercent = Math.max(
                  d.expense > 0 ? 4 : 0,
                  Math.round((d.expense / maxVal) * 100)
                );

                return (
                  <div
                    key={d.key}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                      <div>Masuk: {formatRupiah(d.income)}</div>
                      <div>Keluar: {formatRupiah(d.expense)}</div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${incomePercent}%` }}
                        className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300 relative group/bar"
                      >
                        {d.income > 0 && (
                          <span className="hidden group-hover/bar:block absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                            {formatShortNumber(d.income)}
                          </span>
                        )}
                      </div>

                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expensePercent}%` }}
                        className="w-1/2 max-w-[20px] bg-rose-500 hover:bg-rose-600 rounded-t-md transition-all duration-300 relative group/bar"
                      >
                        {d.expense > 0 && (
                          <span className="hidden group-hover/bar:block absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                            {formatShortNumber(d.expense)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex gap-2 sm:gap-4 mt-2">
              {chartData.map((d) => (
                <div
                  key={d.key}
                  className="flex-1 text-center text-[10px] sm:text-xs font-semibold text-zinc-500 truncate"
                >
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
