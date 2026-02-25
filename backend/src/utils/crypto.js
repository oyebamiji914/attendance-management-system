const crypto = require("crypto");

const BIOMETRIC_SECRET = process.env.BIOMETRIC_SECRET || "";

function getKey() {
  if (!BIOMETRIC_SECRET || BIOMETRIC_SECRET.length < 32) {
    throw new Error("BIOMETRIC_SECRET must be set and at least 32 characters long");
  }
  return crypto.createHash("sha256").update(BIOMETRIC_SECRET).digest();
}

function encryptBuffer(buffer) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // GCM recommended IV size

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Store iv + authTag + ciphertext in one blob
  return Buffer.concat([iv, authTag, encrypted]);
}

module.exports = {
  encryptBuffer,
};

