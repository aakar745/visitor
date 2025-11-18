import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  name: process.env.APP_NAME || 'Visitor Management System',
  url: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,hi').split(','),
}));

