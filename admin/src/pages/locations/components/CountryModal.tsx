import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, App } from 'antd';
import locationService from '../../../services/locationService';
import type { Country } from '../../../services/locationService';

interface CountryModalProps {
  open: boolean;
  editingRecord: Country | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CountryModal: React.FC<CountryModalProps> = ({
  open,
  editingRecord,
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
        await locationService.updateCountry(editingRecord._id, values);
        message.success('Country updated successfully');
      } else {
        await locationService.createCountry(values);
        message.success('Country created successfully');
      }

      onSuccess();
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data.message || 'Operation failed');
      } else if (error.errorFields) {
        // Validation error
        message.error('Please fill in all required fields');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingRecord ? 'Edit Country' : 'Add New Country'}
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
          label="Country Name"
          name="name"
          rules={[
            { required: true, message: 'Please enter country name' },
            { min: 2, message: 'Country name must be at least 2 characters' },
          ]}
        >
          <Input placeholder="e.g., India" />
        </Form.Item>

        <Form.Item
          label="Country Code"
          name="code"
          rules={[
            { required: true, message: 'Please enter country code' },
            { len: 2, message: 'Country code must be exactly 2 characters' },
            { pattern: /^[A-Z]{2}$/, message: 'Must be 2 uppercase letters' },
          ]}
          tooltip="ISO 3166-1 alpha-2 code (e.g., IN for India)"
        >
          <Input
            placeholder="e.g., IN"
            maxLength={2}
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

export default CountryModal;

