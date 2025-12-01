import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Select, 
  Input, 
  Switch, 
  InputNumber,
  Form,
  Typography,
  Modal,
  App,
  Row,
  Col,
  Tag,
  Tooltip,
  Empty,
  Alert,
  Badge,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { CustomField } from '../../types/exhibitions';

const { Text } = Typography;

interface FormBuilderProps {
  value?: Omit<CustomField, 'id'>[];
  onChange?: (fields: Omit<CustomField, 'id'>[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: '📝', description: 'Single line text field' },
  { value: 'email', label: 'Email', icon: '📧', description: 'Email address with validation' },
  { value: 'phone', label: 'Phone Number', icon: '📱', description: 'Phone number field' },
  { value: 'select', label: 'Dropdown', icon: '📋', description: 'Single choice from list' },
  { value: 'api_select', label: 'API Dropdown', icon: '🌐', description: 'Dynamic dropdown from API' },
  { value: 'textarea', label: 'Text Area', icon: '📄', description: 'Multi-line text input' },
  { value: 'checkbox', label: 'Checkboxes', icon: '☑️', description: 'Multiple choices' },
  { value: 'radio', label: 'Radio Buttons', icon: '🔘', description: 'Single choice from options' },
];

// Complete form templates - Full registration forms
const FORM_TEMPLATES = [
  {
    id: 'exhibition',
    name: '🎪 Exhibition/Trade Show',
    description: 'Complete visitor details with location and contact',
    icon: '🎨',
    fields: [
      { 
        name: 'full_name', 
        label: 'Full Name', 
        type: 'text' as const, 
        required: true, 
        placeholder: 'Enter full name', 
        order: 0 
      },
      { 
        name: 'company', 
        label: 'Company Name', 
        type: 'text' as const, 
        required: true, 
        placeholder: 'Enter your company name', 
        order: 1 
      },
      { 
        name: 'phone', 
        label: 'Phone No.', 
        type: 'phone' as const, 
        required: true, 
        placeholder: '+91 98765 43210', 
        order: 2 
      },
      { 
        name: 'address', 
        label: 'Address', 
        type: 'textarea' as const, 
        required: true, 
        placeholder: 'Enter complete address', 
        order: 3 
      },
      { 
        name: 'pin_code', 
        label: 'Pin Code', 
        type: 'api_select' as const, 
        required: true, 
        placeholder: 'Enter PIN code',
        displayMode: 'input' as const, // Text input with autocomplete
        options: [], // No fallback options, pure API-driven
        apiConfig: {
          endpoint: '/api/locations/pincodes',
          valueField: 'pincode',
          labelField: 'pincode',
          searchable: true,
          cacheKey: 'pincodes_list'
        },
        validation: { 
          pattern: '^[0-9]{6}$',
          minLength: 6,
          maxLength: 6
        },
        order: 4 
      },
      { 
        name: 'city', 
        label: 'City', 
        type: 'api_select' as const, 
        required: true, 
        placeholder: 'Enter or select city',
        displayMode: 'input' as const, // Text input with autocomplete
        apiConfig: {
          endpoint: '/api/locations/cities',
          valueField: 'id',
          labelField: 'name',
          dependsOn: 'pin_code', // City auto-filled from pincode
          searchable: true,
          cacheKey: 'cities_list'
        },
        order: 5 
      },
      { 
        name: 'state', 
        label: 'State', 
        type: 'api_select' as const, 
        required: true, 
        placeholder: 'Select state',
        displayMode: 'input' as const, // Text input with autocomplete
        apiConfig: {
          endpoint: '/api/locations/states',
          valueField: 'id',
          labelField: 'name',
          dependsOn: 'pin_code', // State auto-filled from pincode
          searchable: true,
          cacheKey: 'states_list'
        },
        order: 6 
      },
      { 
        name: 'country', 
        label: 'Country', 
        type: 'api_select' as const, 
        required: true, 
        placeholder: 'Select country',
        displayMode: 'select' as const, // Dropdown
        options: ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore', 'Other'], // Fallback options
        apiConfig: {
          endpoint: '/api/locations/countries',
          valueField: 'code',
          labelField: 'name',
          searchable: true,
          cacheKey: 'countries_list'
        },
        order: 7 
      },
      { 
        name: 'how_did_you_find_us', 
        label: 'How Did You Find Us', 
        type: 'select' as const, 
        required: false, 
        placeholder: 'Select source',
        options: ['Google Search', 'Social Media', 'Friend Referral', 'Email', 'Advertisement', 'Other'],
        order: 8 
      },
    ]
  },
];

// Predefined templates for individual fields
const FIELD_TEMPLATES = [
  {
    name: 'full_name',
    label: 'Full Name',
    type: 'text' as const,
    required: true,
    placeholder: 'Enter full name',
  },
  {
    name: 'company',
    label: 'Company Name',
    type: 'text' as const,
    required: true,
    placeholder: 'Enter your company name',
  },
  {
    name: 'phone',
    label: 'Phone No.',
    type: 'phone' as const,
    required: true,
    placeholder: '+91 98765 43210',
  },
  {
    name: 'address',
    label: 'Address',
    type: 'textarea' as const,
    required: true,
    placeholder: 'Enter complete address',
  },
  {
    name: 'country',
    label: 'Country',
    type: 'api_select' as const,
    required: true,
    placeholder: 'Select country',
    displayMode: 'select' as const,
    options: ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore', 'Other'], // Fallback
    apiConfig: {
      endpoint: '/api/locations/countries',
      valueField: 'code',
      labelField: 'name',
      searchable: true,
      cacheKey: 'countries_list'
    },
  },
  {
    name: 'state',
    label: 'State',
    type: 'api_select' as const,
    required: true,
    placeholder: 'Select state',
    displayMode: 'input' as const,
    apiConfig: {
      endpoint: '/api/locations/states',
      valueField: 'id',
      labelField: 'name',
      dependsOn: 'country',
      searchable: true,
      cacheKey: 'states_list'
    },
  },
  {
    name: 'city',
    label: 'City',
    type: 'api_select' as const,
    required: true,
    placeholder: 'Enter or select city',
    displayMode: 'input' as const,
    apiConfig: {
      endpoint: '/api/locations/cities',
      valueField: 'id',
      labelField: 'name',
      dependsOn: 'state',
      searchable: true,
      cacheKey: 'cities_list'
    },
  },
  {
    name: 'pin_code',
    label: 'Pin Code',
    type: 'api_select' as const,
    required: true,
    placeholder: 'Enter PIN code',
    displayMode: 'input' as const,
    options: [],
    apiConfig: {
      endpoint: '/api/locations/pincodes',
      valueField: 'pincode',
      labelField: 'pincode',
      searchable: true,
      cacheKey: 'pincodes_list'
    },
    validation: {
      pattern: '^[0-9]{6}$',
      minLength: 6,
      maxLength: 6
    },
  },
  {
    name: 'how_did_you_find_us',
    label: 'How Did You Find Us',
    type: 'select' as const,
    required: false,
    placeholder: 'Select source',
    options: ['Google Search', 'Social Media', 'Friend Referral', 'Email', 'Advertisement', 'Other'],
  },
  {
    name: 'designation',
    label: 'Designation',
    type: 'text' as const,
    required: false,
    placeholder: 'e.g., Manager, Director',
  },
];

const FormBuilder: React.FC<FormBuilderProps> = ({ value = [], onChange }) => {
  const { modal, message: messageApi } = App.useApp();
  const [fields, setFields] = useState<Omit<CustomField, 'id'>[]>(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setFields(value);
  }, [value]);

  const updateFields = (newFields: Omit<CustomField, 'id'>[]) => {
    // ✅ DEBUG: Log fields to verify required flag is preserved
    console.log('[FormBuilder] Updating fields:', newFields);
    setFields(newFields);
    onChange?.(newFields);
  };

  const handleAddField = () => {
    setEditingIndex(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditField = (index: number) => {
    setEditingIndex(index);
    const field = fields[index];
    form.setFieldsValue({
      ...field,
      required: field.required || false, // ✅ Explicitly set required for Switch component
      options: field.options?.join(', '),
      // Load API configuration if present
      apiConfig: field.apiConfig || undefined,
      displayMode: field.displayMode || 'input',
    });
    setIsModalOpen(true);
  };

  const handleSaveField = (values: any) => {
    // ✅ DEBUG: Log form values to check required flag
    console.log('[FormBuilder] Saving field with values:', values);
    console.log('[FormBuilder] Required value:', values.required);
    
    const newField: Omit<CustomField, 'id'> = {
      name: values.name,
      label: values.label,
      type: values.type,
      required: values.required === true, // ✅ Explicit boolean conversion
      placeholder: values.placeholder,
      options: ['select', 'radio', 'checkbox', 'api_select'].includes(values.type) 
        ? values.options?.split(',').map((opt: string) => opt.trim()).filter(Boolean)
        : undefined,
      validation: {
        minLength: values.minLength || undefined,
        maxLength: values.maxLength || undefined,
        pattern: values.pattern || undefined,
      },
      order: editingIndex !== null ? fields[editingIndex].order : fields.length,
      // Add API configuration for api_select type
      ...(values.type === 'api_select' && values.apiConfig && {
        apiConfig: {
          endpoint: values.apiConfig.endpoint || '',
          valueField: values.apiConfig.valueField || 'id',
          labelField: values.apiConfig.labelField || 'name',
          dependsOn: values.apiConfig.dependsOn || undefined,
          searchable: true,
          cacheKey: values.apiConfig.endpoint ? values.apiConfig.endpoint.replace(/\//g, '_') : undefined,
        },
        displayMode: values.displayMode || 'input',
      }),
    };

    let updatedFields: Omit<CustomField, 'id'>[];
    if (editingIndex !== null) {
      updatedFields = [...fields];
      updatedFields[editingIndex] = newField;
    } else {
      updatedFields = [...fields, newField];
    }

    updateFields(updatedFields);
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDeleteField = (index: number) => {
    modal.confirm({
      title: 'Delete Field',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: 'Are you sure you want to delete this field? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        const filteredFields = fields.filter((_, i) => i !== index);
        // Recalculate order values after deletion
        const updatedFields = filteredFields.map((field, idx) => ({
          ...field,
          order: idx,
        }));
        updateFields(updatedFields);
      },
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return; // Already at the top
    
    const newFields = [...fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    
    // Update order values
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx,
    }));
    
    updateFields(reorderedFields);
  };

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return; // Already at the bottom
    
    const newFields = [...fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    
    // Update order values
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx,
    }));
    
    updateFields(reorderedFields);
  };

  const handleAddTemplate = (template: typeof FIELD_TEMPLATES[0]) => {
    const newField = {
      ...template,
      order: fields.length,
    };
    updateFields([...fields, newField]);
  };

  const handleApplyFormTemplate = (template: typeof FORM_TEMPLATES[0]) => {
    if (fields.length > 0) {
      modal.confirm({
        title: 'Apply Form Template?',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: (
          <div>
            <p>This will replace all existing fields with the template fields.</p>
            <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '13px' }}>
              <strong>{template.name}</strong> includes {template.fields.length} fields
            </p>
          </div>
        ),
        okText: 'Yes, Apply Template',
        okType: 'primary',
        cancelText: 'Cancel',
        onOk: () => {
          const templateFields = template.fields.map((field, idx) => ({
            ...field,
            order: idx,
          }));
          updateFields(templateFields);
          messageApi.success(`Applied "${template.name}" template with ${template.fields.length} fields`);
        },
      });
    } else {
      // No existing fields, apply directly
      const templateFields = template.fields.map((field, idx) => ({
        ...field,
        order: idx,
      }));
      updateFields(templateFields);
      messageApi.success(`Applied "${template.name}" template with ${template.fields.length} fields`);
    }
  };

  const getFieldTypeInfo = (type: string) => {
    return FIELD_TYPES.find(t => t.value === type);
  };

  return (
    <div style={{ position: 'relative', overflow: 'visible' }}>
      {/* Form Templates Section */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Text strong style={{ fontSize: '18px', color: '#fff' }}>
              ⚡ Quick Start with Form Templates
            </Text>
            <br />
            <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
              Apply a complete registration form with one click, then customize as needed
            </Text>
          </div>
          
          <Row gutter={[16, 16]}>
            {FORM_TEMPLATES.map((template) => (
              <Col xs={24} sm={12} md={6} key={template.id}>
                <Card
                  hoverable
                  onClick={() => handleApplyFormTemplate(template)}
                  style={{
                    borderRadius: '8px',
                    height: '100%',
                    background: '#fff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div style={{ fontSize: '32px', textAlign: 'center' }}>
                      {template.icon}
                    </div>
                    <Text strong style={{ fontSize: '14px', textAlign: 'center', display: 'block' }}>
                      {template.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                      {template.description}
                    </Text>
                    <Tag 
                      color="blue" 
                      style={{ 
                        fontSize: '11px', 
                        textAlign: 'center',
                        width: '100%',
                        borderRadius: '4px'
                      }}
                    >
                      {template.fields.length} Fields
                    </Tag>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </Card>

      {/* Info Banner */}
      <Alert
        message="Core fields (Name, Email) are always included in the registration form"
        description="Add custom fields below to collect additional information specific to your exhibition"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Card 
        variant="borderless"
        style={{ 
          background: '#fafafa',
          borderRadius: '12px',
          overflow: 'visible'
        }}
      >
        <Space direction="vertical" style={{ width: '100%', overflow: 'visible' }} size="large">
          {/* Quick Add Templates */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ThunderboltOutlined style={{ color: '#faad14', fontSize: '18px' }} />
              <Text strong style={{ fontSize: '15px' }}>Quick Add Common Fields</Text>
            </div>
            <Space wrap size={[8, 8]}>
              {FIELD_TEMPLATES.map((template) => {
                const isAdded = fields.some(f => f.name === template.name);
                return (
                  <Button
                    key={template.name}
                    size="middle"
                    onClick={() => handleAddTemplate(template)}
                    disabled={isAdded}
                    icon={isAdded ? <CheckCircleOutlined /> : <PlusOutlined />}
                    style={{
                      borderRadius: '6px',
                      ...(isAdded && {
                        background: '#f6ffed',
                        borderColor: '#b7eb8f',
                        color: '#52c41a'
                      })
                    }}
                  >
                    {template.label}
                  </Button>
                );
              })}
            </Space>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Custom Fields Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <Space>
              <Badge count={fields.length} showZero>
                <Text strong style={{ fontSize: '15px' }}>Custom Fields</Text>
              </Badge>
            </Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddField}
              style={{ borderRadius: '6px' }}
            >
              Add Custom Field
            </Button>
          </div>

          {/* Fields List */}
          {fields.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '48px 24px', background: '#fff' }}>
              <Empty
                description={
                  <Space direction="vertical" size="small">
                    <Text type="secondary">No custom fields added yet</Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      Use quick add buttons above or create a custom field
                    </Text>
                  </Space>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {fields.map((field, index) => (
                <Card
                  key={`field-${field.name}-${index}`}
                  size="small"
                  style={{ 
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s ease',
                  }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    {/* Order Number Badge */}
                    <div style={{
                      minWidth: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#f0f5ff',
                      border: '1px solid #adc6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: '#2f54eb'
                    }}>
                      {index + 1}
                    </div>
                    
                    {/* Field Info */}
                    <div style={{ flex: 1 }}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space size={8} wrap>
                          <Text strong style={{ fontSize: '14px' }}>
                            {field.label}
                          </Text>
                          {field.required && (
                            <Tag color="red" style={{ 
                              fontSize: '11px', 
                              padding: '0px 6px',
                              borderRadius: '4px'
                            }}>
                              Required
                            </Tag>
                          )}
                          <Tag style={{ 
                            fontSize: '11px', 
                            padding: '0px 6px',
                            borderRadius: '4px',
                            background: '#f0f5ff',
                            borderColor: '#adc6ff',
                            color: '#2f54eb'
                          }}>
                            {getFieldTypeInfo(field.type)?.icon} {getFieldTypeInfo(field.type)?.label}
                          </Tag>
                        </Space>
                        
                        <Space size={12} wrap style={{ marginTop: '4px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <Text code style={{ fontSize: '11px' }}>{field.name}</Text>
                          </Text>
                          {field.placeholder && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              • Placeholder: "{field.placeholder}"
                            </Text>
                          )}
                          {field.options && field.options.length > 0 && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              • {field.options.length} options
                            </Text>
                          )}
                        </Space>
                      </Space>
                    </div>

                    {/* Actions */}
                    <Space size={4}>
                      <Tooltip title="Move up">
                        <Button
                          type="text"
                          size="middle"
                          icon={<ArrowUpOutlined />}
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          style={{ borderRadius: '6px' }}
                        />
                      </Tooltip>
                      <Tooltip title="Move down">
                        <Button
                          type="text"
                          size="middle"
                          icon={<ArrowDownOutlined />}
                          onClick={() => handleMoveDown(index)}
                          disabled={index === fields.length - 1}
                          style={{ borderRadius: '6px' }}
                        />
                      </Tooltip>
                      <Divider type="vertical" style={{ margin: '0 4px' }} />
                      <Tooltip title="Edit field">
                        <Button
                          type="text"
                          size="middle"
                          icon={<EditOutlined />}
                          onClick={() => handleEditField(index)}
                          style={{ borderRadius: '6px' }}
                        />
                      </Tooltip>
                      <Tooltip title="Delete field">
                        <Button
                          type="text"
                          size="middle"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteField(index)}
                          style={{ borderRadius: '6px' }}
                        />
                      </Tooltip>
                    </Space>
                  </div>
                </Card>
              ))}
            </Space>
          )}
        </Space>
      </Card>

      {/* Field Editor Modal */}
      <Modal
        title={
          <Space style={{ fontSize: '16px' }}>
            {editingIndex !== null ? <EditOutlined style={{ color: '#1890ff' }} /> : <PlusOutlined style={{ color: '#1890ff' }} />}
            <Text strong>{editingIndex !== null ? 'Edit Field' : 'Add Custom Field'}</Text>
          </Space>
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        width={700}
        okText={editingIndex !== null ? 'Update Field' : 'Add Field'}
        cancelText="Cancel"
        style={{ top: 20 }}
      >
        <Divider style={{ margin: '16px 0 24px 0' }} />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveField}
          requiredMark="optional"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="label"
                label={<Text strong>Field Label</Text>}
                tooltip="This is what visitors will see in the registration form"
                rules={[
                  { required: true, message: 'Please enter field label' },
                  { min: 2, message: 'Label must be at least 2 characters' }
                ]}
              >
                <Input 
                  placeholder="e.g., Company Name" 
                  size="large"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label={
                  <Space>
                    <Text strong>Field Name</Text>
                    <Tooltip title="Internal identifier used for database storage. Use lowercase letters, numbers and underscores only.">
                      <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: '14px' }} />
                    </Tooltip>
                  </Space>
                }
                rules={[
                  { required: true, message: 'Please enter field name' },
                  { 
                    pattern: /^[a-z_][a-z0-9_]*$/, 
                    message: 'Use lowercase, numbers and underscores only' 
                  }
                ]}
              >
                <Input 
                  placeholder="e.g., company_name" 
                  size="large"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="type"
            label={<Text strong>Field Type</Text>}
            rules={[{ required: true, message: 'Please select field type' }]}
          >
            <Select 
              placeholder="Select field type" 
              size="large"
              style={{ borderRadius: '6px' }}
              optionLabelProp="label"
            >
              {FIELD_TYPES.map(type => (
                <Select.Option 
                  key={type.value} 
                  value={type.value}
                  label={
                    <span>
                      <span style={{ marginRight: '8px' }}>{type.icon}</span>
                      {type.label}
                    </span>
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>{type.icon}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{type.label}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {type.description}
                      </Text>
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="placeholder"
            label={<Text strong>Placeholder Text</Text>}
            tooltip="Hint text shown inside the field"
          >
            <Input 
              placeholder="Enter placeholder text" 
              size="large"
              style={{ borderRadius: '6px' }}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              
              // Options for regular select/radio/checkbox
              if (['select', 'radio', 'checkbox'].includes(type)) {
                return (
                  <Form.Item
                    name="options"
                    label={<Text strong>Options</Text>}
                    tooltip="Enter each option separated by commas"
                    rules={[
                      { required: true, message: 'Please enter at least one option' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const options = value.split(',').map((o: string) => o.trim()).filter(Boolean);
                          if (options.length < 2) {
                            return Promise.reject(new Error('Please enter at least 2 options'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input.TextArea 
                      placeholder="Option 1, Option 2, Option 3"
                      rows={3}
                      size="large"
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>
                );
              }
              
              // API configuration for api_select type
              if (type === 'api_select') {
                return (
                  <Card 
                    title={
                      <Space>
                        <span style={{ fontSize: '16px' }}>🌐</span>
                        <Text strong>API Configuration</Text>
                      </Space>
                    }
                    size="small" 
                    style={{ 
                      marginBottom: '16px',
                      borderRadius: '8px',
                      background: '#f0f5ff',
                      borderColor: '#adc6ff'
                    }}
                  >
                    <Alert
                      message="Future-Ready Configuration"
                      description="Configure API endpoint for dynamic dropdowns. Will work as text input until backend API is ready."
                      type="info"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item 
                          name={['apiConfig', 'endpoint']} 
                          label="API Endpoint"
                          tooltip="Backend API endpoint to fetch options"
                        >
                          <Input 
                            placeholder="/api/locations/cities" 
                            size="large"
                            style={{ borderRadius: '6px', fontFamily: 'monospace' }}
                            prefix="🔗"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name={['apiConfig', 'dependsOn']} 
                          label="Depends On Field"
                          tooltip="Field name this depends on (e.g., city depends on state)"
                        >
                          <Input 
                            placeholder="e.g., state" 
                            size="large"
                            style={{ borderRadius: '6px' }}
                            prefix="🔗"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item 
                          name={['apiConfig', 'valueField']} 
                          label="Value Field"
                          tooltip="Field name for option value in API response"
                          initialValue="id"
                        >
                          <Input 
                            placeholder="id" 
                            size="large"
                            style={{ borderRadius: '6px' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name={['apiConfig', 'labelField']} 
                          label="Label Field"
                          tooltip="Field name for option label in API response"
                          initialValue="name"
                        >
                          <Input 
                            placeholder="name" 
                            size="large"
                            style={{ borderRadius: '6px' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Form.Item 
                      name="displayMode" 
                      label="Display Mode"
                      tooltip="Text input for now, dropdown when API is ready"
                      initialValue="input"
                    >
                      <Select size="large" style={{ borderRadius: '6px' }}>
                        <Select.Option value="input">📝 Text Input (Current)</Select.Option>
                        <Select.Option value="select">🌐 API Dropdown (When backend ready)</Select.Option>
                      </Select>
                    </Form.Item>
                    
                    {/* Fallback options for offline mode */}
                    <Form.Item
                      name="options"
                      label={<Text strong>Fallback Options (Optional)</Text>}
                      tooltip="Static options to use if API is unavailable"
                    >
                      <Input.TextArea 
                        placeholder="India, United States, United Kingdom, UAE"
                        rows={2}
                        size="large"
                        style={{ borderRadius: '6px' }}
                      />
                    </Form.Item>
                  </Card>
                );
              }
              
              return null;
            }}
          </Form.Item>

          <div style={{ 
            padding: '12px 16px', 
            background: '#fafafa', 
            borderRadius: '8px',
            border: '1px solid #e8e8e8'
          }}>
            <Space align="start">
              <Form.Item
                name="required"
                valuePropName="checked"
                initialValue={false}
                style={{ marginBottom: 0 }}
              >
                <Switch />
              </Form.Item>
              <div>
                <Text strong>Make this field required</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Visitors must fill this field to complete registration
                </Text>
              </div>
            </Space>
          </div>

          <Card 
            title={<Text strong>Validation Rules (Optional)</Text>}
            size="small" 
            style={{ 
              marginTop: '16px',
              borderRadius: '8px',
              background: '#f9f9f9'
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="minLength" 
                  label="Minimum Length"
                  tooltip="Minimum number of characters"
                >
                  <InputNumber 
                    min={0} 
                    style={{ width: '100%', borderRadius: '6px' }} 
                    placeholder="e.g., 3"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="maxLength" 
                  label="Maximum Length"
                  tooltip="Maximum number of characters"
                >
                  <InputNumber 
                    min={0} 
                    style={{ width: '100%', borderRadius: '6px' }} 
                    placeholder="e.g., 100"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item 
              name="pattern" 
              label={
                <Space>
                  <Text>Regex Pattern</Text>
                  <Tooltip title="Advanced: Use regular expressions for custom validation. Example: ^[0-9]{10}$ for exactly 10 digits">
                    <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: '13px' }} />
                  </Tooltip>
                </Space>
              }
            >
              <Input 
                placeholder="e.g., ^[0-9]{10}$ for 10-digit numbers" 
                size="large"
                style={{ borderRadius: '6px', fontFamily: 'monospace' }}
              />
            </Form.Item>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default FormBuilder;

