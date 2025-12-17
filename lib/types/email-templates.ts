// Email Template Types

// Template categories - organized by business function
export type EmailTemplateCategory =
  | 'crm'           // General CRM communications
  | 'quotes'        // Quote-related emails
  | 'orders'        // Order-related emails
  | 'invoices'      // Invoice and payment emails
  | 'warehouse'     // Warehouse operations emails
  | 'shipping'      // Shipping and delivery emails
  | 'follow-up'     // Follow-up and reminder emails
  | 'internal';     // Internal team communications

// Template tags for more granular organization
export type EmailTemplateTag =
  | 'new-customer'
  | 'existing-customer'
  | 'manufacturer'
  | 'distributor'
  | 'contractor'
  | 'internal-team'
  | 'urgent'
  | 'reminder'
  | 'confirmation'
  | 'request'
  | 'notification'
  | 'thank-you'
  | 'follow-up'
  | 'approval'
  | 'rejection'
  | 'status-update';

// Template scope - global vs personal
export type TemplateScope = 'global' | 'personal';

// Variable types that can be used in templates
export type TemplateVariableType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'url'
  | 'address'
  | 'list';

// Template variable definition
export interface TemplateVariable {
  key: string;                    // e.g., "customer_name", "quote_number"
  label: string;                  // e.g., "Customer Name", "Quote Number"
  type: TemplateVariableType;
  required: boolean;
  defaultValue?: string;
  description?: string;
  source?: string;                // e.g., "contact", "quote", "order", "warehouse"
}

// Attachment types that can be included
export type AttachmentType =
  | 'quote-pdf'
  | 'order-confirmation-pdf'
  | 'invoice-pdf'
  | 'packing-slip-pdf'
  | 'pick-list-pdf'
  | 'shipping-label-pdf'
  | 'bill-of-lading'
  | 'signed-bill-of-lading'
  | 'proof-of-delivery'
  | 'spec-sheet'
  | 'submittal'
  | 'credit-memo-pdf'
  | 'commission-statement-pdf'
  | 'custom';

// Attachment definition
export interface TemplateAttachment {
  id: string;
  type: AttachmentType;
  label: string;
  description?: string;
  required: boolean;
  conditional?: string;           // Condition for when to include
}

// Email template definition
export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: EmailTemplateCategory;
  tags: EmailTemplateTag[];
  scope: TemplateScope;

  // Email content
  subject: string;
  body: string;                   // HTML content with variable placeholders
  bodyPlainText?: string;         // Plain text fallback

  // Variables and attachments
  variables: TemplateVariable[];
  attachments: TemplateAttachment[];

  // Metadata
  isSystem: boolean;              // System templates cannot be deleted
  isDefault: boolean;             // Default template for category
  isActive: boolean;

  // Ownership
  createdBy: string;
  createdByName?: string;
  organizationId?: string;        // For global templates

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

// Template for creating/editing
export interface EmailTemplateInput {
  name: string;
  description?: string;
  category: EmailTemplateCategory;
  tags: EmailTemplateTag[];
  scope: TemplateScope;
  subject: string;
  body: string;
  bodyPlainText?: string;
  variables: TemplateVariable[];
  attachments: TemplateAttachment[];
  isDefault?: boolean;
  isActive?: boolean;
}

// Category labels and colors
export const categoryLabels: Record<EmailTemplateCategory, string> = {
  crm: 'CRM',
  quotes: 'Quotes',
  orders: 'Orders',
  invoices: 'Invoices',
  warehouse: 'Warehouse',
  shipping: 'Shipping',
  'follow-up': 'Follow-Up',
  internal: 'Internal',
};

export const categoryColors: Record<EmailTemplateCategory, string> = {
  crm: 'bg-blue-100 text-blue-700',
  quotes: 'bg-purple-100 text-purple-700',
  orders: 'bg-green-100 text-green-700',
  invoices: 'bg-amber-100 text-amber-700',
  warehouse: 'bg-orange-100 text-orange-700',
  shipping: 'bg-cyan-100 text-cyan-700',
  'follow-up': 'bg-pink-100 text-pink-700',
  internal: 'bg-slate-100 text-slate-700',
};

export const categoryIcons: Record<EmailTemplateCategory, string> = {
  crm: 'users',
  quotes: 'file-text',
  orders: 'shopping-cart',
  invoices: 'dollar-sign',
  warehouse: 'package',
  shipping: 'truck',
  'follow-up': 'clock',
  internal: 'building',
};

// Tag labels and colors
export const tagLabels: Record<EmailTemplateTag, string> = {
  'new-customer': 'New Customer',
  'existing-customer': 'Existing Customer',
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  contractor: 'Contractor',
  'internal-team': 'Internal Team',
  urgent: 'Urgent',
  reminder: 'Reminder',
  confirmation: 'Confirmation',
  request: 'Request',
  notification: 'Notification',
  'thank-you': 'Thank You',
  'follow-up': 'Follow-Up',
  approval: 'Approval',
  rejection: 'Rejection',
  'status-update': 'Status Update',
};

export const tagColors: Record<EmailTemplateTag, string> = {
  'new-customer': 'bg-emerald-100 text-emerald-700',
  'existing-customer': 'bg-blue-100 text-blue-700',
  manufacturer: 'bg-violet-100 text-violet-700',
  distributor: 'bg-indigo-100 text-indigo-700',
  contractor: 'bg-orange-100 text-orange-700',
  'internal-team': 'bg-slate-100 text-slate-700',
  urgent: 'bg-red-100 text-red-700',
  reminder: 'bg-yellow-100 text-yellow-700',
  confirmation: 'bg-green-100 text-green-700',
  request: 'bg-cyan-100 text-cyan-700',
  notification: 'bg-sky-100 text-sky-700',
  'thank-you': 'bg-pink-100 text-pink-700',
  'follow-up': 'bg-purple-100 text-purple-700',
  approval: 'bg-teal-100 text-teal-700',
  rejection: 'bg-rose-100 text-rose-700',
  'status-update': 'bg-amber-100 text-amber-700',
};

// Attachment type labels
export const attachmentTypeLabels: Record<AttachmentType, string> = {
  'quote-pdf': 'Quote PDF',
  'order-confirmation-pdf': 'Order Confirmation PDF',
  'invoice-pdf': 'Invoice PDF',
  'packing-slip-pdf': 'Packing Slip PDF',
  'pick-list-pdf': 'Pick List PDF',
  'shipping-label-pdf': 'Shipping Label PDF',
  'bill-of-lading': 'Bill of Lading',
  'signed-bill-of-lading': 'Signed Bill of Lading',
  'proof-of-delivery': 'Proof of Delivery',
  'spec-sheet': 'Spec Sheet',
  submittal: 'Submittal',
  'credit-memo-pdf': 'Credit Memo PDF',
  'commission-statement-pdf': 'Commission Statement PDF',
  custom: 'Custom Attachment',
};

// Common variables used across templates
export const commonVariables: Record<string, TemplateVariable[]> = {
  contact: [
    { key: 'contact_name', label: 'Contact Name', type: 'text', required: true, source: 'contact' },
    { key: 'contact_first_name', label: 'First Name', type: 'text', required: false, source: 'contact' },
    { key: 'contact_last_name', label: 'Last Name', type: 'text', required: false, source: 'contact' },
    { key: 'contact_email', label: 'Contact Email', type: 'email', required: true, source: 'contact' },
    { key: 'contact_phone', label: 'Contact Phone', type: 'phone', required: false, source: 'contact' },
    { key: 'contact_company', label: 'Company Name', type: 'text', required: false, source: 'contact' },
    { key: 'contact_title', label: 'Job Title', type: 'text', required: false, source: 'contact' },
  ],
  quote: [
    { key: 'quote_number', label: 'Quote Number', type: 'text', required: true, source: 'quote' },
    { key: 'quote_date', label: 'Quote Date', type: 'date', required: true, source: 'quote' },
    { key: 'quote_expiration', label: 'Expiration Date', type: 'date', required: false, source: 'quote' },
    { key: 'quote_total', label: 'Quote Total', type: 'currency', required: true, source: 'quote' },
    { key: 'quote_subtotal', label: 'Subtotal', type: 'currency', required: false, source: 'quote' },
    { key: 'quote_tax', label: 'Tax Amount', type: 'currency', required: false, source: 'quote' },
    { key: 'job_name', label: 'Job/Project Name', type: 'text', required: false, source: 'quote' },
    { key: 'job_description', label: 'Job Description', type: 'text', required: false, source: 'quote' },
    { key: 'payment_terms', label: 'Payment Terms', type: 'text', required: false, source: 'quote' },
    { key: 'freight_terms', label: 'Freight Terms', type: 'text', required: false, source: 'quote' },
  ],
  order: [
    { key: 'order_number', label: 'Order Number', type: 'text', required: true, source: 'order' },
    { key: 'order_date', label: 'Order Date', type: 'date', required: true, source: 'order' },
    { key: 'order_total', label: 'Order Total', type: 'currency', required: true, source: 'order' },
    { key: 'order_status', label: 'Order Status', type: 'text', required: false, source: 'order' },
    { key: 'estimated_ship_date', label: 'Estimated Ship Date', type: 'date', required: false, source: 'order' },
    { key: 'po_number', label: 'PO Number', type: 'text', required: false, source: 'order' },
  ],
  invoice: [
    { key: 'invoice_number', label: 'Invoice Number', type: 'text', required: true, source: 'invoice' },
    { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, source: 'invoice' },
    { key: 'invoice_due_date', label: 'Due Date', type: 'date', required: true, source: 'invoice' },
    { key: 'invoice_total', label: 'Invoice Total', type: 'currency', required: true, source: 'invoice' },
    { key: 'invoice_balance', label: 'Balance Due', type: 'currency', required: false, source: 'invoice' },
    { key: 'days_overdue', label: 'Days Overdue', type: 'number', required: false, source: 'invoice' },
  ],
  warehouse: [
    { key: 'fulfillment_order_number', label: 'Fulfillment Order #', type: 'text', required: true, source: 'warehouse' },
    { key: 'warehouse_name', label: 'Warehouse Name', type: 'text', required: false, source: 'warehouse' },
    { key: 'pickup_date', label: 'Pickup Date', type: 'date', required: false, source: 'warehouse' },
    { key: 'pickup_time', label: 'Pickup Time', type: 'text', required: false, source: 'warehouse' },
    { key: 'delivery_date', label: 'Delivery Date', type: 'date', required: false, source: 'warehouse' },
    { key: 'delivery_time', label: 'Delivery Time', type: 'text', required: false, source: 'warehouse' },
    { key: 'carrier_name', label: 'Carrier Name', type: 'text', required: false, source: 'warehouse' },
    { key: 'tracking_number', label: 'Tracking Number', type: 'text', required: false, source: 'warehouse' },
    { key: 'bol_number', label: 'BOL Number', type: 'text', required: false, source: 'warehouse' },
    { key: 'total_pallets', label: 'Total Pallets', type: 'number', required: false, source: 'warehouse' },
    { key: 'total_weight', label: 'Total Weight', type: 'text', required: false, source: 'warehouse' },
  ],
  shipping: [
    { key: 'ship_to_name', label: 'Ship To Name', type: 'text', required: true, source: 'shipping' },
    { key: 'ship_to_address', label: 'Ship To Address', type: 'address', required: true, source: 'shipping' },
    { key: 'ship_to_city', label: 'City', type: 'text', required: true, source: 'shipping' },
    { key: 'ship_to_state', label: 'State', type: 'text', required: true, source: 'shipping' },
    { key: 'ship_to_zip', label: 'ZIP Code', type: 'text', required: true, source: 'shipping' },
    { key: 'ship_to_phone', label: 'Ship To Phone', type: 'phone', required: false, source: 'shipping' },
    { key: 'shipping_method', label: 'Shipping Method', type: 'text', required: false, source: 'shipping' },
    { key: 'freight_cost', label: 'Freight Cost', type: 'currency', required: false, source: 'shipping' },
  ],
  manufacturer: [
    { key: 'manufacturer_name', label: 'Manufacturer Name', type: 'text', required: true, source: 'manufacturer' },
    { key: 'manufacturer_contact', label: 'Manufacturer Contact', type: 'text', required: false, source: 'manufacturer' },
    { key: 'manufacturer_email', label: 'Manufacturer Email', type: 'email', required: false, source: 'manufacturer' },
    { key: 'manufacturer_phone', label: 'Manufacturer Phone', type: 'phone', required: false, source: 'manufacturer' },
  ],
  sender: [
    { key: 'sender_name', label: 'Your Name', type: 'text', required: true, source: 'sender' },
    { key: 'sender_email', label: 'Your Email', type: 'email', required: true, source: 'sender' },
    { key: 'sender_phone', label: 'Your Phone', type: 'phone', required: false, source: 'sender' },
    { key: 'sender_title', label: 'Your Title', type: 'text', required: false, source: 'sender' },
    { key: 'company_name', label: 'Company Name', type: 'text', required: true, source: 'sender' },
    { key: 'company_address', label: 'Company Address', type: 'address', required: false, source: 'sender' },
    { key: 'company_phone', label: 'Company Phone', type: 'phone', required: false, source: 'sender' },
    { key: 'company_website', label: 'Company Website', type: 'url', required: false, source: 'sender' },
  ],
};

// Helper function to insert variable placeholder
export function insertVariable(key: string): string {
  return `{{${key}}}`;
}

// Helper function to extract variables from template content
export function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1]);
    }
  }
  return matches;
}

// Helper function to replace variables in content
export function replaceVariables(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    return values[key] ?? match;
  });
}
