import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp, notification } from 'antd';
import { store } from './store';
import { queryClient } from './utils/reactQuery';
import { ErrorBoundaryWithRouter as ErrorBoundary } from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import NetworkStatusListener from './components/NetworkStatusListener';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Visitors from './pages/visitors/Visitors';
import ExhibitionList from './pages/exhibitions/ExhibitionList';
import CreateExhibition from './pages/exhibitions/CreateExhibition';
import EditExhibition from './pages/exhibitions/EditExhibition';
import ExhibitionReports from './pages/visitors/ExhibitionReports';
import Analytics from './pages/visitors/Analytics';
import ExhibitorLinks from './pages/exhibitions/ExhibitorLinks';
import KioskSettings from './pages/kiosk/KioskSettings';
import Users from './pages/users/Users';
import Roles from './pages/roles/Roles';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';
import LocationManagement from './pages/locations/LocationManagement';
import './App.css';

// Global notification config
notification.config({
  placement: 'topRight',
  duration: 4.5,
  maxCount: 3,
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#2E5778',
                borderRadius: 8,
                fontSize: 14,
              },
              components: {
                Layout: {
                  headerBg: '#ffffff',
                  siderBg: '#1a2935',
                },
                Menu: {
                  darkItemBg: 'transparent',
                  darkItemSelectedBg: '#2E5778',
                  darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
                },
                Pagination: {
                  itemActiveColor: '#2E5778',
                  itemActiveColorHover: '#4A7090',
                },
                Notification: {
                  colorBgElevated: '#ffffff',
                },
                Upload: {
                  pictureCardSize: 120,
                },
                Segmented: {
                  itemSelectedBg: 'linear-gradient(135deg, #2E5778 0%, #4A7090 100%)',
                },
              },
            }}
            image={{
              fallback: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23bfbfbf" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E',
            }}
          >
            <AntApp>
              {/* SECURITY FIX (BUG-018): Monitor network connectivity */}
              <NetworkStatusListener />
              <Router>
                <Suspense fallback={<LoadingScreen type="fullscreen" message="Loading application..." />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route 
                      path="/login" 
                      element={
                        <ErrorBoundary>
                          <Login />
                        </ErrorBoundary>
                      } 
                    />
                
                    {/* Protected Routes */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <AdminLayout />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route 
                        path="dashboard" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="dashboard" />}>
                              <Dashboard />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="exhibitions" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="table" />}>
                              <ExhibitionList />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="exhibitions/create" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="form" />}>
                              <CreateExhibition />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="exhibitions/edit/:id" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="form" />}>
                              <EditExhibition />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="exhibitions/exhibitor-links" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="table" />}>
                              <ExhibitorLinks />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="visitors" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="table" />}>
                              <Visitors />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="visitors/reports" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="table" />}>
                              <ExhibitionReports />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="visitors/analytics" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="dashboard" />}>
                              <Analytics />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="kiosk-settings" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="dashboard" />}>
                              <KioskSettings />
                            </Suspense>
                          </ErrorBoundary>
                        }
                      />
                      <Route 
                        path="locations" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="table" />}>
                              <LocationManagement />
                            </Suspense>
                          </ErrorBoundary>
                        }
                      />
                      <Route 
                        path="users" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="table" />}>
                              <Users />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="roles" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="table" />}>
                              <Roles />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="settings" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="inline" message="Loading settings..." />}>
                              <Settings />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                      <Route 
                        path="profile" 
                        element={
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen type="inline" message="Loading profile..." />}>
                              <Profile />
                            </Suspense>
                          </ErrorBoundary>
                        } 
                      />
                    </Route>

                    {/* Fallback routes */}
                    <Route
                      path="/unauthorized"
                      element={
                        <div className="flex items-center justify-center min-h-screen">
                          <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-800 mb-4">403</h1>
                            <p className="text-gray-600 mb-4">
                              You don't have permission to access this resource.
                            </p>
                            <button
                              onClick={() => window.history.back()}
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Go Back
                            </button>
                          </div>
                        </div>
                      }
                    />
                    
                    <Route
                      path="*"
                      element={
                        <div className="flex items-center justify-center min-h-screen">
                          <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                            <p className="text-gray-600 mb-4">
                              The page you're looking for doesn't exist.
                            </p>
                            <button
                              onClick={() => window.location.href = '/dashboard'}
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Go to Dashboard
                            </button>
                          </div>
                        </div>
                      }
                    />
                  </Routes>
                </Suspense>
              </Router>
            </AntApp>
          </ConfigProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;