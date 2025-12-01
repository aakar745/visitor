import React from 'react';
import { Form, Input, Button, Checkbox, Alert, Typography, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, ThunderboltOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { LoginRequest } from '../../types';
import { APP_CONFIG } from '../../constants';
import './Login.css';

interface LocationState {
  from: {
    pathname: string;
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginLoading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [error, setError] = React.useState<string | null>(null);

  // SECURITY FIX (BUG-011): Prevent infinite redirect loop
  // Sanitize the redirect target to prevent redirecting back to login/unauthorized pages
  const getRedirectPath = (): string => {
    const from = (location.state as LocationState)?.from?.pathname;
    
    // List of paths that should NOT be used as redirect targets
    const invalidRedirectPaths = ['/login', '/unauthorized'];
    
    // If 'from' is invalid or not set, default to dashboard
    if (!from || invalidRedirectPaths.includes(from)) {
      return '/dashboard';
    }
    
    return from;
  };

  const redirectPath = getRedirectPath();

  // SECURITY FIX (BUG-011): Redirect if already authenticated
  // Prevents showing login form to authenticated users
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (values: LoginRequest & { remember: boolean }) => {
    try {
      setError(null);
      console.log('[Login] Attempting login for:', values.email);
      await login({
        email: values.email,
        password: values.password,
      });
      console.log('[Login] Login successful, navigating to:', redirectPath);
      // Use sanitized redirect path to prevent infinite loops
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error('[Login] Login error:', error);
      // Error is already mapped to user-friendly message in authSlice
      setError(error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <Row className="login-row">
        {/* Left Side - Branding & Features */}
        <Col xs={0} lg={12} className="login-left">
          <div className="login-left-content">
            {/* Logo & Brand */}
            <div className="brand-section">
              <div className="brand-logo">
                <div className="logo-icon">
                  {APP_CONFIG.APP_NAME.split(' ').map(word => word.charAt(0)).join('')}
                </div>
              </div>
              <Typography.Title level={1} className="brand-title">
                {APP_CONFIG.APP_NAME}
              </Typography.Title>
              <Typography.Paragraph className="brand-subtitle">
                Streamline your visitor management with powerful tools and real-time insights
              </Typography.Paragraph>
            </div>

            {/* Features List */}
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <ThunderboltOutlined />
                </div>
                <div className="feature-content">
                  <Typography.Title level={5} className="feature-title">
                    Lightning Fast
                  </Typography.Title>
                  <Typography.Text className="feature-description">
                    Instant check-ins and real-time badge generation
                  </Typography.Text>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <SafetyOutlined />
                </div>
                <div className="feature-content">
                  <Typography.Title level={5} className="feature-title">
                    Secure & Reliable
                  </Typography.Title>
                  <Typography.Text className="feature-description">
                    Enterprise-grade security with role-based access control
                  </Typography.Text>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <TeamOutlined />
                </div>
                <div className="feature-content">
                  <Typography.Title level={5} className="feature-title">
                    Team Collaboration
                  </Typography.Title>
                  <Typography.Text className="feature-description">
                    Manage multiple exhibitions with team workflows
                  </Typography.Text>
                </div>
              </div>
            </div>

            {/* Decorative Pattern */}
            <div className="decorative-pattern">
              <div className="pattern-circle circle-1"></div>
              <div className="pattern-circle circle-2"></div>
              <div className="pattern-circle circle-3"></div>
            </div>
          </div>
        </Col>

        {/* Right Side - Login Form */}
        <Col xs={24} lg={12} className="login-right">
          <div className="login-form-container">
            {/* Mobile Logo */}
            <div className="mobile-brand">
              <div className="mobile-logo-icon">
                {APP_CONFIG.APP_NAME.split(' ').map(word => word.charAt(0)).join('')}
              </div>
              <Typography.Title level={3} style={{ margin: '12px 0 0 0', color: '#1f2937' }}>
                {APP_CONFIG.APP_NAME}
              </Typography.Title>
            </div>

            <div className="login-form-wrapper">
              <div className="login-header">
                <Typography.Title level={2} className="login-title">
                  Welcome Back! 👋
                </Typography.Title>
                <Typography.Paragraph className="login-subtitle">
                  Sign in to your admin account to continue
                </Typography.Paragraph>
              </div>

              <Form
                form={form}
                name="login"
                size="large"
                onFinish={handleSubmit}
                autoComplete="off"
                layout="vertical"
                className="login-form"
              >
                {error && (
                  <Alert
                    message="Login Failed"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    className="login-alert"
                  />
                )}

                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter your email!' },
                    { type: 'email', message: 'Please enter a valid email!' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="input-icon" />}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    className="login-input"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter your password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="input-icon" />}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="login-input"
                  />
                </Form.Item>

                <Form.Item className="login-options">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox className="remember-checkbox">Remember me</Checkbox>
                  </Form.Item>
                </Form.Item>

                <Form.Item className="submit-button-wrapper">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loginLoading}
                    block
                    size="large"
                    className="login-button"
                  >
                    {loginLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Form.Item>
              </Form>

              <div className="login-footer">
                <Typography.Text className="help-text">
                  Need help? <a href="#">Contact your administrator</a>
                </Typography.Text>
              </div>
            </div>

            {/* Version Footer */}
            <div className="version-footer">
              <Typography.Text type="secondary">
                {APP_CONFIG.APP_NAME} v{APP_CONFIG.VERSION}
              </Typography.Text>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
