import { getCurrentUser } from "@/app/actions/auth";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserTransactions } from "@/app/actions/transactions";
import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { RingkasanClient } from "@/components/ringkasan-client";

export const metadata = {
  title: "Ringkasan • Fiku",
  description: "Laporan dan analisis keuangan tahunan, bulanan, mingguan, dan harian",
};

export default async function RingkasanPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [accounts, transactionsList] = await Promise.all([
    getUserAccounts(user.id),
    getUserTransactions(user.id, { limit: 500 }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-16 overflow-x-hidden">
      <AppNavbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Ringkasan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Pantau arus kas, alokasi pengeluaran, dan tren keuangan kamu.
          </p>
        </div>

        <RingkasanClient
          transactions={transactionsList}
          accounts={accounts}
        />
      </main>
    </div>
  );
}
