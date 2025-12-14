// ============================================================================
// FlowRMS - Type Definitions
// Sales Order Management & Commission Tracking
// ============================================================================

// -----------------------------------------------------------------------------
// Contact Extensions (for Manufacturers & Distributors)
// -----------------------------------------------------------------------------

export interface ManufacturerFields {
  isManufacturer: boolean;
  // Commission settings
  baseCommissionRate: number;          // e.g., 0.10 for 10% (deprecated, use standardCommissionRate)
  standardCommissionRate?: number;     // Standard/direct commission rate (e.g., 0.10 for 10%)
  warehouseCommissionRate?: number;    // Warehouse commission rate (e.g., 0.05 for 5%)
  commissionDiscountRate?: number;
  // Payment terms
  paymentTerms?: string;               // e.g., "Net 30"
  paymentDueDays?: number;
  // Sales model
  salesModel: 'direct' | 'warehouse' | 'buy_sell';
  // Freight
  freightTerms?: string;
}

export interface SalesRepFields {
  isSalesRep: boolean;
  repType: 'inside' | 'outside';
  defaultSplitRate?: number;           // e.g., 0.50 for 50%
  territories: string[];
  managerId?: string;                  // For inside reps, their manager
}

// -----------------------------------------------------------------------------
// Product Types
// -----------------------------------------------------------------------------

export interface Product {
  id: string;
  manufacturerId: string;
  manufacturerName: string;
  partNumber: string;
  description: string;
  unitPrice: number;
  cost?: number;
  commissionRate?: number;             // Override manufacturer rate (deprecated, use standardCommissionRate)
  standardCommissionRate?: number;     // Standard/direct commission rate (e.g., 0.10 for 10%)
  warehouseCommissionRate?: number;    // Warehouse commission rate (e.g., 0.05 for 5%)
  commissionDiscountRate?: number;     // Commission discount rate
  unitPriceDiscountRate?: number;      // Unit price discount rate
  category?: string;
  categoryId?: string;
  leadTimeDays?: number;
  minOrderQty?: number;
  uom?: string;                        // Unit of measure (e.g., 'ea', 'box', 'case')
  upc?: string;                        // Universal Product Code
  approvalDate?: string;
  approvalComments?: string;
  // Weights & Measures
  netWeight?: number;
  grossWeight?: number;
  weightUom?: string;                  // e.g., 'LB', 'KG'
  length?: number;
  width?: number;
  height?: number;
  lengthUom?: string;                  // e.g., 'IN', 'CM'
  volume?: number;
  volumeUom?: string;                  // e.g., 'CUBIC_IN', 'CUBIC_CM'
  unitsPerCase?: number;
  tareWeight?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPricingTier {
  id: string;
  productId: string;
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
}

export interface CustomerPartNumber {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  customerPartNumber: string;
  priceOverride?: number;
  commissionRate?: number;             // Customer-specific commission rate
}

export interface ProductFile {
  id: string;
  productId: string;
  name: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  url?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ProductNote {
  id: string;
  productId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface ProductActivity {
  id: string;
  productId: string;
  type: 'created' | 'updated' | 'price_change' | 'note_added' | 'file_uploaded';
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Order Types
// -----------------------------------------------------------------------------

export type OrderStatus =
  | 'draft'
  | 'open'
  | 'partial_shipped'
  | 'shipped'
  | 'cancelled'
  | 'dormant';

export type FulfillmentStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

export type BillingStatus =
  | 'not_invoiced'
  | 'partial_invoiced'
  | 'invoiced';

export type CommissionStatus =
  | 'pending'
  | 'accruing'
  | 'paid'
  | 'adjusted';

export interface Order {
  id: string;
  orderNumber: string;
  factorySoNumber?: string;
  // References
  manufacturerId: string;
  manufacturerName: string;
  customerId: string;
  customerName: string;
  billToCustomerId?: string;
  billToCustomerName?: string;
  jobId?: string;
  jobName?: string;
  quoteId?: string;
  quoteNumber?: string;
  // Status
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  billingStatus: BillingStatus;
  commissionStatus: CommissionStatus;
  // Dates
  orderDate: string;
  entryDate?: string;
  shipDate?: string;
  dueDate?: string;
  requestedShipDate?: string;
  actualShipDate?: string;
  // Visibility
  isVisible?: boolean;
  // Line items
  lineItems: OrderLineItem[];
  // Totals (computed)
  subtotal: number;
  freight: number;
  total: number;
  totalCommission: number;
  // Reps
  insideRepId?: string;
  insideRepName?: string;
  splitRates: OrderSplitRate[];
  // Notes
  notes?: string;
  poNumber?: string;
  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface OrderLineItem {
  id: string;
  lineNumber: number;
  productId?: string;  // Optional for order-level credits
  partNumber?: string; // Optional for order-level credits
  custPartNumber?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
  commissionRate: number;
  commissionAmount: number;
  // Fulfillment tracking
  quantityShipped: number;
  quantityInvoiced: number;
  quantityCredited: number;
  isCancelled: boolean;
  // Consignment tracking
  isConsignment: boolean;
  // Credit line fields
  isCredit?: boolean;
  creditType?: 'return' | 'short_ship' | 'cancel' | 'damage';
  linkedLineItemId?: string | null;  // null = order-level credit
  // Optional overrides
  splitRateOverride?: OrderSplitRate[];
  notes?: string;
}

export interface OrderSplitRate {
  salesRepId: string;
  salesRepName: string;
  splitPercentage: number;        // e.g., 50 for 50%
  commissionAmount: number;       // Computed from total commission * split %
}

// -----------------------------------------------------------------------------
// Invoice Types
// -----------------------------------------------------------------------------

export type InvoiceStatus = 'open' | 'paid' | 'partial_paid' | 'void' | 'dormant';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  manufacturerId: string;
  manufacturerName: string;
  customerId: string;
  customerName: string;
  // Sales Reps
  insideRepId?: string;
  insideRepName?: string;
  // Status
  status: InvoiceStatus;
  isLocked: boolean;
  isPaid?: boolean;
  // Dates
  invoiceDate: string;
  entryDate?: string;
  dueDate: string;
  paidDate?: string;
  // Line items
  lineItems: InvoiceLineItem[];
  // Totals
  subtotal: number;
  freight: number;
  total: number;
  totalCommission: number;
  amountPaid: number;
  amountCredited: number;
  balance: number;
  // Split rates (copied from order)
  splitRates: OrderSplitRate[];
  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface InvoiceLineItem {
  id: string;
  orderLineItemId: string;
  lineNumber: number;
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
}

// -----------------------------------------------------------------------------
// Credit Types
// -----------------------------------------------------------------------------

export type CreditStatus = 'open' | 'applied' | 'void';

export interface Credit {
  id: string;
  creditNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  manufacturerId: string;
  manufacturerName: string;
  customerId: string;
  customerName: string;
  reasonCode: string;
  reasonDescription: string;
  // Status
  status: CreditStatus;
  // Line items
  lineItems: CreditLineItem[];
  // Totals
  totalAmount: number;
  totalCommissionDeduction: number;
  // Split rates for deductions
  splitRates: OrderSplitRate[];
  // Dates
  creditDate: string;
  appliedDate?: string;
  // Notes
  notes?: string;
  // Audit
  createdAt: string;
  createdBy: string;
}

export interface CreditLineItem {
  id: string;
  orderLineItemId: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  commissionDeduction: number;
}

export interface CreditReason {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
}

// -----------------------------------------------------------------------------
// Commission Check Types
// -----------------------------------------------------------------------------

export type CheckStatus = 'draft' | 'posted' | 'void';

export interface CommissionCheck {
  id: string;
  checkNumber: string;
  salesRepId: string;
  salesRepName: string;
  manufacturerId?: string;
  manufacturerName?: string;
  commissionMonth: string;          // "2025-01" format
  // Status
  status: CheckStatus;
  // Dates
  postDate?: string;
  checkDate?: string;               // Date on the check
  entryDate: string;                // Date the check was entered into the system
  createdDate: string;
  // Details
  details: CheckDetail[];
  // Totals
  invoicePayments: number;
  expenseAdjustments: number;
  creditDeductions: number;
  netAmount: number;
  checkBalance: number;             // Running balance on the check
  // Audit
  createdBy: string;
  updatedAt?: string;
}

export interface CheckDetail {
  id: string;
  type: 'invoice' | 'expense' | 'credit';
  referenceId: string;
  referenceNumber: string;
  description: string;
  amount: number;                   // Positive for payments, negative for deductions
  customerName?: string;
  orderNumber?: string;
}

// -----------------------------------------------------------------------------
// Expense Types
// -----------------------------------------------------------------------------

export type ExpenseStatus = 'open' | 'paid' | 'void';

export interface Expense {
  id: string;
  expenseNumber: string;
  category: string;
  categoryId: string;
  customerId?: string;
  customerName?: string;
  manufacturerId?: string;
  manufacturerName?: string;
  description: string;
  amount: number;
  // Status
  status: ExpenseStatus;
  // Split rates
  splitRates: ExpenseSplitRate[];
  // Dates
  expenseDate: string;
  paidDate?: string;
  checkId?: string;
  // Notes
  notes?: string;
  // Audit
  createdAt: string;
  createdBy: string;
}

export interface ExpenseSplitRate {
  salesRepId: string;
  salesRepName: string;
  splitPercentage: number;
  amount: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

// -----------------------------------------------------------------------------
// Dashboard / Summary Types
// -----------------------------------------------------------------------------

export interface CommissionSummary {
  salesRepId: string;
  salesRepName: string;
  pending: number;
  accruing: number;
  paid: number;
  adjusted: number;
  total: number;
}

export interface ManufacturerCommissionSummary {
  manufacturerId: string;
  manufacturerName: string;
  totalSales: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  orderCount: number;
}

export interface OrderSummaryStats {
  totalOrders: number;
  openOrders: number;
  shippedOrders: number;
  totalValue: number;
  avgOrderValue: number;
  thisMonthValue: number;
  lastMonthValue: number;
  thisMonthCount: number;
}

export interface InvoiceSummaryStats {
  totalInvoices: number;
  openInvoices: number;
  paidInvoices: number;
  totalValue: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueValue: number;
}

// -----------------------------------------------------------------------------
// Filter Types
// -----------------------------------------------------------------------------

export interface OrderFilters {
  status?: OrderStatus[];
  fulfillmentStatus?: FulfillmentStatus[];
  billingStatus?: BillingStatus[];
  manufacturerId?: string;
  customerId?: string;
  salesRepId?: string;
  dateRange?: { start: string; end: string };
  search?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  manufacturerId?: string;
  customerId?: string;
  salesRepId?: string;
  dateRange?: { start: string; end: string };
  search?: string;
  overdue?: boolean;
}

export interface CreditFilters {
  status?: CreditStatus[];
  manufacturerId?: string;
  customerId?: string;
  reasonCode?: string;
  dateRange?: { start: string; end: string };
  search?: string;
}

export interface CheckFilters {
  status?: CheckStatus[];
  salesRepId?: string;
  manufacturerId?: string;
  commissionMonth?: string;
  dateRange?: { start: string; end: string };
  search?: string;
}

export interface CommissionFilters {
  salesRepId?: string;
  manufacturerId?: string;
  customerId?: string;
  commissionMonth?: string;
  status?: CommissionStatus[];
}

// -----------------------------------------------------------------------------
// Status Labels & Colors
// -----------------------------------------------------------------------------

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  partial_shipped: 'Partial Shipped',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
  dormant: 'Dormant',
};

export const orderStatusColors: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  open: 'bg-blue-100 text-blue-700',
  partial_shipped: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  dormant: 'bg-purple-100 text-purple-700',
};

export const fulfillmentStatusLabels: Record<FulfillmentStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const fulfillmentStatusColors: Record<FulfillmentStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

export const billingStatusLabels: Record<BillingStatus, string> = {
  not_invoiced: 'Not Invoiced',
  partial_invoiced: 'Partial',
  invoiced: 'Invoiced',
};

export const billingStatusColors: Record<BillingStatus, string> = {
  not_invoiced: 'bg-gray-100 text-gray-700',
  partial_invoiced: 'bg-yellow-100 text-yellow-700',
  invoiced: 'bg-green-100 text-green-700',
};

export const commissionStatusLabels: Record<CommissionStatus, string> = {
  pending: 'Pending',
  accruing: 'Accruing',
  paid: 'Paid',
  adjusted: 'Adjusted',
};

export const commissionStatusColors: Record<CommissionStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  accruing: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  adjusted: 'bg-purple-100 text-purple-700',
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  open: 'Open',
  paid: 'Paid',
  partial_paid: 'Partial Paid',
  void: 'Void',
  dormant: 'Dormant',
};

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  partial_paid: 'bg-yellow-100 text-yellow-700',
  void: 'bg-red-100 text-red-700',
  dormant: 'bg-purple-100 text-purple-700',
};

export const creditStatusLabels: Record<CreditStatus, string> = {
  open: 'Open',
  applied: 'Applied',
  void: 'Void',
};

export const creditStatusColors: Record<CreditStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  applied: 'bg-green-100 text-green-700',
  void: 'bg-red-100 text-red-700',
};

export const checkStatusLabels: Record<CheckStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
  void: 'Void',
};

export const checkStatusColors: Record<CheckStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  posted: 'bg-green-100 text-green-700',
  void: 'bg-red-100 text-red-700',
};

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  baseCommissionRate: number;            // Deprecated, use standardCommissionRate
  standardCommissionRate?: number;       // Standard/direct commission rate (e.g., 0.10 for 10%)
  warehouseCommissionRate?: number;      // Warehouse commission rate (e.g., 0.05 for 5%)
  paymentTerms?: string;
  salesModel: 'direct' | 'warehouse' | 'buy_sell';
  isActive: boolean;
}

export interface SalesRep {
  id: string;
  name: string;
  email?: string;
  repType: 'inside' | 'outside';
  defaultSplitRate: number;
  territories: string[];
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  territory?: string;
  defaultSplitRates?: OrderSplitRate[];
  isActive: boolean;
}
