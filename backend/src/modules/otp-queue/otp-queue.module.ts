import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from '../../database/schemas/otp.schema';
import { OtpQueueService } from './otp-queue.service';
import { WhatsAppOtpService } from '../../services/whatsapp-otp.service';

/**
 * OTP Queue Module
 * 
 * Manages WhatsApp OTP delivery using BullMQ and Redis for reliability and scalability.
 * 
 * Features:
 * - Asynchronous OTP delivery (non-blocking)
 * - Automatic retries on failure
 * - Rate limiting built-in
 * - Job status tracking
 * - Graceful degradation
 * 
 * Benefits:
 * - Faster response time for users (no waiting for Interakt API)
 * - Better reliability (retries on temporary failures)
 * - Handles high load smoothly
 * - Prevents Interakt API rate limit issues
 */
@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'otp-delivery',
    }),
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
    ]),
  ],
  providers: [OtpQueueService, WhatsAppOtpService],
  exports: [OtpQueueService],
})
export class OtpQueueModule {}

