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
 * @returns Sanitized pagination parameters with skip offset
 */
export function sanitizePagination(
  page?: number, 
  limit?: number
): { page: number; limit: number; skip: number } {
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

  // Calculate skip offset for MongoDB queries
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  return { page: sanitizedPage, limit: sanitizedLimit, skip };
}

/**
 * Build MongoDB sort object from sort parameters
 * 
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order (asc/desc)
 * @returns MongoDB sort object
 */
export function buildSortObject(sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Record<string, 1 | -1> {
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  return sort;
}

/**
 * Calculate pagination metadata
 * 
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata object
 */
export function calculatePaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

