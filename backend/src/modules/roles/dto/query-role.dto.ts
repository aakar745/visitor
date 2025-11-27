import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BasePaginationDto } from '../../../common/dto/base-pagination.dto';

export class QueryRoleDto extends BasePaginationDto {
  // Pagination fields (page, limit) inherited from BasePaginationDto

  @ApiPropertyOptional({ example: 'admin', description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'false', description: 'Filter by system role' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isSystemRole?: boolean;
}

