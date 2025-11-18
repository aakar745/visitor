import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Alert,
  Tag,
  message,
  Spin,
  Modal
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useVisitorLookup } from '../../services/globalVisitorService';
import type { 
  GlobalVisitorProfile,
  RegistrationFormData 
} from '../../types';
import type {
  Exhibition, 
  InterestOption, 
  CustomField, 
  PricingTier
} from '../../types/exhibitions';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface VisitorRegistrationFormProps {
  exhibition: Exhibition;
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  loading?: boolean;
}

interface PreviousRegistration {
  exhibitionId: string;
  exhibitionName: string;
  registrationDate: string;
}

const VisitorRegistrationForm: React.FC<VisitorRegistrationFormProps> = ({
  exhibition,
  onSubmit,
  loading = false
}) => {
  const [form] = Form.useForm();
  const { lookupAndPrefillForm } = useVisitorLookup();
  
  // State management
  const [emailLookupLoading, setEmailLookupLoading] = useState(false);
  const [existingVisitor, setExistingVisitor] = useState<GlobalVisitorProfile | null>(null);
  const [previousRegistrations, setPreviousRegistrations] = useState<PreviousRegistration[]>([]);
  const [showPreviousRegistrations, setShowPreviousRegistrations] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPricingTier, setSelectedPricingTier] = useState<PricingTier | null>(null);
  
  // Debounced email for lookup
  const [email, setEmail] = useState('');
  const watchedEmail = Form.useWatch('email', form);
  
  // Custom debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setEmail(watchedEmail || '');
    }, 800);
    
    return () => clearTimeout(timer);
  }, [watchedEmail]);

  // Email lookup effect
  useEffect(() => {
    const performEmailLookup = async () => {
      if (!email || !email.includes('@')) {
        setExistingVisitor(null);
        setPreviousRegistrations([]);
        return;
      }

      setEmailLookupLoading(true);
      try {
        const result = await lookupAndPrefillForm(email, form);
        
        if (result) {
          setExistingVisitor(result.visitor);
          setPreviousRegistrations(result.previousRegistrations);
          
          // Show success message for returning visitor
          message.success(`Welcome back, ${result.visitor.name}! Your details have been prefilled.`);
        } else {
          setExistingVisitor(null);
          setPreviousRegistrations([]);
        }
      } catch (error) {
        console.error('Email lookup error:', error);
      } finally {
        setEmailLookupLoading(false);
      }
    };

    performEmailLookup();
  }, [email, form, lookupAndPrefillForm]);

  // Calculate pricing based on selected tier
  useEffect(() => {
    const pricingTierId = Form.useWatch('pricingTierId', form);
    if (pricingTierId) {
      const tier = exhibition.pricingTiers.find((t: PricingTier) => t.id === pricingTierId);
      setSelectedPricingTier(tier || null);
    } else {
      setSelectedPricingTier(null);
    }
  }, [Form.useWatch('pricingTierId', form), exhibition.pricingTiers]);

  const handleSubmit = async (values: any) => {
    try {
      const registrationData: RegistrationFormData = {
        // Visitor profile data
        email: values.email,
        name: values.name,
        phone: values.phone,
        company: values.company,
        designation: values.designation,
        state: values.state,
        city: values.city,
        pincode: values.pincode,
        address: values.address,
        
        // Exhibition-specific data
        selectedInterests,
        registrationCategory: values.registrationCategory,
        pricingTierId: values.pricingTierId,
        customFieldData: values.customFields || {}
      };
      
      await onSubmit(registrationData);
    } catch (error) {
      console.error('Registration submission error:', error);
    }
  };

  const renderCustomField = (field: CustomField) => {
    const fieldName = `customFields.${field.name}`;
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Form.Item
            key={field.id}
            name={fieldName}
            label={field.label}
            rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}
          >
            <Input 
              placeholder={field.placeholder}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            />
          </Form.Item>
        );
        
      case 'textarea':
        return (
          <Form.Item
            key={field.id}
            name={fieldName}
            label={field.label}
            rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}
          >
            <TextArea 
              placeholder={field.placeholder}
              rows={3}
            />
          </Form.Item>
        );
        
      case 'select':
        return (
          <Form.Item
            key={field.id}
            name={fieldName}
            label={field.label}
            rules={field.required ? [{ required: true, message: `Please select ${field.label.toLowerCase()}` }] : []}
          >
            <Select placeholder={`Select ${field.label.toLowerCase()}`}>
              {field.options?.map((option: string) => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
          </Form.Item>
        );
        
      default:
        return null;
    }
  };

  const getActivePricingTiers = (): PricingTier[] => {
    const now = new Date();
    return exhibition.pricingTiers.filter((tier: PricingTier) => 
      tier.isActive && 
      new Date(tier.startDate) <= now && 
      new Date(tier.endDate) >= now
    ).sort((a: PricingTier, b: PricingTier) => a.price - b.price);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2}>{exhibition.name}</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            {exhibition.tagline}
          </Text>
          <div style={{ marginTop: '16px' }}>
            <Space direction="vertical" size="small">
              <Text><EnvironmentOutlined /> {exhibition.venue}</Text>
              <Text>
                Registration: {new Date(exhibition.registrationStartDate).toLocaleDateString()} - {new Date(exhibition.registrationEndDate).toLocaleDateString()}
              </Text>
              <Text>
                Event: {new Date(exhibition.onsiteStartDate).toLocaleDateString()} - {new Date(exhibition.onsiteEndDate).toLocaleDateString()}
              </Text>
            </Space>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          initialValues={{
            registrationCategory: 'general'
          }}
        >
          {/* Email Field with Visitor Lookup */}
          <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Enter your email address"
                    suffix={emailLookupLoading && <Spin size="small" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                {existingVisitor && (
                  <div style={{ padding: '8px 0' }}>
                    <Alert
                      message={
                        <Space>
                          <CheckCircleOutlined />
                          <Text strong>Welcome back, {existingVisitor.name}!</Text>
                        </Space>
                      }
                      description={`We've prefilled your details from your profile. You have ${previousRegistrations.length} previous registration(s).`}
                      type="success"
                      action={
                        previousRegistrations.length > 0 && (
                          <Button
                            size="small"
                            icon={<HistoryOutlined />}
                            onClick={() => setShowPreviousRegistrations(true)}
                          >
                            View History
                          </Button>
                        )
                      }
                    />
                  </div>
                )}
              </Col>
            </Row>
          </Card>

          {/* Personal Information */}
          <Card title="Personal Information" size="small" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[{ required: true, message: 'Name is required' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[{ required: true, message: 'Phone number is required' }]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="+91 9876543210" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="company" label="Company">
                  <Input prefix={<HomeOutlined />} placeholder="Enter your company name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="designation" label="Designation">
                  <Input placeholder="Enter your designation" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Address Information */}
          <Card title="Address Information" size="small" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Form.Item name="state" label="State" rules={[{ required: true, message: 'State is required' }]}>
                  <Input placeholder="Enter your state" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="city" label="City" rules={[{ required: true, message: 'City is required' }]}>
                  <Input placeholder="Enter your city" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="pincode" label="Pincode" rules={[{ required: true, message: 'Pincode is required' }]}>
                  <Input placeholder="110001" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="address" label="Full Address">
                  <TextArea placeholder="Enter your complete address (optional)" rows={2} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Interest Selection */}
          <Card title="What are you looking for?" size="small" style={{ marginBottom: '24px' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Select the areas you're interested in exploring at this exhibition:
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {exhibition.interestOptions
                .filter((option: InterestOption) => option.isActive)
                .sort((a: InterestOption, b: InterestOption) => a.order - b.order)
                .map((option: InterestOption) => (
                  <Tag.CheckableTag
                    key={option.id}
                    checked={selectedInterests.includes(option.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedInterests([...selectedInterests, option.id]);
                      } else {
                        setSelectedInterests(selectedInterests.filter(id => id !== option.id));
                      }
                    }}
                    style={{ 
                      padding: '6px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {option.name}
                  </Tag.CheckableTag>
                ))}
            </div>
          </Card>

          {/* Registration Category */}
          <Card title="Registration Category" size="small" style={{ marginBottom: '24px' }}>
              <Form.Item
                name="registrationCategory"
                rules={[{ required: true, message: 'Please select a registration category' }]}
              >
                <Select placeholder="Select your registration category">
                  {exhibition.allowedCategories.map((category: string) => (
                    <Option key={category} value={category}>
                      {category.replace('_', ' ').toUpperCase()}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
          </Card>

          {/* Pricing (if exhibition is paid) */}
          {exhibition.isPaid && (
            <Card title="Pricing & Payment" size="small" style={{ marginBottom: '24px' }}>
              <Form.Item
                name="pricingTierId"
                rules={[{ required: true, message: 'Please select a pricing tier' }]}
              >
                <Select placeholder="Select pricing tier">
                  {getActivePricingTiers().map((tier: PricingTier) => (
                    <Option key={tier.id} value={tier.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>{tier.name}</Text>
                          {tier.description && (
                            <div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>{tier.description}</Text>
                            </div>
                          )}
                        </div>
                        <Text strong style={{ color: '#1890ff' }}>₹{tier.price}</Text>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              {selectedPricingTier && (
                <Alert
                  message={
                    <Space>
                      <Text strong>Total Amount: ₹{selectedPricingTier.price}</Text>
                    </Space>
                  }
                  description={`You selected ${selectedPricingTier.name}. Payment will be processed after registration.`}
                  type="info"
                  style={{ marginTop: '16px' }}
                />
              )}
            </Card>
          )}

          {/* Custom Fields */}
          {exhibition.customFields && exhibition.customFields.length > 0 && (
            <Card title="Additional Information" size="small" style={{ marginBottom: '24px' }}>
              <Row gutter={[16, 16]}>
                {exhibition.customFields
                  .sort((a: CustomField, b: CustomField) => a.order - b.order)
                  .map((field: CustomField) => (
                    <Col key={field.id} xs={24} md={field.type === 'textarea' ? 24 : 12}>
                      {renderCustomField(field)}
                    </Col>
                  ))}
              </Row>
            </Card>
          )}

          {/* Submit Button */}
          <div style={{ textAlign: 'center', paddingTop: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                minWidth: '200px',
                height: '48px',
                fontSize: '16px',
                background: exhibition.isPaid ? 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)' : undefined
              }}
            >
              {exhibition.isPaid ? 
                `Register & Pay ₹${selectedPricingTier?.price || 0}` : 
                'Complete Registration'
              }
            </Button>
          </div>
        </Form>
      </Card>

      {/* Previous Registrations Modal */}
      <Modal
        title="Registration History"
        open={showPreviousRegistrations}
        onCancel={() => setShowPreviousRegistrations(false)}
        footer={[
          <Button key="close" onClick={() => setShowPreviousRegistrations(false)}>
            Close
          </Button>
        ]}
      >
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Here are your previous registrations:
          </Text>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {previousRegistrations.map((reg, index) => (
              <Card key={index} size="small">
                <div>
                  <Text strong>{reg.exhibitionName}</Text>
                  <br />
                  <Text type="secondary">
                    Registered on {new Date(reg.registrationDate).toLocaleDateString()}
                  </Text>
                </div>
              </Card>
            ))}
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default VisitorRegistrationForm;
