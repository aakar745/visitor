'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Shield, 
  Loader2,
  CheckCircle2,
  Lock,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { registrationsApi } from '@/lib/api/registrations';
import { useVisitorAuthStore } from '@/lib/store/visitorAuthStore';
import { useRegistrationStore } from '@/lib/store/registration.store';
import PhoneInput from './PhoneInput';
import { OTPModal } from './OTPModal';
import { isValidPhoneNumber } from 'libphonenumber-js';
import type { E164Number } from 'libphonenumber-js';
import type { ConfirmationResult } from 'firebase/auth';
import { sendOTP, initializeRecaptcha, cleanupRecaptcha } from '@/lib/firebase/phoneAuth';
import { sendWhatsAppOTP } from '@/lib/api/whatsappOtp';

interface OTPLoginProps {
  exhibitionId: string;
  exhibitionName: string;
  onAuthSuccess: (hasExistingRegistration: boolean, registrationId?: string) => void;
}

type Step = 'phone' | 'otp';
type OTPMethod = 'sms' | 'whatsapp';

export function OTPLogin({ exhibitionId, exhibitionName, onAuthSuccess }: OTPLoginProps) {
  const [step, setStep] = useState<Step>('phone');
  const [otpMethod, setOtpMethod] = useState<OTPMethod>('whatsapp'); // Default to WhatsApp
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  
  // NEW: reCAPTCHA solve state tracking
  const [isRecaptchaSolved, setIsRecaptchaSolved] = useState(false);
  
  // NEW: Rate limiting and retry state
  const [retryCount, setRetryCount] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  
  const { setAuthenticated, setExistingRegistration, clearAuthentication } = useVisitorAuthStore();
  const { clearDraft } = useRegistrationStore();
  
  const MAX_RETRIES = 2;

  // Initialize reCAPTCHA on component mount and clear old auth data
  useEffect(() => {
    // CRITICAL: Clear any old persisted visitor data from localStorage
    // This prevents old visitor data from auto-filling when a new user logs in
    clearAuthentication();
    console.log('[OTP] Cleared old authentication data');
    
    // CRITICAL: Also clear any old form drafts from previous users
    // Drafts are keyed by exhibitionId only, so they persist across different users
    clearDraft();
    console.log('[OTP] Cleared old form drafts');

    return () => {
      cleanupRecaptcha();
    };
  }, []);

  // Initialize reCAPTCHA when SMS method is selected
  useEffect(() => {
    let isMounted = true; // FIX: Track mount state to prevent race conditions
    
    if (typeof window !== 'undefined' && otpMethod === 'sms') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(async () => {
        try {
          await initializeRecaptcha(
            'recaptcha-container',
            () => {
              if (isMounted) {
                setIsRecaptchaSolved(true);
                console.log('[OTP] reCAPTCHA solved successfully');
              }
            },
            () => {
              if (isMounted) {
                setIsRecaptchaSolved(false);
                console.log('[OTP] reCAPTCHA expired or failed');
              }
            }
          );
          if (isMounted) {
            console.log('[OTP] reCAPTCHA initialized for SMS');
          }
        } catch (error) {
          console.error('Failed to initialize reCAPTCHA:', error);
          if (isMounted) {
            toast.error('Security verification failed to load', {
              description: 'Please refresh the page and try again',
            });
          }
        }
      }, 100);
      
      return () => {
        isMounted = false; // FIX: Set flag on cleanup
        clearTimeout(timer);
        cleanupRecaptcha();
        setIsRecaptchaSolved(false); // Reset solve state
      };
    } else {
      // Clean up reCAPTCHA when switching to WhatsApp
      cleanupRecaptcha();
      setIsRecaptchaSolved(false);
    }
  }, [otpMethod]);

  // Validate phone number
  const isValidPhone = (): boolean => {
    return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
  };

  // FIX: Extract duplicate registration check logic into helper
  const checkExistingRegistration = async (phone: E164Number) => {
    try {
      const lookupResult = await registrationsApi.lookupVisitorByPhone(phone);
      
      if (lookupResult && lookupResult.visitor) {
        const existingReg = lookupResult.registrations?.find(
          (reg: any) => reg.exhibitionId === exhibitionId || 
                       reg.exhibitionId.toString() === exhibitionId
        );
        
        return {
          visitor: lookupResult.visitor,
          registrations: lookupResult.registrations,
          existingRegistration: existingReg || null
        };
      }
      
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // New visitor
      }
      throw error; // Re-throw other errors
    }
  };

  // Handle phone number submission with retry and fallback
  const handleSendOTP = async () => {
    if (!isValidPhone()) {
      toast.error('Invalid phone number', {
        description: 'Please enter a valid phone number with country code',
      });
      return;
    }

    if (!phoneNumber) return;
    
    // Check lockout
    if (lockoutTime && new Date() < lockoutTime) {
      toast.error('Too many attempts', {
        description: `Please wait until ${lockoutTime.toLocaleTimeString()}`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // FIRST: Check if user is already registered for THIS exhibition (using helper)
      console.log('[OTP] Checking if user already registered...');
      
      const existing = await checkExistingRegistration(phoneNumber);
      
      if (existing?.existingRegistration) {
        // ✅ ALREADY REGISTERED - Skip OTP, go directly to success page
        console.log('[OTP] User already registered - skipping OTP verification');
        
        setAuthenticated(phoneNumber, existing.visitor, existing.registrations);
        setExistingRegistration(existing.existingRegistration._id || existing.existingRegistration.registrationId);
        
        toast.success('Welcome back!', {
          description: 'You are already registered. Redirecting to your badge...',
        });

        onAuthSuccess(true, existing.existingRegistration._id || existing.existingRegistration.registrationId);
        setIsLoading(false);
        return;
      }

      // User is NOT registered yet - proceed with OTP verification
      console.log('[OTP] User not registered - sending OTP...');

      if (otpMethod === 'whatsapp') {
        // Send OTP via WhatsApp (Interakt)
        await sendWhatsAppOTP(phoneNumber);
        setShowOTPModal(true);
        setStep('otp');
        setRetryCount(0); // Reset retry count on success
        
        toast.success('🎪 Aakar Exhibition - WhatsApp OTP Sent!', {
          description: 'Check WhatsApp for your verification code (expires in 10 minutes)',
        });
      } else {
        // Send OTP via SMS (Firebase)
        // FIX: Check if reCAPTCHA is initialized AND solved
        if (!window.recaptchaVerifier) {
          toast.error('Security verification required', {
            description: 'Please complete the reCAPTCHA verification',
          });
          setIsLoading(false);
          return;
        }
        
        if (!isRecaptchaSolved) {
          toast.error('Please solve the reCAPTCHA puzzle', {
            description: 'Complete the security check before sending OTP',
          });
          setIsLoading(false);
          return;
        }
        
        const result = await sendOTP(phoneNumber);
        setConfirmationResult(result);
        setShowOTPModal(true);
        setStep('otp');
        setRetryCount(0); // Reset retry count on success
        
        toast.success('🎪 Aakar Exhibition - SMS OTP Sent!', {
          description: 'Check your phone for the verification code',
        });
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      // Handle rate limiting
      if (error.code === 'auth/too-many-requests') {
        const lockout = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        setLockoutTime(lockout);
        setAttemptsRemaining(0);
        toast.error('Too many attempts', {
          description: `Please wait 15 minutes before trying again`,
        });
        setIsLoading(false);
        return;
      }
      
      // FIX: Automatic retry with fallback
      if (retryCount < MAX_RETRIES && error.code !== 'auth/too-many-requests') {
        setRetryCount(prev => prev + 1);
        setAttemptsRemaining(prev => prev - 1);
        toast.error(`Send failed, retrying...`, {
          description: `Attempt ${retryCount + 1}/${MAX_RETRIES}`,
        });
        setIsLoading(false);
        setTimeout(() => handleSendOTP(), 2000);
        return;
      } else if (otpMethod === 'sms' && retryCount >= MAX_RETRIES) {
        // Automatic fallback to WhatsApp after SMS fails
        toast.error('SMS delivery failed', {
          description: 'Switching to WhatsApp for better delivery...',
        });
        setOtpMethod('whatsapp');
        setRetryCount(0);
        setIsLoading(false);
        setTimeout(() => handleSendOTP(), 1000);
        return;
      }
      
      const method = otpMethod === 'whatsapp' ? 'WhatsApp' : 'SMS';
      toast.error(`Failed to send ${method} OTP`, {
        description: error.message || 'Please try again or contact support',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification success (using helper)
  const handleVerificationSuccess = async () => {
    if (!phoneNumber) return;

    setIsLoading(true);

    try {
      // FIX: Use helper function instead of duplicate logic
      const existing = await checkExistingRegistration(phoneNumber);

      if (existing) {
        console.log('[OTP] Visitor found:', {
          name: existing.visitor.name,
          phone: existing.visitor.phone,
          email: existing.visitor.email,
        });

        if (existing.existingRegistration) {
          // ✅ HAS EXISTING REGISTRATION - Redirect directly to success page
          console.log('[OTP] User already registered:', {
            registrationId: existing.existingRegistration._id || existing.existingRegistration.registrationId,
            exhibitionId: existing.existingRegistration.exhibitionId,
          });

          setAuthenticated(phoneNumber, existing.visitor, existing.registrations);
          setExistingRegistration(existing.existingRegistration._id || existing.existingRegistration.registrationId);
          
          toast.success('Welcome back!', {
            description: 'You are already registered for this exhibition. Redirecting to your badge...',
          });

          onAuthSuccess(true, existing.existingRegistration._id || existing.existingRegistration.registrationId);
        } else {
          // ✅ NEW REGISTRATION NEEDED - Show form
          console.log('[OTP] Returning visitor, no registration for this exhibition');
          
          setAuthenticated(phoneNumber, existing.visitor, existing.registrations);
          
          toast.success('Authentication successful!', {
            description: 'Please complete the registration form',
          });

          onAuthSuccess(false);
        }
      } else {
        // ✅ NEW VISITOR - Show form
        console.log('[OTP] New visitor, never registered before');
        
        setAuthenticated(phoneNumber, null, []);
        
        toast.success('Welcome!', {
          description: 'Please fill in your details to complete registration',
        });

        onAuthSuccess(false);
      }
    } catch (error: any) {
      console.error('[OTP] Verification error:', error);
      toast.error('Verification failed', {
        description: 'Please try again or contact support',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setShowOTPModal(false);
    await handleSendOTP();
  };

  return (
    <div className="space-y-6">
      {/* Main OTP Card */}
      <Card className="p-8">
        {/* Phone Number Entry */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              {otpMethod === 'whatsapp' ? (
                <MessageCircle className="h-8 w-8 text-green-600" />
              ) : (
                <MessageSquare className="h-8 w-8 text-primary" />
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">Choose Verification Method</h3>
            <p className="text-sm text-muted-foreground">
              Select how you'd like to receive your one-time password
            </p>
          </div>

          {/* SMS/WhatsApp Toggle */}
          <div className="flex justify-center">
            <Tabs value={otpMethod} onValueChange={(value) => setOtpMethod(value as OTPMethod)} className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="whatsapp" className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Method Description */}
          <div className="text-center">
            {otpMethod === 'whatsapp' ? (
              <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                <MessageCircle className="h-4 w-4" />
                <span>OTP will be sent via <strong>WhatsApp</strong> with a "Copy Code" button</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <MessageSquare className="h-4 w-4" />
                <span>OTP will be sent via <strong>SMS</strong> to your phone number</span>
              </div>
            )}
          </div>

          {/* International Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base">
              Mobile Number <span className="text-red-500">*</span>
            </Label>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              disabled={isLoading}
              placeholder="Enter phone number"
              required
            />
            <p className="text-xs text-muted-foreground">
              Select your country code and enter your mobile number
            </p>
          </div>

          {/* Rate Limit Warning */}
          {lockoutTime && new Date() < lockoutTime && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Too many attempts</strong> - Please wait until {lockoutTime.toLocaleTimeString()} before trying again.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Attempts Remaining */}
          {!lockoutTime && attemptsRemaining < 3 && attemptsRemaining > 0 && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Attempts remaining:</strong> {attemptsRemaining}/3
              </AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>🎪 Aakar Exhibition</strong> - Your mobile number will be used to verify your identity and send event updates. 
              We respect your privacy and won't share your information.
            </AlertDescription>
          </Alert>

          {/* Send OTP Button */}
          <Button
            onClick={handleSendOTP}
            disabled={!isValidPhone() || isLoading || (otpMethod === 'sms' && !isRecaptchaSolved) || (lockoutTime !== null && new Date() < lockoutTime)}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                {otpMethod === 'whatsapp' ? (
                  <>
                    <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
                    Send OTP via WhatsApp
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Send OTP via SMS
                  </>
                )}
              </>
            )}
          </Button>

          {/* Method-specific Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {otpMethod === 'whatsapp' ? (
                <>
                  WhatsApp OTP powered by <strong>Interakt</strong> • Expires in 10 minutes
                </>
              ) : (
                <>
                  SMS OTP powered by <strong>Firebase</strong> • May appear as "VERIFY"
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* OTP Verification Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        phoneNumber={phoneNumber || ''}
        confirmationResult={confirmationResult}
        onVerificationSuccess={handleVerificationSuccess}
        onResendOTP={handleResendOTP}
        companyName="Aakar Exhibition"
        otpMethod={otpMethod}
      />

      {/* reCAPTCHA container - visible for SMS verification */}
      {otpMethod === 'sms' && (
        <Card className="p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Please complete the security verification below
            </p>
          </div>
          <div id="recaptcha-container" className="flex justify-center"></div>
        </Card>
      )}

      {/* Security Note */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Shield className="h-3 w-3" />
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}

