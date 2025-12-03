import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    // CORS is configured manually below with app.enableCors() - don't enable here
    bodyParser: true,
  });

  const configService = app.get(ConfigService);

  // Increase body size limit for bulk imports (200MB to support lakhs of records)
  app.use(require('express').json({ limit: '200mb' }));
  app.use(require('express').urlencoded({ limit: '200mb', extended: true }));

  // Security - Configure Helmet with comprehensive security headers
  if (configService.get('ENABLE_HELMET', true)) {
    app.use(
      helmet({
        // Allow cross-origin resource access for uploads
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        
        // Content Security Policy
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'blob:', '*'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
        
        // HSTS - Force HTTPS for 1 year
        strictTransportSecurity: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        
        // Prevent clickjacking
        frameguard: { action: 'deny' },
        
        // Prevent MIME type sniffing
        noSniff: true,
        
        // Referrer Policy
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        
        // Hide X-Powered-By header
        hidePoweredBy: true,
        
        // XSS filter (legacy browsers)
        xssFilter: true,
      }),
    );
    
    // Permissions Policy (not included in helmet by default)
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      );
      next();
    });
  }

  // Compression
  if (configService.get('ENABLE_COMPRESSION', true)) {
    app.use(compression());
  }

  // Cookie parser
  app.use(cookieParser());

  // Static file serving for uploads with CORS support
  // NOTE: /uploads/badges/ is handled by BadgesController for on-demand generation
  const path = require('path');
  const fs = require('fs');
  const express = require('express');
  
  // Resolve upload directory to absolute path (required for res.sendFile)
  const uploadDirRaw = configService.get('UPLOAD_DIR', './uploads');
  const uploadDir = path.isAbsolute(uploadDirRaw) 
    ? uploadDirRaw 
    : path.resolve(process.cwd(), uploadDirRaw);
  
  // Middleware to intercept badge requests and pass them to controller
  app.use('/uploads/badges', (req: any, res: any, next: any) => {
    // Let BadgesController handle all badge requests (don't try static serving)
    next();
  });
  
  // Serve other uploads statically  
  app.use('/uploads', (req: any, res: any, next: any) => {
    // If request is for badges, skip static serving
    if (req.url.startsWith('/badges/')) {
      return next('route'); // Skip to next route handler (controller)
    }
    
    // Serve static files for non-badge uploads
    const filePath = path.join(uploadDir, req.url);
    fs.access(filePath, fs.constants.F_OK, (err: any) => {
      if (err) {
        return next(); // File doesn't exist, continue
      }
      // File exists, serve it
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.sendFile(filePath);
    });
  });
  
  console.log(`📁 Static files served from: ${uploadDir} at /uploads/ (CORS enabled)`);
  console.log(`🎨 Badge generation: On-demand via BadgesController`);

  // CORS configuration
  const corsOriginsString = configService.get<string>('CORS_ORIGINS') || 'http://localhost:5173';
  const corsOrigins = corsOriginsString.split(',').map(origin => origin.trim());
  
  console.log('🔒 CORS Configuration:');
  // Security: Don't log full origin list in production (might contain internal URLs)
  if (process.env.NODE_ENV === 'production') {
    console.log(`   Allowed Origins: ${corsOrigins.length} origin(s) configured`);
  } else {
    console.log('   Allowed Origins:', corsOrigins);
  }
  console.log('   Credentials: true');
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (corsOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️  Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Must be true for cookies/credentials
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'X-Requested-With',
      'x-csrf-token', // Required for CSRF protection
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // API prefix and versioning (exclude /uploads from API prefix)
  app.setGlobalPrefix('api', {
    exclude: ['uploads/badges/*path'], // Exclude badge routes from /api prefix
  });
  
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  if (configService.get('ENABLE_VALIDATION_PIPE', true)) {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
        transform: true, // Transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
  }

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger API documentation
  if (configService.get('ENABLE_SWAGGER', true)) {
    const config = new DocumentBuilder()
      .setTitle(configService.get('APP_NAME', 'Visitor Management System'))
      .setDescription('Enterprise-grade API for visitor and exhibition management')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management')
      .addTag('Roles', 'Role and permissions management')
      .addTag('Exhibitions', 'Exhibition management')
      .addTag('Visitors', 'Visitor management')
      .addTag('Exhibitors', 'Exhibitor management')
      .addTag('Payments', 'Payment processing')
      .addTag('Badges', 'Badge generation')
      .addTag('Notifications', 'Email and SMS notifications')
      .addTag('Settings', 'System settings')
      .addTag('Analytics', 'Analytics and reporting')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');
  
  await app.listen(port, host);

  console.log(`
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🚀 Visitor Management System API                           ║
    ║                                                               ║
    ║   Environment: ${configService.get('NODE_ENV', 'development').padEnd(48)} ║
    ║   Server:      http://${host}:${port.toString().padEnd(39)} ║
    ║   API Docs:    http://${host}:${port}/api/docs${' '.repeat(26)} ║
    ║   Health:      http://${host}:${port}/health${' '.repeat(29)} ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();

