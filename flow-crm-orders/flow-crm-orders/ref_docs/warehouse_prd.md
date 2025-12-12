# Flow Warehouse API - Product Requirements Document

A Spring Boot microservice for warehouse management, inventory tracking, fulfillment workflows, and return processing.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Entity Reference](#entity-reference)
  - [Warehouse Structure](#warehouse-structure)
  - [Inventory Management](#inventory-management)
  - [Fulfillment & Shipping](#fulfillment--shipping)
- [Enumerations](#enumerations)
- [Entity Relationships](#entity-relationships)

---

## Overview

Flow Warehouse is a microservice within the FlowRMS ecosystem, built with Spring Boot 3.3.3 and Java 21, providing a GraphQL API for warehouse management operations.

The service manages:

- **Physical warehouse layout** - Hierarchical structure from warehouses down to individual storage bins
- **Inventory tracking** - Real-time inventory levels with status-based quantity management
- **Order fulfillment** - Wave-based picking, packing, and shipping workflows
- **Returns processing** - RMA creation, inspection, and restocking

---

## Architecture

### Tech Stack

- **Framework**: Spring Boot 3.3.3, Java 21
- **API**: GraphQL (with federation support)
- **ORM**: Hibernate/JPA
- **Database**: PostgreSQL

### Key Patterns

| Pattern | Description |
|---------|-------------|
| Hierarchical Location | Warehouse → Section/Aisle → Shelf → Bay → Row → Bin |
| Inventory Master + Items | `Inventory` tracks aggregates; `InventoryItem` tracks physical lots |
| GraphQL Federation | Links to external Order and Product services via UUIDs |
| Status Enums | Lifecycle tracking for fulfillments, waves, RMAs, and inventory |
| QR Code Support | Bay, Row, Bin, Fulfillment, RMA, and FiducialMarker entities |
| Geolocation | Warehouse, Aisle, and Shelf support lat/long positioning |

---

## Entity Reference

### Warehouse Structure

#### Warehouse

**Purpose**: Root entity representing a physical warehouse location.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | String | max 255 | Warehouse name |
| addressLine1 | String | max 255 | Street address |
| addressLine2 | String | max 255, optional | Secondary address |
| city | String | max 100 | City |
| state | String | max 100 | State/Province |
| postalCode | String | max 20 | ZIP/Postal code |
| country | String | max 100 | Country |
| latitude | BigDecimal | precision 9, scale 6 | Geolocation (-90 to +90) |
| longitude | BigDecimal | precision 9, scale 6 | Geolocation (-180 to +180) |
| description | Text | optional | Notes |
| isActive | Boolean | default true | Active status |

**Relationships**: Has many Sections, Aisles, Shelves

---

#### Section

**Purpose**: Rectangular area within a warehouse for grouping aisles and shelves.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | String | max 255, NOT NULL | Section name |
| description | Text | optional | Notes |
| width | BigDecimal | precision 10, scale 2, NOT NULL | Section width |
| length | BigDecimal | precision 10, scale 2, NOT NULL | Section length |
| height | BigDecimal | precision 10, scale 2, optional | Section height |
| xOffset | BigDecimal | precision 10, scale 2, NOT NULL | X position offset |
| yOffset | BigDecimal | precision 10, scale 2, NOT NULL | Y position offset |
| orientationDeg | Integer | optional | Orientation in degrees |
| isActive | Boolean | default true | Active status |
| warehouse_id | UUID | FK, NOT NULL | Parent warehouse |

**Constraints**: Unique (warehouse_id, name)

**Relationships**: Belongs to Warehouse; Has many Aisles, Shelves

---

#### Aisle

**Purpose**: Navigable aisle within a warehouse containing shelves.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | String | max 255, NOT NULL | Aisle name (e.g., "Aisle 3") |
| aisleNumber | Integer | optional | Sequential ordering |
| zone | String | max 100, optional | Zone grouping label |
| orientationDeg | Integer | optional | Orientation 0-359 degrees |
| startLatitude | BigDecimal | precision 9, scale 6 | Aisle start point |
| startLongitude | BigDecimal | precision 9, scale 6 | Aisle start point |
| endLatitude | BigDecimal | precision 9, scale 6 | Aisle end point |
| endLongitude | BigDecimal | precision 9, scale 6 | Aisle end point |
| description | Text | optional | Notes |
| isActive | Boolean | default true | Active status |
| warehouse_id | UUID | FK, NOT NULL | Parent warehouse |
| section_id | UUID | FK, optional | Parent section |

**Constraints**: Unique (warehouse_id, name)

**Relationships**: Belongs to Warehouse, optionally Section; Has many Shelves

---

#### Shelf

**Purpose**: Storage shelf with dimensions and positioning.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | String | max 255, NOT NULL | Shelf name |
| height | BigDecimal | precision 10, scale 2 | Shelf height |
| width | BigDecimal | precision 10, scale 2 | Shelf width |
| length | BigDecimal | precision 10, scale 2 | Shelf length |
| latitude | BigDecimal | precision 9, scale 6 | Precise position |
| longitude | BigDecimal | precision 9, scale 6 | Precise position |
| description | Text | optional | Notes |
| isActive | Boolean | default true | Active status |
| warehouse_id | UUID | FK, NOT NULL | Parent warehouse |
| aisle_id | UUID | FK, optional | Parent aisle |
| section_id | UUID | FK, optional | Parent section |

**Relationships**: Belongs to Warehouse, optionally Aisle/Section; Has many Bays, FiducialMarkers

---

#### Bay

**Purpose**: Vertical section of a shelf containing rows of bins.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| code | String | max 50, NOT NULL | Human-readable code (e.g., "BAY-01") |
| bayNumber | Integer | NOT NULL | Numerical ordering (left to right) |
| description | Text | optional | Notes |
| qrCode | byte[] | BYTEA | Binary PNG QR code |
| qrContent | String | max 500 | QR code content reference |
| isActive | Boolean | default true | Active status |
| shelf_id | UUID | FK, NOT NULL | Parent shelf |

**Constraints**: Unique (shelf_id, bay_number)

**Relationships**: Belongs to Shelf; Has many Rows

---

#### Row

**Purpose**: Horizontal row within a bay (numbered top to bottom).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| rowNumber | Integer | NOT NULL | 1 = top, increments downward |
| description | Text | optional | Notes |
| qrCode | byte[] | BINARY | Binary PNG QR code |
| qrContent | String | max 500 | QR code content reference |
| isActive | Boolean | default true | Active status |
| bay_id | UUID | FK, NOT NULL | Parent bay |

**Constraints**: Unique (bay_id, row_number)

**Relationships**: Belongs to Bay; Has many Bins

---

#### Bin

**Purpose**: Individual storage bin within a row (identified by letter codes A-Z, AA, AB, etc.).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| letterCode | String | max 10, NOT NULL | Alphabetical identifier (A, B, ..., AA) |
| width | BigDecimal | precision 10, scale 2 | Bin width |
| height | BigDecimal | precision 10, scale 2 | Bin height |
| depth | BigDecimal | precision 10, scale 2 | Bin depth |
| maxWeight | BigDecimal | precision 10, scale 2 | Weight capacity |
| description | Text | optional | Notes |
| qrCode | byte[] | BINARY | Binary PNG QR code |
| qrContent | String | max 500 | QR code content reference |
| isActive | Boolean | default true | Active status |
| row_id | UUID | FK, NOT NULL | Parent row |

**Constraints**: Unique (row_id, letter_code)

**Relationships**: Belongs to Row; Has many InventoryItems

---

#### FiducialMarker

**Purpose**: Physical marker on a shelf for robotics navigation and vision systems.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| identifier | String | max 3, NOT NULL | 3-char identifier (e.g., "A01") |
| markerNumber | Integer | optional | Sequential ordering |
| qrCode | byte[] | LOB | Generated QR code binary (PNG) |
| xOffset | BigDecimal | precision 10, scale 2 | X offset from shelf origin |
| yOffset | BigDecimal | precision 10, scale 2 | Y offset |
| zOffset | BigDecimal | precision 10, scale 2 | Z offset |
| orientationDeg | Integer | optional | Angle 0-359 degrees |
| isActive | Boolean | default true | Active status |
| description | Text | optional | Notes |
| shelf_id | UUID | FK, NOT NULL | Parent shelf |

**Constraints**: Unique (shelf_id, identifier)

**Relationships**: Belongs to Shelf

---

### Inventory Management

#### Inventory

**Purpose**: Master record tracking aggregate quantities for a product across the warehouse.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| productId | UUID | indexed | Reference to product catalog service |
| totalQuantity | Integer | default 0, NOT NULL | Total across all locations |
| availableQuantity | Integer | default 0, NOT NULL | Available for orders |
| reservedQuantity | Integer | default 0, NOT NULL | Reserved, not yet picked |
| pickingQuantity | Integer | default 0, NOT NULL | Currently being picked |
| pickedQuantity | Integer | default 0, NOT NULL | Picked, awaiting shipment |
| quarantineQuantity | Integer | default 0, NOT NULL | In quarantine |
| damagedQuantity | Integer | default 0, NOT NULL | Damaged items |
| expiredQuantity | Integer | default 0, NOT NULL | Expired items |
| inTransitQuantity | Integer | default 0, NOT NULL | In transit |
| onHoldQuantity | Integer | default 0, NOT NULL | On hold |
| returnedQuantity | Integer | default 0, NOT NULL | Returned items |
| reorderPoint | Integer | optional | Minimum quantity threshold |
| maxQuantity | Integer | optional | Maximum quantity threshold |
| createdAt | LocalDateTime | NOT NULL, immutable | Creation timestamp |
| updatedAt | LocalDateTime | NOT NULL | Last update timestamp |

**Relationships**: Has many InventoryItems

---

#### InventoryItem

**Purpose**: Physical lot/batch of product in a specific bin with specific status.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| inventory_id | UUID | FK, NOT NULL | Parent inventory record |
| bin_id | UUID | FK, NOT NULL | Storage bin location |
| quantity | Integer | default 0, NOT NULL | Quantity in this location |
| barcode | String | max 100, indexed | Barcode/UPC |
| lotNumber | String | max 100, indexed | Lot/batch number |
| serialNumber | String | max 100 | Serial number |
| expirationDate | LocalDateTime | optional | For perishables |
| receivedDate | LocalDateTime | optional | When received |
| status | InventoryStatus | default AVAILABLE, NOT NULL | Item status |
| notes | Text | optional | Notes |
| createdAt | LocalDateTime | NOT NULL, immutable | Creation timestamp |
| updatedAt | LocalDateTime | NOT NULL | Last update timestamp |

**Constraints**: Unique (bin_id, inventory_id, status, lot_number)

**Relationships**: Belongs to Inventory, Bin

---

### Fulfillment & Shipping

#### Fulfillment

**Purpose**: Warehouse fulfillment order linked to external order service via GraphQL federation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| orderId | UUID | NOT NULL, indexed | Reference to order service |
| orderDetailId | UUID | NOT NULL | Reference to order detail |
| productId | UUID | NOT NULL, indexed | Reference to product catalog |
| warehouseId | UUID | NOT NULL, indexed | Warehouse location |
| status | FulfillmentStatus | default NOT_STARTED | Status (deprecated) |
| inventory_id | UUID | FK, optional | Link to inventory |
| wave_id | UUID | FK, optional | Picking wave |
| qrCode | String | max 255, NOT NULL, unique | Tracking QR code |
| quantity | Integer | NOT NULL | Quantity to fulfill |
| pickedQuantity | Integer | default 0, NOT NULL | Items picked |
| packedQuantity | Integer | default 0, NOT NULL | Items packed |
| shippedQuantity | Integer | default 0, NOT NULL | Items shipped |
| trackingNumber | String | max 100 | Carrier tracking |
| carrier | String | max 100 | Carrier name |
| deliveryType | FulfillmentDeliveryType | optional | Delivery method |
| notes | String | max 1000 | Notes |
| pickedAt | LocalDateTime | optional | Pick timestamp |
| packedAt | LocalDateTime | optional | Pack timestamp |
| shippedAt | LocalDateTime | optional | Ship timestamp |
| deliveredAt | LocalDateTime | optional | Delivery timestamp |
| cancelledAt | LocalDateTime | optional | Cancellation timestamp |
| createdAt | LocalDateTime | NOT NULL, immutable | Creation timestamp |
| updatedAt | LocalDateTime | NOT NULL | Last update timestamp |
| createdBy | UUID | optional | Creator user ID |
| updatedBy | UUID | optional | Updater user ID |

**Relationships**: Belongs to Inventory (optional), Wave (optional); Has many Rmas

---

#### Wave

**Purpose**: Batch picking wave grouping multiple fulfillments for efficient picking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| waveNumber | String | max 50, NOT NULL, unique | Human-readable number |
| status | WaveStatus | default PENDING, NOT NULL | Wave status |
| priority | Integer | default 0, NOT NULL | Higher = more urgent |
| fulfillmentCount | Integer | default 0, NOT NULL | Total fulfillments |
| totalItems | Integer | default 0, NOT NULL | Total items to pick |
| pickedItems | Integer | default 0, NOT NULL | Items picked so far |
| pickerId | UUID | optional | Assigned picker user |
| releasedAt | LocalDateTime | optional | When released for picking |
| startedAt | LocalDateTime | optional | When picking started |
| completedAt | LocalDateTime | optional | When completed |
| notes | String | max 1000 | Notes |
| createdAt | LocalDateTime | NOT NULL, immutable | Creation timestamp |
| updatedAt | LocalDateTime | NOT NULL | Last update timestamp |
| createdBy | UUID | optional | Creator user ID |
| updatedBy | UUID | optional | Updater user ID |

**Relationships**: Has many Fulfillments

---

#### Shipment

**Purpose**: Physical shipment containing fulfillments (supports split/consolidated shipping).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| trackingNumber | String | max 100, NOT NULL, unique | Carrier tracking number |
| carrier | String | max 100, NOT NULL | Carrier name |
| serviceLevel | String | max 100 | Service level |
| status | String | max 50, default "PENDING" | Shipment status |
| weight | BigDecimal | precision 10, scale 3 | Package weight |
| weightUnit | String | max 10, default "LBS" | Weight unit |
| cost | BigDecimal | precision 10, scale 2 | Shipping cost |
| labelUrl | String | max 500 | Shipping label URL |
| fulfillmentId | UUID | optional | Related fulfillment |
| deliveryAddress | String | max 1000 | Delivery address |
| notes | String | max 1000 | Notes |
| shippedAt | LocalDateTime | optional | Ship timestamp |
| expectedDeliveryAt | LocalDateTime | optional | Expected delivery |
| deliveredAt | LocalDateTime | optional | Actual delivery |
| createdAt | LocalDateTime | NOT NULL, immutable | Creation timestamp |
| updatedAt | LocalDateTime | NOT NULL | Last update timestamp |
| createdBy | UUID | optional | Creator user ID |
| updatedBy | UUID | optional | Updater user ID |

---

#### RMA (Return Merchandise Authorization)

**Purpose**: Handles customer returns, inspection, and restocking decisions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| rmaNumber | String | max 50, NOT NULL, unique | Customer-facing RMA number |
| fulfillment_id | UUID | FK, NOT NULL | Original fulfillment |
| orderId | UUID | NOT NULL, indexed | Order reference |
| productId | UUID | NOT NULL | Product being returned |
| status | RmaStatus | default PENDING, NOT NULL | RMA status |
| quantity | Integer | NOT NULL | Quantity being returned |
| receivedQuantity | Integer | default 0, NOT NULL | Quantity received |
| reasonCode | String | max 50 | Return reason code |
| reason | String | max 1000 | Detailed reason |
| refundAmount | BigDecimal | precision 10, scale 2 | Refund amount |
| restockingFee | BigDecimal | precision 10, scale 2 | Restocking fee |
| returnTrackingNumber | String | max 100 | Return shipment tracking |
| inspectionNotes | String | max 2000 | Inspection notes |
| canRestock | Boolean | optional | Whether items can be restocked |
| qrCode | String | max 255, unique | RMA tracking QR code |
| approvedAt | LocalDateTime | optional | Approval timestamp |
| receivedAt | LocalDateTime | optional | Receipt timestamp |
| completedAt | LocalDateTime | optional | Completion timestamp |
| createdAt | LocalDateTime | NOT NULL, immutable | Creation timestamp |
| updatedAt | LocalDateTime | NOT NULL | Last update timestamp |
| createdBy | UUID | optional | Creator user ID |
| updatedBy | UUID | optional | Updater user ID |

**Relationships**: Belongs to Fulfillment

---

## Enumerations

### InventoryStatus

Tracks the lifecycle state of inventory items.

| Value | Description |
|-------|-------------|
| AVAILABLE | Available for orders |
| RESERVED | Reserved for an order |
| PICKING | Currently being picked |
| PICKED | Picked, awaiting shipment |
| QUARANTINE | Under quarantine |
| DAMAGED | Damaged items |
| EXPIRED | Expired items |
| IN_TRANSIT | In transit |
| ON_HOLD | On hold |
| RETURNED | Returned items |

---

### FulfillmentStatus

> **Note**: Deprecated - Order service is the source of truth for fulfillment status.

| Value | Description |
|-------|-------------|
| NOT_APPLICABLE | Not applicable |
| NOT_STARTED | Not yet started |
| ALLOCATED | Inventory allocated |
| PICKING | Currently picking |
| PARTIALLY_SHIPPED | Partially shipped |
| SHIPPED | Fully shipped |
| DELIVERED | Delivered |
| RETURNED | Returned |
| CANCELLED | Cancelled |
| RELEASED_TO_WAREHOUSE | Released to warehouse |

---

### FulfillmentDeliveryType

| Value | Description |
|-------|-------------|
| CUSTOMER_PICKUP | Customer picks up from warehouse |
| LOCAL_TRUCK_DELIVERY | Local delivery via truck |
| CARRIER_DELIVERY | Standard carrier delivery |
| BULK_CARRIER_DELIVERY | Bulk/freight carrier delivery |

---

### WaveStatus

| Value | Description | Final? |
|-------|-------------|--------|
| PENDING | Wave created, not released | No |
| RELEASED | Released for picking | No |
| IN_PROGRESS | Currently being picked | No |
| COMPLETED | All items picked | Yes |
| CANCELLED | Wave cancelled | Yes |

---

### RmaStatus

| Value | Description |
|-------|-------------|
| PENDING | RMA requested |
| APPROVED | RMA approved |
| REJECTED | RMA rejected |
| IN_TRANSIT | Return shipment in transit |
| RECEIVED | Items received at warehouse |
| INSPECTING | Under inspection |
| COMPLETED | RMA completed |
| CANCELLED | RMA cancelled |

---

## Entity Relationships

```
Warehouse (root)
├── Section
│   ├── Aisle
│   │   └── Shelf
│   │       ├── Bay
│   │       │   └── Row
│   │       │       └── Bin
│   │       │           └── InventoryItem
│   │       └── FiducialMarker
│   └── Shelf (direct)
├── Aisle (direct)
│   └── Shelf
└── Shelf (direct)

Inventory (master record)
└── InventoryItem (physical lots in bins)

Fulfillment (order fulfillment)
├── Inventory (optional)
├── Wave (picking batch)
└── Rma (returns)

Wave (batch picking)
└── Fulfillment (multiple)

Shipment (physical shipment)
└── Fulfillment (reference)
```

### Location Hierarchy

The warehouse uses a 7-level location hierarchy:

1. **Warehouse** - Physical building
2. **Section** - Area within warehouse (optional grouping)
3. **Aisle** - Navigable path
4. **Shelf** - Storage unit
5. **Bay** - Vertical division of shelf
6. **Row** - Horizontal division of bay
7. **Bin** - Individual storage slot

### Address Format

A bin's full location address follows this pattern:
```
{Warehouse}-{Section}-{Aisle}-{Shelf}-{Bay}-{Row}-{Bin}
Example: WH01-NORTH-A3-SH12-BAY02-R1-C
```

---

## External Service References

This microservice integrates with other services via UUIDs:

| Field | External Service | Description |
|-------|------------------|-------------|
| productId | Product Catalog Service | Product information |
| orderId | Order Service | Order details |
| orderDetailId | Order Service | Line item details |
| pickerId | User Service | Warehouse picker user |
| createdBy/updatedBy | User Service | Audit trail users |
