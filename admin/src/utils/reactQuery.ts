import { QueryClient } from '@tanstack/react-query';
import { store } from '../store';
import { addNotification } from '../store/slices/appSlice';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401
        if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in older versions)
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        // Show error notification for mutations
        store.dispatch(addNotification({
          type: 'error',
          message: 'Operation Failed',
          description: error?.response?.data?.message || error?.message || 'Something went wrong',
        }));
      },
    },
  },
});

// Query keys factory
export const queryKeys = {
  // Auth keys
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  // Visitor keys
  visitors: {
    all: ['visitors'] as const,
    lists: () => [...queryKeys.visitors.all, 'list'] as const,
    list: (params: any) => [...queryKeys.visitors.lists(), params] as const,
    details: () => [...queryKeys.visitors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.visitors.details(), id] as const,
    stats: ['visitors', 'stats'] as const,
  },
  // Exhibition keys
  exhibitions: {
    all: ['exhibitions'] as const,
    lists: () => [...queryKeys.exhibitions.all, 'list'] as const,
    list: (params: any) => [...queryKeys.exhibitions.lists(), params] as const,
    details: () => [...queryKeys.exhibitions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exhibitions.details(), id] as const,
    analytics: (id: string) => [...queryKeys.exhibitions.all, 'analytics', id] as const,
  },
  // Exhibitor keys
  exhibitors: {
    all: ['exhibitors'] as const,
    lists: () => [...queryKeys.exhibitors.all, 'list'] as const,
    list: (params: any) => [...queryKeys.exhibitors.lists(), params] as const,
    byExhibition: (exhibitionId: string) => [...queryKeys.exhibitors.all, 'exhibition', exhibitionId] as const,
    details: () => [...queryKeys.exhibitors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exhibitors.details(), id] as const,
    stats: (id: string) => [...queryKeys.exhibitors.all, 'stats', id] as const,
  },
  // Dashboard keys
  dashboard: {
    all: ['dashboard'] as const,
    stats: ['dashboard', 'stats'] as const,
    recentVisitors: ['dashboard', 'recent-visitors'] as const,
  },
  // User keys
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: any) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    stats: () => [...queryKeys.users.all, 'stats'] as const,
  },
  // Role keys
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    list: (params: any) => [...queryKeys.roles.lists(), params] as const,
    details: () => [...queryKeys.roles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.roles.details(), id] as const,
    stats: () => [...queryKeys.roles.all, 'stats'] as const,
    permissions: () => [...queryKeys.roles.all, 'permissions'] as const,
  },
  // Settings keys
  settings: {
    all: ['settings'] as const,
    categories: () => [...queryKeys.settings.all, 'categories'] as const,
    category: (category: string) => [...queryKeys.settings.categories(), category] as const,
    setting: (key: string) => [...queryKeys.settings.all, 'setting', key] as const,
  },
} as const;
