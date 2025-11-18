import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ExhibitorDocument = Exhibitor & Document;

@Schema({ timestamps: true, collection: 'exhibitors' })
export class Exhibitor {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Exhibition', required: true, index: true })
  exhibitionId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true })
  companyName: string;

  @ApiProperty()
  @Prop({ required: true, index: true })
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

// Create compound index for exhibition + slug uniqueness
ExhibitorSchema.index({ exhibitionId: 1, slug: 1 }, { unique: true });

