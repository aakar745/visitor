'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormData } from '@/types';
import { useStates, useCities } from '@/lib/hooks/useLocations';
import { Skeleton } from '@/components/ui/skeleton';

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

  const selectedState = watch('state');

  // Fetch states and cities
  const { data: states = [], isLoading: statesLoading } = useStates();
  const { data: cities = [], isLoading: citiesLoading } = useCities(selectedState);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Address Information</h3>

      <div className="grid gap-6 md:grid-cols-3">
        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state" className="required">
            State
          </Label>
          {statesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedState || ''}
              onValueChange={(value) => {
                setValue('state', value, { shouldValidate: true });
                setValue('city', '', { shouldValidate: false }); // Reset city when state changes
              }}
            >
              <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.state && (
            <p className="text-sm text-red-500">{errors.state.message}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="required">
            City
          </Label>
          {citiesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : cities.length > 0 ? (
            <Select
              value={watch('city') || ''}
              onValueChange={(value) => setValue('city', value, { shouldValidate: true })}
              disabled={!selectedState}
            >
              <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="city"
              type="text"
              placeholder="Enter city name"
              {...register('city')}
              className={errors.city ? 'border-red-500' : ''}
              disabled={!selectedState}
            />
          )}
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>

        {/* Pincode */}
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

