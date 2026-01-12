/**
 * Central Search API Module
 * Single source of truth for all search GraphQL queries
 * All search functions should be imported from this file
 */

import { crmGraphQLRequest } from '../crm-graphql';

// ============================================================================
// Helper Functions
// ============================================================================

type CreatedByResponse =
  | string
  | null
  | undefined
  | {
      email?: string | null;
      firstName?: string | null;
      fullName?: string | null;
      id?: string | null;
      lastName?: string | null;
    };

const formatCreatedBy = (value: CreatedByResponse): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const fullName = value.fullName || [value.firstName, value.lastName].filter(Boolean).join(' ').trim();
  return fullName || value.email || value.id || '';
};

const withFormattedCreatedBy = <T extends { createdBy?: CreatedByResponse }>(item: T): T => ({
  ...item,
  createdBy: formatCreatedBy(item.createdBy),
});

const mapFormattedCreatedBy = <T extends { createdBy?: CreatedByResponse }>(items?: T[]): T[] =>
  (items || []).map(withFormattedCreatedBy);

// ============================================================================
// Search Result Types
// ============================================================================

export interface CompanySearchResult {
  id: string;
  name: string;
  companySourceType: string;
  createdAt: string;
  createdBy: string;
  parentCompanyId: string;
  phone: string;
  tags: string;
  website: string;
}

export interface ContactSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  notes: string;
  territory: string;
  tags: string;
  createdAt: string;
}

export interface TaskSearchResultAssignee {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

export interface TaskSearchResult {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  reminderDate?: string;
  assignees?: TaskSearchResultAssignee[];
  tags?: string;
  createdAt: string;
  createdBy: string;
}

export interface JobSearchResult {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  startDate: string;
  endDate: string;
  status: { id: string; name?: string };
  requesterId: string;
  additionalInformation: string;
  structuralDetails: string;
  structuralInformation: string;
  tags: string;
  createdAt: string;
  createdBy: string;
}

export interface NoteSearchResult {
  id: string;
  title: string;
  content: string;
  mentions: string;
  tags: string;
  createdAt: string;
  createdBy: string;
}

export interface PreOpportunitySearchResult {
  id: string;
  entityNumber: string;
  entityDate: string;
  status: string;
  soldToCustomerId: string;
  expDate: string;
  createdAt: string;
  createdById: string;
}

export interface QuoteSearchResult {
  id: string;
  quoteNumber: string;
  acceptDate?: string;
  balanceId?: string;
  blanket?: boolean;
  createdAt?: string;
  billToCustomerId?: string;
  createdById?: string;
  creationType?: string;
  customerRef?: string;
  duplicatedFrom?: string;
  entityDate?: string;
  expDate?: string;
  freightTerms?: string;
  paymentTerms?: string;
  pipelineStage?: string;
  published?: boolean;
  reviseDate?: string;
  soldToCustomerId?: string;
  status?: string;
  url?: string;
  versionOf?: string;
  jobName?: string;
  entryDate?: string;
  createdBy?: string;
  userOwnerIds?: string[];
}

export interface OrderSearchResult {
  id: string;
  orderNumber: string;
  entityDate?: string;
  entryDate?: string;
  dueDate?: string;
  shipDate?: string;
  status?: string;
  headerStatus?: string;
  billToCustomerId?: string;
  soldToCustomerId?: string;
  factoryId?: string;
  quoteId?: string;
  balanceId?: string;
  factSoNumber?: string;
  published?: boolean;
  createdAt?: string;
  createdById?: string;
  jobName?: string;
  userOwnerIds?: string[];
}

export interface InvoiceSearchResult {
  id: string;
  invoiceNumber: string;
  entityDate: string;
  dueDate: string;
  status: string;
  orderId: string;
  balanceId: string;
  locked: boolean;
  published: boolean;
  creationType: string;
  createdAt: string;
  createdById: string;
}

export interface OpenInvoiceSearchResult {
  id: string;
  invoiceNumber: string;
  entityDate?: string;
  dueDate?: string;
  status?: string;
  orderId?: string;
  order?: {
    id: string;
    orderNumber: string;
    entityDate?: string;
    status?: string;
    headerStatus?: string;
    factoryId?: string;
    soldToCustomerId?: string;
  };
  balanceId?: string;
  locked?: boolean;
  published?: boolean;
  creationType?: string;
  createdAt?: string;
  createdById?: string;
  url?: string;
}

export interface CheckSearchResult {
  id: string;
  checkNumber: string;
  commissionMonth: string;
  createdAt: string;
  createdById: string;
  creationType: string;
  enteredCommissionAmount: number;
  entityDate: string;
  factoryId: string;
  postDate: string;
  status: string;
  url: string;
}

export interface FactorySearchResult {
  id: string;
  title: string;
  accountNumber?: string;
  published?: boolean;
}

export interface CustomerSearchResult {
  id: string;
  companyName: string;
  isParent?: boolean;
  parentId?: string;
  buyingGroupId?: string;
  insideRepId?: string;
  published?: boolean;
}

export interface ProductSearchResult {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  defaultDivisor?: number;
  approvalNeeded?: boolean;
  approvalComments?: string;
  approvalDate?: string;
  published?: boolean;
  commissionDiscountRate?: number;
  unitPriceDiscountRate?: number;
  leadTime?: string;
  minOrderQty?: number;
  tags?: string;
  upc?: string;
}

export interface UserSearchResult {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  authProviderId?: string;
  enabled?: boolean;
  inside?: boolean;
  outside?: boolean;
  role?: string;
  username?: string;
}

export interface ProductUomResult {
  id: string;
  title: string;
  description?: string;
  divisionFactor?: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const COMPANY_SEARCH = `
  query CompanySearch($searchTerm: String!, $limit: Int) {
    companySearch(searchTerm: $searchTerm, limit: $limit) {
      companySourceType
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      id
      name
      parentCompanyId
      phone
      tags
      website
    }
  }
`;

const CONTACT_SEARCH = `
  query ContactSearch($searchTerm: String!, $limit: Int) {
    contactSearch(searchTerm: $searchTerm, limit: $limit) {
      createdAt
      email
      firstName
      id
      lastName
      notes
      phone
      role
      tags
      territory
    }
  }
`;

const TASK_SEARCH = `
  query TaskSearch($searchTerm: String!, $limit: Int) {
    taskSearch(searchTerm: $searchTerm, limit: $limit) {
      assignees {
        id
        firstName
        lastName
        fullName
        email
      }
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      description
      dueDate
      id
      priority
      reminderDate
      status
      tags
      title
    }
  }
`;

const JOB_SEARCH = `
  query JobSearch($searchTerm: String!, $limit: Int) {
    jobSearch(searchTerm: $searchTerm, limit: $limit) {
      additionalInformation
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      description
      endDate
      jobName
      jobType
      id
      startDate
      requesterId
      status {
        id
        name
      }
      structuralDetails
      structuralInformation
      tags
    }
  }
`;

const NOTE_SEARCH = `
  query NoteSearch($searchTerm: String!, $limit: Int) {
    noteSearch(searchTerm: $searchTerm, limit: $limit) {
      content
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      id
      mentions
      tags
      title
    }
  }
`;

const PRE_OPPORTUNITY_SEARCH = `
  query PreOpportunitySearch($searchTerm: String!, $limit: Int) {
    preOpportunitySearch(searchTerm: $searchTerm, limit: $limit) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      expDate
      createdAt
      createdById
    }
  }
`;

const QUOTE_SEARCH = `
  query QuoteSearch($searchTerm: String!, $limit: Int) {
    quoteSearch(searchTerm: $searchTerm, limit: $limit) {
      acceptDate
      balanceId
      blanket
      createdAt
      billToCustomerId
      createdById
      creationType
      customerRef
      duplicatedFrom
      entityDate
      expDate
      freightTerms
      id
      paymentTerms
      pipelineStage
      published
      quoteNumber
      reviseDate
      soldToCustomerId
      status
      url
      versionOf
    }
  }
`;

const ORDER_SEARCH = `
  query OrderSearch($searchTerm: String!, $limit: Int) {
    orderSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      orderNumber
      entityDate
      dueDate
      shipDate
      status
      headerStatus
      billToCustomerId
      soldToCustomerId
      factoryId
      quoteId
      balanceId
      factSoNumber
      published
      createdAt
      createdById
    }
  }
`;

const INVOICE_SEARCH = `
  query InvoiceSearch($searchTerm: String!, $limit: Int, $openOnly: Boolean, $unlockedOnly: Boolean) {
    invoiceSearch(searchTerm: $searchTerm, limit: $limit, openOnly: $openOnly, unlockedOnly: $unlockedOnly) {
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
      createdAt
      createdById
    }
  }
`;

const SEARCH_OPEN_INVOICES = `
  query SearchOpenInvoices($factoryId: UUID!, $startFrom: Date!) {
    searchOpenInvoices(factoryId: $factoryId, startFrom: $startFrom) {
      id
      invoiceNumber
      entityDate
      dueDate
      status
      orderId
      order {
        id
        orderNumber
        entityDate
        status
        headerStatus
        factoryId
        soldToCustomerId
      }
      balanceId
      locked
      published
      creationType
      createdAt
      createdById
      url
    }
  }
`;

const CHECK_SEARCH = `
  query CheckSearch($searchTerm: String!, $limit: Int) {
    checkSearch(searchTerm: $searchTerm, limit: $limit) {
      checkNumber
      commissionMonth
      createdAt
      createdById
      creationType
      enteredCommissionAmount
      entityDate
      factoryId
      id
      postDate
      status
      url
    }
  }
`;

const FACTORY_SEARCH = `
  query FactorySearch($searchTerm: String!, $published: Boolean, $limit: Int) {
    factorySearch(searchTerm: $searchTerm, published: $published, limit: $limit) {
      id
      title
      accountNumber
      published
    }
  }
`;

const CUSTOMER_SEARCH = `
  query CustomerSearch($searchTerm: String!, $published: Boolean, $limit: Int) {
    customerSearch(searchTerm: $searchTerm, published: $published, limit: $limit) {
      id
      companyName
      isParent
      parentId
      buyingGroupId
      published
    }
  }
`;

const PRODUCT_SEARCH = `
  query ProductSearch($searchTerm: String!, $limit: Int) {
    productSearch(searchTerm: $searchTerm, limit: $limit) {
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
  }
`;

const PRODUCT_SEARCH_WITH_FACTORY = `
  query ProductSearchWithFactory($searchTerm: String!, $factoryId: String!, $limit: Int) {
    productSearch(searchTerm: $searchTerm, factoryId: $factoryId, limit: $limit) {
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
  }
`;

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

const GET_USER = `
  query GetUser($id: UUID!) {
    user(id: $id) {
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

const PRODUCT_UOMS = `
  query ProductUoms {
    productUoms {
      id
      title
      description
      divisionFactor
    }
  }
`;

// ============================================================================
// Search API Functions
// ============================================================================

/**
 * Search for companies
 */
export async function searchCompanies(searchTerm: string, limit?: number): Promise<CompanySearchResult[]> {
  const response = await crmGraphQLRequest<{ companySearch: CompanySearchResult[] }>({
    query: COMPANY_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search companies');
  }

  return mapFormattedCreatedBy(response.data?.companySearch);
}

/**
 * Search for contacts
 */
export async function searchContacts(searchTerm: string, limit?: number): Promise<ContactSearchResult[]> {
  const response = await crmGraphQLRequest<{ contactSearch: ContactSearchResult[] }>({
    query: CONTACT_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search contacts');
  }

  return response.data?.contactSearch || [];
}

/**
 * Search for tasks
 */
export async function searchTasks(searchTerm: string, limit?: number): Promise<TaskSearchResult[]> {
  const response = await crmGraphQLRequest<{ taskSearch: TaskSearchResult[] }>({
    query: TASK_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search tasks');
  }

  return mapFormattedCreatedBy(response.data?.taskSearch);
}

/**
 * Search for jobs
 */
export async function searchJobs(searchTerm: string, limit?: number): Promise<JobSearchResult[]> {
  const response = await crmGraphQLRequest<{ jobSearch: JobSearchResult[] }>({
    query: JOB_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search jobs');
  }

  return mapFormattedCreatedBy(response.data?.jobSearch);
}

/**
 * Search for notes
 */
export async function searchNotes(searchTerm: string, limit?: number): Promise<NoteSearchResult[]> {
  const response = await crmGraphQLRequest<{ noteSearch: NoteSearchResult[] }>({
    query: NOTE_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search notes');
  }

  return mapFormattedCreatedBy(response.data?.noteSearch);
}

/**
 * Search for pre-opportunities
 */
export async function searchPreOpportunities(searchTerm: string, limit?: number): Promise<PreOpportunitySearchResult[]> {
  const response = await crmGraphQLRequest<{ preOpportunitySearch: PreOpportunitySearchResult[] }>({
    query: PRE_OPPORTUNITY_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search pre-opportunities');
  }

  return response.data?.preOpportunitySearch || [];
}

/**
 * Search for quotes
 */
export async function searchQuotes(searchTerm: string, limit?: number): Promise<QuoteSearchResult[]> {
  const response = await crmGraphQLRequest<{ quoteSearch: QuoteSearchResult[] }>({
    query: QUOTE_SEARCH,
    variables: { searchTerm, limit: limit ?? 10 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search quotes');
  }

  return response.data?.quoteSearch || [];
}

/**
 * Search for orders
 */
export async function searchOrders(searchTerm: string, limit?: number): Promise<OrderSearchResult[]> {
  const response = await crmGraphQLRequest<{ orderSearch: OrderSearchResult[] }>({
    query: ORDER_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search orders');
  }

  return response.data?.orderSearch || [];
}

/**
 * Search for invoices
 */
export interface InvoiceSearchOptions {
  openOnly?: boolean;
  unlockedOnly?: boolean;
}

export async function searchInvoices(
  searchTerm: string,
  limit?: number,
  options?: InvoiceSearchOptions
): Promise<InvoiceSearchResult[]> {
  const response = await crmGraphQLRequest<{ invoiceSearch: InvoiceSearchResult[] }>({
    query: INVOICE_SEARCH,
    variables: {
      searchTerm,
      limit: limit ?? 50,
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
 * Search for checks
 */
export async function searchChecks(searchTerm: string, limit?: number): Promise<CheckSearchResult[]> {
  const response = await crmGraphQLRequest<{ checkSearch: CheckSearchResult[] }>({
    query: CHECK_SEARCH,
    variables: { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search checks');
  }

  return response.data?.checkSearch || [];
}

/**
 * Search for factories
 */
export async function searchFactories(searchTerm: string, published?: boolean, limit?: number): Promise<FactorySearchResult[]> {
  const response = await crmGraphQLRequest<{ factorySearch: FactorySearchResult[] }>({
    query: FACTORY_SEARCH,
    variables: { searchTerm, published: published ?? true, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search factories');
  }

  return response.data?.factorySearch || [];
}

/**
 * Search for customers
 */
export async function searchCustomers(searchTerm: string, published?: boolean, limit?: number): Promise<CustomerSearchResult[]> {
  const response = await crmGraphQLRequest<{ customerSearch: CustomerSearchResult[] }>({
    query: CUSTOMER_SEARCH,
    variables: { searchTerm, published: published ?? true, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search customers');
  }

  return response.data?.customerSearch || [];
}

/**
 * Search for products
 * If factoryId is provided, filters products by that manufacturer
 */
export async function searchProducts(
  searchTerm: string,
  factoryId?: string,
  limit?: number
): Promise<ProductSearchResult[]> {
  // Use the factory-filtered query only if factoryId is provided and not empty
  const useFactoryFilter = factoryId && factoryId.trim() !== '';

  const response = await crmGraphQLRequest<{ productSearch: ProductSearchResult[] }>({
    query: useFactoryFilter ? PRODUCT_SEARCH_WITH_FACTORY : PRODUCT_SEARCH,
    variables: useFactoryFilter
      ? { searchTerm, factoryId, limit: limit ?? 50 }
      : { searchTerm, limit: limit ?? 50 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search products');
  }

  return response.data?.productSearch || [];
}

/**
 * Search for users
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
 * Fetch a single user by ID
 * Used to resolve user IDs (e.g., assignedToId in tasks) to user details
 */
export async function fetchUserById(id: string): Promise<UserSearchResult | null> {
  const response = await crmGraphQLRequest<{ user: UserSearchResult }>({
    query: GET_USER,
    variables: { id },
  });

  if (response.errors) {
    // Silently return null if user not found, don't throw
    console.warn('Failed to fetch user:', response.errors[0]?.message);
    return null;
  }

  return response.data?.user || null;
}

/**
 * Fetch all product UOMs
 */
export async function fetchProductUoms(): Promise<ProductUomResult[]> {
  const response = await crmGraphQLRequest<{ productUoms: ProductUomResult[] }>({
    query: PRODUCT_UOMS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product UOMs');
  }

  return response.data?.productUoms || [];
}

/**
 * Search for open invoices by factory and start date
 * Used for Lines to Reconcile in check/commission creation
 */
export async function searchOpenInvoices(
  factoryId: string,
  startFrom: string
): Promise<OpenInvoiceSearchResult[]> {
  const response = await crmGraphQLRequest<{ searchOpenInvoices: OpenInvoiceSearchResult[] }>({
    query: SEARCH_OPEN_INVOICES,
    variables: { factoryId, startFrom },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search open invoices');
  }

  return response.data?.searchOpenInvoices || [];
}
