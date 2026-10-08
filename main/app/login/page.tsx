import { getCurrentUser } from "@/app/actions/auth";
import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Masuk • Fana Finance",
  description: "Masuk ke Dashboard Web Fana menggunakan email dan password.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/transaksi");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/20">
          ✨ Fana Finance • Web Platform
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Kelola Keuangan Jadi Mudah
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Catat transaksi secepat kilat & pantau ringkasan keuangan kamu.
        </p>
      </div>

      <main className="w-full max-w-md">
        <LoginForm />
      </main>

      <footer className="mt-8 text-[11px] text-zinc-500 text-center">
        Fana &copy; {new Date().getFullYear()} • Terhubung dengan Telegram Bot
      </footer>
    </div>
  );
}
