import type { EmailTemplate, TemplateVariable, TemplateAttachment } from '../types/email-templates';
import { commonVariables } from '../types/email-templates';

// Helper to create unique IDs
let idCounter = 0;
const generateId = () => `ET-${String(++idCounter).padStart(4, '0')}`;

// ============================================================
// CRM TEMPLATES
// ============================================================

const crmTemplates: EmailTemplate[] = [
  {
    id: generateId(),
    name: 'New Customer Welcome',
    description: 'Welcome email for new customers after initial contact',
    category: 'crm',
    tags: ['new-customer', 'thank-you'],
    scope: 'global',
    subject: 'Welcome to {{company_name}} - Your Trusted Partner',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Thank you for choosing {{company_name}}. We're excited to work with you and committed to providing exceptional service and quality products.</p>

<p>As your dedicated representative, I'm here to help you with:</p>
<ul>
  <li>Product selection and specifications</li>
  <li>Competitive pricing and quotes</li>
  <li>Order processing and tracking</li>
  <li>Technical support and resources</li>
</ul>

<p>Please don't hesitate to reach out with any questions. I look forward to building a successful partnership with {{contact_company}}.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_title}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: true,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Introduction to Services',
    description: 'Introduce your company services to a potential customer',
    category: 'crm',
    tags: ['new-customer', 'request'],
    scope: 'global',
    subject: 'Introduction: {{company_name}} Services',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I wanted to take a moment to introduce myself and {{company_name}}.</p>

<p>We specialize in providing high-quality lighting and electrical products to commercial and industrial clients. Our services include:</p>

<ul>
  <li>Comprehensive product selection from top manufacturers</li>
  <li>Competitive pricing with flexible terms</li>
  <li>Expert technical support and product recommendations</li>
  <li>Fast and reliable delivery options</li>
  <li>Dedicated warehouse services for inventory management</li>
</ul>

<p>I'd welcome the opportunity to discuss how we can support {{contact_company}}'s needs. Would you be available for a brief call this week?</p>

<p>Looking forward to connecting.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_title}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Meeting Request',
    description: 'Request a meeting with a contact',
    category: 'crm',
    tags: ['request', 'follow-up'],
    scope: 'global',
    subject: 'Meeting Request: {{company_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I hope you're doing well. I wanted to reach out to schedule a meeting to discuss how {{company_name}} can support {{contact_company}}.</p>

<p>I'm available at the following times:</p>
<ul>
  <li>[Insert availability options]</li>
</ul>

<p>Please let me know what works best for your schedule, or feel free to suggest an alternative time.</p>

<p>Looking forward to speaking with you.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Thank You After Meeting',
    description: 'Follow-up thank you after a meeting',
    category: 'crm',
    tags: ['thank-you', 'follow-up'],
    scope: 'global',
    subject: 'Thank You for Your Time',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Thank you for taking the time to meet with me today. I really enjoyed our conversation and learning more about {{contact_company}}'s projects and needs.</p>

<p>As discussed, I will follow up with:</p>
<ul>
  <li>[Action item 1]</li>
  <li>[Action item 2]</li>
</ul>

<p>Please don't hesitate to reach out if you have any questions in the meantime.</p>

<p>Looking forward to our continued partnership.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Project Check-In',
    description: 'Check in on ongoing project status',
    category: 'crm',
    tags: ['existing-customer', 'status-update'],
    scope: 'global',
    subject: 'Project Update Check-In: {{job_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I wanted to check in on the {{job_name}} project and see how everything is progressing.</p>

<p>Please let me know if:</p>
<ul>
  <li>You need any additional quotes or product information</li>
  <li>There have been any changes to the project scope or timeline</li>
  <li>You need assistance with any orders or deliveries</li>
</ul>

<p>I'm here to help ensure your project runs smoothly. Don't hesitate to reach out with any questions or concerns.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
];

// ============================================================
// QUOTE TEMPLATES
// ============================================================

const quoteTemplates: EmailTemplate[] = [
  {
    id: generateId(),
    name: 'Quote Submission',
    description: 'Send a new quote to a customer',
    category: 'quotes',
    tags: ['confirmation', 'existing-customer'],
    scope: 'global',
    subject: 'Quote {{quote_number}} for {{job_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Thank you for the opportunity to provide a quote for {{job_name}}. Please find the attached quote {{quote_number}} for your review.</p>

<p><strong>Quote Summary:</strong></p>
<ul>
  <li>Quote Number: {{quote_number}}</li>
  <li>Quote Date: {{quote_date}}</li>
  <li>Total Amount: {{quote_total}}</li>
  <li>Valid Until: {{quote_expiration}}</li>
</ul>

<p><strong>Terms:</strong></p>
<ul>
  <li>Payment Terms: {{payment_terms}}</li>
  <li>Freight Terms: {{freight_terms}}</li>
</ul>

<p>Please review the attached quote and let me know if you have any questions or need any modifications. I'm happy to discuss any details or provide alternative options if needed.</p>

<p>Looking forward to your feedback.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_title}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'quote-pdf', label: 'Quote PDF', required: true },
    ],
    isSystem: true,
    isDefault: true,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Quote Revision',
    description: 'Send a revised quote',
    category: 'quotes',
    tags: ['existing-customer', 'status-update'],
    scope: 'global',
    subject: 'Revised Quote {{quote_number}} for {{job_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>As requested, please find the attached revised quote {{quote_number}} for {{job_name}}.</p>

<p><strong>Changes in this revision:</strong></p>
<ul>
  <li>[Describe changes made]</li>
</ul>

<p><strong>Updated Quote Summary:</strong></p>
<ul>
  <li>Quote Number: {{quote_number}}</li>
  <li>Revised Total: {{quote_total}}</li>
  <li>Valid Until: {{quote_expiration}}</li>
</ul>

<p>Please review and let me know if you need any additional modifications or have any questions.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'quote-pdf', label: 'Revised Quote PDF', required: true },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Quote Expiration Reminder',
    description: 'Remind customer about expiring quote',
    category: 'quotes',
    tags: ['reminder', 'existing-customer'],
    scope: 'global',
    subject: 'Reminder: Quote {{quote_number}} Expiring Soon',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I wanted to remind you that quote {{quote_number}} for {{job_name}} will expire on {{quote_expiration}}.</p>

<p><strong>Quote Summary:</strong></p>
<ul>
  <li>Quote Number: {{quote_number}}</li>
  <li>Total Amount: {{quote_total}}</li>
  <li>Expiration Date: {{quote_expiration}}</li>
</ul>

<p>If you're still interested in moving forward, please let me know and I can process your order. If you need more time or have any questions, I'd be happy to discuss and potentially extend the quote validity.</p>

<p>Looking forward to hearing from you.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'quote-pdf', label: 'Quote PDF', required: false },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Quote Follow-Up',
    description: 'Follow up on a submitted quote',
    category: 'quotes',
    tags: ['follow-up', 'existing-customer'],
    scope: 'global',
    subject: 'Following Up: Quote {{quote_number}} for {{job_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I hope you're doing well. I wanted to follow up on quote {{quote_number}} that I sent on {{quote_date}} for {{job_name}}.</p>

<p>Have you had a chance to review the quote? I'd be happy to:</p>
<ul>
  <li>Answer any questions about the products or pricing</li>
  <li>Provide alternative options or substitutions</li>
  <li>Make any necessary adjustments to the quote</li>
</ul>

<p>Please let me know how I can help move this forward.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Quote Won - Thank You',
    description: 'Thank customer for accepting quote',
    category: 'quotes',
    tags: ['thank-you', 'confirmation'],
    scope: 'global',
    subject: 'Thank You! Order Confirmation for {{job_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Thank you for your order! We're excited to confirm that we've received your acceptance of quote {{quote_number}} for {{job_name}}.</p>

<p>Our team is now processing your order and will provide you with tracking information once the materials ship.</p>

<p><strong>What happens next:</strong></p>
<ol>
  <li>Order confirmation with order number will be sent shortly</li>
  <li>Products will be prepared for shipment</li>
  <li>Tracking information will be provided when available</li>
</ol>

<p>If you have any questions or need anything else, please don't hesitate to reach out.</p>

<p>Thank you for your business!</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Request for Pricing',
    description: 'Request pricing from manufacturer for quote',
    category: 'quotes',
    tags: ['manufacturer', 'request'],
    scope: 'global',
    subject: 'Pricing Request for Project: {{job_name}}',
    body: `<p>Hi {{manufacturer_contact}},</p>

<p>I hope you're doing well. I have a project that requires pricing for the following {{manufacturer_name}} products:</p>

<p><strong>Project Details:</strong></p>
<ul>
  <li>Project Name: {{job_name}}</li>
  <li>Customer: {{contact_company}}</li>
  <li>Bid Date: [Insert date if applicable]</li>
</ul>

<p><strong>Products Needed:</strong></p>
<ul>
  <li>[List products and quantities]</li>
</ul>

<p>Please provide:</p>
<ul>
  <li>Net pricing</li>
  <li>Lead times</li>
  <li>Any applicable special pricing or promotions</li>
</ul>

<p>Please let me know if you need any additional information.</p>

<p>Thank you,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.manufacturer, ...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
];

// ============================================================
// ORDER TEMPLATES
// ============================================================

const orderTemplates: EmailTemplate[] = [
  {
    id: generateId(),
    name: 'Order Confirmation to Customer',
    description: 'Confirm order with customer',
    category: 'orders',
    tags: ['confirmation', 'existing-customer'],
    scope: 'global',
    subject: 'Order Confirmation - {{order_number}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Thank you for your order! This email confirms that we have received and are processing your order.</p>

<p><strong>Order Details:</strong></p>
<ul>
  <li>Order Number: {{order_number}}</li>
  <li>Order Date: {{order_date}}</li>
  <li>PO Number: {{po_number}}</li>
  <li>Order Total: {{order_total}}</li>
  <li>Estimated Ship Date: {{estimated_ship_date}}</li>
</ul>

<p><strong>Ship To:</strong><br/>
{{ship_to_name}}<br/>
{{ship_to_address}}<br/>
{{ship_to_city}}, {{ship_to_state}} {{ship_to_zip}}</p>

<p>You will receive tracking information once your order ships. Please find the attached order confirmation for your records.</p>

<p>If you have any questions, please don't hesitate to contact me.</p>

<p>Thank you for your business!</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.shipping, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'order-confirmation-pdf', label: 'Order Confirmation PDF', required: true },
    ],
    isSystem: true,
    isDefault: true,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Order to Manufacturer',
    description: 'Place order with manufacturer',
    category: 'orders',
    tags: ['manufacturer', 'confirmation'],
    scope: 'global',
    subject: 'Purchase Order {{po_number}} - {{company_name}}',
    body: `<p>Hi {{manufacturer_contact}},</p>

<p>Please find the attached purchase order for processing.</p>

<p><strong>Order Details:</strong></p>
<ul>
  <li>PO Number: {{po_number}}</li>
  <li>Order Total: {{order_total}}</li>
  <li>Required Ship Date: {{estimated_ship_date}}</li>
</ul>

<p><strong>Ship To:</strong><br/>
{{ship_to_name}}<br/>
{{ship_to_address}}<br/>
{{ship_to_city}}, {{ship_to_state}} {{ship_to_zip}}<br/>
Phone: {{ship_to_phone}}</p>

<p>Please confirm receipt of this order and provide order acknowledgment with ship dates.</p>

<p>Thank you,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.manufacturer, ...commonVariables.order, ...commonVariables.shipping, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'order-confirmation-pdf', label: 'Purchase Order PDF', required: true },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Order Status Update',
    description: 'Update customer on order status',
    category: 'orders',
    tags: ['status-update', 'existing-customer'],
    scope: 'global',
    subject: 'Order Status Update - {{order_number}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I wanted to provide you with an update on your order {{order_number}}.</p>

<p><strong>Current Status:</strong> {{order_status}}</p>

<p><strong>Update Details:</strong></p>
<p>[Provide specific update details here]</p>

<p><strong>Expected Timeline:</strong></p>
<ul>
  <li>Estimated Ship Date: {{estimated_ship_date}}</li>
</ul>

<p>Please let me know if you have any questions or concerns.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Order Delay Notification',
    description: 'Notify customer of order delay',
    category: 'orders',
    tags: ['notification', 'existing-customer', 'urgent'],
    scope: 'global',
    subject: 'Important: Order {{order_number}} Delay Notification',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I'm reaching out regarding your order {{order_number}} to inform you of an unexpected delay.</p>

<p><strong>Delay Information:</strong></p>
<ul>
  <li>Original Ship Date: [Original date]</li>
  <li>New Estimated Ship Date: {{estimated_ship_date}}</li>
  <li>Reason: [Explain reason for delay]</li>
</ul>

<p>We sincerely apologize for this inconvenience. We are working diligently to expedite your order and will keep you updated on its progress.</p>

<p>If this delay impacts your project timeline, please let me know and I will do everything possible to find a solution, including exploring alternative products or expedited shipping options.</p>

<p>Thank you for your patience and understanding.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Order Cancellation Confirmation',
    description: 'Confirm order cancellation',
    category: 'orders',
    tags: ['confirmation', 'existing-customer'],
    scope: 'global',
    subject: 'Order Cancellation Confirmation - {{order_number}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>This email confirms that your order {{order_number}} has been cancelled as requested.</p>

<p><strong>Cancelled Order Details:</strong></p>
<ul>
  <li>Order Number: {{order_number}}</li>
  <li>Original Order Date: {{order_date}}</li>
  <li>Order Total: {{order_total}}</li>
</ul>

<p>If any payments were made, a refund will be processed within [X] business days.</p>

<p>If you cancelled this order in error or would like to reorder in the future, please don't hesitate to contact me.</p>

<p>Thank you for considering us, and we hope to serve you again.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
];

// ============================================================
// INVOICE TEMPLATES
// ============================================================

const invoiceTemplates: EmailTemplate[] = [
  {
    id: generateId(),
    name: 'Invoice Submission',
    description: 'Send invoice to customer',
    category: 'invoices',
    tags: ['confirmation', 'existing-customer'],
    scope: 'global',
    subject: 'Invoice {{invoice_number}} - {{company_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Please find attached invoice {{invoice_number}} for your recent order.</p>

<p><strong>Invoice Details:</strong></p>
<ul>
  <li>Invoice Number: {{invoice_number}}</li>
  <li>Invoice Date: {{invoice_date}}</li>
  <li>Due Date: {{invoice_due_date}}</li>
  <li>Total Amount: {{invoice_total}}</li>
</ul>

<p><strong>Payment Information:</strong></p>
<p>[Include payment instructions, bank details, or payment portal link]</p>

<p>If you have any questions about this invoice, please don't hesitate to contact me.</p>

<p>Thank you for your business!</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.invoice, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'invoice-pdf', label: 'Invoice PDF', required: true },
    ],
    isSystem: true,
    isDefault: true,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Payment Reminder - First Notice',
    description: 'First reminder for payment due',
    category: 'invoices',
    tags: ['reminder', 'existing-customer'],
    scope: 'global',
    subject: 'Friendly Reminder: Invoice {{invoice_number}} Due',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I hope you're doing well. This is a friendly reminder that invoice {{invoice_number}} is approaching its due date.</p>

<p><strong>Invoice Summary:</strong></p>
<ul>
  <li>Invoice Number: {{invoice_number}}</li>
  <li>Amount Due: {{invoice_balance}}</li>
  <li>Due Date: {{invoice_due_date}}</li>
</ul>

<p>If you've already sent payment, please disregard this notice. Otherwise, please let me know if you have any questions or need to discuss payment arrangements.</p>

<p>Thank you!</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.invoice, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'invoice-pdf', label: 'Invoice PDF', required: false },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Payment Reminder - Past Due',
    description: 'Reminder for overdue payment',
    category: 'invoices',
    tags: ['reminder', 'existing-customer', 'urgent'],
    scope: 'global',
    subject: 'Past Due Notice: Invoice {{invoice_number}} - {{days_overdue}} Days Overdue',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Our records indicate that invoice {{invoice_number}} is now {{days_overdue}} days past due.</p>

<p><strong>Past Due Invoice:</strong></p>
<ul>
  <li>Invoice Number: {{invoice_number}}</li>
  <li>Original Due Date: {{invoice_due_date}}</li>
  <li>Amount Due: {{invoice_balance}}</li>
  <li>Days Overdue: {{days_overdue}}</li>
</ul>

<p>We understand that oversights happen. Please remit payment at your earliest convenience or contact me to discuss payment arrangements.</p>

<p>If payment has already been sent, please disregard this notice and accept our apologies for any inconvenience.</p>

<p>Thank you for your prompt attention to this matter.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.invoice, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'invoice-pdf', label: 'Invoice PDF', required: true },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Payment Received - Thank You',
    description: 'Acknowledge payment received',
    category: 'invoices',
    tags: ['thank-you', 'confirmation'],
    scope: 'global',
    subject: 'Payment Received - Thank You!',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Thank you! We have received your payment for invoice {{invoice_number}}.</p>

<p><strong>Payment Details:</strong></p>
<ul>
  <li>Invoice Number: {{invoice_number}}</li>
  <li>Amount Received: {{invoice_total}}</li>
  <li>Payment Date: [Payment date]</li>
</ul>

<p>Your account is now current. Thank you for your continued business and prompt payment.</p>

<p>If you have any questions, please don't hesitate to reach out.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.invoice, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Credit Memo Notification',
    description: 'Notify customer of credit memo',
    category: 'invoices',
    tags: ['notification', 'existing-customer'],
    scope: 'global',
    subject: 'Credit Memo Issued - {{company_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>We have issued a credit memo to your account. Please find the details below.</p>

<p><strong>Credit Memo Details:</strong></p>
<ul>
  <li>Credit Memo Number: [Credit memo number]</li>
  <li>Credit Amount: [Amount]</li>
  <li>Reference Invoice: {{invoice_number}}</li>
  <li>Reason: [Reason for credit]</li>
</ul>

<p>This credit will be applied to your next invoice unless you request a refund.</p>

<p>Please find the attached credit memo for your records. If you have any questions, please let me know.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.invoice, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'credit-memo-pdf', label: 'Credit Memo PDF', required: true },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
];

// ============================================================
// WAREHOUSE TEMPLATES
// ============================================================

const warehouseTemplates: EmailTemplate[] = [
  {
    id: generateId(),
    name: 'Fulfillment Order Received',
    description: 'Notify manufacturer of fulfillment order received at warehouse',
    category: 'warehouse',
    tags: ['manufacturer', 'notification'],
    scope: 'global',
    subject: 'Fulfillment Order Received - {{fulfillment_order_number}}',
    body: `<p>Hi {{manufacturer_contact}},</p>

<p>This is to confirm that we have received the following materials at our warehouse:</p>

<p><strong>Receipt Details:</strong></p>
<ul>
  <li>Fulfillment Order #: {{fulfillment_order_number}}</li>
  <li>Warehouse: {{warehouse_name}}</li>
  <li>Receipt Date: [Receipt date]</li>
  <li>Items Received: [Quantity] items</li>
</ul>

<p>All items have been inspected and placed into inventory. Please find the attached receiving documentation for your records.</p>

<p>If there are any discrepancies or questions, please let us know.</p>

<p>Thank you,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.manufacturer, ...commonVariables.warehouse, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Ready for Pickup Notification',
    description: 'Notify customer order is ready for pickup',
    category: 'warehouse',
    tags: ['notification', 'existing-customer'],
    scope: 'global',
    subject: 'Your Order is Ready for Pickup - {{fulfillment_order_number}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Great news! Your order is ready for pickup at our warehouse.</p>

<p><strong>Pickup Details:</strong></p>
<ul>
  <li>Order Number: {{fulfillment_order_number}}</li>
  <li>Warehouse Location: {{warehouse_name}}</li>
  <li>Total Pallets: {{total_pallets}}</li>
  <li>Total Weight: {{total_weight}}</li>
</ul>

<p><strong>Warehouse Hours:</strong></p>
<p>[Insert warehouse hours and address]</p>

<p><strong>Pickup Requirements:</strong></p>
<ul>
  <li>Please bring a valid photo ID</li>
  <li>Reference order number: {{fulfillment_order_number}}</li>
  <li>Allow adequate time and equipment for loading</li>
</ul>

<p>Please contact us if you need to schedule a specific pickup time or have any questions.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.warehouse, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'packing-slip-pdf', label: 'Packing Slip', required: true },
    ],
    isSystem: true,
    isDefault: true,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Proof of Pickup to Manufacturer',
    description: 'Send signed BOL as proof of pickup to manufacturer',
    category: 'warehouse',
    tags: ['manufacturer', 'confirmation'],
    scope: 'global',
    subject: 'Proof of Pickup - {{fulfillment_order_number}}',
    body: `<p>Hi {{manufacturer_contact}},</p>

<p>Please find attached the signed Bill of Lading confirming customer pickup of the following order:</p>

<p><strong>Pickup Details:</strong></p>
<ul>
  <li>Fulfillment Order #: {{fulfillment_order_number}}</li>
  <li>Pickup Date: {{pickup_date}}</li>
  <li>Pickup Time: {{pickup_time}}</li>
  <li>BOL Number: {{bol_number}}</li>
</ul>

<p><strong>Shipment Summary:</strong></p>
<ul>
  <li>Total Pallets: {{total_pallets}}</li>
  <li>Total Weight: {{total_weight}}</li>
</ul>

<p>The attached signed Bill of Lading serves as proof of delivery from our warehouse. Please update your records accordingly.</p>

<p>Let me know if you need any additional documentation.</p>

<p>Thank you,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.manufacturer, ...commonVariables.warehouse, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'signed-bill-of-lading', label: 'Signed Bill of Lading', required: true },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Inventory Low Stock Alert',
    description: 'Alert manufacturer of low inventory levels',
    category: 'warehouse',
    tags: ['manufacturer', 'notification', 'urgent'],
    scope: 'global',
    subject: 'Low Stock Alert - {{manufacturer_name}} Inventory',
    body: `<p>Hi {{manufacturer_contact}},</p>

<p>This is an automated alert to notify you that the following {{manufacturer_name}} items are running low in our warehouse inventory:</p>

<p><strong>Low Stock Items:</strong></p>
<table border="1" cellpadding="5" cellspacing="0">
  <tr>
    <th>Part Number</th>
    <th>Description</th>
    <th>Current Qty</th>
    <th>Min Level</th>
  </tr>
  <tr>
    <td>[Part #]</td>
    <td>[Description]</td>
    <td>[Qty]</td>
    <td>[Min]</td>
  </tr>
</table>

<p>Please advise on replenishment options and lead times. We would like to place a replenishment order to avoid stockouts.</p>

<p>Thank you,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.manufacturer, ...commonVariables.warehouse, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Inventory Report to Manufacturer',
    description: 'Send periodic inventory report to manufacturer',
    category: 'warehouse',
    tags: ['manufacturer', 'status-update'],
    scope: 'global',
    subject: 'Inventory Report - {{manufacturer_name}} - [Date]',
    body: `<p>Hi {{manufacturer_contact}},</p>

<p>Please find the attached inventory report for {{manufacturer_name}} products held at our warehouse.</p>

<p><strong>Report Period:</strong> [Start Date] to [End Date]</p>

<p><strong>Summary:</strong></p>
<ul>
  <li>Total SKUs: [Number]</li>
  <li>Total Units: [Number]</li>
  <li>Total Value: [Value]</li>
  <li>Items Below Min: [Number]</li>
</ul>

<p>Please review the attached detailed report and let me know if you have any questions or need clarification on any items.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.manufacturer, ...commonVariables.warehouse, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Damaged Goods Report',
    description: 'Report damaged goods to manufacturer',
    category: 'warehouse',
    tags: ['manufacturer', 'notification', 'urgent'],
    scope: 'global',
    subject: 'Damaged Goods Report - {{fulfillment_order_number}}',
    body: `<p>Hi {{manufacturer_contact}},</p>

<p>We are reporting the following damage discovered during receiving/inspection:</p>

<p><strong>Order Information:</strong></p>
<ul>
  <li>Fulfillment Order #: {{fulfillment_order_number}}</li>
  <li>Carrier: {{carrier_name}}</li>
  <li>BOL Number: {{bol_number}}</li>
  <li>Receipt Date: [Receipt date]</li>
</ul>

<p><strong>Damaged Items:</strong></p>
<table border="1" cellpadding="5" cellspacing="0">
  <tr>
    <th>Part Number</th>
    <th>Description</th>
    <th>Qty Damaged</th>
    <th>Damage Type</th>
  </tr>
  <tr>
    <td>[Part #]</td>
    <td>[Description]</td>
    <td>[Qty]</td>
    <td>[Type]</td>
  </tr>
</table>

<p><strong>Notes:</strong> [Description of damage]</p>

<p>Please advise on how you would like us to proceed with the damaged items. We have noted the damage on the BOL and taken photos for documentation.</p>

<p>Thank you,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.manufacturer, ...commonVariables.warehouse, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
];

// ============================================================
// SHIPPING TEMPLATES
// ============================================================

const shippingTemplates: EmailTemplate[] = [
  {
    id: generateId(),
    name: 'Shipment Notification',
    description: 'Notify customer that order has shipped',
    category: 'shipping',
    tags: ['notification', 'existing-customer'],
    scope: 'global',
    subject: 'Your Order Has Shipped - {{order_number}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Great news! Your order has shipped and is on its way to you.</p>

<p><strong>Shipment Details:</strong></p>
<ul>
  <li>Order Number: {{order_number}}</li>
  <li>Carrier: {{carrier_name}}</li>
  <li>Tracking Number: {{tracking_number}}</li>
  <li>Estimated Delivery: {{delivery_date}}</li>
</ul>

<p><strong>Ship To:</strong><br/>
{{ship_to_name}}<br/>
{{ship_to_address}}<br/>
{{ship_to_city}}, {{ship_to_state}} {{ship_to_zip}}</p>

<p>You can track your shipment using the tracking number above on the carrier's website.</p>

<p>If you have any questions or need assistance, please don't hesitate to contact me.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.warehouse, ...commonVariables.shipping, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'packing-slip-pdf', label: 'Packing Slip', required: false },
    ],
    isSystem: true,
    isDefault: true,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Delivery Confirmation',
    description: 'Confirm delivery to customer',
    category: 'shipping',
    tags: ['confirmation', 'existing-customer'],
    scope: 'global',
    subject: 'Delivery Confirmation - Order {{order_number}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>We're pleased to confirm that your order {{order_number}} has been delivered!</p>

<p><strong>Delivery Details:</strong></p>
<ul>
  <li>Order Number: {{order_number}}</li>
  <li>Delivery Date: {{delivery_date}}</li>
  <li>Delivered To: {{ship_to_name}}</li>
</ul>

<p>Please take a moment to inspect your order and ensure everything arrived in good condition. If you notice any issues or discrepancies, please contact me within 48 hours so we can resolve them promptly.</p>

<p>Thank you for your business! We hope you're satisfied with your order.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.shipping, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'proof-of-delivery', label: 'Proof of Delivery', required: false },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Delivery Schedule Request',
    description: 'Request delivery scheduling with customer',
    category: 'shipping',
    tags: ['request', 'existing-customer'],
    scope: 'global',
    subject: 'Delivery Scheduling Request - Order {{order_number}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>Your order {{order_number}} is ready for delivery. We need to schedule a delivery time that works for you.</p>

<p><strong>Shipment Details:</strong></p>
<ul>
  <li>Order Number: {{order_number}}</li>
  <li>Delivery Address: {{ship_to_address}}, {{ship_to_city}}, {{ship_to_state}} {{ship_to_zip}}</li>
  <li>Total Pallets: {{total_pallets}}</li>
  <li>Total Weight: {{total_weight}}</li>
</ul>

<p><strong>Please provide the following:</strong></p>
<ul>
  <li>Preferred delivery date(s)</li>
  <li>Delivery time window</li>
  <li>Site contact name and phone number</li>
  <li>Any delivery restrictions or special instructions</li>
  <li>Equipment available for unloading (forklift, dock, etc.)</li>
</ul>

<p>Please respond at your earliest convenience so we can confirm your delivery.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.warehouse, ...commonVariables.shipping, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Carrier Pickup Request',
    description: 'Request carrier pickup from manufacturer',
    category: 'shipping',
    tags: ['manufacturer', 'request'],
    scope: 'global',
    subject: 'Pickup Request - {{fulfillment_order_number}}',
    body: `<p>Hi {{manufacturer_contact}},</p>

<p>Please arrange for carrier pickup of the following order:</p>

<p><strong>Pickup Details:</strong></p>
<ul>
  <li>Order/Reference #: {{fulfillment_order_number}}</li>
  <li>Requested Pickup Date: {{pickup_date}}</li>
  <li>Carrier: {{carrier_name}} (or suggest alternative)</li>
</ul>

<p><strong>Ship To:</strong><br/>
{{ship_to_name}}<br/>
{{ship_to_address}}<br/>
{{ship_to_city}}, {{ship_to_state}} {{ship_to_zip}}<br/>
Phone: {{ship_to_phone}}</p>

<p><strong>Shipment Information:</strong></p>
<ul>
  <li>Estimated Pallets: {{total_pallets}}</li>
  <li>Estimated Weight: {{total_weight}}</li>
</ul>

<p>Please confirm the pickup and provide tracking information once available.</p>

<p>Thank you,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.manufacturer, ...commonVariables.warehouse, ...commonVariables.shipping, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Freight Quote Request',
    description: 'Request freight quote from carrier',
    category: 'shipping',
    tags: ['request'],
    scope: 'global',
    subject: 'Freight Quote Request',
    body: `<p>Hi,</p>

<p>Please provide a freight quote for the following shipment:</p>

<p><strong>Origin:</strong><br/>
[Origin address]</p>

<p><strong>Destination:</strong><br/>
{{ship_to_name}}<br/>
{{ship_to_address}}<br/>
{{ship_to_city}}, {{ship_to_state}} {{ship_to_zip}}</p>

<p><strong>Shipment Details:</strong></p>
<ul>
  <li>Pallets: {{total_pallets}}</li>
  <li>Total Weight: {{total_weight}}</li>
  <li>Dimensions: [Length x Width x Height]</li>
  <li>Freight Class: [Class]</li>
  <li>Requested Pickup Date: {{pickup_date}}</li>
</ul>

<p><strong>Special Requirements:</strong></p>
<ul>
  <li>Liftgate: [Yes/No]</li>
  <li>Inside Delivery: [Yes/No]</li>
  <li>Appointment Required: [Yes/No]</li>
</ul>

<p>Please provide quotes for standard and expedited options.</p>

<p>Thank you,</p>
<p>{{sender_name}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.warehouse, ...commonVariables.shipping, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
];

// ============================================================
// FOLLOW-UP TEMPLATES
// ============================================================

const followUpTemplates: EmailTemplate[] = [
  {
    id: generateId(),
    name: 'General Follow-Up',
    description: 'General follow-up email',
    category: 'follow-up',
    tags: ['follow-up', 'existing-customer'],
    scope: 'global',
    subject: 'Following Up',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I wanted to follow up on my previous email. Have you had a chance to review it?</p>

<p>I'm happy to answer any questions or provide additional information. Please let me know how I can help.</p>

<p>Looking forward to hearing from you.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: true,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Post-Delivery Follow-Up',
    description: 'Follow up after delivery to ensure satisfaction',
    category: 'follow-up',
    tags: ['follow-up', 'existing-customer'],
    scope: 'global',
    subject: 'How Was Your Delivery? - Order {{order_number}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I wanted to check in and make sure your recent delivery arrived in good condition and met your expectations.</p>

<p><strong>Order Details:</strong></p>
<ul>
  <li>Order Number: {{order_number}}</li>
  <li>Delivery Date: {{delivery_date}}</li>
</ul>

<p>If you have any concerns or issues with your order, please don't hesitate to let me know. We want to ensure you're completely satisfied.</p>

<p>Is there anything else I can help you with?</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.shipping, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Quarterly Check-In',
    description: 'Quarterly business relationship check-in',
    category: 'follow-up',
    tags: ['follow-up', 'existing-customer'],
    scope: 'global',
    subject: 'Quarterly Check-In - How Can We Help?',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I hope you're doing well! I wanted to reach out for a quick check-in to see how things are going at {{contact_company}}.</p>

<p>A few questions I'd love to discuss:</p>
<ul>
  <li>Are there any upcoming projects we can help with?</li>
  <li>How has our service been? Any feedback for improvement?</li>
  <li>Are there any products or services you'd like more information about?</li>
</ul>

<p>I value our partnership and want to ensure we're meeting your needs. Would you have time for a brief call this week or next?</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_title}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Lost Quote Follow-Up',
    description: 'Follow up on a quote that was lost to competitor',
    category: 'follow-up',
    tags: ['follow-up', 'existing-customer'],
    scope: 'global',
    subject: 'Following Up on {{job_name}}',
    body: `<p>Hi {{contact_first_name}},</p>

<p>I understand we weren't selected for the {{job_name}} project. I appreciate you considering us for the opportunity.</p>

<p>If you don't mind sharing, I'd love to understand what influenced your decision. Was it pricing, product selection, service, or something else? This feedback helps us improve and better serve you in the future.</p>

<p>We value our relationship with {{contact_company}} and hope to have the opportunity to work together on future projects.</p>

<p>Thank you for your time.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Re-Engagement Email',
    description: 'Reach out to inactive customer',
    category: 'follow-up',
    tags: ['existing-customer', 'follow-up'],
    scope: 'global',
    subject: 'We Miss Working With You!',
    body: `<p>Hi {{contact_first_name}},</p>

<p>It's been a while since we've connected, and I wanted to reach out to see how things are going at {{contact_company}}.</p>

<p>A lot has happened since we last worked together:</p>
<ul>
  <li>We've expanded our product offerings</li>
  <li>We've improved our pricing on many items</li>
  <li>We've enhanced our warehouse and delivery capabilities</li>
</ul>

<p>I'd love the opportunity to discuss how we can support your current and upcoming projects. Would you be available for a quick call this week?</p>

<p>Looking forward to reconnecting.</p>

<p>Best regards,</p>
<p>{{sender_name}}<br/>
{{sender_title}}<br/>
{{company_name}}<br/>
{{sender_phone}}<br/>
{{sender_email}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
];

// ============================================================
// INTERNAL TEMPLATES
// ============================================================

const internalTemplates: EmailTemplate[] = [
  {
    id: generateId(),
    name: 'Project Handoff',
    description: 'Hand off project information to team member',
    category: 'internal',
    tags: ['internal-team', 'notification'],
    scope: 'global',
    subject: 'Project Handoff: {{job_name}} - {{contact_company}}',
    body: `<p>Hi [Team Member],</p>

<p>I'm handing off the {{job_name}} project to you. Here's the current status and important information:</p>

<p><strong>Customer Information:</strong></p>
<ul>
  <li>Company: {{contact_company}}</li>
  <li>Contact: {{contact_name}}</li>
  <li>Email: {{contact_email}}</li>
  <li>Phone: {{contact_phone}}</li>
</ul>

<p><strong>Project Status:</strong></p>
<ul>
  <li>Quote Number: {{quote_number}}</li>
  <li>Quote Total: {{quote_total}}</li>
  <li>Current Status: [Status]</li>
</ul>

<p><strong>Key Notes:</strong></p>
<p>[Important details, next steps, customer preferences, etc.]</p>

<p><strong>Next Actions:</strong></p>
<ul>
  <li>[Action item 1]</li>
  <li>[Action item 2]</li>
</ul>

<p>Please let me know if you need any additional information.</p>

<p>Thanks,</p>
<p>{{sender_name}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: true,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Price Approval Request',
    description: 'Request approval for special pricing',
    category: 'internal',
    tags: ['internal-team', 'approval', 'request'],
    scope: 'global',
    subject: 'Price Approval Request: {{job_name}} - {{contact_company}}',
    body: `<p>Hi [Manager],</p>

<p>I'm requesting approval for special pricing on the following quote:</p>

<p><strong>Customer:</strong> {{contact_company}}</p>
<p><strong>Project:</strong> {{job_name}}</p>
<p><strong>Quote Number:</strong> {{quote_number}}</p>

<p><strong>Pricing Details:</strong></p>
<table border="1" cellpadding="5" cellspacing="0">
  <tr>
    <th>Item</th>
    <th>List Price</th>
    <th>Requested Price</th>
    <th>Discount %</th>
  </tr>
  <tr>
    <td>[Item]</td>
    <td>[List]</td>
    <td>[Requested]</td>
    <td>[%]</td>
  </tr>
</table>

<p><strong>Total Quote Value:</strong> {{quote_total}}</p>

<p><strong>Justification:</strong></p>
<p>[Explain why special pricing is needed - competitive situation, volume, relationship, etc.]</p>

<p>Please let me know if you approve this pricing or if you need additional information.</p>

<p>Thanks,</p>
<p>{{sender_name}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.quote, ...commonVariables.sender],
    attachments: [
      { id: 'att-1', type: 'quote-pdf', label: 'Quote PDF', required: false },
    ],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Order Issue Escalation',
    description: 'Escalate order issue to management',
    category: 'internal',
    tags: ['internal-team', 'urgent', 'notification'],
    scope: 'global',
    subject: 'URGENT: Order Issue - {{order_number}} - {{contact_company}}',
    body: `<p>Hi [Manager],</p>

<p>I need to escalate an urgent issue with the following order:</p>

<p><strong>Order Information:</strong></p>
<ul>
  <li>Order Number: {{order_number}}</li>
  <li>Customer: {{contact_company}}</li>
  <li>Contact: {{contact_name}} ({{contact_phone}})</li>
  <li>Order Value: {{order_total}}</li>
</ul>

<p><strong>Issue Description:</strong></p>
<p>[Describe the issue in detail]</p>

<p><strong>Impact:</strong></p>
<p>[Describe impact on customer, project, relationship]</p>

<p><strong>Actions Taken:</strong></p>
<ul>
  <li>[What has been done so far]</li>
</ul>

<p><strong>Recommended Resolution:</strong></p>
<p>[Your suggested solution]</p>

<p>Please advise on how to proceed.</p>

<p>Thanks,</p>
<p>{{sender_name}}<br/>
{{sender_phone}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: 'Commission Inquiry',
    description: 'Internal inquiry about commission calculation',
    category: 'internal',
    tags: ['internal-team', 'request'],
    scope: 'global',
    subject: 'Commission Inquiry: {{order_number}}',
    body: `<p>Hi [Accounting],</p>

<p>I have a question about the commission calculation for the following order:</p>

<p><strong>Order Details:</strong></p>
<ul>
  <li>Order Number: {{order_number}}</li>
  <li>Customer: {{contact_company}}</li>
  <li>Order Total: {{order_total}}</li>
</ul>

<p><strong>Question/Concern:</strong></p>
<p>[Describe your commission question or concern]</p>

<p><strong>Expected vs Actual:</strong></p>
<ul>
  <li>Expected Commission: [Amount]</li>
  <li>Actual Commission: [Amount]</li>
</ul>

<p>Can you please review and provide clarification?</p>

<p>Thanks,</p>
<p>{{sender_name}}</p>`,
    variables: [...commonVariables.contact, ...commonVariables.order, ...commonVariables.sender],
    attachments: [],
    isSystem: true,
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    createdByName: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
];

// ============================================================
// EXPORT ALL TEMPLATES
// ============================================================

export const mockEmailTemplates: EmailTemplate[] = [
  ...crmTemplates,
  ...quoteTemplates,
  ...orderTemplates,
  ...invoiceTemplates,
  ...warehouseTemplates,
  ...shippingTemplates,
  ...followUpTemplates,
  ...internalTemplates,
];

// Helper function to get templates by category
export function getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return mockEmailTemplates.filter(t => t.category === category);
}

// Helper function to get templates by tag
export function getTemplatesByTag(tag: EmailTemplate['tags'][number]): EmailTemplate[] {
  return mockEmailTemplates.filter(t => t.tags.includes(tag));
}

// Helper function to duplicate a template
export function duplicateTemplate(template: EmailTemplate, newName: string): EmailTemplate {
  return {
    ...template,
    id: generateId(),
    name: newName,
    isSystem: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  };
}

// Get default template for a category
export function getDefaultTemplate(category: EmailTemplate['category']): EmailTemplate | undefined {
  return mockEmailTemplates.find(t => t.category === category && t.isDefault);
}
