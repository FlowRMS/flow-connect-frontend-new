# Orders Module - Technical Documentation

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Order Entity & Data Structure](#2-order-entity--data-structure)
3. [API & Backend Integration](#3-api--backend-integration)
4. [State Management & Hooks](#4-state-management--hooks)
5. [List View (Orders Page)](#5-list-view-orders-page)
6. [Detail View (Order Detail Page)](#6-detail-view-order-detail-page)
7. [Line Items Management](#7-line-items-management)
8. [Credits System](#8-credits-system)
9. [Acknowledgements System](#9-acknowledgements-system)
10. [Invoices System](#10-invoices-system)
11. [Adjustments System](#11-adjustments-system)
12. [Modals & Actions](#12-modals--actions)
13. [Status Workflows](#13-status-workflows)
14. [Bulk Actions](#14-bulk-actions)
15. [Advanced Filtering & Sorting](#15-advanced-filtering--sorting)
16. [Relationships with Other Entities](#16-relationships-with-other-entities)
17. [Special Features & Edge Cases](#17-special-features--edge-cases)

---

## 1. Module Overview

**Location**: `/components/orders/` and `/app/(dashboard)/orders/`

**Purpose**: Core sales order management - create, view, edit orders, track fulfillment, billing, and commission calculations.

**Technologies**: React 18, TypeScript, Next.js 15+, React Query, GraphQL, Framer Motion, TailwindCSS

### File Structure
```
components/orders/
├── list/
│   ├── OrdersListContent.tsx              # Main list component
│   ├── components/
│   │   ├── table/                         # Table components
│   │   ├── sidebar/                       # Order preview panel
│   │   └── modals/                        # List-level modals
│   ├── config/                            # Filter/column config
│   └── hooks/                             # List state hooks
├── detail/
│   ├── OrderDetailContent.tsx             # Main detail component
│   ├── components/
│   │   ├── header/                        # Header components
│   │   ├── line-items/                    # Line items table
│   │   ├── tabs/                          # Tab components
│   │   └── modals/                        # Detail-level modals
│   ├── config/                            # Detail config
│   └── hooks/                             # Detail state hooks
└── api/
    ├── ordersApi.ts                       # Orders CRUD
    ├── useOrdersApi.ts                    # React Query hooks
    ├── creditsApi.ts
    ├── acknowledgementsApi.ts
    ├── adjustmentsApi.ts
    └── invoicesApi.ts
```

---

## 2. Order Entity & Data Structure

### Core Order Type
```typescript
interface Order {
  // Identification
  id: string;
  orderNumber: string;
  factorySoNumber?: string;

  // Entity References
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

  // Status Fields
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

  // Line Items
  lineItems: OrderLineItem[];

  // Financial Totals
  subtotal: number;
  freight: number;
  total: number;
  totalCommission: number;

  // Sales Representatives
  insideRepId?: string;
  insideRepName?: string;
  splitRates: OrderSplitRate[];

  // Notes & PO
  notes?: string;
  poNumber?: string;

  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}
```

### Order Line Item Type
```typescript
interface OrderLineItem {
  // Identification
  id: string;
  lineNumber: number;

  // Product Info
  productId?: string;
  partNumber?: string;
  custPartNumber?: string;
  description: string;

  // Measurement
  uom?: string | null;
  uomId?: string | null;
  divisor?: number;

  // Quantity & Pricing
  quantity: number;
  unitPrice: number;
  extendedPrice: number;                   // quantity * unitPrice / divisor

  // Commission
  commissionRate: number;
  commissionAmount: number;
  commissionDiscountPercent?: number;
  commissionDiscountAmount?: number;
  lineDiscountPercent?: number;
  lineDiscountAmount?: number;

  // Fulfillment Tracking
  quantityShipped: number;
  quantityInvoiced: number;
  quantityCredited: number;
  status?: 'open' | 'shipped' | 'partial_shipped' | 'cancelled' | 'invoiced';
  isCancelled: boolean;

  // Consignment
  isConsignment: boolean;
  isWarehouseConsignment?: boolean;
  inventoryOnHand?: number;

  // Credit Fields
  isCredit?: boolean;
  creditType?: 'return' | 'short_ship' | 'cancel' | 'damage';
  linkedLineItemId?: string | null;

  // Invoice Linking
  linkedInvoiceIds?: string[];
  invoice?: { id, invoiceNumber?, status?, entityDate?, dueDate?, creationType?, locked? };

  // Per-line splits
  outsideSplitRates?: SplitRate[];
  insideSplitRates?: SplitRate[];

  // Overrides
  endUserId?: string;
  endUserName?: string;
  manufacturerId?: string;
  manufacturerName?: string;

  // Additional
  notes?: string;
  fulfillmentRequestId?: string;
  fulfillmentRequestNumber?: string;
  fulfillmentRequestStatus?: string;
}
```

### Status Types
```typescript
type OrderStatus = 'OPEN' | 'PARTIAL_SHIPPED' | 'SHIPPED_COMPLETE' | 'CANCELLED' | 'OVER_SHIPPED' | 'PARTIAL_CANCELLED' | 'OVER_CANCELLED';
type FulfillmentStatus = 'not_started' | 'in_progress' | 'completed';
type BillingStatus = 'not_invoiced' | 'partial_invoiced' | 'invoiced';
type CommissionStatus = 'pending' | 'accruing' | 'paid' | 'adjusted';
```

---

## 3. API & Backend Integration

### Core API Functions
```typescript
// Paginated list
fetchOrdersWithPagination(filters?, orderBy?, pagination?): Promise<PaginatedOrdersResult>

// Single order
fetchOrderById(orderId: string): Promise<Order>

// CRUD
createOrder(input: CreateOrderInput): Promise<Order>
updateOrder(input: UpdateOrderInput): Promise<Order>
deleteOrder(orderId: string): Promise<boolean>

// Special operations
duplicateOrder(orderId, newOrderNumber, newSoldToCustomerId): Promise<Order>
createOrderFromQuote(input: CreateOrderFromQuoteInput): Promise<Order>
fetchAllOrderIds(): Promise<string[]>
```

### Input Types
```typescript
interface CreateOrderInput {
  orderNumber: string;
  manufacturerId: string;
  customerId: string;
  jobId?: string;
  quoteId?: string;
  billToCustomerId?: string;
  orderDate: string;
  dueDate?: string;
  requestedShipDate?: string;
  poNumber?: string;
  notes?: string;
  insideRepId?: string;
  details: OrderDetailInput[];
  splitRates: OrderSplitRateInput[];
}

interface OrderDetailInput {
  id?: string;                             // Omit for new lines
  itemNumber?: number;
  productId?: string;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  quantity: string;
  unitPrice: string;
  commissionRate: string;
  discountRate?: string;
  commissionDiscountRate?: string;
  uomId?: string;
  divisionFactor?: string;
  note?: string;
}
```

### React Query Hooks
```typescript
useOrdersInfinite(filters?, orderBy?, pageSize?)
useOrders(filters?, orderBy?)
useOrder(id: string | null)
useOrderSearch(searchTerm)
useCreateOrder()
useUpdateOrder()
useDeleteOrder()
useDuplicateOrder()
useCreateOrderFromQuote()
useCustomerSearch(searchTerm, enabled?)
useFactorySearch(searchTerm, enabled?)
useUserSearch(searchTerm, isInside?, isOutside?)
useJobSearch(searchTerm)
useProductSearch(searchTerm, factoryId?)
```

---

## 4. State Management & Hooks

### useOrdersListState
```typescript
// Returns
{
  // Data
  filteredOrders, totalCount, isLoading, error, refetch,
  // Search
  searchQuery, setSearchQuery,
  // Filters
  activeFilters, setActiveFilters, quickDatePreset, setQuickDatePreset, quickDateField, setQuickDateField, columnFilters, setColumnFilters,
  // Sort
  sortField, setSortField, sortDirection, setSortDirection,
  // Selection
  selectedOrderIds, toggleOrderSelection, selectAllOrders, clearSelection,
  // Pagination
  hasNextPage, isFetchingNextPage, fetchNextPage,
  // Sidebar
  selectedOrder, setSelectedOrder,
  // Modals
  showCreateModal, setShowCreateModal,
  // Bulk actions
  bulkDelete, bulkSetStatus
}
```

### useOrderDetailState
```typescript
// Returns
{
  order, isLoading, error,
  isCreateMode,
  handleSave, isSaving,
  hasChanges, setHasChanges,
  activeTab, setActiveTab,
  selectedLineItemIds, setSelectedLineItemIds,
  visibleColumns, setVisibleColumns,
  viewMode, setViewMode,
  sectionDisplayMode, setSectionDisplayMode,
  // Dropdown states...
  // Version tracking...
  // Per-line settings...
  updateOrder, updateLineItem, addLineItem, deleteLineItem
}
```

---

## 5. List View (Orders Page)

**Route**: `/orders`

**Features**:
- Infinite scroll (50 items/page)
- Advanced filters
- Quick date filter (Today, This Week, Last Week)
- Column-level filters
- Multi-column sort
- Full-text search (min 2 chars)
- Bulk actions
- Order preview sidebar

**Table Columns**: Order#, Status, Customer, Factory, Total, Commission, Created By

**Bulk Actions** (when selected):
- Set Status
- Delete (only unlinked orders)
- Create Credit
- Add Acknowledgement

**Sidebar Panel Sections**:
1. Status badge
2. Details (Order#, Customer, Factory, Job, Dates)
3. Line Items summary
4. Commission Splits
5. Totals

---

## 6. Detail View (Order Detail Page)

**Routes**: `/orders/[id]` (edit), `/orders/new` (create)

### Layout
```
Header: Back, Order#, Status, Actions, Save/Discard
├── HeaderTopBar: Status dropdown, Actions dropdown, Create Invoice, Fulfillment Request
├── OrderDetailHeader: Editable fields (Order#, Factory, Customer, Job, Quote, Dates, PO#, Inside Rep, Outside Reps)
└── PricingSummaryBar: Subtotal, Freight, Total, Commission, Fulfillment %, Billing %
```

### Tabs
1. **Line Items** (default): Editable table with configurable columns
2. **Credits**: Credits list with search/filter
3. **Acknowledgements**: Acks list with search/sort
4. **Adjustments**: Adjustments list
5. **Invoices**: Linked invoices with status
6. **Notes**: Free-form notes
7. **Tasks**: Related tasks
8. **Activity**: Audit log (Coming Soon)
9. **Linked Objects**: Related entities
10. **Settings**: Per-line settings, column visibility

### Create Mode
1. Navigate to `/orders/new`
2. Empty order with one blank line
3. Fill required fields (Order#, Manufacturer, Customer, Date)
4. Save → redirects to `/orders/[newId]`

### Edit Mode
1. Navigate to `/orders/[id]`
2. Fetch and transform order
3. Track changes
4. Save/Cancel with unsaved changes warning

---

## 7. Line Items Management

### Table Columns (Configurable)
**Basic**: Part#, Cust Part#, Description, UOM, Divisor, Unit Price, Qty, Shipped Qty, Status
**Commission**: Commission %, Commission, Commission Total, Invoiced
**Linked**: Quote#, Invoice#, Check#, Fulfillment#
**Overage**: % Over, Ovg $, Earn %, Earn $
**Icons**: Ack, Doc-Specific, Warehouse, Credit

### Editable Cells
- Part Number (with product autocomplete)
- Qty (auto-recalc totals)
- Unit Price (auto-recalc)
- Commission % (auto-recalc)
- UOM (dropdown)
- Divisor

### Auto-Calculations
```typescript
extendedPrice = (qty * unitPrice) / divisor
commissionAmount = extendedPrice * (commissionRate / 100)

// Order totals
order.subtotal = sum(lineItems.extendedPrice)
order.totalCommission = sum(lineItems.commissionAmount)
order.total = subtotal + freight
```

### Context Menu Actions
- Set End User
- Set Overage
- Set Outside Rep Splits
- Add Acknowledgement
- Add Credit
- Convert to Warehouse
- Create Fulfillment Request
- View Additional Details
- Delete Line

---

## 8. Credits System

### Credit Entity
```typescript
interface Credit {
  id: string;
  creditNumber: string;
  orderId: string;
  invoiceId?: string;
  manufacturerId: string;
  customerId: string;
  reasonCode: 'return' | 'short_ship' | 'cancel' | 'damage';
  reasonDescription: string;
  status: 'open' | 'applied' | 'void';
  lineItems: CreditLineItem[];
  totalAmount: number;
  totalCommissionDeduction: number;
  splitRates: OrderSplitRate[];
  creditDate: string;
  appliedDate?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}
```

### Creating Credits
- From List: Bulk Actions → Create Credit
- From Detail: Credits tab → + Add Credit
- From Line Item: Context menu → Add Credit

### Credit Impact
- Commission deducted from rep
- Shows in commission check as deduction
- Can be linked to invoice or standalone

---

## 9. Acknowledgements System

### Acknowledgement Entity
```typescript
interface OrderAcknowledgement {
  id: string;
  orderAcknowledgementNumber: string;
  orderId: string;
  orderNumber: string;
  quantity: string;
  entityDate?: string;
  createdAt?: string;
  details?: OrderAcknowledgementDetail[];
  creationType?: 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';
}

interface OrderAcknowledgementDetail {
  id: string;
  orderDetailId: string;
  quantity: string;
  shipDate?: string;
}
```

### Creating Acknowledgements
- From Detail: Acks tab → + Add Acknowledgement
- From Line Item: Context menu → Add Acknowledgement

### Impact
- Increases `quantityShipped` on line items
- Updates line status to "shipped"
- Updates order fulfillmentStatus

---

## 10. Invoices System

### Invoice from Order Perspective
```typescript
interface OrderInvoice {
  id: string;
  invoiceNumber?: string;
  status?: string;              // 'OPEN' | 'PAID' | 'VOID' | etc.
  published?: boolean;
  locked?: boolean;
  entityDate?: string;
  dueDate?: string;
  creationType?: string;
  total?: number;
  commission?: number;
}
```

### Invoice Generation
- Trigger: "Create Invoice" button in header
- Modal: Select line items, set invoice date
- Creates invoice with selected lines
- Updates line.quantityInvoiced
- Updates order.billingStatus

### Invoice Statuses
- **OPEN**: Created, not paid
- **PAID**: Fully paid
- **PARTIAL**: Partially paid
- **VOID**: Cancelled
- **POSTED**: Finalized in accounting

---

## 11. Adjustments System

Similar to Credits - for allowances/adjustments to pricing or commission.

### Creating Adjustments
- From Detail: Adjustments tab → + Add Adjustment
- Modal with type, amount, lines, reason

---

## 12. Modals & Actions

### Header Modals
1. **QuoteLookupModal**: Find & link quote
2. **ColumnsModal**: Toggle column visibility
3. **SectionsModal**: Change column layout
4. **OutsideRepSplitsModal**: Edit order-level rep splits
5. **InsideRepSplitsModal**: Edit inside rep

### Utility Modals
6. **CreateInvoiceFromOrderModal**: Generate invoice
7. **FulfillmentRequestModal**: Create warehouse request
8. **WarehouseConversionModal**: Mark items as warehouse
9. **DeleteConfirmModal**: Delete order
10. **UnsavedChangesModal**: Confirm navigation

### Line Item Modals
11. **SetEndUserModal**: Per-line end user
12. **SetOverageModal**: Per-line overage
13. **SetOutsideRepSplitsModal**: Line-level splits
14. **LineAcknowledgementModal**: Link ack to line
15. **AdditionalDetailsModal**: Extra line fields

### Tab Modals
16. **CreditModal** / **CreditDetailModal**
17. **AcknowledgementModal** / **AcknowledgementDetailModal**
18. **AdjustmentModal** / **AdjustmentDetailModal**
19. **InvoiceDetailModal**

---

## 13. Status Workflows

### Order Status
```
OPEN → PARTIAL_SHIPPED (first ack received)
PARTIAL_SHIPPED → SHIPPED_COMPLETE (all acked)
OPEN/PARTIAL_SHIPPED → CANCELLED (user action)
Any → OVER_SHIPPED (shipped > ordered)
```

### Fulfillment Status
- **not_started**: No acks yet
- **in_progress**: Some acked
- **completed**: All acked

### Billing Status
- **not_invoiced**: No invoices
- **partial_invoiced**: Some invoiced
- **invoiced**: All invoiced

### Commission Status
- **pending**: Awaiting invoice
- **accruing**: Invoice created
- **paid**: Check issued
- **adjusted**: Commission adjusted

---

## 14. Bulk Actions

### At List Level
1. **Set Status**: Change multiple orders
2. **Delete**: Only unlinked orders
3. **Create Credit**: Bulk credit creation
4. **Add Acknowledgement**: Bulk ack

### At Detail Level (Line Items)
1. Delete selected lines
2. Set commission % for all selected
3. Set end user for all selected
4. Add credit/ack for selected

### Selection Logic
- Row checkbox: Individual
- Header checkbox: All visible
- "Select all": Including unloaded
- Eligibility check: Cannot select linked orders

---

## 15. Advanced Filtering & Sorting

### Available Filters
- Order Number (text)
- Status (dropdown)
- Total (number range)
- Commission (number range)
- Order Date (date range)
- Entry Date (date range)
- Job Name (text)
- Created By (user select)
- Published (boolean)

### Quick Date Filter
- All, Today, This Week, Last Week
- Applied to: Order Date or Entry Date

### Sort Options
- Order Number, Status, Order Date, Total, Commission, Customer Name, Factory Name

### Filter Sync
- Advanced filters ↔ Column filters stay in sync

---

## 16. Relationships with Other Entities

### Companies
- **Customer**: soldToCustomerId/customerName (required)
- **Bill-To**: billToCustomerId/billToCustomerName (optional)
- **Manufacturer**: manufacturerId/manufacturerName (required)

### Jobs
- Optional link via jobId/jobName
- Multiple orders per job

### Quotes
- Optional link via quoteId/quoteNumber
- Can be created from quote

### Invoices
- One order → many invoices
- Invoice links back via orderId

### Commission Checks
- Through invoices
- Check payment → commissionStatus = "paid"

### Credits & Adjustments
- Created from order line items
- Reduce total and commission

### Acknowledgements
- Created from order
- Update fulfillmentStatus

---

## 17. Special Features & Edge Cases

### Warehouse Integration
- Mark line as warehouse consignment
- Fulfillment requests to warehouse
- Track fulfillment status

### Commission Calculations
```typescript
// Per line
extendedPrice = (quantity * unitPrice) / divisor
commissionAmount = extendedPrice * (commissionRate / 100)
finalCommission = commissionAmount - commissionDiscountAmount

// Per rep (with splits)
repCommission = totalCommission * (splitPercentage / 100)

// With overage
earnAmount = commissionAmount + overageAmount
```

### Overage Management
- Product sold at higher margin than commission rate
- SetOverageModal to enter overage %
- Can lock overage to prevent auto-recalc

### Document-Specific Products
- Ad-hoc products only for this order
- `isDocumentSpecific = true`
- Custom pricing and commission

### Per-Line-Item Settings
- `showOutsideRepPerLine`: Different outside reps per line
- `showInsideRepPerLine`: Different inside reps per line
- `showEndUserPerLine`: Different end users per line

### Outside Rep Population Source
- `outsideRepSource`: Tenant-wide setting controlling which customer's outside reps auto-populate
  - `'end_user'` (default): Outside reps are fetched from the End User customer
  - `'sold_to'`: Outside reps are fetched from the Sold To Customer
  - `'bill_to'`: Outside reps are fetched from the Bill To Customer
- Configurable in: Order detail Settings tab, central Settings page (Order Settings)
- Stored in `ORDER_SETTINGS` via `saveTenantSetting`

### Header Field Visibility (Tenant-Only)
These settings hide/show specific fields on the order detail header. All default to `false` (visible).
- `hideBillToCustomer`: Hides the Bill To Customer field (Row 1)
- `hideShippingTerms`: Hides the Shipping Terms field (Row 2)
- `hideMarkNumber`: Hides the Mark # field (Row 2)
- `hideProjectedShipDate`: Hides the Projected Ship Date field (Row 2)
- `hideJob`: Hides the Job field (Row 2)
- `hideManufacturerSoNumber`: Hides the Manufacturer SO Number field (Row 3)
- `hideFreightTerms`: Hides the Freight Terms field (Row 3)
- Configurable in: Settings > Order Settings page AND Order detail Settings tab (both save to tenant)
- Applied in: `OrderDetailsFields.tsx` — grid columns are computed dynamically based on visible field count
- Read from tenant settings via `useOrderSettings()` hook
- Type definition: `OrderSettingsValue` in `components/lib/graphql/settings.ts`

### Adhoc vs Catalog Products
- **Catalog**: productId references catalog, auto-fills from product
- **Adhoc**: productNameAdhoc/productDescriptionAdhoc, custom pricing

### Consignment Tracking
- `isConsignment = true`
- Different commission treatment

### Customer-Specific Pricing
- CPN lookup: `getProductCpnByCustomer(productId, customerId)`
- Returns customer-specific price

### Unsaved Changes Protection
- `useUnsavedChangesGuard` hook
- Modal: Save / Discard / Cancel

### Pinned Columns
- Some columns stay visible during scroll
- Part # typically pinned

---

## Known Issues & Temporary Fixes

### TEMP FIX: Imported orders have zero subtotal (backend bug)
- **File**: `components/orders/detail/hooks/useOrderDetailState.ts` — `transformApiOrderToUiOrder()`
- **Problem**: The backend sends `subtotal: "0.0000"` on line item details for orders with `creationType: "IMPORT"`. Manually created orders (`creationType: "MANUAL"`) return correct subtotals.
- **Frontend workaround**: When the API subtotal is `0` but `unitPrice * quantity / divisor` produces a non-zero value, the frontend falls back to the calculated value. If both are `0`, it stays `0` (legitimate zero-priced item).
- **Root cause**: Backend order import pipeline does not compute/store `subtotal` on line item details or the balance object.
- **Action needed**: Jamal to fix the import pipeline so subtotal is computed correctly. Once fixed, the frontend workaround can be removed (it will be harmless either way).
- **Date added**: 2026-02-02
