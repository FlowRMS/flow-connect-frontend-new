# Quotes Module - Technical Documentation (V1 & V2)

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Quote Entity Structure](#2-quote-entity-structure)
3. [Line Items (Quote Details)](#3-line-items-quote-details)
4. [Quote Balance & Totals](#4-quote-balance--totals)
5. [API Endpoints & GraphQL Operations](#5-api-endpoints--graphql-operations)
6. [Search & Lookup APIs](#6-search--lookup-apis)
7. [React Query Hooks](#7-react-query-hooks)
8. [User Interface Features](#8-user-interface-features)
9. [Modals & Dialogs](#9-modals--dialogs)
10. [Quote Configuration Settings](#10-quote-configuration-settings)
11. [Quote-to-Order Conversion](#11-quote-to-order-conversion)
12. [Special Features & Behaviors](#12-special-features--behaviors)
13. [V1 vs V2 Differences](#13-v1-vs-v2-differences)

---

## 1. Module Overview

FlowCRM has **two quote implementations**:
- **V1 (Legacy)**: Located in `components/quotes/api/` - GraphQL-based, full-featured backend
- **V2 (Current)**: Located in `components/quotes-v2/` - Enhanced UI, reuses V1 API layer

**Note**: `/quotes` route redirects to `/quotes-v2`. V1 is maintained for API compatibility.

### File Structure
```
components/quotes/api/
├── quotesApi.ts (1644 lines)            # All types, queries, mutations
├── useQuotesApi.ts (349 lines)          # React Query hooks
└── index.ts

components/quotes-v2/
├── QuotesV2Content.tsx (818 lines)      # Main listing page
├── QuoteDetailV2Page.tsx (600+ lines)   # Detail page
├── components/
│   └── QuoteDetailHeaderV2.tsx          # Header
├── tabs/
│   └── LineItemsTabV2.tsx (77KB)        # Line items table
├── views/
│   ├── ListViewV2.tsx
│   └── KanbanViewV2.tsx
├── modals/
│   ├── CreateOrderFromQuoteModal.tsx
│   ├── AdditionalDetailsModalV2.tsx
│   ├── DuplicateQuoteModal.tsx
│   └── DeleteConfirmModal.tsx
├── config/
│   ├── filterConfig.ts
│   └── sortConfig.ts
├── types/index.ts
└── data/mockData.ts
```

---

## 2. Quote Entity Structure

### Core Quote Fields
```typescript
interface Quote {
  // Identification
  id: string;
  quoteNumber: string;                     // Required, unique

  // Customer Information
  soldToCustomerId: string;                // Required
  soldToCustomer: QuoteCustomer;
  billToCustomerId?: string;
  billToCustomer?: QuoteCustomer;

  // Job Association
  job?: QuoteJob;

  // Dates
  entityDate?: string;                     // Quote creation date (YYYY-MM-DD)
  expDate?: string;                        // Expiration date
  reviseDate?: string;
  acceptDate?: string;                     // When ORDERED
  createdAt?: string;

  // Status & Workflow
  status?: QuoteStatus;                    // 'OPEN' | 'ORDERED' | 'EXPIRED' | 'LOST'
  pipelineStage?: QuotePipelineStage;
  published?: boolean;

  // Line Items & Details
  details?: QuoteDetail[];
  balance?: QuoteBalance;
  balanceId?: string;

  // Per-Line-Item Settings
  endUserPerLineItem?: boolean;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
  factoryPerLineItem?: boolean;

  // Terms
  paymentTerms?: string;
  freightTerms?: string;
  customerRef?: string;

  // Other
  blanket?: boolean;                       // Blanket PO flag
  creationType?: 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';
  createdBy?: QuoteCreatedBy;
  duplicatedFrom?: string;
  versionOf?: string;
}
```

### Quote Status & Pipeline
```typescript
type QuoteStatus = 'OPEN' | 'ORDERED' | 'EXPIRED' | 'LOST';

type QuotePipelineStage =
  | 'DISCOVERY'      // Initial inquiry
  | 'PROSPECT'       // Prospect identified
  | 'QUALIFICATION'  // Needs qualified
  | 'PROPOSAL'       // Quote sent
  | 'NEGOTIATION'    // In negotiation
  | 'CLOSED_WON'     // Deal won
  | 'CLOSED_LOST';   // Deal lost

// V2 UI Mapping
type QuoteV2Stage = 'Draft' | 'Review' | 'Sent' | 'Negotiating' | 'Won' | 'Lost' | 'Dormant';
// DISCOVERY/PROSPECT → Draft
// QUALIFICATION → Review
// PROPOSAL → Sent
// NEGOTIATION → Negotiating
// CLOSED_WON + ORDERED → Won
// CLOSED_LOST + LOST → Lost
// Any + EXPIRED → Dormant
```

---

## 3. Line Items (Quote Details)

### Quote Detail Entity
```typescript
interface QuoteDetail {
  id: string;
  quoteId?: string;
  itemNumber?: number;

  // Product Information
  productId?: string;
  product?: QuoteProduct;
  productNameAdhoc?: string;               // Overrides product.name
  productDescriptionAdhoc?: string;

  // Manufacturer
  factoryId?: string;
  factory?: QuoteDetailFactory;

  // Quantity & UOM
  quantity?: number;
  uom?: QuoteUom;

  // Pricing
  unitPrice?: string;                      // Stored as string
  subtotal?: number;                       // quantity × unitPrice
  total?: number;                          // After discounts

  // Discounts
  discountRate?: string;
  discount?: number;

  // Commission
  commissionRate?: string;
  commissionDiscount?: number;
  commissionDiscountRate?: string;
  totalLineCommission?: number;

  // Customer
  endUserId?: string;
  endUser?: QuoteCustomer;

  // Configuration
  divisionFactor?: string;
  leadTime?: string;
  note?: string;

  // Status
  status?: 'OPEN' | 'ORDERED' | 'LOST';

  // Commission Splits
  insideSplitRates?: QuoteSplitRate[];
  outsideSplitRates?: QuoteSplitRate[];
}

interface QuoteSplitRate {
  id: string;
  userId?: string;
  splitRate?: string;                      // Percent (e.g., "50")
  position?: number;
}
```

### V2 Line Item UI Model
```typescript
interface LineItemV2 {
  id: string;
  quoteId: string;
  itemNumber?: number;
  partNumber: string;
  customerPartNumber?: string;
  description: string;
  manufacturerId?: string;
  manufacturerName: string;
  quantity: number;
  uom: string | null;
  uomId?: string | null;
  divisor: number;
  unitPrice: number;
  sellTotal: number;
  total: number;
  commissionPercent: number;
  commission: number;
  commissionTotal: number;
  discountRate?: string;
  discount?: number;
  commissionDiscountPercent: number;
  commissionDiscountAmount: number;
  lineDiscountPercent: number;
  lineDiscountAmount: number;
  endUserId?: string;
  endUserName?: string;
  leadTime?: string;
  note?: string;
  status?: 'OPEN' | 'ORDERED' | 'LOST';
  isManualPrice?: boolean;
  pricingSource?: 'product' | 'cpn' | 'manual' | 'tier:X-Y';
  insideSplitRates?: SplitRate[];
  outsideSplitRates?: SplitRate[];
  linkedOrderId?: string;
  linkedOrderNumber?: string;
}
```

---

## 4. Quote Balance & Totals

```typescript
interface QuoteBalance {
  id: string;
  quantity?: number;                       // Sum of all line quantities
  subtotal?: number;                       // Sum before discounts
  total?: number;                          // Final total
  commission?: number;                     // Total commission
  commissionRate?: string;
  commissionDiscount?: number;
  commissionDiscountRate?: string;
  discount?: number;
  discountRate?: string;
}

// Calculation Logic:
// subtotal = SUM(detail.quantity × detail.unitPrice)
// total = subtotal - SUM(detail.discount) + adjustments
// totalLineCommission = SUM(detail.commission)
```

---

## 5. API Endpoints & GraphQL Operations

### Quote Landing Pages
```graphql
query QuoteLandingPages($sourceType: LandingSourceType!, $filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
  findLandingPages {
    records: QuoteLandingPage[]
    total: Int
  }
}
```

### Quote Detail
```graphql
query FindQuoteById($id: UUID!) {
  quote(id: $id) { ... all fields including nested balance, details[], job, createdBy }
}
```

### Create Quote
```graphql
mutation CreateQuote($input: QuoteInput!) {
  createQuote(input: $input) { ... }
}
```

**Required Fields**: quoteNumber, entityDate, soldToCustomerId

### Update Quote
```graphql
mutation UpdateQuote($input: QuoteInput!) {
  updateQuote(input: $input) { ... }
}
```
**IMPORTANT**: Include ALL fields when updating, not just changed ones. Include details array even if unchanged.

### Duplicate Quote
```graphql
mutation DuplicateQuote($sourceQuoteId: UUID!, $newQuoteNumber: String!) {
  duplicateQuote(sourceQuoteId: $sourceQuoteId, newQuoteNumber: $newQuoteNumber) { ... }
}
```

### Delete Quote
```graphql
mutation DeleteQuote($id: UUID!) {
  deleteQuote(id: $id)
}
```

### Create from Pre-Opportunity
```graphql
mutation CreateQuoteFromPreOpportunity($preOpportunityId: UUID!, $quoteNumber: String!, $preOpportunityDetailIds: [UUID!]) {
  createQuoteFromPreOpportunity(...) { ... }
}
```

---

## 6. Search & Lookup APIs

### Customer Search
```graphql
query CustomerSearch($searchTerm: String!, $published: Boolean) {
  customerSearch(searchTerm: $searchTerm, published: $published) { id, companyName, isParent, parentId, published }
}
```

### Product Search
```graphql
query ProductSearch($searchTerm: String!, $factoryId: UUID, $limit: Int) {
  productSearch(searchTerm: $searchTerm, factoryId: $factoryId, limit: $limit) {
    id, factoryPartNumber, description, unitPrice, defaultCommissionRate, defaultDivisor, approvalNeeded, published, leadTime, minOrderQty
  }
}
```

### Factory Search
```graphql
query FactorySearch($searchTerm: String!, $published: Boolean) {
  factorySearch(searchTerm: $searchTerm, published: $published) { id, title, accountNumber, published }
}
```

### User Search
```graphql
query UserSearch($searchTerm: String!, $isInside: Boolean, $isOutside: Boolean, $enabled: Boolean, $limit: Int) {
  userSearch(...) { id, email, firstName, fullName, inside, outside, role }
}
```

### Product CPNs (Customer Part Numbers)
```graphql
query ListProductCpnsByProductId($productId: UUID!) {
  listProductCpnsByProductId(productId: $productId) { id, customerPartNumber, customerId, productId, commissionRate, unitPrice }
}

query ProductCpnByProductIdAndCustomerId($productId: UUID!, $customerId: UUID!) {
  productCpnByProductIdAndCustomerId(...) { ... }
}
```

### Product Pricing Tiers
```graphql
query ListProductQuantityPricingByProductId($productId: UUID!) {
  listProductQuantityPricingByProductId(productId: $productId) { id, productId, quantityLow, quantityHigh, unitPrice }
}
```

### Product UOMs
```graphql
query ListProductUoms {
  productUoms { id, title, description, divisionFactor }
}
```

---

## 7. React Query Hooks

### Query Hooks (V1)
```typescript
useQuotesInfinite(filters?, orderBy?, pageSize?)
useQuotes(filters?, orderBy?)
useQuote(id: string)
useCustomerSearch(searchTerm, enabled?)
useProductSearch(searchTerm, factoryId?, enabled?)
useFactorySearch(searchTerm, enabled?)
useUserSearch(searchTerm, isInside?, enabled?, isOutside?)
useProductCpns(productId, enabled?)
useProductUoms(productId?, enabled?)
useJobSearch(searchTerm, enabled?)
```

### Mutation Hooks (V1)
```typescript
useCreateQuote()
useUpdateQuote()
useDuplicateQuote()
useDeleteQuote()
useCreateQuoteFromPreOpportunity()
```

### V2-Specific Hooks
```typescript
useQuotesV2Infinite(filters?, orderBy?, pageSize?)
useQuotesV2(filters?, orderBy?)
useQuoteV2(id: string | null)
useUpdateQuoteStageV2()                    // For Kanban drag & drop
useQuoteSearchV2(searchTerm, limit?)       // Debounced search
```

---

## 8. User Interface Features

### QuotesV2Content (Main Page)
**Views**: List View (default), Kanban View (drag & drop)

**Search**: Global quote search (2+ chars, 300ms debounce)

**Quick Filters**: All, Today, This Week, Last Week (on Created Date or Quote Date)

**Advanced Filters**:
- Quote Number, Status, Pipeline Stage, Total, Commission
- Created Date, Quote Date, Published
- Coming soon: Expiration Date, Created By

**Sorting**: Quote Number (DESC default), Amount, Created Date, Quote Date

**Actions**: New Quote, Bulk selection, Bulk delete, Refresh

**Metrics**: Total Pipeline Value, Won YTD, Count

### QuoteDetailV2Page (Detail)

**Tabs**:
1. **Line Items**: Configurable columns, inline editing, pricing intelligence
2. **Notes**: Quote-scoped notes
3. **Tasks**: Quote-scoped tasks
4. **Activity**: History (price_update, approval_update, etc.)
5. **Linked Objects**: Pre-opportunities, Orders, Invoices
6. **Versions**: Revision history
7. **Settings**: Per-line-item settings, price levels
8. **Files**: Uploaded files

### QuoteDetailHeaderV2
- Quote Number (editable)
- Status/Pipeline Stage badges
- Sold To / Bill To / End User (searchable)
- Job association
- Dates: Quote, Expiration, Revision, Accept
- Terms: Payment, Freight, Customer Ref
- Reps: Outside/Inside with split rates
- Flags: Blanket PO, Published
- Actions: Save, Delete, Duplicate, Create Order, PDF, Excel

### LineItemsTabV2
**Columns**: Part Number, Customer Part Number, Description, Manufacturer, Quantity, UOM, Divisor, Unit Price, End User, Sell Total, Commission %, Commission $, Commission Total, Linked Order

**Inline Editing**: Double-click cell, inline save, Escape to cancel

**Pricing Intelligence**:
- Fetches: Product default, CPN price, Volume tiers
- Dropdown shows all pricing options
- Tracks source: product/cpn/tier/manual
- Auto-applies tier price on quantity change

**Actions**: Add/Delete/Duplicate line, Additional Details modal, Column config

---

## 9. Modals & Dialogs

### CreateOrderFromQuoteModal
**Step 1**: Select line items, override qty/price
**Step 2**: Enter order number, due date, factory
**Step 3**: Success confirmation, redirect to order

### DuplicateQuoteModal
Pre-fills "{original}-COPY", validates not empty, keyboard support

### DeleteConfirmModal
Confirmation with quote info, redirects to list on success

### ColumnsConfigModalV2
Toggle column visibility by group (Basic, Pricing, Commission)

### AdditionalDetailsModalV2
- Commission Discount % and $
- Line Discount % and $
- End User (if enabled)
- Inside/Outside Reps (if enabled)
- Lead Time, Notes

---

## 10. Quote Configuration Settings

### Quote Settings (UI Only, NOT persisted to API)
```typescript
interface QuoteSettingsV2 {
  specifyEndUserPerLine: boolean;
  outsideRepAtLineLevel: boolean;
  insideRepAtLineLevel: boolean;
  factoryPerLineItem: boolean;
  customerPartNumberSource: 'sold_to' | 'end_user';
  outsideRepSource?: 'end_user' | 'sold_to' | 'bill_to';
  priceLevels: PriceLevelV2[];
}

// Defaults
{
  specifyEndUserPerLine: false,
  outsideRepAtLineLevel: false,
  insideRepAtLineLevel: false,
  factoryPerLineItem: true,
  customerPartNumberSource: 'sold_to',
  outsideRepSource: 'end_user',
  priceLevels: [{ id: 'l1', name: 'L1', percent: 0, description: '' }, ...]
}
```

### Outside Rep Population Source
- `outsideRepSource`: Tenant-wide setting controlling which customer's outside reps auto-populate
  - `'end_user'` (default): Outside reps are fetched from the End User customer
  - `'sold_to'`: Outside reps are fetched from the Sold To Customer
  - `'bill_to'`: Outside reps are fetched from the Bill To Customer
- Configurable in: Quote detail Settings tab, central Settings page (Quote Settings)
- Stored in `QUOTE_SETTINGS` via `saveTenantSetting`

```
```

### Column Configuration
```typescript
type LineItemColumnKey = 'partNumber' | 'customerPartNumber' | 'description' | 'manufacturer' | 'quantity' | 'uom' | 'divisor' | 'unitPrice' | 'endUser' | 'sellTotal' | 'commissionPercent' | 'commission' | 'commissionTotal' | 'linkedOrder';
```

---

## 11. Quote-to-Order Conversion

### Process
1. User clicks "Create Order from Quote"
2. Select line items + override qty/price (optional)
3. Enter order number and due date
4. Backend creates order with selected items
5. Links order to quote

### Input Transformation
```typescript
// QuoteDetail → OrderDetail
{
  quantity: number;        // From override or original
  unitPrice: string;       // From override or original
  productId?: string;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  factoryId?: string;
}
```

### Post-Creation
- Links via `createLink('QUOTE', quoteId, 'ORDER', orderId)`
- Redirects to new order
- LinkedObjects tab shows the order

---

## 12. Special Features & Behaviors

### Pricing Intelligence
```typescript
// Determines pricing source
function getPricingSource(unitPrice, productPrice, cpnPrice, tiers): PricingSource {
  if (unitPrice === productPrice) return 'product';
  if (unitPrice === cpnPrice) return 'cpn';
  const tier = tiers.find(t => unitPrice === t.unitPrice);
  if (tier) return `tier:${tier.quantityLow}-${tier.quantityHigh}`;
  return 'manual';
}

// Auto-apply tier on quantity change
function applyTierPricing(quantity, tiers) {
  const tier = tiers.find(t => quantity >= t.quantityLow && quantity <= t.quantityHigh);
  return tier?.unitPrice;
}
```

### Unsaved Changes
- `UnsavedChangesContext` tracks changes
- Modal warns before navigation
- Applies to header and line item changes

### FlowChat Integration
```typescript
setFullEntityContext({
  entityType: 'QUOTE',
  entityId: quoteId,
  entityData: quote,
  description: `Quote ${quote.quoteNumber}`,
});
```

### Kanban Drag & Drop
- Optimistic state update
- API mutation to update pipelineStage
- Undo if mutation fails

### Bulk Operations
- `useBulkSelection` hook
- Select individual, all loaded, or ALL (including unloaded)
- Bulk delete with confirmation

---

## 13. V1 vs V2 Differences

| Aspect | V1 (Legacy) | V2 (Current) |
|--------|-------------|--------------|
| **Location** | `components/quotes/api/` | `components/quotes-v2/` |
| **UI Components** | None (API only) | Full component suite |
| **Views** | N/A | List + Kanban |
| **Line item editing** | N/A | Inline editing |
| **Pricing intelligence** | N/A | CPN + Tier + Manual tracking |
| **Column config** | N/A | Per-user preferences |
| **Kanban drag & drop** | N/A | Optimistic updates |
| **Bulk operations** | N/A | Select & Delete |
| **Route** | `/quotes` (redirects) | `/quotes-v2` (active) |
| **Status** | Maintenance only | Active development |

### Important Notes
1. **Per-Line-Item Settings** are stored in quote record (boolean flags), NOT in Settings tab
2. **API Always Includes Details** - When updating, must include details array
3. **Pricing Source Tracking** - UI tracks but does NOT persist; recalculated on load
4. **Commission Split Rates** - Always at line item level (insideSplitRates/outsideSplitRates)
5. **V1 API Remains** - Used by orders, pre-opportunities, and other modules
