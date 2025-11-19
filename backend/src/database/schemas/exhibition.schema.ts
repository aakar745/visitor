import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ExhibitionDocument = Exhibition & Document;

export enum ExhibitionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  REGISTRATION_OPEN = 'registration_open',
  LIVE_EVENT = 'live_event',
  COMPLETED = 'completed',
}

export enum RegistrationCategory {
  GENERAL = 'general',
  VIP = 'vip',
  MEDIA = 'media',
  EXHIBITOR = 'exhibitor',
  SPEAKER = 'speaker',
  GUEST = 'guest',
}

@Schema({ _id: true }) // Ensure MongoDB generates _id for subdocuments
export class DayPriceOption {
  _id: Types.ObjectId; // Explicitly add _id field
  
  @Prop({ required: true })
  dayNumber: number;

  @Prop({ required: true })
  dayName: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ _id: true }) // Ensure MongoDB generates _id for subdocuments
export class PricingTier {
  _id: Types.ObjectId; // Explicitly add _id field
  
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  currentCount: number;

  @Prop({ required: true, enum: ['full_access', 'day_wise'] })
  ticketType: string;

  @Prop({ type: [DayPriceOption] })
  dayPrices?: DayPriceOption[];

  @Prop()
  allSessionsPrice?: number;
}

@Schema({ _id: true }) // Ensure MongoDB generates _id for subdocuments
export class InterestOption {
  _id: Types.ObjectId; // Explicitly add _id field
  
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

@Schema({ _id: true }) // Ensure MongoDB generates _id for subdocuments
export class CustomField {
  _id: Types.ObjectId; // Explicitly add _id field
  
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: false })
  required: boolean;

  @Prop({ type: [String] })
  options?: string[];

  @Prop()
  placeholder?: string;

  @Prop({ type: Object })
  validation?: Record<string, any>;

  @Prop({ default: 0 })
  order: number;

  @Prop({ type: Object })
  apiConfig?: Record<string, any>;

  @Prop()
  displayMode?: string;
}

@Schema({ 
  timestamps: true, 
  collection: 'exhibitions'
})
export class Exhibition {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  tagline: string;

  @ApiProperty()
  @Prop({ trim: true })
  description?: string;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  venue: string;

  @ApiProperty()
  @Prop({ required: true })
  registrationStartDate: Date;

  @ApiProperty()
  @Prop({ required: true })
  registrationEndDate: Date;

  @ApiProperty()
  @Prop({ required: true })
  onsiteStartDate: Date;

  @ApiProperty()
  @Prop({ required: true })
  onsiteEndDate: Date;

  @ApiProperty({ enum: ExhibitionStatus })
  @Prop({ type: String, enum: ExhibitionStatus, default: ExhibitionStatus.DRAFT })
  status: ExhibitionStatus;

  @ApiProperty()
  @Prop()
  exhibitionLogo?: string;

  @ApiProperty()
  @Prop()
  badgeLogo?: string;

  @ApiProperty()
  @Prop()
  bannerImage?: string;

  @ApiProperty()
  @Prop({ type: Object })
  badgeConfig?: Record<string, any>;

  @ApiProperty()
  @Prop({ default: false })
  isPaid: boolean;

  @ApiProperty()
  @Prop()
  paidStartDate?: Date;

  @ApiProperty()
  @Prop()
  paidEndDate?: Date;

  @ApiProperty({ type: [PricingTier] })
  @Prop({ type: [PricingTier], default: [] })
  pricingTiers: PricingTier[];

  @ApiProperty({ type: [String], enum: RegistrationCategory })
  @Prop({ type: [String], default: ['general'] })
  allowedCategories: string[];

  @ApiProperty({ type: [CustomField] })
  @Prop({ type: [CustomField], default: [] })
  customFields: CustomField[];

  @ApiProperty()
  @Prop({ default: 0 })
  currentRegistrations: number;

  @ApiProperty({ type: [InterestOption] })
  @Prop({ type: [InterestOption], default: [] })
  interestOptions: InterestOption[];

  @ApiProperty()
  @Prop({ default: false })
  allowGuests: boolean;

  @ApiProperty()
  @Prop({ default: false })
  requiresApproval: boolean;

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

export const ExhibitionSchema = SchemaFactory.createForClass(Exhibition);

// Transform _id to id for frontend compatibility
ExhibitionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    
    // Transform subdocument _id to id for pricing tiers
    if (ret.pricingTiers && Array.isArray(ret.pricingTiers)) {
      ret.pricingTiers = ret.pricingTiers.map((tier: any) => ({
        ...tier,
        id: tier._id ? tier._id.toString() : undefined,
        _id: tier._id ? tier._id.toString() : undefined, // Keep _id for backward compatibility
      }));
    }
    
    // Transform subdocument _id to id for interest options
    if (ret.interestOptions && Array.isArray(ret.interestOptions)) {
      ret.interestOptions = ret.interestOptions.map((option: any) => ({
        ...option,
        id: option._id ? option._id.toString() : undefined,
        _id: option._id ? option._id.toString() : undefined, // Keep _id for backward compatibility
      }));
    }
    
    // Transform subdocument _id to id for custom fields
    if (ret.customFields && Array.isArray(ret.customFields)) {
      ret.customFields = ret.customFields.map((field: any) => ({
        ...field,
        id: field._id ? field._id.toString() : undefined,
        _id: field._id ? field._id.toString() : undefined, // Keep _id for backward compatibility
      }));
    }
    
    delete ret.__v;
    return ret;
  },
});

// Indexes (slug already has unique index from @Prop)
ExhibitionSchema.index({ name: 1 }); // Index for name searches
ExhibitionSchema.index({ status: 1 }); // Index for status filtering
ExhibitionSchema.index({ registrationStartDate: 1, registrationEndDate: 1 });
ExhibitionSchema.index({ onsiteStartDate: 1, onsiteEndDate: 1 }); // Compound index for date range queries
ExhibitionSchema.index({ isPaid: 1 }); // Index for paid/free filtering
ExhibitionSchema.index({ createdAt: -1 }); // Index for sorting by creation date
ExhibitionSchema.index({ name: 'text', description: 'text' }); // Text search index

