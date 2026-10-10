"use server";

import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { onboardUser } from "@/lib/onboarding";
import {
  generateUserKeyPair,
  encryptPrivateKeyWithSecret,
  unlockUserSessionWithPassword,
  lockUserSession,
  getActiveUserPrivateKey,
  sealPrivateKeyForCookie,
  KEY_COOKIE_NAME,
} from "@/lib/crypto";

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

  // Double Protection: Unlock user session vault using Password + Server Secret Key (.env)
  let rawPrivKey: string | null = null;
  if (user.encryptedPrivateKey && user.pinSalt) {
    rawPrivKey = unlockUserSessionWithPassword(
      user.id,
      password,
      user.pinSalt,
      user.encryptedPrivateKey
    );
  } else {
    // Generate and securely store keypair for user if not yet present
    const keyPair = generateUserKeyPair();
    const encryptedPrivateKey = encryptPrivateKeyWithSecret(
      keyPair.privateKeyPem,
      password,
      keyPair.salt
    );

    await db
      .update(users)
      .set({
        publicKey: keyPair.publicKeyPem,
        encryptedPrivateKey,
        pinSalt: keyPair.salt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    rawPrivKey = unlockUserSessionWithPassword(
      user.id,
      password,
      keyPair.salt,
      encryptedPrivateKey
    );
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

  // Seal private key into HTTP-only cookie for serverless persistence across lambda containers
  if (rawPrivKey) {
    const sealedKey = sealPrivateKeyForCookie(rawPrivKey);
    cookieStore.set(KEY_COOKIE_NAME, sealedKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessionExpiresAt,
    });
  }

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

  // Generate securely user keypair with Double Protection (Password + APP_SECRET_KEY)
  const keyPair = generateUserKeyPair();
  const encryptedPrivateKey = encryptPrivateKeyWithSecret(
    keyPair.privateKeyPem,
    password,
    keyPair.salt
  );

  // Use onboardUser to create default starter wallets (Cash, Bank, e-Wallet) encrypted with user's publicKey
  const onboard = await onboardUser({
    fullName: name,
    email,
    publicKey: keyPair.publicKeyPem,
  });

  // Update passwordHash & cryptographic keys, and ensure email & fullName
  const [updatedUser] = await db
    .update(users)
    .set({
      fullName: name,
      email,
      passwordHash,
      publicKey: keyPair.publicKeyPem,
      encryptedPrivateKey,
      pinSalt: keyPair.salt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, onboard.user.id))
    .returning();

  // Unlock RAM session vault and get raw key
  const rawPrivKey = unlockUserSessionWithPassword(
    onboard.user.id,
    password,
    keyPair.salt,
    encryptedPrivateKey
  );

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

  // Seal private key into HTTP-only cookie for serverless persistence across lambda containers
  if (rawPrivKey) {
    const sealedKey = sealPrivateKeyForCookie(rawPrivKey);
    cookieStore.set(KEY_COOKIE_NAME, sealedKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessionExpiresAt,
    });
  }

  return {
    success: true,
    message: "Registrasi berhasil!",
    user: {
      id: updatedUser?.id || onboard.user.id,
      fullName: updatedUser?.fullName || name,
      email: updatedUser?.email || email,
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

  // Stateless session key retrieval (checks in-memory RAM cache first, falls back to sealed cookie)
  const privKey = await getActiveUserPrivateKey(session.user.id);
  if (!privKey) {
    try {
      await db.delete(sessions).where(eq(sessions.id, token));
      cookieStore.delete(SESSION_COOKIE_NAME);
      cookieStore.delete(KEY_COOKIE_NAME);
    } catch {
      // Ignore DB errors during cleanup
    }
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
    if (session?.userId) {
      lockUserSession(session.userId);
    }
    await db.delete(sessions).where(eq(sessions.id, token));
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(KEY_COOKIE_NAME);
  }
  return { success: true };
}

export async function setupUserPinAction(userId: string, pin: string) {
  // Kept for bot-commands handler compatibility
  return { success: true };
}
