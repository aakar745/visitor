import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import type { RootState } from '../store';

/**
 * NetworkStatus Component
 * 
 * SECURITY FIX (BUG-018): Visual network status indicator
 * 
 * Displays a persistent banner when the user is offline.
 * This provides constant visual feedback about connectivity state.
 * 
 * Usage:
 *   <NetworkStatus />
 * 
 * Place this component in your layout (e.g., AdminLayout) to show
 * network status across all pages.
 */
const NetworkStatus: React.FC = () => {
  const isOnline = useSelector((state: RootState) => state.app.isOnline);

  // Only show banner when offline
  if (isOnline) {
    return null;
  }

  return (
    <Alert
      message={
        <span>
          <DisconnectOutlined style={{ marginRight: 8 }} />
          You are currently offline
        </span>
      }
      description="Some features may not be available. Your connection will be restored automatically when back online."
      type="warning"
      banner
      showIcon={false}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderRadius: 0,
        textAlign: 'center',
      }}
    />
  );
};

/**
 * NetworkStatusInline Component
 * 
 * A smaller, inline version of the network status indicator.
 * Can be used in headers, footers, or sidebars.
 * 
 * Usage:
 *   <NetworkStatusInline />
 */
export const NetworkStatusInline: React.FC = () => {
  const isOnline = useSelector((state: RootState) => state.app.isOnline);

  return (
    <span
      style={{
        fontSize: '12px',
        color: isOnline ? '#52c41a' : '#faad14',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {isOnline ? (
        <>
          <WifiOutlined />
          <span>Online</span>
        </>
      ) : (
        <>
          <DisconnectOutlined />
          <span>Offline</span>
        </>
      )}
    </span>
  );
};

export default NetworkStatus;

