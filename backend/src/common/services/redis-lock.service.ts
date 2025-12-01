import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Redis-based Distributed Locking Service
 * 
 * Prevents race conditions in concurrent operations by using Redis as a distributed lock.
 * Essential for high-load scenarios where multiple backend instances handle the same resource.
 * 
 * Features:
 * - Distributed locking across multiple server instances
 * - Automatic lock expiration (prevents deadlocks)
 * - Non-blocking tryLock operations
 * - Thread-safe
 * 
 * Use Cases:
 * - OTP creation (prevent duplicate OTPs for same phone number)
 * - Registration number generation (prevent collisions)
 * - Payment processing (prevent double charges)
 */
@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly redisClient: Redis;
  private readonly DEFAULT_LOCK_TTL = 5000; // 5 seconds default

  constructor(private configService: ConfigService) {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      retryStrategy: (times) => {
        // Retry connection with exponential backoff
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redisClient.on('connect', () => {
      this.logger.log('✅ Redis Lock Service connected');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error(`❌ Redis Lock Service error: ${error.message}`);
    });
  }

  /**
   * Acquire a distributed lock
   * 
   * @param lockKey - Unique key for the lock (e.g., "otp:lock:+919876543210")
   * @param ttlMs - Time-to-live in milliseconds (auto-release after this time)
   * @returns true if lock acquired, false if lock already held by another process
   * 
   * @example
   * ```typescript
   * const lockAcquired = await this.redisLockService.acquireLock('otp:lock:+919876543210', 5000);
   * if (!lockAcquired) {
   *   throw new BadRequestException('OTP request in progress. Please wait.');
   * }
   * ```
   */
  async acquireLock(lockKey: string, ttlMs: number = this.DEFAULT_LOCK_TTL): Promise<boolean> {
    try {
      // SET key value NX PX milliseconds
      // NX: Only set if key doesn't exist
      // PX: Set expiry in milliseconds
      const result = await this.redisClient.set(
        lockKey,
        '1',
        'PX',
        ttlMs,
        'NX', // Only set if not exists
      );

      if (result === 'OK') {
        this.logger.debug(`🔒 Lock acquired: ${lockKey} (TTL: ${ttlMs}ms)`);
        return true;
      }

      this.logger.debug(`❌ Lock already held: ${lockKey}`);
      return false;
    } catch (error) {
      this.logger.error(`Error acquiring lock ${lockKey}: ${error.message}`);
      // On Redis error, fail open (allow operation) to prevent system lockup
      // This is a trade-off: availability > consistency in edge cases
      return true;
    }
  }

  /**
   * Release a distributed lock
   * 
   * @param lockKey - Key to release
   * 
   * @example
   * ```typescript
   * await this.redisLockService.releaseLock('otp:lock:+919876543210');
   * ```
   */
  async releaseLock(lockKey: string): Promise<void> {
    try {
      const result = await this.redisClient.del(lockKey);
      if (result === 1) {
        this.logger.debug(`🔓 Lock released: ${lockKey}`);
      }
    } catch (error) {
      this.logger.error(`Error releasing lock ${lockKey}: ${error.message}`);
      // Non-critical error - lock will auto-expire anyway
    }
  }

  /**
   * Execute a function with automatic lock acquisition and release
   * 
   * @param lockKey - Unique lock identifier
   * @param fn - Async function to execute under lock
   * @param ttlMs - Lock time-to-live in milliseconds
   * @returns Result of the function or null if lock couldn't be acquired
   * 
   * @example
   * ```typescript
   * const result = await this.redisLockService.withLock(
   *   'otp:lock:+919876543210',
   *   async () => {
   *     // Your critical section code here
   *     return await this.sendOTP();
   *   },
   *   5000
   * );
   * 
   * if (!result) {
   *   throw new BadRequestException('Operation in progress');
   * }
   * ```
   */
  async withLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    ttlMs: number = this.DEFAULT_LOCK_TTL,
  ): Promise<T | null> {
    const lockAcquired = await this.acquireLock(lockKey, ttlMs);

    if (!lockAcquired) {
      return null; // Lock not acquired
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Check if a lock is currently held
   * 
   * @param lockKey - Lock key to check
   * @returns true if lock exists, false otherwise
   */
  async isLocked(lockKey: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(lockKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking lock ${lockKey}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get remaining TTL for a lock
   * 
   * @param lockKey - Lock key
   * @returns Remaining milliseconds or -1 if key doesn't exist
   */
  async getLockTTL(lockKey: string): Promise<number> {
    try {
      return await this.redisClient.pttl(lockKey);
    } catch (error) {
      this.logger.error(`Error getting lock TTL ${lockKey}: ${error.message}`);
      return -1;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await this.redisClient.quit();
    this.logger.log('Redis Lock Service disconnected');
  }
}

