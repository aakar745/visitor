import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from '../../database/schemas/otp.schema';
import { WhatsAppOtpService } from '../../services/whatsapp-otp.service';

/**
 * OTP Delivery Job Data
 */
export interface OtpDeliveryJobData {
  phoneNumber: string;
  otpCode: string;
  otpRecordId: string;
  timestamp: string;
}

/**
 * OTP Queue Service
 * 
 * Handles asynchronous WhatsApp OTP delivery using BullMQ.
 * This prevents blocking the main request thread and provides reliability through retries.
 */
@Injectable()
@Processor('otp-delivery')
export class OtpQueueService extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(OtpQueueService.name);

  constructor(
    @InjectQueue('otp-delivery') private otpQueue: Queue,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private whatsAppOtpService: WhatsAppOtpService,
  ) {
    super();
  }

  /**
   * Module initialization - check queue health
   */
  async onModuleInit() {
    this.logger.log('✅ OTP Queue Service initialized');
    
    // Log queue statistics
    const stats = await this.getQueueStats();
    this.logger.log(`📊 OTP Queue Stats: ${JSON.stringify(stats)}`);
  }

  /**
   * Add OTP delivery job to queue
   * 
   * @param jobData - OTP delivery data
   * @returns Job ID
   */
  async queueOtpDelivery(jobData: OtpDeliveryJobData): Promise<string> {
    const job = await this.otpQueue.add(
      'send-whatsapp-otp',
      jobData,
      {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2s, then 4s, then 8s
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 100,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours (debugging)
        },
      },
    );

    this.logger.log(`📤 OTP delivery queued: Job ID ${job.id} for ${jobData.phoneNumber}`);
    return job.id as string;
  }

  /**
   * Process OTP delivery jobs (worker method)
   * This method is automatically called by BullMQ when jobs are available
   */
  async process(job: Job<OtpDeliveryJobData>): Promise<any> {
    const { phoneNumber, otpCode, otpRecordId, timestamp } = job.data;

    this.logger.log(`📱 Processing OTP delivery for ${phoneNumber} (Job: ${job.id})`);

    try {
      // Send OTP via WhatsApp
      const result = await this.whatsAppOtpService.sendOTP(phoneNumber, otpCode);

      if (result.success) {
        this.logger.log(`✅ OTP delivered successfully to ${phoneNumber}`);
        
        // Update OTP record with message ID
        if (result.messageId) {
          await this.otpModel.updateOne(
            { _id: otpRecordId },
            { $set: { messageId: result.messageId } },
          );
        }

        return {
          success: true,
          messageId: result.messageId,
          deliveredAt: new Date(),
        };
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      this.logger.error(`❌ OTP delivery failed for ${phoneNumber}: ${error.message}`);
      
      // BullMQ will automatically retry based on job configuration
      throw error;
    }
  }

  /**
   * Get job status
   * 
   * @param jobId - Job ID returned from queueOtpDelivery
   * @returns Job state and progress
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.otpQueue.getJob(jobId);
    
    if (!job) {
      return {
        status: 'not_found',
        message: 'Job not found (may have been cleaned up)',
      };
    }

    const state = await job.getState();
    const progress = job.progress;
    const failedReason = job.failedReason;

    return {
      status: state,
      progress,
      failedReason,
      attemptsMade: job.attemptsMade,
      data: job.data,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.otpQueue.getWaitingCount(),
      this.otpQueue.getActiveCount(),
      this.otpQueue.getCompletedCount(),
      this.otpQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  /**
   * Clean up old jobs (maintenance)
   */
  async cleanOldJobs(): Promise<void> {
    await this.otpQueue.clean(3600000, 100, 'completed'); // Clean completed jobs older than 1 hour
    await this.otpQueue.clean(86400000, 100, 'failed'); // Clean failed jobs older than 24 hours
    this.logger.log('🧹 Old OTP jobs cleaned up');
  }
}

