import type {
  PdfTemplate,
  PdfModule,
  ModulePaletteItem,
  TemplateType,
  ModuleType,
  GlobalStyles,
} from '../types/pdf-templates';
import { defaultGlobalStyles } from '../types/pdf-templates';

// Default module configurations
const defaultCompanyHeaderModule: PdfModule = {
  id: 'company-header-1',
  type: 'company-header',
  position: 0,
  config: {
    visible: true,
    width: 'full',
    alignment: 'left',
    marginTop: 0,
    marginBottom: 10,
    showLogo: true,
    showCompanyName: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: false,
    logoPosition: 'left',
    companyNameSize: 20,
  },
};

const defaultDocumentTitleModule: PdfModule = {
  id: 'document-title-1',
  type: 'document-title',
  position: 1,
  config: {
    visible: true,
    width: 'full',
    alignment: 'right',
    marginTop: 0,
    marginBottom: 5,
    titleText: 'QUOTATION',
    showDocumentNumber: true,
    fontSize: 12,
  },
};

const defaultCustomerInfoModule: PdfModule = {
  id: 'customer-info-1',
  type: 'customer-info',
  position: 2,
  config: {
    visible: true,
    width: 'half',
    alignment: 'left',
    marginTop: 10,
    marginBottom: 10,
    showSoldTo: true,
    showBillTo: true,
    showShipTo: false,
    layout: 'stacked',
    labelStyle: 'bold',
  },
};

const defaultDocumentDetailsModule: PdfModule = {
  id: 'document-details-1',
  type: 'document-details',
  position: 3,
  config: {
    visible: true,
    width: 'half',
    alignment: 'right',
    marginTop: 10,
    marginBottom: 10,
    fields: [
      { id: 'f1', label: 'Quote Name', field: 'quoteName', visible: true, format: 'text' },
      { id: 'f2', label: 'Version', field: 'version', visible: true, format: 'text' },
      { id: 'f3', label: 'Stage', field: 'stage', visible: true, format: 'text' },
      { id: 'f4', label: 'Quote Date', field: 'quoteDate', visible: true, format: 'date' },
      { id: 'f5', label: 'Expires', field: 'expirationDate', visible: true, format: 'date' },
      { id: 'f6', label: 'Payment Terms', field: 'paymentTerms', visible: true, format: 'text' },
    ],
    layout: 'grid',
    columns: 2,
  },
};

const defaultJobInfoModule: PdfModule = {
  id: 'job-info-1',
  type: 'job-info',
  position: 4,
  config: {
    visible: true,
    width: 'full',
    alignment: 'left',
    marginTop: 5,
    marginBottom: 10,
    showJobName: true,
    showJobNumber: true,
    showJobAddress: false,
    showJobContact: false,
  },
};

const defaultLineItemsTableModule: PdfModule = {
  id: 'line-items-1',
  type: 'line-items-table',
  position: 5,
  config: {
    visible: true,
    width: 'full',
    alignment: 'left',
    marginTop: 10,
    marginBottom: 10,
    columns: [
      { id: 'c1', label: 'Section', field: 'sectionName', visible: true, width: 15, alignment: 'left', format: 'text' },
      { id: 'c2', label: 'Product #', field: 'productNumber', visible: true, width: 18, alignment: 'left', format: 'text' },
      { id: 'c3', label: 'Description', field: 'description', visible: true, width: 32, alignment: 'left', format: 'text' },
      { id: 'c4', label: 'Qty', field: 'quantity', visible: true, width: 8, alignment: 'center', format: 'number' },
      { id: 'c5', label: 'Unit Price', field: 'sellPrice', visible: true, width: 13, alignment: 'right', format: 'currency' },
      { id: 'c6', label: 'Extended', field: 'extendedPrice', visible: true, width: 14, alignment: 'right', format: 'currency' },
    ],
    showSectionHeaders: false,
    showRowNumbers: false,
    alternateRowColors: true,
    headerBackgroundColor: '#3B82F6',
    headerTextColor: '#FFFFFF',
  },
};

const defaultPricingSummaryModule: PdfModule = {
  id: 'pricing-summary-1',
  type: 'pricing-summary',
  position: 6,
  config: {
    visible: true,
    width: 'third',
    alignment: 'right',
    marginTop: 15,
    marginBottom: 15,
    showSubtotal: true,
    showTax: false,
    showDiscount: false,
    showShipping: false,
    showTotal: true,
    showCommission: false,
    showOverage: false,
    labelWidth: 60,
    valueAlignment: 'right',
  },
};

const defaultTermsModule: PdfModule = {
  id: 'terms-1',
  type: 'terms-conditions',
  position: 7,
  config: {
    visible: true,
    width: 'full',
    alignment: 'left',
    marginTop: 15,
    marginBottom: 10,
    title: 'Terms & Conditions',
    content: '1. This quote is valid until the expiration date shown above.\n2. Prices are subject to change without notice after expiration.\n3. Payment terms as stated above. Late payments may be subject to finance charges.',
    fontSize: 8,
    numbered: false,
  },
};

const defaultFooterModule: PdfModule = {
  id: 'footer-1',
  type: 'footer',
  position: 8,
  config: {
    visible: true,
    width: 'full',
    alignment: 'center',
    marginTop: 10,
    marginBottom: 0,
    showPageNumbers: true,
    showDate: true,
    showCustomText: false,
    customText: '',
    dateFormat: 'short',
  },
};

// Default Quote Template
export const defaultQuoteTemplate: PdfTemplate = {
  id: 'default-quote-template',
  name: 'Standard Quote',
  type: 'quote',
  description: 'Default template for quotes with company header, customer info, line items, and totals.',
  isDefault: true,
  isSystem: true,
  modules: [
    defaultCompanyHeaderModule,
    defaultDocumentTitleModule,
    defaultCustomerInfoModule,
    { ...defaultDocumentDetailsModule, position: 2 },
    { ...defaultJobInfoModule, position: 3 },
    { ...defaultLineItemsTableModule, position: 4 },
    { ...defaultPricingSummaryModule, position: 5 },
    { ...defaultTermsModule, position: 6 },
    { ...defaultFooterModule, position: 7 },
  ],
  globalStyles: { ...defaultGlobalStyles },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Minimal Quote Template
export const minimalQuoteTemplate: PdfTemplate = {
  id: 'minimal-quote-template',
  name: 'Minimal Quote',
  type: 'quote',
  description: 'A clean, minimal quote template with essential information only.',
  isDefault: false,
  isSystem: true,
  modules: [
    { ...defaultCompanyHeaderModule, id: 'mq-header' },
    { ...defaultDocumentTitleModule, id: 'mq-title', position: 1 },
    { ...defaultCustomerInfoModule, id: 'mq-customer', position: 2 },
    { ...defaultLineItemsTableModule, id: 'mq-items', position: 3 },
    { ...defaultPricingSummaryModule, id: 'mq-totals', position: 4 },
  ],
  globalStyles: { ...defaultGlobalStyles },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Default Order Template
export const defaultOrderTemplate: PdfTemplate = {
  id: 'default-order-template',
  name: 'Standard Order',
  type: 'order',
  description: 'Default template for orders with all shipping and billing details.',
  isDefault: true,
  isSystem: true,
  modules: [
    { ...defaultCompanyHeaderModule, id: 'order-header' },
    {
      ...defaultDocumentTitleModule,
      id: 'order-title',
      position: 1,
      config: { ...defaultDocumentTitleModule.config, titleText: 'SALES ORDER' },
    },
    {
      ...defaultCustomerInfoModule,
      id: 'order-customer',
      position: 2,
      config: { ...defaultCustomerInfoModule.config, showShipTo: true },
    },
    { ...defaultDocumentDetailsModule, id: 'order-details', position: 3 },
    { ...defaultLineItemsTableModule, id: 'order-items', position: 4 },
    { ...defaultPricingSummaryModule, id: 'order-totals', position: 5 },
    { ...defaultFooterModule, id: 'order-footer', position: 6 },
  ],
  globalStyles: { ...defaultGlobalStyles, primaryColor: '#10B981' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Default Invoice Template
export const defaultInvoiceTemplate: PdfTemplate = {
  id: 'default-invoice-template',
  name: 'Standard Invoice',
  type: 'invoice',
  description: 'Default template for invoices with payment details and amount due.',
  isDefault: true,
  isSystem: true,
  modules: [
    { ...defaultCompanyHeaderModule, id: 'inv-header' },
    {
      ...defaultDocumentTitleModule,
      id: 'inv-title',
      position: 1,
      config: { ...defaultDocumentTitleModule.config, titleText: 'INVOICE' },
    },
    { ...defaultCustomerInfoModule, id: 'inv-customer', position: 2 },
    {
      ...defaultDocumentDetailsModule,
      id: 'inv-details',
      position: 3,
      config: {
        ...defaultDocumentDetailsModule.config,
        fields: [
          { id: 'f1', label: 'Invoice #', field: 'invoiceNumber', visible: true, format: 'text' },
          { id: 'f2', label: 'Invoice Date', field: 'invoiceDate', visible: true, format: 'date' },
          { id: 'f3', label: 'Due Date', field: 'dueDate', visible: true, format: 'date' },
          { id: 'f4', label: 'PO Number', field: 'poNumber', visible: true, format: 'text' },
          { id: 'f5', label: 'Order #', field: 'orderNumber', visible: true, format: 'text' },
          { id: 'f6', label: 'Terms', field: 'terms', visible: true, format: 'text' },
        ],
      },
    },
    { ...defaultLineItemsTableModule, id: 'inv-items', position: 4 },
    {
      id: 'inv-amount-due',
      type: 'amount-due',
      position: 5,
      config: {
        visible: true,
        width: 'third',
        alignment: 'right',
        marginTop: 15,
        marginBottom: 15,
        showSubtotal: true,
        showTax: true,
        showPreviousBalance: true,
        showPaymentsReceived: true,
        showAmountDue: true,
      },
    },
    { ...defaultFooterModule, id: 'inv-footer', position: 6 },
  ],
  globalStyles: { ...defaultGlobalStyles, primaryColor: '#8B5CF6' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// All mock templates
export const mockPdfTemplates: PdfTemplate[] = [
  defaultQuoteTemplate,
  minimalQuoteTemplate,
  defaultOrderTemplate,
  defaultInvoiceTemplate,
];

// Module Palette Items for Builder
export const modulePaletteItems: ModulePaletteItem[] = [
  {
    type: 'company-header',
    name: 'Company Header',
    description: 'Your company logo, name, and contact information',
    icon: 'building',
    defaultConfig: defaultCompanyHeaderModule.config,
    availableFor: ['quote', 'order', 'invoice', 'submittal', 'check', 'credit'],
  },
  {
    type: 'document-title',
    name: 'Document Title',
    description: 'Title and document number display',
    icon: 'heading',
    defaultConfig: defaultDocumentTitleModule.config,
    availableFor: ['quote', 'order', 'invoice', 'submittal', 'check', 'credit'],
  },
  {
    type: 'customer-info',
    name: 'Customer Information',
    description: 'Sold to, bill to, and ship to addresses',
    icon: 'user',
    defaultConfig: defaultCustomerInfoModule.config,
    availableFor: ['quote', 'order', 'invoice', 'credit'],
  },
  {
    type: 'job-info',
    name: 'Job Information',
    description: 'Job name, number, and location details',
    icon: 'briefcase',
    defaultConfig: defaultJobInfoModule.config,
    availableFor: ['quote', 'order', 'submittal'],
  },
  {
    type: 'document-details',
    name: 'Document Details',
    description: 'Configurable fields like dates, terms, and reference numbers',
    icon: 'list',
    defaultConfig: defaultDocumentDetailsModule.config,
    availableFor: ['quote', 'order', 'invoice', 'submittal', 'check', 'credit'],
  },
  {
    type: 'line-items-table',
    name: 'Line Items Table',
    description: 'Table of products/items with configurable columns',
    icon: 'table',
    defaultConfig: defaultLineItemsTableModule.config,
    availableFor: ['quote', 'order', 'invoice', 'credit'],
  },
  {
    type: 'pricing-summary',
    name: 'Pricing Summary',
    description: 'Subtotals, taxes, discounts, and total',
    icon: 'calculator',
    defaultConfig: defaultPricingSummaryModule.config,
    availableFor: ['quote', 'order', 'invoice', 'credit'],
  },
  {
    type: 'terms-conditions',
    name: 'Terms & Conditions',
    description: 'Custom terms, conditions, or notes section',
    icon: 'file-text',
    defaultConfig: defaultTermsModule.config,
    availableFor: ['quote', 'order', 'invoice', 'submittal', 'check', 'credit'],
  },
  {
    type: 'custom-text',
    name: 'Custom Text',
    description: 'Free-form text block for any content',
    icon: 'type',
    defaultConfig: {
      visible: true,
      width: 'full',
      alignment: 'left',
      marginTop: 10,
      marginBottom: 10,
      content: 'Enter your custom text here...',
      fontSize: 10,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    availableFor: ['quote', 'order', 'invoice', 'submittal', 'check', 'credit'],
  },
  {
    type: 'divider',
    name: 'Divider Line',
    description: 'Horizontal line to separate sections',
    icon: 'minus',
    defaultConfig: {
      visible: true,
      width: 'full',
      alignment: 'center',
      marginTop: 10,
      marginBottom: 10,
      lineWidth: 1,
      lineColor: '#E5E7EB',
      lineStyle: 'solid',
    },
    availableFor: ['quote', 'order', 'invoice', 'submittal', 'check', 'credit'],
  },
  {
    type: 'spacer',
    name: 'Spacer',
    description: 'Add vertical spacing between sections',
    icon: 'maximize-2',
    defaultConfig: {
      visible: true,
      width: 'full',
      alignment: 'center',
      marginTop: 0,
      marginBottom: 0,
      height: 20,
    },
    availableFor: ['quote', 'order', 'invoice', 'submittal', 'check', 'credit'],
  },
  {
    type: 'footer',
    name: 'Footer',
    description: 'Page numbers, date, and custom footer text',
    icon: 'layout',
    defaultConfig: defaultFooterModule.config,
    availableFor: ['quote', 'order', 'invoice', 'submittal', 'check', 'credit'],
  },
];

// Helper functions
export function getTemplatesByType(type: TemplateType): PdfTemplate[] {
  return mockPdfTemplates.filter(t => t.type === type);
}

export function getDefaultTemplate(type: TemplateType): PdfTemplate | undefined {
  return mockPdfTemplates.find(t => t.type === type && t.isDefault);
}

export function getTemplateById(id: string): PdfTemplate | undefined {
  return mockPdfTemplates.find(t => t.id === id);
}

export function getModulesForType(type: TemplateType): ModulePaletteItem[] {
  return modulePaletteItems.filter(m => m.availableFor.includes(type));
}

export function createNewTemplate(type: TemplateType, name: string): PdfTemplate {
  const defaultTemplate = getDefaultTemplate(type);
  return {
    id: `template-${Date.now()}`,
    name,
    type,
    description: '',
    isDefault: false,
    isSystem: false,
    modules: defaultTemplate ? [...defaultTemplate.modules.map(m => ({ ...m, id: `${m.type}-${Date.now()}-${Math.random()}` }))] : [],
    globalStyles: { ...defaultGlobalStyles },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Current User',
  };
}

export function duplicateTemplate(template: PdfTemplate, newName: string): PdfTemplate {
  return {
    ...template,
    id: `template-${Date.now()}`,
    name: newName,
    isDefault: false,
    isSystem: false,
    modules: template.modules.map(m => ({ ...m, id: `${m.type}-${Date.now()}-${Math.random()}` })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Current User',
  };
}
