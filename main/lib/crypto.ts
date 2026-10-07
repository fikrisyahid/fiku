import crypto from "crypto";

const SERVER_PEPPER = process.env.ENCRYPTION_PEPPER || "fana_secure_server_pepper_default_2026";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 Hours

// In-Memory RAM Session Vault for user private keys (Zero-Knowledge Session)
interface ActiveSession {
  privateKey: Buffer;
  expiresAt: number;
}

const ramSessionVault = new Map<string, ActiveSession>();

/**
 * Derive 256-bit encryption key from user PIN + Salt + Pepper
 */
export function deriveKeyFromPin(pin: string, salt: string): Buffer {
  const combinedSecret = `${pin}:${SERVER_PEPPER}`;
  return crypto.pbkdf2Sync(combinedSecret, salt, 100000, 32, "sha256");
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
 * Encrypt user Private Key using PIN-derived key (AES-256-GCM)
 */
export function encryptPrivateKeyWithPin(privateKeyPem: string, pin: string, salt: string): string {
  const key = deriveKeyFromPin(pin, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(privateKeyPem, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  // Format: iv:authTag:ciphertext
  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt user Private Key using PIN
 */
export function decryptPrivateKeyWithPin(encryptedPayload: string, pin: string, salt: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encryptedPayload.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Invalid encrypted key format.");
  }

  const key = deriveKeyFromPin(pin, salt);
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextB64, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
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

/**
 * Decrypt ciphertext payload using recipient Private Key.
 * Used when READING balances/history once the user unlocks their session.
 */
export function decryptWithPrivateKey(ciphertextPayload: string, privateKeyPem: string): string {
  if (!ciphertextPayload.startsWith("enc:v1:")) {
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

  const privKey = crypto.createPrivateKey(privateKeyPem);
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
// IN-MEMORY SESSION VAULT MANAGEMENT (RAM)
// -------------------------------------------------------------

/**
 * Unlock user key session in RAM after PIN verification
 */
export function unlockUserSession(userId: string, privateKeyPem: string) {
  ramSessionVault.set(userId, {
    privateKey: Buffer.from(privateKeyPem, "utf8"),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

/**
 * Retrieve user Private Key from RAM if session is active
 */
export function getActiveUserPrivateKey(userId: string): string | null {
  const session = ramSessionVault.get(userId);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    ramSessionVault.delete(userId);
    return null;
  }

  // Refresh TTL on active interaction
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session.privateKey.toString("utf8");
}

/**
 * Check whether user session is currently active in RAM
 */
export function isUserSessionActive(userId: string): boolean {
  return getActiveUserPrivateKey(userId) !== null;
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
