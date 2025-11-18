import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateExhibitorDto {
  @ApiProperty({ description: 'Exhibition ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  exhibitionId: string;

  @ApiProperty({ description: 'Exhibitor name', example: 'XYZ Technologies' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Company name', example: 'XYZ Technologies Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @ApiPropertyOptional({ description: 'URL slug (auto-generated if not provided)', example: 'xyz-technologies' })
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

  @ApiPropertyOptional({ description: 'Booth/Stall number', example: 'A-101' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  boothNumber?: string;

  @ApiPropertyOptional({ description: 'Is exhibitor active', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

