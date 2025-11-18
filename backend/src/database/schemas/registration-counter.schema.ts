import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Registration Counter Schema
 * Atomic counter for generating unique sequential registration numbers
 * Format: REG-{DDMMYYYY}-{SEQUENCE}
 */
@Schema({ timestamps: true })
export class RegistrationCounter extends Document {
  @Prop({ required: true, unique: true })
  date: string; // Format: DDMMYYYY

  @Prop({ required: true, default: 0 })
  sequence: number; // Auto-incrementing sequence for this date

  @Prop()
  lastRegistrationNumber?: string; // Last generated registration number (for tracking)
}

export const RegistrationCounterSchema = SchemaFactory.createForClass(RegistrationCounter);

// Compound unique index on date (ensures one counter per day)
RegistrationCounterSchema.index({ date: 1 }, { unique: true });

