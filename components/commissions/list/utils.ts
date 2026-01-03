/**
 * Commissions List - Utility Functions
 * Reusable helper functions
 */

import type { CommissionCheck } from '@/lib/types/rms';
import type { QuickDatePreset } from './types';

/**
 * Format a number as currency (USD)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
 * Example: "2025-01" -> "Jan 2025", "2025-01-15" -> "Jan 2025"
 * Returns "-" if null/undefined
 */
export const formatMonth = (monthString: string | null | undefined): string => {
  if (!monthString) return '-';

  // Parse the date - works with both YYYY-MM and YYYY-MM-DD formats
  const date = new Date(monthString);

  // Check for invalid date
  if (isNaN(date.getTime())) return '-';

  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

/**
 * Get date range for quick date filter presets
 */
export const getQuickDateRange = (
  preset: QuickDatePreset
): { start: Date | null; end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { start: startOfWeek, end: endOfWeek };
    }
    case 'last_week': {
      const dayOfWeek = today.getDay();
      const startOfThisWeek = new Date(today);
      startOfThisWeek.setDate(today.getDate() - dayOfWeek);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59, 999);
      return { start: startOfLastWeek, end: endOfLastWeek };
    }
    default:
      return { start: null, end: null };
  }
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

