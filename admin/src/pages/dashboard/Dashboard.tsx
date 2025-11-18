import React from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Avatar,
  Progress,
} from 'antd';
import {
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  CalendarOutlined,
  RiseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { DashboardSkeleton } from '../../components/LoadingScreen';
import type { Visitor } from '../../types';
import { format } from 'date-fns';
import { useVisitors } from '../../hooks/useVisitors';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  // Fetch recent visitors from API
  const { data: visitorsData, isLoading } = useVisitors({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const recentVisitors = visitorsData?.data || [];

  const columns = [
    {
      title: 'Visitor',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Visitor) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{name || 'N/A'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.company || '-'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose: string) => purpose || '-',
    },
    {
      title: 'Host',
      dataIndex: 'hostName',
      key: 'hostName',
      render: (hostName: string, record: Visitor) => (
        <div>
          <Text>{hostName || '-'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.hostDepartment || '-'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Check-in Time',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (time: string) => {
        if (!time) return <Text type="secondary">-</Text>;
        try {
          const date = new Date(time);
          if (isNaN(date.getTime())) return <Text type="secondary">-</Text>;
          return format(date, 'HH:mm');
        } catch (error) {
          return <Text type="secondary">-</Text>;
        }
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        // Handle null/undefined status
        if (!status) {
          return (
            <Tag color="default" icon={<CalendarOutlined />}>
              UNKNOWN
            </Tag>
          );
        }
        
        return (
          <Tag
            color={
              status === 'checked-in'
                ? 'green'
                : status === 'checked-out'
                ? 'blue'
                : 'orange'
            }
            icon={
              status === 'checked-in' ? (
                <LoginOutlined />
              ) : status === 'checked-out' ? (
                <LogoutOutlined />
              ) : (
                <CalendarOutlined />
              )
            }
          >
            {status.replace('-', ' ').toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Visitor) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => console.log('View details', record.id)}
        >
          View
        </Button>
      ),
    },
  ];

  const mockStats = {
    totalVisitors: 1248,
    todayVisitors: 24,
    checkedInVisitors: 8,
    scheduledVisitors: 12,
    weeklyGrowth: 12.5,
    monthlyGrowth: 8.3,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: '4px' }}>
            Dashboard
          </Title>
          <Text type="secondary">
            Welcome back! Here's what's happening today.
          </Text>
        </div>
        <Button type="primary" icon={<UserOutlined />}>
          New Visitor
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            variant="borderless"
            style={{ 
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #f0f2f5'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                TOTAL VISITORS
              </Text>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                {mockStats.totalVisitors.toLocaleString()}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <RiseOutlined style={{ color: '#52c41a', marginRight: '4px', fontSize: '12px' }} />
              <Text style={{ color: '#52c41a', fontSize: '12px', fontWeight: 500 }}>
                +{mockStats.monthlyGrowth}% from last month
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card 
            variant="borderless"
            style={{ 
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #f0f2f5'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                TODAY'S VISITORS
              </Text>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                {mockStats.todayVisitors}
              </Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Progress
                percent={(mockStats.todayVisitors / 50) * 100}
                size="small"
                showInfo={false}
                strokeColor="#52c41a"
                trailColor="#f6ffed"
              />
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {mockStats.todayVisitors}/50 daily target
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card 
            variant="borderless"
            style={{ 
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #f0f2f5'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LoginOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                CURRENTLY IN
              </Text>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                {mockStats.checkedInVisitors}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Active visitors in building
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card 
            variant="borderless"
            style={{ 
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #f0f2f5'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                SCHEDULED
              </Text>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                {mockStats.scheduledVisitors}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Upcoming appointments
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Recent Visitors Table */}
      <Card 
        variant="borderless"
        style={{ 
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #f0f2f5'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={4} style={{ marginBottom: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
            Recent Visitors
          </Title>
          <Button type="primary" ghost>
            View All
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={recentVisitors}
          rowKey={(record) => record.id || `visitor-${Math.random()}`}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Quick Actions */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card 
            variant="borderless"
            title={
              <Text style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                Quick Actions
              </Text>
            }
            style={{ 
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #f0f2f5'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button 
                type="primary" 
                block 
                icon={<LoginOutlined />}
                size="large"
                style={{ 
                  height: '48px', 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none'
                }}
              >
                Quick Check-in
              </Button>
              <Button 
                block 
                icon={<LogoutOutlined />}
                size="large"
                style={{ 
                  height: '48px', 
                  borderRadius: '8px',
                  borderColor: '#d9d9d9'
                }}
              >
                Quick Check-out
              </Button>
              <Button 
                block 
                icon={<CalendarOutlined />}
                size="large"
                style={{ 
                  height: '48px', 
                  borderRadius: '8px',
                  borderColor: '#d9d9d9'
                }}
              >
                Schedule Visit
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            variant="borderless"
            title={
              <Text style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                System Status
              </Text>
            }
            style={{ 
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #f0f2f5'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f0f2f5'
              }}>
                <Text style={{ fontWeight: 500 }}>Database</Text>
                <Tag color="success" style={{ borderRadius: '6px', fontWeight: 500 }}>Online</Tag>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f0f2f5'
              }}>
                <Text style={{ fontWeight: 500 }}>Badge Printer</Text>
                <Tag color="success" style={{ borderRadius: '6px', fontWeight: 500 }}>Ready</Tag>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0'
              }}>
                <Text style={{ fontWeight: 500 }}>Camera System</Text>
                <Tag color="warning" style={{ borderRadius: '6px', fontWeight: 500 }}>Maintenance</Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
