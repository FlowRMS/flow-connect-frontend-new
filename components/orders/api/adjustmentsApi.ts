/**
 * Adjustments API Module
 * GraphQL queries and mutations for order adjustments
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// ============================================================================
// Enums
// ============================================================================

export type AllocationMethod = 'REP_SPLIT' | 'CUSTOMER' | 'CHECK';
export type AdjustmentCreationType = 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';
export type AdjustmentStatus = 'PENDING' | 'POSTED' | 'VOID';

// ============================================================================
// Types
// ============================================================================

export interface AdjustmentUser {
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

export interface AdjustmentSplitRate {
  id: string;
  adjustmentId?: string;
  userId?: string;
  user?: AdjustmentUser;
  splitRate?: string;
  position?: number;
}

export interface AdjustmentFactory {
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

export interface AdjustmentCustomer {
  id: string;
  companyName?: string;
  isParent?: boolean;
  parentId?: string;
  published?: boolean;
}

export interface Adjustment {
  id: string;
  adjustmentNumber?: string;
  amount?: string;
  createdAt?: string;
  createdBy?: AdjustmentUser;
  createdById?: string;
  creationType?: AdjustmentCreationType;
  customer?: AdjustmentCustomer;
  entityDate?: string;
  factory?: AdjustmentFactory;
  factoryId?: string;
  locked?: boolean;
  reason?: string;
  splitRates?: AdjustmentSplitRate[];
  status?: AdjustmentStatus;
}

export interface AdjustmentSearchResult {
  id: string;
  adjustmentNumber?: string;
  amount?: string;
  createdAt?: string;
  createdById?: string;
  creationType?: AdjustmentCreationType;
  entityDate?: string;
  factoryId?: string;
  locked?: boolean;
  reason?: string;
  status?: AdjustmentStatus;
}

// Landing Page type for findLandingPages query
export interface AdjustmentLandingPage {
  id: string;
  adjustmentNumber?: string;
  amount?: string;
  createdAt?: string;
  createdBy?: string;
  entityDate?: string;
  locked?: boolean;
  reason?: string;
  status?: AdjustmentStatus;
  userIds?: string[];
}

export interface FindAdjustmentsLandingPagesResponse {
  total: number;
  records: AdjustmentLandingPage[];
}

// Input Types
export interface AdjustmentSplitRateInput {
  id?: string;
  userId: string;
  splitRate: string;
  position?: number;
}

export interface CreateAdjustmentInput {
  id?: string;
  adjustmentNumber?: string;
  entityDate: string;
  factoryId?: string;
  customerId?: string;
  amount: string;
  allocationMethod: AllocationMethod;
  creationType?: AdjustmentCreationType;
  reason?: string;
  splitRates?: AdjustmentSplitRateInput[];
}

export interface UpdateAdjustmentInput extends CreateAdjustmentInput {
  id: string;
}

// ============================================================================
// GraphQL Field Selections (inline to avoid fragment type issues)
// ============================================================================

const ADJUSTMENT_FIELDS = `
  id
  adjustmentNumber
  amount
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
  customer {
    id
    companyName
    isParent
    parentId
    published
  }
  entityDate
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
  factoryId
  locked
  reason
  splitRates {
    id
    adjustmentId
    userId
    user {
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
    splitRate
    position
  }
  status
`;

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_ADJUSTMENT = `
  query GetAdjustment($id: UUID!) {
    adjustment(id: $id) {
      ${ADJUSTMENT_FIELDS}
    }
  }
`;

const SEARCH_ADJUSTMENTS = `
  query SearchAdjustments($searchTerm: String!, $limit: Int, $openOnly: Boolean, $unlockedOnly: Boolean) {
    adjustmentSearch(searchTerm: $searchTerm, limit: $limit, openOnly: $openOnly, unlockedOnly: $unlockedOnly) {
      id
      adjustmentNumber
      amount
      createdAt
      createdById
      creationType
      entityDate
      factoryId
      locked
      reason
      status
    }
  }
`;

const FIND_ADJUSTMENTS_LANDING_PAGE = `
  query FindAdjustmentsLandingPage($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: ADJUSTMENTS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      total
      records {
        ... on AdjustmentLandingPage {
          id
          adjustmentNumber
          amount
          createdAt
          createdBy
          entityDate
          locked
          reason
          status
          userIds
        }
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_ADJUSTMENT = `
  mutation CreateAdjustment($input: AdjustmentInput!) {
    createAdjustment(input: $input) {
      ${ADJUSTMENT_FIELDS}
    }
  }
`;

const UPDATE_ADJUSTMENT = `
  mutation UpdateAdjustment($input: AdjustmentInput!) {
    updateAdjustment(input: $input) {
      ${ADJUSTMENT_FIELDS}
    }
  }
`;

const DELETE_ADJUSTMENT = `
  mutation DeleteAdjustment($id: UUID!) {
    deleteAdjustment(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch a single adjustment by ID
 */
export async function fetchAdjustmentById(id: string): Promise<Adjustment | null> {
  const response = await crmGraphQLRequest<{ adjustment: Adjustment }>({
    query: GET_ADJUSTMENT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch adjustment');
  }

  return response.data?.adjustment || null;
}

/**
 * Options for adjustment search
 */
export interface AdjustmentSearchOptions {
  openOnly?: boolean;
  unlockedOnly?: boolean;
}

/**
 * Search adjustments by term
 */
export async function searchAdjustments(
  searchTerm: string = '',
  limit: number = 50,
  options?: AdjustmentSearchOptions
): Promise<AdjustmentSearchResult[]> {
  const response = await crmGraphQLRequest<{ adjustmentSearch: AdjustmentSearchResult[] }>({
    query: SEARCH_ADJUSTMENTS,
    variables: {
      searchTerm,
      limit,
      openOnly: options?.openOnly,
      unlockedOnly: options?.unlockedOnly,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search adjustments');
  }

  return response.data?.adjustmentSearch || [];
}

/**
 * Paginated result type for adjustments
 */
export interface PaginatedAdjustmentsResult {
  total: number;
  records: AdjustmentLandingPage[];
}

/**
 * Fetch adjustments with pagination using findLandingPages
 */
export async function fetchAdjustmentsWithPagination(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  options?: { limit?: number; offset?: number }
): Promise<PaginatedAdjustmentsResult> {
  const { limit = 50, offset = 0 } = options || {};

  try {
    const response = await crmGraphQLRequest<{ findLandingPages: FindAdjustmentsLandingPagesResponse }>({
      query: FIND_ADJUSTMENTS_LANDING_PAGE,
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
    console.warn('Error fetching adjustments:', error);
    return { total: 0, records: [] };
  }
}

/**
 * Fetch all adjustments using findLandingPages (general fetch, not order-specific)
 * @deprecated Use fetchAdjustmentsWithPagination for paginated results
 */
export async function fetchAdjustmentsLandingPage(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  limit: number = 100,
  offset: number = 0
): Promise<AdjustmentLandingPage[]> {
  const result = await fetchAdjustmentsWithPagination(filters, { limit, offset });
  return result.records;
}

/**
 * Create a new adjustment
 * Note: adjustmentNumber is required and must be provided by the user
 */
export async function createAdjustment(input: CreateAdjustmentInput): Promise<Adjustment> {
  if (!input.adjustmentNumber) {
    throw new Error('Adjustment number is required');
  }

  const response = await crmGraphQLRequest<{ createAdjustment: Adjustment }>({
    query: CREATE_ADJUSTMENT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create adjustment');
  }

  if (!response.data?.createAdjustment) {
    throw new Error('No adjustment returned from create mutation');
  }

  return response.data.createAdjustment;
}

/**
 * Update an existing adjustment
 */
export async function updateAdjustment(input: UpdateAdjustmentInput): Promise<Adjustment> {
  const response = await crmGraphQLRequest<{ updateAdjustment: Adjustment }>({
    query: UPDATE_ADJUSTMENT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update adjustment');
  }

  if (!response.data?.updateAdjustment) {
    throw new Error('No adjustment returned from update mutation');
  }

  return response.data.updateAdjustment;
}

/**
 * Delete an adjustment
 */
export async function deleteAdjustment(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteAdjustment: string }>({
    query: DELETE_ADJUSTMENT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete adjustment');
  }

  return true;
}

// ============================================================================
// React Query Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

const DEFAULT_PAGE_SIZE = 50;

/**
 * Hook to fetch a single adjustment
 */
export function useAdjustment(adjustmentId: string | null) {
  return useQuery({
    queryKey: ['adjustment', adjustmentId],
    queryFn: () => (adjustmentId ? fetchAdjustmentById(adjustmentId) : null),
    enabled: !!adjustmentId,
  });
}

/**
 * Hook to fetch adjustments (landing page)
 */
export function useAdjustmentsLandingPage(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  limit?: number
) {
  return useQuery({
    queryKey: ['adjustmentsLandingPage', filters, limit],
    queryFn: () => fetchAdjustmentsLandingPage(filters, limit),
  });
}

/**
 * Hook to fetch adjustments with infinite scroll pagination
 */
export function useAdjustmentsInfinite(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedAdjustmentsResult, Error>({
    queryKey: ['adjustmentsLandingPage', filters, 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchAdjustmentsWithPagination(filters, {
        limit: pageSize,
        offset: pageParam as number,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (totalFetched >= lastPage.total) return undefined;
      return totalFetched;
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to search adjustments
 */
export function useAdjustmentSearch(
  searchTerm: string,
  limit: number = 50,
  options?: AdjustmentSearchOptions
) {
  return useQuery({
    queryKey: ['adjustmentSearch', searchTerm, limit, options],
    queryFn: () => searchAdjustments(searchTerm, limit, options),
  });
}

/**
 * Hook to search adjustments for checks page (openOnly and unlockedOnly = true)
 */
export function useAdjustmentSearchForChecks(searchTerm: string, limit: number = 50) {
  return useAdjustmentSearch(searchTerm, limit, { openOnly: true, unlockedOnly: true });
}

/**
 * Hook to create an adjustment
 */
export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAdjustmentInput) => createAdjustment(input),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adjustmentsLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentSearch'] });
    },
  });
}

/**
 * Hook to update an adjustment
 */
export function useUpdateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAdjustmentInput) => updateAdjustment(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adjustment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentsLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentSearch'] });
    },
  });
}

/**
 * Hook to delete an adjustment
 */
export function useDeleteAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdjustment(id),
    onSuccess: () => {
      // Invalidate all adjustment queries
      queryClient.invalidateQueries({ queryKey: ['adjustmentsLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentSearch'] });
    },
  });
}
