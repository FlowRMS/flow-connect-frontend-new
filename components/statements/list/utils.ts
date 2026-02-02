/**
 * Statements List - Utility Functions
 * Reusable helper functions
 */

import type { QuickDatePreset } from '../types';

/**
 * Format a number as currency (USD)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date string to readable format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 86400000);
      return { start: yesterday, end: new Date(yesterday.getTime() + 86400000 - 1) };
    }
    case 'thisWeek': {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today.getTime() - dayOfWeek * 86400000);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000 - 1);
      return { start: startOfWeek, end: endOfWeek };
    }
    case 'lastWeek': {
      const dayOfWeek = today.getDay();
      const startOfLastWeek = new Date(today.getTime() - (dayOfWeek + 7) * 86400000);
      const endOfLastWeek = new Date(startOfLastWeek.getTime() + 7 * 86400000 - 1);
      return { start: startOfLastWeek, end: endOfLastWeek };
    }
    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      return { start: startOfMonth, end: endOfMonth };
    }
    case 'lastMonth': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
      return { start: startOfLastMonth, end: endOfLastMonth };
    }
    case 'thisQuarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      return { start: startOfQuarter, end: endOfQuarter };
    }
    case 'lastQuarter': {
      const quarter = Math.floor(today.getMonth() / 3) - 1;
      const year = quarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
      const adjQuarter = quarter < 0 ? 3 : quarter;
      const startOfQuarter = new Date(year, adjQuarter * 3, 1);
      const endOfQuarter = new Date(year, adjQuarter * 3 + 3, 0, 23, 59, 59);
      return { start: startOfQuarter, end: endOfQuarter };
    }
    case 'thisYear': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
      return { start: startOfYear, end: endOfYear };
    }
    case 'lastYear': {
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);
      return { start: startOfLastYear, end: endOfLastYear };
    }
    default:
      return { start: null, end: null };
  }
};
