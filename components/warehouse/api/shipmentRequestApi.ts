/**
 * Shipment Request API Module
 * GraphQL API for shipment request operations
 */

import { crmGraphQLRequest } from '../../lib/graphql/client';

// ============================================================================
// Types
// ============================================================================

export type ShipmentRequestStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SENT'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'SHIPPED'
  | 'CANCELLED'
  | 'DRAFT';

export type ShipmentMethod = 'EMAIL' | 'PHONE_CALL' | 'MANUFACTURER_SYSTEM';

export type ShipmentPriority = 'STANDARD' | 'EXPEDITED' | 'URGENT';

export interface ShipmentRequestItem {
  id: string;
  productId: string;
  quantity: number;
}

export interface ShipmentRequest {
  id: string;
  requestNumber: string;
  warehouseId: string | null;
  factoryId: string | null;
  method: ShipmentMethod | null;
  priority: ShipmentPriority;
  status: ShipmentRequestStatus;
  requestDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: ShipmentRequestItem[];
  factory?: {
    id: string;
    title: string;
  };
}

export interface CreateShipmentRequestInput {
  warehouseId: string;
  factoryId: string;
  requestDate: string;
  priority?: ShipmentPriority;
  method?: ShipmentMethod | null;
  status?: ShipmentRequestStatus;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const SHIPMENT_REQUEST_FIELDS = `
  id
  requestNumber
  warehouseId
  factoryId
  method
  priority
  status
  requestDate
  notes
  createdAt
  updatedAt
  items {
    id
    productId
    quantity
  }
  factory {
    id
    title
  }
`;

const LIST_SHIPMENT_REQUESTS_QUERY = `
  query ListShipmentRequests(
    $warehouseId: UUID!
    $status: ShipmentRequestStatus
    $limit: Int
    $offset: Int
  ) {
    shipmentRequests(
      warehouseId: $warehouseId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      ${SHIPMENT_REQUEST_FIELDS}
    }
  }
`;

const CREATE_SHIPMENT_REQUEST_MUTATION = `
  mutation CreateShipmentRequest($input: CreateShipmentRequestInput!) {
    createShipmentRequest(input: $input) {
      ${SHIPMENT_REQUEST_FIELDS}
    }
  }
`;

const UPDATE_SHIPMENT_REQUEST_STATUS_MUTATION = `
  mutation UpdateShipmentRequestStatus(
    $id: UUID!
    $status: ShipmentRequestStatus!
    $notes: String
  ) {
    updateShipmentRequestStatus(id: $id, status: $status, notes: $notes) {
      ${SHIPMENT_REQUEST_FIELDS}
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * List shipment requests for a warehouse
 */
export async function listShipmentRequests(
  warehouseId: string,
  status?: ShipmentRequestStatus,
  limit: number = 100,
  offset: number = 0
): Promise<ShipmentRequest[]> {
  const response = await crmGraphQLRequest<{
    shipmentRequests: ShipmentRequest[];
  }>({
    query: LIST_SHIPMENT_REQUESTS_QUERY,
    variables: {
      warehouseId,
      status,
      limit,
      offset,
    },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to fetch shipment requests');
  }

  return response.data?.shipmentRequests || [];
}

/**
 * Create a new shipment request
 */
export async function createShipmentRequest(
  input: CreateShipmentRequestInput
): Promise<ShipmentRequest> {
  const response = await crmGraphQLRequest<{
    createShipmentRequest: ShipmentRequest;
  }>({
    query: CREATE_SHIPMENT_REQUEST_MUTATION,
    variables: {
      input,
    },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to create shipment request');
  }

  if (!response.data?.createShipmentRequest) {
    throw new Error('No data returned from createShipmentRequest mutation');
  }

  return response.data.createShipmentRequest;
}

/**
 * Update shipment request status
 */
export async function updateShipmentRequestStatus(
  id: string,
  status: ShipmentRequestStatus,
  notes?: string
): Promise<ShipmentRequest> {
  const response = await crmGraphQLRequest<{
    updateShipmentRequestStatus: ShipmentRequest;
  }>({
    query: UPDATE_SHIPMENT_REQUEST_STATUS_MUTATION,
    variables: {
      id,
      status,
      notes,
    },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to update shipment request status');
  }

  if (!response.data?.updateShipmentRequestStatus) {
    throw new Error('No data returned from updateShipmentRequestStatus mutation');
  }

  return response.data.updateShipmentRequestStatus;
}
