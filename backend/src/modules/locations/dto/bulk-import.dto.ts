import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkLocationDto {
  @ApiProperty({ example: 'India' })
  country: string;

  @ApiProperty({ example: 'IN' })
  countryCode: string;

  @ApiProperty({ example: 'Maharashtra' })
  state: string;

  @ApiProperty({ example: 'MH' })
  stateCode: string;

  @ApiProperty({ example: 'Mumbai' })
  city: string;

  @ApiProperty({ example: '400001' })
  pincode: string;

  @ApiProperty({ example: 'Nariman Point', required: false })
  area?: string;
}

export class BulkImportDto {
  @ApiProperty({ type: [BulkLocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkLocationDto)
  locations: BulkLocationDto[];
}

