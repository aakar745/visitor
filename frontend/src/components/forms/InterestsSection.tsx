'use client';

import { badgeVariants } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormData, Exhibition } from '@/types';
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { Check, AlertCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterestsSectionProps {
  form: UseFormReturn<RegistrationFormData>;
  exhibition: Exhibition;
}

export function InterestsSection({ form, exhibition }: InterestsSectionProps) {
  const { watch, setValue, formState } = form;
  const selectedInterests = watch('selectedInterests') || [];

  const interestOptions = exhibitionsApi.getActiveInterestOptions(exhibition);

  if (interestOptions.length === 0) {
    return null;
  }

  // Check if any interest is marked as required
  const hasRequiredInterests = interestOptions.some(option => option.required === true);
  const requiredInterests = interestOptions.filter(option => option.required === true);

  // Check for validation error
  const interestsError = formState.errors.selectedInterests;

  const toggleInterest = (interestName: string) => {
    const isSelected = selectedInterests.includes(interestName);
    const newInterests = isSelected
      ? selectedInterests.filter((name) => name !== interestName)
      : [...selectedInterests, interestName];

    setValue('selectedInterests', newInterests, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold flex items-center gap-2">
          What are you looking for?
          {hasRequiredInterests && (
            <span className="text-xs font-normal text-muted-foreground">
              (At least one selection required)
            </span>
          )}
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the areas you're interested in exploring at this exhibition
        </p>
      </div>

      {/* Show required interests notice */}
      {hasRequiredInterests && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <Star className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            Please select at least one interest. 
            {requiredInterests.length > 0 && requiredInterests.length < interestOptions.length && (
              <span className="ml-1">
                Options marked with <Star className="inline h-3 w-3" /> are suggested.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3">
        {interestOptions.map((option) => {
          const isSelected = selectedInterests.includes(option.name);
          const isRequired = option.required === true;
          
          return (
            <div
              key={`interest-${option.id}`}
              className={cn(
                badgeVariants({ variant: isSelected ? 'default' : 'outline' }),
                "cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 flex items-center gap-1.5 relative",
                isRequired && !isSelected && "border-amber-300 dark:border-amber-700"
              )}
              onClick={() => toggleInterest(option.name)}
              title={isRequired ? 'Recommended interest' : option.description || option.name}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {isRequired && !isSelected && <Star className="h-3 w-3 text-amber-500" fill="currentColor" />}
              <span>{option.name}</span>
            </div>
          );
        })}
      </div>

      {/* Selection count */}
      {selectedInterests.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
        </p>
      )}

      {/* Validation error */}
      {interestsError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {interestsError.message as string}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

