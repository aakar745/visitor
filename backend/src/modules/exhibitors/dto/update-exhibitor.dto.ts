import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateExhibitorDto {
  @ApiPropertyOptional({ description: 'Exhibitor name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  companyName?: string;

  @ApiPropertyOptional({ description: 'URL slug' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  @MinLength(2)
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'Company logo URL' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: 'Booth/Stall number' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  boothNumber?: string;

  @ApiPropertyOptional({ description: 'Is exhibitor active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

