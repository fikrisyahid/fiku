import { getServerDictionary } from "@/lib/i18n/server";

export default async function SummaryLoading() {
  const dict = await getServerDictionary();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 dark:bg-gradient-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-50 pb-16 overflow-x-hidden animate-in fade-in duration-150">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {dict.ringkasan.heading}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {dict.ringkasan.subheading}
          </p>
        </div>

        {/* 1. Period Switcher Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-fit">
            <div className="h-8 w-16 rounded-xl bg-zinc-300 dark:bg-zinc-800 animate-pulse" />
            <div className="h-8 w-20 rounded-xl bg-zinc-300 dark:bg-zinc-800 animate-pulse" />
            <div className="h-8 w-16 rounded-xl bg-zinc-300 dark:bg-zinc-800 animate-pulse" />
            <div className="h-8 w-16 rounded-xl bg-zinc-300 dark:bg-zinc-800 animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-8 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        {/* 2. Top Summary KPI Cards (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-7 w-36 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800/80 animate-pulse" />
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-7 w-36 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800/80 animate-pulse" />
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-7 w-36 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800/80 animate-pulse" />
          </div>
        </div>

        {/* 3. Main Chart & Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="h-5 w-36 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
