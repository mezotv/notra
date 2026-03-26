import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

export function decodeIntegrationEncryptionKey(
  key: string | undefined,
  envName = "INTEGRATION_ENCRYPTION_KEY"
) {
  if (!key) {
    throw new Error(`${envName} environment variable is not set`);
  }

  const decodedKey = Buffer.from(key, "base64");

  if (decodedKey.length !== 32) {
    throw new Error(
      `${envName} must be a base64-encoded 32-byte key, but decoded length is ${decodedKey.length} bytes (expected 32 bytes). Please supply a valid base64-encoded 32-byte key.`
    );
  }

  return decodedKey;
}

export function encryptIntegrationSecret(value: string, key: Buffer) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted}`;
}

export function decryptIntegrationSecret(encryptedValue: string, key: Buffer) {
  const parts = encryptedValue.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const [ivHex, authTagHex, encrypted] = parts;

  if (!(ivHex && authTagHex && encrypted)) {
    throw new Error("Invalid encrypted token format");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
