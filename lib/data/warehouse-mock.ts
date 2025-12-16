// ============================================================================
// Flow Warehouse - Mock Data
// Development data for warehouse management features
// ============================================================================

import {
  Warehouse,
  Section,
  Aisle,
  Shelf,
  Bay,
  Row,
  Bin,
  Inventory,
  InventoryItem,
  Fulfillment,
  Wave,
  IncomingShipment,
  Rma,
  StockControlItem,
  HighPriorityOrder,
  BuySellTransaction,
  BuySellSummary,
  InventoryStatus,
  FulfillmentStatus,
  WaveStatus,
  RmaStatus,
  ShipmentStatus,
  AdjustmentType,
  RmaReason,
  OwnershipType,
  BuySellStatus,
  FulfillmentOrder,
  FulfillmentOrderLineItem,
  FulfillmentOrderStatus,
  ManufacturerContact,
  ShipmentRequest,
  ShipmentRequestStatus,
  CycleCount,
  CycleCountLineItem,
  CycleCountStatus,
  ManufacturerProfile,
  VendorCustomerXRef,
  FreightCategory,
} from '../types/warehouse';

import { Task } from '../types/tasks';

// Extended bin type for layout visualization
export interface ExtendedBin extends Bin {
  maxCapacity: number;
  currentQuantity: number;
}

// Adjustment interface for reports
export interface Adjustment {
  id: string;
  inventoryId: string;
  type: AdjustmentType;
  quantityChange: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
}

// -----------------------------------------------------------------------------
// Mock Warehouses
// -----------------------------------------------------------------------------

export const mockWarehouses: Warehouse[] = [
  {
    id: 'WH-001',
    name: 'Atlanta Distribution Center',
    addressLine1: '1234 Industrial Parkway',
    city: 'Atlanta',
    state: 'GA',
    postalCode: '30301',
    country: 'USA',
    description: 'Main distribution center for Southeast region',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'WH-002',
    name: 'Raleigh Distribution Center',
    addressLine1: '5678 Commerce Drive',
    city: 'Raleigh',
    state: 'NC',
    postalCode: '27601',
    country: 'USA',
    description: 'Secondary distribution for East Coast',
    isActive: true,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-11-15T10:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// Mock Location Hierarchy (for Atlanta DC)
// -----------------------------------------------------------------------------

export const mockSections: Section[] = [
  {
    id: 'SEC-001',
    warehouseId: 'WH-001',
    name: 'Section A',
    description: 'High-velocity items',
    width: 100,
    length: 200,
    height: 30,
    xOffset: 0,
    yOffset: 0,
    orientationDeg: 0,
    isActive: true,
  },
  {
    id: 'SEC-002',
    warehouseId: 'WH-001',
    name: 'Section B',
    description: 'Medium-velocity items',
    width: 100,
    length: 200,
    height: 30,
    xOffset: 110,
    yOffset: 0,
    orientationDeg: 0,
    isActive: true,
  },
];

export const mockAisles: Aisle[] = [
  { id: 'AISLE-001', warehouseId: 'WH-001', sectionId: 'SEC-001', name: 'Aisle 1', aisleNumber: 1, zone: 'A', isActive: true },
  { id: 'AISLE-002', warehouseId: 'WH-001', sectionId: 'SEC-001', name: 'Aisle 2', aisleNumber: 2, zone: 'A', isActive: true },
  { id: 'AISLE-003', warehouseId: 'WH-001', sectionId: 'SEC-002', name: 'Aisle 3', aisleNumber: 3, zone: 'B', isActive: true },
];

export const mockShelves: Shelf[] = [
  { id: 'SHELF-001', warehouseId: 'WH-001', aisleId: 'AISLE-001', sectionId: 'SEC-001', name: 'Shelf 1A', shelfNumber: 1, height: 8, width: 4, length: 20, isActive: true },
  { id: 'SHELF-002', warehouseId: 'WH-001', aisleId: 'AISLE-001', sectionId: 'SEC-001', name: 'Shelf 1B', shelfNumber: 2, height: 8, width: 4, length: 20, isActive: true },
  { id: 'SHELF-003', warehouseId: 'WH-001', aisleId: 'AISLE-002', sectionId: 'SEC-001', name: 'Shelf 2A', shelfNumber: 1, height: 8, width: 4, length: 20, isActive: true },
  { id: 'SHELF-004', warehouseId: 'WH-001', aisleId: 'AISLE-003', sectionId: 'SEC-002', name: 'Shelf 3A', shelfNumber: 1, height: 8, width: 4, length: 20, isActive: true },
];

export const mockBays: Bay[] = [
  { id: 'BAY-001', shelfId: 'SHELF-001', code: 'BAY-01', bayNumber: 1, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY01' },
  { id: 'BAY-002', shelfId: 'SHELF-001', code: 'BAY-02', bayNumber: 2, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY02' },
  { id: 'BAY-003', shelfId: 'SHELF-002', code: 'BAY-01', bayNumber: 1, isActive: true, qrContent: 'WH001-SEC001-A1-S1B-BAY01' },
  { id: 'BAY-004', shelfId: 'SHELF-003', code: 'BAY-01', bayNumber: 1, isActive: true, qrContent: 'WH001-SEC001-A2-S2A-BAY01' },
];

export const mockRows: Row[] = [
  { id: 'ROW-001', bayId: 'BAY-001', rowNumber: 1, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY01-R1' },
  { id: 'ROW-002', bayId: 'BAY-001', rowNumber: 2, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY01-R2' },
  { id: 'ROW-003', bayId: 'BAY-002', rowNumber: 1, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY02-R1' },
  { id: 'ROW-004', bayId: 'BAY-003', rowNumber: 1, isActive: true, qrContent: 'WH001-SEC001-A1-S1B-BAY01-R1' },
];

export const mockBins: ExtendedBin[] = [
  { id: 'BIN-001', rowId: 'ROW-001', letterCode: 'A', width: 1.5, height: 1.5, depth: 1.5, maxWeight: 5000, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY01-R1-A', maxCapacity: 200, currentQuantity: 100 },
  { id: 'BIN-002', rowId: 'ROW-001', letterCode: 'B', width: 2, height: 1, depth: 1, maxWeight: 50, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY01-R1-B', maxCapacity: 100, currentQuantity: 50 },
  { id: 'BIN-003', rowId: 'ROW-001', letterCode: 'C', width: 1, height: 1, depth: 1, maxWeight: 5000, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY01-R1-C', maxCapacity: 500, currentQuantity: 450 },
  { id: 'BIN-004', rowId: 'ROW-001', letterCode: 'D', width: 1, height: 1, depth: 1, maxWeight: 500, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY01-R1-D', maxCapacity: 300, currentQuantity: 200 },
  { id: 'BIN-005', rowId: 'ROW-002', letterCode: 'A', width: 1.5, height: 1.5, depth: 1.5, maxWeight: 3000, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY01-R2-A', maxCapacity: 150, currentQuantity: 75 },
  { id: 'BIN-006', rowId: 'ROW-003', letterCode: 'A', width: 2, height: 2, depth: 2, maxWeight: 8000, isActive: true, qrContent: 'WH001-SEC001-A1-S1A-BAY02-R1-A', maxCapacity: 400, currentQuantity: 300 },
];

// -----------------------------------------------------------------------------
// Mock Inventory (Linked to Products and Manufacturers)
// -----------------------------------------------------------------------------

export const mockInventory: Inventory[] = [
  {
    id: 'INV-001',
    productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
    productName: 'ALF Flexible Area Light, 60000Lm',
    partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
    factoryId: 'CO-012',  // Legrand North America (Manufacturer)
    factoryName: 'Legrand North America',
    totalQuantity: 150,
    availableQuantity: 120,
    reservedQuantity: 20,
    pickingQuantity: 5,
    pickedQuantity: 5,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 50,
    maxQuantity: 500,
    ownershipType: 'CONSIGNMENT',
    isConsignment: true,
    commissionPercentage: 10,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'INV-002',
    productId: 'ALF-ASR',
    productName: 'Adjustable Square & Round Pole Mounting',
    partNumber: 'ALF-ASR',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    totalQuantity: 500,
    availableQuantity: 480,
    reservedQuantity: 15,
    pickingQuantity: 5,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 100,
    maxQuantity: 1000,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 18.50,
    targetMargin: 35,
    totalCostBasis: 9250.00,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'INV-003',
    productId: 'PC-2',
    productName: 'Twist-lock Photocell with receptacle',
    partNumber: 'PC-2',
    factoryId: 'CO-004',  // Johnson Controls (Manufacturer)
    factoryName: 'Johnson Controls',
    totalQuantity: 200,
    availableQuantity: 180,
    reservedQuantity: 10,
    pickingQuantity: 5,
    pickedQuantity: 5,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 50,
    maxQuantity: 500,
    ownershipType: 'CONSIGNMENT',
    isConsignment: true,
    commissionPercentage: 8,
    createdAt: '2024-07-15T10:00:00Z',
    updatedAt: '2024-12-08T10:00:00Z',
  },
  {
    id: 'INV-004',
    productId: 'MS-DCE-09-L7-W',
    productName: 'Motion Sensor, DC, Fixture External',
    partNumber: 'MS-DCE-09-L7-W',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    totalQuantity: 75,
    availableQuantity: 30,
    reservedQuantity: 25,
    pickingQuantity: 10,
    pickedQuantity: 10,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 40,
    maxQuantity: 200,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 45.00,
    targetMargin: 40,
    totalCostBasis: 3375.00,
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-12-09T10:00:00Z',
  },
  {
    id: 'INV-005',
    productId: 'ALF-SFD',
    productName: 'Slipfitter Mounting for ALF Flexible',
    partNumber: 'ALF-SFD',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    totalQuantity: 300,
    availableQuantity: 290,
    reservedQuantity: 5,
    pickingQuantity: 5,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 75,
    maxQuantity: 600,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 22.00,
    targetMargin: 30,
    totalCostBasis: 6600.00,
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-12-11T10:00:00Z',
  },
];

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'INVITEM-001',
    inventoryId: 'INV-001',
    binId: 'BIN-001',
    binLocation: 'Shelf 1A, Bin A',
    fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin A',
    quantity: 100,
    barcode: 'ALF600001',
    lotNumber: 'LOT-2024-001',
    receivedDate: '2024-10-15T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-12-05T10:00:00Z',
  },
  {
    id: 'INVITEM-002',
    inventoryId: 'INV-001',
    binId: 'BIN-002',
    binLocation: 'Shelf 1A, Bin B',
    fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin B',
    quantity: 50,
    barcode: 'ALF600002',
    lotNumber: 'LOT-2024-002',
    receivedDate: '2024-11-01T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-12-05T10:00:00Z',
  },
  {
    id: 'INVITEM-003',
    inventoryId: 'INV-002',
    binId: 'BIN-003',
    binLocation: 'Shelf 1A, Bin C',
    fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin C',
    quantity: 500,
    barcode: 'ALFASR001',
    lotNumber: 'LOT-2024-003',
    receivedDate: '2024-09-20T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-09-20T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'INVITEM-004',
    inventoryId: 'INV-003',
    binId: 'BIN-004',
    binLocation: 'Shelf 1A, Bin D',
    fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin D',
    quantity: 200,
    barcode: 'PC2001',
    lotNumber: 'LOT-2024-004',
    receivedDate: '2024-08-10T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-08-10T10:00:00Z',
    updatedAt: '2024-12-02T10:00:00Z',
  },
  {
    id: 'INVITEM-005',
    inventoryId: 'INV-004',
    binId: 'BIN-005',
    binLocation: 'Shelf 1A, Bay-01, Row 2, Bin A',
    fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 2 > Bin A',
    quantity: 75,
    barcode: 'MSDCE001',
    lotNumber: 'LOT-2024-005',
    receivedDate: '2024-09-05T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    notes: 'Low stock alert',
    createdAt: '2024-09-05T10:00:00Z',
    updatedAt: '2024-12-09T10:00:00Z',
  },
];


// -----------------------------------------------------------------------------
// Mock Fulfillments
// -----------------------------------------------------------------------------

export const mockFulfillments: Fulfillment[] = [
  {
    id: 'FUL-001',
    orderId: 'ORD-2024-001',
    orderNumber: 'SO-2024-001',
    orderDetailId: 'OD-001',
    productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
    productName: 'ALF Flexible Area Light, 60000Lm',
    partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    customerId: 'CO-011',  // Graybar Electric (Distributor)
    customerName: 'Graybar Electric',
    inventoryId: 'INV-001',
    waveId: 'WAVE-001',
    qrCode: 'FUL-001-QR',
    quantity: 10,
    pickedQuantity: 0,
    packedQuantity: 0,
    shippedQuantity: 0,
    status: 'RELEASED_TO_WAREHOUSE' as FulfillmentStatus,
    binLocation: 'Shelf 1A, Bin A',
    notes: 'Priority order',
    createdAt: '2024-12-10T08:00:00Z',
    updatedAt: '2024-12-10T08:00:00Z',
  },
  {
    id: 'FUL-002',
    orderId: 'ORD-2024-002',
    orderNumber: 'SO-2024-002',
    orderDetailId: 'OD-002',
    productId: 'PC-2',
    productName: 'Twist-lock Photocell with receptacle',
    partNumber: 'PC-2',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    customerId: 'CO-006',  // Summit Electric (Distributor)
    customerName: 'Summit Electric',
    inventoryId: 'INV-003',
    waveId: 'WAVE-001',
    qrCode: 'FUL-002-QR',
    quantity: 25,
    pickedQuantity: 0,
    packedQuantity: 0,
    shippedQuantity: 0,
    status: 'RELEASED_TO_WAREHOUSE' as FulfillmentStatus,
    binLocation: 'Shelf 1A, Bin D',
    createdAt: '2024-12-10T08:30:00Z',
    updatedAt: '2024-12-10T08:30:00Z',
  },
  {
    id: 'FUL-003',
    orderId: 'ORD-2024-003',
    orderNumber: 'SO-2024-003',
    orderDetailId: 'OD-003',
    productId: 'ALF-ASR',
    productName: 'Adjustable Square & Round Pole Mounting',
    partNumber: 'ALF-ASR',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    inventoryId: 'INV-002',
    qrCode: 'FUL-003-QR',
    quantity: 50,
    pickedQuantity: 50,
    packedQuantity: 50,
    shippedQuantity: 50,
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
    deliveryType: 'CARRIER_DELIVERY',
    status: 'SHIPPED' as FulfillmentStatus,
    binLocation: 'Shelf 1A, Bin C',
    pickedAt: '2024-12-08T10:00:00Z',
    packedAt: '2024-12-08T14:00:00Z',
    shippedAt: '2024-12-08T16:00:00Z',
    createdAt: '2024-12-07T08:00:00Z',
    updatedAt: '2024-12-08T16:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// Mock Waves
// -----------------------------------------------------------------------------

export const mockWaves: Wave[] = [
  {
    id: 'WAVE-001',
    waveNumber: 'W-2024-001',
    status: 'RELEASED' as WaveStatus,
    priority: 1,
    fulfillmentCount: 2,
    totalItems: 35,
    pickedItems: 0,
    pickerId: 'user-003',
    pickerName: 'Mike Johnson',
    releasedAt: '2024-12-10T09:00:00Z',
    notes: 'Morning wave - high priority orders',
    createdAt: '2024-12-10T08:00:00Z',
    updatedAt: '2024-12-10T09:00:00Z',
  },
  {
    id: 'WAVE-002',
    waveNumber: 'W-2024-002',
    status: 'COMPLETED' as WaveStatus,
    priority: 2,
    fulfillmentCount: 5,
    totalItems: 120,
    pickedItems: 120,
    pickerId: 'user-003',
    pickerName: 'Mike Johnson',
    releasedAt: '2024-12-09T09:00:00Z',
    startedAt: '2024-12-09T09:30:00Z',
    completedAt: '2024-12-09T14:00:00Z',
    createdAt: '2024-12-09T08:00:00Z',
    updatedAt: '2024-12-09T14:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// Mock Fulfillment Orders
// -----------------------------------------------------------------------------

export const mockFulfillmentOrders: FulfillmentOrder[] = [
  {
    id: 'FO-001',
    fulfillmentOrderNumber: 'FO-2024-001',
    orderId: 'ORD-2024-001',
    orderNumber: 'SO-2024-001',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Graybar Electric - Main Warehouse',
      addressLine1: '1144 15th Street',
      city: 'Augusta',
      state: 'GA',
      postalCode: '30901',
      country: 'USA',
      contactPhone: '(706) 555-1234',
      contactEmail: 'receiving@graybar.com',
    },
    needByDate: '2024-12-20',
    allowPartialShipment: true,
    releasedAt: '2024-12-10T09:00:00Z',
    releasedBy: 'John Smith',
    shipStatus: 'NOT_SHIPPED',
    status: 'RELEASED' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-001',
        fulfillmentOrderId: 'FO-001',
        orderLineItemId: 'OLI-001',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        uom: 'EA',
        orderedQty: 10,
        allocatedQty: 7,
        shippedQty: 0,
        backorderQty: 3,
        shortReason: 'Insufficient stock',
        pickLocation: 'Shelf 1A, Bin A',
        createdAt: '2024-12-10T09:00:00Z',
        updatedAt: '2024-12-10T09:00:00Z',
      },
    ],
    createdAt: '2024-12-10T08:00:00Z',
    updatedAt: '2024-12-10T09:00:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'FO-002',
    fulfillmentOrderNumber: 'FO-2024-002',
    orderId: 'ORD-2024-002',
    orderNumber: 'SO-2024-002',
    customerId: 'CO-006',
    customerName: 'Summit Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Summit Electric Supply',
      addressLine1: '2500 Industrial Blvd',
      city: 'Charlotte',
      state: 'NC',
      postalCode: '28208',
      country: 'USA',
      contactPhone: '(704) 555-5678',
    },
    needByDate: '2024-12-18',
    allowPartialShipment: false,
    releasedAt: '2024-12-10T09:30:00Z',
    releasedBy: 'John Smith',
    shipStatus: 'NOT_SHIPPED',
    status: 'RELEASED' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-002',
        fulfillmentOrderId: 'FO-002',
        orderLineItemId: 'OLI-002',
        productId: 'PC-2',
        productName: 'Twist-lock Photocell with receptacle',
        partNumber: 'PC-2',
        uom: 'EA',
        orderedQty: 25,
        allocatedQty: 20,
        shippedQty: 0,
        backorderQty: 5,
        shortReason: 'Awaiting vendor shipment',
        pickLocation: 'Shelf 1A, Bin D',
        createdAt: '2024-12-10T09:30:00Z',
        updatedAt: '2024-12-10T09:30:00Z',
      },
    ],
    createdAt: '2024-12-10T08:30:00Z',
    updatedAt: '2024-12-10T09:30:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'FO-003',
    fulfillmentOrderNumber: 'FO-2024-003',
    orderId: 'ORD-2024-003',
    orderNumber: 'SO-2024-003',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Graybar Electric - Atlanta Branch',
      addressLine1: '3200 Peachtree Industrial Blvd',
      city: 'Duluth',
      state: 'GA',
      postalCode: '30096',
      country: 'USA',
      contactPhone: '(770) 555-9999',
    },
    needByDate: '2024-12-07',
    allowPartialShipment: true,
    releasedAt: '2024-12-07T08:00:00Z',
    releasedBy: 'Sarah Williams',
    pickStartedAt: '2024-12-07T09:15:00Z',
    pickStartedBy: 'Mike Johnson',
    pickCompletedAt: '2024-12-07T11:30:00Z',
    pickCompletedBy: 'Mike Johnson',
    shipStatus: 'SHIPPED',
    carrier: 'UPS',
    trackingNumbers: ['1Z999AA10123456784'],
    shipConfirmedAt: '2024-12-08T14:00:00Z',
    status: 'SHIPPED' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-003',
        fulfillmentOrderId: 'FO-003',
        orderLineItemId: 'OLI-003',
        productId: 'ALF-ASR',
        productName: 'Adjustable Square & Round Pole Mounting',
        partNumber: 'ALF-ASR',
        uom: 'EA',
        orderedQty: 50,
        allocatedQty: 50,
        shippedQty: 50,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bin C',
        createdAt: '2024-12-07T08:00:00Z',
        updatedAt: '2024-12-08T16:00:00Z',
      },
    ],
    createdAt: '2024-12-07T08:00:00Z',
    updatedAt: '2024-12-08T16:00:00Z',
    createdBy: 'Sarah Williams',
  },
  {
    id: 'FO-004',
    fulfillmentOrderNumber: 'FO-2024-004',
    orderId: 'ORD-2024-004',
    orderNumber: 'SO-2024-004',
    customerId: 'CO-006',
    customerName: 'Summit Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Summit Electric Supply - Raleigh',
      addressLine1: '4500 Capital Blvd',
      city: 'Raleigh',
      state: 'NC',
      postalCode: '27604',
      country: 'USA',
      contactPhone: '(919) 555-3456',
    },
    needByDate: '2024-12-22',
    allowPartialShipment: true,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-004',
        fulfillmentOrderId: 'FO-004',
        orderLineItemId: 'OLI-004',
        productId: 'LED-DRIVER-100W',
        productName: 'LED Driver 100W Dimmable',
        partNumber: 'DRV-100W-DIM',
        uom: 'EA',
        orderedQty: 15,
        allocatedQty: 15,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 2B, Bin E',
        createdAt: '2024-12-12T10:00:00Z',
        updatedAt: '2024-12-12T10:00:00Z',
      },
    ],
    createdAt: '2024-12-12T10:00:00Z',
    updatedAt: '2024-12-12T10:00:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'FO-005',
    fulfillmentOrderNumber: 'FO-2024-005',
    orderId: 'ORD-2024-005',
    orderNumber: 'SO-2024-005',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'WILL_CALL',
    shipTo: {
      name: 'Graybar Electric - Will Call',
      addressLine1: '1000 Warehouse Way',
      city: 'Atlanta',
      state: 'GA',
      postalCode: '30318',
      country: 'USA',
      contactPhone: '(404) 555-7890',
    },
    needByDate: '2024-12-18',
    allowPartialShipment: false,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-005a',
        fulfillmentOrderId: 'FO-005',
        orderLineItemId: 'OLI-005a',
        productId: 'POLE-MOUNT-ADJ',
        productName: 'Adjustable Pole Mount Bracket',
        partNumber: 'PMB-ADJ-01',
        uom: 'EA',
        orderedQty: 20,
        allocatedQty: 20,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 3A, Bin B',
        createdAt: '2024-12-13T14:30:00Z',
        updatedAt: '2024-12-13T14:30:00Z',
      },
      {
        id: 'FOLI-005b',
        fulfillmentOrderId: 'FO-005',
        orderLineItemId: 'OLI-005b',
        productId: 'WIRE-12AWG-500',
        productName: '12 AWG Wire - 500ft Spool',
        partNumber: 'WIRE-12-500',
        uom: 'SPOOL',
        orderedQty: 5,
        allocatedQty: 5,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 4C, Bin A',
        createdAt: '2024-12-13T14:30:00Z',
        updatedAt: '2024-12-13T14:30:00Z',
      },
    ],
    createdAt: '2024-12-13T14:30:00Z',
    updatedAt: '2024-12-13T14:30:00Z',
    createdBy: 'Sarah Williams',
  },
];

// Helper to get fulfillment order stats
export function getFulfillmentOrderStats() {
  return {
    totalFulfillmentOrders: mockFulfillmentOrders.length,
    pendingFulfillmentOrders: mockFulfillmentOrders.filter(fo => fo.status === 'PENDING').length,
    releasedFulfillmentOrders: mockFulfillmentOrders.filter(fo => fo.status === 'RELEASED').length,
    inProgressFulfillmentOrders: mockFulfillmentOrders.filter(fo =>
      fo.status === 'PICKING' || fo.status === 'PACKING' || fo.status === 'SHIPPING'
    ).length,
    shippedFulfillmentOrders: mockFulfillmentOrders.filter(fo =>
      fo.status === 'SHIPPED' || fo.status === 'PARTIAL_SHIPPED'
    ).length,
    completedFulfillmentOrders: mockFulfillmentOrders.filter(fo => fo.status === 'DELIVERED').length,
  };
}

// Helper to add a new fulfillment order (mutates the array for demo purposes)
export function addFulfillmentOrder(fulfillmentOrder: FulfillmentOrder) {
  mockFulfillmentOrders.push(fulfillmentOrder);
}

// Helper to get a fulfillment order by ID
export function getFulfillmentOrderById(id: string): FulfillmentOrder | undefined {
  return mockFulfillmentOrders.find(fo => fo.id === id);
}

// Helper to get all fulfillment orders
export function getAllFulfillmentOrders(): FulfillmentOrder[] {
  return mockFulfillmentOrders;
}

// Helper to update a fulfillment order
export function updateFulfillmentOrder(id: string, updates: Partial<FulfillmentOrder>): FulfillmentOrder | undefined {
  const index = mockFulfillmentOrders.findIndex(fo => fo.id === id);
  if (index === -1) return undefined;

  mockFulfillmentOrders[index] = {
    ...mockFulfillmentOrders[index],
    ...updates,
  };
  return mockFulfillmentOrders[index];
}

// -----------------------------------------------------------------------------
// Mock Incoming Shipments
// -----------------------------------------------------------------------------

export const mockIncomingShipments: IncomingShipment[] = [
  {
    id: 'SHIP-001',
    poNumber: 'PO-2024-782',
    vendorId: 'CO-012',  // Legrand North America
    vendorName: 'Legrand North America',
    vendorContact: 'John Vendor',
    vendorEmail: 'jvendor@legrand.com',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    eta: '2024-12-15T10:00:00Z',
    status: 'IN_TRANSIT' as ShipmentStatus,
    expectedItems: [
      { id: 'EI-001', productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR', productName: 'ALF Flexible Area Light, 60000Lm', partNumber: 'ALF LS600', expectedQuantity: 100, receivedQuantity: 0, status: 'pending' },
      { id: 'EI-002', productId: 'ALF-ASR', productName: 'Adjustable Square & Round Pole Mounting', partNumber: 'ALF-ASR', expectedQuantity: 200, receivedQuantity: 0, status: 'pending' },
    ],
    items: [
      { id: 'SLI-001', productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR', productName: 'ALF Flexible Area Light, 60000Lm', partNumber: 'ALF LS600', expectedQuantity: 100, receivedQuantity: 0 },
      { id: 'SLI-002', productId: 'ALF-ASR', productName: 'Adjustable Square & Round Pole Mounting', partNumber: 'ALF-ASR', expectedQuantity: 200, receivedQuantity: 0 },
    ],
    itemCount: 2,
    expectedQuantity: 300,
    trackingNumber: '1Z999AA10123456780',
    carrier: 'UPS',
    createdAt: '2024-12-05T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'SHIP-002',
    poNumber: 'PO-2024-783',
    vendorId: 'CO-004',  // Johnson Controls
    vendorName: 'Johnson Controls',
    vendorContact: 'Sarah Supplier',
    vendorEmail: 'ssupplier@jci.com',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    eta: '2024-12-18T14:00:00Z',
    status: 'ARRIVED' as ShipmentStatus,
    expectedItems: [
      { id: 'EI-003', productId: 'PC-2', productName: 'Twist-lock Photocell', partNumber: 'PC-2', expectedQuantity: 150, receivedQuantity: 0, status: 'pending' },
    ],
    items: [
      { id: 'SLI-003', productId: 'PC-2', productName: 'Twist-lock Photocell', partNumber: 'PC-2', expectedQuantity: 150, receivedQuantity: 0 },
    ],
    itemCount: 1,
    expectedQuantity: 150,
    trackingNumber: '1Z999AA10123456781',
    carrier: 'FedEx',
    createdAt: '2024-12-08T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'SHIP-003',
    poNumber: 'PO-2024-785',
    vendorId: 'CO-012',
    vendorName: 'Legrand North America',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    eta: '2024-12-20T10:00:00Z',
    status: 'CONFIRMED' as ShipmentStatus,
    expectedItems: [
      { id: 'EI-004', productId: 'MS-DCE-09-L7-W', productName: 'Motion Sensor, DC', partNumber: 'MS-DCE-09-L7-W', expectedQuantity: 100, receivedQuantity: 0, status: 'pending' },
    ],
    items: [
      { id: 'SLI-004', productId: 'MS-DCE-09-L7-W', productName: 'Motion Sensor, DC', partNumber: 'MS-DCE-09-L7-W', expectedQuantity: 100, receivedQuantity: 0 },
    ],
    itemCount: 1,
    expectedQuantity: 100,
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// Mock RMAs
// -----------------------------------------------------------------------------

export const mockRmas: Rma[] = [
  {
    id: 'RMA-001',
    rmaNumber: 'RMA-2024-001',
    fulfillmentId: 'FUL-003',
    orderId: 'ORD-2024-003',
    orderNumber: 'SO-2024-003',
    originalOrderNumber: 'SO-2024-003',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    status: 'RECEIVED' as RmaStatus,
    reason: 'DAMAGED' as RmaReason,
    items: [
      { id: 'RMAI-001', productId: 'ALF-ASR', productName: 'Adjustable Square & Round Pole Mounting', partNumber: 'ALF-ASR', quantity: 5, unitPrice: 28.00 },
    ],
    totalValue: 140.00,
    requestedDate: '2024-12-04T10:00:00Z',
    refundAmount: 140.00,
    restockingFee: 0,
    returnTrackingNumber: '1Z999AA10123456799',
    qrCode: 'RMA-001-QR',
    approvedAt: '2024-12-05T10:00:00Z',
    receivedAt: '2024-12-09T10:00:00Z',
    createdAt: '2024-12-04T10:00:00Z',
    updatedAt: '2024-12-09T10:00:00Z',
  },
  {
    id: 'RMA-002',
    rmaNumber: 'RMA-2024-002',
    fulfillmentId: 'FUL-OLD-001',
    orderId: 'ORD-2024-OLD',
    orderNumber: 'SO-2024-OLD-001',
    originalOrderNumber: 'SO-2024-OLD-001',
    customerId: 'CO-006',
    customerName: 'Summit Electric',
    status: 'REQUESTED' as RmaStatus,
    reason: 'WRONG_ITEM' as RmaReason,
    items: [
      { id: 'RMAI-002', productId: 'PC-2', productName: 'Twist-lock Photocell with receptacle', partNumber: 'PC-2', quantity: 10, unitPrice: 15.00, reason: 'Customer ordered 480V version but received 277V' },
    ],
    totalValue: 150.00,
    requestedDate: '2024-12-10T10:00:00Z',
    qrCode: 'RMA-002-QR',
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'RMA-003',
    rmaNumber: 'RMA-2024-003',
    fulfillmentId: 'FUL-OLD-002',
    orderId: 'ORD-2024-OLD-2',
    orderNumber: 'SO-2024-OLD-002',
    originalOrderNumber: 'SO-2024-OLD-002',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    status: 'INSPECTING' as RmaStatus,
    reason: 'DEFECTIVE' as RmaReason,
    items: [
      { id: 'RMAI-003', productId: 'MS-DCE-09-L7-W', productName: 'Motion Sensor, DC, Fixture External', partNumber: 'MS-DCE-09-L7-W', quantity: 3, unitPrice: 23.00 },
    ],
    totalValue: 69.00,
    requestedDate: '2024-12-08T10:00:00Z',
    returnTrackingNumber: '1Z999AA10123456800',
    qrCode: 'RMA-003-QR',
    approvedAt: '2024-12-08T14:00:00Z',
    receivedAt: '2024-12-11T10:00:00Z',
    createdAt: '2024-12-08T10:00:00Z',
    updatedAt: '2024-12-11T10:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// Mock Dashboard Data
// -----------------------------------------------------------------------------

// Warehouse tasks using unified Task type
export const mockWarehouseTasks: Task[] = [
  {
    id: 'WTASK-001',
    title: 'Cycle count Aisle 5, Bins 1-12',
    description: 'Perform cycle count on all bins in Aisle 5 (bins 1-12) and report discrepancies',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: 'user-003',
    assignedToName: 'Mike Johnson',
    taskType: 'Cycle Count',
    category: 'warehouse',
    status: 'Today',
    tags: ['Priority'],
    priority: 'High',
    completed: false,
    warehouse: {
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      binLocation: 'Aisle 5, Bins 1-12',
    },
    createdAt: '2024-12-10T08:00:00Z',
  },
  {
    id: 'WTASK-002',
    title: 'Pick Wave W-2024-001',
    description: 'Pick items for morning wave - 35 total items across 2 fulfillments',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: 'user-003',
    assignedToName: 'Mike Johnson',
    taskType: 'Pick',
    category: 'warehouse',
    status: 'Today',
    tags: ['Priority', 'Expedite'],
    priority: 'Urgent',
    completed: false,
    warehouse: {
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      waveId: 'WAVE-001',
      waveNumber: 'W-2024-001',
    },
    createdAt: '2024-12-10T08:00:00Z',
  },
  {
    id: 'WTASK-003',
    title: 'Pack order SO-2024-001',
    description: 'Pack picked items for Graybar Electric order - 10 ALF Flexible Area Lights',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: 'user-004',
    assignedToName: 'Lisa Anderson',
    taskType: 'Pack',
    category: 'warehouse',
    status: 'Today',
    tags: ['Priority'],
    priority: 'High',
    completed: false,
    warehouse: {
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      fulfillmentId: 'FUL-001',
      orderNumber: 'SO-2024-001',
    },
    createdAt: '2024-12-10T09:00:00Z',
  },
  {
    id: 'WTASK-004',
    title: 'Restock Motion Sensors from overstock',
    description: 'Move Motion Sensors (MS-DCE-09-L7-W) from overstock to primary pick location BIN-005',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: 'user-004',
    assignedToName: 'Lisa Anderson',
    taskType: 'Restock',
    category: 'warehouse',
    status: 'Today',
    tags: [],
    priority: 'Medium',
    completed: true,
    completedAt: '2024-12-10T11:30:00Z',
    warehouse: {
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      productId: 'MS-DCE-09-L7-W',
      productName: 'Motion Sensor, DC, Fixture External',
      binLocation: 'BIN-005',
    },
    createdAt: '2024-12-10T07:00:00Z',
  },
  {
    id: 'WTASK-005',
    title: 'Receive shipment PO-2024-783',
    description: 'Receive and put away incoming shipment from Johnson Controls - 150 Photocells expected',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: 'user-003',
    assignedToName: 'Mike Johnson',
    taskType: 'Receive',
    category: 'warehouse',
    status: 'Today',
    tags: [],
    priority: 'Medium',
    completed: false,
    warehouse: {
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      shipmentId: 'SHIP-002',
      poNumber: 'PO-2024-783',
    },
    createdAt: '2024-12-10T08:00:00Z',
  },
  {
    id: 'WTASK-006',
    title: 'Process RMA-2024-003',
    description: 'Inspect returned Motion Sensors from Graybar Electric - check for defects',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: 'user-004',
    assignedToName: 'Lisa Anderson',
    taskType: 'Returns Processing',
    category: 'warehouse',
    status: 'Today',
    tags: [],
    priority: 'Low',
    completed: false,
    warehouse: {
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      rmaId: 'RMA-003',
      rmaNumber: 'RMA-2024-003',
    },
    createdAt: '2024-12-11T10:00:00Z',
  },
  {
    id: 'WTASK-007',
    title: 'Quality check on ALF Area Lights',
    description: 'Perform quality inspection on received ALF Flexible Area Lights from last shipment',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    assignedTo: 'user-004',
    assignedToName: 'Lisa Anderson',
    taskType: 'Quality Check',
    category: 'warehouse',
    status: 'Upcoming',
    tags: [],
    priority: 'Medium',
    completed: false,
    warehouse: {
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
      productName: 'ALF Flexible Area Light, 60000Lm',
    },
    createdAt: '2024-12-10T08:00:00Z',
  },
];

// Legacy alias for backwards compatibility (deprecated - use mockWarehouseTasks)
export const mockDailyTasks = mockWarehouseTasks;

export const mockHighPriorityOrders: HighPriorityOrder[] = [
  { id: 'HPO-001', orderNumber: 'Q-2024-003', customerName: 'Graybar Electric', itemCount: 2, orderDate: '2024-12-10T08:00:00Z', priority: 1 },
  { id: 'HPO-002', orderNumber: 'Q-2024-004', customerName: 'Summit Electric', itemCount: 5, orderDate: '2024-12-09T14:00:00Z', priority: 2 },
];

export const mockStockControlItems: StockControlItem[] = [
  {
    id: 'SCI-001',
    productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
    productName: 'ALF Flexible Area Light',
    productDescription: '60000Lm - 400W Max, 4 Level Wattage',
    binLocation: 'A-12',
    shelfNumber: '3',
    price: 320.00,
    inventoryCount: 150,
    status: 'in_stock',
  },
  {
    id: 'SCI-002',
    productId: 'MS-DCE-09-L7-W',
    productName: 'Motion Sensor',
    productDescription: 'DC, Fixture External, Daylight Harvest+PIR',
    binLocation: 'B-4',
    shelfNumber: '2',
    price: 23.00,
    inventoryCount: 30,
    status: 'low_stock',
  },
  {
    id: 'SCI-003',
    productId: 'RM06',
    productName: 'Remote Control',
    productDescription: 'For MS-DCE-09-L7 / MS-DCE-09-L7-W',
    binLocation: 'C-8',
    shelfNumber: '1',
    price: 32.00,
    inventoryCount: 0,
    status: 'out_of_stock',
  },
];

// -----------------------------------------------------------------------------
// Mock Adjustments (for reports)
// -----------------------------------------------------------------------------

export const mockAdjustments: Adjustment[] = [
  {
    id: 'ADJ-001',
    inventoryId: 'INV-001',
    type: 'CYCLE_COUNT' as AdjustmentType,
    quantityChange: -20,
    reason: 'Cycle count adjustment - 20 units not found',
    adjustedBy: 'John Smith',
    adjustedAt: '2024-12-05T14:30:00Z',
  },
  {
    id: 'ADJ-002',
    inventoryId: 'INV-002',
    type: 'DAMAGE' as AdjustmentType,
    quantityChange: -10,
    reason: 'Damaged during handling',
    adjustedBy: 'Sarah Williams',
    adjustedAt: '2024-12-01T09:15:00Z',
  },
  {
    id: 'ADJ-003',
    inventoryId: 'INV-003',
    type: 'RECEIPT' as AdjustmentType,
    quantityChange: 50,
    reason: 'PO-2024-780 received',
    adjustedBy: 'Mike Johnson',
    adjustedAt: '2024-12-08T11:00:00Z',
  },
  {
    id: 'ADJ-004',
    inventoryId: 'INV-001',
    type: 'SHIPMENT' as AdjustmentType,
    quantityChange: -15,
    reason: 'Order SO-2024-002 shipped',
    adjustedBy: 'System',
    adjustedAt: '2024-12-09T16:00:00Z',
  },
  {
    id: 'ADJ-005',
    inventoryId: 'INV-004',
    type: 'RETURN' as AdjustmentType,
    quantityChange: 5,
    reason: 'RMA-2024-001 restocked',
    adjustedBy: 'Lisa Anderson',
    adjustedAt: '2024-12-10T10:30:00Z',
  },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

export function getInventoryStats() {
  return {
    totalProducts: mockInventory.length,
    totalQuantity: mockInventory.reduce((sum, inv) => sum + inv.totalQuantity, 0),
    availableQuantity: mockInventory.reduce((sum, inv) => sum + inv.availableQuantity, 0),
    reservedQuantity: mockInventory.reduce((sum, inv) => sum + inv.reservedQuantity, 0),
    lowStockCount: mockInventory.filter(inv => inv.availableQuantity > 0 && inv.availableQuantity <= (inv.reorderPoint || 0)).length,
    outOfStockCount: mockInventory.filter(inv => inv.availableQuantity === 0).length,
  };
}

export function getFulfillmentStats() {
  return {
    totalFulfillments: mockFulfillments.length,
    pendingFulfillments: mockFulfillments.filter(f => f.status === 'RELEASED_TO_WAREHOUSE' || f.status === 'NOT_STARTED').length,
    inProgressFulfillments: mockFulfillments.filter(f => f.status === 'PICKING' || f.status === 'PACKING').length,
    completedFulfillments: mockFulfillments.filter(f => f.status === 'SHIPPED' || f.status === 'DELIVERED').length,
    shippedFulfillments: mockFulfillments.filter(f => f.status === 'SHIPPED').length,
  };
}

export function getWarehouseStats() {
  return {
    totalWarehouses: mockWarehouses.length,
    activeWarehouses: mockWarehouses.filter(w => w.isActive).length,
    totalBins: mockBins.length,
    pendingShipments: mockIncomingShipments.filter(s => s.status !== 'RECEIVED').length,
    pendingRmas: mockRmas.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length,
  };
}

// Get factories (manufacturers that are warehouse-enabled)
export function getWarehouseFactories() {
  // In real app, this would filter Companies where type includes 'Manufacturer' and warehouseEnabled
  return [
    { id: 'CO-012', name: 'Legrand North America' },
    { id: 'CO-004', name: 'Johnson Controls' },
  ];
}

// -----------------------------------------------------------------------------
// Buy/Sell Transactions
// -----------------------------------------------------------------------------

export const mockBuySellTransactions: BuySellTransaction[] = [
  // Purchase transactions
  {
    id: 'BST-001',
    inventoryId: 'INV-002',
    productId: 'ALF-ASR',
    productName: 'Adjustable Square & Round Pole Mounting',
    partNumber: 'ALF-ASR',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    transactionType: 'PURCHASE',
    status: 'PURCHASED' as BuySellStatus,
    quantity: 200,
    purchaseOrderNumber: 'PO-2024-501',
    purchaseDate: '2024-10-15T10:00:00Z',
    unitCost: 18.50,
    totalCost: 3700.00,
    vendorInvoiceNumber: 'LINV-78234',
    vendorInvoiceDate: '2024-10-18T10:00:00Z',
    paymentDueDate: '2024-11-17T10:00:00Z',
    paymentStatus: 'PAID',
    paymentDate: '2024-11-10T10:00:00Z',
    createdAt: '2024-10-15T10:00:00Z',
  },
  {
    id: 'BST-002',
    inventoryId: 'INV-002',
    productId: 'ALF-ASR',
    productName: 'Adjustable Square & Round Pole Mounting',
    partNumber: 'ALF-ASR',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    transactionType: 'PURCHASE',
    status: 'PURCHASED' as BuySellStatus,
    quantity: 300,
    purchaseOrderNumber: 'PO-2024-612',
    purchaseDate: '2024-11-20T10:00:00Z',
    unitCost: 18.50,
    totalCost: 5550.00,
    vendorInvoiceNumber: 'LINV-79102',
    vendorInvoiceDate: '2024-11-22T10:00:00Z',
    paymentDueDate: '2024-12-22T10:00:00Z',
    paymentStatus: 'UNPAID',
    createdAt: '2024-11-20T10:00:00Z',
  },
  {
    id: 'BST-003',
    inventoryId: 'INV-004',
    productId: 'MS-DCE-09-L7-W',
    productName: 'Motion Sensor, DC, Fixture External',
    partNumber: 'MS-DCE-09-L7-W',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    transactionType: 'PURCHASE',
    status: 'PURCHASED' as BuySellStatus,
    quantity: 100,
    purchaseOrderNumber: 'PO-2024-598',
    purchaseDate: '2024-11-01T10:00:00Z',
    unitCost: 45.00,
    totalCost: 4500.00,
    vendorInvoiceNumber: 'LINV-78890',
    vendorInvoiceDate: '2024-11-03T10:00:00Z',
    paymentDueDate: '2024-12-03T10:00:00Z',
    paymentStatus: 'PAID',
    paymentDate: '2024-11-28T10:00:00Z',
    createdAt: '2024-11-01T10:00:00Z',
  },
  {
    id: 'BST-004',
    inventoryId: 'INV-005',
    productId: 'ALF-SFD',
    productName: 'Slipfitter Mounting for ALF Flexible',
    partNumber: 'ALF-SFD',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    transactionType: 'PURCHASE',
    status: 'PURCHASED' as BuySellStatus,
    quantity: 300,
    purchaseOrderNumber: 'PO-2024-520',
    purchaseDate: '2024-10-01T10:00:00Z',
    unitCost: 22.00,
    totalCost: 6600.00,
    vendorInvoiceNumber: 'LINV-78012',
    vendorInvoiceDate: '2024-10-03T10:00:00Z',
    paymentDueDate: '2024-11-02T10:00:00Z',
    paymentStatus: 'PAID',
    paymentDate: '2024-10-30T10:00:00Z',
    createdAt: '2024-10-01T10:00:00Z',
  },
  // Sale transactions
  {
    id: 'BST-005',
    inventoryId: 'INV-002',
    productId: 'ALF-ASR',
    productName: 'Adjustable Square & Round Pole Mounting',
    partNumber: 'ALF-ASR',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    transactionType: 'SALE',
    status: 'PAID' as BuySellStatus,
    quantity: 15,
    salesOrderNumber: 'SO-2024-412',
    salesOrderId: 'ORD-2024-412',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    saleDate: '2024-11-15T10:00:00Z',
    unitCost: 18.50,
    unitPrice: 28.00,
    totalCost: 277.50,
    totalRevenue: 420.00,
    unitProfit: 9.50,
    totalProfit: 142.50,
    marginPercentage: 33.9,
    customerInvoiceNumber: 'INV-2024-412',
    customerInvoiceDate: '2024-11-16T10:00:00Z',
    customerPaymentDueDate: '2024-12-16T10:00:00Z',
    customerPaymentStatus: 'PAID',
    customerPaymentDate: '2024-12-05T10:00:00Z',
    createdAt: '2024-11-15T10:00:00Z',
  },
  {
    id: 'BST-006',
    inventoryId: 'INV-004',
    productId: 'MS-DCE-09-L7-W',
    productName: 'Motion Sensor, DC, Fixture External',
    partNumber: 'MS-DCE-09-L7-W',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    transactionType: 'SALE',
    status: 'INVOICED' as BuySellStatus,
    quantity: 25,
    salesOrderNumber: 'SO-2024-445',
    salesOrderId: 'ORD-2024-445',
    customerId: 'CO-006',
    customerName: 'Summit Electric',
    saleDate: '2024-12-01T10:00:00Z',
    unitCost: 45.00,
    unitPrice: 75.00,
    totalCost: 1125.00,
    totalRevenue: 1875.00,
    unitProfit: 30.00,
    totalProfit: 750.00,
    marginPercentage: 40.0,
    customerInvoiceNumber: 'INV-2024-445',
    customerInvoiceDate: '2024-12-02T10:00:00Z',
    customerPaymentDueDate: '2025-01-01T10:00:00Z',
    customerPaymentStatus: 'UNPAID',
    createdAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'BST-007',
    inventoryId: 'INV-005',
    productId: 'ALF-SFD',
    productName: 'Slipfitter Mounting for ALF Flexible',
    partNumber: 'ALF-SFD',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    transactionType: 'SALE',
    status: 'SOLD' as BuySellStatus,
    quantity: 10,
    salesOrderNumber: 'SO-2024-458',
    salesOrderId: 'ORD-2024-458',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    saleDate: '2024-12-08T10:00:00Z',
    unitCost: 22.00,
    unitPrice: 32.00,
    totalCost: 220.00,
    totalRevenue: 320.00,
    unitProfit: 10.00,
    totalProfit: 100.00,
    marginPercentage: 31.3,
    createdAt: '2024-12-08T10:00:00Z',
  },
  // Return transaction
  {
    id: 'BST-008',
    inventoryId: 'INV-004',
    productId: 'MS-DCE-09-L7-W',
    productName: 'Motion Sensor, DC, Fixture External',
    partNumber: 'MS-DCE-09-L7-W',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    transactionType: 'RETURN',
    status: 'RETURNED' as BuySellStatus,
    quantity: 5,
    salesOrderNumber: 'SO-2024-390',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    saleDate: '2024-10-15T10:00:00Z',
    unitCost: 45.00,
    unitPrice: 75.00,
    totalCost: 225.00,
    totalRevenue: -375.00,
    unitProfit: -30.00,
    totalProfit: -150.00,
    notes: 'RMA-2024-001: Customer reported defective units',
    createdAt: '2024-11-20T10:00:00Z',
  },
];

// Buy/Sell Statistics
export function getBuySellStats(): BuySellSummary {
  const purchases = mockBuySellTransactions.filter(t => t.transactionType === 'PURCHASE');
  const sales = mockBuySellTransactions.filter(t => t.transactionType === 'SALE');
  const returns = mockBuySellTransactions.filter(t => t.transactionType === 'RETURN');

  const totalPurchaseCost = purchases.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  const totalRevenue = sales.reduce((sum, t) => sum + (t.totalRevenue || 0), 0) +
                       returns.reduce((sum, t) => sum + (t.totalRevenue || 0), 0);
  const totalProfit = sales.reduce((sum, t) => sum + (t.totalProfit || 0), 0) +
                      returns.reduce((sum, t) => sum + (t.totalProfit || 0), 0);

  const unpaidVendorInvoices = purchases.filter(t => t.paymentStatus === 'UNPAID');
  const unpaidCustomerInvoices = sales.filter(t => t.customerPaymentStatus === 'UNPAID');

  const buySellInventory = mockInventory.filter(i => i.ownershipType === 'BUY_SELL');
  const inventoryValue = buySellInventory.reduce((sum, i) => sum + (i.totalCostBasis || 0), 0);

  return {
    totalPurchases: purchases.length,
    totalPurchaseCost,
    totalSales: sales.length,
    totalRevenue,
    totalProfit,
    averageMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    inventoryValue,
    unpaidVendorInvoices: unpaidVendorInvoices.length,
    unpaidVendorAmount: unpaidVendorInvoices.reduce((sum, t) => sum + (t.totalCost || 0), 0),
    unpaidCustomerInvoices: unpaidCustomerInvoices.length,
    unpaidCustomerAmount: unpaidCustomerInvoices.reduce((sum, t) => sum + (t.totalRevenue || 0), 0),
  };
}

// Get customers (distributors that are warehouse-enabled)
export function getWarehouseCustomers() {
  // In real app, this would filter Companies where type includes 'Distributor' and warehouseEnabled
  return [
    { id: 'CO-011', name: 'Graybar Electric' },
    { id: 'CO-006', name: 'Summit Electric' },
  ];
}

// -----------------------------------------------------------------------------
// Shipment Management Functions
// -----------------------------------------------------------------------------

// Update shipment status
export function updateShipmentStatus(shipmentId: string, status: ShipmentStatus): IncomingShipment | undefined {
  const index = mockIncomingShipments.findIndex(s => s.id === shipmentId);
  if (index === -1) return undefined;

  mockIncomingShipments[index] = {
    ...mockIncomingShipments[index],
    status,
    updatedAt: new Date().toISOString(),
    ...(status === 'RECEIVED' ? { receivedAt: new Date().toISOString() } : {}),
  };
  return mockIncomingShipments[index];
}

// Add a new incoming shipment
export function addIncomingShipment(shipment: Omit<IncomingShipment, 'id' | 'createdAt' | 'updatedAt'>): IncomingShipment {
  const newShipment: IncomingShipment = {
    ...shipment,
    id: `SHIP-${String(mockIncomingShipments.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockIncomingShipments.push(newShipment);
  return newShipment;
}

// Get shipment by ID
export function getShipmentById(id: string): IncomingShipment | undefined {
  return mockIncomingShipments.find(s => s.id === id);
}

// Complete receiving for a shipment (update items and mark as received)
export function completeShipmentReceiving(
  shipmentId: string,
  receivedItems: { productId: string; receivedQuantity: number }[]
): IncomingShipment | undefined {
  const index = mockIncomingShipments.findIndex(s => s.id === shipmentId);
  if (index === -1) return undefined;

  const shipment = mockIncomingShipments[index];

  // Update received quantities for each item
  const updatedItems = shipment.items.map(item => {
    const received = receivedItems.find(r => r.productId === item.productId);
    return {
      ...item,
      receivedQuantity: received?.receivedQuantity ?? item.receivedQuantity,
    };
  });

  const updatedExpectedItems = shipment.expectedItems.map(item => {
    const received = receivedItems.find(r => r.productId === item.productId);
    const receivedQty = received?.receivedQuantity ?? 0;
    return {
      ...item,
      receivedQuantity: receivedQty,
      status: receivedQty === item.expectedQuantity ? 'received' as const :
              receivedQty > 0 ? 'partial' as const :
              'discrepancy' as const,
    };
  });

  mockIncomingShipments[index] = {
    ...shipment,
    items: updatedItems,
    expectedItems: updatedExpectedItems,
    status: 'RECEIVED' as ShipmentStatus,
    receivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return mockIncomingShipments[index];
}

// -----------------------------------------------------------------------------
// Manufacturer Contacts
// -----------------------------------------------------------------------------

export const mockManufacturerContacts: ManufacturerContact[] = [
  // Legrand North America contacts
  {
    id: 'CONTACT-001',
    factoryId: 'CO-012',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@legrand.com',
    phone: '(404) 555-1234',
    role: 'Sales Representative',
    isDefaultForOrders: true,
    isActive: true,
  },
  {
    id: 'CONTACT-002',
    factoryId: 'CO-012',
    name: 'Michael Chen',
    email: 'michael.chen@legrand.com',
    phone: '(404) 555-2345',
    role: 'Account Manager',
    isDefaultForOrders: false,
    isActive: true,
  },
  {
    id: 'CONTACT-003',
    factoryId: 'CO-012',
    name: 'Jennifer Adams',
    email: 'jennifer.adams@legrand.com',
    phone: '(404) 555-3456',
    role: 'Order Processing',
    isDefaultForOrders: false,
    isActive: true,
  },
  // Johnson Controls contacts
  {
    id: 'CONTACT-004',
    factoryId: 'CO-004',
    name: 'David Wilson',
    email: 'david.wilson@jci.com',
    phone: '(678) 555-4567',
    role: 'Regional Sales Manager',
    isDefaultForOrders: true,
    isActive: true,
  },
  {
    id: 'CONTACT-005',
    factoryId: 'CO-004',
    name: 'Amanda Torres',
    email: 'amanda.torres@jci.com',
    phone: '(678) 555-5678',
    role: 'Customer Service',
    isDefaultForOrders: false,
    isActive: true,
  },
];

// Get contacts for a specific manufacturer
export function getManufacturerContacts(factoryId: string): ManufacturerContact[] {
  return mockManufacturerContacts.filter(c => c.factoryId === factoryId && c.isActive);
}

// Get default contact for a manufacturer
export function getDefaultContact(factoryId: string): ManufacturerContact | undefined {
  return mockManufacturerContacts.find(c => c.factoryId === factoryId && c.isDefaultForOrders && c.isActive);
}

// Update default contact for a manufacturer
export function setDefaultContact(factoryId: string, contactId: string): void {
  mockManufacturerContacts.forEach(contact => {
    if (contact.factoryId === factoryId) {
      contact.isDefaultForOrders = contact.id === contactId;
    }
  });
}

// -----------------------------------------------------------------------------
// Shipment Requests
// -----------------------------------------------------------------------------

export const mockShipmentRequests: ShipmentRequest[] = [
  {
    id: 'REQ-001',
    requestNumber: 'SR-2024-001',
    vendorId: 'CO-012',
    vendorName: 'Legrand North America',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    requestMethod: 'EMAIL',
    status: 'CONFIRMED' as ShipmentRequestStatus,
    priority: 'standard',
    requestedDeliveryDate: '2024-12-20T00:00:00Z',
    items: [
      {
        id: 'REQLI-001',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        requestedQuantity: 50,
        currentStock: 120,
        reorderPoint: 50,
      },
    ],
    totalQuantity: 50,
    contactId: 'CONTACT-001',
    contactName: 'Sarah Mitchell',
    contactEmail: 'sarah.mitchell@legrand.com',
    emailSentAt: '2024-12-10T10:30:00Z',
    confirmedAt: '2024-12-10T14:15:00Z',
    linkedShipmentId: 'SHIP-003',
    notes: 'Regular restock order',
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-10T14:15:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'REQ-002',
    requestNumber: 'SR-2024-002',
    vendorId: 'CO-004',
    vendorName: 'Johnson Controls',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    requestMethod: 'CALL',
    status: 'SENT' as ShipmentRequestStatus,
    priority: 'expedited',
    requestedDeliveryDate: '2024-12-18T00:00:00Z',
    items: [
      {
        id: 'REQLI-002',
        productId: 'PC-2',
        productName: 'Twist-lock Photocell with receptacle',
        partNumber: 'PC-2',
        requestedQuantity: 100,
        currentStock: 180,
        reorderPoint: 50,
      },
    ],
    totalQuantity: 100,
    confirmedAt: '2024-12-11T09:00:00Z',
    confirmedBy: 'Mike Johnson',
    confirmationNotes: 'Spoke with David Wilson, confirmed shipment will go out Monday 12/16',
    notes: 'Expedited - customer project deadline',
    createdAt: '2024-12-11T08:30:00Z',
    updatedAt: '2024-12-11T09:00:00Z',
    createdBy: 'Mike Johnson',
  },
  {
    id: 'REQ-003',
    requestNumber: 'SR-2024-003',
    vendorId: 'CO-012',
    vendorName: 'Legrand North America',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    requestMethod: 'MANUFACTURER_SYSTEM',
    status: 'PENDING' as ShipmentRequestStatus,
    priority: 'urgent',
    requestedDeliveryDate: '2024-12-16T00:00:00Z',
    items: [
      {
        id: 'REQLI-003',
        productId: 'MS-DCE-09-L7-W',
        productName: 'Motion Sensor, DC, Fixture External',
        partNumber: 'MS-DCE-09-L7-W',
        requestedQuantity: 75,
        currentStock: 30,
        reorderPoint: 40,
      },
      {
        id: 'REQLI-004',
        productId: 'ALF-ASR',
        productName: 'Adjustable Square & Round Pole Mounting',
        partNumber: 'ALF-ASR',
        requestedQuantity: 100,
        currentStock: 480,
        reorderPoint: 100,
      },
    ],
    totalQuantity: 175,
    notes: 'URGENT - Low stock alert triggered',
    createdAt: '2024-12-12T07:00:00Z',
    updatedAt: '2024-12-12T07:00:00Z',
    createdBy: 'System',
  },
];

// Add a new shipment request
export function addShipmentRequest(request: Omit<ShipmentRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>): ShipmentRequest {
  const newRequest: ShipmentRequest = {
    ...request,
    id: `REQ-${String(mockShipmentRequests.length + 1).padStart(3, '0')}`,
    requestNumber: `SR-${new Date().getFullYear()}-${String(mockShipmentRequests.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockShipmentRequests.push(newRequest);
  return newRequest;
}

// Update shipment request status
export function updateShipmentRequestStatus(
  requestId: string,
  status: ShipmentRequestStatus,
  additionalFields?: Partial<ShipmentRequest>
): ShipmentRequest | undefined {
  const index = mockShipmentRequests.findIndex(r => r.id === requestId);
  if (index === -1) return undefined;

  mockShipmentRequests[index] = {
    ...mockShipmentRequests[index],
    ...additionalFields,
    status,
    updatedAt: new Date().toISOString(),
  };
  return mockShipmentRequests[index];
}

// Get all shipment requests
export function getAllShipmentRequests(): ShipmentRequest[] {
  return mockShipmentRequests;
}

// Get shipment request by ID
export function getShipmentRequestById(id: string): ShipmentRequest | undefined {
  return mockShipmentRequests.find(r => r.id === id);
}

// -----------------------------------------------------------------------------
// Cycle Counts
// -----------------------------------------------------------------------------

export const mockCycleCounts: CycleCount[] = [
  {
    id: 'CC-001',
    cycleCountNumber: 'CC-2024-001',
    name: 'Monthly Full Warehouse Count - December',
    description: 'End of month full inventory reconciliation for Atlanta DC',
    type: 'FULL',
    priority: 'high',
    status: 'IN_PROGRESS',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    scope: {},
    scheduledDate: '2024-12-15T08:00:00Z',
    dueDate: '2024-12-16T17:00:00Z',
    assignedTo: 'user-003',
    assignedToName: 'Mike Johnson',
    lineItems: [
      {
        id: 'CCLI-001',
        cycleCountId: 'CC-001',
        inventoryItemId: 'INVITEM-001',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        binId: 'BIN-001',
        binLocation: 'Shelf 1A, Bin A',
        fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin A',
        lotNumber: 'LOT-2024-001',
        systemQuantity: 100,
        countedQuantity: 98,
        variance: -2,
        variancePercent: -2,
        status: 'counted',
        countedBy: 'user-003',
        countedByName: 'Mike Johnson',
        countedAt: '2024-12-15T09:30:00Z',
        recountRequired: false,
        notes: '2 units found damaged, moved to quarantine',
      },
      {
        id: 'CCLI-002',
        cycleCountId: 'CC-001',
        inventoryItemId: 'INVITEM-002',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        binId: 'BIN-002',
        binLocation: 'Shelf 1A, Bin B',
        fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin B',
        lotNumber: 'LOT-2024-002',
        systemQuantity: 50,
        countedQuantity: 50,
        variance: 0,
        variancePercent: 0,
        status: 'counted',
        countedBy: 'user-003',
        countedByName: 'Mike Johnson',
        countedAt: '2024-12-15T09:45:00Z',
        recountRequired: false,
      },
      {
        id: 'CCLI-003',
        cycleCountId: 'CC-001',
        inventoryItemId: 'INVITEM-003',
        productId: 'ALF-ASR',
        productName: 'Adjustable Square & Round Pole Mounting',
        partNumber: 'ALF-ASR',
        binId: 'BIN-003',
        binLocation: 'Shelf 1A, Bin C',
        fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin C',
        lotNumber: 'LOT-2024-003',
        systemQuantity: 500,
        status: 'pending',
        recountRequired: false,
      },
      {
        id: 'CCLI-004',
        cycleCountId: 'CC-001',
        inventoryItemId: 'INVITEM-004',
        productId: 'PC-2',
        productName: 'Twist-lock Photocell with receptacle',
        partNumber: 'PC-2',
        binId: 'BIN-004',
        binLocation: 'Shelf 1A, Bin D',
        fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin D',
        lotNumber: 'LOT-2024-004',
        systemQuantity: 200,
        status: 'pending',
        recountRequired: false,
      },
      {
        id: 'CCLI-005',
        cycleCountId: 'CC-001',
        inventoryItemId: 'INVITEM-005',
        productId: 'MS-DCE-09-L7-W',
        productName: 'Motion Sensor, DC, Fixture External',
        partNumber: 'MS-DCE-09-L7-W',
        binId: 'BIN-005',
        binLocation: 'Shelf 1A, Bay-01, Row 2, Bin A',
        fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 2 > Bin A',
        lotNumber: 'LOT-2024-005',
        systemQuantity: 75,
        status: 'pending',
        recountRequired: false,
      },
    ],
    totalItems: 5,
    countedItems: 2,
    itemsWithVariance: 1,
    startedAt: '2024-12-15T09:00:00Z',
    startedBy: 'user-003',
    totalSystemQuantity: 925,
    createdAt: '2024-12-14T10:00:00Z',
    updatedAt: '2024-12-15T09:45:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'CC-002',
    cycleCountNumber: 'CC-2024-002',
    name: 'High-Value Product Count',
    description: 'Monthly count of A-class high-value inventory items',
    type: 'ABC',
    priority: 'high',
    status: 'SCHEDULED',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    scope: {
      abcClass: 'A',
    },
    scheduledDate: '2024-12-18T08:00:00Z',
    dueDate: '2024-12-18T17:00:00Z',
    assignedTo: 'user-004',
    assignedToName: 'Lisa Anderson',
    lineItems: [],
    totalItems: 0,
    countedItems: 0,
    itemsWithVariance: 0,
    notes: 'Focus on high-value lighting fixtures and sensors',
    createdAt: '2024-12-12T14:00:00Z',
    updatedAt: '2024-12-12T14:00:00Z',
    createdBy: 'Sarah Williams',
  },
  {
    id: 'CC-003',
    cycleCountNumber: 'CC-2024-003',
    name: 'Section A Random Sample',
    description: 'Random 20% sample count of Section A inventory',
    type: 'RANDOM',
    priority: 'medium',
    status: 'COMPLETED',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    scope: {
      sections: ['SEC-001'],
    },
    scheduledDate: '2024-12-10T08:00:00Z',
    dueDate: '2024-12-10T12:00:00Z',
    assignedTo: 'user-003',
    assignedToName: 'Mike Johnson',
    lineItems: [
      {
        id: 'CCLI-006',
        cycleCountId: 'CC-003',
        inventoryItemId: 'INVITEM-001',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        binId: 'BIN-001',
        binLocation: 'Shelf 1A, Bin A',
        fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin A',
        lotNumber: 'LOT-2024-001',
        systemQuantity: 100,
        countedQuantity: 100,
        variance: 0,
        variancePercent: 0,
        status: 'verified',
        countedBy: 'user-003',
        countedByName: 'Mike Johnson',
        countedAt: '2024-12-10T09:15:00Z',
        verifiedBy: 'user-004',
        verifiedByName: 'Lisa Anderson',
        verifiedAt: '2024-12-10T10:30:00Z',
        recountRequired: false,
      },
      {
        id: 'CCLI-007',
        cycleCountId: 'CC-003',
        inventoryItemId: 'INVITEM-003',
        productId: 'ALF-ASR',
        productName: 'Adjustable Square & Round Pole Mounting',
        partNumber: 'ALF-ASR',
        binId: 'BIN-003',
        binLocation: 'Shelf 1A, Bin C',
        fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 1 > Bin C',
        lotNumber: 'LOT-2024-003',
        systemQuantity: 500,
        countedQuantity: 498,
        variance: -2,
        variancePercent: -0.4,
        status: 'adjusted',
        countedBy: 'user-003',
        countedByName: 'Mike Johnson',
        countedAt: '2024-12-10T09:45:00Z',
        verifiedBy: 'user-004',
        verifiedByName: 'Lisa Anderson',
        verifiedAt: '2024-12-10T10:45:00Z',
        recountRequired: false,
        notes: 'Inventory adjusted - 2 units unaccounted, likely shipping error',
      },
    ],
    totalItems: 2,
    countedItems: 2,
    itemsWithVariance: 1,
    startedAt: '2024-12-10T09:00:00Z',
    startedBy: 'user-003',
    completedAt: '2024-12-10T11:00:00Z',
    completedBy: 'user-003',
    reviewedAt: '2024-12-10T11:30:00Z',
    reviewedBy: 'user-004',
    reviewedByName: 'Lisa Anderson',
    totalSystemQuantity: 600,
    totalCountedQuantity: 598,
    totalVariance: -2,
    accuracyPercentage: 99.67,
    createdAt: '2024-12-09T16:00:00Z',
    updatedAt: '2024-12-10T11:30:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'CC-004',
    cycleCountNumber: 'CC-2024-004',
    name: 'Motion Sensor Product Count',
    description: 'Audit of all motion sensor inventory after customer returns',
    type: 'PRODUCT',
    priority: 'urgent',
    status: 'PENDING_REVIEW',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    scope: {
      products: ['MS-DCE-09-L7-W'],
    },
    scheduledDate: '2024-12-14T08:00:00Z',
    dueDate: '2024-12-14T12:00:00Z',
    assignedTo: 'user-004',
    assignedToName: 'Lisa Anderson',
    lineItems: [
      {
        id: 'CCLI-008',
        cycleCountId: 'CC-004',
        inventoryItemId: 'INVITEM-005',
        productId: 'MS-DCE-09-L7-W',
        productName: 'Motion Sensor, DC, Fixture External',
        partNumber: 'MS-DCE-09-L7-W',
        binId: 'BIN-005',
        binLocation: 'Shelf 1A, Bay-01, Row 2, Bin A',
        fullLocationPath: 'Atlanta DC > Section A > Aisle 1 > Shelf 1A > Bay-01 > Row 2 > Bin A',
        lotNumber: 'LOT-2024-005',
        systemQuantity: 75,
        countedQuantity: 72,
        variance: -3,
        variancePercent: -4,
        status: 'counted',
        countedBy: 'user-004',
        countedByName: 'Lisa Anderson',
        countedAt: '2024-12-14T09:30:00Z',
        recountRequired: true,
        recountReason: 'Variance exceeds 2% threshold',
        notes: 'May be related to RMA-2024-003 returns not yet processed',
      },
    ],
    totalItems: 1,
    countedItems: 1,
    itemsWithVariance: 1,
    startedAt: '2024-12-14T09:00:00Z',
    startedBy: 'user-004',
    totalSystemQuantity: 75,
    totalCountedQuantity: 72,
    totalVariance: -3,
    accuracyPercentage: 96,
    notes: 'Triggered by RMA returns - need to verify all units accounted for',
    createdAt: '2024-12-13T15:00:00Z',
    updatedAt: '2024-12-14T09:30:00Z',
    createdBy: 'Sarah Williams',
  },
  {
    id: 'CC-005',
    cycleCountNumber: 'CC-2024-005',
    name: 'Legrand Products Blind Count',
    description: 'Blind count of all Legrand products for audit compliance',
    type: 'BLIND',
    priority: 'medium',
    status: 'DRAFT',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    scope: {
      factories: ['CO-012'],
    },
    scheduledDate: '2024-12-20T08:00:00Z',
    dueDate: '2024-12-20T17:00:00Z',
    lineItems: [],
    totalItems: 0,
    countedItems: 0,
    itemsWithVariance: 0,
    notes: 'Annual blind count required for Legrand consignment agreement',
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
    createdBy: 'John Smith',
  },
];

// Get all cycle counts
export function getAllCycleCounts(): CycleCount[] {
  return mockCycleCounts;
}

// Get cycle count by ID
export function getCycleCountById(id: string): CycleCount | undefined {
  return mockCycleCounts.find(cc => cc.id === id);
}

// Get cycle count stats
export function getCycleCountStats() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const completedThisMonth = mockCycleCounts.filter(cc => {
    if (cc.status !== 'COMPLETED' || !cc.completedAt) return false;
    const completedDate = new Date(cc.completedAt);
    return completedDate.getMonth() === thisMonth && completedDate.getFullYear() === thisYear;
  });

  const avgAccuracy = completedThisMonth.length > 0
    ? completedThisMonth.reduce((sum, cc) => sum + (cc.accuracyPercentage || 0), 0) / completedThisMonth.length
    : 0;

  return {
    total: mockCycleCounts.length,
    draft: mockCycleCounts.filter(cc => cc.status === 'DRAFT').length,
    scheduled: mockCycleCounts.filter(cc => cc.status === 'SCHEDULED').length,
    inProgress: mockCycleCounts.filter(cc => cc.status === 'IN_PROGRESS').length,
    pendingReview: mockCycleCounts.filter(cc => cc.status === 'PENDING_REVIEW').length,
    completed: mockCycleCounts.filter(cc => cc.status === 'COMPLETED').length,
    completedThisMonth: completedThisMonth.length,
    averageAccuracy: Math.round(avgAccuracy * 100) / 100,
    itemsWithVariance: mockCycleCounts
      .filter(cc => cc.status === 'COMPLETED' || cc.status === 'IN_PROGRESS' || cc.status === 'PENDING_REVIEW')
      .reduce((sum, cc) => sum + cc.itemsWithVariance, 0),
  };
}

// Add a new cycle count
export function addCycleCount(cycleCount: Omit<CycleCount, 'id' | 'cycleCountNumber' | 'createdAt' | 'updatedAt'>): CycleCount {
  const newCount: CycleCount = {
    ...cycleCount,
    id: `CC-${String(mockCycleCounts.length + 1).padStart(3, '0')}`,
    cycleCountNumber: `CC-${new Date().getFullYear()}-${String(mockCycleCounts.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockCycleCounts.push(newCount);
  return newCount;
}

// Update cycle count status
export function updateCycleCountStatus(
  countId: string,
  status: CycleCountStatus,
  additionalFields?: Partial<CycleCount>
): CycleCount | undefined {
  const index = mockCycleCounts.findIndex(cc => cc.id === countId);
  if (index === -1) return undefined;

  mockCycleCounts[index] = {
    ...mockCycleCounts[index],
    ...additionalFields,
    status,
    updatedAt: new Date().toISOString(),
  };
  return mockCycleCounts[index];
}

// Update a cycle count line item (record count)
export function updateCycleCountLineItem(
  countId: string,
  lineItemId: string,
  updates: Partial<CycleCountLineItem>
): CycleCount | undefined {
  const countIndex = mockCycleCounts.findIndex(cc => cc.id === countId);
  if (countIndex === -1) return undefined;

  const cycleCount = mockCycleCounts[countIndex];
  const lineItemIndex = cycleCount.lineItems.findIndex(li => li.id === lineItemId);
  if (lineItemIndex === -1) return undefined;

  // Update the line item
  const lineItem = cycleCount.lineItems[lineItemIndex];
  const updatedLineItem = {
    ...lineItem,
    ...updates,
  };

  // Calculate variance if counted quantity is provided
  if (updates.countedQuantity !== undefined) {
    updatedLineItem.variance = updates.countedQuantity - lineItem.systemQuantity;
    updatedLineItem.variancePercent = lineItem.systemQuantity > 0
      ? Math.round((updatedLineItem.variance / lineItem.systemQuantity) * 10000) / 100
      : 0;
    updatedLineItem.status = 'counted';
    updatedLineItem.countedAt = new Date().toISOString();
  }

  cycleCount.lineItems[lineItemIndex] = updatedLineItem;

  // Recalculate cycle count stats
  cycleCount.countedItems = cycleCount.lineItems.filter(li =>
    li.status === 'counted' || li.status === 'verified' || li.status === 'adjusted'
  ).length;
  cycleCount.itemsWithVariance = cycleCount.lineItems.filter(li =>
    li.variance !== undefined && li.variance !== 0
  ).length;
  cycleCount.totalCountedQuantity = cycleCount.lineItems
    .filter(li => li.countedQuantity !== undefined)
    .reduce((sum, li) => sum + (li.countedQuantity || 0), 0);
  cycleCount.totalVariance = cycleCount.lineItems
    .filter(li => li.variance !== undefined)
    .reduce((sum, li) => sum + (li.variance || 0), 0);

  if (cycleCount.totalSystemQuantity && cycleCount.totalCountedQuantity !== undefined) {
    cycleCount.accuracyPercentage = Math.round(
      (1 - Math.abs(cycleCount.totalVariance || 0) / cycleCount.totalSystemQuantity) * 10000
    ) / 100;
  }

  cycleCount.updatedAt = new Date().toISOString();
  mockCycleCounts[countIndex] = cycleCount;

  return cycleCount;
}

// Generate line items for a cycle count based on scope
export function generateCycleCountLineItems(cycleCount: CycleCount): CycleCountLineItem[] {
  let itemsToCount = [...mockInventoryItems];

  // Filter by scope
  if (cycleCount.scope.products && cycleCount.scope.products.length > 0) {
    const inventoryIds = mockInventory
      .filter(inv => cycleCount.scope.products!.includes(inv.productId))
      .map(inv => inv.id);
    itemsToCount = itemsToCount.filter(item => inventoryIds.includes(item.inventoryId));
  }

  if (cycleCount.scope.factories && cycleCount.scope.factories.length > 0) {
    const inventoryIds = mockInventory
      .filter(inv => cycleCount.scope.factories!.includes(inv.factoryId))
      .map(inv => inv.id);
    itemsToCount = itemsToCount.filter(item => inventoryIds.includes(item.inventoryId));
  }

  // Create line items
  return itemsToCount.map((item, index) => {
    const inv = mockInventory.find(i => i.id === item.inventoryId)!;
    return {
      id: `CCLI-NEW-${index + 1}`,
      cycleCountId: cycleCount.id,
      inventoryItemId: item.id,
      productId: inv.productId,
      productName: inv.productName,
      partNumber: inv.partNumber,
      binId: item.binId,
      binLocation: item.binLocation,
      fullLocationPath: item.fullLocationPath,
      lotNumber: item.lotNumber,
      systemQuantity: item.quantity,
      status: 'pending' as const,
      recountRequired: false,
    };
  });
}

// Start a cycle count (generate line items and set status)
export function startCycleCount(countId: string, startedBy: string): CycleCount | undefined {
  const index = mockCycleCounts.findIndex(cc => cc.id === countId);
  if (index === -1) return undefined;

  const cycleCount = mockCycleCounts[index];

  // Generate line items if not already present
  if (cycleCount.lineItems.length === 0) {
    cycleCount.lineItems = generateCycleCountLineItems(cycleCount);
    cycleCount.totalItems = cycleCount.lineItems.length;
    cycleCount.totalSystemQuantity = cycleCount.lineItems.reduce((sum, li) => sum + li.systemQuantity, 0);
  }

  cycleCount.status = 'IN_PROGRESS';
  cycleCount.startedAt = new Date().toISOString();
  cycleCount.startedBy = startedBy;
  cycleCount.updatedAt = new Date().toISOString();

  mockCycleCounts[index] = cycleCount;
  return cycleCount;
}

// Complete a cycle count
export function completeCycleCount(countId: string, completedBy: string): CycleCount | undefined {
  const index = mockCycleCounts.findIndex(cc => cc.id === countId);
  if (index === -1) return undefined;

  const cycleCount = mockCycleCounts[index];

  // Check if all items are counted
  const allCounted = cycleCount.lineItems.every(li =>
    li.status === 'counted' || li.status === 'verified' || li.status === 'adjusted' || li.status === 'skipped'
  );

  if (!allCounted) {
    return undefined; // Cannot complete if items remain uncounted
  }

  // Check if any items need recount
  const needsReview = cycleCount.lineItems.some(li => li.recountRequired);

  cycleCount.status = needsReview ? 'PENDING_REVIEW' : 'COMPLETED';
  cycleCount.completedAt = new Date().toISOString();
  cycleCount.completedBy = completedBy;
  cycleCount.updatedAt = new Date().toISOString();

  mockCycleCounts[index] = cycleCount;
  return cycleCount;
}


// -----------------------------------------------------------------------------
// Mock Manufacturer Profiles
// -----------------------------------------------------------------------------

export const mockManufacturerProfiles: ManufacturerProfile[] = [
  {
    id: 'MP-001',
    manufacturerId: 'MFR-001',
    manufacturerName: 'MGM Transformer',
    vendorName: 'MGM Transformer',
    vendorGroup: 'Transformers',
    repCode: 'MGM-001',
    phone: '423-271-8333',
    mainEmailAddress: 'orders@mgmtransformer.com',
    addressLine1: '575 Industrial Way',
    city: 'Jacksonville',
    state: 'Florida',
    postalCode: '32099',
    orderPrefix: 'OM',
    orderSequenceStart: 0,
    orderSequenceEnd: 99999,
    alwaysFactoryBO: false,
    warehousing: true,
    warehouseCopySortOrder: 'default',
    selectDefaultShipper: 'CJI Robinson',
    remarks: '',
    manualProductAllowed: true,
    isBuySell: false,
    releaseCopySortOnLineItem: false,
    orderAllowedWithoutCustomerXRef: false,
    orderAllowedWithoutShipToXRef: false,
    defaultToManualPricing: false,
    warnAboutPartialQtyOrder: false,
    communicateUsingEdiOutFiles: false,
    communicateReleasesOnly: false,
    downloadSummaryEdi: false,
    outboundCommunication: 'PDF',
    inboundCommunication: 'PDF',
    contacts: [
      {
        id: 'MC-001',
        factoryId: 'MFR-001',
        name: 'John Smith',
        email: 'jsmith@mgmtransformer.com',
        phone: '423-271-8334',
        role: 'Sales Manager',
        isDefaultForOrders: true,
        isActive: true,
      },
    ],
    freightTerms: 'FOB Destination',
    shipperAccountNumber: 'MGM-SHIP-001',
    customerXRefs: [
      {
        id: 'VCXR-001',
        manufacturerProfileId: 'MP-001',
        customerId: 'CUST-001',
        customerName: 'CED (All Phases) College Park',
        customerAddress: '3375 Highway 85\nCollege Park, GA 30349-9801',
        vendorCustomerNumber: 'MGM001',
        selectDefaultShipper: 'CJI Robinson',
        quoteReference: '',
        alwaysFactoryBO: false,
        creditHold: false,
        additionalVendorCustomerNumbers: [],
        customerAssignedCodes: [],
        shipToAddresses: [
          {
            id: 'VSA-001',
            name: 'Irman Solar-Grotts 2',
            address: '365 E Grotts Rd, Grotts, W1 24537',
            customerAddressCode: '',
          },
        ],
      },
    ],
    freightCategories: [
      {
        id: 'FC-001',
        manufacturerProfileId: 'MP-001',
        vendorName: 'MGM Transformer',
        freightCategory: 1,
        description: 'Transformers',
        classRate: 70,
        flammable: false,
      },
    ],
    isSuspended: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'MP-002',
    manufacturerId: 'MFR-002',
    manufacturerName: 'EZ Crete',
    vendorName: 'EZ Crete',
    vendorGroup: 'Concrete',
    repCode: 'EZC-001',
    phone: '555-123-4567',
    mainEmailAddress: 'orders@ezcrete.com',
    addressLine1: '1200 Concrete Blvd',
    city: 'Atlanta',
    state: 'Georgia',
    postalCode: '30301',
    orderPrefix: 'EZ',
    orderSequenceStart: 0,
    orderSequenceEnd: 99999,
    alwaysFactoryBO: false,
    warehousing: true,
    warehouseCopySortOrder: 'default',
    manualProductAllowed: true,
    isBuySell: false,
    releaseCopySortOnLineItem: false,
    orderAllowedWithoutCustomerXRef: true,
    orderAllowedWithoutShipToXRef: true,
    defaultToManualPricing: false,
    warnAboutPartialQtyOrder: true,
    communicateUsingEdiOutFiles: false,
    communicateReleasesOnly: false,
    downloadSummaryEdi: false,
    outboundCommunication: 'PDF',
    inboundCommunication: 'PDF',
    freightCategories: [
      {
        id: 'FC-002',
        manufacturerProfileId: 'MP-002',
        vendorName: 'EZ Crete',
        freightCategory: 1,
        description: 'Concrete Pads',
        classRate: 55,
        flammable: false,
      },
    ],
    isSuspended: false,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-11-15T10:00:00Z',
  },
  {
    id: 'MP-003',
    manufacturerId: 'MFR-003',
    manufacturerName: 'Bryant Wiring Devices',
    vendorName: 'Bryant Wiring Devices',
    vendorGroup: 'Electrical',
    repCode: 'BWD-001',
    phone: '555-234-5678',
    mainEmailAddress: 'orders@bryantwiring.com',
    addressLine1: '800 Electric Ave',
    city: 'Charlotte',
    state: 'North Carolina',
    postalCode: '28201',
    orderPrefix: 'BW',
    orderSequenceStart: 0,
    orderSequenceEnd: 99999,
    alwaysFactoryBO: false,
    warehousing: true,
    warehouseCopySortOrder: 'alphabetical',
    manualProductAllowed: false,
    isBuySell: true,
    releaseCopySortOnLineItem: true,
    orderAllowedWithoutCustomerXRef: false,
    orderAllowedWithoutShipToXRef: false,
    defaultToManualPricing: false,
    warnAboutPartialQtyOrder: false,
    communicateUsingEdiOutFiles: true,
    communicateReleasesOnly: false,
    downloadSummaryEdi: true,
    outboundCommunication: 'EDI',
    inboundCommunication: 'EDI',
    freightCategories: [
      {
        id: 'FC-003',
        manufacturerProfileId: 'MP-003',
        vendorName: 'Bryant Wiring Devices',
        freightCategory: 1,
        description: 'NMFC052910-4 Fittings',
        classRate: 50,
        flammable: false,
      },
    ],
    isSuspended: false,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-10-20T10:00:00Z',
  },
  {
    id: 'MP-004',
    manufacturerId: 'MFR-004',
    manufacturerName: 'Low Electric',
    vendorName: 'Low Electric',
    vendorGroup: 'Electrical',
    repCode: 'LE-001',
    phone: '555-345-6789',
    mainEmailAddress: 'orders@lowelectric.com',
    addressLine1: '450 Power St',
    city: 'Raleigh',
    state: 'North Carolina',
    postalCode: '27601',
    orderPrefix: 'LE',
    orderSequenceStart: 0,
    orderSequenceEnd: 99999,
    alwaysFactoryBO: true,
    warehousing: true,
    warehouseCopySortOrder: 'default',
    manualProductAllowed: true,
    isBuySell: false,
    releaseCopySortOnLineItem: false,
    orderAllowedWithoutCustomerXRef: true,
    orderAllowedWithoutShipToXRef: true,
    defaultToManualPricing: true,
    warnAboutPartialQtyOrder: false,
    communicateUsingEdiOutFiles: false,
    communicateReleasesOnly: true,
    downloadSummaryEdi: false,
    outboundCommunication: 'PDF',
    inboundCommunication: 'PDF',
    freightCategories: [
      {
        id: 'FC-004',
        manufacturerProfileId: 'MP-004',
        vendorName: 'Low Electric',
        freightCategory: 1,
        description: 'NMFC052910-4 Fittings',
        classRate: 50,
        flammable: false,
      },
    ],
    isSuspended: false,
    createdAt: '2024-04-01T10:00:00Z',
    updatedAt: '2024-09-15T10:00:00Z',
  },
  {
    id: 'MP-005',
    manufacturerId: 'MFR-005',
    manufacturerName: 'Linear Solution',
    vendorName: 'Linear Solution',
    vendorGroup: 'Steel',
    repCode: 'LS-001',
    phone: '555-456-7890',
    mainEmailAddress: 'orders@linearsolution.com',
    addressLine1: '600 Steel Way',
    city: 'Birmingham',
    state: 'Alabama',
    postalCode: '35201',
    orderPrefix: 'LS',
    orderSequenceStart: 0,
    orderSequenceEnd: 99999,
    alwaysFactoryBO: false,
    warehousing: true,
    warehouseCopySortOrder: 'default',
    manualProductAllowed: true,
    isBuySell: false,
    releaseCopySortOnLineItem: false,
    orderAllowedWithoutCustomerXRef: false,
    orderAllowedWithoutShipToXRef: false,
    defaultToManualPricing: false,
    warnAboutPartialQtyOrder: true,
    communicateUsingEdiOutFiles: false,
    communicateReleasesOnly: false,
    downloadSummaryEdi: false,
    outboundCommunication: 'PDF',
    inboundCommunication: 'PDF',
    freightCategories: [
      {
        id: 'FC-005',
        manufacturerProfileId: 'MP-005',
        vendorName: 'Linear Solution',
        freightCategory: 1,
        description: 'NMFC 56700 Steel Tube',
        classRate: 50,
        flammable: false,
      },
    ],
    isSuspended: false,
    createdAt: '2024-05-01T10:00:00Z',
    updatedAt: '2024-08-20T10:00:00Z',
  },
  {
    id: 'MP-006',
    manufacturerId: 'MFR-006',
    manufacturerName: 'American Polywater',
    vendorName: 'American Polywater',
    vendorGroup: 'Lubricants',
    repCode: 'AP-001',
    phone: '555-567-8901',
    mainEmailAddress: 'orders@polywater.com',
    addressLine1: '750 Chemical Dr',
    city: 'Minneapolis',
    state: 'Minnesota',
    postalCode: '55401',
    orderPrefix: 'AP',
    orderSequenceStart: 0,
    orderSequenceEnd: 99999,
    alwaysFactoryBO: false,
    warehousing: true,
    warehouseCopySortOrder: 'alphabetical',
    manualProductAllowed: true,
    isBuySell: false,
    releaseCopySortOnLineItem: false,
    orderAllowedWithoutCustomerXRef: true,
    orderAllowedWithoutShipToXRef: true,
    defaultToManualPricing: false,
    warnAboutPartialQtyOrder: false,
    communicateUsingEdiOutFiles: false,
    communicateReleasesOnly: false,
    downloadSummaryEdi: false,
    outboundCommunication: 'PDF',
    inboundCommunication: 'PDF',
    freightCategories: [
      {
        id: 'FC-006',
        manufacturerProfileId: 'MP-006',
        vendorName: 'American Polywater',
        freightCategory: 1,
        description: 'NMFC48505 Lubricant',
        classRate: 65,
        flammable: true,
      },
    ],
    isSuspended: false,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-07-15T10:00:00Z',
  },
  {
    id: 'MP-007',
    manufacturerId: 'MFR-007',
    manufacturerName: 'Molburn',
    vendorName: 'Molburn',
    vendorGroup: 'Fittings',
    repCode: 'MOL-001',
    phone: '555-678-9012',
    mainEmailAddress: 'orders@molburn.com',
    addressLine1: '900 Fitting Rd',
    city: 'Houston',
    state: 'Texas',
    postalCode: '77001',
    orderPrefix: 'MOL',
    orderSequenceStart: 0,
    orderSequenceEnd: 99999,
    alwaysFactoryBO: false,
    warehousing: false,
    warehouseCopySortOrder: 'default',
    manualProductAllowed: true,
    isBuySell: false,
    releaseCopySortOnLineItem: false,
    orderAllowedWithoutCustomerXRef: false,
    orderAllowedWithoutShipToXRef: false,
    defaultToManualPricing: false,
    warnAboutPartialQtyOrder: false,
    communicateUsingEdiOutFiles: false,
    communicateReleasesOnly: false,
    downloadSummaryEdi: false,
    outboundCommunication: 'PDF',
    inboundCommunication: 'PDF',
    freightCategories: [
      {
        id: 'FC-007',
        manufacturerProfileId: 'MP-007',
        vendorName: 'Molburn',
        freightCategory: 1,
        description: 'NMFC070610-4 Fittings',
        classRate: 60,
        flammable: false,
      },
    ],
    isSuspended: true,
    createdAt: '2024-07-01T10:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z',
  },
];
