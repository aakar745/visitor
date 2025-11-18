import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { Otp, OtpDocument, OtpType } from '../../database/schemas/otp.schema';
import { WhatsAppOtpService } from '../../services/whatsapp-otp.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_REFRESH_TOKENS = 5; // Limit stored tokens per user

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private jwtService: JwtService,
    private whatsAppOtpService: WhatsAppOtpService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
    
    // Generate new tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    // Store refresh token in user document
    await this.storeRefreshToken(user._id.toString(), refreshToken);
    
    // Update last login info
    await this.userModel.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
      loginAttempts: 0, // Reset login attempts on successful login
      lockedUntil: null, // Clear any account lock
    });
    
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

    const user = await this.userModel.findOne({ email }).select('+password').populate('role');
    
    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      this.logger.warn(`Login attempt for locked account: ${email}. Locked for ${remainingTime} more minutes.`);
      throw new UnauthorizedException(`Account is locked. Please try again in ${remainingTime} minute(s).`);
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
    if (newLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCK_TIME);
      this.logger.warn(`Account locked due to ${MAX_LOGIN_ATTEMPTS} failed login attempts: ${email}`);
    }

    await this.userModel.findByIdAndUpdate(user._id, updates);

    // Provide feedback about remaining attempts
    const remainingAttempts = MAX_LOGIN_ATTEMPTS - newLoginAttempts;
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
        throw new UnauthorizedException('User not found');
      }

      // Check if user account is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
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
        throw new UnauthorizedException('Invalid refresh token or token already used');
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
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Store refresh token in user document
   * Implements token limit to prevent unlimited growth
   */
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new UnauthorizedException('User not found');
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
   */
  async sendWhatsAppOTP(phoneNumber: string) {
    try {
      // Validate phone number format
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new BadRequestException('Invalid phone number');
      }

      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizedPhone = phoneNumber.replace(/[\s\-()]/g, '');

      // Check if there's a recent OTP request (rate limiting)
      const recentOtp = await this.otpModel.findOne({
        phoneNumber: normalizedPhone,
        type: OtpType.WHATSAPP,
        createdAt: { $gte: new Date(Date.now() - 60000) }, // Last 1 minute
      });

      if (recentOtp) {
        throw new BadRequestException(
          'OTP already sent. Please wait 1 minute before requesting again.',
        );
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
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        messageId: result.messageId,
      });

      this.logger.log(
        `WhatsApp OTP sent to ${normalizedPhone}. Record ID: ${otpRecord._id}`,
      );

      return {
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        expiresIn: 600, // 10 minutes in seconds
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp OTP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify WhatsApp OTP
   * Validates OTP code and marks as verified
   */
  async verifyWhatsAppOTP(phoneNumber: string, code: string) {
    try {
      // Validate inputs
      if (!phoneNumber || !code) {
        throw new BadRequestException('Phone number and OTP code are required');
      }

      if (!/^\d{6}$/.test(code)) {
        throw new BadRequestException('Invalid OTP format. Must be 6 digits.');
      }

      // Normalize phone number
      const normalizedPhone = phoneNumber.replace(/[\s\-()]/g, '');

      // Find the most recent unverified OTP
      const otpRecord = await this.otpModel.findOne({
        phoneNumber: normalizedPhone,
        type: OtpType.WHATSAPP,
        isVerified: false,
        expiresAt: { $gt: new Date() }, // Not expired
      }).sort({ createdAt: -1 }); // Most recent first

      if (!otpRecord) {
        throw new BadRequestException('OTP not found or expired. Please request a new OTP.');
      }

      // Check attempts (max 5 attempts)
      if (otpRecord.attempts >= 5) {
        await this.otpModel.updateOne(
          { _id: otpRecord._id },
          { $set: { expiresAt: new Date() } }, // Expire immediately
        );
        throw new BadRequestException(
          'Maximum verification attempts exceeded. Please request a new OTP.',
        );
      }

      // Verify OTP code
      if (otpRecord.code !== code) {
        // Increment attempts
        await this.otpModel.updateOne(
          { _id: otpRecord._id },
          { $inc: { attempts: 1 } },
        );

        const remainingAttempts = 5 - (otpRecord.attempts + 1);
        throw new BadRequestException(
          `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`,
        );
      }

      // Mark as verified
      await this.otpModel.updateOne(
        { _id: otpRecord._id },
        {
          $set: {
            isVerified: true,
            verifiedAt: new Date(),
          },
        },
      );

      this.logger.log(`WhatsApp OTP verified successfully for ${normalizedPhone}`);

      return {
        success: true,
        message: 'OTP verified successfully',
        phoneNumber: normalizedPhone,
        verified: true,
      };
    } catch (error) {
      this.logger.error(`Failed to verify WhatsApp OTP: ${error.message}`);
      throw error;
    }
  }
}

