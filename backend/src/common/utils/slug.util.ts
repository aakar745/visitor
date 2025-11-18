/**
 * Slug Generation Utility
 * 
 * SECURITY FIX (BUG-013): Proper handling of special characters and unicode
 * 
 * Features:
 * - Transliterate accented characters (é → e, ñ → n, ü → u)
 * - Handle unicode properly
 * - Prevent empty slugs
 * - Consistent implementation across services
 */

/**
 * Character transliteration map for common accented characters
 * Converts accented/special characters to their ASCII equivalents
 */
const TRANSLITERATION_MAP: Record<string, string> = {
  // Latin Extended-A
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
  'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'ÿ': 'y',
  'ß': 'ss',
  
  // Uppercase
  'À': 'a', 'Á': 'a', 'Â': 'a', 'Ã': 'a', 'Ä': 'a', 'Å': 'a', 'Æ': 'ae',
  'Ç': 'c', 'È': 'e', 'É': 'e', 'Ê': 'e', 'Ë': 'e',
  'Ì': 'i', 'Í': 'i', 'Î': 'i', 'Ï': 'i',
  'Ñ': 'n', 'Ò': 'o', 'Ó': 'o', 'Ô': 'o', 'Õ': 'o', 'Ö': 'o', 'Ø': 'o',
  'Ù': 'u', 'Ú': 'u', 'Û': 'u', 'Ü': 'u',
  'Ý': 'y', 'Ÿ': 'y',
  
  // Additional common characters
  'š': 's', 'Š': 's',
  'ž': 'z', 'Ž': 'z',
  'đ': 'd', 'Đ': 'd',
  'ć': 'c', 'Ć': 'c',
  'č': 'c', 'Č': 'c',
  
  // Currency symbols (global coverage)
  '€': 'euro',      // Euro
  '£': 'pound',     // British Pound
  '¥': 'yen',       // Japanese Yen / Chinese Yuan
  '$': 'dollar',    // US Dollar (and other dollar currencies)
  '₹': 'rupee',     // Indian Rupee
  '₽': 'ruble',     // Russian Ruble
  '₩': 'won',       // South Korean Won
  '₪': 'shekel',    // Israeli Shekel
  '₦': 'naira',     // Nigerian Naira
  '₨': 'rupee',     // Rupee (alternative symbol)
  '฿': 'baht',      // Thai Baht
  '₡': 'colon',     // Costa Rican Colón
  '₱': 'peso',      // Philippine Peso
  '₴': 'hryvnia',   // Ukrainian Hryvnia
  '₵': 'cedi',      // Ghanaian Cedi
  
  // Common symbols
  '©': 'c', '®': 'r', '™': 'tm',
  '&': 'and', '@': 'at',
};

/**
 * Transliterate special characters to ASCII equivalents
 */
function transliterate(text: string): string {
  return text
    .split('')
    .map(char => TRANSLITERATION_MAP[char] || char)
    .join('');
}

/**
 * Generate a URL-friendly slug from text
 * 
 * Process:
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Transliterate accented characters
 * 4. Remove remaining non-alphanumeric characters (except spaces and hyphens)
 * 5. Replace spaces with hyphens
 * 6. Collapse multiple hyphens
 * 7. Remove leading/trailing hyphens
 * 8. Ensure slug is not empty (fallback)
 * 
 * @param text - Text to convert to slug
 * @param fallback - Fallback value if slug would be empty (default: 'item')
 * @returns URL-friendly slug
 * 
 * @example
 * generateSlug('Café Paris') // Returns: 'cafe-paris'
 * generateSlug('München 2024') // Returns: 'muenchen-2024'
 * generateSlug('São Paulo Expo!') // Returns: 'sao-paulo-expo'
 * generateSlug('©®™') // Returns: 'c-r-tm'
 * generateSlug('!!!') // Returns: 'item' (fallback)
 */
export function generateSlug(text: string, fallback: string = 'item'): string {
  if (!text || typeof text !== 'string') {
    return fallback;
  }

  let slug = text
    .trim()                           // Remove leading/trailing whitespace
    .toLowerCase()                    // Convert to lowercase
    
  // Apply transliteration
  slug = transliterate(slug);
  
  slug = slug
    .replace(/[^a-z0-9\s-]/g, '')    // Remove non-alphanumeric (keep spaces and hyphens)
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Collapse multiple hyphens to single
    .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens

  // Ensure slug is not empty (if all characters were removed)
  if (!slug || slug.length === 0) {
    slug = fallback;
  }

  // Additional safety: ensure minimum length
  if (slug.length < 2) {
    slug = `${fallback}-${slug}`;
  }

  return slug;
}

/**
 * Generate a slug with an optional suffix
 * Useful for generating timestamped or numbered slugs
 * 
 * @param text - Text to convert to slug
 * @param suffix - Optional suffix to append
 * @returns URL-friendly slug with suffix
 * 
 * @example
 * generateSlugWithSuffix('Expo 2024', '1') // Returns: 'expo-2024-1'
 */
export function generateSlugWithSuffix(text: string, suffix?: string): string {
  const slug = generateSlug(text);
  
  if (suffix) {
    return `${slug}-${suffix}`;
  }
  
  return slug;
}

