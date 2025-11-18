import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class QueryRoleDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    example: 10, 
    description: 'Items per page', 
    minimum: 1, 
    maximum: 100 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

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

