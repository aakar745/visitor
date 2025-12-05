/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate form submissions and API requests by tracking
 * in-flight requests and preventing re-submission.
 * 
 * FEATURES:
 * - Tracks pending requests by unique key
 * - Auto-cleanup on completion or timeout
 * - Configurable timeout per request
 * - TypeScript-safe
 * 
 * USE CASES:
 * - Prevent double-click form submissions
 * - Debounce rapid API calls
 * - Ensure idempotent operations
 * 
 * Usage:
 *   import { requestTracker, withDeduplication } from './requestDeduplication';
 * 
 *   // Check if request is in progress
 *   if (requestTracker.isInProgress('create-user-123')) {
 *     return; // Skip duplicate request
 *   }
 * 
 *   // Track a request
 *   requestTracker.start('create-user-123');
 *   try {
 *     await api.createUser(data);
 *   } finally {
 *     requestTracker.complete('create-user-123');
 *   }
 * 
 *   // Or use the wrapper
 *   const result = await withDeduplication('create-user-123', () => api.createUser(data));
 */

interface RequestEntry {
  startTime: number;
  timeoutId?: ReturnType<typeof setTimeout>;
}

class RequestTracker {
  private pendingRequests: Map<string, RequestEntry> = new Map();
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Check if a request with the given key is currently in progress
   */
  isInProgress(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Start tracking a request
   * @param key - Unique identifier for the request
   * @param timeout - Auto-cleanup timeout in milliseconds (default: 30s)
   */
  start(key: string, timeout: number = this.DEFAULT_TIMEOUT): void {
    // If already in progress, don't create duplicate
    if (this.isInProgress(key)) {
      console.warn(`[RequestTracker] Request '${key}' is already in progress`);
      return;
    }

    const entry: RequestEntry = {
      startTime: Date.now(),
    };

    // Set auto-cleanup timeout to prevent memory leaks
    entry.timeoutId = setTimeout(() => {
      console.warn(`[RequestTracker] Request '${key}' timed out after ${timeout}ms`);
      this.complete(key);
    }, timeout);

    this.pendingRequests.set(key, entry);
  }

  /**
   * Mark a request as complete
   */
  complete(key: string): void {
    const entry = this.pendingRequests.get(key);
    if (entry?.timeoutId) {
      clearTimeout(entry.timeoutId);
    }
    this.pendingRequests.delete(key);
  }

  /**
   * Get duration of in-flight request
   */
  getDuration(key: string): number | null {
    const entry = this.pendingRequests.get(key);
    return entry ? Date.now() - entry.startTime : null;
  }

  /**
   * Clear all tracked requests (use with caution)
   */
  clearAll(): void {
    this.pendingRequests.forEach((entry) => {
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
    });
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const requestTracker = new RequestTracker();

/**
 * Wrapper function to deduplicate async operations
 * 
 * @param key - Unique identifier for the request
 * @param fn - The async function to execute
 * @param options - Configuration options
 * @returns Result of the function, or undefined if request is duplicate
 * 
 * Usage:
 *   const result = await withDeduplication('create-user', async () => {
 *     return await api.createUser(data);
 *   });
 */
export async function withDeduplication<T>(
  key: string,
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    throwOnDuplicate?: boolean;
    onDuplicate?: () => void;
  } = {}
): Promise<T | undefined> {
  const { timeout = 30000, throwOnDuplicate = false, onDuplicate } = options;

  // Check if request is already in progress
  if (requestTracker.isInProgress(key)) {
    console.warn(`[Deduplication] Skipping duplicate request: ${key}`);
    
    if (onDuplicate) {
      onDuplicate();
    }
    
    if (throwOnDuplicate) {
      throw new Error(`Duplicate request detected: ${key}`);
    }
    
    return undefined;
  }

  // Start tracking
  requestTracker.start(key, timeout);

  try {
    return await fn();
  } finally {
    requestTracker.complete(key);
  }
}

/**
 * Hook-friendly wrapper for form submissions
 * 
 * @param keyPrefix - Prefix for generating unique keys
 * @returns Object with submit wrapper and status check
 * 
 * Usage in React:
 *   const { wrapSubmit, isSubmitting } = useFormDeduplication('user-registration');
 *   
 *   const handleSubmit = wrapSubmit(async (data) => {
 *     await api.createUser(data);
 *   }, 'user-123');
 */
export function createFormDeduplication(keyPrefix: string) {
  const getKey = (suffix?: string) => suffix ? `${keyPrefix}-${suffix}` : keyPrefix;

  return {
    /**
     * Check if a form submission is in progress
     */
    isSubmitting: (keySuffix?: string): boolean => {
      return requestTracker.isInProgress(getKey(keySuffix));
    },

    /**
     * Wrap a submit handler with deduplication
     */
    wrapSubmit: <T>(
      handler: () => Promise<T>,
      keySuffix?: string,
      options?: { timeout?: number }
    ): Promise<T | undefined> => {
      return withDeduplication(getKey(keySuffix), handler, options);
    },

    /**
     * Manually mark request as started (for more control)
     */
    markStart: (keySuffix?: string, timeout?: number): void => {
      requestTracker.start(getKey(keySuffix), timeout);
    },

    /**
     * Manually mark request as complete
     */
    markComplete: (keySuffix?: string): void => {
      requestTracker.complete(getKey(keySuffix));
    },
  };
}

export default requestTracker;

