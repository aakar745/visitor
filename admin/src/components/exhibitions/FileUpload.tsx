import React, { useState } from 'react';
import { Upload, Button, Image as AntImage, Typography, Progress, Space } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import { useMessage } from '../../hooks/useMessage';
import { API_BASE_URL } from '../../constants';

const { Text } = Typography;

// Get backend URL from API_BASE_URL (remove /api/v1 suffix)
const BACKEND_URL = API_BASE_URL.replace(/\/api\/v\d+$/, '');

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  value?: string;
  onChange?: (url: string | null) => void;
  placeholder?: string;
  type: 'logo' | 'badge-logo' | 'banner';
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '.jpg,.jpeg,.png,.gif,.svg',
  maxSize = 10,
  value,
  onChange,
  placeholder = 'Click or drag file to upload',
  type
}) => {
  const message = useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Set initial file list if value is provided
  React.useEffect(() => {
    if (value && fileList.length === 0) {
      // Build full URL for preview (if relative URL from server)
      const fullUrl = value.startsWith('http') || value.startsWith('blob:') 
        ? value 
        : `${BACKEND_URL}${value}`;
      
      setFileList([
        {
          uid: '-1',
          name: `${type}.${value.split('.').pop()}`,
          status: 'done',
          url: fullUrl,
        },
      ]);
    }
  }, [value, fileList.length, type]);

  // Track blob URLs that need cleanup
  const blobUrlsRef = React.useRef<Set<string>>(new Set());

  // Cleanup all blob URLs when component unmounts
  React.useEffect(() => {
    return () => {
      // Clean up all tracked blob URLs on unmount
      blobUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current.clear();
    };
  }, []); // Empty dependency array - only runs on mount/unmount

  const validateFile = (file: File): boolean => {
    // Check file size
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`File must be smaller than ${maxSize}MB!`);
      return false;
    }

    // Check file type
    const allowedTypes = accept.split(',').map(ext => ext.trim().replace('.', ''));
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValidType = allowedTypes.includes(fileExtension);
    if (!isValidType) {
      message.error(`Only ${accept} files are allowed!`);
      return false;
    }

    return true;
  };

  // Validate image dimensions based on upload type
  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Skip dimension validation for SVG files
      if (file.type === 'image/svg+xml') {
        resolve(true);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl); // Clean up blob URL

        // Define recommended dimensions for each type
        const dimensionConstraints: Record<string, { width: number; height: number; aspectRatio?: number }> = {
          'logo': { width: 500, height: 500, aspectRatio: 1 }, // Square logo
          'badge-logo': { width: 300, height: 300, aspectRatio: 1 }, // Square badge
          'banner': { width: 1200, height: 400, aspectRatio: 3 }, // Wide banner
        };

        const constraints = dimensionConstraints[type];
        if (!constraints) {
          resolve(true);
          return;
        }

        const { width, height } = img;
        
        // Check minimum dimensions
        if (width < constraints.width || height < constraints.height) {
          message.warning(
            `Image dimensions (${width}x${height}) are smaller than recommended (${constraints.width}x${constraints.height}). Image may appear blurry.`
          );
          resolve(true); // Warning only, not blocking
          return;
        }

        // Check aspect ratio for specific types
        if (constraints.aspectRatio) {
          const actualRatio = width / height;
          const expectedRatio = constraints.aspectRatio;
          const tolerance = 0.1; // 10% tolerance

          if (Math.abs(actualRatio - expectedRatio) > tolerance) {
            message.warning(
              `Image aspect ratio (${actualRatio.toFixed(2)}:1) differs from recommended (${expectedRatio}:1). Image may appear stretched.`
            );
          }
        }

        resolve(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        message.error('Failed to load image. Please try another file.');
        resolve(false);
      };

      img.src = objectUrl;
    });
  };

  const handleUpload = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Import exhibition service dynamically to avoid circular dependency
      const { exhibitionService } = await import('../../services/exhibitions/exhibitionService');
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 200);

      // Real API call to upload file
      const response = await exhibitionService.uploadFile(file, type);
      
      // Clear progress interval and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUploading(false);
      setUploadProgress(0);
      
      // Return the URL from the server
      return response.url;
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      console.error('File upload error:', error);
      throw error;
    }
  };

  const uploadProps: UploadProps = {
    accept,
    fileList,
    listType: 'picture',
    maxCount: 1,
    beforeUpload: async (file) => {
      // Basic file validation
      if (!validateFile(file)) {
        return false;
      }

      // Image dimension validation
      const isDimensionValid = await validateImageDimensions(file);
      if (!isDimensionValid) {
        return false;
      }

      // Handle upload
      handleUpload(file)
        .then((url) => {
          // Clean up any existing blob URLs before setting new ones
          fileList.forEach((existingFile) => {
            if (existingFile.url && existingFile.url.startsWith('blob:')) {
              URL.revokeObjectURL(existingFile.url);
              blobUrlsRef.current.delete(existingFile.url);
            }
          });

          // Build full URL for preview (if relative URL from server)
          const fullUrl = url.startsWith('http') || url.startsWith('blob:') 
            ? url 
            : `${BACKEND_URL}${url}`;

          const newFileList: UploadFile[] = [
            {
              uid: file.uid,
              name: file.name,
              status: 'done',
              url: fullUrl,
              originFileObj: file,
            },
          ];
          
          // Track blob URL if it's a blob
          if (fullUrl.startsWith('blob:')) {
            blobUrlsRef.current.add(fullUrl);
          }
          
          setFileList(newFileList);
          onChange?.(url); // Still pass the relative URL to parent for saving to backend
          message.success('File uploaded successfully!');
        })
        .catch(() => {
          message.error('File upload failed!');
          setUploading(false);
        });

      return false; // Prevent default upload behavior
    },
    onRemove: (file) => {
      // Clean up blob URL if it exists and is a blob
      if (file.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
        blobUrlsRef.current.delete(file.url);
      }
      setFileList([]);
      onChange?.(null);
      message.success('File removed successfully');
    },
    onPreview: (file) => {
      // Clean up previous preview blob URL if it exists
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
        blobUrlsRef.current.delete(previewImage);
      }
      
      const newPreviewUrl = file.url || '';
      
      // Track new preview blob URL if it's a blob
      if (newPreviewUrl.startsWith('blob:')) {
        blobUrlsRef.current.add(newPreviewUrl);
      }
      
      setPreviewImage(newPreviewUrl);
      setPreviewVisible(true);
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
  };

  const uploadButton = (
    <div style={{ 
      textAlign: 'center', 
      padding: '50px 16px',
      border: '2px dashed #d9d9d9',
      borderRadius: '8px',
      background: '#fafafa',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#1890ff';
      e.currentTarget.style.background = '#f0f5ff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#d9d9d9';
      e.currentTarget.style.background = '#fafafa';
    }}
    >
      <UploadOutlined style={{ 
        fontSize: '48px', 
        color: '#1890ff', 
        marginBottom: '16px'
      }} />
      <div style={{ marginBottom: '8px', width: '100%', padding: '0 8px' }}>
        <Text strong style={{ 
          fontSize: '14px', 
          display: 'block', 
          lineHeight: '20px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {placeholder}
        </Text>
      </div>
      <div style={{ marginBottom: '8px', width: '100%', padding: '0 8px' }}>
        <Text type="secondary" style={{ fontSize: '12px', display: 'block', lineHeight: '18px' }}>
          Click or drag file
        </Text>
      </div>
      <div style={{ width: '100%', padding: '0 8px' }}>
        <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '16px' }}>
          Max {maxSize}MB
        </Text>
      </div>
    </div>
  );

  const imagePreview = fileList.length > 0 && fileList[0].url && (
    <div style={{ 
      marginTop: '20px',
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
      borderRadius: '12px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: type === 'banner' ? 'column' : 'row',
      alignItems: type === 'banner' ? 'stretch' : 'center',
      gap: '20px'
    }}>
      <div style={{ 
        width: type === 'banner' ? '100%' : '120px',
        height: type === 'banner' ? '160px' : '120px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '3px solid #1890ff',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(24,144,255,0.15)'
      }}>
        <img
          src={fileList[0].url}
          alt={fileList[0].name}
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            background: '#fff'
          }}
          onError={(e) => {
            console.error('Image failed to load:', fileList[0].url);
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: '8px' }}>
          <Text strong style={{ fontSize: '15px', color: '#262626' }}>
            {fileList[0].name}
          </Text>
        </div>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#52c41a'
          }} />
          <Text type="secondary" style={{ fontSize: '13px', color: '#52c41a' }}>
            Upload successful
          </Text>
        </div>
        <Space size="middle" wrap>
          <Button 
            type="primary"
            ghost
            icon={<EyeOutlined />} 
            size="middle"
            onClick={() => {
              setPreviewImage(fileList[0].url || '');
              setPreviewVisible(true);
            }}
          >
            Preview
          </Button>
          <Button 
            danger
            icon={<DeleteOutlined />} 
            size="middle"
            onClick={() => {
              // Clean up blob URL if it exists and is a blob
              if (fileList[0].url && fileList[0].url.startsWith('blob:')) {
                URL.revokeObjectURL(fileList[0].url);
                blobUrlsRef.current.delete(fileList[0].url);
              }
              setFileList([]);
              onChange?.(null);
              message.success('File removed successfully');
            }}
          >
            Remove
          </Button>
        </Space>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '12px' }}>
        <Text strong style={{ fontSize: '14px', color: '#262626', display: 'block', marginBottom: '4px' }}>
          {label}
        </Text>
        <Text type="secondary" style={{ fontSize: '12px', color: '#8c8c8c', display: 'block' }}>
          {type === 'logo' && 'Recommended size: 200×200px for best quality'}
          {type === 'badge-logo' && 'Recommended size: 150×150px for best quality'}
          {type === 'banner' && 'Recommended size: 1200×400px for best quality'}
        </Text>
      </div>
      
      <Upload {...uploadProps} showUploadList={false}>
        {fileList.length === 0 && uploadButton}
      </Upload>

      {uploading && (
        <div style={{ 
          marginTop: '16px',
          padding: '16px',
          background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)',
          borderRadius: '8px',
          border: '1px solid #91d5ff'
        }}>
          <Progress 
            percent={uploadProgress} 
            status="active"
            strokeWidth={6}
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#52c41a',
            }}
          />
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#1890ff'
            }} />
            <Text type="secondary" style={{ fontSize: '12px', color: '#595959' }}>
              Uploading...
            </Text>
          </div>
        </div>
      )}

      {imagePreview}

      {previewImage && (
        <AntImage
          style={{ display: 'none' }}
          src={previewImage}
          preview={{
            visible: previewVisible,
            onVisibleChange: (visible) => setPreviewVisible(visible),
          }}
        />
      )}
    </div>
  );
};

export default FileUpload;
