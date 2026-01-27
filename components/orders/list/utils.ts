/**
 * Orders List - Utility Functions
 * Reusable helper functions
 */

import type { Order } from '@/lib/types/rms';
import type { QuickDatePreset } from './types';

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
