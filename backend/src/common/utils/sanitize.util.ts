import * as QRCode from 'qrcode';

/**
 * Escape special regex characters to prevent regex injection attacks
 * @param text - The text to sanitize
 * @returns Sanitized text safe for regex use
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize search query for safe regex usage
 * @param search - The search string from user input
 * @returns Sanitized and trimmed search string
 */
export function sanitizeSearch(search: string | undefined): string {
  if (!search) return '';
  return escapeRegex(search.trim());
}

// =============================================================================
// 🔄 QR CODE UTILITIES (Consolidated from multiple duplications)
// =============================================================================

/**
 * Generate QR code for registration number (optimized for fast kiosk scanning)
 * Use for: Badge generation, kiosk check-in, visitor registration
 * 
 * Settings:
 * - Low error correction (7% recovery) - Fastest scanning
 * - 512px width - Large enough for phone screens
 * - Standard 4-unit margin
 * - High contrast (black on white)
 * 
 * @param registrationNumber - Registration number (simple string)
 * @returns Data URL string (base64 encoded PNG)
 */
export async function generateRegistrationQR(registrationNumber: string): Promise<string> {
  return QRCode.toDataURL(registrationNumber, {
    errorCorrectionLevel: 'L', // Low EC for fastest scanning (simple data)
    width: 512, // Large for visibility
    margin: 4, // Standard quiet zone
    type: 'image/png',
    color: {
      dark: '#000000', // Maximum contrast
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate QR code with complex data (needs high error correction)
 * Use for: Verification, detailed data encoding
 * 
 * Settings:
 * - High error correction (30% recovery) - Most reliable for complex data
 * - 400px width - Adequate size
 * - Standard 4-unit margin
 * - High contrast (black on white)
 * 
 * @param data - Complex data object or JSON string
 * @returns Data URL string (base64 encoded PNG)
 */
export async function generateDetailedQR(data: string | object): Promise<string> {
  const qrData = typeof data === 'string' ? data : JSON.stringify(data);
  
  return QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H', // High EC for complex data
    width: 400,
    margin: 4,
    type: 'image/png',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate QR code with custom options
 * Use for: Special cases requiring specific settings
 * 
 * @param data - Data to encode
 * @param options - Custom QR code options
 * @returns Data URL string (base64 encoded PNG)
 */
export async function generateCustomQR(
  data: string,
  options: {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    width?: number;
    margin?: number;
  } = {}
): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    width: options.width || 512,
    margin: options.margin || 4,
    type: 'image/png',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

// =============================================================================
// 📞 PHONE NUMBER UTILITIES (Consolidated from multiple duplications)
// =============================================================================

/**
 * ⚠️ DEPRECATED - Use normalizePhoneNumberE164() for international support
 * 
 * Normalize phone number to consistent 10-digit format for database storage
 * Removes country code, spaces, dashes, and stores only 10 digits
 * 
 * Handles various input formats:
 * - +919876543210 → 9876543210
 * - 919876543210 → 9876543210
 * - +91 98765 43210 → 9876543210
 * - 9876543210 → 9876543210
 * 
 * @deprecated Use normalizePhoneNumberE164() for international support
 * @param phone - Phone number in any format
 * @returns Normalized 10-digit phone number (Indian format) or empty string if invalid
 */
export function normalizePhoneNumber(phone: string | undefined): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters (spaces, dashes, parentheses, etc.)
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code if present
  // India: +91 (2 digits)
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  
  // Ensure we have exactly 10 digits
  if (cleaned.length === 10) {
    return cleaned;
  }
  
  // If length is not 10, return as-is and let validation catch it
  return cleaned;
}

/**
 * Normalize phone number to E.164 format for international support
 * Preserves country code and stores in standard E.164 format (+[country][number])
 * 
 * Handles various input formats:
 * - +919876543210 → +919876543210 (India)
 * - +14155552671 → +14155552671 (USA)
 * - +971501234567 → +971501234567 (UAE)
 * - 16089827071 → +16089827071 (adds + if missing)
 * - 9876543210 → +919876543210 (adds +91 for 10-digit numbers without country code)
 * 
 * @param phone - Phone number in any format
 * @returns Phone number in E.164 format (+[country][number]) or empty string if invalid
 */
export function normalizePhoneNumberE164(phone: string | undefined): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove spaces, dashes, parentheses (but keep + for country code)
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // If already starts with +, validate and return
  if (cleaned.startsWith('+')) {
    return cleaned; // E.164 format, use as-is
  }
  
  // If starts with digit, add + prefix
  if (/^\d/.test(cleaned)) {
    // If it's exactly 10 digits, assume India (+91)
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    // Otherwise, add + prefix (user provided country code)
    return `+${cleaned}`;
  }
  
  return '';
}

/**
 * ⚠️ DEPRECATED - Use normalizePhoneNumberE164() instead
 * 
 * Format phone number with country code for API/WhatsApp usage
 * Returns phone in E.164 format (+919876543210)
 * 
 * @deprecated Use normalizePhoneNumberE164() for international support
 * @param phone - Phone number in any format
 * @returns Phone in E.164 format (+919876543210) or empty string if invalid
 */
export function formatPhoneE164(phone: string | undefined): string {
  // Redirect to new international-aware function
  return normalizePhoneNumberE164(phone);
}

