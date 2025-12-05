/**
 * Request Deduplication Utility for Frontend
 * 
 * Prevents duplicate form submissions and API requests by tracking
 * in-flight requests and preventing re-submission.
 * 
 * FEATURES:
 * - Tracks pending requests by unique key
 * - Auto-cleanup on completion or timeout
 * - React hooks integration
 * - TypeScript-safe
 * 
 * USE CASES:
 * - Prevent double-click form submissions
 * - Debounce rapid registration submissions
 * - Ensure idempotent OTP verifications
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
   */
  start(key: string, timeout: number = this.DEFAULT_TIMEOUT): boolean {
    // If already in progress, return false to signal duplicate
    if (this.isInProgress(key)) {
      console.warn(`[RequestTracker] Request '${key}' is already in progress`);
      return false;
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
    return true;
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
 */
export async function withDeduplication<T>(
  key: string,
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    onDuplicate?: () => void;
  } = {}
): Promise<T | undefined> {
  const { timeout = 30000, onDuplicate } = options;

  // Check if request is already in progress
  if (!requestTracker.start(key, timeout)) {
    console.warn(`[Deduplication] Skipping duplicate request: ${key}`);
    onDuplicate?.();
    return undefined;
  }

  try {
    return await fn();
  } finally {
    requestTracker.complete(key);
  }
}

/**
 * Generate a unique key for registration submissions
 * Uses exhibition ID and phone to identify duplicate registrations
 */
export function generateRegistrationKey(exhibitionId: string, phone?: string): string {
  const phoneSuffix = phone ? `-${phone.replace(/\D/g, '')}` : '';
  return `registration-${exhibitionId}${phoneSuffix}`;
}

/**
 * Generate a unique key for OTP operations
 */
export function generateOtpKey(phone: string, operation: 'send' | 'verify'): string {
  return `otp-${operation}-${phone.replace(/\D/g, '')}`;
}

export default requestTracker;

