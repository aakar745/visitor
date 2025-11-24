import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  Dropdown,
  Modal,
  Tag,
  Tooltip,
  Badge,
  QRCode,
  Spin,
} from 'antd';
import './ExhibitionList.css';
import { useMessage } from '../../hooks/useMessage';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  LinkOutlined,
  QrcodeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton } from '../../components/LoadingScreen';
import StatusBadge from '../../components/exhibitions/StatusBadge';
import { convertImageToBase64, downloadQRCode, generateQRFilename, QR_CONFIG } from '../../utils/qrCodeUtils';
import type { Exhibition, ExhibitionStatus, ExhibitionFilters } from '../../types/exhibitions';
import { exhibitionService } from '../../services/exhibitions/exhibitionService';
import { getDaysText, canAcceptRegistrations, calculateExhibitionStatus } from '../../utils/exhibitionStatusHelper';
import { API_BASE_URL, FRONTEND_URL } from '../../constants';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Get backend URL from API_BASE_URL (remove /api/v1 suffix)
const BACKEND_URL = API_BASE_URL.replace(/\/api\/v\d+$/, '');

const ExhibitionList: React.FC = () => {
  const navigate = useNavigate();
  const message = useMessage();
  const [loading, setLoading] = useState(false);
  const [allExhibitions, setAllExhibitions] = useState<Exhibition[]>([]);
  const [filters, setFilters] = useState<ExhibitionFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedExhibitionForQR, setSelectedExhibitionForQR] = useState<Exhibition | null>(null);
  const [qrLogoBase64, setQrLogoBase64] = useState<string | undefined>();

  // Load exhibitions data
  React.useEffect(() => {
    loadExhibitions();
  }, [filters.isPaid, searchTerm]); // Only reload from backend when isPaid or search changes

  const loadExhibitions = async () => {
    try {
      setLoading(true);
      const response = await exhibitionService.getExhibitions({
        page: 1,
        limit: 500, // Fetch all for client-side filtering (backend max is 500)
        filters: {
          isPaid: filters.isPaid,
          search: searchTerm || undefined,
          // Don't send status filter to backend
        }
      });
      setAllExhibitions(response.data || []);
    } catch (error) {
      message.error('Failed to load exhibitions');
      setAllExhibitions([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering by computed status
  const filteredExhibitions = React.useMemo(() => {
    let filtered = [...allExhibitions];

    // Filter by computed status (client-side)
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(exhibition => {
        const statusCalc = calculateExhibitionStatus(exhibition);
        return filters.status?.includes(statusCalc.computed);
      });
    }

    return filtered;
  }, [allExhibitions, filters.status]);

  // Client-side pagination
  const paginatedExhibitions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredExhibitions.slice(startIndex, endIndex);
  }, [filteredExhibitions, currentPage, pageSize]);

  const totalItems = filteredExhibitions.length;

  const handleStatusUpdate = async (id: string, status: ExhibitionStatus) => {
    try {
      await exhibitionService.updateExhibitionStatus(id, status);
      message.success('Exhibition status updated successfully');
      loadExhibitions();
    } catch (error) {
      message.error('Failed to update exhibition status');
    }
  };

  const handleDuplicate = async (exhibition: Exhibition) => {
    try {
      const exhibitionId = exhibition.id || (exhibition as any)._id;
      await exhibitionService.duplicateExhibition(exhibitionId, `${exhibition.name} (Copy)`);
      message.success('Exhibition duplicated successfully');
      loadExhibitions();
    } catch (error) {
      message.error('Failed to duplicate exhibition');
    }
  };

  const handleDelete = (exhibition: Exhibition) => {
    Modal.confirm({
      title: 'Delete Exhibition',
      content: `Are you sure you want to delete "${exhibition.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const exhibitionId = exhibition.id || (exhibition as any)._id;
          await exhibitionService.deleteExhibition(exhibitionId);
          message.success('Exhibition deleted successfully');
          loadExhibitions();
        } catch (error) {
          message.error('Failed to delete exhibition');
        }
      }
    });
  };

  const getRegistrationLink = (exhibition: Exhibition) => {
    return `${FRONTEND_URL}/${exhibition.slug}`;
  };

  const getLogoUrl = (logoPath: string | undefined) => {
    if (!logoPath) return undefined;
    
    // If already absolute URL or blob, return as is
    if (logoPath.startsWith('http') || logoPath.startsWith('blob:') || logoPath.startsWith('data:')) {
      return logoPath;
    }
    
    // Convert relative path to absolute backend URL
    const fullUrl = logoPath.startsWith('/') ? `${BACKEND_URL}${logoPath}` : `${BACKEND_URL}/${logoPath}`;
    
    console.log('Logo URL:', fullUrl);
    return fullUrl;
  };

  const handleCopyLink = (exhibition: Exhibition) => {
    const link = getRegistrationLink(exhibition);
    navigator.clipboard.writeText(link);
    message.success('Registration link copied to clipboard!');
  };

  /**
   * FIX: QR Code generation with proper error handling and loading state
   * - Memory leak fixes
   * - Image validation
   * - Loading indicator
   * - Size standardized to 500x500
   */
  const [qrLoading, setQrLoading] = useState(false);

  const handleShowQR = async (exhibition: Exhibition) => {
    setSelectedExhibitionForQR(exhibition);
    setQrLogoBase64(undefined);
    setQrLoading(true);
    setQrModalVisible(true);
    
    // Convert logo to base64 if it exists
    if (exhibition.exhibitionLogo) {
      try {
        const logoFullUrl = getLogoUrl(exhibition.exhibitionLogo);
        
        if (logoFullUrl) {
          // Use utility function with validation
          const base64Logo = await convertImageToBase64(logoFullUrl, {
            onProgress: (progress) => {
              console.log(`Loading logo: ${progress.toFixed(0)}%`);
            },
          });
          setQrLogoBase64(base64Logo);
        }
      } catch (error) {
        console.error('Failed to convert logo:', error);
        message.warning(
          error instanceof Error 
            ? error.message 
            : 'Logo could not be loaded. QR code will be generated without logo.'
        );
        setQrLogoBase64(undefined);
      }
    }
    
    setQrLoading(false);
  };

  const handleDownloadQR = () => {
    if (!selectedExhibitionForQR) return;
    
    // Download from high-res container (500x500)
    const result = downloadQRCode(
      'exhibition-qr-code-display',      // Fallback to display
      'exhibition-qr-code-download',     // Use high-res for download
      generateQRFilename(selectedExhibitionForQR.slug, 'registration')
    );

    if (result.success) {
      message.success('QR Code downloaded successfully! (500x500 high resolution)');
    } else {
      message.error(result.error || 'Failed to download QR Code');
    }
  };

  // Action menu for each exhibition
  const getActionMenu = (exhibition: Exhibition) => {
    const isDraft = exhibition.status === 'draft';
    // Handle both id and _id (backend returns _id, frontend type uses id)
    const exhibitionId = exhibition.id || (exhibition as any)._id;
    
    const items = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => navigate(`/exhibitions/${exhibitionId}`)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit Exhibition',
        onClick: () => navigate(`/exhibitions/edit/${exhibitionId}`)
      },
      {
        key: 'duplicate',
        icon: <CopyOutlined />,
        label: 'Duplicate',
        onClick: () => handleDuplicate(exhibition)
      },
      {
        key: 'divider-1',
        type: 'divider' as const,
      },
      {
        key: 'copy-link',
        icon: <LinkOutlined />,
        label: 'Copy Registration Link',
        onClick: () => handleCopyLink(exhibition)
      },
      {
        key: 'qr-code',
        icon: <QrcodeOutlined />,
        label: 'Show QR Code',
        onClick: () => handleShowQR(exhibition)
      },
      {
        key: 'divider-2',
        type: 'divider' as const,
      },
    ];

    // Publish/Unpublish options
    if (isDraft) {
      items.push({
        key: 'publish',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        label: 'Publish Exhibition',
        onClick: () => handleStatusUpdate(exhibitionId, 'active'),
      });
    } else {
      items.push({
        key: 'unpublish',
        icon: <ClockCircleOutlined />,
        label: 'Unpublish (Move to Draft)',
        onClick: () => handleStatusUpdate(exhibitionId, 'draft'),
      });
    }

    items.push(
      {
        key: 'divider-3',
        type: 'divider' as const,
      },
      {
        key: 'delete',
        icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
        label: 'Delete',
        onClick: () => handleDelete(exhibition)
      }
    );

    return items;
  };

  // Table columns configuration
  const columns: ColumnsType<Exhibition> = [
    {
      title: 'Exhibition',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      fixed: 'left',
      render: (name: string, record: Exhibition) => {
        const daysInfo = getDaysText(record);
        return (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Text strong style={{ fontSize: '14px' }}>{name}</Text>
              {daysInfo.type === 'ongoing' && (
                <Badge status="processing" text="Live" />
              )}
            </div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              {record.tagline}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarOutlined /> {record.venue}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: ExhibitionStatus, record: Exhibition) => {
        const regStatus = canAcceptRegistrations(record);
        return (
          <Space direction="vertical" size={4}>
            <StatusBadge status={status} exhibition={record} />
            {!regStatus.allowed && record.status !== 'draft' && (
              <Tooltip title={regStatus.reason}>
                <Tag color="red" style={{ fontSize: '10px', padding: '0 4px', margin: 0 }}>
                  🔒 Registration Closed
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Active', value: 'active' },
        { text: 'Registration Open', value: 'registration_open' },
        { text: 'Live Event', value: 'live_event' },
        { text: 'Completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 220,
      render: (_, record: Exhibition) => {
        const daysInfo = getDaysText(record);
        const regStart = new Date(record.registrationStartDate);
        const eventStart = new Date(record.onsiteStartDate);
        const eventEnd = new Date(record.onsiteEndDate);
        
        return (
          <div>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: 500, 
              marginBottom: '4px',
              color: daysInfo.type === 'ongoing' ? '#fa8c16' : daysInfo.type === 'upcoming' ? '#52c41a' : '#8c8c8c'
            }}>
              {daysInfo.text}
            </div>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
              📅 {format(eventStart, 'MMM dd')} - {format(eventEnd, 'dd, yyyy')}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
              🎫 Reg: {format(regStart, 'MMM dd, yyyy')}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Registrations',
      key: 'registrations',
      width: 120,
      align: 'center',
      render: (_, record: Exhibition) => {
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#1890ff',
              marginBottom: '4px'
            }}>
              {(record.currentRegistrations || 0).toLocaleString()}
            </div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Unlimited
            </Text>
          </div>
        );
      },
      sorter: (a, b) => (a.currentRegistrations || 0) - (b.currentRegistrations || 0),
    },
    {
      title: 'Type',
      key: 'type',
      width: 100,
      align: 'center',
      render: (_, record: Exhibition) => (
        <div style={{ textAlign: 'center' }}>
          <Tag 
            color={record.isPaid ? 'gold' : 'green'} 
            style={{ fontSize: '11px', fontWeight: 500 }}
          >
            {record.isPaid ? (
              <>
                <DollarOutlined /> Paid
              </>
            ) : (
              <>
                <CheckCircleOutlined /> Free
              </>
            )}
          </Tag>
          {record.isPaid && record.pricingTiers.length > 0 && (
            <Tooltip title={`${record.pricingTiers.length} pricing tier(s)`}>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginTop: '2px' }}>
                {record.pricingTiers.length} tier{record.pricingTiers.length > 1 ? 's' : ''}
              </Text>
            </Tooltip>
          )}
        </div>
      ),
      filters: [
        { text: 'Paid', value: true },
        { text: 'Free', value: false },
      ],
      onFilter: (value, record) => record.isPaid === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_, record: Exhibition) => (
        <Dropdown
          menu={{ items: getActionMenu(record) }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    const now = new Date();
    return {
      total: filteredExhibitions.length,
      upcoming: filteredExhibitions.filter(e => new Date(e.onsiteStartDate) > now).length,
      live: filteredExhibitions.filter(e => {
        const start = new Date(e.onsiteStartDate);
        const end = new Date(e.onsiteEndDate);
        return now >= start && now <= end;
      }).length,
      completed: filteredExhibitions.filter(e => new Date(e.onsiteEndDate) < now).length,
      totalRegistrations: filteredExhibitions.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0),
      paidExhibitions: filteredExhibitions.filter(e => e.isPaid).length,
    };
  }, [filteredExhibitions]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.status]);

  // Show loading skeleton while fetching data
  if (loading && allExhibitions.length === 0) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <Title level={2} style={{ marginBottom: '8px', color: '#1890ff' }}>
            Exhibition Management
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Create and manage exhibitions with registration, pricing, and visitor management
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => navigate('/exhibitions/create')}
          style={{ height: '44px', borderRadius: '8px', fontWeight: 500 }}
        >
          Create Exhibition
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title={<Text style={{ fontSize: '13px', color: '#8c8c8c' }}>Total Exhibitions</Text>}
              value={stats.total}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title={<Text style={{ fontSize: '13px', color: '#8c8c8c' }}>Live Events</Text>}
              value={stats.live}
              prefix={<RocketOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title={<Text style={{ fontSize: '13px', color: '#8c8c8c' }}>Total Registrations</Text>}
              value={stats.totalRegistrations}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title={<Text style={{ fontSize: '13px', color: '#8c8c8c' }}>Paid Exhibitions</Text>}
              value={stats.paidExhibitions}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card 
        variant="borderless"
        style={{ marginBottom: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search exhibitions..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={filters.status?.[0]}
              onChange={(value) => setFilters({ ...filters, status: value ? [value] : undefined })}
              allowClear
              size="large"
            >
              <Option value="draft">📝 Draft</Option>
              <Option value="active">✅ Active</Option>
              <Option value="registration_open">🎫 Registration Open</Option>
              <Option value="live_event">🎪 Live Event</Option>
              <Option value="completed">🏁 Completed</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by type"
              style={{ width: '100%' }}
              value={filters.isPaid}
              onChange={(value) => setFilters({ ...filters, isPaid: value })}
              allowClear
              size="large"
            >
              <Option value={true}>💰 Paid</Option>
              <Option value={false}>🎁 Free</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={24} lg={6}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button icon={<FilterOutlined />} size="large">
                More Filters
              </Button>
              <Button icon={<ExportOutlined />} size="large">
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Exhibitions Table */}
      <Card 
        variant="borderless"
        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table
          columns={columns}
          dataSource={paginatedExhibitions}
          rowKey={(record) => record.id || (record as any)._id}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} exhibitions`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
            style: { marginTop: '16px' }
          }}
          scroll={{ x: 1200 }}
          size="middle"
          rowClassName={(record) => {
            const daysInfo = getDaysText(record);
            return daysInfo.type === 'ongoing' ? 'row-live-event' : '';
          }}
        />
      </Card>

      {/* QR Code Modal */}
      <Modal
        title={<Text strong>QR Code</Text>}
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setQrModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadQR}
          >
            Download
          </Button>,
        ]}
        width={400}
        centered
      >
        {selectedExhibitionForQR && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ fontSize: '16px' }}>
                  {selectedExhibitionForQR.name}
                </Text>
              </div>

              {/* Display QR Code (200x200 for UI) */}
              <div 
                id="exhibition-qr-code-display"
                style={{ 
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  display: 'inline-block',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                {qrLoading ? (
                  <div style={{ width: QR_CONFIG.DISPLAY_SIZE, height: QR_CONFIG.DISPLAY_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spin size="large" tip="Generating QR code..." />
                  </div>
                ) : (
                  <QRCode
                    value={getRegistrationLink(selectedExhibitionForQR)}
                    size={QR_CONFIG.DISPLAY_SIZE}
                    icon={qrLogoBase64 || undefined}
                    iconSize={QR_CONFIG.DISPLAY_ICON_SIZE}
                    style={{ margin: '0 auto' }}
                    errorLevel={QR_CONFIG.ERROR_LEVEL}
                    bgColor="transparent"
                    boostLevel={true}
                    bordered={false}
                    imageSettings={{
                      src: qrLogoBase64 || '',
                      height: QR_CONFIG.DISPLAY_ICON_SIZE,
                      width: QR_CONFIG.DISPLAY_ICON_SIZE,
                      excavate: true,
                      crossOrigin: 'anonymous',
                    }}
                  />
                )}
              </div>

              {/* Hidden High-Resolution QR Code (500x500 for download) */}
              <div 
                id="exhibition-qr-code-download"
                style={{ 
                  position: 'absolute',
                  left: '-9999px',
                  top: '-9999px',
                  visibility: 'hidden'
                }}
              >
                {!qrLoading && (
                  <QRCode
                    value={getRegistrationLink(selectedExhibitionForQR)}
                    size={QR_CONFIG.DOWNLOAD_SIZE}
                    icon={qrLogoBase64 || undefined}
                    iconSize={QR_CONFIG.DOWNLOAD_ICON_SIZE}
                    errorLevel={QR_CONFIG.ERROR_LEVEL}
                    bgColor="transparent"
                    boostLevel={true}
                    bordered={false}
                    imageSettings={{
                      src: qrLogoBase64 || '',
                      height: QR_CONFIG.DOWNLOAD_ICON_SIZE,
                      width: QR_CONFIG.DOWNLOAD_ICON_SIZE,
                      excavate: true,
                      crossOrigin: 'anonymous',
                    }}
                  />
                )}
              </div>

              <Paragraph
                copyable
                style={{
                  marginBottom: 0,
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                }}
              >
                {getRegistrationLink(selectedExhibitionForQR)}
              </Paragraph>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExhibitionList;
