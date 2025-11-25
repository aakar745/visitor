'use client';

import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { verifyOTP } from '@/lib/firebase/phoneAuth';
import { verifyWhatsAppOTP } from '@/lib/api/whatsappOtp';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

type OTPMethod = 'sms' | 'whatsapp';

// ⚙️ Constants - Extract magic numbers
const RESEND_COUNTDOWN_SECONDS = 60;
const SMS_SLOW_WARNING_MS = 30000; // 30 seconds
const OTP_LENGTH = 6;
const SUCCESS_DELAY_MS = 500; // Reduced from 1500ms for faster UX

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  confirmationResult: firebase.auth.ConfirmationResult | null;
  onVerificationSuccess: () => void;
  onResendOTP: () => void;
  companyName?: string;
  otpMethod?: OTPMethod;
}

export const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  phoneNumber,
  confirmationResult,
  onVerificationSuccess,
  onResendOTP,
  companyName = 'Aakar Exhibition',
  otpMethod = 'sms',
}) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [showSlowSMSWarning, setShowSlowSMSWarning] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (!isOpen || canResend) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, canResend]);

  // Focus first input on mount
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  // ⚠️ WebOTP API - REMOVED
  // WebOTP API requires SMS messages to end with: @yourdomain.com #123456
  // Firebase SMS does not support this format, so WebOTP shows a permission
  // popup but fails to autofill, creating a poor user experience.
  // We rely on autocomplete="one-time-code" for iOS Safari autofill instead.

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      setSuccess(false);
      setCountdown(RESEND_COUNTDOWN_SECONDS);
      setCanResend(false);
      setShowSlowSMSWarning(false);
    }
  }, [isOpen]);

  // 🔥 Show "SMS slow?" warning after 30 seconds for SMS method
  useEffect(() => {
    if (!isOpen || otpMethod !== 'sms') return;

    const timer = setTimeout(() => {
      if (!success && otp.every(d => d === '')) {
        setShowSlowSMSWarning(true);
      }
    }, SMS_SLOW_WARNING_MS);

    return () => clearTimeout(timer);
  }, [isOpen, otpMethod, success, otp]);

  // ⌨️ Keyboard Escape Handler - Close modal on ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isVerifying) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isVerifying, onClose]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input or next empty
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();

    // Auto-verify if all 6 digits pasted
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code: string) => {
    setIsVerifying(true);
    setError('');

    try {
      if (otpMethod === 'whatsapp') {
        // WhatsApp OTP verification via backend
        const result = await verifyWhatsAppOTP(phoneNumber, code);
        
        if (result.verified) {
          setSuccess(true);
          setTimeout(() => {
            onVerificationSuccess();
            onClose();
          }, SUCCESS_DELAY_MS);
        } else {
          setError('Verification failed. Please try again.');
          setOtp(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        }
      } else {
        // SMS OTP verification via Firebase
        if (!confirmationResult) {
          setError('Session expired. Please request a new OTP.');
          return;
        }

        const isValid = await verifyOTP(confirmationResult, code);
        
        if (isValid) {
          setSuccess(true);
          setTimeout(() => {
            onVerificationSuccess();
            onClose();
          }, SUCCESS_DELAY_MS);
        } else {
          setError('Verification failed. Please try again.');
          setOtp(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        }
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Invalid OTP. Please try again.';
      setError(errorMessage);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setCountdown(60);
    setCanResend(false);
    onResendOTP();
    inputRefs.current[0]?.focus();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      
      <div className="modal-container">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div className="company-logo">
              <span className="logo-icon">🎪</span>
              <h2 className="company-name">{companyName}</h2>
            </div>
            <button onClick={onClose} className="close-button" disabled={isVerifying}>
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            <h3 className="title">Verify Your Phone Number</h3>
            <p className="description">
              We've sent a 6-digit verification code to
              <br />
              <strong>{phoneNumber}</strong>
            </p>

            {/* OTP Input */}
            <div className="otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  className={`otp-input ${error ? 'error' : ''} ${success ? 'success' : ''}`}
                  disabled={isVerifying || success}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {/* Loading State */}
            {isVerifying && (
              <div className="status verifying">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{otpMethod === 'whatsapp' ? 'Verifying with WhatsApp...' : 'Verifying with Firebase...'}</span>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="status success">
                <CheckCircle2 className="w-5 h-5" />
                <span>Verified successfully!</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="status error">
                <XCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* SMS Slow Warning */}
            {showSlowSMSWarning && otpMethod === 'sms' && !success && (
              <div className="sms-slow-warning">
                <p className="text-sm text-amber-700 font-medium mb-2">
                  📱 SMS taking longer than usual?
                </p>
                <button
                  onClick={onResendOTP}
                  className="alt-method-button"
                  disabled={isVerifying}
                >
                  Switch to WhatsApp (Faster)
                </button>
              </div>
            )}

            {/* Resend OTP */}
            <div className="resend-container">
              {!canResend ? (
                <p className="resend-text">
                  Resend code in <strong>{countdown}s</strong>
                  {otpMethod === 'sms' && <span className="text-xs block mt-1 text-muted-foreground">SMS usually takes 10-30 seconds</span>}
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="resend-button"
                  disabled={isVerifying}
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend OTP
                </button>
              )}
            </div>

            <p className="security-note">
              🔒 Your phone number is securely verified and will not be shared.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 9998;
          backdrop-filter: blur(4px);
        }

        .modal-container {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 28rem;
          width: 100%;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-1rem) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .company-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          font-size: 2rem;
        }

        .company-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .close-button:hover:not(:disabled) {
          color: #111827;
          background-color: #f3f4f6;
        }

        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-body {
          padding: 2rem 1.5rem;
        }

        .title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
          text-align: center;
        }

        .description {
          text-align: center;
          color: #6b7280;
          margin: 0 0 2rem;
          line-height: 1.6;
        }

        .description strong {
          color: #111827;
          font-weight: 600;
        }

        .otp-container {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .otp-input {
          width: 3rem;
          height: 3.5rem;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 600;
          border: 2px solid #d1d5db;
          border-radius: 0.5rem;
          transition: all 0.2s;
          background: white;
        }

        .otp-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .otp-input.error {
          border-color: #ef4444;
          animation: shake 0.3s;
        }

        .otp-input.success {
          border-color: #10b981;
          background-color: #f0fdf4;
        }

        .otp-input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-0.5rem); }
          75% { transform: translateX(0.5rem); }
        }

        .status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .status.verifying {
          background-color: #eff6ff;
          color: #1e40af;
        }

        .status.success {
          background-color: #f0fdf4;
          color: #15803d;
        }

        .status.error {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .resend-container {
          text-align: center;
          margin-bottom: 1rem;
        }

        .resend-text {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }

        .resend-text strong {
          color: #3b82f6;
          font-weight: 600;
        }

        .resend-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #3b82f6;
          background: none;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .resend-button:hover:not(:disabled) {
          background-color: #eff6ff;
        }

        .resend-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sms-slow-warning {
          background: #fffbeb;
          border: 2px solid #fbbf24;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .alt-method-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #10b981;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .alt-method-button:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .alt-method-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .security-note {
          text-align: center;
          color: #9ca3af;
          font-size: 0.75rem;
          margin: 0;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 640px) {
          .otp-input {
            width: 2.5rem;
            height: 3rem;
            font-size: 1.25rem;
          }

          .otp-container {
            gap: 0.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default OTPModal;

