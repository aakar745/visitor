import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisitorImportsController } from './visitor-imports.controller';
import { VisitorImportsService } from './visitor-imports.service';
import { ImportService } from './import.service';
import {
  GlobalVisitor,
  GlobalVisitorSchema,
} from '../../database/schemas/global-visitor.schema';
import {
  ImportHistory,
  ImportHistorySchema,
} from '../../database/schemas/import-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlobalVisitor.name, schema: GlobalVisitorSchema },
      { name: ImportHistory.name, schema: ImportHistorySchema },
    ]),
  ],
  controllers: [VisitorImportsController],
  providers: [VisitorImportsService, ImportService],
  exports: [VisitorImportsService, ImportService],
})
export class VisitorImportsModule {}

