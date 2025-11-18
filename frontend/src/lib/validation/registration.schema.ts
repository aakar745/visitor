import { z } from 'zod';
import { VALIDATION } from '../constants';

/**
 * Core Personal Information Schema
 * 
 * IMPORTANT: Only email and name are hardcoded core fields.
 * All other fields (phone, company, address, etc.) should be 
 * configured as custom fields in the admin panel.
 */
export const corePersonalInfoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .regex(VALIDATION.email.pattern, 'Invalid email format')
    .toLowerCase()
    .trim(),

  name: z
    .string()
    .min(VALIDATION.name.min, `Name must be at least ${VALIDATION.name.min} characters`)
    .max(VALIDATION.name.max, `Name cannot exceed ${VALIDATION.name.max} characters`)
    .trim()
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, dots, hyphens, and apostrophes'),
});

/**
 * Legacy schemas - kept for backward compatibility
 * These fields should now be created as custom fields in admin panel
 */
export const personalInfoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .regex(VALIDATION.email.pattern, 'Invalid email format')
    .toLowerCase()
    .trim(),

  name: z
    .string()
    .min(VALIDATION.name.min, `Name must be at least ${VALIDATION.name.min} characters`)
    .max(VALIDATION.name.max, `Name cannot exceed ${VALIDATION.name.max} characters`)
    .trim()
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, dots, hyphens, and apostrophes'),

  phone: z
    .string()
    .min(VALIDATION.phone.min, `Phone must be at least ${VALIDATION.phone.min} digits`)
    .max(VALIDATION.phone.max, `Phone cannot exceed ${VALIDATION.phone.max} digits`)
    .regex(VALIDATION.phone.pattern, 'Please enter a valid phone number')
    .trim()
    .optional()
    .or(z.literal('')),

  company: z
    .string()
    .min(VALIDATION.company.min, `Company must be at least ${VALIDATION.company.min} characters`)
    .max(VALIDATION.company.max, `Company cannot exceed ${VALIDATION.company.max} characters`)
    .trim()
    .optional()
    .or(z.literal('')),

  designation: z.string().max(100, 'Designation cannot exceed 100 characters').trim().optional().or(z.literal('')),
});

/**
 * Address Information Schema
 */
export const addressSchema = z.object({
  state: z.string().min(1, 'State is required').trim().optional().or(z.literal('')),

  city: z.string().min(1, 'City is required').trim().optional().or(z.literal('')),

  pincode: z
    .string()
    .regex(VALIDATION.pincode.pattern, 'Please enter a valid 6-digit pincode')
    .length(6, 'Pincode must be exactly 6 digits')
    .optional()
    .or(z.literal('')),

  address: z.string().max(500, 'Address cannot exceed 500 characters').trim().optional().or(z.literal('')),
});

/**
 * Exhibition-specific Registration Schema
 */
export const exhibitionRegistrationSchema = z.object({
  exhibitionId: z.string().min(1, 'Exhibition ID is required'),

  registrationCategory: z.string().min(1, 'Please select a registration category'),

  selectedInterests: z.array(z.string()).optional().default([]),

  customFieldData: z.record(z.string(), z.any()).optional().default({}),

  pricingTierId: z.string().optional(),

  selectedDays: z.array(z.number()).optional().default([]),

  exhibitorId: z.string().optional(),

  referralCode: z.string().optional(),
});

/**
 * Complete Registration Form Schema (New - Dynamic Fields)
 * ALL fields (including email and name) come from customFieldData
 * Email and name will be extracted from customFieldData during submission
 */
export const registrationFormSchema = exhibitionRegistrationSchema;

/**
 * Legacy Complete Registration Form Schema
 * Kept for backward compatibility
 */
export const legacyRegistrationFormSchema = personalInfoSchema
  .merge(addressSchema)
  .merge(exhibitionRegistrationSchema);

/**
 * Type inference from schemas
 */
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ExhibitionRegistrationFormData = z.infer<typeof exhibitionRegistrationSchema>;
export type RegistrationFormData = z.infer<typeof registrationFormSchema>;

/**
 * Dynamic custom field validation generator
 */
export function createCustomFieldSchema(field: {
  name: string;
  type: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}) {
  let fieldSchema: z.ZodTypeAny = z.string();

  // Apply type-specific validation
  switch (field.type) {
    case 'email':
      fieldSchema = z.string().email('Please enter a valid email');
      break;
    case 'phone':
      fieldSchema = z
        .string()
        .regex(VALIDATION.phone.pattern, 'Please enter a valid phone number');
      break;
    case 'number':
      fieldSchema = z.coerce.number();
      break;
    case 'url':
      fieldSchema = z.string().url('Please enter a valid URL');
      break;
    default:
      fieldSchema = z.string();
  }

  // Apply custom validation rules
  if (field.validation) {
    if (field.validation.min && typeof field.validation.min === 'number') {
      fieldSchema = (fieldSchema as z.ZodString).min(
        field.validation.min,
        `Minimum ${field.validation.min} characters required`
      );
    }
    if (field.validation.max && typeof field.validation.max === 'number') {
      fieldSchema = (fieldSchema as z.ZodString).max(
        field.validation.max,
        `Maximum ${field.validation.max} characters allowed`
      );
    }
    if (field.validation.pattern) {
      fieldSchema = (fieldSchema as z.ZodString).regex(
        new RegExp(field.validation.pattern),
        'Invalid format'
      );
    }
  }

  // Make optional if not required
  if (!field.required) {
    fieldSchema = fieldSchema.optional().or(z.literal(''));
  }

  return fieldSchema;
}

