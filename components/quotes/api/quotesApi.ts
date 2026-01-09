/**
 * Quotes API Module
 * Complete implementation of Quotes GraphQL API endpoints for Simple Quotes Mode
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// ============================================================================
// Enums
// ============================================================================

export type QuoteStatus = 'OPEN' | 'ORDERED' | 'EXPIRED' | 'LOST';
export type QuotePipelineStage = 'DISCOVERY' | 'PROSPECT' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type QuoteCreationType = 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';
export type QuoteDetailStatus = 'OPEN' | 'ORDERED' | 'LOST';

// ============================================================================
// Types
// ============================================================================

export interface QuoteBalance {
  id: string;
  commission?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  commissionRate?: number;
  discount?: number;
  discountRate?: number;
  quantity?: number;
  subtotal?: number;
  total?: number;
}

export interface QuoteCustomer {
  id: string;
  companyName: string;
  isParent: boolean;
  parentId?: string;
  published: boolean;
}

export interface QuoteCreatedBy {
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

export interface QuoteSplitRate {
  id: string;
  createdAt?: string;
  position?: number;
  quoteId?: string;
  quoteDetailId?: string;
  splitRate?: string;
  userId?: string;
}

export interface QuoteProduct {
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

export interface QuoteUom {
  id: string;
  description?: string;
  divisionFactor?: number;
  title?: string;
}

export interface QuoteDetail {
  id: string;
  commission?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: string;
  commissionRate?: string;
  discount?: number;
  discountRate?: string;
  divisionFactor?: string;
  endUserId?: string;
  factoryId?: string;
  itemNumber?: number;
  leadTime?: string;
  note?: string;
  product?: QuoteProduct;
  productDescriptionAdhoc?: string;
  productId?: string;
  productNameAdhoc?: string;
  quantity?: number;
  quoteId?: string;
  insideSplitRates?: QuoteSplitRate[];
  outsideSplitRates?: QuoteSplitRate[];
  status?: QuoteDetailStatus;
  subtotal?: number;
  total?: number;
  totalLineCommission?: number;
  unitPrice?: string;
  uom?: QuoteUom;
}

export interface QuoteInsideRep {
  id: string;
  createdAt?: string;
  position?: number;
  quoteId?: string;
  splitRate?: string;
  userId?: string;
}

export interface QuoteOutsideRep {
  id: string;
  createdAt?: string;
  position?: number;
  quoteId?: string;
  splitRate?: string;
  userId?: string;
}

export interface QuoteJob {
  id: string;
  jobName: string;
  jobType?: string;
  description?: string;
  additionalInformation?: string;
  structuralInformation?: string;
  structuralDetails?: string;
  startDate?: string;
  endDate?: string;
  requesterId?: string;
  createdAt?: string;
  tags?: string;
}

export interface Quote {
  id: string;
  acceptDate?: string;
  balance?: QuoteBalance;
  balanceId?: string;
  billToCustomer?: QuoteCustomer;
  billToCustomerId?: string;
  blanket?: boolean;
  createdAt?: string;
  createdBy?: QuoteCreatedBy;
  createdById?: string;
  creationType?: QuoteCreationType;
  customerRef?: string;
  details?: QuoteDetail[];
  duplicatedFrom?: string;
  entityDate?: string;
  expDate?: string;
  freightTerms?: string;
  job?: QuoteJob;
  paymentTerms?: string;
  pipelineStage?: QuotePipelineStage;
  published?: boolean;
  quoteNumber: string;
  reviseDate?: string;
  soldToCustomer?: QuoteCustomer;
  soldToCustomerId?: string;
  status?: QuoteStatus;
  url?: string;
  versionOf?: string;
  // Settings for per-line-item configuration
  endUserPerLineItem?: boolean;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
  factoryPerLineItem?: boolean;
}

export interface QuoteLandingPage {
  id: string;
  createdAt?: string;
  createdBy?: string;
  entityDate?: string;
  expDate?: string;
  pipelineStage?: QuotePipelineStage;
  published?: boolean;
  quoteNumber: string;
  status?: QuoteStatus;
  total?: number;
  commission?: number;
  userIds?: string[];
}

// Input Types
export interface QuoteSplitRateInput {
  id?: string;
  userId: string;
  splitRate: number;
  position?: number;
}

export interface QuoteDetailInput {
  id?: string;
  quantity: number;
  unitPrice: string;
  commissionDiscountRate?: string;
  commissionRate?: string;
  discountRate?: string;
  divisionFactor?: string;
  endUserId?: string;
  factoryId?: string;
  itemNumber?: number;
  leadTime?: string;
  note?: string;
  productDescriptionAdhoc?: string;
  productNameAdhoc?: string;
  productId?: string;
  uomId?: string;
  insideSplitRates?: QuoteSplitRateInput[];
  outsideSplitRates?: QuoteSplitRateInput[];
  status?: QuoteDetailStatus;
}

export interface CreateQuoteInput {
  quoteNumber: string;
  entityDate: string;
  soldToCustomerId: string;
  status?: QuoteStatus;
  pipelineStage?: QuotePipelineStage;
  details?: QuoteDetailInput[];
  published?: boolean;
  creationType?: QuoteCreationType;
  blanket?: boolean;
  acceptDate?: string;
  billToCustomerId?: string;
  customerRef?: string;
  expDate?: string;
  freightTerms?: string;
  id?: string;
  jobId?: string;
  paymentTerms?: string;
  reviseDate?: string;
  // Settings for per-line-item configuration
  endUserPerLineItem?: boolean;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
  factoryPerLineItem?: boolean;
}

export interface UpdateQuoteInput extends CreateQuoteInput {}

// Filter and Pagination Types
export interface QuoteLandingPageFilter {
  operator: string;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface QuoteLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedQuotesResult {
  records: QuoteLandingPage[];
  total: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const QUOTE_LANDING_PAGES = `
  query QuoteLandingPages($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: QUOTES
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      records {
        ... on QuoteLandingPage {
          id
          createdAt
          createdBy
          entityDate
          expDate
          pipelineStage
          published
          quoteNumber
          status
          total
          commission
          userIds
        }
      }
      total
    }
  }
`;

const FIND_QUOTE_BY_ID = `
  query FindQuoteById($id: UUID!) {
    quote(id: $id) {
      id
      acceptDate
      balance {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        quantity
        subtotal
        total
      }
      balanceId
      billToCustomer {
        id
        companyName
        isParent
        parentId
        published
      }
      billToCustomerId
      blanket
      createdAt
      createdBy {
        id
        authProviderId
        email
        enabled
        firstName
        fullName
        inside
        lastName
        outside
        role
        username
      }
      createdById
      creationType
      customerRef
      details {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        endUserId
        factoryId
        itemNumber
        leadTime
        note
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
        quoteId
        insideSplitRates {
          id
          position
          splitRate
          userId
        }
        outsideSplitRates {
          id
          createdAt
          position
          quoteDetailId
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
      duplicatedFrom
      entityDate
      expDate
      freightTerms
      job {
        id
        jobName
        jobType
        description
        additionalInformation
        structuralInformation
        structuralDetails
        startDate
        endDate
        requesterId
        createdAt
        tags
      }
      paymentTerms
      pipelineStage
      published
      quoteNumber
      reviseDate
      soldToCustomer {
        id
        companyName
        isParent
        parentId
        published
      }
      soldToCustomerId
      status
      url
      versionOf
      endUserPerLineItem
      insidePerLineItem
      outsidePerLineItem
      factoryPerLineItem
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_QUOTE = `
  mutation CreateQuote($input: QuoteInput!) {
    createQuote(input: $input) {
      id
      acceptDate
      balance {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        quantity
        subtotal
        total
      }
      balanceId
      billToCustomer {
        id
        companyName
        isParent
        parentId
        published
      }
      billToCustomerId
      blanket
      createdAt
      createdBy {
        id
        authProviderId
        email
        enabled
        firstName
        fullName
        inside
        lastName
        outside
        role
        username
      }
      createdById
      creationType
      customerRef
      details {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        endUserId
        factoryId
        itemNumber
        leadTime
        note
        productDescriptionAdhoc
        productId
        productNameAdhoc
        quantity
        quoteId
        insideSplitRates {
          id
          position
          splitRate
          userId
        }
        outsideSplitRates {
          id
          createdAt
          position
          quoteDetailId
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
      duplicatedFrom
      entityDate
      expDate
      freightTerms
      job {
        id
        jobName
        jobType
        description
        additionalInformation
        structuralInformation
        structuralDetails
        startDate
        endDate
        requesterId
        createdAt
        tags
      }
      paymentTerms
      pipelineStage
      published
      quoteNumber
      reviseDate
      soldToCustomer {
        id
        companyName
        isParent
        parentId
        published
      }
      soldToCustomerId
      status
      url
      versionOf
      endUserPerLineItem
      insidePerLineItem
      outsidePerLineItem
      factoryPerLineItem
    }
  }
`;

const UPDATE_QUOTE = `
  mutation UpdateQuote($input: QuoteInput!) {
    updateQuote(input: $input) {
      id
      acceptDate
      balance {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        quantity
        subtotal
        total
      }
      balanceId
      billToCustomer {
        id
        companyName
        isParent
        parentId
        published
      }
      billToCustomerId
      blanket
      createdAt
      createdBy {
        id
        authProviderId
        email
        enabled
        firstName
        fullName
        inside
        lastName
        outside
        role
        username
      }
      createdById
      creationType
      customerRef
      details {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        endUserId
        factoryId
        itemNumber
        leadTime
        note
        productDescriptionAdhoc
        productId
        productNameAdhoc
        quantity
        quoteId
        insideSplitRates {
          id
          position
          splitRate
          userId
        }
        outsideSplitRates {
          id
          createdAt
          position
          quoteDetailId
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
      duplicatedFrom
      entityDate
      expDate
      freightTerms
      job {
        id
        jobName
        jobType
        description
        additionalInformation
        structuralInformation
        structuralDetails
        startDate
        endDate
        requesterId
        createdAt
        tags
      }
      paymentTerms
      pipelineStage
      published
      quoteNumber
      reviseDate
      soldToCustomer {
        id
        companyName
        isParent
        parentId
        published
      }
      soldToCustomerId
      status
      url
      versionOf
      endUserPerLineItem
      insidePerLineItem
      outsidePerLineItem
      factoryPerLineItem
    }
  }
`;

const DUPLICATE_QUOTE = `
  mutation DuplicateQuote($sourceQuoteId: UUID!, $newQuoteNumber: String!) {
    duplicateQuote(sourceQuoteId: $sourceQuoteId, newQuoteNumber: $newQuoteNumber) {
      id
      quoteNumber
      status
      pipelineStage
      soldToCustomerId
      soldToCustomer {
        id
        companyName
      }
      createdAt
      entityDate
      expDate
      total: balance {
        total
      }
    }
  }
`;

const DELETE_QUOTE = `
  mutation DeleteQuote($id: UUID!) {
    deleteQuote(id: $id)
  }
`;

const CREATE_QUOTE_FROM_PRE_OPPORTUNITY = `
  mutation CreateQuoteFromPreOpportunity($preOpportunityId: UUID!, $quoteNumber: String!, $preOpportunityDetailIds: String) {
    createQuoteFromPreOpportunity(preOpportunityId: $preOpportunityId, quoteNumber: $quoteNumber, preOpportunityDetailIds: $preOpportunityDetailIds) {
      id
      acceptDate
      balance {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        quantity
        subtotal
        total
      }
      balanceId
      billToCustomer {
        id
        companyName
        isParent
        parentId
        published
      }
      billToCustomerId
      blanket
      createdAt
      createdBy {
        id
        authProviderId
        email
        enabled
        firstName
        fullName
        inside
        lastName
        outside
        role
        username
      }
      createdById
      creationType
      customerRef
      details {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        endUserId
        factoryId
        itemNumber
        leadTime
        note
        productDescriptionAdhoc
        productId
        productNameAdhoc
        quantity
        quoteId
        insideSplitRates {
          id
          position
          splitRate
          userId
        }
        outsideSplitRates {
          id
          createdAt
          position
          quoteDetailId
          splitRate
          userId
        }
        status
        subtotal
        total
        totalLineCommission
        unitPrice
      }
      duplicatedFrom
      entityDate
      expDate
      freightTerms
      paymentTerms
      pipelineStage
      published
      quoteNumber
      reviseDate
      soldToCustomer {
        id
        companyName
        isParent
        parentId
        published
      }
      soldToCustomerId
      status
      url
      versionOf
    }
  }
`;

// ============================================================================
// Customer Search Query (for dropdowns)
// ============================================================================

const CUSTOMER_SEARCH = `
  query CustomerSearch($searchTerm: String!, $published: Boolean) {
    customerSearch(searchTerm: $searchTerm, published: $published) {
      id
      companyName
      isParent
      parentId
      published
    }
  }
`;

// ============================================================================
// Product Search Query (for line items)
// ============================================================================

const PRODUCT_SEARCH = `
  query ProductSearch($searchTerm: String!, $factoryId: UUID, $limit: Int) {
    productSearch(searchTerm: $searchTerm, factoryId: $factoryId, limit: $limit) {
      id
      factoryPartNumber
      description
      unitPrice
      defaultCommissionRate
      defaultDivisor
      approvalNeeded
      published
      leadTime
      minOrderQty
      commissionDiscountRate
      unitPriceDiscountRate
    }
  }
`;

// ============================================================================
// Factory Search Query (for line items)
// ============================================================================

const FACTORY_SEARCH = `
  query FactorySearch($searchTerm: String!, $published: Boolean) {
    factorySearch(searchTerm: $searchTerm, published: $published) {
      id
      title
      accountNumber
      published
    }
  }
`;

// ============================================================================
// User Search Query (for inside reps and split rates)
// ============================================================================

const USER_SEARCH = `
  query UserSearch($searchTerm: String!, $isInside: Boolean, $isOutside: Boolean, $enabled: Boolean, $limit: Int) {
    userSearch(
      searchTerm: $searchTerm
      isInside: $isInside
      isOutside: $isOutside
      enabled: $enabled
      limit: $limit
    ) {
      id
      authProviderId
      email
      enabled
      firstName
      fullName
      inside
      lastName
      outside
      role
      username
    }
  }
`;

// ============================================================================
// Product CPNs Query (for Customer Part Numbers by Product ID)
// ============================================================================

const LIST_PRODUCT_CPNS = `
  query ListProductCpnsByProductId($productId: UUID!) {
    listProductCpnsByProductId(productId: $productId) {
      id
      customerPartNumber
      customerId
      productId
      commissionRate
      unitPrice
    }
  }
`;

// ============================================================================
// Product CPN by Product ID and Customer ID Query
// ============================================================================

const GET_PRODUCT_CPN_BY_PRODUCT_AND_CUSTOMER = `
  query ProductCpnByProductIdAndCustomerId($productId: UUID!, $customerId: UUID!) {
    productCpnByProductIdAndCustomerId(productId: $productId, customerId: $customerId) {
      id
      customerPartNumber
      customerId
      productId
      commissionRate
      unitPrice
    }
  }
`;

// ============================================================================
// Product UOMs Query (for Unit of Measure)
// ============================================================================

const LIST_PRODUCT_UOMS = `
  query ListProductUoms {
    productUoms {
      id
      description
      divisionFactor
      title
    }
  }
`;

// ============================================================================
// API Types for Search Results
// ============================================================================

export interface CustomerSearchResult {
  id: string;
  companyName: string;
  isParent: boolean;
  parentId?: string;
  published: boolean;
}

export interface ProductSearchResult {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  defaultDivisor?: number;
  approvalNeeded?: boolean;
  published?: boolean;
  leadTime?: string;
  minOrderQty?: number;
  commissionDiscountRate?: number;
  unitPriceDiscountRate?: number;
}

export interface FactorySearchResult {
  id: string;
  title: string;
  accountNumber?: string;
  published?: boolean;
}

export interface ProductCpnResult {
  id: string;
  customerPartNumber: string;
  customerId?: string;
  productId: string;
  commissionRate?: string;
  unitPrice?: string;
}

export interface ProductUomResult {
  id: string;
  description?: string;
  divisionFactor?: number;
  title?: string;
}

export interface UserSearchResult {
  id: string;
  authProviderId?: string;
  email?: string;
  enabled?: boolean;
  firstName?: string;
  fullName?: string;
  inside?: boolean;
  lastName?: string;
  outside?: boolean;
  role?: string;
  username?: string;
}

// ============================================================================
// API Functions - Quotes
// ============================================================================

/**
 * Fetch quotes using findLandingPages endpoint with pagination
 */
export async function fetchQuotesWithPagination(
  filters?: QuoteLandingPageFilter[],
  orderBy?: QuoteLandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedQuotesResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: QuoteLandingPage[]; total: number };
  }>({
    query: QUOTE_LANDING_PAGES,
    variables: {
      filters,
      orderBy,
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch quotes');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch all quotes (no pagination)
 */
export async function fetchQuotes(): Promise<QuoteLandingPage[]> {
  const result = await fetchQuotesWithPagination();
  return result.records;
}

/**
 * Fetch a single quote by ID
 */
export async function fetchQuoteById(id: string): Promise<Quote | null> {
  const response = await crmGraphQLRequest<{ quote: Quote }>({
    query: FIND_QUOTE_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch quote');
  }

  return response.data?.quote || null;
}

/**
 * Create a new quote
 */
export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const response = await crmGraphQLRequest<{ createQuote: Quote }>({
    query: CREATE_QUOTE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create quote');
  }

  if (!response.data?.createQuote) {
    throw new Error('No quote returned from create mutation');
  }

  return response.data.createQuote;
}

/**
 * Update an existing quote
 */
export async function updateQuote(input: UpdateQuoteInput): Promise<Quote> {
  const response = await crmGraphQLRequest<{ updateQuote: Quote }>({
    query: UPDATE_QUOTE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update quote');
  }

  if (!response.data?.updateQuote) {
    throw new Error('No quote returned from update mutation');
  }

  return response.data.updateQuote;
}

/**
 * Duplicate a quote
 */
export async function duplicateQuote(sourceQuoteId: string, newQuoteNumber: string): Promise<Quote> {
  const response = await crmGraphQLRequest<{ duplicateQuote: Quote }>({
    query: DUPLICATE_QUOTE,
    variables: { sourceQuoteId, newQuoteNumber },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to duplicate quote');
  }

  if (!response.data?.duplicateQuote) {
    throw new Error('No quote returned from duplicate mutation');
  }

  return response.data.duplicateQuote;
}

/**
 * Delete a quote
 */
export async function deleteQuote(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteQuote: string }>({
    query: DELETE_QUOTE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete quote');
  }

  return true;
}

/**
 * Create a quote from a pre-opportunity
 * @param preOpportunityId - The ID of the pre-opportunity
 * @param quoteNumber - The quote number to assign
 * @param preOpportunityDetailIds - Optional comma-separated list of detail IDs to include (if not provided, all details are included)
 */
export async function createQuoteFromPreOpportunity(
  preOpportunityId: string,
  quoteNumber: string,
  preOpportunityDetailIds?: string
): Promise<Quote> {
  const response = await crmGraphQLRequest<{ createQuoteFromPreOpportunity: Quote }>({
    query: CREATE_QUOTE_FROM_PRE_OPPORTUNITY,
    variables: { preOpportunityId, quoteNumber, preOpportunityDetailIds },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create quote from pre-opportunity');
  }

  if (!response.data?.createQuoteFromPreOpportunity) {
    throw new Error('No quote returned from createQuoteFromPreOpportunity mutation');
  }

  return response.data.createQuoteFromPreOpportunity;
}

// ============================================================================
// API Functions - Search (for dropdowns)
// ============================================================================

/**
 * Search customers for dropdowns
 */
export async function searchCustomers(searchTerm: string, published?: boolean): Promise<CustomerSearchResult[]> {
  const response = await crmGraphQLRequest<{ customerSearch: CustomerSearchResult[] }>({
    query: CUSTOMER_SEARCH,
    variables: { searchTerm, published },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search customers');
  }

  return response.data?.customerSearch || [];
}

/**
 * Search products for line items
 */
export async function searchProducts(
  searchTerm: string,
  factoryId?: string,
  limit?: number
): Promise<ProductSearchResult[]> {
  // Only include factoryId if it's a non-empty string (avoid sending empty string as UUID)
  const variables: { searchTerm: string; factoryId?: string; limit: number } = {
    searchTerm,
    limit: limit ?? 50,
  };
  if (factoryId && factoryId.trim() !== '') {
    variables.factoryId = factoryId;
  }

  const response = await crmGraphQLRequest<{ productSearch: ProductSearchResult[] }>({
    query: PRODUCT_SEARCH,
    variables,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search products');
  }

  return response.data?.productSearch || [];
}

/**
 * Search factories for line items
 */
export async function searchFactories(searchTerm: string, published?: boolean): Promise<FactorySearchResult[]> {
  const response = await crmGraphQLRequest<{ factorySearch: FactorySearchResult[] }>({
    query: FACTORY_SEARCH,
    variables: { searchTerm, published },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search factories');
  }

  return response.data?.factorySearch || [];
}

/**
 * Search users for inside reps and split rates
 */
export async function searchUsers(params: {
  searchTerm: string;
  isInside?: boolean;
  isOutside?: boolean;
  enabled?: boolean;
  limit?: number;
}): Promise<UserSearchResult[]> {
  const response = await crmGraphQLRequest<{ userSearch: UserSearchResult[] }>({
    query: USER_SEARCH,
    variables: {
      searchTerm: params.searchTerm,
      isInside: params.isInside,
      isOutside: params.isOutside,
      enabled: params.enabled,
      limit: params.limit ?? 10,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search users');
  }

  return response.data?.userSearch || [];
}

/**
 * List customer part numbers (CPNs) for a product
 */
export async function listProductCpns(productId: string): Promise<ProductCpnResult[]> {
  const response = await crmGraphQLRequest<{ listProductCpnsByProductId: ProductCpnResult[] }>({
    query: LIST_PRODUCT_CPNS,
    variables: { productId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product CPNs');
  }

  return response.data?.listProductCpnsByProductId || [];
}

/**
 * Get customer part number (CPN) for a specific product and customer
 * Used to auto-populate CPN when selecting a product in quotes/orders
 */
export async function getProductCpnByCustomer(productId: string, customerId: string): Promise<ProductCpnResult | null> {
  if (!productId || !customerId) return null;

  const response = await crmGraphQLRequest<{ productCpnByProductIdAndCustomerId: ProductCpnResult | null }>({
    query: GET_PRODUCT_CPN_BY_PRODUCT_AND_CUSTOMER,
    variables: { productId, customerId },
  });

  if (response.errors) {
    // If no CPN found, this is not an error - just return null
    console.log('No CPN found for product and customer:', response.errors[0]?.message);
    return null;
  }

  return response.data?.productCpnByProductIdAndCustomerId || null;
}

/**
 * List all UOMs (Unit of Measure)
 */
export async function listProductUoms(): Promise<ProductUomResult[]> {
  const response = await crmGraphQLRequest<{ productUoms: ProductUomResult[] }>({
    query: LIST_PRODUCT_UOMS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product UOMs');
  }

  return response.data?.productUoms || [];
}

// ============================================================================
// Job Search Types and API
// ============================================================================

export interface JobSearchResult {
  id: string;
  jobName: string;
  jobType?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: { id: string; name?: string };
  requesterId?: string;
  additionalInformation?: string;
  structuralDetails?: string;
  structuralInformation?: string;
  tags?: string;
  createdAt?: string;
  createdBy?: string;
}

const JOB_SEARCH = `
  query JobSearch($searchTerm: String!, $limit: Int) {
    jobSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      jobName
      jobType
      description
      startDate
      endDate
      status {
        id
        name
      }
      requesterId
      additionalInformation
      structuralDetails
      structuralInformation
      tags
      createdAt
      createdBy {
        fullName
      }
    }
  }
`;

interface JobSearchApiResult {
  id: string;
  jobName: string;
  jobType?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: { id: string; name?: string };
  requesterId?: string;
  additionalInformation?: string;
  structuralDetails?: string;
  structuralInformation?: string;
  tags?: string;
  createdAt?: string;
  createdBy?: { fullName?: string };
}

/**
 * Search jobs for dropdowns
 */
export async function searchJobs(searchTerm: string, limit?: number): Promise<JobSearchResult[]> {
  const response = await crmGraphQLRequest<{ jobSearch: JobSearchApiResult[] }>({
    query: JOB_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search jobs');
  }

  // Format createdBy to be a string
  return (response.data?.jobSearch || []).map(job => ({
    id: job.id,
    jobName: job.jobName,
    jobType: job.jobType,
    description: job.description,
    startDate: job.startDate,
    endDate: job.endDate,
    status: job.status,
    requesterId: job.requesterId,
    additionalInformation: job.additionalInformation,
    structuralDetails: job.structuralDetails,
    structuralInformation: job.structuralInformation,
    tags: job.tags,
    createdAt: job.createdAt,
    createdBy: job.createdBy?.fullName,
  }));
}

/**
 * Fetch all quote IDs for bulk operations
 * Used when user selects all including unloaded items
 */
export async function fetchAllQuoteIds(
  filters?: QuoteLandingPageFilter[],
  orderBy?: QuoteLandingPageOrderBy[]
): Promise<string[]> {
  // First get the total count
  const initialResult = await fetchQuotesWithPagination(filters, orderBy, { limit: 1, offset: 0 });
  const total = initialResult.total;

  if (total === 0) return [];

  // Fetch all IDs in batches
  const batchSize = 500;
  const allIds: string[] = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await fetchQuotesWithPagination(filters, orderBy, { limit: batchSize, offset });
    allIds.push(...result.records.map(r => r.id));
  }

  return allIds;
}
