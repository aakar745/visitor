import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Avatar,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Dropdown,
  Badge,
  Empty,
  message,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UsergroupAddOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { format } from 'date-fns';
import { useUsers, useUserStats, useUserMutations } from '../../hooks/useUsers';
import { useFormCleanup } from '../../hooks/useFormCleanup';
import { getRoleName } from '../../utils/roleHelper';
import type { 
  UserProfile, 
  CreateUserRequest, 
  UpdateUserRequest,
  UserRole,
  UserStatus,
  UserFilters
} from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

// Role configurations
const roleConfig = {
  super_admin: { 
    color: 'purple', 
    icon: '👑', 
    name: 'Super Admin',
    description: 'Full system access'
  },
  admin: { 
    color: 'red', 
    icon: '🛡️', 
    name: 'Admin',
    description: 'Administrative access'
  },
  manager: { 
    color: 'blue', 
    icon: '👨‍💼', 
    name: 'Manager',
    description: 'Management access'
  },
  employee: { 
    color: 'green', 
    icon: '👤', 
    name: 'Employee',
    description: 'Employee access'
  },
  viewer: { 
    color: 'default', 
    icon: '👁️', 
    name: 'Viewer',
    description: 'View-only access'
  },
};

// Status configurations
const statusConfig = {
  active: { color: 'success', text: 'Active', icon: '✅' },
  inactive: { color: 'default', text: 'Inactive', icon: '⏸️' },
  suspended: { color: 'error', text: 'Suspended', icon: '🚫' },
  pending: { color: 'warning', text: 'Pending', icon: '⏳' },
};

const Users: React.FC = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [inviteForm] = Form.useForm();
  
  // SECURITY FIX (BUG-019): Cleanup forms on unmount
  useFormCleanup([form, inviteForm]);

  // Build filters
  const filters: UserFilters = {
    search: searchTerm || undefined,
    role: roleFilter,
    status: statusFilter,
  };

  // Hooks
  const { data: usersData, isLoading } = useUsers({
    page: currentPage,
    limit: pageSize,
    ...filters,
  });

  const { data: stats } = useUserStats();

  const {
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
    sendInvitation,
    exportUsers,
    isCreating,
    isUpdating,
    isSendingInvitation,
    isExporting,
  } = useUserMutations();

  // Handlers
  const handleCreateUser = async (values: CreateUserRequest) => {
    try {
      await createUser.mutateAsync(values);
      setIsUserModalVisible(false);
      form.resetFields();
      message.success('User created successfully');
    } catch (error) {
      message.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (values: UpdateUserRequest) => {
    if (!selectedUser) return;
    try {
      await updateUser.mutateAsync({ id: selectedUser.id, data: values });
      setIsUserModalVisible(false);
      setSelectedUser(null);
      form.resetFields();
      message.success('User updated successfully');
    } catch (error) {
      message.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      message.success('User deleted successfully');
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId: string, status: 'active' | 'inactive') => {
    try {
      await toggleStatus.mutateAsync({ id: userId, status });
      message.success(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      message.error('Failed to update user status');
    }
  };

  const handleSendInvitation = async (values: { email: string; role: string }) => {
    try {
      await sendInvitation.mutateAsync({ email: values.email, role: values.role });
      setIsInviteModalVisible(false);
      inviteForm.resetFields();
      message.success('Invitation sent successfully');
    } catch (error) {
      message.error('Failed to send invitation');
    }
  };

  const handleExport = async (format: 'csv' | 'excel' = 'excel') => {
    try {
      await exportUsers.mutateAsync({ filters, format });
      message.success(`Users exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Failed to export users');
    }
  };

  const openUserModal = (user?: UserProfile) => {
    if (user) {
      setSelectedUser(user);
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: getRoleName(user.role),
        status: user.status,
        department: user.department,
        position: user.position,
      });
    } else {
      setSelectedUser(null);
      form.resetFields();
    }
    setIsUserModalVisible(true);
  };

  const openViewModal = (user: UserProfile) => {
    setSelectedUser(user);
    setIsViewModalVisible(true);
  };

  // Table columns
  const columns: ColumnsType<UserProfile> = [
    {
      title: 'User',
      key: 'user',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            size={40}
            src={record.avatar}
            icon={!record.avatar && <UserOutlined />}
            style={{ backgroundColor: record.avatar ? undefined : '#1890ff' }}
          />
          <div>
            <Text strong style={{ display: 'block', marginBottom: '2px', fontSize: '14px' }}>
              {record.name}
            </Text>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '2px' }}>
              <MailOutlined style={{ marginRight: '4px' }} />
              {record.email}
            </div>
            {record.phone && (
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                <PhoneOutlined style={{ marginRight: '4px' }} />
                {record.phone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Role & Department',
      key: 'role',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: '6px' }}>
            <Tag 
              color={roleConfig[getRoleName(record.role) as keyof typeof roleConfig]?.color || 'default'}
              style={{ borderRadius: '6px', fontWeight: 500 }}
            >
              {roleConfig[getRoleName(record.role) as keyof typeof roleConfig]?.icon} {roleConfig[getRoleName(record.role) as keyof typeof roleConfig]?.name || getRoleName(record.role).toUpperCase()}
            </Tag>
          </div>
          {record.department && (
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              🏢 {record.department}
            </Text>
          )}
          {record.position && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              📋 {record.position}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Status & Activity',
      key: 'status',
      width: 150,
      render: (_, record) => (
        <div>
          <Tag 
            color={statusConfig[record.status as keyof typeof statusConfig]?.color || 'default'}
            style={{ 
              borderRadius: '6px',
              fontWeight: 500,
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              width: 'fit-content'
            }}
          >
            {statusConfig[record.status as keyof typeof statusConfig]?.icon} {statusConfig[record.status as keyof typeof statusConfig]?.text || record.status}
          </Tag>
          {record.lastLoginAt ? (
            <Text style={{ fontSize: '11px', color: '#52c41a', display: 'block' }}>
              Last: {format(new Date(record.lastLoginAt), 'MMM dd, HH:mm')}
            </Text>
          ) : (
            <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>
              Never logged in
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Created',
      key: 'created',
      width: 120,
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px', display: 'block' }}>
            {format(new Date(record.createdAt), 'MMM dd, yyyy')}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {format(new Date(record.createdAt), 'HH:mm')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => openViewModal(record),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit User',
            onClick: () => openUserModal(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'toggle-status',
            icon: record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />,
            label: record.status === 'active' ? 'Deactivate' : 'Activate',
            onClick: () => handleToggleStatus(
              record.id, 
              record.status === 'active' ? 'inactive' : 'active'
            ),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete User',
            danger: true,
            onClick: () => handleDeleteUser(record.id),
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              style={{ color: '#1890ff' }}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              User Management
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Manage system users, roles, and permissions
            </Text>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                icon={<ReloadOutlined />}
                size="middle"
                style={{ borderRadius: '6px' }}
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                size="middle"
                style={{ borderRadius: '6px' }}
                onClick={() => handleExport('excel')}
                loading={isExporting}
              >
                Export
              </Button>
              <Button
                icon={<UserAddOutlined />}
                size="middle"
                style={{ borderRadius: '6px' }}
                onClick={() => setIsInviteModalVisible(true)}
              >
                Send Invite
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="middle"
                style={{ borderRadius: '6px', background: '#1890ff' }}
                onClick={() => openUserModal()}
              >
                Add User
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Statistics Cards */}
        {stats && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                      TOTAL USERS
                    </Text>
                  </div>
                  <TeamOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  {stats?.totalUsers || 0}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  border: 'none',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                      ACTIVE USERS
                    </Text>
                  </div>
                  <UserOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  {stats?.activeUsers || 0}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                      RECENT LOGINS
                    </Text>
                  </div>
                  <SafetyOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  {stats?.recentLogins || 0}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  border: 'none',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                      PENDING USERS
                    </Text>
                  </div>
                  <UsergroupAddOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  {stats?.pendingUsers || 0}
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Filters Section */}
      <Card 
        style={{ 
          marginBottom: '24px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0, color: '#262626', fontSize: '16px' }}>
            🔍 Filter & Search Users
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Find users by name, email, role, or status
          </Text>
        </div>
        
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                Search Users
              </Text>
            </div>
            <Input
              placeholder="Search by name or email..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              size="middle"
              style={{ borderRadius: '6px' }}
            />
          </Col>
          
          <Col xs={24} sm={12} md={6} lg={4}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                Role
              </Text>
            </div>
            <Select
              placeholder="All Roles"
              style={{ width: '100%', borderRadius: '6px' }}
              size="middle"
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
            >
              {Object.entries(roleConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.icon} {config.name}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={6} lg={4}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                Status
              </Text>
            </div>
            <Select
              placeholder="All Status"
              style={{ width: '100%', borderRadius: '6px' }}
              size="middle"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.icon} {config.text}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={10}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                Actions
              </Text>
            </div>
            <Space size="small" wrap>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter(undefined);
                  setStatusFilter(undefined);
                }}
                size="middle"
                style={{ borderRadius: '6px' }}
              >
                Clear Filters
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#262626' }}>
              👥 System Users
            </Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {usersData?.total || 0} users • {usersData?.users.filter(u => u.status === 'active').length || 0} active
            </Text>
          </div>
          <Badge
            count={`${usersData?.users.filter(u => u.status === 'active').length || 0} Active`}
            style={{ backgroundColor: '#52c41a', borderRadius: '12px' }}
          />
        </div>

        {usersData?.users && usersData.users.length > 0 ? (
          <Table
            columns={columns}
            dataSource={usersData.users}
            rowKey="id"
            loading={isLoading}
            size="middle"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: usersData?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Showing ${range[0]}-${range[1]} of ${total} users`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
              style: { marginTop: '16px' },
              pageSizeOptions: ['10', '25', '50', '100']
            }}
            scroll={{ x: 1200 }}
            rowSelection={{
              selectedRowKeys: selectedUsers,
              onChange: (selectedRowKeys) => setSelectedUsers(selectedRowKeys as string[]),
            }}
          />
        ) : !isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                    No users found
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    Create your first user or adjust your filters
                  </Text>
                </div>
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openUserModal()}>
                Create User
              </Button>
            </Empty>
          </div>
        ) : null}
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              backgroundColor: '#1890ff', 
              borderRadius: '8px', 
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserOutlined style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>
              {selectedUser ? 'Edit User' : 'Create New User'}
            </span>
          </div>
        }
        open={isUserModalVisible}
        onCancel={() => {
          setIsUserModalVisible(false);
          setSelectedUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={selectedUser ? handleUpdateUser : handleCreateUser}
          style={{ marginTop: '24px' }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input size="large" placeholder="Enter full name" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input size="large" placeholder="user@example.com" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
              >
                <Input size="large" placeholder="+1 234 567 8900" />
              </Form.Item>
            </Col>

            {!selectedUser && (
              <Col span={24}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                  ]}
                >
                  <Input.Password size="large" placeholder="Enter secure password" />
                </Form.Item>
              </Col>
            )}
            
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select size="large" placeholder="Select role">
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {config.icon} {config.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {config.description}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select size="large" placeholder="Select status">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <Option key={key} value={key}>
                      {config.icon} {config.text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
              >
                <Input size="large" placeholder="e.g., Engineering" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="position"
                label="Position"
              >
                <Input size="large" placeholder="e.g., Senior Developer" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              onClick={() => {
                setIsUserModalVisible(false);
                setSelectedUser(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={selectedUser ? isUpdating : isCreating}
            >
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* User Details View Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar 
              size={32}
              src={selectedUser?.avatar}
              icon={!selectedUser?.avatar && <UserOutlined />}
            />
            <span>User Details</span>
          </div>
        }
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setSelectedUser(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
        centered
      >
        {selectedUser && (
          <div style={{ padding: '12px 0' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>NAME</Text>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>
                    {selectedUser.name}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>EMAIL</Text>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {selectedUser.email}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>PHONE</Text>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {selectedUser.phone || 'Not provided'}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>ROLE</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Tag color={roleConfig[getRoleName(selectedUser.role) as keyof typeof roleConfig]?.color}>
                      {roleConfig[getRoleName(selectedUser.role) as keyof typeof roleConfig]?.name || getRoleName(selectedUser.role)}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>DEPARTMENT</Text>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {selectedUser.department || 'Not specified'}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>POSITION</Text>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {selectedUser.position || 'Not specified'}
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>LAST LOGIN</Text>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {selectedUser.lastLoginAt 
                      ? format(new Date(selectedUser.lastLoginAt), 'MMM dd, yyyy HH:mm')
                      : 'Never logged in'
                    }
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Invite User Modal */}
      <Modal
        title="Send User Invitation"
        open={isInviteModalVisible}
        onCancel={() => {
          setIsInviteModalVisible(false);
          inviteForm.resetFields();
        }}
        footer={null}
        width={500}
        centered
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleSendInvitation}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input size="large" placeholder="user@example.com" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select size="large" placeholder="Select role">
              {Object.entries(roleConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {config.icon} {config.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {config.description}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button onClick={() => setIsInviteModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={isSendingInvitation}
            >
              Send Invitation
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
