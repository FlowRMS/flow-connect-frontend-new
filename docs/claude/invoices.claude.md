# Invoices Module - Technical Documentation

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Invoice Entity & Data Types](#2-invoice-entity--data-types)
3. [API Endpoints & GraphQL Operations](#3-api-endpoints--graphql-operations)
4. [UI Components Architecture](#4-ui-components-architecture)
5. [State Management](#5-state-management)
6. [List View Features](#6-list-view-features)
7. [Detail View Features](#7-detail-view-features)
8. [Line Items Management](#8-line-items-management)
9. [Commission & Split Rates](#9-commission--split-rates)
10. [Modals & Actions](#10-modals--actions)
11. [Filtering & Sorting](#11-filtering--sorting)
12. [Entity Relationships](#12-entity-relationships)
13. [Order Population](#13-order-population)
14. [Edge Cases & Special Features](#14-edge-cases--special-features)

---

## 1. Module Overview

**Location**: `/components/invoices/`

**Purpose**: Complete invoice management system with list/detail views, line items, commission tracking, order integration, payment tracking, and status workflows.

**Technologies**: Next.js 15+, React, TypeScript, TanStack React Query, Tailwind CSS

### File Structure
```
components/invoices/
├── api/
│   ├── index.ts                           # Re-exports
│   ├── invoicesApi.ts                     # API functions
│   └── useInvoicesApi.ts                  # React Query hooks
├── list/
│   ├── InvoicesListContent.tsx            # Main list container
│   ├── constants.ts                       # List constants
│   ├── types.ts                           # List-specific types
│   ├── utils.ts                           # List utilities
│   ├── config/
│   │   ├── columnConfig.ts                # Column definitions
│   │   └── filterConfig.ts                # Filter/sort options
│   ├── hooks/
│   │   ├── useInvoicesListState.ts        # Main state hook
│   │   ├── useInvoiceFilters.ts           # Filter logic
│   │   ├── useInvoiceBulkActions.ts       # Bulk operations
│   │   └── useInvoiceSelection.ts         # Selection state
│   └── components/
│       ├── table/
│       │   ├── InvoicesTable.tsx
│       │   ├── InvoicesTableHeader.tsx
│       │   ├── InvoiceRow.tsx
│       │   ├── BulkActionsBar.tsx
│       │   ├── ColumnFilterDropdown.tsx
│       │   ├── InvoicesEmptyState.tsx
│       │   └── InvoicesTableSkeleton.tsx
│       ├── sidebar/
│       │   ├── InvoiceDetailPanel.tsx
│       │   ├── InvoiceDetailsSection.tsx
│       │   ├── InvoiceLineItemsSection.tsx
│       │   ├── InvoiceSplitsSection.tsx
│       │   ├── InvoiceStatusSection.tsx
│       │   └── InvoiceTotalsSection.tsx
│       ├── modals/
│       │   ├── CreateInvoiceModal.tsx
│       │   └── RecordPaymentModal.tsx
│       └── QuickDateFilter.tsx
├── detail/
│   ├── InvoiceDetailContent.tsx           # Main detail container
│   ├── constants.ts                       # Detail constants
│   ├── types.ts                           # Detail-specific types
│   ├── utils.ts                           # Detail utilities
│   ├── config/
│   │   ├── columnConfig.ts                # Line items columns
│   │   ├── tabsConfig.ts                  # Tab definitions
│   │   └── viewsConfig.ts                 # Saved views
│   ├── hooks/
│   │   ├── useInvoiceDetailState.ts       # Main detail state
│   │   └── useInvoiceLineItemsTable.ts    # Line items table
│   └── components/
│       ├── header/
│       │   ├── HeaderTopBar.tsx
│       │   ├── InvoiceDetailsFields.tsx
│       │   └── PricingSummaryBar.tsx
│       ├── line-items/
│       │   ├── LineItemsTable.tsx
│       │   ├── LineItemsTableHeader.tsx
│       │   ├── LineItemsTableRow.tsx
│       │   └── BulkActionsBar.tsx
│       ├── tabs/
│       │   ├── ActivityTab.tsx
│       │   ├── CreditsTab.tsx
│       │   ├── LinkedObjectsTab.tsx
│       │   ├── NotesTab.tsx
│       │   ├── SettingsTab.tsx
│       │   └── TasksTab.tsx
│       └── modals/
│           ├── header/
│           │   ├── InsideRepSplitsModal.tsx
│           │   └── OutsideRepSplitsModal.tsx
│           ├── line-items/
│           │   └── AdditionalDetailsModal.tsx
│           └── utility/
│               ├── DeleteConfirmModal.tsx
│               └── WarehouseConversionModal.tsx
```

---

## 2. Invoice Entity & Data Types

### Invoice Status
```typescript
type InvoiceStatus = 'open' | 'paid' | 'partial_paid' | 'void' | 'dormant';
```

### Base Invoice Type (from RMS)
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  manufacturerId: string;
  manufacturerName: string;
  status: InvoiceStatus;
  isLocked: boolean;
  invoiceDate: string;
  entryDate: string;
  dueDate: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  freight: number;
  total: number;
  amountPaid: number;
  amountCredited: number;
  balance: number;
  totalCommission: number;
  splitRates: OrderSplitRate[];
  factoryName?: string;
  published?: boolean;
}
```

### Extended InvoiceLineItem (for editing)
```typescript
interface InvoiceLineItem {
  id: string;
  lineNumber: number;
  productId?: string;
  partNumber: string;
  custPartNumber?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  uom: string | null;
  uomId?: string | null;
  divisor: number;
  total: number;
  amount: number;                          // Extended price: qty * unitPrice / divisor
  commissionRate: number;                  // Decimal (0.08 = 8%)
  commissionAmount: number;                // Dollar amount
  commissionPercent: number;
  commission: number;
  discountPercent?: number;
  discount?: number;
  commissionDiscountPercent?: number;
  commissionDiscount?: number;
  status?: string;
  leadTime?: string;
  note?: string;
  endUserId?: string;
  endUserName?: string;
  orderDetailId?: string;
  orderLineItemId?: string;
  invoicedBalance?: number;
  outsideSplitRates?: SplitRate[];
  insideSplitRates?: SplitRate[];
  isWarehouseConsignment?: boolean;
  inventoryOnHand?: number;
  isQuoteLevelProduct?: boolean;           // Adhoc products created for this invoice
}
```

### EditableInvoice (extends base Invoice)
```typescript
interface EditableInvoice extends Omit<Invoice, 'lineItems'> {
  lineItems: InvoiceLineItem[];
  published?: boolean;

  // Customer fields
  soldToCustomerId?: string;
  soldToCustomerName?: string;
  billToCustomerId?: string;
  billToCustomerName?: string;
  endUserId?: string;
  endUserName?: string;

  // Order reference fields
  poNumber?: string;
  jobId?: string;
  jobName?: string;

  // Terms (from order)
  paymentTerms?: string;
  paymentTermsId?: string;
  freightTerms?: string;
  freightTermsId?: string;
  shippingTerms?: string;
  shippingTermsId?: string;

  // Rep fields
  outsideRepId?: string;
  outsideRepName?: string;
  insideRepId?: string;
  insideRepName?: string;

  // Header-level split rates (when NOT per-line-item)
  outsideSplitRates?: SplitRate[];
  insideSplitRates?: SplitRate[];

  // Per-line-item flags from order
  outsidePerLineItem?: boolean;
  insidePerLineItem?: boolean;
  endUserPerLineItem?: boolean;

  // Flag: fields populated from order (should be read-only)
  isPopulatedFromOrder?: boolean;
}
```

### InvoiceLandingPage (List View)
```typescript
interface InvoiceLandingPage {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  orderNumber?: string;
  factoryName?: string;
  status?: string;
  locked?: boolean;
  entityDate?: string;                     // Invoice date
  dueDate?: string;
  createdAt?: string;
  createdBy?: string;
  total?: number;
  commission?: number;
  published?: boolean;
}
```

### SplitRate
```typescript
interface SplitRate {
  userId: string;
  userName: string;
  splitRate: number;
  position: number;
}
```

---

## 3. API Endpoints & GraphQL Operations

### Queries

#### Fetch Invoices with Pagination
```typescript
fetchInvoicesWithPagination(
  params: PaginationParams,
  filters?: InvoiceLandingPageFilter[],
  orderBy?: InvoiceLandingPageOrderBy[]
): Promise<PaginatedInvoicesResult>
```

#### Fetch Single Invoice
```typescript
fetchInvoiceById(id: string): Promise<Invoice>
```

#### Search Invoices
```typescript
searchInvoices(query: string, options?: InvoiceSearchOptions): Promise<Invoice[]>
```

#### Fetch All Invoice IDs (for bulk selection)
```typescript
fetchAllInvoiceIds(filters?: InvoiceLandingPageFilter[]): Promise<string[]>
```

### Mutations

#### Create Invoice
```typescript
interface CreateInvoiceInput {
  invoiceNumber?: string;
  entityDate: string;                      // Invoice date
  dueDate?: string;
  orderId?: string;
  factoryId?: string;
  creationType: 'MANUAL' | 'FROM_ORDER';
  details: InvoiceDetailInput[];
}
```

#### Update Invoice
```typescript
interface UpdateInvoiceInput extends CreateInvoiceInput {
  id: string;
}
```

#### Create Invoice from Order
```typescript
interface CreateInvoiceFromOrderInput {
  orderId: string;
  invoiceNumber?: string;
  entityDate?: string;
  orderDetails: OrderDetailInputForInvoice[];
}

interface OrderDetailInputForInvoice {
  orderDetailId: string;
  quantity: string;
}
```

#### Delete Invoice
```typescript
deleteInvoice(id: string): Promise<boolean>
```

### Filter/Sort Types
```typescript
interface InvoiceLandingPageFilter {
  columnName: string;
  operator: 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'ILIKE' | 'IN' | 'IS_NULL' | 'IS_NOT_NULL';
  value?: string;
  values?: string[];
}

interface InvoiceLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}
```

---

## 4. UI Components Architecture

### Component Hierarchy
```
InvoicesListContent.tsx
├── Header (search, filters, sort, create button)
├── QuickDateFilter.tsx
├── BulkActionsBar.tsx (when items selected)
├── InvoicesTable.tsx
│   ├── InvoicesTableHeader.tsx
│   │   └── ColumnFilterDropdown.tsx (per column)
│   └── InvoiceRow.tsx (per invoice)
├── InvoicesTableSkeleton.tsx (loading)
├── InvoicesEmptyState.tsx (no data)
├── InvoiceDetailPanel.tsx (sidebar when selected)
│   ├── InvoiceStatusSection.tsx
│   ├── InvoiceDetailsSection.tsx
│   ├── InvoiceTotalsSection.tsx
│   ├── InvoiceLineItemsSection.tsx
│   └── InvoiceSplitsSection.tsx
└── Modals
    ├── CreateInvoiceModal.tsx
    └── RecordPaymentModal.tsx

InvoiceDetailContent.tsx
├── HeaderTopBar.tsx
│   ├── Version dropdown
│   ├── View mode dropdown (Simple/Overage)
│   ├── Status dropdown
│   └── Actions dropdown
├── InvoiceDetailsFields.tsx
│   ├── Order selection (create mode)
│   ├── Customer fields (Sold To, Bill To, End User)
│   ├── Rep fields (Outside, Inside)
│   ├── Date fields (Invoice Date, Due Date)
│   └── Terms fields
├── PricingSummaryBar.tsx
├── Tabs
│   ├── Line Items (default)
│   ├── Files
│   ├── Credits
│   ├── Notes
│   ├── Tasks
│   ├── Activity (coming soon)
│   ├── Linked Objects
│   └── Settings
├── LineItemsTable.tsx
│   ├── LineItemsTableHeader.tsx
│   └── LineItemsTableRow.tsx
└── Modals
    ├── InsideRepSplitsModal.tsx
    ├── OutsideRepSplitsModal.tsx
    ├── AdditionalDetailsModal.tsx
    ├── DeleteConfirmModal.tsx
    └── WarehouseConversionModal.tsx
```

---

## 5. State Management

### useInvoicesListState Hook
Main state management for list view:

```typescript
// Search
searchQuery: string
setSearchQuery: (query: string) => void

// Quick date filters
quickDatePreset: 'all' | 'today' | 'this_week' | 'last_week'
quickDateField: 'entryDate' | 'invoiceDate'
setQuickDatePreset, setQuickDateField

// Server-side filters
serverFilters: InvoiceLandingPageFilter[]
activeFilters: ActiveFilter[]
columnFilters: Record<string, ActiveFilter[]>
handleServerFiltersChange, handleColumnFiltersChange

// Sorting
serverOrderBy: InvoiceLandingPageOrderBy[]
handleSortChange

// Pagination
fetchNextPage, hasNextPage, isFetchingNextPage
handleScroll: (e: React.UIEvent<HTMLDivElement>) => void

// Selection (bulk selection with select-all-across-pages)
selectedInvoiceIds: Set<string>
isItemSelected, isAllSelected, isPartiallySelected
handleSelectAll, handleSelectOne, selectAllMode
getAllSelectedIds: () => Promise<string[]>

// Selected invoice detail
selectedInvoice: Invoice | null
setSelectedInvoice

// Modals
showCreateModal, showPaymentModal, showBulkDeleteModal

// Commission splits editing
editingSplits, editedSplits
startEditingSplits, cancelEditingSplits, saveSplits
updateSplitPercentage, addNewSplit, removeSplit, updateSplitRep
```

### useInvoiceDetailState Hook
Main state management for detail view:

```typescript
// Invoice data
invoice: EditableInvoice | null
isLoading, error, refetch
isCreateMode: boolean

// Mutations
updateInvoice: (updates: Partial<EditableInvoice>) => void
saveInvoice: () => Promise<boolean>
isSaving: boolean

// Unsaved changes
hasChanges: boolean
resetChanges: () => void

// Order selection (for populating new invoice)
handleOrderSelect: (orderId: string, orderNumber: string) => void
handleInvoiceSelect: (invoiceId: string, invoiceNumber: string) => void
isOrderLoading: boolean

// Line items
updateLineItems, addLineItem, deleteLineItem, updateLineItem
selectedLineItems: Set<string>
toggleLineItemSelection, selectAllLineItems, clearLineItemSelection

// Tabs
activeTab: TabType
setActiveTab

// Column visibility
visibleColumns: Set<ColumnKey>
setVisibleColumns
showColumnsMenu, setShowColumnsMenu

// View mode (Simple vs Overage)
viewMode: 'simple' | 'overage'
setViewMode

// Rep splits
outsideRepSplits, insideRepSplits
showOutsideRepSplitsModal, showInsideRepSplitsModal

// Computed values
isConnectedToOrder: boolean
lineItemCredits: Record<string, LineItemCredit>
totals: { subtotal, freight, total, commission, amountPaid, balance, totalOvg, totalEarn }
```

---

## 6. List View Features

### Table Columns
1. Checkbox (selection)
2. Invoice Number
3. Status (badge)
4. Order Number (link)
5. Factory Name
6. Invoice Date
7. Due Date
8. Total (currency)
9. Commission (currency)
10. Published (icon)

### Quick Date Filter
- Presets: All, Today, This Week, Last Week
- Fields: Entry Date (createdAt) or Invoice Date (entityDate)
- Automatically builds date range filters for API

### Bulk Actions
- Select individual invoices via checkbox
- Select all on current page
- Select all across all pages (fetches all IDs)
- Bulk delete with confirmation modal

### Infinite Scroll Pagination
- 50 items per page
- Loads more when within 200px of bottom
- Deduplication by ID to prevent duplicates

### Search
- Minimum 2 characters
- Searches invoice number, order number
- Switches to search results (bypasses pagination)

---

## 7. Detail View Features

### Header Top Bar
- **Version dropdown**: View historical versions (placeholder)
- **View Mode dropdown**: Simple vs Overage calculation display
- **Status dropdown**: Change invoice status
- **Save dropdown**: Save options
- **Actions dropdown**: Additional actions

### Invoice Details Fields
Organized in header section, shows:
- Order selection (create mode) - searchable dropdown
- Copy from existing invoice option
- Sold To Customer (from order, read-only when populated)
- Bill To Customer (from order, read-only when populated)
- End User (from order or line item, depending on `endUserPerLineItem` flag)
- Outside Rep (with split modal)
- Inside Rep (with split modal)
- Invoice Date
- Due Date (auto-calculated from payment terms)
- PO Number
- Job reference
- Payment/Freight/Shipping Terms

### Pricing Summary Bar
Displays:
- Subtotal
- Commission
- Balance (Total - Paid)
- Total Overage (overage view)
- Total Earn (overage view)

### Tabs
| Tab | Status | Description |
|-----|--------|-------------|
| Line Items | Active | Invoice line items table |
| Files | Active | Attached files |
| Credits | Active | Credit memos linked |
| Notes | Active | Notes linked to invoice |
| Tasks | Active | Tasks linked to invoice |
| Activity | Coming Soon | Activity log |
| Linked Objects | Active | All linked entities |
| Settings | Active | Invoice-specific settings |

**Note**: Most tabs are disabled in create mode until invoice is saved.

---

## 8. Line Items Management

### Line Items Table Columns
```typescript
type ColumnKey =
  | 'partNumber'
  | 'custPartNumber'
  | 'description'
  | 'uom'
  | 'divisor'
  | 'unitPrice'
  | 'quantity'
  | 'linkedOrder'
  | 'linkedCheck'
  | 'sellTotal'
  | 'commissionPercent'
  | 'commission'
  | 'commissionTotal'
  | 'percentOver'
  | 'commissionAmount'
  | 'ovgPercent'
  | 'ovgAmount'
  | 'earnPercent'
  | 'earnAmount';
```

### Default Visible Columns
Stored in constants, can be customized via Settings tab.

### Column Configuration
Saved per-user via Settings context. Applied on component mount.

### Line Item Operations
- **Add**: Creates new line item with next line number
- **Edit**: Inline editing in table cells
- **Delete**: Remove line item (confirmation for saved invoices)
- **Additional Details**: Modal for extended fields (note, lead time, end user, splits)

### Calculation Logic
```typescript
// Extended price
amount = quantity * unitPrice / divisor

// Commission amount
commissionAmount = amount * (commissionRate / 100)

// Totals calculated from line items
totals = calculateInvoiceTotals(invoice)
```

### Bulk Line Item Selection
- Checkbox per row
- Select all toggle in header
- Bulk actions bar appears when items selected

---

## 9. Commission & Split Rates

### Split Rate Structure
Split rates can be set at:
1. **Header level**: When NOT per-line-item (all line items share same splits)
2. **Line item level**: When per-line-item flag is true

### Outside Rep Splits Modal
- Add multiple outside reps
- Set split percentage per rep
- Total must equal 100%
- Position determines order

### Inside Rep Splits Modal
- Same structure as outside splits
- Separate modal for inside reps

### Per-Line-Item Flags
From linked order:
- `outsidePerLineItem`: Outside rep set per line item
- `insidePerLineItem`: Inside rep set per line item
- `endUserPerLineItem`: End user set per line item

When true, header fields are hidden and values come from line items.
When false, header shows the values (grabbed from first line item).

---

## 10. Modals & Actions

### CreateInvoiceModal
- Create new invoice manually
- Option to populate from existing order
- Required: Invoice date
- Optional: Order selection, factory, line items

### RecordPaymentModal
- Record payment against invoice
- Updates amountPaid and balance
- Changes status to partial_paid or paid

### InsideRepSplitsModal / OutsideRepSplitsModal
- Manage rep commission splits
- Add/remove reps
- Set percentages (must total 100%)

### AdditionalDetailsModal
- Extended line item fields
- Note, Lead Time, Status
- End User selection
- Per-line-item rep splits (when enabled)

### DeleteConfirmModal
- Confirmation before delete
- Shows invoice number
- Warning about irreversible action

### WarehouseConversionModal
- Convert products to warehouse items
- Options: All products or Selected only
- Shows which products are already warehouse items

---

## 11. Filtering & Sorting

### Available Filters
| ID | Label | Type | Column Name |
|----|-------|------|-------------|
| invoice-number | Invoice Number | text | invoiceNumber |
| status | Status | dropdown | status |
| invoice-date | Invoice Date | date | entityDate |
| due-date | Due Date | date | dueDate |
| total | Total | number (currency) | total |
| commission | Commission | number (currency) | commission |
| created-date | Entry Date | date | createdAt |
| order-number | Order Number | text | orderNumber |
| published | Published | boolean | published |
| factory-name | Factory Name | text | factoryName (soon) |

### Sort Options
- Invoice Number
- Status
- Invoice Date (entityDate)
- Due Date
- Total
- Commission
- Order Number
- Published

### Filter Synchronization
Two filter systems kept in sync:
1. **AdvancedFilters**: Modal-based filters
2. **ColumnFilters**: Inline per-column filters

Uses `useFilterSync` hook with refs to prevent infinite loops.

---

## 12. Entity Relationships

```
Invoice
├── Order (via orderId) - source order
│   ├── Customer (Sold To, Bill To, End User)
│   ├── Job
│   └── Terms (Payment, Freight, Shipping)
├── Factory/Manufacturer (via factoryId)
├── Line Items (InvoiceDetail[])
│   ├── Product
│   ├── UOM
│   ├── End User (per line item when flag set)
│   └── Split Rates (Outside/Inside per line item)
├── Split Rates (header level)
├── Credits (linked)
├── Checks (linked - for commission tracking)
├── Notes (linked)
├── Tasks (linked)
├── Files (attached)
└── Created By (User)
```

---

## 13. Order Population

### Creating Invoice from Order
1. User selects order via searchable dropdown
2. `handleOrderSelect` called with orderId
3. `useOrder` hook fetches full order data
4. `useEffect` populates invoice fields from order:
   - Order reference (orderId, orderNumber)
   - Factory/Manufacturer
   - Customers (Sold To, Bill To, End User)
   - Reps (Outside, Inside) - if not per-line-item
   - Terms (Payment, Freight, Shipping)
   - Dates
   - Line items (transformed to InvoiceLineItem format)
   - Totals

### Order Data Nesting
For **existing invoices**, order data is nested in the invoice query response:
- `invoice.order.soldToCustomer`
- `invoice.order.billToCustomer`
- `invoice.factory`

No separate API calls needed for existing invoices.

### Read-Only Fields
When `isPopulatedFromOrder` is true:
- Customer fields are read-only
- Terms fields are read-only
- Rep fields are read-only (when not per-line-item)

---

## 14. Edge Cases & Special Features

### Due Date Auto-Calculation
When invoice date changes:
1. Check factory `paymentTerms` (days)
2. Fall back to user settings `dueDateOffset`
3. Calculate: `dueDate = invoiceDate + days`

Only recalculates on user edit, not initial load.

### Status Mapping
API status strings mapped to RMS types:
```typescript
'open' -> 'open'
'paid' -> 'paid'
'partial_paid' | 'partial' -> 'partial_paid'
'void' -> 'void'
'dormant' -> 'dormant'
default -> 'open'
```

### Published Flag
- Indicates invoice has been published/sent
- Displayed as icon in list view
- Filterable

### Locked Invoices
- `isLocked` flag prevents editing
- Visual indicator in UI

### Warehouse Consignment
- Line items can be marked as warehouse consignment
- Shows inventory on hand
- Warehouse conversion modal for bulk conversion

### Version History
- Placeholder for version tracking
- `availableVersions` state ready for implementation

### Settings Integration
- Column visibility saved per-user
- Due date offset preference
- Applied on component mount via `useInvoiceSettings`

### Unsaved Changes Guard
- `hasChanges` tracks local edits
- Warns before navigation
- Save handler available for guard integration

### Hydration Safety
Component uses `useEffect` for client-side initialization to prevent hydration mismatches.

### URL Navigation
- `/invoices` - List view
- `/invoices/new` - Create new invoice
- `/invoices/new?orderId={id}` - Create from specific order
- `/invoices/{id}` - Detail view
