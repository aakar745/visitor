/**
 * 🚨 HTTP Error Utilities
 * 
 * Shared error handling utilities for API clients
 */

/**
 * Get user-friendly error message based on HTTP status code
 * 
 * @param statusCode - HTTP status code
 * @returns User-friendly error message
 */
export function getDefaultErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please login.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timeout. Please try again.';
    case 409:
      return 'This registration already exists.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please slow down.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Request timeout. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Format network error message
 * 
 * @param error - Original error object
 * @returns Formatted error object
 */
export function formatNetworkError(error: any) {
  return {
    message: 'Network error. Please check your internet connection.',
    code: 'NETWORK_ERROR',
    originalError: error,
  };
}

/**
 * Format API error response
 * 
 * @param error - Axios error object with response
 * @returns Formatted error object
 */
export function formatApiError(error: any) {
  const errorMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    getDefaultErrorMessage(error.response?.status || 500);

  return {
    message: errorMessage,
    statusCode: error.response?.status,
    code: error.code,
    originalError: error,
  };
}

