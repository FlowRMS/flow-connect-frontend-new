/**
 * Factories API Module
 * Clean implementation of Factories GraphQL API endpoints
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// ============================================================================
// Types
// ============================================================================

export interface User {
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

export interface FactorySplitRate {
  id: string;
  factoryId?: string;
  splitRate: string;
  position: number;
  user?: User;
}

export interface FactorySplitRateInput {
  id?: string;
  userId: string;
  splitRate: string;
  position: number;
}

export interface FactoryParent {
  id: string;
  title: string;
}

export interface Factory {
  id: string;
  title: string;
  accountNumber?: string;
  additionalInformation?: string;
  baseCommissionRate?: string;
  commissionDiscountRate?: string;
  email?: string;
  externalPaymentTerms?: string;
  freightDiscountType?: string;
  freightTerms?: string;
  leadTime?: number;
  logoId?: string;
  overallDiscountRate?: string;
  paymentTerms?: number;
  phone?: string;
  published: boolean;
  splitRates?: FactorySplitRate[];
  createdBy?: User;
  createdAt?: string;
  isParent: boolean;
  parentId?: string;
  parent?: FactoryParent;
}

export interface FactoryLandingPage {
  id: string;
  title: string;
  accountNumber?: string;
  email?: string;
  phone?: string;
  published: boolean;
  leadTime?: number;
  paymentTerms?: number;
  overallDiscountRate?: string;
  baseCommissionRate?: string;
  commissionDiscountRate?: string;
  freightDiscountType?: string;
  splitRates?: string;
  createdBy?: string;
  createdAt?: string;
  isParent: boolean;
  parent?: string;
}

export interface FactoryLiteResponse {
  id: string;
  title: string;
  published: boolean;
  isParent: boolean;
  parentId?: string;
}

export interface CreateFactoryInput {
  title: string;
  accountNumber?: string;
  additionalInformation?: string;
  baseCommissionRate?: string;
  commissionDiscountRate?: string;
  email?: string;
  externalPaymentTerms?: string;
  freightTerms?: string;
  leadTime?: number;
  logoId?: string;
  overallDiscountRate?: string;
  paymentTerms?: number;
  phone?: string;
  published: boolean;
  splitRates?: FactorySplitRateInput[];
  isParent?: boolean;
  parentId?: string;
}

export interface UpdateFactoryInput {
  title?: string;
  accountNumber?: string;
  additionalInformation?: string;
  baseCommissionRate?: string;
  commissionDiscountRate?: string;
  email?: string;
  externalPaymentTerms?: string;
  freightTerms?: string;
  leadTime?: number;
  logoId?: string;
  overallDiscountRate?: string;
  paymentTerms?: number;
  phone?: string;
  published?: boolean;
  splitRates?: FactorySplitRateInput[];
  isParent?: boolean;
  parentId?: string;
}

export interface FactoryLandingPageFilter {
  operator: string;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface FactoryLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedFactoriesResult {
  records: FactoryLandingPage[];
  total: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_FACTORIES_LANDING_PAGES = `
  query FindFactoriesLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
      sourceType: FACTORIES
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      records {
        ... on FactoryLandingPage {
          id
          email
          title
          splitRates
          published
          phone
          paymentTerms
          overallDiscountRate
          leadTime
          freightDiscountType
          createdBy
          createdAt
          commissionDiscountRate
          baseCommissionRate
          accountNumber
          isParent
          parent
        }
      }
      total
    }
  }
`;

const FIND_FACTORY_BY_ID = `
  query FindFactoryById($id: UUID!) {
    factory(id: $id) {
      accountNumber
      additionalInformation
      baseCommissionRate
      commissionDiscountRate
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        role
        outside
        username
      }
      email
      externalPaymentTerms
      freightDiscountType
      freightTerms
      id
      leadTime
      logoId
      overallDiscountRate
      paymentTerms
      phone
      published
      splitRates {
        factoryId
        id
        position
        splitRate
        user {
          authProviderId
          email
          enabled
          firstName
          fullName
          role
          id
          inside
          lastName
          outside
          username
        }
      }
      title
      isParent
      parentId
      parent {
        id
        title
      }
    }
  }
`;

const CREATE_FACTORY = `
  mutation CreateFactory($input: FactoryInput!) {
    createFactory(input: $input) {
      accountNumber
      additionalInformation
      baseCommissionRate
      commissionDiscountRate
      createdBy {
        authProviderId
        email
        enabled
        firstName
        id
        inside
        fullName
        lastName
        role
        outside
        username
      }
      email
      externalPaymentTerms
      freightDiscountType
      freightTerms
      id
      leadTime
      logoId
      overallDiscountRate
      paymentTerms
      phone
      published
      splitRates {
        factoryId
        id
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
      }
      title
      isParent
      parentId
    }
  }
`;

const UPDATE_FACTORY = `
  mutation UpdateFactory($id: UUID!, $input: FactoryInput!) {
    updateFactory(id: $id, input: $input) {
      accountNumber
      additionalInformation
      baseCommissionRate
      commissionDiscountRate
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
      email
      externalPaymentTerms
      freightDiscountType
      freightTerms
      id
      leadTime
      logoId
      overallDiscountRate
      paymentTerms
      phone
      published
      splitRates {
        factoryId
        id
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
      }
      title
      isParent
      parentId
    }
  }
`;

const DELETE_FACTORY = `
  mutation DeleteFactory($id: UUID!) {
    deleteFactory(id: $id)
  }
`;

const FACTORY_CHILDREN = `
  query FactoryChildren($parentId: UUID!) {
    factoryChildren(parentId: $parentId) {
      id
      title
      published
      isParent
      parentId
    }
  }
`;

const ASSIGN_CHILD_FACTORIES = `
  mutation AssignChildFactories($parentId: UUID!, $childIds: [UUID!]!) {
    assignChildFactories(parentId: $parentId, childIds: $childIds) {
      id
      title
      published
      isParent
      parentId
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch factories using findLandingPages endpoint with pagination
 */
export async function fetchFactoriesWithPagination(
  filters?: FactoryLandingPageFilter[],
  orderBy?: FactoryLandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedFactoriesResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: FactoryLandingPage[]; total: number };
  }>({
    query: FIND_FACTORIES_LANDING_PAGES,
    variables: {
      filters,
      orderBy,
      limit: pagination?.limit,
      offset: pagination?.offset
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch factories');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch all factories (no pagination)
 */
export async function fetchFactories(): Promise<FactoryLandingPage[]> {
  const result = await fetchFactoriesWithPagination();
  return result.records;
}

/**
 * Fetch a single factory by ID
 */
export async function fetchFactoryById(id: string): Promise<Factory | null> {
  const response = await crmGraphQLRequest<{ factory: Factory }>({
    query: FIND_FACTORY_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch factory');
  }

  return response.data?.factory || null;
}

/**
 * Create a new factory
 */
export async function createFactory(input: CreateFactoryInput): Promise<Factory> {
  const response = await crmGraphQLRequest<{ createFactory: Factory }>({
    query: CREATE_FACTORY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create factory');
  }

  if (!response.data?.createFactory) {
    throw new Error('No factory returned from create mutation');
  }

  return response.data.createFactory;
}

/**
 * Update an existing factory
 */
export async function updateFactory(
  id: string,
  input: UpdateFactoryInput
): Promise<Factory> {
  const response = await crmGraphQLRequest<{ updateFactory: Factory }>({
    query: UPDATE_FACTORY,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update factory');
  }

  if (!response.data?.updateFactory) {
    throw new Error('No factory returned from update mutation');
  }

  return response.data.updateFactory;
}

/**
 * Delete a factory
 */
export async function deleteFactory(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteFactory: string }>({
    query: DELETE_FACTORY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete factory');
  }

  return true;
}

/**
 * Fetch all factory IDs for bulk operations
 * Handles pagination internally to get all IDs
 */
export async function fetchAllFactoryIds(
  filters?: FactoryLandingPageFilter[],
  orderBy?: FactoryLandingPageOrderBy[]
): Promise<string[]> {
  // First, get total count
  const initialResult = await fetchFactoriesWithPagination(filters, orderBy, { limit: 1, offset: 0 });
  const total = initialResult.total;

  if (total === 0) return [];

  // Fetch all IDs in batches
  const batchSize = 500;
  const allIds: string[] = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await fetchFactoriesWithPagination(filters, orderBy, { limit: batchSize, offset });
    allIds.push(...result.records.map(r => r.id));
  }

  return allIds;
}

/**
 * Fetch all child factories for a given parent factory
 */
export async function fetchFactoryChildren(parentId: string): Promise<FactoryLiteResponse[]> {
  const response = await crmGraphQLRequest<{ factoryChildren: FactoryLiteResponse[] }>({
    query: FACTORY_CHILDREN,
    variables: { parentId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch factory children');
  }

  return response.data?.factoryChildren || [];
}

/**
 * Assign child factories to a parent factory
 */
export async function assignChildFactories(
  parentId: string,
  childIds: string[]
): Promise<FactoryLiteResponse[]> {
  const response = await crmGraphQLRequest<{ assignChildFactories: FactoryLiteResponse[] }>({
    query: ASSIGN_CHILD_FACTORIES,
    variables: { parentId, childIds },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to assign child factories');
  }

  return response.data?.assignChildFactories || [];
}
