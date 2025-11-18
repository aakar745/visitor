import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsMongoId, MinLength, MaxLength } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'State ID' })
  @IsMongoId()
  @IsNotEmpty()
  stateId: string;

  @ApiProperty({ example: 'Mumbai', description: 'City name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

