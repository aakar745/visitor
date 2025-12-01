import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { VisitorsService, QueryVisitorDto, CreateVisitorDto, UpdateVisitorDto } from './visitors.service';
import { GlobalVisitor } from '../../database/schemas/global-visitor.schema';
import { ExhibitionRegistration } from '../../database/schemas/exhibition-registration.schema';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Visitors')
@ApiBearerAuth()
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  /**
   * Fast visitor search with MeiliSearch autocomplete
   * Searches by name, phone, email, company
   */
  @Get('search/autocomplete')
  @RequirePermissions('visitors.search')
  @ApiOperation({ summary: 'Fast visitor search with MeiliSearch autocomplete' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchAutocomplete(
    @Query('q') query: string,
    @Query('exhibitionId') exhibitionId?: string,
    @Query('limit') limit?: number,
  ) {
    if (!query || query.length < 2) {
      // ✅ Return MeiliSearch-compatible structure (interceptor will wrap it)
      return {
        hits: [],
        estimatedTotalHits: 0,
        processingTimeMs: 0,
      };
    }

    // ✅ Return results directly - let TransformInterceptor handle wrapping
    return await this.visitorsService.searchAutocomplete(
      query,
      exhibitionId,
      limit ? parseInt(limit.toString()) : 20,
    );
  }

  /**
   * Get all visitors with pagination and filters
   */
  @Get()
  @RequirePermissions('visitors.view')
  @ApiOperation({ summary: 'Get all visitors with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Visitors retrieved successfully' })
  async findAll(
    @Query() query: QueryVisitorDto,
  ): Promise<{
    data: GlobalVisitor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    message: string;
  }> {
    const result = await this.visitorsService.findAll(query);
    
    return {
      data: result.data,
      pagination: result.pagination,
      message: 'Visitors retrieved successfully',
    };
  }

  /**
   * Get visitor statistics
   */
  @Get('statistics')
  @RequirePermissions('visitors.view')
  @ApiOperation({ summary: 'Get visitor statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(): Promise<{
    data: {
      total: number;
      byState: Record<string, number>;
      byCity: Record<string, number>;
      totalRegistrations: number;
      averageRegistrationsPerVisitor: number;
    };
    message: string;
  }> {
    const stats = await this.visitorsService.getStatistics();
    
    return {
      data: stats,
      message: 'Statistics retrieved successfully',
    };
  }

  /**
   * Export all global visitors to CSV or Excel
   * Supports streaming for large datasets (100k+ records)
   * ⚠️ IMPORTANT: Must be defined BEFORE /:id route
   */
  @Get('export')
  @RequirePermissions('visitors.export')
  @ApiOperation({ 
    summary: 'Export all global visitors to CSV/Excel',
    description: 'Streams visitor data with dynamic field discovery. Handles large datasets efficiently.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'File download stream',
    content: {
      'text/csv': {},
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {}
    }
  })
  async exportGlobalVisitors(
    @Res() res: Response,
    @Query('format') format?: 'csv' | 'excel',
    @Query('search') search?: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('minRegistrations') minRegistrations?: number,
  ): Promise<void> {
    return await this.visitorsService.exportGlobalVisitors(res, {
      format: (format as 'csv' | 'excel') || 'csv',
      search,
      state,
      city,
      minRegistrations: minRegistrations ? parseInt(minRegistrations.toString()) : undefined,
    });
  }

  /**
   * Get single visitor by ID
   */
  @Get(':id')
  @RequirePermissions('visitors.view')
  @ApiOperation({ summary: 'Get visitor by ID' })
  @ApiParam({ name: 'id', description: 'Visitor ID' })
  @ApiResponse({ status: 200, description: 'Visitor retrieved successfully', type: GlobalVisitor })
  @ApiResponse({ status: 404, description: 'Visitor not found' })
  async findOne(@Param('id') id: string): Promise<GlobalVisitor> {
    return await this.visitorsService.findOne(id);
  }

  /**
   * Get visitor's registrations
   */
  @Get(':id/registrations')
  @RequirePermissions('visitors.view')
  @ApiOperation({ summary: 'Get visitor registrations' })
  @ApiParam({ name: 'id', description: 'Visitor ID' })
  @ApiResponse({ status: 200, description: 'Registrations retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Visitor not found' })
  async getRegistrations(@Param('id') id: string): Promise<{
    data: ExhibitionRegistration[];
    message: string;
  }> {
    const registrations = await this.visitorsService.getVisitorRegistrations(id);
    
    return {
      data: registrations,
      message: 'Registrations retrieved successfully',
    };
  }

  /**
   * Create a new visitor
   */
  @Post()
  @ApiOperation({ summary: 'Create a new visitor' })
  @ApiResponse({ status: 201, description: 'Visitor created successfully', type: GlobalVisitor })
  @ApiResponse({ status: 400, description: 'Invalid input data or visitor already exists' })
  async create(@Body() createVisitorDto: CreateVisitorDto): Promise<GlobalVisitor> {
    return await this.visitorsService.create(createVisitorDto);
  }

  /**
   * Update visitor
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update visitor' })
  @ApiParam({ name: 'id', description: 'Visitor ID' })
  @ApiResponse({ status: 200, description: 'Visitor updated successfully', type: GlobalVisitor })
  @ApiResponse({ status: 404, description: 'Visitor not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('id') id: string,
    @Body() updateVisitorDto: UpdateVisitorDto,
  ): Promise<GlobalVisitor> {
    return await this.visitorsService.update(id, updateVisitorDto);
  }

  /**
   * Delete visitor (CASCADE: also deletes all registrations)
   */
  @Delete(':id')
  @RequirePermissions('visitors.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete visitor with cascade deletion',
    description: 'Deletes a visitor and all their associated exhibition registrations'
  })
  @ApiParam({ name: 'id', description: 'Visitor ID' })
  @ApiResponse({ status: 204, description: 'Visitor and registrations deleted successfully' })
  @ApiResponse({ status: 404, description: 'Visitor not found' })
  @ApiResponse({ status: 400, description: 'Invalid visitor ID' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.visitorsService.remove(id);
  }

  /**
   * Bulk delete visitors (CASCADE: also deletes all registrations)
   */
  @Post('bulk-delete')
  @RequirePermissions('visitors.bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Bulk delete visitors with cascade deletion',
    description: 'Deletes multiple visitors and all their associated exhibition registrations'
  })
  @ApiResponse({ status: 200, description: 'Visitors deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async bulkDelete(@Body() body: { ids: string[] }): Promise<{
    message: string;
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    return await this.visitorsService.bulkDelete(body.ids);
  }
}

