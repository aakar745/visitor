import { useQuery } from '@tanstack/react-query';
import { locationsApi, INDIAN_STATES } from '../api/locations';

/**
 * Hook to fetch all Indian states
 */
export function useStates() {
  return useQuery<string[], Error>({
    queryKey: ['locations', 'states'],
    queryFn: () => locationsApi.getStates(),
    staleTime: Infinity, // States don't change, cache forever
    initialData: INDIAN_STATES, // Use fallback as initial data
  });
}

/**
 * Hook to fetch cities for a specific state
 */
export function useCities(state: string | null) {
  return useQuery<string[], Error>({
    queryKey: ['locations', 'cities', state],
    queryFn: () => locationsApi.getCitiesByState(state!),
    enabled: !!state && state.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

