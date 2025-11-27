import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BasePaginationDto } from '../../../common/dto/base-pagination.dto';

export class QueryExhibitorDto extends BasePaginationDto {
  // Pagination fields (page, limit) inherited from BasePaginationDto

  @ApiPropertyOptional({ description: 'Search by name or company name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by exhibition ID' })
  @IsOptional()
  @IsString()
  exhibitionId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

