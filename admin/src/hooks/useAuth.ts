import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, logoutUser, fetchUserProfile } from '../store/slices/authSlice';
import { authService } from '../services/authService';
import { queryKeys } from '../utils/reactQuery';
import type { LoginRequest } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => dispatch(loginUser(credentials)).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => dispatch(logoutUser()).unwrap(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  // Profile query
  const profileQuery = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: authService.getProfile,
    enabled: isAuthenticated && !user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.auth.profile, updatedUser);
      dispatch(fetchUserProfile());
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,
  });

  return {
    // State
    user,
    isAuthenticated,
    isLoading: isLoading || profileQuery.isLoading,
    
    // Actions
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    
    // Mutation states
    loginLoading: loginMutation.isPending,
    logoutLoading: logoutMutation.isPending,
    updateProfileLoading: updateProfileMutation.isPending,
    changePasswordLoading: changePasswordMutation.isPending,
  };
};
