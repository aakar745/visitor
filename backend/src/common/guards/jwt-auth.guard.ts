import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    this.logger.debug(`Route: ${request.method} ${request.url}, IsPublic: ${isPublic}`);

    if (isPublic) {
      this.logger.debug(`Public route, skipping authentication`);
      return true;
    }

    this.logger.debug(`Protected route, checking authentication`);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    const request = context?.switchToHttp?.()?.getRequest?.();
    const route = request ? `${request.method} ${request.url}` : 'Unknown route';
    
    this.logger.debug(`Route: ${route}`);
    this.logger.debug(`Error: ${err ? err.message : 'None'}`);
    this.logger.debug(`User: ${user ? JSON.stringify({ email: user.email, id: user._id || user.id }) : 'None'}`);
    this.logger.debug(`Info: ${info ? JSON.stringify(info) : 'None'}`);
    
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${err ? err.message : 'User not found'}`);
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    
    this.logger.debug(`User authenticated: ${user.email}`);
    return user;
  }
}

