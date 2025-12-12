# Flow CRM - Warehouse Management Implementation Plan

A comprehensive feature-by-feature implementation plan for adding warehouse management capabilities to the Flow CRM application.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Foundational Data Connections](#foundational-data-connections)
3. [Navigation Structure](#navigation-structure)
4. [Feature Breakdown](#feature-breakdown)
   - [Overview Dashboard](#1-overview-dashboard)
   - [Inventory Management](#2-inventory-management)
   - [Fulfillment & Picking](#3-fulfillment--picking)
   - [Receiving & Deliveries](#4-receiving--deliveries)
   - [Warehouse Layout](#5-warehouse-layout)
   - [Returns (RMA)](#6-returns-rma)
   - [Reporting](#7-reporting)
5. [Technical Architecture](#technical-architecture)
6. [Data Models](#data-models)
7. [API Integration Points](#api-integration-points)
8. [Implementation Phases](#implementation-phases)

---

## Executive Summary

This document outlines the implementation plan for adding a **Warehouse** section to Flow CRM, based on:
- The warehouse PRD (warehouse_prd.md)
- Ron's feedback on business requirements
- UI/UX screens from warehouse_screens.pdf
- Meeting notes on operational workflows

### Key Features to Implement

| Feature | Priority | Description |
|---------|----------|-------------|
| **Inventory Management** | High | Track products, quantities, bin locations, lot/serial numbers |
| **Fulfillment & Picking** | High | Wave-based picking, packing, QR code scanning |
| **Receiving** | High | Incoming shipments, stock updates from manifests |
| **Warehouse Layout** | Medium | Section/Aisle/Shelf/Bay/Row/Bin hierarchy management |
| **Returns (RMA)** | Medium | Return authorization, inspection, restocking |
| **Dashboard** | Medium | Control center with high-priority orders, daily tasks |
| **Reporting** | Low | Inventory reports, cycle counts, audit trails |

### Out of Scope (Per Requirements)

- LIDAR integration
- Fleet management
- Robotics/fiducial markers navigation
- Geolocation tracking (lat/long)

---

## Foundational Data Connections

The warehouse module integrates with three core foundational tables from the existing CRM system:

### 1. Companies Table → Manufacturers & Customers

The existing **Companies** table (from `/components/CompaniesContent.tsx`) serves dual purposes in the warehouse:

| Company Type | Warehouse Role | Description |
|--------------|----------------|-------------|
| **Manufacturer** | Factory/Supplier | Companies that manufacture products stored in the warehouse. Products are sourced from these companies. |
| **Distributor** | Customer | Companies that purchase/receive products from the warehouse. These are the customers for fulfillment. |

**Company Fields Used**:
```typescript
type Company = {
  id: string;
  name: string;
  type: string[];           // ['Manufacturer'] or ['Distributor'] determines warehouse role
  territory: string;        // Used for closest warehouse selection
  // ... other fields
};
```

**Warehouse-Specific Extensions Needed**:
- `warehouseEnabled: boolean` - Indicates if this company participates in warehouse activities
- `warehouseCommissionRate?: number` - Commission percentage for warehouse shipments (for manufacturers)
- `salesModel?: 'direct' | 'warehouse' | 'buy_sell'` - Already exists in RMS types

### 2. Products Table → Inventory Items

The existing **Products** table (from `/components/ProductsContent.tsx`) provides the product catalog:

```typescript
interface Product {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  manufacturer: string;      // Links to Company (Manufacturer type)
  basePrice: number;
  status: 'active' | 'discontinued' | 'while_supplies_last';
  // ... other fields
}
```

**Warehouse-Specific Extensions Needed**:
- `warehouseEnabled: boolean` - Can this product be stocked in warehouses?
- `isConsignment: boolean` - Is this a consignment product?
- `defaultBoxSize?: string` - Associated box size for shipping
- `weightPerUnit?: number` - Weight for shipping calculations

### 3. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FOUNDATIONAL DATA                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                    ┌─────────────────┐             │
│  │    COMPANIES    │                    │    PRODUCTS     │             │
│  ├─────────────────┤                    ├─────────────────┤             │
│  │ type: string[]  │                    │ manufacturer    │─────────────┼──┐
│  │ • Manufacturer  │◄───────────────────┤ partNumber      │             │  │
│  │ • Distributor   │                    │ warehouseEnabled│             │  │
│  │ warehouseEnabled│                    │ isConsignment   │             │  │
│  └────────┬────────┘                    └────────┬────────┘             │  │
│           │                                      │                       │  │
└───────────┼──────────────────────────────────────┼───────────────────────┘  │
            │                                      │                          │
            ▼                                      ▼                          │
┌───────────────────────────────────────────────────────────────────────────┐│
│                        WAREHOUSE MODULE                                    ││
├───────────────────────────────────────────────────────────────────────────┤│
│                                                                            ││
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       ││
│  │   INVENTORY     │    │   FULFILLMENT   │    │   DELIVERIES    │       ││
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤       ││
│  │ productId ──────┼────┼─► From Products │    │ vendorId ───────┼───────┼┘
│  │ factoryId ──────┼────┼─► Manufacturer  │    │ (Manufacturer)  │       │
│  │ Items by bin    │    │ customerId ─────┼────┼─► Distributor   │       │
│  └─────────────────┘    │ warehouseId     │    └─────────────────┘       │
│                         └─────────────────┘                              │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   LOCATIONS     │    │     RETURNS     │    │    REPORTS      │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ Warehouse       │    │ Links back to   │    │ By Manufacturer │      │
│  │ └─► Section     │    │ Fulfillment     │    │ By Customer     │      │
│  │     └─► Aisle   │    │ & Product       │    │ By Product      │      │
│  │         └─► ... │    └─────────────────┘    └─────────────────┘      │
│  └─────────────────┘                                                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Relationships

| Warehouse Entity | Foundational Link | Description |
|------------------|-------------------|-------------|
| **Inventory.factoryId** | Company (type: Manufacturer) | Which manufacturer/factory supplied this inventory |
| **Inventory.productId** | Product | Which product this inventory record tracks |
| **Fulfillment.customerId** | Company (type: Distributor) | Which customer is receiving the shipment |
| **Fulfillment.productId** | Product | Which product is being fulfilled |
| **IncomingShipment.vendorId** | Company (type: Manufacturer) | Which manufacturer sent the shipment |

### Filtering in Warehouse Views

When displaying dropdowns or filters:

1. **"Factory" / "Manufacturer" dropdown**: Filter Companies where `type.includes('Manufacturer') && warehouseEnabled`
2. **"Customer" dropdown**: Filter Companies where `type.includes('Distributor') && warehouseEnabled`
3. **"Product" dropdown**: Filter Products where `warehouseEnabled === true`

---

## Navigation Structure

### Sidebar Addition

Add a new **"Warehouse"** nav group to the main sidebar with the following structure:

```
Warehouse
├── Overview          → /warehouse
├── Inventory         → /warehouse/inventory
├── Fulfillment       → /warehouse/fulfillment
├── Deliveries        → /warehouse/deliveries
├── Layout            → /warehouse/layout
├── Returns           → /warehouse/returns
└── Reports           → /warehouse/reports
```

### Implementation Details

**File to modify**: `/contexts/SidebarConfigContext.tsx`

```typescript
{
  id: 'warehouse',
  label: 'Warehouse',
  collapsed: false,
  items: [
    { id: 'warehouse-overview', name: 'Overview', href: '/warehouse', enabled: true },
    { id: 'warehouse-inventory', name: 'Inventory', href: '/warehouse/inventory', enabled: true },
    { id: 'warehouse-fulfillment', name: 'Fulfillment', href: '/warehouse/fulfillment', enabled: true },
    { id: 'warehouse-deliveries', name: 'Deliveries', href: '/warehouse/deliveries', enabled: true },
    { id: 'warehouse-layout', name: 'Layout', href: '/warehouse/layout', enabled: true },
    { id: 'warehouse-returns', name: 'Returns', href: '/warehouse/returns', enabled: true },
    { id: 'warehouse-reports', name: 'Reports', href: '/warehouse/reports', enabled: true },
  ]
}
```

**Icon for sidebar** (add to `/components/Sidebar.tsx` iconMap):
- Warehouse icon (building/storage themed)

---

## Feature Breakdown

### 1. Overview Dashboard

**Route**: `/warehouse`

**Purpose**: Control center showing high-priority items, daily tasks, incoming shipments, and stock overview.

#### UI Components

| Component | Description |
|-----------|-------------|
| **Today's High-Priority Orders** | Table showing urgent orders with Order #, Items count, Date, and action arrow |
| **Daily Tasks Checklist** | Interactive checklist for warehouse staff (cycle counts, restocking, cleanup) |
| **Incoming Shipments** | Table of upcoming deliveries with PO Number, From (vendor), ETA, Status |
| **Stock Control Summary** | Product cards showing image, name, description, bin, shelf, price, inventory count |

#### Features
- Quick navigation to fulfillment queue
- Task completion tracking
- Real-time shipment status updates
- Low stock alerts

#### Data Requirements
- Orders marked as high-priority
- Daily task assignments
- Incoming shipment manifests
- Inventory summary by product

---

### 2. Inventory Management

**Route**: `/warehouse/inventory`

**Purpose**: Manage products and inventory levels, track by bin location, lot/serial numbers.

#### UI Components

| Component | Description |
|-----------|-------------|
| **Inventory List** | Table with Factory, Description, Part Number, Total Inventory, Available, Actions |
| **Expandable Row Detail** | Shows inventory items breakdown: Quantity, Status, Bin, Lot #, Serial #, Received Date |
| **Product Detail Page** | Full view with Total Quantity, Available, In Transit stats + inventory items table |
| **Add Inventory Item Modal** | Form: Quantity, Bin Location, Weight per Unit, Lot Number, Serial Number, Received Date, Perishable toggle, Notes |
| **Update from Manifest** | AI-parsed stock updates from PDF/document upload |

#### Features

1. **Product Search & Filter**
   - Search by category, description, part number (per Ron's feedback)
   - Filter by factory/manufacturer
   - Filter by status (Available, Reserved, Damaged, etc.)

2. **Inventory Item Management**
   - Add new inventory items to existing products
   - Track by bin location
   - Lot number and serial number support
   - Expiration date tracking for perishables
   - Received date tracking

3. **Inventory Adjustments**
   - Require reason for all edits (per screen feedback)
   - Track who made the adjustment (audit trail)
   - Timestamped inventory changes

4. **Status Management**
   Per the PRD, support these statuses:
   - AVAILABLE
   - RESERVED
   - PICKING
   - PICKED
   - QUARANTINE
   - DAMAGED (requires signature per feedback)
   - EXPIRED
   - IN_TRANSIT
   - ON_HOLD
   - RETURNED

5. **Manifest Upload & AI Parsing**
   - Upload PDF/image of stock manifest
   - AI extracts: Product, Parsed Qty, Adjustment, Reason
   - Review and confirm before applying changes
   - Auto-aggregate duplicate listings

6. **Consignment Tracking**
   - Mark products as consignment vs buy/sell (per Ron's feedback)
   - Track warehouse commission percentages
   - Differentiate direct commission vs warehouse commissions

#### Data Model Reference (from PRD)

**Inventory** (master record):
- productId, totalQuantity, availableQuantity, reservedQuantity
- pickingQuantity, pickedQuantity, quarantineQuantity
- damagedQuantity, expiredQuantity, inTransitQuantity
- onHoldQuantity, returnedQuantity
- reorderPoint, maxQuantity

**InventoryItem** (physical lot in bin):
- inventory_id, bin_id, quantity, barcode
- lotNumber, serialNumber, expirationDate, receivedDate
- status, notes

---

### 3. Fulfillment & Picking

**Route**: `/warehouse/fulfillment`

**Purpose**: Manage order fulfillment workflow from release to shipment.

#### UI Components

| Component | Description |
|-----------|-------------|
| **Orders Awaiting Fulfillment** | Table: Order #, Customer, Items to Fulfill, Fulfillment Status, Date |
| **Fulfillment Detail View** | Step indicator: Released → Picking → Picked → Packing |
| **Pick Item Card** | Location display, product image, "Scan to Pick" button |
| **Wave Management** | Group multiple orders for efficient picking |
| **Packing Station** | Box selection, shipping label generation |

#### Features

1. **Fulfillment Queue**
   - List of orders released to warehouse
   - Filter by status, customer, date
   - Priority sorting (higher = more urgent)

2. **Wave-Based Picking**
   - Create picking waves to batch orders
   - Assign picker to wave
   - Track wave status: PENDING → RELEASED → IN_PROGRESS → COMPLETED
   - Wave statistics: fulfillment count, total items, picked items

3. **Pick Process**
   - Step-by-step picking workflow
   - Display bin location: "Find item at: Shelf 3, Bin A-12"
   - QR code scanning OR manual entry confirmation
   - Track pickedAt timestamp

4. **Packing Process**
   - Box size selection (associate box sizes with part numbers per feedback)
   - Pack confirmation
   - Track packedAt timestamp

5. **Shipping Integration** (Future consideration)
   - USPS, FedEx, UPS API integration (per feedback)
   - Add carrier account numbers to Flow
   - Generate shipping labels
   - Track shipping cost

6. **Delivery Types**
   - CUSTOMER_PICKUP
   - LOCAL_TRUCK_DELIVERY
   - CARRIER_DELIVERY
   - BULK_CARRIER_DELIVERY

7. **Closest Warehouse Selection**
   - Pick warehouse based on customer/end user address (per Ron's feedback)

8. **Documentation Workflow**
   - Customer signature capture
   - Generate packing slip
   - Batch picked tickets + PO to send to manufacturers
   - Option: send immediately or batch at end of day

#### Data Model Reference (from PRD)

**Fulfillment**:
- orderId, orderDetailId, productId, warehouseId
- qrCode, quantity, pickedQuantity, packedQuantity, shippedQuantity
- trackingNumber, carrier, deliveryType
- pickedAt, packedAt, shippedAt, deliveredAt, cancelledAt

**Wave**:
- waveNumber, status, priority
- fulfillmentCount, totalItems, pickedItems
- pickerId, releasedAt, startedAt, completedAt

---

### 4. Receiving & Deliveries

**Route**: `/warehouse/deliveries`

**Purpose**: Track incoming shipments, receive stock, update inventory.

#### UI Components

| Component | Description |
|-----------|-------------|
| **Incoming Shipments List** | Table: PO Number, From (vendor), ETA, Status |
| **Receive Stock Modal** | Product list with expected vs received quantities |
| **Discrepancy Handling** | Note damages, shortages, auto-draft email to vendor contact |

#### Features

1. **Incoming Shipment Tracking**
   - PO number reference
   - Vendor/supplier name
   - Expected arrival date (ETA)
   - Status: In Transit, Processing, Shipped, Received

2. **Receiving Workflow**
   - Scan or enter PO/packing slip
   - Match received items to expected items
   - Note discrepancies (damaged, missing)
   - Update inventory automatically on receive

3. **Problem Handling**
   - If discrepancies found, auto-draft email to bill of lading contact (per feedback)
   - Log issues for vendor performance tracking

4. **Stock Update from PDF**
   - Parse incoming manifest document
   - Show parsed quantities with adjustment options
   - Apply changes to inventory

---

### 5. Warehouse Layout

**Route**: `/warehouse/layout`

**Purpose**: Define and manage the physical warehouse structure.

#### UI Components

| Component | Description |
|-----------|-------------|
| **Breadcrumb Navigation** | Sections / Section / Aisle / Shelf / Bay-01 |
| **Bins in Row Table** | Letter Code, Max Weight, Height, Depth, Width, QR Code |
| **Create Bin Modal** | Form for bin dimensions and properties |
| **Visual Builder** | Drag-and-drop warehouse layout editor |
| **Layout Editor** | Grid-based design with shelves, workstations |

#### Features

1. **Hierarchical Location Management**

   Per the PRD, the warehouse has a 7-level hierarchy:
   ```
   Warehouse → Section → Aisle → Shelf → Bay → Row → Bin
   ```

2. **Section Management**
   - Name, description
   - Dimensions: width, length, height
   - Position offset: xOffset, yOffset
   - Orientation (degrees)

3. **Aisle Management**
   - Aisle number and name
   - Zone grouping label
   - Orientation

4. **Shelf Management**
   - Dimensions: height, width, length
   - Parent: Aisle or Section (optional)

5. **Bay Management**
   - Code (e.g., "BAY-01")
   - Bay number (left to right ordering)
   - QR code generation

6. **Row Management**
   - Row number (1 = top, increments downward)
   - QR code generation

7. **Bin Management**
   - Letter code (A, B, ..., AA, AB)
   - Dimensions: width, height, depth
   - Max weight capacity
   - QR code generation
   - Print QR codes for physical bins (per feedback)

8. **Visual Layout Editor**
   - Grid-based drag-and-drop interface
   - Add shelves, workstations, aisles
   - Save/load layout configurations
   - Set grid dimensions (ft)

9. **Location Address Format**
   ```
   {Warehouse}-{Section}-{Aisle}-{Shelf}-{Bay}-{Row}-{Bin}
   Example: WH01-NORTH-A3-SH12-BAY02-R1-C
   ```

#### Data Model Reference (from PRD)

**Section**: name, description, width, length, height, xOffset, yOffset, orientationDeg
**Aisle**: name, aisleNumber, zone, orientationDeg
**Shelf**: name, height, width, length
**Bay**: code, bayNumber, qrCode, qrContent
**Row**: rowNumber, qrCode, qrContent
**Bin**: letterCode, width, height, depth, maxWeight, qrCode, qrContent

---

### 6. Returns (RMA)

**Route**: `/warehouse/returns`

**Purpose**: Handle return merchandise authorizations, inspection, and restocking.

#### UI Components

| Component | Description |
|-----------|-------------|
| **RMA List** | Table: RMA Number, Order, Product, Status, Quantity, Actions |
| **RMA Detail View** | Full details with inspection notes, restock decision |
| **Create RMA Modal** | Link to fulfillment, set reason, quantity |
| **Inspection Form** | Notes, canRestock decision, photos |

#### Features

1. **RMA Creation**
   - Link to original fulfillment
   - Order and product references
   - Quantity being returned
   - Reason code and detailed reason
   - Return tracking number

2. **RMA Status Workflow**
   ```
   PENDING → APPROVED → IN_TRANSIT → RECEIVED → INSPECTING → COMPLETED
                    ↘ REJECTED
                              ↘ CANCELLED
   ```

3. **Inspection Process**
   - Record inspection notes
   - Determine if items can be restocked (canRestock flag)
   - Photo documentation

4. **Financial Tracking**
   - Refund amount calculation
   - Restocking fee (if applicable)

5. **Restocking**
   - If canRestock = true, add back to available inventory
   - If damaged, move to damaged inventory status

6. **QR Code Tracking**
   - Each RMA has a unique QR code for tracking

#### Data Model Reference (from PRD)

**RMA**:
- rmaNumber, fulfillment_id, orderId, productId
- status, quantity, receivedQuantity
- reasonCode, reason, refundAmount, restockingFee
- returnTrackingNumber, inspectionNotes, canRestock, qrCode
- approvedAt, receivedAt, completedAt

---

### 7. Reporting

**Route**: `/warehouse/reports`

**Purpose**: Generate reports for inventory, operations, and auditing.

#### UI Components

| Component | Description |
|-----------|-------------|
| **Report Selector** | Dropdown/cards to choose report type |
| **Inventory Report** | Exportable table with vendor, product, qty on hand, committed, available, warehouse, bin |
| **Cycle Count Report** | Bin-by-bin count reconciliation |
| **Audit Trail** | Who changed what, when, and why |

#### Features

1. **Inventory Report**
   - Vendor Name, Product Name, Product Description
   - Vendor Product Group
   - Qty On Hand, Qty Committed, Qty Available
   - Warehouse, Bin Location
   - Export to Excel/CSV

2. **Cycle Count**
   - Schedule counts by bin location
   - Track expected vs actual quantities
   - Record discrepancies
   - Assign to warehouse staff

3. **Inventory Adjustment History**
   - Timestamped log of all changes (per feedback)
   - Who made the change
   - Reason for change
   - Before/after quantities

4. **Customer Part Numbers Report**
   - See all customer part numbers by manufacturer (per Ron's feedback)
   - Cross-reference customer-specific SKUs

5. **Low Stock Alerts**
   - Items below reorder point
   - Suggested reorder quantities

---

## Technical Architecture

### File Structure

```
flow-crm/
├── app/
│   └── warehouse/
│       ├── page.tsx                    # Overview dashboard
│       ├── layout.tsx                  # Warehouse section layout
│       ├── inventory/
│       │   └── page.tsx
│       ├── fulfillment/
│       │   └── page.tsx
│       ├── deliveries/
│       │   └── page.tsx
│       ├── layout-manager/
│       │   └── page.tsx                # "layout" is reserved, use layout-manager
│       ├── returns/
│       │   └── page.tsx
│       └── reports/
│           └── page.tsx
├── components/
│   └── warehouse/
│       ├── WarehouseOverviewContent.tsx
│       ├── WarehouseInventoryContent.tsx
│       ├── WarehouseFulfillmentContent.tsx
│       ├── WarehouseDeliveriesContent.tsx
│       ├── WarehouseLayoutContent.tsx
│       ├── WarehouseReturnsContent.tsx
│       ├── WarehouseReportsContent.tsx
│       ├── modals/
│       │   ├── AddInventoryItemModal.tsx
│       │   ├── AdjustInventoryModal.tsx
│       │   ├── CreateRmaModal.tsx
│       │   ├── CreateBinModal.tsx
│       │   ├── ConfirmStockUpdatesModal.tsx
│       │   └── FulfillmentDetailModal.tsx
│       └── shared/
│           ├── InventoryStatusBadge.tsx
│           ├── LocationBreadcrumb.tsx
│           ├── QrCodeDisplay.tsx
│           └── StockSummaryCards.tsx
├── lib/
│   ├── types/
│   │   └── warehouse.ts                # TypeScript interfaces
│   └── data/
│       └── warehouse-mock.ts           # Mock data for development
└── app/api/warehouse/                  # API routes (future)
    ├── inventory/route.ts
    ├── fulfillment/route.ts
    ├── deliveries/route.ts
    ├── locations/route.ts
    ├── returns/route.ts
    └── reports/route.ts
```

### Component Patterns

Each page follows the established pattern:

```typescript
// app/warehouse/inventory/page.tsx
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WarehouseInventoryContent from '@/components/warehouse/WarehouseInventoryContent';

export default function WarehouseInventoryPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <WarehouseInventoryContent />
      </div>
    </div>
  );
}
```

### State Management

- Use React `useState` and `useMemo` for local component state
- Context API for shared state if needed (e.g., selected warehouse)
- Follow existing patterns from OrdersContent, InvoicesContent, etc.

---

## Data Models

### TypeScript Interfaces

```typescript
// lib/types/warehouse.ts

// Enums
export type InventoryStatus =
  | 'AVAILABLE' | 'RESERVED' | 'PICKING' | 'PICKED'
  | 'QUARANTINE' | 'DAMAGED' | 'EXPIRED'
  | 'IN_TRANSIT' | 'ON_HOLD' | 'RETURNED';

export type FulfillmentStatus =
  | 'NOT_STARTED' | 'ALLOCATED' | 'PICKING'
  | 'PARTIALLY_SHIPPED' | 'SHIPPED' | 'DELIVERED'
  | 'RETURNED' | 'CANCELLED' | 'RELEASED_TO_WAREHOUSE';

export type DeliveryType =
  | 'CUSTOMER_PICKUP' | 'LOCAL_TRUCK_DELIVERY'
  | 'CARRIER_DELIVERY' | 'BULK_CARRIER_DELIVERY';

export type WaveStatus =
  | 'PENDING' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type RmaStatus =
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_TRANSIT'
  | 'RECEIVED' | 'INSPECTING' | 'COMPLETED' | 'CANCELLED';

// Warehouse Structure
export interface Warehouse {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  description?: string;
  isActive: boolean;
}

export interface Section {
  id: string;
  warehouseId: string;
  name: string;
  description?: string;
  width: number;
  length: number;
  height?: number;
  xOffset: number;
  yOffset: number;
  orientationDeg?: number;
  isActive: boolean;
}

export interface Aisle {
  id: string;
  warehouseId: string;
  sectionId?: string;
  name: string;
  aisleNumber?: number;
  zone?: string;
  orientationDeg?: number;
  description?: string;
  isActive: boolean;
}

export interface Shelf {
  id: string;
  warehouseId: string;
  aisleId?: string;
  sectionId?: string;
  name: string;
  height?: number;
  width?: number;
  length?: number;
  description?: string;
  isActive: boolean;
}

export interface Bay {
  id: string;
  shelfId: string;
  code: string;
  bayNumber: number;
  description?: string;
  qrCode?: string;
  qrContent?: string;
  isActive: boolean;
}

export interface Row {
  id: string;
  bayId: string;
  rowNumber: number;
  description?: string;
  qrCode?: string;
  qrContent?: string;
  isActive: boolean;
}

export interface Bin {
  id: string;
  rowId: string;
  letterCode: string;
  width?: number;
  height?: number;
  depth?: number;
  maxWeight?: number;
  description?: string;
  qrCode?: string;
  qrContent?: string;
  isActive: boolean;
}

// Inventory
export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  factory: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  pickingQuantity: number;
  pickedQuantity: number;
  quarantineQuantity: number;
  damagedQuantity: number;
  expiredQuantity: number;
  inTransitQuantity: number;
  onHoldQuantity: number;
  returnedQuantity: number;
  reorderPoint?: number;
  maxQuantity?: number;
  isConsignment: boolean;
  commissionPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  inventoryId: string;
  binId: string;
  binLocation: string; // Formatted: "Shelf 3, Bin A-12"
  quantity: number;
  barcode?: string;
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: string;
  receivedDate?: string;
  status: InventoryStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAdjustment {
  id: string;
  inventoryItemId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  adjustedBy: string;
  adjustedByName: string;
  signature?: string; // For damaged items
  timestamp: string;
}

// Fulfillment
export interface Fulfillment {
  id: string;
  orderId: string;
  orderNumber: string;
  orderDetailId: string;
  productId: string;
  productName: string;
  warehouseId: string;
  inventoryId?: string;
  waveId?: string;
  qrCode: string;
  quantity: number;
  pickedQuantity: number;
  packedQuantity: number;
  shippedQuantity: number;
  trackingNumber?: string;
  carrier?: string;
  deliveryType?: DeliveryType;
  status: FulfillmentStatus;
  customerName: string;
  notes?: string;
  pickedAt?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wave {
  id: string;
  waveNumber: string;
  status: WaveStatus;
  priority: number;
  fulfillmentCount: number;
  totalItems: number;
  pickedItems: number;
  pickerId?: string;
  pickerName?: string;
  releasedAt?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Deliveries
export interface IncomingShipment {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  eta: string;
  status: 'IN_TRANSIT' | 'PROCESSING' | 'SHIPPED' | 'RECEIVED';
  expectedItems: ExpectedItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpectedItem {
  productId: string;
  productName: string;
  partNumber: string;
  expectedQuantity: number;
  receivedQuantity?: number;
  discrepancyNotes?: string;
}

// Returns
export interface Rma {
  id: string;
  rmaNumber: string;
  fulfillmentId: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  status: RmaStatus;
  quantity: number;
  receivedQuantity: number;
  reasonCode?: string;
  reason?: string;
  refundAmount?: number;
  restockingFee?: number;
  returnTrackingNumber?: string;
  inspectionNotes?: string;
  canRestock?: boolean;
  qrCode?: string;
  approvedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Dashboard
export interface DailyTask {
  id: string;
  description: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export interface StockControlItem {
  id: string;
  productId: string;
  productName: string;
  productDescription: string;
  productImage?: string;
  binLocation: string;
  shelfNumber: number;
  price: number;
  inventoryCount: number;
}
```

---

## API Integration Points

### Backend Service (Flow Warehouse API)

The frontend will integrate with the existing Flow Warehouse Spring Boot microservice via GraphQL. Key queries/mutations needed:

#### Inventory
- `getInventory(productId)` - Get inventory master record
- `getInventoryItems(inventoryId)` - Get physical items in bins
- `createInventoryItem(input)` - Add item to bin
- `updateInventoryItem(id, input)` - Update quantity/status
- `adjustInventory(id, adjustment)` - Record adjustment with reason

#### Fulfillment
- `getFulfillments(warehouseId, status)` - List fulfillments
- `getFulfillment(id)` - Get single fulfillment
- `updateFulfillmentStatus(id, status)` - Progress workflow
- `createWave(input)` - Create picking wave
- `assignPickerToWave(waveId, pickerId)` - Assign picker

#### Locations
- `getWarehouseStructure(warehouseId)` - Full hierarchy
- `createSection/Aisle/Shelf/Bay/Row/Bin(input)` - Add locations
- `updateLocation(type, id, input)` - Update location
- `generateQrCode(type, id)` - Generate QR for location

#### Returns
- `getRmas(status)` - List RMAs
- `createRma(input)` - Create return
- `updateRmaStatus(id, status)` - Progress workflow
- `completeInspection(id, notes, canRestock)` - Record inspection

### External Integrations (Future)

Per Ron's feedback, consider:
- **USPS API** - Shipping labels & tracking
- **FedEx API** - Shipping integration
- **UPS API** - Shipping integration
- **Email Service** - Auto-draft emails for discrepancies

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Goal**: Set up the warehouse section structure and basic navigation.

**Tasks**:
1. Add Warehouse nav group to SidebarConfigContext
2. Add warehouse icon to Sidebar iconMap
3. Create folder structure under `/app/warehouse/`
4. Create placeholder pages for all routes
5. Create TypeScript interfaces in `/lib/types/warehouse.ts`
6. Create mock data in `/lib/data/warehouse-mock.ts`

**Deliverables**:
- Working navigation to all warehouse pages
- Basic page layouts with headers

---

### Phase 2: Inventory Management

**Goal**: Full inventory viewing and management capabilities.

**Tasks**:
1. Build WarehouseInventoryContent component
   - Product list table with expandable rows
   - Search by category, description, part number
   - Filter by factory, status
   - Stat cards for totals
2. Build Product Detail View
   - Inventory items table
   - Add Item modal
3. Build AddInventoryItemModal
   - All fields per PRD
   - Bin location selector
4. Build AdjustInventoryModal
   - Require reason
   - Track adjustment history
5. Build Update from Manifest feature
   - PDF upload
   - Confirmation modal with parsed data

**Deliverables**:
- Complete inventory management UI
- Add/edit/adjust inventory items
- Audit trail for changes

---

### Phase 3: Fulfillment & Picking

**Goal**: Order fulfillment workflow from release to ship.

**Tasks**:
1. Build WarehouseFulfillmentContent
   - Orders awaiting fulfillment table
   - Filter by status, customer, date
2. Build FulfillmentDetailModal
   - Step indicator (Released → Picking → Picked → Packing)
   - Pick Item card with location
   - Scan to Pick / Manual confirm
3. Build Wave Management
   - Create wave
   - Assign picker
   - Track progress
4. Build Packing Station
   - Box selection
   - Pack confirmation

**Deliverables**:
- Complete picking workflow
- Wave management
- Packing station

---

### Phase 4: Receiving & Deliveries

**Goal**: Track and receive incoming shipments.

**Tasks**:
1. Build WarehouseDeliveriesContent
   - Incoming shipments table
   - Status tracking
2. Build Receive Stock workflow
   - Match expected vs received
   - Note discrepancies
   - Auto-update inventory
3. Build discrepancy handling
   - Auto-draft email to vendor

**Deliverables**:
- Incoming shipment tracking
- Receiving workflow
- Discrepancy management

---

### Phase 5: Warehouse Layout

**Goal**: Define and manage physical warehouse structure.

**Tasks**:
1. Build WarehouseLayoutContent
   - Breadcrumb navigation
   - Hierarchical list view
2. Build location CRUD modals
   - Section, Aisle, Shelf, Bay, Row, Bin
3. Build Visual Layout Editor
   - Grid-based drag-and-drop
   - Save/load layouts
4. Build QR code generation
   - Generate for bins
   - Print functionality

**Deliverables**:
- Full hierarchy management
- Visual layout editor
- QR code generation & printing

---

### Phase 6: Returns (RMA)

**Goal**: Handle return merchandise authorizations.

**Tasks**:
1. Build WarehouseReturnsContent
   - RMA list table
   - Status filters
2. Build CreateRmaModal
   - Link to fulfillment
   - Reason entry
3. Build RMA Detail View
   - Status workflow
   - Inspection form
4. Build restocking logic
   - Add back to inventory if canRestock

**Deliverables**:
- Complete RMA workflow
- Inspection process
- Restocking integration

---

### Phase 7: Dashboard & Reports

**Goal**: Overview dashboard and reporting.

**Tasks**:
1. Build WarehouseOverviewContent
   - High-priority orders
   - Daily tasks checklist
   - Incoming shipments summary
   - Stock control cards
2. Build WarehouseReportsContent
   - Report selector
   - Inventory report
   - Cycle count
   - Audit trail
3. Build export functionality
   - Excel/CSV export

**Deliverables**:
- Dashboard with actionable insights
- Comprehensive reporting
- Export capabilities

---

### Phase 8: API Integration

**Goal**: Connect to backend services.

**Tasks**:
1. Create API route handlers in `/app/api/warehouse/`
2. Integrate with Flow Warehouse GraphQL API
3. Replace mock data with real API calls
4. Implement error handling
5. Add loading states

**Deliverables**:
- Full backend integration
- Real-time data
- Production-ready application

---

## Summary

This implementation plan provides a comprehensive roadmap for adding warehouse management capabilities to Flow CRM. The phased approach allows for incremental delivery while maintaining a focus on the highest-priority features first.

**Key Success Metrics**:
- Users can manage inventory with full audit trail
- Fulfillment workflow reduces picking errors
- Receiving process catches discrepancies early
- Layout management enables efficient warehouse organization
- RMA process handles returns systematically
- Dashboard provides actionable insights

**Estimated Scope**:
- 7 main pages
- ~15 modal components
- ~25 TypeScript interfaces
- Integration with Flow Warehouse API
