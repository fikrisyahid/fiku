import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCode2,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Layers,
  Terminal,
} from "lucide-react";
import { AppNavbar } from "@/components/app-navbar";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";
import { SecurityInteractiveSimulator } from "@/components/security-interactive-simulator";

export async function generateMetadata() {
  const dict = await getServerDictionary();
  return {
    title: `${dict.nav.security} • Fiku`,
    description:
      "Pelajari bagaimana Fiku melindungi data finansial pribadi Anda dengan Zero-Knowledge Encryption dan kriptografi AES-256-GCM ganda.",
  };
}

export default async function SecurityPage() {
  const [user, locale] = await Promise.all([
    getCurrentUser(),
    getServerLocale(),
  ]);
  const isId = locale === "id";

  const securityPillars = [
    {
      icon: Lock,
      title: isId ? "Zero-Knowledge Architecture" : "Zero-Knowledge Architecture",
      desc: isId
        ? "Kami menerapkan prinsip zero-knowledge: server Fiku tidak mengetahui nilai plaintext dari nominal transaksi, saldo kantong, nama kantong, maupun catatan pengeluaran Anda."
        : "We practice strict zero-knowledge: Fiku servers never know the plaintext of your transaction amounts, balances, account names, or notes.",
    },
    {
      icon: KeyRound,
      title: isId ? "Double Protection (2 Kunci)" : "Double Key Protection",
      desc: isId
        ? "Kunci privat akun Anda disegel ganda menggunakan PBKDF2 (100.000 iterasi) yang menggabungkan password Anda, per-user salt unik, serta master pepper rahasia di server."
        : "Your private keys are sealed with PBKDF2 (100,000 iterations) combining your password, a unique per-user salt, and server-side secret peppers.",
    },
    {
      icon: Database,
      title: isId ? "AES-256-GCM + Otentikasi Tag" : "AES-256-GCM + Auth Tag",
      desc: isId
        ? "Setiap record dienkripsi dengan IV acak 12-byte dan Authentication Tag 16-byte untuk memastikan ciphertext tidak bisa dimanipulasi atau diubah oleh pihak mana pun."
        : "Every record is encrypted with a random 12-byte IV and 16-byte Authentication Tag ensuring ciphertext cannot be forged or tampered with.",
    },
  ];

  const faqs = [
    {
      q: isId
        ? "Apakah developer Fiku bisa membaca saldo atau catatan transaksi saya?"
        : "Can Fiku developers read my balance or transaction notes?",
      a: isId
        ? "Sama sekali tidak bisa. Di database PostgreSQL kami, seluruh kolom nominal, nama kantong, saldo, dan catatan pengeluaran tersimpan dalam format ciphertext (misal: enc:v1:7f9b8c...:a38f...). Kami tidak memiliki kunci untuk membukanya."
        : "Absolutely not. In our PostgreSQL database, all amount, account name, balance, and note columns are stored as ciphertext (e.g. enc:v1:7f9b8c...:a38f...). We do not possess the keys to decrypt them.",
    },
    {
      q: isId
        ? "Bagaimana jika database server Fiku disita atau diretas?"
        : "What happens if Fiku's database server is breached or seized?",
      a: isId
        ? "Hacker atau pihak mana pun hanya akan mendapatkan data sampah terenkripsi tanpa kunci pembuka. Tanpa password akun Anda, mereka memerlukan jutaan tahun untuk membobol enkripsi AES-256."
        : "An attacker or third party would only obtain scrambled ciphertext without the decryption keys. Without your password, cracking AES-256 would take millions of years.",
    },
    {
      q: isId
        ? "Di mana kunci dekripsi disimpan saat saya login?"
        : "Where is the decryption key stored when I sign in?",
      a: isId
        ? "Kunci privat Anda disegel dengan enkripsi AES-256-GCM menggunakan Master Secret Key server dan disimpan dalam HTTP-Only Cookie yang aman. Kunci tidak dapat diakses oleh script browser (kebal serangan XSS) dan otomatis hangus saat Anda logout. Kunci tersebut tidak pernah tersimpan telanjang di database."
        : "Your private key is sealed with AES-256-GCM using the server's Master Secret Key and stored in a secure, encrypted HTTP-Only Cookie. It is completely inaccessible to browser scripts (XSS-immune) and instantly wiped upon logout. It is never stored unencrypted in the database.",
    },
    {
      q: isId
        ? "Bisakah saya memverifikasi kodenya sendiri?"
        : "Can I inspect and verify the encryption code myself?",
      a: isId
        ? "Tentu saja! Fiku adalah proyek open source. Kami menyediakan tautan langsung ke berkas enkripsi (lib/crypto.ts) dan skema database (lib/db/schema.ts) agar Anda dan komunitas keamanan dapat mengauditnya kapan saja."
        : "Certainly! Fiku is open source. You can audit the encryption implementation (lib/crypto.ts) and database schema (lib/db/schema.ts) directly on GitHub anytime.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col overflow-x-hidden">
      <AppNavbar user={user} locale={locale} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-20 space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-3.5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isId ? "Standar Keamanan & Privasi Mutlak" : "Absolute Security & Privacy Standards"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            {isId ? "Privasi Finansial Tanpa Kompromi" : "Financial Privacy Without Compromise"}
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {isId
              ? "Di Fiku, 'Aib' keuangan, nominal utang, tabungan, maupun pengeluaran pribadi Anda adalah rahasia mutlak Anda. Bahkan pengembang Fiku sekalipun tidak dapat membacanya."
              : "At Fiku, your financial balances, debts, savings, and personal expenses are strictly yours. Not even Fiku developers can read them."}
          </p>
        </div>

        {/* Interactive Encryption Simulator */}
        <div className="space-y-4">
          <SecurityInteractiveSimulator />
        </div>

        {/* 3 Core Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {securityPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {p.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Security Diagram Flow */}
        <div className="rounded-3xl p-6 sm:p-8 bg-zinc-900 text-white border border-zinc-800 space-y-6">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              {isId ? "Alur Kriptografi Data" : "Cryptographic Data Pipeline"}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {isId ? "Bagaimana Data Anda Dilindungi Dari Ujung ke Ujung" : "How Your Data is Protected End-to-End"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <span>{isId ? "01. Input Pengguna" : "01. User Input"}</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                {isId
                  ? 'Anda memasukkan catatan "Rp 100.000 (Makan Siang)". Data masih berwujud plaintext di peramban Anda.'
                  : 'You enter "Rp 100,000 (Lunch)". Data remains plaintext within your browser environment.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="text-amber-400 font-bold flex items-center gap-2">
                <span>{isId ? "02. Enkripsi AES-256" : "02. AES-256 Encryption"}</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                {isId
                  ? "Sistem membuat IV 12-byte unik dan menghasilkan sandi AES-256-GCM + tag integritas sebelum data dikirim ke storage."
                  : "A unique 12-byte IV is generated, sealing data with AES-256-GCM + integrity auth tag before dispatching to storage."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="text-rose-400 font-bold flex items-center gap-2">
                <span>{isId ? "03. Database Server" : "03. Database Server"}</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                {isId
                  ? "Server hanya menyimpan enc:v1:ephem:iv:tag:cipher. Database admin tidak memiliki kemampuan melihat isi aslinya."
                  : "Server persists only enc:v1:ephem:iv:tag:cipher. DB administrators cannot decipher or inspect the content."}
              </p>
            </div>
          </div>
        </div>

        {/* Verify Our Code / Open Source Audit */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {isId ? "Verifikasi & Audit Kode Sumber Kami Langsung" : "Verify & Audit Our Codebase Directly"}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isId
                  ? "Transparansi bukan sekadar janji. Semua implementasi kriptografi Fiku terbuka 100% untuk diaudit oleh siapa pun di GitHub."
                  : "Transparency is not just a promise. All Fiku cryptographic implementations are 100% auditable by anyone on GitHub."}
              </p>
            </div>

            <a
              href="https://github.com/fikrisyahid/fiku"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors w-fit shrink-0"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub Repository</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a
              href="https://github.com/fikrisyahid/fiku/blob/main/main/lib/crypto.ts"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 transition-all group space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                <span className="group-hover:text-emerald-600 transition-colors">main/lib/crypto.ts</span>
                <span className="text-zinc-400 group-hover:translate-x-0.5 transition-transform">↗</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isId
                  ? "Fungsi enkripsi & dekripsi inti AES-256-GCM, derivasi kunci PBKDF2 (100k iterasi), dan ECDH ephemeral."
                  : "Core AES-256-GCM cipher methods, PBKDF2 100k iterations key derivation, and ephemeral ECDH."}
              </p>
            </a>

            <a
              href="https://github.com/fikrisyahid/fiku/blob/main/main/lib/db/schema.ts"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 transition-all group space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                <span className="group-hover:text-emerald-600 transition-colors">main/lib/db/schema.ts</span>
                <span className="text-zinc-400 group-hover:translate-x-0.5 transition-transform">↗</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isId
                  ? "Skema database PostgreSQL membuktikan kolom transaksi amount, note, balance, name semuanya bertipe ciphertext."
                  : "PostgreSQL schema proving amount, note, balance, name columns strictly store ciphertext."}
              </p>
            </a>

            <a
              href="https://github.com/fikrisyahid/fiku/blob/main/main/app/actions/transactions.ts"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 transition-all group space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                <span className="group-hover:text-emerald-600 transition-colors">actions/transactions.ts</span>
                <span className="text-zinc-400 group-hover:translate-x-0.5 transition-transform">↗</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isId
                  ? "Server action transaksi yang mengenkripsi payload sebelum melakukan INSERT/UPDATE ke database."
                  : "Transaction server action demonstrating encrypt-before-write logic during INSERT and UPDATE queries."}
              </p>
            </a>
          </div>
        </div>

        {/* Security FAQs */}
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {isId ? "Pertanyaan Seputar Keamanan" : "Security & Privacy FAQ"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {isId
                ? "Jawaban transparan atas keraguan dan pertanyaan privasi Anda."
                : "Transparent answers to your privacy and protection questions."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-8">
          <Link
            href={user ? "/transaction" : "/login"}
            className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.02] transition-all"
          >
            <span>{isId ? "Mulai Catat dengan Aman di Fiku" : "Start Tracking Securely on Fiku"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
