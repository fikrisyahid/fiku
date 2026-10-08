"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmailPassword, registerWithEmailPassword } from "@/app/actions/auth";
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
  Mail,
  Lock,
  User,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email dan password wajib diisi.");
      return;
    }

    if (isRegister && !fullName.trim()) {
      setErrorMessage("Nama lengkap wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const res = await registerWithEmailPassword(fullName, email, password);
        if (res.success) {
          setSuccessMessage("Registrasi berhasil! Mengalihkan ke dashboard...");
          setTimeout(() => {
            router.push("/transaksi");
            router.refresh();
          }, 600);
        } else {
          setErrorMessage(res.message);
        }
      } else {
        const res = await loginWithEmailPassword(email, password);
        if (res.success) {
          setSuccessMessage("Login berhasil! Mengalihkan...");
          setTimeout(() => {
            router.push("/transaksi");
            router.refresh();
          }, 600);
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-inner">
          <Lock className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {isRegister ? "Buat Akun Baru" : "Masuk ke Fana"}
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
          {isRegister
            ? "Daftar dengan email dan password untuk mulai mengelola keuangan"
            : "Masuk dengan email dan password akun Fana kamu"}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <Label
                htmlFor="fullName"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Nama Lengkap
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  type="text"
                  placeholder="misal: Fikri Syahid"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="pl-10 h-11 text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus={!isRegister}
                required
                className="pl-10 h-11 text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Password
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Tampilkan
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="pl-10 h-11 text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {isRegister ? "Daftar Akun" : "Masuk"} <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col border-t border-zinc-100 dark:border-zinc-800/80 pt-3 pb-3 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isRegister ? "Sudah memiliki akun? " : "Belum punya akun? "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            {isRegister ? "Masuk di sini" : "Daftar sekarang"}
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}
