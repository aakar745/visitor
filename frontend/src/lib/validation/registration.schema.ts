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
 * Exhibition-specific Registration Schema (Base)
 */
export const exhibitionRegistrationSchema = z.object({
  exhibitionId: z.string().min(1, 'Exhibition ID is required'),

  registrationCategory: z.string().min(1, 'Please select a registration category'),

  // ✅ Interests validation - will be dynamically checked if any interest is marked as required
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
 * Generate dynamic registration schema based on exhibition custom fields and interest options
 * This creates proper Zod validation for required custom fields and required interests
 * 
 * @param customFields - Exhibition custom fields configuration
 * @param interestOptions - Exhibition interest options (optional)
 * @returns Dynamic Zod schema with proper validation
 */
export function createDynamicRegistrationSchema(
  customFields: Array<{
    name: string;
    type: string;
    required: boolean;
    validation?: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    };
  }>,
  interestOptions?: Array<{
    name: string;
    required?: boolean;
    isActive?: boolean;
  }>
) {
  // Build custom field schemas
  const customFieldSchemas: Record<string, z.ZodTypeAny> = {};
  
  customFields.forEach(field => {
    customFieldSchemas[field.name] = createCustomFieldSchema(field);
  });

  // Create dynamic schema for customFieldData
  const customFieldDataSchema = z.object(customFieldSchemas);

  // ✅ Check if any active interest option is marked as required
  const hasRequiredInterest = interestOptions?.some(
    interest => interest.required === true && interest.isActive !== false
  );

  // Build selectedInterests schema based on whether any interest is required
  const selectedInterestsSchema = hasRequiredInterest
    ? z.array(z.string()).min(1, 'Please select at least one interest')
    : z.array(z.string()).optional().default([]);

  // Merge with base registration schema
  return exhibitionRegistrationSchema.extend({
    customFieldData: customFieldDataSchema,
    selectedInterests: selectedInterestsSchema,
  });
}

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
  label?: string;
  type: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}) {
  const fieldLabel = field.label || field.name;
  let fieldSchema: z.ZodTypeAny = z.string();

  // Apply type-specific validation with field-specific messages
  switch (field.type) {
    case 'email':
      fieldSchema = z.string().email(`Please enter a valid email address`);
      // Apply required
      if (field.required) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${fieldLabel} is required`);
      }
      break;
      
    case 'phone':
      fieldSchema = z
        .string()
        .regex(VALIDATION.phone.pattern, `Please enter a valid phone number`);
      // Apply required
      if (field.required) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${fieldLabel} is required`);
      }
      break;
      
    case 'number':
      fieldSchema = z.string().refine(
        (val) => !val || !isNaN(Number(val)),
        { message: `${fieldLabel} must be a valid number` }
      ).transform(val => val ? Number(val) : undefined);
      break;
      
    case 'url':
      fieldSchema = z.string().url(`Please enter a valid URL`);
      // Apply required
      if (field.required) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${fieldLabel} is required`);
      }
      break;
      
    case 'select':
    case 'dropdown':
    case 'api_select':
      // Build the string schema with all validations FIRST
      let selectSchema = z.string();
      
      // Apply required validation
      if (field.required) {
        selectSchema = selectSchema.min(1, `Please select ${fieldLabel.toLowerCase()}`);
      }
      
      // Apply custom validation rules
      if (field.validation) {
        if (field.validation.minLength && typeof field.validation.minLength === 'number') {
          selectSchema = selectSchema.min(
            field.validation.minLength,
            `${fieldLabel} must be at least ${field.validation.minLength} characters`
          );
        }
        if (field.validation.maxLength && typeof field.validation.maxLength === 'number') {
          selectSchema = selectSchema.max(
            field.validation.maxLength,
            `${fieldLabel} cannot exceed ${field.validation.maxLength} characters`
          );
        }
        if (field.validation.pattern) {
          selectSchema = selectSchema.regex(
            new RegExp(field.validation.pattern),
            `${fieldLabel} format is invalid`
          );
        }
      }
      
      // THEN wrap with preprocess to handle undefined
      fieldSchema = z.preprocess(
        (val) => val === undefined || val === null ? '' : val,
        selectSchema
      );
      break;
      
    case 'checkbox':
      // For checkbox fields, must have at least one selection if required
      fieldSchema = z.array(z.string()).min(
        field.required ? 1 : 0, 
        `Please select at least one option for ${fieldLabel.toLowerCase()}`
      );
      break;
      
    case 'radio':
      // Build the string schema with all validations FIRST
      let radioSchema = z.string();
      
      // Apply required validation
      if (field.required) {
        radioSchema = radioSchema.min(1, `Please select an option for ${fieldLabel.toLowerCase()}`);
      }
      
      // Apply custom validation rules
      if (field.validation) {
        if (field.validation.minLength && typeof field.validation.minLength === 'number') {
          radioSchema = radioSchema.min(
            field.validation.minLength,
            `${fieldLabel} must be at least ${field.validation.minLength} characters`
          );
        }
        if (field.validation.maxLength && typeof field.validation.maxLength === 'number') {
          radioSchema = radioSchema.max(
            field.validation.maxLength,
            `${fieldLabel} cannot exceed ${field.validation.maxLength} characters`
          );
        }
        if (field.validation.pattern) {
          radioSchema = radioSchema.regex(
            new RegExp(field.validation.pattern),
            `${fieldLabel} format is invalid`
          );
        }
      }
      
      // THEN wrap with preprocess to handle undefined
      fieldSchema = z.preprocess(
        (val) => val === undefined || val === null ? '' : val,
        radioSchema
      );
      break;
      
    case 'textarea':
      fieldSchema = z.string();
      // Apply required
      if (field.required) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${fieldLabel} is required`);
      }
      break;
      
    default:
      fieldSchema = z.string();
      // Apply required
      if (field.required) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${fieldLabel} is required`);
      }
  }

  // Apply custom validation rules for non-select fields
  if (!['select', 'dropdown', 'api_select', 'radio', 'checkbox', 'number'].includes(field.type) && field.validation) {
    if (fieldSchema instanceof z.ZodString) {
      let stringSchema = fieldSchema as z.ZodString;
      
      // Handle minLength
      if (field.validation.minLength && typeof field.validation.minLength === 'number') {
        stringSchema = stringSchema.min(
          field.validation.minLength,
          `${fieldLabel} must be at least ${field.validation.minLength} characters`
        );
      }
      // Handle maxLength
      if (field.validation.maxLength && typeof field.validation.maxLength === 'number') {
        stringSchema = stringSchema.max(
          field.validation.maxLength,
          `${fieldLabel} cannot exceed ${field.validation.maxLength} characters`
        );
      }
      // Handle pattern validation
      if (field.validation.pattern) {
        stringSchema = stringSchema.regex(
          new RegExp(field.validation.pattern),
          `${fieldLabel} format is invalid`
        );
      }
      // Handle numeric min/max (legacy support)
      if (field.validation.min && typeof field.validation.min === 'number') {
        stringSchema = stringSchema.min(
          field.validation.min,
          `${fieldLabel} must be at least ${field.validation.min} characters`
        );
      }
      if (field.validation.max && typeof field.validation.max === 'number') {
        stringSchema = stringSchema.max(
          field.validation.max,
          `${fieldLabel} cannot exceed ${field.validation.max} characters`
        );
      }
      
      fieldSchema = stringSchema;
    }
  }

  // Make optional if not required (for non-select fields)
  if (!field.required && !['select', 'dropdown', 'api_select', 'radio'].includes(field.type)) {
    if (field.type === 'checkbox') {
      fieldSchema = (fieldSchema as z.ZodArray<any>).optional().or(z.array(z.string()));
    } else if (fieldSchema instanceof z.ZodString) {
      fieldSchema = fieldSchema.optional().or(z.literal(''));
    }
  }

  return fieldSchema;
}

