import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorService } from '../services/visitorService';
import { queryKeys } from '../utils/reactQuery';
import type { PaginationParams, Visitor } from '../types';

export const useVisitors = (params: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.visitors.list(params),
    queryFn: () => visitorService.getVisitors(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useVisitor = (id: string) => {
  return useQuery({
    queryKey: queryKeys.visitors.detail(id),
    queryFn: () => visitorService.getVisitor(id),
    enabled: !!id,
  });
};

export const useVisitorMutations = () => {
  const queryClient = useQueryClient();

  const createVisitor = useMutation({
    mutationFn: visitorService.createVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });

  const updateVisitor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Visitor> }) =>
      visitorService.updateVisitor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.detail(variables.id) });
    },
  });

  const deleteVisitor = useMutation({
    mutationFn: visitorService.deleteVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });

  const checkInVisitor = useMutation({
    mutationFn: visitorService.checkInVisitor,
    onSuccess: (_, visitorId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.detail(visitorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });

  const checkOutVisitor = useMutation({
    mutationFn: visitorService.checkOutVisitor,
    onSuccess: (_, visitorId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.detail(visitorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });

  return {
    createVisitor,
    updateVisitor,
    deleteVisitor,
    checkInVisitor,
    checkOutVisitor,
  };
};

export const useVisitorStats = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.visitors.stats, params],
    queryFn: () => visitorService.getVisitorStats(params),
  });
};
