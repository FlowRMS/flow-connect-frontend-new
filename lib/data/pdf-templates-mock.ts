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

// Default Submittal Template
export const defaultSubmittalTemplate: PdfTemplate = {
  id: 'default-submittal-template',
  name: 'Standard Submittal',
  type: 'submittal',
  description: 'Default template for submittals with transmittal info and revision history.',
  isDefault: true,
  isSystem: true,
  modules: [
    { ...defaultCompanyHeaderModule, id: 'sub-header' },
    {
      ...defaultDocumentTitleModule,
      id: 'sub-title',
      position: 1,
      config: { ...defaultDocumentTitleModule.config, titleText: 'SUBMITTAL' },
    },
    {
      id: 'sub-transmittal',
      type: 'transmittal-header',
      position: 2,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 10,
        showTransmittalNumber: true,
        showDate: true,
        showProject: true,
        showSpecSection: true,
      },
    },
    {
      id: 'sub-stakeholders',
      type: 'stakeholder-list',
      position: 3,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 10,
        showArchitect: true,
        showContractor: true,
        showEngineer: true,
      },
    },
    { ...defaultLineItemsTableModule, id: 'sub-items', position: 4 },
    {
      id: 'sub-revision',
      type: 'revision-history',
      position: 5,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 10,
        showRevisionNumber: true,
        showDate: true,
        showDescription: true,
      },
    },
    { ...defaultFooterModule, id: 'sub-footer', position: 6 },
  ],
  globalStyles: { ...defaultGlobalStyles, primaryColor: '#F97316' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Default Commission Check Template
export const defaultCheckTemplate: PdfTemplate = {
  id: 'default-check-template',
  name: 'Standard Commission Check',
  type: 'check',
  description: 'Default template for commission checks with payment details.',
  isDefault: true,
  isSystem: true,
  modules: [
    { ...defaultCompanyHeaderModule, id: 'chk-header' },
    {
      ...defaultDocumentTitleModule,
      id: 'chk-title',
      position: 1,
      config: { ...defaultDocumentTitleModule.config, titleText: 'COMMISSION CHECK' },
    },
    {
      id: 'chk-payee',
      type: 'customer-info',
      position: 2,
      config: {
        visible: true,
        width: 'half',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 10,
        showSoldTo: false,
        showBillTo: false,
        showShipTo: false,
        showPayee: true,
        layout: 'stacked',
        labelStyle: 'bold',
      },
    },
    {
      ...defaultDocumentDetailsModule,
      id: 'chk-details',
      position: 3,
      config: {
        ...defaultDocumentDetailsModule.config,
        fields: [
          { id: 'f1', label: 'Check #', field: 'checkNumber', visible: true, format: 'text' },
          { id: 'f2', label: 'Check Date', field: 'checkDate', visible: true, format: 'date' },
          { id: 'f3', label: 'Period', field: 'commissionPeriod', visible: true, format: 'text' },
          { id: 'f4', label: 'Sales Rep', field: 'salesRep', visible: true, format: 'text' },
        ],
      },
    },
    {
      id: 'chk-items',
      type: 'line-items-table',
      position: 4,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 10,
        columns: [
          { id: 'c1', label: 'Invoice #', field: 'invoiceNumber', visible: true, width: 15, alignment: 'left', format: 'text' },
          { id: 'c2', label: 'Customer', field: 'customerName', visible: true, width: 25, alignment: 'left', format: 'text' },
          { id: 'c3', label: 'Invoice Total', field: 'invoiceTotal', visible: true, width: 15, alignment: 'right', format: 'currency' },
          { id: 'c4', label: 'Comm %', field: 'commissionRate', visible: true, width: 10, alignment: 'center', format: 'text' },
          { id: 'c5', label: 'Commission', field: 'commissionAmount', visible: true, width: 15, alignment: 'right', format: 'currency' },
        ],
        showSectionHeaders: false,
        showRowNumbers: false,
        alternateRowColors: true,
        headerBackgroundColor: '#EC4899',
        headerTextColor: '#FFFFFF',
      },
    },
    {
      id: 'chk-payment',
      type: 'payment-info',
      position: 5,
      config: {
        visible: true,
        width: 'third',
        alignment: 'right',
        marginTop: 15,
        marginBottom: 15,
        showGrossCommission: true,
        showDeductions: true,
        showNetPayment: true,
      },
    },
    { ...defaultFooterModule, id: 'chk-footer', position: 6 },
  ],
  globalStyles: { ...defaultGlobalStyles, primaryColor: '#EC4899' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Default Credit Memo Template
export const defaultCreditMemoTemplate: PdfTemplate = {
  id: 'default-credit-template',
  name: 'Standard Credit Memo',
  type: 'credit',
  description: 'Default template for credit memos with credit details.',
  isDefault: true,
  isSystem: true,
  modules: [
    { ...defaultCompanyHeaderModule, id: 'cred-header' },
    {
      ...defaultDocumentTitleModule,
      id: 'cred-title',
      position: 1,
      config: { ...defaultDocumentTitleModule.config, titleText: 'CREDIT MEMO' },
    },
    { ...defaultCustomerInfoModule, id: 'cred-customer', position: 2 },
    {
      ...defaultDocumentDetailsModule,
      id: 'cred-details',
      position: 3,
      config: {
        ...defaultDocumentDetailsModule.config,
        fields: [
          { id: 'f1', label: 'Credit Memo #', field: 'creditNumber', visible: true, format: 'text' },
          { id: 'f2', label: 'Date', field: 'creditDate', visible: true, format: 'date' },
          { id: 'f3', label: 'Original Invoice #', field: 'originalInvoice', visible: true, format: 'text' },
          { id: 'f4', label: 'Reason', field: 'creditReason', visible: true, format: 'text' },
        ],
      },
    },
    { ...defaultLineItemsTableModule, id: 'cred-items', position: 4 },
    {
      id: 'cred-totals',
      type: 'pricing-summary',
      position: 5,
      config: {
        visible: true,
        width: 'third',
        alignment: 'right',
        marginTop: 15,
        marginBottom: 15,
        showSubtotal: true,
        showTax: true,
        showDiscount: false,
        showShipping: false,
        showTotal: true,
        showCommission: false,
        showOverage: false,
        labelWidth: 60,
        valueAlignment: 'right',
        isCreditMemo: true,
      },
    },
    { ...defaultFooterModule, id: 'cred-footer', position: 6 },
  ],
  globalStyles: { ...defaultGlobalStyles, primaryColor: '#EF4444' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Default Pick List Template (Warehouse)
export const defaultPickListTemplate: PdfTemplate = {
  id: 'default-pick-list-template',
  name: 'Standard Pick List',
  type: 'pick-list',
  description: 'Warehouse pick list for order fulfillment.',
  isDefault: true,
  isSystem: true,
  modules: [
    { ...defaultCompanyHeaderModule, id: 'pick-header' },
    {
      ...defaultDocumentTitleModule,
      id: 'pick-title',
      position: 1,
      config: { ...defaultDocumentTitleModule.config, titleText: 'PICK LIST' },
    },
    {
      ...defaultDocumentDetailsModule,
      id: 'pick-details',
      position: 2,
      config: {
        ...defaultDocumentDetailsModule.config,
        width: 'full',
        fields: [
          { id: 'f1', label: 'Order #', field: 'orderNumber', visible: true, format: 'text' },
          { id: 'f2', label: 'Pick List #', field: 'pickListNumber', visible: true, format: 'text' },
          { id: 'f3', label: 'Date', field: 'pickDate', visible: true, format: 'date' },
          { id: 'f4', label: 'Warehouse', field: 'warehouseName', visible: true, format: 'text' },
          { id: 'f5', label: 'Picker', field: 'assignedPicker', visible: true, format: 'text' },
          { id: 'f6', label: 'Priority', field: 'priority', visible: true, format: 'text' },
        ],
        columns: 3,
      },
    },
    {
      id: 'pick-items',
      type: 'line-items-table',
      position: 3,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 10,
        columns: [
          { id: 'c0', label: '☐', field: 'checkbox', visible: true, width: 5, alignment: 'center', format: 'text' },
          { id: 'c1', label: 'Bin Location', field: 'binLocation', visible: true, width: 15, alignment: 'left', format: 'text' },
          { id: 'c2', label: 'Product #', field: 'productNumber', visible: true, width: 18, alignment: 'left', format: 'text' },
          { id: 'c3', label: 'Description', field: 'description', visible: true, width: 32, alignment: 'left', format: 'text' },
          { id: 'c4', label: 'Qty Ordered', field: 'qtyOrdered', visible: true, width: 10, alignment: 'center', format: 'number' },
          { id: 'c5', label: 'Qty Picked', field: 'qtyPicked', visible: true, width: 10, alignment: 'center', format: 'number' },
          { id: 'c6', label: 'UOM', field: 'uom', visible: true, width: 10, alignment: 'center', format: 'text' },
        ],
        showSectionHeaders: false,
        showRowNumbers: true,
        alternateRowColors: true,
        headerBackgroundColor: '#F59E0B',
        headerTextColor: '#FFFFFF',
      },
    },
    {
      id: 'pick-notes',
      type: 'notes',
      position: 4,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 10,
        title: 'Pick Notes',
        content: '',
      },
    },
    {
      id: 'pick-signature',
      type: 'custom-text',
      position: 5,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 20,
        marginBottom: 10,
        content: 'Picked By: _________________________  Date: __________  Time: __________',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
    },
    { ...defaultFooterModule, id: 'pick-footer', position: 6 },
  ],
  globalStyles: { ...defaultGlobalStyles, primaryColor: '#F59E0B' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Default Packing Slip Template (Warehouse)
export const defaultPackingSlipTemplate: PdfTemplate = {
  id: 'default-packing-slip-template',
  name: 'Standard Packing Slip',
  type: 'packing-slip',
  description: 'Packing slip for shipments.',
  isDefault: true,
  isSystem: true,
  modules: [
    { ...defaultCompanyHeaderModule, id: 'pack-header' },
    {
      ...defaultDocumentTitleModule,
      id: 'pack-title',
      position: 1,
      config: { ...defaultDocumentTitleModule.config, titleText: 'PACKING SLIP' },
    },
    {
      ...defaultCustomerInfoModule,
      id: 'pack-customer',
      position: 2,
      config: { ...defaultCustomerInfoModule.config, showShipTo: true, layout: 'side-by-side' },
    },
    {
      ...defaultDocumentDetailsModule,
      id: 'pack-details',
      position: 3,
      config: {
        ...defaultDocumentDetailsModule.config,
        fields: [
          { id: 'f1', label: 'Order #', field: 'orderNumber', visible: true, format: 'text' },
          { id: 'f2', label: 'Packing Slip #', field: 'packingSlipNumber', visible: true, format: 'text' },
          { id: 'f3', label: 'Ship Date', field: 'shipDate', visible: true, format: 'date' },
          { id: 'f4', label: 'Carrier', field: 'carrier', visible: true, format: 'text' },
          { id: 'f5', label: 'Tracking #', field: 'trackingNumber', visible: true, format: 'text' },
          { id: 'f6', label: 'Ship Method', field: 'shipMethod', visible: true, format: 'text' },
        ],
      },
    },
    {
      id: 'pack-items',
      type: 'line-items-table',
      position: 4,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 10,
        columns: [
          { id: 'c1', label: 'Product #', field: 'productNumber', visible: true, width: 20, alignment: 'left', format: 'text' },
          { id: 'c2', label: 'Description', field: 'description', visible: true, width: 40, alignment: 'left', format: 'text' },
          { id: 'c3', label: 'Qty Ordered', field: 'qtyOrdered', visible: true, width: 13, alignment: 'center', format: 'number' },
          { id: 'c4', label: 'Qty Shipped', field: 'qtyShipped', visible: true, width: 13, alignment: 'center', format: 'number' },
          { id: 'c5', label: 'B/O', field: 'backorder', visible: true, width: 7, alignment: 'center', format: 'number' },
          { id: 'c6', label: 'UOM', field: 'uom', visible: true, width: 7, alignment: 'center', format: 'text' },
        ],
        showSectionHeaders: false,
        showRowNumbers: false,
        alternateRowColors: true,
        headerBackgroundColor: '#06B6D4',
        headerTextColor: '#FFFFFF',
      },
    },
    {
      id: 'pack-cartons',
      type: 'custom-text',
      position: 5,
      config: {
        visible: true,
        width: 'half',
        alignment: 'left',
        marginTop: 15,
        marginBottom: 10,
        content: 'Total Cartons: ______\nTotal Weight: ______ lbs',
        fontSize: 10,
        fontWeight: 'bold',
        fontStyle: 'normal',
      },
    },
    { ...defaultFooterModule, id: 'pack-footer', position: 6 },
  ],
  globalStyles: { ...defaultGlobalStyles, primaryColor: '#06B6D4' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Default Shipping Label Template (Warehouse)
export const defaultShippingLabelTemplate: PdfTemplate = {
  id: 'default-shipping-label-template',
  name: 'Standard Shipping Label',
  type: 'shipping-label',
  description: '4x6 shipping label template.',
  isDefault: true,
  isSystem: true,
  modules: [
    {
      id: 'ship-from',
      type: 'custom-text',
      position: 0,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 0,
        marginBottom: 5,
        content: 'FROM:\n{companyName}\n{companyAddress}\n{companyCity}, {companyState} {companyZip}',
        fontSize: 8,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
    },
    {
      id: 'ship-to',
      type: 'custom-text',
      position: 1,
      config: {
        visible: true,
        width: 'full',
        alignment: 'left',
        marginTop: 10,
        marginBottom: 5,
        content: 'SHIP TO:\n{recipientName}\n{recipientAddress}\n{recipientCity}, {recipientState} {recipientZip}',
        fontSize: 14,
        fontWeight: 'bold',
        fontStyle: 'normal',
      },
    },
    {
      id: 'ship-barcode',
      type: 'custom-text',
      position: 2,
      config: {
        visible: true,
        width: 'full',
        alignment: 'center',
        marginTop: 10,
        marginBottom: 5,
        content: '[BARCODE: {trackingNumber}]',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
    },
    {
      id: 'ship-details',
      type: 'custom-text',
      position: 3,
      config: {
        visible: true,
        width: 'full',
        alignment: 'center',
        marginTop: 5,
        marginBottom: 0,
        content: 'Order #: {orderNumber}  |  Weight: {weight} lbs  |  {cartonCount} of {totalCartons}',
        fontSize: 8,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
    },
  ],
  globalStyles: {
    ...defaultGlobalStyles,
    primaryColor: '#6366F1',
    pageMargins: { top: 10, right: 10, bottom: 10, left: 10 },
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'System',
};

// Default Bin Label Template (Warehouse)
export const defaultBinLabelTemplate: PdfTemplate = {
  id: 'default-bin-label-template',
  name: 'Standard Bin Label',
  type: 'bin-label',
  description: 'Warehouse bin location label.',
  isDefault: true,
  isSystem: true,
  modules: [
    {
      id: 'bin-location',
      type: 'custom-text',
      position: 0,
      config: {
        visible: true,
        width: 'full',
        alignment: 'center',
        marginTop: 0,
        marginBottom: 5,
        content: '{warehouseCode}-{section}-{aisle}-{shelf}-{bay}-{row}-{bin}',
        fontSize: 24,
        fontWeight: 'bold',
        fontStyle: 'normal',
      },
    },
    {
      id: 'bin-barcode',
      type: 'custom-text',
      position: 1,
      config: {
        visible: true,
        width: 'full',
        alignment: 'center',
        marginTop: 5,
        marginBottom: 5,
        content: '[BARCODE: {binCode}]',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
    },
    {
      id: 'bin-details',
      type: 'custom-text',
      position: 2,
      config: {
        visible: true,
        width: 'full',
        alignment: 'center',
        marginTop: 5,
        marginBottom: 0,
        content: 'Capacity: {maxCapacity} | Zone: {zone}',
        fontSize: 8,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
    },
  ],
  globalStyles: {
    ...defaultGlobalStyles,
    primaryColor: '#64748B',
    pageMargins: { top: 5, right: 5, bottom: 5, left: 5 },
  },
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
  defaultSubmittalTemplate,
  defaultCheckTemplate,
  defaultCreditMemoTemplate,
  defaultPickListTemplate,
  defaultPackingSlipTemplate,
  defaultShippingLabelTemplate,
  defaultBinLabelTemplate,
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
