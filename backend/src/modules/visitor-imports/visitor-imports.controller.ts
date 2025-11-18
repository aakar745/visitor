import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { VisitorImportsService } from './visitor-imports.service';
import { ImportService, ImportProgress } from './import.service';
import { ImportVisitorsDto } from './dto/import-visitors.dto';
import { DuplicateStrategy } from '../../database/schemas/import-history.schema';

@ApiTags('Visitor Imports')
@ApiBearerAuth()
@Controller('visitor-imports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitorImportsController {
  constructor(
    private readonly visitorImportsService: VisitorImportsService,
    private readonly importService: ImportService,
  ) {}

  @Post('upload')
  @SkipCsrf()
  @Roles('admin', 'super_admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import visitors from CSV or Excel file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV or Excel file (.csv, .xlsx, .xls) with visitor data',
        },
        duplicateStrategy: {
          type: 'string',
          enum: ['skip', 'update', 'create_new'],
          default: 'skip',
          description: 'Strategy for handling duplicate phone numbers',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import initiated successfully',
    schema: {
      example: {
        success: true,
        message: 'Import initiated successfully',
        data: {
          importId: '507f1f77bcf86cd799439011',
          totalRows: 1250,
          status: 'pending',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  async importVisitors(
    @UploadedFile() file: Express.Multer.File,
    @Body('duplicateStrategy') duplicateStrategy: DuplicateStrategy,
    @Body() body: any, // Debug: capture full body
    @CurrentUser() user: any,
  ) {
    // Debug logging
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('File received:', file ? 'YES' : 'NO');
    console.log('File details:', file);
    console.log('Body:', body);
    console.log('Duplicate strategy:', duplicateStrategy);
    console.log('========================');

    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const fileName = file.originalname.toLowerCase();
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      throw new BadRequestException('Only CSV and Excel files (.csv, .xlsx, .xls) are allowed');
    }

    const result = await this.importService.parseAndInitiateImport(
      file,
      user.userId,
      user.name || user.email,
      duplicateStrategy || DuplicateStrategy.SKIP,
    );

    return {
      success: true,
      message: 'Import initiated successfully',
      data: {
        importId: result.importId,
        totalRows: result.totalRows,
        status: 'pending',
      },
    };
  }

  @Get('progress/:importId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get import progress' })
  @ApiResponse({
    status: 200,
    description: 'Import progress retrieved',
    schema: {
      example: {
        success: true,
        data: {
          importId: '507f1f77bcf86cd799439011',
          status: 'processing',
          totalRows: 1250,
          processedRows: 750,
          successRows: 700,
          failedRows: 30,
          skippedRows: 20,
          updatedRows: 0,
          percentage: 60,
          errorMessages: ['Row 15: Invalid phone number', 'Row 42: Missing name'],
        },
      },
    },
  })
  async getImportProgress(@Param('importId') importId: string): Promise<{
    success: boolean;
    data: ImportProgress;
  }> {
    const progress = await this.importService.getImportProgress(importId);
    return {
      success: true,
      data: progress,
    };
  }

  @Get('history/me')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get my import history' })
  @ApiResponse({ status: 200, description: 'Import history retrieved' })
  async getMyImportHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    const history = await this.importService.getImportHistory(
      user.userId,
      limit || 20,
    );
    return {
      success: true,
      data: history,
    };
  }

  @Get('history/all')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get all import history (super admin only)' })
  @ApiResponse({ status: 200, description: 'All import history retrieved' })
  async getAllImportHistory(@Query('limit') limit?: number) {
    const history = await this.importService.getAllImportHistory(limit || 50);
    return {
      success: true,
      data: history,
    };
  }

  @Delete('rollback/:importId')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Rollback an import (super admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Import rolled back successfully',
    schema: {
      example: {
        success: true,
        message: 'Import rolled back successfully',
        data: {
          deletedCount: 1250,
        },
      },
    },
  })
  async rollbackImport(
    @Param('importId') importId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.importService.rollbackImport(
      importId,
      user.userId,
      user.name || user.email,
    );

    return {
      success: true,
      message: 'Import rolled back successfully',
      data: result,
    };
  }

  @Get('template/download')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Download CSV template (can be opened in Excel)' })
  @ApiResponse({
    status: 200,
    description: 'CSV template that can be opened and edited in Excel',
    content: { 'text/csv': {} },
  })
  async downloadTemplate(@Res() res: Response) {
    const template = this.visitorImportsService.generateCsvTemplate();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="visitor-import-template.csv"');
    res.send(template);
  }

  @Get('stats')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get visitor import statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats() {
    const stats = await this.visitorImportsService.getImportStats();
    return {
      success: true,
      data: stats,
    };
  }
}

