// Utility functions for formatting display values

/**
 * Format numbers to remove unnecessary .00 decimals
 * Examples: 123.00 -> 123, 123.50 -> 123.5, 123.45 -> 123.45
 */
export function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // Check if it's a number (including string numbers)
  const num = Number(str);
  if (isNaN(num)) return str;
  
  // If it's a whole number, return without decimals
  if (num % 1 === 0) {
    return String(Math.round(num));
  }
  
  // For decimals, remove trailing zeros
  return parseFloat(num.toFixed(10)).toString();
}

/**
 * Check if a field name indicates it's a date field
 */
export function isDateField(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();
  return lowerName.includes('date') || lowerName === 'posted';
}

/**
 * Format a date from YYYY-MM-DD to MM-DD-YYYY
 * Returns the original value if it's not a valid date format
 */
export function formatDateDisplay(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  // Match YYYY-MM-DD format
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${month}-${day}-${year}`;
  }
  
  return value;
}

/**
 * Convert a date from MM-DD-YYYY to YYYY-MM-DD for storage
 * Returns the original value if it's not in MM-DD-YYYY format
 */
export function formatDateForStorage(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  // Match MM-DD-YYYY format
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  return value;
}

/**
 * Convert a date string to format suitable for HTML date input (YYYY-MM-DD)
 */
export function toDateInputValue(value: string): string {
  if (!value || typeof value !== 'string') return '';
  
  // If already in YYYY-MM-DD format, return as is
  if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return value;
  }
  
  // If in MM-DD-YYYY format, convert to YYYY-MM-DD
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  return '';
}

/**
 * Format display values - handles numbers, strings, dates, and objects
 */
export function formatDisplayValue(value: unknown, fieldName?: string): string {
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'number') {
    return formatNumber(value);
  }
  
  if (typeof value === 'string') {
    // Format date fields
    if (fieldName && isDateField(fieldName)) {
      return formatDateDisplay(value);
    }
    
    // Try to format as number if it looks like one
    const num = Number(value);
    if (!isNaN(num) && value.match(/^\d+\.?\d*$/)) {
      return formatNumber(num);
    }
    return value;
  }
  
  return String(value);
}




