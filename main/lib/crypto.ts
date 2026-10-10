import crypto from "crypto";

const SERVER_PEPPER = process.env.ENCRYPTION_PEPPER || "fana_secure_server_pepper_default_2026";
const APP_SECRET_KEY = process.env.APP_SECRET_KEY || "fana_app_secret_key_double_protection_2026";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 Hours

// In-Memory RAM Session Vault for user private keys (Zero-Knowledge Session)
interface ActiveSession {
  privateKey: Buffer;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __fana_ramSessionVault: Map<string, ActiveSession> | undefined;
}

const ramSessionVault: Map<string, ActiveSession> =
  globalThis.__fana_ramSessionVault ||
  (globalThis.__fana_ramSessionVault = new Map<string, ActiveSession>());

/**
 * Derive 256-bit encryption key combining:
 * 1. User Secret (Password or PIN)
 * 2. Per-User Salt
 * 3. Server Pepper (ENCRYPTION_PEPPER)
 * 4. Master Secret Key (.env APP_SECRET_KEY) -> Double Protection
 */
export function deriveKeyFromSecret(userSecret: string, salt: string): Buffer {
  const combinedSecret = `${userSecret}:${SERVER_PEPPER}:${APP_SECRET_KEY}`;
  return crypto.pbkdf2Sync(combinedSecret, salt, 100000, 32, "sha256");
}

/**
 * Legacy alias for deriveKeyFromPin
 */
export function deriveKeyFromPin(pin: string, salt: string): Buffer {
  return deriveKeyFromSecret(pin, salt);
}

/**
 * Generate secure PIN hash for fast verification during Web login
 */
export function hashPin(pin: string, salt: string): string {
  const combined = `${pin}:${salt}:${SERVER_PEPPER}`;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

/**
 * Verify provided PIN against stored hash
 */
export function verifyPin(pin: string, salt: string, storedHash: string): boolean {
  const computed = hashPin(pin, salt);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
}

/**
 * Generate asymmetric X25519 (Curve25519) keypair for a user
 */
export function generateUserKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const salt = crypto.randomBytes(16).toString("hex");

  return {
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
    salt,
  };
}

/**
 * Encrypt user Private Key using User Secret (Password or PIN) + Server Secret Key (Double Protection)
 */
export function encryptPrivateKeyWithSecret(privateKeyPem: string, secret: string, salt: string): string {
  const key = deriveKeyFromSecret(secret, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(privateKeyPem, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  // Format: iv:authTag:ciphertext
  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt user Private Key using User Secret (Password or PIN) + Server Secret Key (Double Protection)
 */
export function decryptPrivateKeyWithSecret(encryptedPayload: string, secret: string, salt: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encryptedPayload.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Invalid encrypted key format.");
  }

  const key = deriveKeyFromSecret(secret, salt);
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextB64, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt user Private Key using PIN-derived key (AES-256-GCM)
 */
export function encryptPrivateKeyWithPin(privateKeyPem: string, pin: string, salt: string): string {
  return encryptPrivateKeyWithSecret(privateKeyPem, pin, salt);
}

/**
 * Decrypt user Private Key using PIN
 */
export function decryptPrivateKeyWithPin(encryptedPayload: string, pin: string, salt: string): string {
  return decryptPrivateKeyWithSecret(encryptedPayload, pin, salt);
}

/**
 * Encrypt plaintext using recipient Public Key (Asymmetric / ECIES-style via ECDH Ephemeral Key).
 * Used when WRITING transactions without requiring the user's PIN.
 */
export function encryptWithPublicKey(plaintext: string, recipientPublicKeyPem: string): string {
  // 1. Create ephemeral keypair
  const ephemeral = crypto.generateKeyPairSync("x25519");

  // 2. Derive shared secret via ECDH
  const recipientKey = crypto.createPublicKey(recipientPublicKeyPem);
  const sharedSecret = crypto.diffieHellman({
    privateKey: ephemeral.privateKey,
    publicKey: recipientKey,
  });

  // 3. Derive symmetric key via SHA-256
  const aesKey = crypto.createHash("sha256").update(sharedSecret).digest();

  // 4. Encrypt plaintext with AES-256-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  const ephemPubPem = ephemeral.publicKey.export({ type: "spki", format: "der" }).toString("base64");

  // Format: enc:v1:ephemPubKeyDer:iv:authTag:ciphertext
  return `enc:v1:${ephemPubPem}:${iv.toString("base64")}:${authTag}:${encrypted}`;
}

// In-Memory cache for parsed private KeyObjects to avoid heavy createPrivateKey() PEM parsing on every decrypt
const privateKeyObjectCache = new Map<string, crypto.KeyObject>();

/**
 * Returns a cached or newly parsed crypto.KeyObject for a given privateKeyPem.
 */
export function getOrCreatePrivateKeyObject(privateKeyPem: string): crypto.KeyObject {
  let keyObj = privateKeyObjectCache.get(privateKeyPem);
  if (!keyObj) {
    keyObj = crypto.createPrivateKey(privateKeyPem);
    // Keep cache bounded to prevent memory growth across lambdas
    if (privateKeyObjectCache.size > 200) {
      privateKeyObjectCache.clear();
    }
    privateKeyObjectCache.set(privateKeyPem, keyObj);
  }
  return keyObj;
}

/**
 * Decrypt ciphertext payload using recipient Private Key (PEM string or KeyObject).
 * Used when READING balances/history once the user unlocks their session.
 */
export function decryptWithPrivateKey(
  ciphertextPayload: string,
  privateKey: string | crypto.KeyObject
): string {
  if (!ciphertextPayload || !ciphertextPayload.startsWith("enc:v1:")) {
    // If legacy plaintext data, return as-is
    return ciphertextPayload;
  }

  const parts = ciphertextPayload.split(":");
  // parts[0] = "enc", parts[1] = "v1", parts[2] = ephemPubKey, parts[3] = iv, parts[4] = authTag, parts[5] = ciphertext
  const ephemPubDer = Buffer.from(parts[2], "base64");
  const iv = Buffer.from(parts[3], "base64");
  const authTag = Buffer.from(parts[4], "base64");
  const ciphertext = parts[5];

  const ephemPublicKey = crypto.createPublicKey({
    key: ephemPubDer,
    format: "der",
    type: "spki",
  });

  const privKey =
    typeof privateKey === "string"
      ? getOrCreatePrivateKeyObject(privateKey)
      : privateKey;

  const sharedSecret = crypto.diffieHellman({
    privateKey: privKey,
    publicKey: ephemPublicKey,
  });

  const aesKey = crypto.createHash("sha256").update(sharedSecret).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// -------------------------------------------------------------
// STATELESS COOKIE SESSION VAULT & IN-MEMORY CACHE
// -------------------------------------------------------------

export const KEY_COOKIE_NAME = "fana_key_vault";

/**
 * Encrypt user's raw privateKeyPem for storing in an HTTP-only cookie.
 * Encrypted using APP_SECRET_KEY + SERVER_PEPPER with AES-256-GCM.
 */
export function sealPrivateKeyForCookie(privateKeyPem: string): string {
  const masterKey = crypto
    .createHash("sha256")
    .update(`${APP_SECRET_KEY}:${SERVER_PEPPER}:fiku_cookie_vault`)
    .digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
  let encrypted = cipher.update(privateKeyPem, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");
  return `${iv.toString("base64")}.${authTag}.${encrypted}`;
}

/**
 * Decrypt user's raw privateKeyPem from sealed cookie payload.
 */
export function unsealPrivateKeyFromCookie(sealedCookie: string): string | null {
  try {
    const parts = sealedCookie.split(".");
    if (parts.length !== 3) return null;
    const [ivB64, authTagB64, ciphertextB64] = parts;
    const masterKey = crypto
      .createHash("sha256")
      .update(`${APP_SECRET_KEY}:${SERVER_PEPPER}:fiku_cookie_vault`)
      .digest();
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertextB64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Failed to unseal private key from cookie:", err);
    return null;
  }
}

/**
 * Unlock user key session in RAM after PIN/Password verification
 */
export function unlockUserSession(userId: string, privateKeyPem: string) {
  ramSessionVault.set(userId, {
    privateKey: Buffer.from(privateKeyPem, "utf8"),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

/**
 * Retrieve user Private Key from RAM cache or fallback to sealed cookie
 */
export async function getActiveUserPrivateKey(userId?: string): Promise<string | null> {
  // 1. Check in-memory RAM cache first if userId provided
  if (userId) {
    const session = ramSessionVault.get(userId);
    if (session && Date.now() <= session.expiresAt) {
      session.expiresAt = Date.now() + SESSION_TTL_MS;
      return session.privateKey.toString("utf8");
    }
  }

  // 2. Stateless Fallback: Read sealed cookie (works across any serverless lambda container)
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sealed = cookieStore.get(KEY_COOKIE_NAME)?.value;
    if (sealed) {
      const unsealedKey = unsealPrivateKeyFromCookie(sealed);
      if (unsealedKey) {
        if (userId) {
          // Warm the memory cache for this container
          unlockUserSession(userId, unsealedKey);
        }
        return unsealedKey;
      }
    }
  } catch {
    // If called outside of request context, ignore
  }

  return null;
}

/**
 * Unlock user key session in RAM after password verification
 * Uses Password + per-user Salt + Server Pepper + APP_SECRET_KEY (Double Protection)
 */
export function unlockUserSessionWithPassword(
  userId: string,
  password: string,
  salt: string,
  encryptedPrivateKey: string
): string | null {
  try {
    const privKey = decryptPrivateKeyWithSecret(encryptedPrivateKey, password, salt);
    unlockUserSession(userId, privKey);
    return privKey;
  } catch (err) {
    console.error("Failed to unlock user session with password:", err);
    return null;
  }
}

/**
 * Check whether user session is currently active in RAM or sealed cookie
 */
export async function isUserSessionActive(userId: string): Promise<boolean> {
  const key = await getActiveUserPrivateKey(userId);
  return key !== null;
}

/**
 * Lock user session manually or purge upon account reset
 */
export function lockUserSession(userId: string) {
  const session = ramSessionVault.get(userId);
  if (session) {
    // Zero-fill private key memory buffer before eviction for defense in depth
    session.privateKey.fill(0);
    ramSessionVault.delete(userId);
  }
}

/**
 * Retrieve user Public Key for asymmetric encryption
 */
export async function getUserPublicKey(userId: string): Promise<string | null> {
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      publicKey: true,
    },
  });

  return user?.publicKey || null;
}
