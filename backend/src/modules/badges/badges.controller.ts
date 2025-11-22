import { Controller, Get, Post, Param, Res, NotFoundException, Logger, VERSION_NEUTRAL, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { BadgesService } from './badges.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ExhibitionRegistration,
  ExhibitionRegistrationDocument,
} from '../../database/schemas/exhibition-registration.schema';
import * as QRCode from 'qrcode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { generateRegistrationQR } from '../../common/utils/sanitize.util';

/**
 * Badges Controller
 * 
 * Handles on-demand badge generation and serving
 * - Generates badge if it doesn't exist (lazy loading)
 * - Serves existing badge if available
 * - Handles old registrations from 2024 that need badges in 2025
 * 
 * Route: /uploads/badges/:id.png (no /api prefix, no versioning)
 * Excluded from global prefix and versioning to match static file URLs
 */
@ApiTags('Badges')
@Controller({ path: 'uploads/badges', version: VERSION_NEUTRAL })
export class BadgesController {
  private readonly logger = new Logger(BadgesController.name);
  private readonly uploadDir: string;

  constructor(
    private readonly badgesService: BadgesService,
    @InjectModel(ExhibitionRegistration.name)
    private registrationModel: Model<ExhibitionRegistrationDocument>,
    private configService: ConfigService,
  ) {
    // Use absolute path for upload directory
    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    this.uploadDir = path.isAbsolute(uploadDir) ? uploadDir : path.resolve(process.cwd(), uploadDir);
    this.logger.log(`[Badge Controller] Upload directory: ${this.uploadDir}`);
  }

  /**
   * Get badge for a registration
   * Auto-generates if missing (lazy loading)
   * 
   * This endpoint ensures badges are always available, even for:
   * - Old registrations from 2024
   * - Registrations where badge generation failed
   * - Badges that were cleaned up by auto-cleanup
   * 
   * PUBLIC ENDPOINT - No authentication required (images should be publicly accessible)
   */
  @Public()
  @Get(':registrationId.png')
  @ApiOperation({ summary: 'Get or generate badge for registration (Public)' })
  @ApiParam({ name: 'registrationId', description: 'Registration ID' })
  @ApiResponse({ status: 200, description: 'Badge image (PNG)' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async getBadge(
    @Param('registrationId') registrationId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`[Badge Request] Registration ID: ${registrationId}`);

      // Check if badge file already exists
      const badgeFilePath = path.join(this.uploadDir, 'badges', `${registrationId}.png`);
      
      try {
        await fs.access(badgeFilePath);
        // Badge exists - serve it directly
        this.logger.log(`[Badge] ✅ Serving existing badge: ${registrationId}`);
        res.sendFile(badgeFilePath);
        return;
      } catch (error) {
        // Badge doesn't exist - generate it
        this.logger.log(`[Badge] 🔄 Badge not found, generating on-demand: ${registrationId}`);
      }

      // Fetch registration details
      const registration = await this.registrationModel
        .findById(registrationId)
        .populate('visitorId')
        .populate('exhibitionId')
        .exec();

      if (!registration) {
        this.logger.warn(`[Badge] ❌ Registration not found: ${registrationId}`);
        throw new NotFoundException('Registration not found');
      }

      const visitor = registration.visitorId as any;
      const exhibition = registration.exhibitionId as any;

      // ✅ Generate QR code for the badge (using shared utility)
      const qrCodeUrl = await generateRegistrationQR(registration.registrationNumber);

      // Generate the badge
      this.logger.log(`[Badge] 🎨 Generating badge for: ${visitor.name}`);
      const badgeResult = await this.badgesService.generateBadge(
        registrationId,
        registration.registrationNumber,
        registration.registrationCategory,
        qrCodeUrl,
        exhibition.badgeLogo,
        visitor.name,
        visitor.city,
        visitor.state,
        visitor.company,
      );

      if (!badgeResult || !badgeResult.filePath) {
        this.logger.error(`[Badge] ❌ Generation failed: ${registrationId}`);
        throw new NotFoundException('Failed to generate badge');
      }

      this.logger.log(`[Badge] ✅ Badge generated successfully: ${registrationId}`);

      // Serve the newly generated badge
      res.sendFile(badgeResult.filePath);
    } catch (error) {
      this.logger.error(`[Badge] Error: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        res.status(404).json({
          statusCode: 404,
          message: error.message,
          error: 'Not Found',
        });
      } else {
        res.status(500).json({
          statusCode: 500,
          message: 'Failed to generate badge',
          error: 'Internal Server Error',
        });
      }
    }
  }

  // =============================================================================
  // 🧹 BADGE CLEANUP ENDPOINTS
  // =============================================================================

  /**
   * Manually trigger smart badge cleanup
   * 
   * This endpoint allows admins to manually trigger the smart badge cleanup
   * without waiting for the weekly cron job (Sunday 4 AM).
   * 
   * Use cases:
   * - Testing cleanup logic
   * - Immediate cleanup when disk space is low
   * - Custom cleanup schedules
   * - Verifying cleanup behavior
   * 
   * The cleanup logic:
   * - Only deletes badges for COMPLETED exhibitions
   * - Only exhibitions that ended 7+ days ago
   * - Database records are preserved for on-demand regeneration
   * - Returns detailed statistics (exhibitions processed, badges deleted, disk space freed)
   * 
   * Security:
   * - Protected by JWT authentication (admin only)
   * - CSRF protection enabled (admin panel must include CSRF token)
   * 
   * Note: This endpoint should be called from the admin panel, which automatically
   * handles CSRF token inclusion in requests.
   */
  @ApiBearerAuth()
  @Post('cleanup/smart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Manually trigger smart badge cleanup (Admin only)',
    description: 'Cleans up badges for COMPLETED exhibitions that ended 90+ days ago. Provides detailed statistics.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cleanup completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        exhibitionsProcessed: { type: 'number', example: 5 },
        badgesDeleted: { type: 'number', example: 12543 },
        diskSpaceFreed: { type: 'string', example: '4250.00 MB' },
        errors: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Smart badge cleanup completed successfully' }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Cleanup failed' })
  async triggerSmartCleanup() {
    this.logger.log('🔧 [API] Manual smart badge cleanup triggered by admin');
    
    try {
      const result = await this.badgesService.manualSmartBadgeCleanup();
      
      return {
        ...result,
        message: result.success 
          ? 'Smart badge cleanup completed successfully' 
          : 'Smart badge cleanup completed with errors',
      };
    } catch (error) {
      this.logger.error('❌ [API] Manual cleanup failed:', error);
      throw error;
    }
  }
}

