'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PricingSection } from './PricingSection';
import { CustomFieldsSection } from './CustomFieldsSection';
import { useCreateRegistration, useVisitorLookup } from '@/lib/hooks/useRegistration';
import { useFormAutosave, useLoadDraft } from '@/lib/hooks/useFormAutosave';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDynamicRegistrationSchema } from '@/lib/validation/registration.schema';
import { AlertCircle, Save, CheckCircle2, Lock } from 'lucide-react';
import type { Exhibition, Exhibitor, RegistrationFormData } from '@/types';
import { toast } from 'sonner';
import { useVisitorAuthStore } from '@/lib/store/visitorAuthStore';
import {
  createVisitorFieldMapping,
  findMatchingValue,
  isPhoneField,
  isCountryField,
  findFieldByKeywords,
} from '@/lib/utils/visitorFieldMapper';

interface RegistrationFormProps {
  exhibition: Exhibition;
  exhibitor?: Exhibitor;
}

export function RegistrationForm({ exhibition, exhibitor }: RegistrationFormProps) {
  /**
   * GLOBAL PROFILE AUTO-FILL SYSTEM
   * 
   * This form intelligently auto-fills visitor data across different exhibitions:
   * 
   * For RETURNING VISITORS (logged in via OTP):
   * - Visitor data is fetched during OTP authentication
   * - Stored globally in visitorAuthStore
   * - Auto-fills ALL MATCHING FIELDS in the current exhibition's form
   * - Phone number is pre-filled and LOCKED (verified via OTP)
   * - Other fields (name, email, company, etc.) are pre-filled but EDITABLE
   * 
   * For NEW VISITORS (first time):
   * - visitorData will be null
   * - Form appears empty (except phone number from OTP)
   * - User fills in all fields manually
   * - Data becomes their global profile for future exhibitions
   * 
   * Field Matching Logic:
   * - Case-insensitive matching (e.g., "Name", "name", "NAME" all match)
   * - Handles variations (e.g., "Phone", "Mobile", "Contact Number")
   * - Only fills fields that EXIST in current exhibition
   * - New/different fields remain EMPTY for user to fill
   * 
   * Exhibition-Specific Fields:
   * - Each exhibition can have different/additional fields
   * - Pricing tiers (free/paid) are exhibition-specific
   * - Interests/categories are exhibition-specific
   * - Custom fields are dynamically rendered based on admin configuration
   */
  
  // Get consistent IDs
  const exhibitionId = exhibition._id || exhibition.id;
  const exhibitorId = exhibitor?._id || exhibitor?.id || '';

  // Get authenticated phone number and global visitor profile from store
  const { phoneNumber, visitorData, isAuthenticated } = useVisitorAuthStore();

  // Dynamic form data type (all visitor fields are in customFieldData)
  type DynamicRegistrationFormData = {
    exhibitionId: string;
    exhibitorId?: string;
    registrationCategory: string;
    selectedInterests?: string[];
    customFieldData?: Record<string, any>;
    pricingTierId?: string;
    selectedDays?: number[];
    referralCode?: string;
  };

  // ✅ Create dynamic validation schema based on exhibition's custom fields and interest options
  // This ensures required fields and required interests are properly validated
  const validationSchema = useMemo(() => {
    const customFields = exhibition.customFields || [];
    const interestOptions = exhibition.interestOptions || [];
    return createDynamicRegistrationSchema(customFields, interestOptions);
  }, [exhibition.customFields, exhibition.interestOptions]);

  // Form setup
  const form = useForm<DynamicRegistrationFormData>({
    resolver: zodResolver(validationSchema) as any,
    defaultValues: {
      exhibitionId: exhibitionId,
      exhibitorId: exhibitorId,
      registrationCategory: 'general',
      selectedInterests: [],
      customFieldData: {}, // All form fields come from admin panel custom fields
      pricingTierId: undefined,
      selectedDays: [],
    },
    mode: 'onBlur',
  });

  // Hooks
  const { mutate: submitRegistration, isPending: isSubmitting } = useCreateRegistration();
  const { lookupVisitor, isLooking, existingVisitor } = useVisitorLookup();
  const { hasDraft, draft, restoreDraft, discardDraft } = useLoadDraft(exhibitionId);

  // Ensure exhibition and exhibitor IDs are set on mount
  useEffect(() => {
    form.reset({
      ...form.getValues(),
      exhibitionId: exhibitionId,
      exhibitorId: exhibitorId,
      registrationCategory: 'general',
    });
  }, [exhibitionId, exhibitorId]);

  // Pre-fill all visitor data from OTP authentication (Global Profile Data)
  useEffect(() => {
    if (visitorData && exhibition.customFields) {
      console.log('[FORM] Auto-filling form with visitor data from store:', {
        name: visitorData.name,
        phone: visitorData.phone,
        email: visitorData.email,
        company: visitorData.company,
      });
      console.log('[FORM] Authenticated phone number:', phoneNumber);
      console.log('[FORM] Full visitor data object (all fields):', visitorData);
      
      // Create a comprehensive field mapping using the utility
      const fieldMapping = createVisitorFieldMapping(visitorData, phoneNumber || undefined);
      
      // Auto-fill matching custom fields
      exhibition.customFields.forEach((field) => {
        const matchedValue = findMatchingValue(field.name, fieldMapping);
        
        // If value found, set it in the form
        if (matchedValue) {
          form.setValue(`customFieldData.${field.name}`, matchedValue);
          console.log(`Auto-filled "${field.name}" with:`, matchedValue);
        }
      });
      
      toast.success('Welcome back!', {
        description: 'Your information has been auto-filled from your profile.',
        duration: 3000,
      });
    }
  }, [visitorData, phoneNumber, exhibition.customFields, form]);

  // Auto-fill phone number for NEW visitors (who just completed OTP but have no profile yet)
  useEffect(() => {
    if (phoneNumber && !visitorData && exhibition.customFields) {
      console.log('Auto-filling phone for new visitor:', phoneNumber);
      
      // Find phone field in custom fields using the utility
      exhibition.customFields.forEach((field) => {
        if (isPhoneField(field.name)) {
          form.setValue(`customFieldData.${field.name}`, phoneNumber);
          console.log(`Auto-filled phone field "${field.name}" with:`, phoneNumber);
        }
      });
    }
  }, [phoneNumber, visitorData, exhibition.customFields, form]);

  // Auto-detect and fill country based on phone number (for Indian numbers)
  useEffect(() => {
    if (phoneNumber && !visitorData && exhibition.customFields) {
      // Detect if phone number is Indian (+91 or starts with 91)
      const isIndianNumber = phoneNumber.startsWith('+91') || phoneNumber.startsWith('91');
      
      if (isIndianNumber) {
        console.log('Indian phone number detected, auto-filling country as India');
        
        // Find country field in custom fields using the utility
        exhibition.customFields.forEach((field) => {
          if (isCountryField(field.name) && field.type === 'select') {
            // Auto-fill with "India" for Indian phone numbers
            form.setValue(`customFieldData.${field.name}`, 'India', { shouldValidate: true });
            console.log(`Auto-filled country field "${field.name}" with: India`);
          }
        });
      }
    }
  }, [phoneNumber, visitorData, exhibition.customFields, form]);

  // Watch form values for auto-save
  const watchedValues = form.watch();
  useFormAutosave(watchedValues, exhibitionId, !isSubmitting);

  // Watch email/phone for visitor lookup (from custom fields)
  const customFieldData = form.watch('customFieldData') || {};
  
  // Try to get email or phone for lookup
  const emailKey = Object.keys(customFieldData).find(key => key.toLowerCase().includes('email'));
  const phoneKey = Object.keys(customFieldData).find(key => key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile'));
  
  const contactValue = emailKey ? customFieldData[emailKey] : (phoneKey ? customFieldData[phoneKey] : '');
  const debouncedContact = useDebounce(contactValue, 800);

  // Visitor lookup effect (by email) - Only if we don't have OTP-authenticated data
  useEffect(() => {
    // CRITICAL: Skip email lookup if user is authenticated via OTP
    // Even if visitorData is null (new visitor), we should not trigger email lookup
    // This prevents old draft emails from loading wrong visitor data
    if (isAuthenticated) {
      console.log('[FORM] Skipping email lookup - user authenticated via OTP');
      return;
    }
    
    if (debouncedContact && typeof debouncedContact === 'string' && debouncedContact.length > 5) {
      // Only lookup by email for now (phone lookup is handled via OTP)
      if (debouncedContact.includes('@')) {
        console.log('[FORM] Triggering email lookup for:', debouncedContact);
        lookupVisitor(debouncedContact);
      }
    }
  }, [debouncedContact, lookupVisitor, isAuthenticated]);

  // Pre-fill existing visitor data from email lookup (only as fallback)
  useEffect(() => {
    // Skip if user is authenticated via OTP (even if visitorData is null for new visitors)
    if (isAuthenticated) {
      console.log('[FORM] Skipping email lookup pre-fill - user authenticated via OTP');
      return;
    }
    
    if (existingVisitor?.visitor && exhibition.customFields) {
      const { visitor } = existingVisitor;
      
      // Use the visitor field mapping utility for consistency
      const fieldMapping = createVisitorFieldMapping(visitor);
      
      // Pre-fill custom fields if they match visitor data
      exhibition.customFields.forEach((field) => {
        const matchedValue = findMatchingValue(field.name, fieldMapping);
        if (matchedValue) {
          form.setValue(`customFieldData.${field.name}`, matchedValue);
        }
      });
    }
  }, [existingVisitor, exhibition.customFields, form, visitorData]);

  // Show draft restore prompt (only once)
  const draftPromptShownRef = useRef(false);
  
  useEffect(() => {
    // Only show the prompt once per page load
    if (hasDraft && !existingVisitor && !draftPromptShownRef.current) {
      draftPromptShownRef.current = true;
      
      toast.info('Saved draft found!', {
        description: 'Would you like to restore your previous entries?',
        action: {
          label: 'Restore',
          onClick: () => {
            const restoredDraft = restoreDraft();
            if (restoredDraft) {
              Object.entries(restoredDraft).forEach(([key, value]) => {
                form.setValue(key as any, value);
              });
              toast.success('Draft restored successfully!');
            }
          },
        },
        cancel: {
          label: 'Discard',
          onClick: () => {
            discardDraft();
            toast.success('Draft discarded');
          },
        },
        duration: 10000,
      });
    }
    
    // Reset the flag when visitor data is loaded
    if (existingVisitor) {
      draftPromptShownRef.current = false;
    }
  }, [hasDraft, existingVisitor]);

  // Handle form submission
  const onSubmit = (data: DynamicRegistrationFormData) => {
    
    // Extract all fields from customFieldData
    const customData = data.customFieldData || {};
    
    // Extract email, name, and phone using the utility (for dynamic forms)
    const email = findFieldByKeywords(customData, ['email', 'e_mail', 'e-mail']);
    const name = findFieldByKeywords(customData, ['name', 'full_name', 'fullname', 'full-name']);
    const phone = findFieldByKeywords(customData, ['phone', 'mobile', 'contact', 'phone_number']);
    
    // Validate: At least one of email or phone must be present
    if (!email && !phone) {
      toast.error('Contact information required', {
        description: 'Please provide either email or phone number',
      });
      console.error('[Form Submit] Missing both email and phone in customFieldData');
      return;
    }
    
    // Filter out undefined values from selectedInterests
    const cleanedInterests = (data.selectedInterests || []).filter(id => id !== undefined && id !== null);
    
    // Extract common fields from customFieldData for backend compatibility
    const submissionData: any = {
      exhibitionId: data.exhibitionId,
      registrationCategory: data.registrationCategory,
      email: email || undefined,
      name: name || undefined,
      phone: phone || undefined,
      company: findFieldByKeywords(customData, ['company', 'organization']) || undefined,
      designation: findFieldByKeywords(customData, ['designation', 'position', 'title']) || undefined,
      state: findFieldByKeywords(customData, ['state']) || undefined,
      city: findFieldByKeywords(customData, ['city']) || undefined,
      pincode: findFieldByKeywords(customData, ['pincode', 'pin_code', 'postal', 'zip']) || undefined,
      address: findFieldByKeywords(customData, ['address', 'full_address', 'street']) || undefined,
      customFieldData: customData, // Keep all custom fields
      selectedInterests: cleanedInterests, // Clean interests array
      // CRITICAL: Include pricing tier ID and selected days for paid exhibitions
      pricingTierId: data.pricingTierId,
      selectedDays: data.selectedDays, // Don't use || as it converts [] to undefined
    };
    
    // Add exhibitor reference if present
    if (exhibitor) {
      submissionData.exhibitorId = exhibitorId;
      submissionData.referralCode = exhibitor.referralCode;
    }
    
    console.log('[Form Submit] Prepared data:', submissionData);
    console.log('[Form Submit] Pricing Tier ID:', submissionData.pricingTierId);
    console.log('[Form Submit] Selected Days:', submissionData.selectedDays);
    submitRegistration(submissionData);
  };

  // Log form errors (only once when errors change)
  // Log validation errors for debugging (removed generic toast notification)
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('[Form Validation Errors]:', form.formState.errors);
      console.log('[Form Values]:', form.getValues());
      
      // Scroll to first error field for better UX
      const firstErrorField = Object.keys(form.formState.errors)[0];
      if (firstErrorField) {
        // Find the field element and scroll to it
        const errorElement = document.querySelector(`[name*="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [form.formState.errors, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Exhibitor Reference Banner */}
      {exhibitor && (
        <Alert className="border-primary bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription>
            <span className="font-semibold">Referred by {exhibitor.name}</span>
            <p className="text-sm text-muted-foreground mt-1">
              {exhibitor.description || 'You are registering through an exhibitor referral.'}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Registration Form - All fields in one clean section */}
      <Card className="p-6">
        <CustomFieldsSection 
          form={form as any} 
          exhibition={exhibition}
          isLookingUpVisitor={isLooking}
          existingVisitor={existingVisitor?.visitor}
        />
      </Card>

      {/* Pricing (if exhibition is paid) */}
      {exhibition.isPaid && (
        <Card className="p-4">
          <PricingSection form={form as any} exhibition={exhibition} />
        </Card>
      )}

      {/* Form Actions */}
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Save className="h-4 w-4" />
              <span>Your progress is automatically saved</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[200px] h-10 rounded-md px-8"
              onClick={(e) => {
                // Manual validation check on click
                const errors = form.formState.errors;
                if (Object.keys(errors).length > 0) {
                  console.log('[Button Click] Form has errors:', errors);
                  console.log('[Button Click] Form values:', form.getValues());
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Submitting...
                </>
              ) : exhibition.isPaid ? (
                (() => {
                  const selectedTierId = form.watch('pricingTierId');
                  const selectedTier = exhibition.pricingTiers?.find(t => {
                    const tierId = (t as any).id || (t as any)._id;
                    return tierId === selectedTierId;
                  });
                  const price = selectedTier?.price || 0;
                  return `Register & Pay ₹${price}`;
                })()
              ) : (
                'Complete Registration'
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By registering, you agree to our terms and conditions
          </p>
        </div>
      </Card>
    </form>
  );
}

