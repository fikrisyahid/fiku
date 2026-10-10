import { getCurrentUser } from "@/app/actions/auth";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserTransactions } from "@/app/actions/transactions";
import { getUserSettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";
import { RingkasanClient } from "@/components/ringkasan-client";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";

import { getPeriodDateRange, PeriodMode } from "@/lib/date-summary";

export async function generateMetadata() {
  const dict = await getServerDictionary();
  return {
    title: dict.ringkasan.metaTitle,
    description: dict.ringkasan.metaDesc,
  };
}

export default async function RingkasanPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; offset?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const rawPeriod = resolvedParams?.period;
  const validPeriods: PeriodMode[] = ["harian", "mingguan", "bulanan", "tahunan"];
  const period: PeriodMode = validPeriods.includes(rawPeriod as PeriodMode)
    ? (rawPeriod as PeriodMode)
    : "bulanan";

  const rawOffset = parseInt(resolvedParams?.offset || "0", 10);
  const offset = Number.isNaN(rawOffset) ? 0 : rawOffset;

  const { startDate, endDate } = getPeriodDateRange(period, offset);

  const [accounts, transactionsList, settings, dict] = await Promise.all([
    getUserAccounts(user.id),
    getUserTransactions(user.id, { startDate, endDate }),
    getUserSettings(user.id),
    getServerDictionary(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 dark:bg-gradient-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-50 pb-16 overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {dict.ringkasan.heading}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {dict.ringkasan.subheading}
          </p>
        </div>

        <RingkasanClient
          transactions={transactionsList}
          accounts={accounts}
          currency={settings.currency || "IDR"}
          initialPeriod={period}
          initialOffset={offset}
        />
      </main>
    </div>
  );
}
