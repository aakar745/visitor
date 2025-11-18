import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DuplicateStrategy } from '../../../database/schemas/import-history.schema';

export class ImportVisitorsDto {
  @ApiProperty({
    description: 'Strategy for handling duplicate phone numbers',
    enum: DuplicateStrategy,
    default: DuplicateStrategy.SKIP,
  })
  @IsEnum(DuplicateStrategy)
  @IsOptional()
  duplicateStrategy?: DuplicateStrategy = DuplicateStrategy.SKIP;
}

export class ImportStatusDto {
  @ApiProperty({ description: 'Import job ID' })
  @IsString()
  importId: string;
}

