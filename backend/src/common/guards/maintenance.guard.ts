import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(SettingsService) private settingsService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if maintenance mode is active
    const isMaintenanceActive = await this.settingsService.isMaintenanceModeActive();
    
    if (!isMaintenanceActive) {
      return true; // Not in maintenance mode, allow access
    }

    // In maintenance mode, check if this is an admin route
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Allow admin routes and maintenance status check
    if (
      url.includes('/api/v1/admin') ||
      url.includes('/api/v1/auth') ||
      url.includes('/api/v1/settings') ||
      url.includes('/health')
    ) {
      return true; // Allow admin access during maintenance
    }

    // Block all other routes
    const maintenanceStatus = await this.settingsService.getMaintenanceStatus();
    throw new ServiceUnavailableException({
      statusCode: 503,
      message: maintenanceStatus.message || 'System is under maintenance. Please check back later.',
      maintenanceMode: true,
      startedAt: maintenanceStatus.startedAt,
    });
  }
}

