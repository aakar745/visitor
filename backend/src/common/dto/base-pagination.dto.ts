import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Base Pagination DTO
 * 
 * Provides standard pagination fields that can be extended by query DTOs.
 * Validates page and limit parameters with sensible defaults.
 * 
 * DEFAULT CONFIGURATION:
 * - Page: minimum 1, default 1
 * - Limit: minimum 1, maximum 100, default 10
 * 
 * EXTENDING WITH CUSTOM LIMITS:
 * If a child class needs different limits (e.g., exhibitions with max 500),
 * override the limit property with custom decorators.
 * 
 * @example
 * ```typescript
 * // Standard usage (max 100)
 * export class QueryUserDto extends BasePaginationDto {
 *   // ... other fields
 * }
 * 
 * // Custom max limit (e.g., 500 for exhibitions)
 * export class QueryExhibitionDto extends BasePaginationDto {
 *   @ApiPropertyOptional({ maximum: 500 })
 *   @Max(500)  // Override the @Max(100) from parent
 *   limit?: number = 10;
 *   
 *   // ... other fields
 * }
 * ```
 */
export class BasePaginationDto {
  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Page number', 
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    example: 10, 
    description: 'Items per page', 
    minimum: 1, 
    maximum: 100,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Default max - can be overridden in child classes
  limit?: number = 10;
}

