import React from 'react';
import { Spin, Card, Row, Col, Skeleton, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingScreenProps {
  type?: 'fullscreen' | 'inline' | 'table' | 'dashboard' | 'form';
  message?: string;
  size?: 'small' | 'default' | 'large';
}

// Full page loading spinner
export const FullScreenLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    background: '#f5f5f5'
  }}>
    <Spin 
      size="large" 
      indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />}
    />
    {message && (
      <div style={{ 
        marginTop: '24px', 
        fontSize: '16px', 
        color: '#8c8c8c',
        fontWeight: 500
      }}>
        {message}
      </div>
    )}
  </div>
);

// Inline loading spinner
export const InlineLoader: React.FC<{ message?: string; size?: 'small' | 'default' | 'large' }> = ({ 
  message, 
  size = 'default' 
}) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '48px 24px',
    width: '100%'
  }}>
    <Spin size={size} />
    {message && (
      <div style={{ 
        marginTop: '16px', 
        fontSize: '14px', 
        color: '#8c8c8c'
      }}>
        {message}
      </div>
    )}
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div style={{ padding: '24px' }}>
    {/* Header skeleton */}
    <div style={{ marginBottom: '24px' }}>
      <Skeleton.Input style={{ width: 200, height: 32, marginBottom: '8px' }} active />
      <Skeleton.Input style={{ width: 300, height: 20 }} active />
    </div>

    {/* Stats cards skeleton */}
    <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
      {[1, 2, 3, 4].map((i) => (
        <Col xs={24} sm={12} md={6} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>

    {/* Table skeleton */}
    <Card>
      <Skeleton active paragraph={{ rows: 8 }} />
    </Card>
  </div>
);

// Table loading skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div style={{ padding: '24px' }}>
    {/* Header */}
    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
      <Skeleton.Input style={{ width: 200, height: 32 }} active />
      <Space>
        <Skeleton.Button active />
        <Skeleton.Button active />
      </Space>
    </div>

    {/* Stats cards */}
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      {[1, 2, 3, 4].map((i) => (
        <Col xs={24} sm={12} md={6} key={i}>
          <Card size="small">
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>

    {/* Filters */}
    <Card style={{ marginBottom: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Skeleton.Input style={{ width: '100%' }} active />
        </Col>
        <Col span={6}>
          <Skeleton.Input style={{ width: '100%' }} active />
        </Col>
        <Col span={6}>
          <Skeleton.Input style={{ width: '100%' }} active />
        </Col>
        <Col span={6}>
          <Skeleton.Button active style={{ width: '100%' }} />
        </Col>
      </Row>
    </Card>

    {/* Table */}
    <Card>
      <Skeleton.Input style={{ width: '100%', height: 40, marginBottom: '16px' }} active />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={{ marginBottom: '12px' }}>
          <Skeleton active paragraph={{ rows: 1 }} />
        </div>
      ))}
    </Card>
  </div>
);

// Form loading skeleton
export const FormSkeleton: React.FC = () => (
  <Card style={{ maxWidth: 600, margin: '24px auto' }}>
    <Skeleton active paragraph={{ rows: 1 }} />
    <div style={{ marginTop: '24px' }}>
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col span={24} key={i}>
            <Skeleton.Input style={{ width: '100%', height: 40 }} active />
          </Col>
        ))}
      </Row>
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Skeleton.Button active />
        <Skeleton.Button active />
      </div>
    </div>
  </Card>
);

// Settings page skeleton
export const SettingsSkeleton: React.FC = () => (
  <div style={{ padding: '24px' }}>
    {/* Header */}
    <div style={{ marginBottom: '24px' }}>
      <Skeleton.Input style={{ width: 200, height: 32, marginBottom: '8px' }} active />
      <Skeleton.Input style={{ width: 300, height: 20 }} active />
    </div>

    {/* Stats */}
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      {[1, 2, 3].map((i) => (
        <Col xs={24} sm={8} key={i}>
          <Card size="small">
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>

    {/* Tabs skeleton */}
    <Card>
      <Skeleton.Input style={{ width: '100%', height: 40, marginBottom: '24px' }} active />
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton.Input style={{ width: 200, height: 24, marginBottom: '12px' }} active />
            <Card size="small">
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          </div>
        ))}
      </Space>
    </Card>
  </div>
);

// Main LoadingScreen component
const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  type = 'inline', 
  message,
  size = 'default'
}) => {
  switch (type) {
    case 'fullscreen':
      return <FullScreenLoader message={message} />;
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'inline':
    default:
      return <InlineLoader message={message} size={size} />;
  }
};

export default LoadingScreen;

