import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsMongoId, Matches, MaxLength } from 'class-validator';

export class CreatePincodeDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'City ID' })
  @IsMongoId()
  @IsNotEmpty()
  cityId: string;

  @ApiProperty({ example: '400001', description: 'PIN code (6 digits for India)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'PIN code must be exactly 6 digits' })
  pincode: string;

  @ApiProperty({ example: 'Nariman Point', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  area?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

