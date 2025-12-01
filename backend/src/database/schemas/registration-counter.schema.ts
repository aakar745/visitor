import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Registration Counter Schema
 * Atomic counter for generating unique sequential registration numbers per exhibition
 * 
 * ✅ RACE CONDITION SAFE: Uses atomic $inc with compound unique index
 * 
 * Format: REG-{TAGLINE_CODE}-{DDMMYYYY}-{SEQUENCE}
 * Example: REG-ABSE-01122025-000001
 * 
 * Uses exhibition tagline (sanitized) as the human-readable code.
 * Each exhibition gets its own daily counter, reset at midnight.
 * 
 * Tagline Sanitization Examples:
 * - "ABSE" → "ABSE"
 * - "Aakar Beauty Salon Expo" → "ABSE" (if admin enters short code)
 * - "Innovation Awaits You" → "IAY" (abbreviation if needed)
 */
@Schema({ timestamps: true })
export class RegistrationCounter extends Document {
  @Prop({ required: true })
  exhibitionTagline: string; // Exhibition tagline (sanitized to alphanumeric, uppercase)

  @Prop({ required: true })
  date: string; // Format: DDMMYYYY

  @Prop({ required: true, default: 0 })
  sequence: number; // Auto-incrementing sequence for this exhibition + date

  @Prop()
  lastRegistrationNumber?: string; // Last generated registration number (for tracking)
}

export const RegistrationCounterSchema = SchemaFactory.createForClass(RegistrationCounter);

// ✅ Compound unique index on (exhibitionTagline + date) ensures one counter per exhibition per day
// This prevents race conditions and ensures atomic increments work correctly
// Even with 1000 concurrent requests, each gets a unique sequential number
RegistrationCounterSchema.index({ exhibitionTagline: 1, date: 1 }, { unique: true });

