# Flow Submittals - Feature Build Plan

## Overview

This document outlines the phased implementation plan for Flow Submittals, a feature that enables reps to generate, manage, and revise submittal packages from Flow quotes.

### Existing System Context

The following entities and features **already exist** in Flow and will be leveraged:

| Entity | Status | Integration Notes |
|--------|--------|-------------------|
| **Jobs** | ✅ Exists | Submittals link to jobs via `jobId`. Jobs have name, location, GC, EC, owner. |
| **Quotes** | ✅ Exists | Primary source for submittal creation. Has line items, manufacturers, approval workflows. |
| **Quote Line Items** | ✅ Exists | Contains manufacturer, part number, description, quantity, pricing. |
| **Contacts** | ✅ Exists | Engineers, architects, GCs, ECs. Has company, role, contactType. |
| **Companies** | ✅ Exists | Types include GC, EC, Manufacturer, Architect. |
| **Manufacturers** | ✅ Exists | Basic manufacturer list with name, domain, active status. |
| **Files/Attachments** | ✅ Partial | Quote files tab exists; needs extension for spec sheet library. |
| **Approvals** | ✅ Exists | Quote approval workflow exists; submittal status can integrate. |

### New Entities Required

| Entity | Purpose |
|--------|---------|
| **Submittal** | Package containing items, stakeholders, revisions |
| **Submittal Item** | Individual product line within a submittal |
| **Spec Sheet** | Manufacturer PDF documents (cut sheets) |
| **Highlight Definition** | Stored highlight regions per catalog number |
| **Submittal Revision** | Version tracking with generated/returned PDFs |

---

## Phase 1: Foundation & Data Model

**Goal**: Establish core data structures and basic CRUD operations.

**Duration Estimate**: Foundation phase

### 1.1 Type Definitions

Create `/lib/types/submittals.ts` with all submittal-related types:

```typescript
// Core types to implement
- Submittal
- SubmittalItem
- SpecSheet
- HighlightDefinition
- HighlightRegion
- SubmittalRevision
- SubmittalStatus (enum)
- TransmittalPurpose (enum)
```

**Tasks**:
- [ ] Create `Submittal` type with all fields (id, jobId, quoteIds, stakeholders, dates, status, revisionNumber)
- [ ] Create `SubmittalItem` type (quoteLineItemId, type, manufacturer, catalogNumber, description, quantity, specSheetId, highlightDefinitionId)
- [ ] Create `SpecSheet` type (id, manufacturer, fileName, categories, uploadSource, uploadDate, url)
- [ ] Create `HighlightDefinition` type (id, specSheetId, catalogNumber, manufacturer, regions[])
- [ ] Create `HighlightRegion` type (pageNumber, coordinates, shape, color, annotation)
- [ ] Create `SubmittalRevision` type (revisionNumber, generatedPdfUrl, returnedPdfs[], generatedDate, generatedBy)
- [ ] Define status enums: `SubmittalStatus`, `TransmittalPurpose`, `ItemApprovalStatus`

### 1.2 Mock Data Structure

Create `/lib/data/submittals-mock.ts`:

**Tasks**:
- [ ] Create mock submittals array (3-5 sample submittals)
- [ ] Create mock spec sheets array (10-15 from common manufacturers like Acuity, Lutron, Waldmann)
- [ ] Create mock highlight definitions (5-10 for common part numbers)
- [ ] Link mock data to existing mock quotes and jobs

### 1.3 State Management Hooks

Create `/lib/hooks/useSubmittals.ts`:

**Tasks**:
- [ ] `useSubmittals()` - list, filter, search submittals
- [ ] `useSubmittal(id)` - single submittal with items
- [ ] `useSpecSheets(manufacturer?)` - spec sheet library
- [ ] `useHighlightDefinitions(specSheetId)` - highlights for a spec sheet
- [ ] CRUD operations for all entities

---

## Phase 2: Spec Sheet Library

**Goal**: Build the manufacturer spec sheet management system.

**Implements**: FR-SS-01 through FR-SS-04

### 2.1 Spec Sheet Library Page

Create `/app/spec-sheets/page.tsx` and `/components/SpecSheetsContent.tsx`:

**Tasks**:
- [ ] Two-panel layout: manufacturer list (left) → spec sheets (right)
- [ ] Manufacturer filtering/search
- [ ] Spec sheet grid/list view with thumbnails
- [ ] Category badges (Indoor, Outdoor, Sports Lighting, etc.)
- [ ] Upload date and usage count display

### 2.2 Spec Sheet Upload

**Tasks**:
- [ ] Upload modal with two tabs: "From URL" and "File Upload"
- [ ] URL input with "Fetch" button (validates PDF URL)
- [ ] File drag-and-drop zone
- [ ] Name override input field
- [ ] Multi-select category picker
- [ ] Manufacturer selector (from existing manufacturer list)

### 2.3 Spec Sheet Management

**Tasks**:
- [ ] Bulk category reassignment (select multiple → assign categories)
- [ ] Delete spec sheet (with warning if highlights exist)
- [ ] Replace PDF (FR-SS-10) - upload new version, preserve highlight links
- [ ] "Mark as needs review" flag for stale sheets

### 2.4 Sidebar Navigation

**Tasks**:
- [ ] Add "Spec Sheets" link to Sidebar.tsx under a "Submittals" section
- [ ] Add icon (document/file icon)

---

## Phase 3: Highlight Editor

**Goal**: Build the PDF highlight editor for marking configurations.

**Implements**: FR-SS-05 through FR-SS-09

### 3.1 PDF Viewer Component

Create `/components/submittals/PdfViewer.tsx`:

**Tasks**:
- [ ] Integrate PDF.js or react-pdf for rendering
- [ ] Scrollable multi-page view (not paginated)
- [ ] Zoom controls (fit width, fit page, percentage)
- [ ] Pan/drag navigation
- [ ] Page number indicator
- [ ] Thumbnail sidebar (optional, toggleable)

### 3.2 Highlight Tools

Create `/components/submittals/HighlightToolbar.tsx`:

**Tasks**:
- [ ] Tool selector: Highlighter, Rectangle, Oval, Arrow, Text Box
- [ ] Color picker (yellow default, options for pink, green, blue)
- [ ] Line thickness control
- [ ] Undo/Redo buttons
- [ ] Clear all highlights button

### 3.3 Highlight Canvas

Create `/components/submittals/HighlightCanvas.tsx`:

**Tasks**:
- [ ] Overlay canvas on PDF pages
- [ ] Drawing interactions for each tool type
- [ ] Resize/move existing highlights
- [ ] Delete individual highlights (select + delete key or context menu)
- [ ] Coordinate normalization (store as percentages for different zoom levels)

### 3.4 Highlight Definition Management

Create `/components/submittals/HighlightEditor.tsx`:

**Tasks**:
- [ ] Catalog number input/display in header
- [ ] "Save Highlight for [Catalog Number]" button
- [ ] Load existing highlights when opening for known part number
- [ ] Confirmation dialog when overwriting existing definition
- [ ] Success toast: "Highlight saved - will auto-apply to future submittals"

---

## Phase 4: Submittal Creation

**Goal**: Enable creating submittals from quotes and from scratch.

**Implements**: FR-SU-01 through FR-SU-09

### 4.1 Create from Quote Flow

Update `/components/QuotesContent.tsx` (Submittals tab):

**Tasks**:
- [ ] "Create Submittal" button in Submittals tab header
- [ ] Line item selection modal:
  - [ ] Checkbox column for selection
  - [ ] Select All / Deselect All buttons
  - [ ] Filter by manufacturer
  - [ ] Show: Type, Manufacturer, Part Number, Description
  - [ ] Item count indicator
- [ ] Pre-populate submittal fields from quote:
  - [ ] Project name from job
  - [ ] Location from job
  - [ ] Bid date from quote expiration
  - [ ] Customer from quote soldToCustomer
  - [ ] Link to quote record

### 4.2 Create from Scratch Flow

Create `/app/submittals/page.tsx` and `/components/SubmittalsContent.tsx`:

**Tasks**:
- [ ] Submittals list view (table with columns: Project, Status, Items, Revision, Date, Actions)
- [ ] "New Submittal" button
- [ ] Creation modal:
  - [ ] Project name input
  - [ ] Location input
  - [ ] Job selector (optional, links to existing job)
  - [ ] Date pickers (bid date, submittal date)
  - [ ] Stakeholder pickers (Customer, Engineer, Architect)

### 4.3 Manual Item Entry

Create `/components/submittals/SubmittalItemsEditor.tsx`:

**Tasks**:
- [ ] Editable grid for submittal items
- [ ] Columns: Type, Manufacturer (dropdown), Catalog Number, Description, Quantity
- [ ] Add row button
- [ ] Delete row button
- [ ] Drag to reorder
- [ ] Import from quote button (add more items from linked quote)

### 4.4 Stakeholder Management

Create `/components/submittals/StakeholderPicker.tsx`:

**Tasks**:
- [ ] Contact search/select component
- [ ] Filter by contact type (Engineer, Architect, GC, EC)
- [ ] "Add New Contact" inline form
- [ ] Display selected stakeholders with role labels
- [ ] Remove stakeholder button

---

## Phase 5: Spec Sheet Attachment & Auto-Matching

**Goal**: Connect submittal items to spec sheets with automatic matching.

**Implements**: FR-AH-01 through FR-AH-10

### 5.1 Auto-Attach Logic

Create `/lib/utils/submittal-matching.ts`:

**Tasks**:
- [ ] `findMatchingSpecSheet(manufacturer, catalogNumber)` - finds spec sheet with existing highlight
- [ ] `findSpecSheetByManufacturer(manufacturer)` - fallback to any sheet from manufacturer
- [ ] Run matching on submittal creation
- [ ] Return match status: "matched_with_highlight", "matched_no_highlight", "no_match"

### 5.2 Item Status Indicators

Update submittal items list:

**Tasks**:
- [ ] Green checkmark: Spec sheet + highlight auto-attached
- [ ] Yellow dot: Spec sheet attached, no highlight defined
- [ ] Red dot: No spec sheet found
- [ ] Tooltip showing status details

### 5.3 Manual Spec Sheet Attachment

Create `/components/submittals/SpecSheetAttachModal.tsx`:

**Tasks**:
- [ ] Opens from submittal item row
- [ ] Browse manufacturer's spec sheets
- [ ] Search/filter within manufacturer
- [ ] Preview thumbnail
- [ ] "Attach" button
- [ ] "Upload New" button (opens upload flow, then attaches)

### 5.4 Inline Highlight Editing

**Tasks**:
- [ ] "Edit Highlights" button on each submittal item
- [ ] Opens HighlightEditor with:
  - [ ] Spec sheet pre-loaded
  - [ ] Catalog number pre-filled
  - [ ] Existing highlights loaded (if any)
- [ ] Catalog number shown prominently during editing

### 5.5 Learn All Action

**Tasks**:
- [ ] "Learn All" button in submittal toolbar
- [ ] Confirmation dialog: "Save highlights for X items?"
- [ ] Progress indicator during batch save
- [ ] Summary: "Created 5 new definitions, updated 2 existing"
- [ ] Skip items without highlights or spec sheets

---

## Phase 6: Submittal Detail View

**Goal**: Build the full submittal management interface.

### 6.1 Submittal Detail Page

Create `/app/submittals/[id]/page.tsx` and detail components:

**Tasks**:
- [ ] Header: Project name, status badge, revision number
- [ ] Info panel: Job, dates, stakeholders
- [ ] Tab navigation: Items, Output, Revisions, Activity

### 6.2 Items Tab

**Tasks**:
- [ ] Submittal items table with all columns
- [ ] Inline status indicators (spec sheet, highlight status)
- [ ] Row actions: Edit, Attach Spec Sheet, Edit Highlights, Remove
- [ ] Reorder via drag-and-drop
- [ ] Bulk actions: Attach spec sheets, Remove selected

### 6.3 Submittal Status Management

**Tasks**:
- [ ] Status dropdown in header
- [ ] Status options: Draft, For Approval, Resubmit for Approval, Record, Approved, Approved as Noted
- [ ] Status change triggers activity log entry

---

## Phase 7: PDF Generation

**Goal**: Generate professional submittal package PDFs.

**Implements**: FR-OUT-01 through FR-OUT-11

### 7.1 Output Options Dialog

Create `/components/submittals/OutputOptionsModal.tsx`:

**Tasks**:
- [ ] Document options section:
  - [ ] Include cover page (checkbox, default on)
  - [ ] Include transmittal page (checkbox, default on)
  - [ ] Include fixture summary (checkbox, default off)
  - [ ] Show quantities (checkbox)
  - [ ] Show descriptions (checkbox)
  - [ ] Show lead times (checkbox)
  - [ ] Use customer logo (checkbox, if configured)
- [ ] "Attached" checkboxes: Drawings, Specifications, Prints, Information, Other
- [ ] "Transmitted for" radio/checkboxes:
  - [ ] Prior Approval, Approval, Approval as Submitted, Approval as Noted
  - [ ] Resubmit for Approval, Record, Corrections
  - [ ] Review and Comment, For Your Use, Bids Due On
- [ ] Item selection: checkboxes to include/exclude specific items
- [ ] Addressed to: contact multi-select

### 7.2 Cover Page Template

Create `/lib/pdf/cover-page.ts`:

**Tasks**:
- [ ] Firm logo and address (from settings)
- [ ] Job name (large)
- [ ] Location
- [ ] Quote number
- [ ] Bid date
- [ ] Submittal date
- [ ] Engineer and Architect info
- [ ] Revision number

### 7.3 Transmittal Page Template

Create `/lib/pdf/transmittal-page.ts`:

**Tasks**:
- [ ] Project info header
- [ ] Recipient info
- [ ] "Attached" checkboxes rendered
- [ ] "Transmitted for" purpose rendered
- [ ] Items table:
  - [ ] Type, Manufacturer, Catalog Number columns
  - [ ] Each row is a hyperlink to spec sheet page
- [ ] Internal PDF link anchors

### 7.4 Spec Sheet Pages

Create `/lib/pdf/spec-sheet-renderer.ts`:

**Tasks**:
- [ ] Header bar on each page:
  - [ ] Firm logo (left)
  - [ ] Job name (center)
  - [ ] Catalog number + Type (right)
  - [ ] Quote number
- [ ] Original spec sheet content
- [ ] Highlight overlays rendered on PDF
- [ ] Page anchors for transmittal hyperlinks

### 7.5 PDF Assembly

Create `/lib/pdf/submittal-generator.ts`:

**Tasks**:
- [ ] Use pdf-lib or similar for PDF manipulation
- [ ] Assemble pages in order: Cover → Transmittal → Spec Sheets
- [ ] Add hyperlinks from transmittal to spec pages
- [ ] Add page numbers (optional)
- [ ] Handle large files (streaming/chunked generation)
- [ ] Progress callback for UI

### 7.6 Generation UI

**Tasks**:
- [ ] "Generate PDF" button triggers OutputOptionsModal
- [ ] Progress bar during generation
- [ ] Error handling with retry option
- [ ] On success: Download button + Save to Flow
- [ ] Large file warning with share link option

---

## Phase 8: Revisions & Returns

**Goal**: Track submittal versions and handle returned marked-up PDFs.

**Implements**: FR-REV-01 through FR-REV-08

### 8.1 Revision Tracking

**Tasks**:
- [ ] Revision history list in Revisions tab
- [ ] Each revision shows: Number, Date, Generated By, PDF link
- [ ] "Create New Revision" button (increments revision, generates new PDF)
- [ ] Revision number displayed prominently on submittal

### 8.2 Returned PDF Upload

Create `/components/submittals/ReturnedPdfUpload.tsx`:

**Tasks**:
- [ ] Upload zone for returned PDFs
- [ ] Associate with revision number
- [ ] Associate with stakeholder (who returned it)
- [ ] Date picker (date received)
- [ ] Notes field

### 8.3 Change Detection (Assistive)

Create `/lib/pdf/change-detector.ts`:

**Tasks**:
- [ ] "Compare to Original" button on returned PDFs
- [ ] Page-by-page comparison
- [ ] Detect new annotations, stamps, marks
- [ ] Output: List of pages with changes
- [ ] Per-item mapping where possible (based on page ranges)
- [ ] Clear disclaimer: "This is assistive only - manual review required"

### 8.4 Change Review UI

Create `/components/submittals/ChangeReviewPanel.tsx`:

**Tasks**:
- [ ] Side-by-side view: Original vs Returned
- [ ] Jump to change buttons
- [ ] Change summary list
- [ ] Mark as reviewed checkbox per change
- [ ] Notes per change

---

## Phase 9: Integration & Polish

**Goal**: Connect submittals to existing Flow features.

**Implements**: FR-INT-01 through FR-INT-06

### 9.1 Quote Integration

Update QuotesContent.tsx:

**Tasks**:
- [ ] Submittals tab shows linked submittals
- [ ] Quick status view for each submittal
- [ ] "View Submittal" links to detail page
- [ ] Submittal count badge on tab

### 9.2 Approvals Integration

**Tasks**:
- [ ] Submittal status visible in Approvals module
- [ ] Option to update submittal status from approval workflow
- [ ] Timeline entry when submittal is approved

### 9.3 Activity Feed

Update DashboardContent.tsx:

**Tasks**:
- [ ] "Submittal created" activity entries
- [ ] "Submittal generated" activity entries
- [ ] "Submittal returned" activity entries
- [ ] "Submittal approved" activity entries

### 9.4 Jobs Integration

Update JobsContent.tsx:

**Tasks**:
- [ ] Submittals section/tab on job detail
- [ ] List all submittals for the job
- [ ] Quick create submittal from job

### 9.5 Search & Filters

**Tasks**:
- [ ] Add submittals to global search
- [ ] Filter submittals by: Status, Job, Customer, Date range
- [ ] Sort by: Date, Status, Revision count

---

## Phase 10: Advanced Features

**Goal**: Implement nice-to-have features for power users.

### 10.1 Spec Sheet Suggestions

**Tasks**:
- [ ] When attaching spec sheet, suggest based on:
  - [ ] Previously used sheets for this manufacturer
  - [ ] Sheets with matching part number patterns
- [ ] "Recently used" section in attachment modal

### 10.2 Bulk Operations

**Tasks**:
- [ ] Bulk attach spec sheets by manufacturer
- [ ] Bulk update item types (F1, F2, etc.)
- [ ] Duplicate submittal (new project, same items)

### 10.3 Templates

**Tasks**:
- [ ] Save submittal structure as template
- [ ] Load template when creating new submittal
- [ ] Manage templates in settings

### 10.4 Email Integration

**Tasks**:
- [ ] "Email Submittal" button
- [ ] Pre-compose email with:
  - [ ] Recipients from stakeholders
  - [ ] Attached PDF (or share link if large)
  - [ ] Standard email template
- [ ] Track email sent in activity

---

## Database Schema (Future - Supabase)

When implementing backend, these tables will be needed:

```sql
-- Core tables
submittals
submittal_items
spec_sheets
highlight_definitions
highlight_regions
submittal_revisions
returned_pdfs

-- Junction tables
submittal_stakeholders (submittal_id, contact_id, role)
submittal_quotes (submittal_id, quote_id)
```

---

## File Structure

```
/app
  /submittals
    page.tsx                    # Submittals list
    /[id]
      page.tsx                  # Submittal detail
  /spec-sheets
    page.tsx                    # Spec sheet library

/components
  /submittals
    SubmittalsContent.tsx       # Main submittals list
    SubmittalDetail.tsx         # Detail view container
    SubmittalItemsEditor.tsx    # Items grid
    SubmittalItemRow.tsx        # Single item row
    CreateSubmittalModal.tsx    # Create from scratch
    CreateFromQuoteModal.tsx    # Create from quote
    OutputOptionsModal.tsx      # PDF generation options
    StakeholderPicker.tsx       # Contact selector
    SpecSheetAttachModal.tsx    # Attach spec sheet
    ReturnedPdfUpload.tsx       # Upload returns
    ChangeReviewPanel.tsx       # Compare changes
    PdfViewer.tsx               # PDF display
    HighlightEditor.tsx         # Highlight editing
    HighlightToolbar.tsx        # Drawing tools
    HighlightCanvas.tsx         # Drawing surface
  /spec-sheets
    SpecSheetsContent.tsx       # Library management
    SpecSheetUploadModal.tsx    # Upload flow
    SpecSheetCard.tsx           # Grid item

/lib
  /types
    submittals.ts               # All submittal types
  /data
    submittals-mock.ts          # Mock data
  /hooks
    useSubmittals.ts            # State management
  /utils
    submittal-matching.ts       # Auto-attach logic
  /pdf
    submittal-generator.ts      # PDF assembly
    cover-page.ts               # Cover template
    transmittal-page.ts         # Transmittal template
    spec-sheet-renderer.ts      # Spec page rendering
    change-detector.ts          # Comparison logic
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "react-pdf": "^7.x",         // PDF viewing
    "pdf-lib": "^1.17.x",        // PDF manipulation
    "pdfjs-dist": "^3.x",        // PDF.js for rendering
    "@react-pdf/renderer": "^3.x" // PDF generation (alternative)
  }
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to create submittal from quote | < 2 minutes |
| Auto-attach success rate (with library) | > 80% |
| PDF generation time (200 pages) | < 60 seconds |
| Highlight reuse rate | > 90% for repeat part numbers |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Large PDF performance | Streaming generation, chunked processing |
| Highlight coordinate drift on spec sheet updates | Store as percentages, add "needs review" flag |
| Complex PDF annotations | Start with basic shapes, iterate based on feedback |
| Browser memory limits | Virtualized PDF rendering, lazy page loading |

---

## Phase Summary

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 1 | Foundation | Types, mock data, hooks |
| 2 | Spec Sheet Library | Upload, browse, categorize |
| 3 | Highlight Editor | PDF viewer, drawing tools |
| 4 | Submittal Creation | From quote, from scratch |
| 5 | Auto-Matching | Spec sheet attachment |
| 6 | Detail View | Full submittal management |
| 7 | PDF Generation | Professional output |
| 8 | Revisions | Version tracking, returns |
| 9 | Integration | Quotes, jobs, activity |
| 10 | Advanced | Templates, bulk ops, email |
