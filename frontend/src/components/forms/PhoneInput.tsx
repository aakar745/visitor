'use client';

import React, { useState } from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import type { E164Number, CountryCode } from 'libphonenumber-js';

interface PhoneInputProps {
  value: E164Number | undefined;
  onChange: (value: E164Number | undefined) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  placeholder = 'Enter phone number',
  className = '',
}) => {
  const [touched, setTouched] = useState(false);
  const [countryMismatch, setCountryMismatch] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>('');

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const handleChange = (newValue: E164Number | undefined) => {
    onChange(newValue);
    
    // Check if number format matches a different country
    if (newValue && newValue.length > 5) {
      try {
        const parsed = parsePhoneNumber(newValue);
        if (parsed && parsed.country) {
          const selectedCountry = newValue.substring(1, 3); // Get country code from value
          const actualCountry = parsed.country;
          
          // If the number is valid but for a different country, show warning
          if (parsed.isValid() && actualCountry !== 'IN' && newValue.startsWith('+91')) {
            // Number starts with +91 but is valid for another country - unlikely, keep as is
            setCountryMismatch(false);
          } else if (parsed.isValid() && !newValue.startsWith(`+${parsed.countryCallingCode}`)) {
            // Number is valid but country code doesn't match
            setCountryMismatch(true);
            setDetectedCountry(getCountryName(actualCountry));
          } else {
            setCountryMismatch(false);
          }
        } else {
          setCountryMismatch(false);
        }
      } catch {
        setCountryMismatch(false);
      }
    } else {
      setCountryMismatch(false);
    }
  };

  const getCountryName = (code: CountryCode): string => {
    const names: { [key: string]: string } = {
      IN: 'India',
      US: 'United States',
      GB: 'United Kingdom',
      AU: 'Australia',
      CA: 'Canada',
      CN: 'China',
      JP: 'Japan',
      KR: 'South Korea',
      FR: 'France',
      DE: 'Germany',
      IT: 'Italy',
      ES: 'Spain',
      RU: 'Russia',
      BR: 'Brazil',
      MX: 'Mexico',
      ZA: 'South Africa',
      AE: 'UAE',
      SA: 'Saudi Arabia',
      SG: 'Singapore',
      MY: 'Malaysia',
      ID: 'Indonesia',
      PH: 'Philippines',
      TH: 'Thailand',
      VN: 'Vietnam',
      PK: 'Pakistan',
      BD: 'Bangladesh',
      LK: 'Sri Lanka',
      NP: 'Nepal',
    };
    return names[code] || code;
  };

  const isValid = value ? isValidPhoneNumber(value) : null;
  const showError = touched && error;

  return (
    <div className={`modern-phone-wrapper ${className}`}>
      <PhoneInputWithCountry
        international={false}
        defaultCountry="IN"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        countryCallingCodeEditable={false}
        withCountryCallingCode={false}
        className="modern-phone-component"
      />
      
      {countryMismatch && (
        <p className="phone-input-warning">
          ⚠️ This looks like a {detectedCountry} number. Please select the correct country from the dropdown.
        </p>
      )}
      
      {showError && (
        <p className="phone-input-error">{error}</p>
      )}
      
      {value && touched && !showError && isValid === false && !countryMismatch && (
        <p className="phone-input-error">Please enter a valid phone number</p>
      )}

      <style jsx global>{`
        .modern-phone-wrapper {
          width: 100%;
        }

        /* Main phone input container */
        .PhoneInput {
          display: flex !important;
          align-items: center !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          padding: 0.75rem 1rem !important;
          transition: all 0.2s ease !important;
          background: white !important;
          gap: 0.75rem !important;
          min-height: 48px !important;
          width: 100% !important;
        }

        .PhoneInput:hover {
          border-color: #d1d5db !important;
        }

        .PhoneInput:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
          outline: none !important;
        }

        /* Country selector button - clean and simple */
        .PhoneInputCountry {
          display: flex !important;
          align-items: center !important;
          gap: 0.375rem !important;
          padding: 0.375rem 0.625rem !important;
          border: none !important;
          background: #f9fafb !important;
          cursor: pointer !important;
          border-radius: 0.5rem !important;
          transition: all 0.15s !important;
          position: relative !important;
          flex-shrink: 0 !important;
        }

        .PhoneInputCountry:hover {
          background: #f3f4f6 !important;
        }

        .PhoneInputCountry:active {
          background: #e5e7eb !important;
        }

        /* Country flag - clean size */
        .PhoneInputCountryIcon {
          width: 1.5rem !important;
          height: 1.125rem !important;
          border-radius: 0.1875rem !important;
          overflow: hidden !important;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) !important;
          flex-shrink: 0 !important;
        }

        .PhoneInputCountryIcon--border {
          background-color: rgba(0, 0, 0, 0.03) !important;
        }

        /* Dropdown arrow */
        .PhoneInputCountrySelectArrow {
          width: 0 !important;
          height: 0 !important;
          border-left: 4px solid transparent !important;
          border-right: 4px solid transparent !important;
          border-top: 5px solid #6b7280 !important;
          border-bottom: 0 !important;
          margin-left: auto !important;
          opacity: 0.8 !important;
          transition: opacity 0.2s !important;
        }

        .PhoneInputCountry:hover .PhoneInputCountrySelectArrow {
          opacity: 1 !important;
          border-top-color: #111827 !important;
        }

        /* Hidden select element (for dropdown) */
        .PhoneInputCountrySelect {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          height: 100% !important;
          width: 100% !important;
          z-index: 1 !important;
          border: 0 !important;
          opacity: 0 !important;
          cursor: pointer !important;
          font-size: 1rem !important;
        }

        /* Country dropdown - simple and clean */
        .PhoneInputCountrySelect option {
          padding: 0.5rem 0.75rem !important;
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
          background: white !important;
          color: #374151 !important;
        }

        .PhoneInputCountrySelect option:checked {
          background: #3b82f6 !important;
          color: white !important;
          font-weight: 600 !important;
        }

        /* Input field - ONLY DIGITS, clean and borderless */
        .PhoneInputInput {
          flex: 1 !important;
          border: none !important;
          outline: none !important;
          font-size: 1rem !important;
          line-height: 1.5 !important;
          color: #111827 !important;
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          font-weight: 400 !important;
          box-shadow: none !important;
          width: 100% !important;
        }

        .PhoneInputInput:focus {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .PhoneInputInput::placeholder {
          color: #9ca3af !important;
        }

        .PhoneInputInput:disabled {
          background-color: transparent !important;
          cursor: not-allowed !important;
          opacity: 0.6 !important;
        }

        /* Error message */
        .phone-input-error {
          margin-top: 0.5rem !important;
          font-size: 0.875rem !important;
          color: #ef4444 !important;
          font-weight: 500 !important;
        }

        /* Warning message for country mismatch */
        .phone-input-warning {
          margin-top: 0.5rem !important;
          font-size: 0.875rem !important;
          color: #f59e0b !important;
          font-weight: 500 !important;
          padding: 0.5rem 0.75rem !important;
          background: #fffbeb !important;
          border-left: 3px solid #f59e0b !important;
          border-radius: 0.375rem !important;
        }

        /* Error state */
        .modern-phone-wrapper.error .PhoneInput {
          border-color: #ef4444 !important;
        }

        /* Disabled state */
        .PhoneInput--disabled {
          background-color: #f9fafb !important;
          cursor: not-allowed !important;
          opacity: 0.6 !important;
        }

        /* Focus improvements */
        .PhoneInput:focus-within .PhoneInputCountry {
          background: transparent !important;
        }

        /* Ensure input takes remaining space */
        .PhoneInputInput {
          min-width: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default PhoneInput;
