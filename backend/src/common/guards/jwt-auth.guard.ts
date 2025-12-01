import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log(`[JWT GUARD] Route: ${request.method} ${request.url}, IsPublic: ${isPublic}`);

    if (isPublic) {
      console.log(`[JWT GUARD] Public route, skipping authentication`);
      return true;
    }

    console.log(`[JWT GUARD] Protected route, checking authentication`);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    const request = context?.switchToHttp?.()?.getRequest?.();
    const route = request ? `${request.method} ${request.url}` : 'Unknown route';
    
    console.log(`[JWT GUARD HANDLE] Route: ${route}`);
    console.log(`[JWT GUARD HANDLE] Error: ${err ? err.message : 'None'}`);
    console.log(`[JWT GUARD HANDLE] User: ${user ? JSON.stringify({ email: user.email, id: user._id || user.id }) : 'None'}`);
    console.log(`[JWT GUARD HANDLE] Info: ${info ? JSON.stringify(info) : 'None'}`);
    
    if (err || !user) {
      console.error(`[JWT GUARD FAILED] ${err ? err.message : 'User not found'}`);
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    
    console.log(`[JWT GUARD SUCCESS] User authenticated: ${user.email}`);
    return user;
  }
}

