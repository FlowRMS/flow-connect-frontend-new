/**
 * Excel Builder Types
 * Type definitions for the Excel Builder component
 */

import type {
  PDFEntityType,
  PDFPreOpportunity,
  PDFQuote,
  PDFOrder,
  PDFInvoice,
  PDFCheck,
} from '@/components/lib/graphql/pdf-entities';
import type {
  PDFFieldConfig,
  PDFLineItemConfig,
  PDFColumnConfig,
} from '../pdf-builder/types';

// Re-export types from PDF builder for consistency
export type ExcelFieldConfig = PDFFieldConfig;
export type ExcelLineItemConfig = PDFLineItemConfig;
export type ExcelColumnConfig = PDFColumnConfig;

// Excel Builder state
export interface ExcelBuilderState {
  entityType: PDFEntityType;
  entityId: string;
  entityData: PDFPreOpportunity | PDFQuote | PDFOrder | PDFInvoice | PDFCheck | null;
  fields: ExcelFieldConfig[];
  lineItems: ExcelLineItemConfig[];
  columns: ExcelColumnConfig[];
  isLoading: boolean;
  error: string | null;
  // Organization info
  organizationName: string;
  // Display options
  showLineNumbers: boolean;
  includeHeader: boolean;
  includeTotals: boolean;
}

// Entity type labels (same as PDF)
export const ENTITY_TYPE_LABELS: Record<PDFEntityType, string> = {
  PRE_OPPORTUNITIES: 'Pre-Opportunity',
  QUOTES: 'Quote',
  ORDERS: 'Order',
  INVOICES: 'Invoice',
  CHECKS: 'Commission Check',
};

// Get entity number field name
export const ENTITY_NUMBER_FIELD: Record<PDFEntityType, string> = {
  PRE_OPPORTUNITIES: 'entityNumber',
  QUOTES: 'quoteNumber',
  ORDERS: 'orderNumber',
  INVOICES: 'invoiceNumber',
  CHECKS: 'checkNumber',
};

// Default columns for each entity type (same as PDF)
export const DEFAULT_COLUMNS: Record<PDFEntityType, ExcelColumnConfig[]> = {
  PRE_OPPORTUNITIES: [
    { id: 'itemNumber', label: 'Item #', visible: true, width: '60px' },
    { id: 'product', label: 'Product', visible: true, width: '180px' },
    { id: 'description', label: 'Description', visible: true },
    { id: 'unitPrice', label: 'Unit Price', visible: true, width: '100px' },
    { id: 'quantity', label: 'Qty', visible: true, width: '60px' },
    { id: 'uom', label: 'UOM', visible: true, width: '60px' },
    { id: 'total', label: 'Total', visible: true, width: '100px' },
  ],
  QUOTES: [
    { id: 'itemNumber', label: 'Item #', visible: true, width: '60px' },
    { id: 'product', label: 'Product', visible: true, width: '180px' },
    { id: 'description', label: 'Description', visible: true },
    { id: 'unitPrice', label: 'Unit Price', visible: true, width: '100px' },
    { id: 'quantity', label: 'Qty', visible: true, width: '60px' },
    { id: 'uom', label: 'UOM', visible: true, width: '60px' },
    { id: 'total', label: 'Total', visible: true, width: '100px' },
  ],
  ORDERS: [
    { id: 'itemNumber', label: 'Item #', visible: true, width: '60px' },
    { id: 'product', label: 'Product', visible: true, width: '180px' },
    { id: 'description', label: 'Description', visible: true },
    { id: 'unitPrice', label: 'Unit Price', visible: true, width: '100px' },
    { id: 'quantity', label: 'Qty', visible: true, width: '60px' },
    { id: 'uom', label: 'UOM', visible: true, width: '60px' },
    { id: 'total', label: 'Total', visible: true, width: '100px' },
  ],
  INVOICES: [
    { id: 'itemNumber', label: 'Item #', visible: true, width: '60px' },
    { id: 'product', label: 'Product', visible: true, width: '180px' },
    { id: 'description', label: 'Description', visible: true },
    { id: 'unitPrice', label: 'Unit Price', visible: true, width: '100px' },
    { id: 'quantity', label: 'Qty', visible: true, width: '60px' },
    { id: 'uom', label: 'UOM', visible: true, width: '60px' },
    { id: 'total', label: 'Total', visible: true, width: '100px' },
  ],
  CHECKS: [
    { id: 'itemNumber', label: 'Item #', visible: true, width: '60px' },
    { id: 'source', label: 'Source', visible: true, width: '120px' },
    { id: 'reference', label: 'Reference', visible: true },
    { id: 'appliedAmount', label: 'Amount', visible: true, width: '120px' },
  ],
};

// Field categories for organization in controls
export const FIELD_CATEGORIES = [
  { id: 'header', label: 'Header Information' },
  { id: 'customer', label: 'Customer Information' },
  { id: 'dates', label: 'Dates' },
  { id: 'terms', label: 'Terms' },
  { id: 'summary', label: 'Summary' },
  { id: 'other', label: 'Other' },
] as const;
