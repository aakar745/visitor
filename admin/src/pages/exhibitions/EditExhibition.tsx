import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  DatePicker,
  Switch,
  Button,
  Steps,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Select,
  Spin,
} from 'antd';
import { useMessage } from '../../hooks/useMessage';
import { useFormCleanup } from '../../hooks/useFormCleanup';
import {
  SaveOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  SettingOutlined,
  DollarOutlined,
  FormOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { toBackendDate, fromBackendDate } from '../../utils/dayjs';
import FileUpload from '../../components/exhibitions/FileUpload';
import PricingTierForm from '../../components/exhibitions/PricingTierForm';
import InterestOptionForm from '../../components/exhibitions/InterestOptionForm';
import FormBuilder from '../../components/exhibitions/FormBuilder';
import type { ExhibitionRequest, CustomField, PricingTier, InterestOption } from '../../types/exhibitions';
import { exhibitionService } from '../../services/exhibitions/exhibitionService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EditExhibition: React.FC = () => {
  const navigate = useNavigate();
  const message = useMessage();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  
  // SECURITY FIX (BUG-019): Cleanup form on unmount
  useFormCleanup(form);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  // Prevent auto-submission when reaching last step
  React.useEffect(() => {
    if (currentStep === steps.length - 1) {
      setCanSubmit(false);
      const timer = setTimeout(() => {
        setCanSubmit(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // On non-last steps, allow immediate submission
      setCanSubmit(true);
    }
    return undefined;
  }, [currentStep]);

  // Form state
  const [exhibitionLogo, setExhibitionLogo] = useState<string | null>(null);
  const [badgeLogo, setBadgeLogo] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [pricingTiers, setPricingTiers] = useState<Omit<PricingTier, 'id' | 'currentCount'>[]>([]);
  const [customFields, setCustomFields] = useState<Omit<CustomField, 'id'>[]>([]);
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([]);
  const [slug, setSlug] = useState<string>('');

  const steps = [
    {
      title: 'Basic Information',
      icon: <FormOutlined />,
      description: 'Exhibition details and venue'
    },
    {
      title: 'Dates & Timeline',
      icon: <CalendarOutlined />,
      description: 'Registration and event dates'
    },
    {
      title: 'Branding & Media',
      icon: <SettingOutlined />,
      description: 'Logos, banners and visual identity'
    },
    {
      title: 'Interest Categories',
      icon: <CheckCircleOutlined />,
      description: 'Define what visitors are looking for'
    },
    {
      title: 'Registration Form',
      icon: <FormOutlined />,
      description: 'Customize visitor registration fields'
    },
    {
      title: 'Pricing & Registration',
      icon: <DollarOutlined />,
      description: 'Pricing tiers and registration settings'
    }
  ];

  // Load exhibition data
  useEffect(() => {
    if (id) {
      loadExhibitionData();
    }
  }, [id]);

  const loadExhibitionData = async () => {
    try {
      setLoadingData(true);
      const data = await exhibitionService.getExhibition(id!);

      // Pre-fill form
      form.setFieldsValue({
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        venue: data.venue,
        registrationStartDate: fromBackendDate(data.registrationStartDate),
        registrationEndDate: fromBackendDate(data.registrationEndDate),
        onsiteStartDate: fromBackendDate(data.onsiteStartDate),
        onsiteEndDate: fromBackendDate(data.onsiteEndDate),
        isPaid: data.isPaid,
        paidStartDate: data.paidStartDate ? fromBackendDate(data.paidStartDate) : undefined,
        paidEndDate: data.paidEndDate ? fromBackendDate(data.paidEndDate) : undefined,
        allowedCategories: data.allowedCategories,
      });

      // Set state
      setSlug(data.slug || '');
      setExhibitionLogo(data.exhibitionLogo || null);
      setBadgeLogo(data.badgeLogo || null);
      setBannerImage(data.bannerImage || null);
      setPricingTiers(data.pricingTiers || []);
      setCustomFields(data.customFields || []);
      setInterestOptions(data.interestOptions || []);

    } catch (error) {
      message.error('Failed to load exhibition data');
      navigate('/exhibitions');
    } finally {
      setLoadingData(false);
    }
  };

  // Note: Slug is NOT auto-generated in edit mode to preserve existing URLs
  // The slug remains unchanged unless manually updated by an admin

  const onFinish = async (values: any) => {
    // Prevent auto-submission (when canSubmit is false)
    // But allow manual submission from any step
    if (!canSubmit) {
      return;
    }
    
    try {
      setLoading(true);
      
      const exhibitionData: Partial<ExhibitionRequest> = {
        name: values.name,
        tagline: values.tagline,
        description: values.description,
        venue: values.venue,
        registrationStartDate: toBackendDate(values.registrationStartDate, false) || undefined, // Start of day
        registrationEndDate: toBackendDate(values.registrationEndDate, true) || undefined, // End of day (23:59)
        onsiteStartDate: toBackendDate(values.onsiteStartDate, false) || undefined, // Start of day
        onsiteEndDate: toBackendDate(values.onsiteEndDate, true) || undefined, // End of day (23:59)
        isPaid: values.isPaid || false,
        paidStartDate: values.isPaid && values.paidStartDate ? toBackendDate(values.paidStartDate, false) || undefined : undefined,
        paidEndDate: values.isPaid && values.paidEndDate ? toBackendDate(values.paidEndDate, true) || undefined : undefined, // End of day
        pricingTiers: values.isPaid ? pricingTiers : [],
        allowedCategories: values.allowedCategories || ['general'],
        customFields,
        interestOptions: interestOptions.map(({ id, ...option }) => option), // Remove id for request
        exhibitionLogo: exhibitionLogo || undefined,
        badgeLogo: badgeLogo || undefined,
        bannerImage: bannerImage || undefined,
      };

      await exhibitionService.updateExhibition(id!, exhibitionData);
      message.success('Exhibition updated successfully!');
      navigate('/exhibitions');
      
    } catch (error: any) {
      console.error('Exhibition update error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update exhibition';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const fieldsToValidate: Record<number, string[]> = {
      0: ['name', 'tagline', 'description', 'venue'],
      1: ['registrationStartDate', 'registrationEndDate', 'onsiteStartDate', 'onsiteEndDate'],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    const currentFields = fieldsToValidate[currentStep] || [];
    
    if (currentFields.length === 0) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
      return;
    }

    form.validateFields(currentFields).then(() => {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    }).catch(() => {
      message.error('Please fill in all required fields for this step');
    });
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const renderStepContent = (step?: number) => {
    const stepToRender = step !== undefined ? step : currentStep;
    
    switch (stepToRender) {
      case 0:
        return (
          <Row gutter={[24, 16]}>
            <Col xs={24}>
              <Title level={4}>Exhibition Details</Title>
              <Text type="secondary">Provide the basic information about your exhibition</Text>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Exhibition Name"
                rules={[
                  { required: true, message: 'Exhibition name is required' },
                  { min: 3, message: 'Name must be at least 3 characters' }
                ]}
              >
                <Input 
                  placeholder="e.g., Tech Expo 2024" 
                  size="middle"
                />
              </Form.Item>
              {slug && (
                <div style={{ marginTop: '-12px', marginBottom: '12px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    URL Slug: <Text code style={{ fontSize: '12px' }}>{slug}</Text>
                  </Text>
                </div>
              )}
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="tagline"
                label="Tagline"
                rules={[
                  { required: true, message: 'Tagline is required' },
                  { min: 3, message: 'Tagline must be at least 3 characters' },
                  { max: 100, message: 'Tagline must be less than 100 characters' }
                ]}
              >
                <Input placeholder="e.g., Innovation Awaits You" size="middle" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="venue"
                label="Venue"
                rules={[
                  { required: true, message: 'Venue is required' },
                  { min: 3, message: 'Venue must be at least 3 characters' },
                  { max: 500, message: 'Venue must be less than 500 characters' }
                ]}
              >
                <Input placeholder="e.g., Bangalore International Exhibition Centre" size="middle" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { max: 5000, message: 'Description must be less than 5000 characters' }
                ]}
              >
                <TextArea
                  placeholder="Detailed description of the exhibition..."
                  rows={4}
                  maxLength={5000}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        );

      case 1:
        return (
          <Row gutter={[24, 16]}>
            <Col xs={24}>
              <Title level={4}>Exhibition Timeline</Title>
              <Text type="secondary">Set up registration and event dates</Text>
            </Col>

            {/* Registration Period */}
            <Col xs={24}>
              <Divider orientation="left" style={{ margin: '24px 0 16px 0' }}>
                <Text strong>📝 Registration Period</Text>
              </Divider>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="registrationStartDate"
                label="Registration Opens"
                rules={[{ required: true, message: 'Registration start date is required' }]}
              >
                <DatePicker
                  placeholder="When registration opens"
                  style={{ width: '100%' }}
                  size="middle"
                  showTime
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="registrationEndDate"
                label={
                  <Space>
                    Registration Closes
                    <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                      (can be until last day of exhibition)
                    </Text>
                  </Space>
                }
                rules={[
                  { required: true, message: 'Registration end date is required' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || !getFieldValue('registrationStartDate')) {
                        return Promise.resolve();
                      }
                      // Must be after registration start
                      if (value.isBefore(getFieldValue('registrationStartDate'))) {
                        return Promise.reject(new Error('End date must be after start date'));
                      }
                      
                      // FIX: Registration can continue until exhibition ends
                      const onsiteEnd = getFieldValue('onsiteEndDate');
                      if (onsiteEnd && value.isAfter(onsiteEnd.endOf('day'))) {
                        return Promise.reject(new Error('Registration must close by the last day of the exhibition'));
                      }
                      
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  placeholder="When registration closes"
                  style={{ width: '100%' }}
                  size="middle"
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  onChange={(date) => {
                    // Auto-fill Exhibition Ends date when Registration Closes is selected
                    if (date) {
                      form.setFieldValue('onsiteEndDate', date);
                    }
                  }}
                  disabledDate={(current) => {
                    if (!current) return false;
                    
                    // Disable dates before registration start date
                    const regStartDate = form.getFieldValue('registrationStartDate');
                    if (regStartDate && current.isBefore(regStartDate.startOf('day'))) {
                      return true;
                    }
                    
                    // FIX: Disable dates AFTER exhibition end date (can register until last day)
                    const onsiteEnd = form.getFieldValue('onsiteEndDate');
                    if (onsiteEnd && current.isAfter(onsiteEnd.endOf('day'))) {
                      return true;
                    }
                    
                    return false;
                  }}
                />
              </Form.Item>
            </Col>

            {/* Exhibition Period */}
            <Col xs={24}>
              <Divider orientation="left" style={{ margin: '24px 0 16px 0' }}>
                <Text strong>🎪 Exhibition Period</Text>
              </Divider>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="onsiteStartDate"
                label="Exhibition Starts"
                rules={[{ required: true, message: 'Exhibition start date is required' }]}
              >
                <DatePicker
                  placeholder="When exhibition starts"
                  style={{ width: '100%' }}
                  size="middle"
                  showTime
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="onsiteEndDate"
                label="Exhibition Ends"
                rules={[{ required: true, message: 'Exhibition end date is required' }]}
              >
                <DatePicker
                  placeholder="When exhibition ends"
                  style={{ width: '100%' }}
                  size="middle"
                  showTime
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>
        );

      case 2:
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Title level={4}>Branding & Media Assets</Title>
              <Text type="secondary">Upload logos and banners for your exhibition</Text>
            </Col>

            <Col xs={24} md={8}>
              <FileUpload
                label="Exhibition Logo"
                type="logo"
                accept=".jpg,.jpeg,.png,.svg"
                maxSize={10}
                value={exhibitionLogo || undefined}
                onChange={setExhibitionLogo}
                placeholder="Upload exhibition logo"
              />
            </Col>

            <Col xs={24} md={8}>
              <FileUpload
                label="Badge Logo"
                type="badge-logo"
                accept=".jpg,.jpeg,.png,.svg"
                maxSize={10}
                value={badgeLogo || undefined}
                onChange={setBadgeLogo}
                placeholder="Upload badge logo"
              />
            </Col>

            <Col xs={24} md={8}>
              <FileUpload
                label="Banner Image"
                type="banner"
                accept=".jpg,.jpeg,.png"
                maxSize={10}
                value={bannerImage || undefined}
                onChange={setBannerImage}
                placeholder="Upload banner image"
              />
            </Col>
          </Row>
        );

      case 3:
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Title level={4}>Visitor Interests</Title>
              <Text type="secondary">Define what visitors are looking for at your exhibition</Text>
            </Col>
            
            <Col xs={24}>
              <InterestOptionForm
                value={interestOptions}
                onChange={setInterestOptions}
              />
            </Col>
          </Row>
        );

      case 4:
        return (
          <Row gutter={[24, 24]} style={{ overflow: 'visible' }}>
            <Col xs={24}>
              <Title level={4}>Visitor Registration Form</Title>
              <Text type="secondary">
                Customize the information you want to collect from visitors during registration
              </Text>
            </Col>
            
            <Col xs={24} style={{ overflow: 'visible' }}>
              <FormBuilder
                value={customFields}
                onChange={setCustomFields}
              />
            </Col>
          </Row>
        );

      case 5:
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Title level={4}>Registration & Pricing Configuration</Title>
              <Text type="secondary">Set up registration categories, pricing, and visitor limits</Text>
            </Col>

            <Col xs={24}>
              <Card>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="isPaid"
                      valuePropName="checked"
                      style={{ marginBottom: '8px' }}
                    >
                      <Switch />
                    </Form.Item>
                    <Text strong>Paid Exhibition</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Enable paid registration with pricing tiers
                    </Text>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item name="allowedCategories" label="Registration Categories">
                      <Select
                        mode="multiple"
                        placeholder="Select categories"
                        size="middle"
                      >
                        <Option value="general">General</Option>
                        <Option value="vip">VIP</Option>
                        <Option value="media">Media</Option>
                        <Option value="exhibitor">Exhibitor</Option>
                        <Option value="speaker">Speaker</Option>
                        <Option value="guest">Guest</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24}>
              <Form.Item shouldUpdate>
                {({ getFieldValue }) => {
                  const isPaid = getFieldValue('isPaid');
                  const registrationStartDate = getFieldValue('registrationStartDate');
                  const registrationEndDate = getFieldValue('registrationEndDate');
                  const onsiteStartDate = getFieldValue('onsiteStartDate');
                  const onsiteEndDate = getFieldValue('onsiteEndDate');
                  
                  return isPaid ? (
                    <PricingTierForm
                      value={pricingTiers}
                      onChange={setPricingTiers}
                      registrationStartDate={registrationStartDate}
                      registrationEndDate={registrationEndDate}
                      exhibitionStartDate={onsiteStartDate}
                      exhibitionEndDate={onsiteEndDate}
                    />
                  ) : (
                    <Card style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f9f9f9' }}>
                      <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                      <Title level={4} style={{ marginBottom: '8px' }}>Free Exhibition</Title>
                      <Text type="secondary">
                        This exhibition will be free for all visitors. Enable "Paid Exhibition" above to add pricing tiers.
                      </Text>
                    </Card>
                  );
                }}
              </Form.Item>
            </Col>
          </Row>
        );

      default:
        return null;
    }
  };

  if (loadingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Loading exhibition data..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/exhibitions')}
            size="middle"
            style={{ marginBottom: '8px' }}
          >
            Back to Exhibitions
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Edit Exhibition
          </Title>
          <Text type="secondary">
            Update exhibition details, pricing, and visitor management settings
          </Text>
        </div>
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => setPreviewMode(!previewMode)}
            disabled={previewMode}
            size="middle"
          >
            Preview
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={() => {
              setCanSubmit(true);
              form.submit();
            }}
            loading={loading}
            size="middle"
          >
            Save Changes
          </Button>
        </Space>
      </div>

      {/* Progress Steps */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps 
          current={currentStep} 
          items={steps}
          type="navigation"
          size="small"
          onChange={(step) => setCurrentStep(step)}
          style={{ cursor: 'pointer' }}
        />
      </Card>

      {/* Main Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="middle"
        preserve={true}
        className="create-exhibition-form"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const targetElement = e.target as HTMLElement;
            const isTextarea = targetElement.tagName === 'TEXTAREA';
            const isLastStep = currentStep === steps.length - 1;
            
            if (!isLastStep && !isTextarea) {
              e.preventDefault();
            }
          }
        }}
      >
        {/* Render ALL steps but only show the current one */}
        <Card style={{ overflow: 'visible' }}>
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            {renderStepContent(0)}
          </div>
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            {renderStepContent(1)}
          </div>
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            {renderStepContent(2)}
          </div>
          <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
            {renderStepContent(3)}
          </div>
          <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
            {renderStepContent(4)}
          </div>
          <div style={{ display: currentStep === 5 ? 'block' : 'none' }}>
            {renderStepContent(5)}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <Card 
          className="create-exhibition-navigation"
          style={{ marginTop: '24px', textAlign: 'center' }}
        >
          <Space size="large">
            {currentStep > 0 && (
              <Button size="middle" onClick={prevStep}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" size="middle" onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button 
                type="primary" 
                size="middle" 
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                disabled={!canSubmit}
                onClick={() => setCanSubmit(true)}
              >
                Save Changes
              </Button>
            )}
          </Space>
        </Card>
      </Form>
    </div>
  );
};

export default EditExhibition;

