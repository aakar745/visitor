import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, App } from 'antd';
import locationService from '../../../services/locationService';
import type { State, Country } from '../../../services/locationService';

interface StateModalProps {
  open: boolean;
  editingRecord: State | null;
  countries: Country[];
  onClose: () => void;
  onSuccess: () => void;
}

const StateModal: React.FC<StateModalProps> = ({
  open,
  editingRecord,
  countries,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          name: editingRecord.name,
          code: editingRecord.code,
          countryId: typeof editingRecord.countryId === 'object' 
            ? (editingRecord.countryId as Country)._id 
            : editingRecord.countryId,
          isActive: editingRecord.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true });
      }
    }
  }, [open, editingRecord, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Convert code to uppercase
      values.code = values.code.toUpperCase();

      if (editingRecord) {
        await locationService.updateState(editingRecord._id, values);
        message.success('State updated successfully');
      } else {
        await locationService.createState(values);
        message.success('State created successfully');
      }

      onSuccess();
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data.message || 'Operation failed');
      } else if (error.errorFields) {
        message.error('Please fill in all required fields');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingRecord ? 'Edit State' : 'Add New State'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ isActive: true }}
      >
        <Form.Item
          label="Country"
          name="countryId"
          rules={[{ required: true, message: 'Please select a country' }]}
        >
          <Select
            placeholder="Select a country"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={countries.map((country) => ({
              label: `${country.name} (${country.code})`,
              value: country._id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="State Name"
          name="name"
          rules={[
            { required: true, message: 'Please enter state name' },
            { min: 2, message: 'State name must be at least 2 characters' },
          ]}
        >
          <Input placeholder="e.g., Gujarat" />
        </Form.Item>

        <Form.Item
          label="State Code"
          name="code"
          rules={[
            { required: true, message: 'Please enter state code' },
            { min: 2, max: 3, message: 'State code must be 2-3 characters' },
            { pattern: /^[A-Z]{2,3}$/, message: 'Must be 2-3 uppercase letters' },
          ]}
          tooltip="ISO 3166-2 subdivision code (e.g., GJ for Gujarat)"
        >
          <Input
            placeholder="e.g., GJ"
            maxLength={3}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item label="Active" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StateModal;

