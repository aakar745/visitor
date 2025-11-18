'use client';

import { badgeVariants } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormData, Exhibition } from '@/types';
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterestsSectionProps {
  form: UseFormReturn<RegistrationFormData>;
  exhibition: Exhibition;
}

export function InterestsSection({ form, exhibition }: InterestsSectionProps) {
  const { watch, setValue } = form;
  const selectedInterests = watch('selectedInterests') || [];

  const interestOptions = exhibitionsApi.getActiveInterestOptions(exhibition);

  if (interestOptions.length === 0) {
    return null;
  }

  const toggleInterest = (interestName: string) => {
    const isSelected = selectedInterests.includes(interestName);
    const newInterests = isSelected
      ? selectedInterests.filter((name) => name !== interestName)
      : [...selectedInterests, interestName];

    setValue('selectedInterests', newInterests);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold">
          What are you looking for?
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the areas you're interested in exploring at this exhibition
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {interestOptions.map((option) => {
          const isSelected = selectedInterests.includes(option.name);
          return (
            <div
              key={`interest-${option.id}`}
              className={cn(
                badgeVariants({ variant: isSelected ? 'default' : 'outline' }),
                "cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 flex items-center"
              )}
              onClick={() => toggleInterest(option.name)}
            >
              {isSelected && <Check className="mr-1 h-3 w-3" />}
              <span>{option.name}</span>
            </div>
          );
        })}
      </div>

      {selectedInterests.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}

