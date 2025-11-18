import { useQuery } from '@tanstack/react-query';
import { exhibitorsApi } from '../api/exhibitors';
import type { Exhibitor } from '@/types';

/**
 * Hook to fetch exhibitor by slug
 */
export function useExhibitor(exhibitionId: string | null, exhibitorSlug: string | null) {
  return useQuery<Exhibitor, Error>({
    queryKey: ['exhibitor', exhibitionId, exhibitorSlug],
    queryFn: () => exhibitorsApi.getExhibitorBySlug(exhibitionId!, exhibitorSlug!),
    enabled: !!exhibitionId && !!exhibitorSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all exhibitors for an exhibition
 */
export function useExhibitors(exhibitionId: string | null) {
  return useQuery<Exhibitor[], Error>({
    queryKey: ['exhibitors', exhibitionId],
    queryFn: () => exhibitorsApi.getExhibitorsByExhibition(exhibitionId!),
    enabled: !!exhibitionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

