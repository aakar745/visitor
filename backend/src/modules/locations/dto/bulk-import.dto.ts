import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkLocationDto {
  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'IN' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'MH' })
  @IsString()
  @IsNotEmpty()
  stateCode: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @IsNotEmpty()
  pincode: string;

  @ApiProperty({ example: 'Nariman Point', required: false })
  @IsString()
  @IsOptional()
  area?: string;
}

export class BulkImportDto {
  @ApiProperty({ type: [BulkLocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkLocationDto)
  locations: BulkLocationDto[];
}

