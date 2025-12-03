import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { Otp, OtpDocument, OtpType } from '../../database/schemas/otp.schema';
import { WhatsAppOtpService } from '../../services/whatsapp-otp.service';
import { RedisLockService } from '../../common/services/redis-lock.service';
import { normalizePhoneNumberE164 } from '../../common/utils/sanitize.util';
import { LoginDto } from './dto/login.dto';
import { ERR_AUTH, ERR_OTP } from '../../common/constants/error-messages';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // Authentication configuration (from environment/config)
  private readonly MAX_REFRESH_TOKENS: number;
  private readonly MAX_LOGIN_ATTEMPTS: number;
  private readonly LOCKOUT_DURATION_MS: number;
  
  // OTP configuration
  private readonly OTP_EXPIRY_MS: number;
  private readonly OTP_MAX_ATTEMPTS: number;
  private readonly OTP_RESEND_COOLDOWN_MS: number;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private jwtService: JwtService,
    private whatsAppOtpService: WhatsAppOtpService,
    private redisLockService: RedisLockService,
    private configService: ConfigService,
  ) {
    // Load auth configuration
    this.MAX_REFRESH_TOKENS = this.configService.get<number>('app.auth.maxRefreshTokens', 5);
    this.MAX_LOGIN_ATTEMPTS = this.configService.get<number>('app.auth.maxLoginAttempts', 5);
    this.LOCKOUT_DURATION_MS = this.configService.get<number>('app.auth.lockoutDurationMinutes', 15) * 60 * 1000;
    
    // Load OTP configuration
    this.OTP_EXPIRY_MS = this.configService.get<number>('app.otp.expiryMinutes', 10) * 60 * 1000;
    this.OTP_MAX_ATTEMPTS = this.configService.get<number>('app.otp.maxAttempts', 5);
    this.OTP_RESEND_COOLDOWN_MS = this.configService.get<number>('app.otp.resendCooldownSeconds', 60) * 1000;
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`[LOGIN START] Email: ${loginDto.email}`);
    
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      this.logger.warn(`[LOGIN FAILED] Invalid credentials for: ${loginDto.email}`);
      throw new UnauthorizedException(ERR_AUTH.INVALID_CREDENTIALS);
    }

    this.logger.log(`[LOGIN SUCCESS] User validated: ${user.email}, ID: ${user._id}, Role: ${JSON.stringify(user.role)}`);

    // ✅ FIX: Only include role ID in JWT to keep token size small
    // Full role with permissions will be fetched when needed via JWT strategy
    const roleId = typeof user.role === 'object' && (user.role as any)._id 
      ? (user.role as any)._id.toString() 
      : user.role.toString();
    
    const payload = { 
      sub: user._id, 
      email: user.email, 
      role: roleId // Only role ID, not full role object
    };
    this.logger.debug(`[JWT PAYLOAD] ${JSON.stringify(payload)}`);
    
    // Generate new tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    this.logger.log(`[TOKENS GENERATED] AccessToken length: ${accessToken.length}, RefreshToken length: ${refreshToken.length}`);
    
    if (accessToken.length > 4000) {
      this.logger.warn(`[TOKEN SIZE WARNING] Token size (${accessToken.length} chars) is large but should fit in cookie (4KB browser limit = ~4000 chars)`);
    } else {
      this.logger.log(`[TOKEN SIZE OK] Token size (${accessToken.length} chars) is within safe limits for cookies`);
    }
    
    // Store refresh token in user document
    await this.storeRefreshToken(user._id.toString(), refreshToken);
    this.logger.debug(`[REFRESH TOKEN STORED] User: ${user._id}`);
    
    // Update last login info
    await this.userModel.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
      loginAttempts: 0, // Reset login attempts on successful login
      lockedUntil: null, // Clear any account lock
    });
    
    this.logger.log(`[LOGIN COMPLETE] User: ${user.email}, returning tokens and user data`);
    
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role, // Return full role in response body (not in JWT)
      },
      accessToken,
      refreshToken,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    this.logger.debug(`[VALIDATE USER] Looking up: ${email}`);
    const user = await this.userModel.findOne({ email }).select('+password').populate('role');
    
    if (!user) {
      this.logger.warn(`[VALIDATE USER] User not found: ${email}`);
      return null;
    }
    
    this.logger.debug(`[VALIDATE USER] Found user: ${email}, Status: ${user.status}, IsActive: ${user.isActive}, Role: ${JSON.stringify(user.role)}`);
    this.logger.debug(`[VALIDATE USER] Role type: ${typeof user.role}, Is Object: ${typeof user.role === 'object'}, Has _id: ${(user.role as any)?._id ? 'YES' : 'NO'}`);
    
    if (user.role && typeof user.role === 'object' && (user.role as any)._id) {
      this.logger.debug(`[VALIDATE USER] Populated Role Details - ID: ${(user.role as any)._id}, Name: ${(user.role as any).name || 'N/A'}`);
    }

    // Check if account is inactive or deactivated
    if (!user.isActive || user.status === 'inactive') {
      this.logger.warn(`Login attempt for inactive account: ${email}. Status: ${user.status}, IsActive: ${user.isActive}`);
      throw new UnauthorizedException(ERR_AUTH.ACCOUNT_DEACTIVATED);
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      this.logger.warn(`Login attempt for locked account: ${email}. Locked for ${remainingTime} more minutes.`);
      throw new UnauthorizedException(ERR_AUTH.ACCOUNT_LOCKED(remainingTime));
    }

    // If lock time has expired, reset login attempts
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.userModel.findByIdAndUpdate(user._id, {
        loginAttempts: 0,
        lockedUntil: null,
      });
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
    }
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      const { password, ...result } = user.toObject();
      return result;
    }

    // Password is invalid - increment login attempts
    const newLoginAttempts = user.loginAttempts + 1;
    const updates: any = { loginAttempts: newLoginAttempts };

    // Lock account if max attempts reached
    if (newLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
      this.logger.warn(`Account locked due to ${this.MAX_LOGIN_ATTEMPTS} failed login attempts: ${email}`);
    }

    await this.userModel.findByIdAndUpdate(user._id, updates);

    // Provide feedback about remaining attempts
    const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - newLoginAttempts;
    if (remainingAttempts > 0) {
      this.logger.warn(`Failed login attempt for ${email}. ${remainingAttempts} attempt(s) remaining.`);
    }
    
    return null;
  }

  /**
   * Refresh access token using refresh token
   * 
   * SECURITY FIX (BUG-007):
   * Uses atomic token rotation to prevent race conditions.
   * Only ONE request can successfully use a specific refresh token.
   * 
   * Race condition protection timeline:
   * - Request A: Atomic update with condition (token exists) → Success
   * - Request B: Atomic update with condition (token exists) → Fails (already removed)
   * 
   * This prevents token reuse attacks where an attacker intercepts a token
   * and tries to use it before the legitimate request completes.
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify JWT signature and expiration
      const payload = this.jwtService.verify(refreshToken);
      
      // Find user and validate token is in stored refresh tokens
      const user = await this.userModel.findById(payload.sub).exec();
      
      if (!user) {
        throw new UnauthorizedException(ERR_AUTH.USER_NOT_FOUND);
      }

      // Check if user account is active
      if (!user.isActive) {
        throw new UnauthorizedException(ERR_AUTH.ACCOUNT_DEACTIVATED);
      }

      // Clean up expired tokens before validation
      await this.cleanupExpiredTokens(user._id.toString());
      
      // Generate new tokens BEFORE rotation
      const newPayload = { sub: user._id, email: user.email, role: user.role };
      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });
      
      // ATOMIC: Rotate refresh token with conditional update (BUG-007 FIX)
      // This ensures only ONE request can successfully use a specific refresh token
      const rotationSuccess = await this.rotateRefreshTokenAtomic(
        user._id.toString(),
        refreshToken,
        newRefreshToken,
      );

      if (!rotationSuccess) {
        this.logger.warn(`Invalid or already-used refresh token for user ${user.email}`);
        throw new UnauthorizedException(ERR_AUTH.REFRESH_TOKEN_USED);
      }
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Refresh token error: ${error.message}`);
      throw new UnauthorizedException(ERR_AUTH.REFRESH_TOKEN_INVALID);
    }
  }

  /**
   * Store refresh token in user document
   * Implements token limit to prevent unlimited growth
   */
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new UnauthorizedException(ERR_AUTH.USER_NOT_FOUND);
    }

    // Initialize array if it doesn't exist
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }

    // Add new token
    user.refreshTokens.push(refreshToken);

    // Keep only the most recent tokens (FIFO: remove oldest if limit exceeded)
    if (user.refreshTokens.length > this.MAX_REFRESH_TOKENS) {
      user.refreshTokens = user.refreshTokens.slice(-this.MAX_REFRESH_TOKENS);
      this.logger.debug(`Token limit reached for user ${user.email}, removed oldest tokens`);
    }

    await user.save();
  }

  /**
   * Atomic refresh token rotation with race condition protection
   * 
   * SECURITY FIX (BUG-007):
   * Uses conditional update to ensure only ONE request can successfully rotate a token.
   * If the token doesn't exist in the array, the update returns null (token already used).
   * 
   * Uses aggregation pipeline to avoid MongoDB conflict when modifying same array field.
   * 
   * @returns true if rotation succeeded, false if token was already used/invalid
   */
  private async rotateRefreshTokenAtomic(
    userId: string,
    oldToken: string,
    newToken: string,
  ): Promise<boolean> {
    // ATOMIC OPERATION: Only update if old token exists
    // This prevents race conditions where two requests use the same token
    // Uses aggregation pipeline to filter out old token and add new token atomically
    const result = await this.userModel.findOneAndUpdate(
      {
        _id: userId,
        refreshTokens: oldToken, // ✅ Condition: token must exist
      },
      [
        {
          $set: {
            refreshTokens: {
              $concatArrays: [
                {
                  $filter: {
                    input: '$refreshTokens',
                    cond: { $ne: ['$$this', oldToken] }
                  }
                },
                [newToken]
              ]
            }
          }
        }
      ],
      { new: true },
    ).exec();

    // If result is null, the token didn't exist (already used or invalid)
    return result !== null;
  }


  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { refreshTokens: refreshToken } },
    ).exec();
  }

  /**
   * Revoke all refresh tokens for a user (useful for logout all devices)
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { refreshTokens: [] },
    ).exec();
    this.logger.log(`All refresh tokens revoked for user ${userId}`);
  }

  /**
   * Clean up expired refresh tokens for a user
   * Validates each token and removes expired ones
   */
  private async cleanupExpiredTokens(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      return;
    }

    const validTokens: string[] = [];
    
    for (const token of user.refreshTokens) {
      try {
        // Try to verify the token
        this.jwtService.verify(token);
        // If verification succeeds, token is still valid
        validTokens.push(token);
      } catch (error) {
        // Token is expired or invalid, don't add to validTokens
        this.logger.debug(`Removing expired/invalid refresh token for user ${user.email}`);
      }
    }

    // Update user with only valid tokens if any were removed
    if (validTokens.length < user.refreshTokens.length) {
      await this.userModel.findByIdAndUpdate(
        userId,
        { refreshTokens: validTokens },
      ).exec();
      this.logger.log(`Cleaned up ${user.refreshTokens.length - validTokens.length} expired tokens for user ${user.email}`);
    }
  }

  /**
   * Send OTP via WhatsApp using Interakt API
   * Creates OTP record in database and sends via WhatsApp
   * 
   * ✅ FIX (RACE CONDITION): Uses distributed locking to prevent concurrent OTP requests
   * This ensures only ONE OTP can be sent per phone number at a time, even across multiple server instances.
   * 
   * Benefits:
   * - Prevents duplicate OTP delivery under high load
   * - Saves API costs (Interakt charges per message)
   * - Prevents user confusion from multiple OTP codes
   * - Thread-safe across multiple backend instances
   */
  async sendWhatsAppOTP(phoneNumber: string) {
    try {
      // Validate phone number format
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new BadRequestException(ERR_OTP.INVALID_PHONE);
      }

      // Normalize phone number to E.164 format (international support)
      const normalizedPhone = normalizePhoneNumberE164(phoneNumber);

      // ✅ FIX: Acquire distributed lock to prevent race conditions
      // This prevents multiple concurrent requests from creating duplicate OTPs
      const lockKey = `otp:send:${normalizedPhone}`;
      const lockAcquired = await this.redisLockService.acquireLock(lockKey, 10000); // 10-second lock

      if (!lockAcquired) {
        this.logger.warn(`[OTP] Concurrent request blocked for ${normalizedPhone}`);
        throw new BadRequestException(ERR_OTP.REQUEST_IN_PROGRESS);
      }

      try {
        // Check if there's a recent OTP request (rate limiting)
        // ✅ This query is now optimized with compound index: { phoneNumber: 1, type: 1, createdAt: -1 }
        const recentOtp = await this.otpModel.findOne({
          phoneNumber: normalizedPhone,
          type: OtpType.WHATSAPP,
          createdAt: { $gte: new Date(Date.now() - this.OTP_RESEND_COOLDOWN_MS) },
        });

        if (recentOtp) {
          const cooldownSeconds = Math.ceil(this.OTP_RESEND_COOLDOWN_MS / 1000);
          throw new BadRequestException(ERR_OTP.RATE_LIMITED(cooldownSeconds));
        }

        // Invalidate any existing unverified OTPs for this phone number
        await this.otpModel.updateMany(
          {
            phoneNumber: normalizedPhone,
            type: OtpType.WHATSAPP,
            isVerified: false,
          },
          {
            $set: { expiresAt: new Date() }, // Expire immediately
          },
        );

        // Send OTP via WhatsApp
        const result = await this.whatsAppOtpService.sendAutoOTP(normalizedPhone);

        if (!result.success) {
          throw new BadRequestException(result.message);
        }

        // Store OTP in database
        const otpRecord = await this.otpModel.create({
          phoneNumber: normalizedPhone,
          code: result.otpCode,
          type: OtpType.WHATSAPP,
          expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MS),
          messageId: result.messageId,
        });

        this.logger.log(
          `WhatsApp OTP sent to ${normalizedPhone}. Record ID: ${otpRecord._id}`,
        );

        return {
          success: true,
          message: 'OTP sent successfully via WhatsApp',
          expiresIn: Math.floor(this.OTP_EXPIRY_MS / 1000), // Convert to seconds
        };
      } finally {
        // ✅ Always release lock, even if operation fails
        await this.redisLockService.releaseLock(lockKey);
      }
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp OTP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify WhatsApp OTP
   * Validates OTP code and marks as verified
   * 
   * ✅ FIX (RACE CONDITION): Uses atomic findOneAndUpdate to prevent attempt bypass
   * This ensures the max 5-attempt limit cannot be circumvented by concurrent requests.
   * 
   * Benefits:
   * - Single database query (better performance)
   * - Thread-safe (no race conditions)
   * - Prevents brute-force attacks via concurrent requests
   */
  async verifyWhatsAppOTP(phoneNumber: string, code: string) {
    try {
      // Validate inputs
      if (!phoneNumber || !code) {
        throw new BadRequestException(ERR_OTP.PHONE_AND_CODE_REQUIRED);
      }

      if (!/^\d{6}$/.test(code)) {
        throw new BadRequestException(ERR_OTP.INVALID_FORMAT);
      }

      // Normalize phone number to E.164 format (international support)
      const normalizedPhone = normalizePhoneNumberE164(phoneNumber);

      // ✅ FIX: Atomic verification with correct code
      // This query is now optimized with compound index: { phoneNumber: 1, type: 1, isVerified: 1, expiresAt: 1 }
      const verifiedOtp = await this.otpModel.findOneAndUpdate(
        {
          phoneNumber: normalizedPhone,
          type: OtpType.WHATSAPP,
          code: code, // ✅ Verify code atomically
          isVerified: false,
          expiresAt: { $gt: new Date() }, // Not expired
          attempts: { $lt: this.OTP_MAX_ATTEMPTS }, // ✅ Check attempts limit atomically
        },
        {
          $set: {
            isVerified: true,
            verifiedAt: new Date(),
          },
          $inc: { attempts: 1 }, // Increment even on success for audit trail
        },
        {
          new: true,
          sort: { createdAt: -1 }, // Most recent first
        },
      );

      // If verifiedOtp is null, code was wrong, expired, or max attempts reached
      if (verifiedOtp) {
        this.logger.log(`WhatsApp OTP verified successfully for ${normalizedPhone}`);
        
        return {
          success: true,
          message: 'OTP verified successfully',
          phoneNumber: normalizedPhone,
          verified: true,
        };
      }

      // ✅ FIX: Handle failed verification - check reason and increment attempts
      // Find the OTP to check why verification failed
      const otpRecord = await this.otpModel.findOne({
        phoneNumber: normalizedPhone,
        type: OtpType.WHATSAPP,
        isVerified: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        throw new BadRequestException(ERR_OTP.NOT_FOUND);
      }

      // Check if max attempts reached
      if (otpRecord.attempts >= this.OTP_MAX_ATTEMPTS) {
        // Expire the OTP
        await this.otpModel.updateOne(
          { _id: otpRecord._id },
          { $set: { expiresAt: new Date() } },
        );
        throw new BadRequestException(ERR_OTP.MAX_ATTEMPTS);
      }

      // Wrong code - increment attempts atomically
      const updatedOtp = await this.otpModel.findOneAndUpdate(
        {
          _id: otpRecord._id,
          attempts: { $lt: this.OTP_MAX_ATTEMPTS }, // Double-check to prevent race condition
        },
        {
          $inc: { attempts: 1 },
        },
        { new: true },
      );

      if (!updatedOtp) {
        throw new BadRequestException(ERR_OTP.MAX_ATTEMPTS);
      }

      const remainingAttempts = this.OTP_MAX_ATTEMPTS - updatedOtp.attempts;
      throw new BadRequestException(ERR_OTP.REMAINING_ATTEMPTS(remainingAttempts));

    } catch (error) {
      this.logger.error(`Failed to verify WhatsApp OTP: ${error.message}`);
      throw error;
    }
  }
}

