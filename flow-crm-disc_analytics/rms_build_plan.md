# FlowRMS Build Plan - Sales Order Management & Commissions

**Version:** 2.0
**Date:** December 10, 2025
**Status:** Planning
**Scope:** Frontend Mockup (No Backend Required)

---

## Overview

This plan integrates B2B sales order management and commission tracking into FlowCRM. Since this is a mockup, all data will be managed via mock data files and local state - no backend implementation needed.

### Integration Strategy
- Extend existing Contact types for Manufacturer and Distributor roles
- Extend existing Companies for factory/manufacturer data
- Build on Quotes module for order conversion
- Use existing mock data patterns (`lib/data/`)
- Follow existing type patterns (`lib/types/`)
- Match existing component structure (`*Content.tsx` pattern)

---

## Architecture Decisions

### Data Layer (Mock)
```
lib/
├── types/
│   └── rms.ts              # All RMS types in one file
└── data/
    └── rms-mock.ts         # All RMS mock data + helper functions
```

### Component Structure
```
components/
├── orders/
│   ├── OrdersContent.tsx           # Main orders view (list + detail panel)
│   ├── CreateOrderModal.tsx        # New order / Convert from quote
│   └── OrderLineItems.tsx          # Line item editor (drag-and-drop)
├── invoices/
│   ├── InvoicesContent.tsx         # Main invoices view
│   └── CreateInvoiceModal.tsx      # Generate invoice from order
├── commissions/
│   ├── CommissionsContent.tsx      # Commission dashboard
│   ├── CommissionReportsPanel.tsx  # Reports by rep/factory/customer
│   └── ChecksContent.tsx           # Commission checks/payments
├── credits/
│   └── CreditsContent.tsx          # Credit management
└── rms-settings/
    └── RMSSettingsContent.tsx      # Commission config, factories, products
```

### Routes
```
app/
├── orders/page.tsx
├── invoices/page.tsx
├── commissions/page.tsx
├── checks/page.tsx
├── credits/page.tsx
└── rms-settings/page.tsx
```

---

## Phase 1: Foundation

### 1.1 Type Definitions (`lib/types/rms.ts`)

Create a single comprehensive types file:

```typescript
// ============================================================================
// FlowRMS - Type Definitions
// ============================================================================

// -----------------------------------------------------------------------------
// Contact Extensions (for Manufacturers & Distributors)
// -----------------------------------------------------------------------------

export interface ManufacturerContactFields {
  isManufacturer: boolean;
  // Commission settings
  baseCommissionRate: number;          // e.g., 0.10 for 10%
  commissionDiscountRate?: number;
  // Payment terms
  paymentTerms?: string;               // e.g., "Net 30"
  // Sales model
  salesModel: 'direct' | 'warehouse' | 'buy_sell';
}

export interface DistributorContactFields {
  isDistributor: boolean;
  // Default split rates for this distributor
  defaultSplitRate?: number;           // e.g., 0.50 for 50%
  insideRepId?: string;
  territories: string[];
}

// -----------------------------------------------------------------------------
// Product Types
// -----------------------------------------------------------------------------

export interface Product {
  id: string;
  manufacturerId: string;              // References Company with isManufacturer
  manufacturerName: string;            // Denormalized for display
  partNumber: string;
  description: string;
  unitPrice: number;
  cost?: number;
  commissionRate?: number;             // Override manufacturer rate
  category?: string;
  isActive: boolean;
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
  customerPartNumber: string;
  priceOverride?: number;
}

// -----------------------------------------------------------------------------
// Order Types
// -----------------------------------------------------------------------------

export type OrderStatus =
  | 'draft'
  | 'open'
  | 'partial_shipped'
  | 'shipped'
  | 'cancelled';

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
  // Status
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  billingStatus: BillingStatus;
  commissionStatus: CommissionStatus;
  // Dates
  orderDate: string;
  requestedShipDate?: string;
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
  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface OrderLineItem {
  id: string;
  lineNumber: number;
  productId: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
  commissionRate: number;
  commissionAmount: number;
  // Fulfillment
  quantityShipped: number;
  quantityInvoiced: number;
  quantityCredited: number;
  isCancelled: boolean;
  // Split rate overrides (if different from order level)
  splitRateOverride?: OrderSplitRate[];
}

export interface OrderSplitRate {
  salesRepId: string;
  salesRepName: string;
  splitPercentage: number;        // e.g., 50 for 50%
  commissionAmount: number;       // Computed
}

// -----------------------------------------------------------------------------
// Invoice Types
// -----------------------------------------------------------------------------

export type InvoiceStatus = 'open' | 'paid' | 'partial_paid' | 'void';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  manufacturerId: string;
  manufacturerName: string;
  customerId: string;
  customerName: string;
  // Status
  status: InvoiceStatus;
  isLocked: boolean;
  // Dates
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  // Line items
  lineItems: InvoiceLineItem[];
  // Totals
  subtotal: number;
  total: number;
  totalCommission: number;
  amountPaid: number;
  amountCredited: number;
  balance: number;
  // Audit
  createdAt: string;
  createdBy: string;
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
  manufacturerId: string;
  manufacturerName: string;
  reasonCode: string;
  reasonDescription: string;
  // Status
  status: CreditStatus;
  // Line items
  lineItems: CreditLineItem[];
  // Totals
  totalAmount: number;
  totalCommissionDeduction: number;
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
  manufacturerId: string;
  manufacturerName: string;
  commissionMonth: string;          // "2025-01"
  // Status
  status: CheckStatus;
  // Dates
  postDate?: string;
  createdDate: string;
  // Details
  details: CheckDetail[];
  // Totals
  invoicePayments: number;
  expenseAdjustments: number;
  creditDeductions: number;
  netAmount: number;
  // Audit
  createdBy: string;
}

export interface CheckDetail {
  id: string;
  type: 'invoice' | 'expense' | 'credit';
  referenceId: string;              // Invoice, expense, or credit ID
  referenceNumber: string;          // Display number
  description: string;
  amount: number;                   // Positive for payments, negative for deductions
}

// -----------------------------------------------------------------------------
// Expense Types
// -----------------------------------------------------------------------------

export type ExpenseStatus = 'open' | 'paid' | 'void';

export interface Expense {
  id: string;
  expenseNumber: string;
  category: string;
  customerId?: string;
  customerName?: string;
  description: string;
  amount: number;
  // Status
  status: ExpenseStatus;
  // Split rates
  splitRates: ExpenseSplitRate[];
  // Dates
  expenseDate: string;
  paidDate?: string;
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
}

export interface OrderSummaryStats {
  totalOrders: number;
  openOrders: number;
  totalValue: number;
  avgOrderValue: number;
  thisMonth: number;
  lastMonth: number;
}

// -----------------------------------------------------------------------------
// Filter Types
// -----------------------------------------------------------------------------

export interface OrderFilters {
  status?: OrderStatus[];
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
  dateRange?: { start: string; end: string };
  search?: string;
}

export interface CommissionFilters {
  salesRepId?: string;
  manufacturerId?: string;
  commissionMonth?: string;
  status?: CommissionStatus[];
}
```

### 1.2 Mock Data (`lib/data/rms-mock.ts`)

Create comprehensive mock data with helper functions:

```typescript
// Manufacturers (extend mock companies)
export const mockManufacturers = [...];

// Products
export const mockProducts = [...];

// Orders with various statuses
export const mockOrders = [...];

// Invoices
export const mockInvoices = [...];

// Credits
export const mockCredits = [...];

// Commission Checks
export const mockChecks = [...];

// Expenses
export const mockExpenses = [...];

// Helper functions
export function getOrderById(id: string): Order | undefined;
export function getOrdersByCustomer(customerId: string): Order[];
export function getOrdersByManufacturer(manufacturerId: string): Order[];
export function calculateOrderTotals(lineItems: OrderLineItem[]): {...};
export function generateOrderNumber(manufacturerId: string): string;
export function convertQuoteToOrder(quote: Quote): Partial<Order>;
```

### 1.3 Sidebar Navigation Update

Add new sections to `Sidebar.tsx`:

```typescript
// Add after existing nav items:
{
  name: 'Orders',
  href: '/orders',
  icon: <ShoppingCartIcon />
},
{
  name: 'Invoices',
  href: '/invoices',
  icon: <DocumentIcon />
},
{
  name: 'Commissions',
  href: '/commissions',
  icon: <CurrencyIcon />
},
{
  name: 'Checks',
  href: '/checks',
  icon: <BanknotesIcon />
},
{
  name: 'Credits',
  href: '/credits',
  icon: <ReceiptRefundIcon />
},
```

---

## Phase 2: Order Management

### 2.1 OrdersContent.tsx

Main orders view with:
- **Header:** Title, filters button, "New Order" button, "Convert from Quote" button
- **Filter tabs:** All | Draft | Open | Shipped | Cancelled
- **Orders table:** Order#, Customer, Manufacturer, Date, Total, Commission, Status
- **Detail panel (slide-in):** Full order details with line items

**Key Features:**
- List/table view with sortable columns
- Click row to open detail panel
- Status badge colors matching existing patterns
- Advanced filters dropdown (reuse `AdvancedFilters` component)

### 2.2 CreateOrderModal.tsx

Two modes:
1. **New Order:** Select customer, manufacturer, add line items manually
2. **Convert from Quote:** Select quote, review line items, set commission splits

**Sections:**
- Customer selection (sold-to, optionally different bill-to)
- Manufacturer selection
- Job/Quote link (optional)
- Line items editor
- Commission split rates
- Notes

### 2.3 OrderLineItems.tsx

Reusable line item editor (drag-and-drop sortable):
- Product search/select
- Quantity input
- Price (auto from product, can override)
- Commission rate (auto from product/manufacturer, can override)
- Extended price (computed)
- Delete button
- Drag handle for reordering

Use `@dnd-kit/core` like existing submittal items.

### 2.4 Order Detail Panel

Slide-in panel showing:
- Order header info
- Status badges (order, fulfillment, billing, commission)
- Line items table
- Commission splits section
- Totals summary
- Action buttons: Edit, Duplicate, Create Invoice, Cancel
- Activity/notes section

---

## Phase 3: Invoice Management

### 3.1 InvoicesContent.tsx

Main invoices view with:
- **Header:** Title, filters, "Generate from Order" button
- **Filter tabs:** All | Open | Paid | Partial | Void
- **Invoices table:** Invoice#, Order#, Customer, Manufacturer, Date, Amount, Status
- **Detail panel:** Invoice details with line items

### 3.2 CreateInvoiceModal.tsx

Generate invoice from order:
- Select order (dropdown of orders ready to invoice)
- Show order line items with quantities available to invoice
- Select line items and quantities
- Set invoice date and due date
- Preview totals

### 3.3 Invoice Detail Panel

- Invoice header
- Line items (linked to order line items)
- Payment history
- Credit history
- Balance summary
- Actions: Mark Paid, Void, Print/Export

---

## Phase 4: Credits

### 4.1 CreditsContent.tsx

Credits list with:
- **Header:** Title, filters, "New Credit" button
- **Filter tabs:** All | Open | Applied | Void
- **Credits table:** Credit#, Order#, Reason, Amount, Status
- **Detail panel:** Credit details

### 4.2 CreateCreditModal.tsx

Create credit against order:
- Select order
- Select reason code
- Select line items to credit
- Enter quantities
- Add notes
- Preview commission impact

---

## Phase 5: Commission Management

### 5.1 CommissionsContent.tsx

Commission dashboard with multiple views:

**Summary Cards:**
- Total Accruing
- Total Paid (YTD)
- Average Commission Rate
- Top Rep This Month

**Views (tabs):**
1. **By Rep:** Table of reps with accruing, paid, total
2. **By Manufacturer:** Table of manufacturers with sales, commission
3. **By Month:** Monthly breakdown chart
4. **Unpaid Invoices:** List ready for payment

### 5.2 CommissionReportsPanel.tsx

Detailed reports with filters:
- Filter by rep, manufacturer, customer, date range
- Drill-down from summary to detail
- Export button (mock - just alert)

### 5.3 ChecksContent.tsx

Commission checks/payments:
- **Header:** Title, "New Check" button
- **Checks table:** Check#, Rep, Month, Amount, Status
- **Detail panel:** Check details with line items

### 5.4 CreateCheckModal.tsx

Create commission check:
- Select sales rep
- Select manufacturer
- Select commission month
- Show unpaid invoices for that rep/manufacturer
- Select invoices to include
- Add expense adjustments
- Add credit deductions
- Preview net amount

---

## Phase 6: Extend Contacts & Companies

### 6.1 Manufacturer Fields

Extend company/contact for manufacturers:
- Add "Manufacturer" to contact types
- Show manufacturer-specific fields when type selected:
  - Base commission rate
  - Payment terms
  - Sales model (direct/warehouse/buy-sell)

### 6.2 Distributor/Rep Fields

Extend contacts for distributors/sales reps:
- Add "Distributor" and "Outside Rep" contact types
- Show fields when selected:
  - Default split rate
  - Territories
  - Inside rep assignment

### 6.3 Customer Enhancements

For customers (existing companies):
- Add default split rates section
- Add customer part numbers section (link to products)

---

## Phase 7: Quote to Order Conversion

### 7.1 Enhance QuotesContent.tsx

Add "Convert to Order" button:
- When quote is in appropriate status
- Opens conversion modal

### 7.2 ConvertQuoteToOrderModal.tsx

Conversion flow:
1. Review quote details
2. Select line items to include
3. Set manufacturer (if not set)
4. Set commission splits
5. Confirm and create order

---

## Phase 8: RMS Settings

### 8.1 RMSSettingsContent.tsx

Configuration page with tabs:

**Products Tab:**
- Product list by manufacturer
- Add/edit products
- Pricing tiers
- CPNs

**Commission Config Tab:**
- Default commission rates
- Stepped commission tiers (future)
- Commission bands (future)

**Reason Codes Tab:**
- Credit reason codes
- Expense categories

**Import/Export Tab:**
- Mock buttons for import/export

---

## Implementation Priority

### Sprint 1: Foundation
1. [ ] Create `lib/types/rms.ts`
2. [ ] Create `lib/data/rms-mock.ts` with initial mock data
3. [ ] Update `Sidebar.tsx` with new navigation
4. [ ] Create route pages (empty shells)

### Sprint 2: Orders
5. [ ] Build `OrdersContent.tsx` (list view)
6. [ ] Build `CreateOrderModal.tsx`
7. [ ] Build `OrderLineItems.tsx` with drag-and-drop
8. [ ] Build order detail panel

### Sprint 3: Invoices & Credits
9. [ ] Build `InvoicesContent.tsx`
10. [ ] Build `CreateInvoiceModal.tsx`
11. [ ] Build `CreditsContent.tsx`
12. [ ] Build `CreateCreditModal.tsx`

### Sprint 4: Commissions
13. [ ] Build `CommissionsContent.tsx` dashboard
14. [ ] Build `ChecksContent.tsx`
15. [ ] Build `CreateCheckModal.tsx`
16. [ ] Build commission reports panel

### Sprint 5: Integration
17. [ ] Extend contacts for manufacturer/distributor
18. [ ] Add "Convert to Order" to quotes
19. [ ] Build `ConvertQuoteToOrderModal.tsx`

### Sprint 6: Settings & Polish
20. [ ] Build `RMSSettingsContent.tsx`
21. [ ] Add products management
22. [ ] Polish UI, add missing status badges
23. [ ] Test all flows end-to-end

---

## UI/UX Patterns to Follow

### From ContactsContent.tsx:
- Contact type filter tabs
- Grid/list view toggle
- Avatar with initials
- Status badges with colors
- Table with hover states
- Slide-in panels for details

### From QuotesContent.tsx:
- Drag-and-drop line items
- Inline editing
- Config modal pattern
- Status workflow

### From SubmittalsContent.tsx:
- Multi-step modals
- Stakeholder management
- Output options configuration

### Color Scheme (Status Badges):
```css
/* Order Status */
.status-draft { @apply bg-gray-100 text-gray-700; }
.status-open { @apply bg-blue-100 text-blue-700; }
.status-partial { @apply bg-yellow-100 text-yellow-700; }
.status-shipped { @apply bg-green-100 text-green-700; }
.status-cancelled { @apply bg-red-100 text-red-700; }

/* Commission Status */
.status-pending { @apply bg-gray-100 text-gray-700; }
.status-accruing { @apply bg-blue-100 text-blue-700; }
.status-paid { @apply bg-green-100 text-green-700; }
.status-adjusted { @apply bg-purple-100 text-purple-700; }
```

---

## File Checklist

### Types & Data
- [ ] `lib/types/rms.ts`
- [ ] `lib/data/rms-mock.ts`

### Route Pages
- [ ] `app/orders/page.tsx`
- [ ] `app/invoices/page.tsx`
- [ ] `app/commissions/page.tsx`
- [ ] `app/checks/page.tsx`
- [ ] `app/credits/page.tsx`
- [ ] `app/rms-settings/page.tsx`

### Components
- [ ] `components/orders/OrdersContent.tsx`
- [ ] `components/orders/CreateOrderModal.tsx`
- [ ] `components/orders/OrderLineItems.tsx`
- [ ] `components/orders/OrderDetailPanel.tsx`
- [ ] `components/invoices/InvoicesContent.tsx`
- [ ] `components/invoices/CreateInvoiceModal.tsx`
- [ ] `components/invoices/InvoiceDetailPanel.tsx`
- [ ] `components/credits/CreditsContent.tsx`
- [ ] `components/credits/CreateCreditModal.tsx`
- [ ] `components/commissions/CommissionsContent.tsx`
- [ ] `components/commissions/CommissionReportsPanel.tsx`
- [ ] `components/commissions/ChecksContent.tsx`
- [ ] `components/commissions/CreateCheckModal.tsx`
- [ ] `components/rms-settings/RMSSettingsContent.tsx`
- [ ] `components/quotes/ConvertToOrderModal.tsx`

### Updates to Existing
- [ ] `components/Sidebar.tsx` - Add nav items
- [ ] `components/ContactsContent.tsx` - Add manufacturer/distributor fields
- [ ] `components/QuotesContent.tsx` - Add convert to order button

---

## Notes

### What's NOT Included (Backend)
- API routes
- Database schema
- Authentication/authorization
- Real data persistence
- PDF generation
- Email notifications

### Mock Data Approach
All data operations will:
1. Read from mock arrays
2. Update local state
3. Display changes immediately
4. Reset on page refresh (intentional for mockup)

### Future Backend Integration
When backend is built:
1. Replace mock data imports with API calls
2. Add loading states
3. Add error handling
4. Add optimistic updates
5. Add real-time sync

---

END OF DOCUMENT
