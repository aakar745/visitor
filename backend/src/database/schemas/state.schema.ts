import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type StateDocument = State & Document;

@Schema({ timestamps: true, collection: 'states' })
export class State {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'Country', required: true, index: true })
  countryId: Types.ObjectId;

  @ApiProperty({ example: 'Maharashtra' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'MH' })
  @Prop({ required: true, uppercase: true, trim: true })
  code: string; // State code (e.g., MH, DL, KA)

  @ApiProperty({ example: true })
  @Prop({ default: true, index: true })
  isActive: boolean;

  @ApiProperty({ example: 45 })
  @Prop({ default: 0 })
  cityCount: number; // Cached count of cities

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const StateSchema = SchemaFactory.createForClass(State);

// Compound unique index: One country can't have duplicate state names
StateSchema.index({ countryId: 1, name: 1 }, { unique: true });
StateSchema.index({ code: 1 }, { unique: true }); // State codes are globally unique
StateSchema.index({ countryId: 1, isActive: 1 });

// Transform _id to id for frontend compatibility
StateSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    // Keep countryId as object if populated, otherwise convert to string
    if (ret.countryId && typeof ret.countryId === 'object' && ret.countryId._id) {
      // Already populated, keep as is
    } else if (ret.countryId) {
      // Not populated, convert ObjectId to string
      ret.countryId = ret.countryId.toString();
    }
    delete ret.__v;
    return ret;
  },
});

