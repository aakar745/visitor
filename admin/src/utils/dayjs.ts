/**
 * Day.js Configuration with India Timezone (IST)
 * 
 * This ensures all dates in the admin panel use Asia/Kolkata timezone
 * regardless of the user's system timezone.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Set default timezone to India (Asia/Kolkata = IST = UTC+5:30)
dayjs.tz.setDefault('Asia/Kolkata');

/**
 * Get current date/time in India timezone
 */
export const now = () => dayjs.tz(undefined, 'Asia/Kolkata');

/**
 * Parse date string and convert to India timezone
 */
export const parseDate = (date: string | Date | dayjs.Dayjs) => {
  return dayjs.tz(date, 'Asia/Kolkata');
};

/**
 * Convert date to India timezone and format as ISO string
 * This should be used when sending dates to the backend
 * 
 * @param date - The date to convert
 * @param setEndOfDay - If true, sets time to 23:59:59 (for end dates)
 */
export const toBackendDate = (date: dayjs.Dayjs | undefined | null, setEndOfDay: boolean = false): string => {
  if (!date) return '';
  
  let adjustedDate = date;
  
  // If this is an end date, set to end of day (23:59:59)
  if (setEndOfDay) {
    adjustedDate = date.endOf('day');
  }
  
  // Convert to India timezone, then to ISO string
  return adjustedDate.tz('Asia/Kolkata').toISOString();
};

/**
 * Convert backend date (ISO string in UTC) to India timezone for display
 */
export const fromBackendDate = (dateString: string) => {
  if (!dateString) return undefined;
  // Parse as UTC, then convert to India timezone
  return dayjs.utc(dateString).tz('Asia/Kolkata');
};

// Export configured dayjs as default
export default dayjs;

