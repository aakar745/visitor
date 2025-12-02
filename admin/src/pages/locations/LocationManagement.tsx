import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  App,
  Popconfirm,
  Input,
  Switch,
  Row,
  Col,
  Statistic,
  Upload,
  Modal,
  Progress,
  Alert,
  Typography,
  Tooltip,
} from 'antd';

const { Text } = Typography;
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  BankOutlined,
  HomeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import locationService, { type BulkImportData } from '../../services/locationService';
import type { Country, State, City, Pincode } from '../../services/locationService';
import { usePermissions } from '../../hooks/usePermissions';
import CountryModal from './components/CountryModal';
import StateModal from './components/StateModal';
import CityModal from './components/CityModal';
import PincodeModal from './components/PincodeModal';

// Removed deprecated Search component - using Space.Compact instead

const LocationManagement: React.FC = () => {
  const { message } = App.useApp();
  const { hasPermission } = usePermissions();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [activeTab, setActiveTab] = useState('countries');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Data states
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [pincodes, setPincodes] = useState<Pincode[]>([]);

  // Pagination states
  const [countryPagination, setCountryPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [statePagination, setStatePagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [cityPagination, setCityPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [pincodePagination, setPincodePagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Selection states (for bulk delete)
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [selectedPincodeIds, setSelectedPincodeIds] = useState<string[]>([]);

  // Modal states
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [pincodeModalVisible, setPincodeModalVisible] = useState(false);

  // Edit states
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingPincode, setEditingPincode] = useState<Pincode | null>(null);

  // Bulk import states
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importData, setImportData] = useState<BulkImportData[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importStatusText, setImportStatusText] = useState('');
  const [importDetails, setImportDetails] = useState({
    countriesCreated: 0,
    statesCreated: 0,
    citiesCreated: 0,
    pincodesCreated: 0,
    pincodesSkipped: 0,
    failed: 0,
    errors: [] as string[],
  });

  // Dropdown data loading state
  const [dropdownDataLoaded, setDropdownDataLoaded] = useState(false);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  
  // Load all dropdown data on mount (for modals)
  useEffect(() => {
    loadAllDropdownData();
  }, []);

  // Reload current tab data when tab changes or search text changes
  useEffect(() => {
    // Reset pagination to page 1 when search changes
    switch (activeTab) {
      case 'countries':
        setCountryPagination({ ...countryPagination, current: 1 });
        break;
      case 'states':
        setStatePagination({ ...statePagination, current: 1 });
        break;
      case 'cities':
        setCityPagination({ ...cityPagination, current: 1 });
        break;
      case 'pincodes':
        setPincodePagination({ ...pincodePagination, current: 1 });
        break;
    }
    loadData();
  }, [activeTab, searchText]);

  // Load all data needed for dropdown selections in modals
  // Note: Dropdowns need all data, so we fetch without pagination limits
  const loadAllDropdownData = async () => {
    setDropdownDataLoaded(false);
    try {
      // Load countries (needed for StateModal dropdown) - use large limit
      const countriesData = await locationService.getCountries({ page: 1, limit: 100 });
      setCountries(Array.isArray(countriesData.data) ? countriesData.data : []);

      // Load states (needed for CityModal dropdown) - use large limit
      const statesData = await locationService.getStates({ page: 1, limit: 100 });
      setStates(Array.isArray(statesData.data) ? statesData.data : []);

      // Load cities (needed for PincodeModal dropdown) - use large limit
      const citiesData = await locationService.getCities({ page: 1, limit: 100 });
      setCities(Array.isArray(citiesData.data) ? citiesData.data : []);

      setDropdownDataLoaded(true);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      message.error('Failed to load dropdown data. Please refresh the page.');
      setDropdownDataLoaded(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'countries':
          await loadCountries();
          break;
        case 'states':
          await loadStates();
          break;
        case 'cities':
          await loadCities();
          break;
        case 'pincodes':
          await loadPincodes();
          break;
      }
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async (page = countryPagination.current, pageSize = countryPagination.pageSize) => {
    try {
      const result = await locationService.getCountries({
        page,
        limit: pageSize,
        search: searchText,
      });
      setCountries(Array.isArray(result.data) ? result.data : []);
      if (result.pagination) {
        setCountryPagination({
          current: result.pagination.page || page,
          pageSize: result.pagination.limit || pageSize,
          total: result.pagination.total || 0,
        });
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      setCountries([]);
    }
  };

  const loadStates = async (page = statePagination.current, pageSize = statePagination.pageSize) => {
    try {
      const result = await locationService.getStates({
        page,
        limit: pageSize,
        search: searchText,
      });
      setStates(Array.isArray(result.data) ? result.data : []);
      if (result.pagination) {
        setStatePagination({
          current: result.pagination.page || page,
          pageSize: result.pagination.limit || pageSize,
          total: result.pagination.total || 0,
        });
      }
    } catch (error) {
      console.error('Error loading states:', error);
      setStates([]);
    }
  };

  const loadCities = async (page = cityPagination.current, pageSize = cityPagination.pageSize) => {
    try {
      const result = await locationService.getCities({
        page,
        limit: pageSize,
        search: searchText,
      });
      setCities(Array.isArray(result.data) ? result.data : []);
      if (result.pagination) {
        setCityPagination({
          current: result.pagination.page || page,
          pageSize: result.pagination.limit || pageSize,
          total: result.pagination.total || 0,
        });
      }
      // Clear selections when page changes to avoid accidental bulk deletes across pages
      setSelectedCityIds([]);
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities([]);
    }
  };

  const loadPincodes = async (page = pincodePagination.current, pageSize = pincodePagination.pageSize) => {
    try {
      const result = await locationService.getPincodes({
        page,
        limit: pageSize,
        search: searchText,
      });
      setPincodes(Array.isArray(result.data) ? result.data : []);
      if (result.pagination) {
        setPincodePagination({
          current: result.pagination.page || page,
          pageSize: result.pagination.limit || pageSize,
          total: result.pagination.total || 0,
        });
      }
      // Clear selections when page changes to avoid accidental bulk deletes across pages
      setSelectedPincodeIds([]);
    } catch (error) {
      console.error('Error loading pincodes:', error);
      setPincodes([]);
    }
  };

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================
  const handleDelete = async (type: string, id: string) => {
    try {
      let result;
      switch (type) {
        case 'country':
          result = await locationService.deleteCountry(id);
          if (result.softDeleted) {
            message.warning(result.message || `Country deactivated (used in ${result.usageCount} registration${result.usageCount > 1 ? 's' : ''})`);
          } else {
            message.success(result.message || 'Country deleted successfully');
          }
          loadCountries();
          break;
        case 'state':
          result = await locationService.deleteState(id);
          if (result.softDeleted) {
            message.warning(result.message || `State deactivated (used in ${result.usageCount} registration${result.usageCount > 1 ? 's' : ''})`);
          } else {
            message.success(result.message || 'State deleted successfully');
          }
          loadStates();
          break;
        case 'city':
          result = await locationService.deleteCity(id);
          if (result.softDeleted) {
            message.warning(result.message || `City deactivated (used in ${result.usageCount} registration${result.usageCount > 1 ? 's' : ''})`);
          } else {
            message.success(result.message || 'City deleted successfully');
          }
          loadCities();
          break;
        case 'pincode':
          result = await locationService.deletePincode(id);
          if (result.softDeleted) {
            message.warning(result.message || `PIN code deactivated (used in ${result.usageCount} registration${result.usageCount > 1 ? 's' : ''})`);
          } else {
            message.success(result.message || 'PIN code deleted successfully');
          }
          loadPincodes();
          break;
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleActive = async (type: string, id: string, isActive: boolean) => {
    try {
      switch (type) {
        case 'country':
          await locationService.updateCountry(id, { isActive });
          loadCountries();
          break;
        case 'state':
          await locationService.updateState(id, { isActive });
          loadStates();
          break;
        case 'city':
          await locationService.updateCity(id, { isActive });
          loadCities();
          break;
        case 'pincode':
          await locationService.updatePincode(id, { isActive });
          loadPincodes();
          break;
      }
      message.success(`${isActive ? 'Activated' : 'Deactivated'} successfully`);
    } catch (error) {
      message.error('Update failed');
    }
  };

  const handleBulkDeleteCities = async () => {
    if (selectedCityIds.length === 0) {
      message.warning('Please select cities to delete');
      return;
    }

    Modal.confirm({
      title: 'Confirm Bulk Delete',
      content: `Are you sure you want to delete ${selectedCityIds.length} selected city/cities?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await locationService.bulkDeleteCities(selectedCityIds);
          
          const deleted = result.deleted || 0;
          const softDeleted = result.softDeleted || 0;
          const failed = result.failed || 0;

          if (deleted > 0 || softDeleted > 0) {
            message.success(
              `✅ ${deleted} city/cities deleted, ${softDeleted} deactivated${failed > 0 ? `, ${failed} failed` : ''}`
            );
          }
          if (failed > 0 && deleted === 0 && softDeleted === 0) {
            message.error(`❌ All ${failed} deletions failed`);
          }

          setSelectedCityIds([]);
          loadCities();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Bulk delete failed');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBulkDeletePincodes = async () => {
    if (selectedPincodeIds.length === 0) {
      message.warning('Please select pincodes to delete');
      return;
    }

    Modal.confirm({
      title: 'Confirm Bulk Delete',
      content: `Are you sure you want to delete ${selectedPincodeIds.length} selected pincode(s)?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await locationService.bulkDeletePincodes(selectedPincodeIds);
          
          const deleted = result.deleted || 0;
          const softDeleted = result.softDeleted || 0;
          const failed = result.failed || 0;

          if (deleted > 0 || softDeleted > 0) {
            message.success(
              `✅ ${deleted} pincode(s) deleted, ${softDeleted} deactivated${failed > 0 ? `, ${failed} failed` : ''}`
            );
          }
          if (failed > 0 && deleted === 0 && softDeleted === 0) {
            message.error(`❌ All ${failed} deletions failed`);
          }

          setSelectedPincodeIds([]);
          loadPincodes();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Bulk delete failed');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleRecalculatePincodeUsage = async () => {
    try {
      setLoading(true);
      const result = await locationService.recalculatePincodeUsage();
      message.success(
        `✅ Recalculated ${result.updated} pincode(s) out of ${result.totalPincodes} total`
      );
      loadPincodes();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Recalculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateCountryUsage = async () => {
    try {
      setLoading(true);
      const result = await locationService.recalculateCountryUsage();
      message.success(
        `✅ Recalculated ${result.updated} country/countries out of ${result.totalCountries} total`
      );
      loadCountries();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Recalculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateStateUsage = async () => {
    try {
      setLoading(true);
      const result = await locationService.recalculateStateUsage();
      message.success(
        `✅ Recalculated ${result.updated} state(s) out of ${result.totalStates} total`
      );
      loadStates();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Recalculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateCityUsage = async () => {
    try {
      setLoading(true);
      const result = await locationService.recalculateCityUsage();
      message.success(
        `✅ Recalculated ${result.updated} city/cities out of ${result.totalCities} total`
      );
      loadCities();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Recalculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAllUsage = async () => {
    try {
      setLoading(true);
      const result = await locationService.recalculateAllUsage();
      const totalUpdated = result.countries.updated + result.states.updated + result.cities.updated + result.pincodes.updated;
      message.success(
        `✅ Recalculated ${totalUpdated} location(s) across all types`
      );
      // Reload all data
      loadCountries();
      loadStates();
      loadCities();
      loadPincodes();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Recalculation failed');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================
  const handleExport = async () => {
    try {
      setLoading(true);
      await locationService.exportLocations();
      message.success('Locations exported successfully');
    } catch (error) {
      message.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = locationService.parseCSV(content);
        const validation = locationService.validateBulkData(parsedData);
        
        console.log(`[CSV Import] Parsed ${parsedData.length} records, Validation: ${validation.valid ? 'PASSED' : validation.errors.length + ' errors'}`);
        
        if (!validation.valid) {
          Modal.error({
            title: 'Invalid Data',
            content: (
              <div>
                <p>Found {validation.errors.length} validation errors in {parsedData.length} records:</p>
                <ul style={{ maxHeight: 200, overflow: 'auto' }}>
                  {validation.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
                {validation.errors.length > 20 && (
                  <p>... and {validation.errors.length - 20} more errors</p>
                )}
              </div>
            ),
          });
          return;
        }

        setImportData(parsedData);
        setImportModalVisible(true);
      } catch (error: any) {
        console.error('[CSV Import] Parse error:', error.message);
        message.error(`Failed to parse CSV file: ${error.message}`);
      }
    };
    reader.readAsText(file);
    return false; // Prevent auto upload
  };

  const handleBulkImport = async () => {
    setImporting(true);
    setImportProgress(0);
    setImportStatusText('Preparing import...');

    try {
      // Process in batches for better progress tracking
      // Larger batches for better performance with lakhs of records
      const BATCH_SIZE = Math.min(1000, Math.ceil(importData.length / 10)); // 1000 records or 10% of total
      const totalRecords = importData.length;
      const batches = Math.ceil(totalRecords / BATCH_SIZE);
      
      console.log(`[Bulk Import] Starting: ${totalRecords} records in ${batches} batches`);
      
      let aggregatedResult = {
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [] as string[],
        details: {
          countriesCreated: 0,
          statesCreated: 0,
          citiesCreated: 0,
          pincodesCreated: 0,
          pincodesSkipped: 0,
        }
      };

      // Process each batch
      for (let i = 0; i < batches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, totalRecords);
        const batch = importData.slice(start, end);

        // Update status text
        setImportStatusText(`Processing batch ${i + 1} of ${batches} (${start + 1}-${end} of ${totalRecords})...`);

        // Call API with batch
        const batchResult = await locationService.bulkImport(batch);
        
        // Aggregate results
        aggregatedResult.success += batchResult.success;
        aggregatedResult.skipped += batchResult.skipped;
        aggregatedResult.failed += batchResult.failed;
        aggregatedResult.errors.push(...batchResult.errors);
        
        if (batchResult.details) {
          aggregatedResult.details.countriesCreated += batchResult.details.countriesCreated;
          aggregatedResult.details.statesCreated += batchResult.details.statesCreated;
          aggregatedResult.details.citiesCreated += batchResult.details.citiesCreated;
          aggregatedResult.details.pincodesCreated += batchResult.details.pincodesCreated;
          aggregatedResult.details.pincodesSkipped += batchResult.details.pincodesSkipped;
        }

        // Update progress - force a small delay to ensure React state updates
        const progress = Math.round(((i + 1) / batches) * 100);
        setImportProgress(progress);
        setImportDetails({
          countriesCreated: aggregatedResult.details.countriesCreated,
          statesCreated: aggregatedResult.details.statesCreated,
          citiesCreated: aggregatedResult.details.citiesCreated,
          pincodesCreated: aggregatedResult.details.pincodesCreated,
          pincodesSkipped: aggregatedResult.details.pincodesSkipped,
          failed: aggregatedResult.failed,
          errors: aggregatedResult.errors.slice(0, 50), // Limit display
        });
        
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      console.log(`[Bulk Import] Complete: ${aggregatedResult.success} created, ${aggregatedResult.skipped} skipped, ${aggregatedResult.failed} failed`);

      setImportProgress(100);
      setImportStatusText('Import complete!');
      
      // Determine modal type based on results
      const allSkipped = aggregatedResult.success === 0 && aggregatedResult.skipped > 0 && aggregatedResult.failed === 0;
      const hasSomeSuccess = aggregatedResult.success > 0;

      // Choose appropriate modal based on results
      const showModal = allSkipped ? Modal.warning : hasSomeSuccess ? Modal.success : Modal.error;
      const modalTitle = allSkipped 
        ? 'All Records Already Exist' 
        : hasSomeSuccess 
          ? 'Import Complete' 
          : 'Import Failed';

      showModal({
        title: modalTitle,
        width: 600,
        content: (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Warning for all skipped */}
              {allSkipped && (
                <Alert
                  message="All Records Were Skipped"
                  description="All records in the CSV file already exist in the database. This usually means you've already imported this data. If you want to re-import, delete the existing location data first using the database management scripts."
                  type="warning"
                  showIcon
                />
              )}

              {/* Summary Stats */}
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Created"
                    value={aggregatedResult.success}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<Tag color="success">✓</Tag>}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Skipped"
                    value={aggregatedResult.skipped}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<Tag color="warning">⊘</Tag>}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Failed"
                    value={aggregatedResult.failed}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<Tag color="error">✗</Tag>}
                  />
                </Col>
              </Row>

              {/* Detailed Breakdown */}
              {aggregatedResult.details && (
                <Alert
                  message="Import Details"
                  description={
                    <div>
                      <p>• Countries created: {aggregatedResult.details.countriesCreated}</p>
                      <p>• States created: {aggregatedResult.details.statesCreated}</p>
                      <p>• Cities created: {aggregatedResult.details.citiesCreated}</p>
                      <p>• Pincodes created: {aggregatedResult.details.pincodesCreated}</p>
                      <p>• Pincodes skipped (duplicates): {aggregatedResult.details.pincodesSkipped}</p>
                    </div>
                  }
                  type="info"
                  showIcon
                />
              )}

              {/* Errors */}
              {aggregatedResult.failed > 0 && aggregatedResult.errors.length > 0 && (
                <Alert
                  message={`Failed Records (${aggregatedResult.failed})`}
                  description={
                    <ul style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}>
                      {aggregatedResult.errors.slice(0, 50).map((err, i) => (
                        <li key={i}><Text type="danger">{err}</Text></li>
                      ))}
                      {aggregatedResult.errors.length > 50 && (
                        <li><Text type="secondary">... and {aggregatedResult.errors.length - 50} more</Text></li>
                      )}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              )}
            </Space>
          </div>
        ),
        onOk: () => {
          setImportModalVisible(false);
          setImportData([]);
          loadData();
        },
      });
    } catch (error: any) {
      console.error('[Bulk Import] Error:', error.message);
      message.error(error.response?.data?.message || `Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // ==========================================================================
  // TABLE COLUMNS
  // ==========================================================================
  const countryColumns: ColumnsType<Country> = [
    {
      title: 'Country Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'States',
      dataIndex: 'stateCount',
      key: 'stateCount',
      width: 100,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'Usage',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count: number) => <Tag color={count > 0 ? 'orange' : 'default'}>{count}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: Country) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive('country', record._id, checked)}
          disabled={!hasPermission('locations.toggle')}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record: Country) => {
        const canUpdate = hasPermission('locations.update');
        const canDelete = hasPermission('locations.delete');
        
        if (!canUpdate && !canDelete) {
          return <span style={{ color: '#8c8c8c', fontSize: '12px' }}>No actions</span>;
        }
        
        return (
          <Space>
            {canUpdate && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingCountry(record);
                  setCountryModalVisible(true);
                }}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this country?"
                onConfirm={() => handleDelete('country', record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const stateColumns: ColumnsType<State> = [
    {
      title: 'State Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Country',
      key: 'country',
      render: (_, record: State) => {
        if (!record.countryId) return '-';
        return typeof record.countryId === 'object' 
          ? (record.countryId as Country).name 
          : record.countryId;
      },
    },
    {
      title: 'Cities',
      dataIndex: 'cityCount',
      key: 'cityCount',
      width: 100,
      render: (count: number) => <Tag color="green">{count}</Tag>,
    },
    {
      title: 'Usage',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count: number) => <Tag color={count > 0 ? 'orange' : 'default'}>{count}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: State) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive('state', record._id, checked)}
          disabled={!hasPermission('locations.toggle')}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record: State) => {
        const canUpdate = hasPermission('locations.update');
        const canDelete = hasPermission('locations.delete');
        
        if (!canUpdate && !canDelete) {
          return <span style={{ color: '#8c8c8c', fontSize: '12px' }}>No actions</span>;
        }
        
        return (
          <Space>
            {canUpdate && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingState(record);
                  setStateModalVisible(true);
                }}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this state?"
                onConfirm={() => handleDelete('state', record._id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const cityColumns: ColumnsType<City> = [
    {
      title: 'City Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'State',
      key: 'state',
      render: (_, record: City) => {
        if (!record.stateId) return '-';
        return typeof record.stateId === 'object' 
          ? (record.stateId as State).name 
          : record.stateId;
      },
    },
    {
      title: 'PIN Codes',
      dataIndex: 'pincodeCount',
      key: 'pincodeCount',
      width: 120,
      render: (count: number) => <Tag color="orange">{count}</Tag>,
    },
    {
      title: 'Usage',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count: number) => <Tag color={count > 0 ? 'orange' : 'default'}>{count}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: City) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive('city', record._id, checked)}
          disabled={!hasPermission('locations.toggle')}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record: City) => {
        const canUpdate = hasPermission('locations.update');
        const canDelete = hasPermission('locations.delete');
        
        if (!canUpdate && !canDelete) {
          return <span style={{ color: '#8c8c8c', fontSize: '12px' }}>No actions</span>;
        }
        
        return (
          <Space>
            {canUpdate && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingCity(record);
                  setCityModalVisible(true);
                }}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this city?"
                onConfirm={() => handleDelete('city', record._id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const pincodeColumns: ColumnsType<Pincode> = [
    {
      title: 'PIN Code',
      dataIndex: 'pincode',
      key: 'pincode',
      width: 120,
      sorter: (a, b) => a.pincode.localeCompare(b.pincode),
    },
    {
      title: 'Area',
      dataIndex: 'area',
      key: 'area',
    },
    {
      title: 'City',
      key: 'city',
      render: (_, record: Pincode) => {
        if (!record.cityId) return '-';
        return typeof record.cityId === 'object' && record.cityId !== null
          ? (record.cityId as City).name 
          : String(record.cityId);
      },
    },
    {
      title: 'Usage Count',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 120,
      render: (count: number) => <Tag color="purple">{count}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: Pincode) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive('pincode', record._id, checked)}
          disabled={!hasPermission('locations.toggle')}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record: Pincode) => {
        const canUpdate = hasPermission('locations.update');
        const canDelete = hasPermission('locations.delete');
        
        if (!canUpdate && !canDelete) {
          return <span style={{ color: '#8c8c8c', fontSize: '12px' }}>No actions</span>;
        }
        
        return (
          <Space>
            {canUpdate && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingPincode(record);
                  setPincodeModalVisible(true);
                }}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this PIN code?"
                onConfirm={() => handleDelete('pincode', record._id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Countries"
                  value={countryPagination.total}
                  prefix={<GlobalOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="States"
                  value={statePagination.total}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Cities"
                  value={cityPagination.total}
                  prefix={<HomeOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="PIN Codes"
                  value={pincodePagination.total}
                  prefix={<EnvironmentOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card
        title="Location Management"
        extra={
          <Space>
            {hasPermission('locations.view') && (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => locationService.downloadCSVTemplate()}
              >
                Download Template
              </Button>
            )}
            {hasPermission('locations.import') && (
              <Upload
                accept=".csv"
                showUploadList={false}
                beforeUpload={handleFileUpload}
              >
                <Button icon={<UploadOutlined />}>Bulk Import</Button>
              </Upload>
            )}
            {hasPermission('locations.export') && (
              <Button icon={<DownloadOutlined />} onClick={handleExport} loading={loading}>
                Export All
              </Button>
            )}
            {hasPermission('locations.manage') && (
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={handleRecalculateAllUsage}
                loading={loading}
              >
                Recalculate All Usage
              </Button>
            )}
          </Space>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'countries',
              label: 'Countries',
              children: (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col flex="auto">
                      <Space.Compact style={{ width: 300 }}>
                        <Input
                          placeholder="Search countries..."
                          allowClear
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onPressEnter={() => loadCountries()}
                        />
                        <Button type="primary" icon={<SearchOutlined />} onClick={() => loadCountries()} />
                      </Space.Compact>
                    </Col>
                    {hasPermission('locations.manage') && (
                      <Col>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleRecalculateCountryUsage}
                          loading={loading}
                        >
                          Recalculate Usage
                        </Button>
                      </Col>
                    )}
                    {hasPermission('locations.create') && (
                      <Col>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setEditingCountry(null);
                            setCountryModalVisible(true);
                          }}
                        >
                          Add Country
                        </Button>
                      </Col>
                    )}
                  </Row>
                  <Table
                    columns={countryColumns}
                    dataSource={countries}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                      current: countryPagination.current,
                      pageSize: countryPagination.pageSize,
                      total: countryPagination.total,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} countries`,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      onChange: (page, pageSize) => {
                        // Update pagination state and reload with new page AND pageSize
                        setCountryPagination({ ...countryPagination, current: page, pageSize: pageSize || countryPagination.pageSize });
                        loadCountries(page, pageSize || countryPagination.pageSize);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: 'states',
              label: 'States',
              children: (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col flex="auto">
                      <Space.Compact style={{ width: 300 }}>
                        <Input
                          placeholder="Search states..."
                          allowClear
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onPressEnter={() => loadStates()}
                        />
                        <Button type="primary" icon={<SearchOutlined />} onClick={() => loadStates()} />
                      </Space.Compact>
                    </Col>
                    {hasPermission('locations.manage') && (
                      <Col>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleRecalculateStateUsage}
                          loading={loading}
                        >
                          Recalculate Usage
                        </Button>
                      </Col>
                    )}
                    {hasPermission('locations.create') && (
                      <Col>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setEditingState(null);
                            setStateModalVisible(true);
                          }}
                          disabled={!dropdownDataLoaded}
                          loading={!dropdownDataLoaded}
                        >
                          Add State
                        </Button>
                      </Col>
                    )}
                  </Row>
                  <Table
                    columns={stateColumns}
                    dataSource={states}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                      current: statePagination.current,
                      pageSize: statePagination.pageSize,
                      total: statePagination.total,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} states`,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      onChange: (page, pageSize) => {
                        // Update pagination state and reload with new page AND pageSize
                        setStatePagination({ ...statePagination, current: page, pageSize: pageSize || statePagination.pageSize });
                        loadStates(page, pageSize || statePagination.pageSize);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: 'cities',
              label: 'Cities',
              children: (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col flex="auto">
                      <Space.Compact style={{ width: 300 }}>
                        <Input
                          placeholder="Search cities..."
                          allowClear
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onPressEnter={() => loadCities()}
                        />
                        <Button type="primary" icon={<SearchOutlined />} onClick={() => loadCities()} />
                      </Space.Compact>
                    </Col>
                    {hasPermission('locations.manage') && (
                      <Col>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleRecalculateCityUsage}
                          loading={loading}
                        >
                          Recalculate Usage
                        </Button>
                      </Col>
                    )}
                    {hasPermission('locations.create') && (
                      <Col>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setEditingCity(null);
                            setCityModalVisible(true);
                          }}
                          disabled={!dropdownDataLoaded}
                          loading={!dropdownDataLoaded}
                        >
                          Add City
                        </Button>
                      </Col>
                    )}
                    {hasPermission('locations.delete') && selectedCityIds.length > 0 && (
                      <Col>
                        <Tooltip title="Only selected items on the current page will be deleted. Selections are cleared when you change pages.">
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleBulkDeleteCities}
                            loading={loading}
                          >
                            Delete Selected ({selectedCityIds.length})
                          </Button>
                        </Tooltip>
                      </Col>
                    )}
                  </Row>
                  <Table
                    columns={cityColumns}
                    dataSource={cities}
                    rowKey="_id"
                    loading={loading}
                    rowSelection={{
                      selectedRowKeys: selectedCityIds,
                      onChange: (selectedKeys: React.Key[]) => {
                        setSelectedCityIds(selectedKeys as string[]);
                      },
                    }}
                    pagination={{
                      current: cityPagination.current,
                      pageSize: cityPagination.pageSize,
                      total: cityPagination.total,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} cities`,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      onChange: (page, pageSize) => {
                        // Update pagination state and reload with new page AND pageSize
                        setCityPagination({ ...cityPagination, current: page, pageSize: pageSize || cityPagination.pageSize });
                        loadCities(page, pageSize || cityPagination.pageSize);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: 'pincodes',
              label: 'PIN Codes',
              children: (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col flex="auto">
                      <Space.Compact style={{ width: 300 }}>
                        <Input
                          placeholder="Search PIN codes..."
                          allowClear
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onPressEnter={() => loadPincodes()}
                        />
                        <Button type="primary" icon={<SearchOutlined />} onClick={() => loadPincodes()} />
                      </Space.Compact>
                    </Col>
                    {hasPermission('locations.manage') && (
                      <Col>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleRecalculatePincodeUsage}
                          loading={loading}
                        >
                          Recalculate Usage
                        </Button>
                      </Col>
                    )}
                    {hasPermission('locations.create') && (
                      <Col>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setEditingPincode(null);
                            setPincodeModalVisible(true);
                          }}
                          disabled={!dropdownDataLoaded}
                          loading={!dropdownDataLoaded}
                        >
                          Add PIN Code
                        </Button>
                      </Col>
                    )}
                    {hasPermission('locations.delete') && selectedPincodeIds.length > 0 && (
                      <Col>
                        <Tooltip title="Only selected items on the current page will be deleted. Selections are cleared when you change pages.">
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleBulkDeletePincodes}
                            loading={loading}
                          >
                            Delete Selected ({selectedPincodeIds.length})
                          </Button>
                        </Tooltip>
                      </Col>
                    )}
                  </Row>
                  <Table
                    columns={pincodeColumns}
                    dataSource={pincodes}
                    rowKey="_id"
                    loading={loading}
                    rowSelection={{
                      selectedRowKeys: selectedPincodeIds,
                      onChange: (selectedKeys: React.Key[]) => {
                        setSelectedPincodeIds(selectedKeys as string[]);
                      },
                    }}
                    pagination={{
                      current: pincodePagination.current,
                      pageSize: pincodePagination.pageSize,
                      total: pincodePagination.total,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} PIN codes`,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      onChange: (page, pageSize) => {
                        // Update pagination state and reload with new page AND pageSize
                        setPincodePagination({ ...pincodePagination, current: page, pageSize: pageSize || pincodePagination.pageSize });
                        loadPincodes(page, pageSize || pincodePagination.pageSize);
                      },
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* CRUD Modals */}
      <CountryModal
        open={countryModalVisible}
        editingRecord={editingCountry}
        onClose={() => {
          setCountryModalVisible(false);
          setEditingCountry(null);
        }}
        onSuccess={() => {
          setCountryModalVisible(false);
          setEditingCountry(null);
          loadCountries();
          // Reload states dropdown data (for CityModal and PincodeModal)
          loadAllDropdownData();
        }}
      />

      <StateModal
        open={stateModalVisible}
        editingRecord={editingState}
        countries={countries}
        onClose={() => {
          setStateModalVisible(false);
          setEditingState(null);
        }}
        onSuccess={() => {
          setStateModalVisible(false);
          setEditingState(null);
          loadStates();
          // Reload dropdown data (for CityModal and PincodeModal)
          loadAllDropdownData();
        }}
      />

      <CityModal
        open={cityModalVisible}
        editingRecord={editingCity}
        states={states}
        onClose={() => {
          setCityModalVisible(false);
          setEditingCity(null);
        }}
        onSuccess={() => {
          setCityModalVisible(false);
          setEditingCity(null);
          loadCities();
          // Reload dropdown data (for PincodeModal)
          loadAllDropdownData();
        }}
      />

      <PincodeModal
        open={pincodeModalVisible}
        editingRecord={editingPincode}
        cities={cities}
        onClose={() => {
          setPincodeModalVisible(false);
          setEditingPincode(null);
        }}
        onSuccess={() => {
          setPincodeModalVisible(false);
          setEditingPincode(null);
          loadPincodes();
        }}
      />

      {/* Bulk Import Modal */}
      <Modal
        title="Bulk Import Locations"
        open={importModalVisible}
        onCancel={() => !importing && setImportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalVisible(false)} disabled={importing}>
            Cancel
          </Button>,
          <Button key="import" type="primary" onClick={handleBulkImport} loading={importing}>
            Import {importData.length} Records
          </Button>,
        ]}
        width={700}
      >
        {importing && (
          <div>
            <Progress 
              percent={importProgress} 
              status="active" 
              format={percent => `${percent}%`}
            />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">
                {importStatusText || `Processing ${Math.round((importProgress / 100) * importData.length)} of ${importData.length} records...`}
              </Text>
            </div>
            {importDetails.pincodesCreated > 0 && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Space size="large">
                  <Text type="success">✓ Created: {importDetails.pincodesCreated}</Text>
                  <Text type="warning">⊘ Skipped: {importDetails.pincodesSkipped}</Text>
                  {importDetails.failed > 0 && <Text type="danger">✗ Failed: {importDetails.failed}</Text>}
                </Space>
              </div>
            )}
          </div>
        )}
        {!importing && (
          <Alert
            message={`Ready to import ${importData.length} location records`}
            description="Click 'Import' to proceed. This may take a few minutes for large datasets."
            type="info"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
};

export default LocationManagement;

