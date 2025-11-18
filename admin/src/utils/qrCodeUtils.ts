/**
 * QR Code Utilities
 * 
 * Shared utilities for QR code generation, image conversion, and download.
 * Fixes multiple issues:
 * - Memory leaks in FileReader
 * - Missing blob URL cleanup
 * - Image validation
 * - Duplicate code
 */

// QR Code configuration
export const QR_CONFIG = {
  DISPLAY_SIZE: 200, // Display size in UI (smaller for better UX)
  DOWNLOAD_SIZE: 500, // Download size (high resolution for printing)
  DISPLAY_ICON_SIZE: 40, // Logo size in display QR
  DOWNLOAD_ICON_SIZE: 80, // Logo size in download QR
  ERROR_LEVEL: 'H' as const, // Highest error correction
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB max
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_DIMENSIONS: 2000, // Max width/height for logo
} as const;

/**
 * Convert image URL to base64
 * 
 * FIXES:
 * - Memory leak: Proper FileReader cleanup
 * - Validation: Size, type, dimensions check
 * - Error handling: Detailed error messages
 * 
 * @param url - Image URL to convert
 * @param options - Conversion options
 * @returns Base64 string or null on error
 */
export async function convertImageToBase64(
  url: string,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxDimensions?: number;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<string> {
  const {
    maxSize = QR_CONFIG.MAX_IMAGE_SIZE,
    allowedTypes = QR_CONFIG.ALLOWED_TYPES,
    maxDimensions = QR_CONFIG.MAX_DIMENSIONS,
    onProgress,
  } = options;

  return new Promise(async (resolve, reject) => {
    let reader: FileReader | null = null;
    let abortController: AbortController | null = null;

    try {
      // Create abort controller for fetch timeout
      abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController?.abort(), 30000); // 30s timeout

      // Fetch image as blob
      const response = await fetch(url, { signal: abortController.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      // Validate MIME type
      const isValidType = allowedTypes.some(type => type === blob.type);
      if (!isValidType) {
        throw new Error(
          `Invalid image type: ${blob.type}. Allowed: ${allowedTypes.join(', ')}`
        );
      }

      // Validate size
      if (blob.size > maxSize) {
        throw new Error(
          `Image too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB. Max: ${(maxSize / 1024 / 1024).toFixed(2)}MB`
        );
      }

      // Validate dimensions
      const dimensions = await getImageDimensions(blob);
      if (dimensions.width > maxDimensions || dimensions.height > maxDimensions) {
        throw new Error(
          `Image dimensions too large: ${dimensions.width}x${dimensions.height}. Max: ${maxDimensions}x${maxDimensions}`
        );
      }

      // Convert to base64
      reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader!.result as string;
        cleanup();
        resolve(base64String);
      };

      reader.onerror = () => {
        cleanup();
        reject(new Error('Failed to read image data'));
      };

      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      reader.readAsDataURL(blob);

    } catch (error) {
      cleanup();
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          reject(new Error('Image fetch timeout. Please try again.'));
        } else {
          reject(error);
        }
      } else {
        reject(new Error('Unknown error during image conversion'));
      }
    }

    // Cleanup function
    function cleanup() {
      if (reader) {
        reader.onloadend = null;
        reader.onerror = null;
        reader.onprogress = null;
        reader = null;
      }
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    }
  });
}

/**
 * Get image dimensions from blob
 */
function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Download QR code from canvas element at high resolution
 * 
 * FIXES:
 * - Memory leak: Proper blob URL cleanup
 * - DOM cleanup: Remove created elements
 * - High resolution: Uses hidden 500x500 canvas for download
 * - Better error messages
 * 
 * @param displayContainerId - ID of the display container (for fallback)
 * @param downloadContainerId - ID of the hidden high-res container
 * @param filename - Download filename
 * @returns Success boolean
 */
export function downloadQRCode(
  displayContainerId: string,
  downloadContainerId: string,
  filename: string
): { success: boolean; error?: string } {
  try {
    // Try to find the high-res download container first
    let container = document.getElementById(downloadContainerId);
    
    // Fallback to display container if download container not found
    if (!container) {
      console.warn(`High-res container '${downloadContainerId}' not found, using display container`);
      container = document.getElementById(displayContainerId);
    }
    
    if (!container) {
      return { success: false, error: 'QR code container not found' };
    }

    // Find canvas element
    const canvas = container.querySelector('canvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      return { success: false, error: 'QR code canvas not found' };
    }

    // Convert canvas to blob URL at max quality
    const dataUrl = canvas.toDataURL('image/png', 1.0); // Max quality

    // Create temporary download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';

    // Append to body (required for Firefox)
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      // Note: dataUrl from canvas.toDataURL doesn't need URL.revokeObjectURL
    }, 100);

    return { success: true };

  } catch (error) {
    console.error('QR download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download QR code',
    };
  }
}

/**
 * Generate safe filename for QR code
 * Removes special characters and ensures valid filename
 * 
 * @param baseName - Base name (e.g., exhibitor slug)
 * @param suffix - Optional suffix (e.g., 'qr-code')
 * @returns Safe filename with .png extension
 */
export function generateQRFilename(baseName: string, suffix: string = 'qr-code'): string {
  // Remove special characters, keep alphanumeric and hyphens
  const safeName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = new Date().getTime();
  return `${safeName}-${suffix}-${timestamp}.png`;
}

/**
 * Validate QR code value/URL
 * Ensures the QR code contains valid data
 * 
 * @param value - Value to encode in QR
 * @returns Validation result
 */
export function validateQRValue(value: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'QR code value is empty' };
  }

  if (value.length > 2953) {
    // QR code with error level H can hold ~2953 alphanumeric chars
    return { valid: false, error: 'QR code value is too long' };
  }

  // Validate URL if it looks like one
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      new URL(value);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  return { valid: true };
}

/**
 * Get full logo URL from relative path
 * Handles both full URLs and relative paths
 * 
 * @param logoPath - Logo path or URL
 * @returns Full URL or null
 */
export function getFullLogoUrl(logoPath: string | undefined): string | null {
  if (!logoPath) return null;

  // Already a full URL
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }

  // Relative path - prepend API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', ''); // Remove API prefix
  
  // Ensure path starts with /
  const path = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
  
  return `${baseUrl}${path}`;
}

