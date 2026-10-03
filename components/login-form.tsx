"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestTelegramOtp, verifyTelegramOtp } from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Send,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [maskedTarget, setMaskedTarget] = useState<string>("");
  const [countdown, setCountdown] = useState(0);

  // Timer countdown untuk kirim ulang OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle Request OTP
  async function handleRequestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage("Silakan masukkan username Telegram atau nomor HP.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await requestTelegramOtp(identifier);
      if (res.success) {
        setMaskedTarget(res.maskedTarget || "Telegram kamu");
        setSuccessMessage(res.message);
        setStep("otp");
        setCountdown(60); // 60 detik cooldown kirim ulang
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage("Masukkan 6 digit kode verifikasi dengan benar.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyTelegramOtp(identifier, otpCode);
      if (res.success) {
        setSuccessMessage("Verifikasi berhasil! Mengalihkan ke dashboard...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memverifikasi kode.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-inner">
          {step === "identifier" ? (
            <Send className="w-6 h-6 -translate-x-0.5" />
          ) : (
            <KeyRound className="w-6 h-6" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {step === "identifier" ? "Masuk ke Fana Web" : "Verifikasi Kode"}
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
          {step === "identifier"
            ? "Otentikasi instan tanpa kata sandi via Bot Telegram"
            : `Kode 6 digit telah dikirimkan ke chat ${maskedTarget}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && !errorMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <div className="leading-relaxed">{successMessage}</div>
          </div>
        )}

        {step === "identifier" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="identifier"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Username Telegram atau Nomor HP
              </Label>
              <div className="relative">
                <Input
                  id="identifier"
                  type="text"
                  placeholder="misal: @fikrisyahid14 atau 08123456789"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="pr-10 h-11 text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-xs">
                  TG
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                💡 Bot Fana akan mengirimkan 6 digit kode OTP langsung ke chat Telegram kamu.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Mengirim kode...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Kirim Kode ke Telegram <Send className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="otp"
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  6 Digit Kode OTP
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("identifier");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Ganti username
                </button>
              </div>

              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                disabled={loading}
                autoFocus
                className="h-12 text-center text-2xl font-mono tracking-[0.5em] font-bold bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                Buka notifikasi di aplikasi Telegram kamu untuk melihat kode.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Memverifikasi...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Verifikasi & Masuk <ShieldCheck className="w-4 h-4" />
                </span>
              )}
            </Button>

            <div className="pt-2 text-center">
              {countdown > 0 ? (
                <span className="text-xs text-zinc-400">
                  Kirim ulang kode dalam <b className="text-zinc-600 dark:text-zinc-300">{countdown}s</b>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Kirim Ulang Kode OTP
                </button>
              )}
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-col border-t border-zinc-100 dark:border-zinc-800/80 pt-3 pb-3 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Belum pernah mengaktifkan Fana?{" "}
          <a
            href="https://t.me/fanadev_bot"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            Buka Bot Telegram <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
