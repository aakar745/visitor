/**
 * Secure Logging Utilities
 * 
 * Provides helper functions to safely log configuration and sensitive data
 * without exposing passwords, API keys, tokens, or other secrets.
 * 
 * Usage:
 *   import { maskSensitiveValue, logRedisConfig, maskConnectionString } from '@/common/utils/secure-logging.util';
 * 
 *   // Mask sensitive values
 *   console.log('API Key:', maskSensitiveValue(apiKey));  // Output: API Key: ***SET (32 chars)***
 * 
 *   // Log Redis configuration safely
 *   logRedisConfig({ host: 'redis.example.com', port: 6379, password: 'secret123' });
 */

/**
 * Mask a sensitive value (password, API key, token, secret)
 * Shows only that the value is set and its length (without exposing the actual value)
 * 
 * @param value - The sensitive value to mask
 * @param showLength - Whether to show the length of the value (default: true)
 * @returns Masked string representation
 * 
 * @example
 * maskSensitiveValue('mySecretPassword123')  // Returns: '***SET (19 chars)***'
 * maskSensitiveValue(null)                   // Returns: '(NOT SET)'
 * maskSensitiveValue('key', false)           // Returns: '***SET***'
 */
export function maskSensitiveValue(
  value: string | undefined | null,
  showLength: boolean = true
): string {
  if (!value || value.trim() === '') {
    return '(NOT SET)';
  }
  
  if (showLength) {
    return `***SET (${value.length} chars)***`;
  }
  
  return '***SET***';
}

/**
 * Check if a value is configured (set and non-empty)
 * Useful for logging configuration status without exposing values
 * 
 * @param value - The value to check
 * @returns '✓' if configured, '✗' if not
 * 
 * @example
 * console.log(`Auth: ${isConfigured(password)}`)  // Output: Auth: ✓
 */
export function isConfigured(value: string | undefined | null): string {
  return value && value.trim() !== '' ? '✓' : '✗';
}

/**
 * Safely log Redis configuration without exposing password
 * 
 * @param config - Redis configuration object
 * 
 * @example
 * logRedisConfig({
 *   host: 'localhost',
 *   port: 6379,
 *   password: 'secret123',
 *   db: 0
 * });
 * // Logs: Redis: localhost:6379 (DB: 0, Auth: ✓)
 */
export function logRedisConfig(config: {
  host: string;
  port: number;
  password?: string;
  db?: number;
}): string {
  const authStatus = isConfigured(config.password);
  const db = config.db !== undefined ? `, DB: ${config.db}` : '';
  return `Redis: ${config.host}:${config.port} (Auth: ${authStatus}${db})`;
}

/**
 * Mask MongoDB connection string to hide credentials
 * 
 * @param uri - MongoDB connection string
 * @returns Masked connection string
 * 
 * @example
 * maskConnectionString('mongodb://user:pass123@localhost:27017/db')
 * // Returns: 'mongodb://***:***@localhost:27017/db'
 * 
 * maskConnectionString('mongodb+srv://user:pass@cluster.mongodb.net/db')
 * // Returns: 'mongodb+srv://***:***@cluster.mongodb.net/db'
 */
export function maskConnectionString(uri: string): string {
  if (!uri) {
    return '(NOT SET)';
  }
  
  // Replace username:password with ***:***
  // Handles both mongodb:// and mongodb+srv:// protocols
  return uri.replace(
    /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
    '$1***:***@'
  );
}

/**
 * Mask URL with credentials
 * 
 * @param url - URL that may contain credentials
 * @returns Masked URL
 * 
 * @example
 * maskUrl('https://user:password@api.example.com/path')
 * // Returns: 'https://***:***@api.example.com/path'
 */
export function maskUrl(url: string): string {
  if (!url) {
    return '(NOT SET)';
  }
  
  // Replace username:password with ***:***
  return url.replace(
    /(https?:\/\/)([^:]+):([^@]+)@/,
    '$1***:***@'
  );
}

/**
 * Check if a string contains sensitive keywords
 * Useful for determining if a value should be masked
 * 
 * @param key - The key/field name to check
 * @returns true if the key suggests sensitive data
 * 
 * @example
 * isSensitiveKey('API_KEY')      // true
 * isSensitiveKey('password')     // true
 * isSensitiveKey('username')     // false
 */
export function isSensitiveKey(key: string): boolean {
  const sensitivePatterns = [
    'PASSWORD',
    'SECRET',
    'KEY',
    'TOKEN',
    'PRIVATE',
    'CREDENTIAL',
    'AUTH',
  ];
  
  const upperKey = key.toUpperCase();
  return sensitivePatterns.some(pattern => upperKey.includes(pattern));
}

/**
 * Safely log environment configuration
 * Automatically masks sensitive values based on key names
 * 
 * @param config - Object with configuration key-value pairs
 * @returns Object with masked sensitive values
 * 
 * @example
 * const config = {
 *   NODE_ENV: 'production',
 *   API_KEY: 'secret123',
 *   DATABASE_URL: 'postgresql://user:pass@localhost/db',
 *   PORT: 3000
 * };
 * 
 * console.log(maskConfig(config));
 * // {
 * //   NODE_ENV: 'production',
 * //   API_KEY: '***SET (9 chars)***',
 * //   DATABASE_URL: '***SET (47 chars)***',
 * //   PORT: 3000
 * // }
 */
export function maskConfig(config: Record<string, any>): Record<string, any> {
  const masked: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (isSensitiveKey(key)) {
      masked[key] = maskSensitiveValue(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

/**
 * Format origin list for safe logging
 * In production, only shows count to avoid exposing internal URLs
 * 
 * @param origins - Array of allowed origins
 * @param isProduction - Whether running in production
 * @returns Safe string representation
 * 
 * @example
 * formatOrigins(['http://localhost:3000', 'https://app.example.com'], false)
 * // Returns: ['http://localhost:3000', 'https://app.example.com']
 * 
 * formatOrigins(['http://localhost:3000', 'https://app.example.com'], true)
 * // Returns: '2 origin(s) configured'
 */
export function formatOrigins(origins: string[], isProduction: boolean): string | string[] {
  if (isProduction) {
    return `${origins.length} origin(s) configured`;
  }
  return origins;
}

