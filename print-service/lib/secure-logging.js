/**
 * Secure Logging Utilities for Print Service
 * 
 * Provides helper functions to safely log configuration and sensitive data
 * without exposing passwords, API keys, tokens, or other secrets.
 * 
 * Usage:
 *   const { maskSensitiveValue, isConfigured, logRedisConfig } = require('./lib/secure-logging');
 * 
 *   console.log('API Key:', maskSensitiveValue(apiKey));
 *   console.log(logRedisConfig({ host: 'redis.example.com', port: 6379, password: 'secret' }));
 */

/**
 * Mask a sensitive value (password, API key, token, secret)
 * Shows only that the value is set and its length
 * 
 * @param {string|null|undefined} value - The sensitive value to mask
 * @param {boolean} showLength - Whether to show the length (default: true)
 * @returns {string} Masked string representation
 * 
 * @example
 * maskSensitiveValue('mySecretPassword123')  // Returns: '***SET (19 chars)***'
 * maskSensitiveValue(null)                   // Returns: '(NOT SET)'
 */
function maskSensitiveValue(value, showLength = true) {
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
 * 
 * @param {string|null|undefined} value - The value to check
 * @returns {string} '✓' if configured, '✗' if not
 * 
 * @example
 * console.log(`Auth: ${isConfigured(password)}`)  // Output: Auth: ✓
 */
function isConfigured(value) {
  return value && value.trim() !== '' ? '✓' : '✗';
}

/**
 * Format Redis configuration for safe logging
 * 
 * @param {Object} config - Redis configuration
 * @param {string} config.host - Redis host
 * @param {number} config.port - Redis port
 * @param {string} [config.password] - Redis password (will be masked)
 * @param {number} [config.db] - Redis database number
 * @returns {string} Safe log string
 * 
 * @example
 * logRedisConfig({ host: 'localhost', port: 6379, password: 'secret', db: 0 })
 * // Returns: 'Redis: localhost:6379 (DB: 0, Auth: ✓)'
 */
function logRedisConfig(config) {
  const authStatus = isConfigured(config.password);
  const db = config.db !== undefined ? `, DB: ${config.db}` : '';
  return `Redis: ${config.host}:${config.port} (Auth: ${authStatus}${db})`;
}

/**
 * Check if a key name suggests sensitive data
 * 
 * @param {string} key - The key/field name to check
 * @returns {boolean} true if sensitive
 * 
 * @example
 * isSensitiveKey('API_KEY')      // true
 * isSensitiveKey('password')     // true
 * isSensitiveKey('username')     // false
 */
function isSensitiveKey(key) {
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
 * Mask configuration object for safe logging
 * Automatically masks sensitive values based on key names
 * 
 * @param {Object} config - Configuration object
 * @returns {Object} Object with masked sensitive values
 * 
 * @example
 * maskConfig({ NODE_ENV: 'prod', API_KEY: 'secret123', PORT: 3000 })
 * // { NODE_ENV: 'prod', API_KEY: '***SET (9 chars)***', PORT: 3000 }
 */
function maskConfig(config) {
  const masked = {};
  
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
 * Mask connection string to hide credentials
 * 
 * @param {string} uri - Connection string (MongoDB, PostgreSQL, etc.)
 * @returns {string} Masked connection string
 * 
 * @example
 * maskConnectionString('mongodb://user:pass@localhost:27017/db')
 * // Returns: 'mongodb://***:***@localhost:27017/db'
 */
function maskConnectionString(uri) {
  if (!uri) {
    return '(NOT SET)';
  }
  
  // Replace username:password with ***:***
  return uri.replace(
    /(mongodb(?:\+srv)?|postgresql|mysql):\/\/([^:]+):([^@]+)@/,
    '$1://***:***@'
  );
}

/**
 * Mask environment variables in error messages
 * Useful for safely logging error details without exposing secrets
 * 
 * @param {string} errorMessage - Error message that might contain env vars
 * @returns {string} Sanitized error message
 * 
 * @example
 * maskEnvInError('Connection failed: password=secret123 host=localhost')
 * // Returns: 'Connection failed: password=*** host=localhost'
 */
function maskEnvInError(errorMessage) {
  if (!errorMessage) {
    return '';
  }
  
  // Mask common patterns: key=value where key is sensitive
  return errorMessage.replace(
    /(password|secret|key|token|auth|credential)=([^\s&]+)/gi,
    '$1=***'
  );
}

module.exports = {
  maskSensitiveValue,
  isConfigured,
  logRedisConfig,
  isSensitiveKey,
  maskConfig,
  maskConnectionString,
  maskEnvInError,
};

