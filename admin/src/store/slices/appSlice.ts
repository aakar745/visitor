import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
  isOnline: boolean; // SECURITY FIX (BUG-018): Track network status
  notifications: {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    description?: string;
  }[];
}

const initialState: AppState = {
  sidebarCollapsed: false,
  theme: 'light',
  loading: false,
  error: null,
  isOnline: navigator.onLine, // SECURITY FIX (BUG-018): Initialize from browser API
  notifications: [],
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    /**
     * SECURITY FIX (BUG-018): Network status management
     * Tracks online/offline state for better UX
     */
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<AppState['notifications'][0], 'id'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  setLoading,
  setError,
  setOnlineStatus,
  addNotification,
  removeNotification,
  clearNotifications,
} = appSlice.actions;

export default appSlice.reducer;
