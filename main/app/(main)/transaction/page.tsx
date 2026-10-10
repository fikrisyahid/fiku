import { getCurrentUser } from "@/app/actions/auth";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserTransactionsPaginated } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { getUserSettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";
import { TransactionsClient } from "@/components/transactions-client";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";

export async function generateMetadata() {
  const dict = await getServerDictionary();
  return {
    title: dict.transaksi.metaTitle,
    description: dict.transaksi.metaDesc,
  };
}

interface TransaksiPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    q?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function TransaksiPage({ searchParams }: TransaksiPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const dict = await getServerDictionary();
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10) || 1;
  const pageSize = parseInt(params.limit || "25", 10) || 25;
  const search = params.q || "";
  const sortBy = (params.sort || "transactionDate") as any;
  const sortOrder = (params.order || "desc") as any;

  const [accounts, categories, settings, paginatedResult] = await Promise.all([
    getUserAccounts(user.id),
    getCategories(user.id),
    getUserSettings(user.id),
    getUserTransactionsPaginated(user.id, {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
    }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 dark:bg-gradient-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-50 pb-16 overflow-x-hidden">
      <main className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {dict.transaksi.heading}
          </h1>
        </div>

        <TransactionsClient
          userId={user.id}
          accounts={accounts}
          categories={categories}
          initialTransactions={paginatedResult.transactions}
          totalCount={paginatedResult.totalCount}
          currentPage={paginatedResult.page}
          pageSize={paginatedResult.pageSize}
          totalPages={paginatedResult.totalPages}
          currentSearch={search}
          currentSortField={sortBy}
          currentSortOrder={sortOrder}
          userSettings={settings}
        />
      </main>
    </div>
  );
}
