import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateRegistrationDto {
  // Visitor Information (All optional for dynamic forms - validation happens in customFieldData)
  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name?: string;

  // Legacy fields - now optional (should be in customFieldData for dynamic forms)
  @ApiProperty({ example: '+91 9876543210', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/, {
    message: 'Please enter a valid phone number',
  })
  phone?: string;

  @ApiProperty({ example: 'ABC Company Ltd.', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  company?: string;

  @ApiProperty({ example: 'Software Engineer', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  designation?: string;

  @ApiProperty({ example: 'Maharashtra', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 'Mumbai', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: '400001', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{6}$/, { message: 'Please enter a valid 6-digit pincode' })
  pincode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  // Exhibition Registration Details
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  exhibitionId: string;

  @ApiProperty({ example: 'general' })
  @IsString()
  @IsNotEmpty()
  registrationCategory: string;

  @ApiProperty({ example: ['tech', 'business'], required: false })
  @IsArray()
  @IsOptional()
  selectedInterests?: string[];

  @ApiProperty({ example: {}, required: false })
  @IsObject()
  @IsOptional()
  customFieldData?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  pricingTierId?: string;

  @ApiProperty({ required: false, example: [1, 2, 3], description: 'Selected day numbers for day-wise tickets' })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  selectedDays?: number[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  exhibitorId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referralCode?: string;
}

