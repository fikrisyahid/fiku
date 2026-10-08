"use server";

import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { onboardUser } from "@/lib/onboarding";

const SESSION_COOKIE_NAME = "fana_session";
const SESSION_DURATION_DAYS = 30;

export async function loginWithEmailPassword(
  rawEmail: string,
  rawPassword: string
): Promise<{
  success: boolean;
  message: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}> {
  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();

  if (!email || !password) {
    return { success: false, message: "Email dan password wajib diisi." };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return {
      success: false,
      message: "Akun dengan email ini belum terdaftar. Silakan daftar terlebih dahulu.",
    };
  }

  if (!user.passwordHash) {
    // If user existed before email/password was introduced
    return {
      success: false,
      message: "Akun ini belum memiliki password. Silakan reset atau daftarkan akun baru.",
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: "Password salah. Silakan periksa kembali." };
  }

  // Create session
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

export async function registerWithEmailPassword(
  fullName: string,
  rawEmail: string,
  rawPassword: string
): Promise<{
  success: boolean;
  message: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}> {
  const name = fullName.trim();
  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();

  if (!name || !email || !password) {
    return { success: false, message: "Nama, email, dan password wajib diisi." };
  }

  if (password.length < 6) {
    return { success: false, message: "Password minimal 6 karakter." };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return {
      success: false,
      message: "Email sudah terdaftar. Silakan login.",
    };
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Use onboardUser to create default starter wallets (Cash, Bank, e-Wallet)
  const onboard = await onboardUser({
    fullName: name,
    email,
  });

  // Update passwordHash
  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, onboard.user.id));

  // Automatically log in
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionToken,
    userId: onboard.user.id,
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
    message: "Registrasi berhasil!",
    user: {
      id: onboard.user.id,
      fullName: onboard.user.fullName,
      email: onboard.user.email,
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

export async function setupUserPinAction(userId: string, pin: string) {
  // Kept for bot-commands handler compatibility
  return { success: true };
}
