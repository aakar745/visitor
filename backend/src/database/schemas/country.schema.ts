import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CountryDocument = Country & Document;

@Schema({ timestamps: true, collection: 'countries' })
export class Country {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty({ example: 'India' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'IN' })
  @Prop({ required: true, uppercase: true })
  code: string; // ISO 3166-1 alpha-2 code

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 36 })
  @Prop({ default: 0 })
  stateCount: number; // Cached count of states

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  usageCount: number; // Track how many visitors use this country

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const CountrySchema = SchemaFactory.createForClass(Country);

// Indexes for fast lookups
CountrySchema.index({ name: 1 });
CountrySchema.index({ code: 1 }, { unique: true });
CountrySchema.index({ isActive: 1 });

// Transform _id to id for frontend compatibility
CountrySchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

