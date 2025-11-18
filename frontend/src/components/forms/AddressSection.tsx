'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormData } from '@/types';
import { usePincodeLookup } from '@/lib/hooks/useLocations';
import { useEffect } from 'react';

interface AddressSectionProps {
  form: UseFormReturn<RegistrationFormData>;
}

export function AddressSection({ form }: AddressSectionProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const pincode = watch('pincode');
  
  // Auto-fill state and city based on pincode
  const { data: pincodeData } = usePincodeLookup(pincode || '');
  
  useEffect(() => {
    if (pincodeData && pincodeData.found) {
      if (pincodeData.state?.name) {
        setValue('state', pincodeData.state.name, { shouldValidate: true });
      }
      if (pincodeData.city?.name) {
        setValue('city', pincodeData.city.name, { shouldValidate: true });
      }
    }
  }, [pincodeData, setValue]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Address Information</h3>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Pincode - Enter first to auto-fill state & city */}
        <div className="space-y-2">
          <Label htmlFor="pincode" className="required">
            Pincode
          </Label>
          <Input
            id="pincode"
            type="text"
            placeholder="110001"
            maxLength={6}
            {...register('pincode')}
            className={errors.pincode ? 'border-red-500' : ''}
            autoComplete="postal-code"
          />
          {errors.pincode && (
            <p className="text-sm text-red-500">{errors.pincode.message}</p>
          )}
          {pincodeData && pincodeData.found && (
            <p className="text-xs text-green-600">
              ✓ {pincodeData.area && `${pincodeData.area}, `}{pincodeData.city?.name}, {pincodeData.state?.name}
            </p>
          )}
        </div>

        {/* State - Auto-filled from pincode */}
        <div className="space-y-2">
          <Label htmlFor="state" className="required">
            State
          </Label>
          <Input
            id="state"
            type="text"
            placeholder="State"
            {...register('state')}
            className={errors.state ? 'border-red-500' : ''}
            readOnly={pincodeData?.found}
          />
          {errors.state && (
            <p className="text-sm text-red-500">{errors.state.message}</p>
          )}
        </div>

        {/* City - Auto-filled from pincode */}
        <div className="space-y-2">
          <Label htmlFor="city" className="required">
            City
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="City"
            {...register('city')}
            className={errors.city ? 'border-red-500' : ''}
            readOnly={pincodeData?.found}
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>

        {/* Full Address */}
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="address">Full Address (Optional)</Label>
          <Textarea
            id="address"
            placeholder="Enter your complete address..."
            rows={3}
            {...register('address')}
            className={errors.address ? 'border-red-500' : ''}
            autoComplete="street-address"
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

