/**
 * Visitor Field Mapping Utility
 * 
 * Handles mapping of visitor profile data to various field name formats.
 * This eliminates duplicate field matching code across the codebase.
 */

export interface VisitorData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  designation?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  country?: string;
  [key: string]: any;
}

/**
 * Field name variations for common visitor data fields
 * Maps normalized field names to their possible variations in forms
 */
const FIELD_VARIATIONS: Record<string, string[]> = {
  name: ['name', 'full_name', 'fullname', 'visitor_name', 'full name'],
  email: ['email', 'email_address', 'emailaddress', 'email address'],
  phone: ['phone', 'mobile', 'phone_number', 'mobile_number', 'phonenumber', 
          'mobilenumber', 'contact', 'contact_number', 'contactnumber', 
          'phone number', 'mobile number', 'contact number'],
  company: ['company', 'company_name', 'companyname', 'organization', 
            'organisation', 'company name'],
  designation: ['designation', 'job_title', 'jobtitle', 'position', 'role', 'job title'],
  city: ['city', 'city_name', 'cityname', 'city name'],
  state: ['state', 'state_name', 'statename', 'state name'],
  pincode: ['pincode', 'pin_code', 'pin', 'zipcode', 'zip_code', 
            'postal_code', 'postalcode', 'pin code', 'zip code', 'postal code'],
  address: ['address', 'full_address', 'fulladdress', 'street_address', 
            'streetaddress', 'full address', 'street address'],
  country: ['country', 'country_name', 'countryname', 'nation', 'country name'],
};

/**
 * Create a comprehensive field mapping from visitor data
 * Maps all possible field name variations to their values
 * 
 * @param visitorData - The visitor profile data
 * @param phoneNumber - Optional phone number to use (e.g., from OTP auth)
 * @returns Record of field name variations to values
 */
export function createVisitorFieldMapping(
  visitorData: VisitorData | null,
  phoneNumber?: string
): Record<string, any> {
  const mapping: Record<string, any> = {};

  if (!visitorData && !phoneNumber) {
    return mapping;
  }

  // Map standard fields using their variations
  const fieldValues: Record<string, any> = {
    name: visitorData?.name,
    email: visitorData?.email,
    phone: phoneNumber || visitorData?.phone, // Prefer authenticated phone
    company: visitorData?.company,
    designation: visitorData?.designation,
    city: visitorData?.city,
    state: visitorData?.state,
    pincode: visitorData?.pincode,
    address: visitorData?.address,
    country: visitorData?.country || (visitorData as any)?.Country,
  };

  // Create mappings for all variations
  for (const [fieldKey, variations] of Object.entries(FIELD_VARIATIONS)) {
    const value = fieldValues[fieldKey];
    if (value) {
      for (const variation of variations) {
        mapping[variation] = value;
      }
    }
  }

  // Add any additional dynamic fields from visitor data
  if (visitorData) {
    const skipFields = [
      '_id', 'id', 'createdAt', 'updatedAt', 'totalRegistrations',
      'lastRegistrationDate', 'registeredExhibitions',
      // Skip standard fields (already handled above)
      'name', 'email', 'phone', 'company', 'designation',
      'city', 'state', 'pincode', 'address', 'country'
    ];

    Object.entries(visitorData).forEach(([key, value]) => {
      if (value && !skipFields.includes(key)) {
        mapping[key.toLowerCase()] = value;
      }
    });
  }

  return mapping;
}

/**
 * Normalize a field name for matching
 * Removes underscores, spaces, and dashes; converts to lowercase
 * 
 * @param fieldName - The field name to normalize
 * @returns Normalized field name
 */
export function normalizeFieldName(fieldName: string): string {
  return fieldName.toLowerCase().replace(/[_\s-]/g, '');
}

/**
 * Find a matching value from the field mapping for a given field name
 * 
 * @param fieldName - The field name to find a value for
 * @param fieldMapping - The mapping of field name variations to values
 * @returns The matched value or undefined
 */
export function findMatchingValue(
  fieldName: string,
  fieldMapping: Record<string, any>
): any {
  const normalizedFieldName = normalizeFieldName(fieldName);

  for (const [key, value] of Object.entries(fieldMapping)) {
    const normalizedKey = normalizeFieldName(key);
    if (normalizedKey === normalizedFieldName) {
      return value;
    }
  }

  return undefined;
}

/**
 * Check if a field name matches phone-related keywords
 * 
 * @param fieldName - The field name to check
 * @returns Whether the field is likely a phone field
 */
export function isPhoneField(fieldName: string): boolean {
  const normalizedName = normalizeFieldName(fieldName);
  const phoneKeywords = ['phone', 'mobile', 'contact', 'phonenumber', 'mobilenumber', 'contactnumber'];
  return phoneKeywords.some(keyword => normalizedName.includes(keyword));
}

/**
 * Check if a field name matches country-related keywords
 * 
 * @param fieldName - The field name to check
 * @returns Whether the field is likely a country field
 */
export function isCountryField(fieldName: string): boolean {
  const normalizedName = normalizeFieldName(fieldName);
  const countryKeywords = ['country', 'nation', 'countryname'];
  return countryKeywords.some(keyword => normalizedName.includes(keyword));
}

/**
 * Find field value by keywords in form data
 * Useful for extracting common fields from custom form data
 * 
 * @param customData - The custom field data object
 * @param keywords - Keywords to search for in field names
 * @returns The found value or undefined
 */
export function findFieldByKeywords(
  customData: Record<string, any>,
  keywords: string[]
): any {
  const key = Object.keys(customData).find(k =>
    keywords.some(keyword => k.toLowerCase().includes(keyword))
  );
  return key ? customData[key] : undefined;
}

