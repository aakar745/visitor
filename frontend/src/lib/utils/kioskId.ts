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
 * Priority:
 * 1. URL parameter (kioskId=xxx)
 * 2. Existing ID from localStorage
 * 3. Generate new ID
 */
export function getKioskId(): string {
  // Check URL parameter first
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlKioskId = urlParams.get('kioskId');
    
    if (urlKioskId && urlKioskId.trim() !== '') {
      try {
        // Validate URL parameter before saving
        const validatedId = validateKioskId(urlKioskId);
        const existing = localStorage.getItem(KIOSK_ID_KEY);
        
        if (existing !== validatedId) {
          localStorage.setItem(KIOSK_ID_KEY, validatedId);
          console.log('[Kiosk ID] Set from URL parameter:', validatedId);
        } else {
          console.log('[Kiosk ID] Loaded from URL:', validatedId);
        }
        
        return validatedId;
      } catch (error) {
        console.error('[Kiosk ID] Invalid kiosk ID in URL:', error instanceof Error ? error.message : String(error));
        // Continue to localStorage/generate new ID
      }
    }
  }

  // Try to get existing ID from localStorage
  const existing = localStorage.getItem(KIOSK_ID_KEY);
  if (existing) {
    console.log('[Kiosk ID] Loaded existing ID:', existing);
    return existing;
  }

  // Generate new ID as fallback
  const newId = generateKioskId();
  localStorage.setItem(KIOSK_ID_KEY, newId);
  
  console.log('[Kiosk ID] Generated new kiosk ID:', newId);
  
  return newId;
}

/**
 * Validate and sanitize kiosk ID
 * - Must be 3-50 characters
 * - Alphanumeric, hyphens, and underscores only
 * - Prevents Redis key injection attacks
 */
function validateKioskId(kioskId: string): string {
  if (!kioskId || kioskId.trim() === '') {
    throw new Error('Kiosk ID cannot be empty');
  }
  
  const trimmed = kioskId.trim();
  
  // Length validation
  if (trimmed.length < 3) {
    throw new Error('Kiosk ID must be at least 3 characters');
  }
  
  if (trimmed.length > 50) {
    throw new Error('Kiosk ID must be 50 characters or less');
  }
  
  // Format validation: alphanumeric, hyphens, and underscores only
  // This prevents Redis key injection and special character issues
  const validFormat = /^[a-zA-Z0-9_-]+$/;
  if (!validFormat.test(trimmed)) {
    throw new Error('Kiosk ID can only contain letters, numbers, hyphens, and underscores');
  }
  
  return trimmed;
}

/**
 * Set a custom kiosk ID (for manual configuration)
 * Useful for admin-assigned IDs like "kiosk-entrance", "kiosk-hall-1"
 */
export function setKioskId(kioskId: string): void {
  const validatedId = validateKioskId(kioskId);
  
  localStorage.setItem(KIOSK_ID_KEY, validatedId);
  console.log('[Kiosk ID] Set custom kiosk ID:', validatedId);
}

/**
 * Get the current kiosk ID without generating a new one
 * Returns null if no ID exists or during SSR
 */
export function getCurrentKioskId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
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

