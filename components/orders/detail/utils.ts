/**
 * Order Detail - Utility Functions
 * Helper functions for order detail operations
 */

import type { OrderLineItem, Invoice, CommissionCheck } from '@/lib/types/rms';
import type { ColumnKey } from './types';

// Column labels for the line items table
export const columnLabels: Record<ColumnKey, string> = {
  partNumber: 'Part #',
  custPartNumber: 'Cust Part #',
  description: 'Description',
  uom: 'UOM',
  divisor: 'Divisor',
  unitPrice: 'Unit Price',
  quantity: 'Qty',
  shippedQty: 'Shipped Qty',
  lineStatus: 'Status',
  linkedQuote: 'Quote #',
  linkedInvoice: 'Invoice #',
  linkedCheck: 'Check #',
  linkedFulfillment: 'Fulfillment #',
  sellTotal: 'Sell Total',
  commissionPercent: 'Commission %',
  commission: 'Commission',
  commissionTotal: 'Commission Total',
  invoiced: 'Invoiced',
  percentOver: '% Over',
  commissionAmount: 'Com $',
  ovgPercent: 'Ovg %',
  ovgAmount: 'Ovg $',
  earnPercent: 'Earn %',
  earnAmount: 'Earn $',
  iconAcknowledgement: 'Ack Icon',
  iconDocumentSpecific: 'Doc-Specific Icon',
  iconWarehouse: 'Warehouse Icon',
  iconCredit: 'Credit Icon',
};

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
 * Format date string
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get linked invoices for a line item
 */
export const getLinkedInvoicesForLineItem = (
  lineItem: OrderLineItem,
  orderId: string,
  allInvoices: Invoice[]
): Invoice[] => {
  // First check explicit linkedInvoiceIds on the line item
  if (lineItem.linkedInvoiceIds && lineItem.linkedInvoiceIds.length > 0) {
    return allInvoices.filter((inv) =>
      lineItem.linkedInvoiceIds!.includes(inv.id)
    );
  }

  // Fallback: find invoices linked to this order that contain this line item
  return allInvoices.filter((inv) => {
    if (inv.orderId !== orderId) return false;
    return inv.lineItems.some((invLine) => invLine.orderLineItemId === lineItem.id);
  });
};

/**
 * Calculate overage percentage
 */
export const calculateOveragePercent = (
  lineItem: OrderLineItem
): number => {
  // TODO: Implement overage calculation logic
  return 0;
};

/**
 * Calculate overage amount
 */
export const calculateOverageAmount = (
  lineItem: OrderLineItem,
  overagePercent: number
): number => {
  return lineItem.extendedPrice * (overagePercent / 100);
};

/**
 * Calculate earned amount
 */
export const calculateEarnedAmount = (
  commissionAmount: number,
  overageAmount: number
): number => {
  return commissionAmount + overageAmount;
};

/**
 * Check if line item has acknowledgement
 */
export const hasAcknowledgement = (
  lineItemId: string,
  acknowledgements: Record<string, any>
): boolean => {
  return !!acknowledgements[lineItemId];
};

/**
 * Check if line item has credit
 */
export const hasCredit = (
  lineItemId: string,
  credits: Record<string, any>
): boolean => {
  return !!credits[lineItemId];
};

/**
 * Check if all line items are selected
 */
export const areAllLineItemsSelected = (
  lineItems: OrderLineItem[],
  selectedIds: Set<string>
): boolean => {
  return lineItems.length > 0 && lineItems.every((item) => selectedIds.has(item.id));
};

/**
 * Toggle all line items selection
 */
export const toggleAllLineItems = (
  lineItems: OrderLineItem[],
  currentSelection: Set<string>
): Set<string> => {
  if (areAllLineItemsSelected(lineItems, currentSelection)) {
    return new Set();
  }
  return new Set(lineItems.map((item) => item.id));
};

/**
 * Get overall order shipping status
 */
export const getOrderShipStatus = (
  lineItems: { quantity: number; quantityShipped: number; partNumber?: string; isCredit?: boolean }[]
): { label: string; color: string } => {
  // Filter out freight lines and credit lines
  const productLines = lineItems.filter(item => item.partNumber !== 'FREIGHT' && !item.isCredit);
  if (productLines.length === 0) return { label: 'No Items', color: 'bg-gray-100 text-gray-700' };

  const totalQty = productLines.reduce((sum, item) => sum + item.quantity, 0);
  const totalShipped = productLines.reduce((sum, item) => sum + item.quantityShipped, 0);

  if (totalShipped === 0) {
    return { label: 'Not Shipped', color: 'bg-gray-100 text-gray-700' };
  } else if (totalShipped < totalQty) {
    return { label: 'Partial Shipped', color: 'bg-yellow-100 text-yellow-700' };
  } else if (totalShipped === totalQty) {
    return { label: 'Shipped Complete', color: 'bg-green-100 text-green-700' };
  } else {
    return { label: 'Overshipped', color: 'bg-red-100 text-red-700' };
  }
};

/**
 * Calculate invoiced quantity from linked invoices
 */
export const calculateInvoicedQtyFromInvoices = (
  lineItem: OrderLineItem,
  linkedInvoices: Invoice[]
): number => {
  return linkedInvoices.reduce((total, invoice) => {
    // Find matching line item in invoice
    const matchingLine = invoice.lineItems.find(
      ili => ili.orderLineItemId === lineItem.id
    );
    if (matchingLine) {
      return total + matchingLine.quantity;
    }
    // Fallback: if invoice has no line items (unknown line items case), derive qty from amount
    if (invoice.lineItems.length === 0 && lineItem.unitPrice > 0) {
      // For invoices with no line items, we can't determine per-line allocation
      // So we just indicate there's a linked invoice but status will be based on presence
      return total;
    }
    return total;
  }, 0);
};

/**
 * Get line item shipping status based on invoice quantities
 */
export const getLineShipStatus = (
  lineItem: OrderLineItem,
  linkedInvoices: Invoice[]
): { label: string; color: string } => {
  const orderQty = lineItem.quantity;

  // Calculate invoiced quantity from linked invoices
  let invoicedQty = calculateInvoicedQtyFromInvoices(lineItem, linkedInvoices);

  // Special case: if there are linked invoices with no line items, derive qty from total
  const invoicesWithNoLines = linkedInvoices.filter(inv => inv.lineItems.length === 0);
  if (invoicesWithNoLines.length > 0 && lineItem.unitPrice > 0) {
    // For unknown line items, calculate proportional qty based on invoice total
    // This is a simplification - assumes even distribution across order lines
    invoicesWithNoLines.forEach(inv => {
      // Derive quantity from invoice total / unit price
      const derivedQty = Math.round(inv.total / lineItem.unitPrice);
      invoicedQty += Math.min(derivedQty, orderQty); // Cap at order qty
    });
  }

  if (invoicedQty === 0 && linkedInvoices.length === 0) {
    return { label: 'Open', color: 'bg-gray-100 text-gray-700' };
  } else if (invoicedQty === 0 && linkedInvoices.length > 0) {
    return { label: 'Open', color: 'bg-gray-100 text-gray-700' };
  } else if (invoicedQty < orderQty) {
    return { label: 'Partial Invoiced', color: 'bg-yellow-100 text-yellow-700' };
  } else if (invoicedQty >= orderQty) {
    return { label: 'Invoiced', color: 'bg-green-100 text-green-700' };
  } else {
    return { label: 'Open', color: 'bg-gray-100 text-gray-700' };
  }
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
