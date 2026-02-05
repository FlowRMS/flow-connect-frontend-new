/**
 * PDF Builder Types
 * Type definitions for the PDF Builder component
 */

import type {
  PDFEntityType,
  PDFPreOpportunity,
  PDFQuote,
  PDFOrder,
  PDFInvoice,
  PDFCheck,
} from '@/components/lib/graphql/pdf-entities';

// Field visibility configuration
export interface PDFFieldConfig {
  id: string;
  label: string;
  visible: boolean;
  editable: boolean;
  value: string | number | boolean | null | undefined;
  editedValue?: string | number | boolean | null;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
  category: 'header' | 'customer' | 'dates' | 'terms' | 'summary' | 'other';
}

// Line item configuration
export interface PDFLineItemConfig {
  id: string;
  visible: boolean;
  itemNumber: number;
  product: string;
  description: string;
  quantity: number;
  unitPrice: number;
  uom?: string;
  total: number;
  endUser?: string; // End user company name for per-line-item display
  editedValues?: {
    product?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    uom?: string;
  };
}

// Column visibility for line items table
export interface PDFColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: string;
}

// PDF Builder state
export interface PDFBuilderState {
  entityType: PDFEntityType;
  entityId: string;
  entityData: PDFPreOpportunity | PDFQuote | PDFOrder | PDFInvoice | PDFCheck | null;
  fields: PDFFieldConfig[];
  lineItems: PDFLineItemConfig[];
  columns: PDFColumnConfig[];
  isLoading: boolean;
  error: string | null;
  // Organization info
  organizationName: string;
  organizationLogo: string | null;
  organizationAddress: string;
  // Center logo (second company logo)
  centerLogo: string | null;
  showCenterLogo: boolean;
  centerLogoSize: number; // Size in mm for PDF export (default 35)
  centerLogoPosition: number; // Horizontal position as percentage (0=left, 50=center, 100=right)
  // Notes
  headerNote: string;
  footerNote: string;
  // Display options
  showLogo: boolean;
  showLineNumbers: boolean;
  showSubtotal: boolean;
  showDiscount: boolean;
  showTotal: boolean;
}

// Entity type labels
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

// Default columns for each entity type
export const DEFAULT_COLUMNS: Record<PDFEntityType, PDFColumnConfig[]> = {
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
    { id: 'product', label: 'Product', visible: true, width: '150px' },
    { id: 'description', label: 'Description', visible: true },
    { id: 'endUser', label: 'End User', visible: false, width: '120px' }, // Hidden by default, shown when per-line-item
    { id: 'unitPrice', label: 'Unit Price', visible: true, width: '100px' },
    { id: 'quantity', label: 'Qty', visible: true, width: '60px' },
    { id: 'uom', label: 'UOM', visible: true, width: '60px' },
    { id: 'total', label: 'Total', visible: true, width: '100px' },
  ],
  ORDERS: [
    { id: 'itemNumber', label: 'Item #', visible: true, width: '60px' },
    { id: 'product', label: 'Product', visible: true, width: '150px' },
    { id: 'description', label: 'Description', visible: true },
    { id: 'endUser', label: 'End User', visible: false, width: '120px' }, // Hidden by default, shown when per-line-item
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
