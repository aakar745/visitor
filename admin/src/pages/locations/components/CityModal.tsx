import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, App } from 'antd';
import locationService from '../../../services/locationService';
import type { City, State, Country } from '../../../services/locationService';

interface CityModalProps {
  open: boolean;
  editingRecord: City | null;
  states: State[];
  onClose: () => void;
  onSuccess: () => void;
}

const CityModal: React.FC<CityModalProps> = ({
  open,
  editingRecord,
  states,
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
          stateId: typeof editingRecord.stateId === 'object' 
            ? (editingRecord.stateId as State)._id 
            : editingRecord.stateId,
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
        await locationService.updateCity(editingRecord._id, values);
        message.success('City updated successfully');
      } else {
        await locationService.createCity(values);
        message.success('City created successfully');
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
      title={editingRecord ? 'Edit City' : 'Add New City'}
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
          label="State"
          name="stateId"
          rules={[{ required: true, message: 'Please select a state' }]}
        >
          <Select
            placeholder="Select a state"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={states
              .filter((state) => state != null)
              .map((state) => {
                const countryName = 
                  state.countryId && typeof state.countryId === 'object' 
                    ? (state.countryId as Country).name 
                    : '';
                return {
                  label: countryName 
                    ? `${state.name} (${state.code}) - ${countryName}`
                    : `${state.name} (${state.code})`,
                  value: state._id,
                };
              })}
          />
        </Form.Item>

        <Form.Item
          label="City Name"
          name="name"
          rules={[
            { required: true, message: 'Please enter city name' },
            { min: 2, message: 'City name must be at least 2 characters' },
          ]}
        >
          <Input placeholder="e.g., Ahmedabad" />
        </Form.Item>

        <Form.Item label="Active" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CityModal;

