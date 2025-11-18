import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly CSRF_COOKIE_NAME = 'XSRF-TOKEN';
  private readonly CSRF_HEADER_NAME = 'x-csrf-token';

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate and set CSRF token for safe methods
      if (!req.cookies[this.CSRF_COOKIE_NAME]) {
        const token = this.generateToken();
        res.cookie(this.CSRF_COOKIE_NAME, token, {
          httpOnly: false, // Must be readable by JavaScript
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // Lax allows top-level navigation while maintaining CSRF protection
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
      }
      return next();
    }

    // For unsafe methods (POST, PUT, DELETE, PATCH), validate CSRF token
    const cookieToken = req.cookies[this.CSRF_COOKIE_NAME];
    const headerToken = req.headers[this.CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    next();
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

