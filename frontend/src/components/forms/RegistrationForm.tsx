'use client';

import { useEffect, useRef } from 'react';
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
import { registrationFormSchema } from '@/lib/validation/registration.schema';
import { AlertCircle, Save, CheckCircle2, Lock } from 'lucide-react';
import type { Exhibition, Exhibitor, RegistrationFormData } from '@/types';
import { toast } from 'sonner';
import { useVisitorAuthStore } from '@/lib/store/visitorAuthStore';

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

  // Form setup
  const form = useForm<DynamicRegistrationFormData>({
    resolver: zodResolver(registrationFormSchema) as any,
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
      
      // Create a mapping of all possible field name variations to visitor data
      const fieldMapping: Record<string, any> = {};
      
      // Name variations
      if (visitorData.name) {
        fieldMapping['name'] = visitorData.name;
        fieldMapping['full_name'] = visitorData.name;
        fieldMapping['fullname'] = visitorData.name;
        fieldMapping['visitor_name'] = visitorData.name;
        fieldMapping['full name'] = visitorData.name;
      }
      
      // Email variations
      if (visitorData.email) {
        fieldMapping['email'] = visitorData.email;
        fieldMapping['email_address'] = visitorData.email;
        fieldMapping['emailaddress'] = visitorData.email;
        fieldMapping['email address'] = visitorData.email;
      }
      
      // Phone variations (always use the authenticated phone number)
      if (phoneNumber) {
        fieldMapping['phone'] = phoneNumber;
        fieldMapping['mobile'] = phoneNumber;
        fieldMapping['phone_number'] = phoneNumber;
        fieldMapping['mobile_number'] = phoneNumber;
        fieldMapping['phonenumber'] = phoneNumber;
        fieldMapping['mobilenumber'] = phoneNumber;
        fieldMapping['contact'] = phoneNumber;
        fieldMapping['contact_number'] = phoneNumber;
        fieldMapping['contactnumber'] = phoneNumber;
        fieldMapping['phone number'] = phoneNumber;
        fieldMapping['mobile number'] = phoneNumber;
        fieldMapping['contact number'] = phoneNumber;
      }
      
      // Company variations
      if (visitorData.company) {
        fieldMapping['company'] = visitorData.company;
        fieldMapping['company_name'] = visitorData.company;
        fieldMapping['companyname'] = visitorData.company;
        fieldMapping['organization'] = visitorData.company;
        fieldMapping['organisation'] = visitorData.company;
        fieldMapping['company name'] = visitorData.company;
      }
      
      // Designation variations
      if (visitorData.designation) {
        fieldMapping['designation'] = visitorData.designation;
        fieldMapping['job_title'] = visitorData.designation;
        fieldMapping['jobtitle'] = visitorData.designation;
        fieldMapping['position'] = visitorData.designation;
        fieldMapping['role'] = visitorData.designation;
        fieldMapping['job title'] = visitorData.designation;
      }
      
      // City variations
      if (visitorData.city) {
        fieldMapping['city'] = visitorData.city;
        fieldMapping['city_name'] = visitorData.city;
        fieldMapping['cityname'] = visitorData.city;
        fieldMapping['city name'] = visitorData.city;
      }
      
      // State variations
      if (visitorData.state) {
        fieldMapping['state'] = visitorData.state;
        fieldMapping['state_name'] = visitorData.state;
        fieldMapping['statename'] = visitorData.state;
        fieldMapping['state name'] = visitorData.state;
      }
      
      // Pincode variations
      if (visitorData.pincode) {
        fieldMapping['pincode'] = visitorData.pincode;
        fieldMapping['pin_code'] = visitorData.pincode;
        fieldMapping['pin'] = visitorData.pincode;
        fieldMapping['zipcode'] = visitorData.pincode;
        fieldMapping['zip_code'] = visitorData.pincode;
        fieldMapping['postal_code'] = visitorData.pincode;
        fieldMapping['postalcode'] = visitorData.pincode;
        fieldMapping['pin code'] = visitorData.pincode;
        fieldMapping['zip code'] = visitorData.pincode;
        fieldMapping['postal code'] = visitorData.pincode;
      }
      
      // Address variations
      if (visitorData.address) {
        fieldMapping['address'] = visitorData.address;
        fieldMapping['full_address'] = visitorData.address;
        fieldMapping['fulladdress'] = visitorData.address;
        fieldMapping['street_address'] = visitorData.address;
        fieldMapping['streetaddress'] = visitorData.address;
        fieldMapping['full address'] = visitorData.address;
        fieldMapping['street address'] = visitorData.address;
      }
      
      // Auto-fill matching custom fields
      exhibition.customFields.forEach((field) => {
        // Normalize field name for matching (lowercase, remove spaces/underscores)
        const normalizedFieldName = field.name.toLowerCase().replace(/[_\s-]/g, '');
        
        // Try to find a matching value in our mapping
        let matchedValue = null;
        
        // First try exact match with normalized name
        for (const [key, value] of Object.entries(fieldMapping)) {
          const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, '');
          if (normalizedKey === normalizedFieldName) {
            matchedValue = value;
            break;
          }
        }
        
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
      
      // Find phone field in custom fields
      exhibition.customFields.forEach((field) => {
        const normalizedFieldName = field.name.toLowerCase().replace(/[_\s-]/g, '');
        const phoneKeywords = ['phone', 'mobile', 'contact', 'phonenumber', 'mobilenumber', 'contactnumber'];
        
        // Check if this field is a phone field
        const isPhoneField = phoneKeywords.some(keyword => normalizedFieldName.includes(keyword));
        
        if (isPhoneField) {
          form.setValue(`customFieldData.${field.name}`, phoneNumber);
          console.log(`Auto-filled phone field "${field.name}" with:`, phoneNumber);
        }
      });
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
      
      // Map visitor data to custom field names
      const fieldMapping: Record<string, any> = {
        'email': visitor.email,
        'name': visitor.name,
        'full_name': visitor.name,
        'phone': visitor.phone,
        'phone_number': visitor.phone,
        'company': visitor.company,
        'company_name': visitor.company,
        'designation': visitor.designation,
        'state': visitor.state,
        'city': visitor.city,
        'pincode': visitor.pincode,
        'pin_code': visitor.pincode,
        'address': visitor.address,
        'full_address': visitor.address,
      };
      
      // Pre-fill custom fields if they match visitor data
      exhibition.customFields.forEach((field) => {
        const value = fieldMapping[field.name.toLowerCase().replace(/ /g, '_')];
        if (value) {
          form.setValue(`customFieldData.${field.name}`, value);
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
    console.log('[Form Submit] Raw data:', data);
    
    // Extract all fields from customFieldData
    const customData = data.customFieldData || {};
    
    // Field mapping helper (case-insensitive)
    const findField = (keywords: string[]) => {
      const key = Object.keys(customData).find(k => 
        keywords.some(keyword => k.toLowerCase().includes(keyword))
      );
      return key ? customData[key] : undefined;
    };
    
    // Extract email, name, and phone (for dynamic forms)
    const email = findField(['email', 'e_mail', 'e-mail']);
    const name = findField(['name', 'full_name', 'fullname', 'full-name']);
    const phone = findField(['phone', 'mobile', 'contact', 'phone_number']);
    
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
      company: findField(['company', 'organization']) || undefined,
      designation: findField(['designation', 'position', 'title']) || undefined,
      state: findField(['state']) || undefined,
      city: findField(['city']) || undefined,
      pincode: findField(['pincode', 'pin_code', 'postal', 'zip']) || undefined,
      address: findField(['address', 'full_address', 'street']) || undefined,
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
  const prevErrorsRef = useRef<string>('');
  
  useEffect(() => {
    const currentErrors = JSON.stringify(form.formState.errors);
    
    if (Object.keys(form.formState.errors).length > 0 && currentErrors !== prevErrorsRef.current) {
      console.log('[Form Validation Errors]:', form.formState.errors);
      console.log('[Form Values]:', form.getValues());
      
      // Show specific error messages
      const errorFields = Object.keys(form.formState.errors);
      toast.error('Please fill in all required fields correctly', {
        description: `Missing or invalid: ${errorFields.join(', ')}`,
        duration: 5000,
      });
      
      prevErrorsRef.current = currentErrors;
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

