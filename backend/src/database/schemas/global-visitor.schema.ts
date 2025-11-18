import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type GlobalVisitorDocument = GlobalVisitor & Document;

@Schema({ timestamps: true, collection: 'global_visitors' })
export class GlobalVisitor {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ lowercase: true, trim: true, sparse: true }) // sparse allows multiple null values
  email?: string;

  @ApiProperty()
  @Prop({ trim: true })
  name?: string;

  @ApiProperty()
  @Prop({ trim: true })
  phone?: string;

  @ApiProperty()
  @Prop({ trim: true })
  company?: string;

  @ApiProperty()
  @Prop({ trim: true })
  designation?: string;

  // ========== Location Fields (Linked) ==========
  // New: References to location tables (preferred for structured data)
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Country' })
  countryId?: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'State' })
  stateId?: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'City' })
  cityId?: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Pincode' })
  pincodeId?: Types.ObjectId;

  // ========== Location Fields (Legacy/Manual) ==========
  // Keep for backward compatibility and manual entry (villages, etc.)
  @ApiProperty()
  @Prop({ trim: true })
  state?: string;

  @ApiProperty()
  @Prop({ trim: true })
  city?: string;

  @ApiProperty()
  @Prop({ trim: true })
  pincode?: string;

  @ApiProperty()
  @Prop({ trim: true })
  address?: string;

  @ApiProperty()
  @Prop({ default: 0 })
  totalRegistrations: number;

  @ApiProperty()
  @Prop()
  lastRegistrationDate?: Date;

  @ApiProperty()
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Exhibition' }], default: [] })
  registeredExhibitions: Types.ObjectId[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const GlobalVisitorSchema = SchemaFactory.createForClass(GlobalVisitor);

// Enable strict: false to allow dynamic fields (like "hobby", "blood_group", etc.)
// These are global fields that can be added via dynamic forms
GlobalVisitorSchema.set('strict', false);

// Indexes for dynamic form fields
// Phone is PRIMARY identifier - must be unique (sparse allows null for legacy data)
GlobalVisitorSchema.index({ phone: 1 }, { unique: true, sparse: true }); // PRIMARY unique identifier
GlobalVisitorSchema.index({ email: 1 }, { sparse: true }); // Email is optional, not unique
GlobalVisitorSchema.index({ name: 'text', company: 'text' });
GlobalVisitorSchema.index({ state: 1, city: 1 }); // Legacy string-based location
GlobalVisitorSchema.index({ countryId: 1, stateId: 1, cityId: 1 }); // New linked location
GlobalVisitorSchema.index({ pincodeId: 1 });
GlobalVisitorSchema.index({ totalRegistrations: -1 });
GlobalVisitorSchema.index({ createdAt: -1 });

