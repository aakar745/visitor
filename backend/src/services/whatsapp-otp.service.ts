import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * WhatsApp OTP Service using Interakt API
 * 
 * Features:
 * - Send 6-digit OTP via WhatsApp
 * - Uses approved "otp" template
 * - Includes "Copy Code" button
 * - 10-minute expiry
 */
@Injectable()
export class WhatsAppOtpService {
  private readonly logger = new Logger(WhatsAppOtpService.name);
  private readonly INTERAKT_API_URL: string;
  private readonly INTERAKT_API_KEY: string | undefined;

  constructor(private configService: ConfigService) {
    this.INTERAKT_API_URL = this.configService.get<string>(
      'INTERAKT_API_URL',
      'https://api.interakt.ai/v1/public/message/',
    );
    this.INTERAKT_API_KEY = this.configService.get<string>('INTERAKT_API_KEY');

    if (!this.INTERAKT_API_KEY) {
      this.logger.warn('⚠️ INTERAKT_API_KEY not configured - WhatsApp OTP will not work');
    } else {
      this.logger.log('✅ Interakt WhatsApp OTP Service initialized');
    }
  }

  /**
   * Generate a random 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate OTP format (must be exactly 6 digits)
   */
  private validateOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Format phone number for Interakt API
   * Input: "+919876543210" or "9876543210"
   * Output: { countryCode: "+91", phoneNumber: "9876543210" }
   */
  private formatPhoneNumber(phoneNumber: string): {
    countryCode: string;
    phoneNumber: string;
  } {
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

    let countryCode = '+91'; // Default to India
    let phone = cleaned;

    // Parse country code
    if (cleaned.startsWith('+91')) {
      countryCode = '+91';
      phone = cleaned.substring(3);
    } else if (cleaned.startsWith('91') && cleaned.length > 10) {
      countryCode = '+91';
      phone = cleaned.substring(2);
    } else if (cleaned.startsWith('+')) {
      // Extract country code
      const match = cleaned.match(/^(\+\d{1,3})(\d+)$/);
      if (match) {
        countryCode = match[1];
        phone = match[2];
      }
    }

    // Validate phone number length (should be 10 digits for India)
    if (phone.length !== 10) {
      throw new BadRequestException(
        `Invalid phone number format. Expected 10 digits, got ${phone.length}`,
      );
    }

    return { countryCode, phoneNumber: phone };
  }

  /**
   * Send OTP via WhatsApp using Interakt API
   * 
   * @param phoneNumber - Phone number in format: "+919876543210" or "9876543210"
   * @param otpCode - 6-digit OTP code
   * @returns Success status and message ID
   */
  async sendOTP(
    phoneNumber: string,
    otpCode: string,
  ): Promise<{ success: boolean; messageId?: string; message: string }> {
    try {
      // Check if API key is configured
      if (!this.INTERAKT_API_KEY) {
        throw new BadRequestException(
          'WhatsApp OTP is not configured. Please contact administrator.',
        );
      }

      // Validate OTP format
      if (!this.validateOTP(otpCode)) {
        throw new BadRequestException('Invalid OTP format. Must be exactly 6 digits.');
      }

      // Format phone number
      const { countryCode, phoneNumber: phone } = this.formatPhoneNumber(phoneNumber);

      this.logger.log(`📱 Sending WhatsApp OTP to ${countryCode}${phone}`);
      this.logger.debug(`🔢 OTP: ${otpCode}`);

      // Prepare Interakt API payload
      const payload = {
        countryCode: countryCode,
        phoneNumber: phone,
        type: 'Template',
        template: {
          name: 'otp', // Approved template name
          languageCode: 'en',
          bodyValues: [otpCode], // {{1}} = OTP code
          buttonValues: {
            '0': [otpCode], // Copy Code button value
          },
        },
      };

      // Send request to Interakt API
      const response = await axios.post(this.INTERAKT_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.INTERAKT_API_KEY}`,
        },
        timeout: 5000, // 5 second timeout - faster failure for better UX
      });

      // Check response
      if (response.data && response.data.result === true) {
        this.logger.log(`✅ WhatsApp OTP sent successfully. Message ID: ${response.data.id}`);
        return {
          success: true,
          messageId: response.data.id,
          message: 'OTP sent successfully via WhatsApp',
        };
      } else {
        this.logger.warn('⚠️ Unexpected response from Interakt API', response.data);
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.',
        };
      }
    } catch (error) {
      this.logger.error('❌ Failed to send WhatsApp OTP', error.message);

      // Handle specific errors
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;

          this.logger.error(`Interakt API Error (${status}):`, data);

          // Provide user-friendly error messages
          if (status === 401 || status === 403) {
            throw new BadRequestException(
              'WhatsApp service authentication failed. Please contact administrator.',
            );
          } else if (status === 400) {
            const errorMsg = data?.message || data?.error || 'Invalid request';
            throw new BadRequestException(`WhatsApp service error: ${errorMsg}`);
          } else if (status === 429) {
            throw new BadRequestException(
              'Too many OTP requests. Please try again after a few minutes.',
            );
          }
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new BadRequestException(
            'WhatsApp service timeout. Please check your internet connection and try again.',
          );
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new BadRequestException(
            'Unable to reach WhatsApp service. Please try again later.',
          );
        }
      }

      // Generic error
      throw new BadRequestException(
        'Failed to send WhatsApp OTP. Please try again or use SMS option.',
      );
    }
  }

  /**
   * Send OTP with auto-generated code
   * Convenience method that generates OTP and sends it
   */
  async sendAutoOTP(
    phoneNumber: string,
  ): Promise<{ success: boolean; otpCode: string; messageId?: string; message: string }> {
    const otpCode = this.generateOTP();
    const result = await this.sendOTP(phoneNumber, otpCode);

    return {
      ...result,
      otpCode,
    };
  }
}

