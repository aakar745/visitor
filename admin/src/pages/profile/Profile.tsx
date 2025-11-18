import React from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Avatar,
  Tag,
  Alert,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { useMessage } from '../../hooks/useMessage';
import { useFormCleanup } from '../../hooks/useFormCleanup';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user, changePassword, changePasswordLoading } = useAuth();
  const message = useMessage();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  
  // SECURITY FIX (BUG-019): Cleanup forms on unmount
  useFormCleanup([form, passwordForm]);

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      await changePassword(values);
      message.success('Password changed successfully. Please login again with your new password.');
      passwordForm.resetFields();
      
      // Optionally logout user after password change
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to change password');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text>Loading profile...</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px', color: '#1890ff' }}>
          My Profile
        </Title>
        <Text type="secondary">Manage your account information and security settings</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Profile Information */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Profile Information</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8} style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                <Avatar
                  size={100}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff', marginBottom: '16px' }}
                />
                <div>
                  <Title level={4} style={{ marginBottom: '4px' }}>{user.name}</Title>
                  <Tag color="blue">
                    {typeof user.role === 'object' && user.role?.name ? user.role.name : String(user.role || 'User')}
                  </Tag>
                </div>
              </Col>

              <Col xs={24} md={16}>
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    name: user.name,
                    email: user.email,
                    phone: (user as any).phone || '',
                  }}
                >
                  <Form.Item
                    name="name"
                    label="Full Name"
                  >
                    <Input
                      prefix={<UserOutlined />}
                      size="large"
                      disabled
                      placeholder="Full Name"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email Address"
                  >
                    <Input
                      prefix={<MailOutlined />}
                      size="large"
                      disabled
                      placeholder="Email"
                    />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Phone Number"
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      size="large"
                      disabled
                      placeholder="Phone"
                    />
                  </Form.Item>

                  <Alert
                    message="Profile Editing Disabled"
                    description="Contact your administrator to update your profile information."
                    type="info"
                    showIcon
                    style={{ marginTop: '16px' }}
                  />
                </Form>
              </Col>
            </Row>
          </Card>

          {/* Password Change Section */}
          <Card
            title={
              <Space>
                <LockOutlined />
                <span>Change Password</span>
              </Space>
            }
          >
            <Alert
              message="Security Notice"
              description="Changing your password will log you out from all devices. You'll need to login again with your new password."
              type="warning"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[
                  { required: true, message: 'Please enter your current password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  size="large"
                  placeholder="Enter current password"
                  disabled={changePasswordLoading}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter new password' },
                  { min: 8, message: 'New password must be at least 8 characters' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
                    message: 'Password must contain uppercase, lowercase, number, and special character',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      // SECURITY FIX (BUG-012 Frontend): Validate new password is different from current
                      const currentPassword = getFieldValue('currentPassword');
                      if (value && currentPassword && value === currentPassword) {
                        return Promise.reject(
                          new Error('New password must be different from your current password')
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<KeyOutlined />}
                  size="large"
                  placeholder="Enter new password"
                  disabled={changePasswordLoading}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<KeyOutlined />}
                  size="large"
                  placeholder="Confirm new password"
                  disabled={changePasswordLoading}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={changePasswordLoading}
                  block
                >
                  Change Password
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Alert
              message="Password Requirements"
              description={
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>At least 8 characters long</li>
                  <li>Contains at least one uppercase letter (A-Z)</li>
                  <li>Contains at least one lowercase letter (a-z)</li>
                  <li>Contains at least one number (0-9)</li>
                  <li>Contains at least one special character (@$!%*?&#)</li>
                  <li>Must be different from your current password</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Card>
        </Col>

        {/* Account Information */}
        <Col xs={24} lg={8}>
          <Card
            title="Account Information"
            style={{ marginBottom: '24px' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                  Status
                </Text>
                <Tag color={(user as any).status === 'active' ? 'success' : 'default'}>
                  {((user as any).status || 'Active').toUpperCase()}
                </Tag>
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                  Role
                </Text>
                <Text strong>
                  {typeof user.role === 'object' && user.role?.name ? user.role.name : String(user.role || 'User')}
                </Text>
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                  Member Since
                </Text>
                <Text>{new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</Text>
              </div>

              {(user as any).lastLoginAt && (
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                    Last Login
                  </Text>
                  <Text>{new Date((user as any).lastLoginAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</Text>
                </div>
              )}
            </Space>
          </Card>

          <Card title="Security">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                  Password Last Changed
                </Text>
                <Text>
                  {(user as any).passwordChangedAt
                    ? new Date((user as any).passwordChangedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Never'}
                </Text>
              </div>

              <Alert
                message="Two-Factor Authentication"
                description="Not yet configured. Contact administrator for setup."
                type="info"
                showIcon
                style={{ fontSize: '12px' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;

