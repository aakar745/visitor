import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

// Configuration
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ExhibitionsModule } from './modules/exhibitions/exhibitions.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { ExhibitorsModule } from './modules/exhibitors/exhibitors.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BadgesModule } from './modules/badges/badges.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { VisitorImportsModule } from './modules/visitor-imports/visitor-imports.module';
import { KioskModule } from './modules/kiosk/kiosk.module';
import { PrintQueueModule } from './modules/print-queue/print-queue.module';
import { OtpQueueModule } from './modules/otp-queue/otp-queue.module';
import { WhatsAppQueueModule } from './modules/whatsapp-queue/whatsapp-queue.module';
import { MeilisearchModule } from './modules/meilisearch/meilisearch.module';

// Guards
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        maxPoolSize: configService.get<number>('database.maxPoolSize', 10),
        minPoolSize: configService.get<number>('database.minPoolSize', 2),
        serverSelectionTimeoutMS: configService.get<number>(
          'database.connectionTimeout',
          30000,
        ),
        socketTimeoutMS: configService.get<number>('database.socketTimeout', 30000),
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('RATE_LIMIT_TTL', 60) * 1000,
            limit: configService.get('RATE_LIMIT_MAX', 100),
          },
        ],
      }),
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Search Engine
    MeilisearchModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    RolesModule,
    ExhibitionsModule,
    VisitorsModule,
    ExhibitorsModule,
    RegistrationsModule,
    LocationsModule,
    PaymentsModule,
    BadgesModule,
    NotificationsModule,
    UploadsModule,
    SettingsModule,
    AnalyticsModule,
    HealthModule,
    VisitorImportsModule,
    KioskModule,
    PrintQueueModule,
    OtpQueueModule,
    WhatsAppQueueModule,
  ],
  providers: [
    // Global guards - order matters!
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting - first line of defense
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Authentication - use @Public() to bypass
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard, // Permission checking - checks user permissions after authentication
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard, // CSRF protection - use @SkipCsrf() to bypass for webhooks
    },
  ],
})
export class AppModule {}

