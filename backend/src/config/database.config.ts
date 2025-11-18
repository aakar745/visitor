import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Validate required database config in production
  if (isProduction && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production environment');
  }

  return {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
    database: process.env.MONGODB_DATABASE || 'visitor_management',
    authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
    connectionTimeout: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT || '30000', 10),
    socketTimeout: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '30000', 10),
  };
});

