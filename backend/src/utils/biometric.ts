import crypto from "node:crypto";

/**
 * Placeholder fingerprint template matcher.
 * In production, replace with a proper biometric SDK comparison.
 */
export function matchTemplates(
  storedTemplateBuffer: Buffer | null | undefined,
  candidateTemplateBuffer: Buffer | null | undefined
): boolean {
  if (!storedTemplateBuffer || !candidateTemplateBuffer) return false;
  if (!Buffer.isBuffer(storedTemplateBuffer) || !Buffer.isBuffer(candidateTemplateBuffer))
    return false;
  if (storedTemplateBuffer.length !== candidateTemplateBuffer.length) return false;
  try {
    return crypto.timingSafeEqual(storedTemplateBuffer, candidateTemplateBuffer);
  } catch {
    return false;
  }
}
