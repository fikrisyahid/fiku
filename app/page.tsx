import { getCurrentUser } from "@/app/actions/auth";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserTransactions } from "@/app/actions/transactions";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "Dashboard • Fana Finance",
  description: "Dashboard ringkasan keuangan pribadi Fana",
};

function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [accountsList, recentTransactions] = await Promise.all([
    getUserAccounts(user.id),
    getUserTransactions(user.id, { limit: 8 }),
  ]);

  const totalBalance = accountsList.reduce(
    (sum, a) => sum + parseFloat(a.balance || "0"),
    0
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-600/30">
              F
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                Fana Finance
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  Web
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.telegramUsername ? `@${user.telegramUsername}` : user.fullName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://t.me/fanadev_bot"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Buka Bot Telegram <ExternalLink className="w-3 h-3" />
            </a>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-medium mb-2">
              <Sparkles className="w-3 h-3" /> Akun Terhubung
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Halo, {user.fullName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-md">
              Data keuanganmu tersinkronisasi otomatis secara real-time antara Web Dashboard dan Telegram Bot.
            </p>
          </div>

          <div className="sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-white/15">
            <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">
              Total Saldo Seluruh Dompet
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              {formatRupiah(totalBalance)}
            </div>
          </div>
        </div>

        {/* Section: Daftar Dompet */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Dompet & Rekening ({accountsList.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {accountsList.map((acc) => {
              const typeIcon =
                acc.type === "cash"
                  ? "💵"
                  : acc.type === "bank"
                  ? "🏦"
                  : "💳";

              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-lg mr-2">{typeIcon}</span>
                      <span className="font-semibold text-sm">{acc.name}</span>
                    </div>
                    {acc.isDefault && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Utama
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                      Saldo
                    </div>
                    <div className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(acc.balance)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Riwayat Transaksi Terakhir */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Transaksi Terakhir
            </h2>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold text-sm">Belum ada transaksi dicatat</div>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Mulai catat transaksi pertamamu melalui bot Telegram dengan mengetik perintah atau pesan cepat seperti{" "}
                <code className="text-emerald-600 dark:text-emerald-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                  -25k kopi susu
                </code>
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/80 shadow-sm overflow-hidden">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {tx.note || tx.category?.name || "Transaksi"}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span>{tx.category?.icon || "🏷️"} {tx.category?.name}</span>
                          <span>•</span>
                          <span>{tx.account?.name}</span>
                          <span>•</span>
                          <span>{tx.transactionDate}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`font-bold text-sm sm:text-base font-mono ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-12 border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        Fana Finance &copy; {new Date().getFullYear()} • Terintegrasi dengan Telegram Bot
      </footer>
    </div>
  );
}
