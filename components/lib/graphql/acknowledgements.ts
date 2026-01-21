/**
 * Acknowledgements GraphQL Module
 * Centralized GraphQL queries and mutations for order acknowledgements
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Enums
// ============================================================================

export type AcknowledgementCreationType = 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';

// ============================================================================
// Types
// ============================================================================

export interface OrderAcknowledgementDetail {
  id: string;
  orderAcknowledgementId: string;
  orderDetailId: string;
  orderDetail?: {
    id: string;
    itemNumber: number;
    cancelledBalance?: number;
    commission?: number;
    commissionDiscount?: number;
    unitPrice?: string;
    totalLineCommission?: number;
    total?: number;
    subtotal?: number;
    status?: string;
    productNameAdhoc?: string;
    shippingBalance?: number;
    quantity?: string;
    productId?: string;
    productDescriptionAdhoc?: string;
    orderId?: string;
    note?: string;
    leadTime?: string;
    freightCharge?: number;
    endUserId?: string;
    discount?: number;
    discountRate?: string;
    commissionRate?: string;
    commissionDiscountRate?: string;
  };
}

export interface OrderAcknowledgement {
  id: string;
  orderId?: string;
  orderAcknowledgementNumber?: string;
  entityDate?: string;
  quantity?: string;
  creationType?: AcknowledgementCreationType;
  createdAt?: string;
  createdById?: string;
  itemNumbers?: number[];
  details?: OrderAcknowledgementDetail[];
}

// Landing Page type for findLandingPages query - includes enriched data
export interface AcknowledgementLandingPage {
  id: string;
  orderAcknowledgementNumber?: string;
  quantity?: string;
  creationType?: AcknowledgementCreationType;
  createdAt?: string;
  createdBy?: string;
  itemNumber?: number;
  orderNumber?: string;
  orderEntityDate?: string;
  productName?: string;
  factoryName?: string;
  soldToCustomerName?: string;
  userIds?: string[];
}

export interface FindAcknowledgementsLandingPagesResponse {
  total: number;
  records: AcknowledgementLandingPage[];
}

export interface PaginatedAcknowledgementsResult {
  records: AcknowledgementLandingPage[];
  total: number;
}

export interface AcknowledgementFilter {
  columnName: string;
  operator: string;
  value?: string;
  values?: string[];
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface OrderAcknowledgementDetailInput {
  id?: string; // Include for updates to prevent duplicate key errors
  orderDetailId: string;
}

export interface CreateAcknowledgementInput {
  id?: string;
  orderId: string;
  details?: OrderAcknowledgementDetailInput[];
  orderAcknowledgementNumber?: string;
  entityDate: string;
  quantity: string;
  creationType?: AcknowledgementCreationType;
}

export interface UpdateAcknowledgementInput extends CreateAcknowledgementInput {
  id: string;
}

// ============================================================================
// GraphQL Field Selections
// ============================================================================

const ACKNOWLEDGEMENT_FIELDS = `
  id
  orderId
  orderAcknowledgementNumber
  entityDate
  quantity
  creationType
  createdAt
  createdById
  details {
    id
    orderAcknowledgementId
    orderDetailId
    orderDetail {
      id
      itemNumber
      cancelledBalance
      commission
      commissionDiscount
      unitPrice
      totalLineCommission
      total
      subtotal
      status
      productNameAdhoc
      shippingBalance
      quantity
      productId
      productDescriptionAdhoc
      orderId
      note
      leadTime
      freightCharge
      endUserId
      discount
      discountRate
      commissionRate
      commissionDiscountRate
    }
  }
`;

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_ACKNOWLEDGEMENT = `
  query GetOrderAcknowledgement($id: UUID!) {
    orderAcknowledgement(id: $id) {
      ${ACKNOWLEDGEMENT_FIELDS}
    }
  }
`;

const GET_ACKNOWLEDGEMENTS_BY_ORDER = `
  query GetOrderAcknowledgementsByOrder($orderId: UUID!) {
    orderAcknowledgementsByOrder(orderId: $orderId) {
      ${ACKNOWLEDGEMENT_FIELDS}
    }
  }
`;

const GET_ACKNOWLEDGEMENTS_BY_ORDER_DETAIL = `
  query GetOrderAcknowledgementsByOrderDetail($orderDetailId: UUID!) {
    orderAcknowledgementsByOrderDetail(orderDetailId: $orderDetailId) {
      ${ACKNOWLEDGEMENT_FIELDS}
    }
  }
`;

const FIND_ACKNOWLEDGEMENTS_LANDING_PAGE = `
  query FindAcknowledgementsLandingPage($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: ORDER_ACKNOWLEDGEMENTS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      total
      records {
        ... on OrderAcknowledgementLandingPage {
          id
          orderAcknowledgementNumber
          quantity
          creationType
          createdAt
          createdBy
          itemNumber
          orderNumber
          orderEntityDate
          productName
          factoryName
          soldToCustomerName
          userIds
        }
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_ACKNOWLEDGEMENT = `
  mutation CreateOrderAcknowledgement($input: OrderAcknowledgementInput!) {
    createOrderAcknowledgement(input: $input) {
      ${ACKNOWLEDGEMENT_FIELDS}
    }
  }
`;

const UPDATE_ACKNOWLEDGEMENT = `
  mutation UpdateOrderAcknowledgement($input: OrderAcknowledgementInput!) {
    updateOrderAcknowledgement(input: $input) {
      ${ACKNOWLEDGEMENT_FIELDS}
    }
  }
`;

const DELETE_ACKNOWLEDGEMENT = `
  mutation DeleteOrderAcknowledgement($id: UUID!) {
    deleteOrderAcknowledgement(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch a single acknowledgement by ID
 */
export async function fetchAcknowledgementById(id: string): Promise<OrderAcknowledgement | null> {
  const response = await crmGraphQLRequest<{ orderAcknowledgement: OrderAcknowledgement }>({
    query: GET_ACKNOWLEDGEMENT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch acknowledgement');
  }

  return response.data?.orderAcknowledgement || null;
}

/**
 * Fetch all acknowledgements for a specific order (basic query)
 */
export async function fetchAcknowledgementsByOrder(orderId: string): Promise<OrderAcknowledgement[]> {
  try {
    const response = await crmGraphQLRequest<{ orderAcknowledgementsByOrder: OrderAcknowledgement[] }>({
      query: GET_ACKNOWLEDGEMENTS_BY_ORDER,
      variables: { orderId },
    });

    if (response.errors) {
      console.warn('fetchAcknowledgementsByOrder error:', response.errors[0]?.message);
      return [];
    }

    const acknowledgements = response.data?.orderAcknowledgementsByOrder || [];

    // Deduplicate by ID to prevent React key errors when same acknowledgement is linked to multiple line items
    const uniqueAcknowledgements = acknowledgements.reduce((acc, ack) => {
      if (!acc.some(existing => existing.id === ack.id)) {
        acc.push(ack);
      }
      return acc;
    }, [] as OrderAcknowledgement[]);

    return uniqueAcknowledgements;
  } catch (error) {
    console.warn('Error fetching acknowledgements by order:', error);
    return [];
  }
}

/**
 * Fetch acknowledgements for a specific order using findLandingPages (enriched data)
 */
export async function fetchAcknowledgementsLandingPageByOrder(orderNumber: string): Promise<AcknowledgementLandingPage[]> {
  try {
    const response = await crmGraphQLRequest<{ findLandingPages: FindAcknowledgementsLandingPagesResponse }>({
      query: FIND_ACKNOWLEDGEMENTS_LANDING_PAGE,
      variables: {
        filters: [
          {
            columnName: 'orderNumber',
            operator: 'EQ',
            value: orderNumber,
          },
        ],
        limit: 100,
        offset: 0,
        orderBy: [
          {
            columnName: 'createdAt',
            direction: 'DESC',
          },
        ],
      },
    });

    if (response.errors) {
      console.warn('findLandingPages query error:', response.errors[0]?.message);
      return [];
    }

    return response.data?.findLandingPages?.records || [];
  } catch (error) {
    console.warn('Error fetching acknowledgements landing page by order:', error);
    return [];
  }
}

/**
 * Fetch all acknowledgements for a specific order detail (line item)
 */
export async function fetchAcknowledgementsByOrderDetail(orderDetailId: string): Promise<OrderAcknowledgement[]> {
  try {
    const response = await crmGraphQLRequest<{ orderAcknowledgementsByOrderDetail: OrderAcknowledgement[] }>({
      query: GET_ACKNOWLEDGEMENTS_BY_ORDER_DETAIL,
      variables: { orderDetailId },
    });

    if (response.errors) {
      console.warn('fetchAcknowledgementsByOrderDetail error:', response.errors[0]?.message);
      return [];
    }

    return response.data?.orderAcknowledgementsByOrderDetail || [];
  } catch (error) {
    console.warn('Error fetching acknowledgements by order detail:', error);
    return [];
  }
}

/**
 * Generate an acknowledgement number if not provided
 */
function generateAcknowledgementNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ACK-${timestamp}-${random}`;
}

/**
 * Create a new acknowledgement
 */
export async function createAcknowledgement(input: CreateAcknowledgementInput): Promise<OrderAcknowledgement> {
  // Ensure acknowledgementNumber is provided
  const acknowledgementInput = {
    ...input,
    orderAcknowledgementNumber: input.orderAcknowledgementNumber || generateAcknowledgementNumber(),
    creationType: input.creationType || 'MANUAL',
  };

  const response = await crmGraphQLRequest<{ createOrderAcknowledgement: OrderAcknowledgement }>({
    query: CREATE_ACKNOWLEDGEMENT,
    variables: { input: acknowledgementInput },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create acknowledgement');
  }

  if (!response.data?.createOrderAcknowledgement) {
    throw new Error('No acknowledgement returned from create mutation');
  }

  return response.data.createOrderAcknowledgement;
}

/**
 * Update an existing acknowledgement
 */
export async function updateAcknowledgement(input: UpdateAcknowledgementInput): Promise<OrderAcknowledgement> {
  const response = await crmGraphQLRequest<{ updateOrderAcknowledgement: OrderAcknowledgement }>({
    query: UPDATE_ACKNOWLEDGEMENT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update acknowledgement');
  }

  if (!response.data?.updateOrderAcknowledgement) {
    throw new Error('No acknowledgement returned from update mutation');
  }

  return response.data.updateOrderAcknowledgement;
}

/**
 * Delete an acknowledgement
 */
export async function deleteAcknowledgement(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteOrderAcknowledgement: string }>({
    query: DELETE_ACKNOWLEDGEMENT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete acknowledgement');
  }

  return true;
}

/**
 * Fetch acknowledgements landing page with pagination
 */
export async function fetchAcknowledgementsWithPagination(
  filters?: AcknowledgementFilter[],
  pagination?: PaginationParams
): Promise<PaginatedAcknowledgementsResult> {
  const response = await crmGraphQLRequest<{ findLandingPages: FindAcknowledgementsLandingPagesResponse }>({
    query: FIND_ACKNOWLEDGEMENTS_LANDING_PAGE,
    variables: {
      filters,
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
      orderBy: [
        {
          columnName: 'createdAt',
          direction: 'DESC',
        },
      ],
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch acknowledgements');
  }

  const records = response.data?.findLandingPages?.records || [];

  // Deduplicate by ID to prevent React key errors when same acknowledgement appears multiple times
  const uniqueRecords = records.reduce((acc, ack) => {
    if (!acc.some(existing => existing.id === ack.id)) {
      acc.push(ack);
    }
    return acc;
  }, [] as AcknowledgementLandingPage[]);

  return {
    records: uniqueRecords,
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Search acknowledgements by term
 */
export async function searchAcknowledgements(
  searchTerm: string,
  limit: number = 100
): Promise<AcknowledgementLandingPage[]> {
  // Search by acknowledgement number or order number
  const response = await crmGraphQLRequest<{ findLandingPages: FindAcknowledgementsLandingPagesResponse }>({
    query: FIND_ACKNOWLEDGEMENTS_LANDING_PAGE,
    variables: {
      filters: [
        {
          columnName: 'orderAcknowledgementNumber',
          operator: 'LIKE',
          value: `%${searchTerm}%`,
        },
      ],
      limit,
      offset: 0,
      orderBy: [
        {
          columnName: 'createdAt',
          direction: 'DESC',
        },
      ],
    },
  });

  if (response.errors) {
    console.warn('searchAcknowledgements error:', response.errors[0]?.message);
    return [];
  }

  const records = response.data?.findLandingPages?.records || [];

  // Deduplicate by ID to prevent React key errors
  const uniqueRecords = records.reduce((acc, ack) => {
    if (!acc.some(existing => existing.id === ack.id)) {
      acc.push(ack);
    }
    return acc;
  }, [] as AcknowledgementLandingPage[]);

  return uniqueRecords;
}
