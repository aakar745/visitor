import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ExhibitionStatus } from '../../../database/schemas/exhibition.schema';

export class UpdateStatusDto {
  @ApiProperty({ description: 'New exhibition status', enum: ExhibitionStatus, example: 'active' })
  @IsNotEmpty()
  @IsEnum(ExhibitionStatus)
  status: ExhibitionStatus;
}

