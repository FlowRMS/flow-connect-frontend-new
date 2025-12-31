/**
 * Orders API Module
 * Complete implementation of Orders GraphQL API endpoints
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// ============================================================================
// Enums
// ============================================================================

export type OrderType = 'NORMAL' | 'BLANKET' | 'RELEASE';
export type OrderCreationType = 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';
export type OrderDetailStatus = 'OPEN' | 'ORDERED' | 'SHIPPED' | 'CANCELLED';
export type OrderHeaderStatus = 'DRAFT' | 'OPEN' | 'PARTIAL_SHIPPED' | 'SHIPPED' | 'CANCELLED' | 'DORMANT';

// ============================================================================
// Types
// ============================================================================

export interface OrderBalance {
  id: string;
  cancelledBalance?: number;
  commission?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  commissionRate?: number;
  discount?: number;
  discountRate?: number;
  freightChargeBalance?: number;
  quantity?: number;
  shippingBalance?: number;
  subtotal?: number;
  total?: number;
}

export interface OrderCustomer {
  id: string;
  companyName: string;
  isParent: boolean;
  parentId?: string;
  published: boolean;
}

export interface OrderCreatedBy {
  id: string;
  authProviderId?: string;
  email?: string;
  enabled?: boolean;
  firstName?: string;
  fullName?: string;
  lastName?: string;
  inside?: boolean;
  outside?: boolean;
  role?: string;
  username?: string;
}

export interface OrderSplitRate {
  id: string;
  position?: number;
  splitRate?: string;
  userId?: string;
}

export interface OrderProduct {
  id: string;
  approvalComments?: string;
  approvalDate?: string;
  approvalNeeded?: boolean;
  commissionDiscountRate?: number;
  defaultCommissionRate?: number;
  defaultDivisor?: number;
  description?: string;
  factoryPartNumber?: string;
  leadTime?: string;
  minOrderQty?: number;
  published?: boolean;
  tags?: string[];
  unitPrice?: number;
  unitPriceDiscountRate?: number;
  upc?: string;
}

export interface OrderUom {
  id: string;
  description?: string;
  divisionFactor?: number;
  title?: string;
}

export interface OrderDetail {
  id: string;
  cancelledBalance?: number;
  commission?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: string;
  commissionRate?: string;
  discount?: number;
  discountRate?: string;
  divisionFactor?: string;
  endUserId?: string;
  freightCharge?: string;
  itemNumber?: number;
  leadTime?: string;
  note?: string;
  orderId?: string;
  product?: OrderProduct;
  productDescriptionAdhoc?: string;
  productId?: string;
  productNameAdhoc?: string;
  quantity?: string;
  shippingBalance?: number;
  insideSplitRates?: OrderSplitRate[];
  outsideSplitRates?: OrderSplitRate[];
  status?: OrderDetailStatus;
  subtotal?: number;
  total?: number;
  totalLineCommission?: number;
  unitPrice?: string;
  uom?: OrderUom;
  uomId?: string;
}

export interface OrderInsideRep {
  id: string;
  position?: number;
  splitRate?: string;
  userId?: string;
}

export interface OrderOutsideRep {
  id: string;
  position?: number;
  splitRate?: string;
  userId?: string;
}

export interface OrderJob {
  id: string;
  additionalInformation?: string;
  createdAt?: string;
  description?: string;
  endDate?: string;
  jobName: string;
  jobType?: string;
  requesterId?: string;
  startDate?: string;
  structuralDetails?: string;
  structuralInformation?: string;
  tags?: string;
}

export interface OrderFactory {
  id: string;
  title?: string;
  accountNumber?: string;
  published?: boolean;
}

export interface Order {
  id: string;
  balance?: OrderBalance;
  balanceId?: string;
  billToCustomer?: OrderCustomer;
  billToCustomerId?: string;
  createdAt?: string;
  createdBy?: OrderCreatedBy;
  createdById?: string;
  creationType?: OrderCreationType;
  details?: OrderDetail[];
  dueDate?: string;
  entityDate?: string;
  factSoNumber?: string;
  factory?: OrderFactory;
  factoryId?: string;
  freightTerms?: string;
  headerStatus?: OrderHeaderStatus;
  job?: OrderJob;
  markNumber?: string;
  orderNumber: string;
  orderType?: OrderType;
  projectedShipDate?: string;
  published?: boolean;
  quoteId?: string;
  shipDate?: string;
  shippingTerms?: string;
  soldToCustomer?: OrderCustomer;
  soldToCustomerId?: string;
  status?: string;
  url?: string;
  // Settings for per-line-item configuration
  endUserPerLineItem?: boolean;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
}

export interface OrderLandingPage {
  id: string;
  createdAt?: string;
  createdBy?: string;
  dueDate?: string;
  entityDate?: string;
  headerStatus?: OrderHeaderStatus;
  orderNumber: string;
  orderType?: OrderType;
  published?: boolean;
  status?: string;
  total?: number;
  userIds?: string[];
  // New fields from API
  factoryName?: string;
  soldToCustomerName?: string;
  jobName?: string;
}

// Input Types
export interface OrderSplitRateInput {
  id?: string;
  userId: string;
  splitRate: string;
  position?: number;
}

export interface OrderDetailInput {
  id?: string;
  itemNumber?: number;
  quantity: string;
  unitPrice: string;
  commissionDiscountRate?: string;
  commissionRate?: string;
  discountRate?: string;
  divisionFactor?: string;
  endUserId?: string;
  freightCharge?: string;
  leadTime?: string;
  note?: string;
  productDescriptionAdhoc?: string;
  productId?: string;
  productNameAdhoc?: string;
  insideSplitRates?: OrderSplitRateInput[];
  outsideSplitRates?: OrderSplitRateInput[];
  uomId?: string;
}

export interface CreateOrderInput {
  orderNumber: string;
  entityDate: string;
  dueDate?: string;
  soldToCustomerId: string;
  factoryId?: string;
  details?: OrderDetailInput[];
  published?: boolean;
  creationType?: OrderCreationType;
  orderType?: OrderType;
  billToCustomerId?: string;
  factSoNumber?: string;
  id?: string;
  freightTerms?: string;
  markNumber?: string;
  projectedShipDate?: string;
  quoteId?: string;
  shipDate?: string;
  shippingTerms?: string;
  // Settings for per-line-item configuration
  endUserPerLineItem?: boolean;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
}

export interface UpdateOrderInput extends CreateOrderInput {}

// Filter and Pagination Types
export interface OrderLandingPageFilter {
  operator: string;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface OrderLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedOrdersResult {
  records: OrderLandingPage[];
  total: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const ORDER_LANDING_PAGES = `
  query OrderLandingPages($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: ORDERS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      records {
        ... on OrderLandingPage {
          id
          userIds
          total
          status
          published
          orderType
          orderNumber
          headerStatus
          dueDate
          entityDate
          createdBy
          createdAt
          factoryName
          soldToCustomerName
          jobName
        }
      }
      total
    }
  }
`;

const FIND_ORDER_BY_ID = `
  query FindOrderById($id: UUID!) {
    order(id: $id) {
      id
      balance {
        cancelledBalance
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        freightChargeBalance
        id
        quantity
        shippingBalance
        subtotal
        total
      }
      balanceId
      billToCustomer {
        companyName
        isParent
        id
        parentId
        published
      }
      billToCustomerId
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
      createdById
      creationType
      details {
        cancelledBalance
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        endUserId
        freightCharge
        id
        itemNumber
        leadTime
        note
        orderId
        product {
          approvalComments
          approvalDate
          approvalNeeded
          commissionDiscountRate
          defaultCommissionRate
          defaultDivisor
          description
          factoryPartNumber
          id
          leadTime
          minOrderQty
          published
          tags
          unitPrice
          unitPriceDiscountRate
          upc
        }
        productDescriptionAdhoc
        productId
        productNameAdhoc
        quantity
        shippingBalance
        insideSplitRates {
          id
          position
          splitRate
          userId
        }
        outsideSplitRates {
          id
          position
          splitRate
          userId
        }
        status
        subtotal
        total
        totalLineCommission
        unitPrice
        uom {
          description
          divisionFactor
          id
          title
        }
      }
      dueDate
      entityDate
      factSoNumber
      factoryId
      freightTerms
      headerStatus
      job {
        additionalInformation
        createdAt
        description
        endDate
        id
        jobName
        jobType
        requesterId
        startDate
        structuralDetails
        structuralInformation
        tags
      }
      markNumber
      orderNumber
      orderType
      projectedShipDate
      published
      quoteId
      shipDate
      shippingTerms
      soldToCustomer {
        companyName
        id
        isParent
        parentId
        published
      }
      soldToCustomerId
      status
      url
      endUserPerLineItem
      insidePerLineItem
      outsidePerLineItem
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_ORDER = `
  mutation CreateOrder($input: OrderInput!) {
    createOrder(input: $input) {
      id
      balance {
        cancelledBalance
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        freightChargeBalance
        id
        quantity
        shippingBalance
        subtotal
        total
      }
      balanceId
      billToCustomer {
        companyName
        isParent
        id
        parentId
        published
      }
      billToCustomerId
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
      createdById
      creationType
      details {
        cancelledBalance
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        endUserId
        freightCharge
        id
        itemNumber
        leadTime
        note
        orderId
        product {
          approvalComments
          approvalDate
          approvalNeeded
          commissionDiscountRate
          defaultCommissionRate
          defaultDivisor
          description
          factoryPartNumber
          id
          leadTime
          minOrderQty
          published
          tags
          unitPrice
          unitPriceDiscountRate
          upc
        }
        productDescriptionAdhoc
        productId
        productNameAdhoc
        quantity
        shippingBalance
        insideSplitRates {
          id
          position
          splitRate
          userId
        }
        outsideSplitRates {
          id
          position
          splitRate
          userId
        }
        status
        subtotal
        total
        totalLineCommission
        unitPrice
        uom {
          description
          divisionFactor
          id
          title
        }
      }
      dueDate
      entityDate
      factSoNumber
      factoryId
      freightTerms
      headerStatus
      job {
        additionalInformation
        createdAt
        description
        endDate
        id
        jobName
        jobType
        requesterId
        startDate
        structuralDetails
        structuralInformation
        tags
      }
      markNumber
      orderNumber
      orderType
      projectedShipDate
      published
      quoteId
      shipDate
      shippingTerms
      soldToCustomer {
        companyName
        id
        isParent
        parentId
        published
      }
      soldToCustomerId
      status
      url
      endUserPerLineItem
      insidePerLineItem
      outsidePerLineItem
    }
  }
`;

const UPDATE_ORDER = `
  mutation UpdateOrder($input: OrderInput!) {
    updateOrder(input: $input) {
      id
      balance {
        cancelledBalance
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        freightChargeBalance
        id
        quantity
        shippingBalance
        subtotal
        total
      }
      balanceId
      billToCustomer {
        companyName
        isParent
        id
        parentId
        published
      }
      billToCustomerId
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
      createdById
      creationType
      details {
        cancelledBalance
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        endUserId
        freightCharge
        id
        itemNumber
        leadTime
        note
        orderId
        product {
          approvalComments
          approvalDate
          approvalNeeded
          commissionDiscountRate
          defaultCommissionRate
          defaultDivisor
          description
          factoryPartNumber
          id
          leadTime
          minOrderQty
          published
          tags
          unitPrice
          unitPriceDiscountRate
          upc
        }
        productDescriptionAdhoc
        productId
        productNameAdhoc
        quantity
        shippingBalance
        insideSplitRates {
          id
          position
          splitRate
          userId
        }
        outsideSplitRates {
          id
          position
          splitRate
          userId
        }
        status
        subtotal
        total
        totalLineCommission
        unitPrice
        uom {
          description
          divisionFactor
          id
          title
        }
      }
      dueDate
      entityDate
      factSoNumber
      factoryId
      freightTerms
      headerStatus
      job {
        additionalInformation
        createdAt
        description
        endDate
        id
        jobName
        jobType
        requesterId
        startDate
        structuralDetails
        structuralInformation
        tags
      }
      markNumber
      orderNumber
      orderType
      projectedShipDate
      published
      quoteId
      shipDate
      shippingTerms
      soldToCustomer {
        companyName
        id
        isParent
        parentId
        published
      }
      soldToCustomerId
      status
      url
      endUserPerLineItem
      insidePerLineItem
      outsidePerLineItem
    }
  }
`;

const DELETE_ORDER = `
  mutation DeleteOrder($id: UUID!) {
    deleteOrder(id: $id)
  }
`;

// ============================================================================
// API Functions - Orders
// ============================================================================

/**
 * Fetch orders using findLandingPages endpoint with pagination
 */
export async function fetchOrdersWithPagination(
  filters?: OrderLandingPageFilter[],
  orderBy?: OrderLandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedOrdersResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: OrderLandingPage[]; total: number };
  }>({
    query: ORDER_LANDING_PAGES,
    variables: {
      filters,
      orderBy,
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch orders');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch all orders (no pagination)
 */
export async function fetchOrders(): Promise<OrderLandingPage[]> {
  const result = await fetchOrdersWithPagination();
  return result.records;
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrderById(id: string): Promise<Order | null> {
  const response = await crmGraphQLRequest<{ order: Order }>({
    query: FIND_ORDER_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch order');
  }

  return response.data?.order || null;
}

/**
 * Create a new order
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const response = await crmGraphQLRequest<{ createOrder: Order }>({
    query: CREATE_ORDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create order');
  }

  if (!response.data?.createOrder) {
    throw new Error('No order returned from create mutation');
  }

  return response.data.createOrder;
}

/**
 * Update an existing order
 */
export async function updateOrder(input: UpdateOrderInput): Promise<Order> {
  const response = await crmGraphQLRequest<{ updateOrder: Order }>({
    query: UPDATE_ORDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update order');
  }

  if (!response.data?.updateOrder) {
    throw new Error('No order returned from update mutation');
  }

  return response.data.updateOrder;
}

/**
 * Delete an order
 */
export async function deleteOrder(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteOrder: string }>({
    query: DELETE_ORDER,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete order');
  }

  return true;
}

// ============================================================================
// Create Order from Quote
// ============================================================================

const CREATE_ORDER_FROM_QUOTE = `
  mutation CreateOrderFromQuote(
    $factoryId: UUID!
    $orderNumber: String!
    $quoteId: UUID!
    $dueDate: Date!
    $quoteDetailIds: [UUID!]
  ) {
    createOrderFromQuote(
      factoryId: $factoryId
      orderNumber: $orderNumber
      quoteId: $quoteId
      dueDate: $dueDate
      quoteDetailIds: $quoteDetailIds
    ) {
      id
      orderNumber
      entityDate
      dueDate
      status
      headerStatus
      factoryId
      quoteId
      soldToCustomerId
      soldToCustomer {
        companyName
        id
        isParent
        parentId
        published
      }
      billToCustomerId
      billToCustomer {
        companyName
        id
        isParent
        parentId
        published
      }
      balance {
        commission
        commissionRate
        discount
        discountRate
        id
        quantity
        subtotal
        total
      }
      details {
        id
        itemNumber
        productId
        product {
          factoryPartNumber
          description
          id
        }
        quantity
        unitPrice
        total
        commission
        commissionRate
        status
      }
      createdAt
      createdById
      creationType
      published
      url
    }
  }
`;

export interface CreateOrderFromQuoteInput {
  factoryId: string;
  orderNumber: string;
  quoteId: string;
  dueDate: string;
  quoteDetailIds?: string[];
}

/**
 * Create an order from a quote
 */
export async function createOrderFromQuote(input: CreateOrderFromQuoteInput): Promise<Order> {
  const response = await crmGraphQLRequest<{ createOrderFromQuote: Order }>({
    query: CREATE_ORDER_FROM_QUOTE,
    variables: {
      factoryId: input.factoryId,
      orderNumber: input.orderNumber,
      quoteId: input.quoteId,
      dueDate: input.dueDate,
      quoteDetailIds: input.quoteDetailIds,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create order from quote');
  }

  if (!response.data?.createOrderFromQuote) {
    throw new Error('No order returned from createOrderFromQuote mutation');
  }

  return response.data.createOrderFromQuote;
}

