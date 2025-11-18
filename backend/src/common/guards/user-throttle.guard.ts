import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Custom Throttler Guard for User-Specific Rate Limiting
 * 
 * SECURITY (BUG-006):
 * - Implements per-user rate limiting in addition to per-IP
 * - Prevents brute force attacks targeting multiple users from same IP
 * - Tracks attempts per user+IP combination
 * 
 * This extends the default ThrottlerGuard to add user-based tracking.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  // In-memory store for user-specific tracking
  // In production, use Redis for distributed rate limiting
  private userAttempts: Map<string, { count: number; resetAt: number }> = new Map();

  /**
   * Generate throttle key based on user ID + IP address
   * This ensures rate limiting is applied per user, not just per IP
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const request = req as Request;
    
    // Get user from request (set by JWT guard)
    const user = request.user as any;
    
    // Get IP address
    const ip = this.getRequestIP(request);
    
    // If user is authenticated, throttle by user+IP
    if (user && user._id) {
      return `${user._id.toString()}-${ip}`;
    }
    
    // Fallback to IP-only for unauthenticated requests
    return ip;
  }

  /**
   * Extract IP address from request, considering proxies
   */
  private getRequestIP(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Additional user-specific throttling check
   * Limits attempts per user ID regardless of IP
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    // Perform user-specific rate limiting if user is authenticated
    if (user && user._id) {
      const userId = user._id.toString();
      const now = Date.now();
      const userKey = `user-${userId}`;

      // Clean up expired entries
      if (this.userAttempts.has(userKey)) {
        const entry = this.userAttempts.get(userKey)!;
        if (now > entry.resetAt) {
          this.userAttempts.delete(userKey);
        }
      }

      // Check user-specific limit
      const userLimit = 5; // Max 5 password change attempts per hour per user
      const userTtl = 60 * 60 * 1000; // 1 hour

      if (this.userAttempts.has(userKey)) {
        const entry = this.userAttempts.get(userKey)!;
        
        if (entry.count >= userLimit) {
          const remainingTime = Math.ceil((entry.resetAt - now) / 60000);
          throw new ThrottlerException(
            `Too many password change attempts for this account. Please try again in ${remainingTime} minute(s).`
          );
        }

        // Increment count
        entry.count++;
      } else {
        // Create new entry
        this.userAttempts.set(userKey, {
          count: 1,
          resetAt: now + userTtl,
        });
      }
    }

    // Also apply default IP-based throttling
    return super.canActivate(context);
  }

  /**
   * Clean up old entries periodically
   * Call this in a scheduled task in production
   */
  cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.userAttempts.forEach((value, key) => {
      if (now > value.resetAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.userAttempts.delete(key));
  }
}

