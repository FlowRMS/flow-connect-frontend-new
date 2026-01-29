# Commissions Module - Technical Documentation

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Check Entity & Data Types](#2-check-entity--data-types)
3. [API Endpoints & GraphQL Operations](#3-api-endpoints--graphql-operations)
4. [UI Components Architecture](#4-ui-components-architecture)
5. [State Management](#5-state-management)
6. [List View Features](#6-list-view-features)
7. [Detail View Features](#7-detail-view-features)
8. [Line Items Management](#8-line-items-management)
9. [Adjustments & Deductions](#9-adjustments--deductions)
10. [Check Status Workflow](#10-check-status-workflow)
11. [Modals & Actions](#11-modals--actions)
12. [Filtering & Sorting](#12-filtering--sorting)
13. [Entity Relationships](#13-entity-relationships)
14. [Edge Cases & Special Features](#14-edge-cases--special-features)

---

## 1. Module Overview

**Location**: `/components/commissions/`

**Purpose**: Commission check management system for tracking manufacturer commission payments. Handles commission checks that contain invoices, credits, and adjustments tied to a specific manufacturer and commission period.

**Note**: The "Commissions" module manages **Checks** (commission payments from manufacturers). The terms are used interchangeably in the codebase.

**Technologies**: Next.js 15+, React, TypeScript, TanStack React Query, Tailwind CSS

### File Structure
```
components/commissions/
├── list/
│   ├── CommissionsListContent.tsx         # Main list container
│   ├── constants.ts                       # List constants
│   ├── types.ts                           # List-specific types
│   ├── utils.ts                           # List utilities
│   ├── config/
│   │   ├── columnConfig.ts                # Column definitions
│   │   └── filterConfig.ts                # Filter/sort options
│   ├── hooks/
│   │   ├── useCommissionsListState.ts     # Main state hook
│   │   ├── useCommissionFilters.ts        # Filter logic
│   │   ├── useCommissionBulkActions.ts    # Bulk operations
│   │   └── useCommissionSelection.ts      # Selection state
│   └── components/
│       ├── table/
│       │   ├── CommissionsTable.tsx
│       │   ├── CommissionsTableHeader.tsx
│       │   ├── CommissionRow.tsx
│       │   ├── BulkActionsBar.tsx
│       │   ├── ColumnFilterDropdown.tsx
│       │   ├── CommissionsEmptyState.tsx
│       │   └── CommissionsTableSkeleton.tsx
│       ├── sidebar/
│       │   ├── CheckDetailPanel.tsx
│       │   ├── CheckDetailsSection.tsx
│       │   ├── CheckLineItemsSection.tsx
│       │   ├── CheckStatusSection.tsx
│       │   └── CheckTotalsSection.tsx
│       └── QuickDateFilter.tsx
├── detail/
│   ├── CheckDetailContent.tsx             # Main detail container
│   ├── constants.ts                       # Detail constants
│   ├── types.ts                           # Detail-specific types
│   ├── utils.ts                           # Detail utilities
│   ├── config/
│   │   ├── columnConfig.ts                # Line items columns
│   │   ├── tabsConfig.ts                  # Tab definitions
│   │   └── viewsConfig.ts                 # Saved views
│   ├── hooks/
│   │   ├── useCheckDetailState.ts         # Main detail state
│   │   └── useCheckLineItemsTable.ts      # Line items table
│   └── components/
│       ├── header/
│       │   ├── HeaderTopBar.tsx
│       │   ├── CheckDetailsFields.tsx
│       │   └── PricingSummaryBar.tsx
│       ├── line-items/
│       │   ├── LineItemsTable.tsx
│       │   ├── LineItemsTableHeader.tsx
│       │   ├── LineItemsTableRow.tsx
│       │   └── useLineItemsTabNavigation.ts
│       ├── tabs/
│       │   ├── ActivityTab.tsx
│       │   ├── LinkedObjectsTab.tsx
│       │   ├── NotesTab.tsx
│       │   ├── SettingsTab.tsx
│       │   └── TasksTab.tsx
│       └── modals/
│           ├── AddLineItemModal.tsx
│           ├── ColumnsModal.tsx
│           ├── LineItemDetailModal.tsx
│           ├── OrderDetailModal.tsx
│           ├── PostedStatementModal.tsx
│           └── RepSplitsModal.tsx
```

---

## 2. Check Entity & Data Types

### Check Status
```typescript
type CheckStatus = 'OPEN' | 'POSTED' | 'VOID';

// UI representation
type CheckStatusUI = 'posted' | 'unposted';
```

### CommissionCheck (UI Type)
```typescript
interface CommissionCheck {
  id: string;
  checkNumber: string;
  salesRepId: string;
  salesRepName: string;
  manufacturerId: string;
  manufacturerName: string;
  commissionMonth: string;                 // YYYY-MM format
  status: 'OPEN' | 'POSTED' | 'VOID';
  postDate: string;
  checkDate: string;
  entryDate: string;
  createdDate: string;
  createdAt?: string;
  createdBy: string;
  details: CheckDetail[];
  invoicePayments: number;
  expenseAdjustments: number;
  creditDeductions: number;
  netAmount: number;
  checkBalance: number;
}
```

### CheckLandingPage (List View)
```typescript
interface CheckLandingPage {
  id: string;
  checkNumber: string;
  factoryName?: string;
  commissionMonth?: string;
  status?: string;
  postDate?: string;
  checkDate?: string;
  createdAt?: string;
  createdBy?: string;
  enteredCommissionAmount?: string;
}
```

### LineItem (Detail View)
```typescript
interface LineItem {
  id: string;
  type: 'invoice' | 'credit' | 'adjustment';
  number: string;                          // Invoice/credit/adjustment number
  orderId: string;                         // Order UUID (empty for adjustments)
  orderNumber?: string;                    // Human-readable order number
  customer: string;
  salesRep: string;                        // Primary sales rep name
  salesRepsCount?: number;                 // Total number of sales reps
  salesRepsList?: string[];                // List of all rep names for tooltip
  commissionRateExpected: number;
  commissionRateActual: number;
  expectedCommission: number;
  paidCommission: number;
  balance: number;
  paid: boolean;
  // IDs for API operations
  invoiceId?: string;
  creditId?: string;
  adjustmentId?: string;
  // Additional data
  entityDate?: string;
  dueDate?: string;
  status?: string;
  createdAt?: string;
  url?: string;
  // For credits
  creditType?: string;
  reason?: string;
  // For adjustments
  amount?: number;
  factoryId?: string;
  factoryName?: string;
  customerName?: string;
  locked?: boolean;
  // For tracking new items from "Invoices after" search
  isNew?: boolean;                         // True for items not yet saved
}
```

### Adjustment
```typescript
interface Adjustment {
  id: string;
  factory: string;                         // Read-only, from the check
  amount: number;                          // Always negative for deductions
  reason: string;
  source: 'manual' | 'upload';
  uploadId?: string;
  uploadName?: string;
  createdAt: Date;
  allocationMethod: AllocationMethod;
  allocationTarget: string;                // Customer name for 'customer' method
  repSplits: RepSplit[];                   // For 'rep-split' method
  adjustmentId?: string;                   // API reference
}

type AllocationMethod = 'rep-split' | 'customer' | 'even-distribution';
```

### RepSplit
```typescript
interface RepSplit {
  repName: string;
  percentage: number;
}
```

---

## 3. API Endpoints & GraphQL Operations

### Queries

#### Fetch Checks with Pagination
```typescript
useChecksInfinite(
  filters: CheckLandingPageFilter[],
  pageSize: number,
  orderBy: CheckLandingPageOrderBy[]
): InfiniteQueryResult<PaginatedChecksResult>
```

#### Fetch Single Check
```typescript
useCheck(checkId: string | null): QueryResult<Check>
fetchCheckById(id: string): Promise<Check>
```

#### Fetch All Check IDs (for bulk selection)
```typescript
fetchAllCheckIds(filters?: CheckLandingPageFilter[]): Promise<string[]>
```

### Mutations

#### Create Check
```typescript
interface CreateCheckInput {
  checkNumber?: string;
  entityDate: string;                      // Check date
  postDate?: string;
  commissionMonth?: string;                // YYYY-MM-01 format
  enteredCommissionAmount: string;
  factoryId: string;                       // Required
  creationType: 'MANUAL' | 'FROM_UPLOAD';
  details: CheckDetailInput[];
}

interface CheckDetailInput {
  id?: string;                             // For updates
  invoiceId?: string;
  creditId?: string;
  adjustmentId?: string;
  appliedAmount: string;
}
```

#### Update Check
```typescript
interface UpdateCheckInput extends CreateCheckInput {
  id: string;
}
```

#### Delete Check
```typescript
deleteCheck(id: string): Promise<boolean>
```

**Note**: Cannot delete a posted check.

#### Post Check
```typescript
postCheck(id: string): Promise<Check>
```
Changes status from OPEN to POSTED.

#### Unpost Check
```typescript
unpostCheck(id: string): Promise<Check>
```
Changes status from POSTED back to OPEN to allow editing.

### Filter/Sort Types
```typescript
interface CheckLandingPageFilter {
  columnName: string;
  operator: 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'ILIKE' | 'IN';
  value?: string;
  values?: string[];
}

interface CheckLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}
```

---

## 4. UI Components Architecture

### Component Hierarchy
```
CommissionsListContent.tsx
├── Header (search, filters, sort, create button)
├── QuickDateFilter.tsx
├── BulkActionsBar.tsx (when items selected)
├── CommissionsTable.tsx
│   ├── CommissionsTableHeader.tsx
│   │   └── ColumnFilterDropdown.tsx (per column)
│   └── CommissionRow.tsx (per check)
├── CommissionsTableSkeleton.tsx (loading)
├── CommissionsEmptyState.tsx (no data)
├── CheckDetailPanel.tsx (sidebar when selected)
│   ├── CheckStatusSection.tsx
│   ├── CheckDetailsSection.tsx
│   ├── CheckTotalsSection.tsx
│   └── CheckLineItemsSection.tsx
└── Modals

CheckDetailContent.tsx
├── HeaderTopBar.tsx
│   ├── Version dropdown
│   ├── Status dropdown
│   └── Actions dropdown (Post, Unpost, Delete)
├── CheckDetailsFields.tsx
│   ├── Factory select (required)
│   ├── Commission Month picker
│   ├── Check Number
│   ├── Commission Amount
│   ├── Check Date
│   └── Posted Date (when posted)
├── PricingSummaryBar.tsx
├── Lines to Reconcile section
│   ├── Check Numbers dropdown
│   ├── Unpaid Invoices After date filter
│   └── Orders Without Invoices filter
├── Tabs
│   ├── Line Items (default)
│   ├── Files
│   ├── Deductions
│   ├── Notes
│   ├── Tasks
│   ├── Activity (coming soon)
│   ├── Linked Objects
│   └── Settings
├── LineItemsTable.tsx
│   ├── LineItemsTableHeader.tsx
│   └── LineItemsTableRow.tsx
└── Modals
    ├── AddLineItemModal.tsx
    ├── LineItemDetailModal.tsx
    ├── OrderDetailModal.tsx
    ├── ColumnsModal.tsx
    ├── PostedStatementModal.tsx
    └── RepSplitsModal.tsx
```

---

## 5. State Management

### useCommissionsListState Hook
Main state management for list view:

```typescript
// Checks data
checks: CommissionCheck[]
isLoadingChecks: boolean
checksError: Error | null
refetchChecks: () => void
totalCount: number

// Infinite scroll
handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
fetchNextPage, hasNextPage, isFetchingNextPage

// Selected check for sidebar
selectedCheck: CommissionCheck | null
setSelectedCheck

// Quick date filters
quickDatePreset: 'all' | 'today' | 'this_week' | 'last_week'
quickDateField: 'entryDate' | 'commissionMonth'
setQuickDatePreset, setQuickDateField

// Server-side filters
serverFilters: CheckLandingPageFilter[]
activeFilters: ActiveFilter[]
columnFilters: Record<string, ActiveFilter[]>
handleServerFiltersChange, handleColumnFiltersChange

// Sorting (supports multi-sort)
serverOrderBy: CheckLandingPageOrderBy[]
handleSort, handleSortChange, handleMultiSortChange

// Bulk selection with select-all-across-pages
selectedCheckIds: Set<string>
isItemSelected, isAllSelected, isPartiallySelected
handleSelectAll, handleSelectOne, selectAllMode
getAllSelectedIds: () => Promise<string[]>

// Bulk actions
bulkSetStatus: (status: CheckStatus) => Promise<void>
bulkDelete: () => Promise<void>
isBulkUpdating: boolean

// CRUD modals
showCheckModal, openCreateCheckModal, openEditCheckModal, closeCheckModal
showDeleteConfirmModal, openDeleteConfirmModal, closeDeleteConfirmModal
handleSaveCheck, handleConfirmDelete

// Sidebar panel actions
handlePostCheck: (checkId: string) => Promise<void>
handleUnpostCheck: (checkId: string) => Promise<void>
isUpdatingCheck: boolean
```

### useCheckDetailState Hook
Main state management for detail view:

```typescript
// Check data
check: CommissionCheck | undefined
isCreateMode: boolean
isLoading, isLoadingCheck, checkError

// Unsaved changes
hasChanges: boolean
resetChanges: () => void

// Save/Delete/Post/Unpost
handleSave: () => Promise<void>
handleSaveAndClose: () => Promise<void>
handleDelete: () => Promise<void>
handlePost: () => Promise<void>
handleUnpost: () => Promise<void>
isSaving, isDeleting, isPosting, isUnposting
isOriginallyPosted: boolean               // Disables Save button for posted checks

// Form fields (with change tracking)
factory, setFactory
factoryId, setFactoryId
commissionMonth, setCommissionMonth
checkNumber, setCheckNumber
commissionAmount, setCommissionAmount
checkDate, setCheckDate
status, setStatus
postedDate, setPostedDate

// Line items
lineItems: LineItem[]
setLineItems
addNewLine, deleteLineItem, togglePaid
updateLineItemAmount: (id: string, amount: number) => void
handleOpenInvoicesLoaded: (invoices: OpenInvoiceSearchResult[]) => void

// Line item selection
selectedLineItems: Set<string>
toggleLineItemSelection, selectAllLineItems, clearLineItemSelection

// Adjustments/Deductions
adjustments: Adjustment[]
deductionAdjustments: AdjustmentLandingPage[]
addAdjustment, deleteAdjustment, updateAdjustment

// Rep splits modal
showRepSplitsModal, openRepSplitsModal
tempRepSplits, addRepToSplit, removeRepFromSplit, updateRepSplit, saveRepSplits
totalSplitPercentage, availableReps

// Tabs
activeTab: TabType
setActiveTab

// Computed values
summary: { totalExpected, totalPaid, totalBalance }
totalAdjustments: number

// Lines to Reconcile
unpaidInvoicesAfterDate, setUnpaidInvoicesAfterDate
includeAllUnpaid, setIncludeAllUnpaid
```

---

## 6. List View Features

### Table Columns
1. Checkbox (selection)
2. Check Number
3. Status (OPEN/POSTED badge)
4. Factory Name
5. Commission Month
6. Check Date
7. Post Date
8. Commission Amount (currency)
9. Entry Date

### Quick Date Filter
- Presets: All, Today, This Week, Last Week
- Fields: Entry Date (createdAt) or Commission Month
- Commission Month format: YYYY-MM

### Bulk Actions
- Select individual checks via checkbox
- Select all on current page
- Select all across all pages
- Bulk Set Status: Post/Unpost multiple checks
- Bulk Delete (only unposted checks)

### Infinite Scroll Pagination
- 50 items per page
- Loads more when within 200px of bottom
- Deduplication by ID

### Sidebar Detail Panel
When a check is selected:
- Status badge with Post/Unpost actions
- Check details (factory, commission month, dates)
- Commission totals
- Line items summary
- Quick actions (Edit, Delete)

---

## 7. Detail View Features

### Header Top Bar
- **Version dropdown**: View historical versions (placeholder)
- **Status dropdown**: View current status
- **Actions dropdown**: Post, Unpost, Delete

### Check Details Fields
| Field | Type | Description |
|-------|------|-------------|
| Factory | Select (required) | Manufacturer/factory |
| Commission Month | Month picker | YYYY-MM format |
| Check Number | Text | Check identifier |
| Commission Amount | Currency | Total commission entered |
| Check Date | Date | Date on the check |
| Posted Date | Date (read-only when posted) | When check was posted |

### Pricing Summary Bar
Displays:
- Invoice Payments Total
- Credit Deductions Total
- Expense Adjustments Total
- Net Amount (calculated)
- Check Balance

### Lines to Reconcile Section
Powerful reconciliation tools:
- **Check Numbers Dropdown**: Select multiple checks to reconcile
- **Unpaid Invoices After**: Date filter to find invoices to add
- **Include All Unpaid**: Toggle to include all unpaid invoices
- **Orders Without Invoices After**: Find orders missing invoices

### Tabs
| Tab | Status | Description |
|-----|--------|-------------|
| Line Items | Active | Invoices, credits, adjustments |
| Files | Active | Attached files |
| Deductions | Active | Adjustments/deductions table |
| Notes | Active | Notes linked to check |
| Tasks | Active | Tasks linked to check |
| Activity | Coming Soon | Activity log |
| Linked Objects | Active | All linked entities |
| Settings | Active | Commission source settings |

---

## 8. Line Items Management

### Line Item Types
1. **Invoice**: Commission from paid invoices
2. **Credit**: Deductions from credits
3. **Adjustment**: Manual adjustments/deductions

### Line Items Table Columns
```typescript
type ColumnKey =
  | 'number'          // Invoice/credit/adjustment number
  | 'orderNumber'     // Linked order
  | 'customer'        // Customer name
  | 'salesRep'        // Sales rep name
  | 'commissionRate'  // Commission %
  | 'expectedCommission'
  | 'paidCommission'
  | 'balance'
  | 'paid';           // Checkbox
```

### Adding Line Items
1. **Add Line Item Modal**: Search and add invoices/credits
2. **Invoices After Date**: Bulk load unpaid invoices after a date
3. Items marked `isNew: true` until saved

### Line Item Operations
- **View Details**: Open LineItemDetailModal
- **Edit Amount**: Update paidCommission
- **Toggle Paid**: Mark as paid/unpaid
- **Delete**: Remove from check
- **View Order**: Open OrderDetailModal for linked order

### Calculations
```typescript
// Summary calculation
summary = {
  totalExpected: sum of expectedCommission for invoices/credits,
  totalPaid: sum of paidCommission,
  totalBalance: totalExpected - totalPaid
}

// Adjustments total (from deductions tab)
totalAdjustments = sum of deductionAdjustments amounts
```

---

## 9. Adjustments & Deductions

### Adjustment Structure
Adjustments represent commission deductions or additions:
- Always stored with `amount` value
- Negative amounts for deductions
- Can be allocated by rep-split, customer, or even-distribution

### Deductions Tab
Displays adjustments in `AdjustmentLandingPage` format:
- Adjustment Number
- Amount
- Reason
- Entity Date
- Status (PENDING/POSTED/VOID)
- Locked indicator

### Rep Splits Modal
For rep-split allocation method:
- Add/remove reps from split
- Set percentage per rep
- Total must equal 100%
- Save updates the adjustment

---

## 10. Check Status Workflow

### Status States
```
OPEN (unposted)
  ↓ [Post action]
POSTED
  ↓ [Unpost action]
OPEN (can edit again)
```

### Rules
| Action | Allowed When | Effect |
|--------|--------------|--------|
| Edit | OPEN only | Can modify all fields |
| Save | OPEN only | Saves changes |
| Post | OPEN, after save | Changes status to POSTED |
| Unpost | POSTED | Changes status back to OPEN |
| Delete | OPEN only | Removes check |

### Posted Check Restrictions
When a check is POSTED:
- Cannot save changes (button disabled)
- Cannot delete
- Must unpost first to make changes
- Shows "Posted" badge and date

### Error Messages
- "Cannot modify a posted check."
- "Cannot delete a posted check."

---

## 11. Modals & Actions

### AddLineItemModal
- Search for invoices/credits to add
- Shows unlinked items (not already on check)
- Bulk add capability

### LineItemDetailModal
- View/edit line item details
- Update paid commission amount
- View linked invoice/credit data
- Delete line item option

### OrderDetailModal
- View order details for linked order
- Read-only display

### ColumnsModal
- Toggle column visibility
- Drag to reorder columns

### PostedStatementModal
- View/download posted statement
- Commission statement report

### RepSplitsModal
- Manage rep split allocation
- Add/remove/edit rep percentages
- Validation: total must equal 100%

---

## 12. Filtering & Sorting

### Available Filters
| ID | Label | Type | Column Name |
|----|-------|------|-------------|
| check-number | Check Number | text | checkNumber |
| status | Status | dropdown | status |
| commission-month | Commission Month | month | commissionMonth |
| post-date | Post Date | date | postDate |
| check-date | Check Date | date | checkDate |
| entry-date | Entry Date | date | createdAt |
| net-amount | Commission | number (currency) | enteredCommissionAmount |
| factory-name | Factory Name | text | factoryName (soon) |

### Sort Options
- Check Number
- Status
- Commission Month
- Post Date
- Check Date
- Entry Date (createdAt)
- Commission (enteredCommissionAmount)

### Multi-Sort Support
Can apply multiple sorts via `handleMultiSortChange`.

### Filter Synchronization
AdvancedFilters and ColumnFilters are kept in sync using refs to prevent infinite loops.

---

## 13. Entity Relationships

```
Check (CommissionCheck)
├── Factory/Manufacturer (via factoryId)
├── Details (CheckDetail[])
│   ├── Invoice (via invoiceId)
│   │   ├── Order
│   │   ├── Customer (soldToCustomer)
│   │   └── Sales Reps
│   ├── Credit (via creditId)
│   │   └── Order
│   └── Adjustment (via adjustmentId)
│       ├── Factory
│       └── Customer
├── Notes (linked)
├── Tasks (linked)
├── Files (attached)
└── Created By (User)
```

---

## 14. Edge Cases & Special Features

### Commission Month Format
- UI displays: YYYY-MM (e.g., "2025-01")
- API requires: YYYY-MM-01 (full date format)
- Conversion handled automatically on save

### Posted Check Editing
To edit a posted check:
1. Click Unpost in Actions dropdown
2. Make changes
3. Save
4. Post again

### Bulk Operations Error Handling
```typescript
// Bulk operations track success/error counts
let successCount = 0;
let errorCount = 0;

// Shows toast with results:
// "X check(s) updated successfully"
// "Failed to update Y check(s)"
```

### Line Item Deduplication
When adding invoices via "Invoices After":
- Checks existing invoiceIds
- Only adds items not already in list
- New items prepended to list

### Change Tracking
- `hasLocalEdits` tracks changes in edit mode
- Changes are NOT tracked in create mode
- Used for unsaved changes warning

### Lines to Reconcile
Powerful feature for commission reconciliation:
1. Select one or more check numbers to combine
2. Set date filter for unpaid invoices
3. Click to load matching invoices
4. Review and adjust amounts
5. Save to create check details

### URL Navigation
- `/commissions` - List view
- `/commissions/new` - Create new check
- `/commissions/{id}` - Detail view
