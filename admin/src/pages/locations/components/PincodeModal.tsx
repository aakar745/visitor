import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, App } from 'antd';
import locationService from '../../../services/locationService';
import type { Pincode, City, State } from '../../../services/locationService';

interface PincodeModalProps {
  open: boolean;
  editingRecord: Pincode | null;
  cities: City[];
  onClose: () => void;
  onSuccess: () => void;
}

const PincodeModal: React.FC<PincodeModalProps> = ({
  open,
  editingRecord,
  cities,
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
          pincode: editingRecord.pincode,
          area: editingRecord.area,
          cityId: typeof editingRecord.cityId === 'object' 
            ? (editingRecord.cityId as City)._id 
            : editingRecord.cityId,
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

      if (editingRecord) {
        await locationService.updatePincode(editingRecord._id, values);
        message.success('PIN code updated successfully');
      } else {
        await locationService.createPincode(values);
        message.success('PIN code created successfully');
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
      title={editingRecord ? 'Edit PIN Code' : 'Add New PIN Code'}
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
          label="City"
          name="cityId"
          rules={[{ required: true, message: 'Please select a city' }]}
        >
          <Select
            placeholder="Select a city"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={cities
              .filter((city) => city != null)
              .map((city) => {
                const stateName = 
                  city.stateId && typeof city.stateId === 'object' 
                    ? (city.stateId as State).name 
                    : '';
                return {
                  label: stateName 
                    ? `${city.name} - ${stateName}`
                    : city.name,
                  value: city._id,
                };
              })}
          />
        </Form.Item>

        <Form.Item
          label="PIN Code"
          name="pincode"
          rules={[
            { required: true, message: 'Please enter PIN code' },
            { len: 6, message: 'PIN code must be exactly 6 digits' },
            { pattern: /^\d{6}$/, message: 'Must be 6 digits' },
          ]}
        >
          <Input placeholder="e.g., 380001" maxLength={6} />
        </Form.Item>

        <Form.Item
          label="Area / Locality"
          name="area"
          rules={[
            { min: 2, message: 'Area name must be at least 2 characters' },
          ]}
        >
          <Input placeholder="e.g., Ellis Bridge" />
        </Form.Item>

        <Form.Item label="Active" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PincodeModal;

