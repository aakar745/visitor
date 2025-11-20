/**
 * Kiosk ID Management
 * 
 * Generates and stores a unique kiosk ID for each physical kiosk terminal.
 * This ensures print jobs are routed to the correct printer.
 * 
 * The kiosk ID is stored in localStorage and persists across browser sessions.
 */

const KIOSK_ID_KEY = 'visitor_kiosk_id';

/**
 * Generate a unique kiosk ID
 * Format: kiosk-{timestamp}-{random}
 * Example: kiosk-1732095840123-a7b3c2
 */
function generateKioskId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `kiosk-${timestamp}-${random}`;
}

/**
 * Get or create kiosk ID
 * Returns existing ID from localStorage, or generates a new one
 */
export function getKioskId(): string {
  // Try to get existing ID
  const existing = localStorage.getItem(KIOSK_ID_KEY);
  if (existing) {
    return existing;
  }

  // Generate new ID
  const newId = generateKioskId();
  localStorage.setItem(KIOSK_ID_KEY, newId);
  
  console.log('[Kiosk ID] Generated new kiosk ID:', newId);
  
  return newId;
}

/**
 * Set a custom kiosk ID (for manual configuration)
 * Useful for admin-assigned IDs like "kiosk-entrance", "kiosk-hall-1"
 */
export function setKioskId(kioskId: string): void {
  if (!kioskId || kioskId.trim() === '') {
    throw new Error('Kiosk ID cannot be empty');
  }
  
  localStorage.setItem(KIOSK_ID_KEY, kioskId);
  console.log('[Kiosk ID] Set custom kiosk ID:', kioskId);
}

/**
 * Get the current kiosk ID without generating a new one
 * Returns null if no ID exists
 */
export function getCurrentKioskId(): string | null {
  return localStorage.getItem(KIOSK_ID_KEY);
}

/**
 * Clear the kiosk ID (for testing/debugging)
 */
export function clearKioskId(): void {
  localStorage.removeItem(KIOSK_ID_KEY);
  console.log('[Kiosk ID] Cleared kiosk ID');
}

/**
 * Get kiosk ID with fallback for SSR
 * Returns 'unknown' during server-side rendering
 */
export function getKioskIdSafe(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }
  return getKioskId();
}

