import React, { useState } from 'react';
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
  message,
  Spin,
  Empty,
  Drawer,
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

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

// Setting category configurations
const settingCategoryConfig = {
  general: {
    name: 'General',
    icon: <SettingOutlined />,
    color: '#1890ff',
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
    isCreatingBackup,
    isExporting,
    isClearingCache,
    isTogglingMaintenance,
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


  const handleResetSetting = async (key: string) => {
    try {
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

  // Render setting input based on type
  const renderSettingInput = (setting: Setting) => {
    const { valueType, value, options, validation } = setting;

    switch (valueType) {
      case 'boolean':
        return (
          <Switch
            checked={value}
            onChange={(checked) => handleSettingUpdate(setting.key, checked)}
            disabled={setting.isReadonly}
          />
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
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onChange={(val) => handleSettingUpdate(setting.key, val)}
            disabled={setting.isReadonly}
            style={{ width: '100%' }}
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
          <ColorPicker
            value={value}
            onChange={(color) => handleSettingUpdate(setting.key, color.toHexString())}
            disabled={setting.isReadonly}
            showText
          />
        );

      case 'password':
        return (
          <Input.Password
            value={value}
            onChange={(e) => handleSettingUpdate(setting.key, e.target.value)}
            disabled={setting.isReadonly}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleSettingUpdate(setting.key, e.target.value)}
            disabled={setting.isReadonly}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleSettingUpdate(setting.key, e.target.value)}
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

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleSettingUpdate(setting.key, e.target.value)}
            disabled={setting.isReadonly}
          />
        );
    }
  };

  // Render settings group
  const renderSettingsGroup = (group: SettingsGroup) => (
    <Card
      key={group.id}
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{group.name}</span>
          <Badge count={group.settings.length} style={{ backgroundColor: '#f0f0f0', color: '#666' }} />
        </div>
      }
      style={{ marginBottom: '16px' }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: '16px', fontSize: '13px' }}>
        {group.description}
      </Text>
      
      <Row gutter={[16, 16]}>
        {group.settings.map((setting) => (
          <Col span={24} key={setting.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Text strong style={{ fontSize: '14px' }}>
                    {setting.name}
                  </Text>
                  {setting.isRequired && (
                    <Tag color="red">Required</Tag>
                  )}
                  {setting.isSystem && (
                    <Tag color="orange">System</Tag>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                  {setting.description}
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
                <div style={{ flex: 1 }}>
                  {renderSettingInput(setting)}
                </div>
                <Tooltip title="Reset to default">
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => handleResetSetting(setting.key)}
                    disabled={setting.isSystem || setting.value === setting.defaultValue}
                  />
                </Tooltip>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );

  // Render settings category
  const renderSettingsCategory = (category: SettingsCategory) => (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          {settingCategoryConfig[category.category as keyof typeof settingCategoryConfig]?.icon}
          {category.name}
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          {category.description}
        </Text>
      </div>

      {category.groups.map(renderSettingsGroup)}
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
        <Badge count={record.settings.length} style={{ backgroundColor: '#1890ff' }} />
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
              <div style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }}>
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
      <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
        >
          {settings?.map((category) => (
            <TabPane
              key={category.category}
              tab={
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {settingCategoryConfig[category.category as keyof typeof settingCategoryConfig]?.icon}
                  {settingCategoryConfig[category.category as keyof typeof settingCategoryConfig]?.name}
                </span>
              }
            >
              {renderSettingsCategory(category)}
            </TabPane>
          ))}
        </Tabs>
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
        <Tabs defaultActiveKey="create">
          <TabPane tab="Create Backup" key="create">
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
          </TabPane>
          
          <TabPane tab="Existing Backups" key="existing">
            <Table
              columns={backupColumns}
              dataSource={backups?.backups || []}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default Settings;
