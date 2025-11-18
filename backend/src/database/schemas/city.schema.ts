import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CityDocument = City & Document;

@Schema({ timestamps: true, collection: 'cities' })
export class City {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'State', required: true, index: true })
  stateId: Types.ObjectId;

  @ApiProperty({ example: 'Mumbai' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: true })
  @Prop({ default: true, index: true })
  isActive: boolean;

  @ApiProperty({ example: 85 })
  @Prop({ default: 0 })
  pincodeCount: number; // Cached count of PIN codes

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const CitySchema = SchemaFactory.createForClass(City);

// Compound unique index: One state can't have duplicate city names
CitySchema.index({ stateId: 1, name: 1 }, { unique: true });
CitySchema.index({ stateId: 1, isActive: 1 });
CitySchema.index({ name: 'text' }); // Text search on city names

// Transform _id to id for frontend compatibility
CitySchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    // Keep stateId as object if populated, otherwise convert to string
    if (ret.stateId && typeof ret.stateId === 'object' && ret.stateId._id) {
      // Already populated, keep as is
    } else if (ret.stateId) {
      // Not populated, convert ObjectId to string
      ret.stateId = ret.stateId.toString();
    }
    delete ret.__v;
    return ret;
  },
});

