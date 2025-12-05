import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * WhatsApp Registration Confirmation Service
 * 
 * Sends exhibition registration confirmation with badge image via Interakt API
 * 
 * Features:
 * - Sends approved "exhibition_registration_confirmation" template
 * - Includes badge image in header
 * - Visitor name personalization
 * - International phone number support
 * - Comprehensive error handling
 * 
 * Template Structure:
 * - Header: Badge image ({{1}})
 * - Body: Thank you message with visitor name ({{1}})
 * - Footer: "Powered by Aakar Visitors"
 * - No buttons
 */
@Injectable()
export class WhatsAppRegistrationService {
  private readonly logger = new Logger(WhatsAppRegistrationService.name);
  private readonly INTERAKT_API_URL: string;
  private readonly INTERAKT_API_KEY: string | undefined;
  private readonly TEMPLATE_NAME = 'exhibition_registration_confirmation';

  constructor(private configService: ConfigService) {
    this.INTERAKT_API_URL = this.configService.get<string>(
      'INTERAKT_API_URL',
      'https://api.interakt.ai/v1/public/message/',
    );
    this.INTERAKT_API_KEY = this.configService.get<string>('INTERAKT_API_KEY');

    if (!this.INTERAKT_API_KEY) {
      this.logger.warn('⚠️ INTERAKT_API_KEY not configured - WhatsApp registration confirmation will not work');
    } else {
      this.logger.log('✅ WhatsApp Registration Confirmation Service initialized');
    }
  }

  /**
   * Format phone number for Interakt API (International Support)
   * Input: "+919876543210", "+14155552671", etc.
   * Output: { countryCode: "+91", phoneNumber: "9876543210" }
   */
  private formatPhoneNumber(phoneNumber: string): {
    countryCode: string;
    phoneNumber: string;
  } | null {
    try {
      // Validate phone number
      if (!isValidPhoneNumber(phoneNumber)) {
        this.logger.warn(`Invalid phone number format: ${phoneNumber}`);
        return null;
      }

      // Parse the phone number
      const parsed = parsePhoneNumber(phoneNumber);
      
      if (!parsed) {
        this.logger.warn(`Unable to parse phone number: ${phoneNumber}`);
        return null;
      }

      // Extract country code and national number
      const countryCode = `+${parsed.countryCallingCode}`;
      const nationalNumber = parsed.nationalNumber;

      this.logger.debug(`📞 Parsed: ${phoneNumber} → ${countryCode} ${nationalNumber}`);

      return { 
        countryCode, 
        phoneNumber: nationalNumber 
      };
    } catch (error) {
      this.logger.error(`Phone number parsing error: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate badge URL is HTTPS and accessible
   */
  private validateBadgeUrl(badgeUrl: string): boolean {
    try {
      const url = new URL(badgeUrl);
      
      // Must be HTTPS (WhatsApp requirement)
      if (url.protocol !== 'https:') {
        this.logger.warn(`Badge URL must be HTTPS: ${badgeUrl}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Invalid badge URL: ${badgeUrl}`);
      return false;
    }
  }

  /**
   * Send registration confirmation with badge image
   * 
   * @param phoneNumber - Phone number in E.164 format (e.g., "+919876543210")
   * @param visitorName - Visitor's full name
   * @param badgeUrl - HTTPS URL of the badge image
   * @param registrationNumber - Registration number for logging
   * @returns Success status and message ID
   */
  async sendRegistrationConfirmation(
    phoneNumber: string,
    visitorName: string,
    badgeUrl: string,
    registrationNumber?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if API key is configured
      if (!this.INTERAKT_API_KEY) {
        this.logger.warn('[WhatsApp] Service not configured (missing API key)');
        return {
          success: false,
          error: 'WhatsApp service not configured',
        };
      }

      // Validate badge URL
      if (!this.validateBadgeUrl(badgeUrl)) {
        return {
          success: false,
          error: 'Invalid badge URL (must be HTTPS)',
        };
      }

      // Format phone number
      const formatted = this.formatPhoneNumber(phoneNumber);
      if (!formatted) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      const { countryCode, phoneNumber: phone } = formatted;

      this.logger.log(`📱 Sending registration confirmation to ${countryCode}${phone}${registrationNumber ? ` (${registrationNumber})` : ''}`);

      // Prepare Interakt API payload
      const payload = {
        countryCode: countryCode,
        phoneNumber: phone,
        type: 'Template',
        template: {
          name: this.TEMPLATE_NAME,
          languageCode: 'en',
          headerValues: [badgeUrl],      // Badge image URL in header
          bodyValues: [visitorName],      // Visitor name in body
          buttonValues: {},               // No buttons
        },
      };

      // Send request to Interakt API
      const response = await axios.post(this.INTERAKT_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.INTERAKT_API_KEY}`,
        },
        timeout: 10000, // 10 second timeout
      });

      // Check response
      if (response.data && response.data.result === true) {
        this.logger.log(`✅ WhatsApp confirmation sent. Message ID: ${response.data.id}`);
        return {
          success: true,
          messageId: response.data.id,
        };
      } else {
        this.logger.warn('⚠️ Unexpected response from Interakt API', response.data);
        return {
          success: false,
          error: 'Unexpected API response',
        };
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send WhatsApp confirmation: ${error.message}`);

      // Handle specific errors
      let errorMsg = 'Failed to send WhatsApp message';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 401 || status === 403) {
            errorMsg = 'WhatsApp service authentication failed';
          } else if (status === 400) {
            errorMsg = error.response.data?.message || 'Invalid request to WhatsApp service';
          } else if (status === 404) {
            errorMsg = 'WhatsApp template not found';
          } else if (status === 429) {
            errorMsg = 'WhatsApp rate limit exceeded';
          }
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMsg = 'WhatsApp service timeout';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          errorMsg = 'Unable to reach WhatsApp service';
        }
      }

      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}

