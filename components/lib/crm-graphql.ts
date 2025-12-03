/**
 * FlowCRM GraphQL Client
 * Complete GraphQL client for interacting with the CRM API
 */

import { getCRMAccessToken } from './crm-auth';
import { isTokenServerEnabled, tokenServerClient } from './crm-token-server';
import {
  getStoredAccessToken as getSSOAccessToken,
  getStoredRefreshToken,
  getValidAccessToken as getValidSSOToken,
  clearTokens as clearSSOTokens,
} from './auth';
import { redirectToLogin } from './redirect';

// ============================================================================
// Configuration
// ============================================================================

const getGraphQLEndpoint = (): string => {
  const endpoint = process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL;
  if (!endpoint) {
    throw new Error('NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL environment variable is not set');
  }
  return endpoint;
};

// ============================================================================
// Types
// ============================================================================

export interface GraphQLRequestOptions {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

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

// Job Types
export interface JobStatus {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  startDate: string;
  endDate: string;
  requesterId: string;
  createdBy: string;
  createdAt: string;
  status: JobStatus;
}

export interface JobInput {
  jobName: string;
  statusId: string;
  structuralInformation?: string;
  structuralDetails?: string;
  startDate?: string;
  requesterId?: string;
  jobType?: string;
  jobOwnerId?: string;
  endDate?: string;
  description?: string;
  additionalInformation?: string;
}

export interface UpdateJobInput {
  jobName?: string;
  statusId?: string;
  structuralInformation?: string;
  structuralDetails?: string;
  startDate?: string;
  requesterId?: string;
  jobType?: string;
  jobOwnerId?: string;
  endDate?: string;
  description?: string;
  additionalInformation?: string;
}

// Company Types
export type CompanySourceType = 'CUSTOMER' | 'MANUFACTURER';

export interface Company {
  id: string;
  name: string;
  companySourceType: CompanySourceType;
  parentCompanyId?: string | null;
  phone?: string | null;
  website?: string | null;
  tags?: string | string[] | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface CompanyInput {
  name: string;
  companySourceType: CompanySourceType;
  parentCompanyId?: string;
  phone?: string;
  website?: string;
  tags?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  companySourceType?: CompanySourceType;
  parentCompanyId?: string;
  phone?: string;
  website?: string;
  tags?: string;
}

// Contact Types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  companyId?: string | null;
  notes?: string | null;
  tags?: string | string[] | null;
  territory?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  notes?: string;
  tags?: string;
  territory?: string;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  notes?: string;
  tags?: string;
  territory?: string;
}

// PreOpportunity Types
export type PreOpportunityStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface PreOpportunityBalance {
  id: string;
  quantity: number;
  subtotal: number;
  discount: number;
  discountRate: number;
  total: number;
}

export interface PreOpportunityProduct {
  id: string;
  factoryId: string;
  factoryPartNumber: string;
}

// Job Search Result for Pre-Opportunity
export interface JobSearchResult {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  startDate: string;
  endDate: string;
  requesterId: string;
  createdBy: string;
  createdAt: string;
  status: {
    id: string;
    name: string;
  };
}

// Job data embedded in PreOpportunity
export interface PreOpportunityJob {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  startDate: string;
  endDate: string;
  requesterId: string;
  createdBy: string;
  createdAt: string;
  status: {
    id: string;
    name: string;
  };
}

export interface PreOpportunityDetail {
  id: string;
  preOpportunityId: string;
  itemNumber: number;
  productId: string;
  productCpnId?: string;
  product: PreOpportunityProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  discountRate: number;
  total: number;
  leadTime?: string;
  endUserId?: string;
}

export interface PreOpportunity {
  id: string;
  entityNumber: string;
  entityDate: string;
  status: PreOpportunityStatus;
  soldToCustomerId: string;
  billToCustomerId?: string;
  soldToCustomerAddressId?: string;
  billToCustomerAddressId?: string;
  jobId?: string;
  job?: PreOpportunityJob;
  expDate?: string;
  acceptDate?: string;
  reviseDate?: string;
  customerRef?: string;
  paymentTerms?: string;
  freightTerms?: string;
  balance?: PreOpportunityBalance;
  details: PreOpportunityDetail[];
  createdBy: string;
  createdById?: string;
  createdAt: string;
  tags?: string;
}

export interface PreOpportunityLandingPage {
  id: string;
  entityNumber: string;
  entityDate: string;
  status: PreOpportunityStatus;
  total: number;
  expDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface PreOpportunityDetailInput {
  id?: string;
  itemNumber: number;
  productId: string;
  productCpnId?: string;
  quantity: number;
  unitPrice: number;
  discountRate?: number;
  leadTime?: string;
  endUserId?: string;
}

export interface CreatePreOpportunityInput {
  entityNumber: string;
  entityDate: string;
  status: PreOpportunityStatus;
  soldToCustomerId: string;
  billToCustomerId?: string;
  soldToCustomerAddressId?: string;
  billToCustomerAddressId?: string;
  jobId?: string;
  expDate?: string;
  acceptDate?: string;
  reviseDate?: string;
  customerRef?: string;
  paymentTerms?: string;
  freightTerms?: string;
  details: PreOpportunityDetailInput[];
  userOwnerIds?: string;
}

export interface UpdatePreOpportunityInput {
  id: string;
  entityNumber?: string;
  entityDate?: string;
  status?: PreOpportunityStatus;
  soldToCustomerId?: string;
  billToCustomerId?: string;
  soldToCustomerAddressId?: string;
  billToCustomerAddressId?: string;
  jobId?: string;
  expDate?: string;
  acceptDate?: string;
  reviseDate?: string;
  customerRef?: string;
  paymentTerms?: string;
  freightTerms?: string;
  details?: PreOpportunityDetailInput[];
  userOwnerIds?: string;
}

export interface ProductSearchResult {
  id: string;
  factoryId: string;
  factoryPartNumber: string;
}

export interface FactorySearchResult {
  id: string;
  title: string;
}

export interface CustomerSearchResult {
  id: string;
  companyName: string;
  parentId?: string;
  insideRepId?: string;
}

// Landing Page Types
export type FilterOperator = 
  | 'EQ' 
  | 'NE' 
  | 'GT' 
  | 'GTE' 
  | 'LT' 
  | 'LTE' 
  | 'LIKE' 
  | 'ILIKE' 
  | 'BEGINS_WITH' 
  | 'ENDS_WITH' 
  | 'IN' 
  | 'NOT_IN' 
  | 'IS_NULL' 
  | 'IS_NOT_NULL';

export type SortDirection = 'ASC' | 'DESC';

export type SourceType = 'JOBS' | 'COMPANIES' | 'CONTACTS';

export interface LandingPageFilter {
  operator: FilterOperator;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface LandingPageOrderBy {
  columnName: string;
  direction: SortDirection;
}

export interface JobLandingPage {
  id: string;
  jobName: string;
  jobType?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusName?: string;
  jobOwner?: string;
  requester?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface CompanyLandingPage {
  id: string;
  name: string;
  companySourceType: CompanySourceType;
  phone?: string;
  website?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ContactLandingPage {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  companyName?: string;
  createdBy?: string;
  createdAt?: string;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_JOB_STATUSES = `
  query GetJobStatuses {
    jobStatuses {
      id
      name
    }
  }
`;

const GET_JOB = `
  query GetJob($id: UUID!) {
    job(id: $id) {
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
      id
      jobName
      jobType
      requesterId
      startDate
      status {
        id
        name
      }
      structuralDetails
      structuralInformation
    }
  }
`;

const CREATE_JOB = `
  mutation CreateJob($input: JobInput!) {
    createJob(input: $input) {
      structuralInformation
      structuralDetails
      status {
        name
        id
      }
      startDate
      requesterId
      jobType
      jobName
      id
      endDate
      description
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      additionalInformation
    }
  }
`;

const UPDATE_JOB = `
  mutation UpdateJob($id: UUID!, $input: JobInput!) {
    updateJob(id: $id, input: $input) {
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
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
    }
  }
`;

const DELETE_JOB = `
  mutation DeleteJob($id: UUID!) {
    deleteJob(id: $id)
  }
`;

const GET_COMPANIES = `
  query GetCompanies {
    companies {
      id
      name
      companySourceType
      parentCompanyId
      phone
      website
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const GET_COMPANY = `
  query GetCompany($id: UUID!) {
    company(id: $id) {
      id
      name
      companySourceType
      parentCompanyId
      phone
      website
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const GET_COMPANIES_BY_JOB_ID = `
  query GetCompaniesByJobId($jobId: UUID!) {
    companiesByJobId(jobId: $jobId) {
      id
      name
      companySourceType
      parentCompanyId
      phone
      website
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const CREATE_COMPANY = `
  mutation CreateCompany($input: CompanyInput!) {
    createCompany(input: $input) {
      id
      name
      companySourceType
      parentCompanyId
      phone
      website
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const UPDATE_COMPANY = `
  mutation UpdateCompany($id: UUID!, $input: CompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      name
      companySourceType
      parentCompanyId
      phone
      website
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const DELETE_COMPANY = `
  mutation DeleteCompany($id: UUID!) {
    deleteCompany(id: $id)
  }
`;

const GET_CONTACTS = `
  query GetContacts {
    contacts {
      id
      firstName
      lastName
      email
      phone
      role
      companyId
      notes
      tags
      territory
      createdAt
    }
  }
`;

const GET_CONTACT = `
  query GetContact($id: UUID!) {
    contact(id: $id) {
      id
      firstName
      lastName
      email
      phone
      role
      companyId
      notes
      tags
      territory
      createdAt
    }
  }
`;

const GET_CONTACTS_BY_COMPANY = `
  query GetContactsByCompany($companyId: UUID!) {
    contactsByCompany(companyId: $companyId) {
      id
      firstName
      lastName
      email
      phone
      role
      companyId
      notes
      tags
      territory
      createdAt
    }
  }
`;

const GET_JOBS_BY_COMPANY = `
  query GetJobsByCompany($companyId: UUID!) {
    jobsByCompany(companyId: $companyId) {
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
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
    }
  }
`;

const GET_JOBS_BY_CONTACT = `
  query GetJobsByContact($contactId: UUID!) {
    jobsByContact(contactId: $contactId) {
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
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
    }
  }
`;

const CREATE_CONTACT = `
  mutation CreateContact($input: ContactInput!) {
    createContact(input: $input) {
      id
      firstName
      lastName
      email
      phone
      role
      companyId
      notes
      tags
      territory
      createdAt
    }
  }
`;

const UPDATE_CONTACT = `
  mutation UpdateContact($id: UUID!, $input: ContactInput!) {
    updateContact(id: $id, input: $input) {
      id
      firstName
      lastName
      email
      phone
      role
      companyId
      notes
      tags
      territory
      createdAt
    }
  }
`;

const DELETE_CONTACT = `
  mutation DeleteContact($id: UUID!) {
    deleteContact(id: $id)
  }
`;

const FIND_JOB_LANDING_PAGES = `
  query FindJobLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
  ) {
    findLandingPages(
      sourceType: JOBS
      filters: $filters
      orderBy: $orderBy
    ) {
      records {
        ... on JobLandingPage {
          id
          createdAt
          description
          endDate
          jobName
          jobOwner
          jobType
          requester
          startDate
          statusName
          createdBy
        }
      }
    }
  }
`;

const FIND_COMPANY_LANDING_PAGES = `
  query FindCompanyLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
  ) {
    findLandingPages(
      sourceType: COMPANIES
      filters: $filters
      orderBy: $orderBy
    ) {
      records {
        ... on CompanyLandingPage {
          id
          name
          companySourceType
          createdAt
          createdBy
          phone
          website
        }
      }
    }
  }
`;

const FIND_CONTACT_LANDING_PAGES = `
  query FindContactLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
  ) {
    findLandingPages(
      sourceType: CONTACTS
      filters: $filters
      orderBy: $orderBy
    ) {
      records {
        ... on ContactLandingPage {
          id
          firstName
          lastName
          email
          phone
          role
          companyName
          createdBy
          createdAt
        }
      }
    }
  }
`;

// PreOpportunity Queries
const FIND_PRE_OPPORTUNITY_LANDING_PAGES = `
  query FindPreOpportunityLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
  ) {
    findLandingPages(
      sourceType: PRE_OPPORTUNITIES
      filters: $filters
      orderBy: $orderBy
    ) {
      records {
        ... on PreOpportunityLandingPage {
          id
          total
        status
        expDate
        entityNumber
        entityDate
        createdBy
        createdAt
      }
    }
      total
    }
  }
`;

const GET_PRE_OPPORTUNITY = `
  query GetPreOpportunity($id: UUID!) {
    preOpportunity(id: $id) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
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
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
      }
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryId
          factoryPartNumber
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
      }
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const GET_PRE_OPPORTUNITIES_BY_JOB = `
  query GetPreOpportunitiesByJob($jobId: UUID!) {
    preOpportunitiesByJob(jobId: $jobId) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryId
          factoryPartNumber
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
      }
      createdAt
    }
  }
`;

const GET_PRE_OPPORTUNITIES_BY_CUSTOMER = `
  query GetPreOpportunitiesByCustomer($customerId: UUID!) {
    preOpportunitiesByCustomer(customerId: $customerId) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryId
          factoryPartNumber
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
      }
      createdAt
    }
  }
`;

const SEARCH_PRODUCTS = `
  query SearchProducts($searchTerm: String!, $factoryId: UUID) {
    productSearch(searchTerm: $searchTerm, factoryId: $factoryId) {
      id
      factoryId
      factoryPartNumber
    }
  }
`;

const SEARCH_FACTORIES = `
  query SearchFactories($searchTerm: String!, $published: Boolean) {
    factorySearch(searchTerm: $searchTerm, published: $published) {
      id
      title
    }
  }
`;

const SEARCH_CUSTOMERS = `
  query SearchCustomers($searchTerm: String!, $published: Boolean) {
    customerSearch(searchTerm: $searchTerm, published: $published) {
      id
      companyName
      parentId
      insideRepId
    }
  }
`;

const SEARCH_JOBS = `
  query SearchJobs($searchTerm: String!) {
    jobSearch(searchTerm: $searchTerm) {
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
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
    }
  }
`;

const CREATE_PRE_OPPORTUNITY = `
  mutation CreatePreOpportunity($input: PreOpportunityInput!) {
    createPreOpportunity(input: $input) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
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
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
      }
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryId
          factoryPartNumber
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
      }
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const UPDATE_PRE_OPPORTUNITY = `
  mutation UpdatePreOpportunity($input: PreOpportunityInput!) {
    updatePreOpportunity(input: $input) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
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
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
      }
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryId
          factoryPartNumber
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
      }
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const DELETE_PRE_OPPORTUNITY = `
  mutation DeletePreOpportunity($id: UUID!) {
    deletePreOpportunity(id: $id)
  }
`;

// ============================================================================
// Core GraphQL Request Function
// ============================================================================

/**
 * Check if SSO auth tokens are available (from FlowRMS redirect)
 */
function hasSSOTokens(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getSSOAccessToken();
}

/**
 * Execute a GraphQL query/mutation against the CRM API
 * Automatically handles token refresh for both SSO and Token Server modes
 * Priority: SSO tokens > Token Server > Manual tokens
 */
export async function crmGraphQLRequest<T = unknown>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  let authHeader: string;
  let usingSSOAuth = false;

  // Priority 1: Check for SSO tokens (from FlowRMS redirect)
  if (hasSSOTokens()) {
    const ssoToken = await getValidSSOToken();
    if (ssoToken) {
      authHeader = `Bearer ${ssoToken}`;
      usingSSOAuth = true;
    } else {
      // SSO token refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        clearSSOTokens();
        redirectToLogin();
      }
      throw new Error('Authentication expired. Redirecting to login...');
    }
  }
  // Priority 2: Token Server mode
  else if (isTokenServerEnabled()) {
    try {
      authHeader = await tokenServerClient.getAuthorizationHeader();
    } catch (error) {
      throw new Error(
        `Token Server error: ${error instanceof Error ? error.message : 'Failed to get token'}`
      );
    }
  }
  // Priority 3: Manual tokens
  else {
    const accessToken = getCRMAccessToken();
    if (!accessToken) {
      throw new Error(
        'CRM access token not configured. Please set your tokens in FlowCRM Auth settings.'
      );
    }
    authHeader = `Bearer ${accessToken}`;
  }

  const endpoint = getGraphQLEndpoint();
  
  // Get refresh token for the header
  const refreshToken = getStoredRefreshToken();
  
  // Build headers with refresh token if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
  };
  
  // Always include refresh token in headers if available
  if (refreshToken) {
    headers['X-Refresh-Token'] = refreshToken;
  }

  let response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: options.query,
      variables: options.variables,
      operationName: options.operationName,
    }),
  });

  // Handle 401/403 responses
  if (response.status === 401 || response.status === 403) {
    // If using SSO auth, try to refresh token
    if (usingSSOAuth) {
      const newToken = await getValidSSOToken();
      if (newToken) {
        authHeader = `Bearer ${newToken}`;
        // Update headers with new token
        headers['Authorization'] = authHeader;
        // Get fresh refresh token after token refresh
        const freshRefreshToken = getStoredRefreshToken();
        if (freshRefreshToken) {
          headers['X-Refresh-Token'] = freshRefreshToken;
        }
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: options.query,
            variables: options.variables,
            operationName: options.operationName,
          }),
        });
      } else {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          clearSSOTokens();
          redirectToLogin();
        }
        throw new Error('Authentication expired. Redirecting to login...');
      }
    }
    // If using Token Server, try refreshing
    else if (isTokenServerEnabled()) {
      try {
        authHeader = await tokenServerClient.getAuthorizationHeader(true); // Force refresh
        headers['Authorization'] = authHeader;

        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: options.query,
            variables: options.variables,
            operationName: options.operationName,
          }),
        });
      } catch {
        throw new Error('Authentication failed. Please check your Token Server configuration.');
      }
    }
  }

  if (!response.ok) {
    throw new Error(`CRM API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// ============================================================================
// Local Storage for Job IDs (since API doesn't have list query)
// ============================================================================

const STORED_JOB_IDS_KEY = 'flowcrm_created_job_ids';

export function getStoredJobIds(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORED_JOB_IDS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addStoredJobId(id: string): void {
  if (typeof window === 'undefined') return;
  const ids = getStoredJobIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORED_JOB_IDS_KEY, JSON.stringify(ids));
  }
}

// ============================================================================
// API Functions - Jobs
// ============================================================================

export async function fetchJobStatuses(): Promise<JobStatus[]> {
  const response = await crmGraphQLRequest<{ jobStatuses: JobStatus[] }>({
    query: GET_JOB_STATUSES,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job statuses');
  }

  return response.data?.jobStatuses || [];
}

export async function fetchJob(id: string): Promise<Job | null> {
  const response = await crmGraphQLRequest<{ job: Job }>({
    query: GET_JOB,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job');
  }

  const job = response.data?.job;

  return job ? { ...job, createdBy: formatCreatedBy(job.createdBy) } : null;
}

export async function createJob(input: JobInput): Promise<Job> {
  const response = await crmGraphQLRequest<{ createJob: Job }>({
    query: CREATE_JOB,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create job');
  }

  if (!response.data?.createJob) {
    throw new Error('No job returned from create mutation');
  }

  // Store the job ID for later retrieval
  addStoredJobId(response.data.createJob.id);

  const createdJob = response.data.createJob;
  return { ...createdJob, createdBy: formatCreatedBy(createdJob.createdBy) };
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const response = await crmGraphQLRequest<{ updateJob: Job }>({
    query: UPDATE_JOB,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update job');
  }

  if (!response.data?.updateJob) {
    throw new Error('No job returned from update mutation');
  }

  const updatedJob = response.data.updateJob;
  return { ...updatedJob, createdBy: formatCreatedBy(updatedJob.createdBy) };
}

export async function deleteJob(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteJob: boolean }>({
    query: DELETE_JOB,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete job');
  }

  return response.data?.deleteJob || false;
}

export async function fetchJobsByIds(ids: string[]): Promise<Job[]> {
  const jobs: Job[] = [];
  
  for (const id of ids) {
    try {
      const job = await fetchJob(id);
      if (job) {
        jobs.push(job);
      }
    } catch {
      // Skip failed fetches
      console.warn(`Failed to fetch job ${id}`);
    }
  }

  return jobs;
}

export async function fetchJobLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
): Promise<JobLandingPage[]> {
  const response = await crmGraphQLRequest<{ 
    findLandingPages: { records: JobLandingPage[] } 
  }>({
    query: FIND_JOB_LANDING_PAGES,
    variables: { filters, orderBy },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job landing pages');
  }

  return response.data?.findLandingPages?.records || [];
}

// ============================================================================
// API Functions - Companies
// ============================================================================

export async function fetchCompanies(): Promise<Company[]> {
  const response = await crmGraphQLRequest<{ companies: Company[] }>({
    query: GET_COMPANIES,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch companies');
  }

  return mapFormattedCreatedBy(response.data?.companies);
}

export async function fetchCompany(id: string): Promise<Company | null> {
  const response = await crmGraphQLRequest<{ company: Company }>({
    query: GET_COMPANY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch company');
  }

  const company = response.data?.company;
  return company ? withFormattedCreatedBy(company) : null;
}

export async function fetchCompaniesByJobId(jobId: string): Promise<Company[]> {
  const response = await crmGraphQLRequest<{ companiesByJobId: Company[] }>({
    query: GET_COMPANIES_BY_JOB_ID,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch companies by job');
  }

  return mapFormattedCreatedBy(response.data?.companiesByJobId);
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  const response = await crmGraphQLRequest<{ createCompany: Company }>({
    query: CREATE_COMPANY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create company');
  }

  if (!response.data?.createCompany) {
    throw new Error('No company returned from create mutation');
  }

  return withFormattedCreatedBy(response.data.createCompany);
}

export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company> {
  const response = await crmGraphQLRequest<{ updateCompany: Company }>({
    query: UPDATE_COMPANY,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update company');
  }

  if (!response.data?.updateCompany) {
    throw new Error('No company returned from update mutation');
  }

  return withFormattedCreatedBy(response.data.updateCompany);
}

export async function deleteCompany(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteCompany: boolean }>({
    query: DELETE_COMPANY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete company');
  }

  return response.data?.deleteCompany || false;
}

export async function fetchCompanyLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
): Promise<CompanyLandingPage[]> {
  const response = await crmGraphQLRequest<{ 
    findLandingPages: { records: CompanyLandingPage[] } 
  }>({
    query: FIND_COMPANY_LANDING_PAGES,
    variables: { filters, orderBy },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch company landing pages');
  }

  return response.data?.findLandingPages?.records || [];
}

// ============================================================================
// API Functions - Contacts
// ============================================================================

export async function fetchContacts(): Promise<Contact[]> {
  const response = await crmGraphQLRequest<{ contacts: Contact[] }>({
    query: GET_CONTACTS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contacts');
  }

  return response.data?.contacts || [];
}

export async function fetchContact(id: string): Promise<Contact | null> {
  const response = await crmGraphQLRequest<{ contact: Contact }>({
    query: GET_CONTACT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contact');
  }

  return response.data?.contact || null;
}

export async function fetchContactsByCompanyId(companyId: string): Promise<Contact[]> {
  const response = await crmGraphQLRequest<{ contactsByCompany: Contact[] }>({
    query: GET_CONTACTS_BY_COMPANY,
    variables: { companyId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contacts by company');
  }

  return response.data?.contactsByCompany || [];
}

export async function fetchJobsByCompanyId(companyId: string): Promise<Job[]> {
  const response = await crmGraphQLRequest<{ jobsByCompany: Job[] }>({
    query: GET_JOBS_BY_COMPANY,
    variables: { companyId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch jobs by company');
  }

  return mapFormattedCreatedBy(response.data?.jobsByCompany);
}

export async function fetchJobsByContactId(contactId: string): Promise<Job[]> {
  const response = await crmGraphQLRequest<{ jobsByContact: Job[] }>({
    query: GET_JOBS_BY_CONTACT,
    variables: { contactId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch jobs by contact');
  }

  return mapFormattedCreatedBy(response.data?.jobsByContact);
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const response = await crmGraphQLRequest<{ createContact: Contact }>({
    query: CREATE_CONTACT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create contact');
  }

  if (!response.data?.createContact) {
    throw new Error('No contact returned from create mutation');
  }

  return response.data.createContact;
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
  const response = await crmGraphQLRequest<{ updateContact: Contact }>({
    query: UPDATE_CONTACT,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update contact');
  }

  if (!response.data?.updateContact) {
    throw new Error('No contact returned from update mutation');
  }

  return response.data.updateContact;
}

export async function deleteContact(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteContact: boolean }>({
    query: DELETE_CONTACT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete contact');
  }

  return response.data?.deleteContact || false;
}

export async function fetchContactLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
): Promise<ContactLandingPage[]> {
  const response = await crmGraphQLRequest<{ 
    findLandingPages: { records: ContactLandingPage[] } 
  }>({
    query: FIND_CONTACT_LANDING_PAGES,
    variables: { filters, orderBy },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contact landing pages');
  }

  return response.data?.findLandingPages?.records || [];
}

// ============================================================================
// PreOpportunity Functions
// ============================================================================

export async function fetchPreOpportunityLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
): Promise<PreOpportunityLandingPage[]> {
  // Import the normalization function
  const { normalizePreOpportunitiesStatus } = await import('../pre-opportunities/utils');
  
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: PreOpportunityLandingPage[]; total: number }
  }>({
    query: FIND_PRE_OPPORTUNITY_LANDING_PAGES,
    variables: { filters, orderBy },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunity landing pages');
  }

  const records = response.data?.findLandingPages?.records || [];
  // Normalize status values (convert numeric to string)
  return normalizePreOpportunitiesStatus(records);
}

export async function fetchPreOpportunity(id: string): Promise<PreOpportunity | null> {
  // Import the normalization function
  const { normalizePreOpportunityStatus } = await import('../pre-opportunities/utils');
  
  const response = await crmGraphQLRequest<{ preOpportunity: PreOpportunity }>({
    query: GET_PRE_OPPORTUNITY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunity');
  }

  const preOpp = response.data?.preOpportunity;
  // Normalize status value (convert numeric to string)
  if (!preOpp) {
    return null;
  }

  const normalized = normalizePreOpportunityStatus(preOpp);
  return {
    ...normalized,
    createdBy: formatCreatedBy((normalized as any).createdBy),
    job: normalized.job
      ? { ...normalized.job, createdBy: formatCreatedBy((normalized.job as any).createdBy) }
      : normalized.job,
  };
}

export async function fetchPreOpportunitiesByJob(jobId: string): Promise<PreOpportunity[]> {
  // Import the normalization function
  const { normalizePreOpportunitiesStatus } = await import('../pre-opportunities/utils');
  
  const response = await crmGraphQLRequest<{ preOpportunitiesByJob: PreOpportunity[] }>({
    query: GET_PRE_OPPORTUNITIES_BY_JOB,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunities by job');
  }

  const records = response.data?.preOpportunitiesByJob || [];
  return normalizePreOpportunitiesStatus(records);
}

export async function fetchPreOpportunitiesByCustomer(customerId: string): Promise<PreOpportunity[]> {
  // Import the normalization function
  const { normalizePreOpportunitiesStatus } = await import('../pre-opportunities/utils');
  
  const response = await crmGraphQLRequest<{ preOpportunitiesByCustomer: PreOpportunity[] }>({
    query: GET_PRE_OPPORTUNITIES_BY_CUSTOMER,
    variables: { customerId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunities by customer');
  }

  const records = response.data?.preOpportunitiesByCustomer || [];
  return normalizePreOpportunitiesStatus(records);
}

export async function searchProducts(searchTerm: string, factoryId?: string): Promise<ProductSearchResult[]> {
  const response = await crmGraphQLRequest<{ productSearch: ProductSearchResult[] }>({
    query: SEARCH_PRODUCTS,
    variables: { searchTerm, factoryId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search products');
  }

  return response.data?.productSearch || [];
}

export async function searchFactories(searchTerm: string, published?: boolean): Promise<FactorySearchResult[]> {
  const response = await crmGraphQLRequest<{ factorySearch: FactorySearchResult[] }>({
    query: SEARCH_FACTORIES,
    variables: { searchTerm, published },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search factories');
  }

  return response.data?.factorySearch || [];
}

export async function searchCustomers(searchTerm: string, published?: boolean): Promise<CustomerSearchResult[]> {
  const response = await crmGraphQLRequest<{ customerSearch: CustomerSearchResult[] }>({
    query: SEARCH_CUSTOMERS,
    variables: { searchTerm, published },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search customers');
  }

  return response.data?.customerSearch || [];
}

export async function searchJobs(searchTerm: string): Promise<JobSearchResult[]> {
  const response = await crmGraphQLRequest<{ jobSearch: JobSearchResult[] }>({
    query: SEARCH_JOBS,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search jobs');
  }

  return mapFormattedCreatedBy(response.data?.jobSearch);
}

export async function createPreOpportunity(input: CreatePreOpportunityInput): Promise<PreOpportunity> {
  const response = await crmGraphQLRequest<{ createPreOpportunity: PreOpportunity }>({
    query: CREATE_PRE_OPPORTUNITY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create pre-opportunity');
  }

  if (!response.data?.createPreOpportunity) {
    throw new Error('No pre-opportunity returned from create mutation');
  }

  const preOpp = response.data.createPreOpportunity;
  return {
    ...preOpp,
    createdBy: formatCreatedBy((preOpp as any).createdBy),
    job: preOpp.job ? { ...preOpp.job, createdBy: formatCreatedBy((preOpp.job as any).createdBy) } : preOpp.job,
  };
}

export async function updatePreOpportunity(input: UpdatePreOpportunityInput): Promise<PreOpportunity> {
  const response = await crmGraphQLRequest<{ updatePreOpportunity: PreOpportunity }>({
    query: UPDATE_PRE_OPPORTUNITY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update pre-opportunity');
  }

  if (!response.data?.updatePreOpportunity) {
    throw new Error('No pre-opportunity returned from update mutation');
  }

  const preOpp = response.data.updatePreOpportunity;
  return {
    ...preOpp,
    createdBy: formatCreatedBy((preOpp as any).createdBy),
    job: preOpp.job ? { ...preOpp.job, createdBy: formatCreatedBy((preOpp.job as any).createdBy) } : preOpp.job,
  };
}

export async function deletePreOpportunity(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deletePreOpportunity: boolean }>({
    query: DELETE_PRE_OPPORTUNITY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete pre-opportunity');
  }

  return response.data?.deletePreOpportunity || false;
}

// ============================================================================
// Entity Link Types
// ============================================================================

export type EntityType = 'JOB' | 'COMPANY' | 'CONTACT' | 'TASK' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK';

export interface EntityLink {
  id: string;
  sourceEntityType: EntityType;
  sourceEntityId: string;
  targetEntityType: EntityType;
  targetEntityId: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateLinkInput {
  sourceEntityType: EntityType;
  sourceEntityId: string;
  targetEntityType: EntityType;
  targetEntityId: string;
}

export interface DeleteLinkByEntitiesInput {
  sourceEntityType: EntityType;
  sourceEntityId: string;
  targetEntityType: EntityType;
  targetEntityId: string;
}

// Search result types for linking
export interface QuoteSearchResult {
  id: string;
  quoteNumber: string;
  jobName: string;
  entityDate: string;
  entryDate: string;
  expDate: string;
  billToCustomerId: string;
  soldToCustomerId: string;
  blanket: boolean;
  createdBy: string;
  userOwnerIds: string[];
}

export interface OrderSearchResult {
  id: string;
  orderNumber: string;
  jobName: string;
  entityDate: string;
  entryDate: string;
  dueDate: string;
  shipDate: string;
  status: string;
  billToCustomerId: string;
  soldToCustomerId: string;
  factoryId: string;
  quoteId: string;
  balanceId: string;
  factSoNumber: string;
  userOwnerIds: string[];
}

export interface InvoiceSearchResult {
  id: string;
  invoiceNumber: string;
  entityDate: string;
  entryDate: string;
  dueDate: string;
  status: string;
  factoryId: string;
  orderId: string;
  balanceId: string;
  locked: boolean;
  published: boolean;
  creationType: string;
  createdBy: string;
  userOwnerIds: string[];
}

export interface CheckSearchResult {
  id: string;
  checkNumber: string;
  entityDate: string;
  entryDate: string;
  postDate: string;
  status: string;
  factoryId: string;
  commission: number;
  commissionMonth: string;
  creationType: string;
  createdBy: string;
  userOwnerIds: string[];
}

export interface TaskSearchResult {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedToId: string;
  createdBy: string;
  createdAt: string;
}

export interface NoteSearchResult {
  id: string;
  title: string;
  content: string;
  tags: string;
  mentions: string;
  createdBy: string;
  createdAt: string;
}

export interface JobRelatedEntities {
  companies: Company[];
  contacts: Contact[];
  preOpportunities: PreOpportunity[];
  quotes: QuoteSearchResult[];
  orders: OrderSearchResult[];
  invoices: InvoiceSearchResult[];
  checks: CheckSearchResult[];
}

// ============================================================================
// Entity Link GraphQL Queries and Mutations
// ============================================================================

const CREATE_LINK = `
  mutation CreateLink(
    $sourceEntityType: EntityType!
    $sourceEntityId: UUID!
    $targetEntityType: EntityType!
    $targetEntityId: UUID!
  ) {
    createLink(input: {
      sourceEntityType: $sourceEntityType
      sourceEntityId: $sourceEntityId
      targetEntityType: $targetEntityType
      targetEntityId: $targetEntityId
    }) {
      id
      sourceEntityType
      sourceEntityId
      targetEntityType
      targetEntityId
      createdAt
    }
  }
`;

const DELETE_LINK = `
  mutation DeleteLink($id: UUID!) {
    deleteLink(id: $id)
  }
`;

const DELETE_LINK_BY_ENTITIES = `
  mutation DeleteLinkByEntities(
    $sourceEntityType: EntityType!
    $sourceEntityId: UUID!
    $targetEntityType: EntityType!
    $targetEntityId: UUID!
  ) {
    deleteLinkByEntities(input: {
      sourceEntityType: $sourceEntityType
      sourceEntityId: $sourceEntityId
      targetEntityType: $targetEntityType
      targetEntityId: $targetEntityId
    })
  }
`;

const GET_JOB_RELATED_ENTITIES = `
  query GetJobRelatedEntities($jobId: UUID!) {
    jobRelatedEntities(jobId: $jobId) {
      checks {
        checkNumber
        commission
        commissionMonth
        createdBy
        creationType
        entityDate
        entryDate
        factoryId
        id
        postDate
        status
        userOwnerIds
      }
      companies {
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
      contacts {
        territory
        tags
        role
        phone
        notes
        lastName
        id
        firstName
        email
        createdAt
        companyId
      }
      invoices {
        balanceId
        createdBy
        creationType
        dueDate
        entityDate
        factoryId
        entryDate
        id
        invoiceNumber
        locked
        orderId
        published
        status
        userOwnerIds
      }
      orders {
        balanceId
        billToCustomerId
        dueDate
        entityDate
        entryDate
        factSoNumber
        factoryId
        id
        jobName
        orderNumber
        shipDate
        soldToCustomerId
        status
        userOwnerIds
      }
      preOpportunities {
        acceptDate
        billToCustomerAddressId
        billToCustomerId
        createdAt
        createdById
        customerRef
        entityDate
        entityNumber
        expDate
        freightTerms
        id
        jobId
        paymentTerms
        reviseDate
        soldToCustomerAddressId
        soldToCustomerId
        status
        tags
      }
      quotes {
        billToCustomerId
        createdBy
        blanket
        entityDate
        entryDate
        expDate
        id
        jobName
        quoteNumber
        soldToCustomerId
        userOwnerIds
      }
    }
  }
`;

// Search queries for linking entities
const TASK_SEARCH = `
  query TaskSearch($searchTerm: String!) {
    taskSearch(searchTerm: $searchTerm) {
      id
      title
      description
      status
      priority
      dueDate
      assignedToId
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const NOTE_SEARCH = `
  query NoteSearch($searchTerm: String!) {
    noteSearch(searchTerm: $searchTerm) {
      id
      title
      content
      tags
      mentions
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const QUOTE_SEARCH = `
  query QuoteSearch($searchTerm: String!) {
    quoteSearch(searchTerm: $searchTerm) {
      id
      quoteNumber
      jobName
      entityDate
      entryDate
      expDate
      billToCustomerId
      soldToCustomerId
      blanket
      createdBy
      userOwnerIds
    }
  }
`;

const ORDER_SEARCH = `
  query OrderSearch($searchTerm: String!) {
    orderSearch(searchTerm: $searchTerm) {
      id
      orderNumber
      jobName
      entityDate
      entryDate
      dueDate
      shipDate
      status
      billToCustomerId
      soldToCustomerId
      factoryId
      quoteId
      balanceId
      factSoNumber
      userOwnerIds
    }
  }
`;

const INVOICE_SEARCH = `
  query InvoiceSearch($searchTerm: String!) {
    invoiceSearch(searchTerm: $searchTerm) {
      id
      invoiceNumber
      entityDate
      entryDate
      dueDate
      status
      factoryId
      orderId
      balanceId
      locked
      published
      creationType
      createdBy
      userOwnerIds
    }
  }
`;

const CHECK_SEARCH = `
  query CheckSearch($searchTerm: String!) {
    checkSearch(searchTerm: $searchTerm) {
      id
      checkNumber
      entityDate
      entryDate
      postDate
      status
      factoryId
      commission
      commissionMonth
      creationType
      createdBy
      userOwnerIds
    }
  }
`;

// ============================================================================
// Entity Link API Functions
// ============================================================================

export async function createLink(input: CreateLinkInput): Promise<EntityLink> {
  const response = await crmGraphQLRequest<{ createLink: EntityLink }>({
    query: CREATE_LINK,
    variables: {
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create link');
  }

  if (!response.data?.createLink) {
    throw new Error('No link returned from create mutation');
  }

  return response.data.createLink;
}

export async function deleteLink(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteLink: boolean }>({
    query: DELETE_LINK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete link');
  }

  return response.data?.deleteLink || false;
}

export async function deleteLinkByEntities(input: DeleteLinkByEntitiesInput): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteLinkByEntities: boolean }>({
    query: DELETE_LINK_BY_ENTITIES,
    variables: {
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete link by entities');
  }

  return response.data?.deleteLinkByEntities || false;
}

export async function fetchJobRelatedEntities(jobId: string): Promise<JobRelatedEntities> {
  const response = await crmGraphQLRequest<{ jobRelatedEntities: JobRelatedEntities }>({
    query: GET_JOB_RELATED_ENTITIES,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job related entities');
  }

  const data = response.data?.jobRelatedEntities || { 
    companies: [], 
    contacts: [], 
    preOpportunities: [],
    quotes: [],
    orders: [],
    invoices: [],
    checks: [],
  };
  
  return {
    companies: mapFormattedCreatedBy(data.companies) as Company[],
    contacts: mapFormattedCreatedBy(data.contacts) as Contact[],
    preOpportunities: mapFormattedCreatedBy(data.preOpportunities) as PreOpportunity[],
    quotes: data.quotes || [],
    orders: data.orders || [],
    invoices: data.invoices || [],
    checks: data.checks || [],
  };
}

// Search functions for linking entities
export async function searchTasks(searchTerm: string): Promise<TaskSearchResult[]> {
  const response = await crmGraphQLRequest<{ taskSearch: TaskSearchResult[] }>({
    query: TASK_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search tasks');
  }

  return mapFormattedCreatedBy(response.data?.taskSearch) as TaskSearchResult[];
}

export async function searchNotes(searchTerm: string): Promise<NoteSearchResult[]> {
  const response = await crmGraphQLRequest<{ noteSearch: NoteSearchResult[] }>({
    query: NOTE_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search notes');
  }

  return mapFormattedCreatedBy(response.data?.noteSearch) as NoteSearchResult[];
}

export async function searchQuotes(searchTerm: string): Promise<QuoteSearchResult[]> {
  const response = await crmGraphQLRequest<{ quoteSearch: QuoteSearchResult[] }>({
    query: QUOTE_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search quotes');
  }

  return response.data?.quoteSearch || [];
}

export async function searchOrders(searchTerm: string): Promise<OrderSearchResult[]> {
  const response = await crmGraphQLRequest<{ orderSearch: OrderSearchResult[] }>({
    query: ORDER_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search orders');
  }

  return response.data?.orderSearch || [];
}

export async function searchInvoices(searchTerm: string): Promise<InvoiceSearchResult[]> {
  const response = await crmGraphQLRequest<{ invoiceSearch: InvoiceSearchResult[] }>({
    query: INVOICE_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search invoices');
  }

  return response.data?.invoiceSearch || [];
}

export async function searchChecks(searchTerm: string): Promise<CheckSearchResult[]> {
  const response = await crmGraphQLRequest<{ checkSearch: CheckSearchResult[] }>({
    query: CHECK_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search checks');
  }

  return response.data?.checkSearch || [];
}

// ============================================================================
// Note Link Types and Queries
// ============================================================================

export interface NoteLink {
  id: string;
  sourceEntityType: EntityType;
  sourceEntityId: string;
  targetEntityType: EntityType;
  targetEntityId: string;
  createdAt: string;
  createdBy: string;
}

const GET_LINKS_BY_SOURCE = `
  query GetLinksBySource($sourceEntityType: EntityType!, $sourceEntityId: UUID!) {
    linksBySource(sourceEntityType: $sourceEntityType, sourceEntityId: $sourceEntityId) {
      id
      sourceEntityType
      sourceEntityId
      targetEntityType
      targetEntityId
      createdAt
      createdBy
    }
  }
`;

const GET_NOTES_BY_ENTITY = `
  query GetNotesByEntity($entityId: UUID!, $entityType: EntityType!) {
    notesByEntity(entityId: $entityId, entityType: $entityType) {
      id
      title
      content
      mentions
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

export async function fetchLinksBySource(sourceEntityType: EntityType, sourceEntityId: string): Promise<NoteLink[]> {
  const response = await crmGraphQLRequest<{ linksBySource: NoteLink[] }>({
    query: GET_LINKS_BY_SOURCE,
    variables: { sourceEntityType, sourceEntityId },
  });

  if (response.errors) {
    // If the query doesn't exist, return empty array
    console.warn('Failed to fetch links by source:', response.errors[0]?.message);
    return [];
  }

  return response.data?.linksBySource || [];
}

export async function fetchNotesByEntity(entityId: string, entityType: EntityType): Promise<Note[]> {
  const response = await crmGraphQLRequest<{ notesByEntity: Note[] }>({
    query: GET_NOTES_BY_ENTITY,
    variables: { entityId, entityType },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch notes by entity');
  }

  return mapFormattedCreatedBy(response.data?.notesByEntity);
}

// ============================================================================
// Note Types
// ============================================================================

export interface NoteConversation {
  id: string;
  noteId: string;
  content: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  mentions: string;
  tags: string;
  createdBy: string;
  createdAt: string;
}

export interface NoteLandingPage {
  id: string;
  title: string;
  content: string;
  tags: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  mentions?: string[];
  tags?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  mentions?: string[];
  tags?: string;
}

export interface AddNoteConversationInput {
  noteId: string;
  content: string;
}

export interface UpdateNoteConversationInput {
  noteId: string;
  content: string;
}

// ============================================================================
// Note GraphQL Queries and Mutations
// ============================================================================

const GET_NOTES = `
  query GetNotes {
    notes {
      id
      title
      content
      mentions
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const GET_NOTE = `
  query GetNote($id: UUID!) {
    note(id: $id) {
      id
      title
      content
      mentions
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const GET_NOTE_CONVERSATIONS = `
  query GetNoteConversations($noteId: UUID!) {
    noteConversations(noteId: $noteId) {
      id
      noteId
      content
      createdAt
    }
  }
`;

const CREATE_NOTE = `
  mutation CreateNote($input: NoteInput!) {
    createNote(input: $input) {
      id
      title
      content
      mentions
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const UPDATE_NOTE = `
  mutation UpdateNote($id: UUID!, $input: NoteInput!) {
    updateNote(id: $id, input: $input) {
      id
      title
      content
      mentions
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

const DELETE_NOTE = `
  mutation DeleteNote($id: UUID!) {
    deleteNote(id: $id)
  }
`;

const ADD_NOTE_CONVERSATION = `
  mutation AddNoteConversation($input: NoteConversationInput!) {
    addNoteConversation(input: $input) {
      id
      noteId
      content
      createdAt
    }
  }
`;

const UPDATE_NOTE_CONVERSATION = `
  mutation UpdateNoteConversation($input: NoteConversationInput!) {
    updateNoteConversation(input: $input) {
      id
      noteId
      content
      createdAt
    }
  }
`;

const DELETE_NOTE_CONVERSATIONS = `
  mutation DeleteNoteConversations($noteId: UUID!) {
    deleteNoteConversations(noteId: $noteId)
  }
`;

const FIND_NOTE_LANDING_PAGES = `
  query FindNoteLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
  ) {
    findLandingPages(
      sourceType: NOTES
      filters: $filters
      orderBy: $orderBy
    ) {
      records {
        ... on NoteLandingPage {
          id
          title
          content
          tags
          createdBy
          createdAt
        }
      }
      total
    }
  }
`;

// ============================================================================
// Note API Functions
// ============================================================================

export async function fetchNotes(): Promise<Note[]> {
  const response = await crmGraphQLRequest<{ notes: Note[] }>({
    query: GET_NOTES,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch notes');
  }

  return mapFormattedCreatedBy(response.data?.notes);
}

export async function fetchNoteLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
): Promise<NoteLandingPage[]> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: NoteLandingPage[]; total: number }
  }>({
    query: FIND_NOTE_LANDING_PAGES,
    variables: { filters, orderBy },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch note landing pages');
  }

  return response.data?.findLandingPages?.records || [];
}

export async function fetchNote(id: string): Promise<Note | null> {
  const response = await crmGraphQLRequest<{ note: Note }>({
    query: GET_NOTE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch note');
  }

  const note = response.data?.note;
  return note ? withFormattedCreatedBy(note) : null;
}

export async function fetchNoteConversations(noteId: string): Promise<NoteConversation[]> {
  const response = await crmGraphQLRequest<{ noteConversations: NoteConversation[] }>({
    query: GET_NOTE_CONVERSATIONS,
    variables: { noteId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch note conversations');
  }

  return response.data?.noteConversations || [];
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const response = await crmGraphQLRequest<{ createNote: Note }>({
    query: CREATE_NOTE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create note');
  }

  if (!response.data?.createNote) {
    throw new Error('No note returned from create mutation');
  }

  return withFormattedCreatedBy(response.data.createNote);
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const response = await crmGraphQLRequest<{ updateNote: Note }>({
    query: UPDATE_NOTE,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update note');
  }

  if (!response.data?.updateNote) {
    throw new Error('No note returned from update mutation');
  }

  return withFormattedCreatedBy(response.data.updateNote);
}

export async function deleteNote(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteNote: boolean }>({
    query: DELETE_NOTE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete note');
  }

  return response.data?.deleteNote || false;
}

export async function addNoteConversation(input: AddNoteConversationInput): Promise<NoteConversation> {
  const response = await crmGraphQLRequest<{ addNoteConversation: NoteConversation }>({
    query: ADD_NOTE_CONVERSATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add conversation');
  }

  if (!response.data?.addNoteConversation) {
    throw new Error('No conversation returned from add mutation');
  }

  return response.data.addNoteConversation;
}

export async function updateNoteConversation(input: UpdateNoteConversationInput): Promise<NoteConversation> {
  const response = await crmGraphQLRequest<{ updateNoteConversation: NoteConversation }>({
    query: UPDATE_NOTE_CONVERSATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update conversation');
  }

  if (!response.data?.updateNoteConversation) {
    throw new Error('No conversation returned from update mutation');
  }

  return response.data.updateNoteConversation;
}

export async function deleteNoteConversations(noteId: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteNoteConversations: boolean }>({
    query: DELETE_NOTE_CONVERSATIONS,
    variables: { noteId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete conversations');
  }

  return response.data?.deleteNoteConversations || false;
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskPriorityAPI = 'LOW' | 'NORMAL' | 'URGENT' | 'CRITICAL';
export type TaskStatusAPI = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskRelatedType = 'JOB' | 'CONTACT' | 'COMPANY';

// Entity types for tasksByEntity query
export type TaskEntityType = 'JOB' | 'CONTACT' | 'COMPANY' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK';

export interface CRMTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatusAPI;
  priority: TaskPriorityAPI;
  dueDate: string;
  tags: string;
  assignedToId: string;
  createdBy: string;
  createdAt: string;
}

// Task Landing Page for list view (from findLandingPages with sourceType: TASKS)
export interface TaskLandingPage {
  id: string;
  title: string;
  description: string;
  status: TaskStatusAPI;
  priority: TaskPriorityAPI;
  dueDate: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
}

// Task Conversation type
export interface TaskConversation {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskRelation {
  id: string;
  taskId: string;
  relatedType: TaskRelatedType;
  relatedId: string;
}

export interface CreateTaskInput {
  title: string;
  status: TaskStatusAPI;
  priority: TaskPriorityAPI;
  description?: string;
  dueDate?: string;
  tags?: string;
  assignedToId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  status?: TaskStatusAPI;
  priority?: TaskPriorityAPI;
  description?: string;
  dueDate?: string;
  tags?: string;
  assignedToId?: string;
}

export interface AddTaskRelationInput {
  taskId: string;
  relatedType: TaskRelatedType;
  relatedId: string;
}

export interface AddTaskConversationInput {
  taskId: string;
  content: string;
}

export interface UpdateTaskConversationInput {
  id: string;
  taskId: string;
  content: string;
}

// Task with relations for full display
export interface CRMTaskWithRelations extends CRMTask {
  relations?: TaskRelation[];
  relatedJobs?: Job[];
  relatedContacts?: Contact[];
  relatedCompanies?: Company[];
}

// Task returned by tasksByEntity query
export interface TaskByEntity {
  id: string;
  title: string;
  description: string;
  status: TaskStatusAPI;
  priority: TaskPriorityAPI;
  dueDate: string;
  reminderDate?: string;
  tags: string;
  assignedToId: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// Task GraphQL Queries and Mutations
// ============================================================================

const FIND_TASK_LANDING_PAGES = `
  query FindTaskLandingPages {
    findLandingPages(sourceType: TASKS) {
      records {
        ... on TaskLandingPage {
          id
          assignedTo
          createdAt
          createdBy
          description
          dueDate
          priority
          status
          title
        }
      }
      total
    }
  }
`;

const GET_TASK = `
  query GetTask($id: UUID!) {
    task(id: $id) {
      assignedToId
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
      status
      tags
      title
    }
  }
`;

const GET_TASK_CONVERSATIONS = `
  query GetTaskConversations($taskId: UUID!) {
    taskConversations(taskId: $taskId) {
      content
      createdAt
      taskId
      id
    }
  }
`;

const CREATE_TASK = `
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      assignedToId
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
      status
      tags
      title
    }
  }
`;

const UPDATE_TASK = `
  mutation UpdateTask($id: UUID!, $input: TaskInput!) {
    updateTask(id: $id, input: $input) {
      assignedToId
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
      status
      tags
      title
    }
  }
`;

const DELETE_TASK = `
  mutation DeleteTask($id: UUID!) {
    deleteTask(id: $id)
  }
`;

const ADD_TASK_CONVERSATION = `
  mutation AddTaskConversation($input: TaskConversationInput!) {
    addTaskConversation(input: $input) {
      content
      createdAt
      id
      taskId
    }
  }
`;

const UPDATE_TASK_CONVERSATION = `
  mutation UpdateTaskConversation($id: UUID!, $input: TaskConversationInput!) {
    updateTaskConversation(id: $id, input: $input) {
      content
      createdAt
      id
      taskId
    }
  }
`;

const ADD_TASK_RELATION = `
  mutation AddTaskRelation($input: TaskRelationInput!) {
    addTaskRelation(input: $input) {
      id
      taskId
      relatedType
      relatedId
    }
  }
`;

const GET_TASK_RELATIONS = `
  query GetTaskRelations($taskId: UUID!) {
    taskRelations(taskId: $taskId) {
      id
      taskId
      relatedType
      relatedId
    }
  }
`;

const DELETE_TASK_RELATION = `
  mutation DeleteTaskRelation($id: UUID!) {
    deleteTaskRelation(id: $id)
  }
`;

const GET_TASKS_BY_ENTITY = `
  query GetTasksByEntity($entityId: UUID!, $entityType: EntityType!) {
    tasksByEntity(entityId: $entityId, entityType: $entityType) {
      assignedToId
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

// ============================================================================
// Task API Functions
// ============================================================================

export async function fetchTaskLandingPages(): Promise<TaskLandingPage[]> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: TaskLandingPage[]; total: number }
  }>({
    query: FIND_TASK_LANDING_PAGES,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task landing pages');
  }

  return response.data?.findLandingPages?.records || [];
}

export async function fetchTask(id: string): Promise<CRMTask | null> {
  const response = await crmGraphQLRequest<{ task: CRMTask }>({
    query: GET_TASK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task');
  }

  const task = response.data?.task;
  return task ? withFormattedCreatedBy(task) : null;
}

export async function fetchTaskConversations(taskId: string): Promise<TaskConversation[]> {
  const response = await crmGraphQLRequest<{ taskConversations: TaskConversation[] }>({
    query: GET_TASK_CONVERSATIONS,
    variables: { taskId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task conversations');
  }

  return response.data?.taskConversations || [];
}

export async function createTask(input: CreateTaskInput): Promise<CRMTask> {
  const response = await crmGraphQLRequest<{ createTask: CRMTask }>({
    query: CREATE_TASK,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create task');
  }

  if (!response.data?.createTask) {
    throw new Error('No task returned from create mutation');
  }

  return withFormattedCreatedBy(response.data.createTask);
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<CRMTask> {
  const response = await crmGraphQLRequest<{ updateTask: CRMTask }>({
    query: UPDATE_TASK,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update task');
  }

  if (!response.data?.updateTask) {
    throw new Error('No task returned from update mutation');
  }

  return withFormattedCreatedBy(response.data.updateTask);
}

export async function deleteTask(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteTask: boolean }>({
    query: DELETE_TASK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete task');
  }

  return response.data?.deleteTask || false;
}

export async function addTaskConversation(input: AddTaskConversationInput): Promise<TaskConversation> {
  const response = await crmGraphQLRequest<{ addTaskConversation: TaskConversation }>({
    query: ADD_TASK_CONVERSATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add task conversation');
  }

  if (!response.data?.addTaskConversation) {
    throw new Error('No conversation returned from add mutation');
  }

  return response.data.addTaskConversation;
}

export async function updateTaskConversation(id: string, input: AddTaskConversationInput): Promise<TaskConversation> {
  const response = await crmGraphQLRequest<{ updateTaskConversation: TaskConversation }>({
    query: UPDATE_TASK_CONVERSATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update task conversation');
  }

  if (!response.data?.updateTaskConversation) {
    throw new Error('No conversation returned from update mutation');
  }

  return response.data.updateTaskConversation;
}

export async function addTaskRelation(input: AddTaskRelationInput): Promise<TaskRelation> {
  const response = await crmGraphQLRequest<{ addTaskRelation: TaskRelation }>({
    query: ADD_TASK_RELATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add task relation');
  }

  if (!response.data?.addTaskRelation) {
    throw new Error('No relation returned from add mutation');
  }

  return response.data.addTaskRelation;
}

export async function fetchTaskRelations(taskId: string): Promise<TaskRelation[]> {
  const response = await crmGraphQLRequest<{ taskRelations: TaskRelation[] }>({
    query: GET_TASK_RELATIONS,
    variables: { taskId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task relations');
  }

  return response.data?.taskRelations || [];
}

export async function deleteTaskRelation(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteTaskRelation: boolean }>({
    query: DELETE_TASK_RELATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete task relation');
  }

  return response.data?.deleteTaskRelation || false;
}

export async function fetchTasksByEntity(entityId: string, entityType: TaskEntityType): Promise<TaskByEntity[]> {
  const response = await crmGraphQLRequest<{ tasksByEntity: TaskByEntity[] }>({
    query: GET_TASKS_BY_ENTITY,
    variables: { entityId, entityType },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch tasks by entity');
  }

  return mapFormattedCreatedBy(response.data?.tasksByEntity);
}

