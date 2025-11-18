#!/usr/bin/env node

/**
 * Generate Secure JWT Secrets
 * 
 * This script generates cryptographically secure random secrets
 * for JWT authentication.
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 *   npm run generate:secrets
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

console.log('\n' + colors.bright + colors.cyan + '🔐 JWT Secret Generator' + colors.reset + '\n');

// Generate secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
const sessionSecret = crypto.randomBytes(64).toString('hex');
const webhookSecret = crypto.randomBytes(32).toString('hex');

console.log(colors.green + '✅ Generated secure secrets:' + colors.reset + '\n');

console.log(colors.bright + 'JWT_SECRET:' + colors.reset);
console.log(jwtSecret + '\n');

console.log(colors.bright + 'JWT_REFRESH_SECRET:' + colors.reset);
console.log(jwtRefreshSecret + '\n');

console.log(colors.bright + 'SESSION_SECRET:' + colors.reset);
console.log(sessionSecret + '\n');

console.log(colors.bright + 'WEBHOOK_SECRET:' + colors.reset);
console.log(webhookSecret + '\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envExists = fs.existsSync(envPath);
const envLocalExists = fs.existsSync(envLocalPath);

if (!envExists && !envLocalExists) {
  console.log(colors.yellow + '⚠️  No .env file found.' + colors.reset);
  console.log('\nWould you like to create one? (Y/n): ');
  
  // In non-interactive mode, create instructions file
  const envContent = `# ==================================
# JWT AUTHENTICATION
# ==================================
# Generated on ${new Date().toISOString()}
# KEEP THESE SECRETS SECURE - DO NOT COMMIT TO GIT

JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=${sessionSecret}

# Webhook Secret
WEBHOOK_SECRET=${webhookSecret}

# ==================================
# COPY ALL SETTINGS FROM env.example.txt
# ==================================
# This file only contains the generated secrets.
# Copy other configuration from env.example.txt:
#   - Database settings
#   - CORS origins
#   - Email/SMS settings
#   - etc.
`;

  const instructionsPath = path.join(__dirname, '..', '.env.generated');
  fs.writeFileSync(instructionsPath, envContent);
  
  console.log(colors.green + '\n✅ Secrets saved to: .env.generated' + colors.reset);
  console.log(colors.yellow + '\n📝 Next steps:' + colors.reset);
  console.log('   1. Rename .env.generated to .env');
  console.log('   2. Copy other settings from env.example.txt');
  console.log('   3. Update values as needed for your environment\n');
} else {
  const targetFile = envLocalExists ? '.env.local' : '.env';
  console.log(colors.yellow + '\n⚠️  .env file already exists.' + colors.reset);
  console.log(colors.bright + '\nTo update your secrets:' + colors.reset);
  console.log(`   1. Open ${targetFile}`);
  console.log('   2. Replace the following values:');
  console.log(`      JWT_SECRET=${jwtSecret}`);
  console.log(`      JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  console.log(`      SESSION_SECRET=${sessionSecret}`);
  console.log(`      WEBHOOK_SECRET=${webhookSecret}\n`);
}

console.log(colors.cyan + '🔒 Security Tips:' + colors.reset);
console.log('   • Never commit .env files to git');
console.log('   • Use different secrets for each environment');
console.log('   • Rotate secrets periodically (every 90 days)');
console.log('   • Store production secrets in a secure vault');
console.log('   • Each secret should be at least 64 characters\n');

console.log(colors.green + '✨ Done!\n' + colors.reset);

