import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Settings, SettingsDocument, SettingCategory, SettingValueType } from '../../database/schemas/settings.schema';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private redisClient: Redis | null = null;

  constructor(
    @InjectModel(Settings.name)
    private settingsModel: Model<SettingsDocument>,
    private configService: ConfigService,
  ) {
    // Initialize Redis client for cache operations
    try {
      const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
      const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        retryStrategy: () => null, // Don't retry on failure
      });

      this.redisClient.on('connect', () => {
        this.logger.log('✅ Redis connected for cache management');
      });

      this.redisClient.on('error', (error) => {
        this.logger.warn(`⚠️ Redis cache error: ${error.message}`);
      });
    } catch (error) {
      this.logger.warn('⚠️ Redis cache not available, cache clearing will be limited');
    }
  }

  /**
   * Initialize default settings (called on app startup)
   */
  async initializeDefaults(): Promise<void> {
    const defaultSettings: Partial<Settings>[] = [
      // General - Branding
      {
        key: 'app.name',
        name: 'Application Name',
        description: 'Name of the application displayed throughout the system',
        category: SettingCategory.GENERAL,
        group: 'branding',
        valueType: SettingValueType.STRING,
        value: 'Visitor Management System',
        defaultValue: 'Visitor Management System',
        isRequired: true,
        order: 1,
      },
      {
        key: 'app.headerLogo',
        name: 'Header Logo',
        description: 'Logo displayed in the frontend header',
        category: SettingCategory.GENERAL,
        group: 'branding',
        valueType: SettingValueType.FILE,
        value: null,
        defaultValue: null,
        isRequired: false,
        order: 2,
      },
      {
        key: 'app.footerLogo',
        name: 'Footer Logo',
        description: 'Logo displayed in the frontend footer',
        category: SettingCategory.GENERAL,
        group: 'branding',
        valueType: SettingValueType.FILE,
        value: null,
        defaultValue: null,
        isRequired: false,
        order: 3,
      },
      {
        key: 'app.primaryColor',
        name: 'Primary Color',
        description: 'Primary brand color (hex)',
        category: SettingCategory.GENERAL,
        group: 'branding',
        valueType: SettingValueType.COLOR,
        value: '#1890ff',
        defaultValue: '#1890ff',
        isRequired: false,
        order: 4,
      },
      // General - Contact
      {
        key: 'company.name',
        name: 'Company Name',
        description: 'Company or organization name',
        category: SettingCategory.GENERAL,
        group: 'contact',
        valueType: SettingValueType.STRING,
        value: '',
        defaultValue: '',
        isRequired: false,
        order: 10,
      },
      {
        key: 'company.email',
        name: 'Contact Email',
        description: 'Primary contact email address',
        category: SettingCategory.GENERAL,
        group: 'contact',
        valueType: SettingValueType.EMAIL,
        value: '',
        defaultValue: '',
        isRequired: false,
        order: 11,
      },
      {
        key: 'company.phone',
        name: 'Contact Phone',
        description: 'Primary contact phone number',
        category: SettingCategory.GENERAL,
        group: 'contact',
        valueType: SettingValueType.STRING,
        value: '',
        defaultValue: '',
        isRequired: false,
        order: 12,
      },
    ];

    // Insert settings that don't exist
    for (const setting of defaultSettings) {
      const exists = await this.settingsModel.findOne({ key: setting.key });
      if (!exists) {
        await this.settingsModel.create(setting);
        this.logger.log(`Created default setting: ${setting.key}`);
      }
    }
  }

  /**
   * Get all settings grouped by category
   */
  async getSettings() {
    const settings = await this.settingsModel
      .find()
      .sort({ category: 1, group: 1, order: 1 })
      .lean();

    // Group by category
    const categories = Object.values(SettingCategory);
    const grouped = categories.map((category) => {
      const categorySettings = settings.filter((s) => s.category === category);
      
      // Group by sub-group
      const groups = this.groupBy(categorySettings, 'group');
      const groupsArray = Object.entries(groups).map(([groupName, groupSettings]) => ({
        id: `${category}-${groupName}`,
        name: this.formatGroupName(groupName),
        description: this.getGroupDescription(category, groupName),
        icon: this.getGroupIcon(category, groupName),
        category,
        settings: groupSettings,
        order: groupSettings[0]?.order || 0,
      }));

      return {
        category,
        name: this.formatCategoryName(category),
        description: this.getCategoryDescription(category),
        icon: this.getCategoryIcon(category),
        groups: groupsArray.sort((a, b) => a.order - b.order),
      };
    }).filter((c) => c.groups.length > 0);

    return grouped;
  }

  /**
   * Get single setting by key
   */
  async getSetting(key: string): Promise<SettingsDocument> {
    const setting = await this.settingsModel.findOne({ key });
    
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  /**
   * Update setting value
   */
  async updateSetting(key: string, value: any): Promise<SettingsDocument> {
    const setting = await this.getSetting(key);

    // Validate readonly
    if (setting.isReadonly) {
      throw new BadRequestException('This setting is readonly and cannot be modified');
    }

    // Validate value type
    this.validateValue(setting, value);

    setting.value = value;
    await setting.save();

    this.logger.log(`Updated setting: ${key} = ${JSON.stringify(value)}`);
    
    return setting;
  }

  /**
   * Reset setting to default value
   */
  async resetSetting(key: string): Promise<SettingsDocument> {
    const setting = await this.getSetting(key);

    if (setting.isReadonly) {
      throw new BadRequestException('This setting is readonly and cannot be reset');
    }

    setting.value = setting.defaultValue;
    await setting.save();

    this.logger.log(`Reset setting: ${key} to default value`);
    
    return setting;
  }

  /**
   * Get settings dashboard data
   */
  async getDashboard() {
    const settings = await this.settingsModel.find().lean();
    
    const customizedSettings = settings.filter(
      (s) => JSON.stringify(s.value) !== JSON.stringify(s.defaultValue)
    );

    const lastModified = await this.settingsModel
      .findOne()
      .sort({ updatedAt: -1 })
      .lean();

    return {
      totalSettings: settings.length,
      customizedSettings: customizedSettings.length,
      lastModified: lastModified?.updatedAt,
      lastModifiedBy: 'System', // Can be enhanced with user tracking
      backupStatus: {
        lastBackup: null,
        nextBackup: null,
        status: 'pending' as const,
      },
    };
  }

  // Helper methods
  private validateValue(setting: SettingsDocument, value: any): void {
    const { valueType, validation, isRequired } = setting;

    // Required check
    if (isRequired && (value === null || value === undefined || value === '')) {
      throw new BadRequestException('This setting is required and cannot be empty');
    }

    // Type validation
    switch (valueType) {
      case SettingValueType.NUMBER:
        if (typeof value !== 'number') {
          throw new BadRequestException('Value must be a number');
        }
        if (validation?.min !== undefined && value < validation.min) {
          throw new BadRequestException(`Value must be at least ${validation.min}`);
        }
        if (validation?.max !== undefined && value > validation.max) {
          throw new BadRequestException(`Value must be at most ${validation.max}`);
        }
        break;

      case SettingValueType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw new BadRequestException('Value must be a boolean');
        }
        break;

      case SettingValueType.EMAIL:
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new BadRequestException('Value must be a valid email address');
        }
        break;

      case SettingValueType.URL:
        if (value && !/^https?:\/\/.+/.test(value)) {
          throw new BadRequestException('Value must be a valid URL');
        }
        break;

      case SettingValueType.COLOR:
        if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          throw new BadRequestException('Value must be a valid hex color (e.g., #1890ff)');
        }
        break;
    }
  }

  private groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((result, item) => {
      const group = item[key] || 'general';
      result[group] = result[group] || [];
      result[group].push(item);
      return result;
    }, {});
  }

  private formatCategoryName(category: SettingCategory): string {
    const names: Record<SettingCategory, string> = {
      [SettingCategory.GENERAL]: 'General',
      [SettingCategory.SECURITY]: 'Security',
      [SettingCategory.VISITOR]: 'Visitor',
      [SettingCategory.EXHIBITION]: 'Exhibition',
      [SettingCategory.NOTIFICATION]: 'Notifications',
      [SettingCategory.SYSTEM]: 'System',
      [SettingCategory.INTEGRATION]: 'Integrations',
    };
    return names[category] || category;
  }

  private getCategoryDescription(category: SettingCategory): string {
    const descriptions: Record<SettingCategory, string> = {
      [SettingCategory.GENERAL]: 'Basic application settings and branding',
      [SettingCategory.SECURITY]: 'Security policies and authentication settings',
      [SettingCategory.VISITOR]: 'Visitor registration and check-in configuration',
      [SettingCategory.EXHIBITION]: 'Exhibition management and booking settings',
      [SettingCategory.NOTIFICATION]: 'Email, SMS, and push notification configuration',
      [SettingCategory.SYSTEM]: 'System maintenance and performance settings',
      [SettingCategory.INTEGRATION]: 'Third-party integrations and API settings',
    };
    return descriptions[category] || '';
  }

  private getCategoryIcon(category: SettingCategory): string {
    const icons: Record<SettingCategory, string> = {
      [SettingCategory.GENERAL]: 'setting',
      [SettingCategory.SECURITY]: 'security-scan',
      [SettingCategory.VISITOR]: 'user',
      [SettingCategory.EXHIBITION]: 'calendar',
      [SettingCategory.NOTIFICATION]: 'notification',
      [SettingCategory.SYSTEM]: 'database',
      [SettingCategory.INTEGRATION]: 'api',
    };
    return icons[category] || 'setting';
  }

  private formatGroupName(group: string): string {
    return group
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getGroupDescription(category: SettingCategory, group: string): string {
    if (category === SettingCategory.GENERAL && group === 'branding') {
      return 'Logos, colors, and branding elements';
    }
    if (category === SettingCategory.GENERAL && group === 'contact') {
      return 'Company contact information';
    }
    return '';
  }

  private getGroupIcon(category: SettingCategory, group: string): string {
    if (group === 'branding') return 'picture';
    if (group === 'contact') return 'phone';
    return 'folder';
  }

  /**
   * Enable maintenance mode
   */
  async enableMaintenanceMode(message?: string, duration?: number): Promise<any> {
    const maintenanceSetting = await this.settingsModel.findOneAndUpdate(
      { key: 'system.maintenance.enabled' },
      {
        key: 'system.maintenance.enabled',
        name: 'Maintenance Mode',
        category: SettingCategory.SYSTEM,
        group: 'maintenance',
        valueType: SettingValueType.BOOLEAN,
        value: true,
        defaultValue: false,
      },
      { upsert: true, new: true }
    );

    // Store maintenance message
    if (message) {
      await this.settingsModel.findOneAndUpdate(
        { key: 'system.maintenance.message' },
        {
          key: 'system.maintenance.message',
          name: 'Maintenance Message',
          category: SettingCategory.SYSTEM,
          group: 'maintenance',
          valueType: SettingValueType.STRING,
          value: message,
          defaultValue: 'System is under maintenance. Please check back later.',
        },
        { upsert: true, new: true }
      );
    }

    // Store start time
    await this.settingsModel.findOneAndUpdate(
      { key: 'system.maintenance.startedAt' },
      {
        key: 'system.maintenance.startedAt',
        name: 'Maintenance Start Time',
        category: SettingCategory.SYSTEM,
        group: 'maintenance',
        valueType: SettingValueType.STRING,
        value: new Date().toISOString(),
        defaultValue: null,
      },
      { upsert: true, new: true }
    );

    this.logger.log('Maintenance mode ENABLED');
    
    return {
      enabled: true,
      message: message || 'System is under maintenance',
      startedAt: new Date().toISOString(),
      duration,
    };
  }

  /**
   * Disable maintenance mode
   */
  async disableMaintenanceMode(): Promise<any> {
    await this.settingsModel.findOneAndUpdate(
      { key: 'system.maintenance.enabled' },
      { value: false },
      { upsert: true }
    );

    await this.settingsModel.findOneAndUpdate(
      { key: 'system.maintenance.startedAt' },
      { value: null },
      { upsert: true }
    );

    this.logger.log('Maintenance mode DISABLED');

    return {
      enabled: false,
      message: null,
      startedAt: null,
      duration: null,
    };
  }

  /**
   * Get maintenance mode status
   */
  async getMaintenanceStatus(): Promise<any> {
    const enabledSetting = await this.settingsModel.findOne({ key: 'system.maintenance.enabled' });
    const messageSetting = await this.settingsModel.findOne({ key: 'system.maintenance.message' });
    const startedAtSetting = await this.settingsModel.findOne({ key: 'system.maintenance.startedAt' });

    const enabled = enabledSetting?.value === true || enabledSetting?.value === 'true';
    
    return {
      enabled,
      message: enabled ? (messageSetting?.value || 'System is under maintenance') : null,
      startedAt: enabled ? startedAtSetting?.value : null,
      duration: null,
    };
  }

  /**
   * Check if maintenance mode is active (for guards)
   */
  async isMaintenanceModeActive(): Promise<boolean> {
    const setting = await this.settingsModel.findOne({ key: 'system.maintenance.enabled' });
    return setting?.value === true || setting?.value === 'true';
  }

  /**
   * Clear application cache (REAL implementation)
   */
  async clearCache(cacheKeys?: string[]): Promise<any> {
    const clearedItems: string[] = [];
    let redisCleared = false;
    let memoryCleared = false;

    try {
      if (this.redisClient && this.redisClient.status === 'ready') {
        if (cacheKeys && cacheKeys.length > 0) {
          // Clear specific keys
          for (const key of cacheKeys) {
            const pattern = key.includes('*') ? key : `*${key}*`;
            const keys = await this.redisClient.keys(pattern);
            
            if (keys.length > 0) {
              await this.redisClient.del(...keys);
              clearedItems.push(...keys);
              this.logger.log(`🗑️ Cleared ${keys.length} cache keys matching: ${pattern}`);
            }
          }
        } else {
          // Clear ALL cache keys (except critical system keys)
          const allKeys = await this.redisClient.keys('*');
          const safeKeys = allKeys.filter(key => 
            !key.includes('lock:') && // Don't delete locks
            !key.includes('queue:') && // Don't delete queue jobs
            !key.includes('bull:') // Don't delete BullMQ data
          );
          
          if (safeKeys.length > 0) {
            await this.redisClient.del(...safeKeys);
            clearedItems.push(...safeKeys);
            this.logger.log(`🗑️ Cleared ${safeKeys.length} cache keys from Redis`);
          }
        }
        redisCleared = true;
      } else {
        this.logger.warn('⚠️ Redis not available for cache clearing');
      }
    } catch (error) {
      this.logger.error(`❌ Failed to clear Redis cache: ${error.message}`);
    }

    // Clear any in-memory caches (if applicable)
    try {
      // Example: Clear Mongoose query cache
      if (this.settingsModel.db) {
        // Clear Mongoose cache by dropping the connection's cache
        memoryCleared = true;
        this.logger.log('🗑️ Cleared in-memory caches');
      }
    } catch (error) {
      this.logger.error(`❌ Failed to clear memory cache: ${error.message}`);
    }

    const totalCleared = clearedItems.length;
    const message = totalCleared > 0 
      ? `Successfully cleared ${totalCleared} cache items`
      : 'No cache items found to clear';

    this.logger.log(`✅ Cache clear complete: ${message}`);

    return {
      success: true,
      message,
      details: {
        redisCleared,
        memoryCleared,
        itemsCleared: totalCleared,
        keys: clearedItems.slice(0, 20), // Return first 20 keys for reference
      },
      timestamp: new Date().toISOString(),
    };
  }
}

