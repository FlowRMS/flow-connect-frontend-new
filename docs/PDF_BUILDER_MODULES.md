# PDF Builder Modules Specification

This document outlines all the modules needed for the PDF template builder to support quick, drag-and-drop creation of templates for quotes, orders, invoices, BOLs, packing slips, and other documents.

---

## Module Categories

1. [Layout Modules](#layout-modules) - Structure and visual organization
2. [Header & Identity Modules](#header--identity-modules) - Company and document identification
3. [Party Information Modules](#party-information-modules) - Customer, vendor, and contact details
4. [Line Item Modules](#line-item-modules) - Products, services, and itemized content
5. [Financial Modules](#financial-modules) - Pricing, totals, and payment information
6. [Shipping & Logistics Modules](#shipping--logistics-modules) - Delivery and fulfillment details
7. [Warehouse Modules](#warehouse-modules) - Inventory and location information
8. [Job & Project Modules](#job--project-modules) - Project-related information
9. [Commission Modules](#commission-modules) - Sales rep and commission details
10. [Submittal Modules](#submittal-modules) - Submittal-specific content
11. [Signature & Approval Modules](#signature--approval-modules) - Sign-off areas
12. [Text & Content Modules](#text--content-modules) - Custom and static content

---

## Layout Modules

### Company Header
**Already Exists**
- Company logo, name, address, phone, email, website
- Configurable layout (logo left/center/right)

### Document Title
**Already Exists**
- Title and document number
- Document date display

### Divider Line
**Already Exists**
- Horizontal separator line
- Configurable thickness, color, margins

### Spacer
**Already Exists**
- Vertical spacing between modules
- Configurable height

### Footer
**Already Exists**
- Page numbers, date, custom text
- Company info repeat option

### Page Break
**NEW MODULE**
- Forces content to next page
- Useful for multi-section documents

### Two-Column Layout
**NEW MODULE**
- Side-by-side content areas
- Configurable column widths (50/50, 60/40, 70/30)
- Each column can contain other modules

### Three-Column Layout
**NEW MODULE**
- Three side-by-side content areas
- Useful for shipping labels, compact headers

---

## Header & Identity Modules

### Document Header
**NEW MODULE**
- Combined company + document info in one block
- Fields:
  - Company logo & info (from Company Header)
  - Document type label (Quote, Invoice, Order, BOL, etc.)
  - Document number
  - Document date
  - Status badge (optional)
  - PO Number / Reference Number
- Configurable: Show/hide each field, layout options

### Manufacturer Header
**NEW MODULE**
- For documents sent on behalf of a manufacturer
- Fields:
  - Manufacturer name
  - Manufacturer logo (if available)
  - Rep code
  - Vendor group
  - Contact information
- Use case: Factory orders, manufacturer-branded quotes

### Revision Block
**NEW MODULE**
- Document revision history
- Fields:
  - Revision number
  - Revision date
  - Revised by
  - Change summary
- Use case: Quotes with revisions, submittals

---

## Party Information Modules

### Sold-To Information
**NEW MODULE**
- The customer purchasing the goods
- Fields:
  - Customer name
  - Customer number/ID
  - Contact name
  - Address (street, city, state, zip)
  - Phone, email
  - Territory
- Configurable: Which fields to show

### Bill-To Information
**NEW MODULE**
- Billing/invoicing address (may differ from sold-to)
- Fields:
  - Company name
  - Attention line
  - Billing address
  - Phone, email
  - Payment terms
  - Tax ID (optional)
- Use case: Invoices, orders with different bill-to

### Ship-To Information
**NEW MODULE**
- Delivery destination
- Fields:
  - Location name
  - Attention/contact
  - Street address
  - City, state, zip, country
  - Contact phone
  - Contact email
  - Delivery instructions (optional)
- Use case: Orders, BOLs, packing slips

### End User Information
**NEW MODULE**
- Final recipient/user of goods
- Fields:
  - End user company
  - Contact name
  - Address
  - Phone, email
- Use case: Distribution orders, warranty tracking

### Sales Rep Information
**NEW MODULE**
- Inside/outside rep details
- Fields:
  - Rep name
  - Rep email
  - Rep phone
  - Territory
- Configurable: Show inside rep, outside rep, or both

### Warehouse Information
**NEW MODULE**
- Source warehouse details
- Fields:
  - Warehouse name
  - Warehouse address
  - Contact name
  - Contact phone
  - Contact email
- Use case: BOLs, packing slips, pick lists

### Contact Card
**NEW MODULE**
- Generic contact display block
- Fields:
  - Name
  - Title/role
  - Company
  - Phone, email, LinkedIn
  - Address
- Use case: Flexible contact display anywhere

---

## Line Item Modules

### Order Line Items
**NEW MODULE**
- Line items from sales orders
- Available fields:
  - Line number
  - Part number
  - Customer part number
  - Description
  - Quantity ordered
  - Quantity shipped
  - Quantity backordered
  - Unit price
  - Extended price
  - Discount
  - Notes
  - Consignment flag
- Configurable: Select which columns, column order, column widths

### Invoice Line Items
**NEW MODULE**
- Line items from invoices
- Available fields:
  - Line number
  - Part number
  - Description
  - Quantity
  - Unit price
  - Amount
  - Commission rate
  - Commission amount
- Configurable: Select columns, show/hide pricing

### Quote Line Items
**NEW MODULE (Enhance Existing)**
- Line items from quotes/pre-opportunities
- Available fields:
  - Line number
  - Manufacturer
  - Part number
  - Description
  - Quantity
  - List price
  - Multiplier/discount
  - Net price
  - Extended price
  - Lead time
  - Notes
- Configurable: Group by manufacturer, show/hide columns

### Fulfillment Line Items
**NEW MODULE**
- Items being fulfilled/shipped
- Available fields:
  - Line number
  - Part number
  - Description
  - Ordered quantity
  - Shipping quantity
  - Previously shipped
  - Remaining
  - Bin location
  - Lot/serial number
  - Weight
- Use case: Packing slips, BOLs, pick confirmations

### Pick List Line Items
**NEW MODULE**
- Items to be picked from warehouse
- Available fields:
  - Pick sequence number
  - Bin location (full path)
  - Part number
  - Description
  - Quantity to pick
  - Lot/serial (if applicable)
  - Barcode
  - Checkbox (for manual picking)
- Sorting: By bin location path for efficient picking

### Credit Line Items
**NEW MODULE**
- Items on credit memos
- Available fields:
  - Original invoice number
  - Part number
  - Description
  - Quantity
  - Unit price
  - Credit amount
  - Reason code
- Use case: Credit memo documents

### RMA Line Items
**NEW MODULE**
- Return items
- Available fields:
  - Part number
  - Description
  - Return quantity
  - Reason
  - Condition
  - Original order reference
  - Disposition (restock, scrap, etc.)
- Use case: RMA documents, return labels

### Consignment Line Items
**NEW MODULE**
- Consignment inventory items
- Available fields:
  - Part number
  - Description
  - Quantity on hand
  - Quantity sold this period
  - Commission rate
  - Commission amount
- Use case: Consignment reports, commission statements

### Cycle Count Line Items
**NEW MODULE**
- Items being counted
- Available fields:
  - Bin location
  - Part number
  - Description
  - System quantity
  - Counted quantity (blank for entry)
  - Variance
  - Variance %
  - Notes
- Use case: Cycle count sheets

---

## Financial Modules

### Pricing Summary
**NEW MODULE (Enhance Existing)**
- Subtotals and adjustments
- Fields:
  - Subtotal
  - Discount (amount or %)
  - Freight/shipping
  - Tax
  - Other charges
  - Total
- Configurable: Which lines to show, labels

### Payment Terms Block
**NEW MODULE**
- Payment information
- Fields:
  - Payment terms (Net 30, etc.)
  - Due date
  - Early payment discount
  - Accepted payment methods
  - Bank details (optional, for wire transfers)
- Use case: Invoices, quotes

### Amount Due Block
**NEW MODULE**
- For invoices showing balance
- Fields:
  - Invoice total
  - Payments received
  - Credits applied
  - Balance due
  - Due date
  - Past due indicator
- Use case: Invoice statements

### Commission Summary
**NEW MODULE**
- Commission totals
- Fields:
  - Total sales
  - Commission rate
  - Commission amount
  - Split rates (if applicable)
- Use case: Commission statements, order confirmations with commission

### Check Amount Block
**NEW MODULE**
- For commission checks
- Fields:
  - Gross commission
  - Expense deductions
  - Credit deductions
  - Net amount
  - Check number
  - Check date
- Use case: Commission check stubs

---

## Shipping & Logistics Modules

### Shipping Details
**NEW MODULE**
- Carrier and delivery info
- Fields:
  - Carrier name
  - Service level
  - Tracking number(s)
  - Ship date
  - Estimated delivery
  - Freight terms (prepaid, collect, third party)
  - Freight cost
  - Number of packages/pallets
- Use case: BOLs, packing slips, shipping confirmations

### Package Summary
**NEW MODULE**
- Package/carton information
- Fields:
  - Number of packages
  - Total weight
  - Total dimensions
  - Package breakdown (Box 1: 20 lbs, 12x12x12)
- Use case: BOLs, shipping labels

### Freight Classification
**NEW MODULE**
- For LTL/freight shipments
- Fields:
  - Freight class
  - NMFC code
  - Commodity description
  - Hazmat indicators
  - Special handling codes
- Use case: BOLs, freight quotes

### Delivery Instructions
**NEW MODULE**
- Special delivery requirements
- Fields:
  - Delivery type (will call, local delivery, carrier)
  - Delivery date/time window
  - Dock/door requirements
  - Liftgate required
  - Inside delivery
  - Appointment required
  - Special instructions
- Use case: BOLs, delivery tickets

### Tracking QR Code
**NEW MODULE**
- QR code for shipment tracking
- Fields:
  - QR code image (generated from tracking URL)
  - Tracking number text
  - Carrier logo
- Use case: Packing slips, shipping labels

### Return Shipping Info
**NEW MODULE**
- For RMA documents
- Fields:
  - Return address
  - RMA number (prominent)
  - Return carrier
  - Prepaid label indicator
  - Return instructions
- Use case: RMA forms, return labels

---

## Warehouse Modules

### Inventory Location
**NEW MODULE**
- Bin/location details
- Fields:
  - Warehouse name
  - Full location path (Section > Aisle > Shelf > Bay > Row > Bin)
  - Location barcode
- Use case: Pick lists, bin labels, put-away documents

### Bin Label Content
**NEW MODULE**
- For printing bin labels
- Fields:
  - Location code
  - Location barcode
  - Location QR code
  - Section/Aisle/Shelf identifiers
  - Capacity info
- Use case: Bin labels

### Product Label Content
**NEW MODULE**
- For printing product labels
- Fields:
  - Part number
  - Part number barcode
  - Description
  - Manufacturer
  - UPC code
  - Lot/serial number
  - Expiration date
- Use case: Product labels, receiving labels

### Receiving Summary
**NEW MODULE**
- Incoming shipment info
- Fields:
  - PO number
  - Vendor name
  - Expected date
  - Carrier
  - Tracking number
  - Item count
  - Expected quantity
- Use case: Receiving documents, put-away lists

### Wave Information
**NEW MODULE**
- Pick wave details
- Fields:
  - Wave ID
  - Wave date/time
  - Total orders in wave
  - Total items
  - Total picks
  - Assigned picker
- Use case: Wave pick lists

---

## Job & Project Modules

### Job Information
**NEW MODULE (Enhance Existing)**
- Project/job details
- Fields:
  - Job name
  - Job number
  - Job address/location
  - Job type
  - Job status
  - GC (General Contractor)
  - EC (Electrical Contractor)
  - Owner
  - Start date
  - End date
  - Job value
- Configurable: Select which fields

### Job Stakeholders
**NEW MODULE**
- People involved in the job
- Fields:
  - Role (GC, EC, Owner, Architect, Engineer)
  - Company name
  - Contact name
  - Phone
  - Email
- Display: Table or stacked cards

### Specification Reference
**NEW MODULE**
- Spec section references
- Fields:
  - Spec section number
  - Spec section name
  - Division
  - Addendum references
- Use case: Submittals, quotes tied to specs

---

## Commission Modules

### Commission Breakdown
**NEW MODULE**
- Detailed commission by line
- Fields:
  - Line/invoice reference
  - Sales amount
  - Commission rate
  - Commission amount
  - Rep split (if applicable)
- Use case: Commission statements, check details

### Split Rate Display
**NEW MODULE**
- Commission split visualization
- Fields:
  - Rep name
  - Split percentage
  - Split amount
- Display: Table or pie chart visual

### Commission Statement Header
**NEW MODULE**
- Period and rep information
- Fields:
  - Commission period (month/year)
  - Rep name
  - Rep ID
  - Manufacturer
- Use case: Monthly commission statements

---

## Submittal Modules

### Transmittal Header
**Already Exists (Enhance)**
- Submittal identification
- Fields:
  - Submittal number
  - Revision number
  - Date
  - Project name
  - Submittal type

### Stakeholder List
**Already Exists (Enhance)**
- All parties on submittal
- Fields:
  - Role (customer, engineer, architect)
  - Company
  - Contact name
  - Email
  - Copies count

### Submittal Items Table
**NEW MODULE**
- Items in the submittal
- Fields:
  - Item number
  - Fixture type
  - Manufacturer
  - Catalog number
  - Description
  - Quantity
  - Spec section
  - Approval status
  - Notes
- Use case: Submittal cover sheets

### Approval Status Block
**NEW MODULE**
- Current approval state
- Fields:
  - Status (Approved, Approved as Noted, etc.)
  - Approved by
  - Approval date
  - Notes/conditions
- Use case: Submittal returns

---

## Signature & Approval Modules

### Signature Block
**NEW MODULE**
- Signature capture area
- Fields:
  - Signature line
  - Printed name line
  - Title line
  - Date line
  - Company line (optional)
- Configurable: Number of signature blocks, layout

### Dual Signature Block
**NEW MODULE**
- Two-party signatures side by side
- Fields:
  - Left: Shipper/Seller signature area
  - Right: Receiver/Buyer signature area
- Use case: BOLs, delivery receipts

### Acknowledgment Checkbox
**NEW MODULE**
- Terms acceptance
- Fields:
  - Checkbox
  - Acknowledgment text
  - Signature line
- Use case: Quote acceptances, terms agreements

### Inspection Checklist
**NEW MODULE**
- Delivery/receiving inspection
- Fields:
  - Checkbox items (Quantity correct, No damage, etc.)
  - Exception notes area
  - Inspector signature
- Use case: Delivery receipts, receiving docs

---

## Text & Content Modules

### Terms & Conditions
**Already Exists**
- Legal terms text
- Configurable: Full text or reference to attached

### Custom Text
**Already Exists**
- Free-form text block
- Rich text support

### Notes Block
**NEW MODULE**
- Document-specific notes
- Fields:
  - Notes from order/quote/invoice record
  - Custom additional notes
- Configurable: Pull from record or manual entry

### Instructions Block
**NEW MODULE**
- Procedural instructions
- Fields:
  - Title
  - Numbered or bulleted steps
- Use case: Return instructions, assembly notes

### Disclaimer Block
**NEW MODULE**
- Legal disclaimers
- Fields:
  - Disclaimer text
  - Smaller font option
  - Border/box option
- Use case: Warranty disclaimers, liability limits

### Barcode Block
**NEW MODULE**
- Standalone barcode
- Fields:
  - Barcode type (Code 128, Code 39, QR)
  - Value (from document field or custom)
  - Show value text below
- Use case: Document scanning, tracking

### Image Block
**NEW MODULE**
- Static image placement
- Fields:
  - Image upload/URL
  - Size constraints
  - Alignment
- Use case: Product images, certification logos

### Table Block
**NEW MODULE**
- Custom data table
- Fields:
  - Column definitions
  - Row data (manual or from data source)
  - Styling options
- Use case: Custom specifications, technical data

---

## Module Configuration Options (Universal)

All modules should support these configuration options:

### Visibility
- Show/hide the entire module
- Conditional visibility (e.g., only show if field has value)

### Styling
- Background color
- Border (none, thin, thick)
- Padding/margins
- Font size override

### Data Binding
- Which record fields map to which module fields
- Default values when field is empty
- Format options (date format, number format, currency)

### Layout
- Full width vs. contained
- Alignment (left, center, right)
- Column span (for multi-column layouts)

---

## Document Type to Module Mapping

### Quote
- Company Header
- Document Title
- Sold-To Information
- Job Information
- Quote Line Items
- Pricing Summary
- Terms & Conditions
- Notes Block
- Sales Rep Information
- Signature Block
- Footer

### Sales Order
- Company Header (or Manufacturer Header)
- Document Title
- Sold-To Information
- Bill-To Information
- Ship-To Information
- Job Information
- Order Line Items
- Pricing Summary
- Payment Terms Block
- Notes Block
- Footer

### Invoice
- Company Header
- Document Title
- Bill-To Information
- Ship-To Information
- Invoice Line Items
- Pricing Summary
- Amount Due Block
- Payment Terms Block
- Footer

### Bill of Lading (BOL)
- Company Header (or Warehouse Information)
- Document Title
- Ship-To Information
- Shipping Details
- Freight Classification
- Fulfillment Line Items
- Package Summary
- Delivery Instructions
- Dual Signature Block
- Barcode Block
- Footer

### Packing Slip
- Company Header
- Document Title
- Ship-To Information
- Sold-To Information
- Shipping Details
- Fulfillment Line Items
- Package Summary
- Tracking QR Code
- Notes Block
- Footer

### Pick List
- Warehouse Information
- Wave Information
- Pick List Line Items (sorted by location)
- Signature Block
- Footer

### Shipping Label
- Three-Column Layout
- Warehouse Information (From)
- Ship-To Information (To)
- Barcode Block (Tracking)
- Package Summary

### Credit Memo
- Company Header
- Document Title
- Bill-To Information
- Credit Line Items
- Pricing Summary
- Notes Block
- Footer

### Commission Check Stub
- Company Header
- Commission Statement Header
- Commission Breakdown
- Check Amount Block
- Footer

### RMA Document
- Company Header
- Document Title
- Return Shipping Info
- RMA Line Items
- Instructions Block
- Signature Block
- Barcode Block (RMA Number)
- Footer

### Submittal Cover Sheet
- Company Header
- Transmittal Header
- Job Information
- Stakeholder List
- Submittal Items Table
- Approval Status Block
- Signature Block
- Footer

### Cycle Count Sheet
- Warehouse Information
- Document Title
- Cycle Count Line Items
- Signature Block
- Footer

### Receiving Document
- Warehouse Information
- Receiving Summary
- Fulfillment Line Items
- Inspection Checklist
- Signature Block
- Footer

---

## Implementation Priority

### Phase 1 - Core Documents
1. Order Line Items
2. Sold-To Information
3. Bill-To Information
4. Ship-To Information
5. Pricing Summary (enhanced)
6. Payment Terms Block
7. Signature Block
8. Notes Block

### Phase 2 - Shipping & Warehouse
1. Fulfillment Line Items
2. Shipping Details
3. Package Summary
4. Warehouse Information
5. Pick List Line Items
6. Tracking QR Code
7. Dual Signature Block
8. Barcode Block

### Phase 3 - Financial & Commission
1. Invoice Line Items
2. Amount Due Block
3. Credit Line Items
4. Commission Breakdown
5. Check Amount Block
6. Split Rate Display

### Phase 4 - Advanced Features
1. Two-Column Layout
2. Three-Column Layout
3. RMA Line Items
4. Cycle Count Line Items
5. Job Stakeholders
6. Image Block
7. Table Block

### Phase 5 - Specialized
1. Freight Classification
2. Consignment Line Items
3. Submittal Items Table
4. Specification Reference
5. Manufacturer Header

---

## Data Source Mapping

Each module needs to know which entity/table to pull data from:

| Module | Primary Data Source | Related Entities |
|--------|---------------------|------------------|
| Order Line Items | `OrderLineItem` | `Order`, `Product` |
| Invoice Line Items | `InvoiceLineItem` | `Invoice`, `Order` |
| Quote Line Items | `PreOpportunityDetail` | `PreOpportunity`, `Product` |
| Fulfillment Line Items | `FulfillmentOrderLineItem` | `FulfillmentOrder`, `Order` |
| Pick List Line Items | `FulfillmentOrderLineItem` | `FulfillmentOrder`, `InventoryItem` |
| Credit Line Items | `CreditLineItem` | `Credit`, `Invoice` |
| RMA Line Items | `RmaItem` | `RMA`, `FulfillmentOrder` |
| Sold-To Information | `Company` | `Contact`, `CompanyAddress` |
| Bill-To Information | `Company` | `CompanyAddress` |
| Ship-To Information | `ShipToAddress` | `FulfillmentOrder`, `Order` |
| Job Information | `Job` | `Company` |
| Shipping Details | `FulfillmentOrder` | - |
| Warehouse Information | `Warehouse` | `ManufacturerProfile` |
| Commission Breakdown | `CheckDetail` | `CommissionCheck`, `Invoice` |

---

## Summary

**Total New Modules Needed: 45+**

- Layout: 3 new
- Header & Identity: 3 new
- Party Information: 7 new
- Line Items: 9 new
- Financial: 5 new
- Shipping & Logistics: 7 new
- Warehouse: 5 new
- Job & Project: 3 new
- Commission: 3 new
- Submittal: 2 new
- Signature & Approval: 4 new
- Text & Content: 6 new

This modular approach allows users to build any document type by dragging and dropping the appropriate modules, configuring which fields to display, and styling to match their brand.
