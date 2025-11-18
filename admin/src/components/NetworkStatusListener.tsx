import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { setOnlineStatus, addNotification } from '../store/slices/appSlice';
import type { RootState } from '../store';

/**
 * NetworkStatusListener Component
 * 
 * SECURITY FIX (BUG-018): Monitor network connectivity
 * 
 * This component:
 * - Listens for online/offline events from the browser
 * - Updates Redux store with current network status
 * - Shows user-friendly notifications when connectivity changes
 * - Provides visual feedback for network state
 * 
 * Must be mounted once in the root App component.
 */
const NetworkStatusListener: React.FC = () => {
  const dispatch = useDispatch();
  const isOnline = useSelector((state: RootState) => state.app.isOnline);

  useEffect(() => {
    /**
     * Handle online event
     * Fires when browser detects network connection
     */
    const handleOnline = () => {
      console.log('Network: ONLINE');
      dispatch(setOnlineStatus(true));
      
      // Show success notification
      message.success({
        content: (
          <span>
            <WifiOutlined style={{ marginRight: 8 }} />
            Back online! You're reconnected to the internet.
          </span>
        ),
        duration: 3,
      });
      
      // Also add to notification history
      dispatch(addNotification({
        type: 'success',
        message: 'Connection Restored',
        description: 'You are back online. Pending requests will be retried automatically.',
      }));
    };

    /**
     * Handle offline event
     * Fires when browser detects network disconnection
     */
    const handleOffline = () => {
      console.log('Network: OFFLINE');
      dispatch(setOnlineStatus(false));
      
      // Show warning notification (persistent)
      message.warning({
        content: (
          <span>
            <DisconnectOutlined style={{ marginRight: 8 }} />
            No internet connection. Please check your network.
          </span>
        ),
        duration: 0, // Don't auto-dismiss
        key: 'offline-warning', // Use key to prevent duplicates
      });
      
      // Also add to notification history
      dispatch(addNotification({
        type: 'warning',
        message: 'Connection Lost',
        description: 'You are currently offline. Some features may not be available.',
      }));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status on mount
    // This catches cases where user starts offline
    if (!navigator.onLine && isOnline) {
      handleOffline();
    } else if (navigator.onLine && !isOnline) {
      handleOnline();
    }

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Dismiss the persistent offline message if component unmounts
      message.destroy('offline-warning');
    };
  }, [dispatch, isOnline]);

  // This component doesn't render anything
  // It's a "listener" component that only handles side effects
  return null;
};

export default NetworkStatusListener;

