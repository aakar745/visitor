import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { ExhibitionsService } from './exhibitions.service';
import { CreateExhibitionDto, UpdateExhibitionDto, QueryExhibitionDto, UpdateStatusDto } from './dto';
import { Exhibition } from '../../database/schemas/exhibition.schema';
import { UploadsService } from '../uploads/uploads.service';
import { ExhibitorsService } from '../exhibitors/exhibitors.service';
import { QueryExhibitorDto } from '../exhibitors/dto';
import { Public } from '../../common/decorators/public.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Exhibitions')
@ApiBearerAuth()
@Controller('exhibitions')
export class ExhibitionsController {
  constructor(
    private readonly exhibitionsService: ExhibitionsService,
    private readonly uploadsService: UploadsService,
    private readonly exhibitorsService: ExhibitorsService,
  ) {}

  /**
   * Create a new exhibition
   */
  @Post()
  @RequirePermissions('exhibitions.create')
  @ApiOperation({ summary: 'Create a new exhibition' })
  @ApiResponse({ status: 201, description: 'Exhibition created successfully', type: Exhibition })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Exhibition with this name already exists' })
  async create(
    @Body() createExhibitionDto: CreateExhibitionDto,
    @Req() request: Request,
  ): Promise<Exhibition> {
    const userId = (request.user as any)?._id || (request.user as any)?.id;
    const exhibition = await this.exhibitionsService.create(createExhibitionDto, userId);
    
    // TransformInterceptor will wrap this
    return exhibition;
  }

  /**
   * Get all exhibitions with pagination and filters
   * Public endpoint for visitor frontend to list exhibitions
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all exhibitions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Exhibitions retrieved successfully' })
  async findAll(
    @Query() query: QueryExhibitionDto,
  ): Promise<{
    exhibitions: Exhibition[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    message: string;
  }> {
    const result = await this.exhibitionsService.findAll(query);
    
    // Return directly - TransformInterceptor will wrap it
    return {
      exhibitions: result.exhibitions,
      pagination: result.pagination,
      message: 'Exhibitions retrieved successfully',
    };
  }

  /**
   * Get exhibition statistics
   */
  @Get('statistics')
  @RequirePermissions('exhibitions.view')
  @ApiOperation({ summary: 'Get exhibition statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(): Promise<{
    data: {
      total: number;
      byStatus: Record<string, number>;
      paid: number;
      free: number;
      totalRegistrations: number;
    };
    message: string;
  }> {
    const stats = await this.exhibitionsService.getStatistics();
    
    return {
      data: stats,
      message: 'Statistics retrieved successfully',
    };
  }

  /**
   * Get single exhibition by ID
   */
  @Get(':id')
  @RequirePermissions('exhibitions.view')
  @ApiOperation({ summary: 'Get exhibition by ID' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiResponse({ status: 200, description: 'Exhibition retrieved successfully', type: Exhibition })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async findOne(@Param('id') id: string): Promise<Exhibition> {
    return await this.exhibitionsService.findOne(id);
  }

  /**
   * Get exhibition by slug
   * Public endpoint for visitor frontend
   */
  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get exhibition by slug' })
  @ApiParam({ name: 'slug', description: 'Exhibition slug' })
  @ApiResponse({ status: 200, description: 'Exhibition retrieved successfully', type: Exhibition })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async findBySlug(@Param('slug') slug: string): Promise<Exhibition> {
    return await this.exhibitionsService.findBySlug(slug);
  }

  /**
   * Get exhibition analytics
   */
  @Get(':id/analytics')
  @RequirePermissions('exhibitions.view')
  @ApiOperation({ summary: 'Get exhibition analytics' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async getAnalytics(@Param('id') id: string): Promise<any> {
    return await this.exhibitionsService.getAnalytics(id);
  }

  /**
   * Get exhibition registration statistics
   */
  @Get(':id/stats')
  @RequirePermissions('exhibitions.view', 'reports.view')
  @ApiOperation({ summary: 'Get exhibition registration statistics' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async getExhibitionStats(@Param('id') id: string): Promise<any> {
    return await this.exhibitionsService.getExhibitionStats(id);
  }

  /**
   * Get registrations for a specific exhibition
   */
  @Get(':id/registrations')
  @RequirePermissions('reports.view', 'reports.search')
  @ApiOperation({ summary: 'Get registrations for an exhibition' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiQuery({ name: 'status', description: 'Registration status filter', required: false })
  @ApiQuery({ name: 'category', description: 'Registration category filter', required: false })
  @ApiQuery({ name: 'paymentStatus', description: 'Payment status filter', required: false })
  @ApiQuery({ name: 'registrationType', description: 'Registration type (free/paid)', required: false, enum: ['free', 'paid'] })
  @ApiQuery({ name: 'registrationTiming', description: 'Registration timing (pre-registration/on-spot)', required: false, enum: ['pre-registration', 'on-spot'] })
  @ApiQuery({ name: 'checkInStatus', description: 'Check-in status (checked-in/not-checked-in)', required: false, enum: ['checked-in', 'not-checked-in'] })
  @ApiQuery({ name: 'startDate', description: 'Start date for date range filter (ISO string)', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date for date range filter (ISO string)', required: false })
  @ApiResponse({ status: 200, description: 'Registrations retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async getExhibitionRegistrations(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('registrationType') registrationType?: 'free' | 'paid',
    @Query('registrationTiming') registrationTiming?: 'pre-registration' | 'on-spot',
    @Query('checkInStatus') checkInStatus?: 'checked-in' | 'not-checked-in',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    return await this.exhibitionsService.getExhibitionRegistrations(id, {
      page,
      limit,
      status,
      category,
      paymentStatus,
      registrationType,
      registrationTiming,
      checkInStatus,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
    });
  }

  /**
   * Export exhibition registrations (CSV/Excel) - Streaming for large datasets
   * Handles millions of records efficiently without memory overflow
   */
  @Get(':id/export')
  @RequirePermissions('reports.export', 'exhibitions.export')
  @ApiOperation({ summary: 'Export exhibition registrations (streaming for large datasets)' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiQuery({ name: 'format', description: 'Export format', required: true, enum: ['csv', 'excel'] })
  @ApiQuery({ name: 'registrationType', description: 'Filter by free/paid', required: false, enum: ['free', 'paid'] })
  @ApiQuery({ name: 'registrationTiming', description: 'Filter by pre-registration/on-spot', required: false, enum: ['pre-registration', 'on-spot'] })
  @ApiQuery({ name: 'checkInStatus', description: 'Filter by check-in status', required: false, enum: ['checked-in', 'not-checked-in'] })
  @ApiQuery({ name: 'category', description: 'Filter by category', required: false })
  @ApiQuery({ name: 'paymentStatus', description: 'Filter by payment status', required: false })
  @ApiQuery({ name: 'startDate', description: 'Start date filter', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date filter', required: false })
  @ApiResponse({ status: 200, description: 'Export file generated successfully' })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async exportExhibitionRegistrations(
    @Param('id') id: string,
    @Res() res: Response, // Remove passthrough for binary file response
    @Query('format') format: 'csv' | 'excel',
    @Query('registrationType') registrationType?: 'free' | 'paid',
    @Query('registrationTiming') registrationTiming?: 'pre-registration' | 'on-spot',
    @Query('checkInStatus') checkInStatus?: 'checked-in' | 'not-checked-in',
    @Query('category') category?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<void> {
    // Set response headers for file download
    const exhibition = await this.exhibitionsService.findOne(id);
    const filename = `${exhibition.slug}-registrations-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const streamableFile = await this.exhibitionsService.exportExhibitionRegistrations(id, {
      format,
      registrationType,
      registrationTiming,
      checkInStatus,
      category,
      paymentStatus,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
    });

    // Pipe the stream directly to the response
    const stream = streamableFile.getStream();
    stream.pipe(res);
  }

  /**
   * Update exhibition
   */
  @Put(':id')
  @RequirePermissions('exhibitions.update')
  @ApiOperation({ summary: 'Update exhibition' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiResponse({ status: 200, description: 'Exhibition updated successfully', type: Exhibition })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('id') id: string,
    @Body() updateExhibitionDto: UpdateExhibitionDto,
    @Req() request: Request,
  ): Promise<Exhibition> {
    const userId = (request.user as any)?._id || (request.user as any)?.id;
    return await this.exhibitionsService.update(id, updateExhibitionDto, userId);
  }

  /**
   * Update exhibition status
   */
  @Patch(':id/status')
  @RequirePermissions('exhibitions.publish')
  @ApiOperation({ summary: 'Update exhibition status' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: Exhibition })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() request: Request,
  ): Promise<Exhibition> {
    const userId = (request.user as any)?._id || (request.user as any)?.id;
    return await this.exhibitionsService.updateStatus(id, updateStatusDto, userId);
  }

  /**
   * Duplicate exhibition
   */
  @Post(':id/duplicate')
  @RequirePermissions('exhibitions.duplicate')
  @ApiOperation({ summary: 'Duplicate an existing exhibition' })
  @ApiParam({ name: 'id', description: 'Exhibition ID to duplicate' })
  @ApiResponse({ status: 201, description: 'Exhibition duplicated successfully', type: Exhibition })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  async duplicate(
    @Param('id') id: string,
    @Body('name') newName: string,
    @Req() request: Request,
  ): Promise<Exhibition> {
    const userId = (request.user as any)?._id || (request.user as any)?.id;
    return await this.exhibitionsService.duplicate(id, newName, userId);
  }

  /**
   * Upload exhibition file (logo, banner, badge-logo)
   */
  @Post('upload')
  @RequirePermissions('exhibitions.create', 'exhibitions.update')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload exhibition file (logo, banner, badge-logo)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['logo', 'banner', 'badge-logo'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file type' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ): Promise<{
    id: string;
    url: string;
    filename: string;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!type || !['logo', 'banner', 'badge-logo'].includes(type)) {
      throw new BadRequestException('Invalid file type. Must be: logo, banner, or badge-logo');
    }

    const result = await this.uploadsService.saveFile(file, type, 'exhibitions');
    
    return {
      id: result.id,
      url: result.url,
      filename: result.filename,
    };
  }

  /**
   * Get exhibitors for an exhibition
   */
  @Get(':id/exhibitors')
  @RequirePermissions('exhibitors.view')
  @ApiOperation({ summary: 'Get exhibitors for an exhibition' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiResponse({ status: 200, description: 'Exhibitors retrieved successfully' })
  async getExhibitors(
    @Param('id') id: string,
    @Query() query: QueryExhibitorDto,
  ): Promise<any> {
    const result = await this.exhibitorsService.findByExhibition(id, query);
    return {
      exhibitors: result.exhibitors,
      pagination: result.pagination,
      message: 'Exhibitors retrieved successfully',
    };
  }

  /**
   * Get exhibitor by slug within an exhibition
   * Public endpoint for visitor frontend (exhibitor referral links)
   */
  @Public()
  @Get(':id/exhibitors/by-slug/:slug')
  @ApiOperation({ summary: 'Get exhibitor by slug' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiParam({ name: 'slug', description: 'Exhibitor slug' })
  @ApiResponse({ status: 200, description: 'Exhibitor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Exhibitor not found' })
  async getExhibitorBySlug(
    @Param('id') exhibitionId: string,
    @Param('slug') slug: string,
  ): Promise<any> {
    const exhibitor = await this.exhibitorsService.findBySlug(exhibitionId, slug);
    return exhibitor;
  }

  /**
   * Delete exhibition
   */
  @Delete(':id')
  @RequirePermissions('exhibitions.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete exhibition' })
  @ApiParam({ name: 'id', description: 'Exhibition ID' })
  @ApiResponse({ status: 204, description: 'Exhibition deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete exhibition with registrations' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.exhibitionsService.remove(id);
  }

  /**
   * Manually trigger exhibition status updates
   * 
   * This endpoint allows admins to manually trigger the status update process
   * without waiting for the daily cron job (2 AM).
   * 
   * Useful for:
   * - Testing the status update logic
   * - Immediate updates after date changes
   * - Fixing incorrect statuses without waiting for cron
   * 
   * Protected: Requires authentication (admin only)
   */
  @Post('update-statuses')
  @RequirePermissions('exhibitions.update', 'exhibitions.publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Manually update all exhibition statuses',
    description: 'Triggers an immediate update of exhibition statuses based on current date/time. Normally runs automatically daily at 2 AM.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status update completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Status update completed successfully' },
        data: {
          type: 'object',
          properties: {
            updatedCount: { type: 'number', example: 3 },
            updates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  from: { type: 'string' },
                  to: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Status update failed' })
  async updateStatuses(): Promise<{
    success: boolean;
    updatedCount: number;
    updates: Array<{ id: string; name: string; from: string; to: string }>;
    message: string;
  }> {
    const result = await this.exhibitionsService.manualUpdateStatuses();
    
    return {
      ...result,
      message: result.updatedCount > 0 
        ? `Successfully updated ${result.updatedCount} exhibition(s)`
        : 'All exhibition statuses are already up to date'
    };
  }
}

