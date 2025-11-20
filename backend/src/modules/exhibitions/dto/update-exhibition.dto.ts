import { PartialType, OmitType, IntersectionType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { CreateExhibitionDto } from './create-exhibition.dto';

// Create a base update DTO without the media fields
class BaseUpdateDto extends PartialType(
  OmitType(CreateExhibitionDto, ['exhibitionLogo', 'badgeLogo', 'bannerImage'] as const)
) {}

// Define media fields that allow null (for removal)
class MediaFieldsDto {
  @ApiPropertyOptional({ 
    description: 'Exhibition logo URL (set to null to remove)', 
    nullable: true 
  })
  @IsOptional()
  @ValidateIf((o) => o.exhibitionLogo !== null)
  @IsString()
  exhibitionLogo?: string | null;

  @ApiPropertyOptional({ 
    description: 'Badge logo URL (set to null to remove)', 
    nullable: true 
  })
  @IsOptional()
  @ValidateIf((o) => o.badgeLogo !== null)
  @IsString()
  badgeLogo?: string | null;

  @ApiPropertyOptional({ 
    description: 'Banner image URL (set to null to remove)', 
    nullable: true 
  })
  @IsOptional()
  @ValidateIf((o) => o.bannerImage !== null)
  @IsString()
  bannerImage?: string | null;
}

// Combine both DTOs
export class UpdateExhibitionDto extends IntersectionType(BaseUpdateDto, MediaFieldsDto) {}

