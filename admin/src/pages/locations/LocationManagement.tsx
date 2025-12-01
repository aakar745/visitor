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
} from 'antd';
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
    loadData();
  }, [activeTab, searchText]);

  // Load all data needed for dropdown selections in modals
  const loadAllDropdownData = async () => {
    setDropdownDataLoaded(false);
    try {
      // Load countries (needed for StateModal dropdown)
      const countriesData = await locationService.getCountries({});
      setCountries(Array.isArray(countriesData) ? countriesData : []);

      // Load states (needed for CityModal dropdown)
      const statesData = await locationService.getStates({});
      setStates(Array.isArray(statesData) ? statesData : []);

      // Load cities (needed for PincodeModal dropdown)
      const citiesData = await locationService.getCities({});
      setCities(Array.isArray(citiesData) ? citiesData : []);

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

  const loadCountries = async () => {
    try {
      const data = await locationService.getCountries({ search: searchText });
      setCountries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading countries:', error);
      setCountries([]);
    }
  };

  const loadStates = async () => {
    try {
      const data = await locationService.getStates({ search: searchText });
      setStates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading states:', error);
      setStates([]);
    }
  };

  const loadCities = async () => {
    try {
      const data = await locationService.getCities({ search: searchText });
      setCities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities([]);
    }
  };

  const loadPincodes = async () => {
    try {
      const data = await locationService.getPincodes({ search: searchText });
      setPincodes(Array.isArray(data) ? data : []);
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
      switch (type) {
        case 'country':
          await locationService.deleteCountry(id);
          message.success('Country deleted successfully');
          loadCountries();
          break;
        case 'state':
          await locationService.deleteState(id);
          message.success('State deleted successfully');
          loadStates();
          break;
        case 'city':
          await locationService.deleteCity(id);
          message.success('City deleted successfully');
          loadCities();
          break;
        case 'pincode':
          await locationService.deletePincode(id);
          message.success('PIN code deleted successfully');
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
        if (!validation.valid) {
          Modal.error({
            title: 'Invalid Data',
            content: (
              <div>
                <p>Please fix the following errors:</p>
                <ul>
                  {validation.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
                {validation.errors.length > 10 && (
                  <p>... and {validation.errors.length - 10} more errors</p>
                )}
              </div>
            ),
          });
          return;
        }

        setImportData(parsedData);
        setImportModalVisible(true);
      } catch (error) {
        message.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    return false; // Prevent auto upload
  };

  const handleBulkImport = async () => {
    setImporting(true);
    setImportProgress(0);

    try {
      const result = await locationService.bulkImport(importData);
      setImportProgress(100);
      
      Modal.success({
        title: 'Import Complete',
        content: (
          <div>
            <p>✅ Successfully imported: {result.success}</p>
            {result.failed > 0 && (
              <>
                <p>❌ Failed: {result.failed}</p>
                {result.errors.length > 0 && (
                  <>
                    <p style={{ marginTop: 10, fontWeight: 'bold' }}>Errors:</p>
                    <ul style={{ maxHeight: 200, overflow: 'auto' }}>
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        ),
        onOk: () => {
          setImportModalVisible(false);
          setImportData([]);
          loadData();
        },
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Import failed');
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
                  value={countries.length}
                  prefix={<GlobalOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="States"
                  value={states.length}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Cities"
                  value={cities.length}
                  prefix={<HomeOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="PIN Codes"
                  value={pincodes.length}
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
                    pagination={{ pageSize: 10 }}
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
                    pagination={{ pageSize: 10 }}
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
                  </Row>
                  <Table
                    columns={cityColumns}
                    dataSource={cities}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
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
                  </Row>
                  <Table
                    columns={pincodeColumns}
                    dataSource={pincodes}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
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
        {importing && <Progress percent={importProgress} status="active" />}
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

