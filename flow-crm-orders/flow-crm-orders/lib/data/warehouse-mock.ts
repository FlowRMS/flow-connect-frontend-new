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
