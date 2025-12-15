// ============================================================================
// Flow Warehouse - Type Definitions
// Warehouse Management, Inventory Tracking & Fulfillment
// ============================================================================

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export type InventoryStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PICKING'
  | 'PICKED'
  | 'QUARANTINE'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'IN_TRANSIT'
  | 'ON_HOLD'
  | 'RETURNED';

export type FulfillmentStatus =
  | 'NOT_STARTED'
  | 'ALLOCATED'
  | 'PICKING'
  | 'PICKED'
  | 'PACKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'RELEASED_TO_WAREHOUSE';

export type DeliveryType =
  | 'CUSTOMER_PICKUP'
  | 'LOCAL_TRUCK_DELIVERY'
  | 'CARRIER_DELIVERY'
  | 'BULK_CARRIER_DELIVERY';

export type WaveStatus =
  | 'PENDING'
  | 'RELEASED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type RmaStatus =
  | 'REQUESTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'INSPECTING'
  | 'RESTOCKING'
  | 'REFUNDED'
  | 'REPLACED'
  | 'COMPLETED'
  | 'CANCELLED';

export type RmaReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'DAMAGED'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'DUPLICATE'
  | 'OTHER';

export type AdjustmentType =
  | 'RECEIPT'
  | 'SHIPMENT'
  | 'DAMAGE'
  | 'LOSS'
  | 'CYCLE_COUNT'
  | 'TRANSFER'
  | 'RETURN'
  | 'ADJUSTMENT';

export type ShipmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'RECEIVING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RECEIVED'
  | 'CANCELLED';

// Ownership type determines how inventory is managed financially
export type OwnershipType = 'CONSIGNMENT' | 'BUY_SELL';

// Buy/Sell transaction status
export type BuySellStatus =
  | 'PENDING_PURCHASE'      // PO sent to manufacturer
  | 'PURCHASED'             // Inventory received, we own it
  | 'ALLOCATED'             // Assigned to a customer order
  | 'SOLD'                  // Shipped to customer
  | 'INVOICED'              // Invoice sent to customer
  | 'PAID'                  // Payment received
  | 'RETURNED'              // Customer returned product
  | 'WRITTEN_OFF';          // Inventory written off (damaged, lost, etc.)

// -----------------------------------------------------------------------------
// Warehouse Structure - Location Hierarchy
// -----------------------------------------------------------------------------

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
  createdAt: string;
  updatedAt: string;
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
  shelfNumber: number;
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

// Full location path for display
export interface BinLocation {
  warehouseId: string;
  warehouseName: string;
  sectionId?: string;
  sectionName?: string;
  aisleId?: string;
  aisleName?: string;
  shelfId: string;
  shelfName: string;
  bayId: string;
  bayCode: string;
  rowId: string;
  rowNumber: number;
  binId: string;
  binLetterCode: string;
  fullPath: string; // e.g., "WH01-NORTH-A3-SH12-BAY02-R1-C"
}

// -----------------------------------------------------------------------------
// Inventory Management
// -----------------------------------------------------------------------------

export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  factoryId: string;          // Links to Company (Manufacturer)
  factoryName: string;
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

  // Ownership & Financial
  ownershipType: OwnershipType;
  isConsignment: boolean;     // Deprecated - use ownershipType instead

  // Consignment fields
  commissionPercentage?: number;

  // Buy/Sell fields
  unitCost?: number;          // Cost per unit when purchased
  targetMargin?: number;      // Target profit margin percentage
  totalCostBasis?: number;    // Total cost of inventory on hand

  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  inventoryId: string;
  binId: string;
  binLocation: string;        // Formatted: "Shelf 3, Bin A-12"
  fullLocationPath: string;   // Full path for display
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
  signature?: string;         // For damaged items (base64)
  timestamp: string;
}

// For creating/editing inventory items
export interface InventoryItemInput {
  inventoryId: string;
  binId: string;
  quantity: number;
  weightPerUnit?: number;
  lotNumber?: string;
  serialNumber?: string;
  receivedDate?: string;
  expirationDate?: string;
  isPerishable: boolean;
  notes?: string;
}

// -----------------------------------------------------------------------------
// Fulfillment & Picking
// -----------------------------------------------------------------------------

export interface Fulfillment {
  id: string;
  orderId: string;
  orderNumber: string;
  orderDetailId: string;
  productId: string;
  productName: string;
  partNumber: string;
  warehouseId: string;
  warehouseName: string;
  customerId: string;         // Links to Company (Distributor)
  customerName: string;
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
  binLocation?: string;       // Where to pick from
  notes?: string;
  pickedAt?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
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
  fulfillments?: Fulfillment[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PickTask {
  fulfillmentId: string;
  productName: string;
  partNumber: string;
  quantity: number;
  pickedQuantity: number;
  binLocation: string;
  shelfName: string;
  binCode: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// -----------------------------------------------------------------------------
// Fulfillment Orders (Order-level fulfillment requests)
// -----------------------------------------------------------------------------

export type FulfillmentMethod = 'SHIP' | 'WILL_CALL' | 'JOBSITE';

export type FulfillmentOrderStatus =
  | 'PENDING'
  | 'RELEASED'
  | 'PICKING'
  | 'PICKED'
  | 'PACKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'PARTIAL_SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface ShipToAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface FulfillmentOrderLineItem {
  id: string;
  fulfillmentOrderId: string;
  orderLineItemId: string;       // Link back to original order line item
  productId: string;
  productName: string;
  partNumber: string;
  uom: string;
  orderedQty: number;

  // Warehouse reality - qty breakdown
  allocatedQty: number;
  shippedQty: number;
  backorderQty: number;

  // Optional warehouse specifics
  warehouseLocationOverride?: string;  // Override from order-level warehouse
  pickLocation?: string;               // Bin location for picking
  shortReason?: string;                // Reason if backorder > 0

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentOrder {
  id: string;
  fulfillmentOrderNumber: string;  // e.g., "FO-2024-001"

  // Source order info
  orderId: string;
  orderNumber: string;

  // Customer info
  customerId: string;
  customerName: string;

  // 1) Warehouse context
  warehouseId: string;
  warehouseName: string;
  fulfillmentMethod: FulfillmentMethod;

  // 2) Where it's going
  shipTo: ShipToAddress;

  // 3) Timing + commitment
  needByDate?: string;
  allowPartialShipment: boolean;  // If false, shipping < ordered should block packing

  // 4) Release authority (point of no return - audit + accountability)
  releasedAt?: string;
  releasedBy?: string;

  // 5) Pick timestamps (auto-filled, not editable - for warehouse performance metrics)
  pickStartedAt?: string;
  pickStartedBy?: string;
  pickCompletedAt?: string;
  pickCompletedBy?: string;

  // 6) Shipping outcome
  shipStatus: 'NOT_SHIPPED' | 'PARTIAL' | 'SHIPPED';
  carrier?: string;
  trackingNumbers?: string[];  // Can hold multiple tracking numbers
  shipConfirmedAt?: string;    // Proof of shipment - commission triggers

  // Overall status
  status: FulfillmentOrderStatus;

  // Line items
  lineItems: FulfillmentOrderLineItem[];

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Status labels and colors for FulfillmentOrder
export const fulfillmentOrderStatusLabels: Record<FulfillmentOrderStatus, string> = {
  PENDING: 'Pending',
  RELEASED: 'Released',
  PICKING: 'Picking',
  PICKED: 'Picked',
  PACKING: 'Packing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  PARTIAL_SHIPPED: 'Partial Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const fulfillmentOrderStatusColors: Record<FulfillmentOrderStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  RELEASED: 'bg-cyan-100 text-cyan-700',
  PICKING: 'bg-yellow-100 text-yellow-700',
  PICKED: 'bg-amber-100 text-amber-700',
  PACKING: 'bg-orange-100 text-orange-700',
  PACKED: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-green-100 text-green-700',
  PARTIAL_SHIPPED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const fulfillmentMethodLabels: Record<FulfillmentMethod, string> = {
  SHIP: 'Ship',
  WILL_CALL: 'Will Call',
  JOBSITE: 'Jobsite Delivery',
};

export const shipStatusLabels: Record<'NOT_SHIPPED' | 'PARTIAL' | 'SHIPPED', string> = {
  NOT_SHIPPED: 'Not Shipped',
  PARTIAL: 'Partial',
  SHIPPED: 'Shipped',
};

export const shipStatusColors: Record<'NOT_SHIPPED' | 'PARTIAL' | 'SHIPPED', string> = {
  NOT_SHIPPED: 'bg-gray-100 text-gray-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
  SHIPPED: 'bg-green-100 text-green-700',
};

// -----------------------------------------------------------------------------
// Deliveries / Incoming Shipments
// -----------------------------------------------------------------------------

export interface IncomingShipment {
  id: string;
  poNumber: string;
  vendorId: string;           // Links to Company (Manufacturer)
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  warehouseId: string;
  warehouseName: string;
  eta: string;
  status: ShipmentStatus;
  expectedItems: ExpectedItem[];
  items: ShipmentLineItem[];  // For receiving modal
  itemCount: number;
  expectedQuantity: number;
  trackingNumber?: string;
  carrier?: string;
  receivedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentLineItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  expectedQuantity: number;
  receivedQuantity: number;
}

export interface ExpectedItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  expectedQuantity: number;
  receivedQuantity: number;
  discrepancyNotes?: string;
  status: 'pending' | 'received' | 'partial' | 'discrepancy';
}

// -----------------------------------------------------------------------------
// Returns (RMA)
// -----------------------------------------------------------------------------

export interface Rma {
  id: string;
  rmaNumber: string;
  fulfillmentId: string;
  orderId: string;
  orderNumber: string;
  originalOrderNumber: string;
  customerId: string;
  customerName: string;
  status: RmaStatus;
  reason: RmaReason;
  items: RmaItem[];
  totalValue: number;
  requestedDate: string;
  refundAmount?: number;
  restockingFee?: number;
  returnTrackingNumber?: string;
  inspectionNotes?: string;
  qrCode?: string;
  approvedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface RmaItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  reason?: string;
}

// -----------------------------------------------------------------------------
// Buy/Sell Tracking
// -----------------------------------------------------------------------------

export interface BuySellTransaction {
  id: string;
  inventoryId: string;
  productId: string;
  productName: string;
  partNumber: string;
  factoryId: string;
  factoryName: string;

  // Transaction details
  transactionType: 'PURCHASE' | 'SALE' | 'RETURN' | 'WRITE_OFF' | 'ADJUSTMENT';
  status: BuySellStatus;
  quantity: number;

  // Purchase details (when buying from manufacturer)
  purchaseOrderNumber?: string;
  purchaseDate?: string;
  unitCost?: number;
  totalCost?: number;
  vendorInvoiceNumber?: string;
  vendorInvoiceDate?: string;
  paymentDueDate?: string;
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  paymentDate?: string;

  // Sale details (when selling to customer)
  salesOrderNumber?: string;
  salesOrderId?: string;
  customerId?: string;
  customerName?: string;
  saleDate?: string;
  unitPrice?: number;
  totalRevenue?: number;
  customerInvoiceNumber?: string;
  customerInvoiceDate?: string;
  customerPaymentDueDate?: string;
  customerPaymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  customerPaymentDate?: string;

  // Profit tracking
  unitProfit?: number;
  totalProfit?: number;
  marginPercentage?: number;

  // Audit
  notes?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BuySellSummary {
  totalPurchases: number;
  totalPurchaseCost: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageMargin: number;
  inventoryValue: number;          // Current value of buy/sell inventory on hand
  unpaidVendorInvoices: number;
  unpaidVendorAmount: number;
  unpaidCustomerInvoices: number;
  unpaidCustomerAmount: number;
}

export const rmaReasonCodes: Record<string, string> = {
  'DEFECTIVE': 'Defective Product',
  'WRONG_ITEM': 'Wrong Item Shipped',
  'DAMAGED': 'Damaged in Transit',
  'NOT_AS_DESCRIBED': 'Not as Described',
  'CUSTOMER_CHANGED_MIND': 'Customer Changed Mind',
  'DUPLICATE_ORDER': 'Duplicate Order',
  'OTHER': 'Other',
};

// -----------------------------------------------------------------------------
// Dashboard Types
// -----------------------------------------------------------------------------

/**
 * @deprecated Use Task from '@/lib/types/tasks' instead.
 * This interface is kept for backwards compatibility but should not be used for new code.
 * The unified Task type supports both CRM and Warehouse tasks with proper category designation.
 */
export interface DailyTask {
  id: string;
  description: string;
  completed: boolean;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  taskType: 'cycle_count' | 'restock' | 'cleanup' | 'other';
}

export interface StockControlItem {
  id: string;
  productId: string;
  productName: string;
  productDescription: string;
  productImage?: string;
  binLocation: string;
  shelfNumber: string;
  price: number;
  inventoryCount: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface HighPriorityOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  orderDate: string;
  dueDate?: string;
  priority: number;
}

// -----------------------------------------------------------------------------
// Reports
// -----------------------------------------------------------------------------

export interface InventoryReportItem {
  vendorName: string;
  productName: string;
  productDescription: string;
  vendorProductGroup: string;
  qtyOnHand: number;
  qtyCommitted: number;
  qtyAvailable: number;
  warehouse: string;
  binLocation: string;
}

export interface CycleCountTask {
  id: string;
  binId: string;
  binLocation: string;
  expectedQuantity: number;
  actualQuantity?: number;
  discrepancy?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'discrepancy';
  assignedTo?: string;
  completedAt?: string;
  notes?: string;
}

// -----------------------------------------------------------------------------
// Status Labels & Colors
// -----------------------------------------------------------------------------

export const inventoryStatusLabels: Record<InventoryStatus, string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  PICKING: 'Picking',
  PICKED: 'Picked',
  QUARANTINE: 'Quarantine',
  DAMAGED: 'Damaged',
  EXPIRED: 'Expired',
  IN_TRANSIT: 'In Transit',
  ON_HOLD: 'On Hold',
  RETURNED: 'Returned',
};

export const inventoryStatusColors: Record<InventoryStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  RESERVED: 'bg-blue-100 text-blue-700',
  PICKING: 'bg-yellow-100 text-yellow-700',
  PICKED: 'bg-purple-100 text-purple-700',
  QUARANTINE: 'bg-orange-100 text-orange-700',
  DAMAGED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  RETURNED: 'bg-pink-100 text-pink-700',
};

export const fulfillmentStatusLabels: Record<FulfillmentStatus, string> = {
  NOT_STARTED: 'Not Started',
  ALLOCATED: 'Allocated',
  PICKING: 'Picking',
  PICKED: 'Picked',
  PACKING: 'Packing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
  RELEASED_TO_WAREHOUSE: 'Released',
};

export const fulfillmentStatusColors: Record<FulfillmentStatus, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-700',
  ALLOCATED: 'bg-blue-100 text-blue-700',
  PICKING: 'bg-yellow-100 text-yellow-700',
  PICKED: 'bg-amber-100 text-amber-700',
  PACKING: 'bg-orange-100 text-orange-700',
  PACKED: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  RETURNED: 'bg-pink-100 text-pink-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RELEASED_TO_WAREHOUSE: 'bg-cyan-100 text-cyan-700',
};

export const waveStatusLabels: Record<WaveStatus, string> = {
  PENDING: 'Pending',
  RELEASED: 'Released',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const waveStatusColors: Record<WaveStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  RELEASED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const rmaStatusLabels: Record<RmaStatus, string> = {
  REQUESTED: 'Requested',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  IN_TRANSIT: 'In Transit',
  RECEIVED: 'Received',
  INSPECTING: 'Inspecting',
  RESTOCKING: 'Restocking',
  REFUNDED: 'Refunded',
  REPLACED: 'Replaced',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const rmaStatusColors: Record<RmaStatus, string> = {
  REQUESTED: 'bg-orange-100 text-orange-700',
  PENDING: 'bg-gray-100 text-gray-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
  RECEIVED: 'bg-purple-100 text-purple-700',
  INSPECTING: 'bg-yellow-100 text-yellow-700',
  RESTOCKING: 'bg-cyan-100 text-cyan-700',
  REFUNDED: 'bg-green-100 text-green-700',
  REPLACED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

export const rmaReasonLabels: Record<RmaReason, string> = {
  DEFECTIVE: 'Defective Product',
  WRONG_ITEM: 'Wrong Item Shipped',
  DAMAGED: 'Damaged in Transit',
  NOT_AS_DESCRIBED: 'Not as Described',
  CHANGED_MIND: 'Changed Mind',
  DUPLICATE: 'Duplicate Order',
  OTHER: 'Other',
};

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_TRANSIT: 'In Transit',
  ARRIVED: 'Arrived',
  RECEIVING: 'Receiving',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export const shipmentStatusColors: Record<ShipmentStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
  ARRIVED: 'bg-purple-100 text-purple-700',
  RECEIVING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-orange-100 text-orange-700',
  SHIPPED: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  RECEIPT: 'Receipt',
  SHIPMENT: 'Shipment',
  DAMAGE: 'Damage',
  LOSS: 'Loss',
  CYCLE_COUNT: 'Cycle Count',
  TRANSFER: 'Transfer',
  RETURN: 'Return',
  ADJUSTMENT: 'Manual Adjustment',
};

export const deliveryTypeLabels: Record<DeliveryType, string> = {
  CUSTOMER_PICKUP: 'Customer Pickup',
  LOCAL_TRUCK_DELIVERY: 'Local Truck',
  CARRIER_DELIVERY: 'Carrier Delivery',
  BULK_CARRIER_DELIVERY: 'Bulk Carrier',
};

export const ownershipTypeLabels: Record<OwnershipType, string> = {
  CONSIGNMENT: 'Consignment',
  BUY_SELL: 'Buy/Sell',
};

export const ownershipTypeColors: Record<OwnershipType, string> = {
  CONSIGNMENT: 'bg-purple-100 text-purple-700',
  BUY_SELL: 'bg-emerald-100 text-emerald-700',
};

export const buySellStatusLabels: Record<BuySellStatus, string> = {
  PENDING_PURCHASE: 'Pending Purchase',
  PURCHASED: 'Purchased',
  ALLOCATED: 'Allocated',
  SOLD: 'Sold',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
  RETURNED: 'Returned',
  WRITTEN_OFF: 'Written Off',
};

export const buySellStatusColors: Record<BuySellStatus, string> = {
  PENDING_PURCHASE: 'bg-gray-100 text-gray-700',
  PURCHASED: 'bg-blue-100 text-blue-700',
  ALLOCATED: 'bg-yellow-100 text-yellow-700',
  SOLD: 'bg-purple-100 text-purple-700',
  INVOICED: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-700',
  RETURNED: 'bg-pink-100 text-pink-700',
  WRITTEN_OFF: 'bg-red-100 text-red-700',
};

// -----------------------------------------------------------------------------
// Warehouse Settings
// -----------------------------------------------------------------------------

export type WarehouseLocationLevel = 'section' | 'aisle' | 'shelf' | 'bay' | 'row' | 'bin';

export interface WarehouseLocationLevelConfig {
  level: WarehouseLocationLevel;
  label: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface WarehouseSettings {
  id: string;
  warehouseId?: string;  // If null, these are global default settings
  locationLevels: WarehouseLocationLevelConfig[];
  createdAt: string;
  updatedAt: string;
}

// Default location level configuration
export const defaultLocationLevels: WarehouseLocationLevelConfig[] = [
  { level: 'section', label: 'Section', icon: 'package', enabled: true, order: 1 },
  { level: 'aisle', label: 'Aisle', icon: 'shopping-cart', enabled: true, order: 2 },
  { level: 'shelf', label: 'Shelf', icon: 'layers', enabled: true, order: 3 },
  { level: 'bay', label: 'Bay', icon: 'grid', enabled: true, order: 4 },
  { level: 'row', label: 'Row', icon: 'folder', enabled: true, order: 5 },
  { level: 'bin', label: 'Bin', icon: 'map-pin', enabled: true, order: 6 },
];

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export interface WarehouseStats {
  totalProducts: number;
  totalInventoryItems: number;
  lowStockCount: number;
  pendingFulfillments: number;
  incomingShipments: number;
  pendingRmas: number;
}

export interface InventoryStats {
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  inTransitQuantity: number;
  damagedQuantity: number;
}

// -----------------------------------------------------------------------------
// Shipment Requests
// -----------------------------------------------------------------------------

export type ShipmentRequestMethod = 'EMAIL' | 'CALL' | 'MANUFACTURER_SYSTEM';

export type ShipmentRequestStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SENT'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface ManufacturerContact {
  id: string;
  factoryId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isDefaultForOrders: boolean;
  isActive: boolean;
}

export interface ShipmentRequestLineItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  requestedQuantity: number;
  currentStock: number;
  reorderPoint?: number;
}

export interface ShipmentRequest {
  id: string;
  requestNumber: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  warehouseName: string;
  requestMethod: ShipmentRequestMethod;
  status: ShipmentRequestStatus;
  priority: 'standard' | 'expedited' | 'urgent';
  requestedDeliveryDate: string;
  items: ShipmentRequestLineItem[];
  totalQuantity: number;

  // Email-specific fields
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  emailSentAt?: string;

  // Call/System confirmation fields
  confirmedAt?: string;
  confirmedBy?: string;
  confirmationNotes?: string;

  // Linked shipment (when confirmed/shipped)
  linkedShipmentId?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export const shipmentRequestMethodLabels: Record<ShipmentRequestMethod, string> = {
  EMAIL: 'Email',
  CALL: 'Phone Call',
  MANUFACTURER_SYSTEM: 'Manufacturer System',
};

export const shipmentRequestStatusLabels: Record<ShipmentRequestStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  SENT: 'Sent',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export const shipmentRequestStatusColors: Record<ShipmentRequestStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
