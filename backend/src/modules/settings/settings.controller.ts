import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UploadsService } from '../uploads/uploads.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly uploadsService: UploadsService,
  ) {}

  /**
   * Get all settings grouped by category (Admin only)
   */
  @ApiBearerAuth('JWT-auth')
  @Get()
  @ApiOperation({ summary: 'Get all settings grouped by category' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings() {
    // Return raw data - the global TransformInterceptor will wrap it
    const settings = await this.settingsService.getSettings();
    return Array.isArray(settings) ? settings : [];
  }

  /**
   * Get single setting by key (Admin only)
   */
  @ApiBearerAuth('JWT-auth')
  @Get('key/:key')
  @ApiOperation({ summary: 'Get single setting by key' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  /**
   * Update setting value (Admin only)
   */
  @ApiBearerAuth('JWT-auth')
  @Put('key/:key')
  @ApiOperation({ summary: 'Update setting value' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid value' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async updateSetting(
    @Param('key') key: string,
    @Body('value') value: any,
  ) {
    return this.settingsService.updateSetting(key, value);
  }

  /**
   * Reset setting to default value (Admin only)
   */
  @ApiBearerAuth('JWT-auth')
  @Post('key/:key/reset')
  @ApiOperation({ summary: 'Reset setting to default value' })
  @ApiResponse({ status: 200, description: 'Setting reset successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async resetSetting(@Param('key') key: string) {
    return this.settingsService.resetSetting(key);
  }

  /**
   * Upload file (logo, image, etc.) for settings (Admin only)
   */
  @ApiBearerAuth('JWT-auth')
  @Post('upload')
  @ApiOperation({ summary: 'Upload file for settings (logo, favicon, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type (only images for logos)
    const fileType = type || 'logo';
    const result = await this.uploadsService.saveFile(file, fileType, 'logos');

    return {
      url: result.url,
      filename: result.filename,
    };
  }

  /**
   * Get settings dashboard data (Admin only)
   */
  @ApiBearerAuth('JWT-auth')
  @Get('dashboard')
  @ApiOperation({ summary: 'Get settings dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard() {
    return this.settingsService.getDashboard();
  }

  /**
   * Get public settings (for frontend) - No auth required
   */
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public settings (frontend logos, colors, etc.)' })
  @ApiResponse({ status: 200, description: 'Public settings retrieved successfully' })
  async getPublicSettings() {
    // Get specific public settings
    const appName = await this.settingsService.getSetting('app.name').catch(() => null);
    const headerLogo = await this.settingsService.getSetting('app.headerLogo').catch(() => null);
    const footerLogo = await this.settingsService.getSetting('app.footerLogo').catch(() => null);
    const primaryColor = await this.settingsService.getSetting('app.primaryColor').catch(() => null);

    return {
      appName: appName?.value || 'Visitor Management System',
      headerLogoUrl: headerLogo?.value || null,
      footerLogoUrl: footerLogo?.value || null,
      primaryColor: primaryColor?.value || '#1890ff',
    };
  }

  /**
   * Get public maintenance status - No auth required
   */
  @Public()
  @Get('public/maintenance')
  @ApiOperation({ summary: 'Check if system is in maintenance mode (public)' })
  @ApiResponse({ status: 200, description: 'Maintenance status retrieved successfully' })
  async getPublicMaintenanceStatus() {
    return this.settingsService.getMaintenanceStatus();
  }

  /**
   * Get settings backups (Stub - TODO: Implement)
   */
  @ApiBearerAuth('JWT-auth')
  @Get('backups')
  @ApiOperation({ summary: 'Get settings backups' })
  @ApiResponse({ status: 200, description: 'Backups retrieved successfully' })
  async getBackups() {
    return [];
  }

  /**
   * Get system health (Stub - TODO: Implement)
   */
  @ApiBearerAuth('JWT-auth')
  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getSystemHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get maintenance status
   */
  @ApiBearerAuth('JWT-auth')
  @Get('maintenance/status')
  @ApiOperation({ summary: 'Get maintenance mode status' })
  @ApiResponse({ status: 200, description: 'Maintenance status retrieved successfully' })
  async getMaintenanceStatus() {
    return this.settingsService.getMaintenanceStatus();
  }

  /**
   * Get settings history (Stub - TODO: Implement)
   */
  @ApiBearerAuth('JWT-auth')
  @Get('history')
  @ApiOperation({ summary: 'Get settings change history' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async getSettingsHistory() {
    return [];
  }

  /**
   * Clear cache (REAL implementation)
   */
  @ApiBearerAuth('JWT-auth')
  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear application cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache(@Body() body?: { keys?: string[] }) {
    return this.settingsService.clearCache(body?.keys);
  }

  /**
   * Enable maintenance mode
   */
  @ApiBearerAuth('JWT-auth')
  @Post('maintenance/enable')
  @ApiOperation({ summary: 'Enable maintenance mode' })
  @ApiResponse({ status: 200, description: 'Maintenance mode enabled successfully' })
  async enableMaintenanceMode(@Body() body: { message?: string; duration?: number }) {
    return this.settingsService.enableMaintenanceMode(body.message, body.duration);
  }

  /**
   * Disable maintenance mode
   */
  @ApiBearerAuth('JWT-auth')
  @Post('maintenance/disable')
  @ApiOperation({ summary: 'Disable maintenance mode' })
  @ApiResponse({ status: 200, description: 'Maintenance mode disabled successfully' })
  async disableMaintenanceMode() {
    return this.settingsService.disableMaintenanceMode();
  }
}

