import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * @param permissions - Array of permission IDs required to access the route
 * 
 * @example
 * @RequirePermissions('users.view')
 * @Get()
 * findAll() { }
 * 
 * @example Multiple permissions (user needs ANY of them)
 * @RequirePermissions('users.view', 'users.export')
 * @Get('export')
 * export() { }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

