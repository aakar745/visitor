// Settings Management Types

// Setting Categories
export const SettingCategory = {
  GENERAL: 'general',
  SECURITY: 'security',
  VISITOR: 'visitor',
  EXHIBITION: 'exhibition',
  NOTIFICATION: 'notification',
  SYSTEM: 'system',
  INTEGRATION: 'integration',
} as const;

export type SettingCategory = typeof SettingCategory[keyof typeof SettingCategory];

// Setting Value Types
export const SettingValueType = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  JSON: 'json',
  FILE: 'file',
  SELECT: 'select',
  MULTI_SELECT: 'multi_select',
  COLOR: 'color',
  DATE: 'date',
  TIME: 'time',
  EMAIL: 'email',
  URL: 'url',
  PASSWORD: 'password',
} as const;

export type SettingValueType = typeof SettingValueType[keyof typeof SettingValueType];

// Individual Setting
export interface Setting {
  id: string;
  key: string;
  name: string;
  description: string;
  category: SettingCategory;
  valueType: SettingValueType;
  value: any;
  defaultValue: any;
  isRequired: boolean;
  isReadonly: boolean;
  isSystem: boolean;
  options?: { label: string; value: any }[]; // For select/multi-select
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string;
  };
  group?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Settings Group (for UI organization)
export interface SettingsGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SettingCategory;
  settings: Setting[];
  order: number;
}

// Settings Category with Groups
export interface SettingsCategory {
  category: SettingCategory;
  name: string;
  description: string;
  icon: string;
  groups: SettingsGroup[];
}

// Settings Update Request
export interface UpdateSettingRequest {
  value: any;
}

export interface BulkUpdateSettingsRequest {
  settings: {
    key: string;
    value: any;
  }[];
}

// Settings Validation
export interface SettingValidationError {
  key: string;
  field: string;
  message: string;
  currentValue: any;
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: SettingValidationError[];
  warnings: SettingValidationError[];
}

// Backup and Restore
export interface SettingsBackup {
  id: string;
  name: string;
  description?: string;
  settings: { key: string; value: any }[];
  createdBy: string;
  createdAt: string;
}

export interface RestoreSettingsRequest {
  backupId: string;
  settingsToRestore?: string[]; // If not provided, restore all
}

// Settings Import/Export
export interface SettingsExportRequest {
  categories?: SettingCategory[];
  includeSystem?: boolean;
  format: 'json' | 'env' | 'yaml';
}

export interface SettingsImportRequest {
  file: File;
  overwrite?: boolean;
  skipValidation?: boolean;
}

// Settings History/Audit
export interface SettingHistory {
  id: string;
  settingKey: string;
  settingName: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Specific Setting Interfaces for Type Safety

// General Settings
export interface GeneralSettings {
  appName: string;
  appDescription: string;
  appLogo: string;
  appFavicon: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
}

// Security Settings
export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireTwoFactor: boolean;
  allowedIpRanges: string[];
  requireHttps: boolean;
  corsOrigins: string[];
  rateLimitRequests: number;
  rateLimitWindowMinutes: number;
}

// Visitor Settings
export interface VisitorSettings {
  requirePreregistration: boolean;
  allowWalkInVisitors: boolean;
  requireApproval: boolean;
  autoApprovalDomains: string[];
  defaultVisitDurationMinutes: number;
  sendWelcomeEmail: boolean;
  sendReminderEmail: boolean;
  reminderEmailHoursBefore: number;
  requirePhotoCapture: boolean;
  requireIdScan: boolean;
  printVisitorBadge: boolean;
  customFields: {
    name: string;
    type: string;
    required: boolean;
    options?: string[];
  }[];
  checkInMethods: ('qr' | 'nfc' | 'manual')[];
  autoCheckOutAfterHours: number;
}

// Exhibition Settings
export interface ExhibitionSettings {
  defaultDurationDays: number;
  requireCategories: boolean;
  allowPublicRegistration: boolean;
  autoConfirmRegistrations: boolean;
  sendConfirmationEmails: boolean;
  enableRatings: boolean;
  enableComments: boolean;
  requirePayment: boolean;
  defaultPricingTiers: {
    name: string;
    price: number;
    description: string;
  }[];
  enableEarlyBird: boolean;
  earlyBirdDiscountPercent: number;
  enableGroupDiscount: boolean;
  groupDiscountMinSize: number;
  groupDiscountPercent: number;
}

// Notification Settings
export interface NotificationSettings {
  emailEnabled: boolean;
  emailProvider: 'smtp' | 'sendgrid' | 'aws-ses' | 'mailgun';
  emailFromAddress: string;
  emailFromName: string;
  smsEnabled: boolean;
  smsProvider: 'twilio' | 'aws-sns' | 'nexmo';
  pushNotificationsEnabled: boolean;
  slackIntegrationEnabled: boolean;
  slackWebhookUrl: string;
  teamsIntegrationEnabled: boolean;
  teamsWebhookUrl: string;
  notificationTemplates: {
    type: string;
    subject: string;
    body: string;
    variables: string[];
  }[];
}

// System Settings
export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logRetentionDays: number;
  enableAnalytics: boolean;
  analyticsProvider: 'google' | 'mixpanel' | 'segment' | 'none';
  enableErrorTracking: boolean;
  errorTrackingProvider: 'sentry' | 'bugsnag' | 'rollbar' | 'none';
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetentionDays: number;
  backupProvider: 'local' | 'aws-s3' | 'google-cloud' | 'azure';
  cachingEnabled: boolean;
  cacheProvider: 'redis' | 'memcached' | 'memory';
  cacheTtlSeconds: number;
}

// Integration Settings
export interface IntegrationSettings {
  apiEnabled: boolean;
  apiRateLimit: number;
  apiKeyRequired: boolean;
  webhooksEnabled: boolean;
  webhookSecret: string;
  calendarIntegration: boolean;
  calendarProvider: 'google' | 'outlook' | 'ical';
  crmIntegration: boolean;
  crmProvider: 'salesforce' | 'hubspot' | 'pipedrive' | 'none';
  paymentGateway: 'stripe' | 'paypal' | 'razorpay' | 'none';
  storageProvider: 'local' | 'aws-s3' | 'google-cloud' | 'azure';
  cdnEnabled: boolean;
  cdnProvider: 'cloudflare' | 'aws-cloudfront' | 'google-cloud-cdn' | 'none';
  ssoEnabled: boolean;
  ssoProvider: 'google' | 'microsoft' | 'okta' | 'auth0' | 'saml' | 'none';
}

// Settings Dashboard Data
export interface SettingsDashboard {
  totalSettings: number;
  customizedSettings: number;
  lastModified: string;
  lastModifiedBy: string;
  backupStatus: {
    lastBackup: string;
    nextBackup: string;
    status: 'success' | 'pending' | 'failed';
  };
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
    cache: 'healthy' | 'warning' | 'error';
    integrations: 'healthy' | 'warning' | 'error';
  };
  recentChanges: SettingHistory[];
}

// Settings Search and Filtering
export interface SettingsFilters {
  category?: SettingCategory;
  search?: string;
  isCustomized?: boolean;
  isRequired?: boolean;
  isSystem?: boolean;
  group?: string;
}

export interface SettingsSearchResult {
  setting: Setting;
  group: SettingsGroup;
  category: SettingsCategory;
  matchScore: number;
  matchReason: 'name' | 'description' | 'key' | 'group' | 'category';
}

// Settings Migration
export interface SettingsMigration {
  id: string;
  version: string;
  description: string;
  migrations: {
    setting: string;
    action: 'add' | 'remove' | 'update' | 'rename';
    oldKey?: string;
    newKey?: string;
    oldValue?: any;
    newValue?: any;
  }[];
  appliedAt?: string;
  appliedBy?: string;
}
