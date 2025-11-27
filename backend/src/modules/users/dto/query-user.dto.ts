import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../database/schemas/user.schema';
import { BasePaginationDto } from '../../../common/dto/base-pagination.dto';

export class QueryUserDto extends BasePaginationDto {
  // Pagination fields (page, limit) inherited from BasePaginationDto

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

