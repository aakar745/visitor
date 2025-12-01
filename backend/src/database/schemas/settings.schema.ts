import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SettingsDocument = Settings & Document;

export enum SettingCategory {
  GENERAL = 'general',
  SECURITY = 'security',
  VISITOR = 'visitor',
  EXHIBITION = 'exhibition',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
  INTEGRATION = 'integration',
}

export enum SettingValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  FILE = 'file',
  SELECT = 'select',
  COLOR = 'color',
  EMAIL = 'email',
  URL = 'url',
  PASSWORD = 'password',
}

@Schema({ timestamps: true, collection: 'settings' })
export class Settings {
  @ApiProperty()
  @Prop({ required: true, unique: true, trim: true })
  key: string; // Unique identifier (e.g., 'app.name', 'app.headerLogo')

  @ApiProperty()
  @Prop({ required: true, trim: true })
  name: string; // Display name

  @ApiProperty()
  @Prop({ type: String, trim: true })
  description?: string;

  @ApiProperty({ enum: SettingCategory })
  @Prop({ type: String, enum: SettingCategory, required: true })
  category: SettingCategory;

  @ApiProperty()
  @Prop({ trim: true })
  group?: string; // Sub-group within category (e.g., 'branding', 'contact')

  @ApiProperty({ enum: SettingValueType })
  @Prop({ type: String, enum: SettingValueType, default: SettingValueType.STRING })
  valueType: SettingValueType;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Mixed, required: false, default: null })
  value: any; // Current value

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Mixed, required: false, default: null })
  defaultValue: any; // Default value

  @ApiProperty()
  @Prop({ type: Boolean, default: false })
  isRequired: boolean;

  @ApiProperty()
  @Prop({ type: Boolean, default: false })
  isReadonly: boolean; // System settings that cannot be changed via UI

  @ApiProperty()
  @Prop({ type: Boolean, default: false })
  isSystem: boolean; // Core system settings

  @ApiProperty()
  @Prop({ type: [{ label: String, value: MongooseSchema.Types.Mixed }], default: undefined })
  options?: { label: string; value: any }[]; // For select types

  @ApiProperty()
  @Prop({ type: Object, default: undefined })
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };

  @ApiProperty()
  @Prop({ type: Number, default: 0 })
  order: number; // Display order within group

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

// Indexes
SettingsSchema.index({ key: 1 }, { unique: true });
SettingsSchema.index({ category: 1, group: 1, order: 1 });
SettingsSchema.index({ category: 1 });

