import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

export enum OtpType {
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export enum OtpPurpose {
  AUTHENTICATION = 'authentication',
  VERIFICATION = 'verification',
  REGISTRATION = 'registration',
}

@Schema({ timestamps: true, collection: 'otps' })
export class Otp {
  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  code: string;

  @Prop({ type: String, enum: OtpType, required: true })
  type: OtpType;

  @Prop({ type: String, enum: OtpPurpose, default: OtpPurpose.AUTHENTICATION })
  purpose: OtpPurpose;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  messageId?: string; // Interakt/Firebase message ID for tracking

  createdAt: Date;
  updatedAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Indexes
OtpSchema.index({ phoneNumber: 1, type: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs
OtpSchema.index({ createdAt: -1 });

// ✅ FIX: Compound index for rate-limiting query (prevents full collection scan under high load)
// This index optimizes the "Check if there's a recent OTP request" query in sendWhatsAppOTP()
OtpSchema.index({ phoneNumber: 1, type: 1, createdAt: -1 });

// ✅ FIX: Compound index for verification query (optimizes findOne in verifyWhatsAppOTP)
OtpSchema.index({ phoneNumber: 1, type: 1, isVerified: 1, expiresAt: 1 });

