import { registerAs } from '@nestjs/config';

/**
 * JWT Configuration
 * 
 * SECURITY: JWT secrets are REQUIRED in all environments.
 * Never use default/hardcoded secrets - always set via environment variables.
 * 
 * To generate secure secrets, run:
 *   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
 * 
 * Or use the setup script:
 *   npm run setup:env
 */
export const jwtConfig = registerAs('jwt', () => {
  // Validate JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    throw new Error(
      '❌ CRITICAL: JWT_SECRET is not set!\n\n' +
      'JWT_SECRET is required for authentication to work.\n' +
      'Please set it in your .env file.\n\n' +
      'To generate a secure secret, run:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n\n' +
      'Then add to .env:\n' +
      '  JWT_SECRET=<generated_secret>\n'
    );
  }

  // Validate JWT_REFRESH_SECRET exists
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      '❌ CRITICAL: JWT_REFRESH_SECRET is not set!\n\n' +
      'JWT_REFRESH_SECRET is required for token refresh to work.\n' +
      'Please set it in your .env file.\n\n' +
      'To generate a secure secret, run:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n\n' +
      'Then add to .env:\n' +
      '  JWT_REFRESH_SECRET=<generated_secret>\n\n' +
      'NOTE: Use a DIFFERENT secret than JWT_SECRET!\n'
    );
  }

  // Additional security: Ensure secrets are different
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      '❌ SECURITY ERROR: JWT_SECRET and JWT_REFRESH_SECRET must be different!\n\n' +
      'Using the same secret for both access and refresh tokens is a security risk.\n' +
      'Please generate two different secrets.\n'
    );
  }

  // Additional security: Validate secret strength in production
  if (process.env.NODE_ENV === 'production') {
    const minLength = 64; // Minimum 64 characters for production

    if (process.env.JWT_SECRET.length < minLength) {
      throw new Error(
        `❌ SECURITY ERROR: JWT_SECRET is too short!\n\n` +
        `Production JWT secrets must be at least ${minLength} characters long.\n` +
        `Current length: ${process.env.JWT_SECRET.length}\n\n` +
        `Generate a strong secret using:\n` +
        `  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"\n`
      );
    }

    if (process.env.JWT_REFRESH_SECRET.length < minLength) {
      throw new Error(
        `❌ SECURITY ERROR: JWT_REFRESH_SECRET is too short!\n\n` +
        `Production JWT secrets must be at least ${minLength} characters long.\n` +
        `Current length: ${process.env.JWT_REFRESH_SECRET.length}\n\n` +
        `Generate a strong secret using:\n` +
        `  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"\n`
      );
    }

    // Check for placeholder values
    const placeholderPatterns = [
      'CHANGE_THIS',
      'REPLACE_WITH',
      'YOUR_SECRET',
      'EXAMPLE',
      'TEST',
      'dev-jwt-secret',
    ];

    const secretHasPlaceholder = placeholderPatterns.some(pattern => 
      process.env.JWT_SECRET?.includes(pattern) || 
      process.env.JWT_REFRESH_SECRET?.includes(pattern)
    );

    if (secretHasPlaceholder) {
      throw new Error(
        '❌ SECURITY ERROR: JWT secrets contain placeholder values!\n\n' +
        'Please replace placeholder secrets with actual secure random values.\n' +
        'Run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n'
      );
    }
  }

  return {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
});

