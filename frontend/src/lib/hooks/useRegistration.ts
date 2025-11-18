'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { registrationsApi } from '../api/registrations';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { RegistrationFormData, RegistrationResponse } from '@/types';
import { useRegistrationStore, useUIStore } from '../store/registration.store';

/**
 * Hook to submit registration
 */
export function useCreateRegistration() {
  const router = useRouter();
  const clearDraft = useRegistrationStore((state) => state.clearDraft);
  const setFormSubmitting = useUIStore((state) => state.setFormSubmitting);

  return useMutation<RegistrationResponse, Error, RegistrationFormData>({
    mutationFn: (data) => registrationsApi.createRegistration(data),
    onMutate: () => {
      setFormSubmitting(true);
      toast.loading('Submitting your registration...', { id: 'registration' });
    },
    onSuccess: (data) => {
      setFormSubmitting(false);
      console.log('[Registration Success] Full response:', data);
      console.log('[Registration Success] Full response JSON:', JSON.stringify(data, null, 2));
      console.log('[Registration Success] Registration object:', data.registration);
      console.log('[Registration Success] Registration ID:', data.registration?._id);
      
      toast.success('Registration successful! 🎉', { id: 'registration' });
      
      // Clear draft after successful submission
      clearDraft();

      // Check if registration object exists
      if (!data.registration || !data.registration._id) {
        console.error('[Registration Success] Missing registration data:', data);
        toast.error('Registration successful but unable to get confirmation. Please check your email.');
        router.push('/');
        return;
      }

      // Redirect to success page with registration ID
      router.push(`/success?registrationId=${data.registration._id}`);
    },
    onError: (error: any) => {
      setFormSubmitting(false);
      const errorMessage = error.message || 'Failed to submit registration. Please try again.';
      
      // Special handling for "already registered" error (409)
      if (error.statusCode === 409) {
        if (errorMessage.toLowerCase().includes('already registered')) {
          toast.error('Already Registered! 🎫', {
            id: 'registration',
            description: errorMessage,
            duration: 5000,
          });
        } else if (errorMessage.toLowerCase().includes('mobile number')) {
          toast.error('Duplicate Mobile Number! 📱', {
            id: 'registration',
            description: errorMessage,
            duration: 6000,
          });
        } else {
          toast.error('Registration Error', {
            id: 'registration',
            description: errorMessage,
            duration: 5000,
          });
        }
      } else {
        toast.error(errorMessage, { 
          id: 'registration',
          duration: 5000,
        });
      }
      
      console.error('[Registration Error]', error);
    },
  });
}

/**
 * Hook to verify/fetch registration details
 */
export function useRegistrationDetails(registrationId: string | null) {
  return useQuery<RegistrationResponse, Error>({
    queryKey: ['registration', registrationId],
    queryFn: () => registrationsApi.verifyRegistration(registrationId!),
    enabled: !!registrationId,
    retry: 2,
  });
}

/**
 * Hook to lookup visitor by email
 */
export function useVisitorLookup() {
  const setExistingVisitorData = useRegistrationStore((state) => state.setExistingVisitorData);
  const clearExistingVisitorData = useRegistrationStore((state) => state.clearExistingVisitorData);

  const lookupMutation = useMutation({
    mutationFn: (email: string) => registrationsApi.lookupVisitorByEmail(email),
    onSuccess: (data) => {
      if (data) {
        setExistingVisitorData(data);
        toast.success(`Welcome back, ${data.visitor.name}! 👋`, {
          description: 'Your details have been pre-filled.',
        });
      } else {
        clearExistingVisitorData();
      }
    },
    onError: (error: any) => {
      console.error('[Visitor Lookup Error]', error);
      clearExistingVisitorData();
    },
  });

  return {
    lookupVisitor: lookupMutation.mutate,
    isLooking: lookupMutation.isPending,
    existingVisitor: useRegistrationStore((state) => state.existingVisitorData),
  };
}

