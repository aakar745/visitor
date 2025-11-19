import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ExhibitionRegistrationDocument = ExhibitionRegistration & Document;

export enum RegistrationStatus {
  REGISTERED = 'registered',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked-in',
  CANCELLED = 'cancelled',
  WAITLISTED = 'waitlisted',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum RegistrationSource {
  ONLINE = 'online',
  ONSITE = 'onsite',
  ADMIN = 'admin',
}

export enum ReferralSource {
  DIRECT = 'direct',
  EXHIBITOR = 'exhibitor',
}

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked-in',
  CHECKED_OUT = 'checked-out',
  NO_SHOW = 'no-show',
}

@Schema({ timestamps: true, collection: 'exhibition_registrations' })
export class ExhibitionRegistration {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: String, unique: true, required: true })
  registrationNumber: string; // Unique registration number (e.g., REG-10112025-000001)

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'GlobalVisitor', required: true })
  visitorId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Exhibition', required: true })
  exhibitionId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  registrationCategory: string;

  @ApiProperty()
  @Prop({ type: [String], default: [] })
  selectedInterests: string[];

  @ApiProperty()
  @Prop({ type: Object, default: {} })
  customFieldData: Record<string, any>;

  @ApiProperty({ enum: PaymentStatus })
  @Prop({ type: String, enum: PaymentStatus })
  paymentStatus?: PaymentStatus;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'PricingTier' })
  pricingTierId?: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: [Number], default: [] })
  selectedDays?: number[]; // For day-wise tickets: array of selected day numbers (0 = all sessions)

  @ApiProperty()
  @Prop()
  amountPaid?: number;

  @ApiProperty()
  @Prop()
  paymentDate?: Date;

  @ApiProperty()
  @Prop()
  paymentId?: string;

  @ApiProperty()
  @Prop({ required: true })
  registrationDate: Date;

  @ApiProperty({ enum: RegistrationSource })
  @Prop({ type: String, enum: RegistrationSource, default: RegistrationSource.ONLINE })
  registrationSource: RegistrationSource;

  @ApiProperty({ enum: RegistrationStatus })
  @Prop({ type: String, enum: RegistrationStatus, default: RegistrationStatus.REGISTERED })
  status: RegistrationStatus;

  @ApiProperty({ enum: ReferralSource })
  @Prop({ type: String, enum: ReferralSource, default: ReferralSource.DIRECT })
  referralSource: ReferralSource;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Exhibitor' })
  exhibitorId?: Types.ObjectId;

  @ApiProperty()
  @Prop()
  exhibitorName?: string;

  @ApiProperty()
  @Prop()
  referralCode?: string;

  @ApiProperty()
  @Prop()
  checkInTime?: Date;

  @ApiProperty()
  @Prop()
  checkOutTime?: Date;

  @ApiProperty({ enum: VisitStatus })
  @Prop({ type: String, enum: VisitStatus })
  visitStatus?: VisitStatus;

  @ApiProperty()
  @Prop()
  badgeId?: string;

  @ApiProperty()
  @Prop()
  badgeUrl?: string;

  @ApiProperty()
  @Prop()
  qrCode?: string;

  @ApiProperty()
  @Prop({ trim: true })
  notes?: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId })
  approvedBy?: Types.ObjectId;

  @ApiProperty()
  @Prop()
  approvedAt?: Date;

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

export const ExhibitionRegistrationSchema = SchemaFactory.createForClass(ExhibitionRegistration);

// Indexes
ExhibitionRegistrationSchema.index({ registrationNumber: 1 }, { unique: true }); // Ensure unique registration numbers
ExhibitionRegistrationSchema.index({ visitorId: 1, exhibitionId: 1 }, { unique: true });
ExhibitionRegistrationSchema.index({ exhibitionId: 1, status: 1 });
ExhibitionRegistrationSchema.index({ exhibitionId: 1, registrationCategory: 1 });
ExhibitionRegistrationSchema.index({ exhibitionId: 1, paymentStatus: 1 });
ExhibitionRegistrationSchema.index({ exhibitorId: 1 });
ExhibitionRegistrationSchema.index({ registrationDate: -1 });
ExhibitionRegistrationSchema.index({ checkInTime: 1 });
ExhibitionRegistrationSchema.index({ createdAt: -1 });

