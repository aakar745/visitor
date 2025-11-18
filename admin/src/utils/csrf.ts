/**
 * CSRF Token Management
 * Handles reading and managing CSRF tokens for API requests
 */

/**
 * Get CSRF token from cookie
 * The backend sets this cookie automatically
 */
export const getCsrfToken = (): string | null => {
  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  
  return null;
};

/**
 * Parse all cookies into an object
 */
export const getAllCookies = (): Record<string, string> => {
  return document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Check if CSRF token exists
 */
export const hasCsrfToken = (): boolean => {
  return getCsrfToken() !== null;
};

