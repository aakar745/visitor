import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Schema({ 
  timestamps: true, 
  collection: 'users'
})
export class User {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @ApiProperty({ writeOnly: true })
  @Prop({ required: true, select: false })
  password: string;

  @ApiProperty()
  @Prop({ trim: true })
  phone?: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  role: Types.ObjectId;

  @ApiProperty()
  @Prop({ trim: true })
  avatar?: string;

  @ApiProperty()
  @Prop({ trim: true })
  department?: string;

  @ApiProperty()
  @Prop({ trim: true })
  position?: string;

  @ApiProperty({ enum: UserStatus })
  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty()
  @Prop()
  lastLoginAt?: Date;

  @ApiProperty()
  @Prop()
  lastLoginIp?: string;

  @ApiProperty()
  @Prop({ default: 0 })
  loginAttempts: number;

  @ApiProperty()
  @Prop()
  lockedUntil?: Date;

  @ApiProperty()
  @Prop({ type: [String], default: [] })
  refreshTokens: string[];

  @ApiProperty()
  @Prop()
  passwordChangedAt?: Date;

  @ApiProperty()
  @Prop()
  passwordResetToken?: string; // NOTE: Unused - kept for future non-admin features

  @ApiProperty()
  @Prop()
  passwordResetExpires?: Date; // NOTE: Unused - kept for future non-admin features

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Prop()
  deactivatedAt?: Date;

  @ApiProperty()
  @Prop()
  deactivatedBy?: Types.ObjectId;

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

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual field to map _id to id for frontend compatibility
UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtuals are included when converting to JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret.password; // Never include password in JSON
    return ret;
  },
});

// Indexes (email already has unique index from @Prop)
UserSchema.index({ name: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ loginAttempts: 1, lockedUntil: 1 }); // Compound index for account lockout queries

// ✅ Compound indexes for common query patterns (optimizes user listing and auth)
UserSchema.index({ email: 1, isActive: 1 }); // For login (email + active check)
UserSchema.index({ role: 1, isActive: 1, createdAt: -1 }); // For user listing by role

