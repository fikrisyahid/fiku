"use server";

import { db } from "@/db";
import { users, authOtpCodes, sessions } from "@/db/schema";
import { eq, and, gt, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { bot } from "@/lib/bot";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "fana_session";
const SESSION_DURATION_DAYS = 30;

function normalizeIdentifier(raw: string): { type: "username" | "phone"; value: string } {
  const clean = raw.trim();
  // Jika diawali @ atau mengandung huruf, anggap sebagai username Telegram
  if (clean.startsWith("@") || /[a-zA-Z]/.test(clean)) {
    return {
      type: "username",
      value: clean.replace(/^@/, "").toLowerCase(),
    };
  }
  // Jika murni angka / simbol telepon
  let phone = clean.replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) {
    phone = "62" + phone.slice(1);
  }
  return {
    type: "phone",
    value: phone,
  };
}

export async function requestTelegramOtp(identifier: string): Promise<{
  success: boolean;
  message: string;
  maskedTarget?: string;
}> {
  if (!identifier || identifier.trim().length < 3) {
    return {
      success: false,
      message: "Masukkan username Telegram atau nomor HP yang valid.",
    };
  }

  const { type, value } = normalizeIdentifier(identifier);

  // 1. Cari user di database berdasarkan username atau nomor HP
  let user;
  if (type === "username") {
    user = await db.query.users.findFirst({
      where: sql`lower(${users.telegramUsername}) = ${value.toLowerCase()}`,
    });
  } else {
    const rawDigits = value.replace(/[^0-9]/g, "");
    const localDigits = rawDigits.startsWith("62") ? "0" + rawDigits.slice(2) : rawDigits;
    user = await db.query.users.findFirst({
      where: or(
        eq(users.phone, rawDigits),
        eq(users.phone, localDigits),
        eq(users.phone, "+" + rawDigits),
        eq(users.phone, "+" + localDigits),
        sql`regexp_replace(${users.phone}, '[^0-9]', '', 'g') = ${rawDigits}`
      ),
    });
  }

  // Jika belum terdaftar sama sekali
  if (!user) {
    return {
      success: false,
      message:
        "Akun belum terdaftar di Fana. Silakan buka bot Telegram kami terlebih dahulu dan ketik /start untuk mengaktifkan akunmu.",
    };
  }

  // Jika belum ada telegramId (belum pernah chat bot)
  if (!user.telegramId) {
    return {
      success: false,
      message:
        "Akunmu belum terhubung ke chat bot Telegram. Buka bot Telegram kami dan ketik /start untuk mengaktifkannya.",
    };
  }

  // 2. Generate 6 digit OTP acak
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

  // Nonaktifkan OTP lama yang belum terpakai
  await db
    .update(authOtpCodes)
    .set({ used: true })
    .where(and(eq(authOtpCodes.userId, user.id), eq(authOtpCodes.used, false)));

  // Simpan OTP baru ke database
  await db.insert(authOtpCodes).values({
    userId: user.id,
    code: otpCode,
    expiresAt,
  });

  // 3. Kirim OTP via Telegram Bot langsung ke chat pengguna
  try {
    await bot.api.sendMessage(
      user.telegramId,
      `🔐 *KODE VERIFIKASI LOGIN FANA*\n` +
        `───────────────────\n` +
        `Halo *${user.fullName}*! Berikut kode login kamu ke Dashboard Web:\n\n` +
        `👉 \`${otpCode}\`\n\n` +
        `⏱️ _Kode ini berlaku selama 5 menit._\n` +
        `⚠️ _Jangan berikan kode ini kepada siapa pun demi keamanan akunmu._`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Gagal mengirim OTP via bot:", err);
    return {
      success: false,
      message:
        "Gagal mengirim kode ke Telegram. Pastikan kamu belum memblokir bot Fana di Telegram.",
    };
  }

  const masked = user.telegramUsername
    ? `@${user.telegramUsername.slice(0, 3)}***`
    : user.phone
    ? `${user.phone.slice(0, 4)}****${user.phone.slice(-3)}`
    : "chat Telegram kamu";

  return {
    success: true,
    message: `Kode verifikasi telah dikirimkan ke Telegram (${masked})!`,
    maskedTarget: masked,
  };
}

export async function verifyTelegramOtp(
  identifier: string,
  code: string
): Promise<{
  success: boolean;
  message: string;
  user?: { id: string; fullName: string; email: string };
}> {
  if (!identifier || !code || code.trim().length !== 6) {
    return { success: false, message: "Kode OTP harus berupa 6 angka." };
  }

  const { type, value } = normalizeIdentifier(identifier);

  let user;
  if (type === "username") {
    user = await db.query.users.findFirst({
      where: sql`lower(${users.telegramUsername}) = ${value.toLowerCase()}`,
    });
  } else {
    const rawDigits = value.replace(/[^0-9]/g, "");
    const localDigits = rawDigits.startsWith("62") ? "0" + rawDigits.slice(2) : rawDigits;
    user = await db.query.users.findFirst({
      where: or(
        eq(users.phone, rawDigits),
        eq(users.phone, localDigits),
        eq(users.phone, "+" + rawDigits),
        eq(users.phone, "+" + localDigits),
        sql`regexp_replace(${users.phone}, '[^0-9]', '', 'g') = ${rawDigits}`
      ),
    });
  }

  if (!user) {
    return { success: false, message: "Pengguna tidak ditemukan." };
  }

  // Cari OTP aktif yang cocok
  const validOtp = await db.query.authOtpCodes.findFirst({
    where: and(
      eq(authOtpCodes.userId, user.id),
      eq(authOtpCodes.code, code.trim()),
      eq(authOtpCodes.used, false),
      gt(authOtpCodes.expiresAt, new Date())
    ),
  });

  if (!validOtp) {
    return {
      success: false,
      message: "Kode verifikasi salah atau sudah kadaluarsa. Silakan minta kode baru.",
    };
  }

  // Tandai OTP telah digunakan
  await db
    .update(authOtpCodes)
    .set({ used: true })
    .where(eq(authOtpCodes.id, validOtp.id));

  // Buat sesi login baru di database
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const sessionExpiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  await db.insert(sessions).values({
    id: sessionToken,
    userId: user.id,
    expiresAt: sessionExpiresAt,
  });

  // Simpan session token ke cookie HTTP-Only
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: sessionExpiresAt,
  });

  return {
    success: true,
    message: "Login berhasil!",
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    },
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())),
    with: {
      user: true,
    },
  });

  if (!session || !session.user) {
    return null;
  }

  return session.user;
}

export async function logoutUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
  return { success: true };
}
