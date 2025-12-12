# Plan: Implement Missing Overage and Pricing Features

## Overview
Based on the quotes-user-guide.md documentation and current implementation analysis, the following overage-related features are missing or incomplete and need to be implemented.

---

## Missing Features

### 1. Enhanced Set Overage Modal with Target Price Calculator
**Current State:** Basic modal with only a % input and static preview
**Required:**
- Add "Target Price" calculator: user enters desired sell price, system calculates required overage %
- Add "Target Margin" calculator: user enters desired margin $, system calculates price
- Show per-item breakdown of changes
- Calculate impact on commission for each line

### 2. Per-Manufacturer Overage Settings (Expanded Line Item View)
**Current State:** Line items can expand to show manufacturers but no overage editing per manufacturer
**Required:**
- Each manufacturer row should show:
  - Base price (editable)
  - Commission rate (editable)
  - Overage share % (editable)
  - Current overage amount and %
- Add ability to set different overage for each manufacturer option
- Show commission calculation breakdown per manufacturer

### 3. Price Lookup Modal Enhancement
**Current State:** Shows commission bands but no overage calculator
**Required:**
- Add "Target Price Calculator" section:
  - Input: Desired sell price
  - Output: Shows which commission band it falls into
  - Output: Shows overage amount and %
  - Output: Shows total commission (base + overage share)
- Add "Target Margin Calculator":
  - Input: Desired margin in $
  - Output: Required sell price
  - Output: Resulting overage %
- Show historical overage % for this product (from quotedPriceHistory vs priceHistory)

### 4. Right Sidebar - Overage Calculator Panel
**Current State:** Shows totals only
**Required:**
- Add expandable "Overage Calculator" section
- Input fields:
  - Target total sell price → calculates required avg overage %
  - Target overage amount → calculates sell price
  - Target margin % → calculates prices
- Show current vs target comparison
- "Apply to All Lines" button

### 5. Line Item Row - Inline Overage Editing
**Current State:** Overage % column shows value but may not be editable inline
**Required:**
- Make overage % column editable (click to edit)
- When overage % changes, auto-recalculate sell price
- Alternatively: when sell price changes, auto-recalculate overage %
- Show visual indicator when overage is below threshold (e.g., < 10% = yellow)

### 6. Bulk Actions - Advanced Overage Options
**Current State:** Has "Set % Overage" option
**Required:**
- "Set % Overage" - apply fixed overage % (existing)
- "Set Target Price" - set specific prices based on target
- "Set Minimum Overage" - only update lines below threshold
- "Copy Overage from Manufacturer" - use manufacturer's suggested overage
- "Equalize Overage" - distribute total margin evenly across lines

### 7. Multi-Manufacturer Overage Comparison
**Current State:** Expanded view shows multiple manufacturers but no overage comparison
**Required:**
- Show overage potential for each manufacturer option
- Highlight which manufacturer gives best margin
- Show commission impact comparison
- Allow setting preferred manufacturer based on overage

---

## Implementation Plan

### Phase 1: Enhanced Line Item Editing (Inline Overage)
1. Make overage % column inline-editable
2. When overage changes → recalculate sell price
3. When sell price changes → recalculate overage %
4. Add visual indicators for low overage

### Phase 2: Enhanced Set Overage Modal
1. Add Target Price Calculator tab
2. Add Target Margin Calculator tab
3. Show per-line breakdown preview
4. Show commission impact

### Phase 3: Enhanced Price Lookup Modal
1. Add Target Price Calculator section
2. Add margin calculator
3. Show which band the target falls into
4. Show commission breakdown

### Phase 4: Per-Manufacturer Overage Editing
1. Update expanded line item view
2. Add editable base price per manufacturer
3. Add editable commission rate
4. Add editable overage share %
5. Show commission calculation per manufacturer

### Phase 5: Right Sidebar Overage Calculator
1. Add expandable calculator panel
2. Target price → overage % calculator
3. Target margin → price calculator
4. Apply to all lines functionality

### Phase 6: Advanced Bulk Actions
1. Set Target Price bulk action
2. Set Minimum Overage bulk action
3. Equalize Overage bulk action

---

## Files to Modify
- `/Users/matthewcseare/projects/crm-2/flow-crm/components/QuotesContent.tsx`
  - Set Overage Modal (lines ~4122-4181)
  - Price Lookup Modal (lines ~4261-4363)
  - Right Sidebar (lines ~5604-5750)
  - Line Item Table Body (inline editing)
  - Bulk Actions Menu (lines ~3295-3370)
  - Expanded Line Item View (manufacturer rows)

---

## Acceptance Criteria
1. Users can enter a target sell price and see required overage %
2. Users can set overage per manufacturer
3. Users can edit overage inline in the line items table
4. Price Lookup shows overage calculator with commission bands
5. Right sidebar has overage calculator section
6. Bulk actions include advanced overage options
7. All calculations are accurate and match the formulas in the docs:
   - Overage Amount = Sell Price - Base Price
   - Overage % = (Overage Amount / Base Price) × 100
   - Commission = Base Commission + (Overage × Overage Share %)
