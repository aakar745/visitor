import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Select,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  Avatar,
  Input,
  AutoComplete,
  DatePicker,
  Progress,
  Tooltip,
  Modal,
  message,
  Badge,
  Empty,
  Spin
} from 'antd';
import {
  UserOutlined,
  DownloadOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  SearchOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  ReloadOutlined,
  FilterOutlined,
  FileExcelOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDate, formatTime, formatDateRangeShort } from '../../utils/dateFormatter';
import { toBackendDate } from '../../utils/dayjs';
import { globalVisitorService } from '../../services/globalVisitorService';
import { exhibitionService } from '../../services/exhibitions/exhibitionService';
import type {
  VisitorWithRegistration,
  ExhibitionRegistrationStats
} from '../../types';
import type { Exhibition } from '../../types/exhibitions';
import { BACKEND_BASE_URL } from '../../constants';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface FilterOptions {
  exhibitionId?: string;
  status?: string;
  category?: string;
  paymentStatus?: string;
  dateRange?: { start: string; end: string };
}

const ExhibitionReports: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibition, setSelectedExhibition] = useState<string>('');
  const [visitors, setVisitors] = useState<VisitorWithRegistration[]>([]);
  
  // ✅ PAGINATION OPTIMIZATION: Server-side pagination for large datasets (lakhs of records)
  // - totalRecords: Actual count from API (not hardcoded)
  // - Backend handles pagination/filtering for performance
  // - Frontend only displays current page data
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [stats, setStats] = useState<ExhibitionRegistrationStats | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorWithRegistration | null>(null);
  const [visitorModalVisible, setVisitorModalVisible] = useState(false);

  // ✅ MeiliSearch Autocomplete State
  const [autocompleteOptions, setAutocompleteOptions] = useState<any[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [searchProcessingTime, setSearchProcessingTime] = useState<number>(0);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null); // Track selected visitor for highlighting

  // Load exhibitions on component mount
  useEffect(() => {
    loadExhibitions();
  }, []);

  // Reset page to 1 when exhibition, filters or search changes
  useEffect(() => {
    setCurrentPage(1);
    setTotalRecords(0); // Reset total count
    // Clear selected visitor when search changes manually
    if (searchTerm === '' || searchTerm.length < 3) {
      setSelectedVisitorId(null);
    }
  }, [selectedExhibition, filters, searchTerm]);

  // Load visitor data when exhibition, filters, search, or pagination change
  useEffect(() => {
    if (selectedExhibition) {
      loadVisitorData();
      loadExhibitionStats();
    }
  }, [selectedExhibition, filters, searchTerm, currentPage, pageSize]);

  // ✅ DEBOUNCED MEILISEARCH AUTOCOMPLETE - Instant search as you type
  const handleAutocompleteSearch = useCallback(
    async (value: string) => {
      if (!value || value.length < 2) {
        setAutocompleteOptions([]);
        return;
      }

      setIsAutocompleteLoading(true);
      
      // 📊 Performance tracking
      const startTime = performance.now();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 MeiliSearch Autocomplete Search Started');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📝 Query: "${value}"`);
      console.log(`🎯 Exhibition ID: ${selectedExhibition || 'All'}`);
      console.log(`⏱️  Start time: ${new Date().toLocaleTimeString()}.${Date.now() % 1000}ms`);
      
      try {
        const result = await globalVisitorService.searchVisitorsAutocomplete(
          value,
          selectedExhibition,
          20 // Show up to 20 results for better visibility
        );

        const endTime = performance.now();
        const totalTimeNum = endTime - startTime;
        const totalTime = totalTimeNum.toFixed(2);
        
        // ✅ Defensive: Check if result has expected structure
        if (!result || !result.hits) {
          console.error('❌ Invalid MeiliSearch response structure:', result);
          setAutocompleteOptions([]);
          setIsAutocompleteLoading(false);
          return;
        }
        
        setSearchProcessingTime(result.processingTimeMs || 0);
        
        // 📊 Performance results
        console.log('');
        console.log('✅ Search Results:');
        console.log(`   📦 Hits found: ${result.hits.length}`);
        console.log(`   📊 Total matches: ${result.estimatedTotalHits || result.hits.length}`);
        console.log('');
        console.log('⚡ Performance:');
        console.log(`   🔥 MeiliSearch processing: ${result.processingTimeMs}ms`);
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
        console.error('❌ MeiliSearch Autocomplete Search FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`📝 Query: "${value}"`);
        console.error(`⏱️  Time taken: ${totalTime}ms`);
        console.error('❌ Error:', errorMessage);
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('   1. Check if backend is running (port 3000)');
        console.error('   2. Check if MeiliSearch is running (port 7700)');
        console.error('   3. Check browser Network tab for failed requests');
        console.error('   4. Verify visitors are indexed: npm run sync:visitors');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        setAutocompleteOptions([]);
      } finally {
        setIsAutocompleteLoading(false);
      }
    },
    [selectedExhibition]
  );

  const loadExhibitions = async () => {
    try {
      const response = await exhibitionService.getExhibitions({
        page: 1,
        limit: 100,
        filters: { status: ['active', 'registration_open', 'live_event', 'completed'] }
      });
      setExhibitions(response.data || []);
    } catch (error) {
      message.error('Failed to load exhibitions');
      setExhibitions([]); // Ensure array is set even on error
    }
  };

  const loadVisitorData = async () => {
    if (!selectedExhibition) return;
    
    setLoading(true);
    try {
      const response = await globalVisitorService.getExhibitionRegistrations(
        selectedExhibition,
        {
          page: currentPage,
          limit: pageSize,
          search: searchTerm || undefined,
          ...filters
        }
      );
      
      // ✅ Extract total count from API response for proper pagination
      setTotalRecords(response.pagination?.total || 0);
      
      // Transform backend response to match frontend VisitorWithRegistration type
      // Backend returns: { visitor: {...}, ...registration fields }
      const transformedData = (response.data || []).map((item: any) => {
        // Get visitor data (may be nested or at root level depending on endpoint)
        const visitorSource = item.visitor || item.visitorId || item;
        
        // Extract registration-specific fields
        const registrationFields = {
          id: item._id || item.id,
          visitorId: visitorSource._id || visitorSource.id,
          exhibitionId: item.exhibitionId || item.exhibition?._id,
          registrationNumber: item.registrationNumber,
          registrationDate: item.registrationDate,
          status: item.status,
          registrationCategory: item.registrationCategory,
          selectedInterests: item.selectedInterests || [],
          customFieldData: item.customFieldData || {},
          pricingTierId: item.pricingTierId,
          amountPaid: item.amountPaid,
          paymentStatus: item.paymentStatus,
          registrationSource: item.registrationSource || 'online',
          referralSource: item.referralSource || 'direct',
          checkInTime: item.checkInTime,
          checkOutTime: item.checkOutTime,
          selectedDays: item.selectedDays || [],
          createdAt: item.createdAt || '',
          updatedAt: item.updatedAt || '',
        };

        // Create base visitor data with standard fields from visitor object
        const visitorData: any = {
          id: visitorSource._id || visitorSource.id,
          name: visitorSource.name || 'N/A',
          email: visitorSource.email || 'N/A',
          phone: visitorSource.phone || 'N/A',
          company: visitorSource.company || '-',
          designation: visitorSource.designation || '-',
          city: visitorSource.city || '-',
          state: visitorSource.state || '-',
          pincode: visitorSource.pincode || visitorSource.pin_code || '-',
          address: visitorSource.address || '-',
          country: visitorSource.country || visitorSource.Country || '-',
          totalRegistrations: visitorSource.totalRegistrations || 0,
        };

        // Add ALL other fields from visitor object (dynamic fields)
        // Exclude internal MongoDB fields
        const excludedKeys = ['_id', '__v', 'createdAt', 'updatedAt', 'totalRegistrations', 'lastRegistrationDate', 'registeredExhibitions', 'phone'];
        
        if (visitorSource && typeof visitorSource === 'object') {
          Object.keys(visitorSource).forEach((key) => {
            if (!excludedKeys.includes(key) && !visitorData.hasOwnProperty(key)) {
              visitorData[key] = visitorSource[key];
            }
          });
        }

        return {
          ...visitorData,
          registration: registrationFields,
          exhibitionName: item.exhibition?.name || item.exhibitionName,
          exhibition: item.exhibition,
          visitor: visitorSource, // Keep original for debugging
          exhibitionDates: {
            registrationStart: '',
            registrationEnd: '',
            eventStart: '',
            eventEnd: '',
          },
        };
      }) as VisitorWithRegistration[];
      
      // Debug: Log first record to verify all fields are present
      if (transformedData.length > 0) {
        console.log('[Exhibition Reports] Sample Record:', transformedData[0]);
        console.log('[Exhibition Reports] Available Fields:', Object.keys(transformedData[0]));
      }
      
      setVisitors(transformedData);
    } catch (error) {
      message.error('Failed to load visitor data');
      console.error('Load visitor data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExhibitionStats = async () => {
    if (!selectedExhibition) return;
    
    try {
      const response = await globalVisitorService.getExhibitionStats(selectedExhibition);
      // Ensure all required fields have default values
      setStats({
        exhibitionId: response?.exhibitionId || selectedExhibition,
        totalRegistrations: response?.totalRegistrations || 0,
        confirmedRegistrations: response?.confirmedRegistrations || 0,
        paidRegistrations: response?.paidRegistrations || 0,
        freeRegistrations: response?.freeRegistrations || 0,
        cancelledRegistrations: response?.cancelledRegistrations || 0,
        waitlistedRegistrations: response?.waitlistedRegistrations || 0,
        checkInCount: response?.checkInCount || 0,
        noShowCount: response?.noShowCount || 0,
        revenue: response?.revenue || 0,
        registrationsByCategory: response?.registrationsByCategory || {
          general: 0,
          vip: 0,
          media: 0,
          exhibitor: 0,
          speaker: 0,
          guest: 0,
        },
        registrationTrend: response?.registrationTrend || [],
      });
    } catch (error) {
      console.error('Failed to load exhibition stats:', error);
      // Set default stats on error
      setStats({
        exhibitionId: selectedExhibition,
        totalRegistrations: 0,
        confirmedRegistrations: 0,
        paidRegistrations: 0,
        freeRegistrations: 0,
        cancelledRegistrations: 0,
        waitlistedRegistrations: 0,
        checkInCount: 0,
        noShowCount: 0,
        revenue: 0,
        registrationsByCategory: {
          general: 0,
          vip: 0,
          media: 0,
          exhibitor: 0,
          speaker: 0,
          guest: 0,
        },
        registrationTrend: [],
      });
    }
  };

  const handleExportData = async (format: 'csv' | 'excel') => {
    if (!selectedExhibition) return;
    
    try {
      const blob = await globalVisitorService.exportExhibitionRegistrations(
        selectedExhibition,
        format,
        filters
      );
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exhibitions?.find(e => e.id === selectedExhibition)?.name || 'exhibition'}-visitors.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Failed to export data');
    }
  };

  const showVisitorDetails = (visitor: VisitorWithRegistration) => {
    setSelectedVisitor(visitor);
    setVisitorModalVisible(true);
  };

  /**
   * Download visitor badge
   * Fetches badge from backend and triggers download
   */
  const downloadBadge = async (visitor: VisitorWithRegistration) => {
    try {
      const registrationId = visitor.registration.id;
      console.log('[Badge Download] Registration ID:', registrationId);
      
      // Construct badge URL (direct static file access from backend)
      const badgeUrl = `${BACKEND_BASE_URL}/uploads/badges/${registrationId}.png`;
      console.log('[Badge Download] Badge URL:', badgeUrl);
      
      // Fetch badge as blob with proper error handling
      const response = await fetch(badgeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/png',
        },
      });
      
      console.log('[Badge Download] Response status:', response.status);
      console.log('[Badge Download] Response content-type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        console.error('[Badge Download] Failed:', response.status, response.statusText);
        message.error(`Badge not found (${response.status}). It may not have been generated yet.`);
        return;
      }
      
      // Verify content type is image
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('image')) {
        console.error('[Badge Download] Invalid content type:', contentType);
        message.error('Invalid badge file format. Please regenerate the badge.');
        return;
      }
      
      const blob = await response.blob();
      console.log('[Badge Download] Blob size:', blob.size, 'bytes');
      console.log('[Badge Download] Blob type:', blob.type);
      
      // Verify blob is valid
      if (blob.size === 0) {
        message.error('Badge file is empty. Please regenerate the badge.');
        return;
      }
      
      const blobUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `badge-${visitor.registration.registrationNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      message.success('Badge downloaded successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Badge Download] Error:', error);
      message.error('Failed to download badge: ' + errorMessage);
    }
  };

  // Get selected exhibition data
  const selectedExhibitionData = exhibitions?.find(e => e.id === selectedExhibition);

  // Check if exhibition is paid
  const isPaidExhibition = selectedExhibitionData?.isPaid;

  // Get configured fields from the exhibition's customFields
  // This determines which columns to show in the table
  const exhibitionCustomFields = React.useMemo(() => {
    return selectedExhibitionData?.customFields || [];
  }, [selectedExhibitionData]);

  // Build columns dynamically based on exhibition's configured fields
  const buildColumns = (): ColumnsType<VisitorWithRegistration> => {
    const cols: any[] = [
      // Registration Number - ALWAYS shown
      {
        title: 'Reg. Number',
        dataIndex: ['registration', 'registrationNumber'],
        key: 'registrationNumber',
        width: 140,
        fixed: 'left',
        render: (text: string) => (
          <Text strong style={{ fontSize: '11px', fontFamily: 'monospace' }}>
            {text}
          </Text>
        ),
      },
    ];

    // Map of field name variations to check for duplicates
    const fieldNameVariations: Record<string, string[]> = {
      'name': ['name', 'full_name', 'fullname', 'full-name', 'full name', 'visitor_name'],
      'email': ['email', 'e_mail', 'e-mail', 'e mail', 'email_address'],
      'phone': ['phone', 'mobile', 'phone_number', 'mobile_number', 'phone no', 'phone no.', 'contact'],
      'company': ['company', 'company_name', 'company name', 'organization'],
      'designation': ['designation', 'position', 'title', 'job_title'],
      'city': ['city'],
      'state': ['state'],
      'pincode': ['pincode', 'pin_code', 'pin code', 'postal_code', 'postal code', 'zip'],
      'address': ['address', 'full_address', 'full address', 'street_address', 'street address', 'street'],
      'country': ['country'],
    };

    // Helper to check if a field name matches any variation
    const getStandardFieldType = (fieldName: string): string | null => {
      const normalized = fieldName.toLowerCase().replace(/[\s-]/g, '_');
      for (const [standardField, variations] of Object.entries(fieldNameVariations)) {
        if (variations.includes(normalized)) {
          return standardField;
        }
      }
      return null;
    };

    // Add columns based on exhibition's custom fields
    exhibitionCustomFields.forEach((field: any) => {
      const fieldName = field.name.toLowerCase().replace(/\s+/g, '_');
      const standardFieldType = getStandardFieldType(field.name);
      
      let dataKey: string;
      
      // Determine where to read data from based on field type
      // Standard visitor fields (including variations like "Full Name") are stored in visitor profile
      // Exhibition-specific fields are stored in registration.customFieldData
      if (standardFieldType && ['name', 'email', 'phone', 'company', 'designation', 'city', 'state', 'pincode', 'address', 'country'].includes(standardFieldType)) {
        // This is a standard visitor field or its variation (like "Full Name" for name)
        // Read from visitor profile which is flattened at root level
        dataKey = `field_${fieldName}`;
        
        cols.push({
          title: field.label || field.name,
          key: dataKey,
          width: 150,
          render: (_: any, record: any) => {
            // Try multiple sources in order of priority:
            // 1. Exact field name from form (e.g., "Full Name", "Company Name")
            let value = record[field.name];
            
            // 2. Case-insensitive match (e.g., "full name" vs "Full Name")
            if (!value && value !== 0) {
              const lowerFieldName = field.name.toLowerCase();
              const recordKeys = Object.keys(record);
              const matchingKey = recordKeys.find(k => k.toLowerCase() === lowerFieldName);
              if (matchingKey) {
                value = record[matchingKey];
              }
            }
            
            // 3. Standard field name (e.g., "name" for "Full Name")
            if (!value && value !== 0 && standardFieldType) {
              value = record[standardFieldType];
            }
            
            // 4. Check customFieldData as last resort
            if (!value && value !== 0) {
              value = record.registration?.customFieldData?.[field.name];
            }
            
            if (!value && value !== 0 && value !== false) {
              return <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>;
            }
            if (Array.isArray(value)) {
              return <Text style={{ fontSize: '12px' }}>{value.join(', ')}</Text>;
            }
            return (
              <Tooltip title={String(value)}>
                <Text style={{ fontSize: '12px' }} ellipsis>
                  {String(value)}
                </Text>
              </Tooltip>
            );
          },
        });
      } else {
        // This is either:
        // 1. A global dynamic field (stored in visitor profile at root level)
        // 2. An exhibition-specific field (stored in customFieldData)
        dataKey = `custom_${fieldName}`;
        
        cols.push({
          title: field.label || field.name,
          key: dataKey,
          width: 150,
          render: (_: any, record: any) => {
            // Try multiple sources:
            // 1. Exact field name (root level - global dynamic field)
            let value = record[field.name];
            
            // 2. Case-insensitive match
            if (!value && value !== 0) {
              const lowerFieldName = field.name.toLowerCase();
              const recordKeys = Object.keys(record);
              const matchingKey = recordKeys.find(k => k.toLowerCase() === lowerFieldName);
              if (matchingKey) {
                value = record[matchingKey];
              }
            }
            
            // 3. CustomFieldData (exhibition-specific)
            if (!value && value !== 0) {
              value = record.registration?.customFieldData?.[field.name];
            }
            
            if (!value && value !== 0 && value !== false) {
              return <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>;
            }
            if (Array.isArray(value)) {
              return <Text style={{ fontSize: '12px' }}>{value.join(', ')}</Text>;
            }
            return (
              <Tooltip title={String(value)}>
                <Text style={{ fontSize: '12px' }} ellipsis>
                  {String(value)}
                </Text>
              </Tooltip>
            );
          },
        });
      }
    });

    // Interests - show if exhibition has interest options
    if (selectedExhibitionData?.interestOptions && selectedExhibitionData.interestOptions.length > 0) {
      cols.push({
        title: 'Interests',
        dataIndex: ['registration', 'selectedInterests'],
        key: 'selectedInterests',
        width: 200,
        render: (interests: string[]) => {
          if (!interests || interests.length === 0) {
            return <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>;
          }
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {interests.slice(0, 2).map((interest, index) => (
                <Tag key={index} color="purple" style={{ fontSize: '10px', margin: 0 }}>
                  {interest}
                </Tag>
              ))}
              {interests.length > 2 && (
                <Tooltip title={interests.slice(2).join(', ')}>
                  <Tag color="default" style={{ fontSize: '10px', margin: 0, cursor: 'pointer' }}>
                    +{interests.length - 2}
                  </Tag>
                </Tooltip>
              )}
            </div>
          );
        },
      });
    }

    // Category
    cols.push({
      title: 'Category',
      dataIndex: ['registration', 'registrationCategory'],
      key: 'registrationCategory',
      width: 120,
      render: (category: string) => (
        <Tag 
          color={
            category === 'general' ? 'blue' :
            category === 'exhibitor' ? 'purple' :
            category === 'vip' ? 'gold' :
            category === 'media' ? 'cyan' :
            category === 'speaker' ? 'magenta' :
            'default'
          }
          style={{ fontSize: '10px' }}
        >
          {category?.toUpperCase() || 'N/A'}
        </Tag>
      ),
    });

    // Registration Date & Time
    cols.push({
      title: 'Registration Date',
      dataIndex: ['registration', 'registrationDate'],
      key: 'registrationDate',
      width: 110,
      render: (date: string) => (
        <Text style={{ fontSize: '12px' }}>
          {date ? formatDate(date) : '-'}
        </Text>
      ),
    });

    cols.push({
      title: 'Time',
      dataIndex: ['registration', 'registrationDate'],
      key: 'time',
      width: 80,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: '11px' }}>
          {date ? formatTime(date) : '-'}
        </Text>
      ),
    });

    // Payment column - only show if exhibition is paid
    if (isPaidExhibition) {
      cols.push({
        title: 'Payment',
        key: 'payment',
        width: 140,
        render: (_: any, record: VisitorWithRegistration) => {
          if (!record.registration.pricingTierId) {
            return (
              <Tag color="green" style={{ fontSize: '11px' }}>
                🎁 Free
              </Tag>
            );
          }
          
          return (
            <div>
              <Text strong style={{ color: '#1890ff', fontSize: '13px', display: 'block' }}>
                ₹{(record.registration.amountPaid || 0).toLocaleString()}
              </Text>
              <Tag 
                color={
                  record.registration.paymentStatus === 'completed' ? 'success' :
                  record.registration.paymentStatus === 'failed' ? 'error' :
                  record.registration.paymentStatus === 'refunded' ? 'warning' : 'processing'
                }
                style={{ fontSize: '10px', marginTop: '4px' }}
              >
                {record.registration.paymentStatus?.toUpperCase() || 'PENDING'}
              </Tag>
            </div>
          );
        },
      });

      // Day-wise ticket details - show selected days if applicable
      cols.push({
        title: 'Selected Days',
        dataIndex: ['registration', 'selectedDays'],
        key: 'selectedDays',
        width: 150,
        render: (selectedDays: number[]) => {
          if (!selectedDays || selectedDays.length === 0) {
            return <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>;
          }
          
          // 0 means "All Sessions"
          if (selectedDays.includes(0)) {
            return (
              <Tag color="blue" style={{ fontSize: '10px' }}>
                All Sessions
              </Tag>
            );
          }
          
          // Show day numbers
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {selectedDays.map((day) => (
                <Tag key={day} color="cyan" style={{ fontSize: '10px', margin: 0 }}>
                  Day {day}
                </Tag>
              ))}
            </div>
          );
        },
      });
    }

    // Status
    cols.push({
      title: 'Status',
      dataIndex: ['registration', 'status'],
      key: 'status',
      width: 110,
      render: (status: string) => {
        const statusColors: Record<string, string> = {
          registered: 'processing',
          confirmed: 'success',
          cancelled: 'error',
          waitlisted: 'warning',
        };
        return (
          <Tag color={statusColors[status] || 'default'} style={{ fontSize: '10px' }}>
            {status?.toUpperCase() || 'N/A'}
          </Tag>
        );
      },
    });

    // Check-in
    cols.push({
      title: 'Check-in',
      dataIndex: ['registration', 'checkInTime'],
      key: 'checkInTime',
      width: 100,
      render: (checkInTime: string, record: VisitorWithRegistration) => {
        if (!checkInTime) {
          return <Text type="secondary" style={{ fontSize: '11px' }}>Not visited</Text>;
        }
        return (
          <div>
            <Text style={{ fontSize: '11px', color: '#52c41a' }}>
              ✅ {formatTime(checkInTime)}
            </Text>
            {record.registration.checkOutTime && (
              <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                {formatTime(record.registration.checkOutTime)}
              </div>
            )}
          </div>
        );
      },
    });

    // Actions
    cols.push({
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: VisitorWithRegistration) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showVisitorDetails(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Download Badge">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadBadge(record)}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>
        </Space>
      ),
    });

    return cols;
  };

  // Generate columns based on exhibition configuration
  const columns = React.useMemo(() => {
    const cols = buildColumns();
    
    // Debug: Log column order and field configuration
    if (exhibitionCustomFields.length > 0) {
      console.log('[Exhibition Reports] Custom Fields Order:', exhibitionCustomFields.map((f: any) => f.name));
      console.log('[Exhibition Reports] Generated Columns:', cols.map((c: any) => c.title));
    }
    
    return cols;
  }, [exhibitionCustomFields, isPaidExhibition, selectedExhibitionData]);

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* CSS for selected row highlighting and autocomplete dropdown */}
      <style>{`
        /* Selected Table Row Highlighting */
        .selected-visitor-row {
          background-color: #e6f7ff !important;
          border-left: 4px solid #1890ff !important;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
          animation: highlight-pulse 2s ease-in-out;
        }
        
        .selected-visitor-row:hover {
          background-color: #bae7ff !important;
        }
        
        @keyframes highlight-pulse {
          0%, 100% { background-color: #e6f7ff; }
          50% { background-color: #91d5ff; }
        }
        
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
      <div style={{ marginBottom: '32px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              Exhibition Reports & Analytics
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Comprehensive visitor insights and exhibition performance metrics
            </Text>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                icon={<ReloadOutlined />}
                size="middle"
                style={{ borderRadius: '6px' }}
                onClick={() => {
                  loadExhibitions();
                  if (selectedExhibition) {
                    loadVisitorData();
                    loadExhibitionStats();
                  }
                }}
              >
                Refresh Data
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Exhibition Selection Card */}
        <Card 
          style={{ 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white'
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={8}>
              <div>
                <Text strong style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '14px'
                }}>
                  🎯 SELECT EXHIBITION TO ANALYZE
                </Text>
                <Select
                  placeholder="Choose an exhibition to view reports..."
                  style={{ width: '100%' }}
                  size="large"
                  value={selectedExhibition}
                  onChange={setSelectedExhibition}
                  showSearch
                  optionLabelProp="label"
                  filterOption={(input, option) =>
                    String(option?.label || '').toLowerCase().includes(input.toLowerCase())
                  }
                  popupMatchSelectWidth={false}
                  dropdownStyle={{ borderRadius: '8px' }}
                >
                  {exhibitions?.map(exhibition => (
                    <Option 
                      key={exhibition.id} 
                      value={exhibition.id}
                      label={exhibition.name}
                    >
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{exhibition.name}</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          📅 {formatDateRangeShort(exhibition.onsiteStartDate, exhibition.onsiteEndDate)} • 📍 {exhibition.venue || 'N/A'}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} lg={16}>
              {selectedExhibitionData ? (
                <div style={{ padding: '8px 0' }}>
                  <Title level={3} style={{ margin: 0, marginBottom: '8px', color: 'white' }}>
                    {selectedExhibitionData.name}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                    {selectedExhibitionData.tagline}
                  </Text>
                  <Space size="large" wrap>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge 
                        color={selectedExhibitionData.isPaid ? '#faad14' : '#52c41a'} 
                        text={
                          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                            {selectedExhibitionData.isPaid ? '💰 Paid Event' : '🆓 Free Event'}
                          </span>
                        }
                      />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarOutlined />
                      {formatDateRangeShort(selectedExhibitionData.onsiteStartDate, selectedExhibitionData.onsiteEndDate)}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <EnvironmentOutlined />
                      {selectedExhibitionData.venue}
                    </div>
                  </Space>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                    Select an exhibition to view detailed visitor analytics and reports
                  </Text>
                </div>
              )}
            </Col>
          </Row>
        </Card>
      </div>

      {selectedExhibition && (
        <>
          {stats ? (
            <>
              {/* Beautiful Statistics Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{ 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white',
                      minHeight: '140px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                          TOTAL REGISTRATIONS
                        </Text>
                      </div>
                      <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        borderRadius: '8px', 
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TeamOutlined style={{ fontSize: '20px', color: 'white' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                      {(stats.totalRegistrations || 0).toLocaleString()}
                    </div>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                      📈 All visitor registrations
                    </Text>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{ 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      border: 'none',
                      color: 'white',
                      minHeight: '140px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                          CONFIRMED VISITORS
                        </Text>
                      </div>
                      <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        borderRadius: '8px', 
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TrophyOutlined style={{ fontSize: '20px', color: 'white' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                      {(stats.confirmedRegistrations || 0).toLocaleString()}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Progress
                        percent={stats.totalRegistrations > 0 ? Math.round(((stats.confirmedRegistrations || 0) / stats.totalRegistrations) * 100) : 0}
                        size="small"
                        showInfo={false}
                        strokeColor="rgba(255,255,255,0.8)"
                        trailColor="rgba(255,255,255,0.2)"
                      />
                    </div>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                      ✅ {stats.totalRegistrations > 0 ? Math.round(((stats.confirmedRegistrations || 0) / stats.totalRegistrations) * 100) : 0}% confirmation rate
                    </Text>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{ 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      border: 'none',
                      color: 'white',
                      minHeight: '140px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                          ACTUAL VISITORS
                        </Text>
                      </div>
                      <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        borderRadius: '8px', 
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CalendarOutlined style={{ fontSize: '20px', color: 'white' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                      {(stats.checkInCount || 0).toLocaleString()}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Progress
                        percent={stats.confirmedRegistrations > 0 ? Math.round(((stats.checkInCount || 0) / stats.confirmedRegistrations) * 100) : 0}
                        size="small"
                        showInfo={false}
                        strokeColor="rgba(255,255,255,0.8)"
                        trailColor="rgba(255,255,255,0.2)"
                      />
                    </div>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                      🎯 {stats.confirmedRegistrations > 0 ? Math.round(((stats.checkInCount || 0) / stats.confirmedRegistrations) * 100) : 0}% attendance rate
                    </Text>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{ 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      border: 'none',
                      color: 'white',
                      minHeight: '140px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                          TOTAL REVENUE
                        </Text>
                      </div>
                      <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        borderRadius: '8px', 
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <DollarOutlined style={{ fontSize: '20px', color: 'white' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                      ₹{(stats.revenue || 0).toLocaleString()}
                    </div>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                      💰 Generated from registrations
                    </Text>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', marginBottom: '32px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">Loading exhibition statistics...</Text>
              </div>
            </div>
          )}

          {/* Enhanced Filters and Export Section */}
          <Card 
            style={{ 
              marginBottom: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ margin: 0, color: '#262626', fontSize: '16px' }}>
                🔍 Filter & Export Visitor Data
              </Title>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Customize your view and export detailed reports
              </Text>
            </div>
            
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8} lg={7}>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                    🔍 Search Visitors
                  </Text>
                  {searchProcessingTime > 0 && (
                    <Tag color="success" style={{ fontSize: '10px', margin: 0 }}>
                      ⚡ {searchProcessingTime}ms
                    </Tag>
                  )}
                  {selectedVisitorId && (
                    <Tag 
                      color="blue" 
                      closable
                      onClose={() => {
                        setSelectedVisitorId(null);
                        setSearchTerm('');
                      }}
                      style={{ fontSize: '10px', margin: 0 }}
                    >
                      🎯 Visitor Selected
                    </Tag>
                  )}
                </div>
                <AutoComplete
                  options={autocompleteOptions}
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(value)}
                  onSearch={handleAutocompleteSearch}
                  onSelect={(_value, option: any) => {
                    // When user selects from dropdown, filter table and highlight the selected visitor
                    const selectedHit = option?.hit;
                    if (selectedHit) {
                      // Set search term to filter the table (use phone for precise match)
                      setSearchTerm(selectedHit.phone);
                      // Store visitor ID for row highlighting
                      setSelectedVisitorId(selectedHit.id);
                      // Reset to page 1 to ensure selected visitor is visible
                      setCurrentPage(1);
                      
                      console.log('🎯 Visitor selected from autocomplete:');
                      console.log(`   Name: ${selectedHit.name}`);
                      console.log(`   Phone: ${selectedHit.phone}`);
                      console.log(`   ID: ${selectedHit.id}`);
                    }
                  }}
                  style={{ width: '100%' }}
                  size="middle"
                  allowClear
                  dropdownStyle={{ 
                    maxHeight: '320px', 
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px',
                    padding: '4px 0'
                  }}
                  popupClassName="visitor-autocomplete-dropdown"
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
                    style={{ borderRadius: '6px' }}
                  />
                </AutoComplete>
              </Col>
              
              <Col xs={24} sm={12} md={5} lg={4}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                    Registration Status
                  </Text>
                </div>
                <Select
                  placeholder="All Status"
                  style={{ width: '100%', borderRadius: '6px' }}
                  size="middle"
                  value={filters.status}
                  onChange={(value) => setFilters({ ...filters, status: value })}
                  allowClear
                >
                  <Option value="registered">📝 Registered</Option>
                  <Option value="confirmed">✅ Confirmed</Option>
                  <Option value="cancelled">❌ Cancelled</Option>
                  <Option value="waitlisted">⏳ Waitlisted</Option>
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={6} lg={5}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                    Registration Date Range
                  </Text>
                </div>
                <RangePicker
                  style={{ width: '100%', borderRadius: '6px' }}
                  size="middle"
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setFilters({
                        ...filters,
                        dateRange: {
                          start: toBackendDate(dates[0], false), // Start of day
                          end: toBackendDate(dates[1], false)
                        }
                      });
                    } else {
                      const { dateRange, ...restFilters } = filters;
                      setFilters(restFilters);
                    }
                  }}
                />
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong style={{ fontSize: '13px', color: '#595959' }}>
                    Actions
                  </Text>
                </div>
                <Space size="small" wrap>
                  <Tooltip title="Export as Excel">
                    <Button 
                      icon={<FileExcelOutlined />}
                      onClick={() => handleExportData('excel')}
                      style={{ borderRadius: '6px', color: '#52c41a', borderColor: '#52c41a' }}
                      size="middle"
                    >
                      Excel
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export as CSV">
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={() => handleExportData('csv')}
                      style={{ borderRadius: '6px' }}
                      size="middle"
                    >
                      CSV
                    </Button>
                  </Tooltip>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => {
                      setFilters({});
                      setSearchTerm('');
                    }}
                    size="middle"
                    style={{ borderRadius: '6px' }}
                  >
                    Clear All
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Enhanced Visitor Data Table */}
          <Card
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={4} style={{ margin: 0, color: '#262626' }}>
                  📊 Visitor Registration Data
                </Title>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  {visitors.length} visitors • Updated in real-time
                </Text>
              </div>
              <Badge
                count={`${visitors.filter(v => v.registration.checkInTime && !v.registration.checkOutTime).length} Currently Active`}
                style={{ backgroundColor: '#52c41a', borderRadius: '12px' }}
              />
            </div>

            {visitors.length > 0 ? (
              <Table
                columns={columns}
                dataSource={visitors}
                rowKey={(record) => record.registration.id}
                loading={loading}
                size="middle"
                scroll={{ x: 1200 + (exhibitionCustomFields.length * 150) + (isPaidExhibition ? 290 : 0) }}
                rowClassName={(record) => 
                  record.id === selectedVisitorId ? 'selected-visitor-row' : ''
                }
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalRecords, // ✅ Use actual total from API
                  showSizeChanger: true,
                  showQuickJumper: true,
                  pageSizeOptions: ['10', '25', '50', '100', '500'], // ✅ Added 500 for large datasets
                  showTotal: (total, range) =>
                    `Showing ${range[0]}-${range[1]} of ${total.toLocaleString()} registered visitors`, // ✅ Format numbers with commas
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    if (size) {
                      setPageSize(size);
                    }
                  },
                  onShowSizeChange: (_current, size) => {
                    setCurrentPage(1); // ✅ Reset to page 1 when changing page size
                    setPageSize(size);
                  },
                  style: { marginTop: '16px' },
                  // ✅ Performance optimization: disable simple mode for large datasets
                  simple: false,
                  // ✅ Show page numbers properly for large datasets
                  showLessItems: totalRecords > 10000, // Simplify pagination for 10k+ records
                }}
                className="modern-visitor-table"
              />
            ) : !loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                        No visitor data found
                      </Text>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Try adjusting your filters or check if visitors have registered for this exhibition
                      </Text>
                    </div>
                  }
                />
              </div>
            ) : null}
          </Card>
        </>
      )}

      {/* Enhanced Visitor Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              backgroundColor: '#1890ff', 
              borderRadius: '8px', 
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserOutlined style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>Visitor Profile & Registration</span>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                Complete visitor information and exhibition data
              </div>
            </div>
          </div>
        }
        open={visitorModalVisible}
        onCancel={() => setVisitorModalVisible(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Last updated: {selectedVisitor ? formatDate(selectedVisitor.registration.updatedAt) + ' ' + formatTime(selectedVisitor.registration.updatedAt) : ''}
            </Text>
            <Button 
              type="primary" 
              onClick={() => setVisitorModalVisible(false)}
              style={{ borderRadius: '6px' }}
            >
              Close Details
            </Button>
          </div>
        }
        width={700}
        centered
        style={{ borderRadius: '12px' }}
      >
        {selectedVisitor && (
          <div style={{ padding: '8px 0' }}>
            <Row gutter={[16, 20]}>
              {/* Visitor Header Card */}
              <Col span={24}>
                <Card 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                >
                  <Row gutter={16} align="middle">
                    <Col span={4}>
                      <Avatar 
                        size={72} 
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                      />
                    </Col>
                    <Col span={20}>
                      <Title level={3} style={{ color: 'white', margin: 0, marginBottom: '8px' }}>
                        {selectedVisitor.name}
                      </Title>
                      <Space direction="vertical" size="small" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        <div><MailOutlined style={{ marginRight: '6px' }} /> {selectedVisitor.email}</div>
                        <div><PhoneOutlined style={{ marginRight: '6px' }} /> {selectedVisitor.phone}</div>
                        {selectedVisitor.company && (
                          <div><HomeOutlined style={{ marginRight: '6px' }} /> {selectedVisitor.company}</div>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              {/* Registration Details */}
              <Col span={12}>
                <Card 
                  title={<span style={{ color: '#262626', fontSize: '14px', fontWeight: 600 }}>📝 Registration Details</span>}
                  size="small"
                  style={{ height: '100%' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Category</Text>
                      <div style={{ marginTop: '4px' }}>
                        <Tag 
                          color={
                            selectedVisitor.registration.registrationCategory === 'general' ? 'blue' :
                            selectedVisitor.registration.registrationCategory === 'exhibitor' ? 'purple' :
                            selectedVisitor.registration.registrationCategory === 'vip' ? 'gold' : 'default'
                          }
                          style={{ borderRadius: '6px', fontWeight: 500 }}
                        >
                          {selectedVisitor.registration.registrationCategory.replace('_', ' ').toUpperCase()}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Registration Date</Text>
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        {formatDate(selectedVisitor.registration.registrationDate) + ' • ' + formatTime(selectedVisitor.registration.registrationDate)}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Current Status</Text>
                      <div style={{ marginTop: '4px' }}>
                        <Tag 
                          color={
                            selectedVisitor.registration.status === 'confirmed' ? 'success' :
                            selectedVisitor.registration.status === 'cancelled' ? 'error' :
                            selectedVisitor.registration.status === 'waitlisted' ? 'warning' : 'processing'
                          }
                          style={{ borderRadius: '6px', fontWeight: 500 }}
                        >
                          {selectedVisitor.registration.status.toUpperCase()}
                        </Tag>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
              
              {/* Visit Information */}
              <Col span={12}>
                <Card 
                  title={<span style={{ color: '#262626', fontSize: '14px', fontWeight: 600 }}>🎯 Visit Information</span>}
                  size="small"
                  style={{ height: '100%' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {selectedVisitor.registration.checkInTime ? (
                      <>
                        <div>
                          <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Check-in Time</Text>
                          <div style={{ fontSize: '13px', marginTop: '4px', color: '#52c41a' }}>
                            <CheckCircleOutlined style={{ marginRight: '4px' }} />
                            {formatDate(selectedVisitor.registration.checkInTime) + ' • ' + formatTime(selectedVisitor.registration.checkInTime)}
                          </div>
                        </div>
                        {selectedVisitor.registration.checkOutTime ? (
                          <div>
                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Check-out Time</Text>
                            <div style={{ fontSize: '13px', marginTop: '4px', color: '#1890ff' }}>
                              <CheckCircleOutlined style={{ marginRight: '4px' }} />
                              {formatDate(selectedVisitor.registration.checkOutTime) + ' • ' + formatTime(selectedVisitor.registration.checkOutTime)}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Tag color="processing" style={{ borderRadius: '6px' }}>
                              🔄 Currently Inside
                            </Tag>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <ClockCircleOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px', display: 'block' }} />
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                          Visitor hasn't checked in yet
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
              
              {/* Interests Section */}
              {selectedVisitor.registration.selectedInterests && selectedVisitor.registration.selectedInterests.length > 0 && (
                <Col span={24}>
                  <Card 
                    title={<span style={{ color: '#262626', fontSize: '14px', fontWeight: 600 }}>🎨 Areas of Interest</span>}
                    size="small"
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedVisitor.registration.selectedInterests?.map((interestId, index) => {
                        const interest = selectedExhibitionData?.interestOptions?.find(opt => opt.id === interestId);
                        return (
                          <Tag 
                            key={index} 
                            color="blue"
                            style={{ 
                              borderRadius: '12px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              border: 'none',
                              backgroundColor: '#e6f7ff',
                              color: '#1890ff'
                            }}
                          >
                            {interest?.name || interestId}
                          </Tag>
                        );
                      })}
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Show Empty State when no exhibition selected */}
      {!selectedExhibition && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={3} style={{ color: '#8c8c8c', margin: '16px 0 8px' }}>
                  Select Exhibition to View Reports
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Choose an exhibition from the dropdown above to view detailed visitor analytics, registration data, and export comprehensive reports.
                </Text>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};

export default ExhibitionReports;
