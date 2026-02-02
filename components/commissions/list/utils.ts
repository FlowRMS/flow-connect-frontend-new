/**
 * Commissions List - Utility Functions
 * Reusable helper functions
 */

import type { CommissionCheck } from '@/lib/types/rms';

// Re-export shared getQuickDateRange for backwards compatibility
export { getQuickDateRange } from '@/components/shared/utils/dateUtils';

/**
 * Format a number as currency (USD) with full precision (up to 4 decimal places)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
};

/**
 * Format a date string to readable format (MM/DD/YYYY)
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a month string to readable format (Month YYYY)
 * Handles both formats: "YYYY-MM" (e.g., "2025-01") and "YYYY-MM-DD" (e.g., "2025-01-01")
 * Example: "2025-01" -> "Jan 2025", "2025-12-01" -> "Dec 2025"
 * Returns "-" if null/undefined
 *
 * Note: Parses the date string manually to avoid timezone issues
 */
export const formatMonth = (monthString: string | null | undefined): string => {
  if (!monthString) return '-';

  // Parse the date string manually to avoid timezone issues
  // Handle both "YYYY-MM" and "YYYY-MM-DD" formats
  const parts = monthString.split('-');
  if (parts.length < 2) return '-';

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  // Validate year and month
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return '-';

  // Create a date object using local timezone to avoid UTC conversion issues
  // We use the first day of the month to ensure consistent month display
  const date = new Date(year, month - 1, 1);

  // Check for invalid date
  if (isNaN(date.getTime())) return '-';

  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  return `${monthName} ${year}`;
};

/**
 * Check if a commission check is linked to other entities
 * Check is linked if it's posted (has been finalized)
 */
export const isCheckLinked = (check: CommissionCheck): boolean => {
  const status = check.status?.toUpperCase();
  return status === 'POSTED';
};

/**
 * Get the reason why a check is linked (cannot be selected for bulk actions)
 */
export const getCheckLinkedReason = (check: CommissionCheck): string => {
  const status = check.status?.toUpperCase();
  if (status === 'POSTED') {
    return 'Cannot select: Check has been posted';
  }
  return 'Cannot select: Check is linked to other entities';
};

