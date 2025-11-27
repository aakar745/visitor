import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Typography,
  Spin,
  Empty,
  message,
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { exhibitionService } from '../../services/exhibitions/exhibitionService';
import { globalVisitorService } from '../../services/globalVisitorService';
import type { Exhibition } from '../../types/exhibitions';
import type { ExhibitionRegistrationStats } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface DashboardStats {
  todayRegistrations: number;
  totalRegistrations: number;
  todayCheckIns: number;
  totalCheckIns: number;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayRegistrations: 0,
    totalRegistrations: 0,
    todayCheckIns: 0,
    totalCheckIns: 0,
  });

  // Fetch active exhibitions on mount
  useEffect(() => {
    fetchActiveExhibitions();
  }, []);

  // Fetch stats when exhibition is selected
  useEffect(() => {
    if (selectedExhibitionId) {
      fetchExhibitionStats(selectedExhibitionId);
    }
  }, [selectedExhibitionId]);

  const fetchActiveExhibitions = async () => {
    try {
      setLoading(true);
      const response = await exhibitionService.getExhibitions({
        page: 1,
        limit: 100,
        filters: {
          status: ['active', 'registration_open', 'live_event'],
        },
      });

      const activeExhibitions = response.data || [];
      setExhibitions(activeExhibitions);

      // Auto-select first exhibition if available
      if (activeExhibitions.length > 0) {
        setSelectedExhibitionId(activeExhibitions[0].id);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      message.error('Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchExhibitionStats = async (exhibitionId: string) => {
    try {
      setStatsLoading(true);

      // Fetch exhibition statistics
      const exhibitionStats: ExhibitionRegistrationStats = await globalVisitorService.getExhibitionStats(exhibitionId);

      // Fetch today's registrations (we'll get all registrations and filter by today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = tomorrow.toISOString();

      // Get today's registrations
      const todayRegistrationsResponse = await globalVisitorService.getExhibitionRegistrations(exhibitionId, {
        page: 1,
        limit: 1, // We only need the count
        dateRange: {
          start: todayISO,
          end: tomorrowISO,
        },
      });

      // Get today's check-ins
      const todayCheckInsResponse = await globalVisitorService.getExhibitionRegistrations(exhibitionId, {
        page: 1,
        limit: 1, // We only need the count
        checkInStatus: 'checked-in',
        dateRange: {
          start: todayISO,
          end: tomorrowISO,
        },
      });

      setStats({
        todayRegistrations: todayRegistrationsResponse.pagination?.total || 0,
        totalRegistrations: exhibitionStats.totalRegistrations || 0,
        todayCheckIns: todayCheckInsResponse.pagination?.total || 0,
        totalCheckIns: exhibitionStats.checkInCount || 0,
      });
    } catch (error) {
      console.error('Error fetching exhibition stats:', error);
      message.error('Failed to load statistics');
      setStats({
        todayRegistrations: 0,
        totalRegistrations: 0,
        todayCheckIns: 0,
        totalCheckIns: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleExhibitionChange = (exhibitionId: string) => {
    setSelectedExhibitionId(exhibitionId);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (exhibitions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <Title level={2} style={{ marginBottom: '4px' }}>
            Dashboard
          </Title>
          <Text type="secondary">
            Welcome back! Here's your exhibition overview.
          </Text>
        </div>
        <Card>
          <Empty
            description="No active exhibitions found. Please create an exhibition to see statistics."
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <Title level={2} style={{ marginBottom: '4px' }}>
          Dashboard
        </Title>
        <Text type="secondary">
          Welcome back! Here's your exhibition overview.
        </Text>
      </div>

      {/* Exhibition Selector */}
      <Card
        variant="borderless"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #f0f2f5',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <Text strong style={{ fontSize: '14px', color: '#595959' }}>
            Select Exhibition
          </Text>
        </div>
        <Select
          size="large"
          style={{ width: '100%', maxWidth: '500px' }}
          placeholder="Choose an exhibition"
          value={selectedExhibitionId}
          onChange={handleExhibitionChange}
          loading={loading}
        >
          {exhibitions.map((exhibition) => (
            <Option key={exhibition.id} value={exhibition.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{exhibition.name}</span>
                <span style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: '12px' }}>
                  {exhibition.slug}
                </span>
              </div>
            </Option>
          ))}
        </Select>
      </Card>

      {/* Statistics Cards */}
      {selectedExhibitionId && (
        <Spin spinning={statsLoading}>
          <Row gutter={[24, 24]}>
            {/* Today's Registrations */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                variant="borderless"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #f0f2f5',
                  height: '160px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CalendarOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                      TODAY'S REGISTRATIONS
                    </Text>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#262626' }}>
                      {stats.todayRegistrations.toLocaleString()}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Total Registrations */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                variant="borderless"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #f0f2f5',
                  height: '160px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TeamOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                      TOTAL REGISTRATIONS
                    </Text>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#262626' }}>
                      {stats.totalRegistrations.toLocaleString()}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Today's Check-ins */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                variant="borderless"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #f0f2f5',
                  height: '160px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircleOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                      TODAY'S CHECK-INS
                    </Text>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#262626' }}>
                      {stats.todayCheckIns.toLocaleString()}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Total Check-ins */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                variant="borderless"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #f0f2f5',
                  height: '160px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UserOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                      TOTAL CHECK-INS
                    </Text>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#262626' }}>
                      {stats.totalCheckIns.toLocaleString()}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Spin>
      )}
    </div>
  );
};

export default Dashboard;
