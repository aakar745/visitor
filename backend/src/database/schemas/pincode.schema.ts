import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PincodeDocument = Pincode & Document;

@Schema({ timestamps: true, collection: 'pincodes' })
export class Pincode {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'City', required: true })
  cityId: Types.ObjectId;

  @ApiProperty({ example: '400001' })
  @Prop({ required: true, unique: true })
  pincode: string; // PIN code (6 digits for India)

  @ApiProperty({ example: 'Nariman Point' })
  @Prop({ trim: true })
  area?: string; // Optional locality/area name

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 234 })
  @Prop({ default: 0 })
  usageCount: number; // Track how many registrations use this PIN

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const PincodeSchema = SchemaFactory.createForClass(Pincode);

// Indexes for fast lookups
PincodeSchema.index({ pincode: 1 }, { unique: true });
PincodeSchema.index({ cityId: 1 });
PincodeSchema.index({ pincode: 1, isActive: 1 });
PincodeSchema.index({ usageCount: -1 }); // For popular PINs sorting

// Transform _id to id for frontend compatibility
PincodeSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    // Keep cityId as object if populated, otherwise convert to string
    if (ret.cityId && typeof ret.cityId === 'object' && ret.cityId._id) {
      // Already populated, keep as is
    } else if (ret.cityId) {
      // Not populated, convert ObjectId to string
      ret.cityId = ret.cityId.toString();
    }
    delete ret.__v;
    return ret;
  },
});

