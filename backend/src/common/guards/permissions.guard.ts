import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);
  private readonly superAdminRoleName: string;

  constructor(
    private reflector: Reflector,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    this.superAdminRoleName = this.configService.get<string>('app.superAdminRoleName', 'super_admin');
  }

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required permissions for this route
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn(`No user found in request`);
      throw new ForbiddenException('User not authenticated');
    }

    // Super Admin bypass: Check if user's role name matches configured super admin role
    const userRoleName =
      typeof user.role === 'string'
        ? user.role
        : user.role?.name || user.role?._id;

    if (userRoleName === this.superAdminRoleName) {
      this.logger.debug(`Super Admin detected, bypassing permission check`);
      return true;
    }

    // Get user's permissions from their role
    const userPermissions: string[] = [];

    if (user.role && typeof user.role === 'object') {
      const rolePermissions = user.role.permissions || [];
      rolePermissions.forEach((perm: any) => {
        if (typeof perm === 'string') {
          userPermissions.push(perm);
        } else if (perm && perm.id) {
          userPermissions.push(perm.id);
        }
      });
    }

    this.logger.debug(`Route: ${request.method} ${request.url}`);
    this.logger.debug(`Required: ${requiredPermissions.join(', ')}`);
    this.logger.debug(`User has: ${userPermissions.join(', ')}`);

    // Check if user has ANY of the required permissions
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      this.logger.warn(
        `Access denied for user ${user.email}. Required: [${requiredPermissions.join(', ')}], Has: [${userPermissions.join(', ')}]`,
      );
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    this.logger.debug(`Access granted for user ${user.email}`);
    return true;
  }
}

