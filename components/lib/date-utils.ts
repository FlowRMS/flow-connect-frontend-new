/**
 * Date Utility Functions
 * Handles local date formatting to prevent timezone-related off-by-one errors
 */

/**
 * Format a Date object to a YYYY-MM-DD string using LOCAL timezone
 * This prevents the off-by-one day issue caused by toISOString() which uses UTC
 * 
 * @param date - The Date object to format
 * @returns A string in YYYY-MM-DD format, or empty string if date is null/undefined
 */
export function formatLocalDate(date: Date | null | undefined): string {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string (YYYY-MM-DD) into a Date object
 * Returns null if the date string is empty, '-', or invalid
 * 
 * @param dateStr - The date string to parse
 * @returns A Date object or null
 */
export function parseLocalDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || dateStr === '-' || dateStr === '') return null;
  
  // Parse the date string as local time by appending T00:00:00
  // This prevents timezone offset issues
  const date = new Date(`${dateStr}T00:00:00`);
  
  return isNaN(date.getTime()) ? null : date;
}
