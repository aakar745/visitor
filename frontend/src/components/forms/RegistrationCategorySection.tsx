'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormData, Exhibition } from '@/types';

interface RegistrationCategorySectionProps {
  form: UseFormReturn<RegistrationFormData>;
  exhibition: Exhibition;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General Visitor',
  vip: 'VIP',
  media: 'Media',
  exhibitor: 'Exhibitor',
  speaker: 'Speaker',
  guest: 'Guest',
};

export function RegistrationCategorySection({
  form,
  exhibition,
}: RegistrationCategorySectionProps) {
  const {
    formState: { errors },
    watch,
    setValue,
  } = form;

  const selectedCategory = watch('registrationCategory');

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="registrationCategory" className="required text-lg font-semibold">
          Registration Category
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the category that best describes you
        </p>
      </div>

      <div className="space-y-2">
        <Select
          value={selectedCategory || ''}
          onValueChange={(value) =>
            setValue('registrationCategory', value, { shouldValidate: true })
          }
        >
          <SelectTrigger className={errors.registrationCategory ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select your category" />
          </SelectTrigger>
          <SelectContent>
            {exhibition.allowedCategories?.map((category) => (
              <SelectItem key={category} value={category}>
                {CATEGORY_LABELS[category] || category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.registrationCategory && (
          <p className="text-sm text-red-500">
            {errors.registrationCategory.message}
          </p>
        )}
      </div>
    </div>
  );
}

