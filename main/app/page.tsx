import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  TableProperties,
  ArrowRight,
  Lock,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "Fiku • Catat Cepat, Kendalikan Keuangan Pribadi",
  description:
    "Aplikasi pencatat keuangan instan dengan Smart Input dan spreadsheet live-sync. Data terenkripsi dengan Zero-Knowledge Security.",
};

import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function HomePage() {
  const user = await getCurrentUser();
  const locale = await getServerLocale();
  const dict = await getServerDictionary();

  const faqs = [
    {
      q: locale === "id" ? "Bagaimana cara kerja Smart Input?" : "How does Smart Input work?",
      a: locale === "id"
        ? 'Kamu cukup mengetik kalimat natural seperti "-25k sayur cash" atau "tf 100k bca ke gopay". Sistem otomatis mendeteksi nominal, kategori, serta kantong tujuan tanpa perlu membuka atau memilih form satu per satu.'
        : 'Simply type natural shorthand like "-25k lunch cash" or "tf 100k bca to gopay". The system automatically detects amounts, categories, and wallets without cumbersome forms.',
    },
    {
      q: locale === "id" ? "Seberapa aman data keuangan saya? Apakah data saya bisa diintip?" : "How secure is my financial data? Can anyone peek?",
      a: locale === "id"
        ? "Fiku menerapkan prinsip Zero-Knowledge Encryption dan Double Protection. Kunci enkripsi akun kamu dilindungi ganda oleh password kamu sendiri serta secret key server (.env). Data kamu dienkripsi menggunakan standar kriptografi AES-256-GCM. Kami maupun pihak ketiga tidak dapat melihat atau membaca nominal transaksi serta mutasi keuangan kamu."
        : "Fiku enforces Zero-Knowledge Encryption and Double Protection. Your account cryptographic keys are sealed by your password plus server secret salt. Encrypted with AES-256-GCM, no third parties or servers can read your financial figures.",
    },
    {
      q: locale === "id" ? "Apakah data transaksi bisa diekspor atau diimpor?" : "Can transactions be exported or imported?",
      a: locale === "id"
        ? "Tentu! Fiku menyediakan fitur ekspor ke format Excel (.xlsx) dengan pilihan rentang waktu (bulan ini, tahun ini, atau semua transaksi), serta fitur impor file Excel massal lengkap dengan template resmi yang dapat diunduh."
        : "Yes! Fiku offers 1-click Excel (.xlsx) export with custom date ranges, as well as bulk spreadsheet import with downloadable official templates.",
    },
    {
      q: locale === "id" ? "Apakah Fiku gratis dan open source?" : "Is Fiku free and open source?",
      a: locale === "id"
        ? "Ya! Fiku dikembangkan sebagai platform keuangan yang transparan dan dapat diaudit secara terbuka. Kode sumber tersedia secara publik di GitHub."
        : "Yes! Fiku is developed transparently and publicly verifiable. Source code is open source on GitHub.",
    },
    {
      q: locale === "id" ? "Bagaimana jika saya ingin mengedit banyak transaksi sekaligus?" : "How do I edit multiple transactions simultaneously?",
      a: locale === "id"
        ? "Halaman transaksi Fiku bekerja persis seperti Google Sheets atau Excel. Kamu bisa mengedit sel tanggal, tipe, nominal, kantong, atau catatan secara live dengan fitur auto-save debounced otomatis."
        : "Fiku's transaction page behaves just like Google Sheets or Excel. You can edit cells for date, type, amount, wallet, or note live with debounced auto-save.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col overflow-x-hidden">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              F
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
              Fiku
            </span>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageSwitcher currentLocale={locale} compact />

            <a
              href="https://github.com/fikrisyahid/fiku"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:inline-flex"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            {user ? (
              <Link
                href="/transaksi"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
              >
                Masuk / Daftar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cara Paling Cepat & Simpel Mencatat Keuangan</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 max-w-4xl mx-auto leading-[1.15]">
          Beres belanja, ketik sekali,{" "}
          <span className="text-emerald-600 dark:text-emerald-400">langsung tercatat</span> rapi.
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Gak perlu lagi ribet ngisi form bertahap di pinggir jalan. Cukup ketik seperti chat biasa atau edit langsung di tabel spreadsheet dengan keamanan enkripsi mutlak.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={user ? "/transaksi" : "/login"}
            className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.02] transition-all"
          >
            Mulai Sekarang — Gratis <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/fikrisyahid/fiku"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto h-12 px-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Bintang di GitHub
          </a>
        </div>

        {/* Mockup Preview Card */}
        <div className="pt-8 max-w-3xl mx-auto">
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="flex items-center gap-2 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                smart-input-preview
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">Terbaca Otomatis</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 truncate">
                <span className="text-rose-500 font-bold">-25k</span>
                <span>sayur bayam & tempe</span>
                <span className="text-zinc-400">cash</span>
              </div>
              <span className="shrink-0 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold uppercase">
                Tersimpan
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Pengeluaran</div>
                <div className="text-xs sm:text-sm font-bold text-rose-600">Rp 25.000</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Kategori</div>
                <div className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300">🥬 Makanan</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Kantong</div>
                <div className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300">💵 Dompet Tunai</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Advantages / Features */}
      <section className="py-12 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Kenapa Memilih Fiku?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              Dibangun untuk kecepatan, kepraktisan, dan keamanan tanpa kompromi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Smart Input Kilat
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Catat pengeluaran di mana saja dalam hitungan detik. Cukup ketik format teks sederhana, sistem otomatis memproses ke kantong yang tepat.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                <TableProperties className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Live Spreadsheet Ala Excel
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Mau merapikan transaksi di rumah? Edit tanggal, nominal, dan catatan langsung di sel tabel dengan format ribuan otomatis & debounce auto-save.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Zero-Knowledge & Double Protection
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Kunci kriptografi akun kamu diamankan oleh kombinasi password dan server secret key. Privasi keuangan kamu terlindungi seutuhnya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Pertanyaan yang Sering Diajukan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            FAQ Seputar Fiku
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Segala hal yang perlu kamu ketahui tentang fitur dan perlindungan data di Fiku.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2"
            >
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  ?
                </span>
                {faq.q}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pl-7.5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-12 bg-emerald-600 text-white px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Siap Mengatur Keuangan Lebih Ringan?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100">
            Daftar sekarang dan rasakan kemudahan mencatat keuangan tanpa ribet.
          </p>
          <div className="pt-2">
            <Link
              href={user ? "/transaksi" : "/login"}
              className="h-11 px-6 rounded-xl bg-white text-emerald-700 font-bold text-xs inline-flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-md"
            >
              Mulai Pakai Fiku Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs font-medium">
          <Link href="/transaksi" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Transaksi
          </Link>
          <Link href="/ringkasan" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Ringkasan
          </Link>
          <a
            href="https://github.com/fikrisyahid/fiku"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>
        <p className="text-[11px] text-zinc-400">
          Fiku &copy; {new Date().getFullYear()} • Zero-Knowledge Personal Finance Platform
        </p>
      </footer>
    </div>
  );
}
