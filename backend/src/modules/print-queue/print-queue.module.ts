import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrintQueueService } from './print-queue.service';
import { PrintQueueController } from './print-queue.controller';

/**
 * Print Queue Module
 * 
 * Manages print job queues using BullMQ and Redis
 * 
 * Features:
 * - Per-exhibition queue isolation
 * - Job retry logic (3 attempts)
 * - Rate limiting per printer
 * - Job status tracking
 * - Dead letter queue for failures
 * - Distributed locking for race condition prevention
 */
@Module({
  imports: [
    // Register default print queue with ConfigService
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          // Optional: Add password if Redis has auth
          // password: configService.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3, // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2s delay, then 4s, 8s
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep max 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days (debugging)
          },
        },
      }),
    }),
    // Register print queue
    BullModule.registerQueue({
      name: 'print-jobs',
    }),
  ],
  providers: [PrintQueueService],
  controllers: [PrintQueueController],
  exports: [PrintQueueService], // Export so other modules can use it
})
export class PrintQueueModule {}

