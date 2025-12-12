# Quotes Feature Build Plan

## Overview

A comprehensive quoting UI for FlowConnect CRM that handles complex multi-manufacturer quotes with overage mechanics, predictive pricing, multi-level pricing for distributors/contractors, **manufacturer approval workflows**, and streamlined quote management.

**Note**: This is a UI mockup with hardcoded data, matching the existing codebase patterns. No backend/database integration required.

---

## Table of Contents

1. [File Structure](#1-file-structure)
2. [Mock Data Types](#2-mock-data-types)
3. [Quote List Page](#3-quote-list-page)
4. [Quote Detail View](#4-quote-detail-view)
5. [Line Item Management](#5-line-item-management)
6. [Manufacturer Approvals](#6-manufacturer-approvals)
7. [Overage & Commission UI](#7-overage--commission-ui)
8. [Multi-Level Pricing UI](#8-multi-level-pricing-ui)
9. [Predictive Pricing & Sparklines](#9-predictive-pricing--sparklines)
10. [Sections & Grouping](#10-sections--grouping)
11. [Recipients & Batch Send](#11-recipients--batch-send)
12. [Internal Notes](#12-internal-notes)
13. [Versioning UI](#13-versioning-ui)
14. [Builder Approved Manufacturers List](#14-builder-approved-manufacturers-list)
15. [Approvals Reporting](#15-approvals-reporting)
16. [Distributor-Specific Quotes](#16-distributor-specific-quotes)
17. [Build Order](#17-build-order)

---

## 1. File Structure

```
/app/quotes/page.tsx                   # Quotes list page (follows existing pattern)
/components/QuotesContent.tsx          # Main quotes component (Kanban + List views)
/components/QuoteDetailModal.tsx       # Full quote detail view (modal or inline)
/components/QuoteLineItems.tsx         # Line items table with all features
/components/QuotePricingPanel.tsx      # Right sidebar with totals, levels, commission
/components/QuoteSparkline.tsx         # Mini price history chart
/components/QuoteWinProbability.tsx    # Win probability badge with tooltip
/components/QuoteApprovalStatus.tsx    # Approval status panel & badges
/components/ApprovalRequestModal.tsx   # Generate approval request PDF
/components/BuilderApprovalsList.tsx   # Manage builder's approved manufacturers

# Distributor-Specific Quotes
/components/DistributorQuoteModal.tsx  # Generate distributor-specific quotes
/components/DistributorMatrix.tsx      # Distributor ↔ Manufacturer matrix editor
/components/PriceCategoryConfig.tsx    # Price category and discount configuration
/components/NonCompetitiveCross.tsx    # Non-competitive cross reference UI
/components/CrossAuditLog.tsx          # Cross and pricing audit log
/components/ManufacturerAdmin.tsx      # Manufacturer list with domains
```

---

## 2. Mock Data Types

Keep types simple and inline with mock data in the component files (like existing `JobsContent.tsx`, `CompaniesContent.tsx`).

```typescript
// In QuotesContent.tsx - inline mock data

const mockQuotes = [
  {
    id: 'Q-2024-001',
    name: 'Downtown Medical Center - Lighting Package',
    billToCustomer: 'Graybar Electric',
    soldToCustomer: 'Turner Construction',
    jobId: 'J-001',
    jobName: 'Downtown Medical Center',
    stage: 'Negotiating',
    value: '$2,450,000',
    winProbability: 72,
    expirationDate: '2024-04-15',
    owner: 'Sarah Chen',
    version: 3,
    lastUpdated: '2024-03-20',
    tags: ['Healthcare', 'Lighting'],
    // Approval status
    approvalStatus: 'pending', // 'clear' | 'pending' | 'blocked'
    pendingApprovals: 2,
  },
  // ... more quotes
];

const mockLineItems = [
  {
    id: 'LI-001',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    productNumber: 'LX-4500-LED',
    description: 'Linear LED Fixture 4ft 5000K with Integrated Driver',
    endUser: 'Memorial Hospital',
    quantity: 150,
    manufacturers: [
      {
        name: 'Acuity Brands',
        basePrice: 245.00,
        commissionRate: 0.10,
        overageShare: 0.90,
        // Approval status for this manufacturer with the builder
        approvalStatus: 'approved', // 'approved' | 'conditional' | 'not_approved' | 'unknown'
        approvalDate: '2023-06-15',
        approvalNotes: 'Approved for all lighting products',
      },
    ],
    basePrice: 245.00,
    sellPrice: 275.00,
    level1Price: 302.50,
    level2Price: 315.00,
    level3Price: 330.00,
    overagePercent: 10.9,
    commissionable: true,
    locked: false,
    priceHistory: [220, 225, 230, 235, 240, 242, 245, 245, 248, 250, 248, 245],
  },
  {
    id: 'LI-002',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    productNumber: 'PLX-200-DIM',
    description: 'Programmable Dimmer Switch with Daylight Harvesting',
    endUser: 'Memorial Hospital',
    quantity: 75,
    manufacturers: [
      {
        name: 'Lutron',
        basePrice: 185.00,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'not_approved', // Needs approval!
        approvalDate: null,
        approvalNotes: null,
      },
    ],
    // ... pricing fields
  },
  // ... more line items
];

// Builder's Approved Manufacturers List
const mockBuilderApprovals = [
  {
    id: 'BA-001',
    builderId: 'CO-005', // Turner Construction
    builderName: 'Turner Construction',
    manufacturerId: 'MFR-001',
    manufacturerName: 'Acuity Brands',
    status: 'approved', // 'approved' | 'conditional' | 'not_approved'
    category: 'Lighting', // Product category
    conditions: null, // null for full approval
    approvedSkus: null, // null = all SKUs, or array of specific SKUs
    approvedDate: '2023-06-15',
    expirationDate: null,
    approvedBy: 'John Smith (Procurement)',
    documentUrl: '/docs/acuity-approval.pdf',
    notes: 'Approved for all lighting products across all projects',
  },
  {
    id: 'BA-002',
    builderId: 'CO-005',
    builderName: 'Turner Construction',
    manufacturerId: 'MFR-003',
    manufacturerName: 'Lutron',
    status: 'conditional',
    category: 'Controls',
    conditions: 'Approved only for RadioRA 3 and Homeworks QSX systems',
    approvedSkus: ['RR-3-XXX', 'HQP-XXX'],
    approvedDate: '2024-01-10',
    expirationDate: '2024-12-31',
    approvedBy: 'Mike Johnson (Engineering)',
    documentUrl: '/docs/lutron-conditional.pdf',
    notes: 'Exception granted for smart lighting controls only',
  },
  // ... more approvals
];

// Approval Requests
const mockApprovalRequests = [
  {
    id: 'AR-001',
    quoteId: 'Q-2024-001',
    builderId: 'CO-005',
    builderName: 'Turner Construction',
    manufacturerId: 'MFR-003',
    manufacturerName: 'Lutron',
    status: 'pending', // 'pending' | 'approved' | 'conditional' | 'rejected'
    requestedDate: '2024-03-18',
    requestedBy: 'Sarah Chen',
    // Request details
    skus: ['PLX-200-DIM', 'PLX-300-DIM'],
    justification: 'Lutron dimmers provide superior daylight harvesting integration with the Acuity fixtures already approved. Lead time is 2 weeks vs 6 weeks for alternatives.',
    attachments: ['lutron-spec-sheet.pdf', 'comparison-chart.pdf'],
    // Response
    respondedDate: null,
    respondedBy: null,
    responseNotes: null,
    conditions: null,
  },
  // ... more requests
];

// ============================================
// DISTRIBUTOR-SPECIFIC QUOTES MOCK DATA
// ============================================

// Manufacturer List (domain-based)
const mockManufacturers = [
  {
    manufacturer_name: 'A.O. Smith',
    domain: 'aosmith.com',
    active: true,
  },
  {
    manufacturer_name: 'Rheem',
    domain: 'rheem.com',
    active: true,
  },
  {
    manufacturer_name: 'Bradford White',
    domain: 'bradfordwhite.com',
    active: true,
  },
  {
    manufacturer_name: 'Watts Water',
    domain: 'watts.com',
    active: true,
  },
  {
    manufacturer_name: 'Moen',
    domain: 'moen.com',
    active: true,
  },
  // ... more manufacturers
];

// Price Category Library
const mockPriceCategories = [
  {
    price_category_name: 'Stocking',
    description: 'Products stocked in distributor warehouse',
    default_discount_percent: 0.25,
  },
  {
    price_category_name: 'Buy-Sell',
    description: 'Direct ship from manufacturer',
    default_discount_percent: 0.18,
  },
  {
    price_category_name: 'Non-Stocking',
    description: 'Special order products',
    default_discount_percent: 0.10,
  },
];

// Manufacturer-Specific Price Category Overrides
const mockManufacturerPriceCategories = [
  {
    manufacturer_domain: 'aosmith.com',
    price_categories: [
      { name: 'Stocking', discount: 0.25 },
      { name: 'Buy-Sell', discount: 0.18 },
      { name: 'Non-Stocking', discount: 0.10 },
    ],
  },
  {
    manufacturer_domain: 'rheem.com',
    price_categories: [
      { name: 'Stocking', discount: 0.22 },
      { name: 'Buy-Sell', discount: 0.15 },
      { name: 'Non-Stocking', discount: 0.08 },
    ],
  },
  {
    manufacturer_domain: 'bradfordwhite.com',
    price_categories: [
      { name: 'Stocking', discount: 0.28 },
      { name: 'Buy-Sell', discount: 0.20 },
      { name: 'Non-Stocking', discount: 0.12 },
    ],
  },
  // ... more overrides
];

// Distributor ↔ Manufacturer Matrix
const mockDistributorMatrix = [
  {
    distributor_domain: 'graybar.com',
    manufacturer_domain: 'aosmith.com',
    price_category: 'Stocking',
  },
  {
    distributor_domain: 'graybar.com',
    manufacturer_domain: 'rheem.com',
    price_category: 'Buy-Sell',
  },
  {
    distributor_domain: 'graybar.com',
    manufacturer_domain: 'watts.com',
    price_category: 'Stocking',
  },
  {
    distributor_domain: 'hdsupply.com',
    manufacturer_domain: 'aosmith.com',
    price_category: 'Buy-Sell',
  },
  {
    distributor_domain: 'hdsupply.com',
    manufacturer_domain: 'moen.com',
    price_category: 'Stocking',
  },
  {
    distributor_domain: 'fergusons.com',
    manufacturer_domain: 'bradfordwhite.com',
    price_category: 'Stocking',
  },
  {
    distributor_domain: 'fergusons.com',
    manufacturer_domain: 'rheem.com',
    price_category: 'Non-Stocking',
  },
  // ... more matrix entries
];

// Non-Competitive Cross References
const mockNonCompetitiveCrosses = [
  {
    id: 'NCC-001',
    source_manufacturer_domain: 'aosmith.com',
    source_sku: 'AOS-WH-50G',
    target_manufacturer_domain: 'rheem.com',
    target_sku: 'RH-50G-PRO',
    confidence: 0.95,
    notes: 'Equivalent 50-gallon water heater, same BTU output',
  },
  {
    id: 'NCC-002',
    source_manufacturer_domain: 'aosmith.com',
    source_sku: 'AOS-WH-40G',
    target_manufacturer_domain: 'bradfordwhite.com',
    target_sku: 'BW-40G-NG',
    confidence: 0.92,
    notes: 'Comparable 40-gallon natural gas unit',
  },
  {
    id: 'NCC-003',
    source_manufacturer_domain: 'moen.com',
    source_sku: 'MOEN-8200',
    target_manufacturer_domain: 'watts.com',
    target_sku: 'WATTS-LF25',
    confidence: 0.88,
    notes: 'Similar flow rate and pressure specs',
  },
  // ... more crosses
];

// Distributor-Specific Quote (child of base quote)
const mockDistributorQuotes = [
  {
    id: 'DQ-001',
    baseQuoteId: 'Q-2024-001',
    distributorDomain: 'graybar.com',
    distributorName: 'Graybar Electric',
    status: 'draft', // 'draft' | 'requires_cross' | 'ready_to_send' | 'sent'
    createdAt: '2024-03-20',
    // Pricing summary
    originalTotal: 245000,
    discountedTotal: 195000,
    totalDiscount: 50000,
    discountPercent: 0.204,
    // Line status
    totalLines: 25,
    linesRequiringCross: 3,
    linesCrossed: 0,
    linesApproved: 22,
  },
  {
    id: 'DQ-002',
    baseQuoteId: 'Q-2024-001',
    distributorDomain: 'hdsupply.com',
    distributorName: 'HD Supply',
    status: 'requires_cross',
    createdAt: '2024-03-20',
    originalTotal: 245000,
    discountedTotal: 208250,
    totalDiscount: 36750,
    discountPercent: 0.15,
    totalLines: 25,
    linesRequiringCross: 5,
    linesCrossed: 2,
    linesApproved: 18,
  },
  // ... more distributor quotes
];

// Distributor Quote Line Items
const mockDistributorQuoteLines = [
  {
    id: 'DQL-001',
    distributorQuoteId: 'DQ-001',
    originalLineId: 'LI-001',
    // Original product
    originalSku: 'AOS-WH-50G',
    originalManufacturer: 'aosmith.com',
    originalPrice: 485.00,
    // After matrix/cross
    finalSku: 'AOS-WH-50G', // Same if authorized
    finalManufacturer: 'aosmith.com',
    priceCategory: 'Stocking',
    discountPercent: 0.25,
    finalPrice: 363.75,
    // Status
    status: 'approved', // 'approved' | 'requires_cross' | 'crossed' | 'omitted'
    crossedFrom: null,
    crossSource: null, // 'upload' | 'ai'
  },
  {
    id: 'DQL-002',
    distributorQuoteId: 'DQ-001',
    originalLineId: 'LI-003',
    originalSku: 'BW-40G-NG',
    originalManufacturer: 'bradfordwhite.com',
    originalPrice: 425.00,
    // Requires cross - distributor doesn't carry this manufacturer
    finalSku: null,
    finalManufacturer: null,
    priceCategory: null,
    discountPercent: null,
    finalPrice: null,
    status: 'requires_cross',
    crossedFrom: null,
    crossSource: null,
  },
  // ... more lines
];

// Cross and Pricing Audit Log
const mockCrossAuditLog = [
  {
    id: 'AUDIT-001',
    timestamp: '2024-03-20T14:30:00Z',
    baseQuoteId: 'Q-2024-001',
    distributorDomain: 'graybar.com',
    manufacturerDomain: 'aosmith.com',
    skuBefore: 'AOS-WH-50G',
    skuAfter: 'AOS-WH-50G',
    priceCategoryApplied: 'Stocking',
    discountPercent: 0.25,
    crossSource: null, // No cross needed
    userApproved: true,
    userId: 'sarah.chen',
  },
  {
    id: 'AUDIT-002',
    timestamp: '2024-03-20T14:35:00Z',
    baseQuoteId: 'Q-2024-001',
    distributorDomain: 'hdsupply.com',
    manufacturerDomain: 'bradfordwhite.com',
    skuBefore: 'BW-40G-NG',
    skuAfter: 'RH-40G-PRO',
    priceCategoryApplied: 'Buy-Sell',
    discountPercent: 0.15,
    crossSource: 'ai',
    userApproved: true,
    userId: 'sarah.chen',
  },
  // ... more audit entries
];
```

---

## 3. Quote List Page

### 3.1 Kanban View (Primary)

**Columns** (stages):
- Draft
- Review
- Sent
- Negotiating
- Won
- Lost

**Quote Card Display**:
- Quote # and name
- Bill-to customer
- Total value
- Win probability badge (colored: green >70%, yellow 40-70%, red <40%)
- **Approval status indicator** (see 3.4)
- Expiration date (red if within 7 days)
- Owner avatar/initials
- Version indicator (v3)

**Features**:
- Drag-and-drop between columns (use existing @dnd-kit pattern)
- Click card to open detail view
- Quick filters in toolbar
- **Filter by approval status**

### 3.2 List View (Toggle)

**Columns**:
| Quote # | Name | Bill-To | Sold-To | Value | Win % | **Approvals** | Stage | Expires | Owner |

**Features**:
- Sortable columns
- Row click opens detail
- Checkbox selection for bulk actions
- **Approval status column with badge**

### 3.3 Toolbar

- View toggle (Kanban / List)
- "New Quote" button
- Search input
- Advanced Filters (use existing `AdvancedFilters` component pattern)
- **Filter: Approval Status (All / Clear / Pending / Blocked)**

### 3.4 Approval Status on Quote Card

Each quote card shows a small approval indicator:

```
┌────────────────────────────────────────────┐
│ Q-2024-001                            [v3] │
│ Downtown Medical Center - Lighting         │
│                                            │
│ Turner Construction           $2,450,000   │
│                                            │
│ [72% Win]  [⚠ 2 Approvals Needed]         │
│            └── Yellow badge                │
│                                            │
│ Expires: Apr 15    👤 Sarah Chen           │
└────────────────────────────────────────────┘
```

**Badge States**:
- `[✓ All Approved]` - Green - All manufacturers approved
- `[⚠ 2 Approvals Needed]` - Yellow - Some pending
- `[✗ 1 Not Approved]` - Red - Has rejected manufacturers

---

## 4. Quote Detail View

### 4.1 Header Bar

```
[← Back]  Q-2024-001: Downtown Medical Center - Lighting Package  [v3]

[Stage: Negotiating ▼]  [72% Win Probability]  [⚠ 2 Approvals Needed]  [Expires: Apr 15, 2024]

[Save] [Send Quote ▼] [Create Revision] [⋮ More]
        └── Disabled if approvals pending, shows tooltip
```

**Send Quote Button Behavior**:
- If all manufacturers approved: Normal "Send Quote" button
- If approvals pending: Button shows "⚠ Resolve Approvals" or is disabled with tooltip
- Click shows modal explaining which manufacturers need approval

### 4.2 Customer Section (Collapsible)

```
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMERS                                                   [−] │
├─────────────────────────────────────────────────────────────────┤
│ Bill-To: Graybar Electric          Sold-To: Turner Construction │
│ 123 Main St, St. Louis, MO         456 Oak Ave, Chicago, IL     │
│ Contact: John Smith                Contact: Mike Johnson        │
│ john@graybar.com                   mike@turner.com              │
│                                    [View Approved Mfrs List →]  │
└─────────────────────────────────────────────────────────────────┘
```

- Company name is clickable (links to company detail)
- Edit button to change customer
- **"View Approved Mfrs List" link** opens builder's approval list

### 4.3 Tabs

```
[Line Items] [Approvals (2)] [Recipients (4)] [Attachments (2)] [Notes (3)] [History]
                  └── Count shows pending approvals
```

### 4.4 Right Sidebar (Collapsible)

**Pricing Summary Panel**:
```
┌────────────────────────┐
│ QUOTE TOTALS           │
├────────────────────────┤
│ Sell:    $2,450,000    │
│ L1:      $2,695,000    │
│ L2:      $2,817,500    │
│ L3:      $2,940,000    │
├────────────────────────┤
│ COMMISSION             │
│ Base:      $245,000    │
│ Overage:    $58,500    │
│ Total:     $303,500    │
├────────────────────────┤
│ Eff. Rate:    12.4%    │
│ Target:  [18%] [Apply] │
└────────────────────────┘

┌────────────────────────┐
│ APPROVAL STATUS        │
├────────────────────────┤
│ 🟢 Acuity Brands       │
│ 🟡 Lutron (pending)    │
│ 🔴 Signify (rejected)  │
│                        │
│ [View All Approvals]   │
└────────────────────────┘
```

---

## 5. Line Item Management

### 5.1 Line Items Table

**Toolbar**:
```
[+ Add Line] [+ Add Section] [▼ Bulk Actions] [Show Overage ○] [View: Product # / Description]
                                                    ↑ toggle
```

**Table Columns** (when overage ON):
```
☐ │ ≡ │ Product/Desc │ Mfr │ Approval │ End User │ Qty │ Base │ Sell │ Over% │ L1 │ L2 │ L3 │ Comm │ 📈 │ ⋮
                            └── Status badge
```

**Table Columns** (when overage OFF - simpler):
```
☐ │ ≡ │ Product/Desc │ Mfr │ Approval │ End User │ Qty │ Unit Price │ L1 │ L2 │ L3 │ Total │ 📈 │ ⋮
```

- `≡` = drag handle
- `📈` = sparkline (price history mini chart)
- `⋮` = row actions menu
- **Approval column shows status badge per line**

### 5.2 Approval Status Per Line

Each line shows approval status for its manufacturer(s):

```
│ LX-4500-LED │ Acuity   │ [🟢 Approved]     │ Memorial │ 150 │ $245 │ ...
│ PLX-200-DIM │ Lutron   │ [🟡 Needs Review] │ Memorial │  75 │ $185 │ ...
│ SIG-100-FIX │ Signify  │ [🔴 Not Approved] │ Memorial │  50 │ $320 │ ...
│ MIX-LINE    │ Multiple │ [⚠ Mixed]         │ Memorial │  25 │ $450 │ ...
```

**Badge Colors**:
- 🟢 **Approved** (green) - Manufacturer is on builder's approved list
- 🟡 **Needs Review** (yellow) - Conditional approval or approval request pending
- 🔴 **Not Approved** (red) - Not on list, needs approval request
- ⚠ **Unknown** (gray) - No approval data for this builder/manufacturer combo

**Click badge** → Opens approval details popup or request modal

### 5.3 Section Headers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▼ LOBBY LIGHTING (12 items)        [⚠ 1 Approval Needed]   Subtotal: $425K │
│   12 items │ Commission: $52K │ Overage: $12K                        [⋮]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ [line items...]                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Section shows approval warning if any lines need approval**

### 5.4 Expanded Row (Multi-Manufacturer)

Click row to expand and show manufacturer breakdown with approval status:

```
│ LX-4500-LED │ Multi │ [⚠ Mixed] │ Memorial Hospital │ 150 │ $245 │ $275 │ ...
│  └─ Acuity Brands    Base: $245.00  Comm: 10%  [🟢 Approved]
│  └─ Lutron           Base: $85.00   Comm: 8%   [🔴 Not Approved] [Request Approval]
│  └─ [+ Add Manufacturer]
```

### 5.5 Bulk Actions Menu

When lines selected:
```
┌────────────────────────────────────────┐
│ Set % Overage...                       │
│ Copy Sell → L1 (+%)                    │
│ Copy Sell → L2 (+%)                    │
│ Copy Sell → L3 (+%)                    │
│ ─────────────────────────────────────  │
│ Move to Section...                     │
│ Lock Prices                            │
│ Unlock Prices                          │
│ ─────────────────────────────────────  │
│ ✓ Mark as Approved (bulk)              │  ← NEW
│ Request Approval for Selected...       │  ← NEW
│ ─────────────────────────────────────  │
│ Delete Selected                        │
└────────────────────────────────────────┘
```

### 5.6 Set % Overage Modal

```
┌─────────────────────────────────────────────────┐
│ Set % Overage                              [×]  │
├─────────────────────────────────────────────────┤
│ Apply to 8 selected lines                       │
│                                                 │
│ Overage %: [7    ]%                             │
│                                                 │
│ Preview:                                        │
│ ─────────────────────────────────────────────── │
│ Total Sell Price:  $425,000 → $456,989          │
│ Total Commission:  $42,500  → $71,239           │
│ Overage Amount:    $0       → $31,989           │
│                                                 │
│ ⚠ 2 lines skipped (locked or no base price)    │
│                                                 │
│               [Cancel]  [Apply]                 │
└─────────────────────────────────────────────────┘
```

---

## 6. Manufacturer Approvals

### 6.1 Approvals Tab

New tab in quote detail showing all manufacturer approvals for this quote:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ MANUFACTURER APPROVALS                                    [Request All Needed] │
│ Builder: Turner Construction                                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │ 🟢 APPROVED                                                                │ │
│ ├────────────────────────────────────────────────────────────────────────────┤ │
│ │ Manufacturer     │ Category  │ Lines │ Approved     │ Notes                │ │
│ │──────────────────│───────────│───────│──────────────│──────────────────────│ │
│ │ Acuity Brands    │ Lighting  │ 12    │ Jun 15, 2023 │ All products         │ │
│ │ Eaton            │ Electrical│ 8     │ Mar 3, 2024  │ All products         │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 NEEDS REVIEW (Conditional / Pending)                                    │ │
│ ├────────────────────────────────────────────────────────────────────────────┤ │
│ │ Manufacturer     │ Status      │ Lines │ Details           │ Action        │ │
│ │──────────────────│─────────────│───────│───────────────────│───────────────│ │
│ │ Lutron           │ Pending     │ 4     │ Requested Mar 18  │ [View Request]│ │
│ │ Hubbell          │ Conditional │ 3     │ Only HBL series   │ [Check SKUs]  │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 NOT APPROVED (Action Required)                                          │ │
│ ├────────────────────────────────────────────────────────────────────────────┤ │
│ │ Manufacturer     │ Category │ Lines │ Value     │ Action                   │ │
│ │──────────────────│──────────│───────│───────────│──────────────────────────│ │
│ │ Signify          │ Lighting │ 5     │ $125,000  │ [Request Approval]       │ │
│ │ Legrand          │ Controls │ 2     │ $18,500   │ [Request Approval]       │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Approval Request Modal (Generate PDF)

Click "Request Approval" opens modal to create approval request document:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Request Manufacturer Approval                                          [×]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ BUILDER                                                                     │
│ Turner Construction                                                         │
│                                                                             │
│ PROJECT                                                                     │
│ Downtown Medical Center - Lighting Package                                  │
│                                                                             │
│ MANUFACTURER REQUESTING APPROVAL                                            │
│ [Signify                                               ▼]                   │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ PRODUCTS/SKUS INCLUDED (5 line items)                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ☑ SIG-100-FIX    Linear LED Fixture 2ft           50 × $320 = $16,000  │ │
│ │ ☑ SIG-200-HIGH   High Bay LED 200W                25 × $485 = $12,125  │ │
│ │ ☑ SIG-CTRL-DIM   Dimming Controller               10 × $275 = $2,750   │ │
│ │ ☑ SIG-SENS-OCC   Occupancy Sensor                 30 × $145 = $4,350   │ │
│ │ ☑ SIG-SENS-DAY   Daylight Sensor                  15 × $185 = $2,775   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ Total Value: $38,000                                                        │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ JUSTIFICATION / REASON FOR REQUEST                                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Signify fixtures provide superior color rendering (CRI 95+) required   │ │
│ │ for the medical examination rooms. They also integrate seamlessly with │ │
│ │ the Lutron controls specified by the architect. Alternative brands     │ │
│ │ would require additional wiring and control adapters, adding $15,000   │ │
│ │ to project cost and 3 weeks to schedule.                               │ │
│ │                                                                         │ │
│ │ Lead time: 3-4 weeks (vs 8-10 weeks for comparable alternatives)       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ ATTACHMENTS                                                                 │
│ [+ Add Files]                                                               │
│ 📎 signify-spec-sheet.pdf (2.4 MB)                                    [×]   │
│ 📎 comparison-analysis.pdf (1.1 MB)                                   [×]   │
│ 📎 warranty-info.pdf (340 KB)                                         [×]   │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ SEND TO                                                                     │
│ Contact: [Mike Johnson (Procurement)                   ▼]                   │
│ Email:   mike.johnson@turner.com                                            │
│ CC:      [engineering@turner.com                        ]                   │
│                                                                             │
│ ☐ Also send via FlowConnect message                                         │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│         [Preview PDF]  [Save Draft]  [Cancel]  [Send Request]               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Approval Request PDF Preview

The generated PDF follows a template format:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MANUFACTURER APPROVAL REQUEST                           │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ REQUEST DATE:     March 20, 2024                                            │
│ REQUEST #:        AR-2024-0047                                              │
│                                                                             │
│ FROM:             FlowConnect Rep Agency                                    │
│                   Sarah Chen, Inside Sales                                  │
│                   sarah.chen@flowconnect.com                                │
│                   (555) 123-4567                                            │
│                                                                             │
│ TO:               Turner Construction                                       │
│                   Mike Johnson, Procurement Manager                         │
│                   mike.johnson@turner.com                                   │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ PROJECT:          Downtown Medical Center                                   │
│ QUOTE #:          Q-2024-001                                                │
│                                                                             │
│ MANUFACTURER:     Signify (formerly Philips Lighting)                       │
│ CATEGORY:         LED Lighting Fixtures                                     │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ PRODUCTS REQUIRING APPROVAL:                                                │
│                                                                             │
│ │ SKU          │ Description                    │ Qty │ Unit    │ Total    ││
│ │──────────────│────────────────────────────────│─────│─────────│──────────││
│ │ SIG-100-FIX  │ Linear LED Fixture 2ft         │ 50  │ $320.00 │ $16,000  ││
│ │ SIG-200-HIGH │ High Bay LED 200W              │ 25  │ $485.00 │ $12,125  ││
│ │ SIG-CTRL-DIM │ Dimming Controller             │ 10  │ $275.00 │ $2,750   ││
│ │ SIG-SENS-OCC │ Occupancy Sensor               │ 30  │ $145.00 │ $4,350   ││
│ │ SIG-SENS-DAY │ Daylight Sensor                │ 15  │ $185.00 │ $2,775   ││
│ │──────────────│────────────────────────────────│─────│─────────│──────────││
│ │              │                         TOTAL: │ 130 │         │ $38,000  ││
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ JUSTIFICATION:                                                              │
│                                                                             │
│ Signify fixtures provide superior color rendering (CRI 95+) required        │
│ for the medical examination rooms. They also integrate seamlessly with      │
│ the Lutron controls specified by the architect. Alternative brands          │
│ would require additional wiring and control adapters, adding $15,000        │
│ to project cost and 3 weeks to schedule.                                    │
│                                                                             │
│ Lead time: 3-4 weeks (vs 8-10 weeks for comparable alternatives)            │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ ATTACHMENTS:                                                                │
│ • signify-spec-sheet.pdf                                                    │
│ • comparison-analysis.pdf                                                   │
│ • warranty-info.pdf                                                         │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ Please respond with approval status to: sarah.chen@flowconnect.com          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**v2 Enhancement**: User can drag-and-drop to customize PDF layout, add logo, modify sections.

### 6.4 Approval Request Tracking

Once a request is sent, it appears in the Approvals tab with tracking:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ PENDING APPROVAL REQUESTS                                                      │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │ Signify - AR-2024-0047                                                     │ │
│ │ Requested: Mar 18, 2024 (5 days ago)        Status: ⏳ Awaiting Response   │ │
│ │ Sent to: Mike Johnson (Procurement)                                        │ │
│ │                                                                            │ │
│ │ [View Request] [Resend] [Mark as Approved ▼] [Attach Response]            │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Mark Approval Status Modal

When rep receives response (email, call, etc.), they mark the status:

```
┌─────────────────────────────────────────────────────────────────┐
│ Update Approval Status                                     [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Manufacturer: Signify                                           │
│ Builder: Turner Construction                                    │
│                                                                 │
│ NEW STATUS:                                                     │
│ ○ Approved (full approval for all products)                     │
│ ● Approved with Conditions                                      │
│ ○ Rejected                                                      │
│                                                                 │
│ CONDITIONS (if applicable):                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Approved for SIG-100-FIX and SIG-200-HIGH only.             │ │
│ │ Other products require separate approval.                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ APPROVED BY:                                                    │
│ [Mike Johnson                                          ]        │
│                                                                 │
│ DATE APPROVED:                                                  │
│ [March 23, 2024                                        ]        │
│                                                                 │
│ ATTACH PROOF (email, document):                                 │
│ [+ Upload File]                                                 │
│ 📎 approval-email-mar23.pdf                               [×]   │
│                                                                 │
│ NOTES:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Phone call with Mike Johnson on 3/23. He confirmed the two  │ │
│ │ fixture types are approved. Will need separate request for  │ │
│ │ sensors and controllers.                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ☑ Save to builder's Approved Manufacturers List                 │
│ ☑ Apply to all future quotes for this builder                   │
│                                                                 │
│                    [Cancel]  [Save Status]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 Conditional Approval Verification

When a manufacturer has conditional approval, user can verify if line items meet conditions:

```
┌─────────────────────────────────────────────────────────────────┐
│ Verify Conditional Approval                                [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Manufacturer: Hubbell                                           │
│ Condition: "Approved only for HBL series products"              │
│                                                                 │
│ LINE ITEMS TO VERIFY:                                           │
│                                                                 │
│ ☑ HBL-4500-LED   (matches HBL series) ✓                        │
│ ☑ HBL-2000-DIM   (matches HBL series) ✓                        │
│ ☐ HUB-CTRL-100   (does NOT match) ⚠                            │
│                                                                 │
│ 2 of 3 items match the approval conditions.                     │
│ 1 item may require separate approval.                           │
│                                                                 │
│        [Request Approval for Non-Matching]  [Close]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.7 Bulk Approval Actions

Select multiple lines and mark as approved:

```
┌─────────────────────────────────────────────────────────────────┐
│ Bulk Mark as Approved                                      [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Mark 8 selected lines as approved?                              │
│                                                                 │
│ MANUFACTURERS AFFECTED:                                         │
│ • Acuity Brands (4 lines)                                       │
│ • Lutron (3 lines)                                              │
│ • Eaton (1 line)                                                │
│                                                                 │
│ ☑ Save to builder's Approved Manufacturers List                 │
│                                                                 │
│                    [Cancel]  [Mark All Approved]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Overage & Commission UI

### 7.1 Overage Toggle

- Toggle switch in line items toolbar
- When ON: Shows Sell Price, Overage %, Overage Amount columns
- When OFF: Simpler view, calculations still happen in background
- State persists with quote

### 7.2 Overage Calculation Display

On each line (when expanded or in detail view):
```
Base Price:        $245.00
Sell Price:        $275.00
─────────────────────────────
Overage Amount:    $30.00
Overage Comm (90%): $27.00
Base Comm (10%):   $24.50
─────────────────────────────
Total Commission:  $51.50
```

### 7.3 Commission Band Indicator

Small badge next to price showing current band:
- `[Band 1 - 10%]` (green) - at or above base, overage allowed
- `[Band 2 - 8%]` (yellow) - 0-10% below base
- `[Band 3 - 6%]` (orange) - 10-20% below base
- `[Band 4 - 4%]` (red) - 20%+ below base

### 7.4 Price Lookup Popup

Click price lookup icon on line:
```
┌─────────────────────────────────────────────────┐
│ Price Lookup: LX-4500-LED                  [×]  │
├─────────────────────────────────────────────────┤
│ Manufacturer: Acuity Brands                     │
│ Approval Status: 🟢 Approved (Jun 2023)         │
│                                                 │
│ COMMISSION BANDS                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Band │ Price      │ Rate │ Overage │        │ │
│ │──────│────────────│──────│─────────│────────│ │
│ │ ● 1  │ ≥ $245.00  │ 10%  │ ✓ Yes   │ [Use]  │ │
│ │   2  │ $220-$245  │  8%  │ ✗ No    │ [Use]  │ │
│ │   3  │ $196-$220  │  6%  │ ✗ No    │ [Use]  │ │
│ │   4  │ < $196     │  4%  │ ✗ No    │ [Use]  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Current: Band 1 (Sell $275.00 ≥ Base $245.00)   │
└─────────────────────────────────────────────────┘
```

---

## 8. Multi-Level Pricing UI

### 8.1 Price Level Columns

Always visible in line items table:
- Sell (distributor cost)
- L1 (typically +10%)
- L2 (custom)
- L3 (custom)

Each cell editable, or use bulk transform.

### 8.2 Copy Price Modal

```
┌─────────────────────────────────────────────────┐
│ Copy Sell to Level 1                       [×]  │
├─────────────────────────────────────────────────┤
│ Apply to: ○ All lines  ● Selected (8 lines)    │
│                                                 │
│ Markup: [+10   ]%                               │
│                                                 │
│ Preview:                                        │
│ Sell Total:  $2,450,000                         │
│ L1 Total:    $2,695,000 (after +10%)            │
│                                                 │
│ ⚠ 3 lines skipped (locked)                     │
│                                                 │
│               [Cancel]  [Apply]                 │
└─────────────────────────────────────────────────┘
```

### 8.3 Price Levels Summary Panel

In right sidebar:
```
┌────────────────────────────────────┐
│ PRICE LEVELS                       │
├────────────────────────────────────┤
│ Level    │ Total       │ Recipients│
│──────────│─────────────│───────────│
│ Sell     │ $2,450,000  │ Graybar   │
│ Level 1  │ $2,695,000  │ HD Supply │
│ Level 2  │ $2,817,500  │ —         │
│ Level 3  │ $2,940,000  │ —         │
└────────────────────────────────────┘
```

---

## 9. Predictive Pricing & Sparklines

### 9.1 Win Probability Badge

In quote header:
```
[72% Win ▲]  ← Green background, up arrow = improving
[45% Win ─]  ← Yellow background, flat
[28% Win ▼]  ← Red background, down arrow = declining
```

**Hover Tooltip**:
```
┌─────────────────────────────────────┐
│ Win Probability: 72%                │
├─────────────────────────────────────┤
│ Key Factors:                        │
│ ✓ Price 5% below avg won quotes     │
│ ✓ Strong history with customer      │
│ ✓ Preferred manufacturer            │
│ ✓ All manufacturers approved        │  ← NEW
│ ⚠ 2 competitors on this job        │
│                                     │
│ Similar quotes won: 8 of 11 (73%)   │
└─────────────────────────────────────┘
```

**Approval Impact on Win Probability**:
- All approved: +5% to probability
- Pending approvals: No change
- Rejected manufacturers: -15% to probability (major red flag)

### 9.2 Probability Sensitivity Panel

Expandable section in sidebar or modal:
```
┌─────────────────────────────────────────────────┐
│ PRICE SENSITIVITY                               │
├─────────────────────────────────────────────────┤
│                                                 │
│ Win %  │████████████████░░░░│ 72%              │
│        │        ▲ Current                       │
│                                                 │
│ Price        Win %    Expected Value            │
│ $2,200,000   89%      $1,958,000               │
│ $2,450,000   72%      $1,764,000  ← Current    │
│ $2,700,000   51%      $1,377,000               │
│ $2,950,000   34%      $1,003,000               │
│                                                 │
│ Optimal: $2,280,000 (EV: $1,982,000)  [Apply]  │
└─────────────────────────────────────────────────┘
```

### 9.3 Price History Sparkline

Mini chart in line item row (80px wide):
```
│ ... │ $275 │ ▁▂▃▄▅▆▅▄▅▆▅▄ │ ⋮ │
                  ↑ 12-month sparkline
```

**Hover shows popup**:
```
┌─────────────────────────────────────────────────┐
│ Price History: LX-4500-LED                      │
├─────────────────────────────────────────────────┤
│     $260 ┤         ╭─╮                          │
│          │      ╭──╯ ╰──╮                       │
│     $240 ┤   ╭──╯       ╰──● Current: $245     │
│          │╭──╯                                  │
│     $220 ┼──────────────────────────────────    │
│          Mar  May  Jul  Sep  Nov  Jan           │
│                                                 │
│ 12-mo change: +$25 (+11.4%)                     │
│ Min: $220  Max: $252  Avg: $238                 │
└─────────────────────────────────────────────────┘
```

---

## 10. Sections & Grouping

### 10.1 Add Section

Click "+ Add Section" button:
```
┌─────────────────────────────────────┐
│ New Section                    [×]  │
├─────────────────────────────────────┤
│ Section Name: [Lobby Lighting    ]  │
│                                     │
│         [Cancel]  [Create]          │
└─────────────────────────────────────┘
```

### 10.2 Section Display

```
┌─────────────────────────────────────────────────────────────────┐
│ ▼ LOBBY LIGHTING                              Subtotal: $425K   │
│   12 items │ Commission: $52K │ [⚠ 1 Approval Needed]    [⋮]   │
├─────────────────────────────────────────────────────────────────┤
│ [drag] ☐ LX-4500-LED    Acuity   🟢    Memorial   150   $245...│
│ [drag] ☐ PLX-200-DIM    Lutron   🔴    Memorial    75   $185...│
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ▶ CORRIDOR LIGHTING (collapsed)   [✓ All Approved]  Subtotal: $180K │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Section Actions Menu

```
┌────────────────────────┐
│ Rename Section         │
│ ─────────────────────  │
│ Collapse All           │
│ Expand All             │
│ ─────────────────────  │
│ Move Up                │
│ Move Down              │
│ ─────────────────────  │
│ Request All Approvals  │  ← NEW
│ ─────────────────────  │
│ Delete Section         │
│ (moves items to top)   │
└────────────────────────┘
```

### 10.4 Auto-Group by Manufacturer

Button in toolbar: "Group by Manufacturer"

Creates sections automatically:
- Acuity Brands (45 items) [✓ Approved]
- Eaton Lighting (23 items) [✓ Approved]
- Signify (18 items) [⚠ Needs Approval]

---

## 11. Recipients & Batch Send

### 11.1 Recipients Tab

```
┌─────────────────────────────────────────────────────────────────────────┐
│ RECIPIENTS                                           [+ Add Recipient]  │
├─────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Company        │ Contact          │ Email              │ Level │ Sent      │
│───│────────────────│──────────────────│────────────────────│───────│───────────│
│ ☐ │ Graybar        │ John Smith       │ john@graybar.com   │ Sell  │ Mar 15    │
│ ☐ │ HD Supply      │ Sarah Lee        │ sarah@hdsupply.com │ L1    │ —         │
│ ☐ │ Turner Const.  │ Mike Johnson     │ mike@turner.com    │ Sell  │ Mar 15    │
│ ☐ │ Echo Electric  │ Amy Wong         │ amy@echo.com       │ L1    │ —         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Send Quote Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Send Quote                                                 [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ⚠ APPROVAL WARNING                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 2 manufacturers on this quote need approval from Turner:    │ │
│ │ • Signify (5 lines, $38,000)                                │ │
│ │ • Legrand (2 lines, $18,500)                                │ │
│ │                                                             │ │
│ │ [Request Approvals Now]  or  [Send Anyway (Not Recommended)]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ Select recipients:                                              │
│                                                                 │
│ ☑ Graybar - John Smith (Sell: $2,450,000)                      │
│ ☑ HD Supply - Sarah Lee (L1: $2,695,000)                       │
│ ☐ Turner Const. - Mike Johnson (Sell: $2,450,000) ← already sent│
│ ☑ Echo Electric - Amy Wong (L1: $2,695,000)                    │
│                                                                 │
│ ... rest of send modal ...                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 11.3 PDF Preview

Modal showing rendered PDF with correct price level for selected recipient.

---

## 12. Internal Notes

### 12.1 Notes Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ INTERNAL NOTES                                    [+ Add Note]  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔔 APPROVAL UPDATE • Mar 23, 2024 at 3:15 PM               │ │
│ │                                                             │ │
│ │ Signify approved (conditional) by Mike Johnson.             │ │
│ │ Only SIG-100-FIX and SIG-200-HIGH approved.                 │ │
│ │ 📎 approval-email-mar23.pdf                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Sarah Chen • Mar 20, 2024 at 2:34 PM                        │ │
│ │                                                             │ │
│ │ Customer asked for 5% discount on corridor fixtures.        │ │
│ │ Applied 4% - need manager approval for more.                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔔 APPROVAL SENT • Mar 18, 2024 at 10:00 AM                 │ │
│ │                                                             │ │
│ │ Approval request sent to Turner Construction for:           │ │
│ │ • Signify (5 products, $38,000)                             │ │
│ │ Sent to: Mike Johnson (mike.johnson@turner.com)             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Approval events auto-generate notes** for audit trail.

### 12.2 Add Note Modal

```
┌─────────────────────────────────────┐
│ Add Internal Note              [×]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [Cancel]  [Save Note]       │
└─────────────────────────────────────┘
```

---

## 13. Versioning UI

### 13.1 Version Indicator

In header: `[v3]` badge

Click to show version dropdown:
```
┌────────────────────────────────────┐
│ VERSION HISTORY                    │
├────────────────────────────────────┤
│ ● v3 (current) - Mar 20, 2024      │
│   Sarah Chen - Price adjustments   │
│   Approvals: 🟡 2 pending          │
│                                    │
│ ○ v2 - Mar 18, 2024                │
│   Mike Torres - Added fixtures     │
│   Approvals: 🔴 4 needed           │
│                                    │
│ ○ v1 - Mar 15, 2024                │
│   Sarah Chen - Initial quote       │
│   Approvals: 🔴 5 needed           │
│                                    │
│ ───────────────────────────────────│
│ [Compare Versions]                 │
└────────────────────────────────────┘
```

### 13.2 Version Compare View

Side-by-side diff of two versions showing:
- Added lines (green)
- Removed lines (red)
- Changed prices (yellow highlight)
- **Approval status changes**

### 13.3 Create Revision

"Create Revision" button → Creates v4, copies current state, allows editing.

---

## 14. Builder Approved Manufacturers List

### 14.1 Access Points

Access the builder's approved manufacturers list from:
1. Company detail page → "Approved Manufacturers" tab
2. Quote detail → Customer section → "View Approved Mfrs List" link
3. Quote detail → Approvals tab → "Manage Builder List" button

### 14.2 Builder Approvals List View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ APPROVED MANUFACTURERS - Turner Construction                                    │
│                                                            [+ Add Manufacturer] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Filter: [All Statuses ▼] [All Categories ▼]  Search: [                    🔍]  │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Status │ Manufacturer   │ Category  │ Conditions       │ Approved   │ Docs  │ │
│ │────────│────────────────│───────────│──────────────────│────────────│───────│ │
│ │ 🟢     │ Acuity Brands  │ Lighting  │ All products     │ Jun 2023   │ 📎    │ │
│ │ 🟢     │ Eaton          │ Electrical│ All products     │ Mar 2024   │ 📎    │ │
│ │ 🟢     │ Kohler         │ Plumbing  │ All products     │ Jan 2023   │ 📎    │ │
│ │ 🟡     │ Lutron         │ Controls  │ RadioRA 3 only   │ Jan 2024   │ 📎    │ │
│ │ 🟡     │ Hubbell        │ Lighting  │ HBL series only  │ Feb 2024   │ 📎    │ │
│ │ 🔴     │ Signify        │ Lighting  │ —                │ Rejected   │ —     │ │
│ │ ⚪     │ Legrand        │ Controls  │ —                │ Unknown    │ —     │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Showing 7 of 45 manufacturers                              [Load More]          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 14.3 Add/Edit Manufacturer Approval

```
┌─────────────────────────────────────────────────────────────────┐
│ Add Manufacturer Approval                                  [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ BUILDER                                                         │
│ Turner Construction                                             │
│                                                                 │
│ MANUFACTURER                                                    │
│ [Search manufacturers...                               ▼]       │
│                                                                 │
│ CATEGORY                                                        │
│ [Lighting                                              ▼]       │
│                                                                 │
│ STATUS                                                          │
│ ○ Approved (all products)                                       │
│ ● Approved with Conditions                                      │
│ ○ Not Approved                                                  │
│                                                                 │
│ CONDITIONS (if applicable):                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Only HBL series products approved. Other lines require      │ │
│ │ separate approval request.                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ SPECIFIC SKUS (optional - leave blank for all):                 │
│ [HBL-4500, HBL-2000, HBL-3000                          ]        │
│                                                                 │
│ APPROVED BY:                                                    │
│ [Mike Johnson (Procurement)                            ]        │
│                                                                 │
│ APPROVAL DATE:                                                  │
│ [February 15, 2024                                     ]        │
│                                                                 │
│ EXPIRATION DATE (optional):                                     │
│ [                                                      ]        │
│                                                                 │
│ DOCUMENTATION:                                                  │
│ [+ Upload File]                                                 │
│ 📎 hubbell-approval-email.pdf                             [×]   │
│                                                                 │
│ NOTES:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Approved via email from Mike Johnson on 2/15/24.            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                    [Cancel]  [Save Approval]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 14.4 Approval Memory Across Projects

When a manufacturer is approved for a builder, the system remembers:

```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ Manufacturer Previously Approved                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Acuity Brands is approved for Turner Construction               │
│                                                                 │
│ Approved: June 15, 2023                                         │
│ Scope: All lighting products                                    │
│ Approved by: John Smith (Procurement)                           │
│                                                                 │
│ Previously used on:                                             │
│ • Q-2024-001 - Downtown Medical Center ($245K)                  │
│ • Q-2023-089 - Riverside Office Tower ($180K)                   │
│ • Q-2023-052 - Metro Transit Hub ($320K)                        │
│                                                                 │
│ [View Full Approval Details]                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. Approvals Reporting

### 15.1 Approvals Dashboard Widget

On main dashboard or quotes dashboard:

```
┌────────────────────────────────────────────────────────────────┐
│ APPROVAL STATUS                                    [View All →]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Pending Requests: 8                                            │
│ ████████████████████░░░░░░░░░░░░░░░░                          │
│                                                                │
│ Avg Response Time: 4.2 days                                    │
│                                                                │
│ This Month:                                                    │
│ ✓ Approved: 12    ⚠ Conditional: 5    ✗ Rejected: 2           │
│                                                                │
│ QUOTES BLOCKED BY APPROVALS                                    │
│ • Q-2024-015 - Mercy Hospital ($1.2M) - 3 pending              │
│ • Q-2024-012 - City Hall Renovation ($450K) - 1 pending        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 15.2 Approvals Report

Detailed report accessible from Analytics:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ MANUFACTURER APPROVALS REPORT                                                   │
│ Date Range: [Last 90 Days ▼]    Builder: [All ▼]    Manufacturer: [All ▼]      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ SUMMARY                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │ Total Requests: 47  │ Approved: 32 (68%)  │ Conditional: 8  │ Rejected: 7 │   │
│ │ Avg Turnaround: 4.2 days  │ Quotes Delayed: 12  │ Revenue Impact: $2.3M   │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ MANUFACTURERS REQUIRING MOST APPROVALS                                          │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │ Manufacturer   │ Requests │ Approved │ Rejected │ Avg Days │ Success %   │   │
│ │────────────────│──────────│──────────│──────────│──────────│─────────────│   │
│ │ Signify        │ 12       │ 8        │ 2        │ 5.1      │ 67%         │   │
│ │ Lutron         │ 9        │ 7        │ 1        │ 3.2      │ 78%         │   │
│ │ Legrand        │ 8        │ 4        │ 3        │ 6.8      │ 50%         │   │
│ │ Hubbell        │ 6        │ 5        │ 0        │ 2.9      │ 83%         │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ BUILDERS WITH HIGHEST REJECTION RATES                                           │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │ Builder              │ Requests │ Rejected │ Rejection Rate │ Top Reason  │   │
│ │──────────────────────│──────────│──────────│────────────────│─────────────│   │
│ │ Lennar Homes         │ 15       │ 5        │ 33%            │ Brand std   │   │
│ │ D.R. Horton          │ 12       │ 3        │ 25%            │ No history  │   │
│ │ Turner Construction  │ 20       │ 2        │ 10%            │ Spec issue  │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ QUOTES DELAYED DUE TO APPROVALS                                                 │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │ Quote           │ Builder        │ Value    │ Days Delayed │ Status      │   │
│ │─────────────────│────────────────│──────────│──────────────│─────────────│   │
│ │ Q-2024-015      │ Mercy Health   │ $1.2M    │ 8            │ Pending     │   │
│ │ Q-2024-012      │ City of Austin │ $450K    │ 5            │ Pending     │   │
│ │ Q-2024-008      │ Lennar Homes   │ $280K    │ 12           │ Resolved    │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ [Export Report]                                                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Distributor-Specific Quotes

This feature allows generating versioned quotes tailored to specific distributors, with automatic pricing based on distributor-manufacturer relationships and product cross-referencing when needed.

### 16.1 Manufacturer List Admin

Admin screen to manage manufacturers with domain-based identification.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ MANUFACTURER LIST                                    [+ Add Manufacturer]       │
│                                                      [Upload CSV]               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Search: [                                                              🔍]     │
│ Filter: [All ▼] [Active Only ☑]                                                │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Manufacturer Name    │ Domain              │ Active │ Actions               │ │
│ │──────────────────────│─────────────────────│────────│───────────────────────│ │
│ │ A.O. Smith           │ aosmith.com         │ ✓      │ [Edit] [Deactivate]   │ │
│ │ Rheem                │ rheem.com           │ ✓      │ [Edit] [Deactivate]   │ │
│ │ Bradford White       │ bradfordwhite.com   │ ✓      │ [Edit] [Deactivate]   │ │
│ │ Watts Water          │ watts.com           │ ✓      │ [Edit] [Deactivate]   │ │
│ │ Moen                 │ moen.com            │ ✓      │ [Edit] [Deactivate]   │ │
│ │ Kohler               │ kohler.com          │ ✗      │ [Edit] [Activate]     │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Showing 6 of 42 manufacturers                                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Add/Edit Manufacturer Modal**:
```
┌─────────────────────────────────────────────────────────┐
│ Add Manufacturer                                   [×]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Manufacturer Name:                                      │
│ [A.O. Smith                                      ]      │
│                                                         │
│ Domain (unique key):                                    │
│ [aosmith.com                                     ]      │
│ ⓘ Used as canonical key across all systems             │
│                                                         │
│ Active:                                                 │
│ [✓] Manufacturer is active                              │
│                                                         │
│                    [Cancel]  [Save]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**CSV Upload Format**:
```
manufacturer_name,domain,active
A.O. Smith,aosmith.com,true
Rheem,rheem.com,true
Bradford White,bradfordwhite.com,true
```

**Validation**:
- Domain must be unique
- Domain must be valid format (e.g., `example.com`)
- Reject duplicates on upload

---

### 16.2 Price Category Configuration

Global library of price categories with manufacturer-specific overrides.

**Price Category Library**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PRICE CATEGORY LIBRARY                                   [+ Add Category]       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Category Name   │ Description                      │ Default Discount │ ⋮   │ │
│ │─────────────────│──────────────────────────────────│──────────────────│─────│ │
│ │ Stocking        │ Products stocked in warehouse    │ 25%              │ [⋮] │ │
│ │ Buy-Sell        │ Direct ship from manufacturer    │ 18%              │ [⋮] │ │
│ │ Non-Stocking    │ Special order products           │ 10%              │ [⋮] │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Manufacturer-Specific Overrides**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ MANUFACTURER PRICE OVERRIDES                                                    │
│ Filter by Manufacturer: [All ▼]                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ▼ aosmith.com (A.O. Smith)                                                  │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Category        │ Discount % │ Default │                                │ │ │
│ │ │─────────────────│────────────│─────────│                                │ │ │
│ │ │ Stocking        │ [25  ]%    │ 25%     │ ← matches default              │ │ │
│ │ │ Buy-Sell        │ [18  ]%    │ 18%     │ ← matches default              │ │ │
│ │ │ Non-Stocking    │ [10  ]%    │ 10%     │ ← matches default              │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ▼ rheem.com (Rheem)                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Category        │ Discount % │ Default │                                │ │ │
│ │ │─────────────────│────────────│─────────│                                │ │ │
│ │ │ Stocking        │ [22  ]%    │ 25%     │ ⚠ override                     │ │ │
│ │ │ Buy-Sell        │ [15  ]%    │ 18%     │ ⚠ override                     │ │ │
│ │ │ Non-Stocking    │ [8   ]%    │ 10%     │ ⚠ override                     │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Inline Editing**:
- Click discount % to edit
- Tab between cells
- Changes save automatically
- Warning icon if different from default

---

### 16.3 Distributor ↔ Manufacturer Matrix

Defines which distributors carry which manufacturers and at what price category.

**Matrix Editor View**:
```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ DISTRIBUTOR ↔ MANUFACTURER MATRIX                           [Upload CSV] [Export Matrix]   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│ Quick Fill: [Select Category ▼] [Apply to Selected]                                        │
│                                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Distributor ↓   │ aosmith.com │ rheem.com │ bradford │ watts.com │ moen.com │ kohler   │ │
│ │ Manufacturer →  │             │           │ white.com│           │          │ .com     │ │
│ │─────────────────│─────────────│───────────│──────────│───────────│──────────│──────────│ │
│ │ graybar.com     │ [Stocking▼] │ [Buy-Sell]│ [—     ] │ [Stocking]│ [—     ] │ [—     ] │ │
│ │ hdsupply.com    │ [Buy-Sell ] │ [—      ] │ [—     ] │ [—      ] │ [Stocking]│ [Buy-Sel]│ │
│ │ fergusons.com   │ [—        ] │ [Non-Stk] │ [Stocking│ [Buy-Sell]│ [Stocking]│ [—     ] │ │
│ │ winsupply.com   │ [Stocking ] │ [Stocking]│ [—     ] │ [Stocking]│ [—      ] │ [Stocking│ │
│ │ johnstone.com   │ [—        ] │ [Buy-Sell]│ [Buy-Sell│ [—      ] │ [—      ] │ [—     ] │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│ Legend: [Stocking] = Full stocking  [Buy-Sell] = Direct ship  [Non-Stk] = Special order    │
│         [—] = Not authorized / No relationship                                              │
│                                                                                             │
│ Keyboard: ↑↓←→ Navigate  |  Enter = Edit  |  S = Stocking  |  B = Buy-Sell  |  N = Non-Stk │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Features**:
- Click cell to select price category from dropdown
- Keyboard shortcuts for speed (S, B, N, - to clear)
- Arrow keys to navigate
- Multi-select cells for bulk fill
- [—] means no relationship (not in matrix)

**CSV Upload Format**:
```
distributor_domain,manufacturer_domain,price_category
graybar.com,aosmith.com,Stocking
graybar.com,rheem.com,Buy-Sell
hdsupply.com,moen.com,Stocking
```

**Validation**:
- Both domains must exist in their respective lists
- Price category must exist in library
- Duplicates update existing entries

**Distributor Profile Integration**:
Matrix also appears in each distributor's company profile for quick reference/edit.

---

### 16.4 Non-Competitive Cross Reference Upload

Separate screen for uploading cross-references between represented manufacturers.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ NON-COMPETITIVE CROSS REFERENCES                         [Upload CSV] [Export]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Search: [                    🔍]   Filter by Mfr: [All ▼]                       │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Source Mfr        │ Source SKU   │ Target Mfr       │ Target SKU  │ Conf │ ⋮│ │
│ │───────────────────│──────────────│──────────────────│─────────────│──────│──│ │
│ │ aosmith.com       │ AOS-WH-50G   │ rheem.com        │ RH-50G-PRO  │ 95%  │[⋮]│
│ │ aosmith.com       │ AOS-WH-40G   │ bradfordwhite.com│ BW-40G-NG   │ 92%  │[⋮]│
│ │ moen.com          │ MOEN-8200    │ watts.com        │ WATTS-LF25  │ 88%  │[⋮]│
│ │ rheem.com         │ RH-TL-80     │ aosmith.com      │ AOS-TL-80G  │ 94%  │[⋮]│
│ │ watts.com         │ WATTS-PRV50  │ moen.com         │ MOEN-PRV50  │ 91%  │[⋮]│
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Showing 5 of 234 cross references                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Add/Edit Cross Reference Modal**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Add Cross Reference                                                [×]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ SOURCE PRODUCT                                                          │
│ Manufacturer: [aosmith.com                                    ▼]        │
│ SKU:          [AOS-WH-50G                                      ]        │
│                                                                         │
│ TARGET PRODUCT (Cross To)                                               │
│ Manufacturer: [rheem.com                                      ▼]        │
│ SKU:          [RH-50G-PRO                                      ]        │
│                                                                         │
│ Confidence:   [95  ]%  (optional)                                       │
│                                                                         │
│ Notes:                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Equivalent 50-gallon water heater, same BTU output                  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                              [Cancel]  [Save Cross]                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**CSV Upload Format**:
```
source_manufacturer_domain,source_sku,target_manufacturer_domain,target_sku,confidence,notes
aosmith.com,AOS-WH-50G,rheem.com,RH-50G-PRO,0.95,Equivalent 50-gallon water heater
aosmith.com,AOS-WH-40G,bradfordwhite.com,BW-40G-NG,0.92,Comparable 40-gallon natural gas unit
```

**Validation**:
- Both manufacturer domains must exist in manufacturer list
- Both must be represented (active) manufacturers
- SKU format validation

---

### 16.5 Generate Distributor-Specific Quotes

Main workflow for creating distributor-versioned quotes from a base quote.

**Trigger Button in Quote Detail**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Q-2024-001: Downtown Medical Center - Plumbing Package                    [v3]  │
│                                                                                 │
│ [Save] [Send Quote ▼] [Create Revision] [Generate Distributor Quotes] [⋮ More] │
│                                                       └── NEW BUTTON            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Select Distributors Modal**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Generate Distributor-Specific Quotes                                       [×]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Select distributors to generate quotes for:                                     │
│ (Only showing distributors with active matrix entries)                          │
│                                                                                 │
│ ☑ Select All                                                                    │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ☑ │ Distributor      │ Mfrs Covered │ Est. Discount │ Lines Needing Cross  │ │
│ │───│──────────────────│──────────────│───────────────│──────────────────────│ │
│ │ ☑ │ graybar.com      │ 4 of 6       │ ~22%          │ 3                    │ │
│ │ ☑ │ hdsupply.com     │ 3 of 6       │ ~18%          │ 5                    │ │
│ │ ☑ │ fergusons.com    │ 5 of 6       │ ~24%          │ 1                    │ │
│ │ ☐ │ winsupply.com    │ 4 of 6       │ ~20%          │ 4                    │ │
│ │ ☐ │ johnstone.com    │ 2 of 6       │ ~15%          │ 8                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ 3 distributors selected                                                         │
│                                                                                 │
│                    [Cancel]  [Generate 3 Distributor Quotes]                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Generation Summary Modal** (after generation):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Distributor Quotes Generated                                               [×]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ✓ Successfully created 3 distributor-specific quotes                           │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Distributor     │ Status          │ Lines OK │ Needs Cross │ Discount      │ │
│ │─────────────────│─────────────────│──────────│─────────────│───────────────│ │
│ │ graybar.com     │ ⚠ Requires Cross│ 22       │ 3           │ $50,000 (20%) │ │
│ │ hdsupply.com    │ ⚠ Requires Cross│ 20       │ 5           │ $36,750 (15%) │ │
│ │ fergusons.com   │ ⚠ Requires Cross│ 24       │ 1           │ $58,800 (24%) │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ PRICE CATEGORIES APPLIED:                                                       │
│ • Stocking: 45 lines (avg 25% discount)                                         │
│ • Buy-Sell: 18 lines (avg 17% discount)                                         │
│ • Non-Stocking: 3 lines (avg 10% discount)                                      │
│                                                                                 │
│ PENDING CROSSES: 9 lines across 3 quotes                                        │
│ These lines are flagged for cross-reference before sending.                     │
│                                                                                 │
│ All activity logged to audit table.                                             │
│                                                                                 │
│                    [View Distributor Quotes]  [Close]                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 16.6 Distributor Quote Child Records

Distributor quotes appear as child records under the base quote.

**Base Quote Detail - Distributor Quotes Tab**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Line Items] [Approvals] [Distributor Quotes (3)] [Recipients] [Notes] [History]│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ DISTRIBUTOR-SPECIFIC QUOTES                        [+ Generate More]            │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌───────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ graybar.com (Graybar Electric)                                        │   │ │
│ │ │ Status: [⚠ Requires Cross - 3 lines]                                  │   │ │
│ │ │                                                                       │   │ │
│ │ │ Original: $245,000    Discounted: $195,000    Discount: $50,000 (20%) │   │ │
│ │ │ Lines: 25 total │ 22 approved │ 3 need cross                          │   │ │
│ │ │                                                                       │   │ │
│ │ │ [View Quote] [Resolve Crosses] [Audit Log]                            │   │ │
│ │ └───────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                             │ │
│ │ ┌───────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ hdsupply.com (HD Supply)                                              │   │ │
│ │ │ Status: [⚠ Requires Cross - 5 lines]                                  │   │ │
│ │ │                                                                       │   │ │
│ │ │ Original: $245,000    Discounted: $208,250    Discount: $36,750 (15%) │   │ │
│ │ │ Lines: 25 total │ 20 approved │ 5 need cross                          │   │ │
│ │ │                                                                       │   │ │
│ │ │ [View Quote] [Resolve Crosses] [Audit Log]                            │   │ │
│ │ └───────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                             │ │
│ │ ┌───────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ fergusons.com (Ferguson Enterprises)                                  │   │ │
│ │ │ Status: [✓ Ready to Send]                                             │   │ │
│ │ │                                                                       │   │ │
│ │ │ Original: $245,000    Discounted: $186,200    Discount: $58,800 (24%) │   │ │
│ │ │ Lines: 25 total │ 25 approved │ 0 need cross                          │   │ │
│ │ │                                                                       │   │ │
│ │ │ [View Quote] [Send to Distributor] [Audit Log]                        │   │ │
│ │ └───────────────────────────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Status Badges**:
- `[Draft]` - Just generated, pricing applied
- `[⚠ Requires Cross - N lines]` - Yellow - Some lines need cross-reference
- `[✓ Ready to Send]` - Green - All lines resolved
- `[Sent]` - Blue - Quote sent to distributor

---

### 16.7 Human-in-the-Loop Cross Resolution

For lines where the distributor doesn't carry the manufacturer, user must cross to an alternative.

**Distributor Quote Line Items View**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DISTRIBUTOR QUOTE: graybar.com                                                  │
│ Base Quote: Q-2024-001                                       Status: Requires Cross │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ [Non-Competitive Cross (Manual)] [Bulk Non-Competitive Cross (Auto)] [Audit Log]│
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Status │ Original SKU     │ Original Mfr  │ Final SKU   │ Final Mfr   │ Price│ │
│ │────────│──────────────────│───────────────│─────────────│─────────────│──────│ │
│ │ ✓      │ AOS-WH-50G       │ aosmith.com   │ AOS-WH-50G  │ aosmith.com │ $363 │ │
│ │ ✓      │ AOS-WH-40G       │ aosmith.com   │ AOS-WH-40G  │ aosmith.com │ $318 │ │
│ │ ✓      │ WATTS-PRV50      │ watts.com     │ WATTS-PRV50 │ watts.com   │ $142 │ │
│ │ ⚠ Cross│ BW-40G-NG        │ bradfordwhite │ [Select →]  │ —           │ —    │ │
│ │ ⚠ Cross│ BW-TL-80         │ bradfordwhite │ [Select →]  │ —           │ —    │ │
│ │ ⚠ Cross│ MOEN-8200        │ moen.com      │ [Select →]  │ —           │ —    │ │
│ │ ✓      │ RH-50G-PRO       │ rheem.com     │ RH-50G-PRO  │ rheem.com   │ $398 │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ 22 lines approved  │  3 lines require cross                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Manual Cross Modal** (per line):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Cross Reference: BW-40G-NG                                                 [×]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ORIGINAL PRODUCT                                                                │
│ Manufacturer: Bradford White (bradfordwhite.com)                                │
│ SKU: BW-40G-NG                                                                  │
│ Description: 40 Gallon Natural Gas Water Heater                                 │
│ Original Price: $425.00                                                         │
│                                                                                 │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ SELECT REPLACEMENT (distributors authorized manufacturers only)                 │
│                                                                                 │
│ MATCHES FROM CROSS REFERENCE TABLE:                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ○ │ rheem.com │ RH-40G-PRO │ 40G NG Water Heater │ 92% match │ $398 → $326 │ │
│ │ ○ │ aosmith.com│ AOS-WH-40G │ 40G NG Water Heater│ 88% match │ $410 → $307 │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ OR ENTER CUSTOM CROSS:                                                          │
│ Manufacturer: [Select authorized manufacturer      ▼]                           │
│ SKU:          [                                     ]                           │
│                                                                                 │
│ OR:  [Mark as Intentional Omission]                                             │
│      (Line will be excluded from quote)                                         │
│                                                                                 │
│                              [Cancel]  [Apply Cross]                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Bulk Auto-Cross Modal**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Bulk Non-Competitive Cross                                                 [×]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Searching for cross references for 3 products...                                │
│                                                                                 │
│ ████████████████████████░░░░░░░░░░░░ 67%                                       │
│                                                                                 │
│ MATCHES FOUND:                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ☑ │ Original          │ Cross To            │ Confidence │ Source │ Price  │ │
│ │───│───────────────────│─────────────────────│────────────│────────│────────│ │
│ │ ☑ │ BW-40G-NG         │ RH-40G-PRO (rheem)  │ 92%        │ Upload │ $326   │ │
│ │ ☑ │ BW-TL-80          │ AOS-TL-80G (aosmith)│ 89%        │ AI     │ $485   │ │
│ │ ☐ │ MOEN-8200         │ No match found      │ —          │ —      │ —      │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ 2 of 3 products have matches                                                    │
│ 1 product requires manual cross or omission                                     │
│                                                                                 │
│ SIDE-BY-SIDE COMPARISON (click row to expand):                                  │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ BW-40G-NG vs RH-40G-PRO                                                     │ │
│ │ ┌─────────────────────────┬─────────────────────────┐                       │ │
│ │ │ Bradford White          │ Rheem                   │                       │ │
│ │ │ 40 Gallon               │ 40 Gallon               │ ✓                     │ │
│ │ │ Natural Gas             │ Natural Gas             │ ✓                     │ │
│ │ │ 40,000 BTU              │ 40,000 BTU              │ ✓                     │ │
│ │ │ 0.62 UEF                │ 0.65 UEF                │ ≈                     │ │
│ │ │ 6 Year Warranty         │ 6 Year Warranty         │ ✓                     │ │
│ │ └─────────────────────────┴─────────────────────────┘                       │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│                    [Cancel]  [Apply 2 Selected Crosses]                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**AI Cross Search**:
- If no match in uploaded cross reference table
- System searches online spec data (simulated in mockup)
- Returns matches from represented manufacturers only
- Shows confidence score and side-by-side comparison
- User approves/rejects

---

### 16.8 Quote State Transitions

**States**:
1. **Draft** - Just generated, matrix pricing applied
2. **Requires Cross** - One or more lines need cross-reference
3. **Ready to Send** - All lines approved or crossed
4. **Sent** - Quote emailed to distributor

**Automatic Transition**:
- When all "Requires Cross" lines are resolved → auto-moves to "Ready to Send"
- Send button disabled until Ready to Send
- User can re-run cross process anytime before sending

---

### 16.9 Cross and Pricing Audit Log

Every action is logged for compliance and troubleshooting.

**Audit Log View** (per distributor quote):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ AUDIT LOG: graybar.com Quote                                        [Export CSV]│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Timestamp           │ Action                │ Details                  │ User│ │
│ │─────────────────────│───────────────────────│──────────────────────────│─────│ │
│ │ Mar 20, 2:30 PM     │ Quote Generated       │ 25 lines, $195K total    │ SC  │ │
│ │ Mar 20, 2:30 PM     │ Pricing Applied       │ aosmith.com → Stocking 25%│ Sys│ │
│ │ Mar 20, 2:30 PM     │ Pricing Applied       │ rheem.com → Buy-Sell 15% │ Sys │ │
│ │ Mar 20, 2:30 PM     │ Cross Flagged         │ BW-40G-NG → Requires Cross│ Sys│ │
│ │ Mar 20, 2:30 PM     │ Cross Flagged         │ BW-TL-80 → Requires Cross│ Sys │ │
│ │ Mar 20, 2:30 PM     │ Cross Flagged         │ MOEN-8200 → Requires Cross│ Sys│ │
│ │ Mar 20, 2:45 PM     │ Cross Applied         │ BW-40G-NG → RH-40G-PRO   │ SC  │ │
│ │                     │                       │ Source: Upload, 92% conf │     │ │
│ │ Mar 20, 2:46 PM     │ Cross Applied         │ BW-TL-80 → AOS-TL-80G    │ SC  │ │
│ │                     │                       │ Source: AI, 89% conf     │     │ │
│ │ Mar 20, 2:48 PM     │ Line Omitted          │ MOEN-8200 (intentional)  │ SC  │ │
│ │ Mar 20, 2:48 PM     │ Status Changed        │ → Ready to Send          │ Sys │ │
│ │ Mar 20, 3:15 PM     │ Quote Sent            │ To: john@graybar.com     │ SC  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ SC = Sarah Chen  |  Sys = System                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Fields Logged**:
- timestamp
- base_quote_id
- distributor_domain
- manufacturer_domain(s)
- sku_before → sku_after
- price_category applied
- discount_percent
- cross_source (upload vs AI)
- user_approved (boolean)

---

### 16.10 Send Distributor Quote

Once Ready to Send, user can email the distributor-specific PDF.

**Send Modal**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Send Distributor Quote                                                     [×]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ DISTRIBUTOR: Graybar Electric (graybar.com)                                     │
│ QUOTE: DQ-001 (based on Q-2024-001)                                             │
│ TOTAL: $195,000 (20% discount from base)                                        │
│                                                                                 │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ SEND TO:                                                                        │
│ Contact: [John Smith (Purchasing)                     ▼]                        │
│ Email:   john.smith@graybar.com                                                 │
│ CC:      [orders@graybar.com                           ]                        │
│                                                                                 │
│ Subject:                                                                        │
│ [Quote Q-2024-001: Downtown Medical Center - Graybar Pricing    ]               │
│                                                                                 │
│ Message:                                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Hi John,                                                                    │ │
│ │                                                                             │ │
│ │ Please find attached our quote for the Downtown Medical Center project,    │ │
│ │ with pricing specific to your Graybar account.                             │ │
│ │                                                                             │ │
│ │ Total: $195,000 (includes 20% distributor discount)                         │ │
│ │                                                                             │ │
│ │ This quote is valid until April 15, 2024.                                   │ │
│ │                                                                             │ │
│ │ Best regards,                                                               │ │
│ │ Sarah Chen                                                                  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ☑ Attach distributor-specific PDF                                               │
│ ☐ Include base quote for reference                                              │
│                                                                                 │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ PDF PREVIEW:                                                                    │
│ Shows: Graybar pricing, crossed SKUs, discount summary                          │
│                                                                                 │
│ [Preview PDF]                                                                   │
│                                                                                 │
│                              [Cancel]  [Send Quote]                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Distributor PDF Contents**:
- Quote header with distributor name
- Line items with final SKUs (after crosses)
- Discounted pricing per line
- Price category shown per line
- Discount summary
- Notes about any crossed products
- Terms and conditions

---

## 17. Build Order

### Phase 1: Core Quote List & Structure
1. Create `/app/quotes/page.tsx` with standard layout
2. Create `QuotesContent.tsx` with mock quotes data
3. Implement Kanban view (6 stage columns) with drag-drop
4. Implement List view toggle
5. Add Advanced Filters (reuse existing pattern)
6. Quote card design with win probability badge
7. **Quote card approval status badge**

### Phase 2: Quote Detail - Basic
1. Create `QuoteDetailModal.tsx` (or slide-out panel)
2. Header with quote info, stage, expiration
3. Customer section (bill-to, sold-to display)
4. Tabs structure (Line Items, **Approvals**, Recipients, Attachments, Notes, History)
5. Right sidebar with totals panel
6. **Right sidebar approval status summary**

### Phase 3: Line Items Table
1. Create `QuoteLineItems.tsx` component
2. Basic line items table with mock data
3. **Manufacturer column with approval status badges**
4. Inline editing for cells
5. Product # / Description toggle
6. Drag-drop reordering with @dnd-kit
7. Row selection (checkboxes)
8. Add/delete line items

### Phase 4: Sections
1. Section headers with collapse/expand
2. Add section modal
3. Section subtotals
4. **Section approval status indicator**
5. Drag lines between sections
6. Auto-group by manufacturer

### Phase 5: Manufacturer Approvals - Core
1. Create `QuoteApprovalStatus.tsx` component
2. **Approvals tab with grouped status view**
3. **Approval status badges on line items**
4. **Click badge to see approval details**
5. Mock data for builder approved manufacturers list

### Phase 6: Approval Requests
1. Create `ApprovalRequestModal.tsx` component
2. **Request approval form with pre-filled data**
3. **Product/SKU selection from quote lines**
4. **Justification text area**
5. **File attachments**
6. **Contact selection (from CRM)**
7. **PDF preview generation**

### Phase 7: Approval Tracking
1. **Pending requests list in Approvals tab**
2. **Mark as Approved modal with status options**
3. **Conditional approval handling**
4. **Attach proof/documentation**
5. **Auto-generate notes for approval events**
6. **Bulk mark as approved**

### Phase 8: Builder Approvals List
1. Create `BuilderApprovalsList.tsx` component
2. **Manufacturer approvals table per builder**
3. **Add/edit approval modal**
4. **Filter and search**
5. **Link from quote detail and company detail**
6. **Approval memory across projects**

### Phase 9: Multi-Level Pricing
1. L1/L2/L3 columns in table
2. Bulk "Copy Sell → Level" modal
3. Price levels summary in sidebar
4. Per-line price locking

### Phase 10: Overage & Commission
1. Overage toggle in toolbar
2. Show/hide overage columns
3. Overage % inline entry with auto-calc
4. Bulk "Set % Overage" modal
5. Commission calculation display
6. Commission band badges
7. Price Lookup popup (with approval status)

### Phase 11: Multi-Manufacturer
1. Expandable row for manufacturers
2. Add manufacturer to line
3. Per-manufacturer pricing display
4. **Per-manufacturer approval status**
5. Allocation percentage

### Phase 12: Predictive Pricing
1. Create `QuoteWinProbability.tsx` component
2. Win probability badge with color coding
3. Probability tooltip with factors (**including approval status**)
4. Create `QuoteSparkline.tsx` component
5. Mini sparkline in table
6. Price history popup on hover
7. Probability sensitivity panel

### Phase 13: Recipients & Send
1. Recipients tab with table
2. Add recipient modal
3. Price level assignment per recipient
4. Send quote modal **with approval warnings**
5. PDF preview placeholder
6. Send tracking display

### Phase 14: Notes & Versioning
1. Notes tab with note list (**including approval event notes**)
2. Add note modal
3. Version indicator badge (**with approval status per version**)
4. Version history dropdown
5. Compare versions view (simplified)

### Phase 15: Approvals Reporting
1. **Dashboard widget for approval status**
2. **Approvals report page**
3. **Manufacturers needing most approvals**
4. **Builder rejection rates**
5. **Quotes delayed analysis**

### Phase 16: Polish
1. End user field per line
2. Attachments tab
3. Target commission helper
4. Keyboard navigation
5. Mobile responsiveness
6. Loading states & animations

---

## UI Component Patterns

Follow existing codebase patterns:

**Cards**: `border border-[var(--border)] rounded-lg bg-white`

**Buttons**:
- Primary: `bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90`
- Secondary: `border border-[var(--border)] hover:bg-[var(--muted)]`

**Inputs**: `px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)]`

**Badges**:
- Green: `bg-green-100 text-green-700` (Approved)
- Yellow: `bg-yellow-100 text-yellow-700` (Pending/Conditional)
- Red: `bg-red-100 text-red-700` (Not Approved/Rejected)
- Gray: `bg-gray-100 text-gray-700` (Unknown)
- Purple: `bg-purple-100 text-purple-700`

**Tables**: Use grid or flex layouts with consistent spacing

**Modals**: Centered with backdrop blur, consistent header/footer pattern

---

## Mock Data Quantities

Create enough mock data to demonstrate features:

- **Quotes**: 12-15 quotes across all stages
- **Line Items**: 20-30 items per quote (with sections)
- **Sections**: 3-4 sections per quote
- **Recipients**: 2-4 per quote
- **Notes**: 2-3 per quote
- **Versions**: 2-3 per quote
- **Price History**: 12 data points per product (monthly for 1 year)
- **Builder Approvals**: 15-20 manufacturer approvals per builder
- **Approval Requests**: 3-5 pending requests across quotes
