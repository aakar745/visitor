import { create } from 'zustand';

/**
 * Registration form state
 * Simplified - removed draft/autosave feature
 */
interface RegistrationState {
  // Current exhibition context
  currentExhibitionId: string | null;
  currentExhibitorId: string | null;

  // Visitor lookup data
  existingVisitorData: any | null;

  // Actions
  setCurrentExhibition: (exhibitionId: string, exhibitorId?: string) => void;
  setExistingVisitorData: (data: any) => void;
  clearExistingVisitorData: () => void;
  resetStore: () => void;
}

/**
 * Registration store
 * - Remembers exhibition context
 * - Stores visitor lookup data for pre-filling
 */
export const useRegistrationStore = create<RegistrationState>((set) => ({
  currentExhibitionId: null,
  currentExhibitorId: null,
  existingVisitorData: null,

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
      currentExhibitionId: null,
      currentExhibitorId: null,
      existingVisitorData: null,
    });
  },
}));

/**
 * UI state store (not persisted)
 */
interface UIState {
  isFormSubmitting: boolean;
  showExistingVisitorDialog: boolean;

  setFormSubmitting: (isSubmitting: boolean) => void;
  setShowExistingVisitorDialog: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isFormSubmitting: false,
  showExistingVisitorDialog: false,

  setFormSubmitting: (isSubmitting) => set({ isFormSubmitting: isSubmitting }),
  setShowExistingVisitorDialog: (show) => set({ showExistingVisitorDialog: show }),
}));

