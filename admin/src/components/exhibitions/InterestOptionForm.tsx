import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Typography,
  Row,
  Col,
  Tag,
  Modal,
  InputNumber,
  List,
  Empty,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import type { InterestOption, InterestCategory } from '../../types/exhibitions';
import { InterestCategory as InterestCategoryEnum } from '../../types/exhibitions';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface InterestOptionFormProps {
  value?: InterestOption[];
  onChange?: (options: InterestOption[]) => void;
  disabled?: boolean;
}

interface InterestFormData {
  name: string;
  category: InterestCategory;
  description?: string;
  isActive: boolean;
  order: number;
}

const InterestOptionForm: React.FC<InterestOptionFormProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOption, setEditingOption] = useState<InterestOption | null>(null);
  const [form] = Form.useForm<InterestFormData>();

  // Interest category options with display names
  const categoryOptions = [
    { value: InterestCategoryEnum.PRODUCTS, label: 'Products', color: 'blue' },
    { value: InterestCategoryEnum.SERVICES, label: 'Services', color: 'green' },
    { value: InterestCategoryEnum.PARTNERSHIPS, label: 'Partnerships', color: 'purple' },
    { value: InterestCategoryEnum.INVESTMENT, label: 'Investment', color: 'gold' },
    { value: InterestCategoryEnum.TECHNOLOGY, label: 'Technology', color: 'cyan' },
    { value: InterestCategoryEnum.SUPPLIERS, label: 'Suppliers', color: 'orange' },
    { value: InterestCategoryEnum.DISTRIBUTORS, label: 'Distributors', color: 'magenta' },
    { value: InterestCategoryEnum.LICENSING, label: 'Licensing', color: 'red' },
    { value: InterestCategoryEnum.JOINT_VENTURES, label: 'Joint Ventures', color: 'volcano' },
    { value: InterestCategoryEnum.MANUFACTURING, label: 'Manufacturing', color: 'geekblue' },
    { value: InterestCategoryEnum.EXPORT_OPPORTUNITIES, label: 'Export Opportunities', color: 'lime' },
    { value: InterestCategoryEnum.IMPORT_OPPORTUNITIES, label: 'Import Opportunities', color: 'pink' },
    { value: InterestCategoryEnum.FRANCHISE, label: 'Franchise', color: 'yellow' },
    { value: InterestCategoryEnum.NETWORKING, label: 'Networking', color: 'brown' },
    { value: InterestCategoryEnum.KNOWLEDGE_SHARING, label: 'Knowledge Sharing', color: 'lightblue' },
    { value: InterestCategoryEnum.OTHER, label: 'Other', color: 'default' },
  ];

  const getCategoryColor = (category: InterestCategory): string => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    return categoryOption?.color || 'default';
  };

  const getCategoryLabel = (category: InterestCategory): string => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    return categoryOption?.label || category;
  };

  const handleAddOption = () => {
    setEditingOption(null);
    form.resetFields();
    // Set default values
    form.setFieldsValue({
      isActive: true,
      required: false,
      order: value.length + 1,
    });
    setIsModalVisible(true);
  };

  const handleEditOption = (option: InterestOption) => {
    setEditingOption(option);
    form.setFieldsValue({
      name: option.name,
      category: option.category,
      description: option.description,
      isActive: option.isActive,
      required: option.required || false,
      order: option.order,
    });
    setIsModalVisible(true);
  };

  const handleDeleteOption = (optionId: string) => {
    const newOptions = value.filter(option => option.id !== optionId);
    onChange?.(newOptions);
  };

  const handleToggleActive = (optionId: string) => {
    const newOptions = value.map(option =>
      option.id === optionId
        ? { ...option, isActive: !option.isActive }
        : option
    );
    onChange?.(newOptions);
  };

  const handleSubmit = async () => {
    try {
      const formData = await form.validateFields();
      
      if (editingOption) {
        // Update existing option
        const newOptions = value.map(option =>
          option.id === editingOption.id
            ? { ...option, ...formData }
            : option
        );
        onChange?.(newOptions);
      } else {
        // Add new option
        const newOption: InterestOption = {
          id: uuidv4(),
          ...formData,
        };
        onChange?.([...value, newOption]);
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingOption(null);
  };

  // Sort options by order
  const sortedOptions = [...value].sort((a, b) => a.order - b.order);

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ marginBottom: '4px' }}>
              Interest Categories
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Define what visitors are looking for at your exhibition
            </Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddOption}
            disabled={disabled}
          >
            Add Interest
          </Button>
        </div>
      }
      style={{ marginBottom: '24px' }}
    >
      {sortedOptions.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No interest categories defined"
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddOption}
            disabled={disabled}
          >
            Add Your First Interest Category
          </Button>
        </Empty>
      ) : (
        <List
          dataSource={sortedOptions}
          renderItem={(option) => (
            <List.Item
              key={option.id}
              style={{
                padding: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginBottom: '12px',
                background: option.isActive ? '#ffffff' : '#f9f9f9',
              }}
              actions={[
                <Button
                  type="text"
                  icon={option.isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  onClick={() => handleToggleActive(option.id)}
                  disabled={disabled}
                  title={option.isActive ? 'Hide from visitors' : 'Show to visitors'}
                  style={{ 
                    color: option.isActive ? '#52c41a' : '#d9d9d9' 
                  }}
                />,
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditOption(option)}
                  disabled={disabled}
                />,
                <Popconfirm
                  title="Delete Interest Category"
                  description="Are you sure you want to delete this interest category?"
                  okText="Delete"
                  cancelText="Cancel"
                  okType="danger"
                  onConfirm={() => handleDeleteOption(option.id)}
                  disabled={disabled}
                >
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    disabled={disabled}
                  />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${getCategoryColor(option.category)} 0%, ${getCategoryColor(option.category)}80 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    {option.order}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong style={{ 
                      color: option.isActive ? '#262626' : '#8c8c8c' 
                    }}>
                      {option.name}
                    </Text>
                    <Tag color={getCategoryColor(option.category)} style={{ margin: 0 }}>
                      {getCategoryLabel(option.category)}
                    </Tag>
                    {option.required && (
                      <Tag color="red" style={{ margin: 0 }}>
                        Required
                      </Tag>
                    )}
                    {!option.isActive && (
                      <Tag color="default" style={{ margin: 0 }}>
                        Hidden
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <Text type="secondary" style={{ 
                    color: option.isActive ? '#8c8c8c' : '#bfbfbf' 
                  }}>
                    {option.description || 'No description provided'}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={editingOption ? 'Edit Interest Category' : 'Add New Interest Category'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        width={600}
        okText={editingOption ? 'Update' : 'Add'}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Row gutter={[16, 0]}>
            <Col span={16}>
              <Form.Item
                label="Interest Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter the interest name' },
                  { max: 100, message: 'Interest name cannot exceed 100 characters' }
                ]}
              >
                <Input 
                  placeholder="e.g., Technology Solutions, Business Partnerships"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select 
                  placeholder="Select category"
                  size="large"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {categoryOptions.map(option => (
                    <Option key={option.value} value={option.value} label={option.label}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag color={option.color} style={{ margin: 0 }}>
                          {option.label}
                        </Tag>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            extra="Optional: Provide additional context for visitors"
          >
            <TextArea
              placeholder="Describe what visitors are looking for in this category..."
              rows={3}
              maxLength={300}
              showCount
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col span={8}>
              <Form.Item
                label="Display Order"
                name="order"
                rules={[{ required: true, message: 'Please set the display order' }]}
                extra="Lower numbers appear first"
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Status"
                name="isActive"
                valuePropName="checked"
                extra="Show to visitors"
              >
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Hidden"
                  size="default"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Required"
                name="required"
                valuePropName="checked"
                initialValue={false}
                extra="Visitors must select"
              >
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  size="default"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default InterestOptionForm;
