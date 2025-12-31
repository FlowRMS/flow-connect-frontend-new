/**
 * Invoice Detail - Utility Functions
 * Helper functions for invoice detail operations
 */

import type { Invoice, InvoiceLineItem as RmsInvoiceLineItem, Order, CommissionCheck } from '@/lib/types/rms';
import type { EditableInvoice, InvoiceLineItem } from './types';

/**
 * Format number as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format date string (MM/DD/YYYY format)
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

/**
 * Check if invoice is overdue
 * Accepts EditableInvoice (local type) or Invoice (RMS type)
 */
export const isOverdue = (invoice: EditableInvoice | Invoice): boolean => {
  if (invoice.status !== 'open' && invoice.status !== 'partial_paid') return false;
  return new Date(invoice.dueDate) < new Date();
};

/**
 * Get linked orders for an invoice line item
 * Accepts local InvoiceLineItem type and EditableInvoice
 */
export const getLinkedOrdersForInvoiceLine = (
  invoiceLineItem: InvoiceLineItem,
  invoice: EditableInvoice | Invoice,
  allOrders: Order[]
): Order[] => {
  // Fallback: find order via orderLineItemId
  if (invoiceLineItem.orderLineItemId) {
    const linkedOrder = allOrders.find(order =>
      order.lineItems.some(oli => oli.id === invoiceLineItem.orderLineItemId)
    );
    return linkedOrder ? [linkedOrder] : [];
  }

  // Last resort: use invoice's orderId
  const order = allOrders.find(o => o.id === invoice.orderId);
  return order ? [order] : [];
};

/**
 * Get linked commission checks for an invoice
 */
export const getLinkedChecksForInvoice = (
  invoiceId: string,
  allChecks: CommissionCheck[]
): CommissionCheck[] => {
  return allChecks.filter(check =>
    check.details.some(detail => detail.type === 'invoice' && detail.referenceId === invoiceId)
  );
};

/**
 * Calculate totals for an invoice
 * Accepts EditableInvoice (local type) or Invoice (RMS type)
 */
export const calculateInvoiceTotals = (invoice: EditableInvoice | Invoice): {
  subtotal: number;
  freight: number;
  total: number;
  commission: number;
  amountPaid: number;
  balance: number;
  totalOvg: number;
  totalEarn: number;
} => {
  // Calculate overage totals from line items
  const totalCommission = invoice.lineItems.reduce(
    (sum, item) => sum + ((item as InvoiceLineItem).amount || 0) * ((item as InvoiceLineItem).commissionRate || 0.08),
    0
  );
  const totalOvg = invoice.lineItems.reduce(
    (sum, item) => sum + (item.unitPrice * 0.15 * item.quantity * 0.85),
    0
  );
  const totalEarn = totalCommission + totalOvg;

  return {
    subtotal: invoice.subtotal,
    freight: invoice.freight,
    total: invoice.total,
    commission: invoice.totalCommission,
    amountPaid: invoice.amountPaid,
    balance: invoice.balance,
    totalOvg,
    totalEarn,
  };
};

/**
 * Check if all line items are selected
 */
export const areAllLineItemsSelected = (
  lineItems: InvoiceLineItem[],
  selectedIds: Set<string>
): boolean => {
  return lineItems.length > 0 && lineItems.every((item) => selectedIds.has(item.id));
};

/**
 * Toggle all line items selection
 */
export const toggleAllLineItems = (
  lineItems: InvoiceLineItem[],
  currentSelection: Set<string>
): Set<string> => {
  if (areAllLineItemsSelected(lineItems, currentSelection)) {
    return new Set();
  }
  return new Set(lineItems.map((item) => item.id));
};

