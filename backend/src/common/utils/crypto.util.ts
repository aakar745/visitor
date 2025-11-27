import * as crypto from 'crypto';

/**
 * Cryptographic utility functions
 * Centralized crypto operations for consistency and security
 */

/**
 * Generate a cryptographically secure random token
 * 
 * Used for:
 * - CSRF tokens (32 bytes = 64 hex chars)
 * - Session tokens
 * - API keys
 * - One-time tokens
 * 
 * @param bytes - Number of random bytes (default: 32)
 * @returns Hexadecimal string (length = bytes * 2)
 * 
 * @example
 * ```typescript
 * const csrfToken = generateSecureToken(32);  // 64 characters
 * const apiKey = generateSecureToken(48);     // 96 characters
 * ```
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a CSRF token
 * Convenience wrapper with standard size for CSRF protection
 * 
 * @returns 64-character hexadecimal CSRF token
 */
export function generateCsrfToken(): string {
  return generateSecureToken(32); // 32 bytes = 64 hex characters
}

/**
 * Generate a cryptographically secure random number
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer between min and max
 * 
 * @example
 * ```typescript
 * const otp = generateSecureRandomInt(100000, 999999); // 6-digit OTP
 * ```
 */
export function generateSecureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const randomValue = crypto.randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);
  
  // Rejection sampling to avoid modulo bias
  if (randomValue >= maxValue - (maxValue % range)) {
    return generateSecureRandomInt(min, max);
  }
  
  return min + (randomValue % range);
}

