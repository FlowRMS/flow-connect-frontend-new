/**
 * Invoices List - Utility Functions
 * Reusable helper functions
 */

import type { Invoice } from '@/lib/types/rms';
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

