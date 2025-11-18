import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsNumber, IsOptional, Min, Max, Matches, IsIn, IsUrl } from 'class-validator';

export class UpdateKioskSettingsDto {
  @ApiProperty({ description: 'Enable/disable public kiosk check-in page', required: false })
  @IsBoolean()
  @IsOptional()
  kioskEnabled?: boolean;

  @ApiProperty({ description: 'Optional PIN for kiosk access (4-6 digits, leave empty for no PIN)', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{4,6}$/, { message: 'PIN must be 4-6 digits' })
  kioskPin?: string;

  @ApiProperty({ description: 'Enable auto-check-in (no confirmation modal)', required: false })
  @IsBoolean()
  @IsOptional()
  autoCheckIn?: boolean;

  @ApiProperty({ description: 'Show recent check-ins on kiosk', required: false })
  @IsBoolean()
  @IsOptional()
  showRecentCheckIns?: boolean;

  @ApiProperty({ description: 'Number of recent check-ins to display', required: false })
  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(100)
  recentCheckInsLimit?: number;

  @ApiProperty({ description: 'Enable sound on successful check-in', required: false })
  @IsBoolean()
  @IsOptional()
  enableSound?: boolean;

  @ApiProperty({ description: 'Custom welcome message for kiosk', required: false })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiProperty({ description: 'Kiosk theme color (hex)', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Theme color must be a valid hex color (e.g., #1890ff)' })
  themeColor?: string;

  @ApiProperty({ description: 'Enable USB barcode scanner support', required: false })
  @IsBoolean()
  @IsOptional()
  enableBarcodeScanner?: boolean;

  @ApiProperty({ description: 'Auto-refresh interval for recent check-ins (seconds)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(60)
  autoRefreshInterval?: number;

  // Auto-Print Badge Settings
  @ApiProperty({ description: 'Enable auto-print badge feature', required: false })
  @IsBoolean()
  @IsOptional()
  autoPrintEnabled?: boolean;

  @ApiProperty({ description: 'Printer type/model', required: false })
  @IsString()
  @IsOptional()
  printerType?: string;

  @ApiProperty({ description: 'Printer connection type', required: false })
  @IsString()
  @IsOptional()
  @IsIn(['USB', 'Network', 'Bluetooth'])
  printerConnectionType?: string;

  @ApiProperty({ description: 'Print service URL', required: false })
  @IsString()
  @IsOptional()
  printerServiceUrl?: string;

  @ApiProperty({ description: 'Network printer IP address', required: false })
  @IsString()
  @IsOptional()
  printerIpAddress?: string;

  @ApiProperty({ description: 'Label width in mm', required: false })
  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(100)
  labelWidth?: number;

  @ApiProperty({ description: 'Label height/length in mm', required: false })
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(300)
  labelHeight?: number;

  @ApiProperty({ description: 'Show location on label', required: false })
  @IsBoolean()
  @IsOptional()
  showLocationOnLabel?: boolean;

  @ApiProperty({ description: 'Show registration number on label', required: false })
  @IsBoolean()
  @IsOptional()
  showRegNumberOnLabel?: boolean;

  @ApiProperty({ description: 'Welcome message for auto-print kiosk', required: false })
  @IsString()
  @IsOptional()
  autoPrintWelcomeMessage?: string;

  @ApiProperty({ description: 'Enable print test mode', required: false })
  @IsBoolean()
  @IsOptional()
  printTestMode?: boolean;

  @ApiProperty({ description: 'Allow repeated badge printing for already checked-in visitors', required: false })
  @IsBoolean()
  @IsOptional()
  allowRepeatPrinting?: boolean;
}

