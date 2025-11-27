import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { generateCsrfToken } from '../utils/crypto.util';

/**
 * CSRF Guard - Protects against Cross-Site Request Forgery attacks
 * Can be applied globally or per-controller/route
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly CSRF_COOKIE_NAME = 'XSRF-TOKEN';
  private readonly CSRF_HEADER_NAME = 'x-csrf-token';

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if CSRF should be skipped for this route
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    // Also skip for public routes (they don't have session state to protect)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      // Generate token if it doesn't exist
      if (!request.cookies[this.CSRF_COOKIE_NAME]) {
        const token = generateCsrfToken();
        response.cookie(this.CSRF_COOKIE_NAME, token, {
          httpOnly: false, // Must be readable by JavaScript
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // Lax allows top-level navigation while maintaining CSRF protection
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
      }
      return true;
    }

    // For unsafe methods, validate CSRF token
    const cookieToken = request.cookies[this.CSRF_COOKIE_NAME];
    const headerToken = request.headers[this.CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }
}

