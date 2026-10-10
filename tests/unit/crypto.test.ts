import { describe, expect, it } from "bun:test";
import {
  deriveKeyFromSecret,
  hashPin,
  verifyPin,
  generateUserKeyPair,
  encryptPrivateKeyWithSecret,
  decryptPrivateKeyWithSecret,
  encryptWithPublicKey,
  decryptWithPrivateKey,
} from "../../main/lib/crypto";

describe("Crypto Module Unit Tests", () => {
  it("should derive deterministic 256-bit key from user secret and salt", () => {
    const secret = "SuperSecretPassword123!";
    const salt = "a1b2c3d4e5f67890";
    const key1 = deriveKeyFromSecret(secret, salt);
    const key2 = deriveKeyFromSecret(secret, salt);

    expect(key1).toBeInstanceOf(Buffer);
    expect(key1.length).toBe(32); // 256 bits
    expect(key1.toString("hex")).toBe(key2.toString("hex"));

    const differentKey = deriveKeyFromSecret("DifferentPassword", salt);
    expect(key1.toString("hex")).not.toBe(differentKey.toString("hex"));
  });

  it("should hash and verify PIN with timingSafeEqual", () => {
    const pin = "123456";
    const salt = "random_salt_12345";
    const hash = hashPin(pin, salt);

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(64); // SHA-256 hex string

    expect(verifyPin("123456", salt, hash)).toBe(true);
    expect(verifyPin("654321", salt, hash)).toBe(false);
    expect(verifyPin("123456", "wrong_salt", hash)).toBe(false);
  });

  it("should generate valid X25519 asymmetric key pair", () => {
    const keyPair = generateUserKeyPair();

    expect(keyPair.publicKeyPem).toContain("BEGIN PUBLIC KEY");
    expect(keyPair.publicKeyPem).toContain("END PUBLIC KEY");
    expect(keyPair.privateKeyPem).toContain("BEGIN PRIVATE KEY");
    expect(keyPair.privateKeyPem).toContain("END PRIVATE KEY");
    expect(keyPair.salt).toBeDefined();
    expect(keyPair.salt.length).toBe(32); // 16 bytes in hex
  });

  it("should encrypt and decrypt private key using user secret (AES-256-GCM)", () => {
    const keyPair = generateUserKeyPair();
    const secret = "MyMasterPassword2026!";

    const encryptedPayload = encryptPrivateKeyWithSecret(
      keyPair.privateKeyPem,
      secret,
      keyPair.salt
    );

    // Format: iv:authTag:ciphertext
    const parts = encryptedPayload.split(":");
    expect(parts.length).toBe(3);

    const decryptedPem = decryptPrivateKeyWithSecret(
      encryptedPayload,
      secret,
      keyPair.salt
    );

    expect(decryptedPem).toBe(keyPair.privateKeyPem);

    // Wrong password should fail to decrypt (authentication tag verification failure)
    expect(() => {
      decryptPrivateKeyWithSecret(encryptedPayload, "WrongPassword!", keyPair.salt);
    }).toThrow();
  });

  it("should encrypt with public key and decrypt with private key (ECIES ECDH)", () => {
    const keyPair = generateUserKeyPair();
    const sensitiveData = "5000000"; // Transaction nominal Rp 5.000.000

    const encrypted = encryptWithPublicKey(sensitiveData, keyPair.publicKeyPem);
    expect(encrypted.startsWith("enc:v1:")).toBe(true);

    const decrypted = decryptWithPrivateKey(encrypted, keyPair.privateKeyPem);
    expect(decrypted).toBe(sensitiveData);

    // Should return plaintext as-is if ciphertext is not encrypted (legacy fallback)
    expect(decryptWithPrivateKey("plain_legacy_data", keyPair.privateKeyPem)).toBe(
      "plain_legacy_data"
    );
  });

  it("should utilize memory cache for repeated decryptions", () => {
    const keyPair = generateUserKeyPair();
    const payload = "Beli Kopi Kenangan 25k";

    const encrypted = encryptWithPublicKey(payload, keyPair.publicKeyPem);

    const dec1 = decryptWithPrivateKey(encrypted, keyPair.privateKeyPem);
    const dec2 = decryptWithPrivateKey(encrypted, keyPair.privateKeyPem);

    expect(dec1).toBe(payload);
    expect(dec2).toBe(payload);
  });
});
