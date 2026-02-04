# Analysis: Overage View, Submittals Flow & Highlightable Spec Sheets


> **Scope:** flow-crm (frontend) + flow-py-backend (backend)
> **Branch:** `feature/overage_view`

---

## Executive Summary

| Feature | Frontend (flow-crm) | Backend (flow-py-backend) |
|---------|---------------------|---------------------------|
| **Overage View** | Implemented in Orders/Invoices. **NOT wired up in Quotes** (dropdown disabled, marked "Coming Soon") | Schema defined but **NOT implemented** in Python code |
| **Submittals Flow** | Fully implemented (15 components, ~9,500 LOC) with mock data | **NOT IMPLEMENTED** - No submittal module exists |
| **Highlightable Spec Sheets** | Complete annotation system with 6 shape types, multi-page PDF | Full API with versioned highlights, S3 storage |

---

## 1. OVERAGE VIEW (Advanced Quotes)

### What is Overage View?

Overage View is a **line item display mode** that shows additional columns for tracking overage pricing and earnings:

| Column | Label | Description |
|--------|-------|-------------|
| `percentOver` | % Over | Percentage markup over base price |
| `ovgPercent` | Ovg % | Overage percentage |
| `ovgAmount` | Ovg $ | Overage dollar amount |
| `earnPercent` | Earn % | Earnings percentage |
| `earnAmount` | Earn $ | Earnings dollar amount |

### 1.1 Frontend Implementation Status

#### Orders/Invoices - IMPLEMENTED
The Overage View is **fully implemented** in Orders and Invoices:

**Orders Location:**
- View Config: [viewsConfig.ts:29-46](components/orders/detail/config/viewsConfig.ts#L29-L46)
- Column Config: [columnConfig.ts:163-199](components/orders/detail/config/columnConfig.ts#L163-L199)
- Header Dropdown: [OrderDetailHeader.tsx](components/orders/detail/components/header/OrderDetailHeader.tsx)
- Table Header: [LineItemsTableHeader.tsx:215-264](components/orders/detail/components/line-items/LineItemsTableHeader.tsx#L215-L264)
- Table Row: [LineItemsTableRow.tsx:485-534](components/orders/detail/components/line-items/LineItemsTableRow.tsx#L485-L534)
- Set Overage Modal: [SetOverageModal.tsx](components/orders/detail/components/modals/line-items/SetOverageModal.tsx)

**Invoices Location:**
- View Config: [viewsConfig.ts:37-44](components/invoices/detail/config/viewsConfig.ts#L37-L44)
- Column Config: [columnConfig.ts:126-162](components/invoices/detail/config/columnConfig.ts#L126-L162)
- Header: [HeaderTopBar.tsx:105-112](components/invoices/detail/components/header/HeaderTopBar.tsx#L105-L112)

#### Quotes - NOT WIRED UP
In Quotes V2, the View Mode dropdown is **disabled** and marked "Coming Soon":

**File:** [QuoteDetailHeaderV2.tsx:724-737](components/quotes-v2/components/QuoteDetailHeaderV2.tsx#L724-L737)

```tsx
{/* View Mode Dropdown - Coming Soon */}
<div className="relative">
  <button
    disabled
    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
  >
    <svg>...</svg>
    Simple View
    <ComingSoonBadge inline />
  </button>
</div>
```

The state variable exists but is not functional:
```tsx
// Line 144
const [viewMode, setViewMode] = useState<'simple' | 'overage'>('simple');
```

### 1.2 Backend Implementation Status

#### Schema Defined - YES
The GraphQL schema has overage types defined:

**File:** `dev.schema.gql`

```graphql
# Line 3254-3261
type OverageRecord {
  effectiveCommissionRate: Float
  overageUnitPrice: Float
  baseUnitPrice: Float
  repShare: Float
  levelRate: Float
  levelUnitPrice: Float
}

# Line 3263-3266
enum OverageTypeEnum {
  BY_LINE
  BY_TOTAL
}
```

**Factory fields (schema lines 1907-1909, 1984-1986):**
```graphql
overageAllowed: Boolean!
overageAllowedType: OverageTypeEnum
repOverageShare: Float
```

**Product fields (schema lines 3875-3877, 3990-3992):**
```graphql
overageAllowed: Boolean!
overageAllowedType: OverageTypeEnum
overageUnitPrice: Float
```

**Order Detail fields (schema lines 4194-4197):**
```graphql
overageCommissionRate: Float
overageCommission: Float
```

**Query (schema line 197):**
```graphql
findEffectiveCommissionRateAndOverageUnitPriceByProduct(
  productId: ID!,
  detailUnitPrice: Float!,
  factoryId: ID!,
  endUserId: ID!
): OverageRecord
```

#### Python Implementation - NOT FOUND
**Critical Finding:** No Python code implementing overage logic was found in:
- `/app/graphql/` - No overage services, repositories, or resolvers
- `flowbot-commons/` - No overage models

The schema defines the types but the resolvers are not implemented.

### 1.3 Database Schema

The SQL schema has overage columns defined:

**Factory table (schema-old.sql:2723-2725):**
```sql
overage_allowed boolean DEFAULT false NOT NULL,
overage_allowed_type character varying(255),
rep_overage_share numeric(19,2)
```

**Product table (schema-old.sql:3388-3390):**
```sql
overage_allowed boolean DEFAULT false NOT NULL,
overage_allowed_type character varying(255),
overage_unit_price numeric(19,2)
```

**Order Detail table (schema-old.sql:4071-4075):**
```sql
overage_commission numeric(19,4),
overage_commission_rate numeric(19,4)
```

### 1.4 Gap Analysis - Overage View

| Component | Status | What's Needed |
|-----------|--------|---------------|
| **Frontend - Orders** | DONE | - |
| **Frontend - Invoices** | DONE | - |
| **Frontend - Quotes** | NOT WIRED | Enable dropdown, add view switching logic |
| **Backend - Schema** | DONE | - |
| **Backend - Python** | NOT DONE | Implement resolvers for overage queries |
| **Database** | DONE | Columns exist |

---

## 2. SUBMITTALS FLOW

### 2.1 Frontend (flow-crm) - FULLY IMPLEMENTED

#### Location
- **Types:** [lib/types/submittals.ts](lib/types/submittals.ts)
- **Mock Data:** [lib/data/submittals-mock.ts](lib/data/submittals-mock.ts)
- **Components:** [components/submittals/](components/submittals/) (15 files, ~9,560 LOC)

#### Component Inventory

| Component | Purpose | Size |
|-----------|---------|------|
| `SubmittalDetailPanel.tsx` | Main submittal detail view | 54 KB |
| `CreateSubmittalModal.tsx` | Create submittal from quote | 49 KB |
| `SpecSheetsContent.tsx` | Spec sheet library management | 76 KB |
| `SpecSheetViewerModal.tsx` | View spec sheets | 48 KB |
| `HighlightEditor.tsx` | Edit highlights on spec sheets | 15 KB |
| `HighlightCanvas.tsx` | Canvas for drawing highlights | 20 KB |
| `HighlightToolbar.tsx` | Toolbar with tools/colors | 9 KB |
| `PdfViewer.tsx` | PDF viewer with zoom/pan | 12 KB |
| `RevisionTimeline.tsx` | Show revision history | 18 KB |
| `PrintSubmittalDialog.tsx` | Print submittal as PDF | 32 KB |
| `SendSubmittalEmailDialog.tsx` | Email submittal to stakeholders | 12 KB |
| `ReturnedPdfUpload.tsx` | Upload returned/marked PDFs | 14 KB |
| `ChangeAnalysisPanel.tsx` | Analyze changes in returned PDFs | 19 KB |
| `SpecSheetDetailPanel.tsx` | View spec sheet details | 19 KB |
| `SpecSheetUploadModal.tsx` | Upload new spec sheets | 15 KB |

#### Workflow Features
1. **Create from Quote** - Select quote and line items
2. **Stakeholder Management** - Customers, engineers, architects
3. **Spec Sheet Attachment** - Attach PDFs to items
4. **Highlighting** - Mark up spec sheets with annotations
5. **Revision Management** - Generate PDF revisions
6. **Email Distribution** - Send to stakeholders
7. **PDF Markup Return** - Upload marked-up PDFs
8. **Change Analysis** - AI or manual change detection

### 2.2 Backend (flow-py-backend) - NOT IMPLEMENTED

**Finding:** NO dedicated Submittals module exists in the backend.

#### Recommendation - New Module Structure
```
app/graphql/submittals/
├── models/
│   ├── submittal.py
│   ├── submittal_item.py
│   ├── submittal_revision.py
│   └── submittal_stakeholder.py
├── repositories/
│   └── submittals_repository.py
├── services/
│   └── submittal_service.py
├── mutations/
│   └── submittals_mutations.py
├── queries/
│   └── submittals_queries.py
└── strawberry/
    ├── inputs.py
    └── responses.py
```

---

## 3. HIGHLIGHTABLE SPEC SHEETS

### 3.1 Frontend (flow-crm) - FULLY IMPLEMENTED

#### Highlight Data Structure
```typescript
interface HighlightRegion {
  id: string;
  pageNumber: number;
  x: number;           // percentage 0-100
  y: number;           // percentage 0-100
  width: number;       // percentage
  height: number;      // percentage
  shape: 'rectangle' | 'oval' | 'highlight' | 'arrow' | 'text' | 'underline';
  color: string;       // hex color
  strokeWidth?: number;
  annotation?: string;
  rotation?: number;
  tags?: string[];
}
```

#### Highlight Editor Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| Highlighter | H | Yellow highlight |
| Rectangle | R | Rectangle with border |
| Oval | O | Circular shapes |
| Arrow | A | Arrows with rotation |
| Select | V | Select/move tool |
| Delete | Del | Delete selected |
| Undo | Ctrl+Z | Undo |
| Redo | Ctrl+Y | Redo |

### 3.2 Backend (flow-py-backend) - IMPLEMENTED

#### Spec Sheets API
**Location:** `app/graphql/spec_sheets/`

**Queries:**
```graphql
spec_sheet(id: UUID) -> SpecSheetResponse
spec_sheets_by_factory(factory_id: UUID, published_only: Boolean) -> [SpecSheetResponse]
spec_sheet_search(...) -> [SpecSheetResponse]
```

**Mutations:**
```graphql
create_spec_sheet(input: CreateSpecSheetInput) -> SpecSheetResponse
update_spec_sheet(id: UUID, input: UpdateSpecSheetInput) -> SpecSheetResponse
delete_spec_sheet(id: UUID) -> Boolean
```

#### Highlights API

**Queries:**
```graphql
highlight_version(id: UUID) -> HighlightVersionResponse
highlight_versions_by_spec_sheet(spec_sheet_id: UUID, active_only: Boolean) -> [HighlightVersionResponse]
```

**Mutations:**
```graphql
create_highlight_version(input) -> HighlightVersionResponse
update_highlight_version(id, input) -> HighlightVersionResponse
update_highlight_regions(input) -> HighlightVersionResponse
delete_highlight_version(id) -> Boolean
```

---

## 4. IMPLEMENTATION PRIORITIES

### Priority 1: Wire Up Overage View in Quotes

**Frontend Tasks:**
1. Enable the View Mode dropdown in [QuoteDetailHeaderV2.tsx:724-737](components/quotes-v2/components/QuoteDetailHeaderV2.tsx#L724-L737)
2. Add Overage View to quotes-v2 viewsConfig (copy from orders)
3. Add overage columns to quotes-v2 columnConfig
4. Wire up the `viewMode` state to control visible columns

**Backend Tasks:**
1. Implement `findEffectiveCommissionRateAndOverageUnitPriceByProduct` resolver
2. Create overage calculation service
3. Wire up overage fields in quote detail responses

### Priority 2: Create Submittals Backend

1. Create database migrations for submittal tables
2. Create models in flowbot-commons
3. Create GraphQL module in flow-py-backend
4. Connect frontend to real API (replace mock data)

### Priority 3: Integration Testing

1. Test overage calculations flow
2. Test submittal creation from quotes
3. Test spec sheet highlighting persistence

---

## 5. FILE REFERENCE

### Overage View Files (Frontend)

| File | Purpose |
|------|---------|
| `components/orders/detail/config/viewsConfig.ts` | Overage view column config |
| `components/orders/detail/types.ts` | ColumnKey types including overage |
| `components/orders/detail/constants.ts` | Column labels |
| `components/orders/detail/components/line-items/LineItemsTableHeader.tsx` | Header rendering |
| `components/orders/detail/components/line-items/LineItemsTableRow.tsx` | Row rendering |
| `components/orders/detail/components/modals/line-items/SetOverageModal.tsx` | Set overage modal |
| `components/quotes-v2/components/QuoteDetailHeaderV2.tsx` | **DISABLED** view dropdown |

### Submittals Files (Frontend)

| File | Purpose |
|------|---------|
| `lib/types/submittals.ts` | Type definitions (30+ types) |
| `lib/data/submittals-mock.ts` | Mock data |
| `components/submittals/*.tsx` | 15 component files |
| `app/(dashboard)/spec-sheets/page.tsx` | Spec sheets page |

### Backend Files

| File | Purpose |
|------|---------|
| `dev.schema.gql` | GraphQL schema with overage types |
| `schema-old.sql` | Database schema with overage columns |
| `app/graphql/spec_sheets/` | Spec sheets + highlights implementation |
| `app/graphql/submittals/` | **DOES NOT EXIST** |
