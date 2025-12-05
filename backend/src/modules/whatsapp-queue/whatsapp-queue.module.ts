import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { WhatsAppRegistrationService } from '../../services/whatsapp-registration.service';

/**
 * WhatsApp Queue Module
 * 
 * Manages WhatsApp message delivery using BullMQ and Redis for enterprise-level reliability.
 * 
 * Features:
 * - Asynchronous message delivery (non-blocking registration)
 * - Automatic retries on failure (3 attempts with exponential backoff)
 * - Rate limiting built-in
 * - Job status tracking
 * - Handles high load smoothly (lakhs of concurrent registrations)
 * 
 * Benefits:
 * - Registration completes immediately (doesn't wait for WhatsApp API)
 * - Better reliability (retries on temporary failures)
 * - Prevents Interakt API rate limit issues
 * - Graceful degradation (registration succeeds even if WhatsApp fails)
 */
@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'whatsapp-delivery',
    }),
  ],
  providers: [WhatsAppQueueService, WhatsAppRegistrationService],
  exports: [WhatsAppQueueService],
})
export class WhatsAppQueueModule {}

