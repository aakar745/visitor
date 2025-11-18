import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrintQueueService } from './print-queue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Print Queue Controller
 * 
 * Endpoints for monitoring and managing the print job queue
 * 
 * Public endpoints (for kiosk):
 * - GET /print-queue/job/:jobId - Get job status
 * 
 * Admin endpoints (require auth):
 * - GET /print-queue/stats - Get queue statistics
 * - GET /print-queue/exhibition/:id - Get jobs by exhibition
 * - POST /print-queue/job/:jobId/retry - Retry failed job
 * - DELETE /print-queue/job/:jobId - Remove job
 * - POST /print-queue/clean - Clean old jobs
 */
@ApiTags('Print Queue')
@Controller('print-queue')
export class PrintQueueController {
  constructor(private readonly printQueueService: PrintQueueService) {}

  /**
   * Get job status (Public - for kiosk)
   * Kiosks poll this endpoint to check print job status
   */
  @Public()
  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get print job status (Public - for kiosk)' })
  @ApiParam({ name: 'jobId', description: 'Job ID returned when job was queued' })
  @ApiResponse({ status: 200, description: 'Job status retrieved' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.printQueueService.getJobStatus(jobId);
    return {
      success: true,
      data: status,
      message: 'Job status retrieved',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get queue statistics (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get queue statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved' })
  async getQueueStats() {
    const stats = await this.printQueueService.getQueueStats();
    return {
      success: true,
      data: stats,
      message: 'Queue statistics retrieved',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get jobs by exhibition (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Get('exhibition/:exhibitionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get print jobs for an exhibition (Admin)' })
  @ApiParam({ name: 'exhibitionId', description: 'Exhibition ID' })
  @ApiQuery({ name: 'status', enum: ['waiting', 'active', 'completed', 'failed'], required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Max jobs to return (default 50)' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved' })
  async getJobsByExhibition(
    @Param('exhibitionId') exhibitionId: string,
    @Query('status') status: 'waiting' | 'active' | 'completed' | 'failed' = 'waiting',
    @Query('limit') limit?: number,
  ) {
    const jobs = await this.printQueueService.getJobsByExhibition(
      exhibitionId,
      status,
      limit ? parseInt(limit.toString()) : 50,
    );
    
    return {
      success: true,
      data: {
        count: jobs.length,
        jobs: jobs.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
        })),
      },
      message: 'Jobs retrieved',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retry a failed job (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Post('job/:jobId/retry')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry a failed print job (Admin)' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job retried' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(@Param('jobId') jobId: string) {
    await this.printQueueService.retryJob(jobId);
    return {
      success: true,
      message: 'Job retried successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Remove a job (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Delete('job/:jobId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a print job (Admin)' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job removed' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async removeJob(@Param('jobId') jobId: string) {
    await this.printQueueService.removeJob(jobId);
    return {
      success: true,
      message: 'Job removed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clean old completed jobs (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Post('clean')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clean old completed jobs (Admin)' })
  @ApiQuery({ name: 'grace', type: Number, required: false, description: 'Grace period in hours (default 24)' })
  @ApiResponse({ status: 200, description: 'Queue cleaned' })
  async cleanQueue(@Query('grace') grace?: number) {
    const graceMs = grace ? parseInt(grace.toString()) * 3600 * 1000 : 24 * 3600 * 1000;
    const result = await this.printQueueService.cleanQueue(graceMs);
    
    return {
      success: true,
      data: result,
      message: 'Queue cleaned successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

