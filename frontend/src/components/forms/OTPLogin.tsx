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
  
  const { setAuthenticated, setExistingRegistration, clearAuthentication } = useVisitorAuthStore();
  const { clearDraft } = useRegistrationStore();

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

    if (typeof window !== 'undefined') {
      try {
        initializeRecaptcha('recaptcha-container');
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA:', error);
      }
    }

    return () => {
      cleanupRecaptcha();
    };
  }, []);

  // Validate phone number
  const isValidPhone = (): boolean => {
    return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
  };

  // Handle phone number submission
  const handleSendOTP = async () => {
    if (!isValidPhone()) {
      toast.error('Invalid phone number', {
        description: 'Please enter a valid phone number with country code',
      });
      return;
    }

    if (!phoneNumber) return;

    setIsLoading(true);

    try {
      // FIRST: Check if user is already registered for THIS exhibition
      console.log('[OTP] Checking if user already registered...');
      
      try {
        const lookupResult = await registrationsApi.lookupVisitorByPhone(phoneNumber);
        
        if (lookupResult && lookupResult.visitor) {
          // Check if they have registration for THIS exhibition
          const existingReg = lookupResult.registrations?.find(
            (reg: any) => reg.exhibitionId === exhibitionId || reg.exhibitionId.toString() === exhibitionId
          );

          if (existingReg) {
            // ✅ ALREADY REGISTERED - Skip OTP, go directly to success page
            console.log('[OTP] User already registered - skipping OTP verification');
            
            // Store authentication
            setAuthenticated(phoneNumber, lookupResult.visitor, lookupResult.registrations);
            setExistingRegistration(existingReg._id || existingReg.registrationId);
            
            toast.success('Welcome back!', {
              description: 'You are already registered. Redirecting to your badge...',
            });

            // Redirect directly to success page
            onAuthSuccess(true, existingReg._id || existingReg.registrationId);
            setIsLoading(false);
            return; // Exit early - no OTP needed!
          }
        }
      } catch (lookupError: any) {
        // If 404 or error, user is not registered yet - continue with OTP
        if (lookupError.response?.status !== 404) {
          console.warn('[OTP] Lookup warning:', lookupError.message);
        }
      }

      // User is NOT registered yet - proceed with OTP verification
      console.log('[OTP] User not registered - sending OTP...');

      if (otpMethod === 'whatsapp') {
        // Send OTP via WhatsApp (Interakt)
        await sendWhatsAppOTP(phoneNumber);
        setShowOTPModal(true);
        setStep('otp');
        
        toast.success('🎪 Aakar Exhibition - WhatsApp OTP Sent!', {
          description: 'Check WhatsApp for your verification code (expires in 10 minutes)',
        });
      } else {
        // Send OTP via SMS (Firebase)
        const result = await sendOTP(phoneNumber);
        setConfirmationResult(result);
        setShowOTPModal(true);
        setStep('otp');
        
        toast.success('🎪 Aakar Exhibition - SMS OTP Sent!', {
          description: 'Check your phone for the verification code',
        });
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      const method = otpMethod === 'whatsapp' ? 'WhatsApp' : 'SMS';
      toast.error(`Failed to send ${method} OTP`, {
        description: error.message || 'Please try again or contact support',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification success
  const handleVerificationSuccess = async () => {
    if (!phoneNumber) return;

    setIsLoading(true);

    try {
      // Lookup visitor by phone number
      console.log('[OTP] Looking up visitor for phone:', phoneNumber);
      const lookupResult = await registrationsApi.lookupVisitorByPhone(phoneNumber);
      console.log('[OTP] Lookup result:', lookupResult);

      if (lookupResult && lookupResult.visitor) {
        console.log('[OTP] Visitor found:', {
          name: lookupResult.visitor.name,
          phone: lookupResult.visitor.phone,
          email: lookupResult.visitor.email,
        });

        // Visitor exists - check if they have registration for THIS exhibition
        const existingReg = lookupResult.registrations?.find(
          (reg: any) => reg.exhibitionId === exhibitionId || reg.exhibitionId.toString() === exhibitionId
        );

        if (existingReg) {
          // ✅ HAS EXISTING REGISTRATION - Redirect directly to success page
          console.log('[OTP] User already registered:', {
            registrationId: existingReg._id || existingReg.registrationId,
            exhibitionId: existingReg.exhibitionId,
          });

          // Store authentication
          console.log('[OTP] Storing authenticated visitor data:', lookupResult.visitor);
          setAuthenticated(phoneNumber, lookupResult.visitor, lookupResult.registrations);
          setExistingRegistration(existingReg._id || existingReg.registrationId);
          
          toast.success('Welcome back!', {
            description: 'You are already registered for this exhibition. Redirecting to your badge...',
          });

          // Pass registration ID for redirect
          onAuthSuccess(true, existingReg._id || existingReg.registrationId);
        } else {
          // ✅ NEW REGISTRATION NEEDED - Show form
          console.log('[OTP] Returning visitor, no registration for this exhibition');
          
          // Store authentication
          console.log('[OTP] Storing authenticated visitor data:', lookupResult.visitor);
          setAuthenticated(phoneNumber, lookupResult.visitor, lookupResult.registrations);
          
          toast.success('Authentication successful!', {
            description: 'Please complete the registration form',
          });

          onAuthSuccess(false);
        }
      } else {
        // ✅ NEW VISITOR - Show form
        console.log('[OTP] New visitor, never registered before');
        
        console.log('[OTP] Storing new visitor with phone only:', phoneNumber);
        setAuthenticated(phoneNumber, null, []);
        
        toast.success('Welcome!', {
          description: 'Please fill in your details to complete registration',
        });

        onAuthSuccess(false);
      }
    } catch (error: any) {
      // If 404, it's a new visitor (not an error)
      if (error.response?.status === 404) {
        console.log('[OTP] Visitor not found (404), treating as new visitor');
        setAuthenticated(phoneNumber, null, []);
        
        toast.success('Welcome!', {
          description: 'Please fill in your details to complete registration',
        });

        onAuthSuccess(false);
      } else {
        toast.error('Verification failed', {
          description: 'Please try again or contact support',
        });
      }
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
            disabled={!isValidPhone() || isLoading}
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

      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>

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

