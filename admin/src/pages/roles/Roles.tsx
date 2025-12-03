import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Checkbox,
  Badge,
  Empty,
  App,
  Dropdown,
  Tabs,
  Collapse,
} from 'antd';
import {
  SafetyOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  SettingOutlined,
  TeamOutlined,
  SecurityScanOutlined,
  CrownOutlined,
  UserOutlined,
  ExperimentOutlined,
  BookOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { format } from 'date-fns';
import { useRoles, useRoleStats, useRoleMutations, usePermissionGroups, useRoleTemplates } from '../../hooks/useRoles';
import { useFormCleanup } from '../../hooks/useFormCleanup';
import { usePermissions } from '../../hooks/usePermissions';
import type { 
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleFilters,
  PermissionCategory
} from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Permission category configurations based on actual pages
const permissionCategoryConfig: Record<string, any> = {
  'Dashboard': {
    name: 'Dashboard',
    icon: <DatabaseOutlined />,
    color: '#1890ff',
    description: 'Main dashboard and overview'
  },
  'Exhibition Management': {
    name: 'Exhibition Management',
    icon: <ExperimentOutlined />,
    color: '#722ed1',
    description: 'Create and manage exhibitions'
  },
  'Exhibitor Management': {
    name: 'Exhibitor Management',
    icon: <TeamOutlined />,
    color: '#13c2c2',
    description: 'Manage exhibitor links and QR codes'
  },
  'Visitor Management': {
    name: 'Visitor Management',
    icon: <UserOutlined />,
    color: '#52c41a',
    description: 'Handle visitor registration and management'
  },
  'Analytics': {
    name: 'Analytics',
    icon: <BookOutlined />,
    color: '#fa541c',
    description: 'View analytics dashboard with charts and insights'
  },
  'Exhibition Reports': {
    name: 'Exhibition Reports',
    icon: <FileExcelOutlined />,
    color: '#722ed1',
    description: 'View, filter, and export exhibition registration reports'
  },
  'User Management': {
    name: 'User Management',
    icon: <TeamOutlined />,
    color: '#1890ff',
    description: 'Manage system users'
  },
  'Role Management': {
    name: 'Role Management',
    icon: <SafetyOutlined />,
    color: '#eb2f96',
    description: 'Manage roles and permissions'
  },
  'Location Management': {
    name: 'Location Management',
    icon: <EnvironmentOutlined />,
    color: '#2f54eb',
    description: 'Manage countries, states, cities, pincodes'
  },
  'System Settings': {
    name: 'System Settings',
    icon: <SettingOutlined />,
    color: '#faad14',
    description: 'Configure system settings'
  },
  'System Monitoring': {
    name: 'System Monitoring',
    icon: <SecurityScanOutlined />,
    color: '#f5222d',
    description: 'Monitor system queues and logs'
  },
};

// Role color options (unique colors only - no duplicates)
const roleColors = [
  '#1890ff', // Blue
  '#52c41a', // Green
  '#722ed1', // Purple
  '#fa541c', // Orange
  '#faad14', // Gold
  '#f5222d', // Red
  '#13c2c2', // Cyan
  '#eb2f96', // Magenta
  '#2f54eb', // Geek Blue
  '#a0d911', // Lime
  '#fa8c16', // Volcano
  '#096dd9', // Sky Blue
];

// Role icon options
const roleIcons = [
  '👑', '🛡️', '👨‍💼', '👤', '👁️', '⚙️', '📊', '🔒', '🌟', '💼', '🎯', '⭐'
];

const Roles: React.FC = () => {
  const { message } = App.useApp();
  const { hasPermission } = usePermissions();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [systemRoleFilter, setSystemRoleFilter] = useState<boolean | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [form] = Form.useForm();
  
  // SECURITY FIX (BUG-019): Cleanup form on unmount
  useFormCleanup(form);

  // Set form values when modal opens and after DOM is ready
  React.useEffect(() => {
    if (isRoleModalVisible && selectedRole) {
      // Use setTimeout to ensure Collapse component is fully rendered
      const timer = setTimeout(() => {
        form.setFieldsValue({
          name: selectedRole.name,
          description: selectedRole.description,
          color: selectedRole.color,
          icon: selectedRole.icon,
          permissions: selectedRole.permissions?.map((p: any) => p.id) || [],
          isActive: selectedRole.isActive,
        });
      }, 100);
      return () => clearTimeout(timer);
    } else if (isRoleModalVisible && !selectedRole) {
      // Reset form for new role creation
      form.resetFields();
    }
    return undefined;
  }, [isRoleModalVisible, selectedRole, form]);

  // Build filters
  const filters: RoleFilters = {
    search: searchTerm || undefined,
    isActive: statusFilter,
    isSystemRole: systemRoleFilter,
  };

  // Hooks
  const { data: rolesData, isLoading } = useRoles({
    page: currentPage,
    limit: pageSize,
    ...filters,
  });

  const { data: stats } = useRoleStats();
  const { data: permissionGroups } = usePermissionGroups();
  const { data: roleTemplates } = useRoleTemplates();

  const {
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    duplicateRole,
    createFromTemplate,
    exportRoles,
    isCreating,
    isUpdating,
    isExporting,
  } = useRoleMutations();

  // Handlers
  const handleCreateRole = async (values: CreateRoleRequest) => {
    try {
      await createRole.mutateAsync(values);
      setIsRoleModalVisible(false);
      form.resetFields();
      message.success('Role created successfully');
    } catch (error) {
      message.error('Failed to create role');
    }
  };

  const handleUpdateRole = async (values: UpdateRoleRequest) => {
    if (!selectedRole) return;
    try {
      await updateRole.mutateAsync({ id: selectedRole.id, data: values });
      setIsRoleModalVisible(false);
      setSelectedRole(null);
      form.resetFields();
      message.success('Role updated successfully');
    } catch (error) {
      message.error('Failed to update role');
    }
  };

  const handleFormSubmit = async (values: any) => {
    // Transform permission IDs to full permission objects
    const selectedPermissionIds = values.permissions || [];
    const fullPermissions: any[] = [];
    
    // Extract full permission objects from permissionGroups
    permissionGroups?.forEach((group: any) => {
      group.permissions.forEach((perm: any) => {
        if (selectedPermissionIds.includes(perm.id)) {
          fullPermissions.push({
            id: perm.id,
            name: perm.name,
            description: perm.description,
            action: perm.action || perm.id.split('.')[1], // Extract action from ID
            resource: perm.resource || perm.id.split('.')[0], // Extract resource from ID
            category: group.category,
          });
        }
      });
    });

    // Replace permission IDs with full permission objects
    const roleData = {
      ...values,
      permissions: fullPermissions,
    };

    if (selectedRole) {
      await handleUpdateRole(roleData as UpdateRoleRequest);
    } else {
      await handleCreateRole(roleData as CreateRoleRequest);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole.mutateAsync(roleId);
      message.success('Role deleted successfully');
    } catch (error: any) {
      // Show specific error message from backend
      const errorMessage = error?.response?.data?.message || 'Failed to delete role';
      message.error(errorMessage);
    }
  };

  const handleToggleStatus = async (roleId: string, isActive: boolean) => {
    try {
      await toggleRoleStatus.mutateAsync({ id: roleId, isActive });
      message.success(`Role ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      message.error('Failed to update role status');
    }
  };

  const handleDuplicateRole = async (roleId: string, _newName: string) => {
    try {
      await duplicateRole(roleId);
      message.success('Role duplicated successfully (placeholder)');
    } catch (error) {
      message.error('Failed to duplicate role');
    }
  };

  const handleCreateFromTemplate = async (templateId: string, _roleData: Partial<CreateRoleRequest>) => {
    try {
      await createFromTemplate(templateId);
      setIsTemplateModalVisible(false);
      message.success('Role created from template successfully (placeholder)');
    } catch (error) {
      message.error('Failed to create role from template');
    }
  };

  const handleExport = async (format: 'csv' | 'excel' = 'excel') => {
    try {
      await exportRoles(format);
      message.success(`Roles exported successfully as ${format.toUpperCase()} (placeholder)`);
    } catch (error) {
      message.error('Failed to export roles');
    }
  };

  const openRoleModal = (role?: Role) => {
    setSelectedRole(role || null);
    setIsRoleModalVisible(true);
    // Note: Form values will be set in useEffect after modal is visible
  };

  const openViewModal = (role: Role) => {
    setSelectedRole(role);
    setIsViewModalVisible(true);
  };

  // Table columns
  const columns: ColumnsType<Role> = [
    {
      title: 'Role',
      key: 'role',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: record.color || '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: 'white'
            }}
          >
            {record.icon || '🛡️'}
          </div>
          <div>
            <div style={{ marginBottom: '2px' }}>
              <Text strong style={{ fontSize: '14px', marginRight: '8px' }}>
                {record.name}
              </Text>
              {record.name === 'super_admin' && record.isSystemRole ? (
                <Tag color="red" style={{ fontSize: '10px', padding: '0 4px' }}>
                  👑 SUPER ADMIN (PROTECTED)
                </Tag>
              ) : record.isSystemRole ? (
                <Tag color="gold" style={{ fontSize: '10px', padding: '0 4px' }}>
                  SYSTEM ROLE
                </Tag>
              ) : null}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Permissions & Users',
      key: 'permissions',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: '6px' }}>
            <Badge 
              count={record.permissions.length}
              style={{ backgroundColor: '#1890ff' }}
              title="Permissions"
            />
            <Text style={{ marginLeft: '8px', fontSize: '12px' }}>
              Permissions
            </Text>
          </div>
          <div>
            <Badge 
              count={record.userCount}
              style={{ backgroundColor: record.userCount > 0 ? '#52c41a' : '#d9d9d9' }}
              title="Users"
            />
            <Text style={{ marginLeft: '8px', fontSize: '12px' }}>
              Users assigned
              {record.userCount > 0 && (
                <LockOutlined style={{ marginLeft: '4px', color: '#faad14', fontSize: '10px' }} title="Role is locked (cannot delete)" />
              )}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Tag 
          color={record.isActive ? 'success' : 'default'}
          style={{ 
            borderRadius: '6px',
            fontWeight: 500,
          }}
        >
          {record.isActive ? '✅ Active' : '⏸️ Inactive'}
        </Tag>
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
        // 🔒 Check if this is the Super Admin role (protected)
        const isSuperAdmin = record.name === 'super_admin' && record.isSystemRole;
        
        const menuItems: MenuProps['items'] = [];
        
        // View Details - requires roles.view permission
        if (hasPermission('roles.view')) {
          menuItems.push({
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => openViewModal(record),
          });
        }
        
        // Edit Role - requires roles.update permission
        if (hasPermission('roles.update')) {
          menuItems.push({
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit Role',
            onClick: () => openRoleModal(record),
            disabled: isSuperAdmin || record.isSystemRole, // 🔒 Super Admin & system roles cannot be edited
          });
        }
        
        // Duplicate Role - requires roles.duplicate permission
        if (hasPermission('roles.duplicate')) {
          menuItems.push({
            key: 'duplicate',
            icon: <CopyOutlined />,
            label: 'Duplicate Role',
            onClick: () => {
              const newName = `${record.name} (Copy)`;
              handleDuplicateRole(record.id, newName);
            },
          });
        }
        
        // Divider
        if (menuItems.length > 0 && hasPermission('roles.update')) {
          menuItems.push({
            type: 'divider',
          });
        }
        
        // Toggle Status - requires roles.update permission
        if (hasPermission('roles.update')) {
          menuItems.push({
            key: 'toggle-status',
            icon: record.isActive ? <LockOutlined /> : <UnlockOutlined />,
            label: record.isActive ? 'Deactivate' : 'Activate',
            onClick: () => handleToggleStatus(record.id, !record.isActive),
            disabled: isSuperAdmin || record.isSystemRole, // 🔒 Super Admin & system roles cannot be deactivated
          });
        }
        
        // Divider before delete
        if (menuItems.length > 0 && hasPermission('roles.delete')) {
          menuItems.push({
            type: 'divider',
          });
        }
        
        // Delete - requires roles.delete permission
        if (hasPermission('roles.delete')) {
          const isLocked = isSuperAdmin || record.isSystemRole || record.userCount > 0;
          const lockReason = 
            isSuperAdmin ? 'Super Admin role is protected' :
            record.isSystemRole ? 'System role cannot be deleted' :
            record.userCount > 0 ? `Role is assigned to ${record.userCount} user(s)` : '';
          
          menuItems.push({
            key: 'delete',
            icon: isLocked ? <LockOutlined /> : <DeleteOutlined />,
            label: isLocked ? `Delete (Locked: ${lockReason})` : 'Delete Role',
            danger: !isLocked,
            onClick: () => !isLocked && handleDeleteRole(record.id),
            disabled: isLocked,
          });
        }

        // If no menu items, show "No actions"
        if (menuItems.length === 0) {
          return <Text type="secondary" style={{ fontSize: '12px' }}>No actions</Text>;
        }

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

  // Render permission groups in modal
  // FIX: Using forceRender to ensure all checkboxes are mounted even when panels are collapsed
  // This prevents the form state from being reset when expanding panels
  const renderPermissionGroups = () => {
    if (!permissionGroups) return null;

    // Get current form permissions to show count in collapsed panels
    const currentPermissions = form.getFieldValue('permissions') || [];

    return (
      <Form.Item
        name="permissions"
        label="Permissions"
        rules={[{ required: true, message: 'Please select at least one permission' }]}
      >
        <Checkbox.Group style={{ width: '100%' }}>
          <Collapse
            // FIX: Force render all panels so checkboxes remain mounted and synced with form
            items={permissionGroups.map((group: any) => {
              // Count selected permissions in this group
              const selectedInGroup = group.permissions.filter(
                (p: any) => currentPermissions.includes(p.id)
              ).length;
              
              return {
                key: group.category,
                forceRender: true, // KEY FIX: Keep checkboxes mounted even when collapsed
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {permissionCategoryConfig[group.category as PermissionCategory]?.icon}
                    <span>{permissionCategoryConfig[group.category as PermissionCategory]?.name || group.name}</span>
                    <Badge 
                      count={selectedInGroup > 0 ? `${selectedInGroup}/${group.permissions.length}` : group.permissions.length} 
                      style={{ 
                        backgroundColor: selectedInGroup > 0 ? '#52c41a' : '#f0f0f0', 
                        color: selectedInGroup > 0 ? '#fff' : '#666' 
                      }} 
                    />
                  </div>
                ),
                children: (
                  <Row gutter={[8, 8]}>
                    {group.permissions.map((permission: any) => (
                      <Col span={12} key={permission.id}>
                        <Checkbox value={permission.id}>
                          <div>
                            <Text style={{ fontSize: '13px', fontWeight: 500 }}>
                              {permission.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                              {permission.description}
                            </Text>
                          </div>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                ),
              };
            })}
          />
        </Checkbox.Group>
      </Form.Item>
    );
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              Role Management
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Define roles and manage permissions across your system
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
              {hasPermission('roles.export') && (
                <Button
                  icon={<DownloadOutlined />}
                  size="middle"
                  style={{ borderRadius: '6px' }}
                  onClick={() => handleExport('excel')}
                  loading={isExporting}
                >
                  Export
                </Button>
              )}
              {hasPermission('roles.view') && (
                <Button
                  icon={<ExperimentOutlined />}
                  size="middle"
                  style={{ borderRadius: '6px' }}
                  onClick={() => setIsTemplateModalVisible(true)}
                >
                  Templates
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="middle"
                style={{ borderRadius: '6px', background: '#1890ff' }}
                onClick={() => openRoleModal()}
              >
                Create Role
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
                      TOTAL ROLES
                    </Text>
                  </div>
                  <SafetyOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  {stats?.totalRoles || 0}
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
                      ACTIVE ROLES
                    </Text>
                  </div>
                  <UnlockOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  {stats?.activeRoles || 0}
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
                      PERMISSIONS
                    </Text>
                  </div>
                  <DatabaseOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  {stats?.totalPermissions || 0}
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
                      MOST USED
                    </Text>
                  </div>
                  <CrownOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  {stats.mostUsedRole?.name || 'N/A'}
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                  {stats.mostUsedRole?.userCount || 0} users
                </Text>
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
            🔍 Filter & Search Roles
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Find roles by name, status, or type
          </Text>
        </div>
        
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                Search Roles
              </Text>
            </div>
            <Input
              placeholder="Search by name or description..."
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
              <Option value={true}>✅ Active</Option>
              <Option value={false}>⏸️ Inactive</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={6} lg={4}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                Type
              </Text>
            </div>
            <Select
              placeholder="All Types"
              style={{ width: '100%', borderRadius: '6px' }}
              size="middle"
              value={systemRoleFilter}
              onChange={setSystemRoleFilter}
              allowClear
            >
              <Option value={true}>🔒 System Roles</Option>
              <Option value={false}>🛠️ Custom Roles</Option>
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
                  setStatusFilter(undefined);
                  setSystemRoleFilter(undefined);
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

      {/* Roles Table */}
      <Card
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#262626' }}>
              🛡️ System Roles
            </Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {rolesData?.total || 0} roles • {rolesData?.roles.filter((r: any) => r.isActive).length || 0} active
            </Text>
          </div>
          <Badge
            count={`${rolesData?.roles.filter((r: any) => r.isActive).length || 0} Active`}
            style={{ backgroundColor: '#52c41a', borderRadius: '12px' }}
          />
        </div>

        {rolesData?.roles && rolesData.roles.length > 0 ? (
          <Table
            columns={columns}
            dataSource={rolesData.roles}
            rowKey="id"
            loading={isLoading}
            size="middle"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: rolesData?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
            showTotal: (total: number, range: number[]) =>
              `Showing ${range[0]}-${range[1]} of ${total} roles`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
              style: { marginTop: '16px' },
              pageSizeOptions: ['10', '25', '50', '100']
            }}
            scroll={{ x: 1200 }}
            rowSelection={{
              selectedRowKeys: selectedRoles,
              onChange: (selectedRowKeys) => setSelectedRoles(selectedRowKeys as string[]),
            }}
          />
        ) : !isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                    No roles found
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    Create your first role or adjust your filters
                  </Text>
                </div>
              }
            >
              {hasPermission('roles.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openRoleModal()}>
                  Create Role
                </Button>
              )}
            </Empty>
          </div>
        ) : null}
      </Card>

      {/* Create/Edit Role Modal */}
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
              <SafetyOutlined style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>
              {selectedRole ? 'Edit Role' : 'Create New Role'}
            </span>
          </div>
        }
        open={isRoleModalVisible}
        onCancel={() => {
          setIsRoleModalVisible(false);
          setSelectedRole(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ marginTop: '24px' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Role Name"
                rules={[{ required: true, message: 'Please enter role name' }]}
              >
                <Input size="large" placeholder="Enter role name" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
                initialValue={true}
              >
                <Checkbox>Active</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please enter description' }]}
              >
                <Input.TextArea 
                  size="large" 
                  placeholder="Describe what this role does..."
                  rows={3}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="color"
                label="Role Color"
                initialValue="#1890ff"
              >
                <Select size="large" placeholder="Select color">
                  {roleColors.map((color) => (
                    <Option key={color} value={color}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '4px', 
                            backgroundColor: color 
                          }} 
                        />
                        {color}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="icon"
                label="Role Icon"
                initialValue="🛡️"
              >
                <Select size="large" placeholder="Select icon">
                  {roleIcons.map((icon) => (
                    <Option key={icon} value={icon}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{icon}</span>
                        {icon}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              {renderPermissionGroups()}
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              onClick={() => {
                setIsRoleModalVisible(false);
                setSelectedRole(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={selectedRole ? isUpdating : isCreating}
            >
              {selectedRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Role Details View Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedRole && (
              <div 
                style={{ 
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: selectedRole.color || '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: 'white'
                }}
              >
                {selectedRole.icon || '🛡️'}
              </div>
            )}
            <span>Role Details</span>
          </div>
        }
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setSelectedRole(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
        centered
      >
        {selectedRole && (
          <div style={{ padding: '12px 0' }}>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Basic Information" key="1">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>NAME</Text>
                      <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>
                        {selectedRole.name}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>STATUS</Text>
                      <div style={{ marginTop: '4px' }}>
                        <Tag color={selectedRole.isActive ? 'success' : 'default'}>
                          {selectedRole.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                  <Col span={24}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>DESCRIPTION</Text>
                      <div style={{ fontSize: '14px', marginTop: '4px' }}>
                        {selectedRole.description}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>USERS ASSIGNED</Text>
                      <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>
                        {selectedRole.userCount}
                        {selectedRole.userCount > 0 && (
                          <LockOutlined style={{ marginLeft: '8px', color: '#faad14', fontSize: '14px' }} title="Role is locked" />
                        )}
                      </div>
                      {selectedRole.userCount > 0 && (
                        <Text type="warning" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                          🔒 Role is locked and cannot be deleted
                        </Text>
                      )}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>CREATED</Text>
                      <div style={{ fontSize: '14px', marginTop: '4px' }}>
                        {format(new Date(selectedRole.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="Permissions" key="2">
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {permissionGroups?.map((group: any) => {
                    const rolePermissions = selectedRole.permissions.filter(
                      p => p.category === group.category
                    );
                    
                    if (rolePermissions.length === 0) return null;
                    
                    return (
                      <div key={group.category} style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          {permissionCategoryConfig[group.category as PermissionCategory]?.icon}
                          <Text strong style={{ fontSize: '14px' }}>
                            {permissionCategoryConfig[group.category as PermissionCategory]?.name}
                          </Text>
                          <Badge count={rolePermissions.length} style={{ backgroundColor: '#1890ff' }} />
                        </div>
                        <Row gutter={[8, 8]}>
                          {rolePermissions.map((permission) => (
                            <Col span={12} key={permission.id}>
                              <div style={{ 
                                padding: '8px 12px', 
                                background: '#f6f8fa', 
                                borderRadius: '6px',
                                border: '1px solid #e1e4e8'
                              }}>
                                <Text style={{ fontSize: '13px', fontWeight: 500 }}>
                                  {permission.name}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                                  {permission.description}
                                </Text>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    );
                  })}
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Modal>

      {/* Role Templates Modal */}
      <Modal
        title="Create Role from Template"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
        width={600}
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
            Choose from pre-configured role templates to quickly set up common roles
          </Text>
          
          {!roleTemplates || roleTemplates.length === 0 ? (
            <Empty description="No templates available" />
          ) : (
            <Row gutter={[16, 16]}>
              {roleTemplates.filter((template: any) => template).map((template: any) => (
              <Col span={12} key={template.id}>
                <Card
                  hoverable
                  style={{ 
                    borderRadius: '8px',
                    border: template.isRecommended ? '2px solid #52c41a' : '1px solid #d9d9d9'
                  }}
                  onClick={() => handleCreateFromTemplate(template.id, {
                    name: template.name,
                    description: template.description,
                    color: template.color,
                    icon: template.icon,
                  })}
                >
                  {template.isRecommended && (
                    <Badge.Ribbon text="Recommended" color="green">
                      <div />
                    </Badge.Ribbon>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div 
                      style={{ 
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: template.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: 'white'
                      }}
                    >
                      {template.icon}
                    </div>
                    <Text strong style={{ fontSize: '14px' }}>
                      {template.name}
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {template.description}
                  </Text>
                  <div style={{ marginTop: '8px' }}>
                    <Badge count={template.permissions.length} style={{ backgroundColor: '#1890ff' }} />
                    <Text style={{ marginLeft: '8px', fontSize: '11px' }}>permissions</Text>
                  </div>
                </Card>
              </Col>
              ))}
            </Row>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Roles;
