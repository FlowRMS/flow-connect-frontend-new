/**
 * PDF Builder Utilities
 * Helper functions for the PDF Builder component
 */

import type {
  PDFEntityType,
  PDFPreOpportunity,
  PDFQuote,
  PDFOrder,
  PDFInvoice,
  PDFCheck,
  PDFPreOpportunityDetail,
  PDFQuoteDetail,
  PDFOrderDetail,
  PDFInvoiceDetail,
  PDFCheckDetail,
} from '@/components/lib/graphql/pdf-entities';
import type { PDFFieldConfig, PDFLineItemConfig } from './types';

// Format currency
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format date
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Format number
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Format percentage
export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return '0%';
  return `${formatNumber(value)}%`;
}

// Get entity number from entity data
export function getEntityNumber(
  entityType: PDFEntityType,
  data: PDFPreOpportunity | PDFQuote | PDFOrder | PDFInvoice | PDFCheck
): string {
  switch (entityType) {
    case 'PRE_OPPORTUNITIES':
      return (data as PDFPreOpportunity).entityNumber || '';
    case 'QUOTES':
      return (data as PDFQuote).quoteNumber || '';
    case 'ORDERS':
      return (data as PDFOrder).orderNumber || '';
    case 'INVOICES':
      return (data as PDFInvoice).invoiceNumber || '';
    case 'CHECKS':
      return (data as PDFCheck).checkNumber || '';
    default:
      return '';
  }
}

// Get entity date from entity data
export function getEntityDate(
  data: PDFPreOpportunity | PDFQuote | PDFOrder | PDFInvoice | PDFCheck
): string {
  return (data as any).entityDate || '';
}

// Extract fields from Pre-Opportunity
function extractPreOpportunityFields(data: PDFPreOpportunity): PDFFieldConfig[] {
  return [
    { id: 'entityNumber', label: 'Pre-Opp #', visible: true, editable: false, value: data.entityNumber, type: 'text', category: 'header' },
    { id: 'status', label: 'Status', visible: true, editable: false, value: data.status, type: 'text', category: 'header' },
    { id: 'entityDate', label: 'Date', visible: true, editable: true, value: data.entityDate, type: 'date', category: 'dates' },
    { id: 'expDate', label: 'Expiration Date', visible: true, editable: true, value: data.expDate, type: 'date', category: 'dates' },
    { id: 'reviseDate', label: 'Revised Date', visible: false, editable: true, value: data.reviseDate, type: 'date', category: 'dates' },
    { id: 'acceptDate', label: 'Accept Date', visible: false, editable: true, value: data.acceptDate, type: 'date', category: 'dates' },
    { id: 'customerRef', label: 'Customer Ref', visible: true, editable: true, value: data.customerRef, type: 'text', category: 'customer' },
    { id: 'paymentTerms', label: 'Payment Terms', visible: true, editable: true, value: data.paymentTerms, type: 'text', category: 'terms' },
    { id: 'freightTerms', label: 'Freight Terms', visible: true, editable: true, value: data.freightTerms, type: 'text', category: 'terms' },
    { id: 'jobName', label: 'Job Name', visible: true, editable: false, value: data.job?.jobName, type: 'text', category: 'other' },
    { id: 'createdBy', label: 'Created By', visible: true, editable: false, value: data.createdBy?.fullName, type: 'text', category: 'other' },
    { id: 'subtotal', label: 'Subtotal', visible: true, editable: false, value: data.balance?.subtotal, type: 'currency', category: 'summary' },
    { id: 'discount', label: 'Discount', visible: true, editable: false, value: data.balance?.discount, type: 'currency', category: 'summary' },
    { id: 'total', label: 'Total', visible: true, editable: false, value: data.balance?.total, type: 'currency', category: 'summary' },
  ];
}

// Extract fields from Quote
function extractQuoteFields(data: PDFQuote): PDFFieldConfig[] {
  return [
    { id: 'quoteNumber', label: 'Quote #', visible: true, editable: false, value: data.quoteNumber, type: 'text', category: 'header' },
    { id: 'status', label: 'Status', visible: true, editable: false, value: data.status, type: 'text', category: 'header' },
    { id: 'pipelineStage', label: 'Pipeline Stage', visible: false, editable: false, value: data.pipelineStage, type: 'text', category: 'header' },
    { id: 'entityDate', label: 'Quote Date', visible: true, editable: true, value: data.entityDate, type: 'date', category: 'dates' },
    { id: 'expDate', label: 'Expiration Date', visible: true, editable: true, value: data.expDate, type: 'date', category: 'dates' },
    { id: 'reviseDate', label: 'Revised Date', visible: false, editable: true, value: data.reviseDate, type: 'date', category: 'dates' },
    { id: 'acceptDate', label: 'Accept Date', visible: false, editable: true, value: data.acceptDate, type: 'date', category: 'dates' },
    { id: 'soldToCustomer', label: 'Sold To', visible: true, editable: false, value: data.soldToCustomer?.companyName, type: 'text', category: 'customer' },
    { id: 'billToCustomer', label: 'Bill To', visible: true, editable: false, value: data.billToCustomer?.companyName, type: 'text', category: 'customer' },
    { id: 'customerRef', label: 'Customer Ref', visible: true, editable: true, value: data.customerRef, type: 'text', category: 'customer' },
    { id: 'paymentTerms', label: 'Payment Terms', visible: true, editable: true, value: data.paymentTerms, type: 'text', category: 'terms' },
    { id: 'freightTerms', label: 'Freight Terms', visible: true, editable: true, value: data.freightTerms, type: 'text', category: 'terms' },
    { id: 'createdBy', label: 'Account Manager', visible: true, editable: false, value: data.createdBy?.fullName, type: 'text', category: 'other' },
    { id: 'subtotal', label: 'Subtotal', visible: true, editable: false, value: data.balance?.subtotal, type: 'currency', category: 'summary' },
    { id: 'discount', label: 'Discount', visible: true, editable: false, value: data.balance?.discount, type: 'currency', category: 'summary' },
    { id: 'total', label: 'Total', visible: true, editable: false, value: data.balance?.total, type: 'currency', category: 'summary' },
  ];
}

// Extract fields from Order
function extractOrderFields(data: PDFOrder): PDFFieldConfig[] {
  return [
    { id: 'orderNumber', label: 'Order #', visible: true, editable: false, value: data.orderNumber, type: 'text', category: 'header' },
    { id: 'status', label: 'Status', visible: true, editable: false, value: data.status, type: 'text', category: 'header' },
    { id: 'orderType', label: 'Order Type', visible: false, editable: false, value: data.orderType, type: 'text', category: 'header' },
    { id: 'factSoNumber', label: 'Factory SO #', visible: true, editable: true, value: data.factSoNumber, type: 'text', category: 'header' },
    { id: 'markNumber', label: 'Mark #', visible: false, editable: true, value: data.markNumber, type: 'text', category: 'header' },
    { id: 'entityDate', label: 'Order Date', visible: true, editable: true, value: data.entityDate, type: 'date', category: 'dates' },
    { id: 'dueDate', label: 'Due Date', visible: true, editable: true, value: data.dueDate, type: 'date', category: 'dates' },
    { id: 'projectedShipDate', label: 'Projected Ship Date', visible: true, editable: true, value: data.projectedShipDate, type: 'date', category: 'dates' },
    { id: 'shipDate', label: 'Ship Date', visible: false, editable: true, value: data.shipDate, type: 'date', category: 'dates' },
    { id: 'soldToCustomer', label: 'Sold To', visible: true, editable: false, value: data.soldToCustomer?.companyName, type: 'text', category: 'customer' },
    { id: 'billToCustomer', label: 'Bill To', visible: true, editable: false, value: data.billToCustomer?.companyName, type: 'text', category: 'customer' },
    { id: 'factory', label: 'Manufacturer', visible: true, editable: false, value: data.factory?.title, type: 'text', category: 'other' },
    { id: 'freightTerms', label: 'Freight Terms', visible: true, editable: true, value: data.freightTerms, type: 'text', category: 'terms' },
    { id: 'shippingTerms', label: 'Shipping Terms', visible: true, editable: true, value: data.shippingTerms, type: 'text', category: 'terms' },
    { id: 'createdBy', label: 'Account Manager', visible: true, editable: false, value: data.createdBy?.fullName, type: 'text', category: 'other' },
    { id: 'subtotal', label: 'Subtotal', visible: true, editable: false, value: data.balance?.subtotal, type: 'currency', category: 'summary' },
    { id: 'discount', label: 'Discount', visible: true, editable: false, value: data.balance?.discount, type: 'currency', category: 'summary' },
    { id: 'total', label: 'Total', visible: true, editable: false, value: data.balance?.total, type: 'currency', category: 'summary' },
  ];
}

// Extract fields from Invoice
function extractInvoiceFields(data: PDFInvoice): PDFFieldConfig[] {
  return [
    { id: 'invoiceNumber', label: 'Invoice #', visible: true, editable: false, value: data.invoiceNumber, type: 'text', category: 'header' },
    { id: 'status', label: 'Status', visible: true, editable: false, value: data.status, type: 'text', category: 'header' },
    { id: 'orderNumber', label: 'Order #', visible: true, editable: false, value: data.order?.orderNumber, type: 'text', category: 'header' },
    { id: 'entityDate', label: 'Invoice Date', visible: true, editable: true, value: data.entityDate, type: 'date', category: 'dates' },
    { id: 'dueDate', label: 'Due Date', visible: true, editable: true, value: data.dueDate, type: 'date', category: 'dates' },
    { id: 'factory', label: 'Manufacturer', visible: true, editable: false, value: data.factory?.title, type: 'text', category: 'other' },
    { id: 'createdBy', label: 'Account Manager', visible: true, editable: false, value: data.createdBy?.fullName, type: 'text', category: 'other' },
    { id: 'subtotal', label: 'Subtotal', visible: true, editable: false, value: data.balance?.subtotal, type: 'currency', category: 'summary' },
    { id: 'discount', label: 'Discount', visible: true, editable: false, value: data.balance?.discount, type: 'currency', category: 'summary' },
    { id: 'total', label: 'Total', visible: true, editable: false, value: data.balance?.total, type: 'currency', category: 'summary' },
    { id: 'paidBalance', label: 'Paid', visible: true, editable: false, value: data.balance?.paidBalance, type: 'currency', category: 'summary' },
  ];
}

// Extract fields from Check
function extractCheckFields(data: PDFCheck): PDFFieldConfig[] {
  return [
    { id: 'checkNumber', label: 'Check #', visible: true, editable: false, value: data.checkNumber, type: 'text', category: 'header' },
    { id: 'status', label: 'Status', visible: true, editable: false, value: data.status, type: 'text', category: 'header' },
    { id: 'entityDate', label: 'Check Date', visible: true, editable: true, value: data.entityDate, type: 'date', category: 'dates' },
    { id: 'postDate', label: 'Post Date', visible: true, editable: true, value: data.postDate, type: 'date', category: 'dates' },
    { id: 'commissionMonth', label: 'Commission Month', visible: true, editable: true, value: data.commissionMonth, type: 'text', category: 'dates' },
    { id: 'factory', label: 'Manufacturer', visible: true, editable: false, value: data.factory?.title, type: 'text', category: 'other' },
    { id: 'createdBy', label: 'Created By', visible: true, editable: false, value: data.createdBy?.fullName, type: 'text', category: 'other' },
    { id: 'enteredCommissionAmount', label: 'Commission Amount', visible: true, editable: false, value: data.enteredCommissionAmount, type: 'currency', category: 'summary' },
  ];
}

// Extract fields based on entity type
export function extractFields(
  entityType: PDFEntityType,
  data: PDFPreOpportunity | PDFQuote | PDFOrder | PDFInvoice | PDFCheck
): PDFFieldConfig[] {
  switch (entityType) {
    case 'PRE_OPPORTUNITIES':
      return extractPreOpportunityFields(data as PDFPreOpportunity);
    case 'QUOTES':
      return extractQuoteFields(data as PDFQuote);
    case 'ORDERS':
      return extractOrderFields(data as PDFOrder);
    case 'INVOICES':
      return extractInvoiceFields(data as PDFInvoice);
    case 'CHECKS':
      return extractCheckFields(data as PDFCheck);
    default:
      return [];
  }
}

// Extract line items from detail records
function extractPreOpportunityLineItems(details: PDFPreOpportunityDetail[]): PDFLineItemConfig[] {
  return details.map((detail) => ({
    id: detail.id,
    visible: true,
    itemNumber: detail.itemNumber,
    product: detail.product?.factoryPartNumber || '-',
    description: detail.product?.description || '-',
    quantity: detail.quantity,
    unitPrice: detail.unitPrice,
    uom: 'EA',
    total: detail.total,
  }));
}

function extractQuoteLineItems(details: PDFQuoteDetail[]): PDFLineItemConfig[] {
  return details.map((detail) => ({
    id: detail.id,
    visible: true,
    itemNumber: detail.itemNumber,
    product: detail.productNameAdhoc || detail.product?.factoryPartNumber || '-',
    description: detail.productDescriptionAdhoc || detail.product?.description || '-',
    quantity: detail.quantity,
    unitPrice: detail.unitPrice,
    uom: detail.uom?.title || 'EA',
    total: detail.total,
  }));
}

function extractOrderLineItems(details: PDFOrderDetail[]): PDFLineItemConfig[] {
  return details.map((detail) => ({
    id: detail.id,
    visible: true,
    itemNumber: detail.itemNumber,
    product: detail.productNameAdhoc || detail.product?.factoryPartNumber || '-',
    description: detail.productDescriptionAdhoc || detail.product?.description || '-',
    quantity: detail.quantity,
    unitPrice: detail.unitPrice,
    uom: detail.uom?.title || 'EA',
    total: detail.total,
  }));
}

function extractInvoiceLineItems(details: PDFInvoiceDetail[]): PDFLineItemConfig[] {
  return details.map((detail) => ({
    id: detail.id,
    visible: true,
    itemNumber: detail.itemNumber,
    product: detail.productNameAdhoc || detail.product?.factoryPartNumber || '-',
    description: detail.productDescriptionAdhoc || detail.product?.description || '-',
    quantity: detail.quantity,
    unitPrice: detail.unitPrice,
    uom: detail.uom?.title || 'EA',
    total: detail.total,
  }));
}

function extractCheckLineItems(details: PDFCheckDetail[]): PDFLineItemConfig[] {
  return details.map((detail, index) => {
    let source = '-';
    let reference = '-';

    if (detail.invoice) {
      source = 'Invoice';
      reference = detail.invoice.invoiceNumber;
    } else if (detail.credit) {
      source = 'Credit';
      reference = detail.credit.creditNumber;
    } else if (detail.adjustment) {
      source = 'Adjustment';
      reference = detail.adjustment.adjustmentNumber;
    }

    return {
      id: detail.id,
      visible: true,
      itemNumber: index + 1,
      product: source,
      description: reference,
      quantity: 1,
      unitPrice: detail.appliedAmount || 0,
      uom: '-',
      total: detail.appliedAmount || 0,
    };
  });
}

// Extract line items based on entity type
export function extractLineItems(
  entityType: PDFEntityType,
  data: PDFPreOpportunity | PDFQuote | PDFOrder | PDFInvoice | PDFCheck
): PDFLineItemConfig[] {
  switch (entityType) {
    case 'PRE_OPPORTUNITIES':
      return extractPreOpportunityLineItems((data as PDFPreOpportunity).details || []);
    case 'QUOTES':
      return extractQuoteLineItems((data as PDFQuote).details || []);
    case 'ORDERS':
      return extractOrderLineItems((data as PDFOrder).details || []);
    case 'INVOICES':
      return extractInvoiceLineItems((data as PDFInvoice).details || []);
    case 'CHECKS':
      return extractCheckLineItems((data as PDFCheck).details || []);
    default:
      return [];
  }
}

// Get status color class
export function getStatusColor(status: string): string {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('open') || statusLower.includes('qualified')) {
    return 'bg-blue-100 text-blue-700';
  }
  if (statusLower.includes('won') || statusLower.includes('complete') || statusLower.includes('paid') || statusLower.includes('posted')) {
    return 'bg-green-100 text-green-700';
  }
  if (statusLower.includes('lost') || statusLower.includes('cancelled') || statusLower.includes('void')) {
    return 'bg-red-100 text-red-700';
  }
  if (statusLower.includes('partial') || statusLower.includes('pending') || statusLower.includes('negotiation')) {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-gray-100 text-gray-700';
}

// Format status label
export function formatStatus(status: string): string {
  if (!status) return '-';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
