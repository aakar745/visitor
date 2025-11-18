import { Controller, Get, Put, Body, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { KioskService } from './kiosk.service';
import { UpdateKioskSettingsDto } from './dto/update-kiosk-settings.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Kiosk')
@Controller('kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  /**
   * Get kiosk settings (Admin only)
   */
  @ApiBearerAuth()
  @Get('settings')
  @ApiOperation({ summary: 'Get kiosk settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Kiosk settings retrieved' })
  async getSettings() {
    return this.kioskService.getSettings();
  }

  /**
   * Update kiosk settings (Admin only)
   */
  @ApiBearerAuth()
  @Put('settings')
  @ApiOperation({ summary: 'Update kiosk settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Kiosk settings updated' })
  async updateSettings(@Body() dto: UpdateKioskSettingsDto) {
    return this.kioskService.updateSettings(dto);
  }

  /**
   * Get public kiosk configuration (No auth required)
   */
  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Get public kiosk configuration' })
  @ApiResponse({ status: 200, description: 'Public kiosk config retrieved' })
  async getPublicConfig() {
    return this.kioskService.getPublicConfig();
  }

  /**
   * Validate kiosk PIN (No auth required)
   */
  @Public()
  @Post('validate-pin')
  @ApiOperation({ summary: 'Validate kiosk PIN' })
  @ApiResponse({ status: 200, description: 'PIN validation result' })
  async validatePin(@Body('pin') pin: string) {
    const isValid = await this.kioskService.validatePin(pin);
    return {
      success: isValid,
      message: isValid ? 'PIN is valid' : 'Invalid PIN',
    };
  }
}

