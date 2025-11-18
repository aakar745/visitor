import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export interface ThrottleOptions {
  ttl: number; // Time to live in seconds
  limit: number; // Number of requests
}

/**
 * Custom throttle decorator for endpoint-specific rate limiting
 * @param options - Throttle options with ttl (seconds) and limit (requests)
 */
export const Throttle = (options: ThrottleOptions) => SetMetadata(THROTTLE_KEY, options);

/**
 * Strict rate limiting for sensitive authentication endpoints
 * 5 requests per minute
 */
export const ThrottleAuth = () => Throttle({ ttl: 60, limit: 5 });

/**
 * Standard rate limiting for normal endpoints
 * 20 requests per minute
 */
export const ThrottleStandard = () => Throttle({ ttl: 60, limit: 20 });

