import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../constants';
import { store } from '../store';
import { clearAuth, setTokens } from '../store/slices/authSlice';
import { addNotification, setOnlineStatus } from '../store/slices/appSlice';
import { getCsrfToken } from '../utils/csrf';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

/**
 * Request interceptor for authentication and CSRF protection
 * 
 * SECURITY NOTE:
 * - Access tokens are stored in httpOnly cookies and sent automatically by browser
 * - This is more secure than localStorage (prevents XSS attacks)
 * - CSRF token is still added to headers for state-changing requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Tokens are in httpOnly cookies, automatically sent by browser
    // No need to manually add Authorization header
    // Backend will read from cookie using JWT strategy

    // Handle FormData - remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    // Add CSRF token for state-changing requests
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      const csrfToken = getCsrfToken();
      if (csrfToken && config.headers) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Token Refresh Queue Management
 * 
 * SECURITY FIXES:
 * 
 * BUG-004 (Memory Leak):
 * - Maximum queue size (50) to prevent memory exhaustion
 * - 30-second timeout on queued requests to prevent hanging
 * - Proper cleanup of timeouts to prevent memory leaks
 * - clearQueue() for manual cleanup on logout
 * 
 * BUG-005 (Race Condition):
 * - Set isRefreshing IMMEDIATELY before async operations
 * - Reset isRefreshing BEFORE processing queue to prevent hanging requests
 * - Mark request as _retry FIRST to prevent infinite loops
 * - Careful ordering of flag updates and queue processing
 */

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  timeout: NodeJS.Timeout;
}> = [];

// Security: Maximum queue size to prevent memory exhaustion
const MAX_QUEUE_SIZE = 50;

// Security: Timeout for queued requests (30 seconds)
const QUEUE_TIMEOUT = 30000;

const processQueue = (error: unknown, token: string | null = null) => {
  // Clear all timeouts and process promises
  failedQueue.forEach((item) => {
    clearTimeout(item.timeout);
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token);
    }
  });
  
  // Clear the queue
  failedQueue = [];
};

const clearQueue = () => {
  // Clear all timeouts and reject pending promises
  failedQueue.forEach((item) => {
    clearTimeout(item.timeout);
    item.reject(new Error('Request queue cleared'));
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark this request as retried FIRST to prevent loops
      originalRequest._retry = true;

      if (isRefreshing) {
        // Security: Check queue size limit
        if (failedQueue.length >= MAX_QUEUE_SIZE) {
          console.warn('Request queue full, rejecting request');
          return Promise.reject(new Error('Too many pending authentication requests'));
        }

        // If already refreshing, queue this request with timeout
        return new Promise((resolve, reject) => {
          // Set timeout to prevent hanging promises
          const timeout = setTimeout(() => {
            // Remove this item from queue
            const index = failedQueue.findIndex(item => item.resolve === resolve);
            if (index > -1) {
              failedQueue.splice(index, 1);
            }
            reject(new Error('Authentication request timeout'));
          }, QUEUE_TIMEOUT);

          failedQueue.push({ resolve, reject, timeout });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // CRITICAL: Set isRefreshing IMMEDIATELY to prevent race condition
      // This must happen BEFORE any async operations
      isRefreshing = true;

      try {
        // Refresh token is in httpOnly cookie, sent automatically
        // withCredentials: true ensures cookie is sent
        // Tokens are refreshed and stored in httpOnly cookies by backend
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        // Notify store that tokens were refreshed (stored in httpOnly cookies by backend)
        // Note: setTokens() doesn't take parameters - tokens are in httpOnly cookies
        store.dispatch(setTokens());

        // CRITICAL: Reset flag BEFORE processing queue to prevent race condition
        // New requests after this point will see isRefreshing = false and won't queue
        isRefreshing = false;

        // Process all queued requests
        processQueue(null, null); // No token needed, it's in cookie

        // Retry original request (cookie will be sent automatically)
        return api(originalRequest);
      } catch (refreshError) {
        // CRITICAL: Reset flag FIRST to allow new requests
        isRefreshing = false;

        // Process queue with error
        processQueue(refreshError, null);

        // Refresh failed, logout user
        store.dispatch(clearAuth());
        store.dispatch(addNotification({
          type: 'error',
          message: 'Session Expired',
          description: 'Please login again to continue.',
        }));
        
        // Clear any remaining queue items (safety measure)
        clearQueue();
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    /**
     * SECURITY FIX (BUG-017): Handle 403 Forbidden errors
     * 
     * 403 errors can indicate:
     * 1. CSRF token missing/invalid - DON'T logout, just show error
     * 2. User's permissions have been revoked - DO logout
     * 3. Role has been changed/downgraded - DO logout
     * 4. Account has been deactivated - DO logout
     */
    if (error.response?.status === 403) {
      const errorMessage = error.response.data?.message || '';
      
      // Check if this is a CSRF error - don't logout for these
      const isCsrfError = errorMessage.toLowerCase().includes('csrf') || 
                          errorMessage.toLowerCase().includes('token');
      
      if (isCsrfError) {
        // CSRF error - show notification but don't logout
        store.dispatch(addNotification({
          type: 'error',
          message: 'Security Token Error',
          description: 'Your security token has expired. Please refresh the page and try again.',
        }));
        
        return Promise.reject(error);
      }
      
      // Real permission error - logout user
      store.dispatch(clearAuth());
      
      // Show specific message for permission issues
      store.dispatch(addNotification({
        type: 'error',
        message: 'Access Denied',
        description: errorMessage || 'You do not have permission to access this resource. Please contact your administrator.',
      }));
      
      // Clear queue and redirect to login
      clearQueue();
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    /**
     * SECURITY FIX (BUG-018): Handle network errors
     * 
     * Network errors have no error.response (request never reached server)
     * Common error codes:
     * - ERR_NETWORK: Network connection lost
     * - ECONNABORTED: Request timeout
     * - ERR_BAD_REQUEST: Malformed request (client-side)
     */
    const axiosError = error as AxiosError;
    
    // Check if this is a network error (no response from server)
    if (!error.response) {
      // Update online status
      const isOnline = navigator.onLine;
      store.dispatch(setOnlineStatus(isOnline));
      
      // Determine error type
      if (axiosError.code === 'ERR_NETWORK' || !isOnline) {
        // Network connection lost
        store.dispatch(addNotification({
          type: 'error',
          message: 'Network Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
        }));
      } else if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        // Request timeout
        store.dispatch(addNotification({
          type: 'warning',
          message: 'Request Timeout',
          description: 'The request took too long to complete. Please try again.',
        }));
      } else {
        // Other network errors
        store.dispatch(addNotification({
          type: 'error',
          message: 'Connection Failed',
          description: 'Unable to reach the server. Please check your connection and try again.',
        }));
      }
      
      return Promise.reject(error);
    }

    // Handle other error responses (when we got a response from server)
    if (error.response?.data?.message) {
      store.dispatch(addNotification({
        type: 'error',
        message: 'Error',
        description: error.response.data.message,
      }));
    }

    return Promise.reject(error);
  }
);

export default api;
