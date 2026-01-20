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
  InventoryStorageLocation,
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
  CycleCountTriggerType,
  CycleCountDiscrepancyReason,
  CycleCountActivity,
  CycleCountActivityType,
  CycleCountInventoryIssue,
  ManufacturerProfile,
  VendorCustomerXRef,
  FreightCategory,
  RecurringShipment,
  RecurrencePattern,
  RecurringShipmentStatus,
  ExpectedItem,
  AssignedUser,
  AssignedUserRole,
  InventoryLocation,
  LocationType,
  BackorderReviewData,
  DeliveryIssue,
  DeliveryIssueStatus,
  DeliveryIssueType,
  RecurringCycleCountJob,
  RecurringCycleCountStatus,
  InventoryVelocity,
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
// Warehouse Users (Managers & Workers)
// -----------------------------------------------------------------------------

export interface WarehouseUser {
  id: string;
  name: string;
  email: string;
  role: AssignedUserRole;
  warehouseIds: string[];  // Which warehouses they can work in
  isActive: boolean;
}

export const mockWarehouseUsers: WarehouseUser[] = [
  // Managers
  {
    id: 'user-mgr-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@flowcrm.com',
    role: 'manager',
    warehouseIds: ['WH-001', 'WH-002'],
    isActive: true,
  },
  {
    id: 'user-mgr-002',
    name: 'David Park',
    email: 'david.park@flowcrm.com',
    role: 'manager',
    warehouseIds: ['WH-001'],
    isActive: true,
  },
  {
    id: 'user-mgr-003',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@flowcrm.com',
    role: 'manager',
    warehouseIds: ['WH-002'],
    isActive: true,
  },
  // Workers
  {
    id: 'user-wkr-001',
    name: 'Mike Chen',
    email: 'mike.chen@flowcrm.com',
    role: 'worker',
    warehouseIds: ['WH-001'],
    isActive: true,
  },
  {
    id: 'user-wkr-002',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@flowcrm.com',
    role: 'worker',
    warehouseIds: ['WH-001'],
    isActive: true,
  },
  {
    id: 'user-wkr-003',
    name: 'James Wilson',
    email: 'james.wilson@flowcrm.com',
    role: 'worker',
    warehouseIds: ['WH-001', 'WH-002'],
    isActive: true,
  },
  {
    id: 'user-wkr-004',
    name: 'Tony Martinez',
    email: 'tony.martinez@flowcrm.com',
    role: 'worker',
    warehouseIds: ['WH-001'],
    isActive: true,
  },
  {
    id: 'user-wkr-005',
    name: 'Amanda Brooks',
    email: 'amanda.brooks@flowcrm.com',
    role: 'worker',
    warehouseIds: ['WH-002'],
    isActive: true,
  },
  {
    id: 'user-wkr-006',
    name: 'Kevin Thompson',
    email: 'kevin.thompson@flowcrm.com',
    role: 'worker',
    warehouseIds: ['WH-001', 'WH-002'],
    isActive: true,
  },
  // Inside Sales
  {
    id: 'user-is-001',
    name: 'Lisa Martinez',
    email: 'lisa.martinez@flowcrm.com',
    role: 'inside_sales',
    warehouseIds: ['WH-001', 'WH-002'],
    isActive: true,
  },
  {
    id: 'user-is-002',
    name: 'Mark Anderson',
    email: 'mark.anderson@flowcrm.com',
    role: 'inside_sales',
    warehouseIds: ['WH-001', 'WH-002'],
    isActive: true,
  },
  {
    id: 'user-is-003',
    name: 'Rachel Kim',
    email: 'rachel.kim@flowcrm.com',
    role: 'inside_sales',
    warehouseIds: ['WH-001'],
    isActive: true,
  },
  {
    id: 'user-is-004',
    name: 'Brian Wilson',
    email: 'brian.wilson@flowcrm.com',
    role: 'inside_sales',
    warehouseIds: ['WH-002'],
    isActive: true,
  },
];

// Get warehouse users by role
export function getWarehouseUsersByRole(role: AssignedUserRole, warehouseId?: string): WarehouseUser[] {
  return mockWarehouseUsers.filter(user =>
    user.role === role &&
    user.isActive &&
    (!warehouseId || user.warehouseIds.includes(warehouseId))
  );
}

// Get all warehouse managers
export function getWarehouseManagers(warehouseId?: string): WarehouseUser[] {
  return getWarehouseUsersByRole('manager', warehouseId);
}

// Get all warehouse workers
export function getWarehouseWorkers(warehouseId?: string): WarehouseUser[] {
  return getWarehouseUsersByRole('worker', warehouseId);
}

// Get all inside sales users
export function getInsideSalesUsers(warehouseId?: string): WarehouseUser[] {
  return getWarehouseUsersByRole('inside_sales', warehouseId);
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
    warehouseId: 'WH-001',
    productName: 'ALF Flexible Area Light, 60000Lm',
    partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
    description: 'High-output flexible LED area light with 60,000 lumens. Features Type III distribution, Generation 1 optics, fuse/surge kit, photocell, and adjustable square/round mounting. Ideal for parking lots, roadways, and large outdoor areas.',
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
    reorderQuantity: 100,
    maxQuantity: 500,
    primaryLocation: {
      id: 'LOC-001',
      locationName: 'Aisle 3, Shelf B, Bin 12',
      locationCode: 'A3-B-12',
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      maxCapacity: 100,
      currentQuantity: 85,
    },
    overflowLocations: [
      {
        id: 'LOC-002',
        locationName: 'Aisle 3, Shelf B, Bin 13',
        locationCode: 'A3-B-13',
        warehouseId: 'WH-001',
        warehouseName: 'Atlanta Distribution Center',
        maxCapacity: 50,
        currentQuantity: 35,
      },
      {
        id: 'LOC-003',
        locationName: 'Aisle 5, Shelf A, Bin 1',
        locationCode: 'A5-A-01',
        warehouseId: 'WH-001',
        warehouseName: 'Atlanta Distribution Center',
        maxCapacity: 100,
        currentQuantity: 30,
        notes: 'Overflow storage - check primary first',
      },
    ],
    ownershipType: 'CONSIGNMENT',
    isConsignment: true,
    commissionPercentage: 10,
    lastCycleCountDate: '2024-12-10T10:00:00Z',
    cycleCountFrequency: 30,
    abcClass: 'A',
    movementVelocity: 'fast',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'INV-002',
    productId: 'ALF-ASR',
    warehouseId: 'WH-001',
    productName: 'Adjustable Square & Round Pole Mounting',
    partNumber: 'ALF-ASR',
    description: 'Universal adjustable mounting bracket for square and round poles. Compatible with various pole diameters from 2" to 6". Heavy-duty construction with corrosion-resistant finish.',
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
    reorderQuantity: 200,
    maxQuantity: 1000,
    primaryLocation: {
      id: 'LOC-004',
      locationName: 'Aisle 2, Shelf C, Bin 5',
      locationCode: 'A2-C-05',
      warehouseId: 'WH-001',
      warehouseName: 'Atlanta Distribution Center',
      maxCapacity: 300,
      currentQuantity: 280,
    },
    overflowLocations: [
      {
        id: 'LOC-005',
        locationName: 'Aisle 2, Shelf C, Bin 6',
        locationCode: 'A2-C-06',
        warehouseId: 'WH-001',
        warehouseName: 'Atlanta Distribution Center',
        maxCapacity: 300,
        currentQuantity: 220,
      },
    ],
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 18.50,
    targetMargin: 35,
    totalCostBasis: 9250.00,
    lastCycleCountDate: '2024-12-10T10:00:00Z',
    cycleCountFrequency: 30,
    abcClass: 'A',
    movementVelocity: 'fast',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'INV-003',
    productId: 'PC-2',
    warehouseId: 'WH-001',
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
    reorderQuantity: 100,
    maxQuantity: 500,
    ownershipType: 'CONSIGNMENT',
    isConsignment: true,
    commissionPercentage: 8,
    lastCycleCountDate: '2024-11-15T10:00:00Z',
    cycleCountFrequency: 45,
    abcClass: 'B',
    movementVelocity: 'medium',
    createdAt: '2024-07-15T10:00:00Z',
    updatedAt: '2024-12-08T10:00:00Z',
  },
  {
    id: 'INV-004',
    productId: 'MS-DCE-09-L7-W',
    warehouseId: 'WH-001',
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
    reorderQuantity: 75,
    maxQuantity: 200,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 45.00,
    targetMargin: 40,
    totalCostBasis: 3375.00,
    lastCycleCountDate: '2024-12-14T10:00:00Z',
    cycleCountFrequency: 30,
    abcClass: 'A',
    movementVelocity: 'fast',
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-12-09T10:00:00Z',
  },
  {
    id: 'INV-005',
    productId: 'ALF-SFD',
    warehouseId: 'WH-001',
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
    reorderQuantity: 150,
    maxQuantity: 600,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 22.00,
    targetMargin: 30,
    totalCostBasis: 6600.00,
    lastCycleCountDate: '2024-10-01T10:00:00Z',
    cycleCountFrequency: 60,
    abcClass: 'C',
    movementVelocity: 'slow',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-12-11T10:00:00Z',
  },
  // LOW STOCK items for Legrand
  {
    id: 'INV-006',
    productId: 'ALF-DRV-480',
    warehouseId: 'WH-001',
    productName: 'LED Driver 480V, Programmable',
    partNumber: 'ALF-DRV-480',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    totalQuantity: 15,
    availableQuantity: 8,
    reservedQuantity: 5,
    pickingQuantity: 2,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 25,
    reorderQuantity: 50,
    maxQuantity: 100,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 125.00,
    targetMargin: 35,
    totalCostBasis: 1875.00,
    lastCycleCountDate: '2024-12-15T10:00:00Z',
    cycleCountFrequency: 30,
    abcClass: 'A',
    movementVelocity: 'fast',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z',
  },
  {
    id: 'INV-007',
    productId: 'ALF-SURGE-20K',
    warehouseId: 'WH-001',
    productName: 'Surge Protector 20kA, Outdoor Rated',
    partNumber: 'ALF-SURGE-20K',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    totalQuantity: 5,
    availableQuantity: 3,
    reservedQuantity: 2,
    pickingQuantity: 0,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 20,
    reorderQuantity: 40,
    maxQuantity: 80,
    ownershipType: 'CONSIGNMENT',
    isConsignment: true,
    commissionPercentage: 12,
    lastCycleCountDate: '2024-12-10T10:00:00Z',
    cycleCountFrequency: 30,
    abcClass: 'A',
    movementVelocity: 'fast',
    createdAt: '2024-07-01T10:00:00Z',
    updatedAt: '2024-12-18T10:00:00Z',
  },
  {
    id: 'INV-008',
    productId: 'ALF-LENS-WIDE',
    warehouseId: 'WH-001',
    productName: 'Wide Beam Lens Kit for ALF Series',
    partNumber: 'ALF-LENS-WIDE',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    totalQuantity: 45,
    availableQuantity: 42,
    reservedQuantity: 3,
    pickingQuantity: 0,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 30,
    reorderQuantity: 60,
    maxQuantity: 150,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 35.00,
    targetMargin: 40,
    totalCostBasis: 1575.00,
    lastCycleCountDate: '2024-12-01T10:00:00Z',
    cycleCountFrequency: 45,
    abcClass: 'B',
    movementVelocity: 'medium',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
  },
  // OUT OF STOCK item
  {
    id: 'INV-009',
    productId: 'ALF-DIMMER-0-10V',
    warehouseId: 'WH-001',
    productName: '0-10V Dimming Module',
    partNumber: 'ALF-DIMMER-0-10V',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    totalQuantity: 0,
    availableQuantity: 0,
    reservedQuantity: 0,
    pickingQuantity: 0,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 25,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 15,
    reorderQuantity: 50,
    maxQuantity: 100,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 65.00,
    targetMargin: 38,
    totalCostBasis: 0,
    lastCycleCountDate: '2024-12-10T10:00:00Z',
    cycleCountFrequency: 30,
    abcClass: 'A',
    movementVelocity: 'fast',
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-12-22T10:00:00Z',
  },
  {
    id: 'INV-010',
    productId: 'ALF-BRACKET-WALL',
    warehouseId: 'WH-001',
    productName: 'Wall Mount Bracket Kit',
    partNumber: 'ALF-BRACKET-WALL',
    factoryId: 'CO-012',
    factoryName: 'Legrand North America',
    totalQuantity: 180,
    availableQuantity: 165,
    reservedQuantity: 10,
    pickingQuantity: 5,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 50,
    reorderQuantity: 100,
    maxQuantity: 300,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 28.00,
    targetMargin: 35,
    totalCostBasis: 5040.00,
    lastCycleCountDate: '2024-11-20T10:00:00Z',
    cycleCountFrequency: 45,
    abcClass: 'B',
    movementVelocity: 'medium',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  // More Johnson Controls items
  {
    id: 'INV-011',
    productId: 'JC-SENSOR-TEMP',
    warehouseId: 'WH-001',
    productName: 'Temperature Sensor Module',
    partNumber: 'JC-SENSOR-TEMP',
    factoryId: 'CO-004',
    factoryName: 'Johnson Controls',
    totalQuantity: 12,
    availableQuantity: 5,
    reservedQuantity: 7,
    pickingQuantity: 0,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 20,
    reorderQuantity: 40,
    maxQuantity: 100,
    ownershipType: 'CONSIGNMENT',
    isConsignment: true,
    commissionPercentage: 10,
    lastCycleCountDate: '2024-12-12T10:00:00Z',
    cycleCountFrequency: 30,
    abcClass: 'A',
    movementVelocity: 'fast',
    createdAt: '2024-07-01T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z',
  },
  {
    id: 'INV-012',
    productId: 'JC-RELAY-24V',
    warehouseId: 'WH-001',
    productName: '24V Control Relay',
    partNumber: 'JC-RELAY-24V',
    factoryId: 'CO-004',
    factoryName: 'Johnson Controls',
    totalQuantity: 85,
    availableQuantity: 78,
    reservedQuantity: 5,
    pickingQuantity: 2,
    pickedQuantity: 0,
    quarantineQuantity: 0,
    damagedQuantity: 0,
    expiredQuantity: 0,
    inTransitQuantity: 0,
    onHoldQuantity: 0,
    returnedQuantity: 0,
    reorderPoint: 30,
    reorderQuantity: 60,
    maxQuantity: 200,
    ownershipType: 'BUY_SELL',
    isConsignment: false,
    unitCost: 42.00,
    targetMargin: 35,
    totalCostBasis: 3570.00,
    lastCycleCountDate: '2024-12-05T10:00:00Z',
    cycleCountFrequency: 45,
    abcClass: 'B',
    movementVelocity: 'medium',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
  },
];

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'INVITEM-001',
    inventoryId: 'INV-001',
    locationId: 'BIN-001',
    locationName: 'Shelf 1A, Bin A',
    quantity: 100,
    lotNumber: 'LOT-2024-001',
    receivedDate: '2024-10-15T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-12-05T10:00:00Z',
  },
  {
    id: 'INVITEM-002',
    inventoryId: 'INV-001',
    locationId: 'BIN-002',
    locationName: 'Shelf 1A, Bin B',
    quantity: 50,
    lotNumber: 'LOT-2024-002',
    receivedDate: '2024-11-01T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-12-05T10:00:00Z',
  },
  {
    id: 'INVITEM-003',
    inventoryId: 'INV-002',
    locationId: 'BIN-003',
    locationName: 'Shelf 1A, Bin C',
    quantity: 500,
    lotNumber: 'LOT-2024-003',
    receivedDate: '2024-09-20T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-09-20T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'INVITEM-004',
    inventoryId: 'INV-003',
    locationId: 'BIN-004',
    locationName: 'Shelf 1A, Bin D',
    quantity: 200,
    lotNumber: 'LOT-2024-004',
    receivedDate: '2024-08-10T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-08-10T10:00:00Z',
    updatedAt: '2024-12-02T10:00:00Z',
  },
  {
    id: 'INVITEM-005',
    inventoryId: 'INV-004',
    locationId: 'BIN-005',
    locationName: 'Shelf 1A, Bay-01, Row 2, Bin A',
    quantity: 75,
    lotNumber: 'LOT-2024-005',
    receivedDate: '2024-09-05T10:00:00Z',
    status: 'AVAILABLE' as InventoryStatus,
    createdAt: '2024-09-05T10:00:00Z',
    updatedAt: '2024-12-09T10:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// Inventory Locations - Multi-location storage with picking priority
// Priority: 1 = Overflow (pick first), 2 = Primary, 3 = Reserve
// -----------------------------------------------------------------------------

export interface ProductInventoryLocations {
  productId: string;
  locations: InventoryLocation[];
}

export const mockProductLocations: ProductInventoryLocations[] = [
  {
    productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
    locations: [
      { locationId: 'LOC-001-OVF', locationName: 'Overflow A-1', locationType: 'OVERFLOW', quantity: 35, priority: 1 },
      { locationId: 'LOC-001-PRI', locationName: 'Shelf 1A, Bin A', locationType: 'PRIMARY', quantity: 55, priority: 2 },
      { locationId: 'LOC-001-RES', locationName: 'Reserve R-12', locationType: 'RESERVE', quantity: 30, priority: 3 },
    ],
  },
  {
    productId: 'ALF-ASR',
    locations: [
      { locationId: 'LOC-002-OVF', locationName: 'Overflow A-2', locationType: 'OVERFLOW', quantity: 120, priority: 1 },
      { locationId: 'LOC-002-PRI', locationName: 'Shelf 1A, Bin C', locationType: 'PRIMARY', quantity: 200, priority: 2 },
      { locationId: 'LOC-002-RES', locationName: 'Reserve R-15', locationType: 'RESERVE', quantity: 160, priority: 3 },
    ],
  },
  {
    productId: 'PC-2',
    locations: [
      { locationId: 'LOC-003-OVF', locationName: 'Overflow B-1', locationType: 'OVERFLOW', quantity: 45, priority: 1 },
      { locationId: 'LOC-003-PRI', locationName: 'Shelf 1A, Bin D', locationType: 'PRIMARY', quantity: 85, priority: 2 },
      { locationId: 'LOC-003-RES', locationName: 'Reserve R-20', locationType: 'RESERVE', quantity: 50, priority: 3 },
    ],
  },
  {
    productId: 'MS-DCE-09-L7-W',
    locations: [
      { locationId: 'LOC-004-OVF', locationName: 'Overflow B-3', locationType: 'OVERFLOW', quantity: 20, priority: 1 },
      { locationId: 'LOC-004-PRI', locationName: 'Shelf 2A, Bin B', locationType: 'PRIMARY', quantity: 45, priority: 2 },
    ],
  },
  {
    productId: 'ALF-DRV-480',
    locations: [
      { locationId: 'LOC-005-PRI', locationName: 'Shelf 2B, Bin C', locationType: 'PRIMARY', quantity: 25, priority: 2 },
      { locationId: 'LOC-005-RES', locationName: 'Reserve R-25', locationType: 'RESERVE', quantity: 15, priority: 3 },
    ],
  },
  {
    productId: 'ALF-DIMMER-0-10V',
    locations: [
      { locationId: 'LOC-006-OVF', locationName: 'Overflow C-1', locationType: 'OVERFLOW', quantity: 30, priority: 1 },
      { locationId: 'LOC-006-PRI', locationName: 'Shelf 3A, Bin A', locationType: 'PRIMARY', quantity: 50, priority: 2 },
    ],
  },
  {
    productId: 'ALF-SURGE-20K',
    locations: [
      { locationId: 'LOC-007-PRI', locationName: 'Shelf 2B, Bin D', locationType: 'PRIMARY', quantity: 18, priority: 2 },
    ],
  },
];

// Get inventory locations for a product, sorted by picking priority (overflow first)
export function getProductLocations(productId: string): InventoryLocation[] {
  const productLocs = mockProductLocations.find(pl => pl.productId === productId);
  if (!productLocs) return [];
  // Sort by priority (lower = pick first)
  return [...productLocs.locations].sort((a, b) => a.priority - b.priority);
}

// Get total available quantity across all locations for a product
export function getTotalAvailableQty(productId: string): number {
  const locations = getProductLocations(productId);
  return locations.reduce((sum, loc) => sum + loc.quantity, 0);
}

// Calculate picking allocation across locations for a given quantity needed
export function calculatePickingAllocation(productId: string, qtyNeeded: number): InventoryLocation[] {
  const locations = getProductLocations(productId);
  const allocations: InventoryLocation[] = [];
  let remaining = qtyNeeded;

  for (const loc of locations) {
    if (remaining <= 0) break;
    const pickFromHere = Math.min(loc.quantity, remaining);
    if (pickFromHere > 0) {
      allocations.push({
        ...loc,
        quantity: pickFromHere, // This is the qty to pick from this location
      });
      remaining -= pickFromHere;
    }
  }

  return allocations;
}


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
  {
    id: 'WAVE-003',
    waveNumber: 'W-2024-003',
    status: 'IN_PROGRESS' as WaveStatus,
    priority: 1,
    fulfillmentCount: 3,
    totalItems: 45,
    pickedItems: 28,
    pickerId: 'user-004',
    pickerName: 'Lisa Anderson',
    releasedAt: '2024-12-10T10:00:00Z',
    startedAt: '2024-12-10T10:30:00Z',
    notes: 'Afternoon rush orders',
    createdAt: '2024-12-10T09:45:00Z',
    updatedAt: '2024-12-10T11:00:00Z',
  },
  {
    id: 'WAVE-004',
    waveNumber: 'W-2024-004',
    status: 'PENDING' as WaveStatus,
    priority: 3,
    fulfillmentCount: 4,
    totalItems: 85,
    pickedItems: 0,
    notes: 'Low priority wave for tomorrow',
    createdAt: '2024-12-10T14:00:00Z',
    updatedAt: '2024-12-10T14:00:00Z',
  },
];

// Wave management functions
let waveCounter = mockWaves.length;

export function addWave(
  orderIds: string[],
  totalItems: number,
  pickerName?: string
): Wave {
  waveCounter++;
  const now = new Date().toISOString();
  const newWave: Wave = {
    id: `WAVE-${String(waveCounter).padStart(3, '0')}`,
    waveNumber: `W-${new Date().getFullYear()}-${String(waveCounter).padStart(3, '0')}`,
    status: 'PENDING',
    priority: 1,
    fulfillmentCount: orderIds.length,
    totalItems,
    pickedItems: 0,
    pickerId: pickerName ? `user-${String(Math.random()).slice(2, 5)}` : undefined,
    pickerName,
    notes: `Wave created with ${orderIds.length} orders`,
    createdAt: now,
    updatedAt: now,
  };
  mockWaves.unshift(newWave); // Add to beginning so it shows first
  return newWave;
}

export function updateWaveStatus(
  waveId: string,
  status: WaveStatus,
  additionalFields?: Partial<Wave>
): Wave | undefined {
  const index = mockWaves.findIndex(w => w.id === waveId);
  if (index === -1) return undefined;

  const now = new Date().toISOString();
  const updatedWave: Wave = {
    ...mockWaves[index],
    ...additionalFields,
    status,
    updatedAt: now,
  };

  // Set timestamps based on status
  if (status === 'RELEASED' && !updatedWave.releasedAt) {
    updatedWave.releasedAt = now;
  } else if (status === 'IN_PROGRESS' && !updatedWave.startedAt) {
    updatedWave.startedAt = now;
  } else if (status === 'COMPLETED' && !updatedWave.completedAt) {
    updatedWave.completedAt = now;
    updatedWave.pickedItems = updatedWave.totalItems; // Mark all as picked
  }

  mockWaves[index] = updatedWave;
  return updatedWave;
}

export function assignWavePicker(waveId: string, pickerName: string): Wave | undefined {
  const index = mockWaves.findIndex(w => w.id === waveId);
  if (index === -1) return undefined;

  mockWaves[index] = {
    ...mockWaves[index],
    pickerName,
    pickerId: `user-${String(Math.random()).slice(2, 5)}`,
    updatedAt: new Date().toISOString(),
  };
  return mockWaves[index];
}

// -----------------------------------------------------------------------------
// Mock Fulfillment Orders
// -----------------------------------------------------------------------------

// Note: Extended fields (carrierType, bolNumber, etc.) are used in the UI but not yet in the FulfillmentOrder type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockFulfillmentOrders: any[] = [
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
    assignedManagers: [
      {
        id: 'AM-001',
        userId: 'user-mgr-001',
        userName: 'Sarah Johnson',
        userEmail: 'sarah.johnson@flowcrm.com',
        role: 'manager',
        assignedAt: '2024-12-10T08:00:00Z',
        assignedBy: 'System',
      },
    ],
    assignedWorkers: [
      {
        id: 'AW-001',
        userId: 'user-wkr-001',
        userName: 'Mike Chen',
        userEmail: 'mike.chen@flowcrm.com',
        role: 'worker',
        assignedAt: '2024-12-10T08:15:00Z',
        assignedBy: 'Sarah Johnson',
      },
      {
        id: 'AW-002',
        userId: 'user-wkr-002',
        userName: 'Lisa Rodriguez',
        userEmail: 'lisa.rodriguez@flowcrm.com',
        role: 'worker',
        assignedAt: '2024-12-10T08:15:00Z',
        assignedBy: 'Sarah Johnson',
      },
    ],
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
    assignedManagers: [
      {
        id: 'AM-002',
        userId: 'user-mgr-002',
        userName: 'David Park',
        userEmail: 'david.park@flowcrm.com',
        role: 'manager',
        assignedAt: '2024-12-10T08:30:00Z',
        assignedBy: 'System',
      },
    ],
    assignedWorkers: [
      {
        id: 'AW-003',
        userId: 'user-wkr-003',
        userName: 'James Wilson',
        userEmail: 'james.wilson@flowcrm.com',
        role: 'worker',
        assignedAt: '2024-12-10T08:45:00Z',
        assignedBy: 'David Park',
      },
    ],
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
    carrier: 'xpo_logistics',
    carrierType: 'freight',
    trackingNumbers: ['XPO-839201847', 'XPO-839201848'],
    shipConfirmedAt: '2024-12-08T14:00:00Z',
    bolNumber: 'BOL-2024-78432',
    proNumber: 'PRO-5839201',
    freightClass: '85',
    // Pickup/Handoff signature data
    pickupSignature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNTBjMTAtMjAgMzAtMzAgNTAtMjBzMzAgMjAgNTAgMTBjMjAtMTAgNDAtMzAgNjAtMjBzMzAgMjAgNTAgMzBjMjAgMTAgNDAgMCA2MC0xMCIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
    pickupTimestamp: '2024-12-08T13:45:00Z',
    pickupCustomerName: 'Graybar Electric',
    pickupDriverName: 'Mike Johnson',
    pickupNotes: 'Driver verified ID. All pallets in good condition. Customer confirmed count.',
    shippingNotes: 'Deliver to loading dock B. Call 30 minutes ahead. Liftgate required.',
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
  // BACKORDER DEMO: Order with multiple products on backorder
  {
    id: 'FO-006',
    fulfillmentOrderNumber: 'FO-2024-006',
    orderId: 'ORD-2024-006',
    orderNumber: 'SO-2024-006',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Graybar Electric - Savannah Branch',
      addressLine1: '8500 Abercorn Street',
      city: 'Savannah',
      state: 'GA',
      postalCode: '31406',
      country: 'USA',
      contactPhone: '(912) 555-8234',
      contactEmail: 'savannah@graybar.com',
    },
    needByDate: '2024-12-28',
    allowPartialShipment: true,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    hasBackorderItems: true,
    lineItems: [
      {
        id: 'FOLI-006a',
        fulfillmentOrderId: 'FO-006',
        orderLineItemId: 'OLI-006a',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        uom: 'EA',
        orderedQty: 200, // Ordered 200, but only 120 available
        allocatedQty: 120,
        shippedQty: 0,
        backorderQty: 80,
        shortReason: 'Insufficient stock - 80 units on backorder',
        pickLocation: 'Shelf 1A, Bin A',
        createdAt: '2024-12-14T10:00:00Z',
        updatedAt: '2024-12-14T10:00:00Z',
      },
      {
        id: 'FOLI-006b',
        fulfillmentOrderId: 'FO-006',
        orderLineItemId: 'OLI-006b',
        productId: 'MS-DCE-09-L7-W',
        productName: 'Motion Sensor, DC, Fixture External',
        partNumber: 'MS-DCE-09-L7-W',
        uom: 'EA',
        orderedQty: 100, // Ordered 100, but only 30 available
        allocatedQty: 30,
        shippedQty: 0,
        backorderQty: 70,
        shortReason: 'Insufficient stock - 70 units on backorder',
        pickLocation: 'Shelf 1A, Bay-01, Row 2, Bin A',
        createdAt: '2024-12-14T10:00:00Z',
        updatedAt: '2024-12-14T10:00:00Z',
      },
      {
        id: 'FOLI-006c',
        fulfillmentOrderId: 'FO-006',
        orderLineItemId: 'OLI-006c',
        productId: 'ALF-ASR',
        productName: 'Adjustable Square & Round Pole Mounting',
        partNumber: 'ALF-ASR',
        uom: 'EA',
        orderedQty: 50, // Ordered 50, 480 available - NO backorder
        allocatedQty: 50,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bin C',
        createdAt: '2024-12-14T10:00:00Z',
        updatedAt: '2024-12-14T10:00:00Z',
      },
    ],
    notes: 'DEMO ORDER: This order has 2 products on backorder to demonstrate the backorder handling workflow.',
    createdAt: '2024-12-14T10:00:00Z',
    updatedAt: '2024-12-14T10:00:00Z',
    createdBy: 'System Demo',
  },
  // MANUFACTURER FULFILLED DEMO: Order that was sent to manufacturer
  {
    id: 'FO-007',
    fulfillmentOrderNumber: 'FO-2024-007',
    orderId: 'ORD-2024-007',
    orderNumber: 'SO-2024-007',
    customerId: 'CO-006',
    customerName: 'Summit Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Summit Electric Supply - Greenville',
      addressLine1: '1200 Industrial Park Drive',
      city: 'Greenville',
      state: 'SC',
      postalCode: '29615',
      country: 'USA',
      contactPhone: '(864) 555-4321',
    },
    needByDate: '2024-12-30',
    allowPartialShipment: true,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    manufacturerOrderStatus: 'PARTIAL',
    hasBackorderItems: true,
    lineItems: [
      {
        id: 'FOLI-007a',
        fulfillmentOrderId: 'FO-007',
        orderLineItemId: 'OLI-007a',
        productId: 'PC-2',
        productName: 'Twist-lock Photocell with receptacle',
        partNumber: 'PC-2',
        uom: 'EA',
        orderedQty: 50,
        allocatedQty: 50,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bin D',
        createdAt: '2024-12-14T11:00:00Z',
        updatedAt: '2024-12-14T11:00:00Z',
      },
      {
        id: 'FOLI-007b',
        fulfillmentOrderId: 'FO-007',
        orderLineItemId: 'OLI-007b',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        uom: 'EA',
        orderedQty: 0, // Reduced to 0 for warehouse
        allocatedQty: 0,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bin A',
        createdAt: '2024-12-14T11:00:00Z',
        updatedAt: '2024-12-14T14:00:00Z',
      },
      {
        id: 'FOLI-007b-MFR',
        fulfillmentOrderId: 'FO-007',
        orderLineItemId: 'OLI-007b',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        uom: 'EA',
        orderedQty: 150,
        allocatedQty: 0,
        shippedQty: 0,
        backorderQty: 150,
        fulfilledByManufacturer: true,
        manufacturerFulfillmentStatus: 'PENDING_MANUFACTURER',
        manufacturerId: 'CO-012',
        manufacturerName: 'Legrand North America',
        createdAt: '2024-12-14T14:00:00Z',
        updatedAt: '2024-12-14T14:00:00Z',
      },
    ],
    notes: 'DEMO ORDER: This order shows a split fulfillment - some items from warehouse, some from manufacturer.',
    createdAt: '2024-12-14T11:00:00Z',
    updatedAt: '2024-12-14T14:00:00Z',
    createdBy: 'System Demo',
  },
  // Additional orders with backorders for Legrand items
  {
    id: 'FO-008',
    fulfillmentOrderNumber: 'FO-2024-008',
    orderId: 'ORD-2024-008',
    orderNumber: 'SO-2024-008',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Graybar Electric - Savannah',
      addressLine1: '1500 Industrial Ave',
      city: 'Savannah',
      state: 'GA',
      postalCode: '31401',
      country: 'USA',
      contactPhone: '(912) 555-4321',
    },
    needByDate: '2024-12-28',
    allowPartialShipment: true,
    releasedAt: '2024-12-20T10:00:00Z',
    releasedBy: 'John Smith',
    shipStatus: 'NOT_SHIPPED',
    status: 'RELEASED' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-008a',
        fulfillmentOrderId: 'FO-008',
        orderLineItemId: 'OLI-008a',
        productId: 'ALF-DRV-480',
        productName: 'LED Driver 480V, Programmable',
        partNumber: 'ALF-DRV-480',
        uom: 'EA',
        orderedQty: 15,
        allocatedQty: 8,
        shippedQty: 0,
        backorderQty: 7,
        shortReason: 'Low inventory - reorder needed',
        pickLocation: 'Shelf 2B, Bin C',
        createdAt: '2024-12-20T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
      },
      {
        id: 'FOLI-008b',
        fulfillmentOrderId: 'FO-008',
        orderLineItemId: 'OLI-008b',
        productId: 'ALF-SURGE-20K',
        productName: 'Surge Protector 20kA, Outdoor Rated',
        partNumber: 'ALF-SURGE-20K',
        uom: 'EA',
        orderedQty: 10,
        allocatedQty: 3,
        shippedQty: 0,
        backorderQty: 7,
        shortReason: 'Critical low stock',
        pickLocation: 'Shelf 2B, Bin D',
        createdAt: '2024-12-20T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
      },
    ],
    createdAt: '2024-12-20T09:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'FO-009',
    fulfillmentOrderNumber: 'FO-2024-009',
    orderId: 'ORD-2024-009',
    orderNumber: 'SO-2024-009',
    customerId: 'CO-006',
    customerName: 'Summit Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Summit Electric - Raleigh',
      addressLine1: '800 Commerce Way',
      city: 'Raleigh',
      state: 'NC',
      postalCode: '27601',
      country: 'USA',
      contactPhone: '(919) 555-8765',
    },
    needByDate: '2024-12-30',
    allowPartialShipment: false,
    releasedAt: '2024-12-21T08:00:00Z',
    releasedBy: 'Sarah Williams',
    shipStatus: 'NOT_SHIPPED',
    status: 'RELEASED' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-009a',
        fulfillmentOrderId: 'FO-009',
        orderLineItemId: 'OLI-009a',
        productId: 'ALF-DIMMER-0-10V',
        productName: '0-10V Dimming Module',
        partNumber: 'ALF-DIMMER-0-10V',
        uom: 'EA',
        orderedQty: 20,
        allocatedQty: 0,
        shippedQty: 0,
        backorderQty: 20,
        shortReason: 'Out of stock - in transit from vendor',
        pickLocation: 'Shelf 3A, Bin A',
        createdAt: '2024-12-21T08:00:00Z',
        updatedAt: '2024-12-21T08:00:00Z',
      },
      {
        id: 'FOLI-009b',
        fulfillmentOrderId: 'FO-009',
        orderLineItemId: 'OLI-009b',
        productId: 'MS-DCE-09-L7-W',
        productName: 'Motion Sensor, DC, Fixture External',
        partNumber: 'MS-DCE-09-L7-W',
        uom: 'EA',
        orderedQty: 25,
        allocatedQty: 20,
        shippedQty: 0,
        backorderQty: 5,
        shortReason: 'Partial allocation - low stock',
        pickLocation: 'Shelf 2A, Bin B',
        createdAt: '2024-12-21T08:00:00Z',
        updatedAt: '2024-12-21T08:00:00Z',
      },
    ],
    createdAt: '2024-12-21T07:30:00Z',
    updatedAt: '2024-12-21T08:00:00Z',
    createdBy: 'Sarah Williams',
  },
  // Additional orders for scrollable demo
  {
    id: 'FO-010',
    fulfillmentOrderNumber: 'FO-2024-010',
    orderId: 'ORD-2024-010',
    orderNumber: 'SO-2024-010',
    customerId: 'CO-015',
    customerName: 'Metro Electrical Supply',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Metro Electrical Supply - Main',
      addressLine1: '2200 Commerce Drive',
      city: 'Birmingham',
      state: 'AL',
      postalCode: '35203',
      country: 'USA',
      contactPhone: '(205) 555-3421',
    },
    needByDate: '2024-12-26',
    allowPartialShipment: true,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-010a',
        fulfillmentOrderId: 'FO-010',
        orderLineItemId: 'OLI-010a',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        uom: 'EA',
        orderedQty: 30,
        allocatedQty: 30,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bin A',
        createdAt: '2024-12-22T09:00:00Z',
        updatedAt: '2024-12-22T09:00:00Z',
      },
    ],
    createdAt: '2024-12-22T09:00:00Z',
    updatedAt: '2024-12-22T09:00:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'FO-011',
    fulfillmentOrderNumber: 'FO-2024-011',
    orderId: 'ORD-2024-011',
    orderNumber: 'SO-2024-011',
    customerId: 'CO-016',
    customerName: 'Delta Lighting Solutions',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Delta Lighting - Nashville',
      addressLine1: '450 Music Row',
      city: 'Nashville',
      state: 'TN',
      postalCode: '37203',
      country: 'USA',
      contactPhone: '(615) 555-7890',
    },
    needByDate: '2024-12-27',
    allowPartialShipment: false,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    hasBackorderItems: true,
    lineItems: [
      {
        id: 'FOLI-011a',
        fulfillmentOrderId: 'FO-011',
        orderLineItemId: 'OLI-011a',
        productId: 'PC-2',
        productName: 'Twist-lock Photocell with receptacle',
        partNumber: 'PC-2',
        uom: 'EA',
        orderedQty: 100,
        allocatedQty: 65,
        shippedQty: 0,
        backorderQty: 35,
        shortReason: 'Partial stock available',
        pickLocation: 'Shelf 1A, Bin D',
        createdAt: '2024-12-22T10:30:00Z',
        updatedAt: '2024-12-22T10:30:00Z',
      },
      {
        id: 'FOLI-011b',
        fulfillmentOrderId: 'FO-011',
        orderLineItemId: 'OLI-011b',
        productId: 'ALF-ASR',
        productName: 'Adjustable Square & Round Pole Mounting',
        partNumber: 'ALF-ASR',
        uom: 'EA',
        orderedQty: 50,
        allocatedQty: 50,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bin C',
        createdAt: '2024-12-22T10:30:00Z',
        updatedAt: '2024-12-22T10:30:00Z',
      },
    ],
    createdAt: '2024-12-22T10:30:00Z',
    updatedAt: '2024-12-22T10:30:00Z',
    createdBy: 'Sarah Williams',
  },
  {
    id: 'FO-012',
    fulfillmentOrderNumber: 'FO-2024-012',
    orderId: 'ORD-2024-012',
    orderNumber: 'SO-2024-012',
    customerId: 'CO-017',
    customerName: 'Southeast Power & Light',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'WILL_CALL',
    shipTo: {
      name: 'Southeast P&L - Will Call',
      addressLine1: '1000 Warehouse Way',
      city: 'Atlanta',
      state: 'GA',
      postalCode: '30318',
      country: 'USA',
      contactPhone: '(404) 555-2345',
    },
    needByDate: '2024-12-24',
    allowPartialShipment: true,
    shipStatus: 'NOT_SHIPPED',
    status: 'RELEASED' as FulfillmentOrderStatus,
    releasedAt: '2024-12-22T14:00:00Z',
    releasedBy: 'John Smith',
    lineItems: [
      {
        id: 'FOLI-012a',
        fulfillmentOrderId: 'FO-012',
        orderLineItemId: 'OLI-012a',
        productId: 'MS-DCE-09-L7-W',
        productName: 'Motion Sensor, DC, Fixture External',
        partNumber: 'MS-DCE-09-L7-W',
        uom: 'EA',
        orderedQty: 40,
        allocatedQty: 40,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bay-01, Row 2, Bin A',
        createdAt: '2024-12-22T14:00:00Z',
        updatedAt: '2024-12-22T14:00:00Z',
      },
    ],
    createdAt: '2024-12-22T13:00:00Z',
    updatedAt: '2024-12-22T14:00:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'FO-013',
    fulfillmentOrderNumber: 'FO-2024-013',
    orderId: 'ORD-2024-013',
    orderNumber: 'SO-2024-013',
    customerId: 'CO-006',
    customerName: 'Summit Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Summit Electric - Columbia',
      addressLine1: '3300 Assembly Street',
      city: 'Columbia',
      state: 'SC',
      postalCode: '29201',
      country: 'USA',
      contactPhone: '(803) 555-6543',
    },
    needByDate: '2024-12-29',
    allowPartialShipment: true,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    hasBackorderItems: true,
    lineItems: [
      {
        id: 'FOLI-013a',
        fulfillmentOrderId: 'FO-013',
        orderLineItemId: 'OLI-013a',
        productId: 'ALF-DRV-480',
        productName: 'LED Driver 480V, Programmable',
        partNumber: 'ALF-DRV-480',
        uom: 'EA',
        orderedQty: 25,
        allocatedQty: 10,
        shippedQty: 0,
        backorderQty: 15,
        shortReason: 'Limited inventory',
        pickLocation: 'Shelf 2B, Bin C',
        createdAt: '2024-12-23T08:00:00Z',
        updatedAt: '2024-12-23T08:00:00Z',
      },
      {
        id: 'FOLI-013b',
        fulfillmentOrderId: 'FO-013',
        orderLineItemId: 'OLI-013b',
        productId: 'ALF-SURGE-20K',
        productName: 'Surge Protector 20kA, Outdoor Rated',
        partNumber: 'ALF-SURGE-20K',
        uom: 'EA',
        orderedQty: 12,
        allocatedQty: 0,
        shippedQty: 0,
        backorderQty: 12,
        shortReason: 'Out of stock',
        pickLocation: 'Shelf 2B, Bin D',
        createdAt: '2024-12-23T08:00:00Z',
        updatedAt: '2024-12-23T08:00:00Z',
      },
    ],
    createdAt: '2024-12-23T08:00:00Z',
    updatedAt: '2024-12-23T08:00:00Z',
    createdBy: 'Sarah Williams',
  },
  {
    id: 'FO-014',
    fulfillmentOrderNumber: 'FO-2024-014',
    orderId: 'ORD-2024-014',
    orderNumber: 'SO-2024-014',
    customerId: 'CO-011',
    customerName: 'Graybar Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Graybar Electric - Macon',
      addressLine1: '4100 Riverside Drive',
      city: 'Macon',
      state: 'GA',
      postalCode: '31210',
      country: 'USA',
      contactPhone: '(478) 555-9876',
    },
    needByDate: '2024-12-30',
    allowPartialShipment: false,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-014a',
        fulfillmentOrderId: 'FO-014',
        orderLineItemId: 'OLI-014a',
        productId: 'ALF-DIMMER-0-10V',
        productName: '0-10V Dimming Module',
        partNumber: 'ALF-DIMMER-0-10V',
        uom: 'EA',
        orderedQty: 60,
        allocatedQty: 60,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 3A, Bin A',
        createdAt: '2024-12-23T11:00:00Z',
        updatedAt: '2024-12-23T11:00:00Z',
      },
    ],
    createdAt: '2024-12-23T11:00:00Z',
    updatedAt: '2024-12-23T11:00:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'FO-015',
    fulfillmentOrderNumber: 'FO-2024-015',
    orderId: 'ORD-2024-015',
    orderNumber: 'SO-2024-015',
    customerId: 'CO-018',
    customerName: 'Coastal Electric Co',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Coastal Electric - Jacksonville',
      addressLine1: '5500 Beach Blvd',
      city: 'Jacksonville',
      state: 'FL',
      postalCode: '32207',
      country: 'USA',
      contactPhone: '(904) 555-1122',
    },
    needByDate: '2024-12-31',
    allowPartialShipment: true,
    shipStatus: 'NOT_SHIPPED',
    status: 'RELEASED' as FulfillmentOrderStatus,
    releasedAt: '2024-12-23T15:00:00Z',
    releasedBy: 'Sarah Williams',
    hasBackorderItems: true,
    lineItems: [
      {
        id: 'FOLI-015a',
        fulfillmentOrderId: 'FO-015',
        orderLineItemId: 'OLI-015a',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
        uom: 'EA',
        orderedQty: 80,
        allocatedQty: 55,
        shippedQty: 0,
        backorderQty: 25,
        shortReason: 'Partial availability',
        pickLocation: 'Shelf 1A, Bin A',
        createdAt: '2024-12-23T15:00:00Z',
        updatedAt: '2024-12-23T15:00:00Z',
      },
      {
        id: 'FOLI-015b',
        fulfillmentOrderId: 'FO-015',
        orderLineItemId: 'OLI-015b',
        productId: 'PC-2',
        productName: 'Twist-lock Photocell with receptacle',
        partNumber: 'PC-2',
        uom: 'EA',
        orderedQty: 80,
        allocatedQty: 80,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bin D',
        createdAt: '2024-12-23T15:00:00Z',
        updatedAt: '2024-12-23T15:00:00Z',
      },
    ],
    createdAt: '2024-12-23T14:30:00Z',
    updatedAt: '2024-12-23T15:00:00Z',
    createdBy: 'Sarah Williams',
  },
  {
    id: 'FO-016',
    fulfillmentOrderNumber: 'FO-2024-016',
    orderId: 'ORD-2024-016',
    orderNumber: 'SO-2024-016',
    customerId: 'CO-019',
    customerName: 'Piedmont Electrical',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    fulfillmentMethod: 'SHIP',
    shipTo: {
      name: 'Piedmont Electrical - Charlotte',
      addressLine1: '6700 South Blvd',
      city: 'Charlotte',
      state: 'NC',
      postalCode: '28217',
      country: 'USA',
      contactPhone: '(704) 555-8899',
    },
    needByDate: '2025-01-02',
    allowPartialShipment: true,
    shipStatus: 'NOT_SHIPPED',
    status: 'PENDING' as FulfillmentOrderStatus,
    lineItems: [
      {
        id: 'FOLI-016a',
        fulfillmentOrderId: 'FO-016',
        orderLineItemId: 'OLI-016a',
        productId: 'ALF-ASR',
        productName: 'Adjustable Square & Round Pole Mounting',
        partNumber: 'ALF-ASR',
        uom: 'EA',
        orderedQty: 100,
        allocatedQty: 100,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bin C',
        createdAt: '2024-12-24T09:00:00Z',
        updatedAt: '2024-12-24T09:00:00Z',
      },
      {
        id: 'FOLI-016b',
        fulfillmentOrderId: 'FO-016',
        orderLineItemId: 'OLI-016b',
        productId: 'MS-DCE-09-L7-W',
        productName: 'Motion Sensor, DC, Fixture External',
        partNumber: 'MS-DCE-09-L7-W',
        uom: 'EA',
        orderedQty: 75,
        allocatedQty: 75,
        shippedQty: 0,
        backorderQty: 0,
        pickLocation: 'Shelf 1A, Bay-01, Row 2, Bin A',
        createdAt: '2024-12-24T09:00:00Z',
        updatedAt: '2024-12-24T09:00:00Z',
      },
    ],
    createdAt: '2024-12-24T09:00:00Z',
    updatedAt: '2024-12-24T09:00:00Z',
    createdBy: 'John Smith',
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

// Add a user assignment to a fulfillment order
export function addFulfillmentOrderAssignment(
  fulfillmentOrderId: string,
  userId: string,
  role: AssignedUserRole,
  assignedBy?: string
): FulfillmentOrder | undefined {
  const order = getFulfillmentOrderById(fulfillmentOrderId);
  if (!order) return undefined;

  const user = mockWarehouseUsers.find(u => u.id === userId);
  if (!user) return undefined;

  const newAssignment: AssignedUser = {
    id: `assign-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role,
    assignedAt: new Date().toISOString(),
    assignedBy,
  };

  if (role === 'manager') {
    const currentManagers = order.assignedManagers || [];
    // Don't add if already assigned
    if (currentManagers.some(m => m.userId === userId)) return order;
    return updateFulfillmentOrder(fulfillmentOrderId, {
      assignedManagers: [...currentManagers, newAssignment],
    });
  } else if (role === 'inside_sales') {
    const currentInsideSales = order.assignedInsideSales || [];
    // Don't add if already assigned
    if (currentInsideSales.some(s => s.userId === userId)) return order;
    return updateFulfillmentOrder(fulfillmentOrderId, {
      assignedInsideSales: [...currentInsideSales, newAssignment],
    });
  } else {
    const currentWorkers = order.assignedWorkers || [];
    // Don't add if already assigned
    if (currentWorkers.some(w => w.userId === userId)) return order;
    return updateFulfillmentOrder(fulfillmentOrderId, {
      assignedWorkers: [...currentWorkers, newAssignment],
    });
  }
}

// Remove a user assignment from a fulfillment order
export function removeFulfillmentOrderAssignment(
  fulfillmentOrderId: string,
  assignmentId: string,
  role: AssignedUserRole
): FulfillmentOrder | undefined {
  const order = getFulfillmentOrderById(fulfillmentOrderId);
  if (!order) return undefined;

  if (role === 'manager') {
    const updatedManagers = (order.assignedManagers || []).filter(m => m.id !== assignmentId);
    return updateFulfillmentOrder(fulfillmentOrderId, {
      assignedManagers: updatedManagers,
    });
  } else if (role === 'inside_sales') {
    const updatedInsideSales = (order.assignedInsideSales || []).filter(s => s.id !== assignmentId);
    return updateFulfillmentOrder(fulfillmentOrderId, {
      assignedInsideSales: updatedInsideSales,
    });
  } else {
    const updatedWorkers = (order.assignedWorkers || []).filter(w => w.id !== assignmentId);
    return updateFulfillmentOrder(fulfillmentOrderId, {
      assignedWorkers: updatedWorkers,
    });
  }
}

// -----------------------------------------------------------------------------
// Backorder Helper Functions
// -----------------------------------------------------------------------------

export interface BackorderItem {
  lineItem: FulfillmentOrderLineItem;
  inventoryOnHand: number;
  manufacturerName: string;
  manufacturerId: string;
}

// Check if a fulfillment order has backorder items (inventory < ordered)
// Backorder = Ordered - On Hand (positive number showing the shortage)
export function getBackorderItems(fulfillmentOrderId: string): BackorderItem[] {
  const fo = getFulfillmentOrderById(fulfillmentOrderId);
  if (!fo) return [];

  const backorderItems: BackorderItem[] = [];

  for (const lineItem of fo.lineItems) {
    // Skip items already marked as fulfilled by manufacturer
    if (lineItem.fulfilledByManufacturer) continue;

    // Find the inventory for this product
    const inv = mockInventory.find(i => i.productId === lineItem.productId);
    const inventoryOnHand = inv?.availableQuantity || 0;

    // Check if we have a backorder situation: ordered > inventory on hand
    if (lineItem.orderedQty > inventoryOnHand) {
      // Backorder qty = Ordered - On Hand (the shortage amount)
      const backorderQty = lineItem.orderedQty - inventoryOnHand;

      backorderItems.push({
        lineItem: {
          ...lineItem,
          backorderQty, // Calculate: Ordered - On Hand
        },
        inventoryOnHand,
        manufacturerName: inv?.factoryName || 'Unknown Manufacturer',
        manufacturerId: inv?.factoryId || 'unknown',
      });
    }
  }

  return backorderItems;
}

// Get draft/pending shipment requests for a manufacturer
export function getPendingShipmentRequestsForManufacturer(manufacturerId: string): ShipmentRequest[] {
  return mockShipmentRequests.filter(
    req => req.vendorId === manufacturerId && (req.status === 'DRAFT' || req.status === 'PENDING')
  );
}

// Mark line items as fulfilled by manufacturer (Option 1)
export function markAsManufacturerFulfilled(
  fulfillmentOrderId: string,
  lineItemIds: string[]
): FulfillmentOrder | undefined {
  const fo = getFulfillmentOrderById(fulfillmentOrderId);
  if (!fo) return undefined;

  const updatedLineItems = fo.lineItems.map(li => {
    if (lineItemIds.includes(li.id)) {
      const inv = mockInventory.find(i => i.productId === li.productId);
      return {
        ...li,
        fulfilledByManufacturer: true,
        manufacturerFulfillmentStatus: 'PENDING_MANUFACTURER' as const,
        manufacturerId: inv?.factoryId,
        manufacturerName: inv?.factoryName,
        // Adjust quantities - move ordered qty to manufacturer, zero out warehouse allocation
        allocatedQty: 0,
        backorderQty: li.orderedQty,
      };
    }
    return li;
  });

  return updateFulfillmentOrder(fulfillmentOrderId, {
    lineItems: updatedLineItems,
    manufacturerOrderStatus: lineItemIds.length === fo.lineItems.length ? 'FULL' : 'PARTIAL',
    hasBackorderItems: true,
  });
}

// Split line items between warehouse and manufacturer (Option 3)
export function splitLineItemForManufacturer(
  fulfillmentOrderId: string,
  lineItemId: string,
  warehouseQty: number,
  manufacturerQty: number
): FulfillmentOrder | undefined {
  const fo = getFulfillmentOrderById(fulfillmentOrderId);
  if (!fo) return undefined;

  const originalLineItem = fo.lineItems.find(li => li.id === lineItemId);
  if (!originalLineItem) return undefined;

  const inv = mockInventory.find(i => i.productId === originalLineItem.productId);

  // Update original line item with warehouse qty
  const updatedLineItems = fo.lineItems.map(li => {
    if (li.id === lineItemId) {
      return {
        ...li,
        orderedQty: warehouseQty,
        allocatedQty: warehouseQty,
        backorderQty: 0,
      };
    }
    return li;
  });

  // Add new line item for manufacturer fulfillment
  if (manufacturerQty > 0) {
    const newLineItem: FulfillmentOrderLineItem = {
      ...originalLineItem,
      id: `${lineItemId}-MFR`,
      orderedQty: manufacturerQty,
      allocatedQty: 0,
      shippedQty: 0,
      backorderQty: manufacturerQty,
      fulfilledByManufacturer: true,
      manufacturerFulfillmentStatus: 'PENDING_MANUFACTURER',
      manufacturerId: inv?.factoryId,
      manufacturerName: inv?.factoryName,
    };
    updatedLineItems.push(newLineItem);
  }

  return updateFulfillmentOrder(fulfillmentOrderId, {
    lineItems: updatedLineItems,
    manufacturerOrderStatus: 'PARTIAL',
    hasBackorderItems: manufacturerQty > 0,
  });
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
    assignedManagers: [
      {
        id: 'AM-003',
        userId: 'user-mgr-001',
        userName: 'Sarah Johnson',
        userEmail: 'sarah.johnson@flowcrm.com',
        role: 'manager',
        assignedAt: '2024-12-05T10:00:00Z',
        assignedBy: 'System',
      },
    ],
    assignedWorkers: [
      {
        id: 'AW-004',
        userId: 'user-wkr-004',
        userName: 'Tony Martinez',
        userEmail: 'tony.martinez@flowcrm.com',
        role: 'worker',
        assignedAt: '2024-12-05T10:30:00Z',
        assignedBy: 'Sarah Johnson',
      },
    ],
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
    assignedManagers: [
      {
        id: 'AM-004',
        userId: 'user-mgr-002',
        userName: 'David Park',
        userEmail: 'david.park@flowcrm.com',
        role: 'manager',
        assignedAt: '2024-12-08T10:00:00Z',
        assignedBy: 'System',
      },
    ],
    assignedWorkers: [
      {
        id: 'AW-005',
        userId: 'user-wkr-001',
        userName: 'Mike Chen',
        userEmail: 'mike.chen@flowcrm.com',
        role: 'worker',
        assignedAt: '2024-12-08T10:15:00Z',
        assignedBy: 'David Park',
      },
      {
        id: 'AW-006',
        userId: 'user-wkr-003',
        userName: 'James Wilson',
        userEmail: 'james.wilson@flowcrm.com',
        role: 'worker',
        assignedAt: '2024-12-08T10:15:00Z',
        assignedBy: 'David Park',
      },
    ],
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
  {
    id: 'SHIP-004',
    poNumber: 'PO-2024-790',
    vendorId: 'CO-004',
    vendorName: 'Johnson Controls',
    vendorContact: 'Sarah Supplier',
    vendorEmail: 'ssupplier@jci.com',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    eta: '2024-12-28T10:00:00Z',
    status: 'DRAFT' as ShipmentStatus,
    expectedItems: [
      { id: 'EI-005', productId: 'ALF-LS400-T3-G1-FSK-PSC-ASR', productName: 'ALF Flexible Area Light, 40000Lm', partNumber: 'ALF LS400', expectedQuantity: 50, receivedQuantity: 0, status: 'pending' },
      { id: 'EI-006', productId: 'PC-2', productName: 'Twist-lock Photocell', partNumber: 'PC-2', expectedQuantity: 75, receivedQuantity: 0, status: 'pending' },
    ],
    items: [
      { id: 'SLI-005', productId: 'ALF-LS400-T3-G1-FSK-PSC-ASR', productName: 'ALF Flexible Area Light, 40000Lm', partNumber: 'ALF LS400', expectedQuantity: 50, receivedQuantity: 0 },
      { id: 'SLI-006', productId: 'PC-2', productName: 'Twist-lock Photocell', partNumber: 'PC-2', expectedQuantity: 75, receivedQuantity: 0 },
    ],
    itemCount: 2,
    expectedQuantity: 125,
    createdAt: '2024-12-20T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z',
    notes: 'Awaiting vendor confirmation on pricing',
  },
  {
    id: 'SHIP-005',
    poNumber: 'PO-2024-791',
    vendorId: 'CO-012',
    vendorName: 'Legrand North America',
    vendorContact: 'John Vendor',
    vendorEmail: 'jvendor@legrand.com',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    eta: '2025-01-05T10:00:00Z',
    status: 'DRAFT' as ShipmentStatus,
    expectedItems: [
      { id: 'EI-007', productId: 'MS-DCE-09-L7-W', productName: 'Motion Sensor, DC', partNumber: 'MS-DCE-09-L7-W', expectedQuantity: 200, receivedQuantity: 0, status: 'pending' },
    ],
    items: [
      { id: 'SLI-007', productId: 'MS-DCE-09-L7-W', productName: 'Motion Sensor, DC', partNumber: 'MS-DCE-09-L7-W', expectedQuantity: 200, receivedQuantity: 0 },
    ],
    itemCount: 1,
    expectedQuantity: 200,
    createdAt: '2024-12-22T14:30:00Z',
    updatedAt: '2024-12-22T14:30:00Z',
    notes: 'Q1 restock - needs manager approval',
  },
  {
    id: 'SHIP-006',
    poNumber: 'PO-2024-792',
    vendorId: 'CO-006',
    vendorName: 'Summit Electric',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    eta: '2025-01-10T10:00:00Z',
    status: 'DRAFT' as ShipmentStatus,
    expectedItems: [
      { id: 'EI-008', productId: 'ALF-ASR', productName: 'Adjustable Square & Round Pole Mounting', partNumber: 'ALF-ASR', expectedQuantity: 100, receivedQuantity: 0, status: 'pending' },
      { id: 'EI-009', productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR', productName: 'ALF Flexible Area Light, 60000Lm', partNumber: 'ALF LS600', expectedQuantity: 25, receivedQuantity: 0, status: 'pending' },
      { id: 'EI-010', productId: 'PC-2', productName: 'Twist-lock Photocell', partNumber: 'PC-2', expectedQuantity: 50, receivedQuantity: 0, status: 'pending' },
    ],
    items: [
      { id: 'SLI-008', productId: 'ALF-ASR', productName: 'Adjustable Square & Round Pole Mounting', partNumber: 'ALF-ASR', expectedQuantity: 100, receivedQuantity: 0 },
      { id: 'SLI-009', productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR', productName: 'ALF Flexible Area Light, 60000Lm', partNumber: 'ALF LS600', expectedQuantity: 25, receivedQuantity: 0 },
      { id: 'SLI-010', productId: 'PC-2', productName: 'Twist-lock Photocell', partNumber: 'PC-2', expectedQuantity: 50, receivedQuantity: 0 },
    ],
    itemCount: 3,
    expectedQuantity: 175,
    createdAt: '2024-12-24T09:00:00Z',
    updatedAt: '2024-12-24T09:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// Mock Delivery Issues
// -----------------------------------------------------------------------------

export const mockDeliveryIssues: DeliveryIssue[] = [
  {
    id: 'DI-001',
    issueNumber: 'DI-2024-001',
    shipmentId: 'SHIP-001',
    poNumber: 'PO-2024-782',
    vendorId: 'CO-012',
    vendorName: 'Legrand North America',
    vendorEmail: 'jvendor@legrand.com',
    vendorContact: 'John Vendor',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    status: 'OPEN' as DeliveryIssueStatus,
    items: [
      {
        id: 'DII-001',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600',
        issueType: 'DAMAGED' as DeliveryIssueType,
        quantity: 5,
        description: 'Box crushed during shipping, visible damage to fixtures',
      },
      {
        id: 'DII-002',
        productId: 'ALF-ASR',
        productName: 'Adjustable Square & Round Pole Mounting',
        partNumber: 'ALF-ASR',
        issueType: 'MISSING' as DeliveryIssueType,
        quantity: 10,
        description: 'Short shipped - only received 190 of 200 expected',
      },
    ],
    totalAffectedQuantity: 15,
    reportedAt: '2024-12-15T14:30:00Z',
    reportedBy: 'Sarah Johnson',
    createdAt: '2024-12-15T14:30:00Z',
    updatedAt: '2024-12-15T14:30:00Z',
    notes: 'Photos taken and uploaded to vendor portal',
  },
  {
    id: 'DI-002',
    issueNumber: 'DI-2024-002',
    shipmentId: 'SHIP-002',
    poNumber: 'PO-2024-783',
    vendorId: 'CO-004',
    vendorName: 'Johnson Controls',
    vendorEmail: 'ssupplier@jci.com',
    vendorContact: 'Sarah Supplier',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    status: 'COMMUNICATED' as DeliveryIssueStatus,
    items: [
      {
        id: 'DII-003',
        productId: 'PC-2',
        productName: 'Twist-lock Photocell',
        partNumber: 'PC-2',
        issueType: 'WRONG_ITEM' as DeliveryIssueType,
        quantity: 25,
        description: 'Received 277V version instead of 480V',
      },
    ],
    totalAffectedQuantity: 25,
    communicatedAt: '2024-12-19T10:00:00Z',
    communicatedBy: 'David Park',
    communicationMethod: 'EMAIL',
    communicationNotes: 'Email sent to vendor with photos and order details. Ref #JCI-2024-1219',
    reportedAt: '2024-12-18T16:00:00Z',
    reportedBy: 'Mike Chen',
    createdAt: '2024-12-18T16:00:00Z',
    updatedAt: '2024-12-19T10:00:00Z',
    notes: 'Awaiting vendor response for replacement shipment',
  },
  {
    id: 'DI-003',
    issueNumber: 'DI-2024-003',
    shipmentId: 'SHIP-003',
    poNumber: 'PO-2024-785',
    vendorId: 'CO-012',
    vendorName: 'Legrand North America',
    vendorEmail: 'jvendor@legrand.com',
    vendorContact: 'John Vendor',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    status: 'RESOLVED' as DeliveryIssueStatus,
    items: [
      {
        id: 'DII-004',
        productId: 'MS-DCE-09-L7-W',
        productName: 'Motion Sensor, DC',
        partNumber: 'MS-DCE-09-L7-W',
        issueType: 'OVERAGE' as DeliveryIssueType,
        quantity: 12,
        description: 'Received 112 units instead of expected 100',
      },
    ],
    totalAffectedQuantity: 12,
    communicatedAt: '2024-12-21T09:00:00Z',
    communicatedBy: 'Sarah Johnson',
    communicationMethod: 'EMAIL',
    communicationNotes: 'Vendor confirmed overage, will deduct from next order',
    resolvedAt: '2024-12-22T11:00:00Z',
    resolvedBy: 'Sarah Johnson',
    resolutionType: 'CREDIT',
    resolutionNotes: 'Vendor will apply credit of $276.00 to next invoice',
    creditAmount: 276.00,
    reportedAt: '2024-12-20T15:00:00Z',
    reportedBy: 'James Wilson',
    createdAt: '2024-12-20T15:00:00Z',
    updatedAt: '2024-12-22T11:00:00Z',
    activities: [
      {
        id: 'ACT-001',
        type: 'CREATED',
        timestamp: '2024-12-20T15:00:00Z',
        createdBy: 'James Wilson',
        content: 'Delivery issue reported: Received 112 units instead of expected 100',
      },
      {
        id: 'ACT-002',
        type: 'COMMUNICATED',
        timestamp: '2024-12-21T09:00:00Z',
        createdBy: 'Sarah Johnson',
        content: 'Vendor confirmed overage, will deduct from next order',
        metadata: { method: 'EMAIL' },
      },
      {
        id: 'ACT-003',
        type: 'NOTE_ADDED',
        timestamp: '2024-12-21T14:30:00Z',
        createdBy: 'Sarah Johnson',
        content: 'Vendor contact confirmed receipt of our email. They will process the credit within 5 business days.',
      },
      {
        id: 'ACT-004',
        type: 'RESOLVED',
        timestamp: '2024-12-22T11:00:00Z',
        createdBy: 'Sarah Johnson',
        content: 'Vendor will apply credit of $276.00 to next invoice',
        metadata: { resolutionType: 'CREDIT', creditAmount: 276.00 },
      },
    ],
  },
  {
    id: 'DI-004',
    issueNumber: 'DI-2024-004',
    shipmentId: 'SHIP-001',
    poNumber: 'PO-2024-782',
    vendorId: 'CO-012',
    vendorName: 'Legrand North America',
    vendorEmail: 'jvendor@legrand.com',
    vendorContact: 'John Vendor',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    status: 'CLOSED' as DeliveryIssueStatus,
    items: [
      {
        id: 'DII-005',
        productId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600',
        issueType: 'DAMAGED' as DeliveryIssueType,
        quantity: 2,
        description: 'Minor cosmetic damage to packaging',
      },
    ],
    totalAffectedQuantity: 2,
    communicatedAt: '2024-12-10T09:00:00Z',
    communicatedBy: 'Sarah Johnson',
    communicationMethod: 'PHONE',
    communicationNotes: 'Called vendor, they agreed to accept return',
    resolvedAt: '2024-12-12T14:00:00Z',
    resolvedBy: 'Sarah Johnson',
    resolutionType: 'REPLACEMENT',
    resolutionNotes: 'Replacement units received on 12/12',
    replacementShipmentId: 'SHIP-REP-001',
    reportedAt: '2024-12-08T10:00:00Z',
    reportedBy: 'Tony Martinez',
    createdAt: '2024-12-08T10:00:00Z',
    updatedAt: '2024-12-12T14:00:00Z',
  },
];

// Helper functions for delivery issues
export function getDeliveryIssuesByWarehouse(warehouseId: string): DeliveryIssue[] {
  return mockDeliveryIssues.filter(di => di.warehouseId === warehouseId);
}

export function getDeliveryIssueById(id: string): DeliveryIssue | undefined {
  return mockDeliveryIssues.find(di => di.id === id);
}

export function getDeliveryIssuesByShipment(shipmentId: string): DeliveryIssue[] {
  return mockDeliveryIssues.filter(di => di.shipmentId === shipmentId);
}

export function updateDeliveryIssue(id: string, updates: Partial<DeliveryIssue>): DeliveryIssue | null {
  const index = mockDeliveryIssues.findIndex(di => di.id === id);
  if (index === -1) return null;

  mockDeliveryIssues[index] = {
    ...mockDeliveryIssues[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return mockDeliveryIssues[index];
}

export function createDeliveryIssue(issue: Omit<DeliveryIssue, 'id' | 'issueNumber' | 'createdAt' | 'updatedAt'>): DeliveryIssue {
  const newIssue: DeliveryIssue = {
    ...issue,
    id: `DI-${Date.now()}`,
    issueNumber: `DI-2024-${String(mockDeliveryIssues.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockDeliveryIssues.push(newIssue);
  return newIssue;
}

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

// Update shipment details
export function updateShipmentDetails(shipmentId: string, updates: Partial<IncomingShipment>): IncomingShipment | undefined {
  const index = mockIncomingShipments.findIndex(s => s.id === shipmentId);
  if (index === -1) return undefined;

  mockIncomingShipments[index] = {
    ...mockIncomingShipments[index],
    ...updates,
    updatedAt: new Date().toISOString(),
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

// Add a user assignment to an incoming shipment
export function addIncomingShipmentAssignment(
  shipmentId: string,
  userId: string,
  role: AssignedUserRole,
  assignedBy?: string
): IncomingShipment | undefined {
  const shipment = getShipmentById(shipmentId);
  if (!shipment) return undefined;

  const user = mockWarehouseUsers.find(u => u.id === userId);
  if (!user) return undefined;

  const newAssignment: AssignedUser = {
    id: `assign-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role,
    assignedAt: new Date().toISOString(),
    assignedBy,
  };

  if (role === 'manager') {
    const currentManagers = shipment.assignedManagers || [];
    // Don't add if already assigned
    if (currentManagers.some(m => m.userId === userId)) return shipment;
    return updateShipmentDetails(shipmentId, {
      assignedManagers: [...currentManagers, newAssignment],
    });
  } else {
    const currentWorkers = shipment.assignedWorkers || [];
    // Don't add if already assigned
    if (currentWorkers.some(w => w.userId === userId)) return shipment;
    return updateShipmentDetails(shipmentId, {
      assignedWorkers: [...currentWorkers, newAssignment],
    });
  }
}

// Remove a user assignment from an incoming shipment
export function removeIncomingShipmentAssignment(
  shipmentId: string,
  assignmentId: string,
  role: AssignedUserRole
): IncomingShipment | undefined {
  const shipment = getShipmentById(shipmentId);
  if (!shipment) return undefined;

  if (role === 'manager') {
    const updatedManagers = (shipment.assignedManagers || []).filter(m => m.id !== assignmentId);
    return updateShipmentDetails(shipmentId, {
      assignedManagers: updatedManagers,
    });
  } else {
    const updatedWorkers = (shipment.assignedWorkers || []).filter(w => w.id !== assignmentId);
    return updateShipmentDetails(shipmentId, {
      assignedWorkers: updatedWorkers,
    });
  }
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
    priority: 'STANDARD',
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
    requestMethod: 'PHONE_CALL',
    status: 'SENT' as ShipmentRequestStatus,
    priority: 'EXPEDITED',
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
    priority: 'URGENT',
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

// Save a draft shipment request
export function saveDraftShipmentRequest(request: Omit<ShipmentRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt' | 'status'>): ShipmentRequest {
  const newRequest: ShipmentRequest = {
    ...request,
    id: `REQ-${String(mockShipmentRequests.length + 1).padStart(3, '0')}`,
    requestNumber: `SR-${new Date().getFullYear()}-${String(mockShipmentRequests.length + 1).padStart(3, '0')}`,
    status: 'DRAFT',
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

// Get shipment requests for a specific manufacturer
export function getShipmentRequestsForManufacturer(manufacturerId: string): ShipmentRequest[] {
  return mockShipmentRequests
    .filter(r => r.vendorId === manufacturerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// -----------------------------------------------------------------------------
// Inventory Functions
// -----------------------------------------------------------------------------

// Get inventory by ID
export function getInventoryById(id: string): Inventory | undefined {
  return mockInventory.find(inv => inv.id === id);
}

// Update inventory item
export function updateInventory(id: string, updates: Partial<Inventory>): Inventory | undefined {
  const index = mockInventory.findIndex(inv => inv.id === id);
  if (index === -1) return undefined;

  mockInventory[index] = {
    ...mockInventory[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return mockInventory[index];
}

// Add overflow location to inventory
export function addOverflowLocation(
  inventoryId: string,
  location: InventoryStorageLocation
): Inventory | undefined {
  const index = mockInventory.findIndex(inv => inv.id === inventoryId);
  if (index === -1) return undefined;

  const existingOverflow = mockInventory[index].overflowLocations || [];
  mockInventory[index] = {
    ...mockInventory[index],
    overflowLocations: [...existingOverflow, location],
    updatedAt: new Date().toISOString(),
  };
  return mockInventory[index];
}

// Remove overflow location from inventory
export function removeOverflowLocation(
  inventoryId: string,
  locationId: string
): Inventory | undefined {
  const index = mockInventory.findIndex(inv => inv.id === inventoryId);
  if (index === -1) return undefined;

  const existingOverflow = mockInventory[index].overflowLocations || [];
  mockInventory[index] = {
    ...mockInventory[index],
    overflowLocations: existingOverflow.filter(loc => loc.id !== locationId),
    updatedAt: new Date().toISOString(),
  };
  return mockInventory[index];
}

// Update primary location
export function updatePrimaryLocation(
  inventoryId: string,
  location: InventoryStorageLocation
): Inventory | undefined {
  const index = mockInventory.findIndex(inv => inv.id === inventoryId);
  if (index === -1) return undefined;

  mockInventory[index] = {
    ...mockInventory[index],
    primaryLocation: location,
    updatedAt: new Date().toISOString(),
  };
  return mockInventory[index];
}

// Get all products from inventory (unique products)
export interface Product {
  id: string;
  name: string;
  partNumber: string;
  description?: string;
  factoryId: string;
  factoryName: string;
}

export function getAllProducts(): Product[] {
  const productsMap = new Map<string, Product>();

  mockInventory.forEach(inv => {
    if (!productsMap.has(inv.productId)) {
      productsMap.set(inv.productId, {
        id: inv.productId,
        name: inv.productName,
        partNumber: inv.partNumber,
        description: inv.description,
        factoryId: inv.factoryId,
        factoryName: inv.factoryName,
      });
    }
  });

  return Array.from(productsMap.values());
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

// Add an activity to a cycle count
export function addCycleCountActivity(
  countId: string,
  type: CycleCountActivityType,
  createdBy: string,
  createdByName: string,
  content?: string,
  metadata?: CycleCountActivity['metadata']
): CycleCount | undefined {
  const index = mockCycleCounts.findIndex(cc => cc.id === countId);
  if (index === -1) return undefined;

  const cycleCount = mockCycleCounts[index];

  if (!cycleCount.activities) {
    cycleCount.activities = [];
  }

  const activity: CycleCountActivity = {
    id: `CCA-${countId}-${cycleCount.activities.length + 1}`,
    cycleCountId: countId,
    type,
    timestamp: new Date().toISOString(),
    createdBy,
    createdByName,
    content,
    metadata,
  };

  cycleCount.activities.push(activity);
  cycleCount.updatedAt = new Date().toISOString();
  mockCycleCounts[index] = cycleCount;

  return cycleCount;
}

// Update line item with inventory issues (like delivery issues)
export function updateCycleCountLineItemWithIssues(
  countId: string,
  lineItemId: string,
  countedQuantity: number,
  issues: CycleCountInventoryIssue[],
  notes?: string,
  countedBy?: string,
  countedByName?: string
): CycleCount | undefined {
  const countIndex = mockCycleCounts.findIndex(cc => cc.id === countId);
  if (countIndex === -1) return undefined;

  const cycleCount = mockCycleCounts[countIndex];
  const lineItemIndex = cycleCount.lineItems.findIndex(li => li.id === lineItemId);
  if (lineItemIndex === -1) return undefined;

  const lineItem = cycleCount.lineItems[lineItemIndex];

  // Update line item
  cycleCount.lineItems[lineItemIndex] = {
    ...lineItem,
    countedQuantity,
    variance: countedQuantity - lineItem.systemQuantity,
    variancePercent: lineItem.systemQuantity > 0
      ? Math.round(((countedQuantity - lineItem.systemQuantity) / lineItem.systemQuantity) * 10000) / 100
      : 0,
    status: 'counted',
    isMatch: countedQuantity === lineItem.systemQuantity && issues.length === 0,
    countedBy: countedBy || 'current-user',
    countedByName: countedByName || 'Current User',
    countedAt: new Date().toISOString(),
    inventoryIssues: issues.length > 0 ? issues : undefined,
    notes,
  };

  // Recalculate stats
  cycleCount.countedItems = cycleCount.lineItems.filter(li =>
    li.status === 'counted' || li.status === 'verified' || li.status === 'adjusted'
  ).length;
  cycleCount.itemsWithVariance = cycleCount.lineItems.filter(li =>
    (li.variance !== undefined && li.variance !== 0) ||
    (li.inventoryIssues && li.inventoryIssues.length > 0)
  ).length;

  // Add activity
  addCycleCountActivity(
    countId,
    issues.length > 0 ? 'DISCREPANCY_REPORTED' : 'ITEM_COUNTED',
    countedBy || 'current-user',
    countedByName || 'Current User',
    issues.length > 0
      ? `Counted ${countedQuantity} (variance: ${countedQuantity - lineItem.systemQuantity}) with ${issues.length} issue(s) reported`
      : `Counted ${countedQuantity} (variance: ${countedQuantity - lineItem.systemQuantity})`,
    {
      lineItemId,
      productName: lineItem.productName,
      partNumber: lineItem.partNumber,
      systemQuantity: lineItem.systemQuantity,
      countedQuantity,
      variance: countedQuantity - lineItem.systemQuantity,
      issues: issues.length > 0 ? issues : undefined,
    }
  );

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
      binId: item.locationId,
      binLocation: item.locationName,
      fullLocationPath: item.locationName,
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
// Auto-generate Cycle Count Functions
// -----------------------------------------------------------------------------

export interface AutoGenerateCycleCountOptions {
  warehouseId: string;
  warehouseName: string;
  triggerType: CycleCountTriggerType;
  excludeRecentlyCountedDays?: number;  // Default 60
  quantityThreshold?: number;           // For LOW_QUANTITY trigger
  manufacturerId?: string;              // For BY_MANUFACTURER trigger
  sampleSize?: number;                  // For RANDOM_A_ITEMS
  createdBy: string;
}

// Get items that haven't been counted in X days
export function getItemsNotRecentlyCounted(excludeDays: number = 60): Inventory[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - excludeDays);

  return mockInventory.filter(inv => {
    if (!inv.lastCycleCountDate) return true;
    return new Date(inv.lastCycleCountDate) < cutoffDate;
  });
}

// Get fast-moving items (based on velocity)
export function getFastMovingItems(): Inventory[] {
  return mockInventory.filter(inv => inv.movementVelocity === 'fast');
}

// Get A-class items
export function getAClassItems(): Inventory[] {
  return mockInventory.filter(inv => inv.abcClass === 'A');
}

// Get items below quantity threshold
export function getItemsBelowThreshold(threshold: number): Inventory[] {
  return mockInventory.filter(inv => inv.totalQuantity < threshold);
}

// Get items by manufacturer
export function getItemsByManufacturer(manufacturerId: string): Inventory[] {
  return mockInventory.filter(inv => inv.factoryId === manufacturerId);
}

// Auto-generate cycle count based on trigger type
export function autoGenerateCycleCount(options: AutoGenerateCycleCountOptions): CycleCount {
  const {
    warehouseId,
    warehouseName,
    triggerType,
    excludeRecentlyCountedDays = 60,
    quantityThreshold,
    manufacturerId,
    sampleSize = 10,
    createdBy,
  } = options;

  let eligibleItems: Inventory[] = [];
  let name = '';
  let description = '';
  let type: CycleCount['type'] = 'PARTIAL';
  let priority: CycleCount['priority'] = 'medium';

  // First, get items not recently counted
  const notRecentlyCounted = getItemsNotRecentlyCounted(excludeRecentlyCountedDays);

  switch (triggerType) {
    case 'FAST_MOVING':
      eligibleItems = getFastMovingItems().filter(inv =>
        notRecentlyCounted.some(nrc => nrc.id === inv.id)
      );
      name = `Fast-Moving Items Count - ${new Date().toLocaleDateString()}`;
      description = 'Auto-generated count of high-velocity items not counted in the last 60 days';
      type = 'PARTIAL';
      priority = 'high';
      break;

    case 'RANDOM_A_ITEMS':
      const aItems = getAClassItems().filter(inv =>
        notRecentlyCounted.some(nrc => nrc.id === inv.id)
      );
      // Randomize and take sample
      eligibleItems = aItems
        .sort(() => Math.random() - 0.5)
        .slice(0, sampleSize);
      name = `Random A-Items Sample - ${new Date().toLocaleDateString()}`;
      description = `Random sample of ${eligibleItems.length} high-value A-class items`;
      type = 'RANDOM';
      priority = 'high';
      break;

    case 'ON_DEMAND':
      // Pick a mix of items that need counting
      eligibleItems = notRecentlyCounted.slice(0, 10);
      name = `On-Demand Count - ${new Date().toLocaleDateString()}`;
      description = 'Quick cycle count for available capacity';
      type = 'PARTIAL';
      priority = 'low';
      break;

    case 'BY_MANUFACTURER':
      if (manufacturerId) {
        eligibleItems = getItemsByManufacturer(manufacturerId).filter(inv =>
          notRecentlyCounted.some(nrc => nrc.id === inv.id)
        );
        const factoryName = eligibleItems[0]?.factoryName || 'Unknown';
        name = `${factoryName} Products Count - ${new Date().toLocaleDateString()}`;
        description = `Count of all ${factoryName} products not counted in the last 60 days`;
      }
      type = 'PRODUCT';
      priority = 'medium';
      break;

    case 'LOW_QUANTITY':
      if (quantityThreshold) {
        eligibleItems = getItemsBelowThreshold(quantityThreshold).filter(inv =>
          notRecentlyCounted.some(nrc => nrc.id === inv.id)
        );
        name = `Low Stock Verification - ${new Date().toLocaleDateString()}`;
        description = `Verification of items below ${quantityThreshold} units`;
      }
      type = 'PARTIAL';
      priority = 'medium';
      break;

    default:
      eligibleItems = notRecentlyCounted;
      name = `Scheduled Count - ${new Date().toLocaleDateString()}`;
      description = 'Regular scheduled inventory verification';
  }

  // Generate line items from eligible inventory
  const lineItems: CycleCountLineItem[] = [];
  eligibleItems.forEach((inv, index) => {
    // Find inventory items for this inventory
    const invItems = mockInventoryItems.filter(ii => ii.inventoryId === inv.id);
    invItems.forEach((item, itemIndex) => {
      lineItems.push({
        id: `CCLI-AUTO-${Date.now()}-${index}-${itemIndex}`,
        cycleCountId: '', // Will be set when cycle count is created
        inventoryItemId: item.id,
        productId: inv.productId,
        productName: inv.productName,
        partNumber: inv.partNumber,
        binId: item.locationId,
        binLocation: item.locationName,
        fullLocationPath: item.locationName,
        lotNumber: item.lotNumber,
        systemQuantity: item.quantity,
        status: 'pending',
        recountRequired: false,
      });
    });
  });

  // Create the cycle count
  const newCycleCount = addCycleCount({
    name,
    description,
    type,
    priority,
    status: 'DRAFT',
    triggerType,
    warehouseId,
    warehouseName,
    scope: {
      products: eligibleItems.map(inv => inv.productId),
      excludeRecentlyCountedDays,
      ...(quantityThreshold && { quantityThreshold }),
    },
    scheduledDate: new Date().toISOString(),
    lineItems,
    totalItems: lineItems.length,
    countedItems: 0,
    itemsWithVariance: 0,
    totalSystemQuantity: lineItems.reduce((sum, li) => sum + li.systemQuantity, 0),
    createdBy,
  });

  // Update line items with the new cycle count ID
  newCycleCount.lineItems = newCycleCount.lineItems.map(li => ({
    ...li,
    cycleCountId: newCycleCount.id,
  }));

  return newCycleCount;
}

// Update last cycle count date for inventory items after count completion
export function updateInventoryLastCycleCountDate(inventoryIds: string[]): void {
  const now = new Date().toISOString();
  inventoryIds.forEach(invId => {
    const index = mockInventory.findIndex(inv => inv.id === invId);
    if (index !== -1) {
      mockInventory[index].lastCycleCountDate = now;
    }
  });
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

// ============================================================================
// Recurring Shipments
// ============================================================================

export const mockRecurringShipments: RecurringShipment[] = [
  {
    id: 'RS-001',
    name: 'Weekly Legrand Restock',
    vendorId: 'CO-012',
    vendorName: 'Legrand North America',
    vendorContact: 'John Vendor',
    vendorEmail: 'jvendor@legrand.com',
    warehouseId: 'WH-001',
    warehouseName: 'Main Distribution Center',
    carrier: 'FedEx Freight',
    expectedItems: [
      {
        id: 'EI-R001-1',
        productId: 'ALF-LS600',
        productName: 'ALF Flexible Area Light, 60000Lm',
        partNumber: 'ALF LS600',
        expectedQuantity: 25,
        receivedQuantity: 0,
        status: 'pending',
      },
      {
        id: 'EI-R001-2',
        productId: 'WMT-LITE',
        productName: 'Wattstopper Multi-Tech Sensor',
        partNumber: 'WMT-LITE',
        expectedQuantity: 50,
        receivedQuantity: 0,
        status: 'pending',
      },
    ],
    notes: 'Regular weekly restock for high-velocity items',
    recurrencePattern: {
      frequency: 'WEEKLY',
      interval: 1,
      dayOfWeek: 'TUESDAY',
    },
    startDate: '2024-01-01',
    status: 'ACTIVE',
    lastGeneratedDate: '2024-12-17',
    nextExpectedDate: '2024-12-24',
    generatedShipmentIds: ['SH-R001-001', 'SH-R001-002', 'SH-R001-003'],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-17T10:00:00Z',
  },
  {
    id: 'RS-002',
    name: 'Monthly JCI First Monday',
    vendorId: 'CO-004',
    vendorName: 'Johnson Controls',
    vendorContact: 'Sarah Supplier',
    vendorEmail: 'ssupplier@jci.com',
    warehouseId: 'WH-001',
    warehouseName: 'Main Distribution Center',
    carrier: 'UPS Freight',
    expectedItems: [
      {
        id: 'EI-R002-1',
        productId: 'JCI-T40',
        productName: 'Thermostat T40 Series',
        partNumber: 'T40-001',
        expectedQuantity: 100,
        receivedQuantity: 0,
        status: 'pending',
      },
    ],
    notes: 'Monthly thermostat restock - first Monday of each month',
    recurrencePattern: {
      frequency: 'MONTHLY_WEEK',
      interval: 1,
      dayOfWeek: 'MONDAY',
      weekOfMonth: 'FIRST',
    },
    startDate: '2024-01-01',
    status: 'ACTIVE',
    lastGeneratedDate: '2024-12-02',
    nextExpectedDate: '2025-01-06',
    generatedShipmentIds: ['SH-R002-001', 'SH-R002-002'],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-02T10:00:00Z',
  },
  {
    id: 'RS-003',
    name: 'Bi-weekly Safety Equipment',
    vendorId: 'CO-003',
    vendorName: 'Eaton Corporation',
    warehouseId: 'WH-001',
    warehouseName: 'Main Distribution Center',
    expectedItems: [
      {
        id: 'EI-R003-1',
        productId: 'EAT-CB100',
        productName: 'Circuit Breaker 100A',
        partNumber: 'CB-100A',
        expectedQuantity: 20,
        receivedQuantity: 0,
        status: 'pending',
      },
    ],
    recurrencePattern: {
      frequency: 'BIWEEKLY',
      interval: 1,
      dayOfWeek: 'FRIDAY',
    },
    startDate: '2024-06-01',
    status: 'PAUSED',
    lastGeneratedDate: '2024-11-15',
    nextExpectedDate: '2024-11-29',
    generatedShipmentIds: ['SH-R003-001'],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-11-15T10:00:00Z',
  },
];

// Helper function to calculate the next date based on recurrence pattern
export function calculateNextDate(pattern: RecurrencePattern, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);

  switch (pattern.frequency) {
    case 'DAILY':
      result.setDate(result.getDate() + pattern.interval);
      break;

    case 'WEEKLY':
    case 'BIWEEKLY': {
      const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const targetDay = pattern.dayOfWeek ? daysOfWeek.indexOf(pattern.dayOfWeek) : 1;
      const currentDay = result.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      if (pattern.frequency === 'BIWEEKLY') daysToAdd += 7 * (pattern.interval - 1);
      result.setDate(result.getDate() + daysToAdd);
      break;
    }

    case 'MONTHLY': {
      result.setMonth(result.getMonth() + pattern.interval);
      if (pattern.dayOfMonth) {
        result.setDate(Math.min(pattern.dayOfMonth, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
      }
      break;
    }

    case 'MONTHLY_WEEK': {
      // Move to next month
      result.setMonth(result.getMonth() + pattern.interval);
      result.setDate(1);

      // Find the target week and day
      const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const targetDay = pattern.dayOfWeek ? daysOfWeek.indexOf(pattern.dayOfWeek) : 1;
      const weekNumber = pattern.weekOfMonth === 'FIRST' ? 1 : pattern.weekOfMonth === 'SECOND' ? 2 :
                        pattern.weekOfMonth === 'THIRD' ? 3 : pattern.weekOfMonth === 'FOURTH' ? 4 : 5;

      // Find first occurrence of target day
      while (result.getDay() !== targetDay) {
        result.setDate(result.getDate() + 1);
      }

      // Move to the correct week
      if (pattern.weekOfMonth === 'LAST') {
        // Find last occurrence
        const month = result.getMonth();
        while (result.getMonth() === month) {
          result.setDate(result.getDate() + 7);
        }
        result.setDate(result.getDate() - 7);
      } else {
        result.setDate(result.getDate() + (weekNumber - 1) * 7);
      }
      break;
    }
  }

  return result;
}

// Generate a human-readable description of the recurrence pattern
export function getRecurrenceDescription(pattern: RecurrencePattern): string {
  const dayLabels: Record<string, string> = {
    SUNDAY: 'Sunday', MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday'
  };
  const weekLabels: Record<string, string> = {
    FIRST: 'first', SECOND: 'second', THIRD: 'third', FOURTH: 'fourth', LAST: 'last'
  };

  switch (pattern.frequency) {
    case 'DAILY':
      return pattern.interval === 1 ? 'Every day' : `Every ${pattern.interval} days`;
    case 'WEEKLY':
      return pattern.interval === 1
        ? `Every ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`
        : `Every ${pattern.interval} weeks on ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`;
    case 'BIWEEKLY':
      return `Every 2 weeks on ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`;
    case 'MONTHLY':
      return pattern.interval === 1
        ? `Monthly on the ${pattern.dayOfMonth}${getOrdinalSuffix(pattern.dayOfMonth || 1)}`
        : `Every ${pattern.interval} months on the ${pattern.dayOfMonth}${getOrdinalSuffix(pattern.dayOfMonth || 1)}`;
    case 'MONTHLY_WEEK':
      return pattern.interval === 1
        ? `Monthly on the ${weekLabels[pattern.weekOfMonth || 'FIRST']} ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`
        : `Every ${pattern.interval} months on the ${weekLabels[pattern.weekOfMonth || 'FIRST']} ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`;
    default:
      return 'Custom schedule';
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Get all recurring shipments
export function getAllRecurringShipments(): RecurringShipment[] {
  return [...mockRecurringShipments];
}

// Get a single recurring shipment by ID
export function getRecurringShipmentById(id: string): RecurringShipment | undefined {
  return mockRecurringShipments.find(rs => rs.id === id);
}

// Add a new recurring shipment
export function addRecurringShipment(data: Omit<RecurringShipment, 'id' | 'createdAt' | 'updatedAt' | 'generatedShipmentIds'>): RecurringShipment {
  const id = `RS-${String(mockRecurringShipments.length + 1).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const newRecurring: RecurringShipment = {
    ...data,
    id,
    generatedShipmentIds: [],
    createdAt: now,
    updatedAt: now,
  };

  mockRecurringShipments.push(newRecurring);
  return newRecurring;
}

// Update a recurring shipment
export function updateRecurringShipment(id: string, updates: Partial<RecurringShipment>): RecurringShipment | undefined {
  const index = mockRecurringShipments.findIndex(rs => rs.id === id);
  if (index === -1) return undefined;

  mockRecurringShipments[index] = {
    ...mockRecurringShipments[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return mockRecurringShipments[index];
}

// Update recurring shipment status
export function updateRecurringShipmentStatus(id: string, status: RecurringShipmentStatus): RecurringShipment | undefined {
  return updateRecurringShipment(id, { status });
}

// Generate a shipment from a recurring template
export function generateShipmentFromRecurring(recurringId: string, eta?: string, status: ShipmentStatus = 'PENDING'): IncomingShipment | undefined {
  const recurring = getRecurringShipmentById(recurringId);
  if (!recurring || recurring.status !== 'ACTIVE') return undefined;

  const expectedDate = eta || recurring.nextExpectedDate || new Date().toISOString();

  // Create the shipment using existing function
  const shipmentData: Omit<IncomingShipment, 'id' | 'createdAt' | 'updatedAt'> = {
    poNumber: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
    vendorId: recurring.vendorId,
    vendorName: recurring.vendorName,
    vendorContact: recurring.vendorContact,
    vendorEmail: recurring.vendorEmail,
    warehouseId: recurring.warehouseId,
    warehouseName: recurring.warehouseName,
    carrier: recurring.carrier,
    eta: expectedDate,
    status: status,
    expectedItems: recurring.expectedItems.map(item => ({
      ...item,
      id: `EI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receivedQuantity: 0,
      status: 'pending' as const,
    })),
    items: [],
    itemCount: recurring.expectedItems.length,
    expectedQuantity: recurring.expectedItems.reduce((sum, item) => sum + item.expectedQuantity, 0),
    notes: recurring.notes,
    recurringShipmentId: recurring.id,
  };

  const newShipment = addIncomingShipment(shipmentData);

  // Update the recurring shipment
  const nextDate = calculateNextDate(recurring.recurrencePattern, new Date(expectedDate));
  updateRecurringShipment(recurringId, {
    lastGeneratedDate: expectedDate.split('T')[0],
    nextExpectedDate: nextDate.toISOString().split('T')[0],
    generatedShipmentIds: [...recurring.generatedShipmentIds, newShipment.id],
  });

  return newShipment;
}

// Get all shipments generated from a recurring shipment
export function getShipmentsForRecurring(recurringId: string): IncomingShipment[] {
  return mockIncomingShipments.filter(s => s.recurringShipmentId === recurringId);
}

// Get all scheduled dates for a recurring shipment within a date range
export function getRecurringShipmentDates(
  recurring: RecurringShipment,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  if (recurring.status !== 'ACTIVE') return [];

  const dates: Date[] = [];
  let currentDate = new Date(recurring.startDate);

  // If recurring has an end date before our range starts, return empty
  if (recurring.endDate && new Date(recurring.endDate) < rangeStart) {
    return [];
  }

  // Advance to start of our range (or use start date if it's within range)
  while (currentDate < rangeStart) {
    currentDate = calculateNextDate(recurring.recurrencePattern, currentDate);
  }

  // Collect dates within range
  while (currentDate <= rangeEnd) {
    // Check if within recurring's own date range
    if (recurring.endDate && currentDate > new Date(recurring.endDate)) {
      break;
    }
    dates.push(new Date(currentDate));
    currentDate = calculateNextDate(recurring.recurrencePattern, currentDate);
  }

  return dates;
}

// Get all deliveries and recurring schedules for a specific month
export function getDeliveriesForMonth(year: number, month: number): {
  oneOff: { date: string; shipment: IncomingShipment }[];
  recurring: { date: string; recurring: RecurringShipment }[];
} {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of month

  // Get one-off shipments (not from recurring, or any shipment with an ETA in this month)
  const oneOff = mockIncomingShipments
    .filter(shipment => {
      const eta = new Date(shipment.eta);
      return eta >= startDate && eta <= endDate &&
             !['RECEIVED', 'CANCELLED'].includes(shipment.status);
    })
    .map(shipment => ({
      date: shipment.eta.split('T')[0],
      shipment,
    }));

  // Get recurring schedules
  const recurring: { date: string; recurring: RecurringShipment }[] = [];
  mockRecurringShipments.forEach(rs => {
    const dates = getRecurringShipmentDates(rs, startDate, endDate);
    dates.forEach(date => {
      recurring.push({
        date: date.toISOString().split('T')[0],
        recurring: rs,
      });
    });
  });

  return { oneOff, recurring };
}

// Check if any recurring shipments are late (next expected date has passed)
export function getLateRecurringShipments(): RecurringShipment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return mockRecurringShipments.filter(rs => {
    if (rs.status !== 'ACTIVE' || !rs.nextExpectedDate) return false;
    const nextDate = new Date(rs.nextExpectedDate);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate < today;
  });
}

// Create recurring shipment from a draft shipment
export function convertToRecurringShipment(
  shipmentId: string,
  name: string,
  pattern: RecurrencePattern,
  startDate: string,
  endDate?: string
): RecurringShipment | undefined {
  const shipment = getShipmentById(shipmentId);
  if (!shipment) return undefined;

  // Calculate next expected date
  const nextDate = calculateNextDate(pattern, new Date(startDate));

  const recurringData: Omit<RecurringShipment, 'id' | 'createdAt' | 'updatedAt' | 'generatedShipmentIds'> = {
    name,
    vendorId: shipment.vendorId,
    vendorName: shipment.vendorName,
    vendorContact: shipment.vendorContact,
    vendorEmail: shipment.vendorEmail,
    warehouseId: shipment.warehouseId,
    warehouseName: shipment.warehouseName,
    carrier: shipment.carrier,
    expectedItems: shipment.expectedItems,
    notes: shipment.notes,
    recurrencePattern: pattern,
    startDate,
    endDate,
    status: 'ACTIVE',
    nextExpectedDate: nextDate.toISOString().split('T')[0],
  };

  const recurring = addRecurringShipment(recurringData);

  // Link the original shipment to the recurring
  updateShipmentDetails(shipmentId, { recurringShipmentId: recurring.id });

  // Add the original shipment ID to the recurring's list
  updateRecurringShipment(recurring.id, {
    generatedShipmentIds: [shipmentId],
  });

  return recurring;
}

// -----------------------------------------------------------------------------
// Recurring Cycle Count Jobs
// -----------------------------------------------------------------------------

export const mockRecurringCycleCountJobs: RecurringCycleCountJob[] = [
  {
    id: 'RCC-001',
    name: 'Weekly Fast Movers Count',
    description: 'Count top-selling products weekly to maintain accuracy',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    triggerType: 'FAST_MOVING',
    itemCount: 20,
    velocityFilter: ['fast'],
    excludeRecentlyCountedDays: 60,
    recurrencePattern: {
      frequency: 'WEEKLY',
      interval: 1,
      dayOfWeek: 'MONDAY',
    },
    startDate: '2024-12-01',
    status: 'ACTIVE',
    lastGeneratedDate: '2024-12-23',
    nextScheduledDate: '2024-12-30',
    generatedCycleCountIds: ['CC-001', 'CC-003'],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-23T10:00:00Z',
    createdBy: 'user-001',
  },
  {
    id: 'RCC-002',
    name: 'Monthly Random A-Items Audit',
    description: 'Random sampling of high-value A-class items',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    triggerType: 'RANDOM_A_ITEMS',
    itemCount: 15,
    velocityFilter: ['fast', 'medium'],
    excludeRecentlyCountedDays: 30,
    recurrencePattern: {
      frequency: 'MONTHLY_WEEK',
      interval: 1,
      dayOfWeek: 'WEDNESDAY',
      weekOfMonth: 'FIRST',
    },
    startDate: '2024-11-01',
    status: 'ACTIVE',
    lastGeneratedDate: '2024-12-04',
    nextScheduledDate: '2025-01-01',
    generatedCycleCountIds: ['CC-002'],
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-12-04T10:00:00Z',
    createdBy: 'user-001',
  },
  {
    id: 'RCC-003',
    name: 'Bi-Weekly Low Stock Verification',
    description: 'Verify accuracy of items approaching reorder point',
    warehouseId: 'WH-001',
    warehouseName: 'Atlanta Distribution Center',
    triggerType: 'LOW_QUANTITY',
    itemCount: 10,
    excludeRecentlyCountedDays: 14,
    recurrencePattern: {
      frequency: 'BIWEEKLY',
      interval: 1,
      dayOfWeek: 'FRIDAY',
    },
    startDate: '2024-12-01',
    status: 'PAUSED',
    lastGeneratedDate: '2024-12-13',
    nextScheduledDate: '2024-12-27',
    generatedCycleCountIds: [],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
    createdBy: 'user-001',
  },
];

// Get all recurring cycle count jobs
export function getAllRecurringCycleCountJobs(): RecurringCycleCountJob[] {
  return mockRecurringCycleCountJobs;
}

// Get recurring cycle count job by ID
export function getRecurringCycleCountJobById(id: string): RecurringCycleCountJob | undefined {
  return mockRecurringCycleCountJobs.find(job => job.id === id);
}

// Add a new recurring cycle count job
export function addRecurringCycleCountJob(
  data: Omit<RecurringCycleCountJob, 'id' | 'createdAt' | 'updatedAt' | 'generatedCycleCountIds'>
): RecurringCycleCountJob {
  const newJob: RecurringCycleCountJob = {
    ...data,
    id: `RCC-${String(mockRecurringCycleCountJobs.length + 1).padStart(3, '0')}`,
    generatedCycleCountIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockRecurringCycleCountJobs.push(newJob);
  return newJob;
}

// Update a recurring cycle count job
export function updateRecurringCycleCountJob(
  id: string,
  updates: Partial<RecurringCycleCountJob>
): RecurringCycleCountJob | undefined {
  const index = mockRecurringCycleCountJobs.findIndex(job => job.id === id);
  if (index === -1) return undefined;

  mockRecurringCycleCountJobs[index] = {
    ...mockRecurringCycleCountJobs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return mockRecurringCycleCountJobs[index];
}

// Update recurring cycle count job status
export function updateRecurringCycleCountJobStatus(
  id: string,
  status: RecurringCycleCountStatus
): RecurringCycleCountJob | undefined {
  return updateRecurringCycleCountJob(id, { status });
}

// Get cycle counts generated by a recurring job
export function getCycleCountsForRecurringJob(recurringJobId: string): CycleCount[] {
  const job = getRecurringCycleCountJobById(recurringJobId);
  if (!job) return [];
  return mockCycleCounts.filter(cc => job.generatedCycleCountIds.includes(cc.id));
}

// Get inventory items with their last cycle count info
export interface InventoryWithCycleCountInfo {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  factoryName: string;
  totalQuantity: number;
  availableQuantity: number;
  primaryLocation: string;
  abcClass?: 'A' | 'B' | 'C';
  movementVelocity?: InventoryVelocity;
  lastCycleCountDate?: string;
  daysSinceLastCount?: number;
  nextScheduledCountDate?: string;
  isScheduledForCount: boolean;
}

export function getInventoryWithCycleCountInfo(): InventoryWithCycleCountInfo[] {
  const now = new Date();

  // Get all scheduled/draft cycle counts to check if items are scheduled
  const upcomingCounts = mockCycleCounts.filter(
    cc => cc.status === 'DRAFT' || cc.status === 'SCHEDULED'
  );

  const scheduledItemIds = new Set<string>();
  const itemScheduleDates = new Map<string, string>();

  upcomingCounts.forEach(cc => {
    cc.lineItems.forEach(li => {
      scheduledItemIds.add(li.inventoryItemId);
      const existingDate = itemScheduleDates.get(li.inventoryItemId);
      if (!existingDate || cc.scheduledDate < existingDate) {
        itemScheduleDates.set(li.inventoryItemId, cc.scheduledDate);
      }
    });
  });

  return mockInventory.map(inv => {
    const lastCountDate = inv.lastCycleCountDate ? new Date(inv.lastCycleCountDate) : undefined;
    const daysSinceLastCount = lastCountDate
      ? Math.floor((now.getTime() - lastCountDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    return {
      id: inv.id,
      productId: inv.productId,
      productName: inv.productName,
      partNumber: inv.partNumber,
      factoryName: inv.factoryName,
      totalQuantity: inv.totalQuantity,
      availableQuantity: inv.availableQuantity,
      primaryLocation: inv.primaryLocation?.locationCode || 'N/A',
      abcClass: inv.abcClass,
      movementVelocity: inv.movementVelocity as InventoryVelocity | undefined,
      lastCycleCountDate: inv.lastCycleCountDate,
      daysSinceLastCount,
      nextScheduledCountDate: itemScheduleDates.get(inv.id),
      isScheduledForCount: scheduledItemIds.has(inv.id),
    };
  });
}

// Get inventory filtered by velocity
export function getInventoryByVelocity(velocities: InventoryVelocity[]): Inventory[] {
  return mockInventory.filter(inv =>
    inv.movementVelocity && velocities.includes(inv.movementVelocity as InventoryVelocity)
  );
}

// Get items eligible for auto-generate (not recently counted)
export function getEligibleItemsForAutoGenerate(
  excludeDays: number = 60,
  velocityFilter?: InventoryVelocity[],
  limit?: number
): Inventory[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - excludeDays);

  let items = mockInventory.filter(inv => {
    if (inv.lastCycleCountDate) {
      const lastCount = new Date(inv.lastCycleCountDate);
      if (lastCount > cutoffDate) return false;
    }
    return true;
  });

  // Filter by velocity if specified
  if (velocityFilter && velocityFilter.length > 0) {
    items = items.filter(inv =>
      inv.movementVelocity && velocityFilter.includes(inv.movementVelocity as InventoryVelocity)
    );
  }

  // Apply limit if specified
  if (limit) {
    items = items.slice(0, limit);
  }

  return items;
}

// Generate cycle count from recurring job
export function generateCycleCountFromRecurringJob(
  jobId: string,
  scheduledDate?: string
): CycleCount | undefined {
  const job = getRecurringCycleCountJobById(jobId);
  if (!job || job.status !== 'ACTIVE') return undefined;

  const eligibleItems = getEligibleItemsForAutoGenerate(
    job.excludeRecentlyCountedDays,
    job.velocityFilter,
    job.itemCount
  );

  if (eligibleItems.length === 0) return undefined;

  const cycleCount = autoGenerateCycleCount({
    warehouseId: job.warehouseId,
    warehouseName: job.warehouseName,
    triggerType: job.triggerType,
    excludeRecentlyCountedDays: job.excludeRecentlyCountedDays,
    createdBy: job.createdBy || 'System',
  });

  // Update job with the new cycle count
  updateRecurringCycleCountJob(jobId, {
    lastGeneratedDate: new Date().toISOString(),
    nextScheduledDate: calculateNextDate(
      job.recurrencePattern as RecurrencePattern,
      new Date()
    ).toISOString().split('T')[0],
    generatedCycleCountIds: [...job.generatedCycleCountIds, cycleCount.id],
  });

  return cycleCount;
}
