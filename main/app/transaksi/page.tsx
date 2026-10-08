import { getCurrentUser } from "@/app/actions/auth";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserTransactions } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { TransactionsClient } from "@/components/transactions-client";

export const metadata = {
  title: "Transaksi • Fana Finance",
  description: "Pencatatan dan edit transaksi instan ala Google Sheet",
};

export default async function TransaksiPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isFamily = user.activeMode === "family" && Boolean(user.activeFamilyId);
  const familyId = isFamily ? user.activeFamilyId : null;

  const [accounts, categories, transactionsList] = await Promise.all([
    getUserAccounts(user.id, familyId),
    getCategories(user.id, familyId),
    getUserTransactions(user.id, { limit: 100, familyId }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-16 overflow-x-hidden">
      <AppNavbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Lembar Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ketik cepat pakai Smart Input atau edit langsung di tabel selayaknya spreadsheet.
          </p>
        </div>

        <TransactionsClient
          userId={user.id}
          familyId={familyId}
          accounts={accounts}
          categories={categories}
          initialTransactions={transactionsList}
        />
      </main>
    </div>
  );
}
