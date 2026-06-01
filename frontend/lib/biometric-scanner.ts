/**
 * Simulates fingerprint scanner SDK integration.
 * In production, replace with actual biometric SDK (e.g., DigitalPersona, Neurotechnology).
 */

export interface BiometricTemplate {
  template: string; // Base64 encoded
  quality: number;
}

/**
 * Simulates capturing fingerprint from USB scanner.
 * Returns a mock template for development/testing.
 */
export async function captureFingerprint(): Promise<BiometricTemplate> {
  return new Promise((resolve) => {
    // Simulate scanner delay
    setTimeout(() => {
      // Generate mock template (random bytes for simulation)
      const mockBytes = new Uint8Array(256);
      crypto.getRandomValues(mockBytes);
      const template = btoa(String.fromCharCode(...mockBytes));
      
      resolve({
        template,
        quality: 85,
      });
    }, 1500);
  });
}

/**
 * Simulates verifying scanner connection.
 */
export async function checkScannerConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 500);
  });
}
