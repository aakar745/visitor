import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants';

/**
 * Axios client instance for visitor frontend
 * No authentication required - this is a public-facing app
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // 8 seconds (reduced for faster failures)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // No cookies needed for public API
  paramsSerializer: {
    // Serialize arrays as repeated parameters: status=active&status=registration_open
    // This is what NestJS expects for array query parameters
    indexes: null,
  },
  // Validate status to prevent throwing on 4xx/5xx
  validateStatus: (status) => status >= 200 && status < 500,
});

/**
 * Request interceptor
 * - Log requests in development
 * - Add request timestamp
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp for request tracking
    config.metadata = { startTime: new Date().getTime() };

    if (process.env.NEXT_PUBLIC_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Log responses in development
 * - Calculate request duration
 * - Handle common errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date().getTime() - (response.config.metadata?.startTime || 0);

    if (process.env.NEXT_PUBLIC_ENV === 'development') {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        `(${duration}ms)`,
        response.data
      );
    }

    return response;
  },
  (error: AxiosError<{ message?: string; error?: string; statusCode?: number }>) => {
    // Calculate request duration
    const duration = error.config?.metadata?.startTime
      ? new Date().getTime() - error.config.metadata.startTime
      : 0;

    if (process.env.NEXT_PUBLIC_ENV === 'development') {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        `(${duration}ms)`,
        error.response?.data || error.message
      );
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        originalError: error,
      });
    }

    // Handle API errors with user-friendly messages
    const errorMessage =
      error.response.data?.message ||
      error.response.data?.error ||
      getDefaultErrorMessage(error.response.status);

    return Promise.reject({
      message: errorMessage,
      statusCode: error.response.status,
      code: error.code,
      originalError: error,
    });
  }
);

/**
 * Get default error message based on status code
 */
function getDefaultErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'This resource already exists.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred.';
  }
}

/**
 * TypeScript module augmentation to add metadata to axios config
 */
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

export default apiClient;

