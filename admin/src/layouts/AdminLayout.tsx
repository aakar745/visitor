import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Typography,
  Space,
  Badge,
  Drawer,
  message,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuOutlined,
  CalendarOutlined,
  SafetyOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useAppSelector, useAppDispatch } from '../store';
import { toggleSidebar, setSidebarCollapsed } from '../store/slices/appSlice';
import NetworkStatus from '../components/NetworkStatus';
import { APP_CONFIG } from '../constants';
import { getRoleName } from '../utils/roleHelper';

const { Header, Sider, Content } = Layout;
const { Text} = Typography;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { logout, user } = useAuth();
  const { hasAnyPermission, isSuperAdmin } = usePermissions();
  const { sidebarCollapsed, notifications } = useAppSelector((state) => state.app);
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  // Define all menu items with their required permissions
  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      permissions: ['dashboard.view'],
    },
    {
      key: '/exhibitions',
      icon: <CalendarOutlined />,
      label: 'Exhibitions',
      // Include child permissions so parent shows if user has ANY of these
      permissions: ['exhibitions.view', 'exhibitions.create', 'exhibitions.update', 'exhibitors.view'],
      children: [
        {
          key: '/exhibitions/list',
          label: 'All Exhibitions',
          permissions: ['exhibitions.view'],
        },
        {
          key: '/exhibitions/exhibitor-links',
          label: 'Exhibitor Links',
          permissions: ['exhibitors.view'],
        },
      ],
    },
    {
      key: '/kiosk-settings',
      icon: <SettingOutlined />,
      label: 'Kiosk Settings',
      permissions: ['settings.kiosk'],
    },
    {
      key: '/visitors',
      icon: <TeamOutlined />,
      label: 'Visitors',
      // Include child permissions so parent shows if user has ANY of these
      permissions: ['visitors.view', 'visitors.create', 'analytics.view', 'reports.view'],
      children: [
        {
          key: '/visitors/all',
          label: 'All Visitors',
          permissions: ['visitors.view'],
        },
        {
          key: '/visitors/analytics',
          label: 'Analytics',
          permissions: ['analytics.view'],
        },
        {
          key: '/visitors/reports',
          label: 'Exhibition Reports',
          permissions: ['reports.view'],
        },
      ],
    },
    {
      key: '/locations',
      icon: <EnvironmentOutlined />,
      label: 'Locations',
      permissions: ['locations.view', 'locations.create'],
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
      permissions: ['users.view', 'users.create'],
    },
    {
      key: '/roles',
      icon: <SafetyOutlined />,
      label: 'Roles',
      permissions: ['roles.view', 'roles.create'],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      permissions: ['settings.view', 'settings.update'],
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems
    .map((item) => {
      // Super Admin sees everything - return item as-is
      if (isSuperAdmin) return item;

      // Check if user has any of the required permissions for parent
      if (item.permissions && !hasAnyPermission(item.permissions)) {
        return null; // User doesn't have permission for parent
      }

      // Filter children if they exist (create new array to avoid mutation)
      if (item.children) {
        const visibleChildren = item.children.filter((child: any) => {
          if (!child.permissions) return true;
          return hasAnyPermission(child.permissions);
        });

        // Hide parent if no children are visible
        if (visibleChildren.length === 0) return null;

        // Return item with filtered children (avoid mutating original)
        return { ...item, children: visibleChildren };
      }

      return item;
    })
    .filter(Boolean); // Remove nulls

  React.useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 768;
      setIsSmallScreen(smallScreen);
      
      if (smallScreen) {
        dispatch(setSidebarCollapsed(true));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const handleMenuClick = (key: string) => {
    // Handle special navigation cases
    let navigationKey = key;
    if (key === '/exhibitions/list') {
      navigationKey = '/exhibitions';
    } else if (key === '/visitors/all') {
      navigationKey = '/visitors';
    } else if (key === '/exhibitions/exhibitor-links') {
      navigationKey = '/exhibitions/exhibitor-links';
    } else if (key === '/visitors/analytics') {
      navigationKey = '/visitors/analytics';
    } else if (key === '/visitors/reports') {
      navigationKey = '/visitors/reports';
    }
    navigate(navigationKey);
    if (isSmallScreen) {
      setMobileDrawerOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      // SECURITY FIX (BUG-009): Check if server logout succeeded
      const result = await logout();
      
      // Always navigate to login (local state is cleared)
      navigate('/login');
      
      // If server logout failed, warn the user
      if (result && !result.serverLogoutSuccess) {
        message.warning({
          content: 'You have been logged out locally, but the server session could not be cleared. ' +
                   'For security, please close all browser tabs and clear your cookies.',
          duration: 10, // Show for 10 seconds
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login (fail-safe)
      navigate('/login');
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const sidebarContent = (
    <>
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
        height: '64px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
              {APP_CONFIG.APP_NAME.charAt(0)}
            </span>
          </div>
          {!sidebarCollapsed && (
            <div>
              <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                Visitor System
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Admin Panel
              </Text>
            </div>
          )}
        </div>
      </div>
      
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[
          location.pathname === '/exhibitions' ? '/exhibitions/list' : 
          location.pathname === '/visitors' ? '/visitors/all' :
          location.pathname === '/exhibitions/exhibitor-links' ? '/exhibitions/exhibitor-links' :
          location.pathname === '/visitors/analytics' ? '/visitors/analytics' :
          location.pathname === '/visitors/reports' ? '/visitors/reports' :
          location.pathname
        ]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ 
          border: 'none',
          background: 'transparent',
          fontSize: '14px'
        }}
      />
    </>
  );

  return (
    <>
      {/* SECURITY FIX (BUG-018): Show network status banner when offline */}
      <NetworkStatus />
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      {!isSmallScreen && (
        <Sider
          trigger={null}
          collapsible
          collapsed={sidebarCollapsed}
          width={280}
          collapsedWidth={80}
          style={{ 
            background: '#ffffff',
            boxShadow: '2px 0 8px 0 rgba(0,0,0,0.1)',
            borderRight: '1px solid #f0f0f0',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 200,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
          theme="light"
        >
          {sidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isSmallScreen && (
        <Drawer
          title={null}
          placement="left"
          closable={false}
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0 }}
          width={280}
        >
          <div className="bg-gray-800 text-white min-h-full">
            {sidebarContent}
          </div>
        </Drawer>
      )}

      <Layout>
        {/* Header */}
        <Header style={{ 
          background: '#ffffff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #f0f0f0',
          height: '64px',
          position: 'fixed',
          top: 0,
          right: 0,
          left: isSmallScreen ? 0 : (sidebarCollapsed ? 80 : 280),
          zIndex: 100,
          transition: 'left 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isSmallScreen ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
                size="large"
              />
            ) : (
              <Button
                type="text"
                icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => dispatch(toggleSidebar())}
                size="large"
              />
            )}
            
            <div>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/exhibitions/exhibitor-links' && 'Exhibitor Links'}
                {location.pathname.startsWith('/exhibitions') && location.pathname !== '/exhibitions/exhibitor-links' && 'Exhibition Management'}
                {location.pathname === '/visitors/analytics' && 'Analytics Dashboard'}
                {location.pathname === '/visitors/reports' && 'Exhibition Reports'}
                {location.pathname.startsWith('/visitors') && location.pathname !== '/visitors/analytics' && location.pathname !== '/visitors/reports' && 'Visitor Management'}
                {location.pathname === '/users' && 'User Management'}
                {location.pathname === '/roles' && 'Roles Management'}
                {location.pathname === '/settings' && 'Settings'}
              </Text>
            </div>
          </div>

          <Space>
            <Badge count={notifications.length} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                size="large"
                className="flex items-center"
              />
            </Badge>
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer', 
                padding: '8px 12px', 
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                maxWidth: '200px'
              }}>
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  size={32}
                />
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  flex: 1
                }}>
                  <Text 
                    strong 
                    style={{ 
                      display: 'block', 
                      fontSize: '14px',
                      lineHeight: '20px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {user?.name || 'User'}
                  </Text>
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: '12px',
                      lineHeight: '16px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {getRoleName(user?.role as any)}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content style={{ 
          padding: '32px', 
          background: '#f8fafc', 
          marginTop: '64px',
          marginLeft: isSmallScreen ? 0 : (sidebarCollapsed ? 80 : 280),
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          transition: 'margin-left 0.2s'
        }}>
          <Outlet />
        </Content>
      </Layout>
      </Layout>
    </>
  );
};

export default AdminLayout;
