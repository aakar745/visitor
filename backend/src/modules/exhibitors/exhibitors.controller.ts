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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ExhibitorsService } from './exhibitors.service';
import { CreateExhibitorDto, UpdateExhibitorDto, QueryExhibitorDto } from './dto';
import { Exhibitor } from '../../database/schemas/exhibitor.schema';

@ApiTags('Exhibitors')
@ApiBearerAuth()
@Controller('exhibitors')
export class ExhibitorsController {
  constructor(private readonly exhibitorsService: ExhibitorsService) {}

  /**
   * Create a new exhibitor
   */
  @Post()
  @ApiOperation({ summary: 'Create a new exhibitor' })
  @ApiResponse({ status: 201, description: 'Exhibitor created successfully', type: Exhibitor })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createExhibitorDto: CreateExhibitorDto,
    @Req() request: Request,
  ): Promise<Exhibitor> {
    const userId = (request.user as any)?._id || (request.user as any)?.id;
    return await this.exhibitorsService.create(createExhibitorDto, userId);
  }

  /**
   * Get all exhibitors with pagination and filters
   */
  @Get()
  @ApiOperation({ summary: 'Get all exhibitors with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Exhibitors retrieved successfully' })
  async findAll(@Query() query: QueryExhibitorDto): Promise<{
    exhibitors: Exhibitor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    message: string;
  }> {
    const result = await this.exhibitorsService.findAll(query);
    return {
      exhibitors: result.exhibitors,
      pagination: result.pagination,
      message: 'Exhibitors retrieved successfully',
    };
  }

  /**
   * Get single exhibitor by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get exhibitor by ID' })
  @ApiParam({ name: 'id', description: 'Exhibitor ID' })
  @ApiResponse({ status: 200, description: 'Exhibitor retrieved successfully', type: Exhibitor })
  @ApiResponse({ status: 404, description: 'Exhibitor not found' })
  async findOne(@Param('id') id: string): Promise<Exhibitor> {
    return await this.exhibitorsService.findOne(id);
  }

  /**
   * Get exhibitor statistics
   */
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get exhibitor statistics' })
  @ApiParam({ name: 'id', description: 'Exhibitor ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Exhibitor not found' })
  async getStats(@Param('id') id: string): Promise<any> {
    return await this.exhibitorsService.getStats(id);
  }

  /**
   * Check slug availability
   */
  @Get('check-slug')
  @ApiOperation({ summary: 'Check if slug is available' })
  @ApiResponse({ status: 200, description: 'Slug availability checked' })
  async checkSlugAvailability(
    @Query('exhibitionId') exhibitionId: string,
    @Query('slug') slug: string,
    @Query('excludeId') excludeId?: string,
  ): Promise<{ available: boolean }> {
    if (!exhibitionId || !slug) {
      throw new BadRequestException('Exhibition ID and slug are required');
    }

    const available = await this.exhibitorsService.checkSlugAvailability(
      exhibitionId,
      slug,
      excludeId,
    );

    return { available };
  }

  /**
   * Update exhibitor
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update exhibitor' })
  @ApiParam({ name: 'id', description: 'Exhibitor ID' })
  @ApiResponse({ status: 200, description: 'Exhibitor updated successfully', type: Exhibitor })
  @ApiResponse({ status: 404, description: 'Exhibitor not found' })
  async update(
    @Param('id') id: string,
    @Body() updateExhibitorDto: UpdateExhibitorDto,
    @Req() request: Request,
  ): Promise<Exhibitor> {
    const userId = (request.user as any)?._id || (request.user as any)?.id;
    return await this.exhibitorsService.update(id, updateExhibitorDto, userId);
  }

  /**
   * Toggle exhibitor status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle exhibitor status' })
  @ApiParam({ name: 'id', description: 'Exhibitor ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: Exhibitor })
  @ApiResponse({ status: 404, description: 'Exhibitor not found' })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Req() request: Request,
  ): Promise<Exhibitor> {
    const userId = (request.user as any)?._id || (request.user as any)?.id;
    return await this.exhibitorsService.toggleStatus(id, isActive, userId);
  }

  /**
   * Bulk toggle exhibitor status
   */
  @Post('bulk/toggle-status')
  @ApiOperation({ summary: 'Bulk toggle exhibitor status' })
  @ApiResponse({ status: 200, description: 'Statuses updated successfully' })
  async bulkToggleStatus(
    @Body('exhibitorIds') exhibitorIds: string[],
    @Body('isActive') isActive: boolean,
    @Req() request: Request,
  ): Promise<{ message: string }> {
    const userId = (request.user as any)?._id || (request.user as any)?.id;
    await this.exhibitorsService.bulkToggleStatus(exhibitorIds, isActive, userId);
    return { message: 'Exhibitor statuses updated successfully' };
  }

  /**
   * Bulk delete exhibitors
   */
  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete exhibitors' })
  @ApiResponse({ status: 200, description: 'Exhibitors deleted successfully' })
  @ApiResponse({ status: 400, description: 'Some exhibitors have registrations' })
  async bulkDelete(
    @Body('exhibitorIds') exhibitorIds: string[],
  ): Promise<{ message: string }> {
    await this.exhibitorsService.bulkDelete(exhibitorIds);
    return { message: 'Exhibitors deleted successfully' };
  }

  /**
   * Delete exhibitor
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete exhibitor' })
  @ApiParam({ name: 'id', description: 'Exhibitor ID' })
  @ApiResponse({ status: 204, description: 'Exhibitor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exhibitor not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete exhibitor with registrations' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.exhibitorsService.remove(id);
  }
}

