import crypto from "crypto";

const SERVER_PEPPER = process.env.ENCRYPTION_PEPPER || "fana_secure_server_pepper_default_2026";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 Jam

// In-Memory RAM Session Vault untuk Private Key user (Zero-Knowledge Session)
interface ActiveSession {
  privateKey: Buffer;
  expiresAt: number;
}

const ramSessionVault = new Map<string, ActiveSession>();

/**
 * Derivasi Kunci Enkripsi 256-bit dari PIN user + Salt + Pepper
 */
export function deriveKeyFromPin(pin: string, salt: string): Buffer {
  const combinedSecret = `${pin}:${SERVER_PEPPER}`;
  return crypto.pbkdf2Sync(combinedSecret, salt, 100000, 32, "sha256");
}

/**
 * Buat hash PIN aman untuk verifikasi instan di Web login
 */
export function hashPin(pin: string, salt: string): string {
  const combined = `${pin}:${salt}:${SERVER_PEPPER}`;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

/**
 * Verifikasi PIN
 */
export function verifyPin(pin: string, salt: string, storedHash: string): boolean {
  const computed = hashPin(pin, salt);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
}

/**
 * Generate pasangan kunci Asimetris X25519 (Curve25519) untuk user
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
 * Enkripsi Private Key user menggunakan kunci turunan PIN (AES-256-GCM)
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
 * Dekripsi Private Key user menggunakan PIN
 */
export function decryptPrivateKeyWithPin(encryptedPayload: string, pin: string, salt: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encryptedPayload.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Format kunci terenkripsi tidak valid.");
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
 * Enkripsi data teks menggunakan Public Key user (Asymmetric / ECIES-style via ECDH Ephemeral Key)
 * Digunakan saat MENULIS transaksi tanpa perlu PIN user.
 */
export function encryptWithPublicKey(plaintext: string, recipientPublicKeyPem: string): string {
  // 1. Buat ephemeral key pair
  const ephemeral = crypto.generateKeyPairSync("x25519");

  // 2. Derive shared secret via ECDH
  const recipientKey = crypto.createPublicKey(recipientPublicKeyPem);
  const sharedSecret = crypto.diffieHellman({
    privateKey: ephemeral.privateKey,
    publicKey: recipientKey,
  });

  // 3. Derive symmetric key via SHA-256
  const aesKey = crypto.createHash("sha256").update(sharedSecret).digest();

  // 4. Enkripsi teks dengan AES-256-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  const ephemPubPem = ephemeral.publicKey.export({ type: "spki", format: "der" }).toString("base64");

  // Format: ephemPubKeyDer:iv:authTag:ciphertext
  return `enc:v1:${ephemPubPem}:${iv.toString("base64")}:${authTag}:${encrypted}`;
}

/**
 * Dekripsi data teks menggunakan Private Key user
 * Digunakan saat MEMBACA saldo/riwayat setelah user unlock PIN.
 */
export function decryptWithPrivateKey(ciphertextPayload: string, privateKeyPem: string): string {
  if (!ciphertextPayload.startsWith("enc:v1:")) {
    // Jika data lama belum terenkripsi (plaintext legacy), kembalikan langsung
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
 * Buka sesi kunci user di RAM setelah verifikasi PIN
 */
export function unlockUserSession(userId: string, privateKeyPem: string) {
  ramSessionVault.set(userId, {
    privateKey: Buffer.from(privateKeyPem, "utf8"),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

/**
 * Ambil Private Key user dari RAM jika sesi masih aktif
 */
export function getActiveUserPrivateKey(userId: string): string | null {
  const session = ramSessionVault.get(userId);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    ramSessionVault.delete(userId);
    return null;
  }

  // Refresh TTL saat user aktif berinteraksi
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session.privateKey.toString("utf8");
}

/**
 * Cek apakah user sedang aktif kuncinya di RAM
 */
export function isUserSessionActive(userId: string): boolean {
  return getActiveUserPrivateKey(userId) !== null;
}

/**
 * Kunci sesi user secara manual atau hapus saat reset akun
 */
export function lockUserSession(userId: string) {
  const session = ramSessionVault.get(userId);
  if (session) {
    // Timpa buffer memori dengan zero bytes sebelum dihapus demi keamanan
    session.privateKey.fill(0);
    ramSessionVault.delete(userId);
  }
}
