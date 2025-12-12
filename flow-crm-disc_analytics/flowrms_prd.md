# FlowRMS Product Requirements Document

**Version:** 1.0
**Date:** December 9, 2025
**Status:** Active
**Product:** FlowRMS - B2B Sales Order Management and Commission System

---

## Executive Summary

FlowRMS is a comprehensive B2B sales order management and commission tracking system designed for manufacturing and distribution organizations. The platform manages the complete order-to-cash cycle, from product catalog and customer management through order fulfillment, invoicing, and commission payments.

The system supports complex multi-party sales relationships, flexible commission structures, and detailed financial tracking across multiple factories, customers, and sales representatives.

---

## 1. Product Overview

### 1.1 Purpose

FlowRMS enables manufacturers' representatives and distributors to:
- Manage customer relationships and product catalogs
- Process orders from quote to fulfillment
- Track shipments and generate invoices
- Calculate and pay commissions to sales representatives
- Handle credits, adjustments, and expense tracking
- Provide comprehensive reporting and audit trails

### 1.2 Target Users

- **Sales Representatives** (Inside and Outside): Create and manage orders, track commissions
- **Operations Staff**: Process orders, manage fulfillment, generate invoices
- **Finance/Accounting**: Handle invoicing, credits, check processing, reconciliation
- **Administrators**: Configure system settings, manage master data, set permissions
- **Factory Representatives**: Monitor orders and commissions for their products
- **Customer Service**: Track order status, manage customer inquiries

### 1.3 System Architecture

**Technology Stack:**
- Backend: Java 21, Spring Boot 3.3.3, GraphQL
- ORM: Hibernate with Spring Data JPA
- Database: PostgreSQL with Liquibase migrations
- Security: Keycloak integration, RBAC
- Deployment: Docker, Kubernetes

**Repository Structure:**
- `flow-commission`: Orders, invoices, credits, checks, expenses
- `flow-core`: Master data (customers, factories, products, configuration)
- `flow-admin`: Administrative portal

---

## 2. Goals and Objectives

### 2.1 Business Goals

1. **Streamline Order Processing**: Reduce order-to-invoice cycle time by 40%
2. **Accurate Commission Tracking**: Eliminate commission calculation errors
3. **Improve Visibility**: Provide real-time order and commission status
4. **Enable Scale**: Support multi-tenant operations with data isolation
5. **Ensure Compliance**: Maintain complete audit trail for all transactions

### 2.2 User Goals

1. **Sales Reps**: Quick order entry, transparent commission tracking, mobile access
2. **Operations**: Efficient order fulfillment, bulk invoicing, exception management
3. **Finance**: Accurate commission payments, easy reconciliation, financial reporting
4. **Administrators**: Flexible configuration, role-based access control, system monitoring

---

## 3. Module-Specific Requirements

## 3.1 ORDERS MODULE

### 3.1.1 Overview
Manages the complete order lifecycle from creation through fulfillment and billing.

### 3.1.2 Core Entities
- **Order**: Header-level order information
- **OrderDetail**: Line items with product, quantity, pricing
- **OrderBalance**: Financial balance tracking
- **OrderAcknowledgement**: Acknowledgment records for fulfillment
- **OrderInsideRep**: Inside sales rep assignments
- **OrderSplitRate**: Commission distribution among participants

### 3.1.3 Functional Requirements

#### FR-ORD-001: Order Creation
**Priority:** P0 (Critical)

**Description:** Users must be able to create orders with complete header and line item information.

**Acceptance Criteria:**
- Support sold-to and bill-to customer selection (can be different)
- Allow factory selection
- Capture order number (unique per customer)
- Support multiple line items per order
- Allow product selection via factory part number or customer part number (CPN)
- Calculate pricing based on product price or CPN override price
- Support quantity-based pricing tiers
- Track freight charges
- Link to job/quote if applicable
- Assign inside sales representatives
- Define commission split rates per line item

**API Endpoint:** `CreateOrderController`

#### FR-ORD-002: Order Status Tracking
**Priority:** P0 (Critical)

**Description:** System must track order status across multiple dimensions.

**Status Dimensions:**
1. **Order Status**: OPEN, PARTIAL_SHIPPED, SHIPPED_COMPLETE, CANCELLED, OVER_SHIPPED
2. **Header Status**: OPEN (default)
3. **Confirmation Status**: NONE (default)
4. **Fulfillment Status**: NOT_STARTED, IN_PROGRESS, COMPLETED
5. **Billing Status**: NOT_INVOICED, PARTIAL_INVOICED, FULLY_INVOICED
6. **Commission Status**: ACCRUING, PAID, ADJUSTED

**Acceptance Criteria:**
- Status transitions must be validated (e.g., cannot cancel invoiced order)
- Status changes must be audited
- Users can view status history
- Status updates trigger appropriate notifications

**API Endpoints:**
- `UpdateOrderController`
- `SetOrderDetailsCancelledController`
- `SetOrderDetailsOpenController`

#### FR-ORD-003: Order Detail Management
**Priority:** P0 (Critical)

**Description:** Users must be able to manage order line items.

**Acceptance Criteria:**
- Add/edit/remove line items
- Specify product or CPN
- Enter quantity and verify against pricing tiers
- Override commission rate at line item level
- Track fulfillment status per line item
- Manage split rates per line item
- Cancel individual line items

**API Endpoints:**
- `UpdateOrderController`
- `SetOrderDetailFulfillmentStatusController`

#### FR-ORD-004: Order Duplication
**Priority:** P1 (High)

**Description:** Users must be able to duplicate existing orders for recurring purchases.

**Acceptance Criteria:**
- Copy all order header information
- Copy all line items with quantities and pricing
- Copy commission split rates
- Assign new order number
- Reset status to OPEN
- Preserve job/quote linkage

**API Endpoint:** `DuplicateOrderController`

#### FR-ORD-005: Order Balance Tracking
**Priority:** P0 (Critical)

**Description:** System must maintain real-time financial balance for each order.

**Acceptance Criteria:**
- Calculate total order amount
- Track invoiced amount
- Track credited amount
- Calculate remaining balance
- Display commission amounts
- Update balance on order changes, invoices, and credits

**Business Logic Service:** `OrderBalanceService`

#### FR-ORD-006: Order Acknowledgement
**Priority:** P1 (High)

**Description:** Track acknowledgements from factories for order fulfillment.

**Acceptance Criteria:**
- Create acknowledgement records linked to order
- Track acknowledgement status
- Update fulfillment status based on acknowledgements
- Allow multiple acknowledgements per order

**API Endpoints:**
- `CreateOrderAcknowledgementController`
- `FindOrderAcknowledgementByIdController`
- `UpdateOrderAcknowledgementController`
- `DeleteOrderAcknowledgementController`

#### FR-ORD-007: Order Search and Retrieval
**Priority:** P0 (Critical)

**Description:** Users must be able to find orders efficiently.

**Acceptance Criteria:**
- Search by order number
- Search by order ID
- Search by customer
- Search by factory
- Search by date range
- Search by status
- Filter by sales rep
- Support pagination

**API Endpoints:**
- `FindOrderByIdController`
- `FindOrderByOrderNumberController`

#### FR-ORD-008: Participant Management
**Priority:** P1 (High)

**Description:** Track stakeholders involved in orders.

**Acceptance Criteria:**
- Attach participants (contacts) to orders
- Assign participant roles
- Track participant notes
- Detach participants when no longer involved

**API Endpoints:**
- `AttachParticipantToOrderController`
- `DetachParticipantToOrderController`

#### FR-ORD-009: Job Linkage
**Priority:** P2 (Medium)

**Description:** Link orders to jobs/projects for tracking.

**Acceptance Criteria:**
- Assign job ID to order
- Update job ID
- Remove job linkage
- Report on orders by job

**API Endpoint:** `SetOrderJobIdController`

---

## 3.2 INVOICES MODULE

### 3.2.1 Overview
Manages invoice generation from orders, invoice tracking, and payment reconciliation.

### 3.2.2 Core Entities
- **Invoice**: Invoice header
- **InvoiceDetail**: Invoice line items
- **InvoiceBalance**: Financial balance tracking
- **InvoiceSplitRate**: Commission split rates

### 3.2.3 Functional Requirements

#### FR-INV-001: Invoice Creation from Orders
**Priority:** P0 (Critical)

**Description:** Generate invoices from shipped orders.

**Acceptance Criteria:**
- Create invoice header with factory and order reference
- Generate invoice number (unique per factory)
- Copy shipped order details to invoice details
- Calculate invoice total
- Copy commission split rates from order
- Initialize invoice balance
- Set invoice status to OPEN
- Update order billing status

**API Endpoint:** `CreateInvoiceController`

#### FR-INV-002: Invoice Detail Management
**Priority:** P0 (Critical)

**Description:** Manage invoice line items with order detail traceability.

**Acceptance Criteria:**
- Link each invoice detail to order detail
- Track item number for organization
- Specify quantity invoiced
- Calculate amount per line item
- Track commission rate and amount
- Maintain split rate information
- Support partial invoicing of order details

**Business Logic Services:**
- `CanOrderBeInvoicedService`
- Invoice balance calculation services

#### FR-INV-003: Invoice Status Management
**Priority:** P0 (Critical)

**Description:** Track invoice status and lock invoices when paid.

**Status Values:**
- OPEN: Invoice created, not yet paid
- PAID: Invoice fully paid

**Acceptance Criteria:**
- Set invoice status on creation (OPEN)
- Lock invoice when paid (locked = true)
- Prevent changes to locked invoices
- Track payment date (dueDate field)
- Update order billing status when invoice created

#### FR-INV-004: Invoice Search and Retrieval
**Priority:** P0 (Critical)

**Description:** Efficient invoice retrieval and reporting.

**Acceptance Criteria:**
- Search by invoice ID
- Search by order ID
- Search by invoice number
- Search by factory
- Search by date range
- Search by status
- Filter by customer
- Support pagination

**API Endpoints:**
- `FindInvoiceByIdController`
- `FindInvoicesByOrderIdController`

#### FR-INV-005: Invoice Balance Tracking
**Priority:** P0 (Critical)

**Description:** Maintain accurate financial balance for each invoice.

**Acceptance Criteria:**
- Calculate total invoice amount
- Track paid amount (via checks)
- Track credited amount
- Calculate remaining balance
- Display commission amounts
- Update balance on payments and credits

#### FR-INV-006: Invoice Deletion
**Priority:** P1 (High)

**Description:** Allow deletion of invoices with validation.

**Acceptance Criteria:**
- Prevent deletion of locked invoices
- Prevent deletion if invoice has payments
- Prevent deletion if invoice has credits
- Update order billing status on deletion
- Audit deletion with user and timestamp

**API Endpoint:** `DeleteInvoiceController`

#### FR-INV-007: Invoice Update
**Priority:** P0 (Critical)

**Description:** Modify invoice information before locking.

**Acceptance Criteria:**
- Allow updates only for unlocked invoices
- Update invoice header fields (due date, etc.)
- Recalculate balances on updates
- Audit all changes

**API Endpoint:** `UpdateInvoiceController`

---

## 3.3 COMMISSIONS MODULE

### 3.3.1 Overview
Calculate, track, and manage commissions for sales representatives based on orders, invoices, and adjustments.

### 3.3.2 Core Entities
- **OrderSplitRate**: Commission splits at order detail level
- **InvoiceSplitRate**: Commission splits at invoice detail level
- **ExpenseSplitRate**: Commission splits for expenses
- **Check**: Commission payment records
- **CheckDetail**: Payment detail linking to invoices/expenses/credits

### 3.3.3 Functional Requirements

#### FR-COM-001: Commission Calculation from Orders
**Priority:** P0 (Critical)

**Description:** Calculate commission amounts when orders are created.

**Calculation Logic:**
```
Line Item Amount = Quantity × Unit Price
Commission Amount = Line Item Amount × Commission Rate
Rep Commission = Commission Amount × Split Rate %
```

**Acceptance Criteria:**
- Use product default commission rate or line item override
- Apply factory commission discount if configured
- Calculate for all sales reps with split rates
- Support stepped commission tiers (quantity-based rates)
- Handle overage scenarios per factory configuration
- Track commission status (ACCRUING, PAID, ADJUSTED)

**Business Logic Services:**
- Commission calculation services
- Stepped commission tier services

#### FR-COM-002: Commission Split Rate Management
**Priority:** P0 (Critical)

**Description:** Define how commissions are divided among multiple sales representatives.

**Acceptance Criteria:**
- Support multiple reps per line item
- Specify split percentage per rep
- Validate split rates sum to 100% (if enforced)
- Allow different splits per line item
- Copy splits from order to invoice
- Track inside and outside rep splits separately

**Split Rate Types:**
- **Customer Split Rates**: Default splits at customer level
- **Order Split Rates**: Override splits at order detail level
- **Sales Rep Selection**: Factory-customer-specific rep assignments

#### FR-COM-003: Commission Status Tracking
**Priority:** P0 (Critical)

**Description:** Track commission lifecycle from accrual to payment.

**Status Flow:**
```
ACCRUING → PAID (via check)
ACCRUING → ADJUSTED (via credit/deduction)
```

**Acceptance Criteria:**
- Initialize as ACCRUING on order creation
- Update to PAID when included in check
- Update to ADJUSTED when credit applied
- Track commission month for reporting
- Maintain audit trail of status changes

**API Endpoint:** `SetCommissionEntryDataController`

#### FR-COM-004: Commission Reporting
**Priority:** P1 (High)

**Description:** Generate commission reports for sales reps and management.

**Acceptance Criteria:**
- Report by sales rep
- Report by factory
- Report by customer
- Report by commission month
- Report by status (accruing, paid, adjusted)
- Show commission detail (order, invoice, amount, rate, split)
- Calculate totals and subtotals
- Export to PDF/Excel

#### FR-COM-005: Commission Adjustments
**Priority:** P1 (High)

**Description:** Handle commission adjustments via expenses and credits.

**Acceptance Criteria:**
- Reduce commission via credits (deductions)
- Add commission via expenses (bonuses)
- Track adjustment reason
- Link adjustments to checks
- Maintain original commission record
- Audit all adjustments

**Related Modules:** Credits, Expenses, Checks

---

## 3.4 FACTORIES MODULE

### 3.4.1 Overview
Manage factory master data, commission policies, and business rules.

### 3.4.2 Core Entities
- **Factory**: Factory master record
- **FactoryLevel**: Factory classification/levels
- **SteppedCommissionTier**: Quantity-based commission rates
- **FactoryCommissionBand**: Commission band configuration

### 3.4.3 Functional Requirements

#### FR-FAC-001: Factory Master Data
**Priority:** P0 (Critical)

**Description:** Maintain comprehensive factory information.

**Acceptance Criteria:**
- Unique factory title
- Contact information (email, phone)
- Logo URL for branding
- Inside rep assignment
- Publishing status (visibility control)
- Usage tracking (is_used flag)
- Audit trail (created/updated by/date)

**API Endpoints:**
- `CreateFactoryController`
- `FindFactoryByIdController`
- `UpdateFactoryController`
- `DeleteFactoryController`

#### FR-FAC-002: Commission Configuration
**Priority:** P0 (Critical)

**Description:** Configure factory-level commission policies.

**Commission Settings:**
- **Base Commission Rate**: Default commission percentage
- **Commission Discount Rate**: Discount applied to commission
- **Overall Discount Rate**: Additional discount
- **Commission Policy**: Policy type (stepped, flat, band-based)
- **Stepped Commission Tiers**: Quantity-based rates
- **Commission Bands**: Product group-based rates

**Acceptance Criteria:**
- Set default commission rate
- Configure discount rates
- Select commission policy type
- Define stepped commission tiers (min/max quantity, rate)
- Assign commission bands
- Validate rate ranges (0-100%)
- Override at product level if needed

**API Endpoints:**
- `UpdateFactoryController`
- Commission tier and band management endpoints

#### FR-FAC-003: Freight and Payment Terms
**Priority:** P1 (High)

**Description:** Configure factory freight and payment terms.

**Acceptance Criteria:**
- Set freight terms
- Configure freight discount type (ADD, SUBTRACT)
- Set freight discount rate
- Define payment terms
- Set payment due days
- Configure external payment information

#### FR-FAC-004: Sales Model Configuration
**Priority:** P0 (Critical)

**Description:** Define how the factory operates with sales reps.

**Sales Model Options:**
- **Direct Commission**: Rep sells, factory ships and invoices
- **Warehouse Commission**: Rep sells from warehouse inventory
- **Buy/Sell**: Rep purchases from factory and resells
- **Inventory Source Factory**: Factory holds inventory
- **Inventory Source Rep**: Rep holds inventory
- **Invoice Party Factory**: Factory invoices customer
- **Invoice Party Rep**: Rep invoices customer

**Acceptance Criteria:**
- Enable/disable each sales model
- Validate compatible model combinations
- Apply business rules based on model
- Track sales model per order/product

#### FR-FAC-005: Overage Configuration
**Priority:** P1 (High)

**Description:** Configure handling of quantity overages.

**Acceptance Criteria:**
- Define overage type (percentage, fixed amount)
- Set overage percentage or amount
- Configure rep overage share
- Apply overage rules to orders
- Calculate overage charges
- Include in invoice if applicable

**Overage Types:**
- Percentage-based: % over ordered quantity
- Fixed amount: Fixed price for overage

#### FR-FAC-006: Factory Levels
**Priority:** P2 (Medium)

**Description:** Classify factories into levels/tiers.

**Acceptance Criteria:**
- Assign factory to levels
- Support multiple level assignments
- Use levels for reporting and analytics
- Filter factories by level

---

## 3.5 PRODUCTS MODULE

### 3.5.1 Overview
Manage product catalog with pricing, commission rates, and customer-specific configurations.

### 3.5.2 Core Entities
- **Product**: Product master record
- **ProductCategory**: Product categorization
- **ProductUOM**: Units of measure
- **ProductCPN**: Customer part numbers
- **ProductQuantityPricing**: Quantity-based pricing tiers
- **ProductCommissionBand**: Product commission bands
- **ProductMeasurements**: Product dimensions and weight

### 3.5.3 Functional Requirements

#### FR-PRD-001: Product Master Data
**Priority:** P0 (Critical)

**Description:** Maintain comprehensive product information.

**Acceptance Criteria:**
- Unique factory part number per factory
- Product description
- Factory assignment
- Category assignment
- Unit of measure
- Logo/image URL
- Lead time information
- Individual UPC code
- Publishing status
- Usage tracking
- Audit trail

**API Endpoints:**
- `CreateProductController`
- `FindProductByIdController`
- `UpdateProductController`
- `DeleteProductController`

#### FR-PRD-002: Product Pricing
**Priority:** P0 (Critical)

**Description:** Configure product pricing with quantity-based tiers.

**Acceptance Criteria:**
- Set base unit price
- Define quantity pricing tiers (min qty, max qty, price)
- Support unlimited tiers
- Apply correct tier based on order quantity
- Override price at order level if needed
- Track cost for margin calculation

**Pricing Logic:**
```
IF order quantity >= tier min AND order quantity <= tier max
  THEN apply tier price
ELSE apply base price
```

#### FR-PRD-003: Product Commission Configuration
**Priority:** P0 (Critical)

**Description:** Configure commission rates at product level.

**Acceptance Criteria:**
- Set default commission rate (overrides factory default)
- Set commission discount rate
- Set overall discount rate
- Assign to commission bands
- Allow order detail override

**Commission Rate Hierarchy:**
```
1. Order Detail Commission Rate (highest priority)
2. Product Commission Rate
3. Factory Commission Rate (lowest priority)
```

#### FR-PRD-004: Customer Part Numbers (CPN)
**Priority:** P0 (Critical)

**Description:** Map factory part numbers to customer-specific part numbers with pricing.

**Acceptance Criteria:**
- Create CPN for product-customer combination
- Unique CPN per product-customer
- Override unit price at CPN level
- Use CPN price instead of product price on orders
- Search products by CPN
- Display both factory PN and CPN on orders

**API Endpoints:**
- ProductCPN CRUD operations
- CPN search and selection

**Business Logic Service:** `SiteOption.CPN_SELECTION` configuration

#### FR-PRD-005: Product Categories
**Priority:** P1 (High)

**Description:** Organize products into categories.

**Acceptance Criteria:**
- Create product categories
- Assign products to categories
- Support hierarchical categories (optional)
- Filter/search products by category
- Report by category

**API Endpoints:** ProductCategory CRUD operations

#### FR-PRD-006: Units of Measure
**Priority:** P1 (High)

**Description:** Define and manage units of measure for products.

**Acceptance Criteria:**
- Create UOM records (EA, BOX, CASE, etc.)
- Assign UOM to products
- Display UOM on orders and invoices
- Support UOM conversion (optional)

**API Endpoints:** ProductUOM CRUD operations

#### FR-PRD-007: Product Approval Workflow
**Priority:** P1 (High)

**Description:** Require approval for new products or pricing changes.

**Acceptance Criteria:**
- Flag products as needing approval
- Track approval date
- Capture approval comments
- Restrict order creation for unapproved products (optional)
- Notify approvers of pending products

#### FR-PRD-008: Product Measurements
**Priority:** P2 (Medium)

**Description:** Track product dimensions and weight.

**Acceptance Criteria:**
- Record length, width, height
- Record weight
- Specify units (inches, pounds, etc.)
- Calculate shipping costs based on measurements (future)

#### FR-PRD-009: Warehouse Assignment
**Priority:** P1 (High)

**Description:** Assign products to warehouses for inventory tracking.

**Acceptance Criteria:**
- Assign multiple warehouses per product
- Track warehouse IDs (array)
- Filter products by warehouse
- Support warehouse-specific inventory (future)

#### FR-PRD-010: Product Sales Model
**Priority:** P0 (Critical)

**Description:** Define sales model at product level.

**Sales Model Options:**
- Direct commission
- Warehouse commission
- Buy/sell
- Inventory source (factory vs. rep)
- Invoice party (factory vs. rep)
- Payout type

**Acceptance Criteria:**
- Set sales model per product (inherits from factory)
- Override factory sales model if needed
- Apply business rules based on product sales model

#### FR-PRD-011: Overage Configuration
**Priority:** P1 (High)

**Description:** Product-level overage settings.

**Acceptance Criteria:**
- Set overage type (percentage, fixed)
- Set overage amount/percentage
- Set overage unit price
- Calculate overage on orders
- Override factory overage settings

**Business Logic Service:** `CalculateOverageFieldsService`

#### FR-PRD-012: Product Usage Tracking
**Priority:** P2 (Medium)

**Description:** Track whether products are actively used.

**Acceptance Criteria:**
- Mark products as used when included in orders
- Flag unused products for review
- Report on product usage

**Business Logic Service:** `SetIsUsedProductService`

---

## 3.6 CUSTOMERS MODULE

### 3.6.1 Overview
Manage customer master data, relationships, territories, and sales rep assignments.

### 3.6.2 Core Entities
- **Customer**: Customer master record
- **CustomerBranch**: Customer branch locations
- **CustomerTerritory**: Customer territories
- **CustomerSplitRate**: Default outside rep split rates
- **CustomerLevel**: Customer classification

### 3.6.3 Functional Requirements

#### FR-CUS-001: Customer Master Data
**Priority:** P0 (Critical)

**Description:** Maintain comprehensive customer information.

**Acceptance Criteria:**
- Unique company name
- Customer type classification
- Contact information (email, phone)
- Logo URL
- Parent-child relationships (hierarchical customers)
- Inside rep assignment
- Publishing status
- Usage tracking
- Audit trail

**API Endpoints:**
- `CreateCustomerController`
- `FindCustomerByIdController`
- `UpdateCustomerController`
- `DeleteCustomerController`

#### FR-CUS-002: Customer Hierarchy
**Priority:** P1 (High)

**Description:** Support parent-child customer relationships.

**Acceptance Criteria:**
- Assign parent customer
- View child customers under parent
- Inherit settings from parent (optional)
- Report on customer hierarchy
- Navigate hierarchy in UI

**Hierarchy Use Cases:**
- Corporate parent with multiple locations
- Franchise relationships
- Multi-division organizations

#### FR-CUS-003: Customer Split Rates
**Priority:** P0 (Critical)

**Description:** Define default outside sales rep commission splits at customer level.

**Acceptance Criteria:**
- Create split rates for customer
- Assign sales rep
- Specify split percentage
- Support multiple reps per customer
- Use as default for orders
- Allow override at order level

#### FR-CUS-004: Customer Branches
**Priority:** P1 (High)

**Description:** Manage customer branch locations.

**Acceptance Criteria:**
- Create branch records
- Link branches to customers
- Assign branch-specific addresses
- Assign branch-specific contacts
- Select branch on orders (optional)

#### FR-CUS-005: Customer Territories
**Priority:** P1 (High)

**Description:** Assign customers to sales territories.

**Acceptance Criteria:**
- Create territory records
- Assign customers to territories
- Assign sales reps to territories
- Report by territory
- Filter customers by territory

#### FR-CUS-006: Customer Levels
**Priority:** P2 (Medium)

**Description:** Classify customers into levels/tiers.

**Acceptance Criteria:**
- Define customer levels (e.g., Gold, Silver, Bronze)
- Assign customers to levels
- Support multiple level assignments
- Use levels for pricing/commission rules (future)
- Report by customer level

#### FR-CUS-007: Customer Type
**Priority:** P1 (High)

**Description:** Categorize customers by type.

**Customer Types (examples):**
- Direct customer
- Distributor
- Reseller
- End user
- OEM

**Acceptance Criteria:**
- Assign customer type
- Filter/search by type
- Report by type
- Apply business rules by type

#### FR-CUS-008: Customer Usage Tracking
**Priority:** P2 (Medium)

**Description:** Track customer activity.

**Acceptance Criteria:**
- Mark customers as used when orders created
- Flag inactive customers
- Report on customer activity
- Archive inactive customers

---

## 3.7 CREDITS MODULE

### 3.7.1 Overview
Manage credits, adjustments, and deductions against orders and invoices.

### 3.7.2 Core Entities
- **Credit**: Credit header
- **CreditDetail**: Credit line items
- **CreditBalance**: Financial balance
- **CreditReason**: Reason codes
- **DeductionSalesRep**: Sales rep deductions

### 3.7.3 Functional Requirements

#### FR-CRD-001: Credit Creation
**Priority:** P0 (Critical)

**Description:** Create credits against orders for returns, adjustments, or deductions.

**Acceptance Criteria:**
- Link credit to order
- Generate unique credit number per factory
- Select reason code
- Specify credit details from order details
- Calculate credit amount
- Initialize credit balance
- Set status to OPEN
- Update order balance

**API Endpoint:** `CreateCreditController`

**Business Logic Service:** `CanOrderBeCreditedService`

#### FR-CRD-002: Credit Detail Management
**Priority:** P0 (Critical)

**Description:** Manage credit line items linked to order details.

**Acceptance Criteria:**
- Select order details to credit
- Show creditable items (unfulfilled or invoiced quantities)
- Specify credit quantity
- Calculate credit amount
- Track commission impact
- Link to original order detail

#### FR-CRD-003: Credit Reasons
**Priority:** P1 (High)

**Description:** Categorize credits with reason codes.

**Reason Code Examples:**
- Return
- Damaged goods
- Pricing adjustment
- Commission adjustment
- Overpayment
- Other

**Acceptance Criteria:**
- Create reason codes
- Assign reason to credits
- Report by reason
- Audit reason changes

**API Endpoints:** CreditReason CRUD operations

#### FR-CRD-004: Credit Status Management
**Priority:** P0 (Critical)

**Description:** Track credit lifecycle.

**Status Values:**
- OPEN: Credit created, not processed
- LOCKED: Credit processed, cannot modify

**Acceptance Criteria:**
- Initialize as OPEN
- Lock when processed via check
- Prevent changes to locked credits
- Audit status changes

#### FR-CRD-005: Deduction Sales Rep Tracking
**Priority:** P1 (High)

**Description:** Track commission deductions per sales rep.

**Acceptance Criteria:**
- Identify sales reps affected by credit
- Calculate deduction amount per rep
- Link deduction to check detail
- Report deductions by rep
- Adjust commission status

**Business Logic Service:** `SetDeductionSalesRepsService`

#### FR-CRD-006: Credit Balance Tracking
**Priority:** P0 (Critical)

**Description:** Maintain accurate credit balance.

**Acceptance Criteria:**
- Calculate total credit amount
- Track applied amount (via checks)
- Calculate remaining balance
- Update on credit changes and check processing

#### FR-CRD-007: Credit Cancel Remaining
**Priority:** P1 (High)

**Description:** Cancel remaining unfulfilled quantities on order.

**Acceptance Criteria:**
- Select order details to cancel
- Calculate cancellation impact
- Update order detail status to CANCELLED
- Create credit record for cancelled items
- Update order fulfillment status

**API Endpoint:** `CreditCancelRemainingController`

**Business Logic Service:** `CreditCancelRemainingService`

#### FR-CRD-008: Credit Invoice Remaining
**Priority:** P1 (High)

**Description:** Invoice remaining unfulfilled quantities.

**Acceptance Criteria:**
- Select order details to invoice
- Calculate invoice amount
- Create invoice for remaining quantities
- Update order billing status

**API Endpoint:** `CreditInvoiceRemainingController`

#### FR-CRD-009: Credit Search and Retrieval
**Priority:** P0 (Critical)

**Description:** Efficient credit retrieval.

**Acceptance Criteria:**
- Search by credit ID
- Search by order ID
- Search by check ID
- Search by factory
- Search by date range
- Search by status
- Support pagination

**API Endpoints:**
- `FindCreditByIdController`
- `FindCreditsByOrderIdController`
- `FindCreditsByCheckIdController`

---

## 3.8 CHECKS MODULE

### 3.8.1 Overview
Manage commission payment checks including invoice payments, expense adjustments, and credit deductions.

### 3.8.2 Core Entities
- **Check**: Check/payment header
- **CheckDetail**: Payment details
- **CheckBalance**: Financial balance

### 3.8.3 Functional Requirements

#### FR-CHK-001: Check Creation
**Priority:** P0 (Critical)

**Description:** Create commission payment checks.

**Acceptance Criteria:**
- Generate unique check number per factory
- Assign to sales rep
- Set commission month
- Set post date
- Initialize check balance
- Set status to OPEN
- Add check details (invoices, expenses, credits)

**API Endpoint:** `CreateCheckController`

#### FR-CHK-002: Check Detail Management
**Priority:** P0 (Critical)

**Description:** Manage check details linking to invoices, expenses, and credits.

**Check Detail Types:**
- **Invoice Payment**: Pay commission on invoice
- **Expense Adjustment**: Add commission via expense
- **Credit Deduction**: Reduce commission via credit

**Acceptance Criteria:**
- Add invoice details to check
- Add expense adjustments to check
- Add credit deductions to check
- Calculate check total
- Track detail type
- Link to source entity (invoice/expense/credit)
- Validate amounts against balances

#### FR-CHK-003: Check Posting
**Priority:** P0 (Critical)

**Description:** Post checks to finalize commission payments.

**Acceptance Criteria:**
- Validate check balance before posting
- Set status to POSTED
- Update commission status on related invoices
- Lock related credits
- Update check balance
- Prevent changes to posted checks
- Generate check report/PDF

#### FR-CHK-004: Check Balance Tracking
**Priority:** P0 (Critical)

**Description:** Maintain accurate check balance.

**Acceptance Criteria:**
- Sum invoice payment amounts
- Add expense adjustment amounts
- Subtract credit deduction amounts
- Calculate net check amount
- Validate balance before posting

**Balance Calculation:**
```
Check Amount = Σ(Invoice Payments) + Σ(Expense Adjustments) - Σ(Credit Deductions)
```

#### FR-CHK-005: Check Search and Retrieval
**Priority:** P0 (Critical)

**Description:** Efficient check retrieval and reporting.

**Acceptance Criteria:**
- Search by check ID
- Search by check number
- Search by sales rep
- Search by factory
- Search by commission month
- Search by post date range
- Search by status
- Support pagination

**API Endpoint:** `FindCheckByIdController`

#### FR-CHK-006: Commission Month Tracking
**Priority:** P1 (High)

**Description:** Track commission period for checks.

**Acceptance Criteria:**
- Assign commission month to check
- Report checks by commission month
- Track commission accrual vs. payment timing
- Support fiscal period reporting

---

## 3.9 EXPENSES MODULE

### 3.9.1 Overview
Manage expense tracking for commission adjustments, bonuses, and other payments.

### 3.9.2 Core Entities
- **Expense**: Expense header
- **ExpenseCategory**: Expense reason codes
- **ExpenseSplitRate**: Commission splits for expenses

### 3.9.3 Functional Requirements

#### FR-EXP-001: Expense Creation
**Priority:** P1 (High)

**Description:** Create expense records for commission adjustments.

**Acceptance Criteria:**
- Generate unique expense number
- Assign category/reason
- Link to customer (optional)
- Specify amount
- Add notes/description
- Define split rates for sales reps
- Initialize expense status

**API Endpoint:** `CreateExpenseController`

#### FR-EXP-002: Expense Categories
**Priority:** P1 (High)

**Description:** Categorize expenses with reason codes.

**Category Examples:**
- Bonus
- Adjustment
- Rebate
- Marketing credit
- Override
- Other

**Acceptance Criteria:**
- Create category codes
- Assign category to expenses
- Report by category
- Audit category changes

**API Endpoints:** ExpenseCategory CRUD operations

#### FR-EXP-003: Expense Split Rates
**Priority:** P1 (High)

**Description:** Distribute expense amounts among sales reps.

**Acceptance Criteria:**
- Assign multiple sales reps
- Specify split percentage per rep
- Validate splits sum to 100%
- Calculate amount per rep
- Include in commission checks

#### FR-EXP-004: Expense-Check Linkage
**Priority:** P1 (High)

**Description:** Link expenses to check details for payment.

**Acceptance Criteria:**
- Include expense in check detail
- Track expense as adjustment type
- Update expense status when paid
- Prevent duplicate payment

#### FR-EXP-005: Expense Search and Retrieval
**Priority:** P1 (High)

**Description:** Efficient expense retrieval.

**Acceptance Criteria:**
- Search by expense ID
- Search by expense number
- Search by category
- Search by customer
- Search by date range
- Support pagination

**API Endpoints:**
- `FindExpenseByIdController`
- `UpdateExpenseController`
- `DeleteExpenseController`

---

## 3.10 WAREHOUSE ITEMS MODULE

### 3.10.1 Overview
Track warehouse inventory, locations, and stock management.

### 3.10.2 Implementation Notes

**Current State:**
- Products have `warehouseIds` array field
- `InventorySourceEnum` includes WAREHOUSE option
- Product configuration supports warehouse commission model

**Future Requirements:**
(To be specified in future PRD versions)

### 3.10.3 Functional Requirements

#### FR-WHS-001: Warehouse Assignment
**Priority:** P1 (High)

**Description:** Assign products to warehouses.

**Acceptance Criteria:**
- Assign multiple warehouses per product
- Store warehouse IDs in product record
- Filter products by warehouse
- Report on warehouse product assignments

**Implementation:** Product.warehouseIds field

#### FR-WHS-002: Inventory Source Configuration
**Priority:** P1 (High)

**Description:** Specify inventory source for products.

**Inventory Source Options:**
- Factory
- Rep/Warehouse

**Acceptance Criteria:**
- Set inventory source per product
- Apply business rules based on source
- Track warehouse as inventory source

**Implementation:** Product.inventorySource field (InventorySourceEnum)

#### FR-WHS-003: Warehouse Commission Model
**Priority:** P1 (High)

**Description:** Support warehouse-based commission calculations.

**Acceptance Criteria:**
- Enable warehouse commission on factory
- Configure warehouse commission rates
- Calculate commission for warehouse sales
- Differentiate from direct commission

**Implementation:** Factory.warehouseCommissionAllowed field

---

## 3.11 ADMIN SECTION

### 3.11.1 Overview
Administrative portal for system configuration, user management, and monitoring.

### 3.11.2 Components

Based on flow-admin repository structure, the admin section includes:

#### FR-ADM-001: Dashboard
**Priority:** P0 (Critical)

**Description:** Admin analytics and system monitoring.

**Acceptance Criteria:**
- Display system health metrics
- Show recent activity
- Display user statistics
- Show transaction summaries
- Alert on system issues

#### FR-ADM-002: Core Configuration
**Priority:** P0 (Critical)

**Description:** System-wide settings management.

**Acceptance Criteria:**
- Configure site options (key-value pairs)
- Set commission options
- Configure inside rep assignment rules
- Set CPN selection preferences
- Manage global defaults

**Implementation:** SiteOption entity

**API Endpoints:**
- `FindSiteSettingDataController`
- `UpdateSiteSettingController`

#### FR-ADM-003: Client/Tenant Management
**Priority:** P0 (Critical)

**Description:** Multi-tenant administration.

**Acceptance Criteria:**
- Create/update tenant records
- Configure tenant settings
- Assign plan to tenant
- Manage tenant users
- Monitor tenant usage
- Isolate tenant data

#### FR-ADM-004: Permission Management
**Priority:** P0 (Critical)

**Description:** RBAC configuration.

**Acceptance Criteria:**
- Define roles
- Assign permissions to roles
- Configure resource-level access (VIEW, WRITE, DELETE)
- Assign roles to users
- Test permission configurations
- Audit permission changes

**RBAC Resources:**
- ORDER, INVOICE, CREDIT, CHECK, EXPENSE
- CUSTOMER, FACTORY, PRODUCT
- ADMIN, CONFIGURATION, REPORTS

#### FR-ADM-005: Plan Management
**Priority:** P1 (High)

**Description:** Subscription/plan configuration.

**Acceptance Criteria:**
- Define plans (features, limits)
- Assign plans to tenants
- Enforce plan limits
- Track plan usage
- Upgrade/downgrade plans

**API Endpoints:**
- `FindPlanTypeController`
- `FindPlanMenuController`

#### FR-ADM-006: Resource Management
**Priority:** P1 (High)

**Description:** System resource monitoring and allocation.

**Acceptance Criteria:**
- Monitor system resources (CPU, memory, DB connections)
- Set resource limits per tenant
- Alert on resource thresholds
- Optimize resource usage

#### FR-ADM-007: Keycloak Integration
**Priority:** P0 (Critical)

**Description:** Authentication provider integration.

**Acceptance Criteria:**
- Configure Keycloak connection
- Sync users from Keycloak
- Map Keycloak roles to system roles
- Support SSO
- Manage user sessions

#### FR-ADM-008: Policy Management
**Priority:** P1 (High)

**Description:** Business policy configuration.

**Acceptance Criteria:**
- Configure commission policies
- Set approval workflows
- Define validation rules
- Configure business constraints

#### FR-ADM-009: Address Management
**Priority:** P1 (High)

**Description:** Global address and location management.

**Acceptance Criteria:**
- Manage countries and subdivisions
- Configure address formats
- Validate addresses
- Support address autocomplete

#### FR-ADM-010: Customer Administration
**Priority:** P0 (Critical)

**Description:** Admin-level customer management.

**Acceptance Criteria:**
- View all customers across tenants (if applicable)
- Bulk customer operations
- Customer data import/export
- Customer merging/deduplication

#### FR-ADM-011: Factory Administration
**Priority:** P0 (Critical)

**Description:** Admin-level factory management.

**Acceptance Criteria:**
- View all factories
- Bulk factory operations
- Factory data import/export

#### FR-ADM-012: Product Administration
**Priority:** P0 (Critical)

**Description:** Admin-level product management.

**Acceptance Criteria:**
- View all products
- Bulk product operations
- Product data import/export
- Product approval workflow

#### FR-ADM-013: Invoice Administration
**Priority:** P1 (High)

**Description:** Admin-level invoice management and oversight.

**Acceptance Criteria:**
- View all invoices
- Unlock invoices (with audit)
- Bulk invoice operations
- Invoice reconciliation

#### FR-ADM-014: Payment Administration
**Priority:** P1 (High)

**Description:** Admin-level payment and check management.

**Acceptance Criteria:**
- View all checks
- Reverse posted checks (with audit)
- Bulk check operations
- Payment reconciliation

#### FR-ADM-015: Relationship Management
**Priority:** P1 (High)

**Description:** Manage entity relationships.

**Acceptance Criteria:**
- Configure factory-customer relationships
- Manage sales rep selections
- Assign default split rates
- Audit relationship changes

---

## 3.12 SUPPORTING MODULES

### 3.12.1 Notes Module

#### FR-NOT-001: Entity Notes
**Priority:** P1 (High)

**Description:** Add notes/comments to entities.

**Acceptance Criteria:**
- Create notes for orders, customers, products, etc.
- Link notes to entity via source_id + entity_type
- Support rich text content
- Track creator and timestamps
- Flag private notes
- Tag notes with categories

**API Endpoints:**
- `CreateNoteController`
- `FindNoteByIdController`
- `FindNotesBySourceIdController`
- `UpdateNoteController`
- `DeleteNoteController`
- `DuplicateNoteController`

#### FR-NOT-002: Threaded Conversations
**Priority:** P2 (Medium)

**Description:** Support threaded note conversations.

**Acceptance Criteria:**
- Reply to notes (parent-child relationship)
- Organize notes into threads
- Subscribe to threads for notifications
- View conversation history

**Entities:** Note, NoteThread, NoteThreadSubscription

#### FR-NOT-003: Note Tags
**Priority:** P2 (Medium)

**Description:** Categorize notes with tags.

**Acceptance Criteria:**
- Create note tags
- Assign multiple tags per note
- Filter notes by tag
- Report by tag

---

### 3.12.2 Address Module

#### FR-ADR-001: Address Management
**Priority:** P0 (Critical)

**Description:** Manage addresses for customers and factories.

**Acceptance Criteria:**
- Create addresses with complete components
- Link addresses to customers/factories
- Support multiple addresses per entity
- Designate address types (billing, shipping, etc.)
- Validate address format
- Normalize country and subdivision

**Fields:**
- Recipient, Organization
- Address Line 1, 2, 3
- Locality (city)
- Administrative Area (state/province)
- Postal Code
- Country
- Subdivision

**API Endpoints:**
- `CreateAddressController`
- `FindAddressByIdController`
- `UpdateAddressController`
- `DeleteAddressController`

---

### 3.12.3 Contact Module

#### FR-CON-001: Contact Management
**Priority:** P0 (Critical)

**Description:** Manage contact persons for customers and factories.

**Acceptance Criteria:**
- Create contacts with name, title, email, phone
- Link contacts to customers/factories
- Mark primary contact
- Set contact preferences (email, phone, text)
- Support multiple contacts per entity

**API Endpoints:**
- `CreateContactController`
- `FindContactByIdController`
- `FindContactsBySourceIdController`
- `UpdateContactController`
- `DeleteContactController`
- `FindAllContactsController`

---

### 3.12.4 Phone Number Module

#### FR-PHN-001: Phone Number Management
**Priority:** P1 (High)

**Description:** Manage phone numbers for entities.

**Acceptance Criteria:**
- Create phone number records
- Link to customers/factories/contacts
- Support phone types (mobile, office, fax)
- Validate phone format
- Track verification status

---

### 3.12.5 Participant Module

#### FR-PAR-001: Participant Management
**Priority:** P1 (High)

**Description:** Track stakeholders involved in transactions.

**Acceptance Criteria:**
- Attach participants to orders, invoices, checks
- Assign participant roles
- Link participants to contacts
- Add notes for participants
- Detach participants when no longer involved

**API Endpoints:**
- `AttachParticipantToEntityController`
- `DetachParticipantToEntityController`
- `FindParticipantsBySourceIdController`
- `UpdateParticipantController`

---

### 3.12.6 Document Templates Module

#### FR-TPL-001: Template Management
**Priority:** P1 (High)

**Description:** Manage document templates for PDF generation.

**Acceptance Criteria:**
- Create templates for orders, invoices, quotes
- Use HTML with Handlebars syntax
- Support multi-tenant templates
- Mark default templates
- Generate PDFs from templates
- Preview templates with sample data

**Entities:** DocumentTemplate

**Template Types:**
- Order confirmation
- Invoice
- Quote
- Commission statement

**Business Logic Services:**
- TemplateService
- PdfRenderService
- OrderService/QuoteService (for data population)

---

## 4. Cross-Functional Requirements

### 4.1 Security and Permissions

#### NFR-SEC-001: Role-Based Access Control (RBAC)
**Priority:** P0 (Critical)

**Description:** Enforce role-based access control across all modules.

**Acceptance Criteria:**
- Define roles (Admin, Sales Manager, Sales Rep, Operations, Finance, etc.)
- Assign permissions per role per resource
- Support VIEW, WRITE, DELETE privilege types
- Filter data based on user permissions (Hibernate filters)
- Audit permission checks

**RBAC Resources:**
- ORDER, INVOICE, CREDIT, CHECK, EXPENSE
- CUSTOMER, FACTORY, PRODUCT
- ADMIN, CONFIGURATION, REPORTS

**Implementation:**
- `@RBACFilter` annotations on entities
- Hibernate filters for row-level security
- Permission validation in controllers

#### NFR-SEC-002: Multi-Tenancy
**Priority:** P0 (Critical)

**Description:** Support multiple tenants with data isolation.

**Acceptance Criteria:**
- Tenant-aware data access (all queries filter by tenantId)
- Tenant-specific configuration
- Prevent cross-tenant data access
- Support tenant onboarding/offboarding

#### NFR-SEC-003: Authentication Integration
**Priority:** P0 (Critical)

**Description:** Integrate with Keycloak for authentication.

**Acceptance Criteria:**
- SSO support
- Token-based authentication
- Session management
- User role synchronization

### 4.2 Audit and Compliance

#### NFR-AUD-001: Audit Trail
**Priority:** P0 (Critical)

**Description:** Maintain complete audit trail for all transactions.

**Acceptance Criteria:**
- Track created by/date for all entities
- Track updated by/date for all entities
- Use Hibernate Envers for entity history
- Support audit log queries
- Retain audit data per compliance requirements

**Implementation:** Envers integration on all major entities

#### NFR-AUD-002: User Action Tracking
**Priority:** P1 (High)

**Description:** Track user actions across the system.

**Acceptance Criteria:**
- Log user login/logout
- Log entity creation/update/deletion
- Log permission changes
- Log configuration changes
- Support audit report generation

### 4.3 Performance

#### NFR-PRF-001: Response Time
**Priority:** P0 (Critical)

**Description:** Ensure responsive user experience.

**Acceptance Criteria:**
- GraphQL queries < 500ms (p95)
- GraphQL mutations < 1s (p95)
- List operations with pagination < 1s (p95)
- Report generation < 5s for standard reports

#### NFR-PRF-002: Scalability
**Priority:** P0 (Critical)

**Description:** Support growing data volumes and user base.

**Acceptance Criteria:**
- Support 1000+ concurrent users
- Handle 100,000+ orders per month
- Database query optimization (indexes, query plans)
- Horizontal scaling via Kubernetes

### 4.4 Data Quality

#### NFR-DAT-001: Data Validation
**Priority:** P0 (Critical)

**Description:** Validate data integrity at all layers.

**Acceptance Criteria:**
- Entity-level validation (JPA constraints)
- Business logic validation (service layer)
- API input validation (GraphQL)
- Unique constraint enforcement
- Foreign key integrity

#### NFR-DAT-002: Data Consistency
**Priority:** P0 (Critical)

**Description:** Maintain data consistency across related entities.

**Acceptance Criteria:**
- Transactional updates (ACID)
- Balance calculations are accurate
- Status transitions are valid
- Referential integrity is maintained

### 4.5 Reporting

#### NFR-RPT-001: Standard Reports
**Priority:** P1 (High)

**Description:** Provide standard business reports.

**Reports:**
- Order status report
- Invoice aging report
- Commission report by rep
- Commission report by factory
- Commission report by customer
- Sales summary report
- Product performance report
- Customer activity report

**Acceptance Criteria:**
- Filter by date range
- Filter by entity (customer, factory, rep, etc.)
- Support export to PDF/Excel
- Schedule report generation (future)

#### NFR-RPT-002: Custom Reports
**Priority:** P2 (Medium)

**Description:** Support ad-hoc reporting and analytics.

**Acceptance Criteria:**
- Define custom report queries
- Save report definitions
- Share reports with users
- Export to multiple formats

### 4.6 Integration

#### NFR-INT-001: GraphQL API
**Priority:** P0 (Critical)

**Description:** Provide GraphQL API for all operations.

**Acceptance Criteria:**
- Queries for data retrieval
- Mutations for data modification
- Schema documentation
- Error handling with meaningful messages
- API versioning support (future)

#### NFR-INT-002: External Integrations
**Priority:** P2 (Medium)

**Description:** Support integration with external systems.

**Integration Points (future):**
- ERP systems
- Accounting systems (QuickBooks, Xero)
- CRM systems
- E-commerce platforms
- Shipping systems

### 4.7 Usability

#### NFR-USA-001: User Interface
**Priority:** P0 (Critical)

**Description:** Provide intuitive, responsive user interface.

**Acceptance Criteria:**
- Mobile-responsive design
- Consistent UI patterns
- Helpful error messages
- Keyboard shortcuts for power users
- Contextual help

#### NFR-USA-002: Search and Filter
**Priority:** P0 (Critical)

**Description:** Efficient search and filtering across all entities.

**Acceptance Criteria:**
- Full-text search where applicable
- Advanced filtering options
- Saved search/filter presets
- Quick search from global navigation

---

## 5. User Stories

### 5.1 Sales Representative User Stories

**US-SR-001: Create Order**
```
As a sales representative
I want to create an order for my customer
So that I can track the sale and earn commission

Acceptance Criteria:
- I can search for the customer
- I can select products by factory part number or CPN
- The system shows me quantity pricing tiers
- I can see my commission rate for each line item
- I can save the order as a draft
- I receive confirmation when the order is created
```

**US-SR-002: Track Commission**
```
As a sales representative
I want to view my commission status
So that I know what I've earned and what I'm owed

Acceptance Criteria:
- I can view all my orders with commission amounts
- I can filter by commission status (accruing, paid)
- I can see which invoices have been paid
- I can view my commission checks
- I can download commission statements
```

**US-SR-003: Duplicate Recurring Order**
```
As a sales representative
I want to duplicate a previous order
So that I can quickly create recurring orders for my customers

Acceptance Criteria:
- I can find the original order
- I can click "Duplicate"
- The system creates a new order with the same products and quantities
- I can modify the duplicated order before saving
```

### 5.2 Operations User Stories

**US-OP-001: Process Order Fulfillment**
```
As an operations staff member
I want to update order fulfillment status
So that customers and sales reps know when products ship

Acceptance Criteria:
- I can view all open orders
- I can update fulfillment status per line item
- I can create order acknowledgements
- The system updates order status automatically
```

**US-OP-002: Generate Invoices**
```
As an operations staff member
I want to generate invoices for shipped orders
So that customers can be billed

Acceptance Criteria:
- I can select shipped orders
- I can generate invoices in bulk
- The system creates invoice line items from order details
- Invoice numbers are unique per factory
- I can preview invoices before saving
```

### 5.3 Finance User Stories

**US-FN-001: Process Commission Payments**
```
As a finance staff member
I want to create commission checks for sales reps
So that they are paid accurately and on time

Acceptance Criteria:
- I can view all unpaid invoices by sales rep
- I can select invoices to include in a check
- I can add expense adjustments
- I can deduct credits
- The system calculates the net check amount
- I can post the check to finalize payment
```

**US-FN-002: Handle Credits and Adjustments**
```
As a finance staff member
I want to create credits for returns and adjustments
So that order and commission balances are accurate

Acceptance Criteria:
- I can select an order to credit
- I can specify reason codes
- I can select which line items to credit
- The system calculates commission deductions
- I can link credits to commission checks
```

### 5.4 Administrator User Stories

**US-AD-001: Configure Factory Commission**
```
As an administrator
I want to configure factory commission policies
So that commissions are calculated correctly

Acceptance Criteria:
- I can set base commission rate
- I can configure discount rates
- I can create stepped commission tiers
- I can assign commission bands
- I can test commission calculations
```

**US-AD-002: Manage User Permissions**
```
As an administrator
I want to manage user roles and permissions
So that users have appropriate access

Acceptance Criteria:
- I can create roles
- I can assign permissions to roles
- I can assign roles to users
- I can test permission configurations
- Changes take effect immediately
```

**US-AD-003: Configure Site Options**
```
As an administrator
I want to configure global site options
So that the system operates according to business rules

Acceptance Criteria:
- I can view all site options
- I can update option values
- I can add new options
- Changes are audited
- I can revert to previous values
```

---

## 6. Data Model Summary

### 6.1 Core Entities

**flow-commission:**
- Order, OrderDetail, OrderBalance, OrderSplitRate, OrderInsideRep, OrderAcknowledgement
- Invoice, InvoiceDetail, InvoiceBalance, InvoiceSplitRate
- Credit, CreditDetail, CreditBalance, CreditReason, DeductionSalesRep
- Check, CheckDetail, CheckBalance
- Expense, ExpenseCategory, ExpenseSplitRate

**flow-core:**
- Customer, CustomerBranch, CustomerTerritory, CustomerSplitRate, CustomerLevel
- Factory, FactoryLevel, SteppedCommissionTier, FactoryCommissionBand
- Product, ProductCategory, ProductUOM, ProductCPN, ProductQuantityPricing, ProductCommissionBand, ProductMeasurements
- SalesRepSelection, SalesRepSplitRate, FactoryCustomerId
- Note, NoteThread, NoteTag, NoteThreadSubscription
- Address, Country, Subdivision, PhoneNumber
- Contact
- Participant
- SiteOption
- DocumentTemplate

### 6.2 Key Relationships

```
Factory 1:N Product
Factory 1:N Order
Factory 1:N Invoice
Factory 1:N Check

Customer 1:N Order (sold-to)
Customer 1:N Order (bill-to)
Customer 1:N ProductCPN

Product 1:N OrderDetail
Product 1:N ProductCPN
Product 1:N ProductQuantityPricing

Order 1:N OrderDetail
Order 1:1 OrderBalance
Order 1:N Invoice
Order 1:N Credit

Invoice 1:N InvoiceDetail
Invoice 1:1 InvoiceBalance

OrderDetail 1:N InvoiceDetail
OrderDetail 1:N CreditDetail
OrderDetail 1:N OrderSplitRate

Check 1:N CheckDetail
CheckDetail N:1 InvoiceDetail (optional)
CheckDetail N:1 Expense (optional)
CheckDetail N:1 Credit (optional)
```

---

## 7. Success Metrics

### 7.1 Business Metrics

**Order Processing:**
- Order-to-invoice cycle time: < 5 days (average)
- Order error rate: < 2%
- Order duplication time: < 30 seconds

**Commission Accuracy:**
- Commission calculation error rate: < 0.1%
- Commission dispute rate: < 1%
- Commission payment timeliness: 100% on-time

**User Adoption:**
- Daily active users: 80% of license count
- Orders created per user per day: > 5 (sales reps)
- User satisfaction score: > 4.0/5.0

### 7.2 Technical Metrics

**Performance:**
- API response time (p95): < 500ms
- Page load time (p95): < 2s
- Database query time (p95): < 200ms

**Reliability:**
- System uptime: 99.9%
- Data loss incidents: 0
- Security incidents: 0

**Data Quality:**
- Data validation error rate: < 1%
- Balance reconciliation discrepancies: 0
- Audit trail completeness: 100%

---

## 8. Technical Architecture

### 8.1 Backend Architecture

**Technology:**
- Java 21
- Spring Boot 3.3.3
- Spring Data JPA
- Hibernate ORM 6.x with Envers
- PostgreSQL 15+

**API Layer:**
- GraphQL via graphql-kickstart
- Controller-based endpoint mapping
- DTO/projection support

**Data Layer:**
- Repository pattern (Spring Data JPA)
- Custom queries via JPQL/native SQL
- Liquibase for schema migrations
- Envers for audit trail

**Security Layer:**
- Keycloak integration
- RBAC with custom annotations
- Hibernate filters for row-level security
- Multi-tenant data isolation

### 8.2 Database Schema

**Schema Management:**
- Liquibase changesets
- Version-controlled migrations
- Automated migration on deployment

**Performance:**
- Indexed foreign keys
- Composite indexes for common queries
- Partitioning for large tables (future)

### 8.3 Deployment Architecture

**Containerization:**
- Docker images
- Kubernetes manifests (.k8s directory)

**Scalability:**
- Horizontal pod autoscaling
- Load balancing
- Database connection pooling

**Monitoring:**
- Application metrics (via Micrometer)
- Log aggregation (via ELK stack)
- Health checks

---

## 9. Future Enhancements

### 9.1 Phase 2 Features

**Enhanced Warehouse Management:**
- Real-time inventory tracking
- Warehouse transfers
- Stock alerts
- Cycle counting

**Advanced Reporting:**
- Custom report builder
- Scheduled report delivery
- Dashboard customization
- Predictive analytics

**Workflow Automation:**
- Approval workflows (configurable)
- Email notifications
- Task management
- SLA tracking

**Mobile Application:**
- Native mobile app (iOS/Android)
- Order entry on mobile
- Commission tracking on mobile
- Offline support

### 9.2 Phase 3 Features

**E-Commerce Integration:**
- Online ordering portal for customers
- Product catalog publishing
- Real-time pricing and availability
- Shopping cart and checkout

**Advanced Commission Models:**
- Tiered commission structures
- Performance-based bonuses
- Team commission splitting
- Commission draws and advances

**Financial Integration:**
- QuickBooks/Xero integration
- Automated journal entries
- Bank reconciliation
- Credit card processing

**Supply Chain Integration:**
- EDI support
- Shipping integration (FedEx, UPS)
- Tracking number automation
- Dropship support

---

## 10. Glossary

**CPN (Customer Part Number):** Customer-specific product identifier that maps to factory part number with optional price override

**Commission Accruing:** Commission status indicating commission has been earned but not yet paid

**Commission Band:** Product grouping for commission rate configuration

**Credit:** Adjustment record that reduces order/invoice amount, often for returns or pricing corrections

**Deduction:** Commission reduction applied to sales rep via credit

**Expense:** Additional payment to sales rep, such as bonus or adjustment

**Factory:** Manufacturer or supplier of products

**Inside Rep:** Sales representative employed by the company (vs. independent outside rep)

**Outside Rep:** Independent sales representative working on commission

**Split Rate:** Percentage allocation of commission among multiple sales representatives

**Stepped Commission:** Commission rate that varies based on quantity tiers

**Overage:** Quantity or amount above the ordered amount, subject to special pricing or commission rules

---

## 11. Appendices

### Appendix A: API Endpoint Summary

**Orders (flow-commission):**
- CreateOrderController
- FindOrderByIdController
- FindOrderByOrderNumberController
- UpdateOrderController
- DeleteOrderController
- DuplicateOrderController
- SetOrderJobIdController
- OrderAcknowledgement CRUD
- SetOrderDetailFulfillmentStatusController
- AttachParticipantToOrderController
- DetachParticipantToOrderController

**Invoices (flow-commission):**
- CreateInvoiceController
- FindInvoiceByIdController
- FindInvoicesByOrderIdController
- UpdateInvoiceController
- DeleteInvoiceController

**Credits (flow-commission):**
- CreateCreditController
- FindCreditByIdController
- FindCreditsByOrderIdController
- FindCreditsByCheckIdController
- UpdateCreditController
- DeleteCreditController
- CreditCancelRemainingController
- CreditInvoiceRemainingController
- CreditReason CRUD

**Checks (flow-commission):**
- CreateCheckController
- FindCheckByIdController
- UpdateCheckController
- DeleteCheckController
- CheckDetail operations

**Expenses (flow-commission):**
- CreateExpenseController
- FindExpenseByIdController
- UpdateExpenseController
- DeleteExpenseController
- ExpenseCategory CRUD

**Customers (flow-core):**
- CreateCustomerController
- FindCustomerByIdController
- UpdateCustomerController
- DeleteCustomerController
- CustomerBranch operations
- CustomerTerritory operations

**Factories (flow-core):**
- CreateFactoryController
- FindFactoryByIdController
- UpdateFactoryController
- DeleteFactoryController

**Products (flow-core):**
- CreateProductController
- FindProductByIdController
- UpdateProductController
- DeleteProductController
- ProductCategory CRUD
- ProductCPN operations
- ProductUOM operations

**Notes (flow-core):**
- CreateNoteController
- FindNoteByIdController
- FindNotesBySourceIdController
- UpdateNoteController
- DeleteNoteController
- DuplicateNoteController

**Addresses (flow-core):**
- CreateAddressController
- FindAddressByIdController
- UpdateAddressController
- DeleteAddressController

**Contacts (flow-core):**
- CreateContactController
- FindContactByIdController
- FindContactsBySourceIdController
- UpdateContactController
- DeleteContactController
- FindAllContactsController

**Participants (flow-core):**
- AttachParticipantToEntityController
- DetachParticipantToEntityController
- FindParticipantsBySourceIdController
- UpdateParticipantController

**Admin (flow-core):**
- FindSiteSettingDataController
- UpdateSiteSettingController
- FindPlanTypeController
- FindPlanMenuController

**Total Controllers: 185+ across both repositories**

### Appendix B: Status Enums

**Order Statuses:**
- OrderStatusEnum: OPEN, PARTIAL_SHIPPED, SHIPPED_COMPLETE, CANCELLED, OVER_SHIPPED
- OrderHeaderStatus: OPEN
- OrderConfirmationStatus: NONE
- FulfillmentStatus: NOT_STARTED, IN_PROGRESS, COMPLETED
- BillingStatus: NOT_INVOICED, PARTIAL_INVOICED, FULLY_INVOICED
- CommissionStatus: ACCRUING, PAID, ADJUSTED

**Invoice Statuses:**
- InvoiceStatusEnum: OPEN, PAID

**Credit Statuses:**
- CreditStatusEnum: OPEN, LOCKED

**Check Statuses:**
- CheckStatusEnum: OPEN, POSTED

**Expense Statuses:**
- ExpenseStatusEnum: OPEN, CLOSED

### Appendix C: Configuration Options

**SiteOption Keys:**
- Commission calculation method
- Inside rep assignment rules
- CPN selection preferences
- Default freight terms
- Default payment terms
- Commission month calculation

**Factory Configuration:**
- Commission rates (base, discount, overall)
- Freight terms and discounts
- Payment terms
- Sales model enablement flags
- Overage settings
- Commission policy selection

**Product Configuration:**
- Commission rates (override factory)
- Sales model
- Inventory source
- Invoice party
- Payout type
- Warehouse assignments
- Approval requirements

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | System Generated | Initial PRD based on codebase exploration |

**Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Engineering Lead | | | |
| Business Stakeholder | | | |

**Distribution:**

This document should be distributed to:
- Product Management
- Engineering Team
- QA Team
- Business Stakeholders
- Sales Leadership
- Finance Leadership

---

END OF DOCUMENT
