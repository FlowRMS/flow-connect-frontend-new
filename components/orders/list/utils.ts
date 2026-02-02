/**
 * Orders List - Utility Functions
 * Reusable helper functions
 */

import type { Order } from '@/lib/types/rms';

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
 * Check if an order is linked to other entities (invoices, checks, etc.)
 * Order is linked if it has invoices or is on a commission check
 */
export const isOrderLinked = (order: Order): boolean => {
  return (
    order.billingStatus !== 'not_invoiced' ||
    order.commissionStatus === 'paid'
  );
};

/**
 * Get the reason why an order is linked (cannot be selected for bulk actions)
 */
export const getOrderLinkedReason = (order: Order): string => {
  const reasons: string[] = [];
  if (order.billingStatus !== 'not_invoiced') {
    reasons.push('has invoices');
  }
  if (order.commissionStatus === 'paid') {
    reasons.push('is on a commission check');
  }
  return `Cannot select: Order ${reasons.join(' and ')}`;
};

/**
 * Get unique values from orders array by field
 */
export const getUniqueValues = <T extends keyof Order>(
  orders: Order[],
  field: T
): Order[T][] => {
  return [...new Set(orders.map((o) => o[field]))].sort() as Order[T][];
};

/**
 * Get outside reps display string for an order
 */
export const getOutsideRepsDisplay = (order: Order): string => {
  const outsideReps = (order.splitRates || [])
    .filter((sr) => sr.salesRepId !== order.insideRepId)
    .map((sr) => `${sr.salesRepName} (${sr.splitPercentage}%)`)
    .join(', ');
  return outsideReps || '-';
};
