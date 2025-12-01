import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User, LoginRequest } from '../../types';
import { authService } from '../../services/authService';
import { STORAGE_KEYS } from '../../constants';

/**
 * Helper to load user from localStorage
 * NOTE: Only user data is stored in localStorage (non-sensitive)
 * Tokens are stored in httpOnly cookies for security
 */
const loadUserFromStorage = (): User | null => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to load user from localStorage:', error);
    return null;
  }
};

/**
 * Check if user is authenticated by checking if user data exists
 * Tokens are in httpOnly cookies and managed by browser
 */
const checkAuthentication = (): boolean => {
  return !!loadUserFromStorage();
};

// Initial state
const initialState: AuthState = {
  user: loadUserFromStorage(),
  accessToken: null, // Tokens are in httpOnly cookies, not in state
  refreshToken: null, // Tokens are in httpOnly cookies, not in state
  isAuthenticated: checkAuthentication(),
  isLoading: false,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      console.error('[Login Error]', error);
      
      // Extract error message from various possible locations
      const apiMessage = 
        error?.response?.data?.message || 
        error?.response?.data?.error || 
        error?.message || 
        'Unknown error';
      
      console.log('[Login Error Message]', apiMessage);
      
      // Map common backend errors to user-friendly messages
      const lowerMessage = apiMessage.toLowerCase();
      
      if (lowerMessage.includes('invalid credentials') || 
          lowerMessage.includes('incorrect') || 
          lowerMessage.includes('wrong password')) {
        return rejectWithValue('Incorrect email or password');
      } else if (lowerMessage.includes('user not found') || 
                 lowerMessage.includes('not found')) {
        return rejectWithValue('No account found with this email');
      } else if (lowerMessage.includes('locked') || 
                 lowerMessage.includes('too many')) {
        return rejectWithValue('Account temporarily locked. Please try again later');
      } else if (lowerMessage.includes('deactivated')) {
        return rejectWithValue('Your account has been deactivated. Please contact the administrator for assistance.');
      } else if (lowerMessage.includes('inactive') || 
                 lowerMessage.includes('suspended') || 
                 lowerMessage.includes('disabled')) {
        return rejectWithValue('Your account is inactive. Please contact the administrator.');
      }
      
      return rejectWithValue(apiMessage === 'Unknown error' ? 'Login failed. Please try again' : apiMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    // SECURITY FIX (BUG-009): Handle logout API failures properly
    const result = await authService.logout();
    
    // Return result (will clear local state in reducer)
    // If server logout failed, include warning info
    return result;
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // Refresh token is in httpOnly cookie, sent automatically by browser
      const response = await authService.refreshToken();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getProfile();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * SECURITY FIX (BUG-017): Enhanced auth cleanup
     * 
     * This clears ALL authentication-related data:
     * - Redux state (user, tokens, auth flags)
     * - localStorage user data
     * 
     * Note: Theme preference is NOT cleared (it's user preference, not auth data)
     * Note: Tokens are in httpOnly cookies, cleared by backend on logout
     */
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      
      // SECURITY FIX (BUG-017): Explicitly clear all auth-related localStorage
      // This ensures no stale data remains on 401/403 errors
      try {
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        // Future-proofing: If more auth-related keys are added, clear them here
        // Example: localStorage.removeItem('authTimestamp');
        // Example: localStorage.removeItem('sessionId');
        
        // DO NOT clear: STORAGE_KEYS.THEME (user preference, not auth data)
      } catch (error) {
        // Catch localStorage errors (e.g., QuotaExceededError, SecurityError)
        console.error('Failed to clear localStorage during auth cleanup:', error);
      }
    },
    setTokens: (state) => {
      // Tokens are stored in httpOnly cookies by backend
      // This action is kept for backward compatibility but doesn't store anything
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = true;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      // Only store non-sensitive user data
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = null; // Stored in httpOnly cookie by backend
        state.refreshToken = null; // Stored in httpOnly cookie by backend
        state.isAuthenticated = true;
        // Only store non-sensitive user data
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state, action) => {
        // ALWAYS clear local state (even if server logout failed)
        // This prevents user from accessing app, but warn them about server session
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        // Only remove user data, cookies cleared by backend
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        // If server logout failed, log warning
        if (!action.payload.serverLogoutSuccess) {
          console.warn(
            'Local logout successful but server session may still be active. ' +
            'Error: ' + (action.payload.error || 'Unknown error')
          );
        }
      })
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        // Tokens are in httpOnly cookies, managed by backend
        state.accessToken = null;
        state.refreshToken = null;
        // Update user if returned
        if (action.payload.user) {
          state.user = action.payload.user;
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        // Only remove user data
        localStorage.removeItem(STORAGE_KEYS.USER);
      })
      // Fetch profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload));
      });
  },
});

export const { clearAuth, setTokens, setUser } = authSlice.actions;
export default authSlice.reducer;
