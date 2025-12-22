/**
 * Check Detail - Utility Functions
 * Helper functions for check detail operations
 */

import type { LineItem, Adjustment } from './types';

/**
 * Format number as currency (USD)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format date string to readable format (MM/DD/YYYY)
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date string to short readable format (MMM DD, YYYY)
 * Example: "2024-12-14" -> "Dec 14, 2024"
 */
export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a month string (YYYY-MM) to readable format (Month - YYYY)
 * Example: "2025-01" -> "Jan - 2025"
 */
export const formatMonth = (monthString: string): string => {
  const date = new Date(monthString + '-01');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} - ${year}`;
};

/**
 * Format number with fixed decimal places
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

/**
 * Format number with locale string (for large numbers)
 */
export const formatNumberLocale = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Calculate summary totals for line items
 */
export const calculateLineItemsSummary = (
  lineItems: LineItem[]
): {
  expectedTotal: number;
  paidTotal: number;
  balanceTotal: number;
  lineCount: number;
} => {
  const expectedTotal = lineItems.reduce(
    (sum, item) => sum + item.expectedCommission,
    0
  );
  const paidTotal = lineItems.reduce(
    (sum, item) => sum + item.paidCommission,
    0
  );
  const balanceTotal = lineItems.reduce((sum, item) => sum + item.balance, 0);
  return {
    expectedTotal,
    paidTotal,
    balanceTotal,
    lineCount: lineItems.length,
  };
};

/**
 * Calculate total adjustments amount
 */
export const calculateTotalAdjustments = (
  adjustments: Adjustment[]
): number => {
  return adjustments.reduce((sum, adj) => sum + adj.amount, 0);
};

/**
 * Check if all line items are selected
 */
export const areAllLineItemsSelected = (
  lineItems: LineItem[],
  selectedIds: Set<string>
): boolean => {
  return (
    lineItems.length > 0 && lineItems.every((item) => selectedIds.has(item.id))
  );
};

/**
 * Toggle all line items selection
 */
export const toggleAllLineItems = (
  lineItems: LineItem[],
  currentSelection: Set<string>
): Set<string> => {
  if (areAllLineItemsSelected(lineItems, currentSelection)) {
    return new Set();
  }
  return new Set(lineItems.map((item) => item.id));
};

