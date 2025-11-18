'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { badgeVariants } from '@/components/ui/badge';
import { Loader2, CheckCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormData } from '@/types';

interface PersonalInfoSectionProps {
  form: UseFormReturn<RegistrationFormData>;
  isLookingUpVisitor?: boolean;
  existingVisitor?: any;
}

/**
 * Core Personal Information Section
 * 
 * IMPORTANT: Only Email and Name are hardcoded here.
 * All other fields (phone, company, address, etc.) should be 
 * configured as custom fields in the admin panel.
 */
export function PersonalInfoSection({
  form,
  isLookingUpVisitor = false,
  existingVisitor,
}: PersonalInfoSectionProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
          <p className="text-sm text-muted-foreground">
            Core details required for registration
          </p>
        </div>
        {existingVisitor && (
          <div className={badgeVariants({ variant: "secondary", className: "gap-1" })}>
            <CheckCircle className="h-3 w-3" />
            Returning Visitor
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email - Always Required */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">
            Email Address
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
              autoComplete="email"
            />
            {isLookingUpVisitor && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            We'll use this to send your registration confirmation and badge.
          </p>
        </div>

        {/* Full Name - Always Required */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">
            Full Name
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
            autoComplete="name"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          ℹ️ <strong>Note:</strong> Additional fields like phone, company, address, etc. are configured by the event organizer and will appear below if required.
        </p>
      </div>
    </div>
  );
}
