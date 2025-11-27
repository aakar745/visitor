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
  MessageSquare,
  Building2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { registrationsApi } from '@/lib/api/registrations';
import { useVisitorAuthStore } from '@/lib/store/visitorAuthStore';
import { useRegistrationStore } from '@/lib/store/registration.store';
import PhoneInput from './PhoneInput';
import { OTPModal } from './OTPModal';
import { isValidPhoneNumber } from 'libphonenumber-js';
import type { E164Number } from 'libphonenumber-js';
import type firebase from 'firebase/compat/app';
import { sendWhatsAppOTP } from '@/lib/api/whatsappOtp';
import Image from 'next/image';

// 🔥 Lazy load Firebase only when SMS method is selected
let firebaseLoaded = false;
let sendOTP: any = null;
let cleanupRecaptcha: any = null;

const loadFirebase = async () => {
  if (firebaseLoaded) return { sendOTP, cleanupRecaptcha };
  
  const phoneAuth = await import('@/lib/firebase/phoneAuth');
  sendOTP = phoneAuth.sendOTP;
  cleanupRecaptcha = phoneAuth.cleanupRecaptcha;
  firebaseLoaded = true;
  
  return { sendOTP, cleanupRecaptcha };
};

interface OTPLoginProps {
  exhibitionId: string;
  exhibitionName: string;
  exhibitionLogo?: string;
  exhibitorLogo?: string;
  exhibitor?: {
    name: string;
    companyName?: string;
    boothNumber?: string;
  };
  onAuthSuccess: (hasExistingRegistration: boolean, registrationId?: string) => void;
}

type Step = 'phone' | 'otp';
type OTPMethod = 'sms' | 'whatsapp';

export function OTPLogin({ exhibitionId, exhibitionName, exhibitionLogo, exhibitorLogo, exhibitor, onAuthSuccess }: OTPLoginProps) {
  const [step, setStep] = useState<Step>('phone');
  const [otpMethod, setOtpMethod] = useState<OTPMethod>('whatsapp'); // Default to WhatsApp
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<firebase.auth.ConfirmationResult | null>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  
  // Rate limiting state
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [nextRetryDelay, setNextRetryDelay] = useState(0);
  
  const { setAuthenticated, setExistingRegistration, clearAuthentication } = useVisitorAuthStore();
  const { clearDraft } = useRegistrationStore();
  
  // Initialize component: clear old auth data
  useEffect(() => {
    // CRITICAL: Clear any old persisted visitor data from localStorage
    // This prevents old visitor data from auto-filling when a new user logs in
    clearAuthentication();
    console.log('[OTP] Cleared old authentication data');
    
    // CRITICAL: Also clear any old form drafts from previous users
    // Drafts are keyed by exhibitionId only, so they persist across different users
    clearDraft();
    console.log('[OTP] Cleared old form drafts');

    // Cleanup reCAPTCHA on component unmount
    return () => {
      console.log('[OTP] Component unmounting - cleaning up reCAPTCHA');
      if (cleanupRecaptcha) {
      cleanupRecaptcha();
      }
    };
  }, []);

  // 🔥 Lazy load Firebase when SMS method is selected
  useEffect(() => {
    if (otpMethod === 'sms' && !firebaseLoaded) {
      loadFirebase().then(() => {
        console.log('[OTP] ✅ Firebase loaded lazily');
      });
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
        setRetryAttempts(0); // Reset on success
        
        toast.success('🎪 Aakar Exhibition - WhatsApp OTP Sent!', {
          description: 'Check WhatsApp for your verification code (expires in 10 minutes)',
        });
      } else {
        // 🔥 Load Firebase first (lazy load)
        const { sendOTP: sendOTPFn } = await loadFirebase();
        
        // Send OTP via SMS (Firebase) - reCAPTCHA created ON-DEMAND
        const confirmation = await sendOTPFn(phoneNumber);
        
        if (!confirmation) {
          throw new Error('Failed to initialize OTP session');
        }
        
        setConfirmationResult(confirmation);
        setShowOTPModal(true);
        setStep('otp');
        setRetryAttempts(0); // Reset on success
        
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
        toast.error('Too many attempts', {
          description: `Please wait 15 minutes before trying again`,
        });
        setIsLoading(false);
        return;
      }
      
      // 🔥 NO AUTO-RETRY - User must manually retry
      // Auto-retry causes token conflicts with Firebase reCAPTCHA
      const method = otpMethod === 'whatsapp' ? 'WhatsApp' : 'SMS';
      toast.error(`Failed to send ${method} OTP`, {
        description: error.message || 'Please try again manually',
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

  // 🔥 Calculate exponential backoff delay
  const calculateBackoffDelay = (attempts: number): number => {
    // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
    const baseDelay = 2000; // 2 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempts), 30000);
    return delay;
  };

  // Handle resend OTP with exponential backoff
  const handleResendOTP = async () => {
    setShowOTPModal(false);
    
    // Calculate delay for this retry attempt
    const delay = calculateBackoffDelay(retryAttempts);
    setNextRetryDelay(delay);
    
    // Show user-friendly message about wait time
    if (retryAttempts > 0) {
      toast.info(`Waiting ${delay / 1000}s before retry...`, {
        description: 'This prevents rate limiting',
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setRetryAttempts(prev => prev + 1);
    await handleSendOTP();
  };

  // Handle switching from SMS to WhatsApp
  const handleSwitchToWhatsApp = async () => {
    if (!phoneNumber) return;
    
    setShowOTPModal(false);
    setOtpMethod('whatsapp');
    setIsLoading(true);
    
    toast.info('Switching to WhatsApp...', {
      description: 'Sending OTP via WhatsApp now',
    });
    
    try {
      // Send OTP via WhatsApp directly (bypass method check)
      await sendWhatsAppOTP(phoneNumber);
      setShowOTPModal(true);
      setStep('otp');
      setRetryAttempts(0);
      
      toast.success('🎪 Aakar Exhibition - WhatsApp OTP Sent!', {
        description: 'Check WhatsApp for your verification code (expires in 10 minutes)',
      });
    } catch (error: any) {
      console.error('Switch to WhatsApp error:', error);
      toast.error('Failed to send WhatsApp OTP', {
        description: error.message || 'Please try again manually',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main OTP Card */}
      <Card className="p-8">
        {/* Phone Number Entry */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            {/* Exhibition Logo + Exhibitor Logo (side-by-side when exhibitor exists) */}
            {exhibitionLogo || exhibitorLogo ? (
              <div className="inline-flex items-center justify-center gap-4 mb-4">
                {/* Exhibition Logo */}
                {exhibitionLogo && (
                  <div className="inline-flex h-[120px] w-auto max-w-[200px] items-center justify-center rounded-2xl bg-white overflow-hidden shadow-lg px-3 py-2">
                    <div className="relative h-full w-auto">
                      <Image
                        src={exhibitionLogo}
                        alt={exhibitionName}
                        width={200}
                        height={120}
                        className="object-contain h-full w-auto"
                      />
                    </div>
                  </div>
                )}
                
                {/* Exhibitor Logo (shown when present) */}
                {exhibitorLogo && (
                  <div className="inline-flex h-[120px] w-auto max-w-[200px] items-center justify-center rounded-2xl bg-white overflow-hidden shadow-lg px-3 py-2">
                    <div className="relative h-full w-auto">
                      <Image
                        src={exhibitorLogo}
                        alt="Exhibitor logo"
                        width={200}
                        height={120}
                        className="object-contain h-full w-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="inline-flex h-[120px] w-[120px] items-center justify-center rounded-full bg-primary/10 mb-4">
              {otpMethod === 'whatsapp' ? (
                  <MessageCircle className="h-16 w-16 text-green-600" />
              ) : (
                  <MessageSquare className="h-16 w-16 text-primary" />
              )}
            </div>
            )}
            
            {/* Exhibitor Context Banner - RIGHT BELOW LOGOS */}
            {exhibitor && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg text-sm mb-4">
                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  Registering via <span className="font-medium text-foreground">{exhibitor.companyName}</span>
                  {exhibitor.boothNumber && (
                    <span className="text-muted-foreground ml-1">• Stall No. {exhibitor.boothNumber}</span>
                  )}
                </span>
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-2">Choose Verification Method</h3>
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

          {/* Send OTP Button */}
          <Button
            onClick={handleSendOTP}
            disabled={!isValidPhone() || isLoading || (lockoutTime !== null && new Date() < lockoutTime)}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {otpMethod === 'whatsapp' ? 'Sending to WhatsApp...' : 'Sending SMS...'}
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

          {/* Info Alert */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>🎪 Aakar Exhibition</strong> - Your mobile number will be used to verify your identity and send event updates. 
              We respect your privacy and won't share your information.
            </AlertDescription>
          </Alert>

          {/* Loading Progress Indicator */}
          {isLoading && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground animate-pulse">
                {otpMethod === 'whatsapp' 
                  ? '⚡ Usually arrives in 2-5 seconds...' 
                  : '📱 Usually arrives in 10-30 seconds...'}
              </p>
            </div>
          )}

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
        onSwitchToWhatsApp={handleSwitchToWhatsApp}
        companyName="Aakar Exhibition"
        otpMethod={otpMethod}
      />

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

