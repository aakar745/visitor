import { Controller, Get, Param, Res, NotFoundException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
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

/**
 * Badges Controller
 * 
 * Handles on-demand badge generation and serving
 * - Generates badge if it doesn't exist (lazy loading)
 * - Serves existing badge if available
 * - Handles old registrations from 2024 that need badges in 2025
 * 
 * Route: /uploads/badges/:id.png (matches static file pattern)
 */
@ApiTags('Badges')
@Controller('uploads/badges')
export class BadgesController {
  private readonly logger = new Logger(BadgesController.name);
  private readonly uploadDir: string;

  constructor(
    private readonly badgesService: BadgesService,
    @InjectModel(ExhibitionRegistration.name)
    private registrationModel: Model<ExhibitionRegistrationDocument>,
    private configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
  }

  /**
   * Get badge for a registration
   * Auto-generates if missing (lazy loading)
   * 
   * This endpoint ensures badges are always available, even for:
   * - Old registrations from 2024
   * - Registrations where badge generation failed
   * - Badges that were cleaned up by auto-cleanup
   */
  @Get(':registrationId.png')
  @ApiOperation({ summary: 'Get or generate badge for registration' })
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

      // Generate QR code for the badge
      const qrCodeUrl = await QRCode.toDataURL(registration.registrationNumber, {
        errorCorrectionLevel: 'H',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

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
}

