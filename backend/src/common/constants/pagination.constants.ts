/**
 * Pagination constants used across the application
 * Centralized to ensure consistency and prevent DoS attacks
 */

export const PAGINATION_LIMITS = {
  /**
   * Default number of items per page
   */
  DEFAULT_LIMIT: 10,

  /**
   * Maximum allowed items per page
   * Enforced at both DTO and service layers for defense in depth
   */
  MAX_LIMIT: 100,

  /**
   * Minimum page number
   */
  MIN_PAGE: 1,

  /**
   * Minimum items per page
   */
  MIN_LIMIT: 1,
} as const;

/**
 * Utility function to sanitize pagination parameters
 * Ensures values are within allowed bounds
 * 
 * @param page - Requested page number
 * @param limit - Requested items per page
 * @returns Sanitized pagination parameters
 */
export function sanitizePagination(page?: number, limit?: number): { page: number; limit: number } {
  const sanitizedPage = Math.max(
    PAGINATION_LIMITS.MIN_PAGE,
    Math.floor(Number(page) || PAGINATION_LIMITS.MIN_PAGE)
  );

  const sanitizedLimit = Math.min(
    PAGINATION_LIMITS.MAX_LIMIT,
    Math.max(
      PAGINATION_LIMITS.MIN_LIMIT,
      Math.floor(Number(limit) || PAGINATION_LIMITS.DEFAULT_LIMIT)
    )
  );

  return { page: sanitizedPage, limit: sanitizedLimit };
}

