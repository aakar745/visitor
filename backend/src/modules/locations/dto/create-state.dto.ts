import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsMongoId, MinLength, MaxLength } from 'class-validator';

export class CreateStateDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Country ID' })
  @IsMongoId()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ example: 'Maharashtra', description: 'State name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'MH', description: 'State code (2-3 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(3)
  code: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

