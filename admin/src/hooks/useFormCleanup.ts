import { useEffect } from 'react';
import type { FormInstance } from 'antd';

/**
 * useFormCleanup Hook
 * 
 * SECURITY FIX (BUG-019): Automatically reset form on component unmount
 * 
 * This hook ensures that form validation errors, field values, and touched states
 * are cleared when a component unmounts. This prevents stale validation errors
 * from appearing when the user returns to the form.
 * 
 * @param form - Ant Design Form instance from Form.useForm()
 * @param options - Optional configuration
 * 
 * @example
 * const [form] = Form.useForm();
 * useFormCleanup(form); // Automatically resets on unmount
 * 
 * @example With options
 * const [form] = Form.useForm();
 * useFormCleanup(form, {
 *   resetOnUnmount: true,  // Reset form fields (default: true)
 *   clearErrors: true,      // Clear validation errors (default: true)
 * });
 */
export function useFormCleanup(
  form: FormInstance | FormInstance[],
  options: {
    resetOnUnmount?: boolean;
    clearErrors?: boolean;
  } = {}
) {
  const {
    resetOnUnmount = true,
    clearErrors = true,
  } = options;

  useEffect(() => {
    // Cleanup function runs when component unmounts
    return () => {
      const forms = Array.isArray(form) ? form : [form];
      
      forms.forEach((f) => {
        if (!f) return;
        
        try {
          if (clearErrors) {
            // Clear validation errors without resetting values
            const fieldsError = f.getFieldsError();
            const resetErrors = fieldsError.map((field) => ({
              name: field.name,
              errors: [],
            }));
            f.setFields(resetErrors);
          }
          
          if (resetOnUnmount) {
            // Reset all fields to initial values
            f.resetFields();
          }
        } catch (error) {
          // Silently fail - form might already be destroyed
          console.debug('Form cleanup error (can be ignored):', error);
        }
      });
    };
  }, [form, resetOnUnmount, clearErrors]);
}

/**
 * useModalFormCleanup Hook
 * 
 * SECURITY FIX (BUG-019): Reset form when modal visibility changes
 * 
 * Similar to useFormCleanup, but specifically for modals.
 * Resets the form when the modal closes (visible becomes false).
 * 
 * @param form - Ant Design Form instance
 * @param isVisible - Modal visibility state
 * 
 * @example
 * const [form] = Form.useForm();
 * const [isModalVisible, setIsModalVisible] = useState(false);
 * useModalFormCleanup(form, isModalVisible);
 */
export function useModalFormCleanup(
  form: FormInstance,
  isVisible: boolean
) {
  useEffect(() => {
    // When modal closes (visible changes to false), reset form
    if (!isVisible) {
      try {
        form.resetFields();
      } catch (error) {
        console.debug('Modal form cleanup error (can be ignored):', error);
      }
    }
  }, [form, isVisible]);
}

export default useFormCleanup;

