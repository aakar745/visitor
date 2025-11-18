import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIALLY_COMPLETED = 'partially_completed',
}

export enum DuplicateStrategy {
  SKIP = 'skip',
  UPDATE = 'update',
  CREATE_NEW = 'create_new',
}

@Schema({ timestamps: true })
export class ImportHistory extends Document {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  totalRows: number;

  @Prop({ default: 0 })
  processedRows: number;

  @Prop({ default: 0 })
  successRows: number;

  @Prop({ default: 0 })
  failedRows: number;

  @Prop({ default: 0 })
  skippedRows: number;

  @Prop({ default: 0 })
  updatedRows: number;

  @Prop({ type: String, enum: ImportStatus, default: ImportStatus.PENDING })
  status: ImportStatus;

  @Prop({
    type: String,
    enum: DuplicateStrategy,
    default: DuplicateStrategy.SKIP,
  })
  duplicateStrategy: DuplicateStrategy;

  @Prop({ type: [String], default: [] })
  errorMessages: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  importedBy: Types.ObjectId;

  @Prop()
  importedByName: string;

  @Prop()
  startedAt: Date;

  @Prop()
  completedAt: Date;

  @Prop({ type: Object })
  metadata: {
    fileSize?: number;
    mimeType?: string;
    headers?: string[];
    sampleData?: any[];
  };

  @Prop({ type: [Types.ObjectId], ref: 'GlobalVisitor', default: [] })
  importedVisitors: Types.ObjectId[];

  @Prop({ default: false })
  isRolledBack: boolean;

  @Prop()
  rolledBackAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  rolledBackBy: Types.ObjectId;
}

export const ImportHistorySchema =
  SchemaFactory.createForClass(ImportHistory);

// Indexes for better query performance
ImportHistorySchema.index({ status: 1, createdAt: -1 });
ImportHistorySchema.index({ importedBy: 1, createdAt: -1 });

