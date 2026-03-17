import crypto from "node:crypto";

const BIOMETRIC_SECRET = process.env.BIOMETRIC_SECRET ?? "";

function getKey(): Buffer {
  if (!BIOMETRIC_SECRET || BIOMETRIC_SECRET.length < 32) {
    throw new Error("BIOMETRIC_SECRET must be set and at least 32 characters long");
  }
  return crypto.createHash("sha256").update(BIOMETRIC_SECRET).digest();
}

export function encryptBuffer(buffer: Buffer): Buffer {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
  const key = getKey();
  const iv = encryptedBuffer.subarray(0, 12);
  const authTag = encryptedBuffer.subarray(12, 28);
  const ciphertext = encryptedBuffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
