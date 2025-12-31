/**
 * Credits API Module
 * GraphQL queries and mutations for order credits
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// ============================================================================
// Enums
// ============================================================================

export type CreditType = 'RETURN' | 'CANCELLED' | 'PRICE_ADJUSTMENT' | 'DEFECTIVE' | 'OTHER';
export type CreditCreationType = 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';
export type CreditStatus = 'PENDING' | 'POSTED' | 'VOID';

// ============================================================================
// Types
// ============================================================================

export interface CreditBalance {
  id: string;
  commission?: number;
  quantity?: number;
  subtotal?: number;
  total?: number;
}

export interface CreditUser {
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

export interface CreditOutsideSplitRate {
  id: string;
  creditDetailId?: string;
  position?: number;
  splitRate?: string;
  userId?: string;
  user?: CreditUser;
}

export interface CreditDetail {
  id: string;
  creditId?: string;
  commission?: number;
  commissionRate?: string;
  itemNumber?: number;
  orderDetailId?: string;
  quantity?: string;
  status?: string;
  subtotal?: number;
  total?: number;
  unitPrice?: string;
  outsideSplitRates?: CreditOutsideSplitRate[];
}

export interface CreditOrder {
  id: string;
  billToCustomerId?: string;
  url?: string;
  status?: string;
  soldToCustomerId?: string;
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

export interface Credit {
  id: string;
  balance?: CreditBalance;
  balanceId?: string;
  createdAt?: string;
  createdBy?: CreditUser;
  createdById?: string;
  creationType?: CreditCreationType;
  creditNumber?: string;
  creditType?: CreditType;
  details?: CreditDetail[];
  entityDate?: string;
  locked?: boolean;
  order?: CreditOrder;
  orderId?: string;
  reason?: string;
  status?: CreditStatus;
  url?: string;
}

export interface CreditSearchResult {
  id: string;
  balanceId?: string;
  createdAt?: string;
  createdById?: string;
  creationType?: CreditCreationType;
  creditNumber?: string;
  creditType?: CreditType;
  entityDate?: string;
  locked?: boolean;
  orderId?: string;
  reason?: string;
  status?: CreditStatus;
  url?: string;
}

// Landing Page type for findLandingPages query
export interface CreditLandingPage {
  id: string;
  createdAt?: string;
  createdBy?: string;
  creditNumber?: string;
  creditType?: CreditType;
  entityDate?: string;
  locked?: boolean;
  orderId?: string;
  orderNumber?: string;
  reason?: string;
  status?: CreditStatus;
  total?: number;
  userIds?: string[];
}

export interface FindLandingPagesResponse {
  total: number;
  records: CreditLandingPage[];
}

// Input Types
export interface CreditOutsideSplitRateInput {
  id?: string;
  userId: string;
  splitRate: string;
  position?: number;
}

export interface CreditDetailInput {
  id?: string;
  itemNumber?: number;
  quantity: string;
  unitPrice: string;
  commissionRate?: string;
  orderDetailId?: string;
  outsideSplitRates?: CreditOutsideSplitRateInput[];
}

export interface CreateCreditInput {
  id?: string;
  creditNumber?: string;
  entityDate: string;
  orderId: string;
  creditType: CreditType;
  creationType?: CreditCreationType;
  reason?: string;
  details?: CreditDetailInput[];
}

export interface UpdateCreditInput extends CreateCreditInput {
  id: string;
}

// ============================================================================
// GraphQL Field Selections (inline to avoid fragment type issues)
// ============================================================================

const CREDIT_FIELDS = `
  id
  balance {
    id
    commission
    quantity
    subtotal
    total
  }
  balanceId
  createdAt
  createdBy {
    id
    authProviderId
    email
    enabled
    firstName
    fullName
    lastName
    inside
    outside
    role
    username
  }
  createdById
  creationType
  creditNumber
  creditType
  details {
    id
    creditId
    commission
    commissionRate
    itemNumber
    orderDetailId
    quantity
    status
    subtotal
    total
    unitPrice
    outsideSplitRates {
      id
      creditDetailId
      position
      splitRate
      userId
      user {
        id
        email
        firstName
        fullName
        lastName
      }
    }
  }
  entityDate
  locked
  order {
    id
    orderNumber
    status
  }
  orderId
  reason
  status
  url
`;

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_CREDIT = `
  query GetCredit($id: UUID!) {
    credit(id: $id) {
      ${CREDIT_FIELDS}
    }
  }
`;

const SEARCH_CREDITS = `
  query SearchCredits($searchTerm: String, $limit: Int) {
    creditSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      balanceId
      createdAt
      createdById
      creationType
      creditNumber
      creditType
      entityDate
      locked
      orderId
      reason
      status
      url
    }
  }
`;

const FIND_CREDITS_LANDING_PAGE = `
  query FindCreditsLandingPage($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: CREDITS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      total
      records {
        ... on CreditLandingPage {
          id
          createdAt
          createdBy
          creditNumber
          creditType
          entityDate
          locked
          orderId
          orderNumber
          reason
          status
          total
          userIds
        }
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_CREDIT = `
  mutation CreateCredit($input: CreditInput!) {
    createCredit(input: $input) {
      ${CREDIT_FIELDS}
    }
  }
`;

const UPDATE_CREDIT = `
  mutation UpdateCredit($input: CreditInput!) {
    updateCredit(input: $input) {
      ${CREDIT_FIELDS}
    }
  }
`;

const DELETE_CREDIT = `
  mutation DeleteCredit($id: UUID!) {
    deleteCredit(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch a single credit by ID
 */
export async function fetchCreditById(id: string): Promise<Credit | null> {
  const response = await crmGraphQLRequest<{ credit: Credit }>({
    query: GET_CREDIT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch credit');
  }

  return response.data?.credit || null;
}

/**
 * Search credits by term
 */
export async function searchCredits(
  searchTerm: string = '',
  limit: number = 50
): Promise<CreditSearchResult[]> {
  const response = await crmGraphQLRequest<{ creditSearch: CreditSearchResult[] }>({
    query: SEARCH_CREDITS,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search credits');
  }

  return response.data?.creditSearch || [];
}

/**
 * Fetch all credits for a specific order using findLandingPages
 */
export async function fetchCreditsByOrder(orderId: string): Promise<CreditLandingPage[]> {
  try {
    const response = await crmGraphQLRequest<{ findLandingPages: FindLandingPagesResponse }>({
      query: FIND_CREDITS_LANDING_PAGE,
      variables: {
        filters: [
          {
            columnName: 'orderId',
            operator: 'EQ',
            value: orderId,
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
    console.warn('Error fetching credits by order:', error);
    return [];
  }
}

/**
 * Generate a credit number if not provided
 */
function generateCreditNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CR-${timestamp}-${random}`;
}

/**
 * Create a new credit
 */
export async function createCredit(input: CreateCreditInput): Promise<Credit> {
  // Ensure creditNumber is provided (required by schema)
  const creditInput = {
    ...input,
    creditNumber: input.creditNumber || generateCreditNumber(),
  };

  const response = await crmGraphQLRequest<{ createCredit: Credit }>({
    query: CREATE_CREDIT,
    variables: { input: creditInput },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create credit');
  }

  if (!response.data?.createCredit) {
    throw new Error('No credit returned from create mutation');
  }

  return response.data.createCredit;
}

/**
 * Update an existing credit
 */
export async function updateCredit(input: UpdateCreditInput): Promise<Credit> {
  const response = await crmGraphQLRequest<{ updateCredit: Credit }>({
    query: UPDATE_CREDIT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update credit');
  }

  if (!response.data?.updateCredit) {
    throw new Error('No credit returned from update mutation');
  }

  return response.data.updateCredit;
}

/**
 * Delete a credit
 */
export async function deleteCredit(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteCredit: string }>({
    query: DELETE_CREDIT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete credit');
  }

  return true;
}

// ============================================================================
// React Query Hooks (Optional - for component use)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch a single credit
 */
export function useCredit(creditId: string | null) {
  return useQuery({
    queryKey: ['credit', creditId],
    queryFn: () => (creditId ? fetchCreditById(creditId) : null),
    enabled: !!creditId,
  });
}

/**
 * Hook to fetch credits for an order
 */
export function useOrderCredits(orderId: string | null) {
  return useQuery({
    queryKey: ['orderCredits', orderId],
    queryFn: () => (orderId ? fetchCreditsByOrder(orderId) : []),
    enabled: !!orderId,
  });
}

/**
 * Hook to search credits
 */
export function useCreditSearch(searchTerm: string, limit: number = 50) {
  return useQuery({
    queryKey: ['creditSearch', searchTerm, limit],
    queryFn: () => searchCredits(searchTerm, limit),
  });
}

/**
 * Hook to create a credit
 */
export function useCreateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCreditInput) => createCredit(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['orderCredits', data.orderId] });
      queryClient.invalidateQueries({ queryKey: ['creditSearch'] });
    },
  });
}

/**
 * Hook to update a credit
 */
export function useUpdateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCreditInput) => updateCredit(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['credit', data.id] });
      queryClient.invalidateQueries({ queryKey: ['orderCredits', data.orderId] });
      queryClient.invalidateQueries({ queryKey: ['creditSearch'] });
    },
  });
}

/**
 * Hook to delete a credit
 */
export function useDeleteCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCredit(id),
    onSuccess: () => {
      // Invalidate all credit queries
      queryClient.invalidateQueries({ queryKey: ['orderCredits'] });
      queryClient.invalidateQueries({ queryKey: ['creditSearch'] });
    },
  });
}
