const crypto = require("crypto");

/**
 * Placeholder fingerprint template matcher.
 * In production, replace this with a proper biometric SDK comparison.
 */
function matchTemplates(storedTemplateBuffer, candidateTemplateBuffer) {
  if (!storedTemplateBuffer || !candidateTemplateBuffer) return false;
  if (!Buffer.isBuffer(storedTemplateBuffer) || !Buffer.isBuffer(candidateTemplateBuffer)) return false;
  if (storedTemplateBuffer.length !== candidateTemplateBuffer.length) return false;

  try {
    return crypto.timingSafeEqual(storedTemplateBuffer, candidateTemplateBuffer);
  } catch {
    return false;
  }
}

module.exports = {
  matchTemplates,
};

