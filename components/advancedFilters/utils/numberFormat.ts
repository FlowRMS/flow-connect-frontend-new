/**
 * Number formatting utilities for filters
 * Supports currency, percentage, and plain number formats
 */

import type { NumberFormat } from '../types';

/**
 * Formats a number according to the specified type
 * @param value - Numeric value or string
 * @param format - Format type
 * @returns Formatted string (e.g., "$20.00", "20%", "20")
 */
export function formatNumber(value: string | number, format: NumberFormat = 'number'): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  
  if (isNaN(num)) return '';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    case 'percentage':
      return `${num}%`;
    case 'number':
    default:
      return num.toString();
  }
}

/**
 * Parses a formatted value to a pure number
 * @param formattedValue - Formatted value (e.g., "$20.00", "20%")
 * @param format - Format type
 * @returns Pure number as string or empty string
 */
export function parseFormattedNumber(formattedValue: string, format: NumberFormat = 'number'): string {
  if (!formattedValue) return '';
  
  // Remove symbols according to format
  let cleaned = formattedValue.trim();
  
  switch (format) {
    case 'currency':
      cleaned = cleaned.replace(/[$,]/g, '');
      break;
    case 'percentage':
      cleaned = cleaned.replace(/%/g, '');
      break;
    case 'number':
    default:
      // Only numbers, decimal point and negative sign
      cleaned = cleaned.replace(/[^\d.-]/g, '');
      break;
  }
  
  return cleaned;
}

/**
 * Gets the placeholder according to the format
 * @param format - Format type
 * @returns Placeholder string
 */
export function getNumberPlaceholder(format: NumberFormat = 'number'): string {
  switch (format) {
    case 'currency':
      return '$0.00';
    case 'percentage':
      return '0%';
    case 'number':
    default:
      return '0';
  }
}

