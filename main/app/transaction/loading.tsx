import { AppNavbar } from "@/components/app-navbar";
import { getCurrentUser } from "@/app/actions/auth";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";

export default async function TransactionLoading() {
  const user = await getCurrentUser();
  const locale = await getServerLocale();
  const dict = await getServerDictionary();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-16 overflow-x-hidden animate-in fade-in duration-150">
      <AppNavbar user={user} locale={locale} />

      <main className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {dict.transaksi.heading}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {dict.transaksi.subheading}
          </p>
        </div>

        {/* 1. Quick Modals Strip Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
          <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>

        {/* 2. Smart Input Bar Skeleton */}
        <div className="w-full h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800/80 animate-pulse border border-zinc-200 dark:border-zinc-800" />

        {/* 3. Toolbar Skeleton (Search, Action Buttons) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="h-10 w-full sm:w-72 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-10 w-28 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-10 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        {/* 4. Spreadsheet Table Skeleton */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          {/* Table Header */}
          <div className="h-11 px-4 bg-zinc-100/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
            <div className="h-4 w-6 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse hidden md:block" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          </div>

          {/* Table Rows Skeleton */}
          <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-12 px-4 flex items-center justify-between gap-4">
                <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-6 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-6 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-6 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse hidden md:block" />
                <div className="h-7 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
