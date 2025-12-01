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
          // Check if form instance is still valid and connected
          const formInstance = f.getInternalHooks?.('RC_FORM_INTERNAL_HOOKS');
          if (!formInstance) {
            // Form is not connected or already destroyed
            return;
          }
          
          if (clearErrors) {
            // Clear validation errors without resetting values
            try {
              const fieldsError = f.getFieldsError();
              const resetErrors = fieldsError.map((field) => ({
                name: field.name,
                errors: [],
              }));
              // Avoid circular reference warning in dev mode
              if (resetErrors.length > 0) {
                f.setFields(resetErrors);
              }
            } catch (e) {
              // Ignore circular reference warnings in React Strict Mode
            }
          }
          
          if (resetOnUnmount) {
            // Reset all fields to initial values
            f.resetFields();
          }
        } catch (error) {
          // Silently fail - form might already be destroyed
          // This can happen in React Strict Mode during development
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
        // Check if form instance is still valid
        const formInstance = form.getInternalHooks?.('RC_FORM_INTERNAL_HOOKS');
        if (formInstance) {
          form.resetFields();
        }
      } catch (error) {
        // Silently fail - this can happen in React Strict Mode
      }
    }
  }, [form, isVisible]);
}

export default useFormCleanup;

