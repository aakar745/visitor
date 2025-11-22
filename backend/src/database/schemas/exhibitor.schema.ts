import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ExhibitorDocument = Exhibitor & Document;

@Schema({ timestamps: true, collection: 'exhibitors' })
export class Exhibitor {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Exhibition', required: true })
  exhibitionId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true })
  companyName: string;

  @ApiProperty()
  @Prop({ required: true })
  slug: string;

  @ApiProperty()
  @Prop()
  logo?: string;

  @ApiProperty()
  @Prop()
  boothNumber?: string;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Prop({ default: 0 })
  totalRegistrations: number;

  @ApiProperty()
  @Prop({ type: Types.ObjectId })
  createdBy?: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId })
  updatedBy?: Types.ObjectId;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const ExhibitorSchema = SchemaFactory.createForClass(Exhibitor);

// Indexes
ExhibitorSchema.index({ exhibitionId: 1, slug: 1 }, { unique: true }); // Unique slug per exhibition

// ✅ NEW: Performance indexes for common queries
ExhibitorSchema.index({ exhibitionId: 1, isActive: 1 }); // For listing active exhibitors per exhibition
ExhibitorSchema.index({ exhibitionId: 1, totalRegistrations: -1 }); // For exhibitor leaderboard/stats
ExhibitorSchema.index({ name: 'text', companyName: 'text' }); // For search functionality

