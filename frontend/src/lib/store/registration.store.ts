import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';
import type { RegistrationFormData } from '@/types';

/**
 * Registration form state
 */
interface RegistrationState {
  // Form draft for auto-save
  formDraft: Partial<RegistrationFormData> | null;
  draftTimestamp: number | null;

  // Current exhibition context
  currentExhibitionId: string | null;
  currentExhibitorId: string | null;

  // Visitor lookup data
  existingVisitorData: any | null;

  // Actions
  saveDraft: (data: Partial<RegistrationFormData>, exhibitionId: string) => void;
  loadDraft: (exhibitionId: string) => Partial<RegistrationFormData> | null;
  clearDraft: () => void;
  setCurrentExhibition: (exhibitionId: string, exhibitorId?: string) => void;
  setExistingVisitorData: (data: any) => void;
  clearExistingVisitorData: () => void;
  resetStore: () => void;
}

/**
 * Registration store with persistence
 * - Auto-saves form data to localStorage
 * - Remembers exhibition context
 * - Stores visitor lookup data for pre-filling
 */
export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      formDraft: null,
      draftTimestamp: null,
      currentExhibitionId: null,
      currentExhibitorId: null,
      existingVisitorData: null,

      /**
       * Save form draft to localStorage
       */
      saveDraft: (data, exhibitionId) => {
        set({
          formDraft: data,
          draftTimestamp: Date.now(),
          currentExhibitionId: exhibitionId,
        });
      },

      /**
       * Load form draft for specific exhibition
       * Only returns draft if it's for the same exhibition and less than 24 hours old
       */
      loadDraft: (exhibitionId) => {
        const state = get();
        
        // Check if draft exists and is for the correct exhibition
        if (
          state.formDraft &&
          state.currentExhibitionId === exhibitionId &&
          state.draftTimestamp
        ) {
          // Check if draft is less than 24 hours old
          const hoursSinceDraft = (Date.now() - state.draftTimestamp) / (1000 * 60 * 60);
          if (hoursSinceDraft < 24) {
            return state.formDraft;
          }
        }

        return null;
      },

      /**
       * Clear form draft
       */
      clearDraft: () => {
        set({
          formDraft: null,
          draftTimestamp: null,
        });
        
        // Force clear localStorage to ensure old drafts are completely removed
        if (typeof window !== 'undefined') {
          try {
            const storageKey = STORAGE_KEYS.formDraft;
            localStorage.removeItem(storageKey);
            console.log('[Store] Force cleared form draft from localStorage');
          } catch (e) {
            console.error('Failed to clear form draft storage:', e);
          }
        }
      },

      /**
       * Set current exhibition context
       */
      setCurrentExhibition: (exhibitionId, exhibitorId) => {
        set({
          currentExhibitionId: exhibitionId,
          currentExhibitorId: exhibitorId,
        });
      },

      /**
       * Set existing visitor data (from email lookup)
       */
      setExistingVisitorData: (data) => {
        set({ existingVisitorData: data });
      },

      /**
       * Clear existing visitor data
       */
      clearExistingVisitorData: () => {
        set({ existingVisitorData: null });
      },

      /**
       * Reset entire store
       */
      resetStore: () => {
        set({
          formDraft: null,
          draftTimestamp: null,
          currentExhibitionId: null,
          currentExhibitorId: null,
          existingVisitorData: null,
        });
      },
    }),
    {
      name: STORAGE_KEYS.formDraft,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        formDraft: state.formDraft,
        draftTimestamp: state.draftTimestamp,
        currentExhibitionId: state.currentExhibitionId,
      }),
    }
  )
);

/**
 * UI state store (not persisted)
 */
interface UIState {
  isFormSubmitting: boolean;
  showDraftRestoreDialog: boolean;
  showExistingVisitorDialog: boolean;

  setFormSubmitting: (isSubmitting: boolean) => void;
  setShowDraftRestoreDialog: (show: boolean) => void;
  setShowExistingVisitorDialog: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isFormSubmitting: false,
  showDraftRestoreDialog: false,
  showExistingVisitorDialog: false,

  setFormSubmitting: (isSubmitting) => set({ isFormSubmitting: isSubmitting }),
  setShowDraftRestoreDialog: (show) => set({ showDraftRestoreDialog: show }),
  setShowExistingVisitorDialog: (show) => set({ showExistingVisitorDialog: show }),
}));

