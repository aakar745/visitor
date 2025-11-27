import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Row,
  Col,
  Typography,
  Space,
  Empty,
  Spin,
  Badge,
  Tooltip,
  Progress
} from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  DollarOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { globalVisitorService } from '../../services/globalVisitorService';
import { exhibitionService } from '../../services/exhibitions/exhibitionService';
import type { ExhibitionRegistrationStats } from '../../types';
import type { Exhibition } from '../../types/exhibitions';
import { formatDateRangeShort } from '../../utils/dateFormatter';

const { Title, Text } = Typography;
const { Option } = Select;

// Chart colors
const COLORS = {
  primary: ['#667eea', '#764ba2', '#4facfe', '#00f2fe', '#11998e', '#38ef7d'],
  status: {
    checkedIn: '#52c41a',
    notCheckedIn: '#faad14',
    preReg: '#4facfe',
    onSpot: '#ee0979',
    paid: '#722ed1',
    free: '#13c2c2'
  }
};

const Analytics: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibition, setSelectedExhibition] = useState<string>('');
  const [stats, setStats] = useState<ExhibitionRegistrationStats | null>(null);
  const [selectedExhibitionData, setSelectedExhibitionData] = useState<Exhibition | null>(null);

  // Load exhibitions on component mount
  useEffect(() => {
    loadExhibitions();
  }, []);

  // Load stats when exhibition is selected
  useEffect(() => {
    if (selectedExhibition) {
      loadExhibitionStats();
    }
  }, [selectedExhibition]);

  const loadExhibitions = async () => {
    setLoading(true);
    try {
      const response = await exhibitionService.getExhibitions({
        page: 1,
        limit: 500,
      });
      
      setExhibitions(response.data || []);
      
      // Auto-select first exhibition if available
      if (response.data && response.data.length > 0) {
        setSelectedExhibition(response.data[0].id);
        setSelectedExhibitionData(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load exhibitions:', error);
      setExhibitions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExhibitionStats = async () => {
    if (!selectedExhibition) return;
    
    setStatsLoading(true);
    try {
      const response = await globalVisitorService.getExhibitionStats(selectedExhibition);
      
      // Ensure all required fields have default values
      setStats({
        exhibitionId: response?.exhibitionId || selectedExhibition,
        totalRegistrations: response?.totalRegistrations || 0,
        preRegistrations: response?.preRegistrations || 0,
        preRegCheckIns: response?.preRegCheckIns || 0,
        onSpotRegistrations: response?.onSpotRegistrations || 0,
        onSpotCheckIns: response?.onSpotCheckIns || 0,
        confirmedRegistrations: response?.confirmedRegistrations || 0,
        paidRegistrations: response?.paidRegistrations || 0,
        freeRegistrations: response?.freeRegistrations || 0,
        cancelledRegistrations: response?.cancelledRegistrations || 0,
        waitlistedRegistrations: response?.waitlistedRegistrations || 0,
        checkInCount: response?.checkInCount || 0,
        notCheckedInCount: response?.notCheckedInCount || 0,
        noShowCount: response?.noShowCount || 0,
        revenue: response?.revenue || 0,
        registrationsByCategory: response?.registrationsByCategory || {
          general: 0,
          vip: 0,
          media: 0,
          exhibitor: 0,
          speaker: 0,
          guest: 0,
          visitor: 0,
        },
        registrationsByCity: response?.registrationsByCity || [],
        registrationsByState: response?.registrationsByState || [],
        registrationsByCountry: response?.registrationsByCountry || [],
        registrationTrend: response?.registrationTrend || [],
      });
    } catch (error) {
      console.error('Failed to load exhibition stats:', error);
      // Set default empty stats
      setStats({
        exhibitionId: selectedExhibition,
        totalRegistrations: 0,
        preRegistrations: 0,
        preRegCheckIns: 0,
        onSpotRegistrations: 0,
        onSpotCheckIns: 0,
        confirmedRegistrations: 0,
        paidRegistrations: 0,
        freeRegistrations: 0,
        cancelledRegistrations: 0,
        waitlistedRegistrations: 0,
        checkInCount: 0,
        notCheckedInCount: 0,
        noShowCount: 0,
        revenue: 0,
        registrationsByCategory: {
          general: 0,
          vip: 0,
          media: 0,
          exhibitor: 0,
          speaker: 0,
          guest: 0,
          visitor: 0,
        },
        registrationsByCity: [],
        registrationsByState: [],
        registrationsByCountry: [],
        registrationTrend: [],
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleExhibitionChange = (value: string) => {
    setSelectedExhibition(value);
    const exhibition = exhibitions.find((ex) => ex.id === value);
    setSelectedExhibitionData(exhibition || null);
  };

  const handleRefresh = () => {
    if (selectedExhibition) {
      loadExhibitionStats();
    }
  };

  // Calculate percentages
  const preRegPercentage = stats?.totalRegistrations 
    ? Math.round((stats.preRegistrations / stats.totalRegistrations) * 100)
    : 0;
  const onSpotPercentage = stats?.totalRegistrations 
    ? Math.round((stats.onSpotRegistrations / stats.totalRegistrations) * 100)
    : 0;
  const checkInPercentage = stats?.totalRegistrations 
    ? Math.round((stats.checkInCount / stats.totalRegistrations) * 100)
    : 0;

  const isPaidExhibition = selectedExhibitionData?.isPaid || false;

  // Prepare geographic chart data
  const cityData = stats && stats.registrationsByCity 
    ? stats.registrationsByCity.map(item => ({
        name: item._id || 'Unknown',
        value: item.count
      }))
    : [];

  const stateData = stats && stats.registrationsByState 
    ? stats.registrationsByState.map(item => ({
        name: item._id || 'Unknown',
        value: item.count
      }))
    : [];

  const countryData = stats && stats.registrationsByCountry 
    ? stats.registrationsByCountry.map(item => ({
        name: item._id || 'Unknown',
        value: item.count
      }))
    : [];

  return (
    <div style={{ padding: '0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
              📊 Analytics Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Comprehensive exhibition analytics and insights
            </Text>
          </div>
          
          {selectedExhibition && (
            <Tooltip title="Refresh statistics">
              <button
                onClick={handleRefresh}
                disabled={statsLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9',
                  background: '#ffffff',
                  cursor: statsLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  opacity: statsLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!statsLoading) {
                    e.currentTarget.style.borderColor = '#1890ff';
                    e.currentTarget.style.color = '#1890ff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = 'inherit';
                }}
              >
                <ReloadOutlined spin={statsLoading} />
                <span>Refresh</span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Exhibition Selector Card */}
      <Card 
        style={{ 
          marginBottom: '24px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={12}>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500 }}>
                Select Exhibition
              </Text>
            </div>
            <Select
              showSearch
              placeholder="Select an exhibition to view analytics"
              style={{ width: '100%' }}
              size="large"
              value={selectedExhibition || undefined}
              onChange={handleExhibitionChange}
              loading={loading}
              disabled={loading}
              filterOption={(input, option) =>
                (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
              }
             >
               {exhibitions.map((exhibition) => (
                 <Option key={exhibition.id} value={exhibition.id}>
                   {exhibition.name}
                 </Option>
               ))}
             </Select>
          </Col>
          
          <Col xs={24} lg={12}>
            {selectedExhibitionData ? (
              <div style={{ 
                background: 'rgba(255,255,255,0.15)', 
                padding: '16px', 
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <div>
                    <Badge 
                      color={selectedExhibitionData.isPaid ? '#faad14' : '#52c41a'} 
                      text={
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 500 }}>
                          {selectedExhibitionData.isPaid ? '💰 Paid Event' : '🆓 Free Event'}
                        </span>
                      }
                    />
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarOutlined />
                    <span>{formatDateRangeShort(selectedExhibitionData.onsiteStartDate, selectedExhibitionData.onsiteEndDate)}</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <EnvironmentOutlined />
                    <span>{selectedExhibitionData.venue}</span>
                  </div>
                </Space>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Select an exhibition to view details
                </Text>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Analytics Content */}
      {selectedExhibition ? (
        statsLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Loading analytics data...</Text>
            </div>
          </div>
        ) : stats ? (
          <>
            {/* Primary Metrics - Key Counters */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={4} style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                📈 Primary Metrics
              </Title>
              <Row gutter={[16, 16]}>
                {/* 1. Total Registrations */}
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white',
                      height: '110px',
                      transition: 'all 0.3s',
                    }}
                    styles={{ body: { padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                  >
                    <div>
                      <div style={{ marginBottom: '6px' }}>
                        <TeamOutlined style={{ fontSize: '18px', opacity: 0.9 }} />
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '2px', lineHeight: 1 }}>
                        {(stats.totalRegistrations || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                        Total Registrations
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* 2. Pre-Registrations */}
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      border: 'none',
                      color: 'white',
                      height: '110px',
                      transition: 'all 0.3s',
                    }}
                    styles={{ body: { padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                  >
                    <div>
                      <div style={{ marginBottom: '6px' }}>
                        <CalendarOutlined style={{ fontSize: '18px', opacity: 0.9 }} />
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '2px', lineHeight: 1 }}>
                        {(stats.preRegistrations || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                        Pre-Register
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', display: 'block', marginTop: '2px' }}>
                        {preRegPercentage}% of total
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* 3. Total Check-In */}
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      border: 'none',
                      color: 'white',
                      height: '110px',
                      transition: 'all 0.3s',
                    }}
                    styles={{ body: { padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                  >
                    <div>
                      <div style={{ marginBottom: '6px' }}>
                        <CheckCircleOutlined style={{ fontSize: '18px', opacity: 0.9 }} />
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '2px', lineHeight: 1 }}>
                        {(stats.checkInCount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                        Total Check-In
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', display: 'block', marginTop: '2px' }}>
                        {checkInPercentage}% attendance
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* 4. Total Not Checked-In */}
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
                      border: 'none',
                      color: 'white',
                      height: '110px',
                      transition: 'all 0.3s',
                    }}
                    styles={{ body: { padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                  >
                    <div>
                      <div style={{ marginBottom: '6px' }}>
                        <ClockCircleOutlined style={{ fontSize: '18px', opacity: 0.9 }} />
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '2px', lineHeight: 1 }}>
                        {(stats.notCheckedInCount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                        Total Not Checked-In
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', display: 'block', marginTop: '2px' }}>
                        {stats.totalRegistrations > 0 
                          ? Math.round((stats.notCheckedInCount / stats.totalRegistrations) * 100)
                          : 0}% no-show
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* 5. On-Spot Registrations */}
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
                      border: 'none',
                      color: 'white',
                      height: '110px',
                      transition: 'all 0.3s',
                    }}
                    styles={{ body: { padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                  >
                    <div>
                      <div style={{ marginBottom: '6px' }}>
                        <FireOutlined style={{ fontSize: '18px', opacity: 0.9 }} />
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '2px', lineHeight: 1 }}>
                        {(stats.onSpotRegistrations || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                        On-Spot
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', display: 'block', marginTop: '2px' }}>
                        {onSpotPercentage}% walk-ins
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* 6. Paid Registrations */}
                {isPaidExhibition && (
                  <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                    <Card
                      hoverable
                      style={{ 
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        border: 'none',
                        color: 'white',
                        height: '110px',
                        transition: 'all 0.3s',
                      }}
                      styles={{ body: { padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                      <div>
                        <div style={{ marginBottom: '6px' }}>
                          <TrophyOutlined style={{ fontSize: '18px', opacity: 0.9 }} />
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '2px', lineHeight: 1 }}>
                          {(stats.paidRegistrations || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                          Paid Registrations
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', display: 'block', marginTop: '2px' }}>
                          {stats.totalRegistrations > 0 
                            ? Math.round((stats.paidRegistrations / stats.totalRegistrations) * 100)
                            : 0}% of total
                        </Text>
                      </div>
                    </Card>
                  </Col>
                )}

                {/* 7. Free Registrations */}
                {isPaidExhibition && (
                  <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                    <Card
                      hoverable
                      style={{ 
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
                        border: 'none',
                        color: 'white',
                        height: '110px',
                        transition: 'all 0.3s',
                      }}
                      styles={{ body: { padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                      <div>
                        <div style={{ marginBottom: '6px' }}>
                          <TeamOutlined style={{ fontSize: '18px', opacity: 0.9 }} />
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '2px', lineHeight: 1 }}>
                          {(stats.freeRegistrations || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                          Free Registrations
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', display: 'block', marginTop: '2px' }}>
                          {stats.totalRegistrations > 0 
                            ? Math.round((stats.freeRegistrations / stats.totalRegistrations) * 100)
                            : 0}% of total
                        </Text>
                      </div>
                    </Card>
                  </Col>
                )}

                {/* 8. Total Revenue */}
                {isPaidExhibition && (
                  <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                    <Card
                      hoverable
                      style={{ 
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
                        border: 'none',
                        color: 'white',
                        height: '110px',
                        transition: 'all 0.3s',
                      }}
                      styles={{ body: { padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                      <div>
                        <div style={{ marginBottom: '6px' }}>
                          <DollarOutlined style={{ fontSize: '18px', opacity: 0.9 }} />
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '2px', lineHeight: 1 }}>
                          ₹{(stats.revenue || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                          Total Revenue
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', display: 'block', marginTop: '2px' }}>
                          Avg: ₹{stats.paidRegistrations > 0 
                            ? Math.round(stats.revenue / stats.paidRegistrations).toLocaleString()
                            : 0} per ticket
                        </Text>
                      </div>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>

            {/* Secondary Metrics - Check-in Breakdown */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={4} style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                🎯 Check-In Breakdown
              </Title>
              <Row gutter={[16, 16]}>
                {/* Pre-Registration Check-Ins */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{ 
                      borderRadius: '10px',
                      border: '1px solid #e8e8e8',
                      background: '#ffffff',
                      height: '100%'
                    }}
                    styles={{ body: { padding: '18px' } }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <CalendarOutlined style={{ fontSize: '26px', color: '#4facfe' }} />
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#262626', marginBottom: '2px', lineHeight: 1 }}>
                      {(stats.preRegCheckIns || 0).toLocaleString()}
                    </div>
                    <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>
                      Pre-Reg Check-Ins
                    </Text>
                    <div style={{ marginTop: '10px' }}>
                      <Progress 
                        percent={stats.preRegistrations > 0 
                          ? Math.round((stats.preRegCheckIns / stats.preRegistrations) * 100)
                          : 0
                        }
                        strokeColor="#4facfe"
                        size="small"
                      />
                      <Text style={{ color: '#8c8c8c', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                        {stats.preRegistrations > 0 
                          ? Math.round((stats.preRegCheckIns / stats.preRegistrations) * 100)
                          : 0}% of {stats.preRegistrations.toLocaleString()} pre-registered
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* On-Spot Check-Ins */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{ 
                      borderRadius: '10px',
                      border: '1px solid #e8e8e8',
                      background: '#ffffff',
                      height: '100%'
                    }}
                    styles={{ body: { padding: '18px' } }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <FireOutlined style={{ fontSize: '26px', color: '#ee0979' }} />
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#262626', marginBottom: '2px', lineHeight: 1 }}>
                      {(stats.onSpotCheckIns || 0).toLocaleString()}
                    </div>
                    <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>
                      On-Spot Check-Ins
                    </Text>
                    <div style={{ marginTop: '10px' }}>
                      <Progress 
                        percent={stats.onSpotRegistrations > 0 
                          ? Math.round((stats.onSpotCheckIns / stats.onSpotRegistrations) * 100)
                          : 0
                        }
                        strokeColor="#ee0979"
                        size="small"
                      />
                      <Text style={{ color: '#8c8c8c', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                        {stats.onSpotRegistrations > 0 
                          ? Math.round((stats.onSpotCheckIns / stats.onSpotRegistrations) * 100)
                          : 0}% of {stats.onSpotRegistrations.toLocaleString()} on-spot
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* Pre-Reg Not Checked In */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{ 
                      borderRadius: '10px',
                      border: '1px solid #e8e8e8',
                      background: '#ffffff',
                      height: '100%'
                    }}
                    styles={{ body: { padding: '18px' } }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <ClockCircleOutlined style={{ fontSize: '26px', color: '#f2994a' }} />
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#262626', marginBottom: '2px', lineHeight: 1 }}>
                      {((stats.preRegistrations || 0) - (stats.preRegCheckIns || 0)).toLocaleString()}
                    </div>
                    <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>
                      Pre-Reg No-Show
                    </Text>
                    <div style={{ marginTop: '10px' }}>
                      <Text style={{ color: '#8c8c8c', fontSize: '11px' }}>
                        Registered but didn't attend
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* On-Spot Not Checked In */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{ 
                      borderRadius: '10px',
                      border: '1px solid #e8e8e8',
                      background: '#ffffff',
                      height: '100%'
                    }}
                    styles={{ body: { padding: '18px' } }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <ClockCircleOutlined style={{ fontSize: '26px', color: '#ff6a00' }} />
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#262626', marginBottom: '2px', lineHeight: 1 }}>
                      {((stats.onSpotRegistrations || 0) - (stats.onSpotCheckIns || 0)).toLocaleString()}
                    </div>
                    <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>
                      On-Spot No-Show
                    </Text>
                    <div style={{ marginTop: '10px' }}>
                      <Text style={{ color: '#8c8c8c', fontSize: '11px' }}>
                        Registered on-site but didn't check-in
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Geographic Distribution Charts */}
            {stats.totalRegistrations > 0 && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <Title level={4} style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                    <EnvironmentOutlined style={{ marginRight: '8px' }} />
                    Geographic Distribution
                  </Title>
                  
                  {cityData.length === 0 && stateData.length === 0 && countryData.length === 0 ? (
                    <Card style={{ borderRadius: '12px' }} styles={{ body: { padding: '40px', textAlign: 'center' } }}>
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Space direction="vertical" size={8}>
                            <Text type="secondary" style={{ fontSize: '16px', fontWeight: 500 }}>
                              No Geographic Data Available
                            </Text>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                              Visitor location data (city, state, country) is not available for this exhibition.
                              <br />
                              Geographic charts will appear once visitors register with location information.
                            </Text>
                          </Space>
                        }
                      />
                    </Card>
                  ) : (
                    <Row gutter={[16, 16]}>
                      {/* City-wise Registrations */}
                      {cityData.length > 0 && (
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <EnvironmentOutlined />
                              <span>City-wise Registrations (Top 10)</span>
                            </div>
                          }
                          style={{ borderRadius: '12px' }}
                          styles={{ body: { padding: '24px' } }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={cityData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {cityData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                    )}

                    {/* State-wise Registrations */}
                    {stateData.length > 0 && (
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <EnvironmentOutlined />
                              <span>State-wise Registrations (Top 10)</span>
                            </div>
                          }
                          style={{ borderRadius: '12px' }}
                          styles={{ body: { padding: '24px' } }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={stateData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {stateData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                    )}

                    {/* Country-wise Registrations */}
                    {countryData.length > 0 && (
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <EnvironmentOutlined />
                              <span>Country-wise Registrations (Top 10)</span>
                            </div>
                          }
                          style={{ borderRadius: '12px' }}
                          styles={{ body: { padding: '24px' } }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={countryData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {countryData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                    )}
                  </Row>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <Empty description="No analytics data available" />
        )
      ) : (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size={8}>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                No Exhibition Selected
              </Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Please select an exhibition from the dropdown above to view analytics
              </Text>
            </Space>
          }
          style={{ 
            marginTop: '80px',
            padding: '40px'
          }}
        />
      )}
    </div>
  );
};

export default Analytics;
