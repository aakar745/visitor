import React, { useState, useMemo } from 'react';
import {
  Card,
  Select,
  Button,
  Table,
  Space,
  Avatar,
  Tag,
  Tooltip,
  Modal,
  Empty,
  Typography,
  Row,
  Col,
  Statistic,
  Input,
  Form,
  Switch,
  Dropdown,
  type MenuProps,
  Badge,
  Divider,
  QRCode,
  Segmented,
  Alert,
  Spin,
} from 'antd';
import { useMessage } from '../../hooks/useMessage';
import { usePermissions } from '../../hooks/usePermissions';
import { convertImageToBase64, downloadQRCode, generateQRFilename, QR_CONFIG } from '../../utils/qrCodeUtils';
import { useExhibitions } from '../../hooks/useExhibitions';
import { useExhibitorsByExhibition, useExhibitorMutations } from '../../hooks/useExhibitors';
import FileUpload from '../../components/exhibitions/FileUpload';
import { API_BASE_URL, FRONTEND_URL } from '../../constants';
import {
  PlusOutlined,
  LinkOutlined,
  QrcodeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  MoreOutlined,
  UserOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  DownloadOutlined,
  TeamOutlined,
  TrophyOutlined,
  FireOutlined,
  StopOutlined,
  BarChartOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Exhibitor } from '../../types/exhibitors';
import './ExhibitorLinks.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Get backend URL from API_BASE_URL (remove /api/v1 suffix)
const BACKEND_URL = API_BASE_URL.replace(/\/api\/v\d+$/, '');

const ExhibitorLinks: React.FC = () => {
  const message = useMessage();
  const { hasPermission } = usePermissions();
  const [selectedExhibition, setSelectedExhibition] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedExhibitorForQR, setSelectedExhibitorForQR] = useState<Exhibitor | null>(null);
  const [editingExhibitor, setEditingExhibitor] = useState<Exhibitor | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [qrLogoBase64, setQrLogoBase64] = useState<string | undefined>();
  const [form] = Form.useForm();

  // Get exhibitor mutations
  const { 
    createExhibitor, 
    updateExhibitor, 
    deleteExhibitor,
    isCreating,
    isUpdating,
    isDeleting
  } = useExhibitorMutations();

  // Fetch real data from API
  const { data: exhibitionsData } = useExhibitions({
    page: 1,
    limit: 100,
    sortBy: 'startDate',
    sortOrder: 'desc',
  });

  const { data: exhibitorsData, isLoading: isLoadingExhibitors } = useExhibitorsByExhibition(
    selectedExhibition || '',
    selectedExhibition ? {
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } : undefined
  );

  const exhibitions = exhibitionsData?.data || [];
  const exhibitors: Exhibitor[] = exhibitorsData?.data || [];

  // Filter and search exhibitors
  const filteredExhibitors = useMemo(() => {
    return exhibitors.filter((exhibitor) => {
      // Status filter
      if (statusFilter === 'active' && !exhibitor.isActive) return false;
      if (statusFilter === 'inactive' && exhibitor.isActive) return false;

      // Search filter
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          exhibitor.name.toLowerCase().includes(search) ||
          exhibitor.companyName.toLowerCase().includes(search) ||
          exhibitor.slug.toLowerCase().includes(search) ||
          (exhibitor.boothNumber && exhibitor.boothNumber.toLowerCase().includes(search))
        );
      }

      return true;
    });
  }, [exhibitors, searchText, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalExhibitors = exhibitors.length;
    const activeExhibitors = exhibitors.filter((e) => e.isActive).length;
    const totalRegistrations = exhibitors.reduce((sum, e) => sum + e.totalRegistrations, 0);
    const topPerformer = exhibitors.length > 0 
      ? exhibitors.reduce((prev, current) => 
          (prev.totalRegistrations > current.totalRegistrations) ? prev : current
        )
      : null;

    return {
      totalExhibitors,
      activeExhibitors,
      inactiveExhibitors: totalExhibitors - activeExhibitors,
      totalRegistrations,
      topPerformer,
      avgRegistrationsPerExhibitor: totalExhibitors > 0 
        ? (totalRegistrations / totalExhibitors).toFixed(1)
        : '0',
    };
  }, [exhibitors]);


  const handleAddExhibitor = () => {
    setEditingExhibitor(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditExhibitor = (exhibitor: Exhibitor) => {
    console.log('Editing exhibitor:', exhibitor);
    setEditingExhibitor(exhibitor);
    
    // Handle logo - ensure it's a string, not an object
    const logoValue = typeof exhibitor.logo === 'string' ? exhibitor.logo : '';
    setLogoUrl(logoValue || undefined);
    
    form.setFieldsValue({
      name: exhibitor.name,
      companyName: exhibitor.companyName,
      slug: exhibitor.slug,
      boothNumber: exhibitor.boothNumber,
      isActive: exhibitor.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDeleteExhibitor = async (id: string) => {
    await deleteExhibitor.mutateAsync(id);
  };

  const handleSaveExhibitor = async (values: any) => {
    try {
      // Ensure logo is a string or undefined, not an object
      const sanitizedLogo = typeof logoUrl === 'string' && logoUrl.trim() !== '' 
        ? logoUrl.trim() 
        : undefined;

      // Add logo URL to values
      const dataToSave = {
        ...values,
        logo: sanitizedLogo,
      };

      if (editingExhibitor) {
        // Update existing exhibitor
        const exhibitorId = editingExhibitor.id || (editingExhibitor as any)._id;
        console.log('Updating exhibitor with ID:', exhibitorId);
        console.log('Data to save:', dataToSave);
        
        if (!exhibitorId) {
          message.error('Invalid exhibitor ID');
          return;
        }
        
        await updateExhibitor.mutateAsync({ id: exhibitorId, data: dataToSave });
      } else {
        // Create new exhibitor
        if (!selectedExhibition) {
          message.error('Please select an exhibition first');
          return;
        }
        await createExhibitor.mutateAsync({ ...dataToSave, exhibitionId: selectedExhibition });
      }
      setIsModalOpen(false);
      form.resetFields();
      setLogoUrl(undefined);
    } catch (error) {
      // Error messages are handled by the mutation hook
      console.error('Save error:', error);
    }
  };

  const handleCopyLink = (exhibitor: Exhibitor) => {
    const exhibition = exhibitions.find(e => {
      const exhibitionId = e.id || (e as any)._id;
      return exhibitionId === exhibitor.exhibitionId;
    });
    if (exhibition) {
      // Co-branded exhibitor link: /[exhibition-slug]/[exhibitor-slug]
      const link = `${FRONTEND_URL}/${exhibition.slug}/${exhibitor.slug}`;
      navigator.clipboard.writeText(link);
      message.success('Link copied to clipboard!');
    }
  };

  /**
   * FIX: QR Code generation with proper error handling and loading state
   * - Memory leak fixes
   * - Image validation
   * - Loading indicator
   * - Size standardized to 500x500
   */
  const [qrLoading, setQrLoading] = useState(false);

  const handleGenerateQR = async (exhibitor: Exhibitor) => {
    setSelectedExhibitorForQR(exhibitor);
    setQrLogoBase64(undefined);
    setQrLoading(true);
    setQrModalVisible(true);
    
    // Convert logo to base64 if it exists
    if (exhibitor.logo) {
      try {
        const logoFullUrl = getLogoUrl(exhibitor.logo);
        
        if (logoFullUrl) {
          // Use utility function with validation
          const base64Logo = await convertImageToBase64(logoFullUrl, {
            onProgress: (progress) => {
              console.log(`Loading exhibitor logo: ${progress.toFixed(0)}%`);
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
    if (!selectedExhibitorForQR) return;
    
    // Download from high-res container (500x500)
    const result = downloadQRCode(
      'exhibitor-qr-code-display',       // Fallback to display
      'exhibitor-qr-code-download',      // Use high-res for download
      generateQRFilename(selectedExhibitorForQR.slug, 'exhibitor-qr')
    );

    if (result.success) {
      message.success('QR Code downloaded successfully! (500x500 high resolution)');
    } else {
      message.error(result.error || 'Failed to download QR Code');
    }
  };

  const toggleExhibitorStatus = async (exhibitor: Exhibitor) => {
    try {
      const exhibitorId = exhibitor.id || (exhibitor as any)._id;
      await updateExhibitor.mutateAsync({
        id: exhibitorId,
        data: { isActive: !exhibitor.isActive },
      });
      message.success(`Exhibitor ${exhibitor.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      message.error('Failed to update exhibitor status');
    }
  };

  const getActionMenu = (exhibitor: Exhibitor): MenuProps => {
    const items: any[] = [];
    const hasRegistrations = (exhibitor.totalRegistrations || 0) > 0;

    // Copy Link - Requires exhibitors.view
    if (hasPermission('exhibitors.view')) {
      items.push({
        key: 'copy',
        icon: <CopyOutlined />,
        label: 'Copy Link',
        onClick: () => handleCopyLink(exhibitor),
      });
    }

    // QR Code - Requires exhibitors.qrcode
    if (hasPermission('exhibitors.qrcode')) {
      items.push({
        key: 'qr',
        icon: <QrcodeOutlined />,
        label: 'Download QR Code',
        onClick: () => handleGenerateQR(exhibitor),
      });
    }

    // Edit - Requires exhibitors.update
    if (hasPermission('exhibitors.update')) {
      items.push({
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
        onClick: () => handleEditExhibitor(exhibitor),
      });
    }

    // Add divider if we have items and delete permission
    if (items.length > 0 && hasPermission('exhibitors.delete')) {
      items.push({
        type: 'divider',
      });
    }

    // Delete - Requires exhibitors.delete and no registrations exist
    if (hasPermission('exhibitors.delete')) {
      const exhibitorId = exhibitor.id || (exhibitor as any)._id;
      
      if (hasRegistrations) {
        items.push({
          key: 'delete-locked',
          icon: <DeleteOutlined />,
          label: (
            <Tooltip title={`Cannot delete: ${exhibitor.totalRegistrations} registration(s) exist. Deactivate the exhibitor instead.`}>
              <span style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                Delete 🔒
              </span>
            </Tooltip>
          ),
          danger: true,
          disabled: true,
        });
      } else {
        items.push({
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Delete',
          danger: true,
          onClick: () => {
            Modal.confirm({
              title: 'Delete Exhibitor',
              content: `Are you sure you want to delete "${exhibitor.name}"? This action cannot be undone.`,
              okText: 'Delete',
              okType: 'danger',
              cancelText: 'Cancel',
              onOk: () => handleDeleteExhibitor(exhibitorId),
            });
          },
        });
      }
    }

    return { items };
  };

  const columns: ColumnsType<Exhibitor> = [
    {
      title: 'Exhibitor',
      key: 'exhibitor',
      fixed: 'left',
      width: 300,
      render: (_, record) => (
        <Space>
          <Badge
            count={record.totalRegistrations === stats.topPerformer?.totalRegistrations && record.totalRegistrations > 0 ? <TrophyOutlined style={{ color: '#faad14' }} /> : 0}
          >
            <Avatar
              size={48}
              src={record.logo}
              icon={<UserOutlined />}
              className="exhibitor-avatar-large"
            />
          </Badge>
          <div>
            <Space>
              <Text strong style={{ display: 'block' }}>{record.name}</Text>
              {record.totalRegistrations > 10 && (
                <Tooltip title="High Performance">
                  <FireOutlined style={{ color: '#ff4d4f', fontSize: '14px' }} />
                </Tooltip>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              {record.companyName}
            </Text>
            {record.boothNumber && (
              <Tag color="blue" style={{ fontSize: '11px', marginTop: '4px' }}>
                Booth: {record.boothNumber}
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Registration Link',
      key: 'link',
      width: 350,
      render: (_, record) => {
        const exhibition = exhibitions.find(e => {
          const exhibitionId = e.id || (e as any)._id;
          return exhibitionId === record.exhibitionId;
        });
        // Co-branded exhibitor link format
        const link = exhibition ? `/${exhibition.slug}/${record.slug}` : '';
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div className="exhibitor-link-cell">
              <LinkOutlined style={{ marginRight: '6px' }} />
              {link}
            </div>
            <Space size="small">
              <Button
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyLink(record)}
              >
                Copy Link
              </Button>
              <Button
                type="link"
                size="small"
                icon={<QrcodeOutlined />}
                onClick={() => handleGenerateQR(record)}
              >
                QR Code
              </Button>
            </Space>
          </Space>
        );
      },
    },
    {
      title: 'Registrations',
      dataIndex: 'totalRegistrations',
      key: 'registrations',
      align: 'center',
      width: 150,
      render: (count, record) => {
        const isTopPerformer = count === stats.topPerformer?.totalRegistrations && count > 0;
        const hasRegistrations = count > 0;
        return (
          <Space direction="vertical" align="center" size={4}>
            <div>
              <Text strong style={{ fontSize: '20px', color: isTopPerformer ? '#faad14' : '#1890ff' }}>
                {count}
              </Text>
              {hasRegistrations && (
                <Tooltip title="Exhibitor is locked - has registrations. Cannot be deleted.">
                  <LockOutlined style={{ marginLeft: '6px', fontSize: '14px', color: '#faad14' }} />
                </Tooltip>
              )}
            </div>
            {isTopPerformer && (
              <Tag className="top-performer-badge" icon={<TrophyOutlined />}>
                Top Performer
              </Tag>
            )}
          </Space>
        );
      },
      sorter: (a, b) => a.totalRegistrations - b.totalRegistrations,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      align: 'center',
      width: 120,
      render: (isActive, record) => (
        <Tooltip title={`Click to ${isActive ? 'deactivate' : 'activate'}`}>
          <Tag
            icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
            color={isActive ? 'success' : 'default'}
            style={{ cursor: 'pointer', padding: '4px 12px' }}
            onClick={() => toggleExhibitorStatus(record)}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      fixed: 'right',
      width: 150,
      render: (_, record) => {
        const actionMenu = getActionMenu(record);
        const hasMenuItems = actionMenu.items && actionMenu.items.length > 0;
        const canCopyLink = hasPermission('exhibitors.view');
        const canEdit = hasPermission('exhibitors.update');

        // If user has NO permissions at all, show empty space
        if (!canCopyLink && !canEdit && !hasMenuItems) {
          return <Text type="secondary">No actions</Text>;
        }

        return (
          <Space size="small">
            {canCopyLink && (
              <Tooltip title="Copy Link">
                <Button
                  type="primary"
                  ghost
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyLink(record)}
                />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title="Edit">
                <Button
                  type="default"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditExhibitor(record)}
                />
              </Tooltip>
            )}
            {hasMenuItems && (
              <Dropdown menu={actionMenu} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  const getRegistrationLink = (exhibitor: Exhibitor) => {
    const exhibition = exhibitions.find(e => {
      const exhibitionId = e.id || (e as any)._id;
      return exhibitionId === exhibitor.exhibitionId;
    });
    if (!exhibition) return '';
    // Co-branded exhibitor link format: /[exhibition-slug]/[exhibitor-slug]
    return `${FRONTEND_URL}/${exhibition.slug}/${exhibitor.slug}`;
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

  return (
    <div className="exhibitor-links-page">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
          <TeamOutlined /> Exhibitor Links
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: '15px' }}>
          Create and manage exhibitor-specific registration links with QR codes and track performance
        </Paragraph>
      </div>

      {/* Exhibition Selector */}
      <Card className="exhibitor-card" style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} lg={10}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong style={{ fontSize: '15px' }}>📊 Select Exhibition</Text>
              <Select
                size="large"
                style={{ width: '100%' }}
                placeholder="Choose an exhibition to manage exhibitors"
                value={selectedExhibition}
                onChange={(value) => {
                  setSelectedExhibition(value);
                  setSearchText('');
                  setStatusFilter('all');
                }}
                allowClear
              >
                {exhibitions.map((exhibition) => {
                  const exhibitionId = exhibition.id || (exhibition as any)._id;
                  return (
                    <Option key={exhibitionId} value={exhibitionId}>
                      {exhibition.name}
                    </Option>
                  );
                })}
              </Select>
            </Space>
          </Col>
          
          {selectedExhibition && exhibitors.length > 0 && (
            <Col xs={24} lg={14}>
              <div className="stats-grid">
                <div className="stat-card">
                  <TeamOutlined className="stat-icon" style={{ color: '#1890ff' }} />
                  <Statistic
                    title="Total Exhibitors"
                    value={stats.totalExhibitors}
                    valueStyle={{ color: '#1890ff', fontSize: '28px' }}
                  />
                </div>
                <div className="stat-card">
                  <CheckCircleOutlined className="stat-icon" style={{ color: '#52c41a' }} />
                  <Statistic
                    title="Active"
                    value={stats.activeExhibitors}
                    valueStyle={{ color: '#52c41a', fontSize: '28px' }}
                  />
                </div>
                <div className="stat-card">
                  <LinkOutlined className="stat-icon" style={{ color: '#722ed1' }} />
                  <Statistic
                    title="Total Registrations"
                    value={stats.totalRegistrations}
                    valueStyle={{ color: '#722ed1', fontSize: '28px' }}
                  />
                </div>
                <div className="stat-card">
                  <BarChartOutlined className="stat-icon" style={{ color: '#fa8c16' }} />
                  <Statistic
                    title="Avg per Exhibitor"
                    value={stats.avgRegistrationsPerExhibitor}
                    valueStyle={{ color: '#fa8c16', fontSize: '28px' }}
                  />
                </div>
              </div>
            </Col>
          )}
        </Row>

        {selectedExhibition && stats.topPerformer && stats.topPerformer.totalRegistrations > 0 && (
          <>
            <Divider />
            <Alert
              message={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14', fontSize: '18px' }} />
                  <Text strong>Top Performer:</Text>
                  <Text>{stats.topPerformer.name}</Text>
                  <Badge count={stats.topPerformer.totalRegistrations} style={{ backgroundColor: '#52c41a' }} />
                  <Text type="secondary">registrations</Text>
                </Space>
              }
              type="success"
              showIcon={false}
              style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)', border: '1px solid #ffd591' }}
            />
          </>
        )}
      </Card>

      {/* Exhibitors Table */}
      {!selectedExhibition ? (
        <Card className="exhibitor-card">
          <Empty
            description={
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: '16px' }}>No Exhibition Selected</Text>
                <Text type="secondary">Please select an exhibition above to view and manage exhibitors</Text>
              </Space>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Card
          className="exhibitor-card"
          title={
            <Space>
              <Text strong style={{ fontSize: '16px' }}>Exhibitors</Text>
              <Badge count={filteredExhibitors.length} style={{ backgroundColor: '#1890ff' }} />
            </Space>
          }
          extra={
            hasPermission('exhibitors.create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddExhibitor}
                size="large"
              >
                Add Exhibitor
              </Button>
            )
          }
        >
          {/* Search and Filter Bar */}
          {exhibitors.length > 0 && (
            <div className="search-filter-bar" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <Input
                    placeholder="Search by name, company, slug, or booth number..."
                    size="large"
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Text strong>Status:</Text>
                    <Segmented
                      options={[
                        { label: 'All', value: 'all', icon: <TeamOutlined /> },
                        { label: 'Active', value: 'active', icon: <CheckCircleOutlined /> },
                        { label: 'Inactive', value: 'inactive', icon: <StopOutlined /> },
                      ]}
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value as any)}
                    />
                  </Space>
                </Col>
              </Row>
            </div>
          )}

          <Table
            className="exhibitor-table"
            columns={columns}
            dataSource={filteredExhibitors}
            rowKey={(record) => record.id || (record as any)._id}
            loading={isDeleting || isLoadingExhibitors}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `Total ${total} exhibitors`,
            }}
            scroll={{ x: 1300 }}
            rowClassName={(record) => 
              record.isActive ? 'exhibitor-row-active' : 'exhibitor-row-inactive'
            }
            locale={{
              emptyText: (
                <Empty
                  description="No exhibitors found"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>
      )}

      {/* Add/Edit Exhibitor Modal */}
      <Modal
        title={
          <Space>
            {editingExhibitor ? <EditOutlined /> : <PlusOutlined />}
            <Text strong>{editingExhibitor ? 'Edit Exhibitor' : 'Add New Exhibitor'}</Text>
          </Space>
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setLogoUrl(undefined);
        }}
        width={600}
        okText={editingExhibitor ? 'Update' : 'Create'}
        confirmLoading={isCreating || isUpdating}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveExhibitor}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="name"
            label="Exhibitor Name"
            rules={[{ required: true, message: 'Please enter exhibitor name' }]}
          >
            <Input placeholder="e.g., XYZ Technologies" size="large" />
          </Form.Item>

          <Form.Item
            name="companyName"
            label="Company Name"
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input placeholder="e.g., XYZ Technologies Pvt Ltd" size="large" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="URL Slug"
            tooltip="Used in co-branded registration link. Auto-generated from exhibitor name."
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value="/[exhibition]/"
                disabled
                style={{ 
                  width: '120px', 
                  textAlign: 'center',
                  background: '#f5f5f5',
                  color: '#595959',
                  fontWeight: 500
                }}
              />
              <Input
                placeholder="exhibitor-slug (auto-generated)"
                size="large"
                disabled
                style={{ flex: 1 }}
              />
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="boothNumber"
            label="Booth/Stall Number"
          >
            <Input placeholder="e.g., A-101" size="large" />
          </Form.Item>

          <Form.Item
            label="Company Logo"
            tooltip="Upload exhibitor company logo (optional)"
          >
            <FileUpload
              label="Company Logo"
              type="logo"
              accept=".jpg,.jpeg,.png,.gif,.svg"
              maxSize={5}
              value={logoUrl}
              onChange={(url) => setLogoUrl(url || undefined)}
              placeholder="Click or drag logo to upload"
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Space>
              <Switch defaultChecked />
              <Text>Active (visitors can register using this link)</Text>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
        {selectedExhibitorForQR && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ fontSize: '16px', display: 'block' }}>
                  {selectedExhibitorForQR.name}
                </Text>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  {selectedExhibitorForQR.companyName}
                </Text>
                {selectedExhibitorForQR.boothNumber && (
                  <div style={{ marginTop: '6px' }}>
                    <Tag color="blue" style={{ fontSize: '12px' }}>
                      Booth: {selectedExhibitorForQR.boothNumber}
                    </Tag>
                  </div>
                )}
              </div>

              {/* Display QR Code (200x200 for UI) */}
              <div id="exhibitor-qr-code-display" style={{ 
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                display: 'inline-block',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                {qrLoading ? (
                  <div style={{ width: QR_CONFIG.DISPLAY_SIZE, height: QR_CONFIG.DISPLAY_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spin size="large" tip="Generating QR code..." />
                  </div>
                ) : (
                  <QRCode
                    value={getRegistrationLink(selectedExhibitorForQR)}
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
                id="exhibitor-qr-code-download"
                style={{ 
                  position: 'absolute',
                  left: '-9999px',
                  top: '-9999px',
                  visibility: 'hidden'
                }}
              >
                {!qrLoading && (
                  <QRCode
                    value={getRegistrationLink(selectedExhibitorForQR)}
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
                {getRegistrationLink(selectedExhibitorForQR)}
              </Paragraph>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExhibitorLinks;

