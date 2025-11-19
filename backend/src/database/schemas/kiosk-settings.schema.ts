import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type KioskSettingsDocument = KioskSettings & Document;

@Schema({ timestamps: true, collection: 'kiosk_settings' })
export class KioskSettings {
  @ApiProperty()
  @Prop({ type: String, required: true, default: 'default' })
  settingsKey: string; // Always 'default' - single settings document

  @ApiProperty({ description: 'Enable/disable public kiosk check-in page' })
  @Prop({ type: Boolean, default: true })
  kioskEnabled: boolean;

  @ApiProperty({ description: 'Optional PIN for kiosk access (leave empty for no PIN)' })
  @Prop({ type: String, default: null })
  kioskPin?: string;

  @ApiProperty({ description: 'Enable auto-check-in (no confirmation modal)' })
  @Prop({ type: Boolean, default: false })
  autoCheckIn: boolean;

  @ApiProperty({ description: 'Show recent check-ins on kiosk' })
  @Prop({ type: Boolean, default: true })
  showRecentCheckIns: boolean;

  @ApiProperty({ description: 'Number of recent check-ins to display' })
  @Prop({ type: Number, default: 20, min: 5, max: 100 })
  recentCheckInsLimit: number;

  @ApiProperty({ description: 'Enable sound on successful check-in' })
  @Prop({ type: Boolean, default: true })
  enableSound: boolean;

  @ApiProperty({ description: 'Custom welcome message for kiosk' })
  @Prop({ type: String, default: 'Welcome! Please scan your QR code to check in.' })
  welcomeMessage: string;

  @ApiProperty({ description: 'Kiosk theme color (hex)' })
  @Prop({ type: String, default: '#1890ff' })
  themeColor: string;

  @ApiProperty({ description: 'Enable USB barcode scanner support' })
  @Prop({ type: Boolean, default: true })
  enableBarcodeScanner: boolean;

  @ApiProperty({ description: 'Auto-refresh interval for recent check-ins (seconds)' })
  @Prop({ type: Number, default: 10, min: 5, max: 60 })
  autoRefreshInterval: number;

  // ============================================
  // AUTO-PRINT BADGE SETTINGS
  // ============================================

  @ApiProperty({ description: 'Enable auto-print badge feature' })
  @Prop({ type: Boolean, default: false })
  autoPrintEnabled: boolean;

  @ApiProperty({ description: 'Printer type/model' })
  @Prop({ type: String, default: 'Brother QL-800' })
  printerType: string;

  @ApiProperty({ description: 'Printer connection type' })
  @Prop({ type: String, enum: ['USB', 'Network', 'Bluetooth'], default: 'USB' })
  printerConnectionType: string;

  @ApiProperty({ description: 'Print service URL (e.g., http://localhost:9100)' })
  @Prop({ type: String, default: 'http://localhost:9100' })
  printerServiceUrl: string;

  @ApiProperty({ description: 'Network printer IP address (if connection type is Network)' })
  @Prop({ type: String, default: null })
  printerIpAddress?: string;

  @ApiProperty({ description: 'Label width in mm' })
  @Prop({ type: Number, default: 29 })
  labelWidth: number;

  @ApiProperty({ description: 'Label height/length in mm' })
  @Prop({ type: Number, default: 90 })
  labelHeight: number;

  @ApiProperty({ description: 'Show location on label' })
  @Prop({ type: Boolean, default: true })
  showLocationOnLabel: boolean;

  @ApiProperty({ description: 'Show registration number on label' })
  @Prop({ type: Boolean, default: true })
  showRegNumberOnLabel: boolean;

  @ApiProperty({ description: 'Welcome message for auto-print kiosk' })
  @Prop({ type: String, default: 'Please scan your QR code to print your badge' })
  autoPrintWelcomeMessage: string;

  @ApiProperty({ description: 'Enable print test mode (for testing without real printer)' })
  @Prop({ type: Boolean, default: false })
  printTestMode: boolean;

  @ApiProperty({ description: 'Allow repeated badge printing for already checked-in visitors' })
  @Prop({ type: Boolean, default: false })
  allowRepeatPrinting: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const KioskSettingsSchema = SchemaFactory.createForClass(KioskSettings);

// Ensure only one settings document exists
KioskSettingsSchema.index({ settingsKey: 1 }, { unique: true });

