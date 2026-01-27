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
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'RECEIVING'
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

// Document types for attachments
export type DocumentType =
  | 'PACKING_SLIP'
  | 'BILL_OF_LADING'
  | 'SHIPPING_LABEL'
  | 'PROOF_OF_DELIVERY'
  | 'INVOICE'
  | 'RECEIPT'
  | 'PHOTO'
  | 'OTHER';

// Attached document interface
export interface AttachedDocument {
  id: string;
  name: string;
  type: DocumentType;
  fileUrl: string;           // URL to the document file or base64 data URL
  thumbnailUrl?: string;     // Optional thumbnail for preview
  mimeType: string;          // e.g., 'image/jpeg', 'application/pdf'
  fileSize?: number;         // File size in bytes
  fileId?: string;           // Server file id (if uploaded)
  file?: File;               // Local file used for upload
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

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

// ABC classification for inventory value/movement
export type InventoryAbcClass = 'A' | 'B' | 'C';

// Location for storing inventory
export interface InventoryStorageLocation {
  id: string;
  locationName: string;       // e.g., "Aisle 3, Shelf B, Bin 12"
  locationCode: string;       // Short code e.g., "A3-B-12"
  warehouseId: string;
  warehouseName: string;
  maxCapacity?: number;       // Max units this location can hold
  currentQuantity: number;    // Current units stored here
  notes?: string;
}

export interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  productName: string;
  partNumber: string;
  description?: string;       // Product description
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
  reorderQuantity?: number;  // Default quantity to order when restocking
  maxQuantity?: number;

  // Location management
  primaryLocation?: InventoryStorageLocation;     // Main storage location
  overflowLocations?: InventoryStorageLocation[]; // Additional overflow locations

  // Ownership & Financial
  ownershipType: OwnershipType;
  isConsignment: boolean;     // Deprecated - use ownershipType instead

  // Consignment fields
  commissionPercentage?: number;

  // Buy/Sell fields
  unitCost?: number;          // Cost per unit when purchased
  targetMargin?: number;      // Target profit margin percentage
  totalCostBasis?: number;    // Total cost of inventory on hand

  // Cycle count tracking
  lastCycleCountDate?: string;  // Last time this item was cycle counted
  cycleCountFrequency?: number; // Suggested days between counts
  abcClass?: InventoryAbcClass; // ABC classification for prioritization
  movementVelocity?: 'fast' | 'medium' | 'slow'; // Based on transaction history

  createdAt: string;
  updatedAt: string;

  // New
  items?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  inventoryId: string;
  locationId: string;
  locationName: string;
  quantity: number;
  lotNumber?: string;
  receivedDate?: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt?: string;
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
  locationId: string;
  quantity: number;
  lotNumber?: string;
  receivedDate?: string;
}

// -----------------------------------------------------------------------------
// Assigned Users (Managers, Workers, Inside Sales)
// -----------------------------------------------------------------------------

export type AssignedUserRole = 'manager' | 'worker' | 'inside_sales';

export interface AssignedUser {
  id: string;
  user: UserLite | null;
  role: AssignedUserRole;
  createdAt: string;
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

// Status for manufacturer direct fulfillment lines
export type ManufacturerFulfillmentStatus =
  | 'PENDING_MANUFACTURER'     // Waiting for manufacturer to process
  | 'MANUFACTURER_CONFIRMED'   // Manufacturer confirmed the order
  | 'MANUFACTURER_SHIPPED'     // Manufacturer has shipped
  | 'MANUFACTURER_DELIVERED';  // Manufacturer delivery complete

export type FulfillmentOrderStatus =
  | 'PENDING'
  | 'RELEASED'
  | 'PICKING'
  | 'BACKORDER_REVIEW'  // Worker found less inventory than expected, needs manager review
  | 'PACKING'
  | 'SHIPPING'
  | 'SHIPPED'
  | 'PARTIAL_SHIPPED'
  | 'COMMUNICATED'      // Shipping confirmation email sent to customer
  | 'DELIVERED'
  | 'CANCELLED';

// Location types for picking priority
export type LocationType = 'PRIMARY' | 'OVERFLOW' | 'RESERVE' | 'STAGING';

// Inventory location with quantity for multi-location picking
export interface InventoryLocation {
  locationId: string;
  locationName: string;        // e.g., "Shelf 1A, Bin A"
  locationType: LocationType;
  quantity: number;
  priority: number;            // Lower = pick first (Overflow = 1, Primary = 2, etc.)
}

// Picking record for a specific location
export interface PickingLocationRecord {
  locationId: string;
  locationName: string;
  expectedQty: number;         // System thinks this much is here
  pickedQty: number;           // Worker actually picked this much
  shortQty: number;            // Difference if picked < expected
}

// Backorder review data when worker reports shortage
export interface BackorderReviewData {
  lineItemId: string;
  expectedTotal: number;
  actualTotal: number;
  shortageQty: number;
  workerNotes: string;
  reportedBy: string;
  reportedAt: string;
  locationRecords: PickingLocationRecord[];
}

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

// -----------------------------------------------------------------------------
// Lite Types for Nested GraphQL Responses (Backend Migration)
// -----------------------------------------------------------------------------

export interface OrderLite {
  id: string;
  orderNumber: string;
  status?: string;
  soldToCustomerId?: string;
  customer?: CustomerLite | null;
}

export interface CustomerLite {
  id: string;
  companyName: string;
}

export interface WarehouseLite {
  id: string;
  name: string;
  status?: string;
  isActive?: boolean | null;
}

export interface ShippingCarrierLite {
  id: string;
  name: string;
  carrierType?: string | null;
  code?: string | null;
  isActive?: boolean | null;
  trackingUrlTemplate?: string | null;
}

export interface FactoryLite {
  id: string;
  title: string;
}

export interface UomLite {
  id: string;
  title: string;
}

export interface ProductLite {
  id: string;
  factoryPartNumber: string;
  description?: string | null;
  factory?: FactoryLite | null;
  uom?: UomLite | null;
}

export interface UserLite {
  id: string;
  fullName: string;
  email: string;
}

// -----------------------------------------------------------------------------
// Fulfillment Order Line Item
// -----------------------------------------------------------------------------

export interface FulfillmentOrderLineItem {
  id: string;
  fulfillmentOrderId?: string;
  orderLineItemId?: string;       // Link back to original order line item (orderDetailId in API)
  orderDetailId?: string | null;  // API field name for order line item link
  productId: string;
  product?: ProductLite | null;   // Nested product info from backend
  orderedQty: number;

  // Warehouse reality - qty breakdown
  allocatedQty: number;
  pickedQty: number;
  packedQty: number;
  shippedQty: number;
  backorderQty: number;

  // Optional warehouse specifics
  warehouseLocationOverride?: string;  // Override from order-level warehouse
  pickLocation?: string;               // Bin location for picking
  shortReason?: string;                // Reason if backorder > 0

  // Manufacturer fulfillment fields (for backorder handling)
  fulfilledByManufacturer?: boolean;   // If true, this line is fulfilled directly by manufacturer
  manufacturerFulfillmentStatus?: ManufacturerFulfillmentStatus;
  linkedShipmentRequestId?: string;    // Link to shipment request if option 2 was chosen
  manufacturerId?: string;             // Manufacturer ID for direct fulfillment
  manufacturerName?: string;           // Manufacturer name for display

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentOrder {
  id: string;
  fulfillmentOrderNumber: string;  // e.g., "FO-2024-001"

  // Source order info (nested from backend)
  orderId: string;
  order?: OrderLite | null;        // Nested order info

  // Customer info (nested from backend)
  customerId?: string;
  customer?: CustomerLite | null;  // Nested customer info

  // 1) Warehouse context (nested from backend)
  warehouseId: string;
  warehouse?: WarehouseLite | null; // Nested warehouse info
  carrierId?: string | null;
  carrier?: ShippingCarrierLite | null; // Nested carrier info
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
  shipStatus?: 'NOT_SHIPPED' | 'PARTIAL' | 'SHIPPED';
  carrierType?: 'parcel' | 'freight' | 'PARCEL' | 'FREIGHT' | null;  // Type of carrier used
  trackingNumbers?: string[];  // Can hold multiple tracking numbers
  shipConfirmedAt?: string;    // Proof of shipment - commission triggers

  // 7) Freight/LTL specific fields
  bolNumber?: string;          // Bill of Lading number
  proNumber?: string;          // PRO number for freight tracking
  freightClass?: string;       // Freight class (e.g., "85", "100")
  shippingNotes?: string;      // Delivery instructions, special handling

  // 8) Pickup/Will-Call/Handoff fields (for non-parcel shipments)
  pickupSignature?: string;    // Base64 encoded signature image
  pickupTimestamp?: string;    // When the pickup occurred
  pickupCustomerName?: string; // Customer/company name for pickup
  pickupDriverName?: string;   // Name of person who picked up
  pickupNotes?: string;        // Notes from pickup (ID verified, condition, etc.)

  // 9) Backorder/Manufacturer fulfillment tracking
  hasBackorderItems?: boolean;           // True if any line items are on backorder
  manufacturerOrderStatus?: 'NONE' | 'PARTIAL' | 'FULL';  // Overall manufacturer fulfillment status
  linkedShipmentRequestIds?: string[];   // Shipment requests created for this order
  pendingShipmentRequestId?: string;     // Active shipment request waiting for inventory
  holdReason?: string;                   // Reason if order is on hold (e.g., "Pending inventory shipment SR-2024-003")
  backorderReviewData?: BackorderReviewData;  // Data from worker-reported shortage during picking

  // Overall status
  status: FulfillmentOrderStatus;

  // Line items
  lineItems: FulfillmentOrderLineItem[];

  // 10) Assignment - Managers, Workers & Inside Sales
  assignedManagers?: AssignedUser[];   // Managers responsible for this order
  assignedWorkers?: AssignedUser[];    // Workers assigned to fulfill this order
  assignedInsideSales?: AssignedUser[]; // Inside salesperson responsible for this order

  // 11) Attached Documents
  documents?: AttachedDocument[];      // Packing slips, BOL, shipping labels, photos, etc.

  // 12) Activity Feed
  activities?: FulfillmentActivity[];  // Activity feed for notes, status changes, etc.

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
  BACKORDER_REVIEW: 'Backorder Review',
  PACKING: 'Packing',
  SHIPPING: 'Shipping',
  SHIPPED: 'Shipped',
  PARTIAL_SHIPPED: 'Partial Shipped',
  COMMUNICATED: 'Communicated',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const fulfillmentOrderStatusColors: Record<FulfillmentOrderStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  RELEASED: 'bg-cyan-100 text-cyan-700',
  PICKING: 'bg-yellow-100 text-yellow-700',
  BACKORDER_REVIEW: 'bg-red-100 text-red-700',
  PACKING: 'bg-orange-100 text-orange-700',
  SHIPPING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-green-100 text-green-700',
  PARTIAL_SHIPPED: 'bg-blue-100 text-blue-700',
  COMMUNICATED: 'bg-teal-100 text-teal-700',
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

// Manufacturer fulfillment status labels and colors
export const manufacturerFulfillmentStatusLabels: Record<ManufacturerFulfillmentStatus, string> = {
  PENDING_MANUFACTURER: 'Pending Manufacturer',
  MANUFACTURER_CONFIRMED: 'Manufacturer Confirmed',
  MANUFACTURER_SHIPPED: 'Manufacturer Shipped',
  MANUFACTURER_DELIVERED: 'Manufacturer Delivered',
};

export const manufacturerFulfillmentStatusColors: Record<ManufacturerFulfillmentStatus, string> = {
  PENDING_MANUFACTURER: 'bg-amber-100 text-amber-700',
  MANUFACTURER_CONFIRMED: 'bg-blue-100 text-blue-700',
  MANUFACTURER_SHIPPED: 'bg-indigo-100 text-indigo-700',
  MANUFACTURER_DELIVERED: 'bg-green-100 text-green-700',
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
  carrierId?: string;
  expectedDate?: string;
  arrivedAt?: string;
  receivingStartedAt?: string;
  receivedAt?: string;
  notes?: string;
  // Recurring shipment link
  recurringShipmentId?: string;  // If generated from a recurring shipment
  // Assignment - Managers & Workers
  assignedManagers?: AssignedUser[];   // Managers responsible for this delivery
  assignedWorkers?: AssignedUser[];    // Workers assigned to receive this delivery
  // Attached Documents
  documents?: AttachedDocument[];      // Packing slips, BOL, receipts, photos, etc.
  // Delivery issues for receiving summary
  issues?: IncomingShipmentIssue[];
  createdAt: string;
  updatedAt: string;
}

export interface IncomingShipmentIssue {
  id: string;
  deliveryItemId: string;
  issueType: DeliveryIssueType;
  customIssueType?: string;
  qty: number;
  description?: string;
}

export interface ShipmentLineItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  expectedQuantity: number;
  receivedQuantity: number;
  damagedQuantity?: number;
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
// Cycle Counts
// -----------------------------------------------------------------------------

export type CycleCountStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export type CycleCountType =
  | 'FULL'           // Full warehouse count
  | 'PARTIAL'        // Specific sections/aisles
  | 'ABC'            // ABC classification based
  | 'RANDOM'         // Random sample
  | 'BLIND'          // Counters don't see expected quantities
  | 'PRODUCT';       // Specific products

export type CycleCountPriority = 'low' | 'medium' | 'high' | 'urgent';

// Trigger types for cycle count creation
export type CycleCountTriggerType =
  | 'MANUAL'              // Manual SKU selection
  | 'FAST_MOVING'         // Auto-generate from fast-moving items
  | 'RANDOM_A_ITEMS'      // Randomized A-class items
  | 'ON_DEMAND'           // "We're slow today" trigger
  | 'BY_MANUFACTURER'     // Count by manufacturer
  | 'LOW_QUANTITY'        // Count items below threshold
  | 'SCHEDULED';          // Regular scheduled count

export const cycleCountTriggerTypeLabels: Record<CycleCountTriggerType, string> = {
  MANUAL: 'Manual Selection',
  FAST_MOVING: 'Fast-Moving Items',
  RANDOM_A_ITEMS: 'Random A-Items',
  ON_DEMAND: 'On Demand',
  BY_MANUFACTURER: 'By Manufacturer',
  LOW_QUANTITY: 'Low Quantity',
  SCHEDULED: 'Scheduled',
};

export const cycleCountTriggerTypeDescriptions: Record<CycleCountTriggerType, string> = {
  MANUAL: 'Manually select specific SKUs to count',
  FAST_MOVING: 'Auto-generate count from high-velocity items',
  RANDOM_A_ITEMS: 'Random sample of high-value A-class items',
  ON_DEMAND: 'Quick count when capacity allows',
  BY_MANUFACTURER: 'Count all items from a specific manufacturer',
  LOW_QUANTITY: 'Count items below a quantity threshold',
  SCHEDULED: 'Regular scheduled inventory verification',
};

// Discrepancy reasons for cycle count feedback
export type CycleCountDiscrepancyReason =
  | 'DAMAGE'
  | 'MISPLACED'
  | 'THEFT'
  | 'SHIPPING_ERROR'
  | 'RECEIVING_ERROR'
  | 'SYSTEM_ERROR'
  | 'EXPIRED'
  | 'WRONG_LOCATION'
  | 'OVERAGE'
  | 'OTHER';

export const cycleCountDiscrepancyReasonLabels: Record<CycleCountDiscrepancyReason, string> = {
  DAMAGE: 'Damaged',
  MISPLACED: 'Misplaced',
  THEFT: 'Suspected Theft',
  SHIPPING_ERROR: 'Shipping Error',
  RECEIVING_ERROR: 'Receiving Error',
  SYSTEM_ERROR: 'System Error',
  EXPIRED: 'Expired',
  WRONG_LOCATION: 'Wrong Location',
  OVERAGE: 'Overage',
  OTHER: 'Other',
};

export const cycleCountDiscrepancyReasonColors: Record<CycleCountDiscrepancyReason, string> = {
  DAMAGE: 'bg-orange-100 text-orange-700',
  MISPLACED: 'bg-purple-100 text-purple-700',
  THEFT: 'bg-red-100 text-red-700',
  SHIPPING_ERROR: 'bg-yellow-100 text-yellow-700',
  RECEIVING_ERROR: 'bg-yellow-100 text-yellow-700',
  SYSTEM_ERROR: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
  WRONG_LOCATION: 'bg-indigo-100 text-indigo-700',
  OVERAGE: 'bg-green-100 text-green-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

// Inventory issue breakdown for cycle count (like delivery issues)
export interface CycleCountInventoryIssue {
  type: CycleCountDiscrepancyReason;
  quantity: number;
  notes?: string;
  // Damage-specific
  damageDescription?: string;
  // Misplaced/wrong location specific
  foundLocation?: string;
  expectedLocation?: string;
  // Expired specific
  expirationDate?: string;
}

// Activity feed for cycle counts (like delivery issues)
export type CycleCountActivityType =
  | 'CREATED'
  | 'RELEASED'
  | 'ITEM_COUNTED'
  | 'ITEM_VERIFIED'
  | 'ITEM_SKIPPED'
  | 'ITEM_RECOUNT_REQUESTED'
  | 'DISCREPANCY_REPORTED'
  | 'NOTE_ADDED'
  | 'SUBMITTED_FOR_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CycleCountActivity {
  id: string;
  cycleCountId: string;
  type: CycleCountActivityType;
  timestamp: string;
  createdBy: string;
  createdByName: string;
  content?: string;
  metadata?: {
    lineItemId?: string;
    productName?: string;
    partNumber?: string;
    systemQuantity?: number;
    countedQuantity?: number;
    variance?: number;
    discrepancyReason?: CycleCountDiscrepancyReason;
    issues?: CycleCountInventoryIssue[];
  };
}

export interface CycleCountLineItem {
  id: string;
  cycleCountId: string;
  inventoryItemId: string;
  productId: string;
  productName: string;
  partNumber: string;
  binId: string;
  binLocation: string;
  fullLocationPath: string;
  lotNumber?: string;

  // Quantities
  systemQuantity: number;      // Expected quantity from system
  countedQuantity?: number;    // Actual counted quantity
  variance?: number;           // Difference (counted - system)
  variancePercent?: number;    // Variance as percentage

  // Status tracking - simplified to match/discrepancy flow
  status: 'pending' | 'counted' | 'verified' | 'adjusted' | 'skipped';
  isMatch?: boolean;           // Simple match/discrepancy indicator
  countedBy?: string;
  countedByName?: string;
  countedAt?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;

  // Recounts
  recountRequired: boolean;
  recountReason?: string;
  recountQuantity?: number;
  recountedBy?: string;
  recountedAt?: string;

  // Detailed inventory issues (like delivery issues - can have multiple)
  inventoryIssues?: CycleCountInventoryIssue[];

  // Legacy discrepancy fields (kept for backwards compatibility)
  discrepancyReason?: CycleCountDiscrepancyReason;
  damageNotes?: string;
  misplacedNotes?: string;
  correctLocation?: string;

  notes?: string;
}

export interface CycleCount {
  id: string;
  cycleCountNumber: string;    // e.g., "CC-2024-001"

  // Basic info
  name: string;
  description?: string;
  type: CycleCountType;
  priority: CycleCountPriority;
  status: CycleCountStatus;

  // Trigger/creation method
  triggerType?: CycleCountTriggerType;

  // Warehouse context
  warehouseId: string;
  warehouseName: string;

  // Scope (what to count)
  scope: {
    sections?: string[];       // Specific section IDs
    aisles?: string[];         // Specific aisle IDs
    shelves?: string[];        // Specific shelf IDs
    products?: string[];       // Specific product IDs
    factories?: string[];      // Specific manufacturer IDs
    abcClass?: 'A' | 'B' | 'C'; // ABC classification
    quantityThreshold?: number; // For LOW_QUANTITY trigger - count items below this
    excludeRecentlyCountedDays?: number; // Exclude items counted within X days (default 60)
  };

  // Scheduling
  scheduledDate: string;
  dueDate?: string;

  // Assignment
  assignedTo?: string;
  assignedToName?: string;

  // Progress tracking
  lineItems: CycleCountLineItem[];
  totalItems: number;
  countedItems: number;
  itemsWithVariance: number;

  // Timestamps
  startedAt?: string;
  startedBy?: string;
  completedAt?: string;
  completedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;

  // Summary stats (calculated on completion)
  totalSystemQuantity?: number;
  totalCountedQuantity?: number;
  totalVariance?: number;
  accuracyPercentage?: number;

  // Activity feed
  activities?: CycleCountActivity[];

  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// Status labels and colors
export const cycleCountStatusLabels: Record<CycleCountStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  PENDING_REVIEW: 'Pending Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const cycleCountStatusColors: Record<CycleCountStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  PENDING_REVIEW: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const cycleCountTypeLabels: Record<CycleCountType, string> = {
  FULL: 'Full Count',
  PARTIAL: 'Partial Count',
  ABC: 'ABC Classification',
  RANDOM: 'Random Sample',
  BLIND: 'Blind Count',
  PRODUCT: 'Product-Based',
};

export const cycleCountPriorityLabels: Record<CycleCountPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const cycleCountPriorityColors: Record<CycleCountPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

// Inventory velocity type
export type InventoryVelocity = 'fast' | 'medium' | 'slow';

export const inventoryVelocityLabels: Record<InventoryVelocity, string> = {
  fast: 'Fast Moving',
  medium: 'Medium Moving',
  slow: 'Slow Moving',
};

export const inventoryVelocityColors: Record<InventoryVelocity, string> = {
  fast: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  slow: 'bg-green-100 text-green-700',
};

// Recurring Cycle Count Job
export type RecurringCycleCountStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface RecurringCycleCountJob {
  id: string;
  name: string;
  description?: string;

  // Warehouse context
  warehouseId: string;
  warehouseName: string;

  // What to count - auto-generation settings
  triggerType: CycleCountTriggerType;
  itemCount: number;                      // How many items to count per job
  velocityFilter?: InventoryVelocity[];   // Filter by fast/medium/slow moving
  excludeRecentlyCountedDays: number;     // Default 60 days

  // Recurrence settings
  recurrencePattern: {
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'MONTHLY_WEEK';
    interval: number;
    dayOfWeek?: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    weekOfMonth?: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'LAST';
    dayOfMonth?: number;
  };
  startDate: string;
  endDate?: string;

  // Assignment
  assignedTo?: string;
  assignedToName?: string;

  // Status tracking
  status: RecurringCycleCountStatus;
  lastGeneratedDate?: string;
  nextScheduledDate?: string;

  // Linked cycle counts
  generatedCycleCountIds: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export const recurringCycleCountStatusLabels: Record<RecurringCycleCountStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

export const recurringCycleCountStatusColors: Record<RecurringCycleCountStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

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
  DRAFT: 'Draft',
  PENDING: 'Expected',
  CONFIRMED: 'Expected',
  ARRIVED: 'Arrived',
  RECEIVING: 'Receiving',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export const shipmentStatusColors: Record<ShipmentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  ARRIVED: 'bg-purple-100 text-purple-700',
  RECEIVING: 'bg-yellow-100 text-yellow-700',
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

export type ShipmentRequestMethod = 'EMAIL' | 'PHONE_CALL' | 'MANUFACTURER_SYSTEM';

export type ShipmentPriority = 'STANDARD' | 'EXPEDITED' | 'URGENT';

export type ShipmentRequestStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'CANCELLED'
  | 'REJECTED';

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
  priority: ShipmentPriority;
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
  PHONE_CALL: 'Phone Call',
  MANUFACTURER_SYSTEM: 'Manufacturer System',
};

export const shipmentRequestStatusLabels: Record<ShipmentRequestStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  SENT: 'Sent',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  SHIPPED: 'Shipped',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

export const shipmentRequestStatusColors: Record<ShipmentRequestStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-red-100 text-red-700',
};

// -----------------------------------------------------------------------------
// Manufacturer Profile (Vendor Settings for Warehouse)
// -----------------------------------------------------------------------------

export type OutboundCommunicationType = 'PDF' | 'EDI';

export interface VendorCustomerXRef {
  id: string;
  manufacturerProfileId: string;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  vendorCustomerNumber: string;
  selectDefaultShipper?: string;
  quoteReference?: string;
  // Checkboxes
  alwaysFactoryBO: boolean;
  creditHold: boolean;
  // Additional vendor customer numbers
  additionalVendorCustomerNumbers?: { number: string; name: string }[];
  // Customer assigned codes
  customerAssignedCodes?: { codeNumber: string; codeName: string }[];
  // Ship-to addresses
  shipToAddresses?: VendorShipToAddress[];
}

export interface VendorShipToAddress {
  id: string;
  name: string;
  address: string;
  customerAddressCode?: string;
}

export interface VendorShipToXRef {
  id: string;
  manufacturerProfileId: string;
  shipToId: string;
  shipToName: string;
  shipToAddress?: string;
  vendorShipToCode: string;
  notes?: string;
}

export interface FreightCategory {
  id: string;
  manufacturerProfileId?: string;
  vendorName: string;
  nmfcCode?: string;              // NMFC code (e.g., "48505")
  freightCategory: number;        // Freight class (e.g., 65)
  description: string;
  classRate: number;
  flammable: boolean;
  hazmat?: boolean;               // Hazardous materials flag
  fragile?: boolean;              // Fragile handling flag
}

export interface ManufacturerProfile {
  id: string;
  manufacturerId: string;       // Links to Company (Manufacturer)
  manufacturerName: string;

  // Basic Vendor Settings
  vendorName: string;
  vendorGroup?: string;
  repCode?: string;
  phone?: string;
  mainEmailAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  mainFaxNumber?: string;
  website?: string;
  orderPrefix?: string;

  // Order Sequence
  orderSequenceStart: number;
  orderSequenceEnd: number;

  // Flags & Settings
  alwaysFactoryBO: boolean;
  warehousing: boolean;
  warehouseCopySortOrder: 'default' | 'alphabetical';

  // Vendor Shipper
  selectDefaultShipper?: string;

  // Pricing & Remarks
  remarks?: string;

  // Checkboxes from image 1
  manualProductAllowed: boolean;
  isBuySell: boolean;
  releaseCopySortOnLineItem: boolean;

  orderAllowedWithoutCustomerXRef: boolean;
  orderAllowedWithoutShipToXRef: boolean;
  defaultToManualPricing: boolean;
  warnAboutPartialQtyOrder: boolean;

  communicateUsingEdiOutFiles: boolean;
  communicateReleasesOnly: boolean;
  downloadSummaryEdi: boolean;

  // Communication settings
  outboundCommunication: OutboundCommunicationType;
  inboundCommunication: OutboundCommunicationType;

  // Select Master Vendor
  masterVendorId?: string;

  // Vendor Contacts (collapsible section)
  contacts?: ManufacturerContact[];

  // Default Warehouse Contacts (with warehouse-specific roles)
  warehouseContacts?: {
    contactId: string;
    name: string;
    email: string;
    phone: string;
    warehouseRole: string;
    isDefault?: boolean;
  }[];

  // Freight Terms (collapsible section)
  freightTerms?: string;

  // Shipper Account Number (collapsible section)
  shipperAccountNumber?: string;

  // Vendor Customer X-Refs
  customerXRefs?: VendorCustomerXRef[];

  // Ship-To X-Refs
  shipToXRefs?: VendorShipToXRef[];

  // Freight Categories
  freightCategories?: FreightCategory[];

  // Metadata
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// -----------------------------------------------------------------------------
// Recurring Shipments
// -----------------------------------------------------------------------------

export type RecurrenceFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'MONTHLY_WEEK';  // e.g., "First Monday of every month"

export type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export type WeekOfMonth = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'LAST';

export type RecurringShipmentStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number;              // Every X days/weeks/months
  dayOfWeek?: DayOfWeek;         // For WEEKLY/BIWEEKLY/MONTHLY_WEEK
  weekOfMonth?: WeekOfMonth;     // For MONTHLY_WEEK (e.g., "First Monday")
  dayOfMonth?: number;           // For MONTHLY (1-31)
  expectedItems?: ExpectedItem[]; // Optional: stored template items
}

export interface RecurringShipment {
  id: string;
  name: string;                  // Display name for this recurring shipment

  // Template data - copied to each generated shipment
  vendorId: string;
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  warehouseId: string;
  warehouseName: string;
  carrier?: string;
  expectedItems: ExpectedItem[];
  notes?: string;

  // Recurrence settings
  recurrencePattern: RecurrencePattern;
  startDate: string;             // When the recurrence starts
  endDate?: string;              // Optional end date

  // Status tracking
  status: RecurringShipmentStatus;
  lastGeneratedDate?: string;    // Last time a shipment was auto-generated
  nextExpectedDate?: string;     // Next expected shipment date

  // Linked shipments
  generatedShipmentIds: string[]; // All shipments created from this recurring template

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export const recurrenceFrequencyLabels: Record<RecurrenceFrequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 Weeks',
  MONTHLY: 'Monthly (Day of Month)',
  MONTHLY_WEEK: 'Monthly (Week & Day)',
};

export const dayOfWeekLabels: Record<DayOfWeek, string> = {
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
};

export const weekOfMonthLabels: Record<WeekOfMonth, string> = {
  FIRST: 'First',
  SECOND: 'Second',
  THIRD: 'Third',
  FOURTH: 'Fourth',
  LAST: 'Last',
};

export const recurringShipmentStatusLabels: Record<RecurringShipmentStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

export const recurringShipmentStatusColors: Record<RecurringShipmentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// -----------------------------------------------------------------------------
// Delivery Issues
// -----------------------------------------------------------------------------

export type DeliveryIssueType =
  | 'DAMAGED'
  | 'MISSING'
  | 'OVERAGE'
  | 'WRONG_ITEM'
  | 'OTHER';

export type DeliveryIssueStatus =
  | 'OPEN'
  | 'COMMUNICATED'
  | 'RESOLVED'
  | 'CLOSED';

export interface DeliveryIssueItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  issueType: DeliveryIssueType;
  customIssueType?: string; // For 'OTHER' type - user-defined issue type name
  quantity: number;
  description?: string;
  notes?: string; // Notes specific to this item
}

// Activity feed entry for delivery issues
export type DeliveryIssueActivityType =
  | 'CREATED'
  | 'COMMUNICATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'NOTE_ADDED'
  | 'ITEM_NOTE_ADDED';

export interface DeliveryIssueActivity {
  id: string;
  type: DeliveryIssueActivityType;
  timestamp: string;
  createdBy: string;
  content?: string; // Note content or description
  metadata?: {
    method?: 'EMAIL' | 'PHONE' | 'PORTAL';
    resolutionType?: string;
    creditAmount?: number;
    itemId?: string; // For item-specific notes
  };
}

export interface DeliveryIssue {
  id: string;
  issueNumber: string;
  shipmentId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  vendorContact?: string;
  warehouseId: string;
  warehouseName: string;
  status: DeliveryIssueStatus;
  items: DeliveryIssueItem[];
  totalAffectedQuantity: number;

  // Communication tracking
  communicatedAt?: string;
  communicatedBy?: string;
  communicationMethod?: 'EMAIL' | 'PHONE' | 'PORTAL';
  communicationNotes?: string;

  // Resolution tracking
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionType?: 'CREDIT' | 'REPLACEMENT' | 'PARTIAL_CREDIT' | 'NO_ACTION' | 'OTHER';
  resolutionNotes?: string;
  creditAmount?: number;
  replacementShipmentId?: string;

  // General
  notes?: string;
  reportedAt: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;

  // Activity feed
  activities?: DeliveryIssueActivity[];
}

export const deliveryIssueTypeLabels: Record<DeliveryIssueType, string> = {
  DAMAGED: 'Damaged',
  MISSING: 'Missing',
  OVERAGE: 'Overage',
  WRONG_ITEM: 'Wrong Item',
  OTHER: 'Other',
};

export const deliveryIssueTypeColors: Record<DeliveryIssueType, string> = {
  DAMAGED: 'bg-orange-100 text-orange-700',
  MISSING: 'bg-red-100 text-red-700',
  OVERAGE: 'bg-blue-100 text-blue-700',
  WRONG_ITEM: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export const deliveryIssueStatusLabels: Record<DeliveryIssueStatus, string> = {
  OPEN: 'Open',
  COMMUNICATED: 'Communicated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const deliveryIssueStatusColors: Record<DeliveryIssueStatus, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  COMMUNICATED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
};

// -----------------------------------------------------------------------------
// Product Profile - Bin Location Management
// -----------------------------------------------------------------------------

export interface ProductBinLocation {
  id: string;
  binId: string;
  locationCode: string;           // Short code e.g., "A3-B-12"
  locationName: string;           // e.g., "Aisle 3, Shelf B, Bin 12"
  fullPath: string;               // Full path for display
  warehouseId: string;
  warehouseName?: string;
  priority: number;               // 1 = main bin, 2+ = alternate bins (lower number = higher priority)
  maxCapacity?: number;
  currentQuantity: number;
  notes?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductProfile {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  description?: string;
  factoryId: string;
  factoryName: string;

  // Inventory summary
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;

  // Bin locations with priority
  binLocations: ProductBinLocation[];

  // Product specifications
  unitOfMeasure?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };

  // Financial info (for managers)
  ownershipType: OwnershipType;
  unitCost?: number;
  commissionPercentage?: number;

  // Inventory settings
  reorderPoint?: number;
  reorderQuantity?: number;
  maxQuantity?: number;
  abcClass?: InventoryAbcClass;
  movementVelocity?: 'fast' | 'medium' | 'slow';

  // Cycle count info
  lastCycleCountDate?: string;
  cycleCountFrequency?: number;

  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Fulfillment Order Activity Feed
// -----------------------------------------------------------------------------

export type FulfillmentActivityType =
  | 'CREATED'
  | 'RELEASED'
  | 'PICK_STARTED'
  | 'PICK_COMPLETED'
  | 'PACK_STARTED'
  | 'PACK_COMPLETED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'NOTE_ADDED'
  | 'ITEM_NOTE_ADDED'
  | 'BACKORDER_REPORTED'
  | 'ASSIGNMENT_ADDED'
  | 'ASSIGNMENT_REMOVED';

export interface FulfillmentActivity {
  id: string;
  type: FulfillmentActivityType;
  timestamp: string;
  createdBy: string;
  content?: string;
  metadata?: {
    lineItemId?: string;
    partNumber?: string;
    assignmentType?: 'manager' | 'worker';
    assigneeName?: string;
    trackingNumber?: string;
    carrier?: string;
    // Email confirmation metadata
    emailTo?: string;
    emailSubject?: string;
    attachedDocIds?: string[];
  };
}
