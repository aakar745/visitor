import React from 'react';
import { Form, Input, Button, Checkbox, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { LoginRequest } from '../../types';
import AuthLayout from '../../components/AuthLayout';

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
      await login({
        email: values.email,
        password: values.password,
      });
      // Use sanitized redirect path to prevent infinite loops
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      setError(error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
    >
      <Form
        form={form}
        name="login"
        size="large"
        onFinish={handleSubmit}
        autoComplete="off"
        layout="vertical"
      >
        {error && (
          <Alert
            message="Login Failed"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-6"
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
            prefix={<UserOutlined />}
            placeholder="Enter your email"
            autoComplete="email"
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
            prefix={<LockOutlined />}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item>
          <div className="flex justify-between items-center">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Button type="link" className="p-0 h-auto">
              Forgot password?
            </Button>
          </div>
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loginLoading}
            block
            size="large"
            style={{ height: '48px', background: 'linear-gradient(90deg, #3b82f6 0%, #4f46e5 100%)', border: 'none' }}
          >
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space style={{ fontSize: '14px', color: '#6b7280' }}>
          <span>Need help? Contact your administrator</span>
        </Space>
      </div>
    </AuthLayout>
  );
};

export default Login;
