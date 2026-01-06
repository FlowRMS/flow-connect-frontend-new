/**
 * Fulfillment API Module
 * GraphQL API for fulfillment order operations
 */

import { crmGraphQLRequest } from '../../lib/graphql/client';

// ============================================================================
// Types
// ============================================================================

export type FulfillmentOrderStatus =
  | 'PENDING'
  | 'RELEASED'
  | 'PICKING'
  | 'PACKING'
  | 'SHIPPING'
  | 'SHIPPED'
  | 'COMMUNICATED'
  | 'DELIVERED'
  | 'BACKORDER_REVIEW'
  | 'PARTIAL_SHIPPED'
  | 'CANCELLED';

export type FulfillmentMethod = 'SHIP' | 'WILL_CALL';

export type CarrierType = 'PARCEL' | 'FREIGHT';

export type FulfillmentAssignmentRole = 'MANAGER' | 'WORKER' | 'INSIDE_SALES';

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
  | 'ASSIGNMENT_REMOVED'
  | 'SIGNATURE_CAPTURED'
  | 'TRACKING_ADDED';

export interface ShipToAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface FulfillmentActivity {
  id: string;
  activityType: FulfillmentActivityType;
  content: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  createdById: string;
}

export interface FulfillmentAssignment {
  id: string;
  userId: string;
  role: FulfillmentAssignmentRole;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export interface PackingBoxItem {
  id: string;
  fulfillmentLineItemId: string;
  quantity: number;
}

export interface PackingBox {
  id: string;
  boxNumber: number;
  containerTypeId: string | null;
  containerTypeName: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  trackingNumber: string | null;
  labelPrintedAt: string | null;
  createdAt: string;
  items: PackingBoxItem[];
}

export interface FulfillmentOrderLineItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  uom: string;
  orderDetailId: string | null;
  orderedQty: number;
  allocatedQty: number;
  pickedQty: number;
  packedQty: number;
  shippedQty: number;
  backorderQty: number;
  fulfilledByManufacturer: boolean;
  manufacturerFulfillmentStatus: string | null;
  linkedShipmentRequestId: string | null;
  shortReason: string | null;
  notes: string | null;
  packingBoxItems: PackingBoxItem[];
}

export interface FulfillmentOrder {
  id: string;
  fulfillmentOrderNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  carrierId: string | null;
  carrierName: string | null;
  status: FulfillmentOrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  carrierType: CarrierType | null;
  needByDate: string | null;
  hasBackorderItems: boolean;
  holdReason: string | null;
  releasedAt: string | null;
  pickStartedAt: string | null;
  pickCompletedAt: string | null;
  packCompletedAt: string | null;
  shipConfirmedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  trackingNumbers: string[];
  bolNumber: string | null;
  proNumber: string | null;
  pickupSignature: string | null;
  pickupTimestamp: string | null;
  pickupCustomerName: string | null;
  driverName: string | null;
  shipToAddress: ShipToAddress | null;
  lineItems: FulfillmentOrderLineItem[];
  packingBoxes: PackingBox[];
  assignments: FulfillmentAssignment[];
  activities: FulfillmentActivity[];
}

export interface FulfillmentStats {
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  backorderCount: number;
}

// Input Types
export interface ShipToAddressInput {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface CreateFulfillmentOrderInput {
  orderId: string;
  warehouseId: string;
  fulfillmentMethod?: FulfillmentMethod;
  carrierId?: string | null;
  carrierType?: CarrierType | null;
  shipToAddress?: ShipToAddressInput | null;
  needByDate?: string | null;
}

export interface UpdateFulfillmentOrderInput {
  warehouseId?: string | null;
  carrierId?: string | null;
  carrierType?: CarrierType | null;
  shipToAddress?: ShipToAddressInput | null;
  needByDate?: string | null;
  holdReason?: string | null;
}

export interface UpdatePickedQuantityInput {
  lineItemId: string;
  quantity: number;
  notes?: string | null;
}

export interface CreatePackingBoxInput {
  containerTypeId?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
}

export interface UpdatePackingBoxInput {
  containerTypeId?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
  trackingNumber?: string | null;
}

export interface AssignItemToBoxInput {
  boxId: string;
  lineItemId: string;
  quantity: number;
}

export interface CompleteShippingInput {
  trackingNumbers?: string[] | null;
  bolNumber?: string | null;
  proNumber?: string | null;
  signature?: string | null;
  driverName?: string | null;
  pickupCustomerName?: string | null;
}

export interface BulkAssignmentInput {
  fulfillmentOrderIds: string[];
  managerIds?: string[] | null;
  workerIds?: string[] | null;
}

export interface FulfillmentFilters {
  warehouseId?: string;
  status?: FulfillmentOrderStatus[];
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// GraphQL Fragments
// ============================================================================

const FULFILLMENT_ORDER_FRAGMENT = `
  fragment FulfillmentOrderFields on FulfillmentOrderResponse {
    id
    fulfillmentOrderNumber
    orderId
    orderNumber
    customerName
    warehouseId
    warehouseName
    carrierId
    carrierName
    status
    fulfillmentMethod
    carrierType
    needByDate
    hasBackorderItems
    holdReason
    releasedAt
    pickStartedAt
    pickCompletedAt
    packCompletedAt
    shipConfirmedAt
    deliveredAt
    createdAt
    trackingNumbers
    bolNumber
    proNumber
    pickupSignature
    pickupTimestamp
    pickupCustomerName
    driverName
    shipToAddress {
      street
      city
      state
      postalCode
      country
    }
    lineItems {
      id
      productId
      productName
      partNumber
      uom
      orderDetailId
      orderedQty
      allocatedQty
      pickedQty
      packedQty
      shippedQty
      backorderQty
      fulfilledByManufacturer
      manufacturerFulfillmentStatus
      linkedShipmentRequestId
      shortReason
      notes
      packingBoxItems {
        id
        fulfillmentLineItemId
        quantity
      }
    }
    packingBoxes {
      id
      boxNumber
      containerTypeId
      containerTypeName
      length
      width
      height
      weight
      trackingNumber
      labelPrintedAt
      createdAt
      items {
        id
        fulfillmentLineItemId
        quantity
      }
    }
    assignments {
      id
      userId
      role
      userName
      userEmail
      createdAt
    }
    activities {
      id
      activityType
      content
      metadata
      createdAt
      createdById
    }
  }
`;

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_FULFILLMENT_ORDERS = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  query GetFulfillmentOrders(
    $warehouseId: UUID
    $status: [FulfillmentOrderStatus!]
    $search: String
    $limit: Int
    $offset: Int
  ) {
    fulfillmentOrders(
      warehouseId: $warehouseId
      status: $status
      search: $search
      limit: $limit
      offset: $offset
    ) {
      ...FulfillmentOrderFields
    }
  }
`;

const GET_FULFILLMENT_ORDER = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  query GetFulfillmentOrder($id: UUID!) {
    fulfillmentOrder(id: $id) {
      ...FulfillmentOrderFields
    }
  }
`;

const GET_FULFILLMENT_STATS = `
  query GetFulfillmentStats($warehouseId: UUID) {
    fulfillmentStats(warehouseId: $warehouseId) {
      pendingCount
      inProgressCount
      completedCount
      backorderCount
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_FULFILLMENT_ORDER = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation CreateFulfillmentOrder($input: CreateFulfillmentOrderInput!) {
    createFulfillmentOrder(input: $input) {
      ...FulfillmentOrderFields
    }
  }
`;

const UPDATE_FULFILLMENT_ORDER = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation UpdateFulfillmentOrder($id: UUID!, $input: UpdateFulfillmentOrderInput!) {
    updateFulfillmentOrder(id: $id, input: $input) {
      ...FulfillmentOrderFields
    }
  }
`;

const RELEASE_TO_WAREHOUSE = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation ReleaseToWarehouse($id: UUID!) {
    releaseToWarehouse(id: $id) {
      ...FulfillmentOrderFields
    }
  }
`;

const CANCEL_FULFILLMENT_ORDER = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation CancelFulfillmentOrder($id: UUID!, $reason: String!) {
    cancelFulfillmentOrder(id: $id, reason: $reason) {
      ...FulfillmentOrderFields
    }
  }
`;

const BULK_ASSIGN_FULFILLMENT_ORDERS = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation BulkAssignFulfillmentOrders($input: BulkAssignmentInput!) {
    bulkAssignFulfillmentOrders(input: $input) {
      ...FulfillmentOrderFields
    }
  }
`;

const START_PICKING = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation StartPicking($id: UUID!) {
    startPicking(id: $id) {
      ...FulfillmentOrderFields
    }
  }
`;

const UPDATE_PICKED_QUANTITY = `
  mutation UpdatePickedQuantity($input: UpdatePickedQuantityInput!) {
    updatePickedQuantity(input: $input) {
      id
      productId
      productName
      partNumber
      uom
      orderDetailId
      orderedQty
      allocatedQty
      pickedQty
      packedQty
      shippedQty
      backorderQty
      fulfilledByManufacturer
      manufacturerFulfillmentStatus
      linkedShipmentRequestId
      shortReason
      notes
      packingBoxItems {
        id
        fulfillmentLineItemId
        quantity
      }
    }
  }
`;

const COMPLETE_PICKING = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation CompletePicking($id: UUID!) {
    completePicking(id: $id) {
      ...FulfillmentOrderFields
    }
  }
`;

const REPORT_INVENTORY_DISCREPANCY = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation ReportInventoryDiscrepancy(
    $lineItemId: UUID!
    $actualQuantity: Decimal!
    $reason: String!
  ) {
    reportInventoryDiscrepancy(
      lineItemId: $lineItemId
      actualQuantity: $actualQuantity
      reason: $reason
    ) {
      ...FulfillmentOrderFields
    }
  }
`;

const ADD_PACKING_BOX = `
  mutation AddPackingBox($fulfillmentOrderId: UUID!, $input: CreatePackingBoxInput!) {
    addPackingBox(fulfillmentOrderId: $fulfillmentOrderId, input: $input) {
      id
      boxNumber
      containerTypeId
      containerTypeName
      length
      width
      height
      weight
      trackingNumber
      labelPrintedAt
      createdAt
      items {
        id
        fulfillmentLineItemId
        quantity
      }
    }
  }
`;

const UPDATE_PACKING_BOX = `
  mutation UpdatePackingBox($boxId: UUID!, $input: UpdatePackingBoxInput!) {
    updatePackingBox(boxId: $boxId, input: $input) {
      id
      boxNumber
      containerTypeId
      containerTypeName
      length
      width
      height
      weight
      trackingNumber
      labelPrintedAt
      createdAt
      items {
        id
        fulfillmentLineItemId
        quantity
      }
    }
  }
`;

const ASSIGN_ITEM_TO_BOX = `
  mutation AssignItemToBox($input: AssignItemToBoxInput!) {
    assignItemToBox(input: $input) {
      id
      boxNumber
      containerTypeId
      containerTypeName
      length
      width
      height
      weight
      trackingNumber
      labelPrintedAt
      createdAt
      items {
        id
        fulfillmentLineItemId
        quantity
      }
    }
  }
`;

const REMOVE_ITEM_FROM_BOX = `
  mutation RemoveItemFromBox($boxId: UUID!, $lineItemId: UUID!) {
    removeItemFromBox(boxId: $boxId, lineItemId: $lineItemId) {
      id
      boxNumber
      containerTypeId
      containerTypeName
      length
      width
      height
      weight
      trackingNumber
      labelPrintedAt
      createdAt
      items {
        id
        fulfillmentLineItemId
        quantity
      }
    }
  }
`;

const DELETE_PACKING_BOX = `
  mutation DeletePackingBox($boxId: UUID!) {
    deletePackingBox(boxId: $boxId)
  }
`;

const COMPLETE_PACKING = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation CompletePacking($id: UUID!) {
    completePacking(id: $id) {
      ...FulfillmentOrderFields
    }
  }
`;

const COMPLETE_SHIPPING = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation CompleteShipping($id: UUID!, $input: CompleteShippingInput!) {
    completeShipping(id: $id, input: $input) {
      ...FulfillmentOrderFields
    }
  }
`;

const MARK_COMMUNICATED = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation MarkCommunicated($id: UUID!) {
    markCommunicated(id: $id) {
      ...FulfillmentOrderFields
    }
  }
`;

const MARK_DELIVERED = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation MarkDelivered($id: UUID!) {
    markDelivered(id: $id) {
      ...FulfillmentOrderFields
    }
  }
`;

const ADD_FULFILLMENT_NOTE = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation AddFulfillmentNote($fulfillmentOrderId: UUID!, $content: String!) {
    addFulfillmentNote(fulfillmentOrderId: $fulfillmentOrderId, content: $content) {
      ...FulfillmentOrderFields
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch fulfillment orders with optional filters
 */
export async function fetchFulfillmentOrders(
  filters?: FulfillmentFilters
): Promise<FulfillmentOrder[]> {
  const response = await crmGraphQLRequest<{
    fulfillmentOrders: FulfillmentOrder[];
  }>({
    query: GET_FULFILLMENT_ORDERS,
    variables: {
      warehouseId: filters?.warehouseId,
      status: filters?.status,
      search: filters?.search,
      limit: filters?.limit ?? 50,
      offset: filters?.offset ?? 0,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch fulfillment orders');
  }

  return response.data?.fulfillmentOrders || [];
}

/**
 * Fetch a single fulfillment order by ID
 */
export async function fetchFulfillmentOrder(id: string): Promise<FulfillmentOrder | null> {
  const response = await crmGraphQLRequest<{
    fulfillmentOrder: FulfillmentOrder | null;
  }>({
    query: GET_FULFILLMENT_ORDER,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch fulfillment order');
  }

  return response.data?.fulfillmentOrder || null;
}

/**
 * Fetch fulfillment statistics
 */
export async function fetchFulfillmentStats(warehouseId?: string): Promise<FulfillmentStats> {
  const response = await crmGraphQLRequest<{
    fulfillmentStats: FulfillmentStats;
  }>({
    query: GET_FULFILLMENT_STATS,
    variables: { warehouseId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch fulfillment stats');
  }

  return (
    response.data?.fulfillmentStats || {
      pendingCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      backorderCount: 0,
    }
  );
}

/**
 * Create a new fulfillment order
 */
export async function createFulfillmentOrder(
  input: CreateFulfillmentOrderInput
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    createFulfillmentOrder: FulfillmentOrder;
  }>({
    query: CREATE_FULFILLMENT_ORDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create fulfillment order');
  }

  return response.data!.createFulfillmentOrder;
}

/**
 * Update a fulfillment order
 */
export async function updateFulfillmentOrder(
  id: string,
  input: UpdateFulfillmentOrderInput
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    updateFulfillmentOrder: FulfillmentOrder;
  }>({
    query: UPDATE_FULFILLMENT_ORDER,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update fulfillment order');
  }

  return response.data!.updateFulfillmentOrder;
}

/**
 * Release fulfillment order to warehouse
 */
export async function releaseToWarehouse(id: string): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    releaseToWarehouse: FulfillmentOrder;
  }>({
    query: RELEASE_TO_WAREHOUSE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to release to warehouse');
  }

  return response.data!.releaseToWarehouse;
}

/**
 * Cancel a fulfillment order
 */
export async function cancelFulfillmentOrder(
  id: string,
  reason: string
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    cancelFulfillmentOrder: FulfillmentOrder;
  }>({
    query: CANCEL_FULFILLMENT_ORDER,
    variables: { id, reason },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to cancel fulfillment order');
  }

  return response.data!.cancelFulfillmentOrder;
}

/**
 * Bulk assign users to fulfillment orders
 */
export async function bulkAssignFulfillmentOrders(
  input: BulkAssignmentInput
): Promise<FulfillmentOrder[]> {
  const response = await crmGraphQLRequest<{
    bulkAssignFulfillmentOrders: FulfillmentOrder[];
  }>({
    query: BULK_ASSIGN_FULFILLMENT_ORDERS,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to bulk assign fulfillment orders');
  }

  return response.data!.bulkAssignFulfillmentOrders;
}

/**
 * Start picking process
 */
export async function startPicking(id: string): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    startPicking: FulfillmentOrder;
  }>({
    query: START_PICKING,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to start picking');
  }

  return response.data!.startPicking;
}

/**
 * Update picked quantity for a line item
 */
export async function updatePickedQuantity(
  input: UpdatePickedQuantityInput
): Promise<FulfillmentOrderLineItem> {
  const response = await crmGraphQLRequest<{
    updatePickedQuantity: FulfillmentOrderLineItem;
  }>({
    query: UPDATE_PICKED_QUANTITY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update picked quantity');
  }

  return response.data!.updatePickedQuantity;
}

/**
 * Complete picking process
 */
export async function completePicking(id: string): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    completePicking: FulfillmentOrder;
  }>({
    query: COMPLETE_PICKING,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to complete picking');
  }

  return response.data!.completePicking;
}

/**
 * Report inventory discrepancy
 */
export async function reportInventoryDiscrepancy(
  lineItemId: string,
  actualQuantity: number,
  reason: string
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    reportInventoryDiscrepancy: FulfillmentOrder;
  }>({
    query: REPORT_INVENTORY_DISCREPANCY,
    variables: { lineItemId, actualQuantity, reason },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to report inventory discrepancy');
  }

  return response.data!.reportInventoryDiscrepancy;
}

/**
 * Add a packing box
 */
export async function addPackingBox(
  fulfillmentOrderId: string,
  input: CreatePackingBoxInput
): Promise<PackingBox> {
  const response = await crmGraphQLRequest<{
    addPackingBox: PackingBox;
  }>({
    query: ADD_PACKING_BOX,
    variables: { fulfillmentOrderId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add packing box');
  }

  return response.data!.addPackingBox;
}

/**
 * Update a packing box
 */
export async function updatePackingBox(
  boxId: string,
  input: UpdatePackingBoxInput
): Promise<PackingBox> {
  const response = await crmGraphQLRequest<{
    updatePackingBox: PackingBox;
  }>({
    query: UPDATE_PACKING_BOX,
    variables: { boxId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update packing box');
  }

  return response.data!.updatePackingBox;
}

/**
 * Assign item to a packing box
 */
export async function assignItemToBox(input: AssignItemToBoxInput): Promise<PackingBox> {
  const response = await crmGraphQLRequest<{
    assignItemToBox: PackingBox;
  }>({
    query: ASSIGN_ITEM_TO_BOX,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to assign item to box');
  }

  return response.data!.assignItemToBox;
}

/**
 * Remove item from a packing box
 */
export async function removeItemFromBox(boxId: string, lineItemId: string): Promise<PackingBox> {
  const response = await crmGraphQLRequest<{
    removeItemFromBox: PackingBox;
  }>({
    query: REMOVE_ITEM_FROM_BOX,
    variables: { boxId, lineItemId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to remove item from box');
  }

  return response.data!.removeItemFromBox;
}

/**
 * Delete a packing box
 */
export async function deletePackingBox(boxId: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{
    deletePackingBox: boolean;
  }>({
    query: DELETE_PACKING_BOX,
    variables: { boxId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete packing box');
  }

  return response.data!.deletePackingBox;
}

/**
 * Complete packing process
 */
export async function completePacking(id: string): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    completePacking: FulfillmentOrder;
  }>({
    query: COMPLETE_PACKING,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to complete packing');
  }

  return response.data!.completePacking;
}

/**
 * Complete shipping process
 */
export async function completeShipping(
  id: string,
  input: CompleteShippingInput
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    completeShipping: FulfillmentOrder;
  }>({
    query: COMPLETE_SHIPPING,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to complete shipping');
  }

  return response.data!.completeShipping;
}

/**
 * Mark order as communicated (shipping confirmation sent)
 */
export async function markCommunicated(id: string): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    markCommunicated: FulfillmentOrder;
  }>({
    query: MARK_COMMUNICATED,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to mark as communicated');
  }

  return response.data!.markCommunicated;
}

/**
 * Mark order as delivered
 */
export async function markDelivered(id: string): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    markDelivered: FulfillmentOrder;
  }>({
    query: MARK_DELIVERED,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to mark as delivered');
  }

  return response.data!.markDelivered;
}

/**
 * Add a note to a fulfillment order
 */
export async function addFulfillmentNote(
  fulfillmentOrderId: string,
  content: string
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    addFulfillmentNote: FulfillmentOrder;
  }>({
    query: ADD_FULFILLMENT_NOTE,
    variables: { fulfillmentOrderId, content },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add note');
  }

  return response.data!.addFulfillmentNote;
}

// ============================================================================
// Assignment API Functions
// ============================================================================

const ADD_FULFILLMENT_ASSIGNMENT = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation AddFulfillmentAssignment(
    $fulfillmentOrderId: UUID!
    $userId: UUID!
    $role: FulfillmentAssignmentRole!
  ) {
    addFulfillmentAssignment(
      fulfillmentOrderId: $fulfillmentOrderId
      userId: $userId
      role: $role
    ) {
      ...FulfillmentOrderFields
    }
  }
`;

const REMOVE_FULFILLMENT_ASSIGNMENT = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation RemoveFulfillmentAssignment($assignmentId: UUID!) {
    removeFulfillmentAssignment(assignmentId: $assignmentId) {
      ...FulfillmentOrderFields
    }
  }
`;

/**
 * Add a user assignment to a fulfillment order
 */
export async function addFulfillmentAssignment(
  fulfillmentOrderId: string,
  userId: string,
  role: FulfillmentAssignmentRole
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    addFulfillmentAssignment: FulfillmentOrder;
  }>({
    query: ADD_FULFILLMENT_ASSIGNMENT,
    variables: { fulfillmentOrderId, userId, role },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add assignment');
  }

  return response.data!.addFulfillmentAssignment;
}

/**
 * Remove an assignment from a fulfillment order
 */
export async function removeFulfillmentAssignment(
  assignmentId: string
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    removeFulfillmentAssignment: FulfillmentOrder;
  }>({
    query: REMOVE_FULFILLMENT_ASSIGNMENT,
    variables: { assignmentId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to remove assignment');
  }

  return response.data!.removeFulfillmentAssignment;
}

// ============================================================================
// Backorder API Functions
// ============================================================================

const GET_BACKORDER_ITEMS = `
  query GetBackorderItems($fulfillmentOrderId: UUID!) {
    backorderItems(fulfillmentOrderId: $fulfillmentOrderId) {
      id
      productId
      productName
      partNumber
      uom
      orderDetailId
      orderedQty
      allocatedQty
      pickedQty
      packedQty
      shippedQty
      backorderQty
      fulfilledByManufacturer
      manufacturerFulfillmentStatus
      linkedShipmentRequestId
      shortReason
      notes
    }
  }
`;

const MARK_MANUFACTURER_FULFILLED = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation MarkManufacturerFulfilled($input: MarkManufacturerFulfilledInput!) {
    markManufacturerFulfilled(input: $input) {
      ...FulfillmentOrderFields
    }
  }
`;

const SPLIT_FULFILLMENT_LINE_ITEM = `
  mutation SplitFulfillmentLineItem($input: SplitLineItemInput!) {
    splitFulfillmentLineItem(input: $input) {
      id
      productId
      productName
      partNumber
      uom
      orderDetailId
      orderedQty
      allocatedQty
      pickedQty
      packedQty
      shippedQty
      backorderQty
      fulfilledByManufacturer
      manufacturerFulfillmentStatus
      linkedShipmentRequestId
      shortReason
      notes
    }
  }
`;

const CANCEL_BACKORDER_ITEMS = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation CancelBackorderItems($input: CancelBackorderInput!) {
    cancelBackorderItems(input: $input) {
      ...FulfillmentOrderFields
    }
  }
`;

const RESOLVE_BACKORDER = `
  ${FULFILLMENT_ORDER_FRAGMENT}
  mutation ResolveBackorder($fulfillmentOrderId: UUID!) {
    resolveBackorder(fulfillmentOrderId: $fulfillmentOrderId) {
      ...FulfillmentOrderFields
    }
  }
`;

// Input types for backorder
export interface MarkManufacturerFulfilledInput {
  fulfillmentOrderId: string;
  lineItemIds: string[];
}

export interface SplitLineItemInput {
  lineItemId: string;
  warehouseQty: number;
  manufacturerQty: number;
}

export interface CancelBackorderInput {
  fulfillmentOrderId: string;
  lineItemIds: string[];
  reason: string;
}

/**
 * Get backorder items for a fulfillment order
 */
export async function fetchBackorderItems(
  fulfillmentOrderId: string
): Promise<FulfillmentOrderLineItem[]> {
  const response = await crmGraphQLRequest<{
    backorderItems: FulfillmentOrderLineItem[];
  }>({
    query: GET_BACKORDER_ITEMS,
    variables: { fulfillmentOrderId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch backorder items');
  }

  return response.data?.backorderItems || [];
}

/**
 * Mark line items as being fulfilled by manufacturer
 */
export async function markManufacturerFulfilled(
  input: MarkManufacturerFulfilledInput
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    markManufacturerFulfilled: FulfillmentOrder;
  }>({
    query: MARK_MANUFACTURER_FULFILLED,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to mark as manufacturer fulfilled');
  }

  return response.data!.markManufacturerFulfilled;
}

/**
 * Split a line item between warehouse and manufacturer fulfillment
 */
export async function splitFulfillmentLineItem(
  input: SplitLineItemInput
): Promise<FulfillmentOrderLineItem> {
  const response = await crmGraphQLRequest<{
    splitFulfillmentLineItem: FulfillmentOrderLineItem;
  }>({
    query: SPLIT_FULFILLMENT_LINE_ITEM,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to split line item');
  }

  return response.data!.splitFulfillmentLineItem;
}

/**
 * Cancel backorder items
 */
export async function cancelBackorderItems(
  input: CancelBackorderInput
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    cancelBackorderItems: FulfillmentOrder;
  }>({
    query: CANCEL_BACKORDER_ITEMS,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to cancel backorder items');
  }

  return response.data!.cancelBackorderItems;
}

/**
 * Resolve backorder status and continue fulfillment
 */
export async function resolveBackorder(
  fulfillmentOrderId: string
): Promise<FulfillmentOrder> {
  const response = await crmGraphQLRequest<{
    resolveBackorder: FulfillmentOrder;
  }>({
    query: RESOLVE_BACKORDER,
    variables: { fulfillmentOrderId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to resolve backorder');
  }

  return response.data!.resolveBackorder;
}
