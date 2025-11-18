import { apiClient } from './client';

/**
 * WhatsApp OTP API Service
 * Uses Interakt WhatsApp Business API via backend
 */

export interface SendWhatsAppOTPResponse {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}

export interface VerifyWhatsAppOTPResponse {
  success: boolean;
  message: string;
  phoneNumber: string;
  verified: boolean;
}

/**
 * Send OTP via WhatsApp
 * @param phoneNumber Phone number in format: "+919876543210" or "9876543210"
 */
export async function sendWhatsAppOTP(phoneNumber: string): Promise<SendWhatsAppOTPResponse> {
  const response = await apiClient.post('/auth/send-whatsapp-otp', {
    phoneNumber,
  });

  return response.data.data;
}

/**
 * Verify WhatsApp OTP
 * @param phoneNumber Phone number
 * @param code 6-digit OTP code
 */
export async function verifyWhatsAppOTP(
  phoneNumber: string,
  code: string,
): Promise<VerifyWhatsAppOTPResponse> {
  const response = await apiClient.post('/auth/verify-whatsapp-otp', {
    phoneNumber,
    code,
  });

  return response.data.data;
}

