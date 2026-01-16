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
 * Always calculates from line items to ensure accuracy (like quotes does)
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
  // Always calculate subtotal from line items (sum of sellTotal/amount)
  const subtotal = invoice.lineItems.reduce((sum, item) => {
    const lineItem = item as InvoiceLineItem;
    const quantity = lineItem.quantity || 0;
    const unitPrice = lineItem.unitPrice || 0;
    const divisor = lineItem.divisor || 1;
    const sellTotal = quantity * unitPrice / divisor;
    return sum + sellTotal;
  }, 0);

  // Always calculate commission from line items
  const totalCommission = invoice.lineItems.reduce((sum, item) => {
    const lineItem = item as InvoiceLineItem;
    const quantity = lineItem.quantity || 0;
    const unitPrice = lineItem.unitPrice || 0;
    const divisor = lineItem.divisor || 1;
    const commissionRate = lineItem.commissionRate ?? 0;
    const sellTotal = quantity * unitPrice / divisor;
    const commission = sellTotal * (commissionRate / 100);
    return sum + commission;
  }, 0);

  // Calculate overage totals from line items
  const totalOvg = invoice.lineItems.reduce(
    (sum, item) => sum + (item.unitPrice * 0.15 * item.quantity * 0.85),
    0
  );
  const totalEarn = totalCommission + totalOvg;

  return {
    subtotal,
    freight: 0,
    total: subtotal,
    commission: totalCommission,
    amountPaid: 0,
    balance: 0,
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

