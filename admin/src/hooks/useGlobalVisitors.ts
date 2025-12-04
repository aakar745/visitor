import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { globalVisitorService } from '../services/globalVisitorService';
import { useMessage } from './useMessage';
import type { 
  GlobalVisitorProfile, 
  ExhibitionRegistration, 
  RegistrationFormData,
  PaginationParams 
} from '../types';

// Enhanced query keys for global visitor system
export const globalVisitorQueryKeys = {
  // Global visitors
  globalVisitors: {
    all: ['global-visitors'] as const,
    lists: () => [...globalVisitorQueryKeys.globalVisitors.all, 'list'] as const,
    list: (params: PaginationParams) => [...globalVisitorQueryKeys.globalVisitors.lists(), params] as const,
    details: () => [...globalVisitorQueryKeys.globalVisitors.all, 'detail'] as const,
    detail: (id: string) => [...globalVisitorQueryKeys.globalVisitors.details(), id] as const,
    lookup: (email: string) => [...globalVisitorQueryKeys.globalVisitors.all, 'lookup', email] as const,
    dashboard: (id: string) => [...globalVisitorQueryKeys.globalVisitors.all, 'dashboard', id] as const,
    analytics: ['global-visitors', 'analytics'] as const,
  },
  // Exhibition registrations
  registrations: {
    all: ['registrations'] as const,
    exhibition: (exhibitionId: string) => [...globalVisitorQueryKeys.registrations.all, 'exhibition', exhibitionId] as const,
    exhibitionList: (exhibitionId: string, params: any) => [...globalVisitorQueryKeys.registrations.exhibition(exhibitionId), params] as const,
    visitor: (visitorId: string) => [...globalVisitorQueryKeys.registrations.all, 'visitor', visitorId] as const,
    detail: (registrationId: string) => [...globalVisitorQueryKeys.registrations.all, 'detail', registrationId] as const,
    stats: (exhibitionId: string) => [...globalVisitorQueryKeys.registrations.exhibition(exhibitionId), 'stats'] as const,
  },
} as const;

// Hook for global visitor lookup by email
export const useVisitorLookup = (email: string) => {
  return useQuery({
    queryKey: globalVisitorQueryKeys.globalVisitors.lookup(email),
    queryFn: () => globalVisitorService.lookupVisitorByEmail(email),
    enabled: !!email && email.includes('@'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for global visitors list
export const useGlobalVisitors = (params: PaginationParams) => {
  return useQuery({
    queryKey: globalVisitorQueryKeys.globalVisitors.list(params),
    queryFn: () => globalVisitorService.getGlobalVisitors(params),
    placeholderData: (previousData) => previousData,
  });
};

// Hook for single global visitor
export const useGlobalVisitor = (id: string) => {
  return useQuery({
    queryKey: globalVisitorQueryKeys.globalVisitors.detail(id),
    queryFn: () => globalVisitorService.getGlobalVisitor(id),
    enabled: !!id,
  });
};

// Hook for visitor dashboard
export const useVisitorDashboard = (visitorId: string) => {
  return useQuery({
    queryKey: globalVisitorQueryKeys.globalVisitors.dashboard(visitorId),
    queryFn: () => globalVisitorService.getVisitorDashboard(visitorId),
    enabled: !!visitorId,
  });
};

// Hook for exhibition registrations
export const useExhibitionRegistrations = (exhibitionId: string, params: PaginationParams) => {
  return useQuery({
    queryKey: globalVisitorQueryKeys.registrations.exhibitionList(exhibitionId, params),
    queryFn: () => globalVisitorService.getExhibitionRegistrations(exhibitionId, params),
    enabled: !!exhibitionId,
    placeholderData: (previousData) => previousData,
  });
};

// Hook for visitor's registrations
export const useVisitorRegistrations = (visitorId: string, params?: PaginationParams) => {
  return useQuery({
    queryKey: globalVisitorQueryKeys.registrations.visitor(visitorId),
    queryFn: () => globalVisitorService.getVisitorRegistrations(visitorId, params),
    enabled: !!visitorId,
  });
};

// Hook for exhibition registration stats
export const useExhibitionStats = (exhibitionId: string) => {
  return useQuery({
    queryKey: globalVisitorQueryKeys.registrations.stats(exhibitionId),
    queryFn: () => globalVisitorService.getExhibitionStats(exhibitionId),
    enabled: !!exhibitionId,
  });
};

// Hook for global visitor analytics
export const useGlobalVisitorAnalytics = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: [...globalVisitorQueryKeys.globalVisitors.analytics, params],
    queryFn: () => globalVisitorService.getGlobalVisitorAnalytics(params),
  });
};

// Hook for all registrations with visitor details
export const useAllRegistrationsWithVisitors = (params: PaginationParams) => {
  return useQuery({
    queryKey: ['all-registrations-with-visitors', params],
    queryFn: () => globalVisitorService.getAllRegistrationsWithVisitors(params),
    placeholderData: (previousData) => previousData,
  });
};

// Mutations for visitor management
export const useGlobalVisitorMutations = () => {
  const queryClient = useQueryClient();
  const message = useMessage();

  // Create global visitor
  const createGlobalVisitor = useMutation({
    mutationFn: globalVisitorService.createGlobalVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.lists() });
      message.success('Visitor profile created successfully');
    },
    onError: () => {
      message.error('Failed to create visitor profile');
    },
  });

  // Update global visitor
  const updateGlobalVisitor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GlobalVisitorProfile> }) =>
      globalVisitorService.updateGlobalVisitor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.lists() });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.detail(variables.id) });
      message.success('Visitor profile updated successfully');
    },
    onError: () => {
      message.error('Failed to update visitor profile');
    },
  });

  // Delete visitor
  const deleteVisitor = useMutation({
    mutationFn: globalVisitorService.deleteVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.lists() });
      queryClient.invalidateQueries({ queryKey: ['all-registrations-with-visitors'] });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.analytics });
      message.success('Visitor deleted successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to delete visitor');
    },
  });

  // Bulk delete visitors
  const bulkDeleteVisitors = useMutation({
    mutationFn: globalVisitorService.bulkDeleteVisitors,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.lists() });
      queryClient.invalidateQueries({ queryKey: ['all-registrations-with-visitors'] });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.analytics });
      
      if (result.failed.length > 0) {
        message.warning(
          `${result.deleted} visitor(s) deleted successfully, ${result.failed.length} failed.`
        );
      } else {
        message.success(`${result.deleted} visitor(s) deleted successfully`);
      }
    },
    onError: () => {
      message.error('Failed to delete visitors');
    },
  });

  // Delete ALL visitors (Super Admin Only)
  const deleteAllVisitors = useMutation({
    mutationFn: globalVisitorService.deleteAllVisitors,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.lists() });
      queryClient.invalidateQueries({ queryKey: ['all-registrations-with-visitors'] });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.analytics });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.registrations.all });
      
      message.success(
        `Successfully deleted ${result.visitorsDeleted.toLocaleString()} visitors and ${result.registrationsDeleted.toLocaleString()} registrations`
      );
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to delete all visitors');
    },
  });

  // Delete registration
  const deleteRegistration = useMutation({
    mutationFn: globalVisitorService.deleteRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.registrations.all });
      queryClient.invalidateQueries({ queryKey: ['all-registrations-with-visitors'] });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.lists() });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.analytics });
      message.success('Registration deleted successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to delete registration');
    },
  });

  // Bulk delete registrations
  const bulkDeleteRegistrations = useMutation({
    mutationFn: globalVisitorService.bulkDeleteRegistrations,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.registrations.all });
      queryClient.invalidateQueries({ queryKey: ['all-registrations-with-visitors'] });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.lists() });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.analytics });
      
      if (result.failed.length > 0) {
        message.warning(
          `${result.deleted} registration(s) deleted successfully, ${result.failed.length} failed.`
        );
      } else {
        message.success(`${result.deleted} registration(s) deleted successfully`);
      }
    },
    onError: () => {
      message.error('Failed to delete registrations');
    },
  });

  // Register visitor for exhibition
  const registerForExhibition = useMutation({
    mutationFn: ({ exhibitionId, data }: { exhibitionId: string; data: RegistrationFormData }) =>
      globalVisitorService.registerVisitorForExhibition(exhibitionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: globalVisitorQueryKeys.registrations.exhibition(variables.exhibitionId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: globalVisitorQueryKeys.registrations.stats(variables.exhibitionId) 
      });
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.lists() });
      message.success('Registration completed successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Registration failed');
    },
  });

  // Update exhibition registration
  const updateRegistration = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExhibitionRegistration> }) =>
      globalVisitorService.updateExhibitionRegistration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.registrations.all });
      message.success('Registration updated successfully');
    },
    onError: () => {
      message.error('Failed to update registration');
    },
  });

  // Cancel registration
  const cancelRegistration = useMutation({
    mutationFn: globalVisitorService.cancelExhibitionRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.registrations.all });
      message.success('Registration cancelled successfully');
    },
    onError: () => {
      message.error('Failed to cancel registration');
    },
  });

  // Check in visitor
  const checkInVisitor = useMutation({
    mutationFn: globalVisitorService.checkInVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.registrations.all });
      message.success('Visitor checked in successfully');
    },
    onError: () => {
      message.error('Failed to check in visitor');
    },
  });

  // Check out visitor
  const checkOutVisitor = useMutation({
    mutationFn: globalVisitorService.checkOutVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.registrations.all });
      message.success('Visitor checked out successfully');
    },
    onError: () => {
      message.error('Failed to check out visitor');
    },
  });

  // Merge visitor profiles
  const mergeVisitorProfiles = useMutation({
    mutationFn: ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) =>
      globalVisitorService.mergeVisitorProfiles(primaryId, duplicateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalVisitorQueryKeys.globalVisitors.all });
      message.success('Visitor profiles merged successfully');
    },
    onError: () => {
      message.error('Failed to merge visitor profiles');
    },
  });

  return {
    createGlobalVisitor,
    updateGlobalVisitor,
    deleteVisitor,
    bulkDeleteVisitors,
    deleteAllVisitors,
    deleteRegistration,
    bulkDeleteRegistrations,
    registerForExhibition,
    updateRegistration,
    cancelRegistration,
    checkInVisitor,
    checkOutVisitor,
    mergeVisitorProfiles,
  };
};

// Hook for visitor search
export const useVisitorSearch = (searchParams: {
  query: string;
  exhibitionId?: string;
  registrationStatus?: string;
  dateRange?: { start: string; end: string };
} & PaginationParams) => {
  return useQuery({
    queryKey: ['visitor-search', searchParams],
    queryFn: () => globalVisitorService.searchVisitors(searchParams),
    enabled: !!searchParams.query && searchParams.query.length > 2,
    placeholderData: (previousData) => previousData,
  });
};

// Utility hook for form prefilling
export const useFormPrefilling = () => {
  const prefillVisitorForm = async (email: string, form: any) => {
    try {
      const result = await globalVisitorService.lookupVisitorByEmail(email);
      
      if (result.found && result.visitor) {
        // Prefill form with existing visitor data
        form.setFieldsValue({
          // Personal information
          name: result.visitor.name,
          phone: result.visitor.phone,
          company: result.visitor.company,
          designation: result.visitor.designation,
          
          // Address information
          state: result.visitor.state,
          city: result.visitor.city,
          pincode: result.visitor.pincode,
          address: result.visitor.address,
          
          // Note: Exhibition-specific fields like interests are NOT prefilled
        });
        
        return {
          isReturningVisitor: true,
          visitor: result.visitor,
          previousRegistrations: result.previousRegistrations || []
        };
      }
      
      return {
        isReturningVisitor: false,
        visitor: null,
        previousRegistrations: []
      };
    } catch (error) {
      console.error('Error prefilling form:', error);
      return {
        isReturningVisitor: false,
        visitor: null,
        previousRegistrations: []
      };
    }
  };

  return { prefillVisitorForm };
};
