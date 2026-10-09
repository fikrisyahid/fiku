import { getCurrentUser } from "@/app/actions/auth";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserTransactions } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { TransactionsClient } from "@/components/transactions-client";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";

export const metadata = {
  title: "Transaksi • Fiku",
  description: "Pencatatan dan edit transaksi instan ala Google Sheet",
};

export default async function TransaksiPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const dict = await getServerDictionary();

  const [accounts, categories, transactionsList] = await Promise.all([
    getUserAccounts(user.id),
    getCategories(user.id),
    getUserTransactions(user.id, { limit: 1000 }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-16 overflow-x-hidden">
      <AppNavbar user={user} locale={locale} />

      <main className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {dict.transaksi.heading}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {dict.transaksi.subheading}
          </p>
        </div>

        <TransactionsClient
          userId={user.id}
          accounts={accounts}
          categories={categories}
          initialTransactions={transactionsList}
        />
      </main>
    </div>
  );
}
