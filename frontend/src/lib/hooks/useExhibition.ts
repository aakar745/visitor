import { useQuery } from '@tanstack/react-query';
import { exhibitionsApi } from '../api/exhibitions';
import type { Exhibition } from '@/types';

/**
 * Hook to fetch exhibition by slug
 */
export function useExhibition(slug: string | null) {
  return useQuery<Exhibition, Error>({
    queryKey: ['exhibition', slug],
    queryFn: () => exhibitionsApi.getExhibitionBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all active exhibitions
 */
export function useActiveExhibitions() {
  return useQuery<Exhibition[], Error>({
    queryKey: ['exhibitions', 'active'],
    queryFn: () => exhibitionsApi.getActiveExhibitions(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to check if registration is open
 */
export function useRegistrationStatus(exhibition: Exhibition | undefined) {
  if (!exhibition) return { isOpen: false, message: 'Loading...' };

  const isOpen = exhibitionsApi.isRegistrationOpen(exhibition);

  let message = '';
  if (!isOpen) {
    const now = new Date();
    const startDate = new Date(exhibition.registrationStartDate);
    const endDate = new Date(exhibition.registrationEndDate);

    if (now < startDate) {
      message = `Registration opens on ${startDate.toLocaleDateString()}`;
    } else if (now > endDate) {
      message = 'Registration has closed';
    } else {
      message = 'Registration is not currently available';
    }
  }

  return { isOpen, message };
}

