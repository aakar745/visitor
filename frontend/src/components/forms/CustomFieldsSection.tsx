'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormData, Exhibition, CustomField } from '@/types';
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { locationsApi } from '@/lib/api/locations';
import { Loader2, CheckCircle, Check, Lock, MapPin } from 'lucide-react';
import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useVisitorAuthStore } from '@/lib/store/visitorAuthStore';
import { toast } from 'sonner';

interface CustomFieldsSectionProps {
  form: UseFormReturn<RegistrationFormData>;
  exhibition: Exhibition;
  isLookingUpVisitor?: boolean;
  existingVisitor?: any;
}

// Category labels mapping
const CATEGORY_LABELS: Record<string, string> = {
  general: 'General Visitor',
  vip: 'VIP',
  media: 'Media',
  exhibitor: 'Exhibitor',
  speaker: 'Speaker',
  guest: 'Guest',
};

export function CustomFieldsSection({ 
  form, 
  exhibition,
  isLookingUpVisitor = false,
  existingVisitor 
}: CustomFieldsSectionProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  // Get authenticated phone number
  const { phoneNumber } = useVisitorAuthStore();

  // PIN code auto-fill state
  const [lookingUpPincode, setLookingUpPincode] = useState(false);
  const [pincodeFound, setPincodeFound] = useState(false);

  // PIN code autocomplete state
  const [pincodeSuggestions, setPincodeSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [activePincodeField, setActivePincodeField] = useState<string | null>(null);

  // Load countries from database
  const [countries, setCountries] = useState<Array<{name: string; code: string}>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const customFields = exhibitionsApi.getCustomFields(exhibition);

  // Fetch countries on mount (using proper API client)
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const countriesData = await locationsApi.getCountries();
        setCountries(countriesData.filter((c: any) => c.isActive));
      } catch (error) {
        console.error('[COUNTRIES] Failed to load:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  if (customFields.length === 0) {
    return null;
  }

  // Helper to check if field is a mobile/phone field
  const isMobileField = (field: CustomField): boolean => {
    const fieldName = field.name.toLowerCase();
    return (
      fieldName.includes('phone') ||
      fieldName.includes('mobile') ||
      fieldName.includes('contact') ||
      field.type === 'phone'
    );
  };

  // Helper to check if field is a PIN code field
  const isPincodeField = (field: CustomField): boolean => {
    const fieldName = field.name.toLowerCase();
    return (
      fieldName.includes('pin') ||
      fieldName.includes('postal') ||
      fieldName.includes('zip')
    );
  };

  // Helper to check if field is a city field
  const isCityField = (field: CustomField): boolean => {
    const fieldName = field.name.toLowerCase();
    return fieldName === 'city' || fieldName.includes('city');
  };

  // Helper to check if field is a state field
  const isStateField = (field: CustomField): boolean => {
    const fieldName = field.name.toLowerCase();
    return fieldName === 'state' || fieldName.includes('state');
  };

  // Helper to check if field is a country field
  const isCountryField = (field: CustomField): boolean => {
    const fieldName = field.name.toLowerCase();
    return fieldName === 'country' || fieldName.includes('country');
  };

  // Handle PIN code lookup and auto-fill
  /**
   * Debounced autocomplete search for PIN codes using Meilisearch
   */
  const handlePincodeAutocomplete = async (query: string, fieldName: string) => {
    // Clear suggestions if query is too short
    if (!query || query.length < 2) {
      setPincodeSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setActivePincodeField(fieldName);
    setAutocompleteLoading(true);

    try {
      const result = await locationsApi.autocompletePincodes(query, 8);
      setPincodeSuggestions(result.hits);
      setShowSuggestions(result.hits.length > 0);
    } catch (error) {
      console.error('Autocomplete failed:', error);
      setPincodeSuggestions([]);
    } finally {
      setAutocompleteLoading(false);
    }
  };

  /**
   * Handle selecting a PIN code from autocomplete suggestions
   */
  const handleSelectSuggestion = (suggestion: any, fieldName: string) => {
    // Set the PIN code value
    setValue(`customFieldData.${fieldName}`, suggestion.pincode, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Find and auto-fill related location fields
    const cityField = customFields.find(isCityField);
    const stateField = customFields.find(isStateField);
    const countryField = customFields.find(isCountryField);

    if (cityField) {
      setValue(`customFieldData.${cityField.name}`, suggestion.cityName, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    if (stateField) {
      setValue(`customFieldData.${stateField.name}`, suggestion.stateName, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    if (countryField) {
      setValue(`customFieldData.${countryField.name}`, suggestion.countryName, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    // Close suggestions and show success
    setShowSuggestions(false);
    setPincodeFound(true);
    toast.success('Location selected!', {
      description: `${suggestion.cityName}, ${suggestion.stateName}, ${suggestion.countryName}`,
      icon: <MapPin className="h-4 w-4" />,
    });

    // Reset success indicator after 2 seconds
    setTimeout(() => setPincodeFound(false), 2000);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.pincode-autocomplete-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePincodeLookup = async (pincode: string) => {
    // Reset state
    setPincodeFound(false);

    // Validate PIN code format (6 digits for India)
    if (!/^\d{6}$/.test(pincode)) {
      return;
    }

    setLookingUpPincode(true);

    try {
      const result = await locationsApi.lookupByPincode(pincode);

      if (result.found && result.city && result.state) {
        // Find city, state, and country fields in the form
        const cityField = customFields.find(isCityField);
        const stateField = customFields.find(isStateField);
        const countryField = customFields.find(isCountryField);

        // Auto-fill city
        if (cityField) {
          setValue(`customFieldData.${cityField.name}`, result.city.name, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        // Auto-fill state
        if (stateField) {
          setValue(`customFieldData.${stateField.name}`, result.state.name, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        // Auto-fill country
        if (countryField && result.country) {
          setValue(`customFieldData.${countryField.name}`, result.country.name, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        setPincodeFound(true);
        toast.success('Location found!', {
          description: `${result.city.name}, ${result.state.name}, ${result.country?.name || ''}`,
          icon: <MapPin className="h-4 w-4" />,
        });
      } else {
        // PIN code not found - allow manual entry
        toast.info('PIN code not found', {
          description: 'Please enter city and state manually',
        });
      }
    } catch (error) {
      console.error('Error looking up PIN code:', error);
      toast.error('Failed to lookup PIN code', {
        description: 'Please enter city and state manually',
      });
    } finally {
      setLookingUpPincode(false);
    }
  };

  const renderField = (field: CustomField) => {
    const fieldName = `customFieldData.${field.name}` as any;
    const fieldError = errors.customFieldData?.[field.name];
    const fieldValue = watch(fieldName);

    // Check if this is a mobile field and user is authenticated
    const isMobileFieldReadonly = isMobileField(field) && Boolean(phoneNumber);

    // Build validation rules from field.validation
    const validationRules: any = {};
    if (field.required) {
      validationRules.required = `${field.label} is required`;
    }
    if (field.validation?.minLength) {
      validationRules.minLength = {
        value: field.validation.minLength,
        message: `Minimum ${field.validation.minLength} characters required`,
      };
    }
    if (field.validation?.maxLength) {
      validationRules.maxLength = {
        value: field.validation.maxLength,
        message: `Maximum ${field.validation.maxLength} characters allowed`,
      };
    }
    if (field.validation?.pattern) {
      validationRules.pattern = {
        value: new RegExp(field.validation.pattern),
        message: `Invalid format for ${field.label}`,
      };
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        const isPincodeFieldType = isPincodeField(field);
        const isCityFieldType = isCityField(field);
        const isStateFieldType = isStateField(field);
        const isLocationField = isCityFieldType || isStateFieldType;

        return (
          <div key={field.id || field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {isMobileFieldReadonly && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-normal">
                  <Lock className="h-3 w-3" />
                  Verified
                </span>
              )}
              {isPincodeFieldType && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-600 font-normal">
                  <MapPin className="h-3 w-3" />
                  Auto-fills country, state & city
                </span>
              )}
              {isLocationField && pincodeFound && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-normal">
                  <CheckCircle className="h-3 w-3" />
                  Auto-filled
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id={field.name}
                type={
                  field.type === 'email'
                    ? 'email'
                    : field.type === 'phone'
                    ? 'tel'
                    : field.type === 'url'
                    ? 'url'
                    : 'text'
                }
                placeholder={field.placeholder}
                {...register(fieldName, validationRules)}
                autoComplete={isPincodeFieldType ? 'new-password' : undefined}
                name={field.name}
                className={cn(
                  fieldError ? 'border-red-500' : '',
                  isMobileFieldReadonly ? 'bg-green-50/50 border-green-200 cursor-not-allowed' : '',
                  isLocationField && pincodeFound ? 'bg-green-50/50 border-green-200' : ''
                )}
                readOnly={isMobileFieldReadonly}
                disabled={isMobileFieldReadonly}
                onChange={(e) => {
                  // Call default register onChange
                  register(fieldName, validationRules).onChange(e);
                  
                  // If this is a PIN code field, trigger autocomplete
                  if (isPincodeFieldType) {
                    const value = e.target.value;
                    
                    // Trigger autocomplete for partial input (2+ chars)
                    if (value.length >= 2) {
                      handlePincodeAutocomplete(value, field.name);
                    } else {
                      setPincodeSuggestions([]);
                      setShowSuggestions(false);
                    }
                    
                    // Also trigger full lookup when 6 digits entered
                    if (value.length === 6) {
                      handlePincodeLookup(value);
                      setShowSuggestions(false); // Close autocomplete
                    } else {
                      setPincodeFound(false);
                    }
                  }
                }}
                maxLength={isPincodeFieldType ? 6 : undefined}
              />
              {/* Show loading spinner for email field during lookup */}
              {field.type === 'email' && isLookingUpVisitor && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {/* Show loading spinner for PIN code lookup */}
              {isPincodeFieldType && lookingUpPincode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}
              {/* Show success icon for PIN code found */}
              {isPincodeFieldType && pincodeFound && !lookingUpPincode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              )}
              {/* Show lock icon for mobile field */}
              {isMobileFieldReadonly && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
              )}
              
              {/* Autocomplete suggestions dropdown for PIN code */}
              {isPincodeFieldType && showSuggestions && activePincodeField === field.name && pincodeSuggestions.length > 0 && (
                <div className="pincode-autocomplete-container absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[280px] overflow-hidden flex flex-col">
                  {/* Header with result count */}
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between sticky top-0">
                    <span className="text-xs font-medium text-gray-600">
                      {pincodeSuggestions.length} location{pincodeSuggestions.length > 1 ? 's' : ''} found
                    </span>
                    {pincodeSuggestions.length > 3 && (
                      <span className="text-xs text-gray-500">Scroll for more ↓</span>
                    )}
                  </div>
                    
                    {/* Scrollable results */}
                    <div className="overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e0 transparent' }}>
                    {pincodeSuggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.id}-${index}`}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 active:bg-blue-100 transition-colors border-b border-gray-100 last:border-0 focus:bg-blue-50 focus:outline-none group"
                        onClick={() => handleSelectSuggestion(suggestion, field.name)}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-gray-900 text-sm">
                                {suggestion.pincode}
                              </span>
                              {suggestion.area && (
                                <span className="text-xs text-gray-600 truncate">
                                  {suggestion.area}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                              <span>{suggestion.cityName}</span>
                              <span className="text-gray-400">•</span>
                              <span>{suggestion.stateName}</span>
                              <span className="text-gray-400 text-[10px]">({suggestion.stateCode})</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Scroll fade indicator at bottom */}
                  {pincodeSuggestions.length > 3 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  )}
                  
                  {autocompleteLoading && (
                    <div className="px-3 py-2 text-center text-xs text-gray-500 border-t border-gray-100">
                      <Loader2 className="h-3 w-3 animate-spin inline-block mr-1.5" />
                      Searching...
                    </div>
                  )}
                </div>
              )}
            </div>
            {fieldError && (
              <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
            )}
            {/* Show helper text for email field */}
            {field.type === 'email' && (
              <p className="text-xs text-muted-foreground">
                We'll use this to send your registration confirmation and badge.
              </p>
            )}
            {/* Show helper text for PIN code field */}
            {isPincodeFieldType && (
              <p className="text-xs text-muted-foreground">
                Search by PIN code, city name, or area (e.g., 380006, Ahmedabad, Ellis Bridge)
              </p>
            )}
            {/* Show helper text for mobile field */}
            {isMobileFieldReadonly && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                This number was verified via OTP
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id || field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              rows={3}
              {...register(fieldName, validationRules)}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id || field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              {...register(fieldName, { ...validationRules, valueAsNumber: true })}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
            )}
          </div>
        );

      case 'select':
      case 'dropdown':
        return (
          <div key={field.id || field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue || ''}
              onValueChange={(value) => setValue(fieldName, value, { shouldValidate: true })}
            >
              <SelectTrigger className={fieldError ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem
                    key={`${field.id || field.name || 'field'}-option-${index}`}
                    value={option}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id || field.name} className="space-y-3">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={fieldValue || ''}
              onValueChange={(value) => setValue(fieldName, value, { shouldValidate: true })}
              className={fieldError ? 'border-red-500' : ''}
            >
              {field.options?.map((option, index) => (
                <div
                  key={`${field.id || field.name || 'field'}-radio-${index}`}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem value={option} id={`${field.name}-${index}`} />
                  <Label htmlFor={`${field.name}-${index}`} className="cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {fieldError && (
              <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
            )}
          </div>
        );

      case 'checkbox':
        // If options array exists, render multiple checkboxes
        if (field.options && field.options.length > 0) {
          const selectedOptions = (fieldValue as string[]) || [];
          return (
            <div key={field.id || field.name} className="space-y-3">
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="space-y-2">
                {field.options.map((option, index) => (
                  <div
                    key={`${field.id || field.name || 'field'}-checkbox-${index}`}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`${field.name}-${index}`}
                      checked={selectedOptions.includes(option)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...selectedOptions, option]
                          : selectedOptions.filter((val) => val !== option);
                        setValue(fieldName, newValue, { shouldValidate: true });
                      }}
                      className={fieldError ? 'border-red-500' : ''}
                    />
                    <Label
                      htmlFor={`${field.name}-${index}`}
                      className="cursor-pointer font-normal"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {fieldError && (
                <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
              )}
            </div>
          );
        } else {
          // Single checkbox (boolean value)
          return (
            <div key={field.id || field.name} className="flex items-start space-x-2 py-2">
              <Checkbox
                id={field.name}
                checked={fieldValue || false}
                onCheckedChange={(checked) => setValue(fieldName, checked, { shouldValidate: true })}
                className={fieldError ? 'border-red-500' : ''}
              />
              <div className="space-y-1">
                <Label htmlFor={field.name} className="cursor-pointer font-normal">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {fieldError && (
                  <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
                )}
              </div>
            </div>
          );
        }

      case 'api_select':
        // API-driven select field
        // For now, treat as text input if displayMode is 'input' or fallback options don't exist
        // In future, this can fetch from API dynamically
        if (field.displayMode === 'input' || !field.options || field.options.length === 0) {
          // Text input mode (for fields like city, state, pincode)
          const isPincodeFieldAPI = isPincodeField(field);
          const isCityFieldAPI = isCityField(field);
          const isStateFieldAPI = isStateField(field);
          const isLocationFieldAPI = isCityFieldAPI || isStateFieldAPI;
          
          return (
            <div key={field.id || field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {isPincodeFieldAPI && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-600 font-normal">
                    <MapPin className="h-3 w-3" />
                    Auto-fills country, state & city
                  </span>
                )}
                {isLocationFieldAPI && pincodeFound && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-normal">
                    <CheckCircle className="h-3 w-3" />
                    Auto-filled
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id={field.name}
                  type="text"
                  placeholder={field.placeholder}
                  {...register(fieldName, validationRules)}
                  autoComplete={isPincodeFieldAPI ? 'new-password' : undefined}
                  name={field.name}
                  className={cn(
                    fieldError ? 'border-red-500' : '',
                    isLocationFieldAPI && pincodeFound ? 'bg-green-50/50 border-green-200' : ''
                  )}
                  onChange={(e) => {
                    // Call default register onChange
                    register(fieldName, validationRules).onChange(e);
                    
                    // If this is a PIN code field, trigger autocomplete
                    if (isPincodeFieldAPI) {
                      const value = e.target.value;
                      
                      // Trigger autocomplete for partial input (2+ chars)
                      if (value.length >= 2) {
                        handlePincodeAutocomplete(value, field.name);
                      } else {
                        setPincodeSuggestions([]);
                        setShowSuggestions(false);
                      }
                      
                      // Also trigger full lookup when 6 digits entered
                      if (value.length === 6) {
                        handlePincodeLookup(value);
                        setShowSuggestions(false); // Close autocomplete
                      } else {
                        setPincodeFound(false);
                      }
                    }
                  }}
                  maxLength={isPincodeFieldAPI ? 6 : undefined}
                />
                
                {/* Autocomplete suggestions dropdown for PIN code (API Select mode) */}
                {isPincodeFieldAPI && showSuggestions && activePincodeField === field.name && pincodeSuggestions.length > 0 && (
                  <div className="pincode-autocomplete-container absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[280px] overflow-hidden flex flex-col">
                    {/* Header with result count */}
                    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between sticky top-0">
                      <span className="text-xs font-medium text-gray-600">
                        {pincodeSuggestions.length} location{pincodeSuggestions.length > 1 ? 's' : ''} found
                      </span>
                      {pincodeSuggestions.length > 3 && (
                        <span className="text-xs text-gray-500">Scroll for more ↓</span>
                      )}
                    </div>
                    
                    {/* Scrollable results */}
                    <div className="overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e0 transparent' }}>
                      {pincodeSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.id}-${index}`}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 active:bg-blue-100 transition-colors border-b border-gray-100 last:border-0 focus:bg-blue-50 focus:outline-none group"
                          onClick={() => handleSelectSuggestion(suggestion, field.name)}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-gray-900 text-sm">
                                  {suggestion.pincode}
                                </span>
                                {suggestion.area && (
                                  <span className="text-xs text-gray-600 truncate">
                                    {suggestion.area}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                <span>{suggestion.cityName}</span>
                                <span className="text-gray-400">•</span>
                                <span>{suggestion.stateName}</span>
                                <span className="text-gray-400 text-[10px]">({suggestion.stateCode})</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Scroll fade indicator at bottom */}
                    {pincodeSuggestions.length > 3 && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                    )}
                    
                    {autocompleteLoading && (
                      <div className="px-3 py-2 text-center text-xs text-gray-500 border-t border-gray-100">
                        <Loader2 className="h-3 w-3 animate-spin inline-block mr-1.5" />
                        Searching...
                      </div>
                    )}
                  </div>
                )}
                {/* Show loading spinner for PIN code lookup */}
                {isPincodeFieldAPI && lookingUpPincode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                )}
                {/* Show success icon for PIN code found */}
                {isPincodeFieldAPI && pincodeFound && !lookingUpPincode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isPincodeFieldAPI 
                  ? 'Search by PIN code, city name, or area (e.g., 380006, Ahmedabad, Ellis Bridge)'
                  : 'Type or enter the value'}
              </p>
              {fieldError && (
                <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
              )}
            </div>
          );
        } else {
          // Dropdown mode with fallback options
          // For country fields, ALWAYS use dynamically loaded countries from database (ignore hard-coded options)
          const isCountry = isCountryField(field);
          const options = isCountry 
            ? countries.map(c => c.name)  // Country fields: ONLY use database data
            : field.options || [];         // Other fields: use hard-coded options

          return (
            <div key={field.id || field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Select
                value={fieldValue || ''}
                onValueChange={(value) => setValue(fieldName, value, { shouldValidate: true })}
                disabled={isCountry && loadingCountries}
              >
                <SelectTrigger className={fieldError ? 'border-red-500' : ''}>
                  <SelectValue placeholder={
                    isCountry && loadingCountries 
                      ? 'Loading countries...' 
                      : field.placeholder || `Select ${field.label}`
                  } />
                </SelectTrigger>
                <SelectContent>
                  {options.length > 0 ? (
                    options.map((option, index) => (
                      <SelectItem
                        key={`${field.id || field.name || 'field'}-option-${index}`}
                        value={option}
                      >
                        {option}
                      </SelectItem>
                    ))
                  ) : isCountry ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No countries available
                    </div>
                  ) : null}
                </SelectContent>
              </Select>
              {isCountry && countries.length === 0 && !loadingCountries && (
                <p className="text-xs text-muted-foreground text-amber-600">
                  No countries available. Please add countries in admin panel.
                </p>
              )}
              {fieldError && (
                <p className="text-sm text-red-500">{String(fieldError.message || '')}</p>
              )}
            </div>
          );
        }

      default:
        // Unknown field type - log warning and don't render
        console.warn(`Unknown custom field type: ${field.type} for field: ${field.name}`);
        return null;
    }
  };

  const selectedCategory = form.watch('registrationCategory');
  const selectedInterests = form.watch('selectedInterests') || [];
  const interestOptions = exhibitionsApi.getActiveInterestOptions(exhibition);

  return (
    <div className="space-y-6">
      {/* Header with returning visitor badge */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Registration Information</h3>
          <p className="text-sm text-muted-foreground">
            Please fill in all required fields
          </p>
        </div>
        {existingVisitor && (
          <div className={badgeVariants({ variant: "secondary", className: "gap-1" })}>
            <CheckCircle className="h-3 w-3" />
            Returning Visitor
          </div>
        )}
      </div>

      {/* Registration Category - Badge Style */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          I am registering as <span className="text-red-500">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {exhibition.allowedCategories?.map((category) => (
            <div
              key={category}
              className={cn(
                badgeVariants({ variant: selectedCategory === category ? 'default' : 'outline' }),
                "cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 flex items-center"
              )}
              onClick={() => form.setValue('registrationCategory', category, { shouldValidate: true })}
            >
              {selectedCategory === category && <Check className="mr-1 h-3 w-3" />}
              <span>{CATEGORY_LABELS[category] || category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Fields */}
      <div className="grid gap-6 md:grid-cols-2">
        {customFields.map((field, index) => {
          // Full-width fields: textarea, checkbox groups, radio groups
          const isFullWidth =
            field.type === 'textarea' ||
            (field.type === 'checkbox' && field.options && field.options.length > 0) ||
            field.type === 'radio';

          return (
            <div
              key={`custom-field-${field.id || field.name || index}`}
              className={isFullWidth ? 'md:col-span-2' : ''}
            >
              {renderField(field)}
            </div>
          );
        })}
      </div>

        {/* Interests Section - Multi-Select Badges */}
        {interestOptions.length > 0 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                What are you looking for?
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select all areas you're interested in exploring at this exhibition
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((option) => {
                if (!option.name) {
                  console.warn('[Interests] Invalid interest option:', option);
                  return null;
                }
                
                const isSelected = selectedInterests.includes(option.name);
                
                return (
                  <div
                    key={`interest-${option.id}`}
                    className={cn(
                      badgeVariants({ variant: isSelected ? 'default' : 'outline' }),
                      "cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 flex items-center gap-1.5"
                    )}
                    onClick={() => {
                      // Toggle selection - Multi-select using NAMES
                      const newInterests = isSelected
                        ? selectedInterests.filter((name: string) => name !== option.name)
                        : [...selectedInterests, option.name];
                      form.setValue('selectedInterests', newInterests);
                    }}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{option.name}</span>
                  </div>
                );
              })}
            </div>
            
            {selectedInterests.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}
    </div>
  );
}
