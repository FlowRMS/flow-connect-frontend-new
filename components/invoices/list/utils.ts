/**
 * Invoices List - Utility Functions
 * Reusable helper functions
 */

import type { Invoice } from '@/lib/types/rms';

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
 * Check if an invoice is linked to other entities (commission checks, etc.)
 * Invoice is linked if it's locked or has been paid
 */
export const isInvoiceLinked = (invoice: Invoice): boolean => {
  return invoice.isLocked || invoice.status === 'paid';
};

/**
 * Get the reason why an invoice is linked (cannot be selected for bulk actions)
 */
export const getInvoiceLinkedReason = (invoice: Invoice): string => {
  const reasons: string[] = [];
  if (invoice.isLocked) {
    reasons.push('is locked');
  }
  if (invoice.status === 'paid') {
    reasons.push('has been paid');
  }
  return `Cannot select: Invoice ${reasons.join(' and ')}`;
};

/**
 * Check if an invoice is overdue
 * An invoice is overdue if it's status is 'open' or 'partial_paid' and the due date has passed
 */
export const isOverdue = (invoice: Invoice): boolean => {
  if (invoice.status !== 'open' && invoice.status !== 'partial_paid') return false;
  return new Date(invoice.dueDate) < new Date();
};

/**
 * Get the number of days until the due date
 * Positive number = days until due, negative = days past due
 */
export const getDaysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get outside reps display string for an invoice
 * Returns a formatted string of outside reps with their split percentages
 */
export const getOutsideRepsDisplay = (invoice: Invoice): string => {
  const outsideReps = invoice.splitRates
    .filter((sr) => sr.salesRepId !== invoice.insideRepId)
    .map((sr) => `${sr.salesRepName} (${sr.splitPercentage}%)`)
    .join(', ');
  return outsideReps || '-';
};

