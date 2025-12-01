import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  ColorPicker,
  InputNumber,
  Tag,
  Badge,
  Alert,
  Modal,
  Table,
  Tooltip,
  Popconfirm,
  App,
  Spin,
  Empty,
  Drawer,
  Upload,
  Image,
} from 'antd';
import {
  SettingOutlined,
  SecurityScanOutlined,
  UserOutlined,
  CalendarOutlined,
  NotificationOutlined,
  DatabaseOutlined,
  ApiOutlined,
  ReloadOutlined,
  DownloadOutlined,
  HistoryOutlined,
  ClearOutlined,
  ToolOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloudUploadOutlined,
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { format } from 'date-fns';
import {
  useSettings,
  useSettingsDashboard,
  useSettingsHistory,
  useSettingsBackups,
  useSystemHealth,
  useMaintenanceStatus,
  useSettingsMutations,
} from '../../hooks/useSettings';
import type {
  SettingsCategory,
  SettingsGroup,
  Setting,
  SettingsBackup,
} from '../../types';
import { BACKEND_BASE_URL } from '../../constants';

const { Title, Text } = Typography;
// Removed deprecated TabPane - using Tabs items prop instead
const { TextArea } = Input;
const { Option } = Select;

// Setting category configurations
const settingCategoryConfig = {
  general: {
    name: 'General',
    icon: <SettingOutlined />,
    color: '#2E5778',
    description: 'Basic application settings and branding'
  },
  security: {
    name: 'Security',
    icon: <SecurityScanOutlined />,
    color: '#f5222d',
    description: 'Security policies and authentication settings'
  },
  visitor: {
    name: 'Visitor',
    icon: <UserOutlined />,
    color: '#52c41a',
    description: 'Visitor registration and check-in configuration'
  },
  exhibition: {
    name: 'Exhibition',
    icon: <CalendarOutlined />,
    color: '#722ed1',
    description: 'Exhibition management and booking settings'
  },
  notification: {
    name: 'Notifications',
    icon: <NotificationOutlined />,
    color: '#fa541c',
    description: 'Email, SMS, and push notification configuration'
  },
  system: {
    name: 'System',
    icon: <DatabaseOutlined />,
    color: '#faad14',
    description: 'System maintenance and performance settings'
  },
  integration: {
    name: 'Integrations',
    icon: <ApiOutlined />,
    color: '#13c2c2',
    description: 'Third-party integrations and API settings'
  },
};

const Settings: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('general');
  const [isHistoryDrawerVisible, setIsHistoryDrawerVisible] = useState(false);
  const [isBackupModalVisible, setIsBackupModalVisible] = useState(false);
  const [backupForm] = Form.useForm();
  
  // Local state for input values to prevent cursor jumping
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const updateTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Ant Design hooks
  const { message } = App.useApp();

  // Hooks
  const { data: settings, isLoading } = useSettings();
  const { data: dashboard } = useSettingsDashboard();
  const { data: history } = useSettingsHistory();
  const { data: backups } = useSettingsBackups();
  const { data: systemHealth } = useSystemHealth();
  const { data: maintenanceStatus } = useMaintenanceStatus();

  const {
    updateSetting,
    resetSetting,
    createBackup,
    deleteBackup,
    restoreFromBackup,
    exportSettings,
    clearCache,
    enableMaintenanceMode,
    disableMaintenanceMode,
    uploadFile,
    isCreatingBackup,
    isExporting,
    isClearingCache,
    isTogglingMaintenance,
    isUploading,
  } = useSettingsMutations();

  // Handlers
  const handleSettingUpdate = async (key: string, value: any) => {
    try {
      await updateSetting.mutateAsync({ key, data: { value } });
      message.success('Setting updated successfully');
    } catch (error) {
      message.error('Failed to update setting');
    }
  };

  // Debounced update for text inputs (prevents cursor jumping)
  const handleLocalValueChange = useCallback((key: string, value: any) => {
    // Update local state immediately for smooth typing
    setLocalValues(prev => ({ ...prev, [key]: value }));

    // Clear existing timer
    if (updateTimers.current[key]) {
      clearTimeout(updateTimers.current[key]);
    }

    // Set new timer to update server after user stops typing
    updateTimers.current[key] = setTimeout(async () => {
      try {
        await updateSetting.mutateAsync({ key, data: { value } });
        // Don't show success message for every keystroke
      } catch (error) {
        message.error('Failed to update setting');
        // Revert local value on error
        setLocalValues(prev => {
          const newValues = { ...prev };
          delete newValues[key];
          return newValues;
        });
      }
    }, 800); // Wait 800ms after user stops typing
  }, [updateSetting, message]);

  // Get the display value (local if exists, otherwise from server)
  const getDisplayValue = (key: string, serverValue: any) => {
    return localValues.hasOwnProperty(key) ? localValues[key] : serverValue;
  };

  // Cleanup timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(updateTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);


  const handleResetSetting = async (key: string) => {
    try {
      // Clear any pending updates
      if (updateTimers.current[key]) {
        clearTimeout(updateTimers.current[key]);
        delete updateTimers.current[key];
      }
      // Clear local value
      setLocalValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
      // Reset on server
      await resetSetting.mutateAsync(key);
      message.success('Setting reset to default value');
    } catch (error) {
      message.error('Failed to reset setting');
    }
  };

  const handleCreateBackup = async (values: { name: string; description?: string }) => {
    try {
      await createBackup.mutateAsync(values);
      setIsBackupModalVisible(false);
      backupForm.resetFields();
      message.success('Backup created successfully');
    } catch (error) {
      message.error('Failed to create backup');
    }
  };

  const handleExport = async (format: 'json' | 'env' | 'yaml' = 'json') => {
    try {
      await exportSettings.mutateAsync({ format });
      message.success('Settings exported successfully');
    } catch (error) {
      message.error('Failed to export settings');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache.mutateAsync([]);
      message.success('Cache cleared successfully');
    } catch (error) {
      message.error('Failed to clear cache');
    }
  };

  const handleToggleMaintenanceMode = async () => {
    try {
      if (maintenanceStatus?.enabled) {
        await disableMaintenanceMode.mutateAsync();
        message.success('Maintenance mode disabled');
      } else {
        await enableMaintenanceMode.mutateAsync({
          message: 'System maintenance in progress. Please check back later.',
          duration: 60 // 60 minutes
        });
        message.success('Maintenance mode enabled');
      }
    } catch (error) {
      message.error('Failed to toggle maintenance mode');
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (file: File, settingKey: string) => {
    try {
      const result = await uploadFile.mutateAsync({ file, type: 'logo' });
      await handleSettingUpdate(settingKey, result.url);
      message.success('Logo uploaded successfully');
      return result.url;
    } catch (error) {
      message.error('Failed to upload logo');
      throw error;
    }
  };

  // Handle logo removal
  const handleLogoRemove = async (settingKey: string) => {
    try {
      await handleSettingUpdate(settingKey, null);
      message.success('Logo removed successfully');
    } catch (error) {
      message.error('Failed to remove logo');
    }
  };

  // Render setting input based on type
  const renderSettingInput = (setting: Setting) => {
    const { valueType, value, options, validation } = setting;

    switch (valueType) {
      case 'boolean':
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Switch
              checked={value}
              onChange={(checked) => handleSettingUpdate(setting.key, checked)}
              disabled={setting.isReadonly}
            />
          </div>
        );

      case 'number':
        return (
          <InputNumber
            value={value}
            min={validation?.min}
            max={validation?.max}
            onChange={(val) => handleSettingUpdate(setting.key, val)}
            disabled={setting.isReadonly}
            style={{ width: '100%' }}
            size="large"
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onChange={(val) => handleSettingUpdate(setting.key, val)}
            disabled={setting.isReadonly}
            style={{ width: '100%' }}
            size="large"
          >
            {options?.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'color':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ColorPicker
              value={value}
              onChange={(color) => handleSettingUpdate(setting.key, color.toHexString())}
              disabled={setting.isReadonly}
              showText
              size="large"
            />
            <Text type="secondary" style={{ fontSize: '13px' }}>{value}</Text>
          </div>
        );

      case 'password':
        return (
          <Input.Password
            value={getDisplayValue(setting.key, value)}
            onChange={(e) => handleLocalValueChange(setting.key, e.target.value)}
            disabled={setting.isReadonly}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={getDisplayValue(setting.key, value)}
            onChange={(e) => handleLocalValueChange(setting.key, e.target.value)}
            disabled={setting.isReadonly}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={getDisplayValue(setting.key, value)}
            onChange={(e) => handleLocalValueChange(setting.key, e.target.value)}
            disabled={setting.isReadonly}
          />
        );

      case 'json':
        return (
          <TextArea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsedValue = JSON.parse(e.target.value);
                handleSettingUpdate(setting.key, parsedValue);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            rows={4}
            disabled={setting.isReadonly}
          />
        );

      case 'file':
        return (
          <div style={{ width: '100%' }}>
            {value ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: '6px', 
                  padding: '8px',
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '120px',
                  height: '60px',
                }}>
                  <Image
                    src={`${BACKEND_BASE_URL}${value}`}
                    alt={setting.name}
                    style={{ maxWidth: '110px', maxHeight: '50px', objectFit: 'contain' }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    preview={true}
                  />
                </div>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isLt5M = file.size / 1024 / 1024 < 5;
                    if (!isLt5M) {
                      message.error('Image must be smaller than 5MB');
                      return false;
                    }
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('You can only upload image files');
                      return false;
                    }
                    handleLogoUpload(file, setting.key);
                    return false;
                  }}
                  disabled={setting.isReadonly}
                >
                  <Button 
                    icon={<CloudUploadOutlined />} 
                    loading={isUploading}
                    disabled={setting.isReadonly}
                  >
                    Change
                  </Button>
                </Upload>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleLogoRemove(setting.key)}
                  disabled={setting.isReadonly}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Upload.Dragger
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('Image must be smaller than 5MB');
                    return false;
                  }
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('You can only upload image files');
                    return false;
                  }
                  handleLogoUpload(file, setting.key);
                  return false;
                }}
                disabled={setting.isReadonly}
                style={{
                  background: '#fafafa',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '6px',
                }}
              >
                <div style={{ padding: '16px' }}>
                  <PictureOutlined style={{ fontSize: '28px', color: '#2E5778', marginBottom: '8px' }} />
                  <div>
                    <Text strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                      Click or drag to upload
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      PNG, JPG, SVG (Max 5MB)
                    </Text>
                  </div>
                </div>
              </Upload.Dragger>
            )}
          </div>
        );

      default:
        return (
          <Input
            value={getDisplayValue(setting.key, value)}
            onChange={(e) => handleLocalValueChange(setting.key, e.target.value)}
            disabled={setting.isReadonly}
          />
        );
    }
  };

  // Render settings group
  const renderSettingsGroup = (group: SettingsGroup) => (
    <Card
      key={group.id}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '4px',
            height: '20px',
            background: 'linear-gradient(135deg, #2E5778 0%, #4A7090 100%)',
            borderRadius: '2px'
          }} />
          <Text strong style={{ fontSize: '16px' }}>{group.name}</Text>
        </div>
      }
      style={{
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}
      styles={{
        header: {
          background: 'linear-gradient(to right, #fafafa 0%, #ffffff 100%)',
          borderBottom: '1px solid #f0f0f0',
          padding: '12px 20px'
        },
        body: { padding: '20px' }
      }}
    >
      {group.description && (
        <Alert
          message={group.description}
          type="info"
          showIcon
          style={{
            marginBottom: '16px',
            border: 'none',
            background: '#f6fbff'
          }}
        />
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {group.settings.map((setting) => (
          <div
            key={setting.key || setting.id}
            style={{
              padding: '16px',
              background: '#fafafa',
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
              transition: 'all 0.3s'
            }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={10}>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Text strong style={{ fontSize: '15px' }}>
                      {setting.name}
                    </Text>
                    {setting.isRequired && (
                      <Tag color="error" style={{ margin: 0 }}>Required</Tag>
                    )}
                    {setting.isSystem && (
                      <Tag color="warning" style={{ margin: 0 }}>System</Tag>
                    )}
                    {setting.isReadonly && (
                      <Tag color="default" style={{ margin: 0 }}>Read-only</Tag>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    {setting.description}
                  </Text>
                </div>
              </Col>
              
              <Col xs={24} lg={14}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    {renderSettingInput(setting)}
                  </div>
                  {setting.valueType !== 'file' && (
                    <Tooltip title="Reset to default value">
                      <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={() => handleResetSetting(setting.key)}
                        disabled={setting.isSystem || setting.isReadonly || setting.value === setting.defaultValue}
                        style={{
                          height: '40px',
                          opacity: setting.value === setting.defaultValue ? 0.5 : 1
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        ))}
      </div>
    </Card>
  );

  // Render settings category
  const renderSettingsCategory = (category: SettingsCategory) => (
    <div style={{ padding: '24px', background: '#ffffff' }}>
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #2E5778 0%, #4A7090 100%)',
            borderRadius: '8px',
            color: 'white'
          }}>
            {settingCategoryConfig[category.category as keyof typeof settingCategoryConfig]?.icon}
          </div>
          <div>
            <Title level={3} style={{ margin: 0, marginBottom: '2px' }}>
              {category.name}
            </Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {category.description}
            </Text>
          </div>
        </div>
      </div>

      {category.groups.map((group: any) => (
        <div key={group.id}>
          {renderSettingsGroup(group)}
        </div>
      ))}
    </div>
  );

  // System Health Status Component
  const renderSystemHealth = () => {
    if (!systemHealth) return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'healthy': return '#52c41a';
        case 'warning': return '#faad14';
        case 'error': return '#f5222d';
        default: return '#d9d9d9';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'healthy': return <CheckCircleOutlined />;
        case 'warning': return <ExclamationCircleOutlined />;
        case 'error': return <WarningOutlined />;
        default: return <InfoCircleOutlined />;
      }
    };

    return (
      <Card size="small" title="System Health" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          {Object.entries(systemHealth)
            .filter(([key]) => key !== 'details')
            .filter(([_, status]) => typeof status === 'string')
            .map(([key, status]) => (
            <Col span={6} key={key}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: getStatusColor(status as string),
                  marginBottom: '8px'
                }}>
                  {getStatusIcon(status as string)}
                </div>
                <Text style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                  {key}
                </Text>
                <br />
                <Text style={{ 
                  fontSize: '11px', 
                  color: getStatusColor(status as string),
                  fontWeight: 500
                }}>
                  {String(status)}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // Backups table columns
  const backupColumns: ColumnsType<SettingsBackup> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong style={{ display: 'block', fontSize: '14px' }}>
            {name}
          </Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Settings',
      key: 'settings',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Badge count={record.settings.length} style={{ backgroundColor: '#2E5778' }} />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt) => (
        <div>
          <Text style={{ fontSize: '12px', display: 'block' }}>
            {format(new Date(createdAt), 'MMM dd, yyyy')}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {format(new Date(createdAt), 'HH:mm')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Restore">
            <Button
              type="text"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Restore Settings',
                  content: 'Are you sure you want to restore settings from this backup? This will overwrite current settings.',
                  onOk: () => restoreFromBackup.mutateAsync({ backupId: record.id }),
                });
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete backup?"
            onConfirm={() => deleteBackup.mutateAsync(record.id)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading settings...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              System Settings
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Configure your application settings and preferences
            </Text>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                icon={<HistoryOutlined />}
                onClick={() => setIsHistoryDrawerVisible(true)}
              >
                History
              </Button>
              <Button
                icon={<CloudUploadOutlined />}
                onClick={() => setIsBackupModalVisible(true)}
              >
                Backup
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('json')}
                loading={isExporting}
              >
                Export
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleClearCache}
                loading={isClearingCache}
              >
                Clear Cache
              </Button>
              <Button
                type={maintenanceStatus?.enabled ? 'default' : 'primary'}
                danger={maintenanceStatus?.enabled}
                icon={<ToolOutlined />}
                onClick={handleToggleMaintenanceMode}
                loading={isTogglingMaintenance}
              >
                {maintenanceStatus?.enabled ? 'Disable' : 'Enable'} Maintenance
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Status Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#2E5778', marginBottom: '8px' }}>
                <SettingOutlined />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                {dashboard?.totalSettings || 0}
              </div>
              <Text type="secondary">Total Settings</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }}>
                <EditOutlined />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                {dashboard?.customizedSettings || 0}
              </div>
              <Text type="secondary">Customized</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }}>
                <CloudUploadOutlined />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                {dashboard?.backupStatus?.lastBackup ? 
                  format(new Date(dashboard.backupStatus.lastBackup), 'MMM dd, HH:mm') : 
                  'Never'
                }
              </div>
              <Text type="secondary">Last Backup</Text>
            </Card>
          </Col>
        </Row>

        {/* Maintenance Mode Alert */}
        {maintenanceStatus?.enabled && (
          <Alert
            message="Maintenance Mode Active"
            description={`System is in maintenance mode: ${maintenanceStatus.message}`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* System Health */}
        {renderSystemHealth()}
      </div>

      {/* Main Settings Content */}
      <Card 
        style={{ 
          borderRadius: '16px', 
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: 'none',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          tabBarStyle={{
            margin: 0,
            padding: '16px 24px 0',
            background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
          }}
          items={settings?.map((category) => ({
            key: category.category,
            label: (
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                padding: '8px 16px',
                fontSize: '15px',
                fontWeight: 500
              }}>
                <span style={{ fontSize: '20px' }}>
                  {settingCategoryConfig[category.category as keyof typeof settingCategoryConfig]?.icon}
                </span>
                {settingCategoryConfig[category.category as keyof typeof settingCategoryConfig]?.name}
              </span>
            ),
            children: renderSettingsCategory(category),
          }))}
        />
      </Card>

      {/* History Drawer */}
      <Drawer
        title="Settings History"
        placement="right"
        width={600}
        open={isHistoryDrawerVisible}
        onClose={() => setIsHistoryDrawerVisible(false)}
      >
        {history?.history && history.history.length > 0 ? (
          <div>
            {history.history.map((item) => (
              <Card key={item.id} size="small" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: 'block', fontSize: '14px' }}>
                      {item.settingName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {format(new Date(item.changedAt), 'MMM dd, yyyy HH:mm')} by {item.changedBy}
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <Text style={{ fontSize: '11px' }}>
                        From: <Tag>{String(item.oldValue)}</Tag> To: <Tag color="blue">{String(item.newValue)}</Tag>
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="No settings history found" />
        )}
      </Drawer>

      {/* Backup Modal */}
      <Modal
        title="Settings Backup"
        open={isBackupModalVisible}
        onCancel={() => setIsBackupModalVisible(false)}
        footer={null}
        width={800}
      >
        <Tabs
          defaultActiveKey="create"
          items={[
            {
              key: 'create',
              label: 'Create Backup',
              children: (
                <Form
                  form={backupForm}
                  layout="vertical"
                  onFinish={handleCreateBackup}
                  style={{ marginBottom: '24px' }}
                >
                  <Form.Item
                    name="name"
                    label="Backup Name"
                    rules={[{ required: true, message: 'Please enter backup name' }]}
                  >
                    <Input placeholder="Enter backup name" />
                  </Form.Item>
                  <Form.Item name="description" label="Description">
                    <TextArea rows={3} placeholder="Optional description" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isCreatingBackup}>
                      Create Backup
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'existing',
              label: 'Existing Backups',
              children: (
                <Table
                  columns={backupColumns}
                  dataSource={backups?.backups || []}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default Settings;
