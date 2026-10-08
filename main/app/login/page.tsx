import { getCurrentUser } from "@/app/actions/auth";
import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 relative">
      {/* Back to Home Button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="w-full max-w-md mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            F
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
            Fana Finance
          </span>
        </Link>
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
        Fana &copy; {new Date().getFullYear()} • Zero-Knowledge Personal Finance Platform
      </footer>
    </div>
  );
}
