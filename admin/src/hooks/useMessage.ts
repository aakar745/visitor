import { App } from 'antd';

/**
 * Custom hook to use Ant Design's message API with context support
 * This avoids the static method warning and allows for dynamic theming
 */
export const useMessage = () => {
  const { message } = App.useApp();
  return message;
};

export default useMessage;

