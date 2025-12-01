import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { Spin } from 'antd';
import { getRoleName } from '../utils/roleHelper';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  // SECURITY FIX (BUG-011): Only pass valid redirect paths to prevent infinite loops
  if (!isAuthenticated) {
    // Don't pass /login or /unauthorized as redirect targets
    const shouldPassLocation = location.pathname !== '/login' && location.pathname !== '/unauthorized';
    const state = shouldPassLocation ? { from: location } : undefined;
    
    return <Navigate to="/login" state={state} replace />;
  }

  // Check role-based access
  if (requiredRole && user) {
    // Extract role name whether it's a string or object
    const userRoleName = getRoleName(user.role as any);
    
    // Check if user's role is in the required roles list
    if (!requiredRole.includes(userRoleName)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
