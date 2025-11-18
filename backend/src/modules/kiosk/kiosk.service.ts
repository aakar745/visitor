import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KioskSettings, KioskSettingsDocument } from '../../database/schemas/kiosk-settings.schema';
import { UpdateKioskSettingsDto } from './dto/update-kiosk-settings.dto';

@Injectable()
export class KioskService {
  private readonly logger = new Logger(KioskService.name);

  constructor(
    @InjectModel(KioskSettings.name)
    private kioskSettingsModel: Model<KioskSettingsDocument>,
  ) {}

  /**
   * Get kiosk settings (creates default if doesn't exist)
   */
  async getSettings(): Promise<KioskSettingsDocument> {
    let settings = await this.kioskSettingsModel.findOne({ settingsKey: 'default' });
    
    if (!settings) {
      // Create default settings on first access
      settings = await this.kioskSettingsModel.create({
        settingsKey: 'default',
        kioskEnabled: true,
        autoCheckIn: false,
        showRecentCheckIns: true,
        recentCheckInsLimit: 20,
        enableSound: true,
        welcomeMessage: 'Welcome! Please scan your QR code to check in.',
        themeColor: '#1890ff',
        enableBarcodeScanner: true,
        autoRefreshInterval: 10,
        // Auto-Print defaults
        autoPrintEnabled: false,
        printerType: 'Brother QL-800',
        printerConnectionType: 'USB',
        printerServiceUrl: 'http://localhost:9100',
        labelWidth: 29,
        labelHeight: 90,
        showLocationOnLabel: true,
        showRegNumberOnLabel: true,
        autoPrintWelcomeMessage: 'Please scan your QR code to print your badge',
        printTestMode: false,
        allowRepeatPrinting: false,
      });
      this.logger.log('Created default kiosk settings');
    }
    
    return settings;
  }

  /**
   * Update kiosk settings
   */
  async updateSettings(dto: UpdateKioskSettingsDto): Promise<KioskSettingsDocument> {
    let settings = await this.kioskSettingsModel.findOne({ settingsKey: 'default' });
    
    if (!settings) {
      // Create if doesn't exist
      settings = await this.kioskSettingsModel.create({
        settingsKey: 'default',
        ...dto,
      });
      this.logger.log('Created kiosk settings with custom values');
    } else {
      // Update existing
      Object.assign(settings, dto);
      await settings.save();
      this.logger.log('Updated kiosk settings');
    }
    
    return settings;
  }

  /**
   * Check if kiosk is enabled (for public endpoint guard)
   */
  async isKioskEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.kioskEnabled;
  }

  /**
   * Validate kiosk PIN (if enabled)
   */
  async validatePin(pin: string): Promise<boolean> {
    const settings = await this.getSettings();
    
    // If no PIN is set, always return true (no PIN protection)
    if (!settings.kioskPin) {
      return true;
    }
    
    // Compare PIN
    return settings.kioskPin === pin;
  }

  /**
   * Get public kiosk config (for frontend)
   * Excludes sensitive data like PIN
   */
  async getPublicConfig() {
    const settings = await this.getSettings();
    
    this.logger.log(`[Public Config] allowRepeatPrinting from DB: ${settings.allowRepeatPrinting}`);
    
    const config = {
      enabled: settings.kioskEnabled,
      hasPinProtection: !!settings.kioskPin,
      autoCheckIn: settings.autoCheckIn,
      showRecentCheckIns: settings.showRecentCheckIns,
      recentCheckInsLimit: settings.recentCheckInsLimit,
      enableSound: settings.enableSound,
      welcomeMessage: settings.welcomeMessage,
      themeColor: settings.themeColor,
      enableBarcodeScanner: settings.enableBarcodeScanner,
      autoRefreshInterval: settings.autoRefreshInterval,
      // Auto-Print Settings
      autoPrintEnabled: settings.autoPrintEnabled || false,
      printerServiceUrl: settings.printerServiceUrl || 'http://localhost:9100',
      labelWidth: settings.labelWidth || 29,
      labelHeight: settings.labelHeight || 90,
      showLocationOnLabel: settings.showLocationOnLabel !== false, // default true
      showRegNumberOnLabel: settings.showRegNumberOnLabel !== false, // default true
      autoPrintWelcomeMessage: settings.autoPrintWelcomeMessage || 'Please scan your QR code to print your badge',
      printTestMode: settings.printTestMode || false,
      allowRepeatPrinting: settings.allowRepeatPrinting || false,
    };
    
    this.logger.log(`[Public Config] allowRepeatPrinting being returned: ${config.allowRepeatPrinting}`);
    
    return config;
  }
}

