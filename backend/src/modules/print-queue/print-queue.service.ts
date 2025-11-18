import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue, Job } from 'bullmq';
import { Redis } from 'ioredis';

/**
 * Print Job Data Interface
 */
export interface PrintJobData {
  registrationNumber: string;
  exhibitionId: string;
  exhibitionName: string;
  visitorName: string;
  visitorCompany?: string; // Added: Visitor's company name
  visitorLocation: string;
  qrCode: string; // Base64 encoded
  printerServiceUrl: string;
  timestamp: string;
  kioskId?: string;
}

/**
 * Print Queue Service
 * 
 * Handles all print job queue operations:
 * - Adding jobs to queue
 * - Job status tracking
 * - Distributed locking (prevents race conditions)
 * - Per-exhibition queue management
 * - Retry logic
 */
@Injectable()
export class PrintQueueService implements OnModuleInit {
  private readonly logger = new Logger(PrintQueueService.name);
  private redisClient: Redis;

  constructor(
    @InjectQueue('print-jobs') private printQueue: Queue,
    private configService: ConfigService,
  ) {
    // Create Redis client for distributed locking
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
    
    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
    });

    this.logger.log('✅ Print Queue Service initialized');
    this.logger.log(`📍 Redis: ${redisHost}:${redisPort}`);
  }

  /**
   * Module initialization hook
   * Checks Redis connection and worker status on backend startup
   */
  async onModuleInit() {
    this.logger.log('═════════════════════════════════════════════════');
    this.logger.log('🔍 CHECKING PRINT QUEUE SYSTEM STATUS...');
    this.logger.log('═════════════════════════════════════════════════');

    // Check Redis connection
    await this.checkRedisConnection();

    // Check worker status
    await this.checkWorkerStatus();

    // Check queue stats
    await this.logQueueStats();

    this.logger.log('═════════════════════════════════════════════════');
  }

  /**
   * Check Redis connection
   */
  private async checkRedisConnection() {
    try {
      const result = await this.redisClient.ping();
      if (result === 'PONG') {
        this.logger.log('✅ Redis Connection: CONNECTED');
        this.logger.log(`   Host: ${this.redisClient.options.host}`);
        this.logger.log(`   Port: ${this.redisClient.options.port}`);
      } else {
        this.logger.warn('⚠️ Redis Connection: UNEXPECTED RESPONSE');
      }
    } catch (error) {
      this.logger.error('❌ Redis Connection: FAILED');
      this.logger.error(`   Error: ${error.message}`);
      this.logger.warn('⚠️ Print queue will NOT work without Redis!');
      this.logger.warn('💡 Make sure Redis is running: docker run -d -p 6379:6379 redis:alpine');
    }
  }

  /**
   * Check worker status
   */
  private async checkWorkerStatus() {
    try {
      const workers = await this.printQueue.getWorkers();
      
      if (workers && workers.length > 0) {
        this.logger.log(`✅ Print Workers: ${workers.length} ACTIVE`);
        workers.forEach((worker, index) => {
          this.logger.log(`   Worker ${index + 1}: ${worker.id || 'unknown'}`);
        });
      } else {
        this.logger.warn('⚠️ Print Workers: NO WORKERS DETECTED');
        this.logger.warn('💡 Start print worker: cd print-service && npm run worker');
        this.logger.warn('💡 Or use Print Service Manager GUI');
      }
    } catch (error) {
      this.logger.warn('⚠️ Print Workers: Unable to check status');
      this.logger.debug(`   Error: ${error.message}`);
    }
  }

  /**
   * Log queue statistics
   */
  private async logQueueStats() {
    try {
      const stats = await this.getQueueStats();
      
      this.logger.log('📊 Queue Statistics:');
      this.logger.log(`   Waiting: ${stats.waiting}`);
      this.logger.log(`   Active: ${stats.active}`);
      this.logger.log(`   Completed: ${stats.completed}`);
      this.logger.log(`   Failed: ${stats.failed}`);
      this.logger.log(`   Delayed: ${stats.delayed}`);

      if (stats.failed > 0) {
        this.logger.warn(`⚠️ ${stats.failed} failed jobs in queue - check logs`);
      }

      if (stats.waiting > 10) {
        this.logger.warn(`⚠️ ${stats.waiting} jobs waiting - worker may be slow or offline`);
      }
    } catch (error) {
      this.logger.warn('⚠️ Queue Stats: Unable to retrieve');
      this.logger.debug(`   Error: ${error.message}`);
    }
  }

  /**
   * Add a print job to the queue
   * 
   * Features:
   * - Idempotency: Same registration can't be queued twice simultaneously
   * - Per-exhibition queue grouping
   * - Priority support (VIP exhibitions can have higher priority)
   * 
   * @param jobData Print job data
   * @returns Job ID and queue position
   */
  async addPrintJob(jobData: PrintJobData): Promise<{ jobId: string; queuePosition: number }> {
    const jobId = `${jobData.registrationNumber}-${Date.now()}`;
    
    this.logger.log(`[Queue] Adding print job: ${jobId}`);
    this.logger.log(`[Queue] Visitor: ${jobData.visitorName} | Exhibition: ${jobData.exhibitionName}`);

    try {
      // Add job to queue
      const job = await this.printQueue.add(
        'print-badge', // Job name
        jobData,
        {
          jobId, // Unique ID
          priority: 1, // Default priority (lower number = higher priority)
        },
      );

      // Get current queue position
      const waitingJobs = await this.printQueue.getWaitingCount();
      
      this.logger.log(`[Queue] ✅ Job added: ${jobId}`);
      this.logger.log(`[Queue] Queue position: ${waitingJobs + 1}`);
      this.logger.log(`[Queue] Jobs waiting: ${waitingJobs}`);

      return {
        jobId: job.id as string,
        queuePosition: waitingJobs + 1,
      };
    } catch (error) {
      this.logger.error(`[Queue] ❌ Failed to add job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get job status and details
   * 
   * @param jobId Job ID
   * @returns Job status, progress, and result
   */
  async getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    result?: any;
    error?: string;
    attemptsMade: number;
    timestamp: string;
  }> {
    try {
      const job = await this.printQueue.getJob(jobId);

      if (!job) {
        return {
          status: 'not_found',
          progress: 0,
          attemptsMade: 0,
          timestamp: new Date().toISOString(),
        };
      }

      const state = await job.getState();
      const progress = job.progress as number || 0;

      return {
        status: state,
        progress,
        result: job.returnvalue,
        error: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: new Date(job.timestamp).toISOString(),
      };
    } catch (error) {
      this.logger.error(`[Queue] Error getting job status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Acquire distributed lock to prevent race conditions
   * 
   * Used during check-in to ensure only ONE kiosk can check in a visitor
   * even if 20 kiosks scan simultaneously
   * 
   * @param registrationNumber Registration number to lock
   * @param ttl Lock time-to-live in milliseconds (default 10 seconds)
   * @returns Lock acquired (true/false)
   */
  async acquireLock(registrationNumber: string, ttl: number = 10000): Promise<boolean> {
    const lockKey = `checkin-lock:${registrationNumber}`;
    const lockValue = `${Date.now()}`; // Unique value for this lock
    
    try {
      // SET with NX (only if not exists) and PX (expiry in milliseconds)
      const result = await this.redisClient.set(
        lockKey,
        lockValue,
        'PX',
        ttl,
        'NX',
      );

      if (result === 'OK') {
        this.logger.log(`[Lock] ✅ Acquired: ${registrationNumber}`);
        return true;
      } else {
        this.logger.warn(`[Lock] ⛔ Already locked: ${registrationNumber}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`[Lock] Error acquiring lock: ${error.message}`);
      return false;
    }
  }

  /**
   * Release distributed lock
   * 
   * @param registrationNumber Registration number to unlock
   */
  async releaseLock(registrationNumber: string): Promise<void> {
    const lockKey = `checkin-lock:${registrationNumber}`;
    
    try {
      await this.redisClient.del(lockKey);
      this.logger.log(`[Lock] 🔓 Released: ${registrationNumber}`);
    } catch (error) {
      this.logger.error(`[Lock] Error releasing lock: ${error.message}`);
    }
  }

  /**
   * Get queue statistics
   * 
   * @returns Queue metrics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.printQueue.getWaitingCount(),
        this.printQueue.getActiveCount(),
        this.printQueue.getCompletedCount(),
        this.printQueue.getFailedCount(),
        this.printQueue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    } catch (error) {
      this.logger.error(`[Queue] Error getting stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get jobs by exhibition ID
   * 
   * @param exhibitionId Exhibition ID
   * @param status Job status filter (waiting, active, completed, failed)
   * @param limit Max number of jobs to return
   * @returns Jobs for the exhibition
   */
  async getJobsByExhibition(
    exhibitionId: string,
    status: 'waiting' | 'active' | 'completed' | 'failed' = 'waiting',
    limit: number = 50,
  ): Promise<Job[]> {
    try {
      let jobs: Job[] = [];

      switch (status) {
        case 'waiting':
          jobs = await this.printQueue.getWaiting(0, limit - 1);
          break;
        case 'active':
          jobs = await this.printQueue.getActive(0, limit - 1);
          break;
        case 'completed':
          jobs = await this.printQueue.getCompleted(0, limit - 1);
          break;
        case 'failed':
          jobs = await this.printQueue.getFailed(0, limit - 1);
          break;
      }

      // Filter by exhibition ID
      return jobs.filter(job => job.data.exhibitionId === exhibitionId);
    } catch (error) {
      this.logger.error(`[Queue] Error getting jobs by exhibition: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retry a failed job
   * 
   * @param jobId Job ID
   */
  async retryJob(jobId: string): Promise<void> {
    try {
      const job = await this.printQueue.getJob(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      await job.retry();
      this.logger.log(`[Queue] 🔄 Job retried: ${jobId}`);
    } catch (error) {
      this.logger.error(`[Queue] Error retrying job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove a job from the queue
   * 
   * @param jobId Job ID
   */
  async removeJob(jobId: string): Promise<void> {
    try {
      const job = await this.printQueue.getJob(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      await job.remove();
      this.logger.log(`[Queue] 🗑️  Job removed: ${jobId}`);
    } catch (error) {
      this.logger.error(`[Queue] Error removing job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up old jobs
   * 
   * @param grace Grace period in milliseconds
   * @param limit Max number of jobs to clean
   */
  async cleanQueue(grace: number = 24 * 3600 * 1000, limit: number = 1000): Promise<{
    cleaned: number;
  }> {
    try {
      const cleaned = await this.printQueue.clean(grace, limit, 'completed');
      
      this.logger.log(`[Queue] 🧹 Cleaned ${cleaned.length} old jobs`);
      
      return {
        cleaned: cleaned.length,
      };
    } catch (error) {
      this.logger.error(`[Queue] Error cleaning queue: ${error.message}`);
      throw error;
    }
  }
}

