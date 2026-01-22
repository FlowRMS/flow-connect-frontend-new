/**
 * Customers API Module
 * Clean implementation of Customers GraphQL API endpoints
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// ============================================================================
// Types
// ============================================================================

export type RepType = 'INSIDE' | 'OUTSIDE';

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

export interface SplitRate {
  id: string;
  customerId?: string;
  userId: string;
  repType: RepType;
  splitRate: string;
  position: number;
  user?: User;
}

export interface SplitRateInput {
  id?: string;
  userId: string;
  repType: RepType;
  splitRate: string;
  position: number;
}

// Input type for split rates in customer mutation (without repType)
export interface CustomerSplitRateInput {
  id?: string;
  userId: string;
  splitRate: string;
  position: number;
}

export interface TerritoryLite {
  id: string;
  name: string;
  code: string;
  territoryType: 'REGION' | 'SUBREGION' | 'TERRITORY';
}

export interface Customer {
  id: string;
  companyName: string;
  isParent: boolean;
  parentId?: string;
  buyingGroupId?: string;
  published: boolean;
  createdBy?: User;
  insideReps?: SplitRate[];
  outsideReps?: SplitRate[];
  createdAt?: string;
  territoryId?: string;
  territory?: TerritoryLite;
}

export interface CustomerLandingPage {
  id: string;
  companyName: string;
  createdAt?: string;
  createdBy?: string;
  insideReps?: string;
  outsideReps?: string;
  isParent: boolean;
  published: boolean;
  buyingGroup?: string;
  parent?: string;
}

export interface CreateCustomerInput {
  companyName: string;
  isParent: boolean;
  parentId?: string;
  buyingGroupId?: string;
  published: boolean;
  insideSplitRates?: CustomerSplitRateInput[];
  outsideSplitRates?: CustomerSplitRateInput[];
  territoryId?: string;
}

export interface UpdateCustomerInput {
  companyName?: string;
  isParent?: boolean;
  parentId?: string;
  buyingGroupId?: string;
  published?: boolean;
  insideSplitRates?: CustomerSplitRateInput[];
  outsideSplitRates?: CustomerSplitRateInput[];
  territoryId?: string;
}

// User Search Types
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

export interface UserSearchParams {
  searchTerm: string;
  isInside?: boolean;
  isOutside?: boolean;
  enabled?: boolean;
  limit?: number;
}

export interface CustomerLandingPageFilter {
  operator: string;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface CustomerLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedCustomersResult {
  records: CustomerLandingPage[];
  total: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_CUSTOMERS_LANDING_PAGES = `
  query FindCustomersLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
      sourceType: CUSTOMERS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      records {
        ... on CustomerLandingPage {
          id
          companyName
          createdAt
          createdBy
          insideReps
          outsideReps
          isParent
          published
          buyingGroup
          parent
        }
      }
      total
    }
  }
`;

const FIND_CUSTOMER_BY_ID = `
  query FindCustomerById($id: UUID!) {
    customer(id: $id) {
      companyName
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
      id
      insideReps {
        customerId
        id
        position
        repType
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
      isParent
      outsideReps {
        customerId
        id
        position
        repType
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
      parentId
      buyingGroupId
      published
    }
  }
`;

const CREATE_CUSTOMER = `
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      companyName
      createdBy {
        email
        authProviderId
        firstName
        enabled
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
      id
      insideReps {
        customerId
        id
        position
        repType
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
      isParent
      outsideReps {
        customerId
        id
        position
        repType
        splitRate
        user {
          authProviderId
          email
          enabled
          firstName
          fullName
          inside
          id
          lastName
          outside
          role
          username
        }
      }
      parentId
      buyingGroupId
      published
    }
  }
`;

const UPDATE_CUSTOMER = `
  mutation UpdateCustomer($id: UUID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      companyName
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
      id
      insideReps {
        customerId
        id
        position
        repType
        splitRate
        user {
          authProviderId
          enabled
          email
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
      isParent
      outsideReps {
        customerId
        id
        position
        repType
        splitRate
        user {
          authProviderId
          email
          enabled
          firstName
          id
          inside
          fullName
          lastName
          outside
          role
          username
        }
      }
      parentId
      buyingGroupId
      published
    }
  }
`;

const DELETE_CUSTOMER = `
  mutation DeleteCustomer($id: UUID!) {
    deleteCustomer(id: $id)
  }
`;

const USER_SEARCH = `
  query UserSearch(
    $searchTerm: String!
    $isInside: Boolean
    $isOutside: Boolean
    $enabled: Boolean
    $limit: Int
  ) {
    userSearch(
      searchTerm: $searchTerm
      isInside: $isInside
      isOutside: $isOutside
      enabled: $enabled
      limit: $limit
    ) {
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
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch customers using findLandingPages endpoint with pagination
 */
export async function fetchCustomersWithPagination(
  filters?: CustomerLandingPageFilter[],
  orderBy?: CustomerLandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedCustomersResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: CustomerLandingPage[]; total: number };
  }>({
    query: FIND_CUSTOMERS_LANDING_PAGES,
    variables: {
      filters,
      orderBy,
      limit: pagination?.limit,
      offset: pagination?.offset
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch customers');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch all customers (no pagination)
 */
export async function fetchCustomers(): Promise<CustomerLandingPage[]> {
  const result = await fetchCustomersWithPagination();
  return result.records;
}

/**
 * Fetch a single customer by ID
 */
export async function fetchCustomerById(id: string): Promise<Customer | null> {
  const response = await crmGraphQLRequest<{ customer: Customer }>({
    query: FIND_CUSTOMER_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch customer');
  }

  return response.data?.customer || null;
}

/**
 * Create a new customer
 */
export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const response = await crmGraphQLRequest<{ createCustomer: Customer }>({
    query: CREATE_CUSTOMER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create customer');
  }

  if (!response.data?.createCustomer) {
    throw new Error('No customer returned from create mutation');
  }

  return response.data.createCustomer;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput
): Promise<Customer> {
  const response = await crmGraphQLRequest<{ updateCustomer: Customer }>({
    query: UPDATE_CUSTOMER,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update customer');
  }

  if (!response.data?.updateCustomer) {
    throw new Error('No customer returned from update mutation');
  }

  return response.data.updateCustomer;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteCustomer: string }>({
    query: DELETE_CUSTOMER,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete customer');
  }

  return true;
}

/**
 * Fetch all customer IDs matching the given filters
 * Used for bulk operations when "select all" is enabled
 */
export async function fetchAllCustomerIds(
  filters?: CustomerLandingPageFilter[],
  orderBy?: CustomerLandingPageOrderBy[]
): Promise<string[]> {
  // First get total count
  const initialResult = await fetchCustomersWithPagination(filters, orderBy, { limit: 1, offset: 0 });
  const total = initialResult.total;

  if (total === 0) return [];

  // Fetch all records in batches
  const batchSize = 500;
  const allIds: string[] = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await fetchCustomersWithPagination(filters, orderBy, { limit: batchSize, offset });
    allIds.push(...result.records.map(r => r.id));
  }

  return allIds;
}

/**
 * Search users for rep selection
 * Returns users filtered by inside/outside rep type
 * Empty searchTerm returns initial results
 */
export async function searchUsers(params: UserSearchParams): Promise<UserSearchResult[]> {
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

// ============================================================================
// Customer Hierarchy Types & Queries
// ============================================================================

/**
 * Lite response type for customer hierarchy relationships
 */
export interface CustomerLiteResponse {
  id: string;
  companyName: string;
  published: boolean;
  isParent: boolean;
  parentId?: string;
  buyingGroupId?: string;
}

const CUSTOMER_CHILDREN = `
  query CustomerChildren($parentId: UUID!) {
    customerChildren(parentId: $parentId) {
      id
      companyName
      published
      isParent
      parentId
      buyingGroupId
    }
  }
`;

const CUSTOMER_BUYING_GROUP_MEMBERS = `
  query CustomerBuyingGroupMembers($buyingGroupId: UUID!) {
    customerBuyingGroupMembers(buyingGroupId: $buyingGroupId) {
      id
      companyName
      published
      isParent
      parentId
      buyingGroupId
    }
  }
`;

/**
 * Fetch child customers of a parent customer
 */
export async function fetchCustomerChildren(parentId: string): Promise<CustomerLiteResponse[]> {
  const response = await crmGraphQLRequest<{ customerChildren: CustomerLiteResponse[] }>({
    query: CUSTOMER_CHILDREN,
    variables: { parentId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch customer children');
  }

  return response.data?.customerChildren || [];
}

/**
 * Fetch buying group members (parent customers that belong to a buying group)
 */
export async function fetchCustomerBuyingGroupMembers(buyingGroupId: string): Promise<CustomerLiteResponse[]> {
  const response = await crmGraphQLRequest<{ customerBuyingGroupMembers: CustomerLiteResponse[] }>({
    query: CUSTOMER_BUYING_GROUP_MEMBERS,
    variables: { buyingGroupId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch buying group members');
  }

  return response.data?.customerBuyingGroupMembers || [];
}
