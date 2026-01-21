/**
 * Helper function to parse date string (handles both date and datetime formats)
 * @param dateStr - Date string to parse (YYYY-MM-DD or ISO datetime format)
 * @returns Parsed Date object or null if invalid
 */
export function parseDateString(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  // Handle YYYY-MM-DD format by creating date at midnight local time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr + 'T00:00:00');
    return isNaN(date.getTime()) ? null : date;
  }
  // Handle datetime format
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Helper function to format date to ISO string for backend
 * Formats as YYYY-MM-DD for date fields
 * @param date - Date object to format
 * @returns Formatted date string (YYYY-MM-DD) or empty string if date is null
 */
export function formatDateToISO(date: Date | null): string {
  if (!date) return '';
  // Format as YYYY-MM-DD for date fields, or full ISO for datetime
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper function to format date to backend datetime format
 * Formats as '%Y-%m-%d %H:%M:%S' (e.g., '2026-01-18 04:59:59')
 * @param date - Date object to format
 * @returns Formatted date string (YYYY-MM-DD HH:MM:SS) or empty string if date is null
 */
export function formatDateToBackend(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

