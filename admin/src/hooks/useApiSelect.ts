import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { CustomField } from '../types/exhibitions';

interface ApiSelectOption {
  value: string;
  label: string;
}

/**
 * Hook for handling API-driven select fields
 * Automatically handles fallback to text input if API is not available
 */
export const useApiSelect = (field: Omit<CustomField, 'id'>, dependencyValue?: string) => {
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  
  // Check if API is available and we should use dropdown mode
  const shouldUseDropdown = field.type === 'api_select' && 
                            field.displayMode === 'select' && 
                            field.apiConfig;

  // Fetch options from API
  const { data: options, isLoading, error } = useQuery({
    queryKey: [field.apiConfig?.endpoint, dependencyValue],
    queryFn: async () => {
      if (!field.apiConfig?.endpoint) {
        throw new Error('No API endpoint configured');
      }

      const params: Record<string, string> = {};
      
      // Add dependency parameter if present
      if (field.apiConfig.dependsOn && dependencyValue) {
        params[field.apiConfig.dependsOn] = dependencyValue;
      }

      const response = await api.get(field.apiConfig.endpoint, { params });
      const data = response.data.data;

      // Transform API response to options format
      return data.map((item: any) => ({
        value: item[field.apiConfig!.valueField],
        label: item[field.apiConfig!.labelField],
      }));
    },
    enabled: shouldUseDropdown && (!field.apiConfig?.dependsOn || !!dependencyValue),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once
    onError: () => {
      console.warn(`API not available for ${field.name}, falling back to text input`);
      setIsApiAvailable(false);
    },
    onSuccess: () => {
      setIsApiAvailable(true);
    },
  });

  // Fallback options from field configuration
  const fallbackOptions: ApiSelectOption[] = field.options?.map(opt => ({
    value: opt,
    label: opt,
  })) || [];

  // Determine if we should render as dropdown or text input
  const renderMode = shouldUseDropdown && (isApiAvailable || !error) ? 'select' : 'input';

  return {
    // Render mode: 'select' for dropdown, 'input' for text field
    mode: renderMode,
    
    // Options to display (API data or fallback)
    options: options || fallbackOptions,
    
    // Loading state
    isLoading,
    
    // Whether API is available
    isApiAvailable,
    
    // Whether field depends on another field
    isDependentField: !!field.apiConfig?.dependsOn,
    
    // Whether dependency value is required
    needsDependency: !!field.apiConfig?.dependsOn && !dependencyValue,
    
    // Searchable flag
    searchable: field.apiConfig?.searchable || false,
  };
};

/**
 * Hook for managing cascading location fields (Country -> State -> City)
 */
export const useLocationFields = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedState, setSelectedState] = useState<string | undefined>();

  // Reset dependent fields when parent changes
  useEffect(() => {
    setSelectedState(undefined);
  }, [selectedCountry]);

  return {
    selectedCountry,
    setSelectedCountry,
    selectedState,
    setSelectedState,
  };
};

