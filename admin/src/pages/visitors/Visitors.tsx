import React, { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  AutoComplete,
  Select,
  Typography,
  Row,
  Col,
  Tooltip,
  Modal,
  Statistic,
  message,
  Popconfirm,
  Descriptions,
  Tag,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  ExportOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CalendarOutlined,
  TeamOutlined,
  RiseOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  ClearOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import ImportVisitorsModal from '../../components/visitors/ImportVisitorsModal';
import { usePermissions } from '../../hooks/usePermissions';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/lib/table/interface';
import { 
  useGlobalVisitors,
  useGlobalVisitorMutations,
  useGlobalVisitorAnalytics 
} from '../../hooks/useGlobalVisitors';
import { formatDateForExport, formatDateTime } from '../../utils/dateFormatter';
import { globalVisitorService } from '../../services/globalVisitorService';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const Visitors: React.FC = () => {
  const { hasPermission } = usePermissions();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  // ✅ MeiliSearch Autocomplete State
  const [autocompleteOptions, setAutocompleteOptions] = useState<any[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [searchProcessingTime, setSearchProcessingTime] = useState<number>(0);

  // Fetch global visitors (Central Database - includes imports + frontend registrations)
  const { data: globalVisitorsData, isLoading, refetch } = useGlobalVisitors({
    page: currentPage,
    limit: pageSize,
    search: searchTerm || undefined,
    sortBy,
    sortOrder,
  });

  const { data: analytics } = useGlobalVisitorAnalytics();

  const { 
    deleteVisitor,
    bulkDeleteVisitors,
    deleteAllVisitors,
  } = useGlobalVisitorMutations();
  
  const visitors = Array.isArray(globalVisitorsData?.data) ? globalVisitorsData.data : [];
  const total = globalVisitorsData?.pagination?.total || 0;

  // ✅ DEBOUNCED MEILISEARCH AUTOCOMPLETE - Instant search as you type
  const handleAutocompleteSearch = useCallback(
    async (value: string) => {
      if (!value || value.length < 2) {
        setAutocompleteOptions([]);
        return;
      }

      setIsAutocompleteLoading(true);
      
      const startTime = performance.now();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 MeiliSearch Visitor Search Started');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📝 Query: "${value}"`);
      console.log(`⏱️  Start time: ${new Date().toLocaleTimeString()}.${Date.now() % 1000}ms`);
      
      try {
        const result = await globalVisitorService.searchVisitorsAutocomplete(
          value,
          undefined, // No exhibition filter - search ALL visitors
          20 // Show up to 20 results
        );

        const endTime = performance.now();
        const totalTimeNum = endTime - startTime;
        const totalTime = totalTimeNum.toFixed(2);
        
        setSearchProcessingTime(result.processingTimeMs || 0);
        
        console.log('');
        console.log('✅ Search Results:');
        console.log(`   📦 Hits found: ${result.hits.length}`);
        console.log(`   📊 Total matches: ${result.estimatedTotalHits || result.hits.length}`);
        console.log('');
        console.log('⚡ Performance:');
        console.log(`   🔥 MeiliSearch processing: ${result.processingTimeMs || 0}ms`);
        console.log(`   🌐 Network + processing: ${totalTime}ms`);
        console.log(`   ${totalTimeNum < 100 ? '✅ BLAZING FAST!' : totalTimeNum < 500 ? '✅ Fast' : '⚠️ Slow'}`);
        console.log('');
        
        if (result.hits.length > 0) {
          console.log('👥 Found visitors:');
          result.hits.forEach((hit, index) => {
            console.log(`   ${index + 1}. ${hit.name} (${hit.phone}) - ${hit.company || 'No company'}`);
          });
        } else {
          console.log('   ℹ️ No visitors found matching the query');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Transform hits to AutoComplete options with single-row compact design
        const options = result.hits.map((hit) => ({
          value: hit.id,
          label: (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '6px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}>
              {/* Name */}
              <Text strong style={{ fontSize: '13px', minWidth: '120px', flex: '0 0 auto' }}>
                {hit.name}
              </Text>
              
              {/* Divider */}
              <span style={{ color: '#d9d9d9' }}>|</span>
              
              {/* Phone */}
              {hit.phone && (
                <>
                  <Text type="secondary" style={{ fontSize: '12px', flex: '0 0 auto' }}>
                    📱 {hit.phone}
                  </Text>
                  <span style={{ color: '#d9d9d9' }}>|</span>
                </>
              )}
              
              {/* Company */}
              {hit.company && (
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px', 
                    flex: '1 1 auto',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🏢 {hit.company}
                </Text>
              )}
              
              {/* Registration Badge */}
              {hit.totalRegistrations > 1 && (
                <Tag color="blue" style={{ fontSize: '10px', margin: 0, flex: '0 0 auto' }}>
                  {hit.totalRegistrations} regs
                </Tag>
              )}
            </div>
          ),
          hit: hit, // Store full hit data
        }));

        setAutocompleteOptions(options);
      } catch (error: unknown) {
        const endTime = performance.now();
        const totalTime = (endTime - startTime).toFixed(2);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ MeiliSearch Visitor Search FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`📝 Query: "${value}"`);
        console.error(`⏱️  Time taken: ${totalTime}ms`);
        console.error('❌ Error:', errorMessage);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        setAutocompleteOptions([]);
      } finally {
        setIsAutocompleteLoading(false);
      }
    },
    []
  );

  // Row selection for bulk operations
  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    preserveSelectedRowKeys: true,
  };

  // Handle individual delete
  const handleDelete = async (id: string) => {
    try {
      await deleteVisitor.mutateAsync(id);
      setSelectedRowKeys(selectedRowKeys.filter(key => key !== id));
    } catch (error) {
      // Error is handled by mutation
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select at least one record to delete');
      return;
    }

    confirm({
      title: 'Delete Selected Visitors',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete ${selectedRowKeys.length} selected visitor(s)? This will also delete all their registrations. This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await bulkDeleteVisitors.mutateAsync(selectedRowKeys as string[]);
          setSelectedRowKeys([]);
        } catch (error) {
          // Error is handled by mutation
        }
      },
    });
  };

  // Handle delete ALL visitors
  const handleDeleteAll = () => {
    if (total === 0) {
      message.info('No visitors to delete');
      return;
    }

    // First confirmation
    confirm({
      title: '⚠️ Delete ALL Visitors',
      icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold', marginBottom: 16 }}>
            WARNING: This is a destructive operation!
          </p>
          <p>You are about to delete:</p>
          <ul style={{ marginTop: 8 }}>
            <li><strong>{total.toLocaleString()}</strong> visitors</li>
            <li><strong>ALL</strong> their exhibition registrations</li>
          </ul>
          <p style={{ color: '#ff4d4f', marginTop: 16 }}>
            This action CANNOT be undone!
          </p>
        </div>
      ),
      okText: 'Yes, I understand. Continue...',
      okType: 'danger',
      cancelText: 'Cancel',
      width: 500,
      onOk: () => {
        // Second confirmation with text input
        Modal.confirm({
          title: '🛑 Final Confirmation Required',
          icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
          content: (
            <div>
              <p style={{ marginBottom: 16 }}>
                To confirm deletion, please type <strong>DELETE ALL</strong> below:
              </p>
              <Input 
                id="delete-confirmation-input"
                placeholder="Type DELETE ALL to confirm"
                autoComplete="off"
              />
            </div>
          ),
          okText: 'Delete All Visitors',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: async () => {
            const input = document.getElementById('delete-confirmation-input') as HTMLInputElement;
            if (input?.value !== 'DELETE ALL') {
              message.error('Confirmation text does not match. Deletion cancelled.');
              return Promise.reject();
            }
            
            setIsDeletingAll(true);
            try {
              await deleteAllVisitors.mutateAsync();
              setSelectedRowKeys([]);
            } catch (error) {
              // Error is handled by mutation
            } finally {
              setIsDeletingAll(false);
            }
          },
        });
      },
    });
  };

  // Export functionality with backend streaming (CSV or Excel)
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setIsExporting(true);
      setExportFormat(format);
      
      // Show progress message for large datasets
      const formatName = format === 'csv' ? 'CSV' : 'Excel';
      const hideMessage = message.loading(
        `Exporting ${total.toLocaleString()} visitor${total === 1 ? '' : 's'} to ${formatName}... This may take a moment for large datasets.`,
        0
      );

      // Call backend export endpoint (exports ALL visitors, not just current page)
      const blob = await globalVisitorService.exportGlobalVisitors(format, {
        search: searchTerm || undefined,
        // Add other filters if needed
      });

      hideMessage();

      // Sanitize filename
      const sanitizedName = 'all-visitors'.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const extension = format === 'csv' ? 'csv' : 'xlsx';
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizedName}-${formatDateForExport(new Date())}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Successfully exported ${total.toLocaleString()} visitor${total === 1 ? '' : 's'} to ${formatName}!`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Extract dynamic global fields (excluding standard fields and internal MongoDB fields)
  const STANDARD_FIELDS = [
    '_id', '__v', 'name', 'email', 'phone', 'company', 'designation',
    'city', 'state', 'pincode', 'address', 'totalRegistrations',
    'lastRegistrationDate', 'registeredExhibitions', 'createdAt', 'updatedAt'
  ];

  const dynamicFields = React.useMemo(() => {
    const fields = new Set<string>();
    visitors.forEach((visitor: any) => {
      Object.keys(visitor).forEach(key => {
        if (!STANDARD_FIELDS.includes(key)) {
          fields.add(key);
        }
      });
    });
    return Array.from(fields).sort();
  }, [visitors]);

  const columns: ColumnsType<any> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      fixed: 'left',
      render: (name: string) => (
        <Text strong style={{ fontSize: '13px' }}>
          {name || 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (email: string) => (
        <Text style={{ fontSize: '12px' }}>
          {email || 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string) => (
        <Text style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          {phone || 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      width: 180,
      render: (company: string) => (
        <Text style={{ fontSize: '12px' }}>
          {company || '-'}
        </Text>
      ),
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 150,
      render: (designation: string) => (
        <Text type="secondary" style={{ fontSize: '11px' }}>
          {designation || '-'}
        </Text>
      ),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (city: string) => (
        <Text style={{ fontSize: '12px' }}>
          {city || '-'}
        </Text>
      ),
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 120,
      render: (state: string) => (
        <Text style={{ fontSize: '12px' }}>
          {state || '-'}
        </Text>
      ),
    },
    {
      title: 'Pincode',
      dataIndex: 'pincode',
      key: 'pincode',
      width: 100,
      render: (pincode: string) => (
        <Text style={{ fontSize: '12px' }}>
          {pincode || '-'}
        </Text>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      render: (address: string) => (
        <Tooltip title={address || 'N/A'}>
          <Text style={{ fontSize: '12px' }} ellipsis>
            {address || '-'}
          </Text>
        </Tooltip>
      ),
    },
    // Dynamically add columns for custom global fields
    ...dynamicFields.map((fieldKey) => ({
      title: fieldKey
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      dataIndex: fieldKey,
      key: `dynamic_${fieldKey}`,
      width: 150,
      render: (value: any) => {
        if (!value && value !== 0) {
          return <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>;
        }
        if (Array.isArray(value)) {
          return <Text style={{ fontSize: '12px' }}>{value.join(', ')}</Text>;
        }
        return <Text style={{ fontSize: '12px' }}>{String(value)}</Text>;
      },
    })),
    {
      title: 'Total Registrations',
      dataIndex: 'totalRegistrations',
      key: 'totalRegistrations',
      width: 150,
      sorter: true,
      align: 'center',
      render: (count: number) => (
        <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
          {count || 0}
        </Text>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: true,
      render: (date: string) => (
        <Tooltip title={formatDateTime(date)}>
          <Text style={{ fontSize: '12px', color: '#52c41a', fontWeight: 500 }}>
            {formatDateTime(date)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record: any) => {
        const canView = hasPermission('visitors.view');
        const canDelete = hasPermission('visitors.delete');
        
        // If user has no actions, show empty
        if (!canView && !canDelete) {
          return <Text type="secondary" style={{ fontSize: '12px' }}>No actions</Text>;
        }

        return (
          <Space size="small">
            {canView && (
              <Tooltip title="View Details">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => {
                    setSelectedVisitor(record);
                    setDetailsModalVisible(true);
                  }}
                  style={{ color: '#1890ff' }}
                />
              </Tooltip>
            )}
            {canDelete && (
              <Popconfirm
                title="Delete Visitor"
                description="Are you sure? This will delete the visitor and all their registrations."
                onConfirm={() => handleDelete(record._id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete Visitor">
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deleteVisitor.isPending}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* CSS for autocomplete dropdown */}
      <style>{`
        /* Autocomplete Dropdown Styling */
        .visitor-autocomplete-dropdown .ant-select-item {
          padding: 0 !important;
          border-radius: 6px;
          margin: 2px 8px;
          transition: all 0.2s ease;
        }
        
        .visitor-autocomplete-dropdown .ant-select-item:hover {
          background-color: #f0f9ff !important;
          border-left: 3px solid #1890ff;
          padding-left: 5px !important;
        }
        
        .visitor-autocomplete-dropdown .ant-select-item-option-selected {
          background-color: #e6f7ff !important;
          border-left: 3px solid #1890ff;
        }
        
        /* Smooth scrollbar for dropdown */
        .visitor-autocomplete-dropdown .rc-virtual-list-scrollbar {
          width: 6px !important;
        }
        
        .visitor-autocomplete-dropdown .rc-virtual-list-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2) !important;
          border-radius: 3px !important;
        }
        
        .visitor-autocomplete-dropdown .rc-virtual-list-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
      
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#262626', fontSize: '28px' }}>
              📁 All Visitors (Central Database)
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Centralized visitor database from imports & registrations
            </Text>
          </Col>
          <Col>
            <Space size="middle">
              {hasPermission('visitors.import') && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  size="middle"
                  onClick={() => setImportModalVisible(true)}
                  style={{ borderRadius: '6px' }}
                >
                  Import Visitors (CSV/Excel)
                </Button>
              )}
              <Tooltip title="Refresh Data">
                <Button
                  icon={<ReloadOutlined />}
                  size="middle"
                  onClick={() => refetch()}
                  loading={isLoading}
                  style={{ borderRadius: '6px' }}
                >
                  Refresh
                </Button>
              </Tooltip>
              {hasPermission('visitors.export') && (
                <Space.Compact>
                  <Button
                    icon={<ExportOutlined />}
                    size="middle"
                    onClick={() => handleExport('csv')}
                    loading={isExporting && exportFormat === 'csv'}
                    disabled={visitors.length === 0 || isExporting}
                  >
                    Export CSV
                  </Button>
                  <Button
                    icon={<ExportOutlined />}
                    size="middle"
                    onClick={() => handleExport('excel')}
                    loading={isExporting && exportFormat === 'excel'}
                    disabled={visitors.length === 0 || isExporting}
                  >
                    Export Excel
                  </Button>
                </Space.Compact>
              )}
              {hasPermission('visitors.bulk') && selectedRowKeys.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="middle"
                  onClick={handleBulkDelete}
                  loading={bulkDeleteVisitors.isPending}
                  style={{ borderRadius: '6px' }}
                >
                  Delete ({selectedRowKeys.length})
                </Button>
              )}
              {hasPermission('visitors.delete_all') && total > 0 && (
                <Tooltip title="Delete ALL visitors and their registrations">
                  <Button
                    danger
                    type="primary"
                    icon={<ClearOutlined />}
                    size="middle"
                    onClick={handleDeleteAll}
                    loading={isDeletingAll || deleteAllVisitors.isPending}
                    style={{ borderRadius: '6px' }}
                  >
                    Delete All ({total.toLocaleString()})
                  </Button>
                </Tooltip>
              )}
            </Space>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              loading={!analytics}
              style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 500 }}>Total Visitors</span>}
                value={analytics?.totalUniqueVisitors || 0}
                valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                prefix={<TeamOutlined />}
              />
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                Unique visitors in database
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              loading={!analytics}
              style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(240,147,251,0.4)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 500 }}>This Month</span>}
                value={analytics?.newVisitors || 0}
                valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                prefix={<CalendarOutlined />}
              />
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RiseOutlined />
                New visitors registered
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              loading={!analytics}
              style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(79,172,254,0.4)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 500 }}>Total Registrations</span>}
                value={total}
                valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                prefix="🎫"
              />
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                Across all exhibitions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(250,112,154,0.4)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 500 }}>Selected</span>}
                value={selectedRowKeys.length}
                valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                prefix="✓"
              />
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                Records selected
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Filters Section */}
      <Card 
        style={{ 
          marginBottom: '24px', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={10} lg={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                🔍 Search
              </Text>
              {searchProcessingTime > 0 && (
                <Tag color="success" style={{ fontSize: '10px', marginLeft: '8px' }}>
                  ⚡ {searchProcessingTime}ms
                </Tag>
              )}
            </div>
            <AutoComplete
              options={autocompleteOptions}
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              onSearch={handleAutocompleteSearch}
              onSelect={(_value, option: any) => {
                // When user selects from dropdown, set search term to phone for precise match
                const selectedHit = option?.hit;
                if (selectedHit) {
                  setSearchTerm(selectedHit.phone);
                  setCurrentPage(1);
                  
                  console.log('🎯 Visitor selected from autocomplete:');
                  console.log(`   Name: ${selectedHit.name}`);
                  console.log(`   Phone: ${selectedHit.phone}`);
                  console.log(`   ID: ${selectedHit.id}`);
                }
              }}
              style={{ width: '100%' }}
              allowClear
              styles={{
                popup: {
                  root: {
                    maxHeight: '320px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px',
                    padding: '4px 0'
                  }
                }
              }}
              classNames={{
                popup: {
                  root: 'visitor-autocomplete-dropdown'
                }
              }}
              notFoundContent={
                isAutocompleteLoading ? (
                  <div style={{ textAlign: 'center', padding: '12px' }}>
                    <Spin size="small" /> Searching...
                  </div>
                ) : searchTerm && searchTerm.length >= 2 ? (
                  <div style={{ textAlign: 'center', padding: '12px', color: '#8c8c8c' }}>
                    No visitors found
                  </div>
                ) : null
              }
            >
              <Input
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                suffix={
                  isAutocompleteLoading && (
                    <Spin size="small" />
                  )
                }
                placeholder="Search by name, mobile, email, or company..."
                style={{ borderRadius: '8px' }}
                size="large"
              />
            </AutoComplete>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                📊 Sort By
              </Text>
            </div>
            <Select
              value={sortBy}
              onChange={(value) => setSortBy(value)}
              style={{ width: '100%' }}
              size="large"
              styles={{
                popup: {
                  root: {}
                }
              }}
            >
              <Option value="createdAt">Created Date</Option>
              <Option value="name">Name</Option>
              <Option value="totalRegistrations">Total Registrations</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                ⬆️ Order
              </Text>
            </div>
            <Select
              value={sortOrder}
              onChange={(value) => setSortOrder(value)}
              style={{ width: '100%' }}
              size="large"
              styles={{
                popup: {
                  root: {}
                }
              }}
            >
              <Option value="desc">Descending</Option>
              <Option value="asc">Ascending</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              size="large"
              style={{ borderRadius: '8px', width: '100%' }}
              onClick={() => {
                setSearchTerm('');
                setSortBy('createdAt');
                setSortOrder('desc');
                setCurrentPage(1);
                setSelectedRowKeys([]);
              }}
            >
              Clear All
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Data Table */}
      <Card
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#262626', fontSize: '18px' }}>
              All Visitors
            </Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {total.toLocaleString()} visitor(s) found
            </Text>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={visitors}
          rowKey={(record) => record._id}
          loading={isLoading || deleteVisitor.isPending || bulkDeleteVisitors.isPending}
          size="small"
          onChange={handleTableChange}
          rowSelection={rowSelection}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total.toLocaleString()} registrations`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
            style: { marginTop: '24px', marginBottom: '8px' },
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 2070 + (dynamicFields.length * 150) }}
        />
      </Card>

      {/* Import Visitors Modal */}
      <ImportVisitorsModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={() => {
          refetch();
          setImportModalVisible(false);
        }}
      />

      {/* View Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#1890ff' }} />
            <span>Visitor Details</span>
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedVisitor(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailsModalVisible(false);
              setSelectedVisitor(null);
            }}
          >
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedVisitor && (
          <div>
            {/* Basic Information */}
            <Descriptions
              title="Basic Information"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: '24px' }}
            >
              <Descriptions.Item label="Name" span={2}>
                <Text strong style={{ fontSize: '14px' }}>
                  {selectedVisitor.name || 'N/A'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedVisitor.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Text strong style={{ color: '#1890ff' }}>
                  {selectedVisitor.phone || 'N/A'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Company">
                {selectedVisitor.company || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Designation">
                {selectedVisitor.designation || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {/* Location Information */}
            <Descriptions
              title="Location"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: '24px' }}
            >
              <Descriptions.Item label="City">
                {selectedVisitor.city || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="State">
                {selectedVisitor.state || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Pincode">
                {selectedVisitor.pincode || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {selectedVisitor.address || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {/* Dynamic Fields */}
            {dynamicFields.length > 0 && (
              <Descriptions
                title="Additional Information"
                bordered
                column={2}
                size="small"
                style={{ marginBottom: '24px' }}
              >
                {dynamicFields.map((field) => (
                  <Descriptions.Item
                    key={field}
                    label={field
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  >
                    {Array.isArray(selectedVisitor[field])
                      ? selectedVisitor[field].join(', ')
                      : selectedVisitor[field] || 'N/A'}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}

            {/* Registration Summary */}
            <Descriptions
              title="Registration Summary"
              bordered
              column={2}
              size="small"
            >
              <Descriptions.Item label="Total Registrations" span={2}>
                <Tag color="blue" style={{ fontSize: '13px' }}>
                  {selectedVisitor.totalRegistrations || 0}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created Date" span={2}>
                <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                  {formatDateTime(selectedVisitor.createdAt)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Visitors;

