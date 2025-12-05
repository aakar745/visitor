import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { WhatsAppRegistrationService } from '../../services/whatsapp-registration.service';

/**
 * WhatsApp Delivery Job Data
 */
export interface WhatsAppDeliveryJobData {
  phoneNumber: string;
  visitorName: string;
  badgeUrl: string;
  registrationNumber: string;
  registrationId: string;
  timestamp: string;
}

/**
 * WhatsApp Queue Service
 * 
 * Manages asynchronous WhatsApp message delivery using BullMQ
 * 
 * Flow:
 * 1. Registration service enqueues WhatsApp job (non-blocking)
 * 2. Job is stored in Redis queue
 * 3. Worker picks up job and sends WhatsApp message
 * 4. On failure, job is retried (3 attempts with exponential backoff)
 * 5. Logs all delivery attempts for monitoring
 */
@Processor('whatsapp-delivery')
@Injectable()
export class WhatsAppQueueService extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppQueueService.name);

  constructor(
    @InjectQueue('whatsapp-delivery')
    private whatsappQueue: Queue<WhatsAppDeliveryJobData>,
    private whatsappRegistrationService: WhatsAppRegistrationService,
  ) {
    super();
  }

  async onModuleInit() {
    this.logger.log('✅ WhatsApp Queue Service initialized');
    
    // Log queue status on startup
    const counts = await this.whatsappQueue.getJobCounts();
    this.logger.log(`Queue Status - Active: ${counts.active}, Waiting: ${counts.waiting}, Completed: ${counts.completed}, Failed: ${counts.failed}`);
  }

  /**
   * Enqueue WhatsApp delivery job
   * 
   * This is called by RegistrationsService after successful registration
   * 
   * @param data - WhatsApp delivery job data
   * @returns Job ID
   */
  async enqueueWhatsAppDelivery(data: WhatsAppDeliveryJobData): Promise<string> {
    try {
      const job = await this.whatsappQueue.add(
        'send-registration-confirmation',
        data,
        {
          attempts: 3, // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5s delay, then 10s, 20s
          },
          removeOnComplete: {
            age: 7 * 24 * 3600, // Keep completed jobs for 7 days
            count: 5000, // Keep max 5000 completed jobs
          },
          removeOnFail: {
            age: 14 * 24 * 3600, // Keep failed jobs for 14 days (debugging)
          },
        },
      );

      this.logger.log(`📬 WhatsApp job enqueued: ${job.id} for ${data.registrationNumber}`);
      return job.id;
    } catch (error) {
      this.logger.error(`Failed to enqueue WhatsApp job: ${error.message}`);
      // Don't throw - registration should succeed even if queue fails
      return null;
    }
  }

  /**
   * Process WhatsApp delivery job
   * 
   * This method is automatically called by BullMQ worker
   * 
   * @param job - BullMQ job containing delivery data
   */
  async process(job: Job<WhatsAppDeliveryJobData>): Promise<void> {
    const { phoneNumber, visitorName, badgeUrl, registrationNumber, registrationId } = job.data;

    this.logger.log(`🔄 Processing WhatsApp job ${job.id} for ${registrationNumber} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

    try {
      // Send WhatsApp message
      const result = await this.whatsappRegistrationService.sendRegistrationConfirmation(
        phoneNumber,
        visitorName,
        badgeUrl,
        registrationNumber,
      );

      if (result.success) {
        this.logger.log(`✅ WhatsApp delivered successfully for ${registrationNumber}. Message ID: ${result.messageId}`);
        
        // Job completes successfully
        return;
      } else {
        // Failed - will retry
        this.logger.warn(`⚠️ WhatsApp delivery failed for ${registrationNumber}: ${result.error}`);
        throw new Error(result.error || 'WhatsApp delivery failed');
      }
    } catch (error) {
      this.logger.error(`❌ WhatsApp job ${job.id} failed (Attempt ${job.attemptsMade + 1}): ${error.message}`);
      
      // Re-throw to trigger retry
      throw error;
    }
  }

  /**
   * Get queue statistics
   * 
   * Useful for monitoring and debugging
   */
  async getQueueStats(): Promise<{
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return await this.whatsappQueue.getJobCounts();
  }

  /**
   * Get failed jobs
   * 
   * Useful for debugging and monitoring
   * 
   * @param limit - Maximum number of jobs to return
   */
  async getFailedJobs(limit = 100): Promise<Job<WhatsAppDeliveryJobData>[]> {
    return await this.whatsappQueue.getFailed(0, limit);
  }

  /**
   * Retry a specific failed job
   * 
   * Useful for manual intervention
   * 
   * @param jobId - Job ID to retry
   */
  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.whatsappQueue.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (await job.isFailed()) {
      await job.retry();
      this.logger.log(`🔄 Manually retrying job ${jobId}`);
    } else {
      throw new Error(`Job ${jobId} is not in failed state`);
    }
  }

  /**
   * Retry all failed jobs
   * 
   * Useful for bulk recovery after system issues
   * 
   * @param limit - Maximum number of jobs to retry
   */
  async retryAllFailedJobs(limit = 100): Promise<number> {
    const failedJobs = await this.getFailedJobs(limit);
    let retried = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        retried++;
      } catch (error) {
        this.logger.error(`Failed to retry job ${job.id}: ${error.message}`);
      }
    }

    this.logger.log(`🔄 Retried ${retried} failed jobs`);
    return retried;
  }
}

