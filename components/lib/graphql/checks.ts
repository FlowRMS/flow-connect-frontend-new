/**
 * Checks GraphQL Module
 * Centralized GraphQL queries and mutations for commission checks
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Enums
// ============================================================================

export type CheckStatus = 'OPEN' | 'POSTED';
export type CheckCreationType = 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';

// ============================================================================
// Types
// ============================================================================

export interface CheckFactory {
  id: string;
  title?: string;
  published?: boolean;
  phone?: string;
  paymentTerms?: string;
  overallDiscountRate?: string;
  logoId?: string;
  leadTime?: string;
  freightTerms?: string;
  freightDiscountType?: string;
  externalPaymentTerms?: string;
  email?: string;
  commissionDiscountRate?: string;
  baseCommissionRate?: string;
  accountNumber?: string;
  additionalInformation?: string;
}

export interface CheckInvoiceOrder {
  orderNumber?: string;
}

export interface CheckInvoice {
  id: string;
  invoiceNumber?: string;
  entityDate?: string;
  dueDate?: string;
  status?: string;
  orderId?: string;
  balanceId?: string;
  locked?: boolean;
  published?: boolean;
  creationType?: string;
  createdById?: string;
  createdAt?: string;
  url?: string;
  order?: CheckInvoiceOrder;
}

export interface CheckCreditOrder {
  orderNumber?: string;
}

export interface CheckCredit {
  id: string;
  creditNumber?: string;
  creditType?: string;
  entityDate?: string;
  reason?: string;
  status?: string;
  orderId?: string;
  balanceId?: string;
  locked?: boolean;
  creationType?: string;
  createdById?: string;
  createdAt?: string;
  url?: string;
  order?: CheckCreditOrder;
}

export interface CheckAdjustmentFactory {
  title?: string;
}

export interface CheckAdjustmentCustomer {
  companyName?: string;
}

export interface CheckAdjustment {
  id: string;
  adjustmentNumber?: string;
  amount?: string;
  entityDate?: string;
  reason?: string;
  status?: string;
  factoryId?: string;
  locked?: boolean;
  creationType?: string;
  createdById?: string;
  createdAt?: string;
  factory?: CheckAdjustmentFactory;
  customer?: CheckAdjustmentCustomer;
}

export interface CheckDetail {
  id: string;
  checkId?: string;
  invoiceId?: string;
  invoice?: CheckInvoice;
  creditId?: string;
  credit?: CheckCredit;
  adjustmentId?: string;
  adjustment?: CheckAdjustment;
  appliedAmount?: string;
}

export interface Check {
  id: string;
  checkNumber?: string;
  entityDate?: string;
  postDate?: string;
  commissionMonth?: string;
  enteredCommissionAmount?: string;
  status?: CheckStatus;
  factoryId?: string;
  factory?: CheckFactory;
  creationType?: CheckCreationType;
  createdById?: string;
  createdAt?: string;
  url?: string;
  details?: CheckDetail[];
}

export interface CheckSearchResult {
  id: string;
  checkNumber?: string;
  entityDate?: string;
  postDate?: string;
  commissionMonth?: string;
  enteredCommissionAmount?: string;
  status?: CheckStatus;
  factoryId?: string;
  creationType?: CheckCreationType;
  createdById?: string;
  createdAt?: string;
  url?: string;
}

// Landing Page type for findLandingPages query
export interface CheckLandingPage {
  id: string;
  checkNumber?: string;
  checkDate?: string;
  postDate?: string;
  commissionMonth?: string;
  enteredCommissionAmount?: string;
  status?: CheckStatus;
  factoryName?: string;
  createdBy?: string;
  createdAt?: string;
  userIds?: string[];
}

export interface FindChecksLandingPagesResponse {
  total: number;
  records: CheckLandingPage[];
}

// Input Types
export interface CheckDetailInput {
  id?: string;
  invoiceId?: string;
  creditId?: string;
  adjustmentId?: string;
  appliedAmount: string;
}

export interface CreateCheckInput {
  id?: string;
  checkNumber?: string;
  entityDate: string;
  postDate?: string;
  commissionMonth?: string;
  enteredCommissionAmount: string;
  factoryId: string;
  status?: CheckStatus;
  creationType?: CheckCreationType;
  details?: CheckDetailInput[];
}

export interface UpdateCheckInput extends CreateCheckInput {
  id: string;
}

// ============================================================================
// GraphQL Field Selections
// ============================================================================

const CHECK_DETAIL_FIELDS = `
  id
  checkId
  invoiceId
  invoice {
    id
    invoiceNumber
    entityDate
    dueDate
    status
    orderId
    balanceId
    locked
    published
    creationType
    createdById
    createdAt
    url
    order {
      orderNumber
    }
  }
  creditId
  credit {
    id
    creditNumber
    creditType
    entityDate
    reason
    status
    orderId
    balanceId
    locked
    creationType
    createdById
    createdAt
    url
    order {
      orderNumber
    }
  }
  adjustmentId
  adjustment {
    id
    adjustmentNumber
    amount
    entityDate
    reason
    status
    factoryId
    locked
    creationType
    createdById
    createdAt
    factory {
      title
    }
    customer {
      companyName
    }
  }
  appliedAmount
`;

const CHECK_FIELDS = `
  id
  checkNumber
  entityDate
  postDate
  commissionMonth
  enteredCommissionAmount
  status
  factoryId
  factory {
    id
    title
    published
    phone
    paymentTerms
    overallDiscountRate
    logoId
    leadTime
    freightTerms
    freightDiscountType
    externalPaymentTerms
    email
    commissionDiscountRate
    baseCommissionRate
    accountNumber
    additionalInformation
  }
  creationType
  createdById
  createdAt
  url
  details {
    ${CHECK_DETAIL_FIELDS}
  }
`;

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_CHECK = `
  query GetCheck($id: UUID!) {
    check(id: $id) {
      ${CHECK_FIELDS}
    }
  }
`;

const SEARCH_CHECKS = `
  query SearchChecks($searchTerm: String, $limit: Int) {
    checkSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      checkNumber
      entityDate
      postDate
      commissionMonth
      enteredCommissionAmount
      status
      factoryId
      creationType
      createdById
      createdAt
      url
    }
  }
`;

const GET_CHECKS_BY_FACTORY = `
  query GetChecksByFactory($factoryId: UUID!) {
    checksByFactory(factoryId: $factoryId) {
      id
      checkNumber
      entityDate
      postDate
      commissionMonth
      enteredCommissionAmount
      status
      factoryId
      creationType
      createdById
      createdAt
      url
    }
  }
`;

const FIND_CHECKS_LANDING_PAGE = `
  query FindChecksLandingPage($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: CHECKS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      total
      records {
        ... on CheckLandingPage {
          id
          checkNumber
          checkDate
          postDate
          commissionMonth
          enteredCommissionAmount
          status
          factoryName
          createdBy
          createdAt
          userIds
        }
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_CHECK = `
  mutation CreateCheck($input: CheckInput!) {
    createCheck(input: $input) {
      ${CHECK_FIELDS}
    }
  }
`;

const UPDATE_CHECK = `
  mutation UpdateCheck($input: CheckInput!) {
    updateCheck(input: $input) {
      ${CHECK_FIELDS}
    }
  }
`;

const DELETE_CHECK = `
  mutation DeleteCheck($id: UUID!) {
    deleteCheck(id: $id)
  }
`;

const UNPOST_CHECK = `
  mutation UnpostCheck($checkId: UUID!) {
    unpostCheck(checkId: $checkId) {
      ${CHECK_FIELDS}
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch a single check by ID
 */
export async function fetchCheckById(id: string): Promise<Check | null> {
  const response = await crmGraphQLRequest<{ check: Check }>({
    query: GET_CHECK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch check');
  }

  return response.data?.check || null;
}

/**
 * Search checks by term
 */
export async function searchChecks(
  searchTerm: string = '',
  limit: number = 50
): Promise<CheckSearchResult[]> {
  const response = await crmGraphQLRequest<{ checkSearch: CheckSearchResult[] }>({
    query: SEARCH_CHECKS,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search checks');
  }

  return response.data?.checkSearch || [];
}

/**
 * Fetch checks by factory ID
 */
export async function fetchChecksByFactory(factoryId: string): Promise<CheckSearchResult[]> {
  const response = await crmGraphQLRequest<{ checksByFactory: CheckSearchResult[] }>({
    query: GET_CHECKS_BY_FACTORY,
    variables: { factoryId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch checks by factory');
  }

  return response.data?.checksByFactory || [];
}

/**
 * Fetch all checks using findLandingPages
 */
export async function fetchChecksLandingPage(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  limit: number = 100,
  offset: number = 0
): Promise<{ total: number; records: CheckLandingPage[] }> {
  try {
    const response = await crmGraphQLRequest<{ findLandingPages: FindChecksLandingPagesResponse }>({
      query: FIND_CHECKS_LANDING_PAGE,
      variables: {
        filters: filters || [],
        limit,
        offset,
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
      return { total: 0, records: [] };
    }

    return {
      total: response.data?.findLandingPages?.total || 0,
      records: response.data?.findLandingPages?.records || [],
    };
  } catch (error) {
    console.warn('Error fetching checks:', error);
    return { total: 0, records: [] };
  }
}

/**
 * Generate a check number if not provided
 */
function generateCheckNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CHK-${timestamp}-${random}`;
}

/**
 * Create a new check
 */
export async function createCheck(input: CreateCheckInput): Promise<Check> {
  // Ensure checkNumber is provided
  const checkInput = {
    ...input,
    checkNumber: input.checkNumber || generateCheckNumber(),
    details: input.details || [],
  };

  const response = await crmGraphQLRequest<{ createCheck: Check }>({
    query: CREATE_CHECK,
    variables: { input: checkInput },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create check');
  }

  if (!response.data?.createCheck) {
    throw new Error('No check returned from create mutation');
  }

  return response.data.createCheck;
}

/**
 * Update an existing check
 */
export async function updateCheck(input: UpdateCheckInput): Promise<Check> {
  const response = await crmGraphQLRequest<{ updateCheck: Check }>({
    query: UPDATE_CHECK,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update check');
  }

  if (!response.data?.updateCheck) {
    throw new Error('No check returned from update mutation');
  }

  return response.data.updateCheck;
}

/**
 * Delete a check
 */
export async function deleteCheck(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteCheck: string }>({
    query: DELETE_CHECK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete check');
  }

  return true;
}

/**
 * Unpost a check - changes status from POSTED back to OPEN
 * This allows the check to be edited again
 */
export async function unpostCheck(checkId: string): Promise<Check> {
  const response = await crmGraphQLRequest<{ unpostCheck: Check }>({
    query: UNPOST_CHECK,
    variables: { checkId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to unpost check');
  }

  if (!response.data?.unpostCheck) {
    throw new Error('No check returned from unpost mutation');
  }

  return response.data.unpostCheck;
}
