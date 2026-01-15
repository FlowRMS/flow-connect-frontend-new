/**
 * Invoices GraphQL Module
 * Centralized GraphQL queries and mutations for invoices
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Enums
// ============================================================================

export type InvoiceCreationType = 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';

// ============================================================================
// Types
// ============================================================================

export interface InvoiceBalance {
  id: string;
  commission?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  commissionRate?: number;
  discount?: number;
  discountRate?: number;
  paidBalance?: number;
  quantity?: number;
  subtotal?: number;
  total?: number;
}

export interface InvoiceUser {
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

export interface InvoiceSplitRate {
  id: string;
  invoiceDetailId?: string;
  position?: number;
  splitRate?: string;
  userId?: string;
  user?: InvoiceUser;
}

export interface InvoiceProduct {
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

export interface InvoiceUom {
  id: string;
  description?: string;
  divisionFactor?: number;
  title?: string;
}

export interface InvoiceFactory {
  id: string;
  title?: string;
  published?: boolean;
  phone?: string;
  paymentTerms?: string;
  overallDiscountRate?: number;
  logoId?: string;
  leadTime?: string;
  freightTerms?: string;
  freightDiscountType?: string;
  externalPaymentTerms?: string;
  email?: string;
  commissionDiscountRate?: number;
  baseCommissionRate?: number;
  additionalInformation?: string;
  accountNumber?: string;
}

export interface InvoiceOrderCustomer {
  id: string;
  companyName?: string;
  published?: boolean;
  parentId?: string;
  isParent?: boolean;
  buyingGroupId?: string;
}

export interface InvoiceOrder {
  id: string;
  url?: string;
  status?: string;
  soldToCustomerId?: string;
  soldToCustomer?: InvoiceOrderCustomer;
  billToCustomerId?: string;
  // Note: billToCustomer nested object is not available in the API, only billToCustomerId
  shippingTerms?: string;
  shipDate?: string;
  quoteId?: string;
  published?: boolean;
  projectedShipDate?: string;
  outsidePerLineItem?: boolean;
  orderType?: string;
  orderNumber?: string;
  markNumber?: string;
  insidePerLineItem?: boolean;
  headerStatus?: string;
  freightTerms?: string;
  factoryId?: string;
  factSoNumber?: string;
  entityDate?: string;
  endUserPerLineItem?: boolean;
  dueDate?: string;
  creationType?: string;
  createdById?: string;
  createdAt?: string;
  balanceId?: string;
}

export interface InvoiceDetail {
  id: string;
  commission?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: string;
  commissionRate?: string;
  discount?: number;
  discountRate?: string;
  divisionFactor?: string;
  endUserId?: string;
  invoiceId?: string;
  invoicedBalance?: number;
  itemNumber?: number;
  leadTime?: string;
  note?: string;
  orderDetailId?: string;
  outsideSplitRates?: InvoiceSplitRate[];
  product?: InvoiceProduct;
  productDescriptionAdhoc?: string;
  productId?: string;
  productNameAdhoc?: string;
  quantity?: string;
  status?: string;
  subtotal?: number;
  total?: number;
  totalLineCommission?: number;
  unitPrice?: string;
  uom?: InvoiceUom;
  uomId?: string;
}

export interface Invoice {
  id: string;
  balance?: InvoiceBalance;
  balanceId?: string;
  createdAt?: string;
  createdBy?: InvoiceUser;
  createdById?: string;
  creationType?: InvoiceCreationType;
  details?: InvoiceDetail[];
  dueDate?: string;
  entityDate?: string;
  factory?: InvoiceFactory;
  factoryId?: string;
  invoiceNumber?: string;
  locked?: boolean;
  order?: InvoiceOrder;
  orderId?: string;
  published?: boolean;
  status?: string;
  url?: string;
}

export interface InvoiceLandingPage {
  id: string;
  createdAt?: string;
  createdBy?: string;
  dueDate?: string;
  entityDate?: string;
  invoiceNumber?: string;
  locked?: boolean;
  orderId?: string;
  orderNumber?: string;
  published?: boolean;
  status?: string;
  total?: number;
  userIds?: string[];
  factoryName?: string;
  commission?: number;
}

// Input Types
export interface InvoiceSplitRateInput {
  id?: string;
  userId: string;
  splitRate: number;
  position?: number;
}

export interface InvoiceDetailInput {
  id?: string;
  itemNumber?: number;
  quantity: string;
  unitPrice: string;
  productId?: string;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  commissionRate?: string;
  commissionDiscountRate?: string;
  discountRate?: string;
  divisionFactor?: string;
  endUserId?: string;
  leadTime?: string;
  note?: string;
  orderDetailId?: string;
  outsideSplitRates?: InvoiceSplitRateInput[];
  uomId?: string;
}

export interface CreateInvoiceInput {
  id?: string;
  invoiceNumber: string;
  entityDate: string;
  dueDate?: string;
  orderId?: string;
  factoryId?: string;
  creationType?: InvoiceCreationType;
  details?: InvoiceDetailInput[];
}

export interface UpdateInvoiceInput extends CreateInvoiceInput {}

// Filter and Pagination Types
export interface InvoiceLandingPageFilter {
  operator: string;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface InvoiceLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedInvoicesResult {
  records: InvoiceLandingPage[];
  total: number;
}

export interface InvoiceSearchOptions {
  openOnly?: boolean;
  unlockedOnly?: boolean;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const INVOICE_LANDING_PAGES = `
  query InvoiceLandingPages($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: INVOICES
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      records {
        ... on InvoiceLandingPage {
          id
          userIds
          total
          published
          status
          orderNumber
          orderId
          locked
          invoiceNumber
          entityDate
          dueDate
          createdBy
          createdAt
          factoryName
          commission
        }
      }
      total
    }
  }
`;

const FIND_INVOICE_BY_ID = `
  query FindInvoiceById($id: UUID!) {
    invoice(id: $id) {
      id
      balance {
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        paidBalance
        quantity
        id
        subtotal
        total
      }
      balanceId
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
        visible
      }
      createdById
      creationType
      details {
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        divisionFactor
        endUserId
        id
        invoiceId
        invoicedBalance
        itemNumber
        leadTime
        note
        orderDetailId
        outsideSplitRates {
          id
          invoiceDetailId
          position
          splitRate
          user {
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
            visible
          }
          userId
        }
        product {
          approvalComments
          upc
          unitPriceDiscountRate
          unitPrice
          tags
          published
          minOrderQty
          leadTime
          id
          factoryPartNumber
          description
          defaultDivisor
          defaultCommissionRate
          commissionDiscountRate
          approvalNeeded
          approvalDate
        }
        uom {
          title
          id
          divisionFactor
          description
        }
        uomId
        unitPrice
        totalLineCommission
        total
        subtotal
        status
        quantity
        productNameAdhoc
        productId
        productDescriptionAdhoc
      }
      url
      status
      published
      orderId
      order {
        url
        status
        soldToCustomerId
        soldToCustomer {
          published
          parentId
          isParent
          id
          companyName
          buyingGroupId
        }
        billToCustomerId
        shippingTerms
        shipDate
        quoteId
        published
        projectedShipDate
        outsidePerLineItem
        orderType
        orderNumber
        markNumber
        insidePerLineItem
        id
        headerStatus
        freightTerms
        factoryId
        factSoNumber
        entityDate
        endUserPerLineItem
        dueDate
        creationType
        createdById
        createdAt
        balanceId
      }
      locked
      invoiceNumber
      factory {
        title
        published
        phone
        paymentTerms
        overallDiscountRate
        logoId
        leadTime
        id
        freightTerms
        freightDiscountType
        externalPaymentTerms
        email
        commissionDiscountRate
        baseCommissionRate
        additionalInformation
        accountNumber
      }
      entityDate
      dueDate
    }
  }
`;

const INVOICE_SEARCH = `
  query InvoiceSearch($searchTerm: String!, $limit: Int, $openOnly: Boolean, $unlockedOnly: Boolean) {
    invoiceSearch(searchTerm: $searchTerm, limit: $limit, openOnly: $openOnly, unlockedOnly: $unlockedOnly) {
      url
      status
      published
      orderId
      invoiceNumber
      locked
      id
      entityDate
      dueDate
      creationType
      createdAt
      createdById
      balanceId
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_INVOICE = `
  mutation CreateInvoice($input: InvoiceInput!) {
    createInvoice(input: $input) {
      id
      balance {
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        paidBalance
        quantity
        id
        subtotal
        total
      }
      balanceId
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
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        divisionFactor
        endUserId
        id
        invoiceId
        invoicedBalance
        itemNumber
        leadTime
        note
        orderDetailId
        outsideSplitRates {
          id
          invoiceDetailId
          position
          splitRate
          user {
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
          userId
        }
        product {
          approvalComments
          upc
          unitPriceDiscountRate
          unitPrice
          tags
          published
          minOrderQty
          leadTime
          id
          factoryPartNumber
          description
          defaultDivisor
          defaultCommissionRate
          commissionDiscountRate
          approvalNeeded
          approvalDate
        }
        uom {
          title
          id
          divisionFactor
          description
        }
        uomId
        unitPrice
        totalLineCommission
        total
        subtotal
        status
        quantity
        productNameAdhoc
        productId
        productDescriptionAdhoc
      }
      url
      status
      published
      orderId
      order {
        url
        status
        soldToCustomerId
        soldToCustomer {
          published
          parentId
          isParent
          id
          companyName
          buyingGroupId
        }
        billToCustomerId
        shipDate
        shippingTerms
        quoteId
        published
        projectedShipDate
        outsidePerLineItem
        orderType
        orderNumber
        markNumber
        insidePerLineItem
        id
        headerStatus
        freightTerms
        factoryId
        factSoNumber
        entityDate
        endUserPerLineItem
        dueDate
        creationType
        createdById
        createdAt
        balanceId
      }
      locked
      invoiceNumber
      factory {
        title
        published
        phone
        paymentTerms
        overallDiscountRate
        logoId
        leadTime
        id
        freightTerms
        freightDiscountType
        externalPaymentTerms
        email
        commissionDiscountRate
        baseCommissionRate
        additionalInformation
        accountNumber
      }
      entityDate
      dueDate
    }
  }
`;

const UPDATE_INVOICE = `
  mutation UpdateInvoice($input: InvoiceInput!) {
    updateInvoice(input: $input) {
      id
      balance {
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        paidBalance
        quantity
        id
        subtotal
        total
      }
      balanceId
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
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        divisionFactor
        endUserId
        id
        invoiceId
        invoicedBalance
        itemNumber
        leadTime
        note
        orderDetailId
        outsideSplitRates {
          id
          invoiceDetailId
          position
          splitRate
          user {
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
          userId
        }
        product {
          approvalComments
          upc
          unitPriceDiscountRate
          unitPrice
          tags
          published
          minOrderQty
          leadTime
          id
          factoryPartNumber
          description
          defaultDivisor
          defaultCommissionRate
          commissionDiscountRate
          approvalNeeded
          approvalDate
        }
        uom {
          title
          id
          divisionFactor
          description
        }
        uomId
        unitPrice
        totalLineCommission
        total
        subtotal
        status
        quantity
        productNameAdhoc
        productId
        productDescriptionAdhoc
      }
      url
      status
      published
      orderId
      order {
        url
        status
        soldToCustomerId
        soldToCustomer {
          published
          parentId
          isParent
          id
          companyName
          buyingGroupId
        }
        billToCustomerId
        shipDate
        shippingTerms
        quoteId
        published
        projectedShipDate
        outsidePerLineItem
        orderType
        orderNumber
        markNumber
        insidePerLineItem
        id
        headerStatus
        freightTerms
        factoryId
        factSoNumber
        entityDate
        endUserPerLineItem
        dueDate
        creationType
        createdById
        createdAt
        balanceId
      }
      locked
      invoiceNumber
      factory {
        title
        published
        phone
        paymentTerms
        overallDiscountRate
        logoId
        leadTime
        id
        freightTerms
        freightDiscountType
        externalPaymentTerms
        email
        commissionDiscountRate
        baseCommissionRate
        additionalInformation
        accountNumber
      }
      entityDate
      dueDate
    }
  }
`;

const DELETE_INVOICE = `
  mutation DeleteInvoice($id: UUID!) {
    deleteInvoice(id: $id)
  }
`;

const CREATE_INVOICE_FROM_ORDER = `
  mutation CreateInvoiceFromOrder(
    $factoryId: UUID!
    $invoiceNumber: String!
    $orderId: UUID!
    $dueDate: Date!
    $orderDetailIds: [UUID!]
  ) {
    createInvoiceFromOrder(
      factoryId: $factoryId
      invoiceNumber: $invoiceNumber
      orderId: $orderId
      dueDate: $dueDate
      orderDetailIds: $orderDetailIds
    ) {
      id
      invoiceNumber
      entityDate
      dueDate
      status
      orderId
      locked
      published
      url
      balance {
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        paidBalance
        quantity
        id
        subtotal
        total
      }
      balanceId
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
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        divisionFactor
        endUserId
        id
        invoiceId
        invoicedBalance
        itemNumber
        leadTime
        note
        orderDetailId
        outsideSplitRates {
          id
          invoiceDetailId
          position
          splitRate
          userId
        }
        product {
          approvalComments
          upc
          unitPriceDiscountRate
          unitPrice
          tags
          published
          minOrderQty
          leadTime
          id
          factoryPartNumber
          description
          defaultDivisor
          defaultCommissionRate
          commissionDiscountRate
          approvalNeeded
          approvalDate
        }
        uom {
          title
          id
          divisionFactor
          description
        }
        uomId
        unitPrice
        totalLineCommission
        total
        subtotal
        status
        quantity
        productNameAdhoc
        productId
        productDescriptionAdhoc
      }
      order {
        url
        status
        soldToCustomerId
        shipDate
        shippingTerms
        quoteId
        published
        projectedShipDate
        outsidePerLineItem
        orderType
        orderNumber
        markNumber
        insidePerLineItem
        id
        headerStatus
        freightTerms
        factoryId
        factSoNumber
        entityDate
        endUserPerLineItem
        dueDate
        creationType
        createdById
        createdAt
        billToCustomerId
        balanceId
      }
      factory {
        title
        published
        phone
        paymentTerms
        overallDiscountRate
        logoId
        leadTime
        id
        freightTerms
        freightDiscountType
        externalPaymentTerms
        email
        commissionDiscountRate
        baseCommissionRate
        additionalInformation
        accountNumber
      }
    }
  }
`;

// ============================================================================
// API Functions - Invoices
// ============================================================================

/**
 * Fetch invoices using findLandingPages endpoint with pagination
 */
export async function fetchInvoicesWithPagination(
  filters?: InvoiceLandingPageFilter[],
  orderBy?: InvoiceLandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedInvoicesResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: InvoiceLandingPage[]; total: number };
  }>({
    query: INVOICE_LANDING_PAGES,
    variables: {
      filters,
      orderBy,
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch invoices');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch all invoices (no pagination)
 */
export async function fetchInvoices(): Promise<InvoiceLandingPage[]> {
  const result = await fetchInvoicesWithPagination();
  return result.records;
}

/**
 * Fetch a single invoice by ID
 */
export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  const response = await crmGraphQLRequest<{ invoice: Invoice }>({
    query: FIND_INVOICE_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch invoice');
  }

  return response.data?.invoice || null;
}

/**
 * Search invoices by term
 */
export async function searchInvoices(
  searchTerm: string,
  limit: number = 10,
  options?: InvoiceSearchOptions
): Promise<Invoice[]> {
  const response = await crmGraphQLRequest<{ invoiceSearch: Invoice[] }>({
    query: INVOICE_SEARCH,
    variables: {
      searchTerm,
      limit,
      openOnly: options?.openOnly,
      unlockedOnly: options?.unlockedOnly,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search invoices');
  }

  return response.data?.invoiceSearch || [];
}

/**
 * Create a new invoice
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const response = await crmGraphQLRequest<{ createInvoice: Invoice }>({
    query: CREATE_INVOICE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create invoice');
  }

  if (!response.data?.createInvoice) {
    throw new Error('No invoice returned from create mutation');
  }

  return response.data.createInvoice;
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(input: UpdateInvoiceInput): Promise<Invoice> {
  const response = await crmGraphQLRequest<{ updateInvoice: Invoice }>({
    query: UPDATE_INVOICE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update invoice');
  }

  if (!response.data?.updateInvoice) {
    throw new Error('No invoice returned from update mutation');
  }

  return response.data.updateInvoice;
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteInvoice: string }>({
    query: DELETE_INVOICE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete invoice');
  }

  return true;
}

// ============================================================================
// Create Invoice from Order
// ============================================================================

export interface CreateInvoiceFromOrderInput {
  factoryId: string;
  invoiceNumber: string;
  orderId: string;
  dueDate: string;
  orderDetailIds?: string[];
}

/**
 * Create an invoice from an order
 */
export async function createInvoiceFromOrder(input: CreateInvoiceFromOrderInput): Promise<Invoice> {
  // Pass array of IDs directly (backend expects [UUID!])
  const orderDetailIds = input.orderDetailIds?.length
    ? input.orderDetailIds
    : undefined;

  const response = await crmGraphQLRequest<{ createInvoiceFromOrder: Invoice }>({
    query: CREATE_INVOICE_FROM_ORDER,
    variables: {
      factoryId: input.factoryId,
      invoiceNumber: input.invoiceNumber,
      orderId: input.orderId,
      dueDate: input.dueDate,
      orderDetailIds,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create invoice from order');
  }

  if (!response.data?.createInvoiceFromOrder) {
    throw new Error('No invoice returned from createInvoiceFromOrder mutation');
  }

  return response.data.createInvoiceFromOrder;
}

/**
 * Fetch all invoice IDs for bulk operations
 * Used when user selects all including unloaded items
 */
export async function fetchAllInvoiceIds(
  filters?: InvoiceLandingPageFilter[],
  orderBy?: InvoiceLandingPageOrderBy[]
): Promise<string[]> {
  // First get the total count
  const initialResult = await fetchInvoicesWithPagination(filters, orderBy, { limit: 1, offset: 0 });
  const total = initialResult.total;

  if (total === 0) return [];

  // Fetch all IDs in batches
  const batchSize = 500;
  const allIds: string[] = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await fetchInvoicesWithPagination(filters, orderBy, { limit: batchSize, offset });
    allIds.push(...result.records.map(r => r.id));
  }

  return allIds;
}
