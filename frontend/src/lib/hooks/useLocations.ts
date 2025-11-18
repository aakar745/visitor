import { useQuery } from '@tanstack/react-query';
import { locationsApi } from '../api/locations';

/**
 * Hook to fetch all countries
 */
export function useCountries() {
  return useQuery({
    queryKey: ['locations', 'countries'],
    queryFn: () => locationsApi.getCountries(),
    staleTime: Infinity, // Countries don't change often, cache forever
  });
}

/**
 * Hook to lookup location by pincode
 */
export function usePincodeLookup(pincode: string) {
  return useQuery({
    queryKey: ['locations', 'pincode', pincode],
    queryFn: () => locationsApi.lookupByPincode(pincode),
    enabled: !!pincode && pincode.length === 6,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for pincode autocomplete search
 */
export function usePincodeAutocomplete(query: string, limit: number = 10) {
  return useQuery({
    queryKey: ['locations', 'pincode-autocomplete', query, limit],
    queryFn: () => locationsApi.autocompletePincodes(query, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

