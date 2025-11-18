import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ExhibitionStatus } from '../../../database/schemas/exhibition.schema';

export class QueryExhibitionDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by name, tagline, or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ExhibitionStatus, isArray: true })
  @IsOptional()
  @IsEnum(ExhibitionStatus, { each: true })
  @Type(() => String)
  status?: ExhibitionStatus[];

  @ApiPropertyOptional({ description: 'Filter by paid/free', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Filter exhibitions starting from this date' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter exhibitions ending before this date' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

