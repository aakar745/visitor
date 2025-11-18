import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'India', description: 'Country name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'IN', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, { message: 'Country code must be exactly 2 uppercase letters' })
  code: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

