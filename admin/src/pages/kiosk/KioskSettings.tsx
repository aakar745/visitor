import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Switch,
  Input,
  InputNumber,
  Button,
  message,
  Space,
  Typography,
  Alert,
  ColorPicker,
  Spin,
  Tag,
  Tabs,
  Row,
  Col,
  Tooltip,
  Badge,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PrinterOutlined,
  UsbOutlined,
  GlobalOutlined,
  CameraOutlined,
  ExperimentOutlined,
  LinkOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { kioskService, type KioskSettings as KioskSettingsType } from '../../services/kioskService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const KioskSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<KioskSettingsType | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await kioskService.getSettings();
      setSettings(data);
      form.setFieldsValue({
        ...data,
        themeColor: data.themeColor,
      });
    } catch (error: any) {
      console.error('Failed to load kiosk settings:', error);
      message.error(error.response?.data?.message || 'Failed to load kiosk settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // Convert Color object to hex string if necessary
      const dto = {
        ...values,
        themeColor: typeof values.themeColor === 'string' 
          ? values.themeColor 
          : values.themeColor?.toHexString?.() || '#1890ff',
        kioskPin: values.kioskPin?.trim() || undefined, // Empty string becomes undefined
      };
      
      const updated = await kioskService.updateSettings(dto);
      setSettings(updated);
      message.success('Kiosk settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save kiosk settings:', error);
      message.error(error.response?.data?.message || 'Failed to save kiosk settings');
    } finally {
      setSaving(false);
    }
  };

  // Get frontend URL from environment variable (different port in dev, same domain in production)
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const checkinUrl = `${frontendUrl}/kiosk/checkin`;
  const autoPrintUrl = `${frontendUrl}/kiosk/auto-print`;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading kiosk settings...</p>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'global',
      label: (
        <span>
          <GlobalOutlined /> Global Settings
        </span>
      ),
      children: (
        <div>
          <Alert
            message="System-wide Configuration"
            description="These settings apply to all kiosk modes (check-in and auto-print)."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Card
            title={
              <Space>
                <CheckCircleOutlined />
                System Control
              </Space>
            }
            extra={
              settings && (
                <Badge
                  status={settings.kioskEnabled ? 'success' : 'error'}
                  text={
                    <Tag color={settings.kioskEnabled ? 'green' : 'red'}>
                      {settings.kioskEnabled ? 'System Enabled' : 'System Disabled'}
                    </Tag>
                  }
                />
              )
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Enable Kiosk System</Text>
                      <Tooltip title="Master switch for all kiosk functionality">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="kioskEnabled"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Turn this off to temporarily disable all public kiosk pages
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>PIN Protection</Text>
                      <Tooltip title="Require PIN to access kiosk pages">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="kioskPin"
                  rules={[
                    {
                      pattern: /^$|^[0-9]{4,6}$/,
                      message: 'PIN must be 4-6 digits or empty',
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="Leave empty for no PIN, or enter 4-6 digits"
                    maxLength={6}
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Optional: Require PIN on kiosk startup for added security
                </Text>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <SettingOutlined />
                Appearance
              </Space>
            }
          >
            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Theme Color</Text>
                      <Tooltip title="Primary brand color for all kiosk pages">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="themeColor"
                >
                  <ColorPicker
                    showText
                    format="hex"
                    presets={[
                      {
                        label: 'Recommended',
                        colors: [
                          '#1890ff',
                          '#52c41a',
                          '#fa8c16',
                          '#eb2f96',
                          '#722ed1',
                        ],
                      },
                    ]}
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This color will be used across all kiosk interfaces
                </Text>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'checkin',
      label: (
        <span>
          <CameraOutlined /> Check-in Kiosk
        </span>
      ),
      children: (
        <div>
          <Alert
            message={
              <Space>
                <LinkOutlined />
                <Text strong>Check-in Kiosk URL</Text>
              </Space>
            }
            description={
              <div>
                <Text>Deploy this page for camera-based QR scanning and visitor check-in:</Text>
                <br />
                <Text strong copyable code style={{ fontSize: '14px', marginTop: 8, display: 'inline-block' }}>
                  {checkinUrl}
                </Text>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Card
            title={
              <Space>
                <QrcodeOutlined />
                Welcome & Display
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Form.Item
                  label={<Text strong>Welcome Message</Text>}
                  name="welcomeMessage"
                >
                  <TextArea
                    rows={2}
                    placeholder="Welcome! Please scan your QR code to check in."
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This message appears at the top of the check-in kiosk page
                </Text>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <CheckCircleOutlined />
                Check-in Behavior
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Auto Check-in</Text>
                      <Tooltip title="Skip confirmation modal for faster check-ins">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="autoCheckIn"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Check in immediately after QR scan (no confirmation dialog)
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Enable Success Sound</Text>
                      <Tooltip title="Audio feedback on successful check-in">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="enableSound"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Play a sound when check-in is successful
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>USB Barcode Scanner</Text>
                      <Tooltip title="Support hardware barcode/QR scanners">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="enableBarcodeScanner"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Enable USB scanner support for manual entry field
                </Text>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                Recent Check-ins Display
              </Space>
            }
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Show Recent Check-ins</Text>
                      <Tooltip title="Display live feed of recent check-ins">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="showRecentCheckIns"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Show a list of recent check-ins on the kiosk page
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={<Text strong>Display Limit</Text>}
                  name="recentCheckInsLimit"
                >
                  <InputNumber
                    min={5}
                    max={100}
                    style={{ width: '100%' }}
                    addonAfter="visitors"
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Number of recent check-ins to display (5-100)
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={<Text strong>Auto-refresh Interval</Text>}
                  name="autoRefreshInterval"
                >
                  <InputNumber
                    min={5}
                    max={60}
                    addonAfter="seconds"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  How often to refresh the recent check-ins list
                </Text>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'autoprint',
      label: (
        <span>
          <PrinterOutlined /> Auto-Print Kiosk
        </span>
      ),
      children: (
        <div>
          <Alert
            message={
              <Space>
                <LinkOutlined />
                <Text strong>Auto-Print Kiosk URL</Text>
              </Space>
            }
            description={
              <div>
                <Text>Deploy this page for automatic badge printing at check-in kiosks:</Text>
                <br />
                <Text strong copyable code style={{ fontSize: '14px', marginTop: 8, display: 'inline-block' }}>
                  {autoPrintUrl}
                </Text>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Card
            title={
              <Space>
                <PrinterOutlined />
                Printer Configuration
              </Space>
            }
            extra={
              settings?.autoPrintEnabled && (
                <Badge status="success" text={<Tag color="green">Auto-Print Enabled</Tag>} />
              )
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Enable Auto-Print</Text>
                      <Tooltip title="Master switch for automatic badge printing">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="autoPrintEnabled"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Enable automatic label printing feature at kiosks
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={<Text strong>Printer Model</Text>}
                  name="printerType"
                >
                  <Input placeholder="Brother QL-800" prefix={<PrinterOutlined />} />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Thermal label printer model
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={<Text strong>Connection Type</Text>}
                  name="printerConnectionType"
                >
                  <Input value="USB" disabled prefix={<UsbOutlined />} />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Network and Bluetooth support coming soon
                </Text>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Print Service URL</Text>
                      <Tooltip title="Local print service endpoint running on kiosk PC">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="printerServiceUrl"
                >
                  <Input placeholder="http://localhost:9100" prefix={<LinkOutlined />} />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Local print service running on kiosk PC (default: http://localhost:9100)
                </Text>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <SettingOutlined />
                Label Configuration
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Form.Item label={<Text strong>Label Width</Text>} name="labelWidth">
                  <InputNumber
                    min={20}
                    max={100}
                    addonAfter="mm"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Standard: 62mm for Brother QL-800
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item label={<Text strong>Label Height</Text>} name="labelHeight">
                  <InputNumber
                    min={50}
                    max={300}
                    addonAfter="mm"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Standard: 100mm for Brother QL-800
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Show Location</Text>
                      <Tooltip title="Display visitor's city/state on label">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="showLocationOnLabel"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Include city/state on the badge
                </Text>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Show Registration Number</Text>
                      <Tooltip title="Display registration number on label">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="showRegNumberOnLabel"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Include registration number on the badge
                </Text>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={<Text strong>Auto-Print Welcome Message</Text>}
                  name="autoPrintWelcomeMessage"
                >
                  <TextArea
                    rows={2}
                    placeholder="Please scan your QR code to print your badge"
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Message shown on the auto-print kiosk page
                </Text>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <ExperimentOutlined />
                Printing Behavior
              </Space>
            }
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Test Mode</Text>
                      <Tooltip title="Simulate printing without real printer">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="printTestMode"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Simulate printing without actually sending to printer
                </Text>
                {settings?.printTestMode && (
                  <Alert
                    message="Test mode active"
                    description="No actual labels will be printed"
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Allow Repeated Printing</Text>
                      <Tooltip title="Let visitors print multiple times">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="allowRepeatPrinting"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Allow visitors to print their badge multiple times
                </Text>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SettingOutlined /> Kiosk Settings
        </Title>
        <Paragraph type="secondary">
          Configure the public kiosk check-in system for tablets, kiosks, and self-service stations.
        </Paragraph>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Tabs
          defaultActiveKey="global"
          items={tabItems}
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        />

        <Card style={{ marginTop: 24, background: '#fafafa' }}>
          <Space size="large">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={saving}
              size="large"
            >
              Save All Settings
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadSettings}
              disabled={loading || saving}
              size="large"
            >
              Reset Changes
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
};

export default KioskSettings;

