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
  ScanOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppSelector, useAppDispatch } from '../store';
import { toggleSidebar, setSidebarCollapsed } from '../store/slices/appSlice';
import NetworkStatus from '../components/NetworkStatus';
import { APP_CONFIG } from '../constants';
import { getRoleName } from '../utils/roleHelper';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

  const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/exhibitions',
    icon: <CalendarOutlined />,
    label: 'Exhibitions',
    children: [
      {
        key: '/exhibitions/list',
        label: 'All Exhibitions',
      },
      {
        key: '/exhibitions/exhibitor-links',
        label: 'Exhibitor Links',
      },
    ],
  },
  {
    key: '/kiosk-settings',
    icon: <SettingOutlined />,
    label: 'Kiosk Settings',
  },
  {
    key: '/visitors',
    icon: <TeamOutlined />,
    label: 'Visitors',
    children: [
      {
        key: '/visitors/all',
        label: 'All Visitors',
      },
      {
        key: '/visitors/reports',
        label: 'Exhibition Reports',
      },
    ],
  },
  {
    key: '/locations',
    icon: <EnvironmentOutlined />,
    label: 'Locations',
  },
  {
    key: '/users',
    icon: <UserOutlined />,
    label: 'Users',
  },
  {
    key: '/roles',
    icon: <SafetyOutlined />,
    label: 'Roles',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { logout, user } = useAuth();
  const { sidebarCollapsed, notifications } = useAppSelector((state) => state.app);
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

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
                {location.pathname.startsWith('/visitors') && 'Visitor Management'}
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
                    {getRoleName(user?.role)}
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
