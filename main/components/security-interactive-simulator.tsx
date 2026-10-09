"use client";

import { useState } from "react";
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Server,
  Eye,
  EyeOff,
  Database,
  ArrowRight,
  Sparkles,
  Check,
  Copy,
  RefreshCw,
  Cpu,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function SecurityInteractiveSimulator() {
  const { locale } = useI18n();
  const isId = locale === "id";

  const [inputNote, setInputNote] = useState(
    isId ? "Makan siang sushi rahasia" : "Secret sushi lunch"
  );
  const [inputAmount, setInputAmount] = useState(175000);
  const [inputWallet, setInputWallet] = useState(
    isId ? "BCA Utama" : "Primary Bank"
  );

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedPayload, setEncryptedPayload] = useState<{
    amountCipher: string;
    noteCipher: string;
    ivHex: string;
    tagHex: string;
    ephemKey: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  function simulateEncryption() {
    setIsEncrypting(true);

    setTimeout(() => {
      // Deterministic simulation producing genuine-looking base64 AES-256-GCM / ECIES strings
      const randHex = (len: number) =>
        Array.from({ length: len }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");

      const iv = randHex(24);
      const tag = randHex(32);
      const ephem = `MCowBQYDK2VuAyEA${randHex(36)}...`;

      const noteB64 = btoa(encodeURIComponent(inputNote)) + randHex(12);
      const amountB64 = btoa(inputAmount.toString()) + randHex(8);

      setEncryptedPayload({
        amountCipher: `enc:v1:${ephem.slice(0, 16)}:${iv.slice(0, 16)}:${tag.slice(0, 16)}:${amountB64}`,
        noteCipher: `enc:v1:${ephem.slice(0, 16)}:${iv.slice(0, 16)}:${tag.slice(0, 16)}:${noteB64}`,
        ivHex: iv,
        tagHex: tag,
        ephemKey: ephem,
      });

      setIsEncrypting(false);
    }, 650);
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(isId ? "id-ID" : "en-US", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden transition-all">
      {/* Simulator Chrome Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span>{isId ? "Live Interactive Encryption Simulator" : "Live Interactive Encryption Simulator"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-mono font-semibold">
                AES-256-GCM
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isId
                ? "Ketik data uji coba apa saja di bawah untuk melihat bagaimana Fiku mengubahnya menjadi sandi acak sebelum disimpan di database."
                : "Type any sample data below to see how Fiku transforms it into unreadable ciphertext before writing to the database."}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isId ? "Zero-Knowledge" : "Zero-Knowledge"}</span>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Step 1: Input Panel */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] flex items-center justify-center font-bold">
              1
            </span>
            <span>{isId ? "Data Asli Anda (Hanya Terlihat di Perangkat Anda)" : "Your Plain Data (Only visible on your device)"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {isId ? "Catatan Transaksi" : "Transaction Note"}
              </label>
              <input
                type="text"
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                placeholder={isId ? "Contoh: Hadiah rahasia..." : "e.g. Secret gift..."}
                className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {isId ? "Nominal Transaksi" : "Amount (IDR)"}
              </label>
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(Number(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {isId ? "Nama Kantong" : "Wallet / Account"}
              </label>
              <input
                type="text"
                value={inputWallet}
                onChange={(e) => setInputWallet(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={simulateEncryption}
              disabled={isEncrypting || !inputNote.trim()}
              className="h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 gap-2 cursor-pointer transition-all active:scale-95"
            >
              {isEncrypting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isId ? "Menerapkan Enkripsi AES-256..." : "Applying AES-256 Encryption..."}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{isId ? "Enkripsi Sekarang & Simpan ke DB" : "Encrypt Now & Send to DB"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Comparison Section (Human vs Server view) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Left Box: Client Device Perspective */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {isId ? "Di Layar Aplikasi Anda (Decrypted)" : "On Your App Screen (Decrypted)"}
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                CLIENT SIDE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-900/30">
                <span className="text-zinc-500 dark:text-zinc-400">{isId ? "Nominal:" : "Amount:"}</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(inputAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-900/30">
                <span className="text-zinc-500 dark:text-zinc-400">{isId ? "Catatan:" : "Note:"}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                  &ldquo;{inputNote}&rdquo;
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 dark:text-zinc-400">{isId ? "Kantong:" : "Wallet:"}</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {inputWallet}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-emerald-700 dark:text-emerald-400/90 leading-relaxed flex items-start gap-1.5 bg-white/70 dark:bg-zinc-900/70 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                {isId
                  ? "Hanya sesi browser Anda yang memiliki kunci privat untuk mendekripsi teks ini. Data terbaca jernih bagi Anda."
                  : "Only your active browser session possesses the key to decrypt this. It reads cleanly for you."}
              </span>
            </div>
          </div>

          {/* Right Box: Database / Server Perspective */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-100 p-4 sm:p-5 space-y-3.5 relative overflow-hidden font-mono shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-bold text-rose-300">
                  {isId ? "Di Database Server Fiku (Ciphertext)" : "Inside Fiku DB Server (Ciphertext)"}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-900/60">
                ZERO-KNOWLEDGE
              </span>
            </div>

            {encryptedPayload ? (
              <div className="space-y-2.5 text-[11px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>amount (ciphertext):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(encryptedPayload.amountCipher, "amount")}
                      className="hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === "amount" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 break-all text-[10px] select-all leading-tight">
                    {encryptedPayload.amountCipher}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>note (ciphertext):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(encryptedPayload.noteCipher, "note")}
                      className="hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === "note" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 break-all text-[10px] select-all leading-tight">
                    {encryptedPayload.noteCipher}
                  </div>
                </div>

                <div className="pt-1 text-[10px] text-zinc-400 flex items-center gap-2">
                  <span className="text-zinc-500">IV (12B): {encryptedPayload.ivHex.slice(0, 10)}...</span>
                  <span className="text-zinc-500">Tag (16B): {encryptedPayload.tagHex.slice(0, 10)}...</span>
                </div>
              </div>
            ) : (
              <div className="py-7 text-center space-y-2">
                <Lock className="w-7 h-7 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">
                  {isId
                    ? "Klik tombol 'Enkripsi Sekarang' di atas untuk melihat wujud sandi biner yang tersimpan di server."
                    : "Click 'Encrypt Now' above to witness the encrypted ciphertext stored on the server."}
                </p>
              </div>
            )}

            <div className="pt-2 text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800 flex items-start gap-1.5 font-sans">
              <EyeOff className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
              <span>
                {isId
                  ? "Bahkan jika database kami diretas atau disita, siapa pun hanya mendapatkan serentetan huruf acak tanpa arti di atas."
                  : "Even if our database were breached, an attacker only gets the meaningless scrambled characters shown above."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
