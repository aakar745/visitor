import { Controller, Post, Body, Get, HttpCode, HttpStatus, Res, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { generateCsrfToken } from '../../common/utils/crypto.util';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 requests per minute for login
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log(`[LOGIN CONTROLLER] Login request for: ${loginDto.email}`);
    
    const result = await this.authService.login(loginDto);
    
    console.log(`[LOGIN CONTROLLER] Login service completed, user role:`, JSON.stringify(result.user.role));
    
    // Set httpOnly cookies for production security
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get('COOKIE_DOMAIN'); // e.g., '.aakarvisitors.in' for subdomain sharing
    
    console.log(`[LOGIN CONTROLLER] Cookie settings - isProduction: ${isProduction}, domain: ${cookieDomain || 'undefined'}`);
    
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'lax' as const, // Lax allows top-level navigation while maintaining security
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: cookieDomain || undefined, // Share cookies across subdomains if configured
    };

    // Set access token cookie (shorter expiry)
    response.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    console.log(`[LOGIN CONTROLLER] AccessToken cookie set (15min expiry)`);

    // Set refresh token cookie (longer expiry)
    response.cookie('refreshToken', result.refreshToken, cookieOptions);
    console.log(`[LOGIN CONTROLLER] RefreshToken cookie set (7day expiry)`);

    // Set fresh CSRF token on login (consistent with token refresh)
    const csrfToken = generateCsrfToken();
    response.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: cookieDomain || undefined, // Share across subdomains if configured
    });
    console.log(`[LOGIN CONTROLLER] CSRF token cookie set`);

    console.log(`[LOGIN CONTROLLER] All cookies set, returning response`);
    
    // Also return tokens in response body for development/localStorage fallback
    return result;
  }

  @Post('logout')
  @SkipCsrf() // Logout doesn't need CSRF protection - prevents session lock if token is missing
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser('_id') userId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Get refresh token from cookie or body
    const refreshToken = (request.cookies?.refreshToken as string) || request.body?.refreshToken;
    
    // Revoke the specific refresh token if provided
    if (refreshToken) {
      try {
        await this.authService.revokeRefreshToken(userId, refreshToken);
      } catch (error) {
        // Log error but don't fail logout
        console.error('Error revoking refresh token:', error);
      }
    }
    
    // Clear httpOnly cookies
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');
    response.clearCookie('XSRF-TOKEN'); // Also clear CSRF token
    
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @SkipCsrf() // Logout doesn't need CSRF protection
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'All sessions logged out successfully' })
  async logoutAll(
    @CurrentUser('_id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Revoke all refresh tokens for this user
    await this.authService.revokeAllRefreshTokens(userId);
    
    // Clear httpOnly cookies for current session
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');
    response.clearCookie('XSRF-TOKEN');
    
    return { message: 'Logged out from all devices successfully' };
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 requests per minute for token refresh
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refresh(
    @Body('refreshToken') refreshTokenFromBody: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Try to get refresh token from cookie first, then fall back to body
    const refreshToken = (request.cookies?.refreshToken as string) || refreshTokenFromBody;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.authService.refreshToken(refreshToken);
    
    // Set new tokens in httpOnly cookies
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const, // Lax allows top-level navigation while maintaining security
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    response.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refreshToken', result.refreshToken, cookieOptions);

    // SECURITY FIX (BUG-010): Refresh CSRF token during token refresh
    // This prevents CSRF token expiry for long-running sessions
    // CSRF tokens expire after 24 hours, but users may stay logged in longer via token refresh
    const cookieDomain = this.configService.get('COOKIE_DOMAIN');
    const csrfToken = generateCsrfToken();
    response.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Must be readable by JavaScript for client to include in headers
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (same as original CSRF token expiry)
      domain: cookieDomain || undefined, // Share across subdomains if configured
    });

    return result;
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('send-whatsapp-otp')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP via WhatsApp' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully via WhatsApp' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async sendWhatsAppOTP(@Body('phoneNumber') phoneNumber: string) {
    return await this.authService.sendWhatsAppOTP(phoneNumber);
  }

  @Post('verify-whatsapp-otp')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify WhatsApp OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyWhatsAppOTP(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ) {
    return await this.authService.verifyWhatsAppOTP(phoneNumber, code);
  }
}

