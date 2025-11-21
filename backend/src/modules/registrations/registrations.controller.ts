import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Registrations')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  /**
   * Create a new registration (Public endpoint for visitor frontend)
   */
  @Public()
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 registrations per minute per IP
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new visitor registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or registration closed' })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  @ApiResponse({ status: 409, description: 'Already registered for this exhibition' })
  async createRegistration(@Body() dto: CreateRegistrationDto) {
    // TransformInterceptor will automatically wrap the response
    return await this.registrationsService.createRegistration(dto);
  }

  /**
   * Verify registration by ID (Public endpoint for success page)
   */
  @Public()
  @Get('verify/:id')
  @ApiOperation({ summary: 'Verify and get registration details' })
  @ApiParam({ name: 'id', description: 'Registration ID' })
  @ApiResponse({ status: 200, description: 'Registration details retrieved' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async verifyRegistration(@Param('id') id: string) {
    // TransformInterceptor will automatically wrap the response
    return await this.registrationsService.verifyRegistration(id);
  }

  /**
   * Lookup visitor by email or phone (Public endpoint for pre-filling form)
   */
  @Public()
  @Get('lookup')
  @Throttle({ default: { ttl: 60000, limit: 20 } }) // 20 lookups per minute per IP
  @ApiOperation({ summary: 'Lookup visitor profile by email or phone' })
  @ApiQuery({ name: 'email', description: 'Visitor email address', required: false })
  @ApiQuery({ name: 'phone', description: 'Visitor phone number', required: false })
  @ApiResponse({ status: 200, description: 'Visitor profile retrieved' })
  @ApiResponse({ status: 404, description: 'Visitor not found' })
  async lookupVisitor(
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    // Prioritize phone lookup (primary identifier)
    const result = phone
      ? await this.registrationsService.lookupVisitorByPhone(phone)
      : email
      ? await this.registrationsService.lookupVisitorByEmail(email)
      : null;

    // TransformInterceptor will automatically wrap the response
    // Return null if not found (will be wrapped by interceptor)
    return result || null;
  }

  /**
   * Get all registrations with visitor details (Admin endpoint)
   */
  @ApiBearerAuth()
  @Get('all-with-visitors')
  @ApiOperation({ summary: 'Get all registrations with visitor details (Admin)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiQuery({ name: 'search', description: 'Search term', required: false })
  @ApiQuery({ name: 'sortBy', description: 'Sort field', required: false })
  @ApiQuery({ name: 'sortOrder', description: 'Sort order (asc/desc)', required: false })
  @ApiResponse({ status: 200, description: 'Registrations retrieved successfully' })
  async getAllRegistrationsWithVisitors(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return await this.registrationsService.getAllRegistrationsWithVisitors({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });
  }

  /**
   * Delete a registration (Admin endpoint)
   */
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a registration (Admin)' })
  @ApiParam({ name: 'id', description: 'Registration ID' })
  @ApiResponse({ status: 204, description: 'Registration deleted successfully' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async deleteRegistration(@Param('id') id: string): Promise<void> {
    await this.registrationsService.deleteRegistration(id);
  }

  /**
   * Bulk delete registrations (Admin endpoint)
   */
  @ApiBearerAuth()
  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete registrations (Admin)' })
  @ApiResponse({ status: 200, description: 'Registrations deleted successfully' })
  async bulkDeleteRegistrations(@Body() body: { ids: string[] }): Promise<{
    message: string;
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    return await this.registrationsService.bulkDeleteRegistrations(body.ids);
  }

  /**
   * Check-in visitor by scanning QR code (Public endpoint - for kiosk)
   * Validates registration and records entry time
   * Exhibition is automatically detected from the registration
   */
  @Public()
  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 100 check-ins per minute
  @ApiOperation({ summary: 'Check-in visitor by QR code scan (Public - Kiosk)' })
  @ApiResponse({ status: 200, description: 'Visitor checked in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid QR code or already checked in' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async checkInVisitor(@Body() body: { registrationNumber: string }) {
    return await this.registrationsService.checkInVisitor(body.registrationNumber);
  }

  /**
   * Queue a print job (Public endpoint - for kiosk)
   * Adds print job to Redis queue for processing by print-service worker
   */
  @Public()
  @Post('queue-print')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 100 print jobs per minute
  @ApiOperation({ summary: 'Queue a print job (Public - Kiosk)' })
  @ApiResponse({ status: 200, description: 'Print job queued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid registration' })
  async queuePrintJob(
    @Body() body: { 
      registrationNumber: string; 
      printerServiceUrl: string;
      kioskId?: string;
    },
  ) {
    const result = await this.registrationsService.queuePrintJob(
      body.registrationNumber,
      body.printerServiceUrl,
      body.kioskId,
    );
    
    return {
      success: true,
      data: result,
      message: 'Print job queued successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate QR code before check-in (Public endpoint - for kiosk)
   * Returns visitor and registration details without recording check-in
   */
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 100 validations per minute
  @Get('validate-qr/:registrationNumber')
  @ApiOperation({ summary: 'Validate QR code and get visitor details (Admin)' })
  @ApiParam({ name: 'registrationNumber', description: 'Registration number from QR code' })
  @ApiResponse({ status: 200, description: 'QR code validated successfully' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async validateQRCode(@Param('registrationNumber') registrationNumber: string) {
    return await this.registrationsService.validateQRCode(registrationNumber);
  }

  /**
   * Get recent check-ins for an exhibition or all exhibitions (Public endpoint - for kiosk)
   * Used for real-time dashboard updates
   */
  @Public()
  @Get('recent-check-ins/:exhibitionId')
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 100 requests per minute
  @ApiOperation({ summary: 'Get recent check-ins (Public - Kiosk)' })
  @ApiParam({ name: 'exhibitionId', description: 'Exhibition ID or "all" for all exhibitions' })
  @ApiQuery({ name: 'limit', description: 'Number of records to return', required: false })
  @ApiResponse({ status: 200, description: 'Recent check-ins retrieved successfully' })
  async getRecentCheckIns(
    @Param('exhibitionId') exhibitionId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.registrationsService.getRecentCheckIns(exhibitionId, limit || 20);
  }

  /**
   * Get check-in statistics for an exhibition (Admin endpoint)
   */
  @ApiBearerAuth()
  @Get('check-in-stats/:exhibitionId')
  @ApiOperation({ summary: 'Get check-in statistics for exhibition (Admin)' })
  @ApiParam({ name: 'exhibitionId', description: 'Exhibition ID' })
  @ApiResponse({ status: 200, description: 'Check-in statistics retrieved successfully' })
  async getCheckInStats(@Param('exhibitionId') exhibitionId: string) {
    return await this.registrationsService.getCheckInStats(exhibitionId);
  }

  // =============================================================================
  // 🔄 BADGE REGENERATION ENDPOINTS
  // =============================================================================

  /**
   * Regenerate badge for a single registration
   * 
   * Use cases:
   * - Exhibition logo was updated after registration
   * - Badge file was corrupted or deleted
   * - Visitor information was updated
   * - Admin needs to reprint with latest exhibition branding
   * 
   * This will generate a NEW versioned badge file and update the registration
   * with the new badge URL. Old badge versions are cleaned up automatically.
   * 
   * Protected: Requires authentication (admin only)
   */
  @ApiBearerAuth()
  @Post(':id/regenerate-badge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Regenerate badge for a registration',
    description: 'Generates a new badge with current exhibition logo and visitor details. Useful when exhibition branding changes after registration.'
  })
  @ApiParam({ name: 'id', description: 'Registration ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Badge regenerated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Badge regenerated successfully' },
        data: {
          type: 'object',
          properties: {
            registrationId: { type: 'string' },
            badgeUrl: { type: 'string', example: 'https://api.example.com/uploads/badges/abc123-v1731500000000.png' },
            oldBadgeUrl: { type: 'string', nullable: true }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async regenerateBadge(@Param('id') id: string) {
    return await this.registrationsService.regenerateBadge(id);
  }

  /**
   * Regenerate badges for all registrations in an exhibition
   * 
   * Use cases:
   * - Exhibition logo was updated and all badges need new branding
   * - Bulk badge regeneration after exhibition details change
   * - Mass rebranding of all visitor badges
   * 
   * WARNING: This can be expensive for exhibitions with thousands of registrations!
   * Consider using background job queue for large exhibitions.
   * 
   * Protected: Requires authentication (admin only)
   */
  @ApiBearerAuth()
  @Post('exhibition/:exhibitionId/regenerate-all-badges')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Regenerate badges for all registrations in an exhibition',
    description: 'Regenerates ALL badges with current exhibition logo. Use this after updating exhibition branding. WARNING: Can be slow for large exhibitions.'
  })
  @ApiParam({ name: 'exhibitionId', description: 'Exhibition ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Badges regeneration started',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully regenerated badges for 142 registrations' },
        data: {
          type: 'object',
          properties: {
            exhibitionId: { type: 'string' },
            totalRegistrations: { type: 'number', example: 150 },
            successCount: { type: 'number', example: 142 },
            failureCount: { type: 'number', example: 8 },
            failures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  registrationId: { type: 'string' },
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async regenerateAllBadges(@Param('exhibitionId') exhibitionId: string) {
    return await this.registrationsService.regenerateAllBadges(exhibitionId);
  }
}

