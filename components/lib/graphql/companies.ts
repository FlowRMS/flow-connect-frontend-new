/**
 * Companies GraphQL Module
 * GraphQL queries and API functions for Companies
 */

import { crmGraphQLRequest, mapFormattedCreatedBy, withFormattedCreatedBy } from './client';
import type {
  Company,
  CompanyInput,
  UpdateCompanyInput,
  CompanyLandingPage,
  LandingPageFilter,
  LandingPageOrderBy,
  PaginationParams,
  PaginatedResult,
} from './types';

// Re-export types
export type { Company, CompanyInput, UpdateCompanyInput, CompanyLandingPage, CompanySourceType } from './types';

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_COMPANIES = `
  query GetCompanies {
    companies {
      id
      name
      companyTypeId
      companyType {
        id
        name
      }
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
      companyTypeId
      companyType {
        id
        name
      }
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
      companyTypeId
      companyType {
        id
        name
      }
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
      companyTypeId
      companyType {
        id
        name
      }
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
      companyTypeId
      companyType {
        id
        name
      }
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

const FIND_COMPANY_LANDING_PAGES = `
  query FindCompanyLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
      sourceType: COMPANIES
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
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
          tags
        }
      }
      total
    }
  }
`;

// ============================================================================
// API Functions
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
  orderBy?: LandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedResult<CompanyLandingPage>> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: CompanyLandingPage[]; total: number }
  }>({
    query: FIND_COMPANY_LANDING_PAGES,
    variables: { filters, orderBy, limit: pagination?.limit, offset: pagination?.offset },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch company landing pages');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}
