import { useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { useRegistrationStore } from '../store/registration.store';
import type { RegistrationFormData } from '@/types';

/**
 * Hook to auto-save form data to localStorage
 * - Debounces saves to avoid excessive writes
 * - Only saves when form values change
 */
export function useFormAutosave(
  formData: Partial<RegistrationFormData>,
  exhibitionId: string,
  enabled: boolean = true
) {
  const saveDraft = useRegistrationStore((state) => state.saveDraft);
  const debouncedFormData = useDebounce(formData, 1000); // 1 second debounce
  const prevDataRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(debouncedFormData);

    // Only save if data has changed
    if (currentData !== prevDataRef.current && Object.keys(debouncedFormData).length > 0) {
      saveDraft(debouncedFormData, exhibitionId);
      prevDataRef.current = currentData;
      
      // Optional: Show a subtle indicator that data was saved
      if (process.env.NEXT_PUBLIC_ENV === 'development') {
        console.log('[Auto-save] Form draft saved', debouncedFormData);
      }
    }
  }, [debouncedFormData, exhibitionId, enabled, saveDraft]);
}

/**
 * Hook to check and load saved draft
 */
export function useLoadDraft(exhibitionId: string) {
  const loadDraft = useRegistrationStore((state) => state.loadDraft);
  const clearDraft = useRegistrationStore((state) => state.clearDraft);

  const draft = loadDraft(exhibitionId);

  const restoreDraft = useCallback(() => {
    return draft;
  }, [draft]);

  const discardDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  return {
    hasDraft: !!draft,
    draft,
    restoreDraft,
    discardDraft,
  };
}

