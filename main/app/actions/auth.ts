"use server";

import { db } from "@/db";
import { users, authOtpCodes, sessions } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { bot } from "@/lib/bot";
import crypto from "crypto";
import {
  generateUserKeyPair,
  encryptPrivateKeyWithPin,
  decryptPrivateKeyWithPin,
  hashPin,
  verifyPin,
  unlockUserSession,
  lockUserSession,
} from "@/lib/crypto";

const SESSION_COOKIE_NAME = "fana_session";
const SESSION_DURATION_DAYS = 30;

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export async function requestTelegramOtp(rawUsername: string): Promise<{
  success: boolean;
  message: string;
  maskedTarget?: string;
}> {
  const username = normalizeUsername(rawUsername);
  if (!username || username.length < 3) {
    return {
      success: false,
      message: "Masukkan username Telegram yang valid (contoh: @fikrisyahid14).",
    };
  }

  // 1. Cari user di database berdasarkan username Telegram
  const user = await db.query.users.findFirst({
    where: sql`lower(${users.telegramUsername}) = ${username}`,
  });

  // Jika belum terdaftar sama sekali
  if (!user) {
    return {
      success: false,
      message: `Username @${username} belum terdaftar di Fana. Silakan buka bot Telegram kami terlebih dahulu dan ketik /start untuk mengaktifkan akunmu.`,
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

  const masked = `@${username.slice(0, 3)}***`;

  return {
    success: true,
    message: `Kode verifikasi telah dikirimkan ke Telegram (${masked})!`,
    maskedTarget: masked,
  };
}

export async function verifyTelegramOtp(
  rawUsername: string,
  code: string
): Promise<{
  success: boolean;
  message: string;
  user?: { id: string; fullName: string; email: string };
}> {
  const username = normalizeUsername(rawUsername);
  if (!username || !code || code.trim().length !== 6) {
    return { success: false, message: "Kode OTP harus berupa 6 angka." };
  }

  const user = await db.query.users.findFirst({
    where: sql`lower(${users.telegramUsername}) = ${username}`,
  });

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
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, token),
    });
    if (session) {
      lockUserSession(session.userId);
    }
    await db.delete(sessions).where(eq(sessions.id, token));
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
  return { success: true };
}

export async function setupUserPinAction(userId: string, pin: string) {
  const cleanPin = pin.trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    throw new Error("PIN harus berupa 6 digit angka.");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  const { publicKeyPem, privateKeyPem, salt } = generateUserKeyPair();
  const encryptedPrivKey = encryptPrivateKeyWithPin(privateKeyPem, cleanPin, salt);
  const pinHash = hashPin(cleanPin, salt);

  await db
    .update(users)
    .set({
      pinHash,
      pinSalt: salt,
      publicKey: publicKeyPem,
      encryptedPrivateKey: encryptedPrivKey,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  unlockUserSession(userId, privateKeyPem);

  return { success: true, publicKey: publicKeyPem };
}

export async function loginWithPin(rawUsername: string, pin: string): Promise<{
  success: boolean;
  message: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}> {
  const username = normalizeUsername(rawUsername);
  const cleanPin = pin.trim();

  if (!username) {
    return { success: false, message: "Masukkan username Telegram kamu." };
  }

  if (!/^\d{6}$/.test(cleanPin)) {
    return { success: false, message: "PIN harus berupa 6 digit angka." };
  }

  const user = await db.query.users.findFirst({
    where: sql`lower(${users.telegramUsername}) = ${username}`,
  });

  if (!user) {
    return {
      success: false,
      message: `Username @${username} belum terdaftar di Fana. Buka bot Telegram dan ketik /start untuk mengaktifkan akunmu.`,
    };
  }

  if (!user.pinHash || !user.pinSalt || !user.encryptedPrivateKey) {
    return {
      success: false,
      message: `Akun @${username} belum mengatur PIN keamanan. Buka bot Telegram dan ketik /set_pin <6_digit> terlebih dahulu.`,
    };
  }

  const isValid = verifyPin(cleanPin, user.pinSalt, user.pinHash);
  if (!isValid) {
    return { success: false, message: "PIN keamanan salah. Silakan periksa kembali." };
  }

  try {
    const privKey = decryptPrivateKeyWithPin(user.encryptedPrivateKey, cleanPin, user.pinSalt);
    unlockUserSession(user.id, privKey);
  } catch (err) {
    console.error("Gagal membuka kunci sesi dengan PIN:", err);
  }

  // Buat sesi login web
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionToken,
    userId: user.id,
    expiresAt: sessionExpiresAt,
  });

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
