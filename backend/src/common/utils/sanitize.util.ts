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

