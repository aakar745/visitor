import { format as dateFnsFormat } from 'date-fns';

/**
 * Centralized date formatting utilities
 * Uses DD/MM/YYYY format consistently across the application
 */

/**
 * Format date as DD/MM/YYYY
 * Example: 10/11/2025
 */
export const formatDate = (date: string | Date): string => {
  try {
    return dateFnsFormat(new Date(date), 'dd/MM/yyyy');
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date with time as DD/MM/YYYY HH:mm
 * Example: 10/11/2025 15:30
 */
export const formatDateTime = (date: string | Date): string => {
  try {
    return dateFnsFormat(new Date(date), 'dd/MM/yyyy HH:mm');
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date range as DD/MM/YYYY - DD/MM/YYYY
 * Example: 10/11/2025 - 12/11/2025
 */
export const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
  try {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  } catch {
    return 'Invalid Date Range';
  }
};

/**
 * Format time only as HH:mm
 * Example: 15:30
 */
export const formatTime = (date: string | Date): string => {
  try {
    return dateFnsFormat(new Date(date), 'HH:mm');
  } catch {
    return 'Invalid Time';
  }
};

/**
 * Format date with short month name (for compact display)
 * Example: 10 Nov 2025
 */
export const formatDateShort = (date: string | Date): string => {
  try {
    return dateFnsFormat(new Date(date), 'dd MMM yyyy');
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date range with short month name
 * Example: 10 Nov - 12 Nov 2025
 */
export const formatDateRangeShort = (startDate: string | Date, endDate: string | Date): string => {
  try {
    const start = dateFnsFormat(new Date(startDate), 'dd MMM');
    const end = dateFnsFormat(new Date(endDate), 'dd MMM yyyy');
    return `${start} - ${end}`;
  } catch {
    return 'Invalid Date Range';
  }
};

/**
 * Format date for CSV export as DD-MM-YYYY
 * Example: 10-11-2025
 */
export const formatDateForExport = (date: string | Date): string => {
  try {
    return dateFnsFormat(new Date(date), 'dd-MM-yyyy');
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format datetime for CSV export as DD-MM-YYYY HH:mm:ss
 * Example: 10-11-2025 15:30:45
 */
export const formatDateTimeForExport = (date: string | Date): string => {
  try {
    return dateFnsFormat(new Date(date), 'dd-MM-yyyy HH:mm:ss');
  } catch {
    return 'Invalid Date';
  }
};

