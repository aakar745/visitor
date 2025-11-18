import React from 'react';
import { Card, Layout, Typography, Space } from 'antd';
import { APP_CONFIG } from '../constants';

const { Content } = Layout;
const { Title, Text } = Typography;

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)' }}>
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ width: '100%', maxWidth: '28rem' }}>
          <Card style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: 'none' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Space direction="vertical" size="small">
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  margin: '0 auto 16px auto', 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #4f46e5 100%)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                    {APP_CONFIG.APP_NAME.charAt(0)}
                  </span>
                </div>
                <Title level={2} style={{ marginBottom: 0, color: '#1f2937' }}>
                  {title}
                </Title>
                {subtitle && (
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    {subtitle}
                  </Text>
                )}
              </Space>
            </div>
            {children}
          </Card>
          
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {APP_CONFIG.APP_NAME} v{APP_CONFIG.VERSION}
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default AuthLayout;
