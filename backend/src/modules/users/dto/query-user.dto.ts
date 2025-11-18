import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserStatus } from '../../../database/schemas/user.schema';

export class QueryUserDto {
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

  @ApiPropertyOptional({ example: 'john', description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Filter by role ID' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ 
    example: 'active', 
    enum: UserStatus, 
    description: 'Filter by status' 
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

