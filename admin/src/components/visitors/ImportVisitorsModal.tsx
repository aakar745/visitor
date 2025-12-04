import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Select,
  Space,
  Progress,
  Typography,
  Alert,
  Divider,
  Row,
  Col,
  Statistic,
  Tag,
  List,
  Spin,
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { DuplicateStrategy, ImportStatus } from '../../types/import.types';
import {
  useUploadVisitors,
  useImportProgress,
  useDownloadTemplate,
} from '../../hooks/useImport';

const { Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

interface ImportVisitorsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ImportVisitorsModal: React.FC<ImportVisitorsModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>(
    DuplicateStrategy.SKIP
  );
  const [importId, setImportId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // ✅ Track import started state separately - doesn't rely on React Query timing
  const [importStarted, setImportStarted] = useState(false);

  const uploadMutation = useUploadVisitors();
  const downloadTemplateMutation = useDownloadTemplate();

  // Poll for progress while importing
  const { data: progressData, isLoading: isLoadingProgress, isFetching } = useImportProgress(importId, !!importId);

  const progress = progressData?.data;
  const isProcessing =
    progress?.status === ImportStatus.PROCESSING ||
    progress?.status === ImportStatus.PENDING;
  
  // ✅ Show loading when import has started but we haven't received progress yet
  // Use importStarted flag instead of relying on React Query timing
  const isWaitingForProgress = importStarted && !progress;
  
  // Debug logging
  console.log('[ImportModal] State:', {
    importId,
    importStarted,
    isLoadingProgress,
    isFetching,
    hasProgress: !!progress,
    progressStatus: progress?.status,
    isWaitingForProgress,
    isProcessing,
  });

  const handleUpload = async () => {
    if (fileList.length === 0) return;

    setIsUploading(true);
    try {
      const uploadFile = fileList[0];
      const file = uploadFile.originFileObj || uploadFile;
      
      if (!(file instanceof File)) {
        throw new Error('Invalid file object');
      }

      console.log('[ImportModal] Uploading file:', file.name, file.type, file.size);
      
      const result = await uploadMutation.mutateAsync({
        file,
        duplicateStrategy,
      });

      console.log('[ImportModal] Upload response:', result);
      console.log('[ImportModal] Import ID:', result.data.importId);
      
      // ✅ Set importStarted FIRST to show loading state immediately
      setImportStarted(true);
      setImportId(result.data.importId);
      setIsUploading(false);
    } catch (error) {
      console.error('[ImportModal] Upload failed:', error);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      Modal.confirm({
        title: 'Import in Progress',
        content:
          'The import is still processing. Are you sure you want to close? The import will continue in the background.',
        onOk: () => {
          resetState();
          onClose();
        },
      });
    } else {
      resetState();
      onClose();
      if (progress?.status === ImportStatus.COMPLETED || progress?.status === ImportStatus.PARTIALLY_COMPLETED) {
        onSuccess?.();
      }
    }
  };

  const resetState = () => {
    setFileList([]);
    setImportId(null);
    setIsUploading(false);
    setImportStarted(false);
    setDuplicateStrategy(DuplicateStrategy.SKIP);
  };

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate();
  };

  const getStatusColor = (status: ImportStatus) => {
    switch (status) {
      case ImportStatus.COMPLETED:
        return 'success';
      case ImportStatus.PROCESSING:
        return 'processing';
      case ImportStatus.FAILED:
        return 'error';
      case ImportStatus.PARTIALLY_COMPLETED:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: ImportStatus) => {
    switch (status) {
      case ImportStatus.PENDING:
        return 'Pending';
      case ImportStatus.PROCESSING:
        return 'Processing';
      case ImportStatus.COMPLETED:
        return 'Completed';
      case ImportStatus.FAILED:
        return 'Failed';
      case ImportStatus.PARTIALLY_COMPLETED:
        return 'Partially Completed';
      default:
        return status;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <UploadOutlined />
          <span>Import Visitors (CSV / Excel)</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={
        !importStarted ? (
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={isUploading}
              disabled={fileList.length === 0}
              icon={<UploadOutlined />}
            >
              Start Import
            </Button>
          </Space>
        ) : (
          <Button type="primary" onClick={handleClose} disabled={isWaitingForProgress}>
            {isWaitingForProgress 
              ? 'Starting Import...' 
              : isProcessing 
                ? 'Close (Processing in Background)' 
                : 'Done'}
          </Button>
        )
      }
      width={700}
      destroyOnHidden
    >
      {!importStarted ? (
        <>
          {/* Instructions */}
          <Alert
            message="Import Instructions - CSV & Excel Support"
            description={
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  Upload a <strong>CSV (.csv)</strong> or <strong>Excel (.xlsx, .xls)</strong> file with visitor data. 
                  The file must contain at least <strong>name</strong> and <strong>phone</strong> columns.
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  <strong>Supported formats:</strong> CSV, Excel 2007+ (.xlsx), Excel 97-2003 (.xls)
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  <strong>Capacity:</strong> ✅ Unlimited rows - System handles any size dataset with batch processing
                </Paragraph>
              </div>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />

          {/* Download Template Button */}
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            loading={downloadTemplateMutation.isPending}
            style={{ marginBottom: 16 }}
            block
            type="dashed"
          >
            Download CSV Template (Can be opened in Excel)
          </Button>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16, textAlign: 'center' }}>
            💡 You can edit the template in Excel and save as .csv or .xlsx before uploading
          </Text>

          {/* Duplicate Strategy Selector */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Duplicate Phone Number Strategy:
            </Text>
            <Select
              value={duplicateStrategy}
              onChange={setDuplicateStrategy}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value={DuplicateStrategy.SKIP}>
                Skip Duplicates
              </Option>
              <Option value={DuplicateStrategy.UPDATE}>
                Update Existing
              </Option>
              <Option value={DuplicateStrategy.CREATE_NEW}>
                Create New (Allow Duplicates)
              </Option>
            </Select>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              {duplicateStrategy === DuplicateStrategy.SKIP && 
                "Don't import visitors with existing phone numbers"}
              {duplicateStrategy === DuplicateStrategy.UPDATE && 
                "Update existing visitor records with new data"}
              {duplicateStrategy === DuplicateStrategy.CREATE_NEW && 
                "Create new records even if phone number exists"}
            </Text>
          </div>

          {/* File Upload */}
          <Dragger
            fileList={fileList}
            beforeUpload={(file) => {
              const fileName = file.name.toLowerCase();
              const validExtensions = ['.csv', '.xlsx', '.xls'];
              const isValid = validExtensions.some(ext => fileName.endsWith(ext));
              
              if (!isValid) {
                Modal.error({
                  title: 'Invalid File Type',
                  content: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls).',
                });
                return false;
              }

              // Store the file properly for Ant Design Upload component
              setFileList([
                {
                  uid: file.uid || '-1',
                  name: file.name,
                  status: 'done',
                  originFileObj: file,
                },
              ]);
              return false; // Prevent auto upload
            }}
            onRemove={() => {
              setFileList([]);
            }}
            maxCount={1}
            accept=".csv,.xlsx,.xls"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag CSV or Excel file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Supports CSV and Excel files (.csv, .xlsx, .xls). ✅ Unlimited rows supported.
            </p>
          </Dragger>
        </>
      ) : (
        <>
          {/* Loading State - Waiting for first progress fetch */}
          {isWaitingForProgress && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin 
                indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
                size="large"
              />
              <div style={{ marginTop: 24 }}>
                <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 8 }}>
                  🚀 Import Started!
                </Text>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Initializing import process... Please wait.
                </Text>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {progress && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Tag color={getStatusColor(progress.status)} style={{ fontSize: 16, padding: '8px 16px' }}>
                  {getStatusText(progress.status)}
                </Tag>
              </div>

              {/* Progress Bar */}
              <Progress
                percent={progress.percentage}
                status={
                  progress.status === ImportStatus.FAILED
                    ? 'exception'
                    : progress.status === ImportStatus.COMPLETED || progress.status === ImportStatus.PARTIALLY_COMPLETED
                    ? 'success'
                    : 'active'
                }
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />

              {/* Live Processing Status */}
              {isProcessing && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    📊 Processing {progress.processedRows.toLocaleString()} of {progress.totalRows.toLocaleString()} records...
                  </Text>
                  {progress.successRows > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="success" style={{ marginRight: 16 }}>✓ Imported: {progress.successRows.toLocaleString()}</Text>
                      {progress.skippedRows > 0 && (
                        <Text type="warning" style={{ marginRight: 16 }}>⊘ Skipped: {progress.skippedRows.toLocaleString()}</Text>
                      )}
                      {progress.updatedRows > 0 && (
                        <Text style={{ color: '#1890ff', marginRight: 16 }}>↻ Updated: {progress.updatedRows.toLocaleString()}</Text>
                      )}
                      {progress.failedRows > 0 && (
                        <Text type="danger">✗ Failed: {progress.failedRows.toLocaleString()}</Text>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Completion Message */}
              {!isProcessing && progress.status !== ImportStatus.PENDING && (
                <Alert
                  message={
                    progress.status === ImportStatus.COMPLETED
                      ? '✅ Import Completed Successfully!'
                      : progress.status === ImportStatus.PARTIALLY_COMPLETED
                      ? '⚠️ Import Completed with Some Issues'
                      : '❌ Import Failed'
                  }
                  description={
                    <div>
                      {progress.status === ImportStatus.FAILED ? (
                        <p>The import encountered a critical error. Please check the error messages below.</p>
                      ) : (
                        <>
                          <p style={{ marginBottom: 8 }}>
                            <strong>Summary:</strong> Processed {progress.processedRows.toLocaleString()} of {progress.totalRows.toLocaleString()} records
                          </p>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            <li style={{ color: '#3f8600' }}>✓ Imported: {progress.successRows.toLocaleString()} new records</li>
                            {progress.updatedRows > 0 && (
                              <li style={{ color: '#1890ff' }}>↻ Updated: {progress.updatedRows.toLocaleString()} existing records</li>
                            )}
                            {progress.skippedRows > 0 && (
                              <li style={{ color: '#faad14' }}>
                                ⊘ Skipped: {progress.skippedRows.toLocaleString()} duplicates (phone numbers already exist)
                              </li>
                            )}
                            {progress.failedRows > 0 && (
                              <li style={{ color: '#cf1322' }}>✗ Failed: {progress.failedRows.toLocaleString()} records</li>
                            )}
                          </ul>
                        </>
                      )}
                    </div>
                  }
                  type={
                    progress.status === ImportStatus.COMPLETED
                      ? 'success'
                      : progress.status === ImportStatus.PARTIALLY_COMPLETED
                      ? 'warning'
                      : 'error'
                  }
                  showIcon
                  style={{ marginTop: 16, marginBottom: 16 }}
                />
              )}

              <Divider />

              {/* Statistics */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Statistic
                    title="Total Rows"
                    value={progress.totalRows}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Processed"
                    value={progress.processedRows}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Success"
                    value={progress.successRows}
                    valueStyle={{ color: '#3f8600', fontSize: 20 }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Updated"
                    value={progress.updatedRows}
                    valueStyle={{ color: '#1890ff', fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Skipped"
                    value={progress.skippedRows}
                    valueStyle={{ color: '#faad14', fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Failed"
                    value={progress.failedRows}
                    valueStyle={{ color: '#cf1322', fontSize: 20 }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Col>
              </Row>

              {/* Skip Reason Explanation */}
              {progress.skippedRows > 0 && progress.skipReason && (
                <>
                  <Divider />
                  <Alert
                    message="Skipped Records Explanation"
                    description={progress.skipReason}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  {/* Show sample of skipped records */}
                  {progress.skipMessages && progress.skipMessages.length > 0 && (
                    <>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Sample of Skipped Records ({Math.min(progress.skipMessages.length, 10)} of {progress.skippedRows.toLocaleString()}):
                      </Text>
                      <List
                        size="small"
                        bordered
                        dataSource={progress.skipMessages.slice(0, 10)}
                        renderItem={(skipMsg) => (
                          <List.Item>
                            <Text type="warning" style={{ fontSize: 12 }}>
                              ⊘ {skipMsg}
                            </Text>
                          </List.Item>
                        )}
                        style={{ maxHeight: 150, overflow: 'auto' }}
                      />
                      {progress.skippedRows > 10 && (
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                          ... and {(progress.skippedRows - 10).toLocaleString()} more records skipped (showing first 10 samples)
                        </Text>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Error Messages */}
              {progress.errorMessages && progress.errorMessages.length > 0 && (
                <>
                  <Divider />
                  <Alert
                    message={`Errors (${progress.errorMessages.length})`}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <List
                    size="small"
                    bordered
                    dataSource={progress.errorMessages.slice(0, 10)}
                    renderItem={(error) => (
                      <List.Item>
                        <Text type="danger" style={{ fontSize: 12 }}>
                          {error}
                        </Text>
                      </List.Item>
                    )}
                    style={{ maxHeight: 200, overflow: 'auto' }}
                  />
                  {progress.errorMessages.length > 10 && (
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                      ... and {progress.errorMessages.length - 10} more errors
                    </Text>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default ImportVisitorsModal;

