# Warehouse Module - Technical Documentation

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Entity Types & Data Structures](#2-entity-types--data-structures)
3. [UI Components Architecture](#3-ui-components-architecture)
4. [API Endpoints & Data Flow](#4-api-endpoints--data-flow)
5. [State Management](#5-state-management)
6. [Warehouse Context & Multi-Warehouse Support](#6-warehouse-context--multi-warehouse-support)
7. [Fulfillment Workflow](#7-fulfillment-workflow)
8. [Inventory Management](#8-inventory-management)
9. [Cycle Counts](#9-cycle-counts)
10. [Manufacturer Profiles (Factories)](#10-manufacturer-profiles-factories)
11. [Shipment Requests](#11-shipment-requests)
12. [Warehouse Layout & QR Codes](#12-warehouse-layout--qr-codes)
13. [Views (Manager vs Worker)](#13-views-manager-vs-worker)
14. [Modals & Actions](#14-modals--actions)
15. [Special Features & Edge Cases](#15-special-features--edge-cases)

---

## 1. Module Overview

**Location**: `/components/warehouse/` and `/app/(dashboard)/warehouse/`

**Purpose**: Comprehensive warehouse management system including inventory tracking, fulfillment order processing, cycle counts, shipment requests, and manufacturer profile management.

**Technologies**: Next.js 15+, React, TypeScript, TanStack React Query, Tailwind CSS

### File Structure
```
components/warehouse/
├── WarehouseContext.tsx              # Global warehouse state context
├── WarehouseSelector.tsx             # Warehouse picker component
├── ViewModeToggle.tsx                # Manager/Worker mode toggle
├── ActivityFeed.tsx                  # Activity feed component
├── api/
│   ├── inventoryApi.ts               # Inventory GraphQL API
│   ├── useInventoryApi.ts            # Inventory React Query hooks
│   ├── factoriesApi.ts               # Factories/Manufacturers API
│   ├── useFactoriesApi.ts            # Factory React Query hooks
│   ├── fulfillmentApi.ts             # Fulfillment GraphQL API
│   ├── useFulfillmentApi.ts          # Fulfillment React Query hooks
│   ├── shipmentRequestApi.ts         # Shipment request API
│   └── useShipmentRequestApi.ts      # Shipment request hooks
├── fulfillment/
│   ├── FulfillmentHeader.tsx
│   ├── FulfillmentTabs.tsx
│   ├── FulfillmentStatsCards.tsx
│   ├── FulfillmentOrdersTable.tsx
│   └── BulkAssignModal.tsx
├── fulfillment-detail/
│   ├── PickingInterface.tsx (1153 lines)
│   ├── PackingInterface.tsx
│   ├── ShippingInterface.tsx
│   ├── ShippedInterface.tsx
│   ├── FulfillmentDetailsForm.tsx
│   ├── FulfillmentHeader.tsx
│   ├── LineItemsTable.tsx
│   ├── StatusProgress.tsx
│   ├── AuditTimestamps.tsx
│   ├── BackorderNotice.tsx
│   ├── packing/
│   │   ├── PackingBox.tsx
│   │   └── UnassignedItems.tsx
│   ├── shipping/
│   │   └── ShippingConfigPanel.tsx
│   └── modals/
│       ├── SignatureCaptureModal.tsx
│       ├── PackingSlipModal.tsx
│       ├── ShippingLabelsModal.tsx
│       ├── BillOfLadingModal.tsx
│       ├── ManufacturerDirectModal.tsx
│       ├── RequestInventoryModal.tsx
│       ├── SplitOrderModal.tsx
│       ├── CancelBackorderModal.tsx
│       └── ShipmentConfirmationModal.tsx
├── inventory/
│   ├── InventoryTable.tsx
│   ├── InventoryHeader.tsx
│   ├── InventoryFilters.tsx
│   ├── InventoryStats.tsx
│   ├── BackordersTable.tsx
│   ├── BackorderAlert.tsx
│   ├── ShipmentRequestsTable.tsx
│   ├── api/
│   │   ├── inventoryApi.ts
│   │   ├── useInventoryApi.ts
│   │   ├── shipmentRequestsApi.ts
│   │   └── useShipmentRequestsApi.ts
│   └── hooks/
│       ├── useInventoryState.ts
│       ├── useInventoryPersistence.ts
│       ├── useBackordersState.ts
│       └── useShipmentRequestsState.ts
├── layout/
│   ├── types.ts                      # Warehouse location types
│   ├── visual-builder/
│   │   ├── LibraryToolbar.tsx
│   │   ├── MiniMap.tsx
│   │   └── PropertiesPanel.tsx
│   ├── tree-view/
│   │   └── index.ts
│   ├── hooks/
│   │   └── useVisualElements.ts
│   └── shared/
│       ├── ModalHeader.tsx
│       └── ViewModeToggle.tsx
├── qr-codes/
│   ├── types.ts
│   ├── components/
│   │   ├── QRCodeToolbar.tsx
│   │   └── EmptyState.tsx
│   ├── hooks/
│   │   └── useLocationFiltering.ts
│   └── utils/
│       └── printStyles.ts
├── settings/
│   ├── components/
│   │   ├── WarehouseDetailsForm.tsx
│   │   └── CarrierNotesSection.tsx
│   ├── hooks/
│   │   └── index.ts
│   └── modals/
│       └── index.ts
├── modals/
│   ├── CreateCycleCountModal.tsx
│   ├── AutoGenerateCycleCountModal.tsx
│   ├── CycleCountDetailModal.tsx
│   ├── DeleteFactoryModal.tsx
│   ├── BulkDeleteFactoriesModal.tsx
│   ├── ProcessRmaModal.tsx
│   ├── ReceiveShipmentModal.tsx
│   ├── RecurringShipmentModal.tsx
│   └── ShipmentTypeSelectionModal.tsx
├── WarehouseOverviewContent.tsx
├── WarehouseFulfillmentContent.tsx
├── WarehouseInventoryContent.tsx
├── WarehouseReportsContent.tsx
├── WarehouseReturnsContent.tsx
├── WarehouseLayoutContent.tsx
├── FulfillmentOrderDetailContent.tsx (1882 lines)
├── ManufacturerProfilesContent.tsx
├── ManufacturerProfileModal.tsx
├── CycleCountsContent.tsx
├── CycleCountDetailContent.tsx
├── NewCycleCountContent.tsx
├── RecurringCycleCountJobsContent.tsx
├── ShipmentRequestBuilder.tsx
└── components/
    └── FactorySplitRatesInput.tsx

app/(dashboard)/warehouse/
├── page.tsx                          # Overview/Dashboard
├── layout.tsx                        # Warehouse layout with context
├── fulfillment/
│   ├── page.tsx                      # Fulfillment list
│   └── [id]/page.tsx                 # Fulfillment detail
├── inventory/
│   └── page.tsx                      # Inventory management
├── cycle-counts/
│   ├── page.tsx                      # Cycle counts list
│   ├── new/page.tsx                  # Create cycle count
│   └── [id]/page.tsx                 # Cycle count detail
├── manufacturer-profiles/
│   ├── page.tsx                      # Factories list
│   ├── new/page.tsx                  # Create factory
│   └── [id]/edit/page.tsx            # Edit factory
├── deliveries/
│   ├── page.tsx
│   └── [id]/page.tsx
├── delivery-issues/
│   └── [id]/page.tsx
├── returns/
│   └── page.tsx
├── reports/
│   └── page.tsx
└── settings/
    └── page.tsx
```

---

## 2. Entity Types & Data Structures

### Inventory Types

```typescript
// Inventory Item Status
type InventoryItemStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PICKING'
  | 'DAMAGED'
  | 'QUARANTINE';

// Ownership Type
type OwnershipType = 'CONSIGNMENT' | 'OWNED' | 'THIRD_PARTY';

// ABC Classification
type ABCClass = 'A' | 'B' | 'C';

// Inventory Item (individual stock at location)
interface InventoryItem {
  id: string;
  inventoryId: string;
  locationId: string | null;
  locationName: string | null;
  quantity: number;
  lotNumber: string | null;
  status: InventoryItemStatus;
  receivedDate: string | null;
}

// Inventory (product-level inventory)
interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  pickingQuantity: number;
  ownershipType: OwnershipType;
  abcClass: ABCClass | null;
  createdAt: string;
  updatedAt: string;
  items: InventoryItem[];
  product: {
    id: string;
    factoryPartNumber: string;
    description: string;
  };
}

// Inventory Stats
interface InventoryStats {
  totalProducts: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  pickingQuantity: number;
  lowStockCount: number;
}
```

### Fulfillment Order Types

```typescript
type FulfillmentOrderStatus =
  | 'PENDING'
  | 'RELEASED'
  | 'PICKING'
  | 'BACKORDER_REVIEW'
  | 'PACKING'
  | 'SHIPPING'
  | 'SHIPPED'
  | 'PARTIAL_SHIPPED'
  | 'COMMUNICATED'
  | 'DELIVERED'
  | 'CANCELLED';

type FulfillmentMethod = 'SHIP' | 'WILL_CALL';

interface FulfillmentOrder {
  id: string;
  fulfillmentOrderNumber: string;
  orderId: string;
  orderNumber: string;
  status: FulfillmentOrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  warehouseId: string | null;
  carrierId: string | null;
  carrierType: 'PARCEL' | 'FREIGHT' | null;
  carrier: { id: string; name: string } | null;
  freightClass: string | null;
  serviceType: string | null;
  needByDate: string | null;
  holdReason: string | null;
  shipToAddress: Address | null;
  lineItems: FulfillmentOrderLineItem[];
  packingBoxes: PackingBox[];
  assignments: FulfillmentAssignment[];
  activities: FulfillmentActivity[];
  documents: AttachedDocument[];
  trackingNumbers: string[] | null;
  shipConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FulfillmentOrderLineItem {
  id: string;
  productId: string;
  product: {
    id: string;
    factoryPartNumber: string;
    description: string;
    factory?: { id: string; title: string };
  };
  orderedQty: number;
  allocatedQty: number;
  pickedQty: number;
  backorderQty: number;
  fulfilledByManufacturer: boolean;
}

interface PackingBox {
  id: string;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  items: { fulfillmentLineItemId: string }[];
}

interface FulfillmentAssignment {
  id: string;
  userId: string;
  role: 'MANAGER' | 'WORKER';
  user: { id: string; fullName: string; username: string };
}

type FulfillmentAssignmentRole = 'MANAGER' | 'WORKER';
```

### Factory (Manufacturer) Types

```typescript
interface FactorySplitRate {
  id: string;
  factoryId?: string;
  splitRate: string;
  position: number;
  user?: User;
}

interface Factory {
  id: string;
  title: string;
  accountNumber?: string;
  additionalInformation?: string;
  baseCommissionRate?: string;
  commissionDiscountRate?: string;
  email?: string;
  externalPaymentTerms?: string;
  freightDiscountType?: string;
  freightTerms?: string;
  leadTime?: number;
  logoId?: string;
  overallDiscountRate?: string;
  paymentTerms?: number;
  phone?: string;
  published: boolean;
  splitRates?: FactorySplitRate[];
  createdBy?: User;
  createdAt?: string;
}
```

### Warehouse Location Types

```typescript
interface WarehouseLocation {
  id: string;
  name: string;
  type: 'section' | 'aisle' | 'shelf' | 'bay' | 'row' | 'bin';
  parentId?: string;
  children?: WarehouseLocation[];
  x?: number;           // Visual canvas X position
  y?: number;           // Visual canvas Y position
  width?: number;       // Visual width
  height?: number;      // Visual height
  rotation?: number;    // Rotation angle
  description?: string;
  isActive: boolean;
  products?: ProductAssignment[];
}

interface VisualElement {
  id: string;
  locationId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: 'section' | 'aisle' | 'shelf' | 'bay' | 'row' | 'bin';
  name: string;
  parentId?: string;
  children?: VisualElement[];
}

type ViewMode = 'tree' | 'visual';
```

### Cycle Count Types

```typescript
type CycleCountStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

type CycleCountType =
  | 'FULL'
  | 'ABC'
  | 'RANDOM'
  | 'LOCATION'
  | 'CATEGORY';

type CycleCountPriority = 'HIGH' | 'MEDIUM' | 'LOW';

interface CycleCount {
  id: string;
  cycleCountNumber: string;
  name: string;
  description?: string;
  type: CycleCountType;
  status: CycleCountStatus;
  priority: CycleCountPriority;
  scheduledDate: string;
  dueDate?: string;
  assignedToId?: string;
  assignedToName?: string;
  totalItems: number;
  countedItems: number;
  itemsWithVariance: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. UI Components Architecture

### Component Hierarchy

```
WarehouseProvider (Context)
├── WarehouseLayout
│   ├── WarehouseSelector (warehouse picker)
│   └── ViewModeToggle (manager/worker)
│
├── Overview (Dashboard)
│   └── WarehouseOverviewContent
│       ├── Stats Cards
│       ├── Recent Activity
│       └── Quick Actions
│
├── Fulfillment
│   ├── WarehouseFulfillmentContent
│   │   ├── FulfillmentHeader
│   │   ├── FulfillmentStatsCards
│   │   ├── FulfillmentTabs
│   │   └── FulfillmentOrdersTable
│   │
│   └── FulfillmentOrderDetailContent (1882 lines)
│       ├── FulfillmentHeader
│       ├── StatusProgress
│       ├── BackorderNotice (conditional)
│       ├── PickingInterface (when PICKING)
│       │   ├── Location-based picking
│       │   ├── QR Scan support
│       │   └── Shortage reporting
│       ├── PackingInterface (when PACKING)
│       │   ├── PackingBox components
│       │   ├── UnassignedItems
│       │   └── Drag-drop support
│       ├── ShippingInterface (when SHIPPING)
│       │   ├── ShippingConfigPanel
│       │   ├── Carrier selection
│       │   └── Signature capture
│       ├── ShippedInterface (when SHIPPED)
│       ├── FulfillmentDetailsForm
│       ├── LineItemsTable
│       ├── AssignmentPanel
│       ├── DocumentsSection
│       ├── ActivityFeed
│       └── AuditTimestamps
│
├── Inventory
│   └── WarehouseInventoryContent
│       ├── InventoryHeader
│       ├── InventoryStats
│       ├── InventoryFilters
│       ├── InventoryTable
│       ├── BackordersTable (tab)
│       └── ShipmentRequestsTable (tab)
│
├── Cycle Counts
│   ├── CycleCountsContent
│   │   ├── Stats Cards
│   │   ├── Tabs (Counts | Recurring)
│   │   └── Sortable/Filterable Table
│   ├── NewCycleCountContent
│   └── CycleCountDetailContent
│
├── Manufacturer Profiles
│   ├── ManufacturerProfilesContent
│   │   ├── Search & Filters
│   │   ├── List/Table view
│   │   └── Bulk actions
│   └── ManufacturerProfileModal (create/edit)
│
├── Returns
│   └── WarehouseReturnsContent
│
├── Reports
│   └── WarehouseReportsContent
│
└── Settings
    └── WarehouseSettingsContent
        ├── WarehouseDetailsForm
        └── CarrierNotesSection
```

---

## 4. API Endpoints & Data Flow

### Inventory API

```typescript
// Queries
const GET_INVENTORIES = `
  query Inventories(
    $warehouseId: UUID!
    $factoryId: UUID
    $status: String
    $search: String
    $limit: Int
    $offset: Int
  ) {
    inventories(...) {
      id, productId, warehouseId, totalQuantity, availableQuantity,
      reservedQuantity, pickingQuantity, ownershipType, abcClass,
      items { id, locationId, locationName, quantity, status, ... }
      product { id, factoryPartNumber, description }
    }
  }
`;

const GET_INVENTORY_STATS = `
  query InventoryStats($warehouseId: UUID!) {
    inventoryStats(warehouseId: $warehouseId) {
      totalProducts, totalQuantity, availableQuantity, reservedQuantity,
      pickingQuantity, lowStockCount
    }
  }
`;

// API Functions
fetchInventories(warehouseId, options?)
fetchInventoryById(id)
fetchInventoryByProduct(productId, warehouseId)
fetchInventoriesByProducts(productIds, warehouseId)
fetchInventoryStats(warehouseId)
```

### Fulfillment API

```typescript
// Queries
fetchFulfillmentOrders(filters?)
fetchFulfillmentOrder(id)
fetchFulfillmentStats(warehouseId?)
fetchBackorderItems(fulfillmentOrderId)

// Mutations - Order Lifecycle
createFulfillmentOrder(input)
updateFulfillmentOrder(id, input)
releaseToWarehouse(id)
cancelFulfillmentOrder(id, reason)

// Mutations - Picking
startPicking(id)
updatePickedQuantity(input: { lineItemId, quantity, notes })
completePicking(id)
reportInventoryDiscrepancy(lineItemId, actualQuantity, reason)

// Mutations - Packing
addPackingBox(fulfillmentOrderId, input)
updatePackingBox(boxId, input)
assignItemToBox(input: { boxId, lineItemId, quantity })
removeItemFromBox(boxId, lineItemId)
deletePackingBox(boxId)
completePacking(id)

// Mutations - Shipping
completeShipping(id, input: { trackingNumbers, signature?, ... })
markCommunicated(id)
markDelivered(id)

// Mutations - Backorder
markManufacturerFulfilled(input: { fulfillmentOrderId, lineItemIds })
splitFulfillmentLineItem(input: { lineItemId, warehouseQty, manufacturerQty })
cancelBackorderItems(input: { fulfillmentOrderId, lineItemIds, reason })
linkShipmentRequest(input: { fulfillmentOrderId, lineItemIds, shipmentRequestId })

// Mutations - Assignments
addFulfillmentAssignment(fulfillmentOrderId, userId, role)
removeFulfillmentAssignment(assignmentId)
bulkAssignFulfillmentOrders(input)

// Mutations - Notes
addFulfillmentNote(fulfillmentOrderId, content)
```

### Factory API

```typescript
// Queries
fetchFactoriesWithPagination(filters?, orderBy?, pagination?)
fetchFactories()
fetchFactoryById(id)
fetchAllFactoryIds(filters?, orderBy?)

// Mutations
createFactory(input: CreateFactoryInput)
updateFactory(id, input: UpdateFactoryInput)
deleteFactory(id)
```

---

## 5. State Management

### useInventoryState Hook

```typescript
function useInventoryState(warehouseId?: string) {
  // URL Sync
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter');
  const urlSearch = searchParams.get('search');

  // Queries
  const { data: invData, refetch } = useInventoryQuery(warehouseId);
  const { data: statsData } = useInventoryStatsQuery(warehouseId);

  // UI State
  const [selectedFactory, setSelectedFactory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [activeStatFilter, setActiveStatFilter] = useState(urlFilter || 'all');

  // Sorting
  const [sortField, setSortField] = useState<InventorySortField>('productName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Column Filters
  const [columnFilters, setColumnFilters] = useState<InventoryColumnFilters>({
    factoryName: [],
    productName: '',
    partNumber: '',
    location: '',
    status: [],
    dateRange: { start: '', end: '' },
  });

  // Derived: Flattened inventory items
  const flatInventoryItems: FlatInventoryItem[] = useMemo(() => {
    // Flatten inventory items with product info
  }, [inventory]);

  // Filtered items with all filters applied
  const filteredItems = useMemo(() => {
    // Apply stat filter, factory, status, search, column filters, sorting
  }, [flatInventoryItems, filters...]);

  return {
    inventory, stats, filteredItems, factories,
    // All UI state getters/setters
    handleStatCardClick, handleSort, refetchInventory, refetchStats
  };
}
```

### Fulfillment Order Detail State

The `FulfillmentOrderDetailContent` component manages extensive local state:

```typescript
// Form State (initialized from API)
warehouseId, fulfillmentMethod, shipToName, shipToAddress...
needByDate, trackingNumbers, shippingMethod, carrierType, selectedCarrier

// Picking State
viewingStatus         // View previous statuses
pickedItems          // Record<lineItemId, quantity>
pickingNotes         // Record<lineItemId, note>
locationPicks        // Per-location picking state

// Packing State
packingBoxes         // Local box state (synced on Save)
verifiedItems        // Record<lineItemId, boolean>
draggedItemId        // Drag-drop tracking
boxesToDelete        // Server boxes to delete on save

// Shipping State
shippingMethod, carrierType, selectedCarrier
trackingNumbers, proNumber, bolNumber, freightClass
pickupSignature, pickupTimestamp, pickupName, driverName

// Backorder State
backorderItems       // Derived from lineItems with backorderQty > 0

// Activity Feed
activities           // From fulfillmentOrder.activities

// Unsaved Changes Detection
hasUnsavedChanges    // Computed from form state vs original
```

---

## 6. Warehouse Context & Multi-Warehouse Support

### WarehouseContext

```typescript
type WarehouseViewMode = 'manager' | 'worker';

interface ContextWarehouse {
  id: string;
  name: string;
  status: string;
  isActive?: boolean | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
}

interface WarehouseContextType {
  warehouses: ContextWarehouse[];
  selectedWarehouse: ContextWarehouse | null;
  setSelectedWarehouse: (warehouse: ContextWarehouse | null) => void;
  viewMode: WarehouseViewMode;
  setViewMode: (mode: WarehouseViewMode) => void;
  isWorkerView: boolean;
  isManagerView: boolean;
  isLoading: boolean;
}

// Storage Keys
const VIEW_MODE_STORAGE_KEY = 'warehouse-view-mode';
const SELECTED_WAREHOUSE_KEY = 'selected-warehouse-id';
```

### Key Features

1. **Persistent Selection**: Selected warehouse stored in localStorage
2. **View Mode Toggle**: Manager vs Worker views affect:
   - Available actions (workers can't create/edit certain things)
   - Visible cycle counts (workers only see SCHEDULED+)
   - UI complexity (simplified worker interface)
3. **Cross-Tab Sync**: Custom event dispatched on view mode change
4. **Auto-Select**: First warehouse auto-selected if none saved

---

## 7. Fulfillment Workflow

### Status Progression

```
PENDING → RELEASED → PICKING → PACKING → SHIPPING → SHIPPED → COMMUNICATED → DELIVERED
                 ↓
          BACKORDER_REVIEW (if shortage detected)
                 ↓
          Back to PICKING after resolution
```

### Status-Based UI

| Status | Interface | Key Actions |
|--------|-----------|-------------|
| PENDING | Details form | Release to Warehouse |
| RELEASED | Details form | Start Picking |
| PICKING | PickingInterface | Pick items, Report shortage, Complete Picking |
| BACKORDER_REVIEW | BackorderNotice | Mfr Direct, Request Inventory, Split, Cancel |
| PACKING | PackingInterface | Drag items to boxes, Complete Packing |
| SHIPPING | ShippingInterface | Set carrier/tracking, Capture signature, Confirm |
| SHIPPED | ShippedInterface | Send Confirmation email |
| COMMUNICATED | Read-only | Mark Delivered |
| DELIVERED | Read-only | - |

### Picking Interface Features

1. **Location-based picking**: Items allocated to warehouse locations
2. **QR Code scanning**: Scan bin to filter items at that location
3. **Quantity tracking**: Per-location expected vs picked
4. **Cascade shortages**: Shortage at one location cascades to next
5. **Finalize locations**: Lock in picked quantity per location
6. **Shortage reporting**: Report to inside sales, creates BACKORDER_REVIEW

```typescript
interface LocationPickState {
  locationId: string;
  locationName: string;
  locationType: string;     // PRIMARY, OVERFLOW, RESERVE
  expectedQty: number;
  pickedQty: number;
  isFinalized: boolean;
}

interface LineItemPickState {
  lineItemId: string;
  locations: LocationPickState[];
  totalExpected: number;
  totalPicked: number;
  isShort: boolean;
  shortageNotes: string;
}
```

### Packing Interface Features

1. **Box management**: Add/remove packing boxes (pallets)
2. **Drag-drop**: Drag items to boxes
3. **Box configuration**: Packaging type, dimensions, weight
4. **Add All**: Assign all unassigned items to a box
5. **Print packing slips**: Per-box packing documentation

```typescript
interface PackingBoxType {
  id: string;
  packagingType: string;         // pallet_48x40x6, custom, etc.
  customWeight: string;
  useCustomWeight: boolean;
  customDimensions: { length: string; width: string; height: string };
  lineItemIds: string[];
}

// Packaging Options
const packagingOptions = [
  { value: 'pallet_48x40x6', name: '48x40x6 Pallet', dimensions: {...} },
  { value: 'pallet_48x40x8', name: '48x40x8 Pallet', dimensions: {...} },
  { value: 'custom', name: 'Custom', dimensions: {...} },
];
```

### Shipping Interface Features

1. **Delivery method**: SHIP vs WILL_CALL
2. **Carrier type**: Parcel vs Freight/LTL
3. **Carrier selection**: From shipping carriers API
4. **Tracking**: Tracking numbers, PRO number, BOL number
5. **Signature capture**: For freight/LTL and will-call
6. **Print documents**: Packing slips, shipping labels, BOL

---

## 8. Inventory Management

### Stat Card Filters

| Filter | Description |
|--------|-------------|
| all | All inventory items |
| available | Items with AVAILABLE status |
| reserved | Items with RESERVED status |
| low_stock | Items where availableQuantity <= reorderPoint |

### Column Filters

- **Factory Name**: Multi-select dropdown
- **Product Name**: Text search
- **Part Number**: Text search
- **Location**: Text search
- **Status**: Multi-select (AVAILABLE, RESERVED, PICKING, DAMAGED, QUARANTINE)
- **Date Range**: Received date range

### Picking Allocation Algorithm

```typescript
function calculatePickingAllocationFromInventory(
  inventory: Inventory,
  qtyNeeded: number
): PickingAllocation[] {
  const allocations: PickingAllocation[] = [];
  let remaining = qtyNeeded;

  // Sort items: AVAILABLE first, then by quantity (largest first)
  const availableItems = inventory.items
    .filter((item) => item.status === 'AVAILABLE' && item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  for (const item of availableItems) {
    if (remaining <= 0) break;

    const pickFromHere = Math.min(item.quantity, remaining);
    if (pickFromHere > 0) {
      allocations.push({
        locationId: item.locationId || 'unassigned',
        locationName: item.locationName || 'Unassigned',
        locationType: 'PRIMARY',
        quantity: pickFromHere,
        inventoryItemId: item.id,
      });
      remaining -= pickFromHere;
    }
  }

  return allocations;
}
```

---

## 9. Cycle Counts

### Cycle Count Types

| Type | Description |
|------|-------------|
| FULL | Count all inventory |
| ABC | Count by ABC classification |
| RANDOM | Random sample of items |
| LOCATION | Count specific locations |
| CATEGORY | Count specific categories |

### Worker vs Manager View

**Workers see:**
- Only SCHEDULED, IN_PROGRESS, PENDING_REVIEW, COMPLETED counts
- Cannot create new counts
- Cannot access Recurring Jobs tab

**Managers see:**
- All counts including DRAFT
- Can create/edit/cancel counts
- Recurring Jobs management tab
- Full filtering and actions

### Stats Cards

- **Total Counts**: All time count
- **Active**: IN_PROGRESS + PENDING_REVIEW
- **Scheduled**: SCHEDULED + DRAFT
- **Completed**: COMPLETED count + this month count
- **Avg Accuracy**: Percentage, colored by threshold

---

## 10. Manufacturer Profiles (Factories)

### Factory Fields

| Field | Type | Description |
|-------|------|-------------|
| title | string | Factory name (required) |
| accountNumber | string | Account identifier |
| email | string | Contact email |
| phone | string | Contact phone |
| published | boolean | Is visible/active |
| leadTime | number | Days for delivery |
| paymentTerms | number | Payment terms (days) |
| overallDiscountRate | string | General discount % |
| baseCommissionRate | string | Base commission % |
| commissionDiscountRate | string | Commission discount % |
| freightDiscountType | string | Freight discount type |
| freightTerms | string | Freight terms |
| externalPaymentTerms | string | External payment terms |
| additionalInformation | string | Notes |
| splitRates | FactorySplitRate[] | Rep commission splits |

### Split Rates

Commission split among reps:
```typescript
interface FactorySplitRate {
  id: string;
  userId: string;
  splitRate: string;    // Percentage as string
  position: number;     // Order in split
  user?: User;
}
```

---

## 11. Shipment Requests

### Purpose
Request inventory from manufacturers to fulfill backorders.

### Integration with Fulfillment

1. **Backorder detected** during picking
2. **Manager reviews** in BACKORDER_REVIEW status
3. **Options**:
   - Mark as Manufacturer Direct (skip warehouse)
   - Create Shipment Request (order inventory)
   - Split Order (partial from each)
   - Cancel Backorder items

### Shipment Request Creation

```typescript
// Group backorder items by manufacturer
const byManufacturer = items.reduce((acc, item) => {
  const mfrId = item.manufacturerId;
  if (!acc[mfrId]) {
    acc[mfrId] = { name: item.manufacturerName, items: [], lineItemIds: [] };
  }
  acc[mfrId].items.push({
    productId: item.lineItem.productId,
    quantity: item.requestedQty,
  });
  acc[mfrId].lineItemIds.push(item.lineItem.id);
  return acc;
}, {});

// Create request and link to fulfillment order
const shipmentRequest = await createShipmentRequest(mfrId, items);
await linkShipmentRequest(fulfillmentOrderId, lineItemIds, shipmentRequest.id);
```

---

## 12. Warehouse Layout & QR Codes

### Location Hierarchy

```
Warehouse
├── Section (e.g., "Section A")
│   ├── Aisle (e.g., "Aisle 1")
│   │   ├── Shelf (e.g., "Shelf A")
│   │   │   ├── Bay (e.g., "Bay 1")
│   │   │   │   └── Bin (e.g., "Bin A1-1-A-1")
```

### Visual Builder

- **View Modes**: Tree view or Visual canvas
- **Canvas Features**: Zoom, pan, element placement
- **Properties Panel**: Edit selected element
- **Library Toolbar**: Drag elements onto canvas

### QR Code Generation

```typescript
interface LocationWithPath {
  id: string;
  name: string;
  type: string;
  path: string;           // e.g., "Section A > Aisle 1 > Bin A1"
  fullPath: string[];     // ['Section A', 'Aisle 1', 'Bin A1']
}

type PrintFormat =
  | 'sheet-small'
  | 'sheet-medium'
  | 'sheet-large'
  | 'labels-30'
  | 'labels-80';
```

---

## 13. Views (Manager vs Worker)

### Manager View

- Full CRUD on all entities
- All fulfillment statuses visible
- Cycle count creation/editing
- Recurring jobs management
- Backorder resolution decisions
- User assignment management
- Report access

### Worker View

- Simplified interface
- Only see assigned/released work
- Can perform picking, packing, shipping
- Cannot create entities
- Limited cycle count visibility
- Read-only on most settings

### View Toggle

```typescript
// Stored in localStorage
localStorage.setItem('warehouse-view-mode', mode);

// Cross-component sync via custom event
window.dispatchEvent(new Event('warehouse-view-mode-change'));
```

---

## 14. Modals & Actions

### Fulfillment Modals

| Modal | Purpose |
|-------|---------|
| PackingSlipModal | Print packing slip per box |
| ShippingLabelsModal | Print shipping/pallet labels |
| BillOfLadingModal | Print BOL for freight |
| SignatureCaptureModal | Canvas signature capture |
| ShipmentConfirmationModal | Email confirmation to customer |
| ManufacturerDirectModal | Mark items for mfr fulfillment |
| RequestInventoryModal | Create shipment request |
| SplitOrderModal | Split between warehouse/mfr |
| CancelBackorderModal | Cancel backorder items |

### Fulfillment Actions

| Action | Status | Effect |
|--------|--------|--------|
| Release to Warehouse | PENDING → RELEASED | Makes available for picking |
| Start Picking | RELEASED → PICKING | Worker begins picking |
| Complete Picking | PICKING → PACKING | All items picked |
| Report Shortage | PICKING → BACKORDER_REVIEW | Shortage detected |
| Complete Packing | PACKING → SHIPPING | All items in boxes |
| Confirm Shipment | SHIPPING → SHIPPED | Tracking entered |
| Send Confirmation | SHIPPED → COMMUNICATED | Email sent |
| Mark Delivered | COMMUNICATED → DELIVERED | Delivery confirmed |

### Bulk Actions

- **Bulk Assign**: Assign manager/worker to multiple orders
- **Bulk Delete Factories**: Delete multiple factories

---

## 15. Special Features & Edge Cases

### Unsaved Changes Guard

```typescript
const hasUnsavedChanges = useMemo(() => {
  if (!fulfillmentOrder) return false;
  // Compare all form fields with original values
  return (
    warehouseId !== original.warehouseId ||
    shippingMethod !== original.fulfillmentMethod ||
    selectedCarrier !== original.carrierId ||
    // ... all other fields
  );
}, [formFields, fulfillmentOrder]);

// Floating save bar appears when hasUnsavedChanges is true
```

### Packing Box Sync

Local packing state is managed separately from server:

```typescript
// On Save:
// 1. Delete boxes marked for removal
for (const boxId of boxesToDelete) {
  await deletePackingBoxMutation.mutateAsync(boxId);
}

// 2. Create new local boxes on server
for (const box of packingBoxes) {
  if (box.id.startsWith('local-')) {
    const newBox = await addPackingBoxMutation.mutateAsync(...);
    boxIdMap.set(box.id, newBox.id);
  }
}

// 3. Sync item assignments
// Remove from old boxes, assign to new boxes
```

### Activity Feed

Generic activity feed component:

```typescript
interface GenericActivity {
  id: string;
  type: string;
  timestamp: string;
  createdBy: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

// User name resolution via userMap
const createdByName = userMap.get(activity.createdById)?.fullName
  || activity.createdById || 'System';
```

### Backorder Resolution Flow

```
1. Worker reports shortage during picking
   ↓
2. Order moves to BACKORDER_REVIEW
   ↓
3. Manager reviews options:
   a. Manufacturer Direct - Ship from manufacturer
   b. Request Inventory - Create shipment request
   c. Split Order - Partial from warehouse, rest from mfr
   d. Cancel - Remove backorder items
   ↓
4. After resolution, order continues workflow
```

### Signature Capture

Canvas-based signature for freight/will-call:

```typescript
interface SignatureData {
  signature: string;        // Base64 image
  timestamp: Date;
  pickupCustomerName: string;
  driverName?: string;
  notes?: string;
}
```

### URL-Based Navigation

```
/warehouse              → Overview dashboard
/warehouse/fulfillment  → Fulfillment orders list
/warehouse/fulfillment/{id} → Order detail
/warehouse/inventory    → Inventory management
/warehouse/cycle-counts → Cycle counts list
/warehouse/cycle-counts/new → Create cycle count
/warehouse/cycle-counts/{id} → Cycle count detail
/warehouse/manufacturer-profiles → Factories list
/warehouse/manufacturer-profiles/new → Create factory
/warehouse/manufacturer-profiles/{id}/edit → Edit factory
/warehouse/returns      → Returns management
/warehouse/reports      → Reports
/warehouse/settings     → Warehouse settings
```

### Toast Notifications

```typescript
import { fulfillmentToasts } from '@/components/lib/toast';

fulfillmentToasts.releaseSuccess(orderNumber);
fulfillmentToasts.releaseError(errorMessage);
fulfillmentToasts.startPickingSuccess(orderNumber);
fulfillmentToasts.completePickingSuccess(orderNumber);
fulfillmentToasts.completePackingSuccess(orderNumber);
fulfillmentToasts.shipmentConfirmed(orderNumber);
fulfillmentToasts.saveSuccess(orderNumber);
fulfillmentToasts.saveError(errorMessage);
```
