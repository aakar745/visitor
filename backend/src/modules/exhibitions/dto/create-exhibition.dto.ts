import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDate,
  MinLength,
  MaxLength,
  ValidateNested,
  IsEnum,
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrationCategory } from '../../../database/schemas/exhibition.schema';

// Day Price Option DTO
export class DayPriceOptionDto {
  @ApiPropertyOptional({ description: 'Subdocument ID (for updates)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiPropertyOptional({ description: 'Subdocument ID as string (for updates)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Day number (1, 2, 3, etc.)', example: 1 })
  @IsNumber()
  @Min(1)
  dayNumber: number;

  @ApiProperty({ description: 'Day name', example: 'Day 1 - Opening' })
  @IsString()
  @IsNotEmpty()
  dayName: string;

  @ApiProperty({ description: 'Date of the day', example: '2024-12-12' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Price for this specific day', example: 500 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Description of what this day includes' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Whether this day option is active', example: true })
  @IsBoolean()
  isActive: boolean;
}

// Pricing Tier DTO
export class PricingTierDto {
  @ApiPropertyOptional({ description: 'Subdocument ID (for updates)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiPropertyOptional({ description: 'Subdocument ID as string (for updates)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Tier name', example: 'Early Bird' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Tier description', example: 'Limited time offer' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Price amount', example: 1000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Currency code', example: 'INR', default: 'INR' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Tier start date', example: '2024-10-01T00:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: 'Tier end date', example: '2024-11-30T23:59:59Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiProperty({ description: 'Whether this tier is active', example: true, default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Ticket type: full_access or day_wise', example: 'full_access', enum: ['full_access', 'day_wise'] })
  @IsString()
  @IsEnum(['full_access', 'day_wise'])
  ticketType: 'full_access' | 'day_wise';

  @ApiPropertyOptional({ description: 'Day-wise pricing options (only for day_wise ticketType)', type: [DayPriceOptionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DayPriceOptionDto)
  dayPrices?: DayPriceOptionDto[];

  @ApiPropertyOptional({ description: 'Price for all sessions combined (optional)', example: 1500 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  allSessionsPrice?: number;
}

// Interest Option DTO
export class InterestOptionDto {
  @ApiPropertyOptional({ description: 'Subdocument ID (for updates)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiPropertyOptional({ description: 'Subdocument ID as string (for updates)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Option name', example: 'Technology Solutions' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Interest category', example: 'technology' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Whether this option is active', example: true, default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Display order', example: 1, default: 0 })
  @IsNumber()
  @Min(0)
  order: number;
}

// Custom Field DTO
export class CustomFieldDto {
  @ApiPropertyOptional({ description: 'Subdocument ID (for updates)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiPropertyOptional({ description: 'Subdocument ID as string (for updates)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Field name (identifier)', example: 'company' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Field label (display text)', example: 'Company Name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  label: string;

  @ApiProperty({ description: 'Field type', example: 'text', enum: ['text', 'email', 'phone', 'select', 'textarea', 'checkbox', 'radio', 'api_select'] })
  @IsString()
  @IsEnum(['text', 'email', 'phone', 'select', 'textarea', 'checkbox', 'radio', 'api_select'])
  type: string;

  @ApiProperty({ description: 'Whether field is required', example: true, default: false })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ description: 'Options for select/radio/checkbox fields', type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Placeholder text' })
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };

  @ApiProperty({ description: 'Display order', example: 1, default: 0 })
  @IsNumber()
  @Min(0)
  order: number;

  @ApiPropertyOptional({ description: 'API configuration for dynamic dropdowns' })
  @IsOptional()
  apiConfig?: {
    endpoint: string;
    valueField: string;
    labelField: string;
    dependsOn?: string;
    searchable?: boolean;
    cacheKey?: string;
  };

  @ApiPropertyOptional({ description: 'Display mode: input or select', enum: ['input', 'select'] })
  @IsString()
  @IsOptional()
  @IsEnum(['input', 'select'])
  displayMode?: string;
}

// Main Create Exhibition DTO
export class CreateExhibitionDto {
  @ApiProperty({ description: 'Exhibition name', example: 'Tech Expo 2024' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Exhibition tagline', example: 'Innovation Awaits You' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  tagline: string;

  @ApiPropertyOptional({ description: 'Detailed description of the exhibition' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ description: 'Venue location', example: 'Bangalore International Exhibition Centre' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  venue: string;

  @ApiProperty({ description: 'Registration start date', example: '2024-10-01T00:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  registrationStartDate: Date;

  @ApiProperty({ description: 'Registration end date', example: '2024-12-10T23:59:59Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  registrationEndDate: Date;

  @ApiProperty({ description: 'Exhibition onsite start date', example: '2024-12-12T09:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  onsiteStartDate: Date;

  @ApiProperty({ description: 'Exhibition onsite end date', example: '2024-12-14T18:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  onsiteEndDate: Date;

  @ApiProperty({ description: 'Whether the exhibition is paid', example: false, default: false })
  @IsBoolean()
  isPaid: boolean;

  @ApiPropertyOptional({ description: 'Paid period start date (if isPaid is true)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidStartDate?: Date;

  @ApiPropertyOptional({ description: 'Paid period end date (if isPaid is true)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidEndDate?: Date;

  @ApiProperty({ description: 'Pricing tiers for paid exhibitions', type: [PricingTierDto], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers: PricingTierDto[];

  @ApiProperty({ description: 'Allowed registration categories', enum: RegistrationCategory, isArray: true, default: ['general'] })
  @IsArray()
  @IsEnum(RegistrationCategory, { each: true })
  allowedCategories: RegistrationCategory[];

  @ApiProperty({ description: 'Custom registration form fields', type: [CustomFieldDto], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  customFields: CustomFieldDto[];

  @ApiProperty({ description: 'Interest options for visitors', type: [InterestOptionDto], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestOptionDto)
  interestOptions: InterestOptionDto[];

  @ApiProperty({ description: 'Whether guests are allowed', example: false, default: false })
  @IsBoolean()
  allowGuests: boolean;

  @ApiProperty({ description: 'Whether registrations require approval', example: false, default: false })
  @IsBoolean()
  requiresApproval: boolean;

  @ApiPropertyOptional({ description: 'Exhibition logo URL' })
  @IsString()
  @IsOptional()
  exhibitionLogo?: string;

  @ApiPropertyOptional({ description: 'Badge logo URL' })
  @IsString()
  @IsOptional()
  badgeLogo?: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  @IsString()
  @IsOptional()
  bannerImage?: string;

  @ApiPropertyOptional({ description: 'Badge overlay configuration' })
  @IsOptional()
  badgeConfig?: Record<string, any>;
}

