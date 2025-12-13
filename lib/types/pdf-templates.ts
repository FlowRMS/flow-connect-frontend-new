// PDF Template Types

export type TemplateType = 'quote' | 'order' | 'invoice' | 'submittal' | 'check' | 'credit' | 'pick-list' | 'packing-slip' | 'shipping-label' | 'bin-label';

export type ModuleType =
  | 'company-header'
  | 'document-title'
  | 'customer-info'
  | 'job-info'
  | 'document-details'
  | 'line-items-table'
  | 'pricing-summary'
  | 'totals-summary'
  | 'terms-conditions'
  | 'notes'
  | 'custom-text'
  | 'divider'
  | 'spacer'
  | 'footer'
  | 'transmittal-header'
  | 'stakeholder-list'
  | 'revision-history'
  | 'payment-info'
  | 'amount-due';

export interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'helvetica' | 'times' | 'courier';
  headerFontSize: number;
  bodyFontSize: number;
  pageMargins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ModuleConfig {
  // Common properties
  visible: boolean;
  width: 'full' | 'half' | 'third' | 'two-thirds';
  alignment: 'left' | 'center' | 'right';
  marginTop: number;
  marginBottom: number;
  backgroundColor?: string;
  borderColor?: string;
  showBorder?: boolean;

  // Module-specific configs (indexed)
  [key: string]: unknown;
}

// Company Header Module Config
export interface CompanyHeaderConfig extends ModuleConfig {
  showLogo: boolean;
  showCompanyName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  logoPosition: 'left' | 'center' | 'right';
  companyNameSize: number;
}

// Document Title Module Config
export interface DocumentTitleConfig extends ModuleConfig {
  titleText: string; // e.g., "QUOTATION", "INVOICE", "ORDER"
  showDocumentNumber: boolean;
  fontSize: number;
}

// Customer Info Module Config
export interface CustomerInfoConfig extends ModuleConfig {
  showSoldTo: boolean;
  showBillTo: boolean;
  showShipTo: boolean;
  layout: 'stacked' | 'side-by-side';
  labelStyle: 'bold' | 'uppercase' | 'normal';
}

// Job Info Module Config
export interface JobInfoConfig extends ModuleConfig {
  showJobName: boolean;
  showJobNumber: boolean;
  showJobAddress: boolean;
  showJobContact: boolean;
}

// Document Details Module Config
export interface DocumentDetailsConfig extends ModuleConfig {
  fields: {
    id: string;
    label: string;
    field: string;
    visible: boolean;
    format?: 'date' | 'currency' | 'text';
  }[];
  layout: 'grid' | 'list' | 'inline';
  columns: number;
}

// Line Items Table Module Config
export interface LineItemsTableConfig extends ModuleConfig {
  columns: {
    id: string;
    label: string;
    field: string;
    visible: boolean;
    width: number; // percentage
    alignment: 'left' | 'center' | 'right';
    format?: 'currency' | 'number' | 'text';
  }[];
  showSectionHeaders: boolean;
  showRowNumbers: boolean;
  alternateRowColors: boolean;
  headerBackgroundColor: string;
  headerTextColor: string;
}

// Pricing Summary Module Config
export interface PricingSummaryConfig extends ModuleConfig {
  showSubtotal: boolean;
  showTax: boolean;
  showDiscount: boolean;
  showShipping: boolean;
  showTotal: boolean;
  showCommission: boolean;
  showOverage: boolean;
  labelWidth: number;
  valueAlignment: 'left' | 'right';
}

// Terms & Conditions Module Config
export interface TermsConditionsConfig extends ModuleConfig {
  title: string;
  content: string;
  fontSize: number;
  numbered: boolean;
}

// Custom Text Module Config
export interface CustomTextConfig extends ModuleConfig {
  content: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
}

// Divider Module Config
export interface DividerConfig extends ModuleConfig {
  lineWidth: number;
  lineColor: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

// Spacer Module Config
export interface SpacerConfig extends ModuleConfig {
  height: number;
}

// Footer Module Config
export interface FooterConfig extends ModuleConfig {
  showPageNumbers: boolean;
  showDate: boolean;
  showCustomText: boolean;
  customText: string;
  dateFormat: 'short' | 'long';
}

// PDF Module Definition
export interface PdfModule {
  id: string;
  type: ModuleType;
  position: number;
  config: ModuleConfig;
}

// PDF Template Definition
export interface PdfTemplate {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  isDefault: boolean;
  isSystem: boolean; // System templates cannot be deleted
  modules: PdfModule[];
  globalStyles: GlobalStyles;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Module Palette Item (for builder)
export interface ModulePaletteItem {
  type: ModuleType;
  name: string;
  description: string;
  icon: string;
  defaultConfig: ModuleConfig;
  availableFor: TemplateType[];
}

// Template Type Labels
export const templateTypeLabels: Record<TemplateType, string> = {
  quote: 'Quote',
  order: 'Order',
  invoice: 'Invoice',
  submittal: 'Submittal',
  check: 'Commission Check',
  credit: 'Credit Memo',
  'pick-list': 'Pick List',
  'packing-slip': 'Packing Slip',
  'shipping-label': 'Shipping Label',
  'bin-label': 'Bin Label',
};

// Template Type Colors
export const templateTypeColors: Record<TemplateType, string> = {
  quote: 'bg-blue-100 text-blue-700',
  order: 'bg-green-100 text-green-700',
  invoice: 'bg-purple-100 text-purple-700',
  submittal: 'bg-orange-100 text-orange-700',
  check: 'bg-pink-100 text-pink-700',
  credit: 'bg-red-100 text-red-700',
  'pick-list': 'bg-amber-100 text-amber-700',
  'packing-slip': 'bg-cyan-100 text-cyan-700',
  'shipping-label': 'bg-indigo-100 text-indigo-700',
  'bin-label': 'bg-slate-100 text-slate-700',
};

// Default Global Styles
export const defaultGlobalStyles: GlobalStyles = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1F2937',
  fontFamily: 'helvetica',
  headerFontSize: 20,
  bodyFontSize: 10,
  pageMargins: {
    top: 20,
    right: 15,
    bottom: 20,
    left: 15,
  },
};

// Module Type Labels
export const moduleTypeLabels: Record<ModuleType, string> = {
  'company-header': 'Company Header',
  'document-title': 'Document Title',
  'customer-info': 'Customer Information',
  'job-info': 'Job Information',
  'document-details': 'Document Details',
  'line-items-table': 'Line Items Table',
  'pricing-summary': 'Pricing Summary',
  'totals-summary': 'Totals Summary',
  'terms-conditions': 'Terms & Conditions',
  'notes': 'Notes',
  'custom-text': 'Custom Text',
  'divider': 'Divider Line',
  'spacer': 'Spacer',
  'footer': 'Footer',
  'transmittal-header': 'Transmittal Header',
  'stakeholder-list': 'Stakeholder List',
  'revision-history': 'Revision History',
  'payment-info': 'Payment Information',
  'amount-due': 'Amount Due',
};
