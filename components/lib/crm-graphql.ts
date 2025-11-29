/**
 * FlowCRM GraphQL Client
 * Complete GraphQL client for interacting with the CRM API
 */

import { getCRMAccessToken } from './crm-auth';
import { isTokenServerEnabled, tokenServerClient } from './crm-token-server';

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
  createdAt: string;
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
      createdBy
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
      createdBy
      createdAt
      additionalInformation
    }
  }
`;

const UPDATE_JOB = `
  mutation UpdateJob($id: UUID!, $input: UpdateJobInput!) {
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
      createdBy
      createdAt
      status {
        id
        name
      }
    }
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
      createdBy
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
      createdBy
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
      createdBy
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
      createdBy
      createdAt
    }
  }
`;

const UPDATE_COMPANY = `
  mutation UpdateCompany($id: UUID!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      name
      companySourceType
      parentCompanyId
      phone
      website
      tags
      createdBy
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
      createdBy
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
      createdBy
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
      createdBy
      createdAt
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
      createdBy
      createdAt
    }
  }
`;

const UPDATE_CONTACT = `
  mutation UpdateContact($id: UUID!, $input: UpdateContactInput!) {
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
      createdBy
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
        createdBy
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
      createdBy
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
      createdBy
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
      createdBy
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
      createdBy
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
        createdBy
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
      createdBy
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
        createdBy
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
      createdBy
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
 * Execute a GraphQL query/mutation against the CRM API
 * Automatically handles token refresh when using Token Server
 */
export async function crmGraphQLRequest<T = unknown>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  let authHeader: string;
  
  // Get authorization header based on current mode
  if (isTokenServerEnabled()) {
    try {
      authHeader = await tokenServerClient.getAuthorizationHeader();
    } catch (error) {
      throw new Error(
        `Token Server error: ${error instanceof Error ? error.message : 'Failed to get token'}`
      );
    }
  } else {
    const accessToken = getCRMAccessToken();
    if (!accessToken) {
      throw new Error('CRM access token not configured. Please set your tokens in FlowCRM Auth settings.');
    }
    authHeader = `Bearer ${accessToken}`;
  }

  const endpoint = getGraphQLEndpoint();

  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({
      query: options.query,
      variables: options.variables,
      operationName: options.operationName,
    }),
  });

  // If using Token Server and we get 401, try refreshing the token
  if (response.status === 401 && isTokenServerEnabled()) {
    try {
      authHeader = await tokenServerClient.getAuthorizationHeader(true); // Force refresh
      
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
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

  return response.data?.job || null;
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

  return response.data.createJob;
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

  return response.data.updateJob;
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

  return response.data?.companies || [];
}

export async function fetchCompany(id: string): Promise<Company | null> {
  const response = await crmGraphQLRequest<{ company: Company }>({
    query: GET_COMPANY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch company');
  }

  return response.data?.company || null;
}

export async function fetchCompaniesByJobId(jobId: string): Promise<Company[]> {
  const response = await crmGraphQLRequest<{ companiesByJobId: Company[] }>({
    query: GET_COMPANIES_BY_JOB_ID,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch companies by job');
  }

  return response.data?.companiesByJobId || [];
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

  return response.data.createCompany;
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

  return response.data.updateCompany;
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
  return preOpp ? normalizePreOpportunityStatus(preOpp) : null;
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

  return response.data?.jobSearch || [];
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

  return response.data.createPreOpportunity;
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

  return response.data.updatePreOpportunity;
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

