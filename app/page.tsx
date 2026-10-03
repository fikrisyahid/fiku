import { OnboardingForm } from "@/components/onboarding-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex flex-col justify-center items-center p-4 sm:p-8">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
          ✨ Fana Finance • Web & Telegram
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Selamat Datang di Fana
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
          Aplikasi manajemen keuangan pribadi yang terintegrasi langsung dengan Telegram Bot.
        </p>
      </header>

      <main className="w-full max-w-lg">
        <OnboardingForm />
      </main>

      <footer className="mt-8 text-xs text-zinc-500 text-center">
        Fana &copy; {new Date().getFullYear()} • Terhubung ke Bot Telegram{" "}
        <a
          href="https://t.me/fanadev_bot"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          @fanadev_bot
        </a>
      </footer>
    </div>
  );
}
